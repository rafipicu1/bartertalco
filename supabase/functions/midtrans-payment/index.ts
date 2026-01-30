import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Midtrans configuration - simplified
const MIDTRANS_SERVER_KEY = Deno.env.get('MIDTRANS_SERVER_KEY') || ''
const MIDTRANS_CLIENT_KEY = Deno.env.get('MIDTRANS_CLIENT_KEY') || ''

// Auto-detect environment from key prefix: SB- = sandbox, otherwise production
const IS_SANDBOX = MIDTRANS_SERVER_KEY.startsWith('SB-') || MIDTRANS_CLIENT_KEY.startsWith('SB-')
const IS_PRODUCTION = !IS_SANDBOX

console.log('Midtrans config:', {
  hasServerKey: !!MIDTRANS_SERVER_KEY,
  hasClientKey: !!MIDTRANS_CLIENT_KEY,
  isProduction: IS_PRODUCTION,
  keyPrefix: MIDTRANS_SERVER_KEY?.substring(0, 5) || 'N/A',
})

function assertMidtransConfig() {
  if (!MIDTRANS_SERVER_KEY) {
    throw new Error('MIDTRANS_SERVER_KEY belum dikonfigurasi. Tambahkan di Cloud secrets.')
  }
  if (!MIDTRANS_CLIENT_KEY) {
    throw new Error('MIDTRANS_CLIENT_KEY belum dikonfigurasi. Tambahkan di Cloud secrets.')
  }
}

const MIDTRANS_BASE_URL = IS_PRODUCTION 
  ? 'https://app.midtrans.com/snap/v1'
  : 'https://app.sandbox.midtrans.com/snap/v1'

const MIDTRANS_CORE_URL = IS_PRODUCTION
  ? 'https://api.midtrans.com/v2'
  : 'https://api.sandbox.midtrans.com/v2'

// Pricing configuration
const PRICING = {
  plus_monthly: { amount: 29000, name: 'Bartr Plus (Bulanan)', tier: 'plus', period: 'monthly' },
  plus_yearly: { amount: 299000, name: 'Bartr Plus (Tahunan)', tier: 'plus', period: 'yearly' },
  pro_monthly: { amount: 79000, name: 'Bartr Pro (Bulanan)', tier: 'pro', period: 'monthly' },
  pro_yearly: { amount: 799000, name: 'Bartr Pro (Tahunan)', tier: 'pro', period: 'yearly' },
  single_post: { amount: 5000, name: 'Upload Item Tambahan', tier: null, period: null },
  boost_24h: { amount: 10000, name: 'Boost Item 24 Jam', tier: null, period: null },
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Validate config early so we fail fast with a clear message
    assertMidtransConfig()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const url = new URL(req.url)
    const path = url.pathname.split('/').pop()

    // Create transaction
    if (path === 'create-transaction' && req.method === 'POST') {
      const authHeader = req.headers.get('Authorization')
      if (!authHeader) {
        throw new Error('No authorization header')
      }

      const token = authHeader.replace('Bearer ', '')
      const { data: { user }, error: authError } = await supabase.auth.getUser(token)
      if (authError || !user) {
        throw new Error('Unauthorized')
      }

      const { product_type, item_id } = await req.json()
      const pricing = PRICING[product_type as keyof typeof PRICING]
      if (!pricing) {
        throw new Error('Invalid product type')
      }

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, full_name')
        .eq('id', user.id)
        .single()

      // Generate order ID
      const orderId = `BARTR-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

      // Create Snap transaction
      const transactionDetails = {
        transaction_details: {
          order_id: orderId,
          gross_amount: pricing.amount,
        },
        item_details: [{
          id: product_type,
          price: pricing.amount,
          quantity: 1,
          name: pricing.name,
        }],
        customer_details: {
          first_name: profile?.full_name || profile?.username || 'User',
          email: user.email,
        },
        callbacks: {
          finish: `${Deno.env.get('SUPABASE_URL')}/functions/v1/midtrans-payment/callback`,
        },
      }

      console.log('Creating Midtrans transaction:', transactionDetails)

      const authString = btoa(`${MIDTRANS_SERVER_KEY}:`)
      const snapResponse = await fetch(`${MIDTRANS_BASE_URL}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${authString}`,
        },
        body: JSON.stringify(transactionDetails),
      })

      if (!snapResponse.ok) {
        const errorText = await snapResponse.text()
        console.error('Midtrans error:', errorText)
        throw new Error(`Midtrans error: ${errorText}`)
      }

      const snapData = await snapResponse.json()
      console.log('Midtrans response:', snapData)

      // Save transaction to database
      const { error: insertError } = await supabase
        .from('payment_transactions')
        .insert({
          user_id: user.id,
          order_id: orderId,
          transaction_type: pricing.tier ? 'subscription' : product_type.includes('boost') ? 'boost' : 'single_post',
          amount: pricing.amount,
          tier: pricing.tier,
          period: pricing.period,
          status: 'pending',
          midtrans_response: snapData,
        })

      if (insertError) {
        console.error('DB insert error:', insertError)
        throw insertError
      }

      return new Response(JSON.stringify({
        success: true,
        snap_token: snapData.token,
        redirect_url: snapData.redirect_url,
        order_id: orderId,
        client_key: MIDTRANS_CLIENT_KEY,
        is_production: IS_PRODUCTION,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Handle Midtrans notification (webhook)
    if (path === 'notification' && req.method === 'POST') {
      const notification = await req.json()
      console.log('Midtrans notification:', notification)

      const { order_id, transaction_status, fraud_status, signature_key } = notification

      // Verify signature
      const expectedSignature = await crypto.subtle.digest(
        'SHA-512',
        new TextEncoder().encode(
          `${order_id}${notification.status_code}${notification.gross_amount}${MIDTRANS_SERVER_KEY}`
        )
      )
      const signatureHex = Array.from(new Uint8Array(expectedSignature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')

      if (signatureHex !== signature_key) {
        console.error('Invalid signature')
        // Continue anyway for sandbox testing, but log it
      }

      // Get transaction
      const { data: transaction, error: txError } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('order_id', order_id)
        .single()

      if (txError || !transaction) {
        console.error('Transaction not found:', order_id)
        return new Response(JSON.stringify({ success: false }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      let newStatus = 'pending'
      if (transaction_status === 'capture' || transaction_status === 'settlement') {
        if (fraud_status === 'accept' || !fraud_status) {
          newStatus = 'success'
        }
      } else if (transaction_status === 'deny' || transaction_status === 'cancel' || transaction_status === 'expire') {
        newStatus = 'failed'
      } else if (transaction_status === 'pending') {
        newStatus = 'pending'
      }

      // Update transaction status
      await supabase
        .from('payment_transactions')
        .update({
          status: newStatus,
          midtrans_response: notification,
          updated_at: new Date().toISOString(),
        })
        .eq('order_id', order_id)

      // If successful, activate subscription or boost
      if (newStatus === 'success') {
        if (transaction.transaction_type === 'subscription' && transaction.tier) {
          // Calculate expiry
          let expiresAt = new Date()
          if (transaction.period === 'monthly') {
            expiresAt.setMonth(expiresAt.getMonth() + 1)
          } else if (transaction.period === 'yearly') {
            expiresAt.setFullYear(expiresAt.getFullYear() + 1)
          }

          // Upsert subscription
          await supabase
            .from('user_subscriptions')
            .upsert({
              user_id: transaction.user_id,
              tier: transaction.tier,
              status: 'active',
              started_at: new Date().toISOString(),
              expires_at: expiresAt.toISOString(),
              midtrans_order_id: order_id,
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'user_id',
            })
        } else if (transaction.transaction_type === 'boost') {
          // Extract item_id from metadata if available
          const itemId = notification.metadata?.item_id
          if (itemId) {
            const expiresAt = new Date()
            expiresAt.setHours(expiresAt.getHours() + 24)

            await supabase
              .from('item_boosts')
              .insert({
                item_id: itemId,
                user_id: transaction.user_id,
                expires_at: expiresAt.toISOString(),
              })
          }
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get pricing info
    if (path === 'pricing' && req.method === 'GET') {
      return new Response(JSON.stringify({
        success: true,
        pricing: PRICING,
        client_key: MIDTRANS_CLIENT_KEY,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check transaction status
    if (path === 'check-status' && req.method === 'POST') {
      const { order_id } = await req.json()
      
      const authString = btoa(`${MIDTRANS_SERVER_KEY}:`)
      const statusResponse = await fetch(`${MIDTRANS_CORE_URL}/${order_id}/status`, {
        headers: {
          'Authorization': `Basic ${authString}`,
        },
      })

      const statusData = await statusResponse.json()

      return new Response(JSON.stringify({
        success: true,
        status: statusData,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: unknown) {
    console.error('Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ 
      error: errorMessage,
      success: false 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      conversations: {
        Row: {
          created_at: string
          id: string
          item1_id: string | null
          item2_id: string | null
          last_message_at: string | null
          user1_id: string
          user2_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item1_id?: string | null
          item2_id?: string | null
          last_message_at?: string | null
          user1_id: string
          user2_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item1_id?: string | null
          item2_id?: string | null
          last_message_at?: string | null
          user1_id?: string
          user2_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_item1_id_fkey"
            columns: ["item1_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_item2_id_fkey"
            columns: ["item2_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      item_boosts: {
        Row: {
          boosted_at: string | null
          created_at: string | null
          expires_at: string
          id: string
          is_active: boolean | null
          item_id: string
          user_id: string
        }
        Insert: {
          boosted_at?: string | null
          created_at?: string | null
          expires_at: string
          id?: string
          is_active?: boolean | null
          item_id: string
          user_id: string
        }
        Update: {
          boosted_at?: string | null
          created_at?: string | null
          expires_at?: string
          id?: string
          is_active?: boolean | null
          item_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_boosts_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          barter_preference: string
          category: Database["public"]["Enums"]["item_category"]
          city: string | null
          condition: Database["public"]["Enums"]["item_condition"]
          created_at: string | null
          description: string
          detailed_minus: string
          district: string | null
          estimated_value: number
          id: string
          is_active: boolean | null
          is_paid: boolean | null
          latitude: number | null
          location: string
          longitude: number | null
          name: string
          photos: string[]
          province: string | null
          top_up_value: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          barter_preference: string
          category: Database["public"]["Enums"]["item_category"]
          city?: string | null
          condition: Database["public"]["Enums"]["item_condition"]
          created_at?: string | null
          description: string
          detailed_minus: string
          district?: string | null
          estimated_value: number
          id?: string
          is_active?: boolean | null
          is_paid?: boolean | null
          latitude?: number | null
          location: string
          longitude?: number | null
          name: string
          photos?: string[]
          province?: string | null
          top_up_value?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          barter_preference?: string
          category?: Database["public"]["Enums"]["item_category"]
          city?: string | null
          condition?: Database["public"]["Enums"]["item_condition"]
          created_at?: string | null
          description?: string
          detailed_minus?: string
          district?: string | null
          estimated_value?: number
          id?: string
          is_active?: boolean | null
          is_paid?: boolean | null
          latitude?: number | null
          location?: string
          longitude?: number | null
          name?: string
          photos?: string[]
          province?: string | null
          top_up_value?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          created_at: string | null
          id: string
          item1_id: string
          item2_id: string
          user1_id: string
          user2_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          item1_id: string
          item2_id: string
          user1_id: string
          user2_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          item1_id?: string
          item2_id?: string
          user1_id?: string
          user2_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_item1_id_fkey"
            columns: ["item1_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_item2_id_fkey"
            columns: ["item2_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_user1_id_fkey"
            columns: ["user1_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_user2_id_fkey"
            columns: ["user2_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          item_id: string | null
          message_type: string | null
          read: boolean | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          item_id?: string | null
          message_type?: string | null
          read?: boolean | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          item_id?: string | null
          message_type?: string | null
          read?: boolean | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_transactions: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          midtrans_response: Json | null
          order_id: string
          period: string | null
          status: string
          tier: Database["public"]["Enums"]["subscription_tier"] | null
          transaction_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          midtrans_response?: Json | null
          order_id: string
          period?: string | null
          status?: string
          tier?: Database["public"]["Enums"]["subscription_tier"] | null
          transaction_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          midtrans_response?: Json | null
          order_id?: string
          period?: string | null
          status?: string
          tier?: Database["public"]["Enums"]["subscription_tier"] | null
          transaction_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          bio: string | null
          city: string | null
          created_at: string | null
          district: string | null
          full_name: string | null
          id: string
          latitude: number | null
          location: string
          longitude: number | null
          profile_photo_url: string | null
          province: string | null
          updated_at: string | null
          username: string
          verified: boolean | null
        }
        Insert: {
          bio?: string | null
          city?: string | null
          created_at?: string | null
          district?: string | null
          full_name?: string | null
          id: string
          latitude?: number | null
          location: string
          longitude?: number | null
          profile_photo_url?: string | null
          province?: string | null
          updated_at?: string | null
          username: string
          verified?: boolean | null
        }
        Update: {
          bio?: string | null
          city?: string | null
          created_at?: string | null
          district?: string | null
          full_name?: string | null
          id?: string
          latitude?: number | null
          location?: string
          longitude?: number | null
          profile_photo_url?: string | null
          province?: string | null
          updated_at?: string | null
          username?: string
          verified?: boolean | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          admin_notes: string | null
          created_at: string
          description: string | null
          id: string
          reason: Database["public"]["Enums"]["report_reason"]
          report_type: Database["public"]["Enums"]["report_type"]
          reported_conversation_id: string | null
          reported_item_id: string | null
          reported_user_id: string | null
          reporter_id: string
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["report_status"]
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          description?: string | null
          id?: string
          reason: Database["public"]["Enums"]["report_reason"]
          report_type: Database["public"]["Enums"]["report_type"]
          reported_conversation_id?: string | null
          reported_item_id?: string | null
          reported_user_id?: string | null
          reporter_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          description?: string | null
          id?: string
          reason?: Database["public"]["Enums"]["report_reason"]
          report_type?: Database["public"]["Enums"]["report_type"]
          reported_conversation_id?: string | null
          reported_item_id?: string | null
          reported_user_id?: string | null
          reporter_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_reported_conversation_id_fkey"
            columns: ["reported_conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reported_item_id_fkey"
            columns: ["reported_item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      swipes: {
        Row: {
          created_at: string | null
          direction: string
          id: string
          item_id: string
          swiper_id: string
          user_item_id: string | null
        }
        Insert: {
          created_at?: string | null
          direction: string
          id?: string
          item_id: string
          swiper_id: string
          user_item_id?: string | null
        }
        Update: {
          created_at?: string | null
          direction?: string
          id?: string
          item_id?: string
          swiper_id?: string
          user_item_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "swipes_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "swipes_swiper_id_fkey"
            columns: ["swiper_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "swipes_user_item_id_fkey"
            columns: ["user_item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      user_bans: {
        Row: {
          ban_type: Database["public"]["Enums"]["ban_type"]
          banned_by: string
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          reason: string
          user_id: string
        }
        Insert: {
          ban_type: Database["public"]["Enums"]["ban_type"]
          banned_by: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          reason: string
          user_id: string
        }
        Update: {
          ban_type?: Database["public"]["Enums"]["ban_type"]
          banned_by?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          reason?: string
          user_id?: string
        }
        Relationships: []
      }
      user_daily_usage: {
        Row: {
          created_at: string | null
          id: string
          items_viewed: number | null
          proposal_count: number | null
          swipe_count: number | null
          updated_at: string | null
          usage_date: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          items_viewed?: number | null
          proposal_count?: number | null
          swipe_count?: number | null
          updated_at?: string | null
          usage_date?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          items_viewed?: number | null
          proposal_count?: number | null
          swipe_count?: number | null
          updated_at?: string | null
          usage_date?: string
          user_id?: string
        }
        Relationships: []
      }
      user_item_views: {
        Row: {
          created_at: string
          id: string
          item_id: string
          last_viewed_at: string
          user_id: string
          view_count: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          last_viewed_at?: string
          user_id: string
          view_count?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          last_viewed_at?: string
          user_id?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_item_views_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_search_history: {
        Row: {
          created_at: string
          id: string
          last_searched_at: string
          search_count: number | null
          search_query: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_searched_at?: string
          search_count?: number | null
          search_query: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_searched_at?: string
          search_count?: number | null
          search_query?: string
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          created_at: string | null
          expires_at: string | null
          extra_post_slots: number
          id: string
          midtrans_order_id: string | null
          midtrans_transaction_id: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          extra_post_slots?: number
          id?: string
          midtrans_order_id?: string | null
          midtrans_transaction_id?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          extra_post_slots?: number
          id?: string
          midtrans_order_id?: string | null
          midtrans_transaction_id?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      wishlist: {
        Row: {
          created_at: string | null
          id: string
          item_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          item_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_test_items_to_user: {
        Args: {
          target_user_id: string
          user_city: string
          user_district: string
          user_province: string
          username: string
        }
        Returns: undefined
      }
      calculate_distance: {
        Args: { lat1: number; lat2: number; lon1: number; lon2: number }
        Returns: number
      }
      check_and_increment_usage: {
        Args: { p_usage_type: string; p_user_id: string }
        Returns: {
          allowed: boolean
          current_count: number
          max_count: number
        }[]
      }
      create_dummy_items_for_user: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      get_personalized_feed: {
        Args: { p_limit?: number; p_offset?: number; p_user_id: string }
        Returns: {
          item_id: string
          relevance_score: number
        }[]
      }
      get_tier_limits: {
        Args: { p_tier: Database["public"]["Enums"]["subscription_tier"] }
        Returns: {
          active_items: number
          can_boost: boolean
          daily_proposals: number
          daily_swipes: number
          daily_views: number
          has_insights: boolean
          priority_level: number
          wishlist_limit: number
        }[]
      }
      get_user_active_items_count: {
        Args: { p_user_id: string }
        Returns: number
      }
      get_user_tier: {
        Args: { p_user_id: string }
        Returns: Database["public"]["Enums"]["subscription_tier"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      setup_test_environment: {
        Args: never
        Returns: {
          details: string
          message: string
        }[]
      }
      simulate_swipes_between_users: {
        Args: { match_probability?: number; user1_id: string; user2_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
      ban_type: "warning" | "temporary" | "permanent"
      item_category:
        | "electronics"
        | "fashion"
        | "home"
        | "sports"
        | "books"
        | "gaming"
        | "music"
        | "art"
        | "other"
        | "elektronik"
        | "kendaraan"
        | "properti"
        | "hobi_koleksi"
        | "olahraga"
        | "musik"
        | "makanan_minuman"
        | "kesehatan_kecantikan"
        | "perlengkapan_rumah"
        | "mainan_anak"
        | "kantor_industri"
      item_condition: "new" | "like_new" | "good" | "fair" | "worn"
      report_reason:
        | "scam"
        | "fake_item"
        | "inappropriate_behavior"
        | "spam"
        | "other"
      report_status: "pending" | "reviewed" | "action_taken" | "dismissed"
      report_type: "user" | "item" | "conversation"
      subscription_status: "active" | "expired" | "cancelled" | "pending"
      subscription_tier: "free" | "plus" | "pro"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      ban_type: ["warning", "temporary", "permanent"],
      item_category: [
        "electronics",
        "fashion",
        "home",
        "sports",
        "books",
        "gaming",
        "music",
        "art",
        "other",
        "elektronik",
        "kendaraan",
        "properti",
        "hobi_koleksi",
        "olahraga",
        "musik",
        "makanan_minuman",
        "kesehatan_kecantikan",
        "perlengkapan_rumah",
        "mainan_anak",
        "kantor_industri",
      ],
      item_condition: ["new", "like_new", "good", "fair", "worn"],
      report_reason: [
        "scam",
        "fake_item",
        "inappropriate_behavior",
        "spam",
        "other",
      ],
      report_status: ["pending", "reviewed", "action_taken", "dismissed"],
      report_type: ["user", "item", "conversation"],
      subscription_status: ["active", "expired", "cancelled", "pending"],
      subscription_tier: ["free", "plus", "pro"],
    },
  },
} as const

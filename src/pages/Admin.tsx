import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Users,
  Package,
  AlertTriangle,
  Shield,
  Search,
  Eye,
  Ban,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Loader2,
  FileText,
  UserPlus,
  Crown,
  Trash2,
  LayoutDashboard,
  CreditCard,
  Receipt,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow, format } from 'date-fns';
import { id } from 'date-fns/locale';
import { UserDetailDialog } from '@/components/admin/UserDetailDialog';
import { ItemDetailDialog } from '@/components/admin/ItemDetailDialog';
import { MobileLayout } from '@/components/MobileLayout';
import { PageHeader } from '@/components/PageHeader';

interface Report {
  id: string;
  reporter_id: string;
  report_type: string;
  reported_user_id: string | null;
  reported_item_id: string | null;
  reported_conversation_id: string | null;
  reason: string;
  description: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

interface UserProfile {
  id: string;
  username: string;
  full_name: string | null;
  profile_photo_url: string | null;
  location: string;
  created_at: string;
  verified: boolean;
  province?: string | null;
  city?: string | null;
  district?: string | null;
  bio?: string | null;
}

interface Item {
  id: string;
  name: string;
  description: string;
  detailed_minus: string;
  photos: string[];
  estimated_value: number;
  top_up_value: number | null;
  category: string;
  condition: string;
  location: string;
  province: string | null;
  city: string | null;
  district: string | null;
  is_active: boolean;
  created_at: string;
  user_id: string;
  barter_preference: string;
  profiles?: {
    username: string;
    full_name?: string;
  };
}

interface Subscription {
  id: string;
  user_id: string;
  tier: string;
  status: string;
  expires_at: string | null;
  extra_post_slots: number;
  extra_proposal_slots: number | null;
  extra_swipe_slots: number | null;
  created_at: string;
  profiles?: {
    username: string;
    full_name?: string;
  };
}

interface Transaction {
  id: string;
  user_id: string;
  order_id: string;
  transaction_type: string;
  amount: number;
  status: string;
  tier: string | null;
  period: string | null;
  created_at: string;
  profiles?: {
    username: string;
  };
}

interface UserRole {
  id: string;
  user_id: string;
  role: string;
  profiles?: {
    username: string;
    full_name?: string;
    profile_photo_url?: string;
  };
}

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Reports state
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [processingReport, setProcessingReport] = useState(false);
  
  // Users state
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [banReason, setBanReason] = useState('');
  const [banType, setBanType] = useState<'warning' | 'temporary' | 'permanent'>('warning');
  const [processingBan, setProcessingBan] = useState(false);
  
  // Items state
  const [items, setItems] = useState<Item[]>([]);
  const [itemSearch, setItemSearch] = useState('');
  const [viewingItem, setViewingItem] = useState<Item | null>(null);

  // User detail view state
  const [viewingUser, setViewingUser] = useState<UserProfile | null>(null);
  
  // Admin management state
  const [admins, setAdmins] = useState<UserRole[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [processingAdmin, setProcessingAdmin] = useState(false);

  // User upgrade state
  const [upgradeUser, setUpgradeUser] = useState<UserProfile | null>(null);
  const [selectedTier, setSelectedTier] = useState<'free' | 'plus' | 'pro'>('plus');
  const [processingUpgrade, setProcessingUpgrade] = useState(false);

  // Create user state
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserFullName, setNewUserFullName] = useState('');
  const [processingCreateUser, setProcessingCreateUser] = useState(false);

  // Subscription & Transaction state
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);

  useEffect(() => {
    checkAdminRole();
  }, [user]);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin, activeTab]);

  const checkAdminRole = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();

      if (error || !data) {
        toast.error('Akses ditolak. Anda bukan admin.');
        navigate('/');
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      console.error('Error checking admin role:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    switch (activeTab) {
      case 'dashboard':
        await Promise.all([fetchReports(), fetchUsers(), fetchItems(), fetchSubscriptions(), fetchTransactions()]);
        break;
      case 'subscriptions':
        await fetchSubscriptions();
        break;
      case 'transactions':
        await fetchTransactions();
        break;
      case 'users':
        await Promise.all([fetchUsers(), fetchUserRoles()]);
        break;
      case 'reports':
        await fetchReports();
        break;
      case 'items':
        await fetchItems();
        break;
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      
      // Fetch profiles separately
      const subsWithProfiles = await Promise.all(
        (data || []).map(async (sub) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, full_name')
            .eq('id', sub.user_id)
            .single();
          return { ...sub, profiles: profile };
        })
      );
      
      setSubscriptions(subsWithProfiles);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      
      // Fetch profiles separately for each transaction
      const transactionsWithProfiles = await Promise.all(
        (data || []).map(async (tx) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', tx.user_id)
            .single();
          return { ...tx, profiles: profile };
        })
      );
      
      setTransactions(transactionsWithProfiles);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const fetchUserRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*');

      if (error) throw error;
      
      // Fetch profiles separately
      const rolesWithProfiles = await Promise.all(
        (data || []).map(async (role) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, full_name, profile_photo_url')
            .eq('id', role.user_id)
            .single();
          return { ...role, profiles: profile };
        })
      );
      
      setUserRoles(rolesWithProfiles);
    } catch (error) {
      console.error('Error fetching user roles:', error);
    }
  };

  const fetchAdmins = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('role', 'admin');

      if (error) throw error;
      
      // Fetch profiles separately
      const adminsWithProfiles = await Promise.all(
        (data || []).map(async (admin) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, full_name, profile_photo_url')
            .eq('id', admin.user_id)
            .single();
          return { ...admin, profiles: profile };
        })
      );
      setAdmins(adminsWithProfiles);
    } catch (error) {
      console.error('Error fetching admins:', error);
    }
  };

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from('items')
        .select(`
          *,
          profiles (username, full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

  const handleReportAction = async (action: 'reviewed' | 'action_taken' | 'dismissed') => {
    if (!selectedReport || !user) return;

    setProcessingReport(true);
    try {
      const { error } = await supabase
        .from('reports')
        .update({
          status: action,
          admin_notes: adminNotes || null,
          resolved_at: new Date().toISOString(),
          resolved_by: user.id,
        })
        .eq('id', selectedReport.id);

      if (error) throw error;

      toast.success('Laporan berhasil diproses');
      setSelectedReport(null);
      setAdminNotes('');
      fetchReports();
    } catch (error) {
      console.error('Error processing report:', error);
      toast.error('Gagal memproses laporan');
    } finally {
      setProcessingReport(false);
    }
  };

  const handleBanUser = async () => {
    if (!selectedUser || !user || !banReason) return;

    setProcessingBan(true);
    try {
      const { error } = await supabase
        .from('user_bans')
        .insert({
          user_id: selectedUser.id,
          ban_type: banType,
          reason: banReason,
          banned_by: user.id,
          expires_at: banType === 'temporary' 
            ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() 
            : null,
        });

      if (error) throw error;

      toast.success(`${banType === 'warning' ? 'Peringatan' : 'Ban'} berhasil diberikan`);
      setSelectedUser(null);
      setBanReason('');
      setBanType('warning');
    } catch (error) {
      console.error('Error banning user:', error);
      toast.error('Gagal memproses ban');
    } finally {
      setProcessingBan(false);
    }
  };

  const toggleItemActive = async (itemId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('items')
        .update({ is_active: !currentStatus })
        .eq('id', itemId);

      if (error) throw error;
      toast.success(currentStatus ? 'Barang dinonaktifkan' : 'Barang diaktifkan');
      fetchItems();
    } catch (error) {
      console.error('Error toggling item:', error);
      toast.error('Gagal mengubah status barang');
    }
  };

  const handleAddAdmin = async () => {
    if (!newAdminEmail || !newAdminPassword) {
      toast.error('Email dan password wajib diisi');
      return;
    }

    setProcessingAdmin(true);
    try {
      const response = await supabase.functions.invoke('seed-test-users', {
        body: { 
          action: 'create_admin',
          email: newAdminEmail,
          password: newAdminPassword,
        },
      });

      if (response.error) throw response.error;

      toast.success('Admin baru berhasil ditambahkan!');
      setNewAdminEmail('');
      setNewAdminPassword('');
      setShowAddAdmin(false);
      fetchAdmins();
    } catch (error: any) {
      console.error('Error creating admin:', error);
      toast.error(error.message || 'Gagal membuat admin');
    } finally {
      setProcessingAdmin(false);
    }
  };

  const handleRemoveAdmin = async (roleId: string, userId: string) => {
    if (userId === user?.id) {
      toast.error('Tidak bisa menghapus diri sendiri');
      return;
    }

    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;
      toast.success('Admin berhasil dihapus');
      fetchUserRoles();
    } catch (error) {
      console.error('Error removing admin:', error);
      toast.error('Gagal menghapus admin');
    }
  };

  const handleMakeAdmin = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: 'admin',
        });

      if (error) throw error;
      toast.success('User berhasil dijadikan admin');
      fetchUserRoles();
    } catch (error: any) {
      console.error('Error making admin:', error);
      toast.error(error.message || 'Gagal menjadikan admin');
    }
  };

  const handleUpgradeUser = async () => {
    if (!upgradeUser) return;

    setProcessingUpgrade(true);
    try {
      const response = await supabase.functions.invoke('seed-test-users', {
        body: { 
          action: 'upgrade_user',
          user_id: upgradeUser.id,
          tier: selectedTier,
        },
      });

      if (response.error) throw response.error;

      toast.success(`User @${upgradeUser.username} berhasil diupgrade ke ${selectedTier.toUpperCase()}!`);
      setUpgradeUser(null);
      setSelectedTier('plus');
      fetchSubscriptions();
    } catch (error: any) {
      console.error('Error upgrading user:', error);
      toast.error(error.message || 'Gagal upgrade user');
    } finally {
      setProcessingUpgrade(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUserEmail || !newUserPassword || !newUserUsername) {
      toast.error('Email, password, dan username wajib diisi');
      return;
    }

    setProcessingCreateUser(true);
    try {
      const response = await supabase.functions.invoke('seed-test-users', {
        body: { 
          action: 'create_user',
          email: newUserEmail,
          password: newUserPassword,
          username: newUserUsername,
          full_name: newUserFullName || newUserUsername,
        },
      });

      if (response.error) throw response.error;

      toast.success('User baru berhasil dibuat!');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserUsername('');
      setNewUserFullName('');
      setShowCreateUser(false);
      fetchUsers();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error(error.message || 'Gagal membuat user');
    } finally {
      setProcessingCreateUser(false);
    }
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'reviewed':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Ditinjau</Badge>;
      case 'action_taken':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Aksi Diambil</Badge>;
      case 'dismissed':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Ditolak</Badge>;
      case 'settlement':
      case 'capture':
        return <Badge className="bg-green-500">Sukses</Badge>;
      case 'expire':
      case 'cancel':
        return <Badge variant="destructive">Gagal</Badge>;
      case 'active':
        return <Badge className="bg-green-500">Aktif</Badge>;
      case 'expired':
        return <Badge variant="secondary">Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getReasonLabel = (reason: string) => {
    switch (reason) {
      case 'scam': return 'Penipuan';
      case 'fake_item': return 'Barang Palsu';
      case 'inappropriate_behavior': return 'Perilaku Tidak Pantas';
      case 'spam': return 'Spam';
      case 'other': return 'Lainnya';
      default: return reason;
    }
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'pro':
        return <Badge className="bg-purple-500">PRO</Badge>;
      case 'plus':
        return <Badge className="bg-blue-500">PLUS</Badge>;
      default:
        return <Badge variant="secondary">FREE</Badge>;
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'subscription': return 'Langganan';
      case 'single_post': return 'Beli Slot Post';
      case 'single_chat': return 'Beli Slot Chat';
      case 'single_swipe': return 'Beli Slot Swipe';
      default: return type;
    }
  };

  const getUserRole = (userId: string) => {
    const role = userRoles.find(r => r.user_id === userId);
    return role?.role || 'user';
  };

  if (loading) {
    return (
      <MobileLayout>
        <PageHeader title="Admin Panel" icon={<Shield className="h-5 w-5" />} onBack={() => navigate('/')} />
        <div className="flex-1 flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MobileLayout>
    );
  }

  if (!isAdmin) return null;

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(itemSearch.toLowerCase())
  );

  // Stats calculations
  const totalRevenue = transactions
    .filter(t => t.status === 'settlement' || t.status === 'capture')
    .reduce((sum, t) => sum + t.amount, 0);
  const activeSubscriptions = subscriptions.filter(s => s.status === 'active' && s.tier !== 'free').length;
  const pendingReports = reports.filter(r => r.status === 'pending').length;

  return (
    <MobileLayout>
      <div className="min-h-screen bg-background">
        <PageHeader 
          title="Admin Panel" 
          icon={<Shield className="h-5 w-5" />}
          onBack={() => navigate('/')}
        />

        <main className="container mx-auto px-4 py-6">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 mb-6 h-auto">
            <TabsTrigger value="dashboard" className="gap-1 text-xs sm:text-sm py-2">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="gap-1 text-xs sm:text-sm py-2">
              <Crown className="h-4 w-4" />
              <span className="hidden sm:inline">Subs</span>
            </TabsTrigger>
            <TabsTrigger value="transactions" className="gap-1 text-xs sm:text-sm py-2">
              <Receipt className="h-4 w-4" />
              <span className="hidden sm:inline">Transaksi</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-1 text-xs sm:text-sm py-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-1 text-xs sm:text-sm py-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden sm:inline">Laporan</span>
            </TabsTrigger>
            <TabsTrigger value="items" className="gap-1 text-xs sm:text-sm py-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Barang</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard">
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="text-lg sm:text-2xl font-bold">{formatPrice(totalRevenue)}</p>
                        <p className="text-xs text-muted-foreground">Total Pendapatan</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <Crown className="h-5 w-5 text-yellow-500" />
                      <div>
                        <p className="text-2xl font-bold">{activeSubscriptions}</p>
                        <p className="text-xs text-muted-foreground">Langganan Aktif</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="text-2xl font-bold">{users.length}</p>
                        <p className="text-xs text-muted-foreground">Total Users</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      <div>
                        <p className="text-2xl font-bold">{pendingReports}</p>
                        <p className="text-xs text-muted-foreground">Laporan Pending</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Transactions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    Transaksi Terbaru
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {transactions.slice(0, 5).map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">@{tx.profiles?.username || 'Unknown'}</p>
                            <p className="text-xs text-muted-foreground">{getTransactionTypeLabel(tx.transaction_type)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-primary">{formatPrice(tx.amount)}</p>
                          {getStatusBadge(tx.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Daftar Langganan</h3>
                <Badge variant="outline">{subscriptions.length} total</Badge>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Extra Slots</TableHead>
                      <TableHead>Expires</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscriptions.map((sub) => (
                      <TableRow key={sub.id}>
                        <TableCell className="font-medium">@{sub.profiles?.username || 'Unknown'}</TableCell>
                        <TableCell>{getTierBadge(sub.tier)}</TableCell>
                        <TableCell>{getStatusBadge(sub.status)}</TableCell>
                        <TableCell>
                          <div className="text-xs space-y-1">
                            {sub.extra_post_slots > 0 && <Badge variant="outline">+{sub.extra_post_slots} post</Badge>}
                            {(sub.extra_proposal_slots || 0) > 0 && <Badge variant="outline">+{sub.extra_proposal_slots} chat</Badge>}
                            {(sub.extra_swipe_slots || 0) > 0 && <Badge variant="outline">+{sub.extra_swipe_slots} swipe</Badge>}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {sub.expires_at ? format(new Date(sub.expires_at), 'dd MMM yyyy', { locale: id }) : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Riwayat Transaksi</h3>
                <Badge variant="outline">{transactions.length} total</Badge>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Tipe</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tanggal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="font-medium">@{tx.profiles?.username || 'Unknown'}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="text-sm">{getTransactionTypeLabel(tx.transaction_type)}</span>
                            {tx.tier && <span className="text-xs text-muted-foreground">{tx.tier.toUpperCase()}</span>}
                          </div>
                        </TableCell>
                        <TableCell className="font-bold text-primary">{formatPrice(tx.amount)}</TableCell>
                        <TableCell>{getStatusBadge(tx.status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(tx.created_at), 'dd MMM yyyy HH:mm', { locale: id })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari pengguna..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button onClick={() => setShowCreateUser(true)}>
                  <UserPlus className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Buat User</span>
                </Button>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Lokasi</TableHead>
                      <TableHead>Bergabung</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((profile) => {
                      const role = getUserRole(profile.id);
                      return (
                        <TableRow key={profile.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setViewingUser(profile)}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                                {profile.profile_photo_url ? (
                                  <img src={profile.profile_photo_url} alt={profile.username} className="w-full h-full object-cover" />
                                ) : (
                                  <Users className="h-4 w-4 text-primary" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-sm">@{profile.username}</p>
                                <p className="text-xs text-muted-foreground">{profile.full_name}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {role === 'admin' ? (
                              <Badge className="bg-primary/20 text-primary">Admin</Badge>
                            ) : (
                              <Badge variant="secondary">User</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{profile.location}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true, locale: id })}
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="sm" onClick={() => setViewingUser(profile)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => { setUpgradeUser(profile); setSelectedTier('plus'); }}>
                                <Crown className="h-4 w-4" />
                              </Button>
                              {role !== 'admin' && (
                                <Button variant="outline" size="sm" onClick={() => handleMakeAdmin(profile.id)}>
                                  <Shield className="h-4 w-4" />
                                </Button>
                              )}
                              <Button variant="outline" size="sm" onClick={() => setSelectedUser(profile)}>
                                <Ban className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports">
            <div className="space-y-4">
              {reports.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">Tidak ada laporan</p>
                </Card>
              ) : (
                reports.map((report) => (
                  <Card key={report.id} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="secondary">{report.report_type}</Badge>
                          <Badge variant="outline">{getReasonLabel(report.reason)}</Badge>
                          {getStatusBadge(report.status)}
                        </div>
                        {report.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {report.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(report.created_at), { addSuffix: true, locale: id })}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setSelectedReport(report)}>
                        <Eye className="h-4 w-4 mr-1" />
                        Tinjau
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Items Tab */}
          <TabsContent value="items">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari barang..."
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="grid gap-4">
                {filteredItems.map((item) => (
                  <Card 
                    key={item.id} 
                    className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setViewingItem(item)}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden">
                          <img
                            src={item.photos[0] || '/placeholder.svg'}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-primary font-bold">
                            {formatPrice(item.estimated_value)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            by @{item.profiles?.username}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" onClick={() => setViewingItem(item)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Badge variant={item.is_active ? 'default' : 'secondary'}>
                          {item.is_active ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleItemActive(item.id, item.is_active)}
                        >
                          {item.is_active ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Report Review Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tinjau Laporan</DialogTitle>
            <DialogDescription>
              Tinjau dan ambil tindakan terhadap laporan ini
            </DialogDescription>
          </DialogHeader>
          
          {selectedReport && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Badge variant="secondary">{selectedReport.report_type}</Badge>
                  <Badge variant="outline">{getReasonLabel(selectedReport.reason)}</Badge>
                </div>
                {selectedReport.description && (
                  <p className="text-sm bg-muted p-3 rounded-lg">
                    {selectedReport.description}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Catatan Admin</label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Tambahkan catatan..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleReportAction('dismissed')} disabled={processingReport} className="flex-1">
                  Tolak
                </Button>
                <Button variant="secondary" onClick={() => handleReportAction('reviewed')} disabled={processingReport} className="flex-1">
                  Ditinjau
                </Button>
                <Button onClick={() => handleReportAction('action_taken')} disabled={processingReport} className="flex-1">
                  Ambil Aksi
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* User Ban Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Moderasi Pengguna</DialogTitle>
            <DialogDescription>
              Berikan peringatan atau ban kepada pengguna @{selectedUser?.username}
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipe Tindakan</label>
                <Select value={banType} onValueChange={(v) => setBanType(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="warning">Peringatan</SelectItem>
                    <SelectItem value="temporary">Ban Sementara (7 hari)</SelectItem>
                    <SelectItem value="permanent">Ban Permanen</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Alasan</label>
                <Textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Jelaskan alasan tindakan..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setSelectedUser(null)} className="flex-1">
                  Batal
                </Button>
                <Button onClick={handleBanUser} disabled={!banReason || processingBan} className="flex-1">
                  {processingBan ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Konfirmasi'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Upgrade User Dialog */}
      <Dialog open={!!upgradeUser} onOpenChange={() => setUpgradeUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              Upgrade Subscription
            </DialogTitle>
            <DialogDescription>
              Upgrade langganan @{upgradeUser?.username} secara manual
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Pilih Tier</label>
              <Select value={selectedTier} onValueChange={(v) => setSelectedTier(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="plus">Plus (Rp29.000/bulan)</SelectItem>
                  <SelectItem value="pro">Pro (Rp79.000/bulan)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="p-3 bg-muted rounded-lg text-sm">
              {selectedTier === 'free' && (
                <p>User akan dikembalikan ke tier Free dengan batasan standar.</p>
              )}
              {selectedTier === 'plus' && (
                <p>✅ Swipe unlimited, 5 item aktif, wishlist unlimited, boost item</p>
              )}
              {selectedTier === 'pro' && (
                <p>✅ Semua fitur Plus + upload unlimited, prioritas homepage, badge PRO</p>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setUpgradeUser(null)} className="flex-1">
                Batal
              </Button>
              <Button onClick={handleUpgradeUser} disabled={processingUpgrade} className="flex-1">
                {processingUpgrade ? <Loader2 className="h-4 w-4 animate-spin" /> : `Upgrade ke ${selectedTier.toUpperCase()}`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={showCreateUser} onOpenChange={setShowCreateUser}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Buat User Baru
            </DialogTitle>
            <DialogDescription>
              Buat akun user baru dengan data lengkap
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email *</label>
              <Input
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="user@example.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Password *</label>
              <Input
                type="password"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Username *</label>
              <Input
                value={newUserUsername}
                onChange={(e) => setNewUserUsername(e.target.value)}
                placeholder="username_unik"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Nama Lengkap</label>
              <Input
                value={newUserFullName}
                onChange={(e) => setNewUserFullName(e.target.value)}
                placeholder="Nama lengkap (opsional)"
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowCreateUser(false)} className="flex-1">
                Batal
              </Button>
              <Button
                onClick={handleCreateUser}
                disabled={!newUserEmail || !newUserPassword || !newUserUsername || processingCreateUser}
                className="flex-1"
              >
                {processingCreateUser ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Buat User'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* User Detail Dialog */}
      <UserDetailDialog
        user={viewingUser}
        open={!!viewingUser}
        onOpenChange={(open) => !open && setViewingUser(null)}
      />

      {/* Item Detail Dialog */}
      <ItemDetailDialog
        item={viewingItem}
        open={!!viewingItem}
        onOpenChange={(open) => !open && setViewingItem(null)}
        onToggleActive={toggleItemActive}
      />
      </div>
    </MobileLayout>
  );
}

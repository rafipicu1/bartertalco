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
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

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
}

interface Item {
  id: string;
  name: string;
  photos: string[];
  estimated_value: number;
  category: string;
  is_active: boolean;
  created_at: string;
  user_id: string;
  profiles?: {
    username: string;
  };
}

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('reports');
  
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

  // Admin management state
  const [admins, setAdmins] = useState<any[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [processingAdmin, setProcessingAdmin] = useState(false);

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
      case 'reports':
        await fetchReports();
        break;
      case 'users':
        await fetchUsers();
        break;
      case 'items':
        await fetchItems();
        break;
      case 'admins':
        await fetchAdmins();
        break;
    }
  };

  const fetchAdmins = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          *,
          profiles:user_id (
            username,
            full_name,
            profile_photo_url
          )
        `)
        .eq('role', 'admin');

      if (error) throw error;
      setAdmins(data || []);
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
          profiles (username)
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
      // Create new user via edge function (admin auth)
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
      fetchAdmins();
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
      fetchAdmins();
    } catch (error: any) {
      console.error('Error making admin:', error);
      toast.error(error.message || 'Gagal menjadikan admin');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Admin Panel</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {reports.filter(r => r.status === 'pending').length}
                  </p>
                  <p className="text-xs text-muted-foreground">Laporan Pending</p>
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
                  <p className="text-xs text-muted-foreground">Total Pengguna</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{items.length}</p>
                  <p className="text-xs text-muted-foreground">Total Barang</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{reports.length}</p>
                  <p className="text-xs text-muted-foreground">Total Laporan</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="reports" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden sm:inline">Laporan</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Pengguna</span>
            </TabsTrigger>
            <TabsTrigger value="items" className="gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Barang</span>
            </TabsTrigger>
            <TabsTrigger value="admins" className="gap-2">
              <Crown className="h-4 w-4" />
              <span className="hidden sm:inline">Admin</span>
            </TabsTrigger>
          </TabsList>

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
                          {formatDistanceToNow(new Date(report.created_at), {
                            addSuffix: true,
                            locale: id,
                          })}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedReport(report)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Tinjau
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari pengguna..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="grid gap-4">
                {filteredUsers.map((profile) => (
                  <Card key={profile.id} className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          {profile.profile_photo_url ? (
                            <img
                              src={profile.profile_photo_url}
                              alt={profile.username}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <Users className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{profile.username}</p>
                          <p className="text-sm text-muted-foreground">{profile.location}</p>
                        </div>
                        {profile.verified && (
                          <Badge className="bg-green-100 text-green-800">Verified</Badge>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedUser(profile)}
                      >
                        <Ban className="h-4 w-4 mr-1" />
                        Moderasi
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
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
                  <Card key={item.id} className="p-4">
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
                      <div className="flex items-center gap-2">
                        <Badge variant={item.is_active ? 'default' : 'secondary'}>
                          {item.is_active ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleItemActive(item.id, item.is_active)}
                        >
                          {item.is_active ? (
                            <XCircle className="h-4 w-4" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Admins Tab */}
          <TabsContent value="admins">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">Daftar Admin</h3>
                <Button onClick={() => setShowAddAdmin(true)} size="sm">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Tambah Admin
                </Button>
              </div>

              <div className="grid gap-4">
                {admins.map((adminRole) => (
                  <Card key={adminRole.id} className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          {adminRole.profiles?.profile_photo_url ? (
                            <img
                              src={adminRole.profiles.profile_photo_url}
                              alt={adminRole.profiles?.username}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <Crown className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{adminRole.profiles?.username || 'Unknown'}</p>
                          <p className="text-sm text-muted-foreground">{adminRole.profiles?.full_name}</p>
                        </div>
                        <Badge className="bg-primary/20 text-primary">Admin</Badge>
                      </div>
                      {adminRole.user_id !== user?.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveAdmin(adminRole.id, adminRole.user_id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>

              <div className="border-t pt-4 mt-6">
                <h4 className="font-medium mb-3">Jadikan User Sebagai Admin</h4>
                <div className="grid gap-2">
                  {users.slice(0, 5).filter(u => !admins.some(a => a.user_id === u.id)).map((profile) => (
                    <div key={profile.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">@{profile.username}</span>
                        <span className="text-sm text-muted-foreground">{profile.full_name}</span>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => handleMakeAdmin(profile.id)}>
                        <Shield className="h-4 w-4 mr-1" />
                        Jadikan Admin
                      </Button>
                    </div>
                  ))}
                </div>
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
                <Button
                  variant="outline"
                  onClick={() => handleReportAction('dismissed')}
                  disabled={processingReport}
                  className="flex-1"
                >
                  Tolak
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleReportAction('reviewed')}
                  disabled={processingReport}
                  className="flex-1"
                >
                  Ditinjau
                </Button>
                <Button
                  onClick={() => handleReportAction('action_taken')}
                  disabled={processingReport}
                  className="flex-1"
                >
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
                <Button
                  variant="outline"
                  onClick={() => setSelectedUser(null)}
                  className="flex-1"
                >
                  Batal
                </Button>
                <Button
                  onClick={handleBanUser}
                  disabled={!banReason || processingBan}
                  className="flex-1"
                >
                  {processingBan ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Konfirmasi'
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Admin Dialog */}
      <Dialog open={showAddAdmin} onOpenChange={setShowAddAdmin}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Admin Baru</DialogTitle>
            <DialogDescription>
              Buat akun admin baru dengan email dan password
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                placeholder="admin@example.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <Input
                type="password"
                value={newAdminPassword}
                onChange={(e) => setNewAdminPassword(e.target.value)}
                placeholder="Minimal 8 karakter"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowAddAdmin(false)}
                className="flex-1"
              >
                Batal
              </Button>
              <Button
                onClick={handleAddAdmin}
                disabled={!newAdminEmail || !newAdminPassword || processingAdmin}
                className="flex-1"
              >
                {processingAdmin ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Buat Admin'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

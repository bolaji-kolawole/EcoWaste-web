import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Input } from '../components/ui/input';
import {
  Recycle,
  LogOut,
  Users,
  Building2,
  Package,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Search,
  BarChart3,
  Leaf,
} from 'lucide-react';
import { storage, daysSince } from '../utils/storage';
import { WasteRequest, Stats } from '../types';
import RequestDetailsModal from '../components/RequestDetailsModal';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { CacheManager } from '../utils/CacheManager';
import { Address, RecyclingCompany, StreetCluster, WasteRequestService, WasteType } from '../services/WasteRequestService';
import { CompanyUserService } from '../services/CompanyUserService';
import { MergedClusterRequest } from './RecyclerDashboard';
import { RoleService } from '../services/RoleService';
import { UserService } from '../services/UserService';

const roleService = RoleService.getInstance();
const userService = UserService.getInstance();
const companyUserService = CompanyUserService.getInstance();
const wasteRequestService = WasteRequestService.getInstance();

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(storage.getCurrentUser());
  const [requests, setRequests] = useState<MergedClusterRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<MergedClusterRequest | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalUser, setTotalUser] = useState('');
  const [recyclingCompany, setRecyclingCompany] = useState<RecyclingCompany[]>([])

  useEffect(() => {
    if (!user || user?.role?.name !== 'Admin') {
      navigate('/');
      return;
    }
    loadData();
  }, [user, navigate]);

  async function getUsersWithUserRole() {
    const [rolesRes, roleUsersRes, usersRes] = await Promise.all([
      roleService.queryRoles(),
      roleService.queryUserRoles(),
      userService.queryUsers()
    ]);

    const roles = rolesRes?.sanitized?.content || [];
    const roleUsers = roleUsersRes?.sanitized?.content || [];
    const users = usersRes?.sanitized?.content || [];

    const userRoleId = roles.find(r => r.name === "User")?.external_id;
    const total = roleUsers.filter(ru => ru.role_id === userRoleId);
    return total;
  }

  const loadData = async () => {

    const totalUsers = await getUsersWithUserRole();
    setTotalUser(totalUsers);
    try {
      // 0️⃣ Fetch all companies
      const companiesRes = await wasteRequestService.queryRecyclingCompany();
      const companies = companiesRes.sanitized.content;
      setRecyclingCompany(companies);
      const companyMap = Object.fromEntries(companies.map((c) => [c.cluster_id, c]));

      // 1️⃣ Fetch all cluster requests
      const clusterRequests = (await wasteRequestService.queryClusterRequest()).sanitized.content;

      // 2️⃣ Fetch all waste requests
      const wasteRequestResponses = await Promise.all(
        clusterRequests.map((cr) =>
          wasteRequestService.queryWasteRequests({ external_id: cr.waste_request_id })
        )
      );
      const wasteRequests = wasteRequestResponses.map((res) => res.sanitized.content[0]);

      // 3️⃣ Fetch all statuses in one call
      const allStatusesRes = await wasteRequestService.queryWasteRequestStatus({
        waste_request_id: wasteRequests.external_id!,
      });
      const allStatuses = allStatusesRes.sanitized.content;
      const statusMap = Object.fromEntries(allStatuses.map((s) => [s.waste_request_id, s]));

      // 4️⃣ Fetch all users
      const userResponses = await Promise.all(
        wasteRequests.map((req) =>
          wasteRequestService.queryRequestUser({ external_id: req.user_id })
        )
      );
      const users = userResponses.map((res) => res.sanitized.rows[0]);

      // 5️⃣ Fetch addresses
      const addressResponses = await Promise.all(
        wasteRequests.map((req) =>
          wasteRequestService.queryUserAddress({ user_id: req.user_id })
        )
      );
      const addresses = addressResponses.map((res) => res.sanitized.content[0]);

      // 6️⃣ Fetch waste types
      const wasteTypesRes = await wasteRequestService.queryWasteTypes();
      const wasteTypes = wasteTypesRes.sanitized.content;
      const wasteTypeMap = Object.fromEntries(wasteTypes.map((wt) => [wt.external_id, wt]));

      // 7️⃣ Fetch street clusters
      const clusterIds = [...new Set(addresses.map((a) => a?.cluster_id).filter(Boolean))];
      const clusterRes = await wasteRequestService.queryClusters({ external_id: clusterIds });
      const streetClusters = clusterRes.sanitized.content;
      const clusterMap = Object.fromEntries(streetClusters.map((c) => [c.external_id, c]));

      // 8️⃣ Merge everything and include company + status
      const mergedClusterRequests = wasteRequests.map((req, index) => {
        const address = addresses[index];
        const streetCluster = address ? clusterMap[address.cluster_id] || null : null;
        const company = streetCluster ? companyMap[streetCluster.external_id] || null : null;

        return {
          ...req,
          user: users[index] || null,
          address,
          waste_type: wasteTypeMap[req.waste_type_id] || null,
          street_cluster: streetCluster,
          company,
          status: statusMap[req.external_id] || null
        };
      });

      setRequests(mergedClusterRequests);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleLogout = () => {
    storage.setCurrentUser(null);
    CacheManager.clear();
    toast.success('Logged out successfully');
    navigate('/');
  };

  // Calculate stats
  const stats: Stats = {
    totalRequests: requests.length,
    pendingRequests: requests.filter((r) => r.status.status === 'PENDING').length,
    completedRequests: requests.filter((r) => r.status.status.toLowerCase() === 'completed').length,
    totalWasteCollected: requests.filter((r) => r.status?.status?.toLowerCase() === "completed").reduce((sum, r) => sum + (Number(r.quantity) || 0), 0),
    wasteByType: {
      plastic: requests.filter((r) => r.waste_type.name.toLowerCase() === 'plastic').length,
      paper: requests.filter((r) => r.waste_type.name.toLowerCase() === 'paper').length,
      glass: requests.filter((r) => r.waste_type.name.toLowerCase() === 'glass').length,
      metal: requests.filter((r) => r.waste_type.name.toLowerCase() === 'metal').length,
      electronics: requests.filter((r) => r.waste_type.name.toLowerCase() === 'electronics').length,
      organic: requests.filter((r) => r.waste_type.name.toLowerCase() === 'organic').length,
      hazardous: requests.filter((r) => r.waste_type.name.toLowerCase() === 'hazardous').length,
    },
    activeUsers: totalUser.length,
    activeCompanies: recyclingCompany.length,
  };

  // Unattended requests (pending for more than 3 days)
  const unattendedRequests = requests.filter(
    (r) => r.status.status.toLowerCase() === 'pending' && daysSince(r.created_at) > 3
  );

  // Prepare chart data
  const wasteTypeData = Object.entries(stats.wasteByType)
    .filter(([_, count]) => count > 0)
    .map(([type, count]) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      value: count,
    }));

  const statusData = [
    { name: 'Pending', value: stats.pendingRequests },
    { name: 'Assigned', value: requests.filter((r) => r.status.status.toLowerCase() === 'assigned').length },
    { name: 'Completed', value: stats.completedRequests },
  ].filter((item) => item.value > 0);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

  const getFilteredRequests = (tab: string) => {
    let filtered = requests;

    switch (tab) {
      case 'unattended':
        filtered = unattendedRequests;
        break;
      case 'pending':
        filtered = requests.filter((r) => r.status.status.toLowerCase() === 'pending');
        break;
      case 'completed':
        filtered = requests.filter((r) => r.status.status.toLowerCase() === 'completed');
        break;
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (r) =>
          r.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.address.street.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.waste_type.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-green-600 to-emerald-600 text-white sticky top-0 z-10 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur">
                <Recycle className="size-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Lagos State Government</h1>
                <p className="text-sm text-green-100">Waste Management Administration Portal</p>
              </div>
            </div>
            <Button variant="secondary" onClick={handleLogout}>
              <LogOut className="size-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alert for Unattended Requests */}
        {unattendedRequests.length > 0 && (
          <Card className="mb-8 border-yellow-200 bg-yellow-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="size-5 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-medium text-yellow-900">
                    {unattendedRequests.length} Unattended Request{unattendedRequests.length > 1 ? 's' : ''}
                  </h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    These requests have been pending for more than 3 days and require immediate attention.
                  </p>
                </div>
                <Button
                  size="sm"
                  className="bg-yellow-600 hover:bg-yellow-700 text-white"
                  onClick={() => {
                    const section = document.getElementById('unattended-section');
                    section?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm">Total Requests</CardTitle>
              <Package className="size-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl">{stats.totalRequests}</div>
              <p className="text-xs text-muted-foreground mt-1">All time</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm">Pending</CardTitle>
              <Clock className="size-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl">{stats.pendingRequests}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {unattendedRequests.length} unattended (3+ days)
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm">Completed</CardTitle>
              <CheckCircle2 className="size-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl">{stats.completedRequests}</div>
              <p className="text-xs text-muted-foreground mt-1">Successfully collected</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-emerald-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm">Waste Collected</CardTitle>
              <Leaf className="size-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl">{stats.totalWasteCollected} kg</div>
              <p className="text-xs text-muted-foreground mt-1">Environmental impact</p>
            </CardContent>
          </Card>
        </div>

        {/* System Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Active Users</CardTitle>
              <Users className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl">{stats.activeUsers}</div>
              <p className="text-xs text-muted-foreground mt-1">Registered citizens</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Recycling Companies</CardTitle>
              <Building2 className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl">{stats.activeCompanies}</div>
              <p className="text-xs text-muted-foreground mt-1">Active partners</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="size-5" />
                Waste by Type
              </CardTitle>
              <CardDescription>Distribution of waste categories</CardDescription>
            </CardHeader>
            <CardContent>
              {wasteTypeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={wasteTypeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="size-5" />
                Request Status
              </CardTitle>
              <CardDescription>Current status distribution</CardDescription>
            </CardHeader>
            <CardContent>
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Requests Section */}
        <Card id="unattended-section">
          <CardHeader>
            <div>
              <CardTitle>Request Management</CardTitle>
              <CardDescription>Monitor and track all waste collection requests</CardDescription>
            </div>
            <div className="mt-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search requests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={unattendedRequests.length > 0 ? 'unattended' : 'all'} className="w-full">
              <TabsList>
                {unattendedRequests.length > 0 && (
                  <TabsTrigger value="unattended" className="relative">
                    Unattended ({unattendedRequests.length})
                    <span className="absolute -top-1 -right-1 bg-red-500 size-2 rounded-full" />
                  </TabsTrigger>
                )}
                <TabsTrigger value="all">All ({requests.length})</TabsTrigger>
                <TabsTrigger value="pending">Pending ({stats.pendingRequests})</TabsTrigger>
                <TabsTrigger value="completed">Completed ({stats.completedRequests})</TabsTrigger>
              </TabsList>

              {['unattended', 'all', 'pending', 'completed'].map((tab) => (
                <TabsContent key={tab} value={tab} className="space-y-4 mt-4">
                  {getFilteredRequests(tab).length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Package className="size-12 mx-auto mb-4 opacity-50" />
                      <p>No {tab} requests</p>
                    </div>
                  ) : (
                    getFilteredRequests(tab).map((request) => {
                      const daysOld = daysSince(request.created_at);
                      const isUnattended = request.status.status === 'pending' && daysOld > 3;

                      return (
                        <Card
                          key={request.id}
                          className={`cursor-pointer hover:shadow-md transition-shadow ${isUnattended ? 'border-yellow-300 bg-yellow-50' : ''
                            }`}
                          onClick={() => setSelectedRequest(request)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                {/* Badges */}
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  {isUnattended && (
                                    <Badge variant="destructive" className="animate-pulse">
                                      <AlertTriangle className="size-3 mr-1" />
                                      {daysOld} days old
                                    </Badge>
                                  )}
                                  <Badge
                                    variant={request.status.status === 'completed' ? 'default' : 'secondary'}
                                    className="capitalize"
                                  >
                                    {request.status.status}
                                  </Badge>
                                  <Badge variant="outline" className="capitalize">
                                    {request.waste_type?.name || 'Unknown'}
                                  </Badge>
                                </div>

                                {/* Description */}
                                <h3 className="font-medium mb-2">{request.description}</h3>

                                {/* Details */}
                                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                                  <div>
                                    <span className="font-medium">User:</span>{' '}
                                    {request?.user
                                      ? `${request.user.first_name || 'Unknown'} ${request.user.last_name || ''}`.trim()
                                      : 'Unknown'}
                                  </div>
                                  <div>
                                    <span className="font-medium">Quantity:</span> {request.quantity}
                                  </div>
                                  <div className="col-span-2">
                                    <span className="font-medium">Location:</span> {request.address?.street || 'Unknown'}
                                  </div>
                                  <div>
                                    <span className="font-medium">Requested:</span>{' '}
                                    {new Date(request.created_at).toLocaleDateString('en-NG')}
                                  </div>
                                  {request.company && (
                                    <div>
                                      <span className="font-medium">Assigned:</span> {request.company.name}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </main>

      {/* Modals */}
      {selectedRequest && (
        <RequestDetailsModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          userRole="Admin"
        />
      )}
    </div>
  );
}

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
  Bell,
  Package,
  Clock,
  CheckCircle2,
  Search,
  MapPin,
  User,
  Phone,
  Map,
} from 'lucide-react';
import { storage } from '../utils/storage';
import RequestDetailsModal from '../components/RequestDetailsModal';
import NotificationPanel from '../components/NotificationPanel';
import StreetClusterModal from '../components/StreetClusterModal';
import { toast } from 'sonner';
import { CacheManager } from '../utils/CacheManager';
import { CompanyUserService } from '../services/CompanyUserService';
import { Address, RecyclingCompany, RequestStatus, StreetCluster, WasteRequestService, WasteType } from '../services/WasteRequestService';
import { NotificationService, Notification } from '../services/NotificationService';

const companyUserService = CompanyUserService.getInstance();
const wasteRequestService = WasteRequestService.getInstance();
const notificationService = NotificationService.getInstance();


export interface MergedClusterRequest {
  recycling_company_id: string | undefined;
  street_cluster: any;
  waste_type: WasteType;
  address: Address;
  address_id: string;
  created_at: string;
  description: string;
  external_id: string;
  images: any;
  extra_data: string;
  id: string;
  quantity: string;
  scheduled_date: string;
  status: RequestStatus;
  updated_at: string;
  user: any;
  company?: RecyclingCompany;
  user_id: string;
  waste_type_id: string;

}

export default function RecyclerDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(storage.getCurrentUser());
  const [requests, setRequests] = useState<MergedClusterRequest[]>([]);
  const [clusters, setClusters] = useState<StreetCluster[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<MergedClusterRequest | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<StreetCluster | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!user || user?.role?.name !== 'Recycler') {
      navigate('/');
      return;
    }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true)
    try {
      // -----------------------------
      // 1️⃣ Fetch company + attach to user
      // -----------------------------
      const getCompany = async () => {
        const companyUserRes = await companyUserService.queryCompanyUser({
          user_id: user!.external_id
        });

        const companyUser = companyUserRes?.sanitized?.content?.[0];
        if (!companyUser) return null;

        const companyRes = await wasteRequestService.queryRecyclingCompany({
          external_id: companyUser.company_id
        });

        return companyRes?.sanitized?.content?.[0] || null;
      };

      const company = await getCompany();

      const updatedUser = { ...user, company };
      storage.setCurrentUser(updatedUser);
      setUser(updatedUser);

      if (!company?.cluster_id) {
        setRequests([]);
        setClusters([]);
        return;
      }

      // -----------------------------
      // 2️⃣ Fetch cluster requests
      // -----------------------------
      const clusterRequestsRes =
        await wasteRequestService.queryClusterRequest({
          cluster_id: company.cluster_id
        });

      const clusterRequests =
        clusterRequestsRes?.sanitized?.content || [];

      // console.log(clusterRequests)
      if (clusterRequests.length === 0) {
        setRequests([]);
        setClusters([]);
        return;
      }

      // -----------------------------
      // 3️⃣ Fetch waste requests
      // -----------------------------
      const wasteRequestIds = [
        ...new Set(
          clusterRequests.map((cr) => cr.waste_request_id).filter(Boolean)
        )
      ];
      const wasteRequestResponses = await Promise.all(
        wasteRequestIds.map((id) =>
          wasteRequestService.queryWasteRequests({
            external_id: id
          })
        )
      );

      let wasteRequests = wasteRequestResponses
        .flatMap((res) => res?.sanitized?.content || [])
        .filter(Boolean);

      wasteRequests = Object.values(
        Object.fromEntries(
          wasteRequests.map((req) => [req.external_id, req])
        )
      );

      if (wasteRequests.length === 0) {
        setRequests([]);
        return;
      }

      // -----------------------------
      // 4️⃣ Prepare deduplicated IDs
      // -----------------------------
      const userIds = [
        ...new Set(wasteRequests.map((r) => r.user_id).filter(Boolean))
      ];

      // -----------------------------
      // 5️⃣ Fetch independent data in parallel
      // -----------------------------
      const [
        statusRes,
        wasteTypesRes,
        userResponses,
        addressResponses,
        imagesResponses,
      ] = await Promise.all([
        wasteRequestService.queryWasteRequestStatus(),
        wasteRequestService.queryWasteTypes(),

        Promise.all(
          userIds.map((id) =>
            wasteRequestService.queryRequestUser({
              external_id: id
            })
          )
        ),

        Promise.all(
          userIds.map((id) =>
            wasteRequestService.queryUserAddress({
              user_id: id
            })
          )
        ),
        wasteRequestService.queryWasteRequestImage()
      ]);

      // -----------------------------
      // 6️⃣ Build lookup maps
      // -----------------------------
      const statusMap = Object.fromEntries(
        (statusRes?.sanitized?.content || []).map((s) => [
          s.waste_request_id,
          s
        ])
      );

      const wasteTypeMap = Object.fromEntries(
        (wasteTypesRes?.sanitized?.content || []).map((wt) => [
          wt.external_id,
          wt
        ])
      );

      const userMap = Object.fromEntries(
        userResponses.map((res) => {
          const u = res?.sanitized?.rows?.[0];
          return u ? [u.external_id, u] : [];
        }).filter(Boolean)
      );

      const addressMap = Object.fromEntries(
        addressResponses.map((res) => {
          const a = res?.sanitized?.content?.[0];
          return a ? [a.user_id, a] : [];
        }).filter(Boolean)
      );

      const imagesMap = Object.fromEntries(
        (imagesResponses?.sanitized?.content || []).map((s) => [
          s.waste_request_id,
          s
        ])
      );

      // -----------------------------
      // 7️⃣ Fetch clusters (deduplicated)
      // -----------------------------
      const clusterIds = [
        ...new Set(
          Object.values(addressMap)
            .map((a) => a?.cluster_id)
            .filter(Boolean)
        )
      ];

      let clusterMap: Record<string, any> = {};
      let streetClusters: any[] = [];

      if (clusterIds.length > 0) {
        const clusterResponses = await Promise.all(
          clusterIds.map((id) =>
            wasteRequestService.queryClusters({
              external_id: id
            })
          )
        );

        streetClusters = clusterResponses.flatMap(
          (res) => res?.sanitized?.content || []
        );

        clusterMap = Object.fromEntries(
          streetClusters.map((c) => [c.external_id, c])
        );
      }

      // -----------------------------
      // 8️⃣ Merge everything safely
      // -----------------------------
      const mergedClusterRequests = wasteRequests.map((req) => {
        const address = addressMap[req.user_id];

        return {
          ...req,
          user: userMap[req.user_id] || null,
          address: address || null,
          waste_type: wasteTypeMap[req.waste_type_id] || null,
          street_cluster: address
            ? clusterMap[address.cluster_id] || null
            : null,
          status: statusMap[req.external_id] || null,
          images: imagesMap[req.external_id] || null,
        };
      });

      setRequests(mergedClusterRequests);
      setClusters(streetClusters);

      // -----------------------------
      // 9️⃣ Notifications
      // -----------------------------
      if (updatedUser?.company?.external_id) {
        const notificationRes =
          await notificationService.queryNotifications({
            recipient_role: updatedUser?.role?.name,
            recipient_id: updatedUser.company.external_id
          });

        setNotifications(notificationRes?.sanitized?.content || []);
      }
      setLoading(false);

    } catch (error) {
      console.error("Failed to load data:", error);
    }
  };

  const clusterRequestMap: Record<string, MergedClusterRequest[]> = {};

  requests.forEach((req) => {
    const clusterId = req.street_cluster?.external_id;
    if (!clusterId) return;

    if (!clusterRequestMap[clusterId]) {
      clusterRequestMap[clusterId] = [];
    }
    clusterRequestMap[clusterId].push(req);
  });


  const handleMarkRead = async (external_id: string) => {
    try {
      await notificationService.markNotificationAsRead(
        external_id,
        { read: true }
      );

      // optional: update UI immediately
      setNotifications((prev) =>
        prev.map((n) =>
          n.external_id === external_id ? { ...n, read: true } : n
        )
      );

    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleLogout = () => {
    CacheManager.clear();
    storage.setCurrentUser(null);
    toast.success('Logged out successfully');
    navigate('/');
  };

  const getRequestsForTab = (tab: string) => {
    let filtered = requests;

    switch (tab) {
      case 'AVAILABLE':
        filtered = requests?.filter((r) => r.status?.status === 'PENDING');
        break;

      case 'ASSIGNED':
      case 'ACCEPTED':
        filtered = requests?.filter(
          (r) =>
            r.status?.status === 'ASSIGNED' ||
            r.status?.status === 'ACCEPTED'
        );
        break;

      case 'COMPLETED':
        filtered = requests?.filter(
          (r) => r.status?.status === 'COMPLETED'
        );
        break;

      default:
        filtered = requests?.filter(
          (r) => r.status?.status === 'PENDING'
        );
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (r) =>
          r.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.address?.street.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.waste_type.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };


  const unreadCount = notifications.filter((n) => !n.read).length;
  const myRequests = requests.filter((r) => r.recycling_company_id === user?.company?.external_id);
  const pendingRequests = requests.filter((r) => r.status.status === 'PENDING');
  const completedRequests = myRequests.filter((r) => r.status.status === 'COMPLETED');

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-green-600 p-2 rounded-lg">
                <Recycle className="size-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">{user.company?.name || "Recycling Company"}</h1>
                <p className="text-sm text-gray-600">Recycling Company Portal</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="relative"
                onClick={() => setShowNotifications(true)}
              >
                <Bell className="size-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full size-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="size-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm">Available Requests</CardTitle>
              <Clock className="size-4 text-yellow-600" />
            </CardHeader>
              <CardContent>
                <div className="text-2xl">{pendingRequests.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Awaiting assignment</p>
              </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm">Active Pickups</CardTitle>
              <Package className="size-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl">{myRequests.filter((r) => r.status.status === 'ASSIGNED' || r.status.status === 'ACCEPTED').length}</div>
              <p className="text-xs text-muted-foreground mt-1">In progress</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm">Completed</CardTitle>
              <CheckCircle2 className="size-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl">{completedRequests.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Successfully collected</p>
            </CardContent>
          </Card>
        </div>

        {/* Requests Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Pickup Requests</CardTitle>
                <CardDescription>View and manage waste collection requests</CardDescription>
              </div>
            </div>
            <div className="mt-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search by description, location, or waste type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="AVAILABLE" className="w-full">
              <TabsList>
                <TabsTrigger value="clusters">Street Clusters (
                  {clusters.filter((c) =>
                    requests.some(
                      (r) => r.address?.cluster_id === c.external_id && r.status.status === "PENDING"
                    )
                  ).length}
                  )
                </TabsTrigger>
                <TabsTrigger value="AVAILABLE">
                  Available ({pendingRequests.length})
                </TabsTrigger>
                <TabsTrigger value="ASSIGNED">
                  My Pickups ({myRequests.filter((r) => r.status.status === 'ACCEPTED').length})
                </TabsTrigger>
                <TabsTrigger value="COMPLETED">
                  Completed ({completedRequests.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="clusters" className="space-y-4 mt-4">

                {Object.keys(clusterRequestMap).length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Map className="size-12 mx-auto mb-4 opacity-50" />
                    <p>No street clusters available</p>
                  </div>
                ) : (
                  clusters
                    .filter((cluster) => clusterRequestMap[cluster.external_id]?.length > 0)
                    .map((cluster) => {
                      // Filter only pending requests
                      const pendingRequests = (clusterRequestMap[cluster.external_id] || []).filter(
                        (r) => r.status?.status === "PENDING"
                      );

                      // Skip clusters with no pending requests
                      if (pendingRequests.length === 0) return null;

                      return (
                        <Card
                          key={cluster.external_id}
                          className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-green-600"
                          onClick={() => setSelectedCluster(cluster)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge className="bg-green-100 text-green-800">
                                    <Map className="size-3 mr-1" />
                                    Street Cluster
                                  </Badge>
                                  <Badge variant="outline">
                                    {pendingRequests.length} Requests
                                  </Badge>
                                </div>

                                <h3 className="font-medium mb-2 text-lg">{cluster.area}</h3>
                                <p className="text-sm text-muted-foreground mb-3">{cluster.lga}</p>

                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  {pendingRequests.slice(0, 4).map((req: any) => (
                                    <div
                                      key={req.external_id}
                                      className="flex items-center gap-2 text-muted-foreground"
                                    >
                                      <Package className="size-3" />
                                      <span className="capitalize">{req.waste_type?.name || 'N/A'}</span>
                                      <span className="ml-1 text-xs text-gray-500">({req.user?.first_name})</span>
                                    </div>
                                  ))}
                                </div>

                                {pendingRequests.length > 4 && (
                                  <p className="text-xs text-muted-foreground mt-2">
                                    +{pendingRequests.length - 4} more requests
                                  </p>
                                )}
                              </div>

                              <Button
                                className="bg-green-600 hover:bg-green-700 shrink-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedCluster(cluster);
                                }}
                              >
                                View Cluster
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                )}
              </TabsContent>

              {['AVAILABLE', 'ASSIGNED', 'ACCEPTED', 'COMPLETED'].map((tab) => (
                <TabsContent key={tab} value={tab} className="space-y-4 mt-4">
                  {getRequestsForTab(tab).length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Package className="size-12 mx-auto mb-4 opacity-50" />
                      <p>No {tab.toLocaleLowerCase()} requests</p>
                    </div>
                  ) : (
                    getRequestsForTab(tab).map((request) => {
                      const requestUser = request.user; // merged user
                      const requestAddress = request.address; // merged address
                      const streetCluster = request.street_cluster; // merged cluster

                      return (
                        <Card
                          key={request.external_id}
                          className="cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => setSelectedRequest(request)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  <Badge
                                    variant={
                                      request.status?.status === 'COMPLETED'
                                        ? 'default'
                                        : request.status?.status === 'PENDING'
                                          ? 'secondary'
                                          : 'outline'
                                    }
                                    className="capitalize"
                                  >
                                    {request.status.status}
                                  </Badge>
                                  {/* {request.priority === 'urgent' && (
                    <Badge variant="destructive">Urgent</Badge>
                  )} */}
                                  <Badge variant="outline" className="capitalize">
                                    {request.waste_type?.name || 'N/A'}
                                  </Badge>
                                </div>

                                <h3 className="font-medium mb-2">{request.description}</h3>

                                <div className="space-y-1 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-2">
                                    <Package className="size-4" />
                                    <span>Quantity: {request.quantity}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <MapPin className="size-4" />
                                    <span>{requestAddress?.street || 'No address'}</span>
                                  </div>
                                  {requestUser && (
                                    <>
                                      <div className="flex items-center gap-2">
                                        <User className="size-4" />
                                        <span>{requestUser.first_name} {requestUser.last_name}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Phone className="size-4" />
                                        <span>{requestUser.phone}</span>
                                      </div>
                                    </>
                                  )}
                                  {streetCluster && (
                                    <div className="flex items-center gap-2">
                                      <Map className="size-4" />
                                      <span>{streetCluster.area}, {streetCluster.lga}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2">
                                    <Clock className="size-4" />
                                    <span>
                                      Requested:{' '}
                                      {new Date(request.created_at).toLocaleDateString('en-NG', {
                                        month: 'short',
                                        day: 'numeric',
                                      })}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {request.status.status === 'PENDING' && (
                                <Button
                                  className="bg-green-600 hover:bg-green-700 shrink-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedRequest(request);
                                  }}
                                >
                                  Accept
                                </Button>
                              )}

                              {request.status.status === 'ASSIGNED' || request.status.status === 'ACCEPTED' && request.address.cluster_id === user.company?.cluster_id && (
                                <Button
                                  variant="outline"
                                  className="shrink-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedRequest(request);
                                  }}
                                >
                                  Complete
                                </Button>
                              )}
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
          userRole={user.role.name}
          onUpdate={loadData}
        />
      )}

      {showNotifications && (
        <NotificationPanel
          notifications={notifications}
          onClose={() => setShowNotifications(false)}
          onMarkRead={handleMarkRead}
        />
      )}

      {selectedCluster && (
        <StreetClusterModal
          cluster={selectedCluster}
          onClose={() => setSelectedCluster(null)}
          onSelectRequest={(request) => {
            setSelectedRequest(request);
            setSelectedCluster(null);
          }}
        />
      )}
    </div>
  );
}
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Plus,
  Recycle,
  Award,
  Package,
  Bell,
  LogOut,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  QrCode,
  CreditCard,
  Calendar,
  AlertCircle,
  Users,
} from 'lucide-react';
import { storage } from '../utils/storage';
import CreateRequestModal from '../components/CreateRequestModal';
import RequestDetailsModal from '../components/RequestDetailsModal';
import NotificationPanel from '../components/NotificationPanel';
import SubscriptionModal from '../components/SubscriptionModal';
import { toast } from 'sonner';
import { CacheManager } from '../utils/CacheManager';
import { Payment, Subscription, SubscriptionService } from '../services/SubscriptionService';
import { Address, RequestStatus, WasteRequestService, WasteType } from '../services/WasteRequestService';
import { NotificationService, Notification } from '../services/NotificationService';
import { User } from '../types';
import ProfileModal from '../components/ProfileModal';

const subscriptionService = SubscriptionService.getInstance();
const wasteRequestService = WasteRequestService.getInstance();
const notificationService = NotificationService.getInstance();

interface mergedSubscription {
  plan: Subscription;
  status: string;
  plan_id?: string;
  start_date: Date;
  end_date: Date;
}

export interface MergedRequests {
  address: Address;
  waste_type: WasteType;
  name: string;
  external_id: string;
  user_id: string;
  waste_type_id: string;
  address_id: string;
  description: string;
  status: RequestStatus;
  quantity: string;
  created_at: string;
  scheduled_date?: Date;
}
export default function UserDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(storage.getCurrentUser());
  const [requests, setRequests] = useState<MergedRequests[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [payments, setPayments] = useState<Payment[]>();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MergedRequests | null>(null);
  const [userSubscription, setUserSubscription] = useState<mergedSubscription>()

  useEffect(() => {
    if (!user || user?.role?.name !== 'User') {
      navigate('/');
      return;
    }
    loadData();
    fetchUserSubscription();
  }, [user, navigate]);

  const fetchUserSubscription = async () => {
    try {
      if (!user?.external_id) return;

      // Fetch user's subscriptions
      const userSubscribeResponse = await subscriptionService.queryUserSubscription({
        user_id: user.external_id,
      });

      const userSubscribe = userSubscribeResponse.sanitized;
      const userSubscription = userSubscribe.content?.[0];

      if (!userSubscription?.plan_id) return;

      // Fetch plan details
      const subscribePlanResponse = await subscriptionService.querySubscription({
        external_id: userSubscription.plan_id,
      });
      const subscribePlan = subscribePlanResponse.sanitized.content?.[0];
      if (!subscribePlan) return;
      const mergedSubscription = {
        ...userSubscription,
        plan: subscribePlan
      };
      const fetchPayment: any = (await subscriptionService.querySubcriptionPayment({
        user_id: user.external_id
      })).sanitized

      setUserSubscription(mergedSubscription);
      setPayments(fetchPayment.content);

    } catch (error: any) {
      console.error("Failed to fetch subscription:", error);
    }
  };

  const loadData = async () => {
    try {
      // 1️⃣ Fetch all datasets in parallel
      const [requestsRes, wasteTypesRes, addressesRes, statusRes] = await Promise.all([
        wasteRequestService.queryWasteRequests({ user_id: user!.external_id }),
        wasteRequestService.queryWasteTypes(),
        wasteRequestService.queryUserAddress({ user_id: user!.external_id }),
        wasteRequestService.queryWasteRequestStatus()
      ]);

      // 2️⃣ Safely extract responses
      const requests = requestsRes?.sanitized?.content || [];
      const wasteTypes = wasteTypesRes?.sanitized?.content || [];
      const addresses = addressesRes?.sanitized?.content || [];
      const status = statusRes?.sanitized?.content || [];

      // 3️⃣ Create lookup maps
      const wasteTypeMap = Object.fromEntries(
        wasteTypes.map(w => [w.external_id, w])
      );

      const addressMap = Object.fromEntries(
        addresses.map(a => [a.external_id, a])
      );

      const statusMap = Object.fromEntries(
        status.map(s => [s.waste_request_id, s])
      );

      // 4️⃣ Merge datasets (✅ fixed status mapping)
      const mergedRequests = requests.map(req => ({
        ...req,
        waste_type: wasteTypeMap[req.waste_type_id] || null,
        status: statusMap[req.external_id] || null, // ✅ FIXED
        address: addressMap[req.address_id] || null,
      }));

      // 5️⃣ Update state
      setRequests(mergedRequests);

      // 6️⃣ Notifications
      const allNotifications = await notificationService.queryNotifications({
        recipient_id: user?.external_id!,
        recipient_role: user?.role.name
      })
      const userNotifications = allNotifications.sanitized.content;
      setNotifications(userNotifications);

      const allPoints = await wasteRequestService.queryRequestPoint({
        user_id: user?.external_id!,
        type: "EARNED"
      });

      const userPoint = allPoints?.sanitized?.content || [];

      // Make sure points are numbers
      const totalPoints = userPoint.reduce(
        (sum, entry) => sum + (entry.points ? Number(entry.points) : 0),
        0
      );

      // Store the current user with total points
      storage.setCurrentUser({
        ...user,
        points: totalPoints
      } as User);

    } catch (error) {
      console.error("Failed to load data:", error);
    }
  };

  const handleLogout = () => {
    storage.setCurrentUser(null);
    CacheManager.clear();
    toast.success('Logged out successfully');
    navigate('/');
  };

  const handleCreateRequest = () => {
    const activeSub = userSubscription;

    if (!activeSub) {
      toast.error('Please subscribe to a plan');
      setShowSubscriptionModal(true);
    } else if (activeSub.status !== 'ACTIVE') {
      toast.error('Your subscription is not active');
      setShowSubscriptionModal(true);
    } else if (new Date(activeSub.end_date) < new Date()) {
      toast.error('Your subscription has expired');
      setShowSubscriptionModal(true);
    } else {

      setShowCreateModal(true);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getSubscriptionButtonText = (subscription?: any) => {
    if (!subscription?.end_date) return "Subscribe Now";

    const endDate = new Date(subscription.end_date);
    const diffDays = (endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);

    return diffDays < 7
      ? "Subscribe Now"
      : "Manage Subscription";
  };

  const isSubscriptionExpiringSoon = (subscription: any) => {
    if (!subscription?.end_date) return false; // treat as expired
    const endDate = new Date(subscription.end_date);
    return (endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24) > 7;
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Clock className="size-4" />;
      case 'assigned':
      case 'in_progress':
        return <Truck className="size-4" />;
      case 'completed':
        return <CheckCircle2 className="size-4" />;
      case 'cancelled':
        return <XCircle className="size-4" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'assigned':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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

  const unreadCount = notifications.filter((n) => !n.read).length;

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
                <h1 className="text-xl font-semibold">Lagos Waste Management</h1>
                <p className="text-sm text-gray-600">Welcome, {`${user.first_name} ${user.last_name}`}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
               <Button
                variant="outline"
                size="icon"
                className="relative"
                onClick={() => setShowProfile(true)}
              >
                <Users className="size-5" />
              </Button>
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
        {/* Subscription Alert */}
        {(!userSubscription || userSubscription.status !== 'ACTIVE' || new Date(userSubscription.end_date) < new Date()) && (
          <Card className="mb-8 border-yellow-200 bg-yellow-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="size-5 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-medium text-yellow-900">
                    {!userSubscription
                      ? 'No Active Subscription'
                      : userSubscription.status !== 'ACTIVE'
                        ? 'Subscription Inactive'
                        : 'Subscription Expired'
                    }
                  </h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    {!userSubscription
                      ? 'Subscribe to a plan to start creating waste pickup requests and enjoy priority scheduling.'
                      : userSubscription.status !== 'ACTIVE'
                        ? 'Your subscription is not active. Please contact support or choose a new plan.'
                        : 'Your subscription has expired. Renew to continue creating waste pickup requests.'
                    }
                  </p>
                </div>
                <Button
                  size="sm"
                  className="bg-yellow-600 hover:bg-yellow-700 text-white"
                  onClick={() => setShowSubscriptionModal(true)}
                >
                  Subscribe Now
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm">Total Requests</CardTitle>
              <Package className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl">{requests.length}</div>
              <p className="text-xs text-muted-foreground mt-1">All time requests</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm">Completed</CardTitle>
              <CheckCircle2 className="size-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl">{requests.filter((r) => r.status.status === 'COMPLETED').length}</div>
              <p className="text-xs text-muted-foreground mt-1">Successfully collected</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm">Reward Points</CardTitle>
              <Award className="size-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl">{user.points}</div>
              <p className="text-xs text-muted-foreground mt-1">Earn more by recycling</p>
            </CardContent>
          </Card>
        </div>

        {/* Requests Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Pickup Requests</CardTitle>
                <CardDescription>Manage your waste collection requests</CardDescription>
              </div>
              <Button onClick={handleCreateRequest} className="bg-green-600 hover:bg-green-700">
                <Plus className="size-4 mr-2" />
                New Request
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="w-full">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="in-progress">In Progress</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4 mt-4">
                {requests.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Package className="size-12 mx-auto mb-4 opacity-50" />
                    <p>No requests yet. Create your first pickup request!</p>
                  </div>
                ) : (
                  requests.map((request) => (
                    <Card key={request.external_id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedRequest(request)}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={getStatusColor(request.status.status)}>
                                {getStatusIcon(request.status.status)}
                                <span className="ml-1 capitalize">{request.status.status}</span>
                              </Badge>

                              <Badge variant="outline" className="capitalize">{request.waste_type.name}</Badge>
                            </div>
                            <h3 className="font-medium mb-1">{request.description}</h3>
                            <p className="text-sm text-muted-foreground mb-2">
                              Quantity: {request.quantity}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {request.address.street}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Requested: {new Date(request.created_at).toLocaleDateString('en-NG', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </p>
                          </div>
                          <Button variant="ghost" size="icon">
                            <QrCode className="size-5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="pending" className="space-y-4 mt-4">
                {requests.filter((r) => r.status.status === 'PENDING').map((request) => (
                  <Card key={request.external_id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedRequest(request)}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getStatusColor(request.status.status)}>
                              {getStatusIcon(request.status.status)}
                              <span className="ml-1">Pending</span>
                            </Badge>
                            <Badge variant="outline" className="capitalize">{request.waste_type.name}</Badge>
                          </div>
                          <h3 className="font-medium mb-1">{request.description}</h3>
                          <p className="text-sm text-muted-foreground">Quantity: {request.quantity}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="in-progress" className="space-y-4 mt-4">
                {requests.filter((r) => r.status.status === 'ASSIGNED' || r.status.status === 'ACCEPTED').map((request) => (
                  <Card key={request.external_id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedRequest(request)}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getStatusColor(request.status.status)}>
                              {getStatusIcon(request.status.status)}
                              <span className="ml-1 capitalize">{request.status.status}</span>
                            </Badge>
                            <Badge variant="outline" className="capitalize">{request.waste_type.name}</Badge>
                          </div>
                          <h3 className="font-medium mb-1">{request.description}</h3>
                          <p className="text-sm text-muted-foreground">Quantity: {request.quantity}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="completed" className="space-y-4 mt-4">
                {requests.filter((r) => r.status?.status === 'COMPLETED').map((request) => (
                  <Card key={request.external_id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedRequest(request)}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getStatusColor(request.status.status)}>
                              {getStatusIcon(request.status.status)}
                              <span className="ml-1">Completed</span>
                            </Badge>
                            <Badge variant="outline" className="capitalize">{request.waste_type.name}</Badge>
                          </div>
                          <h3 className="font-medium mb-1">{request.description}</h3>
                          <p className="text-sm text-muted-foreground">Quantity: {request.quantity}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Subscription Section */}
        <Card className="mt-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Subscription & Payments</CardTitle>
                <CardDescription>Manage your recycling service subscription</CardDescription>
              </div>
              <Button
                onClick={() => setShowSubscriptionModal(true)}
                disabled={isSubscriptionExpiringSoon(userSubscription)}
                className="bg-green-600 hover:bg-green-700 flex items-center"
              >
                <CreditCard className="size-4 mr-2" />
                {getSubscriptionButtonText(userSubscription)}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {userSubscription ? (
              <>
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Current Plan</p>
                    <p className="text-lg font-semibold capitalize">{userSubscription.plan.name}</p>
                    <Badge className="mt-2 bg-green-600">Active</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Valid Until</p>
                    <p className="text-lg font-semibold">
                      {new Date(userSubscription.end_date).toLocaleDateString('en-NG', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                {payments && payments.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-3">Payment History</h3>
                    <div className="space-y-2">
                      {payments.slice(0, 5).map((payment) => (
                        <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Calendar className="size-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">
                                {new Date(payment.created_at).toLocaleDateString('en-NG', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {payment.payment_method.toUpperCase()} - {payment.reference}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{formatCurrency(payment.amount)}</p>
                            <Badge variant="outline" className="text-xs">
                              {payment.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <CreditCard className="size-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">No active subscription</p>
                <Button onClick={() => setShowSubscriptionModal(true)} className="bg-green-600 hover:bg-green-700">
                  Subscribe to Get Started
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Modals */}
      {showCreateModal && (
        <CreateRequestModal
          userId={user.external_id}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadData();
          }}
        />
      )}

      {selectedRequest && (
        <RequestDetailsModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          userRole="User"
        />
      )}

      {showNotifications && (
        <NotificationPanel
          notifications={notifications}
          onClose={() => setShowNotifications(false)}
          onMarkRead={handleMarkRead}
        />
      )}

      {showSubscriptionModal && (
        <SubscriptionModal
          userId={user.external_id}
          onClose={() => setShowSubscriptionModal(false)}
          onSuccess={() => {
            setShowSubscriptionModal(false);
            loadData();
          }}
        />
      )}

      {setShowProfile && (
        <ProfileModal 
        open={showProfile}
        onClose={() => setShowProfile(false)}
        />
      )}
    </div>
  );
}
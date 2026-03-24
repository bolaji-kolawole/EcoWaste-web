import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { WasteRequest, UserRole } from '../types';
import { storage } from '../utils/storage';
import {
  MapPin,
  Calendar,
  Package,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Truck,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { NotificationService } from '../services/NotificationService';
import { RecyclingCompany, WasteRequestService } from '../services/WasteRequestService';
import { MergedClusterRequest } from '../pages/RecyclerDashboard';

const wasteRequestService = WasteRequestService.getInstance();
const notificationService = NotificationService.getInstance();

interface RequestDetailsModalProps {
  request: any;
  onClose: () => void;
  userRole: UserRole;
  onUpdate?: () => void;
}

const ThreeDaysAgo = new Date();
ThreeDaysAgo.setDate(ThreeDaysAgo.getDate() - 3);

export default function RequestDetailsModal({ request, onClose, userRole, onUpdate }: RequestDetailsModalProps) {
  const [company, setCompany] = useState<RecyclingCompany>();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  useEffect(() => {

    const fetch = async () => {
      if (!request.recycling_company_id) return;
      const fetchRecyclingCompany = await wasteRequestService.queryRecyclingCompany({
        external_id: request.recycling_company_id
      })
      setCompany(fetchRecyclingCompany.sanitized.content[0])
    }

    fetch()
  }, [])

  const handleAcceptRequest = async (request: MergedClusterRequest) => {
    if (!request) return;

    setLoadingAction("accept");
    const currentUser = storage.getCurrentUser();
    if (!currentUser || currentUser.role.name !== 'Recycler' || userRole !== 'Recycler') return;

    await wasteRequestService.acceptWasteRequest(
      request.external_id,
      {
        recycling_company_id: currentUser.company?.external_id!
      }
    );

    await wasteRequestService.updateWasteRequestStatus(
      request.status.external_id,
      {
        status: "ACCEPTED",
        accepted_at: new Date().toISOString()
      }
    );

    const newNotification = {
      title: "Request Accepted",
      message: `${currentUser.company?.name} has accepted your pickup request for ${request.waste_type.name}`,
      type: 'success' as const,
      recipient_role: 'user',
      recipient_id: request.user_id,
    };

    await notificationService.createUserNotification(newNotification);

    toast.success('Request accepted successfully!');
    setLoadingAction(null)
    onUpdate?.();
    onClose();
  };

  const handleCompleteRequest = async (request: MergedClusterRequest) => {

    setLoadingAction("complete");
    try {
      if (!request.status?.external_id) {
        throw new Error("Missing status ID");
      }

      // 1️⃣ Update status in backend
      await wasteRequestService.updateWasteRequestStatus(
        request.status.external_id,
        {
          status: "COMPLETED",
          completed_at: new Date().toISOString(),
        }
      );

      // 2️⃣ Calculate points (safe lowercase)
      const pointsToAward = getPointsForWasteType(
        request.waste_type?.name?.toLowerCase()
      );

      // 3️⃣ Send notification
      await wasteRequestService.createNotification({
        title: "Request Completed",
        message: `Pickup completed! You earned ${pointsToAward} points for recycling ${request.waste_type?.name}.`,
        type: "success",
        recipient_role: "user",
        recipient_id: request.user_id,
      });

      await wasteRequestService.createRequestPoint({
        user_id: request.user_id,
        points: pointsToAward
      })

      toast.success(`Request completed! User earned ${pointsToAward} points.`);

      onUpdate?.();
      onClose();

    } catch (error) {
      console.error(error);
      toast.error("Failed to complete request");
    } finally {
      setLoadingAction(null);
    }
  };


  const handleDeclineRequest = async () => {
    setLoadingAction("decline");
    try {
      // await declineRequest();

      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAction(null);
    }
  };

  const getPointsForWasteType = (type: string): number => {
    const points: Record<string, number> = {
      plastic: 50,
      paper: 40,
      glass: 60,
      metal: 70,
      electronics: 100,
      organic: 30,
      hazardous: 80,
    };
    return points[type] || 50;
  };

  const getStatusIcon = () => {
    switch (request.status.status.toLowerCase()) {
      case 'pending':
        return <Clock className="size-5 text-yellow-600" />;
      case 'assigned':
      case 'in_progress':
        return <Truck className="size-5 text-blue-600" />;
      case 'completed':
        return <CheckCircle2 className="size-5 text-green-600" />;
      case 'cancelled':
        return <XCircle className="size-5 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getStatusIcon()}
            Request Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status */}
          <div className="flex items-center gap-2">
            <Badge
              variant={request.status.status === 'COMPLETED' ? 'default' : 'secondary'}
              className="capitalize"
            >
              {request.status.status}
            </Badge>
            {userRole === 'Recycler' && request.status.status === 'ASSIGNED' && (
              <Badge variant="destructive">
                <AlertCircle className="size-3 mr-1" />
                Urgent
              </Badge>
            )}

            {new Date(request.created_at) < ThreeDaysAgo && (
              <Badge variant="destructive">
                <AlertCircle className="size-3 mr-1" />
                Overdue
              </Badge>
            )}
            <Badge variant="outline" className="capitalize">
              {request.waste_type.name}
            </Badge>
          </div>

          {/* User Info */}
          {request.user && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <h3 className="font-medium">User Information</h3>
              <div className="text-sm space-y-1">
                <p><span className="text-muted-foreground">Name:</span> {request.user.first_name}</p>
                <p><span className="text-muted-foreground">Phone:</span> {request.user.phone}</p>
                <p><span className="text-muted-foreground">Email:</span> {request.user.email}</p>
              </div>
            </div>
          )}

          {/* Request Details */}
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Description</h3>
              <p className="text-sm text-muted-foreground">{request.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Package className="size-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Quantity</span>
                </div>
                <p className="text-sm">{request.quantity}</p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="size-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Requested</span>
                </div>
                <p className="text-sm">
                  {new Date(request.created_at).toLocaleDateString('en-NG', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="size-4 text-muted-foreground" />
                <span className="text-sm font-medium">Pickup Location</span>
              </div>
              <p className="text-sm">{request.address.street}</p>
            </div>

            {company && (
              <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                <h3 className="font-medium">Assigned To</h3>
                <div className="text-sm space-y-1">
                  <p><span className="text-muted-foreground">Company:</span> {company.name}</p>
                  <p><span className="text-muted-foreground">Phone:</span> {company.phone}</p>
                  {request.status.accepted_at && (
                    <p>
                      <span className="text-muted-foreground">Assigned on:</span>{' '}
                      {new Date(request.status.accepted_at).toLocaleDateString('en-NG')}
                    </p>
                  )}
                </div>
              </div>
            )}

            {request.status.completed_at && (
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm">
                  <span className="font-medium">Completed on:</span>{' '}
                  {new Date(request.status.updated_at).toLocaleDateString('en-NG', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            )}
          </div>

          {/* Images */}

          {request.images?.images?.length > 0 && (
            <div>
              <h3 className="font-medium mb-2">Photos</h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {request.images.images.map((img: string, index: number) => (
                  <a
                    href={img}
                    target="_blank"
                    rel="noopener noreferrer"
                    key={index}
                  >
                    <img
                      src={img}
                      alt={`Waste ${index + 1}`}
                      className="w-full h-32 object-cover rounded hover:opacity-80 cursor-pointer transition"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* QR Code */}
          <div>
            <h3 className="font-medium mb-2">Verification QR Code</h3>
            <div className="bg-white border rounded-lg p-4 inline-block">
              <QRCodeSVG value={request.external_id} size={150} />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Show this QR code to the driver during pickup
            </p>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex justify-end gap-2">

            {/* PENDING: Accept / Decline */}
            {userRole === 'Recycler' && request.status.status === 'PENDING' && (
              <>
                <Button
                  variant="outline"
                  onClick={handleDeclineRequest}
                  disabled={loadingAction !== null}
                >
                  {loadingAction === "decline" ? (
                    <span className="animate-spin inline-block w-5 h-5 border-2 border-t-2 border-gray-500 rounded-full"></span>
                  ) : "Decline"}
                </Button>

                <Button
                  onClick={() => handleAcceptRequest(request)}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={loadingAction !== null}
                >
                  {loadingAction === "accept" ? (
                    <span className="animate-spin inline-block w-5 h-5 border-2 border-t-2 border-white rounded-full"></span>
                  ) : "Accept Request"}
                </Button>
              </>
            )}

            {/* ASSIGNED / ACCEPTED: Complete */}
            {userRole === 'Recycler' &&
              (request.status.status === 'ASSIGNED' || request.status.status === "ACCEPTED") && (
                <Button
                  onClick={() => handleCompleteRequest(request)}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={loadingAction !== null}
                >
                  {loadingAction === "complete" ? (
                    <span className="animate-spin inline-block w-5 h-5 border-2 border-t-2 border-white rounded-full"></span>
                  ) : "Mark as Completed"}
                </Button>
              )}

            {/* Close for everyone else */}
            {(userRole === 'User' || userRole === 'Admin' || (userRole === 'Recycler' && !["PENDING", "ASSIGNED"].includes(request.status.status))) && (
              <Button variant="outline" onClick={onClose} disabled={loadingAction !== null}>
                Close
              </Button>
            )}

          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

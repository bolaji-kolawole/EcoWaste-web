import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { MapPin, Package, User, Phone, Clock, Map } from 'lucide-react';
import { Address, RequestStatus, StreetCluster, WasteRequest, WasteRequestService, WasteType } from '../services/WasteRequestService';

const wasteRequestService = WasteRequestService.getInstance();

interface StreetClusterModalProps {
  cluster: StreetCluster;
  onClose: () => void;
  onSelectRequest: (request: MergedClusterRequest) => void;
}

export interface MergedClusterRequest {
  recycling_company_id: string | undefined;
  street_cluster: StreetCluster;
  waste_type: WasteType;
  address: Address;
  address_id: string;
  created_at: string;
  description: string;
  external_id: string;
  extra_data: string;
  id: string;
  quantity: string;
  scheduled_date: string;
  status: RequestStatus;
  updated_at: string;
  user: any;
  user_id: string;
  waste_type_id: string;

}

export default function StreetClusterModal({ cluster, onClose, onSelectRequest }: StreetClusterModalProps) {
  const [requests, setRequests] = useState<MergedClusterRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClusterRequests = async () => {
      try {
        setLoading(true);

        // 1️⃣ Fetch cluster requests
        const clusterRequestsRes = await wasteRequestService.queryClusterRequest({
          cluster_id: cluster.external_id
        });
        const clusterRequests = clusterRequestsRes?.sanitized?.content || [];

        // 2️⃣ Fetch waste requests
        const wasteRequestsRes = await Promise.all(
          clusterRequests.map((cr) =>
            wasteRequestService.queryWasteRequests({
              external_id: cr.waste_request_id
            })
          )
        );

        const wasteRequests = wasteRequestsRes
          .map((res) => res?.sanitized?.content?.[0])
          .filter(Boolean);

        // ✅ 3️⃣ Fetch STATUS (NEW)
        const statusRes = await wasteRequestService.queryWasteRequestStatus();
        const statusList = statusRes?.sanitized?.content || [];

        const statusMap = Object.fromEntries(
          statusList.map((s) => [s.waste_request_id, s])
        );

        // 4️⃣ Fetch users
        const userResponses = await Promise.all(
          wasteRequests.map((req) =>
            wasteRequestService.queryRequestUser({
              external_id: req.user_id
            })
          )
        );

        const usersMap = Object.fromEntries(
          userResponses.map((res) => {
            const user = res?.sanitized?.rows?.[0];
            return [user?.external_id, user];
          })
        );

        // 5️⃣ Fetch addresses
        const addressResponses = await Promise.all(
          wasteRequests.map((req) =>
            wasteRequestService.queryUserAddress({
              user_id: req.user_id
            })
          )
        );

        const addressesMap = Object.fromEntries(
          addressResponses.map((res) => {
            const addr = res?.sanitized?.content?.[0];
            return [addr?.user_id, addr];
          })
        );

        // 6️⃣ Fetch waste types
        const wasteTypesRes = await wasteRequestService.queryWasteTypes();
        const wasteTypesMap = Object.fromEntries(
          (wasteTypesRes?.sanitized?.content || []).map((wt) => [
            wt.external_id,
            wt
          ])
        );

        // 7️⃣ Merge everything (✅ status added)
        const mergedRequests: any = wasteRequests.map((req) => ({
          ...req,
          user: usersMap[req.user_id] || null,
          address: addressesMap[req.user_id] || null,
          waste_type: wasteTypesMap[req.waste_type_id] || null,
          status: statusMap[req.external_id] || null // ✅ HERE
        }));

        setRequests(mergedRequests);

      } catch (error) {
        console.error('Error fetching cluster requests:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClusterRequests();
  }, [cluster]);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="size-5 text-green-600" />
            Street Cluster: {cluster.area}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Cluster Info */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Requests</p>
                <p className="text-2xl font-bold text-green-700">{requests.filter(r => r.status?.status === "PENDING").length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Area</p>
                <p className="font-medium">{cluster.area || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium">
                  {new Date(cluster.created_at).toLocaleDateString('en-NG', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Requests */}
          <div className="space-y-3">
            <h3 className="font-medium">Pickup Requests in this Cluster</h3>
            {loading ? (
              <p className="text-center py-8">Loading requests...</p>
            ) : requests.filter(r => r.status?.status === "PENDING").length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Map className="size-12 mx-auto mb-4 opacity-50" />
                No pending requests found
              </div>
            ) : (
              requests
                .filter(r => r.status?.status === "PENDING")
                .map((request) => {
                  const address = request.address;

                  return (
                    <Card
                      key={request.external_id}
                      className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-green-600"
                      onClick={() => onSelectRequest(request)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <Badge
                                variant="secondary"
                                className="capitalize"
                              >
                                {request.status.status}
                              </Badge>
                              <Badge variant="outline" className="capitalize">
                                {request.waste_type.name || 'N/A'}
                              </Badge>
                            </div>

                            <h4 className="font-medium mb-2">{request.description}</h4>

                            <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <Package className="size-4" />
                                <span>{request.quantity}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPin className="size-4" />
                                <span>{address?.street || 'N/A'}</span>
                              </div>
                              {request.user && (
                                <>
                                  <div className="flex items-center gap-2">
                                    <User className="size-4" />
                                    <span>{request.user.first_name} {request.user.last_name}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Phone className="size-4" />
                                    <span>{request.user.phone}</span>
                                  </div>
                                </>
                              )}
                              <div className="flex items-center gap-2">
                                <Clock className="size-4" />
                                <span>
                                  {new Date(request.created_at).toLocaleDateString('en-NG', {
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
            )}
          </div>

          {/* Route Tip */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Route Optimization Tip:</strong> Accept all requests in this cluster to optimize
              your pickup route and save time on {cluster.area}.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
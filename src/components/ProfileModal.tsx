import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { UserService } from "../services/UserService";
import { AddressService } from "../services/AddressService";
import { storage } from "../utils/storage";
import { WasteRequestService } from "../services/WasteRequestService";

const userService = UserService.getInstance();
const addressService = AddressService.getInstance();
const wasteRequestService = WasteRequestService.getInstance();

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ProfileModal({ open, onClose }: Props) {

  const [user, setUser] = useState<any>({});
  const [address, setAddress] = useState<any>({
    external_id: "",
    street: "",
    city: "",
    state: "",
    postal_code: "",
    clusterId: ""
  });

  const [clusters, setClusters] = useState<any[]>([]);

  /**
   * Load user, address, and clusters
   */
  useEffect(() => {

    const fetchData = async () => {
      try {
        const currentUser = storage.getCurrentUser();

        if (currentUser) {
          setUser(currentUser);

          // fetch address
          const res = await addressService.queryAddresss({
            user_id: currentUser.external_id,
          });

          const userAddress = res.sanitized.content[0];

          if (userAddress) {
            setAddress(userAddress);
          }
        }

        // fetch clusters
        const clusterRes = (await wasteRequestService.queryClusters()).sanitized;
        setClusters(clusterRes?.content || []);

      } catch (error) {
        console.error(error);
      }
    };

    if (open) {
      fetchData();
    }
  }, [open]);

  /**
   * Save profile
   */
  const handleSave = async () => {
    if(!address.cluster_id ){
      toast.error('Please select cluster')
    }
    try {
      // update user
      if (user?.external_id) {
        await userService.updateUser(user.external_id, user);
      }

      // update or create address
      if (address?.external_id) {
        await addressService.updateAddress(address.external_id, address);
      } else {
        await addressService.createAddress({
          ...address
        });
      }

      toast.success("Profile updated successfully");
      onClose();

    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Update failed");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">

        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">

          {/* USER INFO */}
          <div>
            <Label>First Name</Label>
            <Input
              value={user?.first_name || ""}
              onChange={(e) =>
                setUser({ ...user, name: e.target.value })
              }
            />
          </div>
          <div>
            <Label>Last Name</Label>
            <Input
              value={user?.last_name || ""}
              onChange={(e) =>
                setUser({ ...user, name: e.target.value })
              }
            />
          </div>

          <div>
            <Label>Phone</Label>
            <Input
              value={user?.phone || ""}
              onChange={(e) =>
                setUser({ ...user, phone: e.target.value })
              }
            />
          </div>

          {/* ADDRESS */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">Address</h3>

            <div>
              <Label>Street</Label>
              <Input
                value={address.street}
                onChange={(e) =>
                  setAddress({ ...address, street: e.target.value })
                }
              />
            </div>

            <div>
              <Label>City</Label>
              <Input
                value={address.city}
                onChange={(e) =>
                  setAddress({ ...address, city: e.target.value })
                }
              />
            </div>

            <div>
              <Label>State</Label>
              <Input
                value={address.state}
                onChange={(e) =>
                  setAddress({ ...address, state: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Postal Code</Label>
              <Input
                value={address.postal_code}
                onChange={(e) =>
                  setAddress({ ...address, postal_code: e.target.value })
                }
              />
            </div>

            {/* STREET CLUSTER */}
            <div>
              <Label>Street Cluster</Label>

              <select
                value={address.cluster_id || ""}
                onChange={(e) =>
                  setAddress({ ...address, cluster_id: e.target.value })
                }
                className="w-full border rounded px-2 py-2"
              >
                <option value="">Select cluster</option>

                {clusters.map((cluster: any) => (
                  <option
                    key={cluster.external_id}
                    value={cluster.external_id}
                  >
                    {cluster.area}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>

            <Button
              onClick={handleSave}
              className="bg-green-600 hover:bg-green-700"
            >
              Save Changes
            </Button>
          </div>

        </div>

      </DialogContent>
    </Dialog>
  );
}
import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { storage } from '../utils/storage';
import { toast } from 'sonner';
import { Upload, X } from 'lucide-react';
import { Address, RecyclingCompany, WasteRequestService, WasteType } from '../services/WasteRequestService';

const wasteRequestService = WasteRequestService.getInstance();



interface CreateRequestModalProps {
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateRequestModal({ userId, onClose, onSuccess }: CreateRequestModalProps) {
  const user = storage.getCurrentUser();

  const [wasteTypes, setWasteTypes] = useState<WasteType[]>([]);
  const [selectedWasteType, setSelectedWasteType] = useState<string>('');
  const [selectedAddress, setSelectedAddress] = useState<Address>();
  const [quantity, setQuantity] = useState('');
  const [description, setDescription] = useState('');
  const [recyclingCompany, setRecyclingCompany] = useState<RecyclingCompany[]>([]);
  const [userAddress, setUserAddress] = useState<Address[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState<boolean>(false);



  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = (await wasteRequestService.queryWasteTypes()).sanitized;
        setWasteTypes(res.content);
        const addr = (await wasteRequestService.queryUserAddress({
          user_id: user!.external_id
        })).sanitized;
        setUserAddress(addr.content);
      } catch (error) {
        console.log(error);
      }
    };
    fetchData();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const selected = Array.from(files).slice(0, 5 - images.length);
      setImages([...images, ...selected]);
    }
  };

  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "public_reports"); // Replace with your Cloudinary preset

    const res = await fetch(
      "https://api.cloudinary.com/v1_1/dks3iwjqe/image/upload",
      {
        method: "POST",
        body: formData
      }
    );
    const data = await res.json();
    return data.secure_url;
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (
      !selectedWasteType ||
      !selectedAddress ||
      !quantity ||
      !description ||
      !images ||
      images.length === 0
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      const uploadedUrls = await Promise.all(images.map((file) => handleUpload(file)));

      const payload = {
        waste_type_id: selectedWasteType,
        address_id: selectedAddress.external_id,
        quantity,
        description,
      };

      // 1️⃣ Create Waste Request
      const res = await wasteRequestService.createWasteRequest(payload);
      const newtask = res?.sanitized;

      if (!newtask?.external_id) {
        throw new Error("Invalid waste request response");
      }

      const wasteRequestId = newtask.external_id;

      // 2️⃣ Run dependent tasks (partially parallel)
      await Promise.all([
        // status
        wasteRequestService.createWasteRequestStatus({
          waste_request_id: wasteRequestId,
        }),

        // images
        wasteRequestService.createWasteRequestImage({
          waste_request_id: wasteRequestId,
          images: uploadedUrls,
        }),

        // cluster
        wasteRequestService.createClusterRequest({
          cluster_id: selectedAddress.cluster_id,
          waste_request_id: wasteRequestId,
        }),
      ]);

      // 3️⃣ Notifications (separate for clarity)
      await Promise.all(
        recyclingCompany.map((recycler) =>
          wasteRequestService.createNotification({
            title: "New Pickup Request",
            recipient_id: recycler.external_id,
            message: `Pickup request available on ${selectedAddress?.street}. Click to view cluster details.`,
            type: "info",
            recipient_role: "recycler",
          })
        )
      );

      toast.success(
        "Request created! Recyclers have been notified about requests in your area."
      );

      onSuccess();

    } catch (error) {
      console.error(error);
      toast.error("Failed to create waste request");
    } finally {
      setLoading(false)
    }
  };

  useEffect(() => {
    const fetchRecyclingCompany = async () => {
      if (!selectedAddress?.cluster_id) return;

      try {
        const response = await wasteRequestService.queryRecyclingCompany({
          cluster_id: selectedAddress.cluster_id
        });

        const resc = response?.sanitized;

        setRecyclingCompany(resc?.content);

      } catch (error) {
        console.error("Failed to fetch recycling companies:", error);
      }
    };

    fetchRecyclingCompany();
  }, [selectedAddress]);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Pickup Request</DialogTitle>
          <DialogDescription>
            Fill in the details below to schedule a waste pickup
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Waste Type & Quantity */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="wasteType">Waste Type *</Label>
              <Select value={selectedWasteType} onValueChange={setSelectedWasteType}>
                <SelectTrigger id="wasteType">
                  <SelectValue placeholder="Select waste type" />
                </SelectTrigger>
                <SelectContent>
                  {wasteTypes.length > 0
                    ? wasteTypes.map(type => <SelectItem key={type.external_id} value={type.external_id}>{type.name}</SelectItem>)
                    : <SelectItem value="loading" disabled>No waste types available</SelectItem>
                  }
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input id="quantity" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="e.g., 50 kg, 10 bags" />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Describe the waste items..." />
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">Pickup Address *</Label>
            <Select value={selectedAddress?.external_id || ''} onValueChange={(value) => {
              const addr = userAddress.find(a => a.external_id === value);
              setSelectedAddress(addr);
            }}>
              <SelectTrigger id="userAddress">
                <SelectValue placeholder="Select from your addresses" />
              </SelectTrigger>
              <SelectContent>
                {userAddress.length > 0
                  ? userAddress.map(type => <SelectItem key={type.external_id} value={type.external_id}>{type.street}, {type.city}</SelectItem>)
                  : <SelectItem value="loading" disabled>No Address found</SelectItem>
                }
              </SelectContent>
            </Select>
          </div>

          {selectedAddress?.city && (
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                readOnly
                value={selectedAddress.city}
              />
            </div>
          )}


          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Upload Photos (Optional, max 5)</Label>
            <div className="border-2 border-dashed rounded-lg p-4">
              <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" id="image-upload" />
              <label htmlFor="image-upload" className="flex flex-col items-center cursor-pointer">
                <Upload className="size-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">Click to upload images</span>
              </label>
              {images.length > 0 && (
                <div className="grid grid-cols-5 gap-2 mt-4">
                  {images.map((file, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-20 object-cover rounded"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button><Button
              onClick={handleSubmit}
              disabled={loading}
              className={`text-white ${loading
                  ? "bg-green-300 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
                }`}
            >
              {loading ? "Creating Request..." : "Create Request"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
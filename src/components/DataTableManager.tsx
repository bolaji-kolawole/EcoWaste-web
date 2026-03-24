import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ModelName } from '../types';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { SuperAdminService } from '../services/SuperAdminService';

const adminApi = SuperAdminService.getInstance();

interface DataTableManagerProps {
  modelName: ModelName;
  onUpdate: () => void;
}

const ITEMS_PER_PAGE = 10;

export default function DataTableManager({ modelName, onUpdate }: DataTableManagerProps) {
  const [data, setData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [roles, setRoles] = useState<any[]>([]);
  const [wasteTypes, setWasteTypes] = useState<any[]>([]);
  const [streetCluster, setStreetCluster] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [modelName]);

  useEffect(() => {
    filterData();
    loadRoles();
    loadWasteTypes();
    loadStreetCluster();
  }, [data, searchTerm]);

  const fetchModel = async (model: string, setter: (data: any[]) => void) => {
    try {
      const res = await adminApi.getModelRecords(model);
      setter(res.data?.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const loadRoles = () => fetchModel("roles", setRoles);
  const loadWasteTypes = () => fetchModel("waste_types", setWasteTypes);
  const loadStreetCluster = () => fetchModel("street_clusters", setStreetCluster);

  const loadData = async (page = 1) => {
    try {
      const adminApi = SuperAdminService.getInstance();

      const response = await adminApi.getModelRecords(modelName, {
        page,
        size: 10,
      });

      const result = response.data;

      setData(result?.data || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load data");
    }
  };

  const filterData = () => {
    if (!searchTerm) {
      setFilteredData(data);
      return;
    }

    const filtered = data.filter((item) =>
      Object.values(item).some((value) =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
    setFilteredData(filtered);
    setCurrentPage(1);
  };

  const handleCreate = () => {
    setSelectedItem(null);
    setFormData(getEmptyForm());
    setShowEditModal(true);
  };

  const handleEdit = (item: any) => {
    setSelectedItem(item);
    setFormData({ ...item });
    setShowEditModal(true);
  };

  const handleDelete = async (item: any) => {
    if (!confirm("Are you sure you want to delete this record?")) return;

    try {
      setLoading(true);
      const adminApi = SuperAdminService.getInstance();

      await adminApi.deleteModelRecord(
        modelName,
        item.external_id // or externalId depending on your API response
      );

      toast.success("Record deleted successfully");

      loadData();   // refresh table
      onUpdate();   // trigger parent updates
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete record");
    } finally {
      setLoading(false);
    }
  };


  const handleSave = async () => {
    try {
      setLoading(true);
      const adminApi = SuperAdminService.getInstance();

      if (selectedItem) {
        // UPDATE
        await adminApi.updateModelRecord(
          modelName,
          selectedItem.external_id,
          formData
        );
        toast.success("Record updated successfully");
      } else {
        // CREATE
        await adminApi.createModelRecord(
          modelName,
          formData
        );
        toast.success("Record created successfully");
      }

      setShowEditModal(false);
      loadData();
      onUpdate();
    } catch (error) {
      console.error(error);
      toast.error("Failed to save record");
    } finally {
      setLoading(false);
    }
  };

  const getEmptyForm = () => {
    const templates: Record<string, any> = {
      users: { email: '', password: '', first_name: '', last_name: '', phone: '', lasra: '' },
      roles: { name: '', description: '' },
      user_roles: { user_id: '', role_id: '', },
      addresses: { userId: '', street: '', city: '', clusterId: '', postalCode: '', state: 'Lagos' },
      subscription_plans: { name: '', price: '', durationDays: '' },
      user_subscriptions: { userId: '', planId: '', startDate: '', endDate: '' },
      payments: { userId: '', amount: '', subscriptionId: '', userSubscriptionId: '', paymentMethod: '', reference: '' },
      waste_types: { name: '' },
      waste_requests: { userId: '', wasteTypeId: '', recyclingCompanyId: '', addressId: '', description: '', quantity: '' },
      request_images: { wasteRequestId: '', images: '' },
      request_assignments: { requestId: '', companyId: '', assignedBy: '', status: 'assigned', assignedAt: '' },
      recycling_companies: { name: '', email: '', phone: '', address: '', clusterId: '' },
      company_users: { userId: '', companyId: '' },
      pickup_schedules: { companyId: '', driverId: '', requestIds: [], scheduledDate: '', startTime: '', status: 'scheduled', routeOptimized: false },
      waste_collection_logs: { requestId: '', companyId: '', collectorId: '', weightKg: 0, verificationCode: '', collectedAt: '', notes: '' },
      recycling_rewards: { userId: '', totalPoints: 0, currentTier: 'bronze', lastUpdated: '' },
      reward_transactions: { userId: '', points: 0, type: 'earned', description: '', referenceId: '' },
      street_clusters: { area: '', lga: '' },
      notifications: { title: '', message: '', type: '', recipientId: '', recipientRole: '', },
      notification_logs: { notificationId: '', channel: 'in_app', status: 'pending' },
      reports: { title: '', data: '', generatedBy: '' },
      public_reports: { location: '', description: '', images: '' },
    };
    return templates[modelName] || {};
  };

  const getFieldLabel = (key: string) => {
    return key
      .split(/(?=[A-Z])/)
      .join(' ')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const renderField = (key: string, value: any) => {
    // Special cases for complex fields
    if (key === 'id' || key === 'created_at' || key === 'updated_at' || key === 'external_id') {
      return (
        <div key={key}>
          <Label>{getFieldLabel(key)}</Label>
          <Input value={value || ''} disabled className="bg-gray-100" />
        </div>
      );
    }

    if (key === 'password') {
      return (
        <div key={key}>
          <Label>{getFieldLabel(key)}</Label>
          <Input
            type="password"
            onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
          />
        </div>
      );
    }

    if (typeof value === 'boolean') {
      return (
        <div key={key}>
          <Label>{getFieldLabel(key)}</Label>
          <Select
            value={value ? 'true' : 'false'}
            onValueChange={(v) => setFormData({ ...formData, [key]: v === 'true' })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Yes</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
        </div>
      );
    }

    if (key === 'role') {
      return (
        <div key={key}>
          <Label>{getFieldLabel(key)}</Label>

          <Select
            value={value || ''}
            onValueChange={(v) =>
              setFormData({ ...formData, [key]: v })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>

            <SelectContent>
              {roles.map((role: any) => (
                <SelectItem key={role.external_id} value={role.external_id}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    if (key === 'wasteType') {
      return (
        <div key={key}>
          <Label>{getFieldLabel(key)}</Label>

          <Select
            value={value || ''}
            onValueChange={(v) =>
              setFormData({ ...formData, [key]: v })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Waste Type" />
            </SelectTrigger>

            <SelectContent>
              {wasteTypes.map((waste: any) => (
                <SelectItem key={waste.external_id} value={waste.external_id}>
                  {waste.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    if (key === 'images') {
  return (
    <div key={key}>
      <Label>{getFieldLabel(key)}</Label>

      {/* Upload input */}
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={(e: any) => {
          const files = Array.from(e.target.files);
          const imageUrls = files.map((file: any) =>
            URL.createObjectURL(file)
          );

          setFormData({
            ...formData,
            images: imageUrls,
            imageFiles: files, // keep actual files for upload
          });
        }}
        className="w-full border rounded p-2"
      />

      {/* Image Preview Grid */}
      {formData.images?.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mt-2">
          {formData.images.map((img: string, index: number) => (
            <div key={index} className="relative">
              <img
                src={img}
                alt="preview"
                className="w-full h-24 object-cover rounded"
              />

              {/* Remove Image */}
              <button
                type="button"
                onClick={() => {
                  const newImages = formData.images.filter(
                    (_: any, i: number) => i !== index
                  );
                  setFormData({ ...formData, images: newImages });
                }}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
    if (key === 'city') {
      return (
        <div key={key}>
          <Label>{getFieldLabel(key)}</Label>

          <Select
            value={formData.clusterId || ''}
            onValueChange={(v) =>
              setFormData({ ...formData, clusterId: v })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Street Cluster" />
            </SelectTrigger>

            <SelectContent>
              {(streetCluster || []).map((cluster: any) => (
                <SelectItem
                  key={cluster.external_id}
                  value={cluster.external_id}
                >
                  {cluster.area}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    if (key === 'status' || key === 'plan' || key === 'priority' || key === 'type' || key === 'channel') {
      return (
        <div key={key}>
          <Label>{getFieldLabel(key)}</Label>
          <Input
            value={value || ''}
            onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
          />
        </div>
      );
    }

    if (Array.isArray(value)) {
      return (
        <div key={key}>
          <Label>{getFieldLabel(key)}</Label>
          <Textarea
            value={JSON.stringify(value, null, 2)}
            onChange={(e) => {
              try {
                setFormData({ ...formData, [key]: JSON.parse(e.target.value) });
              } catch (error) {
                // Invalid JSON, keep as string
              }
            }}
            rows={3}
          />
        </div>
      );
    }

    if (typeof value === 'object' && value !== null) {
      return (
        <div key={key}>
          <Label>{getFieldLabel(key)}</Label>
          <Textarea
            value={JSON.stringify(value, null, 2)}
            onChange={(e) => {
              try {
                setFormData({ ...formData, [key]: JSON.parse(e.target.value) });
              } catch (error) {
                // Invalid JSON, keep as string
              }
            }}
            rows={3}
          />
        </div>
      );
    }

    if (typeof value === 'number') {
      return (
        <div key={key}>
          <Label>{getFieldLabel(key)}</Label>
          <Input
            type="number"
            value={value || 0}
            onChange={(e) => setFormData({ ...formData, [key]: parseFloat(e.target.value) || 0 })}
          />
        </div>
      );
    }

    // Default text input
    return (
      <div key={key}>
        <Label>{getFieldLabel(key)}</Label>
        <Input
          value={value || ''}
          onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
        />
      </div>
    );
  };

  const renderValue = (key: string, value: any) => {
  if (value === null || value === undefined) return '-';

  // Handle images
  if (key === 'images') {
    const imagesArray = value?.images || value;

    if (!Array.isArray(imagesArray) || imagesArray.length === 0) return '-';

    return (
      <div className="flex gap-2 flex-wrap">
        {imagesArray.map((img: string, index: number) => (
          <a key={index} href={img} target="_blank" rel="noopener noreferrer">
            <img
              src={img}
              alt="waste"
              className="w-16 h-16 object-cover rounded border hover:opacity-80"
            />
          </a>
        ))}
      </div>
    );
  }

  // Format timestamps
  if (
    key === 'created_at' ||
    key === 'updated_at' ||
    key === 'createdAt' ||
    key === 'updatedAt'
  ) {
    const date = new Date(value);
    return isNaN(date.getTime()) ? '-' : date.toLocaleString();
  }

  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return `[${value.length} items]`;
  if (typeof value === 'object') return JSON.stringify(value).substring(0, 50) + '...';
  if (typeof value === 'string' && value.length > 50) return value.substring(0, 50) + '...';

  return String(value);
};

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const columns = data.length > 0 ? Object.keys(data[0]) : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Badge variant="outline">
            {filteredData.length} record{filteredData.length !== 1 ? 's' : ''}
          </Badge>
        </div>
        <Button onClick={handleCreate} className="bg-purple-600 hover:bg-purple-700">
          <Plus className="size-4 mr-2" />
          Add New
        </Button>
      </div>

      {paginatedData.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No records found</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-gray-50">
                  {columns.map((col) => (
                    <th key={col} className="text-left p-3 text-sm font-medium">
                      {getFieldLabel(col)}
                    </th>
                  ))}
                  <th className="text-right p-3 text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((item, idx) => (
                  <tr key={item.id || idx} className="border-b hover:bg-gray-50">
                    {columns.map((col) => (
                      <td key={col} className="p-3 text-sm">
                        {renderValue(col, item[col])}
                      </td>
                    ))}
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(item)}
                        >
                          <Edit className="size-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(item)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length)} of {filteredData.length}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Edit/Create Modal */}
      {showEditModal && (
        <Dialog open onOpenChange={() => setShowEditModal(false)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedItem ? 'Edit Record' : 'Create New Record'}</DialogTitle>
              <DialogDescription>
                {selectedItem ? 'Update the record details' : 'Fill in the details to create a new record'}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.keys(formData).map((key) => renderField(key, formData[key]))}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className={`bg-purple-600 hover:bg-purple-700 w-full flex items-center justify-center`}
                disabled={loading}
              >
                {loading ? (
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    ></path>
                  </svg>
                ) : (
                  selectedItem ? "Update" : "Create"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

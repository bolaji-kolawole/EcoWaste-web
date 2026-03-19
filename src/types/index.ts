import { RecyclingCompany, WasteRequestService } from "../services/WasteRequestService";

export type UserRole = 'User' | 'Recycler' | 'Admin';

export type RequestStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';

export type WasteType = 'plastic' | 'paper' | 'glass' | 'metal' | 'electronics' | 'organic' | 'hazardous';

export type SubscriptionPlan = 'monthly' | 'quarterly' | 'yearly';

export type SubscriptionStatus = 'active' | 'expired' | 'cancelled';

export type PaymentStatus = 'pending' | 'successful' | 'failed';

export type Priority = 'normal' | 'urgent' | 'commercial';

export interface Role {
  name: string;
  external_id: string;
}

export interface User {
  rows?: any;
  id: string;
  external_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: any;
  address: string;
  points?: number;
  company?: RecyclingCompany;
  areas?: string[];
  createdAt: string;
}

export interface WasteRequest {
  id: string;
  userId: string;
  wasteType: WasteType;
  quantity: string;
  address?: Address;
  user?: User;
  description: string;
  images: string[];
  status: string;
  priority: 'normal' | 'urgent' | 'commercial';
  createdAt: string;
  assignedTo?: string;
  assignedAt?: string;
  completedAt?: string;
  qrCode: string;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  requestId?: string;
  clusterId?: string;
  createdAt: string;
}

export interface Subscription {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string;
  amount: number;
  createdAt: string;
}

export interface Payment {
  id: string;
  userId: string;
  subscriptionId: string;
  amount: number;
  status: PaymentStatus;
  paymentMethod: 'paystack' | 'flutterwave';
  reference: string;
  createdAt: string;
}

export interface StreetCluster {
  id: string;
  street: string;
  area: string;
  requestIds: string[];
  notifiedAt?: string;
  createdAt: string;
}

export interface Stats {
  totalRequests: number;
  pendingRequests: number;
  completedRequests: number;
  totalWasteCollected: number;
  wasteByType: Record<WasteType, number>;
  activeUsers: number;
  activeCompanies: number;
}

export interface Address {
  id: string;
  userId: string;
  street: string;
  area: string;
  city: string;
  state: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
  createdAt: string;
}

export interface SubscriptionPlanModel {
  id: string;
  name: SubscriptionPlan;
  description: string;
  price: number;
  duration: number; // in days
  features: string[];
  isActive: boolean;
  createdAt: string;
}

export interface WasteTypeModel {
  id: string;
  name: string;
  description: string;
  category: WasteType;
  recyclingRate?: number;
  isHazardous: boolean;
  createdAt: string;
}

// export interface RecyclingCompany {
//   id: string;
//   name: string;
//   email: string;
//   phone: string;
//   address: string;
//   registrationNumber: string;
//   isActive: boolean;
//   rating?: number;
//   totalPickups: number;
//   createdAt: string;
// }

export interface CompanyUser {
  id: string;
  userId: string;
  companyId: string;
  position: string;
  isActive: boolean;
  createdAt: string;
}

export interface RequestAssignment {
  id: string;
  requestId: string;
  companyId: string;
  assignedBy: string;
  assignedTo?: string; // Driver/Collector ID
  status: RequestStatus;
  assignedAt: string;
  completedAt?: string;
}

export interface RequestImage {
  id: string;
  requestId: string;
  imageUrl: string;
  description?: string;
  uploadedAt: string;
}

export interface WasteCollectionLog {
  id: string;
  requestId: string;
  companyId: string;
  collectorId: string;
  weightKg?: number;
  verificationCode: string;
  collectedAt: string;
  notes?: string;
}

export interface RecyclingReward {
  id: string;
  userId: string;
  totalPoints: number;
  currentTier: 'bronze' | 'silver' | 'gold' | 'platinum';
  lastUpdated: string;
}

export interface RewardTransaction {
  id: string;
  userId: string;
  points: number;
  type: 'earned' | 'redeemed';
  description: string;
  referenceId?: string;
  createdAt: string;
}

export interface Report {
  id: string;
  title: string;
  type: 'waste_collection' | 'recycling_rate' | 'company_performance' | 'environmental_impact';
  generatedBy: string;
  dateFrom: string;
  dateTo: string;
  data: any; // JSON data
  fileUrl?: string;
  createdAt: string;
}

export interface PickupSchedule {
  id: string;
  companyId: string;
  driverId: string;
  requestIds: string[];
  scheduledDate: string;
  startTime: string;
  endTime?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  routeOptimized: boolean;
  createdAt: string;
}

export interface NotificationLog {
  id: string;
  notificationId: string;
  channel: 'email' | 'sms' | 'push' | 'in_app';
  status: 'pending' | 'sent' | 'failed';
  sentAt?: string;
  error?: string;
}

export interface WasteRequest {
  id: string;
  userId: string;
  wasteType: WasteType;
  quantity: string;
  location: {
    address: string;
    latitude?: number;
    longitude?: number;
  };
  description: string;
  images: string[];
  status: string;
  priority: Priority;
  assignedTo?: string;
  qrCode: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  requestId?: string;
  clusterId?: string;
  createdAt: string;
}

export interface Subscription {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string;
  amount: number;
  createdAt: string;
}

export interface Payment {
  id: string;
  userId: string;
  subscriptionId: string;
  amount: number;
  status: PaymentStatus;
  paymentMethod: 'paystack' | 'flutterwave';
  reference: string;
  createdAt: string;
}

export interface StreetCluster {
  id: string;
  street: string;
  area: string;
  requestIds: string[];
  notifiedAt?: string;
  createdAt: string;
}

// Model names for Super Admin
export type ModelName = 
  | 'users'
  | 'roles'
  | 'user_roles'
  | 'addresses'
  | 'subscription_plans'
  | 'user_subscriptions'
  | 'payments'
  | 'waste_types'
  | 'waste_requests'
  | 'request_images'
  | 'request_assignments'
  | 'recycling_companies'
  | 'company_users'
  | 'pickup_schedules'
  | 'waste_collection_logs'
  | 'recycling_rewards'
  | 'reward_transactions'
  | 'street_clusters'
  | 'notifications'
  | 'notification_logs'
  | 'reports';

export interface ModelConfig {
  name: ModelName;
  displayName: string;
  icon: string;
  fields: FieldConfig[];
}

export interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'select' | 'date' | 'boolean' | 'textarea' | 'json';
  required?: boolean;
  options?: { value: string; label: string }[];
}
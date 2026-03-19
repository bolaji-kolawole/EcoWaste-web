import { RecyclingCompany } from '../services/WasteRequestService';
import { 
  User, 
  ModelName,
} from '../types';

const STORAGE_KEYS = {
  CURRENT_USER: 'wms_current_user',
};

// Storage helpers
export const storage = {
  getCurrentUser: (): User | null => {
    const user = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return user ? JSON.parse(user) : null;
  },

  setCurrentUser: (user: User | null) => {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  },


  // Generic getter/setter for any model
  getModel: (modelName: ModelName): any[] => {
    const key = Object.entries(STORAGE_KEYS).find(
      ([k, v]) => k.toLowerCase() === modelName.replace(/_/g, '')
    );
    if (!key) return [];
    const data = localStorage.getItem(key[1]);
    return data ? JSON.parse(data) : [];
  },

  setModel: (modelName: ModelName, data: any[]) => {
    const key = Object.entries(STORAGE_KEYS).find(
      ([k, v]) => k.toLowerCase() === modelName.replace(/_/g, '')
    );
    if (key) {
      localStorage.setItem(key[1], JSON.stringify(data));
    }
  },
};

// Calculate days since date
export const daysSince = (dateString: string): number => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

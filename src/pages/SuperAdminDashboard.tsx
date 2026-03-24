import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import {
    Database,
    LogOut,
    Users,
    Shield,
    MapPin,
    CreditCard,
    Package,
    Image,
    Truck,
    Award,
    FileText,
    Calendar,
    Bell,
    Search,
    Plus,
    Edit,
    Trash2,
    Download,
    Upload,
    Map,
    Building2,
    UserCog,
} from 'lucide-react';
import { storage } from '../utils/storage';
import { ModelName } from '../types';
import { toast } from 'sonner';
import DataTableManager from '../components/DataTableManager';
import { getAddresses, getRoles, getUsers, getUserSubscriptions, getPayments, getWasteTypes, getWasteRequests, getRecyclingCompanies } from "../services/adminHelper";
import { CacheManager } from '../utils/CacheManager';
import { SuperAdminService } from '../services/SuperAdminService';
const adminApi = SuperAdminService.getInstance();

const MODEL_CONFIGS = [
    {
        name: 'users' as ModelName,
        displayName: 'Users',
        icon: 'Users',
        description: 'System users (Citizens, Recyclers, Admins)',
    },
    {
        name: 'roles' as ModelName,
        displayName: 'Roles',
        icon: 'Shield',
        description: 'Roles and permissions',
    },
    {
        name: 'user_roles' as ModelName,
        displayName: 'User Roles',
        icon: 'Shield',
        description: 'User roles',
    },
    {
        name: 'addresses' as ModelName,
        displayName: 'Addresses',
        icon: 'MapPin',
        description: 'User addresses',
    },
    {
        name: 'subscription_plans' as ModelName,
        displayName: 'Subscription Plans',
        icon: 'CreditCard',
        description: 'Available subscription plans',
    },
    {
        name: 'user_subscriptions' as ModelName,
        displayName: 'User Subscriptions',
        icon: 'CreditCard',
        description: 'Active user subscriptions',
    },
    {
        name: 'payments' as ModelName,
        displayName: 'Payments',
        icon: 'CreditCard',
        description: 'Payment transactions',
    },
    {
        name: 'waste_types' as ModelName,
        displayName: 'Waste Types',
        icon: 'Package',
        description: 'Waste categories',
    },
    {
        name: 'waste_requests' as ModelName,
        displayName: 'Waste Requests',
        icon: 'Package',
        description: 'Pickup requests',
    },
    {
        name: 'request_images' as ModelName,
        displayName: 'Request Images',
        icon: 'Image',
        description: 'Uploaded waste images',
    },
    {
        name: 'request_assignments' as ModelName,
        displayName: 'Request Assignments',
        icon: 'Truck',
        description: 'Request assignments to companies',
    },
    {
        name: 'recycling_companies' as ModelName,
        displayName: 'Recycling Companies',
        icon: 'Building2',
        description: 'Registered recycling companies',
    },
    {
        name: 'company_users' as ModelName,
        displayName: 'Company Users',
        icon: 'UserCog',
        description: 'Company staff members',
    },
    {
        name: 'pickup_schedules' as ModelName,
        displayName: 'Pickup Schedules',
        icon: 'Calendar',
        description: 'Scheduled pickups',
    },
    {
        name: 'waste_collection_logs' as ModelName,
        displayName: 'Collection Logs',
        icon: 'FileText',
        description: 'Waste collection records',
    },
    {
        name: 'recycling_rewards' as ModelName,
        displayName: 'Recycling Rewards',
        icon: 'Award',
        description: 'User reward balances',
    },
    {
        name: 'reward_transactions' as ModelName,
        displayName: 'Reward Transactions',
        icon: 'Award',
        description: 'Reward points history',
    },
    {
        name: 'street_clusters' as ModelName,
        displayName: 'Street Clusters',
        icon: 'Map',
        description: 'Grouped requests by street',
    },
    {
        name: 'notifications' as ModelName,
        displayName: 'Notifications',
        icon: 'Bell',
        description: 'System notifications',
    },
    {
        name: 'notification_logs' as ModelName,
        displayName: 'Notification Logs',
        icon: 'Bell',
        description: 'Notification delivery logs',
    },
    {
        name: 'reports' as ModelName,
        displayName: 'Reports',
        icon: 'FileText',
        description: 'Generated reports',
    },
    {
        name: 'public_reports' as ModelName,
        displayName: 'Public Reports',
        icon: 'FileText',
        description: 'Reports submitted by the public',
    },
];

const ICON_MAP: Record<string, any> = {
    Users,
    Shield,
    MapPin,
    CreditCard,
    Package,
    Image,
    Truck,
    Award,
    FileText,
    Calendar,
    Bell,
    Map,
    Building2,
    UserCog,
};

export default function SuperAdminDashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState(storage.getCurrentUser());
    const [selectedModel, setSelectedModel] = useState<ModelName>('users');
    const [searchTerm, setSearchTerm] = useState('');
    const [modelCounts, setModelCounts] = useState<Record<string, number>>({});
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalRequests: 0,
        totalCompanies: 0,
        totalSubscriptions: 0,
    });

    useEffect(() => {
        if (!user || user?.role?.name !== 'Admin') {
            navigate('/');
            return;
        }
        loadStats();
        loadCounts();

    }, [user, navigate]);

    const getTotal = async (model: string) => {
        const res = await adminApi.getModelRecords(model);
        return res.data?.data?.length || 0;
    };

    const loadStats = async () => {
        try {
            const [
                totalUsers,
                totalRequests,
                totalCompanies,
                totalSubscriptions,
            ] = await Promise.all([
                getTotal("users"),
                getTotal("waste_requests"),
                getTotal("recycling_companies"),
                getTotal("user_subscriptions"),
            ]);

            setStats({
                totalUsers,
                totalRequests,
                totalCompanies,
                totalSubscriptions,
            });
        } catch (error) {
            console.error(error);
            toast.error("Failed to load dashboard stats");
        }
    };

    const loadCounts = async () => {
        try {
            const results = await Promise.all(
                MODEL_CONFIGS.map((model) =>
                    adminApi.getModelRecords(model.name)
                )
            );
            const counts: Record<string, number> = {};
            MODEL_CONFIGS.forEach((model, index) => {
                counts[model.name] = results[index].data?.data?.length || 0;
            });

            setModelCounts(counts);
        } catch (err) {
            console.error(err);
        }
    };

    const handleLogout = () => {
        storage.setCurrentUser(null);
        CacheManager.clear();
        toast.success('Logged out successfully');
        navigate('/');
    };

    const handleExportData = async () => {
        try {
            const dataEntries = await Promise.all(
                MODEL_CONFIGS.map(async (model) => {
                    try {
                        // Assuming your API can fetch all data
                        const res = await adminApi.getModelRecords(model.name, {
                            page: 1,
                            size: 10000, // large enough to fetch all (or handle pagination separately)
                        });

                        return [model.name, res.data?.data || []];
                    } catch (err) {
                        console.error(`Failed to fetch ${model.name}`, err);
                        return [model.name, []];
                    }
                })
            );

            const allData = Object.fromEntries(dataEntries);

            allData.exported_at = new Date().toISOString();

            const blob = new Blob([JSON.stringify(allData, null, 2)], {
                type: "application/json",
            });

            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");

            a.href = url;
            a.download = `wms-database-export-${Date.now()}.json`;
            a.click();

            URL.revokeObjectURL(url);

            toast.success("Database exported successfully");
        } catch (error) {
            console.error(error);
            toast.error("Failed to export data");
        }
    };


    const filteredModels = MODEL_CONFIGS.filter((model) =>
        model.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        model.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-gradient-to-r from-purple-600 to-purple-800 text-white border-b sticky top-0 z-10 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                                <Database className="size-6" />
                            </div>
                            <div>
                                <h1 className="text-xl font-semibold">Super Admin Dashboard</h1>
                                <p className="text-sm text-purple-100">Database Management Portal</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                                onClick={handleExportData}
                            >
                                <Download className="size-4 mr-2" />
                                Export DB
                            </Button>

                            <Button
                                variant="outline"
                                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                                onClick={handleLogout}
                            >
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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm">Total Users</CardTitle>
                            <Users className="size-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalUsers}</div>
                            <p className="text-xs text-muted-foreground mt-1">Registered accounts</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm">Total Requests</CardTitle>
                            <Package className="size-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalRequests}</div>
                            <p className="text-xs text-muted-foreground mt-1">Pickup requests</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm">Companies</CardTitle>
                            <Building2 className="size-4 text-purple-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalCompanies}</div>
                            <p className="text-xs text-muted-foreground mt-1">Recycling companies</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm">Active Subscriptions</CardTitle>
                            <CreditCard className="size-4 text-orange-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalSubscriptions}</div>
                            <p className="text-xs text-muted-foreground mt-1">Current subscribers</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Database Models */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Database Models</CardTitle>
                                <CardDescription>Manage all database tables and records</CardDescription>
                            </div>
                            <Badge variant="outline" className="text-purple-600 border-purple-600">
                                {MODEL_CONFIGS.length} Tables
                            </Badge>
                        </div>
                        <div className="mt-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search models..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
                            {filteredModels.map((model) => {
                                const IconComponent = ICON_MAP[model.icon];
                                const count = modelCounts[model.name] || 0;
                                const isSelected = selectedModel === model.name;

                                return (
                                    <Card
                                        key={model.name}
                                        className={`cursor-pointer transition-all hover:shadow-md ${isSelected ? "border-purple-600 ring-2 ring-purple-600" : ""
                                            }`}
                                        onClick={() => setSelectedModel(model.name)}
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="bg-purple-100 p-2 rounded-lg">
                                                    {IconComponent && (
                                                        <IconComponent className="size-5 text-purple-600" />
                                                    )}
                                                </div>

                                                <Badge variant="secondary">{count}</Badge>
                                            </div>

                                            <h3 className="font-medium mb-1">{model.displayName}</h3>

                                            <p className="text-xs text-muted-foreground">
                                                {model.description}
                                            </p>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>

                        {/* Data Table */}
                        {selectedModel && (
                            <div className="mt-6 border-t pt-6">
                                <DataTableManager modelName={selectedModel} onUpdate={loadStats} />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}

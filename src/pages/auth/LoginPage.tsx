/// <reference types="vite/client" />
import { useEffect, useLayoutEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import axios from "axios";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Recycle } from 'lucide-react';
import { toast } from 'sonner';
import { UserService } from '../../services/UserService';
import { RoleService } from '../../services/RoleService';
import { CacheManager } from '../../utils/CacheManager';
import { storage } from '../../utils/storage';
import PublicReportModal from '../../components/PublicReportModal';

const roleService = RoleService.getInstance();
const userService = UserService.getInstance();

const API_URL = import.meta.env.VITE_API_URL;
export interface Role {
  name: string;
  external_id: string;
}

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roles, setRoles] = useState<Role[]>([]);
  const [role, setRole] = useState<string>("");
  const [showPublicReport, setShowPublicReport] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchRoles = async () => {
    try {
      const fetched = (await roleService.queryRoles()).sanitized;
      const roleList: Role[] = fetched.content;

      setRoles(roleList);

      // Select first role automatically
      if (roleList.length > 0) {
        setRole(roleList[0].external_id);
      }

    } catch (error) {
      console.error(error);
      toast.error("Failed to load roles");
    }
  };

  const roleRoutes: Record<string, string> = {
    "User": "/user",
    "Recycler": "/recycler",
    "Admin": "/admin"
  };


  const handleLogin = async () => {
    if (!email) return toast.error("Please enter your email");
    if (!password) return toast.error("Please enter your password");
    if (!role) return toast.error("Please select a role");

    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
        roleId: role
      });

      const loginUser = response.data;

      // ✅ Handle backend errors even if HTTP 200
      if (!loginUser.success) {
        return toast.error(loginUser.message || loginUser.data?.[0] || "Login failed");
      }

      const res = loginUser.data;
      const token = res?.access_token;

      if (!token) {
        return toast.error("Login failed: no token returned");
      }

      // Save token
      CacheManager.insecurePut(CacheManager.ACCESS_TOKEN_KEY, token);

      // Fetch user
      const user = (await userService.queryUser()).sanitized;

      const selectedRole = roles.find(r => r.external_id === role);
      const userWithRole = { ...user, role: selectedRole };

      storage.setCurrentUser(userWithRole);

      toast.success("Welcome back!");

      setLoading(false);
      const route = roleRoutes[selectedRole?.name ?? ""] || "/";
      navigate(route);

    } catch (error: any) {
      console.error("Login error:", error);

      // Axios error handling
      const message =
        error?.response?.data?.message ||   // backend error message
        (error?.response?.data?.errors && error.response.data.errors[0]) ||
        error?.message ||
        "Login failed";

      toast.error(message);
    }
    finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkLogin = async () => {
      const token = CacheManager.get(CacheManager.ACCESS_TOKEN_KEY);

      if (!token) {
        await fetchRoles();
        return;
      }

      try {
        const user = storage.getCurrentUser();

        if (!user) {
          await fetchRoles();
          return;
        }

        const roleRoutes: Record<string, string> = {
          User: "/user",
          Recycler: "/recycler",
          Admin: "/admin",
        };

        const targetRoute = roleRoutes[user.role?.name ?? ""] || "/";

        if (location.pathname !== targetRoute) {
          navigate(targetRoute, { replace: true });
        }

      } catch (error) {
        console.error(error);
        await fetchRoles();
      }
    };

    checkLogin();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4 relative">
      {/* Top Right Button */}
      <Button
        onClick={() => setShowPublicReport(true)}
        className="absolute top-4 right-4 bg-yellow-600 hover:bg-yellow-700"
      >
        Report Waste
      </Button>
      <Card className="w-full max-w-md shadow-xl">

        <CardHeader className="text-center space-y-2">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-green-600 p-3 rounded-full">
              <Recycle className="size-8 text-white" />
            </div>
          </div>

          <CardTitle className="text-3xl">EcoWaste</CardTitle>
          <CardDescription>
            Sign in to manage waste collection and recycling
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">

          <div className="space-y-4">

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>

              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>

              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label htmlFor="role">Login As</Label>

              <Select value={role} onValueChange={(value: string) => setRole(value)}>

                <SelectTrigger id="role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>

                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem
                      key={r.external_id}
                      value={r.external_id}
                    >
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>

              </Select>
            </div>

            <Button
              onClick={handleLogin}
              className={`w-full text-white font-semibold ${loading ? "bg-green-200 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
                }`}
              disabled={loading}
            >
              {loading ? "Signing In..." : "Sign In"}
            </Button>

            {/* Register */}
            <div className="text-center text-sm">
              Doesn't have an account?{" "}
              <button
                onClick={() => navigate("/register")}
                className="text-green-600 hover:underline"
              >
                Register
              </button>
            </div>

          </div>

        </CardContent>

      </Card>

      {
        showPublicReport && (
          <PublicReportModal
            onClose={() => setShowPublicReport(false)} />
        )
      }
    </div>
  );
}
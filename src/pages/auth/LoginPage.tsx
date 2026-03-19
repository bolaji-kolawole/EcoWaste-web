import { useEffect, useLayoutEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Recycle } from 'lucide-react';
import { toast } from 'sonner';
import { UserService } from '../../services/UserService';
import { RoleService } from '../../services/RoleService';
import { CacheManager } from '../../utils/CacheManager';
import { storage } from '../../utils/storage';
import PublicReportModal from '../../components/PublicReportModal';

const userService = UserService.getInstance();
const roleService = RoleService.getInstance();

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
  const [showPublicReport, setShowPublicReport] = useState<boolean>(false)

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
    const loginUser = await userService.login({
      email,
      password,
      roleId: role
    });

    const res = loginUser.sanitized;
    const token = res.access_token;
    CacheManager.insecurePut(CacheManager.ACCESS_TOKEN_KEY, token);

    const user = (await userService.queryUser()).sanitized;

    const selectedRole = roles.find(r => r.external_id === role);

    const userWithRole = { ...user, role: selectedRole };

    storage.setCurrentUser(userWithRole);

    toast.success("Welcome back!");

    const route = roleRoutes[selectedRole?.name ?? ""] || "/";
    navigate(route);

  } catch (error: any) {
    console.error(error);
    toast.error(error.message || "Login failed");
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
}, [navigate, fetchRoles]);

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

            {/* Login Button */}
            <Button
              onClick={handleLogin}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Sign In
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
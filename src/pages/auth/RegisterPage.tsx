import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Recycle } from "lucide-react";
import { toast } from "sonner";
import { UserService } from '../../services/UserService';
import { Role, RoleService } from '../../services/RoleService';
import PublicReportModal from "../../components/PublicReportModal";

const userService = UserService.getInstance();
const roleService = RoleService.getInstance();

export default function RegisterPage() {
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

  useEffect(() => {
    fetchRoles()
  }, [])

  const handleRegister = async () => {
    if (!firstName || !lastName || !email || !password || !role) {
      toast.error("Please fill in all fields");
      return;
    }

    const newUser = {
      first_name: firstName,
      last_name: lastName,
      email,
      password,
    };
    setLoading(true);

    try {

      const { sanitized: user } = await userService.signup(newUser);

      const newUserRole = {
        user_id: user.external_id,
        role_id: role
      }
      await roleService.createUserRole(newUserRole)
      toast.success("Account created successfully!");
      navigate('/')
    } catch (error: any) {

      toast.error(
        error?.response?.data?.message || "Signup failed"
      );

    } finally {
      setLoading(false);
    }
  }

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
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="bg-green-600 p-3 rounded-full">
              <Recycle className="size-8 text-white" />
            </div>
          </div>

          <CardTitle className="text-3xl">EcoWaste</CardTitle>

          <CardDescription>
            Create an account to start recycling
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-4">

            <div className="space-y-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                placeholder="Enter your First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                placeholder="Enter your Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>

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
              <Label htmlFor="role">Register As</Label>
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
              onClick={handleRegister}
              className={`w-full text-white font-semibold ${loading ? "bg-green-200 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
                }`}
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Create Account"}
            </Button>
          </div>

          {/* Login Link */}
          <div className="text-center text-sm">
            Already have an account?{" "}
            <button
              onClick={() => navigate("/")}
              className="text-green-600 hover:underline"
            >
              Sign In
            </button>
          </div>
        </CardContent>
      </Card>

      {showPublicReport && (
        <PublicReportModal
          onClose={() => setShowPublicReport(false)} />
      )}
    </div>
  );
}
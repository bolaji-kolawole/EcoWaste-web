import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL;

export default function VerifyEmailPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [status, setStatus] = useState("Verifying...");
  const [email, setEmail] = useState("");
  const [canResend, setCanResend] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Cooldown countdown
  useEffect(() => {
    if (cooldown <= 0) return;

    const interval = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldown]);

  // Verify email token
  useEffect(() => {
    if (!token) return;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    fetch(`${API_URL}/auth/verify-email/${token}`, {
      signal: controller.signal,
    })
      .then(async (res) => {
        const data = await res.json();

        if (res.ok) {
          setStatus("Email verified successfully!");
          toast.success(data.message);

          // Auto redirect after 2s
          setTimeout(() => navigate("/"), 2000);
        } else {
          // Handle specific backend messages if available
          if (data.code === "TOKEN_EXPIRED") {
            setStatus("Verification link expired");
          } else if (data.code === "INVALID_TOKEN") {
            setStatus("Invalid verification link");
          } else {
            setStatus("Verification failed");
          }

          toast.error(data.message);

          if (data.email) setEmail(data.email);
          setCanResend(true);
        }
      })
      .catch((err) => {
        if (err.name === "AbortError") {
          toast.error("Request timed out. Please try again.");
        } else {
          console.error(err);
          toast.error("Verification failed. Try again.");
        }

        setStatus("Verification failed");
        setCanResend(true);
      })
      .finally(() => clearTimeout(timeout));
  }, [token, navigate]);

  // Resend verification email
  const handleResend = async () => {
    if (!email) {
      toast.error("Please enter your email.");
      return;
    }

    if (cooldown > 0) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Verification email resent! Check your inbox.");
        setCooldown(30); // 30s cooldown
      } else {
        toast.error(data.message || "Failed to resend verification email");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to resend verification email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl">EcoWaste</CardTitle>
          <CardDescription>{status}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {status === "Email verified successfully!" ? (
            <div className="text-center space-y-4">
              <p>Your email has been verified. You can now log in.</p>
              <Button
                onClick={() => navigate("/")}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
              >
                Go to Login
              </Button>
            </div>
          ) : canResend ? (
            <div className="space-y-4">
              <p>Didn't receive the email? Enter your email to resend:</p>

              <div className="space-y-2">
                <Label htmlFor="resend_email">Email</Label>
                <Input
                  id="resend_email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <Button
                onClick={handleResend}
                disabled={loading || cooldown > 0}
                className={`w-full text-white font-semibold ${
                  loading || cooldown > 0
                    ? "bg-green-200 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {loading
                  ? "Resending..."
                  : cooldown > 0
                  ? `Retry in ${cooldown}s`
                  : "Resend Verification Email"}
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
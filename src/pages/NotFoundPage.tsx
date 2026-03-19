import { useNavigate } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Leaf } from "lucide-react";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl text-center">
        <CardHeader>
          <CardTitle className="text-6xl font-extrabold text-green-600">404</CardTitle>
          <CardDescription className="text-lg text-gray-600 mt-2">
            Page Not Found
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-gray-700">
            Oops! The page you're looking for does not exist or has been moved.
          </p>

          <Button
            onClick={() => navigate("/")}
            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700"
          >
            <Leaf className="size-4" />
            Go Back Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
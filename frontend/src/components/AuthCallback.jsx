import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Loader2 } from "lucide-react";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { fetchUser } = useAuth();
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    async function handleCallback() {
      const token = searchParams.get("token");

      if (token) {
        localStorage.setItem("token", token);
        const success = await fetchUser();
        if (success) {
          // Check if user has a watched folder, if not redirect to folder picker
          try {
            const res = await (await import("../api/client")).default.get("/api/auth/me");
            if (!res.data.watched_folder_id) {
              navigate("/select-folder", { replace: true });
              return;
            }
          } catch {}
          navigate("/dashboard", { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      } else {
        navigate("/", { replace: true });
      }
    }

    handleCallback();
  }, [searchParams, fetchUser, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 text-red-600 animate-spin" />
        <p className="text-gray-600 text-sm">Signing you in...</p>
      </div>
    </div>
  );
}

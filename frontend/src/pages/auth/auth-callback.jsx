import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAppDispatch } from "@/app/hook";
import { setCredentials } from "@/features/auth/authSlice";
import { toast } from "sonner";
import { PROTECTED_ROUTES } from "@/routes/common/routePath";
import { Loader } from "lucide-react";
const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  useEffect(() => {
    const token = searchParams.get("token");
    const expiresAt = searchParams.get("expiresAt");
    const error = searchParams.get("error");
    if (error) {
      toast.error("Authentication failed. Please try again.");
      navigate("/");
      return;
    }
    if (token && expiresAt) {
      fetch(`${import.meta.env.VITE_API_URL}/user/current-user`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }).then((response) => response.json()).then((data) => {
        dispatch(
          setCredentials({
            accessToken: token,
            expiresAt,
            user: data.user,
            reportSetting: data.reportSetting
          })
        );
        toast.success("Login successful");
        navigate(PROTECTED_ROUTES.OVERVIEW);
      }).catch(() => {
        toast.error("Failed to authenticate. Please try again.");
        navigate("/");
      });
    } else {
      toast.error("Authentication failed. Please try again.");
      navigate("/");
    }
  }, [searchParams, navigate, dispatch]);
  return <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Completing authentication...</p>
      </div>
    </div>;
};
var stdin_default = AuthCallback;
export {
  stdin_default as default
};

import { useTypedSelector } from "@/app/hook";
import { Navigate, Outlet } from "react-router-dom";
import { AUTH_ROUTES } from "./common/routePath";
const ProtectedRoute = () => {
  const { accessToken, user } = useTypedSelector((state) => state.auth);
  if (accessToken && user) return <Outlet />;
  return <Navigate to={AUTH_ROUTES.SIGN_IN} replace />;
};
var stdin_default = ProtectedRoute;
export {
  stdin_default as default
};

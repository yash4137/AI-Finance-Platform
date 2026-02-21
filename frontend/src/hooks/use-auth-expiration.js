import { useEffect } from "react";
import { useAppDispatch, useTypedSelector } from "@/app/hook";
import { logout, updateCredentials } from "@/features/auth/authSlice";
import { useRefreshMutation } from "@/features/auth/authAPI";
const useAuthExpiration = () => {
  const {
    accessToken,
    expiresAt
  } = useTypedSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const [refreshToken] = useRefreshMutation();
  useEffect(() => {
    const handleLogout = () => {
      console.log("Token expired, logging out...");
      dispatch(logout());
    };
    const handleTokenRefresh = async () => {
      try {
        const { accessToken: accessToken2, expiresAt: expiresAt2 } = await refreshToken({}).unwrap();
        dispatch(updateCredentials({ accessToken: accessToken2, expiresAt: expiresAt2 }));
        console.log("Token refreshed successfully");
      } catch (error) {
        console.error("Token refresh failed, logging out...", error);
        handleLogout();
      }
    };
    if (accessToken && expiresAt) {
      const currentTime = Date.now();
      const timeUntilExpiration = expiresAt - currentTime;
      if (timeUntilExpiration <= 0) {
        handleTokenRefresh();
      } else {
        const timer = setTimeout(handleLogout, timeUntilExpiration);
        return () => clearTimeout(timer);
      }
    }
  }, [accessToken, dispatch, expiresAt, refreshToken]);
};
var stdin_default = useAuthExpiration;
export {
  stdin_default as default
};

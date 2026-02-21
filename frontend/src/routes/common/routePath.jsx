const isAuthRoute = (pathname) => {
  return Object.values(AUTH_ROUTES).includes(pathname);
};
const AUTH_ROUTES = {
  SIGN_IN: "/",
  SIGN_UP: "/sign-up",
  AUTH_CALLBACK: "/auth/callback"
};
const PROTECTED_ROUTES = {
  OVERVIEW: "/overview",
  TRANSACTIONS: "/transactions",
  REPORTS: "/reports",
  SETTINGS: "/settings",
  SETTINGS_APPEARANCE: "/settings/appearance",
  SETTINGS_BILLING: "/settings/billing"
};
export {
  AUTH_ROUTES,
  PROTECTED_ROUTES,
  isAuthRoute
};

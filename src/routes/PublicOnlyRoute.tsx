import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";

export default function PublicOnlyRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const storedToken =
    localStorage.getItem("auth_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken");
  const isAlreadyAuthenticated = Boolean(
    isAuthenticated || (storedToken && storedToken.length > 10)
  );

  if (isLoading) {
    return null;
  }

  if (isAlreadyAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

import { Navigate } from "react-router-dom";

export default function PrivateRoute({ children, roleRequired }) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  // ✅ Se não tem token, redireciona para login
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // ✅ Se especificou uma role e não corresponde, redireciona
  if (roleRequired && role !== roleRequired) {
    if (role === "user") return <Navigate to="/solicitacao" replace />;
    if (role === "admin") return <Navigate to="/dashboard" replace />;
    return <Navigate to="/" replace />; // fallback
  }

  // ✅ Token válido, renderiza o componente
  return children;
}

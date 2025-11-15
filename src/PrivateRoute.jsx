import { Navigate } from "react-router-dom";

export default function PrivateRoute({ children, roleRequired }) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token) return <Navigate to="/" replace />; // não logado

  // Se roleRequired estiver definido e for diferente do role do usuário
  if (roleRequired && role !== roleRequired) {
    if (role === "user") return <Navigate to="/solicitacao" replace />;
    if (role === "admin") return <Navigate to="/dashboard" replace />;
    return <Navigate to="/" replace />; // fallback
  }

  return children;
}

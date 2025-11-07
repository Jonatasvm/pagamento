import { Navigate } from "react-router-dom";

export default function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  // Se não estiver logado → vai pro login
  if (!token) return <Navigate to="/" replace />;

  // Se estiver logado mas não for admin → vai para tela de usuário
  if (role !== "admin") return <Navigate to="/" replace />;

  // Admin pode acessar
  return children;
}

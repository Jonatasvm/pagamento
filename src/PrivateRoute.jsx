import { Navigate } from "react-router-dom";

export default function PrivateRoute({ children, roleRequired }) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  // ✅ Se não tem token, redireciona para login
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // ✅ Se especificou uma role e não corresponde, redireciona
  // financeiro tem acesso às mesmas rotas que admin
  if (roleRequired && role !== roleRequired) {
    // financeiro pode acessar rotas de admin
    if (roleRequired === "admin" && role === "financeiro") {
      return children;
    }
    if (role === "user") return <Navigate to="/solicitacao" replace />;
    if (role === "admin" || role === "financeiro") return <Navigate to="/dashboard" replace />;
    return <Navigate to="/" replace />; // fallback
  }

  // ✅ Token válido, renderiza o componente
  return children;
}

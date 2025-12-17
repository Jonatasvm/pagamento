import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";

export default function Login() {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isAutoLogging, setIsAutoLogging] = useState(false);

  const API_URL = "http://91.98.132.210:5631";

  // ✅ Auto-login ao montar o componente
  useEffect(() => {
    const savedUsuario = localStorage.getItem("savedUsuario");
    const savedPassword = localStorage.getItem("savedPassword");
    const token = localStorage.getItem("token");

    // Se já tem token válido, redireciona
    if (token) {
      redirectUser();
      return;
    }

    // Se tem credenciais salvas, faz auto-login
    if (savedUsuario && savedPassword) {
      setUsuario(savedUsuario);
      setPassword(savedPassword);
      setRememberMe(true);
      setIsAutoLogging(true);
      
      // Faz login automático
      autoLogin(savedUsuario, savedPassword);
    }
  }, []);

  // ✅ Função para fazer auto-login
  const autoLogin = async (usr, pwd) => {
    try {
      const res = await axios.post(`${API_URL}/login`, {
        usuario: usr,
        password: pwd,
      });

      // Armazena dados do usuário
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);
      localStorage.setItem("user_id", res.data.id);
      localStorage.setItem("usuario", res.data.usuario);

      toast.success("Login automático realizado!");
      redirectUser(res.data.role);
    } catch (err) {
      console.error("Auto-login falhou:", err);
      // Limpa credenciais inválidas
      localStorage.removeItem("savedUsuario");
      localStorage.removeItem("savedPassword");
      setIsAutoLogging(false);
      toast.error("Credenciais salvas inválidas. Faça login novamente.");
    }
  };

  // ✅ Função para redirecionar após login
  const redirectUser = (role = null) => {
    const userRole = role || localStorage.getItem("role");
    setTimeout(() => {
      if (userRole === "admin") {
        window.location.href = "/dashboard";
      } else {
        window.location.href = "/solicitacao";
      }
    }, 500);
  };

  // ✅ Função de login manual
  async function handleLogin(e) {
    e.preventDefault();

    if (!usuario.trim() || !password.trim()) {
      toast.error("Preencha usuário e senha");
      return;
    }

    try {
      const res = await axios.post(`${API_URL}/login`, {
        usuario,
        password,
      });

      // Armazena dados do usuário
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);
      localStorage.setItem("user_id", res.data.id);
      localStorage.setItem("usuario", res.data.usuario);

      // ✅ Se "Lembrar senha" foi marcado, salva as credenciais
      if (rememberMe) {
        localStorage.setItem("savedUsuario", usuario);
        localStorage.setItem("savedPassword", password);
      } else {
        // Se desmarcou, remove as credenciais salvas
        localStorage.removeItem("savedUsuario");
        localStorage.removeItem("savedPassword");
      }

      toast.success("Login realizado com sucesso!");
      redirectUser(res.data.role);
    } catch (err) {
      if (err.response?.data?.error) {
        toast.error(err.response.data.error);
      } else {
        toast.error("Erro ao conectar com o servidor.");
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm">
        <h1 className="text-3xl font-extrabold text-center text-gray-800 mb-2">
          🔐 Entrar
        </h1>
        <p className="text-center text-gray-500 text-sm mb-6">
          Acesse sua conta para continuar
        </p>

        {isAutoLogging && (
          <div className="mb-4 p-3 bg-blue-100 text-blue-700 rounded-lg text-sm text-center">
            ⏳ Entrando automaticamente...
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">
              Usuário
            </label>
            <input
              type="text"
              placeholder="Seu usuário"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              required
              disabled={isAutoLogging}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">
              Senha
            </label>
            <input
              type="password"
              placeholder="Sua senha"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isAutoLogging}
            />
          </div>

          {/* ✅ Checkbox "Lembrar senha" */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={isAutoLogging}
              className="w-4 h-4 rounded cursor-pointer"
            />
            <span className="text-sm text-gray-700">Lembrar minha senha</span>
          </label>

          <button
            type="submit"
            disabled={isAutoLogging}
            className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-400 transition text-white 
                       py-2.5 rounded-lg font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            {isAutoLogging ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}

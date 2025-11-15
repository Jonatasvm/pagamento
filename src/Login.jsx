import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

export default function Login() {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");

  const API_URL = "http://127.0.0.1:80";

  async function handleLogin(e) {
    e.preventDefault();

    try {
      const res = await axios.post(`${API_URL}/login`, {
        usuario,
        password,
      });

      // 🔥 Armazena dados do usuário
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);
      localStorage.setItem("user_id", res.data.id);
      localStorage.setItem("usuario", res.data.usuario);

      toast.success("Login realizado com sucesso!");

      setTimeout(() => {
        if (res.data.role === "admin") {
          window.location.href = "/dashboard";
        } else {
          window.location.href = "/solicitacao";
        }
      }, 800);
    } catch (err) {
      if (err.response?.data?.error) {
        toast.error(err.response.data.error);
      } else {
        toast.error("Erro ao conectar com o servidor.");
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">
        <h1 className="text-2xl font-extrabold text-center text-gray-800 mb-6">
          Entrar na Conta
        </h1>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Seu usuário"
            className="border border-gray-300 rounded-lg px-4 py-2 
                       focus:ring-2 focus:ring-blue-600 outline-none"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Sua senha"
            className="border border-gray-300 rounded-lg px-4 py-2 
                       focus:ring-2 focus:ring-blue-600 outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 transition text-white 
                       py-2 rounded-lg font-semibold shadow"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}

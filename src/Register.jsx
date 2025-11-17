import { useState } from "react";
import toast from "react-hot-toast";
import { register } from "./apiService";

export default function Register() {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("user");
  const [isLoading, setIsLoading] = useState(false);

  async function handleRegister(e) {
    e.preventDefault();
    setIsLoading(true);

    if (!usuario.trim() || !password.trim()) {
      toast.error("Usuário e senha não podem ser vazios.");
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      setIsLoading(false);
      return;
    }

    try {
      await register(usuario, password, role);
      toast.success("Usuário criado com sucesso! Redirecionando para login...");

      setTimeout(() => {
        window.location.href = "/login";
      }, 1500);
    } catch (err) {
      toast.error("Erro ao registrar usuário.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">
        <h1 className="text-2xl font-extrabold text-center text-gray-800 mb-6">
          Criar Conta
        </h1>

        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Nome de usuário"
            className="border border-gray-300 rounded-lg px-4 py-2 
                       focus:ring-2 focus:ring-blue-600 outline-none"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Senha"
            className="border border-gray-300 rounded-lg px-4 py-2 
                       focus:ring-2 focus:ring-blue-600 outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Confirme a senha"
            className="border border-gray-300 rounded-lg px-4 py-2 
                       focus:ring-2 focus:ring-blue-600 outline-none"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 
                       focus:ring-2 focus:ring-blue-600 outline-none bg-white"
          >
            <option value="user">Usuário</option>
            <option value="admin">Administrador</option>
          </select>

          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 transition text-white 
                       py-2 rounded-lg font-semibold shadow disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? "Criando..." : "Criar Conta"}
          </button>

          <p className="text-center text-sm text-gray-600">
            Já tem conta?{" "}
            <a
              href="/login"
              className="text-blue-600 hover:underline font-semibold"
            >
              Fazer login
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}

import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

export default function Login() {
  const [mode, setMode] = useState("login"); // login | register
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const API_URL = "http://192.168.0.196:80";

  async function handleLogin(e) {
    e.preventDefault();
    setErrorMsg("");

    try {
      const res = await axios.post(`${API_URL}/login`, { email, password });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);

      toast.success("Login realizado com sucesso!");

      setTimeout(() => {
        if (res.data.role === "admin") {
          window.location.href = "/dashboard";
        } else {
          window.location.href = "/solicitacao";
        }
      }, 800);
    } catch {
      toast.error("E-mail ou senha incorretos.");
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setErrorMsg("");

    try {
      await axios.post(`${API_URL}/register`, {
        name,
        email,
        password,
      });

      toast.success("Conta criada com sucesso!");
      setMode("login");
    } catch {
      toast.error("Não foi possível criar a conta.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">
        <h1 className="text-2xl font-extrabold text-center text-gray-800 mb-6">
          {mode === "login" ? "Entrar na Conta" : "Criar Conta"}
        </h1>

        <form
          onSubmit={mode === "login" ? handleLogin : handleRegister}
          className="flex flex-col gap-4"
        >
          {mode === "register" && (
            <input
              type="text"
              placeholder="Seu nome"
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-600 outline-none"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}

          <input
            type="email"
            placeholder="Seu e-mail"
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-600 outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Sua senha"
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-600 outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 transition text-white py-2 rounded-lg font-semibold shadow"
          >
            {mode === "login" ? "Entrar" : "Registrar"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-4">
          {mode === "login" ? (
            <>
              Não tem conta?{" "}
              <button
                className="text-blue-600 font-semibold hover:underline"
                onClick={() => setMode("register")}
              >
                Criar agora
              </button>
            </>
          ) : (
            <>
              Já possui conta?{" "}
              <button
                className="text-blue-600 font-semibold hover:underline"
                onClick={() => setMode("login")}
              >
                Fazer login
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

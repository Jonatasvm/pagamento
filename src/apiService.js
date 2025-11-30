// src/apiService.js
import toast from "react-hot-toast";

const API_BASE_URL = "http://91.98.132.210:5631"; // URL do seu backend Flask

/**
 * Pega o token salvo no navegador
 */
const getToken = () => localStorage.getItem("token"); // <-- Chave corrigida

/**
 * Função 'mãe' para todas as chamadas da API.
 */
const apiFetch = async (endpoint, method, body = null) => {
  const headers = new Headers({
    "Content-Type": "application/json",
  });

  const token = getToken();
  if (token) {
    headers.append("Authorization", `Bearer ${token}`);
  }

  const config = {
    method,
    headers,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    // Erros 401 (Não autorizado) ou 422 (Token inválido/expirado)
    if (response.status === 401 || response.status === 422) {
      toast.error("Sessão inválida ou expirada. Faça login novamente.");
      localStorage.removeItem("token");
      window.location.reload(); // Força o recarregamento para a tela de login
      throw new Error("Não autorizado");
    }

    // Outros erros
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg =
        errorData.message ||
        errorData.error ||
        `Erro ${response.status}: ${response.statusText}`;
      toast.error(errorMsg);
      throw new Error(errorMsg);
    }

    // Requisições sem 'corpo' (DELETE)
    if (response.status === 204) {
      return { success: true };
    }

    // Requisições que retornam dados (GET, POST, PUT)
    return response.json();
  } catch (error) {
    // Erros de rede (ex: backend desligado)
    if (
      !error.message.includes("Erro") &&
      !error.message.includes("autorizado")
    ) {
      toast.error(
        `Não foi possível conectar à API. (${error.message || "Erro de rede"})`
      );
    }
    throw error;
  }
};

// =======================================================
// ROTAS DA API (Mapeamento 1:1 com seu Flask)
// =======================================================

// --- AUTH ---
export const login = async (usuario, password) => {
  const data = await apiFetch("/login", "POST", { usuario, password });
  // 'data' deve conter o token. Assumindo que a key é 'access_token'
  if (data && data.access_token) {
    localStorage.setItem("token", data.access_token);
    return data;
  }
  throw new Error("Token não recebido no login.");
};

export const register = (usuario, password, role) => {
  return apiFetch("/register", "POST", { usuario, password, role });
};

// --- OBRAS ---
export const getObras = () => apiFetch("/obras", "GET");

export const createObra = (obraData) => {
  // obraData DEVE ser { nome: "string", endereco: "string", status: "string" }
  return apiFetch("/obras", "POST", obraData);
};

export const updateObra = (id, obraData) => {
  return apiFetch(`/obras/${id}`, "PUT", obraData);
};

export const deleteObra = (id) => apiFetch(`/obras/${id}`, "DELETE");

// --- USUÁRIOS ---
export const getUsuarios = () => apiFetch("/usuarios", "GET");

export const createUsuario = (userData) => {
  // userData DEVE ser { usuario: "string", password: "string", role: "string" }
  return apiFetch("/usuarios", "POST", userData);
};

export const updateUsuario = (id, userData) => {
  return apiFetch(`/usuarios/${id}`, "PUT", userData);
};

export const deleteUsuario = (id) => apiFetch(`/usuarios/${id}`, "DELETE");

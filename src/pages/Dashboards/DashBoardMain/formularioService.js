import axios from "axios";

// --- CONFIGURAÇÃO DA API ---
const api = axios.create({
  baseURL: "http://91.98.132.210:5631",
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- FUNÇÃO AUXILIAR PARA FORMATAR DATA (CORREÇÃO DO ERRO 1) ---
const formatDateToInput = (dateString) => {
  if (!dateString) return "";
  try {
    // Tenta criar um objeto Date e pegar apenas a parte YYYY-MM-DD
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return ""; // Se for data inválida, retorna vazio
    return date.toISOString().split('T')[0];
  } catch (error) {
    return "";
  }
};

// --- ADAPTADORES ---
const adapterBackendToFrontend = (data) => {
  return {
    id: data.id,
    // Aplica a formatação em todos os campos de data
    dataLancamento: formatDateToInput(data.data_lancamento),
    solicitante: data.solicitante,
    titular: data.titular,
    referente: data.referente,
    valor: data.valor
      ? String(Number(data.valor).toFixed(2)).replace(".", "")
      : "",
    obra: data.obra,
    dataPagamento: formatDateToInput(data.data_pagamento),
    formaDePagamento: data.forma_pagamento,
    statusLancamento: Boolean(data.lancado),
    cpfCnpjTitularConta: data.cpf_cnpj,
    chavePix: data.chave_pix,
    dataCompetencia: formatDateToInput(data.data_competencia),
    observacao: data.observacao,
    carimboDataHora: data.carimbo,
    conta: data.conta || null,
    quemPaga: data.quem_paga || null,
    linkAnexo: data.link_anexo || "",
    categoria: data.categoria || "Outros",
  };
};

const adapterFrontendToBackend = (data) => {
  return {
    data_lancamento: data.dataLancamento,
    solicitante: data.solicitante,
    titular: data.titular,
    referente: data.referente,
    valor: data.valor ? parseFloat(data.valor) / 100 : 0,
    obra: Number(data.obra), // Garante que obra seja enviada como número
    data_pagamento: data.dataPagamento,
    forma_pagamento: data.formaDePagamento,
    lancado: data.statusLancamento ? 1 : 0,
    cpf_cnpj: data.cpfCnpjTitularConta,
    chave_pix: data.chavePix,
    data_competencia: data.dataCompetencia,
    observacao: data.observacao,
  };
};

// --- CHAMADAS API ---
export const listarFormularios = async () => {
  const response = await api.get("/formulario");
  return response.data.map(adapterBackendToFrontend);
};

export const atualizarFormulario = async (id, data) => {
  const payload = adapterFrontendToBackend(data);
  await api.put(`/formulario/${id}`, payload);
};

export const deletarFormulario = async (id) => {
  await api.delete(`/formulario/${id}`);
};

export const criarFormulario = async (data) => {
  const payload = adapterFrontendToBackend(data);
  const response = await api.post("/formulario", payload);
  return response.data;
};

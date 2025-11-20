import axios from "axios";

// --- CONFIGURAÇÃO DA API ---
const api = axios.create({
  // Atualizado para a porta que você forneceu
  baseURL: "http://127.0.0.1:5631",
});

// 2. Interceptor para adicionar o Token automaticamente
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

// 3. Interceptor de resposta (opcional, para tratar erros globais)
api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

// --- ADAPTADORES (Mantidos iguais) ---
const adapterBackendToFrontend = (data) => {
  return {
    id: data.id,
    dataLancamento: data.data_lancamento,
    solicitante: data.solicitante,
    titular: data.titular,
    referente: data.referente,
    valor: data.valor
      ? String(Number(data.valor).toFixed(2)).replace(".", "")
      : "",
    obra: data.obra,
    dataPagamento: data.data_pagamento,
    formaDePagamento: data.forma_pagamento,
    statusLancamento: Boolean(data.lancado),
    cpfCnpjTitularConta: data.cpf_cnpj,
    chavePix: data.chave_pix,
    dataCompetencia: data.data_competencia,
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
    obra: data.obra,
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

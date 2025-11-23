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
// formularioService.js
// formularioService.js
const adapterBackendToFrontend = (data) => {
  const toDateString = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";
    return date.toISOString().split("T")[0]; // 2025-11-22
  };

  return {
    id: data.id,
    dataLancamento: toDateString(data.data_lancamento),
    dataPagamento: toDateString(data.data_pagamento),
    dataCompetencia: toDateString(data.data_competencia),

    solicitante: data.solicitante || null,
    titular: data.titular || null,
    referente: data.referente || "",
    valor: data.valor ? String(Number(data.valor).toFixed(2)).replace(".", "") : "",
    obra: data.obra || null,
    formaDePagamento: data.forma_pagamento || "",
    statusLancamento: Boolean(data.lancado),

    cpfCnpjTitularConta: data.cpf_cnpj || "",
    chavePix: data.chave_pix || "",
    observacao: data.observacao || "",
    carimboDataHora: data.carimbo || "",
    conta: data.conta || null,
    quemPaga: data.quem_paga || null,
    linkAnexo: data.link_anexo || "",
    categoria: data.categoria || "Outros",
  };
};

// formularioService.js
const adapterFrontendToBackend = (data) => {
  const formatDate = (dateStr) => {
    if (!dateStr || dateStr === "") {
      // MUDANÇA CRUCIAL: se o campo for obrigatório no banco, manda uma data padrão ou mantém a atual
      // Como data_lancamento costuma ser obrigatória, vamos mandar a data de hoje se estiver vazio
      const today = new Date().toISOString().split("T")[0];
      return dateStr === "" ? today : dateStr;
    }
    return dateStr; // já vem como yyyy-MM-dd do input date
  };

  return {
    data_lancamento: formatDate(data.dataLancamento),
    data_pagamento: data.dataPagamento || null, // esse pode ser null
    data_competencia: data.dataCompetencia || null, // esse também pode

    solicitante: data.solicitante || null,
    titular: data.titular || null,
    referente: data.referente || null,
    valor: data.valor ? parseFloat(data.valor) / 100 : 0,
    obra: data.obra ? Number(data.obra) : null,
    forma_pagamento: data.formaDePagamento || null,
    lancado: data.statusLancamento ? 1 : 0,

    cpf_cnpj: data.cpfCnpjTitularConta || null,
    chave_pix: data.chavePix || null,
    observacao: data.observacao || null,
    categoria: data.categoria || "Outros",
    quem_paga: data.quemPaga ? Number(data.quemPaga) : null,
    conta: data.conta ? Number(data.conta) : null,
    link_anexo: data.linkAnexo || null,
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

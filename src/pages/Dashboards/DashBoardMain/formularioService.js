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
    // Se já for string ISO (YYYY-MM-DD), retorna direto
    if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    // Tenta criar um objeto Date e pegar apenas a parte YYYY-MM-DD
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return ""; // Se for data inválida, retorna vazio
    return date.toISOString().split('T')[0];
  } catch (error) {
    console.error("Erro ao formatar data:", error, "Valor:", dateString);
    return "";
  }
};

// --- ADAPTADORES ---
const adapterBackendToFrontend = (data) => {
  // ✅ DEBUG: Log dos dados brutos do backend
  console.log("📦 Backend data:", {
    id: data.id,
    data_pagamento: data.data_pagamento,
    valor: data.valor,
  });
  
  return {
    id: data.id ? Number(data.id) : 0,  // Mantém como número, não string
    // Aplica a formatação em todos os campos de data
    dataLancamento: formatDateToInput(data.data_lancamento || ''),
    solicitante: data.solicitante,
    titular: data.titular,
    referente: data.referente,
    // ✅ CORREÇÃO: Backend retorna em CENTAVOS, manter como número inteiro (centavos)
    valor: data.valor ? Number(data.valor) : 0,  // Mantém em centavos como número
    obra: data.obra ? Number(data.obra) : null,
    // ✅ CORREÇÃO: Garantir que data_pagamento seja string
    dataPagamento: data.data_pagamento ? String(data.data_pagamento) : '',
    formaDePagamento: data.forma_pagamento,
    statusLancamento: data.lancado == 1 || data.lancado === 'S' || data.lancado === 'Y',
    cpfCnpjTitularConta: data.cpf_cnpj,
    chavePix: data.chave_pix,
    dataCompetencia: data.data_competencia ? String(data.data_competencia) : '',
    observacao: data.observacao,
    carimboDataHora: data.carimbo,
    conta: data.conta ? Number(data.conta) : null,
    quemPaga: data.quem_paga ? Number(data.quem_paga) : null,
    link_anexo: data.link_anexo || "",
    categoria: data.categoria || "Outros",
    grupo_lancamento: data.grupo_lancamento || null,
    obras_relacionadas: (data.obras_relacionadas || []).map(obra => ({
      ...obra,
      // ✅ CORREÇÃO: Mantém valor em centavos como número
      valor: obra.valor ? Number(obra.valor) : 0,
    })),
    valor_total: data.valor_total ? Number(data.valor_total) : (data.valor ? Number(data.valor) : 0),
  };
};

const adapterFrontendToBackend = (data) => {
  const payload = {
    data_lancamento: data.dataLancamento,
    solicitante: data.solicitante,
    titular: data.titular,
    referente: data.referente,
    valor: data.valor ? Math.round(Number(data.valor) * 100) : 0,
    obra: Number(data.obra),
    data_pagamento: data.dataPagamento,
    forma_pagamento: data.formaDePagamento,
    lancado: data.statusLancamento ? 'Y' : 'N', 
    cpf_cnpj: data.cpfCnpjTitularConta,
    chave_pix: data.chavePix,
    data_competencia: data.dataCompetencia,
    observacao: data.observacao,
    conta: data.conta ? Number(data.conta) : null,
    categoria: data.categoria ? Number(data.categoria) : null,
  };
  return payload;
};

// --- CHAMADAS API ---
export const listarFormularios = async () => {
  const response = await api.get("/formulario");
  const adapted = response.data.map(adapterBackendToFrontend);
  adapted.forEach((item) => {
    if (item.obra) {
    }
  });
  return adapted;
};

export const atualizarFormulario = async (id, data) => {
  const payload = adapterFrontendToBackend(data);
  await api.put(`/formulario/${id}`, payload);
};

export const deletarFormulario = async (id) => {
  await api.delete(`/formulario/${id}`);
};

export const criarFormulario = async (data) => {
  // A função adapterFrontendToBackend agora inclui 'lancado'
  const payload = adapterFrontendToBackend(data);
  
  // Novos formulários sempre começam como "não lançados" (N)
  // para aparecerem na lista de pendentes do dashboard
  payload.titular = '0'; 
  payload.lancado = 'N'; 
  
  const response = await api.post("/formulario", payload);
  return response.data;
};

// ======================================================================
// ✅ SERVIÇO: ATUALIZAR STATUS DE LANÇAMENTO (para o Toggle no Dashboard)
// ======================================================================
export const atualizarStatusLancamento = async (id, isLancado) => {
  // Este serviço é usado apenas pelo toggle e continua funcionando corretamente
  const statusBackend = isLancado ? 'Y' : 'N'; 
  
  const payload = {
    lancado: statusBackend,
  };

  const response = await api.put(`/formulario/${id}`, payload);
  return response.data;
};
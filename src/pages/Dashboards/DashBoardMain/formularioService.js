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
    // ✅ CORREÇÃO: Se for formato RFC (ex: "Tue, 24 Mar 2026 00:00:00 GMT")
    // Tenta criar um objeto Date e pegar apenas a parte YYYY-MM-DD
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return ""; // Se for data inválida, retorna vazio
    // Usar UTC para evitar problemas de timezone
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error("Erro ao formatar data:", error, "Valor:", dateString);
    return "";
  }
};

// --- ADAPTADORES ---
const adapterBackendToFrontend = (data) => {
  // ✅ CORREÇÃO: Converter data_pagamento usando a função auxiliar
  const dataPagamentoFormatada = formatDateToInput(data.data_pagamento);
  const dataCompetenciaFormatada = formatDateToInput(data.data_competencia);
  
  return {
    id: data.id ? Number(data.id) : 0,
    dataLancamento: formatDateToInput(data.data_lancamento || ''),
    solicitante: data.solicitante,
    titular: data.titular,
    referente: data.referente,
    // ✅ Valor JÁ VEM EM CENTAVOS do backend, NÃO multiplicar
    valor: data.valor ? Number(data.valor) : 0,
    obra: data.obra ? Number(data.obra) : null,
    dataPagamento: dataPagamentoFormatada,
    formaDePagamento: data.forma_pagamento,
    // Status: 'Y' = Lançado, 'N' = Pendente, 'X' = Não autorizado, 'A' = Aprovado
    statusLancamento: data.lancado === 'X' ? 'NAO_AUTORIZADO' : data.lancado === 'A' ? 'APROVADO' : (data.lancado == 1 || data.lancado === 'S' || data.lancado === 'Y') ? 'LANCADO' : 'PENDENTE',
    cpfCnpjTitularConta: data.cpf_cnpj,
    chavePix: data.chave_pix,
    dataCompetencia: dataCompetenciaFormatada,
    observacao: data.observacao,
    carimboDataHora: data.carimbo,
    conta: data.conta ? Number(data.conta) : null,
    quemPaga: data.quem_paga ? Number(data.quem_paga) : null,
    link_anexo: data.link_anexo || "",
    categoria: data.categoria || "Outros",
    grupo_lancamento: data.grupo_lancamento || null,
    obras_relacionadas: (data.obras_relacionadas || []).map(obra => ({
      ...obra,
      // ✅ Valor JÁ VEM EM CENTAVOS, NÃO multiplicar
      valor: obra.valor ? Number(obra.valor) : 0,
    })),
    valor_total: data.valor_total ? Number(data.valor_total) : (data.valor ? Number(data.valor) : 0),
    fornecedor_novo: data.fornecedor_novo ? true : false,
  };
};

const adapterFrontendToBackend = (data) => {
  const payload = {
    data_lancamento: data.dataLancamento,
    solicitante: data.solicitante,
    titular: data.titular,
    referente: data.referente,
    // ✅ Valor JÁ ESTÁ EM CENTAVOS no frontend, enviar direto
    valor: data.valor ? Number(data.valor) : 0,
    obra: Number(data.obra),
    data_pagamento: data.dataPagamento,
    forma_pagamento: data.formaDePagamento,
    // Status: LANCADO -> Y, NAO_AUTORIZADO -> X, APROVADO -> A, PENDENTE -> N
    lancado: data.statusLancamento === 'LANCADO' ? 'Y' : data.statusLancamento === 'NAO_AUTORIZADO' ? 'X' : data.statusLancamento === 'APROVADO' ? 'A' : 'N',
    cpf_cnpj: data.cpfCnpjTitularConta,
    chave_pix: data.chavePix,
    data_competencia: data.dataCompetencia,
    observacao: data.observacao,
    conta: data.conta ? Number(data.conta) : null,
    categoria: data.categoria ? Number(data.categoria) : null,
    fornecedor_novo: data.fornecedor_novo ? 1 : 0,
  };
  return payload;
};

// --- CHAMADAS API ---
export const listarFormularios = async (params = {}) => {
  // Monta query string para todos os filtros + paginação
  const searchParams = new URLSearchParams();
  
  // Paginação
  if (params.page) searchParams.append('page', params.page);
  if (params.per_page) searchParams.append('per_page', params.per_page);
  
  // Filtros
  if (params.status) searchParams.append('status', params.status);
  if (params.forma_pagamento) searchParams.append('forma_pagamento', params.forma_pagamento);
  if (params.data) searchParams.append('data', params.data);
  if (params.data_inicio) searchParams.append('data_inicio', params.data_inicio);
  if (params.data_fim) searchParams.append('data_fim', params.data_fim);
  if (params.obra) searchParams.append('obra', params.obra);
  if (params.titular) searchParams.append('titular', params.titular);
  if (params.solicitante) searchParams.append('solicitante', params.solicitante);
  if (params.referente) searchParams.append('referente', params.referente);
  if (params.busca) searchParams.append('busca', params.busca);
  if (params.multiplos && params.multiplos !== 'todos') searchParams.append('multiplos', params.multiplos);
  if (params.codigo_barra_status && params.codigo_barra_status !== 'todos') {
    searchParams.append('codigo_barra_status', params.codigo_barra_status);
  }
  if (params.ids) searchParams.append('ids', params.ids);
  if (params.ordenacao) searchParams.append('ordenacao', params.ordenacao);
  
  const url = "/formulario" + (searchParams.toString() ? `?${searchParams.toString()}` : "");
  const response = await api.get(url);
  
  // Suporta resposta paginada {data, total, page, per_page} ou array puro (backward compat)
  const rawData = response.data;
  const isPaginated = rawData && !Array.isArray(rawData) && Array.isArray(rawData.data);
  
  const items = isPaginated ? rawData.data : rawData;
  const adapted = items.map(adapterBackendToFrontend);
  
  if (isPaginated) {
    return {
      data: adapted,
      total: rawData.total,
      page: rawData.page,
      per_page: rawData.per_page,
    };
  }
  
  return adapted;
};

// --- BUSCAR FORMULÁRIO POR ID (para refresh após edição) ---
export const buscarFormularioPorId = async (id) => {
  const response = await api.get(`/formulario/${id}`);
  return adapterBackendToFrontend(response.data);
};

export const atualizarFormulario = async (id, data) => {
  const payload = adapterFrontendToBackend(data);
  await api.put(`/formulario/${id}`, payload);
};

export const deletarFormulario = async (id) => {
  const response = await api.delete(`/formulario/${id}`);
  return response.data; // ✅ Retorna { ids_deletados, total_deletados }
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
export const atualizarStatusLancamento = async (id, novoStatus) => {
  // novoStatus pode ser: 'LANCADO', 'PENDENTE', 'NAO_AUTORIZADO', 'APROVADO' ou boolean (retrocompatível)
  let statusBackend;
  if (typeof novoStatus === 'boolean') {
    statusBackend = novoStatus ? 'Y' : 'N';
  } else {
    statusBackend = novoStatus === 'LANCADO' ? 'Y' : novoStatus === 'NAO_AUTORIZADO' ? 'X' : novoStatus === 'APROVADO' ? 'A' : 'N';
  }
  
  const payload = {
    lancado: statusBackend,
  };

  const response = await api.put(`/formulario/${id}`, payload);
  return response.data;
};
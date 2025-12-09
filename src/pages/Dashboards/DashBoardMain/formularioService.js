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
    // ... (restante da sua adaptação)
    valor: data.valor,
    obra: data.obra,
    quemPaga: data.quem_paga,
    dataCompetencia: formatDateToInput(data.data_competencia),
    formaDePagamento: data.forma_de_pagamento,
    cpfCnpjTitularConta: data.cpf_cnpj,
    lancado: data.lancado === 'Y' ? true : false,
    motivo: data.motivo,
  };
};

const adapterFrontendToBackend = (data) => {
  return {
    id: data.id,
    data_lancamento: data.dataLancamento,
    solicitante: data.solicitante,
    titular: data.titular,
    // ... (restante da sua adaptação)
    valor: data.valor,
    obra: data.obra,
    quem_paga: data.quemPaga,
    data_competencia: data.dataCompetencia,
    forma_de_pagamento: data.formaDePagamento,
    cpf_cnpj: data.cpfCnpjTitularConta,
    lancado: data.lancado ? 'Y' : 'N',
    motivo: data.motivo,
  };
};

// --- SERVIÇOS DE CRUD EXISTENTES ---

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
  payload.titular = '0'; 
  payload.lancado = 'Y'; 
  
  const response = await api.post("/formulario", payload);
  return response.data;
};

// --- SERVIÇO: ATUALIZAR STATUS DE LANÇAMENTO ---

export const atualizarStatusLancamento = async (id, isLancado) => {
  const statusBackend = isLancado ? 'Y' : 'N'; 
  const payload = { lancado: statusBackend };
  
  // O endpoint de atualização é o mesmo PUT usado no formulário
  await api.put(`/formulario/${id}/status`, payload);
};

// =====================================================================
// ✅ NOVO SERVIÇO: EXPORTAR REGISTROS PARA XLS/XLSX (COM EXPORT CORRETO)
// =====================================================================
export const exportarFormulariosParaXLS = async (ids) => {
  try {
    const response = await api.post("/formulario/export/xls", 
      { ids: ids }, 
      {
        responseType: 'blob', // 👈 Resposta esperada é um arquivo binário
      }
    );

    const blob = response.data;
    
    // Tenta obter o nome do arquivo do cabeçalho da resposta
    const contentDisposition = response.headers['content-disposition'];
    let filename = 'registros_selecionados.xlsx';
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/i);
      if (filenameMatch && filenameMatch.length === 2) {
        filename = filenameMatch[1];
      }
    }

    // Cria um link temporário para iniciar o download no navegador
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename; 
    document.body.appendChild(a);
    a.click();
    
    // Limpeza
    a.remove();
    window.URL.revokeObjectURL(url);
    
    return { success: true, message: `Download de ${filename} iniciado.` };
  } catch (error) {
    console.error("Erro ao exportar formulários:", error.response || error);
    
    // Trata mensagens de erro que podem vir do backend (mesmo em formato blob)
    if (error.response && error.response.data instanceof Blob) {
      // Lê o blob como texto para tentar parsear a mensagem de erro JSON
      const errorText = await error.response.data.text();
      try {
        const errorJson = JSON.parse(errorText);
        return { success: false, message: errorJson.message || "Erro desconhecido ao exportar." };
      } catch {
        // Se não for JSON, é um erro genérico
        return { success: false, message: "Erro de servidor. Não foi possível processar a exportação." };
      }
    }

    return { success: false, message: error.message || "Erro de rede/desconhecido." };
  }
};
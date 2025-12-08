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
    // ... (campos omitidos por brevidade)
    dataCompetencia: formatDateToInput(data.data_competencia), // Correção na formatação
    
    // Novo Campo de Status
    isLancado: data.lancado === 'Y', // 'Y' (Sim) ou 'N' (Não)
    lancado: data.lancado, // Mantém o campo original para o adapter
  };
};

const adapterFrontendToBackend = (data) => {
  // Converte a moeda (string com R$) para o formato float do Python
  const valorFormatado = data.valor.replace(/[R$\s.]/g, "").replace(",", ".");

  // O 'lancado' será 'Y' ou 'N'
  const lancadoStatus = data.isLancado ? 'Y' : 'N';
  
  return {
    id_obra: Number(data.obra),
    solicitante: data.solicitante,
    titular: data.titular,
    // ... (campos omitidos por brevidade)
    data_lancamento: data.dataLancamento,
    data_competencia: data.dataCompetencia,
    lancado: data.lancado || lancadoStatus, // Adiciona o campo
  };
};

// --- SERVIÇOS DE CRUD ---

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
  // A função adapterFrontendToBackend agora inclui 'lancado'
  const payload = adapterFrontendToBackend(data);
  
  // Mantendo as correções anteriores para criação,
  // mas o 'lancado' da linha abaixo agora sobrescreve o valor do payload, 
  // garantindo que novos formulários sejam sempre 'Y' (como era sua intenção original)
  payload.titular = '0'; 
  payload.lancado = 'Y'; 
  
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
  
  // 🛠️ CORREÇÃO: Chamada à API e o fechamento da função
  await api.put(`/formulario/${id}/status`, payload); 
}; // <--- ESSA CHAVE ESTAVA FALTANDO E CAUSAVA O ERRO!
// ----------------------------------------------------------------------


// ======================================================================
// ✅ NOVO SERVIÇO: EXPORTAR E LANÇAR MÚLTIPLOS REGISTROS
// ======================================================================
export const exportarELancarFormularios = async (ids) => {
  const response = await api.post("/formulario/exportar", { ids: ids }, {
    // IMPORTANTE: Configura a resposta para receber o arquivo como um blob
    responseType: 'blob', 
  });

  // Cria um objeto URL para o Blob (o arquivo)
  const url = window.URL.createObjectURL(new Blob([response.data]));
  
  // Cria um link temporário para forçar o download
  const link = document.createElement('a');
  link.href = url;
  
  // Define o nome do arquivo que será baixado
  link.setAttribute('download', 'formularios_exportados.xlsx'); 
  document.body.appendChild(link);
  
  // Dispara o clique para iniciar o download
  link.click();
  
  // Limpa o objeto URL e o link temporário
  link.remove();
  window.URL.revokeObjectURL(url);
  
  // Retorna para que o frontend possa atualizar o dashboard
  return response.status === 200;
};
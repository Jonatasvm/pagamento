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
    // Converte '1', 'S', 'Y' para true, e o resto para false.
    statusLancamento: data.lancado == 1 || data.lancado === 'S' || data.lancado === 'Y',
    cpfCnpjTitularConta: data.cpf_cnpj,
    chavePix: data.chave_pix,
    dataCompetencia: formatDateToInput(data.data_competencia),
    observacao: data.observacao,
    carimboDataHora: data.carimbo,
    conta: data.conta || null,
    quemPaga: data.quem_paga || null,
    link_anexo: data.link_anexo || "",
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
    forma_pagamento: data.formaDePagamento.toUpperCase(), // <--- FORÇA MAIÚSCULAS
    
    // ✅ CORREÇÃO CRÍTICA: Mapeia statusLancamento (boolean) para lancado ('Y'/'N')
    lancado: data.statusLancamento ? 'Y' : 'N', 
    
    cpf_cnpj: data.cpfCnpjTitularConta,
    chave_pix: data.chavePix,
    data_competencia: data.dataCompetencia,
    observacao: data.observacao,
  };
};

// --- CHAMADAS API ---
export const listarFormularios = async () => {
  const response = await api.get("/formulario");
  const dados = response.data.map(adapterBackendToFrontend);
  
  // 🔍 LOGS DETALHADOS
  console.log("=".repeat(80));
  console.log("📋 TODOS OS DADOS BRUTOS DO BACKEND:");
  console.log(response.data);
  
  console.log("\n" + "=".repeat(80));
  console.log("📋 DADOS APÓS CONVERSÃO (FRONTEND):");
  console.log(dados);
  
  console.log("\n" + "=".repeat(80));
  console.log("🏗️ DADOS RELACIONADOS A 'OBRA':");
  dados.forEach((item, index) => {
    console.log(`Item ${index + 1}:`, {
      id: item.id,
      obra: item.obra,
      obra_type: typeof item.obra,
    });
  });
  
  console.log("\n" + "=".repeat(80));
  console.log("🔎 PROCURANDO POR 'MARMOARIA':");
  const marmoraria = dados.filter(item => 
    String(item.obra).toLowerCase().includes('marmoaria') ||
    String(item.referente).toLowerCase().includes('marmoaria') ||
    String(item.observacao).toLowerCase().includes('marmoaria')
  );
  console.log("Resultados encontrados:", marmoraria);
  console.log("=".repeat(80));
  
  return dados;
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

  const response = await api.put(`/formulario/${id}`, payload);
  return response.data;
};
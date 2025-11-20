import {
  Edit,
  Save,
  Trash2,
  X,
  Loader2,
  ChevronDown,
  FileText,
} from "lucide-react";

// --- Funções de Máscara e Utilitários ---
export const formatCurrencyDisplay = (rawDigits) => {
  const digits = String(rawDigits).replace(/\D/g, "").substring(0, 15);
  if (!digits) return "";
  const cents = digits.slice(-2).padStart(2, "0");
  const reais = digits.slice(0, -2) || "0";
  const formattedReais = parseInt(reais, 10).toLocaleString("pt-BR");
  return `R$ ${formattedReais},${cents}`;
};

export const formatCpfCnpj = (value) => {
  const cleanValue = String(value).replace(/\D/g, "").substring(0, 14);
  if (cleanValue.length <= 11) {
    return cleanValue
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d{1,2})/, "$1.$2.$3-$4");
  } else {
    return cleanValue
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3/$4")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }
};

export const getStatusClasses = (isLancado) => {
  return isLancado
    ? "bg-green-100 text-green-800" // LANÇADO
    : "bg-red-100 text-red-800"; // NÃO LANÇADO
};

// --- Helpers de Busca Dinâmica ---
// Procura o nome dentro de um array de objetos [{id: 1, nome: '...'}, ...]
export const getNomePorId = (id, listaDeDados = []) => {
  if (!id) return "—";
  const item = listaDeDados.find((d) => Number(d.id) === Number(id));
  return item ? item.nome : `ID ${id}`;
};

// --- Opções Estáticas ---
export const formaPagamentoOptions = ["PIX", "DINHEIRO", "BOLETO", "CHEQUE"];
export const categoriaOptions = ["Sem NF", "Com NF", "Outros"];

// --- Configuração das Colunas (Agora são funções geradoras) ---

export const getTableColumns = (listaUsuarios, listaObras, listaTitulares) => [
  {
    key: "id",
    label: "ID",
    minWidth: "50px",
    format: (val) => `#${val}`,
    editable: false,
  },
  {
    key: "dataLancamento",
    label: "Data de Lançamento",
    minWidth: "150px",
    type: "date",
    editable: false,
    format: (val) => (val ? new Date(val).toLocaleDateString("pt-BR") : "—"),
  },
  {
    key: "solicitante",
    label: "Solicitante",
    minWidth: "150px",
    type: "text",
    editable: false,
    format: (id) => getNomePorId(id, listaUsuarios),
  },
  {
    key: "titular",
    label: "Titular",
    minWidth: "200px",
    type: "text",
    format: (id) => getNomePorId(id, listaTitulares),
  },
  { key: "referente", label: "Referente", minWidth: "200px", type: "text" },
  { key: "valor", label: "VALOR", minWidth: "130px", type: "currency" },
  {
    key: "obra",
    label: "Obra",
    minWidth: "180px",
    type: "select",
    // As options agora devem ser passadas dinamicamente ou via prop na tabela
    options: listaObras,
    format: (id) => getNomePorId(id, listaObras),
  },
  {
    key: "dataPagamento",
    label: "Data Pagamento",
    minWidth: "150px",
    type: "date",
    format: (val) => (val ? new Date(val).toLocaleDateString("pt-BR") : "—"),
  },
  {
    key: "formaDePagamento",
    label: "Forma Pagto",
    minWidth: "130px",
    type: "select",
    options: formaPagamentoOptions,
  },
  {
    key: "statusLancamento",
    label: "LANÇADO",
    minWidth: "120px",
    type: "boolean",
  },
];

export const getExpandedFields = (listaUsuarios) => [
  {
    key: "quemPaga",
    label: "Quem Paga",
    type: "select",
    options: listaUsuarios,
    format: (id) => getNomePorId(id, listaUsuarios),
  },
  {
    key: "cpfCnpjTitularConta",
    label: "CPF/CNPJ titular conta",
    type: "text",
    format: formatCpfCnpj,
  },
  { key: "chavePix", label: "Chave PIX", type: "text", format: (val) => val },
  {
    key: "categoria",
    label: "Categoria",
    type: "select",
    options: categoriaOptions,
  },
  {
    key: "conta",
    label: "Conta (ID)",
    type: "text",
    format: (id) => `ID: ${id}`,
  },
  {
    key: "dataCompetencia",
    label: "Data Competência",
    type: "date",
    editable: false,
    format: (val) => (val ? new Date(val).toLocaleDateString("pt-BR") : "—"),
  },
  {
    key: "carimboDataHora",
    label: "Carimbo de data/hora",
    type: "text",
    editable: false,
  },
  {
    key: "linkAnexo",
    label: "Anexa um arquivo",
    type: "text",
    editable: false,
    isLink: true,
  },
  { key: "observacao", label: "Observação", type: "textarea" },
];

import React from "react";

// --- DADOS DE CONFIGURAÇÃO ---
export const formaPagamentoOptions = [
  "PIX",
  "CHEQUE",
  "BOLETO",
];

// --- FUNÇÕES UTILITÁRIAS ---

export const getNameById = (list, id) => {
  if (!list || id == null || id === "") return '—';
  
  const itemId = Number(id);
  const item = list.find((i) => i.id === itemId);
  return item ? item.nome : `ID: ${id}`;
};

export function formatCurrencyDisplay(value) {
    if (!value) return "R$ 0,00";
    const numericValue = String(value).replace(/\D/g, "");
    const reais = (Number(numericValue) / 100).toFixed(2).replace(".", ",");
    return `R$ ${reais.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.")}`;
}

export function getStatusClasses(isLancado) {
    return isLancado
        ? "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
        : "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800";
}

// --- CONFIGURAÇÃO DE COLUNAS DA TABELA (Colunas Visíveis) ---
export const getTableColumns = (listaUsuarios, listaObras, listaTitulares) => [
  {
    key: "statusLancamento",
    label: "Status",
    type: "boolean",
    format: (value) => (
      <span className={getStatusClasses(value)}>
        {value ? "LANÇADO" : "PENDENTE"}
      </span>
    ),
    minWidth: "120px",
  },
  {
    key: "dataPagamento",
    label: "Data Pagto",
    type: "date",
    minWidth: "120px",
  },
  {
    key: "valor",
    label: "Valor",
    type: "currency",
    format: formatCurrencyDisplay,
    minWidth: "140px",
  },
  {
    key: "titular",
    label: "Titular / Favorecido",
    type: "text",
    minWidth: "200px",
    // ❌ REMOVIDO: format: (id) => getNameById... 
    // MOTIVO: O valor já é o nome (texto), não precisa converter.
  },
  {
    key: "referente",
    label: "Referente",
    type: "text",
    minWidth: "300px",
  },
  {
    key: "obra",
    label: "Obra",
    type: "select",
    options: listaObras,
    minWidth: "150px",
    format: (value) => getNameById(listaObras, value), // Este MANTÉM, pois obra é ID
  },
  {
    key: "quemPaga",
    label: "Quem Paga",
    type: "text",
    minWidth: "100px",
    editable: false, 
  },
  {
    key: "solicitante",
    label: "Solicitante",
    type: "select",
    options: listaUsuarios,
    minWidth: "150px",
    editable: false,
    // ❌ REMOVIDO: format: (id) => getNameById...
    // MOTIVO: Se estava aparecendo "ID: Joao", é porque o dado já é o nome "Joao".
  },
];

// --- CONFIGURAÇÃO DE CAMPOS EXPANDIDOS (Detalhes Ocultos) ---
export const getExpandedFields = (listaUsuarios) => [
  {
    key: "dataLancamento",
    label: "Data Lançamento",
    type: "date",
    editable: false,
  },
  {
    key: "dataCompetencia",
    label: "Competência",
    type: "date",
  },
  {
    key: "formaDePagamento",
    label: "Forma de Pagto",
    type: "select",
    options: formaPagamentoOptions,
  },
  {
    key: "cpfCnpjTitularConta",
    label: "CPF/CNPJ Titular",
    type: "text",
  },
  {
    key: "chavePix",
    label: "Chave PIX",
    type: "text",
  },
  {
    key: "conta",
    label: "Conta (Banco/Ag/C)",
    type: "text",
  },
  {
    key: "linkAnexo",
    label: "Link do Anexo",
    type: "text",
    isLink: true,
  },
  {
    key: "observacao",
    label: "Observação",
    type: "textarea",
  },
  {
    key: "carimboDataHora",
    label: "Carimbo",
    type: "text",
    editable: false,
  },
];
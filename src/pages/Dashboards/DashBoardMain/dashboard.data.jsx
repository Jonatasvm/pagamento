import React from "react";

// --- DADOS DE CONFIGURAÇÃO ---
export const formaPagamentoOptions = [
  "PIX",
  "CHEQUE",
  "BOLETO",
];

// --- FUNÇÕES UTILITÁRIAS ---

// ✅ CORREÇÃO AQUI: Alteramos a lógica de fallback para ser menos intrusiva
export const getNameById = (list, id) => {
  if (!list || id == null || id === "") return '—';
  
  const itemId = Number(id);
  
  // Se o valor não é um ID numérico válido (ex: "julim"), retorna o valor bruto.
  if (isNaN(itemId)) return String(id); 

  const item = list.find((i) => i.id === itemId);
  
  // Se encontrou, retorna o nome. Se não encontrou, retorna um traço (—), sem o "ID: ".
  return item ? item.nome : '—'; 
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
    // ✅ CORREÇÃO: Força o retorno do valor bruto (name string)
    format: (value) => String(value), 
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
    format: (value) => getNameById(listaObras, value), // Este mantém, pois é um ID numérico
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
    // ✅ CORREÇÃO: Força o retorno do valor bruto (name string)
    format: (value) => String(value),
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
    label: "Anexos",
    type: "anexos",
    editable: false,
    format: (value) => {
      if (!value) return "—";
      try {
        const anexos = typeof value === "string" ? JSON.parse(value) : value;
        if (!Array.isArray(anexos) || anexos.length === 0) return "—";
        
        // Função para baixar todos os arquivos
        const handleDownloadAll = (e) => {
          e.preventDefault();
          anexos.forEach((anexo, index) => {
            // Delay entre downloads para não bloquear o navegador
            setTimeout(() => {
              const downloadUrl = anexo.download || `https://drive.google.com/uc?export=download&id=${anexo.drive_id}`;
              const link = document.createElement('a');
              link.href = downloadUrl;
              link.download = anexo.name;
              link.target = '_blank';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }, index * 500);
          });
        };

        return (
          <div className="flex flex-col gap-2">
            {/* Botão Baixar Todos */}
            {anexos.length > 0 && (
              <button
                onClick={handleDownloadAll}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition w-fit"
              >
                ⬇️ Baixar {anexos.length > 1 ? `todos (${anexos.length})` : "arquivo"}
              </button>
            )}
            {/* Links individuais */}
            <div className="flex flex-wrap gap-2">
              {anexos.map((anexo, idx) => {
                const downloadUrl = anexo.download || `https://drive.google.com/uc?export=download&id=${anexo.drive_id}`;
                return (
                  <a
                    key={idx}
                    href={downloadUrl}
                    download={anexo.name}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition"
                    title={`Baixar: ${anexo.name}`}
                  >
                    📎 {anexo.name?.length > 15 ? anexo.name.substring(0, 15) + "..." : anexo.name}
                  </a>
                );
              })}
            </div>
          </div>
        );
      } catch {
        // Se não for JSON, tenta como link único
        return (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            📎 Baixar anexo
          </a>
        );
      }
    },
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
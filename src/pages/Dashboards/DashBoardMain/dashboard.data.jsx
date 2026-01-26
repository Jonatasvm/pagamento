import React from "react";

// --- DADOS DE CONFIGURAÇÃO ---
export const formaPagamentoOptions = [
  "Pix",
  "Cheque",
  "Boleto",
];

// --- FUNÇÕES UTILITÁRIAS ---

// ✅ Formatar CPF/CNPJ com máscara
export const formatCPFCNPJ = (value) => {
  if (!value) return "";
  const clean = String(value).replace(/\D/g, "");
  
  if (clean.length === 11) {
    // CPF: xxx.xxx.xxx-xx
    return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  } else if (clean.length === 14) {
    // CNPJ: xx.xxx.xxx/xxxx-xx
    return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  }
  return value;
};

// ✅ Formatar data em português (DD/MM/YYYY)
export const formatDatePT = (dateStr) => {
  if (!dateStr) return "—";
  try {
    // Se está no formato YYYY-MM-DD, faz parse manual para evitar timezone issues
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [year, month, day] = dateStr.split("-").map(Number);
      return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
    }
    
    // Para ISO com T, extrai a data e usa parse manual
    if (dateStr.includes("T")) {
      const datePart = dateStr.split("T")[0];
      const [year, month, day] = datePart.split("-").map(Number);
      return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
    }
    
    // Fallback para outros formatos
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "—";
    return date.toLocaleDateString('pt-BR');
  } catch {
    return "—";
  }
};

// ✅ Traduzir data de carimbo para português
export const formatCarimbo = (dateStr) => {
  if (!dateStr) return "—";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "—";
    return date.toLocaleString('pt-BR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch {
    return "—";
  }
};

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
    if (!value) return "0,00";
    const numericValue = String(value).replace(/\D/g, "");
    const reais = (Number(numericValue) / 100).toFixed(2).replace(".", ",");
    return reais.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
}

export function getStatusClasses(isLancado) {
    return isLancado
        ? "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
        : "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800";
}

// --- CONFIGURAÇÃO DE COLUNAS DA TABELA (Colunas Visíveis) ---
export const getTableColumns = (listaUsuarios, listaObras, listaTitulares, listaBancos = [], listaCategorias = []) => [
  {
    key: "statusLancamento",
    label: "Status",
    type: "boolean",
    format: (value) => (
      <span className={getStatusClasses(value)}>
        {value ? "LANÇADO" : "PENDENTE"}
      </span>
    ),
    minWidth: "80px",
  },
  {
    key: "dataPagamento",
    label: "Data Pagto",
    type: "date",
    minWidth: "100px",
    format: (value) => formatDatePT(value),
  },
  {
    key: "valor",
    label: "Valor",
    type: "currency",
    format: formatCurrencyDisplay,
    minWidth: "100px",
  },
  {
    key: "titular",
    label: "Titular / Favorecido",
    type: "text",
    minWidth: "160px",
    // ✅ CORREÇÃO: Força o retorno do valor bruto (name string)
    format: (value) => String(value), 
  },
  {
    key: "referente",
    label: "Referente",
    type: "text",
    minWidth: "160px",
  },
  {
    key: "categoria",
    label: "Categoria",
    type: "select",
    options: listaCategorias,
    editable: true,
    minWidth: "90px",
    format: (value) => getNameById(listaCategorias, value),
  },
  {
    key: "obra",
    label: "Obra",
    type: "select",
    options: listaObras,
    minWidth: "130px",
    format: (value) => getNameById(listaObras, value), // Este mantém, pois é um ID numérico
  },
  {
    key: "conta",
    label: "Banco",
    type: "select",
    options: listaBancos,
    minWidth: "100px",
    editable: true,
    format: (value) => getNameById(listaBancos, value),
  },
  {
    key: "solicitante",
    label: "Solicitante",
    type: "select",
    options: listaUsuarios,
    minWidth: "180px",
    editable: false,
    // ✅ CORREÇÃO: Força o retorno do valor bruto (name string)
    format: (value) => String(value),
  },
];

// --- CONFIGURAÇÃO DE CAMPOS EXPANDIDOS (Detalhes Ocultos) ---
export const getExpandedFields = (listaUsuarios, listaCategorias = []) => [
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
    format: (value) => formatCPFCNPJ(value),
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
    key: "link_anexo",
    label: "Anexos",
    type: "anexos",
    editable: false,
    format: (value) => {
      if (!value) return "—";
      try {
        const anexos = typeof value === "string" ? JSON.parse(value) : value;
        if (!Array.isArray(anexos) || anexos.length === 0) return "—";
        
        // Função para baixar todos os arquivos usando iframes
        const handleDownloadAll = async (e) => {
          e.preventDefault();
          
          for (let i = 0; i < anexos.length; i++) {
            const anexo = anexos[i];
            const downloadUrl = anexo.download || `https://drive.google.com/uc?export=download&id=${anexo.drive_id}`;
            
            // Cria um iframe oculto para cada download
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.src = downloadUrl;
            document.body.appendChild(iframe);
            
            // Remove o iframe após 5 segundos
            setTimeout(() => {
              document.body.removeChild(iframe);
            }, 5000);
            
            // Aguarda 1 segundo entre cada download
            if (i < anexos.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        };

        return (
          <div className="flex flex-col gap-2">
            {/* Botão Baixar Todos */}
            {anexos.length > 1 && (
              <button
                onClick={handleDownloadAll}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition w-fit"
              >
                ⬇️ Baixar todos ({anexos.length})
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
    label: "Data/Hora",
    type: "text",
    editable: false,
    format: (value) => formatCarimbo(value),
  },
];
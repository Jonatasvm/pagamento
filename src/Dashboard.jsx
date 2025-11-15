import React, { useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  Edit,
  Save,
  Trash2,
  X,
  Loader2,
  ChevronDown,
  FileText, // Ícone para CSV
} from "lucide-react";

// --- Funções de Máscara (MANTIDAS) ---
const formatCurrencyDisplay = (rawDigits) => {
  const digits = String(rawDigits).replace(/\D/g, "").substring(0, 15);
  if (!digits) return "";
  const cents = digits.slice(-2).padStart(2, "0");
  const reais = digits.slice(0, -2) || "0";
  const formattedReais = parseInt(reais, 10).toLocaleString("pt-BR");
  return `R$ ${formattedReais},${cents}`;
};

const formatCpfCnpj = (value) => {
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

// --- Dados Mock e Opções (AJUSTADOS) ---

const mockUsuarios = {
  1: "João Silva",
  2: "Pedro Souza",
  3: "Ana Costa",
  10: "Financeiro A",
  11: "Financeiro B",
};

const mockObras = {
  43: "Projeto Alpha",
  44: "Construção Beta",
  45: "Reforma Central",
};

// Lista de opções de obra para o Dropdown (Select)
const obraOptions = Object.keys(mockObras).map((id) => ({
  id: Number(id),
  nome: mockObras[id],
}));

const mockTitulares = {
  53: "Maria de Oliveira",
  54: "Consultoria XYZ Ltda",
  55: "Ana Costa",
};

const getNomePorId = (id, mockTable) =>
  mockTable[String(id)] || `ID ${id} (Não encontrado)`;

const initialRequestsMock = [
  {
    id: 1,
    carimboDataHora: "07/30/2025 9:58:35",
    solicitante: 1,
    dataLancamento: "2025-07-30",
    dataCompetencia: "2025-07-30",
    valor: "123450",
    titular: 53,
    referente: "Restante das calhas",
    chavePix: "12345678900",
    categoria: "Sem NF",
    dataPagamento: "2025-07-30",
    quemPaga: 10,
    obra: 43,
    conta: 1,
    indiceEtapa: "",
    formaDePagamento: "PIX",
    statusGeradoCSV: false,
    cpfCnpjTitularConta: "123.456.789-00",
    linkAnexo: "https://drive.google.com/doc1",
    observacao: "Urgente, liberar até 30/07.",
    statusLancamento: true,
  },
  {
    id: 2,
    carimboDataHora: "08/01/2025 14:00:00",
    solicitante: 2,
    dataLancamento: "2025-08-01",
    dataCompetencia: "2025-07-31",
    valor: "500000",
    titular: 54,
    referente: "Serviços de consultoria - Julho",
    chavePix: "11222333000144",
    categoria: "Com NF",
    dataPagamento: "",
    quemPaga: 11,
    obra: 44,
    conta: 2,
    indiceEtapa: "",
    formaDePagamento: "Boleto",
    statusGeradoCSV: true,
    cpfCnpjTitularConta: "11.222.333/0001-44",
    linkAnexo: "https://drive.google.com/doc2",
    observacao: "Checar recibo antes do pagamento.",
    statusLancamento: false,
  },
];

const formaPagamentoOptions = ["PIX", "DINHEIRO", "BOLETO", "CHEQUE"];
const categoriaOptions = ["Sem NF", "Com NF", "Outros"];

// --- FUNÇÃO AJUSTADA PARA O NOVO STATUS BOOLEAN ---
const getStatusClasses = (isLancado) => {
  return isLancado
    ? "bg-green-100 text-green-800" // LANÇADO
    : "bg-red-100 text-red-800"; // NÃO LANÇADO
};

// --- Configuração das Colunas (AJUSTADAS PARA NOVA ORDEM/VISIBILIDADE) ---
const tableColumns = [
  { // ID (Posição 1)
    key: "id",
    label: "ID",
    minWidth: "50px",
    format: (val) => `#${val}`,
    editable: false,
  },
  { // Data de Lançamento (NOVA Posição 2)
    key: "dataLancamento",
    label: "Data de Lançamento",
    minWidth: "150px",
    type: "date",
    editable: false, // Mantido como não editável no cabeçalho
    format: (val) => (val ? new Date(val).toLocaleDateString("pt-BR") : "—"),
  },
  { // Solicitante (NOVA Posição 3)
    key: "solicitante",
    label: "Solicitante",
    minWidth: "150px",
    type: "text",
    editable: false, // Mantido como não editável no cabeçalho
    format: (id) => `${getNomePorId(id, mockUsuarios)}`,
  },
  { // Titular (NOVA Posição 4)
    key: "titular",
    label: "Titular",
    minWidth: "200px",
    type: "text",
    format: (id) => `${getNomePorId(id, mockTitulares)}`, // Mostra só o nome no cabeçalho
  },
  { // Referente (Posição 5)
    key: "referente",
    label: "Referente",
    minWidth: "200px",
    type: "text"
  },
  { // Valor (Posição 6)
    key: "valor",
    label: "VALOR",
    minWidth: "130px",
    type: "currency"
  },
  { // Obra (Posição 7)
    key: "obra",
    label: "Obra",
    minWidth: "180px",
    type: "select",
    options: obraOptions,
    format: (id) => `${getNomePorId(id, mockObras)}`,
  },
  { // Data Pagamento (Posição 8)
    key: "dataPagamento",
    label: "Data Pagamento",
    minWidth: "150px",
    type: "date",
    format: (val) => (val ? new Date(val).toLocaleDateString("pt-BR") : "—"),
  },
  { // Forma Pagto (Posição 9)
    key: "formaDePagamento",
    label: "Forma Pagto",
    minWidth: "130px",
    type: "select",
    options: formaPagamentoOptions,
  },
  { // LANÇADO (NOVA Posição 10 - FIM)
    key: "statusLancamento",
    label: "LANÇADO",
    minWidth: "120px",
    type: "boolean",
    format: (val) => (
      <span
        className={`px-3 py-1 text-xs font-semibold rounded-full min-w-[80px] text-center ${getStatusClasses(
          val
        )}`}
      >
        {val ? "LANÇADO" : "NÃO LANÇADO"}
      </span>
    ),
  },
];

// Campos expandidos (AGORA CONTÉM ITENS REMOVIDOS DO CABEÇALHO)
const expandedFields = [
  {
    key: "quemPaga",
    label: "Quem Paga (ID)",
    type: "select",
    options: Object.keys(mockUsuarios).map((id) => ({
      id: Number(id),
      nome: mockUsuarios[id],
    })),
    format: (id) => `${getNomePorId(id, mockUsuarios)} (ID: ${id})`,
  },
  {
    key: "cpfCnpjTitularConta",
    label: "CPF/CNPJ titular conta",
    type: "text",
    format: formatCpfCnpj,
  },
  {
    key: "chavePix",
    label: "Chave PIX",
    type: "text",
    format: (val) => val,
  },
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
  { key: "indiceEtapa", label: "ÍNDICE ETAPA", type: "text" },
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
    format: (val) => (
      <a
        href={val || "#"}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => {
          if (!val) {
            e.preventDefault();
            toast.info("Nenhum arquivo anexado.");
          }
        }}
        className="text-blue-600 hover:text-blue-800 underline"
      >
        {val ? "Ver Documento (Drive)" : "Nenhum Anexo"}
      </a>
    ),
  },
  { key: "observacao", label: "Observação", type: "textarea" },
];

// --- Componente Principal ---
const Dashboard = () => {
  const [requests, setRequests] = useState(initialRequestsMock);
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [selectedRequests, setSelectedRequests] = useState([]);
  const [expandedRows, setExpandedRows] = useState([]);

  // ... (Funções de Lógica - MANTIDAS)
  const toggleRowExpansion = (id) => {
    setExpandedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  const handleSelectOne = (id) => {
    setSelectedRequests((prevSelected) =>
      prevSelected.includes(id)
        ? prevSelected.filter((reqId) => reqId !== id)
        : [...prevSelected, id]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRequests(requests.map((req) => req.id));
    } else {
      setSelectedRequests([]);
    }
  };

  const isAllSelected =
    selectedRequests.length === requests.length && requests.length > 0;

  const handleEdit = (request) => {
    if (editingId) {
      toast.error("Finalize a edição atual antes de iniciar outra.");
      return;
    }
    setExpandedRows((prev) =>
      prev.includes(request.id) ? prev : [...prev, request.id]
    );

    setSelectedRequests((prevSelected) =>
      prevSelected.filter((id) => id !== request.id)
    );
    setEditingId(request.id);
    setEditFormData({ ...request });

    document
      .getElementById(`row-${request.id}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    let newValue = value;

    if (name === "valor") {
      newValue = value.replace(/\D/g, "");
    }

    if (type === "checkbox") {
      newValue = checked;
    }

    // Converte valores para número se for ID (obra, quemPaga, titular)
    if (name === "quemPaga" || name === "obra" || name === "titular") {
      newValue = Number(value);
    }

    setEditFormData((prevData) => ({ ...prevData, [name]: newValue }));
  };

  const handleSave = () => {
    setIsSaving(true);
    const rawValue = String(editFormData.valor).replace(/\D/g, "");

    if (rawValue.length === 0) {
      toast.error("O campo 'VALOR' é obrigatório.");
      setIsSaving(false);
      return;
    }
    if (!editFormData.dataPagamento) {
      toast.error("O campo 'Data Pagamento' é obrigatório.");
      setIsSaving(false);
      return;
    }

    setTimeout(() => {
      setRequests((prevRequests) =>
        prevRequests.map((req) =>
          req.id === editingId ? { ...editFormData, valor: rawValue } : req
        )
      );
      setEditingId(null);
      setEditFormData({});
      setIsSaving(false);
      toast.success("Solicitação atualizada com sucesso!");
    }, 1000);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData({});
    toast("Edição cancelada.", { icon: "👋" });
  };

  const handleRemove = (id) => {
    if (editingId) {
      toast.error("Finalize a edição atual antes de remover.");
      return;
    }
    if (window.confirm("Tem certeza que deseja remover esta solicitação?")) {
      setRequests((prevRequests) =>
        prevRequests.filter((req) => req.id !== id)
      );
      setSelectedRequests((prevSelected) =>
        prevSelected.filter((reqId) => reqId !== id)
      );
      toast.success("Solicitação removida.");
    }
  };

  const handleGenerateCSV = () => {
    if (selectedRequests.length === 0) {
      toast.error("Selecione pelo menos um registro para gerar o CSV.");
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      // Simulação: Marcar registros como gerados no CSV (statusGeradoCSV: true)
      setRequests((prevRequests) =>
        prevRequests.map((req) => {
          if (selectedRequests.includes(req.id)) {
            return { ...req, statusGeradoCSV: true };
          }
          return req;
        })
      );
      setSelectedRequests([]);
      setIsSaving(false);
      toast.success(
        `${selectedRequests.length} registro(s) marcado(s) como 'Gerado' e CSV simulado com sucesso!`
      );
    }, 1500);
  };

  // --- Função Central de Renderização de Campo (AJUSTADA) ---
  const renderField = (key, data, isEditing, colConfig = {}, request) => {
    // Busca a configuração da coluna na lista de colunas principais ou expandidas
    const fieldConfig =
      tableColumns.find((c) => c.key === key) ||
      expandedFields.find((c) => c.key === key) ||
      colConfig;
    const value = data[key];
    const editable = fieldConfig.editable !== false; // Padrão é editável

    // Renderiza INPUT/SELECT se for modo edição E o campo for editável
    if (isEditing && editable) {
      if (fieldConfig.type === "select") {
        // Verifica se é um select que usa a estrutura {id, nome} (como quemPaga, obra ou titular)
        const isIdSelect =
          fieldConfig.key === "quemPaga" || fieldConfig.key === "obra" || fieldConfig.key === "titular";

        // Define a lista de opções com base na chave (obra, quemPaga, titular, ou lista simples)
        let selectOptions = fieldConfig.options;
        if (fieldConfig.key === 'titular') {
          selectOptions = Object.keys(mockTitulares).map((id) => ({
            id: Number(id),
            nome: mockTitulares[id],
          }));
        }

        return (
          <select
            name={key}
            value={value}
            onChange={handleEditChange}
            className="w-full px-2 py-1 border border-blue-400 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
          >
            {/* Adicionar opção de placeholder para campos opcionais */}
            {isIdSelect && !value && <option value="">Selecione...</option>}

            {isIdSelect
              ? selectOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.nome}{" "}
                    {/* Adiciona o ID para quemPaga e titular no modo edição de detalhes*/}
                    {(fieldConfig.key === "quemPaga" || fieldConfig.key === "titular") ? `(ID: ${opt.id})` : ""}
                  </option>
                ))
              : selectOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
          </select>
        );
      }

      // Renderização para BOOLEAN (Checkbox)
      if (fieldConfig.type === "boolean") {
        return (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              name={key}
              checked={!!value}
              onChange={handleEditChange}
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-700">
              {key === "statusLancamento"
                ? value
                  ? "LANÇADO"
                  : "NÃO LANÇADO"
                : value
                ? "Marcado (true)"
                : "Desmarcado (false)"}
            </span>
          </div>
        );
      }

      if (fieldConfig.type === "currency") {
        return (
          <input
            type="text"
            name={key}
            value={formatCurrencyDisplay(value)}
            onChange={handleEditChange}
            className="w-full px-2 py-1 border border-blue-400 rounded-md text-sm font-semibold text-green-700 focus:ring-2 focus:ring-blue-500"
            inputMode="numeric"
          />
        );
      }

      if (fieldConfig.type === "textarea") {
        return (
          <textarea
            name={key}
            value={value || ""}
            onChange={handleEditChange}
            rows="2"
            className="w-full px-2 py-1 border border-blue-400 rounded-md text-sm focus:ring-2 focus:ring-blue-500 resize-none"
          />
        );
      }

      // Se não for editável (e estamos no modo edição), exibe o valor em um campo desabilitado
      if (!editable) {
        return (
          <input
            type="text"
            name={key}
            value={fieldConfig.format ? fieldConfig.format(value) : value || ""}
            disabled
            className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm bg-gray-100 cursor-not-allowed"
          />
        );
      }

      // Default: Text/Date/Number input
      return (
        <input
          type={fieldConfig.type || "text"}
          name={key}
          value={value || ""}
          onChange={handleEditChange}
          className="w-full px-2 py-1 border border-blue-400 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
        />
      );
    }

    // Renderiza Texto (Modo Visualização)
    if (key === "statusLancamento") {
      return (
        <span
          className={`px-3 py-1 text-xs font-semibold rounded-full min-w-[80px] text-center ${getStatusClasses(
            value
          )}`}
        >
          {value ? "LANÇADO" : "NÃO LANÇADO"}
        </span>
      );
    }
    if (key === "valor") {
      return (
        <span className="text-sm font-bold text-green-700">
          {formatCurrencyDisplay(value)}
        </span>
      );
    }

    // Aplica o formato definido nas colunas/campos (para ID's, datas, etc.)
    if (fieldConfig.format) {
      return (
        <span className="text-sm text-gray-700">
          {fieldConfig.format(value, request)}
        </span>
      );
    }
    return <span className="text-sm text-gray-700">{value}</span>;
  };

  // --- Renderização do Componente ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 lg:p-8">
      <Toaster position="top-right" />

      {/* Botão Flutuante para CSV */}
      {selectedRequests.length > 0 && (
        <div className="fixed bottom-8 right-8 z-50">
          <button
            onClick={handleGenerateCSV}
            className="flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-semibold py-4 px-8 rounded-2xl shadow-2xl hover:shadow-indigo-500/50 hover:scale-105 transition-all duration-300"
            disabled={editingId !== null || isSaving}
          >
            {isSaving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <FileText className="w-5 h-5" />
            )}
            Gerar CSV e Marcar ({selectedRequests.length})
          </button>
        </div>
      )}

      <div className="max-w-[1800px] mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 lg:p-8 mb-6">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">
            Tabela de Gerenciamento de Pagamentos
          </h1>
          <p className="text-gray-600 mt-1">
            Visualização horizontal e edição em linha. Clique na seta para
            expandir os detalhes editáveis.
          </p>
        </div>

        {/* Tabela */}
        <div className="bg-white rounded-2xl shadow-lg overflow-x-auto">
          {requests.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              Nenhuma solicitação encontrada.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-20">
                <tr>
                  {/* Coluna Ações Fixa (left-0) */}
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12 sticky left-0 bg-gray-50 z-10 min-w-[180px]">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                        disabled={editingId !== null}
                      />
                      Açõess
                  </div>
                  </th>
                  {/* Cabeçalhos Principais */}
                  {tableColumns.map((col) => (
                    <th
                      key={col.key}
                      className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      style={{ minWidth: col.minWidth || "100px" }}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {requests.map((request) => {
                  const isEditing = editingId === request.id;
                  const isExpanded = expandedRows.includes(request.id);
                  const isSelected = selectedRequests.includes(request.id);
                  const currentRowData = isEditing ? editFormData : request;
                  const rowClasses = isEditing
                    ? "bg-yellow-50 ring-2 ring-yellow-400"
                    : isSelected
                    ? "bg-blue-50"
                    : "bg-white";

                  return (
                    <React.Fragment key={request.id}>
                      {/* --- LINHA PRINCIPAL --- */}
                      <tr
                        id={`row-${request.id}`}
                        className={`border-b hover:bg-gray-50 transition-colors ${rowClasses}`}
                      >
                        {/* Coluna Ações (Fixo) */}
                        <td
                          className={`px-3 py-3 whitespace-nowrap sticky left-0 z-10 ${rowClasses}`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleSelectOne(request.id)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              disabled={editingId !== null}
                            />

                            {/* Botões de Ação */}
                            {isEditing ? (
                              <>
                                <button
                                  onClick={handleSave}
                                  disabled={isSaving}
                                  className={`p-2 rounded-full ${
                                    isSaving
                                      ? "bg-gray-400 cursor-not-allowed"
                                      : "bg-green-500 text-white hover:bg-green-600"
                                  }`}
                                  title="Salvar"
                                >
                                  {isSaving ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Save className="w-4 h-4" />
                                  )}
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  disabled={isSaving}
                                  className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600"
                                  title="Cancelar"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleEdit(request)}
                                  disabled={editingId !== null}
                                  className="p-2 rounded-full text-blue-600 hover:bg-blue-100 disabled:opacity-50"
                                  title="Editar"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleRemove(request.id)}
                                  disabled={editingId !== null}
                                  className="p-2 rounded-full text-red-600 hover:bg-red-100 disabled:opacity-50"
                                  title="Remover"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => toggleRowExpansion(request.id)}
                              className="p-1 rounded-full text-gray-600 hover:bg-gray-200"
                              title={
                                isExpanded ? "Ocultar Detalhes" : "Ver Detalhes"
                              }
                            >
                              <ChevronDown
                                className={`w-4 h-4 transform transition-transform ${
                                  isExpanded ? "rotate-180" : "rotate-0"
                                }`}
                              />
                            </button>
                          </div>
                        </td>

                        {/* Células de Dados Principais */}
                        {tableColumns.map((col) => (
                          <td
                            key={col.key}
                            className="px-3 py-3 whitespace-nowrap text-sm"
                          >
                            {renderField(
                              col.key,
                              currentRowData,
                              isEditing,
                              col,
                              request
                            )}
                          </td>
                        ))}
                      </tr>

                      {/* --- LINHA EXPANDIDA (DETALHES) --- */}
                      {isExpanded && (
                        <tr
                          className={`bg-gray-100 border-b ${
                            isEditing ? "border-yellow-400" : "border-gray-200"
                          }`}
                        >
                          <td colSpan={tableColumns.length + 1} className="p-4">
                            <h4 className="text-sm font-bold text-gray-700 mb-3">
                              Detalhes Adicionais:
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-xs">
                              {expandedFields.map((field) => (
                                <div key={field.key} className="flex flex-col">
                                  <span className="font-semibold uppercase text-gray-500 mb-1">
                                    {field.label}:
                                  </span>
                                  {renderField(
                                    field.key,
                                    currentRowData,
                                    isEditing,
                                    field,
                                    request
                                  )}
                                </div>
                              ))}
                            </div>
                            {isEditing && (
                              <div className="mt-4 p-2 bg-yellow-100 rounded text-xs text-yellow-800">
                                <span className="font-semibold">
                                  Modo Edição Ativo:
                                </span>{" "}
                                Edite os campos destacados em azul.
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

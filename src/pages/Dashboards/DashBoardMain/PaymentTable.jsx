import React from "react";
import { Edit, Save, Trash2, X, Loader2, ChevronDown,FileText } from "lucide-react";
// ✅ CORREÇÃO DE IMPORT: Garantindo que getNameById seja importado corretamente
import { formatCurrencyDisplay, getStatusClasses, getNameById } from "./dashboard.data"; 
// import toast from "react-hot-toast"; // Removido se não estiver sendo usado

const PaymentTable = ({
  // Novas props para configuração dinâmica
  listaObras = [], // Recebe a lista de obras
  listaTitulares = [], 
  listaUsuarios = [], 
  columns = [],
  expandedFieldsConfig = [],

  // Props de dados e estado
  filteredRequests,
  isAllSelected,
  selectedRequests,
  editingId,
  editFormData,
  isSaving,
  expandedRows,

  // Handlers
  handleSelectAll,
  handleSelectOne,
  handleEdit,
  handleSave,
  handleCancelEdit,
  handleRemove,
  toggleRowExpansion,
  handleEditChange, 
  handleToggleLancamento,
  handleExportToXLS,

  // Props para autocomplete de titular
  titularSuggestions = [],
  isLoadingSuggestions = false,
  showTitularSuggestions = false,
  selectedSuggestionIndex = -1,
  isTitularLocked = false,
  handleSelectTitular = () => {},
  handleKeyDown = () => {},
  autocompleteDropdownRef = null,
}) => {
  
  // --- Lógica de Renderização de Campos ---
  const renderField = (key, data, isEditing, colConfig = {}, request) => {
    const fieldConfig =
      columns.find((c) => c.key === key) ||
      expandedFieldsConfig.find((c) => c.key === key) ||
      colConfig;

    const value = data[key];
    const editable = fieldConfig.editable !== false;

    // --- MODO DE EDIÇÃO ---
    if (isEditing && editable) {
      
      // --- SELECT ---
      if (fieldConfig.type === "select") {
        // ✅ AJUSTE: Garante que a lista de opções correta seja usada
        const isObraOrTitular = key === "obra" || key === "titular";
        let selectOptions = fieldConfig.options || [];

        if (key === "obra") {
            selectOptions = listaObras;
        } else if (key === "titular") {
            selectOptions = listaTitulares;
        } else if (key === "solicitante") {
            selectOptions = listaUsuarios;
        }
        
        // Verifica se é um select de IDs (Objeto {id, nome})
        const isIdSelect = 
            isObraOrTitular || 
            ["quemPaga", "solicitante"].includes(key) ||
            (selectOptions.length > 0 && typeof selectOptions[0] === "object");


        return (
          <select
            name={key}
            // 🥇 SOLUÇÃO: Converte o ID de edição para string para garantir o match no <select>
            value={value != null ? String(value) : ""}
            onChange={handleEditChange}
            className="w-full px-2 py-1 border border-blue-400 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecione...</option>
            {selectOptions.map((opt) => {
              // Se for objeto {id, nome} (Caso da Obra, Titular, Solicitante)
              if (isIdSelect && typeof opt === "object" && opt.id != null) {
                const displayName = opt.nome || opt.name || `ID: ${opt.id}`;
                
                return (
                  // 🥈 SOLUÇÃO: Converte o ID da opção para string para garantir o match
                  <option key={opt.id} value={String(opt.id)}> 
                    {displayName} {/* Isso é o que o usuário vê (o nome) */}
                  </option>
                );
              }
              // Se for um array de strings (Opções de Formas de Pagamento, por exemplo)
              if (typeof opt === "string") {
                return (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                );
              }
              return null; // Ignora outros formatos
            })}
          </select>
        );
      }

      // --- BOOLEAN (CHECKBOX) ---
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
                ? "Marcado"
                : "Desmarcado"}
            </span>
          </div>
        );
      }

      // --- DATE ---
      if (fieldConfig.type === "date") {
        return (
          <input
            type="date"
            name={key}
            value={value || ""}
            onChange={handleEditChange}
            className="w-full px-2 py-1 border border-blue-400 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
          />
        );
      }

      // --- CURRENCY ---
      if (fieldConfig.type === "currency") {
        const formatValueToInput = (rawValue) => {
            if (!rawValue) return "";
            const numericString = String(rawValue).replace(/\D/g, "");
            return (Number(numericString) / 100).toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            });
        };

        return (
          <input
            type="text"
            name={key}
            value={formatValueToInput(value)} 
            onChange={handleEditChange}
            placeholder="0,00"
            className="w-full px-2 py-1 border border-blue-400 rounded-md text-sm focus:ring-2 focus:ring-blue-500 font-semibold text-green-600"
          />
        );
      }

      // --- TEXTAREA ---
      if (fieldConfig.type === "textarea") {
        return (
          <textarea
            name={key}
            value={value || ""}
            onChange={handleEditChange}
            className="w-full px-2 py-1 border border-blue-400 rounded-md text-sm focus:ring-2 focus:ring-blue-500 resize-none"
            rows="3"
          />
        );
      }

      // --- CAMPO ESPECIAL: TITULAR COM AUTOCOMPLETE ---
      if (key === "titular" && editingId) {
        return (
          <div
            ref={autocompleteDropdownRef}
            className="relative w-full"
          >
            <input
              type="text"
              name={key}
              value={value || ""}
              onChange={handleEditChange}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (value && typeof value === "string" && value.trim() && titularSuggestions.length > 0) {
                  // Lógica de abertura do dropdown (se necessário)
                }
              }}
              placeholder="Digite o nome do fornecedor..."
              className={`w-full px-2 py-1 border border-blue-400 rounded-md text-sm focus:ring-2 focus:ring-blue-500 ${
                isTitularLocked ? "bg-gray-100 cursor-not-allowed" : ""
              }`}
              disabled={isTitularLocked}
              autoComplete="off"
            />

            {/* Dropdown de Sugestões */}
            {showTitularSuggestions && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {isLoadingSuggestions ? (
                  <div className="px-4 py-3 text-center text-gray-500 text-sm">
                    Carregando...
                  </div>
                ) : titularSuggestions.length > 0 ? (
                  <ul className="divide-y divide-gray-200">
                    {titularSuggestions.map((suggestion, index) => (
                      <li
                        key={index}
                        onClick={() => handleSelectTitular(suggestion)}
                        className={`px-4 py-3 cursor-pointer transition ${
                          index === selectedSuggestionIndex
                            ? "bg-blue-100 text-blue-900"
                            : "hover:bg-gray-100 text-gray-800"
                        }`}
                      >
                        <div className="font-medium text-sm">
                          {suggestion.titular}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {suggestion.cpf_cnpj}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="px-4 py-3 text-center text-gray-500 text-sm">
                    Nenhum fornecedor encontrado.
                  </div>
                )}
              </div>
            )}
          </div>
        );
      }

      // --- INPUT DE TEXTO PADRÃO ---
      return (
        <input
          type="text"
          name={key}
          value={value || ""}
          onChange={handleEditChange}
          className="w-full px-2 py-1 border border-blue-400 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
        />
      );
    }

    // --- RENDERIZAÇÃO EM MODO VISUALIZAÇÃO (Tabela Principal e Expandida) ---
    
    // ✅ CORREÇÃO 1: Prioriza o format definido na coluna (como o de 'obra' em dashboard.data.jsx)
    if (fieldConfig.format) {
      return fieldConfig.format(value);
    }
    
    // ✅ CORREÇÃO 2: A tradução de ID fica como fallback, se não houver um formatador específico
    if (["obra", "titular", "solicitante"].includes(key)) {
        let list;
        if (key === "obra") list = listaObras;
        else if (key === "titular") list = listaTitulares; 
        else if (key === "solicitante") list = listaUsuarios;

        // Usa a função auxiliar para traduzir o ID para o Nome
        const name = list ? getNameById(list, value) : (value || "—"); 
        return <span className="text-gray-900">{name}</span>;
    }


    if (fieldConfig.isLink && value) {
      return (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline"
        >
          {value}
        </a>
      );
    }

    return value || "—";
  };

  // --- RENDERIZAÇÃO PRINCIPAL ---
return (
  // O wrapper principal da tabela
  <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">

    {/* ========================================================= */}
    {/* ✅ NOVO CONTROLE DE AÇÃO E EXPORTAÇÃO */}
    {/* Este bloco fica acima da tabela ou da mensagem de "nenhum registro encontrado" */}
    {/* ========================================================= */}
    <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
      
      {/* Exibe o número de itens selecionados */}
      <span className="text-sm font-medium text-gray-700">
        {/* Usa selectedRequests.length que deve vir das props */}
        {selectedRequests.length > 0 ? `${selectedRequests.length} registro(s) selecionado(s)` : 'Nenhum registro selecionado'}
      </span>

      {/* --- BOTÃO DE EXPORTAÇÃO --- */}
      <button
        type="button"
        // handleExportToXLS é a nova prop do Dashboard
        onClick={handleExportToXLS} 
        // Desabilita se nada estiver selecionado OU se estiver editando
        disabled={selectedRequests.length === 0 || editingId !== null} 
        className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white transition-colors duration-150 ${
          selectedRequests.length > 0 && editingId === null
            ? 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
            : 'bg-gray-400 cursor-not-allowed' // Estilo para desabilitado
        }`}
      >
        <FileText className="h-5 w-5 mr-2" /> 
        Exportar para XLS
      </button>
    </div>
    
    {filteredRequests.length === 0 ? (
      <div className="p-12 text-center text-gray-500">
        Nenhum registro encontrado.
      </div>
    ) : (
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50 sticky top-0 z-20">
          <tr>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12 sticky left-0 bg-gray-50 z-10 min-w-[140px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={handleSelectAll}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                  disabled={editingId !== null}
                />
                Ações
              </div>
              </th>
              {/* Mapeia as colunas recebidas via Props */}
              {columns.map((col) => (
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
            {filteredRequests.map((request) => {
              const isEditing = editingId === request.id;
              const isExpanded = expandedRows.includes(request.id);
              const isSelected = selectedRequests.includes(request.id);
              const currentRowData = isEditing ? editFormData : request;

              const rowClasses = isEditing
                ? "bg-yellow-50 ring-2 ring-yellow-400 z-10 relative"
                : isSelected
                ? "bg-blue-50"
                : "bg-white";

              return (
                <React.Fragment key={request.id}>
                  <tr
                    id={`row-${request.id}`}
                    className={`border-b hover:bg-gray-50 transition-colors ${rowClasses}`}
                  >
                    {/* Célula de Ações Fixa */}
                    <td
                      className={`px-3 py-3 whitespace-nowrap sticky left-0 z-10 ${rowClasses} shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectOne(request.id)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          disabled={editingId !== null}
                        />
                        {isEditing ? (
                          <>
                            <button
                              onClick={handleSave}
                              disabled={isSaving}
                              title="Salvar"
                              className={`p-1.5 rounded-full transition-colors ${
                                isSaving
                                  ? "bg-gray-400 cursor-not-allowed"
                                  : "bg-green-500 text-white hover:bg-green-600"
                              }`}
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
                              title="Cancelar"
                              className="p-1.5 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEdit(request)}
                              disabled={editingId !== null}
                              title="Editar"
                              className="p-1.5 rounded-full text-blue-600 hover:bg-blue-100 disabled:opacity-50 transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRemove(request.id)}
                              disabled={editingId !== null}
                              title="Excluir"
                              className="p-1.5 rounded-full text-red-600 hover:bg-red-100 disabled:opacity-50 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => toggleRowExpansion(request.id)}
                          title="Detalhes"
                          className="p-1 rounded-full text-gray-600 hover:bg-gray-200 transition-colors"
                        >
                          <ChevronDown
                            className={`w-4 h-4 transform transition-transform ${
                              isExpanded ? "rotate-180" : "rotate-0"
                            }`}
                          />
                        </button>
                      </div>
                    </td>

                    {/* Células de Dados */}
                    {columns.map((col) => (
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

                  {/* Linha Expandida */}
                  {isExpanded && (
                    <tr
                      className={`bg-gray-100 border-b ${
                        isEditing ? "border-yellow-400" : "border-gray-200"
                      }`}
                    >
                      <td colSpan={columns.length + 1} className="p-4">
                        <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                          <div className="w-1 h-4 bg-indigo-500 rounded-full"></div>
                          Detalhes Adicionais
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-xs">
                          {/* Usa expandedFieldsConfig recebido via props */}
                          {expandedFieldsConfig.map((field) => (
                            <div key={field.key} className="flex flex-col">
                              <span className="font-semibold uppercase text-gray-500 mb-1">
                                {field.label}:
                              </span>
                              <div className="min-h-[24px] flex items-center">
                                {renderField(
                                  field.key,
                                  currentRowData,
                                  isEditing,
                                  field,
                                  request
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
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
  );
};

export default PaymentTable;
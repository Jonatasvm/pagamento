import React from "react";
import { Edit, Save, Trash2, X, Loader2, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
// ✅ CORREÇÃO DE IMPORT: Garantindo que getNameById seja importado corretamente
import { formatCurrencyDisplay, getStatusClasses, getNameById } from "./dashboard.data";

const PaymentTable = ({
  // Novas props para configuração dinâmica
  listaObras = [], // Recebe a lista de obras
  listaTitulares = [], 
  listaUsuarios = [],
  listaBancos = [],
  listaCategorias = [],
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
  
  // ✅ FUNÇÃO DE DOWNLOAD DIRETO DO GOOGLE DRIVE
  const handleDownloadFile = async (driveUrl) => {
    try {
      // Extrair o file_id da URL do Google Drive
      const fileIdMatch = driveUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      const fileId = fileIdMatch ? fileIdMatch[1] : null;

      if (!fileId) {
        toast.error("ID do arquivo inválido");
        return;
      }

      // URL de download direto do Google Drive
      const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

      // Criar um elemento <a> invisível para triggar o download
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", "");
      link.style.display = "none";
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Download iniciado!");
    } catch (error) {
      console.error("Erro ao fazer download:", error);
      toast.error("Erro ao fazer download do arquivo");
    }
  };
  
  // --- Lógica de Renderização de Campos ---
  const renderField = (key, data, isEditing, colConfig = {}, request) => {
    const fieldConfig =
      columns.find((c) => c.key === key) ||
      expandedFieldsConfig.find((c) => c.key === key) ||
      colConfig;

    // ✅ NOVO: Ignora campos que não devem ser renderizados na tabela
    if (["obras_relacionadas", "valor_total", "grupo_lancamento", "multiplos_lancamentos", "valor_principal", "rn"].includes(key)) {
      return null;
    }

    const value = data[key];
    const editable = fieldConfig.editable !== false;
    
    // ✅ DEBUG
    if (key === "valor" && request?.id) {
      console.log("🔍 renderField - valor:", {
        key,
        id: request?.id,
        valor: request?.valor,
        obras_relacionadas: request?.obras_relacionadas,
        obras_relacionadas_length: request?.obras_relacionadas?.length
      });
    }

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
        } else if (key === "conta") {
            selectOptions = listaBancos;
        } else if (key === "categoria") {
            selectOptions = listaCategorias;
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
    
    // ✅ NOVO: VERIFICA MÚLTIPLOS LANÇAMENTOS PRIMEIRO (antes de qualquer format!)
    if (key === "valor" && request?.obras_relacionadas?.length > 0) {
      const valorTotal = (request.valor_total !== undefined) 
        ? request.valor_total 
        : (parseFloat(request.valor || 0) + 
           (request.obras_relacionadas?.reduce((acc, o) => acc + parseFloat(o.valor || 0), 0) || 0));
      
      console.log("🟢 MÚLTIPLO LANÇAMENTO DETECTADO:", {
        id: request.id,
        valor: request.valor,
        valor_total_raw: request.valor_total,
        obras_relacionadas: request.obras_relacionadas,
        valorTotalCalculado: valorTotal,
        valorTotalFixado: valorTotal.toFixed(2)
      });
      
      return (
        <div className="flex flex-col">
          <span className="font-bold text-green-700">R$ {valorTotal.toFixed(2).replace(".", ",")}</span>
          <span className="text-xs text-gray-500">(total: {request.obras_relacionadas.length + 1} obras)</span>
        </div>
      );
    }
    
    // ✅ CORREÇÃO 1: Prioriza o format definido na coluna (como o de 'obra' em dashboard.data.jsx)
    if (fieldConfig.format) {
      return fieldConfig.format(value);
    }
    
    // ✅ CORREÇÃO 2: A tradução de ID fica como fallback, se não houver um formatador específico
    if (["obra", "titular", "solicitante", "conta"].includes(key)) {
        let list;
        if (key === "obra") list = listaObras;
        else if (key === "titular") list = listaTitulares; 
        else if (key === "solicitante") list = listaUsuarios;
        else if (key === "conta") list = listaBancos;
        else if (key === "categoria") list = listaCategorias;

        // Usa a função auxiliar para traduzir o ID para o Nome
        const name = list ? getNameById(list, value) : (value || "—"); 
        return <span className="text-gray-900">{name}</span>;
    }


    if (fieldConfig.isLink && value) {
      return (
        <button
          onClick={() => handleDownloadFile(value)}
          className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded transition duration-200"
          title="Clique para baixar o arquivo"
        >
          📎 Baixar
        </button>
      );
    }

    return value || "—";
  };

  // --- RENDERIZAÇÃO PRINCIPAL ---
  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100">
      {filteredRequests.length === 0 ? (
        <div className="p-12 text-center text-gray-500">
          Nenhum registro encontrado.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl">
        <table className="w-full divide-y divide-gray-200 whitespace-nowrap">
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
              const isMultiple = request.grupo_lancamento && request.obras_relacionadas?.length > 0; // ✅ CORRIGIDO: Verificar se tem grupo_lancamento e obras_relacionadas

              const rowClasses = isEditing
                ? "bg-yellow-50 ring-2 ring-yellow-400 z-10 relative"
                : isSelected
                ? "bg-blue-50"
                : isMultiple
                ? "bg-purple-50" // ✅ NOVO: Cor roxo para lançamentos múltiplos
                : "bg-white";

              return (
                <React.Fragment key={request.id}>
                  <tr
                    id={`row-${request.id}`}
                    className={`border-b hover:bg-gray-50 transition-colors ${rowClasses} ${isMultiple ? "border-l-4 border-l-purple-600" : ""}`}
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
                        
                        {/* ✅ NOVO: Mostrar obras relacionadas se existirem */}
                        {request.obras_relacionadas && request.obras_relacionadas.length > 0 && (
                          <div className="mb-6 p-4 bg-purple-100 rounded-lg border-2 border-purple-400">
                            <h5 className="font-bold text-purple-900 mb-4 text-base">
                              📋 Lançamento Múltiplo - Distribuição por Obra
                            </h5>
                            {console.log("DEBUG: request.obra type:", typeof request.obra, "value:", request.obra)}
                            <div className="space-y-2">
                              {/* Obra Principal */}
                              <div className="flex justify-between items-center bg-white p-3 rounded border-l-4 border-l-green-500">
                                <span className="text-sm font-semibold text-gray-800">
                                  {getNameById(listaObras, request.obra) || `Obra ${request.obra}`}
                                </span>
                                <span className="text-sm font-bold text-green-600">
                                  R$ {parseFloat(request.valor_principal || request.valor || 0).toFixed(2).replace(".", ",")}
                                </span>
                              </div>
                              
                              {/* Obras Relacionadas */}
                              {request.obras_relacionadas.map((obra, idx) => (
                                <div key={obra.id} className="flex justify-between items-center bg-white p-3 rounded border-l-4 border-l-blue-500">
                                  <span className="text-sm font-semibold text-gray-800">
                                    {getNameById(obra.obra, listaObras) || `Obra ${obra.obra}`}
                                  </span>
                                  <span className="text-sm font-bold text-blue-600">
                                    R$ {parseFloat(obra.valor || 0).toFixed(2).replace(".", ",")}
                                  </span>
                                </div>
                              ))}
                              
                              {/* Total */}
                              <div className="flex justify-between items-center bg-gradient-to-r from-purple-300 to-purple-400 p-3 rounded font-bold border-2 border-purple-600">
                                <span className="text-sm text-purple-900">💰 Total do Lançamento</span>
                                <span className="text-base text-purple-900">
                                  R$ {(request.valor_total !== undefined 
                                    ? request.valor_total 
                                    : (parseFloat(request.valor_principal || request.valor || 0) + 
                                       request.obras_relacionadas.reduce((acc, o) => acc + parseFloat(o.valor || 0), 0))
                                  ).toFixed(2).replace(".", ",")}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                        
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
        </div>
      )}
    </div>
  );
};

export default PaymentTable;
import React from "react";
import { createPortal } from "react-dom";
import { Edit, Save, Trash2, X, Loader2, ChevronDown, Flag, Repeat } from "lucide-react";
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
  handleEditObraRelacionada, // ✅ NOVO: Para editar obras relacionadas 

  // Props para autocomplete de titular
  titularSuggestions = [],
  isLoadingSuggestions = false,
  showTitularSuggestions = false,
  selectedSuggestionIndex = -1,
  isTitularLocked = false,
  handleSelectTitular = () => {},
  handleKeyDown = () => {},
  handleTitularFocus = () => {},
  handleUnlockTitular = () => {},
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
  const renderField = (key, data, isEditing, colConfig = {}, request, handleEditChange) => {
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
    
    // ✅ ALERTA: Se está em edição mas não encontrou fieldConfig
    if (isEditing && !fieldConfig) {
      console.error(`❌ ERRO: Não encontrou configuração para campo '${key}' em modo de edição`);
    }
    
    // --- MODO DE EDIÇÃO ---
    if (isEditing && editable) {
      
      // --- CURRENCY ---
      if (fieldConfig.type === "currency") {
        return (
          <input
            type="text"
            name={key}
            value={String(value || "")}
            onChange={(e) => {
              // ✅ MÁSCARA: Só permite dígitos e vírgula, máximo 1 vírgula, máx 2 casas decimais
              let raw = e.target.value.replace(/[^\d,]/g, "");
              const parts = raw.split(",");
              if (parts.length > 2) raw = parts[0] + "," + parts.slice(1).join("");
              if (parts.length === 2 && parts[1].length > 2) raw = parts[0] + "," + parts[1].slice(0, 2);
              handleEditChange({ target: { name: key, value: raw, type: "text" } });
            }}
            onClick={(e) => {
              e.stopPropagation();
            }}
            placeholder="0,00"
            style={{position: "relative", zIndex: 1000, pointerEvents: 'auto'}}
            className="min-w-[120px] max-w-[150px] px-2 py-1 border border-blue-400 rounded-md text-sm focus:ring-2 focus:ring-blue-500 font-semibold text-green-600"
            autoFocus
          />
        );
      }
      
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
            className="min-w-[140px] max-w-[180px] px-2 py-1 border border-blue-400 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
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

      // --- CAMPO ESPECIAL: TITULAR COM AUTOCOMPLETE ---
      if (key === "titular" && editingId) {
        return (
          <div
            ref={autocompleteDropdownRef}
            className="relative w-full"
          >
            <div className="flex items-center gap-1">
              <input
                type="text"
                name={key}
                value={value || ""}
                onChange={handleEditChange}
                onKeyDown={handleKeyDown}
                onFocus={handleTitularFocus}
                placeholder="Digite o nome do fornecedor..."
                className={`w-full px-2 py-1 border border-blue-400 rounded-md text-sm focus:ring-2 focus:ring-blue-500 ${
                  isTitularLocked ? "bg-gray-100" : ""
                }`}
                disabled={isTitularLocked}
                autoComplete="off"
              />
              {isTitularLocked && (
                <button
                  type="button"
                  onClick={handleUnlockTitular}
                  title="Trocar fornecedor"
                  className="p-1 rounded-full text-orange-600 hover:bg-orange-100 transition-colors flex-shrink-0"
                >
                  <Repeat className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Dropdown de Sugestões - Renderizado via Portal para evitar corte por overflow */}
            {showTitularSuggestions && autocompleteDropdownRef?.current && createPortal(
              <div 
                className="bg-white border border-gray-300 rounded-lg shadow-xl max-h-60 overflow-y-auto"
                style={{
                  position: 'fixed',
                  zIndex: 99999,
                  width: autocompleteDropdownRef.current.getBoundingClientRect().width,
                  left: autocompleteDropdownRef.current.getBoundingClientRect().left,
                  top: autocompleteDropdownRef.current.getBoundingClientRect().bottom + 4,
                }}
                onMouseDown={(e) => e.preventDefault()}
              >
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
              </div>,
              document.body
            )}
          </div>
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
    
    // ✅ Flag visual para fornecedor NÃO cadastrado
    if (!isEditing && key === "titular" && request) {
      const nome = String(value || "—");
      const isNovo = request.fornecedor_novo || request.fornecedorNovo;
      return (
        <div className="flex items-center gap-1.5">
          <span className={`truncate font-medium ${isNovo ? "text-red-600" : "text-gray-900"}`}>{nome}</span>
          {isNovo && (
            <span 
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-600 whitespace-nowrap flex-shrink-0"
              title="Fornecedor NÃO cadastrado no sistema"
            >
              <Flag className="w-3 h-3" />
            </span>
          )}
        </div>
      );
    }

    // ✅ NOVO: Para múltiplos lançamentos, mostra o valor TOTAL na tabela
    if (!isEditing && key === "valor" && request?.grupo_lancamento && request?.obras_relacionadas?.length > 0) {
      const valorTotal = parseFloat(request.valor_principal || request.valor || 0) + 
                         (request.obras_relacionadas?.reduce((acc, o) => acc + parseFloat(o.valor || 0), 0) || 0);
      return fieldConfig.format ? fieldConfig.format(valorTotal) : formatCurrencyDisplay(valorTotal);
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
        <table className="w-full divide-y divide-gray-200" style={{ tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: "100px" }} />
            {columns.map((col) => (
              <col key={col.key} style={{ width: col.width || "auto" }} />
            ))}
          </colgroup>
          <thead className="bg-gray-50 sticky top-0 z-20">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                    disabled={editingId !== null}
                    title="Marca apenas lançamentos simples (múltiplos são automaticamente excluídos)"
                  />
                  Ações
                </div>
              </th>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
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
              const isMultiple = request.grupo_lancamento && request.obras_relacionadas?.length > 0;

              const rowClasses = isEditing
                ? "!bg-yellow-50 ring-2 ring-yellow-400 z-10 relative"
                : isSelected
                ? "!bg-blue-50"
                : isMultiple
                ? "!bg-green-300" // ✅ VERDE PARA MÚLTIPLOS (mais forte e com !)
                : "!bg-white";

              return (
                <React.Fragment key={request.id}>
                  <tr
                    id={`row-${request.id}`}
                    className={`border-b hover:bg-gray-50 transition-colors ${rowClasses} ${isMultiple ? "border-l-4 border-l-green-600 shadow-md" : ""}`}
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
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={editingId !== null || (request.grupo_lancamento && request.obras_relacionadas?.length > 0)}
                          title={isMultiple ? "Lançamentos múltiplos não podem ser exportados" : "Marcar para exportação"}
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
                        className={`px-3 py-3 text-sm ${rowClasses} overflow-hidden text-ellipsis`}
                        style={isEditing ? { pointerEvents: 'auto' } : {}}
                        title={typeof (isEditing ? editFormData[col.key] : request[col.key]) === 'string' ? (isEditing ? editFormData[col.key] : request[col.key]) : ''}
                      >
                        {renderField(
                          col.key,
                          currentRowData,
                          isEditing,
                          col,
                          request,
                          handleEditChange
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Linha Expandida */}
                  {isExpanded && (
                    <tr
                      className={`${isMultiple ? "bg-green-50" : "bg-gray-100"} border-b ${
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
                            <div className="space-y-2">
                              {/* Obra Principal */}
                              <div className="flex justify-between items-center bg-white p-3 rounded border-l-4 border-l-green-500">
                                <span className="text-sm font-semibold text-gray-800">
                                  {getNameById(listaObras, request.obra) || `Obra ${request.obra}`}
                                </span>
                                <span className="text-sm font-bold text-green-600">
                                  R$ {formatCurrencyDisplay(request.valor_principal || request.valor || 0)}
                                </span>
                              </div>
                              
                              {/* Obras Relacionadas */}
                              {request.obras_relacionadas.map((obra, idx) => (
                                <div key={obra.id} className={`flex gap-2 items-center bg-white p-3 rounded border-l-4 border-l-blue-500 ${isEditing ? "flex-col" : "justify-between"}`}>
                                  {isEditing ? (
                                    <>
                                      {/* Modo edição: Selecione a obra e edite o valor */}
                                      <select
                                        value={editFormData.obras_relacionadas?.[idx]?.obra || obra.obra || ""}
                                        onChange={(e) => handleEditObraRelacionada(idx, "obra", e.target.value)}
                                        className="w-full px-2 py-1 border border-blue-400 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                                      >
                                        <option value="">Selecione uma obra...</option>
                                        {listaObras.map((opt) => (
                                          <option key={opt.id} value={opt.id}>
                                            {opt.nome} (ID: {opt.id})
                                          </option>
                                        ))}
                                      </select>
                                      
                                      <input
                                        type="text"
                                        value={String(editFormData.obras_relacionadas?.[idx]?.valor || obra.valor || "")}
                                        onChange={(e) => handleEditObraRelacionada(idx, "valor", e.target.value)}
                                        placeholder="0,00"
                                        className="w-full px-2 py-1 border border-green-400 rounded-md text-sm focus:ring-2 focus:ring-green-500"
                                      />
                                    </>
                                  ) : (
                                    <>
                                      <span className="text-sm font-semibold text-gray-800">
                                        {getNameById(listaObras, obra.obra) || `Obra ${obra.obra}`}
                                      </span>
                                      <span className="text-sm font-bold text-blue-600">
                                        R$ {formatCurrencyDisplay(obra.valor || 0)}
                                      </span>
                                    </>
                                  )}
                                </div>
                              ))}
                              
                              {/* Total */}
                              <div className="flex justify-between items-center bg-gradient-to-r from-purple-300 to-purple-400 p-3 rounded font-bold border-2 border-purple-600">
                                <span className="text-sm text-purple-900">💰 Total do Lançamento</span>
                                <span className="text-base text-purple-900">
                                  R$ {formatCurrencyDisplay(request.valor_total || request.valor || 0)}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-xs">
                          {/* Usa expandedFieldsConfig recebido via props */}
                          {expandedFieldsConfig.map((field) => {
                            // Label dinâmico para chavePix baseado na forma de pagamento
                            let displayLabel = field.label;
                            if (field.key === "chavePix") {
                              const forma = (currentRowData.formaDePagamento || "").toLowerCase();
                              if (forma === "boleto") {
                                displayLabel = "Código de Barra";
                              } else if (forma === "cheque") {
                                displayLabel = "N° Folha de Cheque";
                              }
                            }
                            return (
                            <div key={field.key} className="flex flex-col">
                              <span className="font-semibold uppercase text-gray-500 mb-1">
                                {displayLabel}:
                              </span>
                              <div className="min-h-[24px] flex items-center">
                                {renderField(
                                  field.key,
                                  currentRowData,
                                  isEditing,
                                  field,
                                  request,
                                  handleEditChange
                                )}
                              </div>
                            </div>
                          );
                          })}
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
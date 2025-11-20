import React from "react";
import { Edit, Save, Trash2, X, Loader2, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import { formatCurrencyDisplay, getStatusClasses } from "./dashboard.data";

const PaymentTable = ({
  // Novas props para configuração dinâmica
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
}) => {
  // --- Lógica de Renderização de Campos ---
  const renderField = (key, data, isEditing, colConfig = {}, request) => {
    // Busca a configuração do campo nas props recebidas (columns ou expandedFieldsConfig)
    const fieldConfig =
      columns.find((c) => c.key === key) ||
      expandedFieldsConfig.find((c) => c.key === key) ||
      colConfig;

    const value = data[key];
    // Se editable não for definido, assume true, a menos que seja explicitamente false
    const editable = fieldConfig.editable !== false;

    if (isEditing && editable) {
      // --- Inputs de Edição ---

      if (fieldConfig.type === "select") {
        const selectOptions = fieldConfig.options || [];

        // Verifica se é um select de IDs (Objeto {id, nome}) ou String simples
        // Verifica pelo nome da chave ou pelo tipo do primeiro item das opções
        const isIdSelect =
          ["quemPaga", "obra", "titular"].includes(fieldConfig.key) ||
          (selectOptions.length > 0 && typeof selectOptions[0] === "object");

        return (
          <select
            name={key}
            value={value || ""}
            onChange={handleEditChange}
            className="w-full px-2 py-1 border border-blue-400 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecione...</option>
            {selectOptions.map((opt) => {
              // Se for objeto {id, nome}
              if (isIdSelect && typeof opt === "object") {
                return (
                  <option key={opt.id} value={opt.id}>
                    {opt.nome} {opt.id ? `(ID: ${opt.id})` : ""}
                  </option>
                );
              }
              // Se for string simples
              return (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              );
            })}
          </select>
        );
      }

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

      // Input Padrão (Text, Date, etc)
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

    // --- Modos de Visualização (Leitura) ---

    if (fieldConfig.isLink) {
      return (
        <a
          href={value || "#"}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            if (!value) {
              e.preventDefault();
              toast.info("Nenhum arquivo anexado.");
            }
          }}
          className={`text-sm ${
            value
              ? "text-blue-600 hover:text-blue-800 underline cursor-pointer"
              : "text-gray-400 cursor-default no-underline"
          }`}
        >
          {value ? "Ver Documento" : "—"}
        </a>
      );
    }

    if (key === "statusLancamento") {
      return (
        <span
          className={`px-3 py-1 text-xs font-semibold rounded-full min-w-[80px] text-center inline-block ${getStatusClasses(
            value
          )}`}
        >
          {value ? "LANÇADO" : "PENDENTE"}
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

    if (fieldConfig.format) {
      return (
        <span className="text-sm text-gray-700">
          {fieldConfig.format(value, request)}
        </span>
      );
    }

    return <span className="text-sm text-gray-700">{value}</span>;
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-x-auto">
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

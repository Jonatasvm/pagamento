import React, { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { Edit, Save, Trash2, X, Loader2, ChevronDown, Flag, Repeat, Search, Download } from "lucide-react";
import toast from "react-hot-toast";
// ✅ CORREÇÃO DE IMPORT: Garantindo que getNameById seja importado corretamente
import { formatCurrencyDisplay, getStatusClasses, getStatusLabel, statusOptions, getNameById } from "./dashboard.data";

// ✅ COMPONENTE: Select com busca para campos com muitas opções (ex: Obra)
const SearchableSelect = ({ name, value, options, onChange, placeholder = "Buscar...", rowLines = 1 }) => {
  const [searchText, setSearchText] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Nome da opção selecionada atualmente
  const selectedName = useMemo(() => {
    if (value === null || value === undefined || value === "") return "";
    const found = options.find((o) => String(o.id) === String(value));
    return found ? (found.nome || found.name || "") : "";
  }, [value, options]);

  // Opções filtradas pela busca
  const filteredOptions = useMemo(() => {
    if (!isSearching || !searchText.trim()) return options;
    const search = searchText.trim().toLowerCase();
    return options.filter((o) => (o.nome || o.name || "").toLowerCase().includes(search));
  }, [options, searchText, isSearching]);

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        const portalDropdown = e.target.closest('ul[style*="z-index: 99999"]');
        if (portalDropdown) return;
        setIsOpen(false);
        setIsSearching(false);
        setSearchText("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fechar dropdown ao fazer scroll FORA dele (evita que fique "voando")
  const dropdownRef = useRef(null);
  useEffect(() => {
    if (!isOpen) return;
    const handleScroll = (e) => {
      // Ignora scroll dentro do próprio dropdown
      if (dropdownRef.current && dropdownRef.current.contains(e.target)) return;
      setIsOpen(false);
      setIsSearching(false);
      setSearchText("");
    };
    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, [isOpen]);

  const handleSelect = (opt) => {
    onChange({ target: { name, value: String(opt.id), type: "text" } });
    setSearchText("");
    setIsSearching(false);
    setIsOpen(false);
  };

  const handleInputChange = (e) => {
    setSearchText(e.target.value);
    setIsSearching(true);
    setIsOpen(true);
  };

  const handleFocus = () => {
    setIsOpen(true);
    // Se tem obra selecionada e o usuário clica, limpa para permitir busca
    if (selectedName && !isSearching) {
      setSearchText("");
      setIsSearching(true);
    }
  };

  // Texto exibido no input: se está buscando mostra o que digitou, senão mostra a obra selecionada
  const displayValue = isSearching ? searchText : (selectedName || "");

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Input único — mostra obra selecionada ou campo de busca */}
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onClick={(e) => e.stopPropagation()}
          className={`w-full pl-7 pr-7 py-1.5 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 ${
            selectedName && !isSearching
              ? "border-blue-400"
              : "border-blue-400"
          }`}
          style={rowLines === 2 ? { height: '48px' } : undefined}
        />
        {/* Botão limpar */}
        {selectedName && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange({ target: { name, value: "", type: "text" } });
              setSearchText("");
              setIsSearching(false);
              inputRef.current?.focus();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-red-400 hover:text-red-600 text-xs"
            title="Limpar seleção"
          >✕</button>
        )}
      </div>
      {/* Dropdown de opções — via Portal para não ficar cortado pelo overflow da tabela */}
      {isOpen && containerRef.current && createPortal(
        <ul 
          ref={dropdownRef}
          className="bg-white border border-gray-300 rounded-lg shadow-xl max-h-48 overflow-y-auto"
          style={{
            position: 'fixed',
            zIndex: 99999,
            width: containerRef.current.getBoundingClientRect().width,
            left: containerRef.current.getBoundingClientRect().left,
            top: containerRef.current.getBoundingClientRect().bottom + 4,
          }}
        >
          {filteredOptions.length === 0 ? (
            <li className="px-3 py-2 text-sm text-gray-400 italic">Nenhuma obra encontrada</li>
          ) : (
            filteredOptions.map((opt) => (
              <li
                key={opt.id}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelect(opt);
                }}
                className={`px-3 py-2 text-sm cursor-pointer hover:bg-indigo-50 ${
                  String(value) === String(opt.id) ? "bg-indigo-100 font-semibold" : ""
                }`}
              >
                {opt.nome || opt.name}
              </li>
            ))
          )}
        </ul>,
        document.body
      )}
    </div>
  );
};

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
  handleEditObraRelacionada,
  onInlineSave, // Nova prop para salvar edição inline 

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
  suggestionsPortalRef = null,
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

  // ✅ Download de todos os anexos de um lançamento
  const handleDownloadAllAnexos = async (linkAnexo) => {
    try {
      const anexos = typeof linkAnexo === "string" ? JSON.parse(linkAnexo) : linkAnexo;
      if (!Array.isArray(anexos) || anexos.length === 0) {
        toast.error("Nenhum anexo disponível");
        return;
      }

      for (let i = 0; i < anexos.length; i++) {
        const anexo = anexos[i];
        const downloadUrl = anexo.download || `https://drive.google.com/uc?export=download&id=${anexo.drive_id}`;
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = downloadUrl;
        document.body.appendChild(iframe);
        setTimeout(() => { document.body.removeChild(iframe); }, 5000);
        if (i < anexos.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      toast.success(`Download de ${anexos.length} anexo(s) iniciado!`);
    } catch {
      toast.error("Erro ao baixar anexos");
    }
  };

  // Verifica se um lançamento tem anexos
  const hasAnexos = (linkAnexo) => {
    if (!linkAnexo) return false;
    try {
      const anexos = typeof linkAnexo === "string" ? JSON.parse(linkAnexo) : linkAnexo;
      return Array.isArray(anexos) && anexos.length > 0;
    } catch {
      return false;
    }
  };

  // ✅ Estado para edição inline (campos da linha principal)
  const [inlineEditData, setInlineEditData] = useState({});
  const [inlineSavingId, setInlineSavingId] = useState(null);

  // Campos editáveis inline (da linha principal, exceto solicitante)
  const inlineEditableKeys = columns
    .filter((c) => c.editable !== false && c.key !== "solicitante")
    .map((c) => c.key);

  const handleInlineChange = (requestId, fieldName, value) => {
    setInlineEditData((prev) => ({
      ...prev,
      [requestId]: {
        ...(prev[requestId] || {}),
        [fieldName]: value,
      },
    }));
  };

  const hasInlineChanges = (requestId) => {
    return inlineEditData[requestId] && Object.keys(inlineEditData[requestId]).length > 0;
  };

  const handleInlineSave = async (request) => {
    if (!onInlineSave || !hasInlineChanges(request.id)) return;
    setInlineSavingId(request.id);
    try {
      const changes = inlineEditData[request.id];
      await onInlineSave(request.id, { ...request, ...changes });
      setInlineEditData((prev) => {
        const next = { ...prev };
        delete next[request.id];
        return next;
      });
      toast.success("Salvo com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar inline:", error);
      toast.error("Erro ao salvar.");
    } finally {
      setInlineSavingId(null);
    }
  };

  const handleInlineCancelRow = (requestId) => {
    setInlineEditData((prev) => {
      const next = { ...prev };
      delete next[requestId];
      return next;
    });
  };

  // --- Lógica de Renderização de Campos ---
  const renderField = (key, data, isEditing, colConfig = {}, request, handleEditChange, rowLines = 1) => {
    // ✅ CORREÇÃO: Para campos expandidos, priorizar colConfig (que vem direto do expandedFieldsConfig)
    // para evitar conflito quando o mesmo key existe nas columns e nos expandedFields (ex: "conta")
    const fieldConfig =
      colConfig?.key === key ? colConfig :
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

      // --- CAMPO ESPECIAL: TITULAR COM AUTOCOMPLETE (somente no modo edição completa) ---
      if (key === "titular" && editingId) {
        const isUnregistered = !isTitularLocked && (request?.fornecedor_novo || request?.fornecedorNovo);
        return (
          <div
            ref={autocompleteDropdownRef}
            className="relative w-full"
          >
            <div className="flex items-center gap-1">
              <textarea
                name={key}
                value={value || ""}
                onChange={handleEditChange}
                onKeyDown={handleKeyDown}
                onFocus={handleTitularFocus}
                placeholder="Digite o nome do fornecedor..."
                className={`w-full px-2 py-1 border rounded-md text-sm focus:ring-2 resize-none ${
                  isTitularLocked
                    ? "bg-gray-100 border-blue-400 focus:ring-blue-500"
                    : isUnregistered
                    ? "border-red-500 bg-red-50 focus:ring-red-400"
                    : "border-blue-400 focus:ring-blue-500"
                }`}
                disabled={isTitularLocked}
                autoComplete="off"
                rows={rowLines}
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

            {/* Dropdown de Sugestões - Renderizado via Portal */}
            {showTitularSuggestions && autocompleteDropdownRef?.current && createPortal(
              <div 
                ref={suggestionsPortalRef}
                className="bg-white border border-gray-300 rounded-lg shadow-xl max-h-60 overflow-y-auto"
                style={{
                  position: 'fixed',
                  zIndex: 99999,
                  width: autocompleteDropdownRef.current.getBoundingClientRect().width,
                  left: autocompleteDropdownRef.current.getBoundingClientRect().left,
                  top: autocompleteDropdownRef.current.getBoundingClientRect().bottom + 4,
                }}
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
            className="w-full px-2 py-1 border border-blue-400 rounded-md text-sm focus:ring-2 focus:ring-blue-500 font-semibold text-green-600"
            style={rowLines === 2 ? { height: '48px' } : undefined}
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

        // ✅ ORDENAR OPÇÕES ALFABETICAMENTE (para objetos com nome)
        if (selectOptions.length > 0 && typeof selectOptions[0] === "object") {
          selectOptions = [...selectOptions].sort((a, b) =>
            (a.nome || a.name || "").localeCompare(b.nome || b.name || "", "pt-BR")
          );
        }
        
        // Verifica se é um select de IDs (Objeto {id, nome})
        const isIdSelect = 
            isObraOrTitular || 
            ["quemPaga", "solicitante"].includes(key) ||
            (selectOptions.length > 0 && typeof selectOptions[0] === "object");

        // ✅ CAMPO DE OBRA COM BUSCA — usa SearchableSelect
        if (key === "obra" && isIdSelect) {
          return (
            <SearchableSelect
              name={key}
              value={value}
              options={selectOptions}
              onChange={handleEditChange}
              placeholder="Buscar obra..."
              rowLines={rowLines}
            />
          );
        }

        // ✅ CAMPO DE TITULAR COM BUSCA — usa SearchableSelect
        if (key === "titular" && isIdSelect) {
          const isUnregistered = request?.fornecedor_novo || request?.fornecedorNovo;
          return (
            <div className={`w-full ${isUnregistered ? "rounded-md ring-2 ring-red-400" : ""}`}>
              <SearchableSelect
                name={key}
                value={value}
                options={selectOptions}
                onChange={handleEditChange}
                placeholder="Buscar fornecedor..."
                rowLines={rowLines}
              />
            </div>
          );
        }

        // Encontrar o nome da opção selecionada para exibir acima do select
        // Remover exibição para categoria, obra, conta e formaDePagamento
        const showSelectedName = !["categoria", "obra", "conta", "formaDePagamento", "titular"].includes(key);
        const currentSelectedName = (() => {
          if (!value) return null;
          if (isIdSelect) {
            const found = selectOptions.find(o => typeof o === 'object' && String(o.id) === String(value));
            return found ? (found.nome || found.name) : null;
          }
          return String(value);
        })();

        return (
          <div className="w-full">
            {showSelectedName && currentSelectedName && (
              <span className="block text-xs text-gray-600 break-words mb-1 leading-tight">
                {currentSelectedName}
              </span>
            )}
            <select
              name={key}
              value={value != null ? String(value) : ""}
              onChange={handleEditChange}
              className="w-full px-2 py-1 border border-blue-400 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
              style={rowLines === 2 ? { height: '48px' } : undefined}
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
          </div>
        );
      }

      // --- STATUS (DROPDOWN com 4 opções: PENDENTE, APROVADO, LANÇADO, NÃO AUTORIZADO) ---
      if (fieldConfig.type === "status") {
        return (
          <select
            name={key}
            value={value || "PENDENTE"}
            onChange={handleEditChange}
            className="w-full px-2 py-1 border border-blue-400 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
            style={rowLines === 2 ? { height: '48px' } : undefined}
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
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
            style={rowLines === 2 ? { height: '48px' } : undefined}
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

      // --- CAMPO ESPECIAL: CHAVE PIX / CÓDIGO BOLETO / Nº CHEQUE ---
      if (key === "chavePix") {
        const forma = (data.formaDePagamento || "").toLowerCase();
        let placeholder = "Chave PIX";
        if (forma === "boleto") placeholder = "Código de Barra";
        else if (forma === "cheque") placeholder = "N° Folha de Cheque";
        return (
          <input
            type="text"
            name={key}
            value={value || ""}
            onChange={handleEditChange}
            placeholder={placeholder}
            className="w-full px-2 py-1 border border-blue-400 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
            style={rowLines === 2 ? { height: '48px' } : undefined}
          />
        );
      }

      // --- REFERENTE (textarea dinâmico) ---
      if (key === "referente") {
        return (
          <textarea
            name={key}
            value={value || ""}
            onChange={handleEditChange}
            className="w-full px-2 py-1 border border-blue-400 rounded-md text-sm focus:ring-2 focus:ring-blue-500 resize-none"
            rows={rowLines}
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
          style={rowLines === 2 ? { height: '48px' } : undefined}
        />
      );
    }

    // --- RENDERIZAÇÃO EM MODO VISUALIZAÇÃO (Tabela Principal e Expandida) ---
    
    // ✅ Campo chavePix em modo visualização - sempre mostra o valor ou "—"
    if (!isEditing && key === "chavePix") {
      return <span className="text-gray-900 text-sm">{value || "—"}</span>;
    }

    // ✅ Flag visual para fornecedor NÃO cadastrado
    if (!isEditing && key === "titular" && request) {
      const nome = String(value || "—");
      const isNovo = request.fornecedor_novo || request.fornecedorNovo;
      return (
        <div className="flex items-center gap-1.5">
          <span className={`break-words font-medium ${isNovo ? "text-red-600" : "text-gray-900"}`}>{nome}</span>
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
            <col style={{ width: "155px" }} />
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
                    style={
                      ((request.formaDePagamento || request.forma_pagamento || "").toLowerCase() === "boleto" && !(request.chavePix || request.chave_pix || "").trim())
                        ? { borderLeft: '4px solid orange' }
                        : {}
                    }
                  >
                    {/* Célula de Ações Fixa */}
                    <td
                      className={`px-3 py-3 sticky left-0 z-10 ${rowClasses} shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]`}
                    >
                      <div className="flex flex-wrap items-center gap-1.5">
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
                            {/* Botão salvar inline (aparece quando há mudanças) */}
                            {hasInlineChanges(request.id) && (
                              <>
                                <button
                                  onClick={() => handleInlineSave(request)}
                                  disabled={inlineSavingId === request.id}
                                  title="Salvar alterações"
                                  className={`p-1.5 rounded-full transition-colors ${
                                    inlineSavingId === request.id
                                      ? "bg-gray-400 cursor-not-allowed"
                                      : "bg-green-500 text-white hover:bg-green-600"
                                  }`}
                                >
                                  {inlineSavingId === request.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Save className="w-4 h-4" />
                                  )}
                                </button>
                                <button
                                  onClick={() => handleInlineCancelRow(request.id)}
                                  title="Cancelar alterações"
                                  className="p-1.5 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleEdit(request)}
                              disabled={editingId !== null}
                              title="Editar detalhes"
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
                        {/* Botão de download de anexos */}
                        {hasAnexos(request.link_anexo) && (
                          <button
                            onClick={() => handleDownloadAllAnexos(request.link_anexo)}
                            disabled={editingId !== null}
                            title="Baixar todos os anexos"
                            className="p-1.5 rounded-full text-green-600 hover:bg-green-100 disabled:opacity-50 transition-colors"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Células de Dados */}
                    {(() => {
                      const referenteText = String((inlineEditData[request.id]?.referente ?? request.referente) || '');
                      const rowLines = referenteText.length > 30 || referenteText.includes('\n') ? 2 : 1;
                      return columns.map((col) => {
                      const isInlineEditable = !isEditing && inlineEditableKeys.includes(col.key);
                      const inlineRow = inlineEditData[request.id] || {};
                      const inlineValue = col.key in inlineRow ? inlineRow[col.key] : request[col.key];
                      // Build data for inline: merge request with inline changes
                      const inlineRowData = isInlineEditable ? { ...request, ...inlineRow } : currentRowData;
                      const shouldEdit = isEditing || isInlineEditable;

                      const inlineChangeHandler = isInlineEditable
                        ? (e) => {
                            const { name, value, type, checked } = e.target;
                            let newVal = value;
                            if (name === "valor") {
                              newVal = value.replace(/[^\d,]/g, "");
                              const parts = newVal.split(",");
                              if (parts.length > 2) newVal = parts[0] + "," + parts.slice(1).join("");
                              if (parts.length === 2 && parts[1].length > 2) newVal = parts[0] + "," + parts[1].slice(0, 2);
                            }
                            if (type === "checkbox") newVal = checked;
                            if (["quemPaga", "obra", "conta", "titular"].includes(name)) {
                              if (name === "titular" && typeof value === "string") {
                                newVal = value;
                              } else {
                                newVal = Number(value);
                              }
                            }
                            handleInlineChange(request.id, name, newVal);
                          }
                        : handleEditChange;

                      // For inline edit, we need to convert valor from centavos to display format
                      const displayData = isInlineEditable
                        ? (() => {
                            const d = { ...inlineRowData };
                            if (col.key === "valor" && !(col.key in inlineRow)) {
                              // Convert centavos to reais for display
                              const centavos = Number(d.valor) || 0;
                              d.valor = (centavos / 100).toFixed(2).replace(".", ",");
                            }
                            return d;
                          })()
                        : currentRowData;

                      return (
                        <td
                          key={col.key}
                          className={`px-3 py-3 text-sm ${rowClasses} overflow-hidden ${shouldEdit ? '' : 'break-words'}`}
                          style={shouldEdit ? { pointerEvents: 'auto', wordBreak: 'break-word' } : { wordBreak: 'break-word' }}
                          title={typeof (shouldEdit ? displayData[col.key] : request[col.key]) === 'string' ? (shouldEdit ? displayData[col.key] : request[col.key]) : ''}
                        >
                          {renderField(
                            col.key,
                            displayData,
                            shouldEdit,
                            col,
                            request,
                            inlineChangeHandler,
                            rowLines
                          )}
                        </td>
                      );
                    });
                    })()}
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
                                        {[...listaObras].sort((a, b) => (a.nome || "").localeCompare(b.nome || "", "pt-BR")).map((opt) => (
                                          <option key={opt.id} value={opt.id}>
                                            {opt.nome}
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
                          {expandedFieldsConfig.filter((field) => !field.hidden).map((field) => {
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
                            // Não renderiza label manual extra, só o displayLabel abaixo
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
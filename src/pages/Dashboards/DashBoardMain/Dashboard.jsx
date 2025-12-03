import React, { useState, useRef, useEffect, useMemo } from "react";
import toast, { Toaster } from "react-hot-toast";
import { Loader2, FileText, Filter, RotateCcw, User } from "lucide-react";
import { Link } from "react-router-dom";

// Imports Locais
import PaymentTable from "./PaymentTable";
import {
  getTableColumns,
  getExpandedFields,
  formaPagamentoOptions,
} from "./dashboard.data";

// Import do Serviço de API
import {
  listarFormularios,
  atualizarFormulario,
  deletarFormulario,
} from "./formularioService";

const API_URL = "http://91.98.132.210:5631";

export const Dashboard = () => {
  const [requests, setRequests] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // --- Estados para Dados Auxiliares (Selects e Nomes) ---
  const [listaUsuarios, setListaUsuarios] = useState([]);
  const [listaObras, setListaObras] = useState([]);
  const [listaTitulares, setListaTitulares] = useState([]);

  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [selectedRequests, setSelectedRequests] = useState([]);
  const [expandedRows, setExpandedRows] = useState([]);

  // --- Estados para Autocomplete de Titular ---
  const [titularSuggestions, setTitularSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showTitularSuggestions, setShowTitularSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [isTitularLocked, setIsTitularLocked] = useState(false);
  const autocompleteDropdownRef = useRef(null);
  
  //ajuste 
  // --- Funções de Busca de Dados Auxiliares ---
const fetchRequests = async () => {
  setIsLoadingData(true);
  try {
    // listarFormularios é importado do formularioService.js
    const data = await listarFormularios();
    setRequests(data);
  } catch (error) {
    console.error("Erro ao carregar requisições:", error);
    toast.error("Erro ao carregar a lista de lançamentos.");
  } finally {
    setIsLoadingData(false);
  }
};

  const fetchListaObras = async () => {
    try {
      // Rota de Obras (já existe no backend, retorna {id: N, nome: "Obra"})
      const response = await fetch(`${API_URL}/obras`); 
      if (!response.ok) throw new Error("Erro ao buscar lista de obras");
      const data = await response.json();
      setListaObras(data); 
    } catch (error) {
      console.error("Erro ao carregar obras:", error);
    }
  };

  const fetchListaTitulares = async () => {
    try {
      // Rota NOVA que retorna { id: NOME, nome: NOME }
      const response = await fetch(`${API_URL}/titulares/list`); 
      if (!response.ok) throw new Error("Erro ao buscar lista de titulares");
      const data = await response.json();
      setListaTitulares(data);
    } catch (error) {
      console.error("Erro ao carregar titulares:", error);
    }
  };

  // --- Chamada inicial para carregar dados auxiliares ---
  useEffect(() => {
    fetchRequests(); 
    fetchListaObras(); // <--- Chama a lista de Obras
    fetchListaTitulares(); // <--- Chama a lista de Titulares
  }, []);


  // --- Filtros ---
  const [filters, setFilters] = useState({
    statusLancamento: "",
    formaDePagamento: "",
    data: "",
    obra: "",
    titular: "",
  });

  // --- CARREGAR DADOS DA API ---
  const loadData = async () => {
    setIsLoadingData(true);
    try {
      const [dadosFormularios] = await Promise.all([
        listarFormularios(),
      ]);

      setRequests(dadosFormularios);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar dados.");
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- Geração Dinâmica das Colunas ---
  const columns = useMemo(
    () => getTableColumns(listaUsuarios, listaObras, listaTitulares),
    [listaUsuarios, listaObras, listaTitulares]
  );

  const expandedFieldsConfig = useMemo(
    () => getExpandedFields(listaUsuarios),
    [listaUsuarios]
  );

  // --- Lógica de Filtragem (Frontend) ---
  // Dashboard.jsx (Bloco de filteredRequests corrigido)

// ...
 const filteredRequests = requests.filter((req) => {
    // FILTRO DE STATUS
    if (filters.statusLancamento !== "") {
      const filterBool = filters.statusLancamento === "true";
      if (req.statusLancamento !== filterBool) return false;
    }
    
    // FILTRO DE FORMA DE PAGAMENTO (Limpeza de espaços e normalização de case)
    if (filters.formaDePagamento) {
      const filterValue = filters.formaDePagamento.trim().toUpperCase();
      const requestValue = req.formaDePagamento
        ? String(req.formaDePagamento).trim().toUpperCase()
        : "";
      if (requestValue !== filterValue) return false;
    }
    
    // FILTRO DE DATA (Filtrando por dataPagamento)
    if (filters.data && req.dataPagamento !== filters.data) return false; 
    
    // FILTRO DE OBRA (Usa ID numérico. Compara o ID numérico do filtro com o ID numérico do lançamento)
    const obraFilterId = Number(filters.obra);
    if (obraFilterId > 0 && req.obra !== obraFilterId) {
      return false;
    }

    // FILTRO DE TITULAR (Usa string/nome. Compara o NOME do filtro com o NOME do lançamento)
    if (filters.titular) {
      const filterValue = filters.titular.trim().toUpperCase();
      const requestValue = req.titular
        ? String(req.titular).trim().toUpperCase()
        : "";
      if (requestValue !== filterValue) return false;
    }
      
    return true;
  });
// ...

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      statusLancamento: "",
      formaDePagamento: "",
      data: "",
      obra: "",
      titular: "",
    });
    toast.success("Filtros limpos");
  };

  // --- Handlers de Tabela ---
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
      setSelectedRequests(filteredRequests.map((req) => req.id));
    } else {
      setSelectedRequests([]);
    }
  };

  const isAllSelected =
    filteredRequests.length > 0 &&
    selectedRequests.length === filteredRequests.length;

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
    setIsTitularLocked(false);

    setTimeout(() => {
      document
        .getElementById(`row-${request.id}`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  // --- Buscar Titulares para Autocomplete  ---
  useEffect(() => {
    const fetchTitulares = async () => {
      if (!editFormData.titular || typeof editFormData.titular !== "string" || !editFormData.titular.trim()) {
        setTitularSuggestions([]);
        setShowTitularSuggestions(false);
        return;
      }

      setIsLoadingSuggestions(true);
      try {
        const response = await fetch(
          `${API_URL}/formulario/titulares/search?q=${encodeURIComponent(
            editFormData.titular
          )}`
        );
        if (!response.ok) throw new Error("Erro ao buscar titulares");

        const data = await response.json();
        setTitularSuggestions(data);
        setShowTitularSuggestions(true);
        setSelectedSuggestionIndex(-1);
      } catch (error) {
        console.error("Erro ao buscar titulares:", error);
        setTitularSuggestions([]);
      } finally {
        setIsLoadingSuggestions(false);
      }
    };

    const debounceTimer = setTimeout(fetchTitulares, 300);
    return () => clearTimeout(debounceTimer);
  }, [editFormData.titular]);

  // --- Buscar quem_paga quando obra mudar ---
  useEffect(() => {
    const fetchQuemPaga = async () => {
      if (!editFormData.obra) {
        setEditFormData((prev) => ({ ...prev, quemPaga: null }));
        return;
      }

      try {
        const response = await fetch(`${API_URL}/obras/${editFormData.obra}`);
        if (!response.ok) throw new Error("Erro ao buscar obra");

        const obra = await response.json();
        setEditFormData((prev) => ({ ...prev, quemPaga: obra.quem_paga }));
      } catch (error) {
        console.error("Erro ao buscar quem_paga:", error);
      }
    };

    fetchQuemPaga();
  }, [editFormData.obra]);

  // --- Fechar sugestões ao clicar fora ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        autocompleteDropdownRef.current &&
        !autocompleteDropdownRef.current.contains(event.target)
      ) {
        setShowTitularSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    let newValue = value;

    if (name === "valor") newValue = value.replace(/\D/g, "");
    if (type === "checkbox") newValue = checked;
    if (["quemPaga", "obra", "titular"].includes(name)) {
      // Se for titular e estiver vindo de um input de texto, não converte para número
      if (name === "titular" && typeof value === "string") {
        newValue = value;
        setIsTitularLocked(false); // Desbloqueia ao digitar
      } else {
        newValue = Number(value);
      }
    }

    setEditFormData((prevData) => ({ ...prevData, [name]: newValue }));
  };

  // Handler para selecionar um titular da lista de sugestões
  const handleSelectTitular = (suggestion) => {
    setEditFormData((prev) => ({
      ...prev,
      titular: suggestion.titular,
      cpfCnpjTitularConta: suggestion.cpf_cnpj,
    }));
    setIsTitularLocked(true);
    setShowTitularSuggestions(false);
    setTitularSuggestions([]);
  };

  // Handler para navegação com teclado nas sugestões
  const handleKeyDown = (e) => {
    if (!showTitularSuggestions || titularSuggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedSuggestionIndex((prev) =>
          prev < titularSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedSuggestionIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          handleSelectTitular(titularSuggestions[selectedSuggestionIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setShowTitularSuggestions(false);
        break;
      default:
        break;
    }
  };

  const handleSave = async () => {
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

    try {
      const dataToSave = { ...editFormData, valor: rawValue };
      await atualizarFormulario(editingId, dataToSave);
      toast.success("Solicitação atualizada com sucesso!");
      setEditingId(null);
      setEditFormData({});
      setIsTitularLocked(false);
      await loadData();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar alterações.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData({});
    setIsTitularLocked(false);
    toast("Edição cancelada.", { icon: "👋" });
  };

  const handleRemove = async (id) => {
    if (editingId) {
      toast.error("Finalize a edição atual antes de remover.");
      return;
    }
    if (window.confirm("Tem certeza que deseja remover esta solicitação?")) {
      try {
        await deletarFormulario(id);
        setRequests((prev) => prev.filter((req) => req.id !== id));
        setSelectedRequests((prev) => prev.filter((reqId) => reqId !== id));
        toast.success("Solicitação removida.");
      } catch (error) {
        console.error(error);
        toast.error("Erro ao remover solicitação.");
      }
    }
  };

  const handleGenerateCSV = async () => {
    if (selectedRequests.length === 0) {
      toast.error("Selecione pelo menos um registro para gerar o CSV.");
      return;
    }
    setIsSaving(true);
    let errorCount = 0;
    for (const id of selectedRequests) {
      const request = requests.find((r) => r.id === id);
      if (request) {
        try {
          await atualizarFormulario(id, { ...request, statusGeradoCSV: true });
        } catch (err) {
          console.error(`Erro ao atualizar ID ${id}`, err);
          errorCount++;
        }
      }
    }
    await loadData();
    setSelectedRequests([]);
    setIsSaving(false);

    if (errorCount === 0) {
      toast.success(
        `${selectedRequests.length} registro(s) marcados como 'Gerado'!`
      );
    } else {
      toast.warning(`Concluído com ${errorCount} erro(s).`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 lg:p-8">
      <Toaster position="top-right" />

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
            Gerar CSV ({selectedRequests.length})
          </button>
        </div>
      )}

      <div className="max-w-[1800px] mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 lg:p-8 mb-6">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">
            Gerenciamento de Pagamentos
          </h1>
          <Link
            to="/dashboard/users"
            className="flex gap-x-2 bg-green-500 w-fit text-white p-3 mt-10 rounded-xl shadow-lg shadow-gray-400 cursor-pointer"
          >
            <User />
            <p>Gerenciamento de Usuários</p>
          </Link>
        </div>

        
        
        
        {/* Container de Filtros */}
        <div className="bg-white rounded-2xl shadow-md p-5 mb-6 border border-gray-100">
          <div className="flex items-center gap-2 mb-4 text-gray-700 font-semibold border-b pb-2">
            <Filter className="w-5 h-5 text-indigo-600" />
            <span>Filtros de Pesquisa</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
            {/* Status */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500 uppercase">
                Status
              </label>
              <select
                name="statusLancamento"
                value={filters.statusLancamento}
                onChange={handleFilterChange}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">Todos</option>
                <option value="true">Sim (Lançado)</option>
                <option value="false">Não (Pendente)</option>
              </select>
            </div>

            {/* Forma Pagto */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500 uppercase">
                Forma Pagto
              </label>
              <select
                name="formaDePagamento"
                value={filters.formaDePagamento}
                onChange={handleFilterChange}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">Todas</option>
                {formaPagamentoOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {/* Data */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500 uppercase">
                Data
              </label>
              <input
                type="date"
                name="data"
                value={filters.data}
                onChange={handleFilterChange}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
              ></input>
            </div>

                    {/* Obra (Filtra por ID numérico) */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500 uppercase">
                Obra
              </label>
              <select
                name="obra" // Corresponde a filters.obra
                value={filters.obra}
                onChange={handleFilterChange}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">Todas</option>
                {listaObras.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.nome}
                  </option>
                ))}
              </select>
            </div>

                      {/* Titular (Filtra por String/Nome) */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">
                  Titular
                </label>
                <select
                  name="titular" // Corresponde a filters.titular
                  value={filters.titular}
                  onChange={handleFilterChange}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">Todos</option>
                  {/* Aqui, t.id é o NOME do titular (string), que será usado no filtro */}
                  {listaTitulares.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nome}
                    </option>
                  ))}
                </select>
              </div>

            {/* Botão Limpar */}
            <button
              onClick={clearFilters}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-sm h-[42px]"
            >
              <RotateCcw className="w-4 h-4" /> Limpar
            </button>
          </div>
        </div>

        {/* Loading State ou Tabela */}
        {isLoadingData ? (
          <div className="flex justify-center items-center p-12">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            <span className="ml-3 text-gray-600">Carregando dados...</span>
          </div>
        ) : (
          <PaymentTable
            columns={columns}
            expandedFieldsConfig={expandedFieldsConfig}
            filteredRequests={filteredRequests}
            isAllSelected={isAllSelected}
            selectedRequests={selectedRequests}
            editingId={editingId}
            editFormData={editFormData}
            isSaving={isSaving}
            expandedRows={expandedRows}
            handleSelectAll={handleSelectAll}
            handleSelectOne={handleSelectOne}
            handleEdit={handleEdit}
            handleSave={handleSave}
            handleCancelEdit={handleCancelEdit}
            handleRemove={handleRemove}
            toggleRowExpansion={toggleRowExpansion}
            handleEditChange={handleEditChange}
            // Props para autocomplete de titular
            titularSuggestions={titularSuggestions}
            isLoadingSuggestions={isLoadingSuggestions}
            showTitularSuggestions={showTitularSuggestions}
            selectedSuggestionIndex={selectedSuggestionIndex}
            isTitularLocked={isTitularLocked}
            handleSelectTitular={handleSelectTitular}
            handleKeyDown={handleKeyDown}
            autocompleteDropdownRef={autocompleteDropdownRef}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;

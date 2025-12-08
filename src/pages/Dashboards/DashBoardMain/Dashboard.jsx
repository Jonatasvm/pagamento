import React, { useState, useRef, useEffect, useMemo } from "react";
import toast, { Toaster } from "react-hot-toast";
import { Loader2, FileText, Filter, RotateCcw, User, Search } from "lucide-react";
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
  atualizarStatusLancamento, // ✅ NOVO IMPORT: Para o toggle de status
  exportarELancarFormularios, // Import para a exportação
} from "./formularioService";

const API_URL = "http://91.98.132.210:5631";

export const Dashboard = () => {
  const [requests, setRequests] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // --- Estados para Dados Auxiliares ---
  const [listaUsuarios, setListaUsuarios] = useState([]); // Se houver rota para usuários, deve ser preenchida
  const [listaObras, setListaObras] = useState([]);
  const [listaTitulares, setListaTitulares] = useState([]);

  // --- Estados de Edição e Seleção ---
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [selectedRequests, setSelectedRequests] = useState([]);
  const [expandedRows, setExpandedRows] = useState([]);

  // --- Estados para FILTROS AVANÇADOS (NOVO BLOCO) ---
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterTerm, setFilterTerm] = useState("");
  const [filterState, setFilterState] = useState({
    obra: '',
    titular: '',
    solicitante: '',
    status: '', // 'Y' (Lançado), 'N' (Não Lançado) ou '' (Todos)
    dataPagamentoInicio: '',
    dataPagamentoFim: '',
  });
  
  // Função para resetar filtros
  const handleResetFilters = () => {
    setFilterTerm(""); // Reseta a busca de texto
    setFilterState({
      obra: '',
      titular: '',
      solicitante: '',
      status: '',
      dataPagamentoInicio: '',
      dataPagamentoFim: '',
    });
    toast.success("Filtros redefinidos!");
  };

  // --- Estados para Autocomplete de Titular ---
  const [titularSuggestions, setTitularSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showTitularSuggestions, setShowTitularSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [isTitularLocked, setIsTitularLocked] = useState(false);
  const autocompleteDropdownRef = useRef(null);

  // Função centralizada para buscar e processar todos os dados
  const fetchData = async () => {
    setIsLoadingData(true);
    try {
      // 1. Fetch dos Formulários (Requests)
      const requestsData = await listarFormularios();
      setRequests(requestsData);

      // 2. Fetch dos Dados Auxiliares
      // Para usuários
      const usersResponse = await fetch(`${API_URL}/usuarios/list`);
      if (usersResponse.ok) {
        const users = await usersResponse.json();
        // A API retorna objetos no formato { id: 1, nome: "Usuário" }
        setListaUsuarios(users); 
      } else {
        console.error("Erro ao buscar usuários");
      }

      // Para obras
      const obrasResponse = await fetch(`${API_URL}/obras`);
      if (obrasResponse.ok) {
        const obras = await obrasResponse.json();
        // A API retorna objetos no formato { id: 1, nome: "Obra X", quem_paga: "Nome" }
        setListaObras(obras);
      } else {
        console.error("Erro ao buscar obras");
      }
      
      // Para titulares (Lista Completa para o filtro, embora o autocomplete use a search)
      const titularesResponse = await fetch(`${API_URL}/formulario/titulares/list`);
      if (titularesResponse.ok) {
        const titulares = await titularesResponse.json();
        // A API retorna objetos no formato { id: "Nome", nome: "Nome" }
        setListaTitulares(titulares);
      } else {
        console.error("Erro ao buscar titulares");
      }


    } catch (error) {
      console.error("Erro ao buscar dados:", error);
      toast.error("Erro ao carregar dados. Verifique a conexão com a API.");
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);
  
  // --- Lógica de Seleção ---
  const isAllSelected = selectedRequests.length > 0 && selectedRequests.length === filteredRequests.length;

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedRequests([]);
    } else {
      // Seleciona todos os IDs dos requests FILTRADOS
      setSelectedRequests(filteredRequests.map((req) => req.id));
    }
  };

  const handleSelectOne = (id) => {
    setSelectedRequests((prevSelected) =>
      prevSelected.includes(id)
        ? prevSelected.filter((reqId) => reqId !== id)
        : [...prevSelected, id]
    );
  };

  // --- Lógica de Edição ---

  const handleEdit = (request) => {
    // 1. Bloquear se já estiver editando outro item
    if (editingId) {
      toast.error("Salve ou cancele a edição atual antes de prosseguir.");
      return;
    }
    setEditingId(request.id);
    // 2. Cria uma cópia dos dados para edição
    setEditFormData({ ...request });
    // 3. Trava o titular se ele já tiver um CPF/CNPJ
    const hasCpfCnpj = !!request.cpfCnpjTitularConta;
    setIsTitularLocked(hasCpfCnpj);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData({});
    setIsTitularLocked(false);
    // Limpa autocomplete
    setShowTitularSuggestions(false);
    setTitularSuggestions([]);
    setSelectedSuggestionIndex(-1);
  };

  const handleEditChange = (key, value) => {
    if (editingId === null) return; // Segurança
    
    // Atualização para Titular, CPF/CNPJ ou Chave PIX
    if (key === 'titular' || key === 'cpfCnpjTitularConta' || key === 'chavePix') {
      // Se for titular e estiver travado, não permite a edição manual
      if (key === 'titular' && isTitularLocked) return; 

      setEditFormData(prev => ({ 
        ...prev, 
        [key]: value 
      }));
      // Ativa a busca de autocomplete apenas para o campo 'titular'
      if (key === 'titular' && !isTitularLocked) {
        searchTitular(value);
      } else if (key === 'titular' && isTitularLocked) {
        // Se travado, apenas esconde a sugestão, mas não bloqueia a alteração do valor
        setShowTitularSuggestions(false);
      } else {
         // Esconde as sugestões para outros campos
        setShowTitularSuggestions(false);
      }

    } else {
      // Demais campos
      setEditFormData(prev => ({ 
        ...prev, 
        [key]: value 
      }));
    }
  };
  

  const handleSave = async () => {
    if (!editingId || isSaving) return;

    // Simples validação para campos importantes
    if (!editFormData.valor || parseFloat(editFormData.valor.replace(/[R$\s.]/g, "").replace(",", ".")) <= 0) {
      toast.error("O valor é obrigatório.");
      return;
    }

    setIsSaving(true);
    try {
      await atualizarFormulario(editingId, editFormData);
      toast.success("Solicitação atualizada com sucesso!");
      
      // Atualiza o estado local
      setRequests((prevRequests) =>
        prevRequests.map((req) =>
          req.id === editingId ? { ...req, ...editFormData } : req
        )
      );

      handleCancelEdit(); // Limpa a edição
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar a edição. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async (id) => {
    if (editingId) {
      toast.error("Salve ou cancele a edição atual antes de remover.");
      return;
    }

    const confirmed = window.confirm(
      "Tem certeza que deseja remover esta solicitação?"
    );
    if (!confirmed) return;

    try {
      await deletarFormulario(id);
      toast.success("Solicitação removida!");
      // Atualiza o estado local
      setRequests((prevRequests) =>
        prevRequests.filter((req) => req.id !== id)
      );
      setSelectedRequests((prev) => prev.filter((reqId) => reqId !== id)); // Remove da seleção
    } catch (error) {
      console.error("Erro ao remover:", error);
      toast.error("Erro ao remover solicitação.");
    }
  };
  
  // --- Toggle de Status (Lançado/Não Lançado) ---
  const handleToggleLancamento = async (id, isCurrentlyLancado) => {
    try {
      const newStatus = !isCurrentlyLancado;
      
      // 1. Atualiza no backend
      await atualizarStatusLancamento(id, newStatus);
      
      // 2. Atualiza no frontend
      setRequests(prevRequests => 
        prevRequests.map(req => 
          req.id === id ? { ...req, lancado: newStatus } : req
        )
      );
      
      toast.success(`Status alterado para: ${newStatus ? 'Lançado' : 'Não Lançado'}`);
      
    } catch (error) {
      console.error("Erro ao alternar status:", error);
      toast.error("Erro ao alternar status de lançamento.");
    }
  };


  // --- Lógica de Autocomplete de Titular ---
  
  const searchTitular = async (query) => {
    if (query.length < 3) {
      setTitularSuggestions([]);
      setShowTitularSuggestions(false);
      return;
    }

    setIsLoadingSuggestions(true);
    try {
      const response = await fetch(`${API_URL}/formulario/titulares/search?q=${query}`);
      if (!response.ok) throw new Error("Falha na busca de titulares.");
      const data = await response.json();
      setTitularSuggestions(data);
      setShowTitularSuggestions(data.length > 0);
      setSelectedSuggestionIndex(-1); // Reseta o índice de seleção
    } catch (error) {
      console.error("Erro na busca de titulares:", error);
      setTitularSuggestions([]);
      setShowTitularSuggestions(false);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleSelectTitular = (titularData) => {
    if (editingId === null) return;
    
    // 1. Atualiza os campos do formulário
    setEditFormData(prev => ({
      ...prev,
      titular: titularData.titular,
      cpfCnpjTitularConta: titularData.cpf_cnpj || prev.cpfCnpjTitularConta, // Mantém o anterior se o novo for nulo
    }));

    // 2. Trava a edição do titular e CPF/CNPJ (se CPF/CNPJ foi preenchido)
    if (titularData.cpf_cnpj) {
      setIsTitularLocked(true);
      toast.success("Titular e CPF/CNPJ preenchidos automaticamente.");
    } else {
      setIsTitularLocked(false);
    }

    // 3. Limpa e fecha o dropdown
    setTitularSuggestions([]);
    setShowTitularSuggestions(false);
    setSelectedSuggestionIndex(-1);
  };
  
  // Navegação no dropdown com teclado
  const handleKeyDown = (e) => {
    if (!showTitularSuggestions) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => 
        (prev + 1) % titularSuggestions.length
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => 
        (prev - 1 + titularSuggestions.length) % titularSuggestions.length
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedSuggestionIndex !== -1) {
        handleSelectTitular(titularSuggestions[selectedSuggestionIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setShowTitularSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }
  };

  // --- Lógica de Exportação Múltipla ---

  const handleExportAndLaunch = async () => {
    if (selectedRequests.length === 0) {
      toast.error("Selecione pelo menos uma solicitação para exportar/lançar.");
      return;
    }
    
    // Confirmação dupla
    const confirmed = window.confirm(
      `Você realmente deseja EXPORTAR E LANÇAR ${selectedRequests.length} solicitações? 
      Isso as marcará como 'Lançadas' e iniciará o download do arquivo CSV.`
    );
    
    if (!confirmed) return;
    
    const idList = selectedRequests;
    setIsSaving(true);
    
    try {
      const response = await exportarELancarFormularios(idList);
      
      // 1. Inicia o download do arquivo CSV (response.data é um Blob)
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'lancamentos_exportados.csv');
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      
      // 2. Atualiza o status 'lancado' dos itens no frontend (localmente)
      setRequests(prevRequests => 
        prevRequests.map(req => 
          idList.includes(req.id) ? { ...req, lancado: true } : req
        )
      );
      
      // 3. Limpa a seleção
      setSelectedRequests([]);
      
      toast.success(`${idList.length} solicitações exportadas e lançadas com sucesso!`);

    } catch (error) {
      console.error("Erro na exportação e lançamento:", error);
      toast.error("Erro ao exportar/lançar. Verifique a conexão com a API.");
    } finally {
      setIsSaving(false);
    }
  };


  // --- Lógica de Expansão de Linha ---
  const toggleRowExpansion = (id) => {
    setExpandedRows((prevExpanded) =>
      prevExpanded.includes(id)
        ? prevExpanded.filter((rowId) => rowId !== id)
        : [...prevExpanded, id]
    );
  };

  // --- Colunas e Campos Expandidos (Memoização) ---
  const columns = useMemo(() => getTableColumns(listaObras, listaUsuarios), [listaObras, listaUsuarios]);
  const expandedFieldsConfig = useMemo(() => getExpandedFields(listaUsuarios), [listaUsuarios]);


  // --- Lógica de FILTRAGEM (USANDO useMemo) ---
  // ✅ NOVO BLOCO DE LÓGICA DE FILTRAGEM AVANÇADA
  const filteredRequests = useMemo(() => {
    if (!requests || requests.length === 0) return [];

    let filtered = requests;
    
    // 1. Filtro por termo de busca geral (mantém a busca por texto)
    if (filterTerm) {
      const lowerCaseTerm = filterTerm.toLowerCase();
      filtered = filtered.filter(request =>
        Object.values(request).some(value => 
          // Converte para string e checa se inclui o termo
          String(value).toLowerCase().includes(lowerCaseTerm)
        )
      );
    }
    
    // 2. Filtro por Obra (ID numérico)
    if (filterState.obra) {
      const obraId = Number(filterState.obra);
      filtered = filtered.filter(request => request.obra === obraId);
    }
    
    // 3. Filtro por Titular (Texto - busca parcial)
    if (filterState.titular) {
      const lowerCaseTitular = filterState.titular.toLowerCase();
      filtered = filtered.filter(request => 
        request.titular && request.titular.toLowerCase().includes(lowerCaseTitular)
      );
    }
    
    // 4. Filtro por Solicitante (Nome/Texto - busca parcial)
    if (filterState.solicitante) {
      const lowerCaseSolicitante = filterState.solicitante.toLowerCase();
      filtered = filtered.filter(request => 
        request.solicitante && request.solicitante.toLowerCase().includes(lowerCaseSolicitante)
      );
    }
    
    // 5. Filtro por Status (Lançado/Não Lançado)
    if (filterState.status) {
      const isLancado = filterState.status === 'Y';
      // Converte o campo 'lancado' para booleano para comparação
      filtered = filtered.filter(request => !!request.lancado === isLancado); 
    }
    
    // 6. Filtro por Data de Pagamento (Data de Início)
    if (filterState.dataPagamentoInicio) {
      const start = new Date(filterState.dataPagamentoInicio).getTime();
      filtered = filtered.filter(request => {
        if (!request.dataPagamento) return false;
        const paymentDate = new Date(request.dataPagamento).getTime();
        return paymentDate >= start;
      });
    }

    // 7. Filtro por Data de Pagamento (Data de Fim)
    if (filterState.dataPagamentoFim) {
      const end = new Date(filterState.dataPagamentoFim).getTime();
      filtered = filtered.filter(request => {
        if (!request.dataPagamento) return false;
        const paymentDate = new Date(request.dataPagamento).getTime();
        // Adiciona 23:59:59 ao final do dia para incluir o dia inteiro
        return paymentDate <= end + 86399000; 
      });
    }

    return filtered;

  }, [
    requests, 
    filterTerm, 
    filterState.obra, 
    filterState.titular, 
    filterState.solicitante, 
    filterState.status,
    filterState.dataPagamentoInicio,
    filterState.dataPagamentoFim
  ]);
  // FIM DO BLOCO DE LÓGICA DE FILTRAGEM AVANÇADA


  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-indigo-50 min-h-screen font-sans text-slate-800">
      <Toaster position="top-right" />

      <div className="max-w-7xl mx-auto bg-white rounded-3xl shadow-2xl p-8 border border-gray-100 space-y-8">
        {/* --- HEADER --- */}
        <header className="flex justify-between items-center border-b pb-4">
          <h1 className="text-3xl font-extrabold text-indigo-700 flex items-center gap-3">
            <User className="w-8 h-8" />
            Painel de Gestão de Pagamentos
          </h1>
          <Link
            to="/solicitacao"
            className="px-6 py-2.5 rounded-xl shadow-md text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors transform hover:scale-105"
          >
            Nova Solicitação
          </Link>
        </header>

        {/* --- BARRA DE AÇÕES E BUSCA --- */}
        <div className="flex justify-between items-center space-x-4">
          {/* Busca por Texto Geral */}
          <div className="flex-1 max-w-lg relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar em todas as colunas (Titular, Obra, Valor, etc.)..."
              value={filterTerm}
              onChange={(e) => setFilterTerm(e.target.value)}
              className="w-full p-3 pl-10 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 transition-shadow shadow-sm"
            />
          </div>

          {/* Ações Múltiplas */}
          <div className="flex space-x-3 items-center">
            {selectedRequests.length > 0 && (
              <button
                onClick={handleExportAndLaunch}
                disabled={isSaving}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center space-x-2 ${
                  isSaving 
                    ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700 shadow-md'
                }`}
              >
                {isSaving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <FileText className="w-5 h-5" />
                )}
                <span>{isSaving ? 'Lançando...' : `Exportar & Lançar (${selectedRequests.length})`}</span>
              </button>
            )}

            {/* Botão de Atualizar Dados */}
            <button
              onClick={fetchData}
              disabled={isLoadingData || isSaving}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-colors duration-200 flex items-center space-x-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200"
            >
              <RotateCcw className={`w-5 h-5 ${isLoadingData ? 'animate-spin' : ''}`} />
              <span>Atualizar</span>
            </button>
          </div>
        </div>
        
        {/* NOVO BLOCO: --- FILTROS AVANÇADOS UI --- */}
        <div className="flex justify-between items-center mb-6 pt-4 border-t border-gray-100">
          <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-3">
            <FileText className="w-6 h-6 text-indigo-500" />
            Lista de Solicitações ({filteredRequests.length})
          </h2>

          <div className="flex space-x-3">
            {/* Botão de Filtro */}
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors duration-200 flex items-center space-x-2 ${
                isFilterOpen ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-white text-indigo-600 border border-indigo-500 hover:bg-indigo-50'
              } shadow-sm`}
            >
              <Filter size={18} />
              <span>{isFilterOpen ? 'Fechar Filtros' : 'Filtros Avançados'}</span>
            </button>
            
            {/* Botão de Reset de Filtros (Mostra se algum filtro avançado ou busca por texto estiver ativo) */}
            {(filterTerm || Object.values(filterState).some(val => !!val)) && (
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-colors duration-200 flex items-center space-x-2 bg-red-50 text-red-600 border border-red-300 hover:bg-red-100 shadow-sm"
              >
                <RotateCcw size={18} />
                <span>Limpar Filtros</span>
              </button>
            )}
          </div>
        </div>

        {/* Painel de Filtros Avançados */}
        <div
          className={`transition-all duration-300 ease-in-out overflow-hidden ${
            isFilterOpen ? "max-h-96 opacity-100 mb-6" : "max-h-0 opacity-0 mb-0"
          } bg-gray-50 border border-gray-200 rounded-xl p-6 shadow-inner`}
        >
          <h4 className="text-lg font-bold text-gray-700 mb-4 border-b pb-2">
            Opções de Filtragem
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Filtro Obra */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Obra</label>
              <select
                value={filterState.obra}
                onChange={(e) => setFilterState({ ...filterState, obra: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              >
                <option value="">Todas as Obras</option>
                {listaObras.map((obra) => (
                  <option key={obra.id} value={obra.id}>
                    {obra.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro Titular */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Titular</label>
              <input
                type="text"
                placeholder="Nome do titular..."
                value={filterState.titular}
                onChange={(e) => setFilterState({ ...filterState, titular: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              />
            </div>
            
            {/* Filtro Solicitante */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Solicitante</label>
              <select
                value={filterState.solicitante}
                onChange={(e) => setFilterState({ ...filterState, solicitante: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              >
                <option value="">Todos os Solicitantes</option>
                {/* Usuários listados como: { id: 1, nome: "Usuário" } */}
                {listaUsuarios.map((user) => (
                  <option key={user.id} value={user.nome}>
                    {user.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro Status (Lançado/Não Lançado) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filterState.status}
                onChange={(e) => setFilterState({ ...filterState, status: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              >
                <option value="">Todos os Status</option>
                <option value="Y">Lançado</option>
                <option value="N">Não Lançado</option>
              </select>
            </div>
            
            {/* Filtro Data de Pagamento Início */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pagamento Após</label>
              <input
                type="date"
                value={filterState.dataPagamentoInicio}
                onChange={(e) => setFilterState({ ...filterState, dataPagamentoInicio: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              />
            </div>

            {/* Filtro Data de Pagamento Fim */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pagamento Antes</label>
              <input
                type="date"
                value={filterState.dataPagamentoFim}
                onChange={(e) => setFilterState({ ...filterState, dataPagamentoFim: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              />
            </div>
          </div>
        </div>
        {/* FIM DO BLOCO: --- FILTROS AVANÇADOS UI --- */}


        {/* --- TABELA DE PAGAMENTOS --- */}
        {isLoadingData ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            <span className="ml-3 text-gray-600">Carregando dados...</span>
          </div>
        ) : (
          <PaymentTable
            // Configuração
            columns={columns}
            expandedFieldsConfig={expandedFieldsConfig}
            
            // Listas Auxiliares (Passadas explicitamente)
            listaObras={listaObras}
            listaTitulares={listaTitulares}
            listaUsuarios={listaUsuarios}
            
            // Props de Dados
            filteredRequests={filteredRequests}
            isAllSelected={isAllSelected}
            selectedRequests={selectedRequests}
            editingId={editingId}
            editFormData={editFormData}
            isSaving={isSaving}
            expandedRows={expandedRows}
            
            // Handlers
            handleSelectAll={handleSelectAll}
            handleSelectOne={handleSelectOne}
            handleEdit={handleEdit}
            handleSave={handleSave}
            handleCancelEdit={handleCancelEdit}
            handleRemove={handleRemove}
            toggleRowExpansion={toggleRowExpansion}
            handleEditChange={handleEditChange}
            handleToggleLancamento={handleToggleLancamento} 
            
            // Props de Autocomplete
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
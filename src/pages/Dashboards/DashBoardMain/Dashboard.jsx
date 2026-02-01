import React, { useState, useRef, useEffect, useMemo } from "react";
import toast, { Toaster } from "react-hot-toast";
import { Loader2, FileText, Filter, RotateCcw, User } from "lucide-react";
import { Link } from "react-router-dom";
import * as XLSX from "xlsx";

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
} from "./formularioService";

const API_URL = "http://91.98.132.210:5631";

export const Dashboard = () => {
  const [requests, setRequests] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // --- Estados para Dados Auxiliares ---
  const [listaUsuarios, setListaUsuarios] = useState([]); // Se houver rota para usuários, deve ser preenchida
  const [listaObras, setListaObras] = useState([]);
  const [listaTitulares, setListaTitulares] = useState([]);
  const [listaBancos, setListaBancos] = useState([]);
  const [listaCategorias, setListaCategorias] = useState([]);

  // --- Estados de Edição e Seleção ---
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

  // --- Filtros ---
  const [filters, setFilters] = useState({
    statusLancamento: "false", // ✅ PADRÃO: "Não (Pendente)" - mostra apenas lançamentos pendentes
    formaDePagamento: "",
    data: "",
    dataInicio: "",
    dataFim: "",
    obra: "",
    titular: "",
    solicitante: "",
    referente: "",
    busca: "",
    multiplayosLancamentos: "todos", // ✅ NOVO: Filtro para múltiplos lançamentos - padrão é "todos"
  });

  // =========================================================================
  // 1. CARREGAMENTO DE DADOS (Consolidado)
  // =========================================================================
  
  const fetchRequests = async () => {
    setIsLoadingData(true);
    try {
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
      const response = await fetch(`${API_URL}/titulares/list`);
      if (!response.ok) throw new Error("Erro ao buscar lista de titulares");
      const data = await response.json();
      setListaTitulares(data);
    } catch (error) {
      console.error("Erro ao carregar titulares:", error);
    }
  };

  const fetchListaBancos = async () => {
    try {
      const response = await fetch(`${API_URL}/bancos`);
      if (!response.ok) throw new Error("Erro ao buscar lista de bancos");
      const data = await response.json();
      setListaBancos(data);
    } catch (error) {
      console.error("Erro ao carregar bancos:", error);
    }
  };

  const fetchListaCategorias = async () => {
    try {
      const response = await fetch(`${API_URL}/categoria`);
      if (!response.ok) throw new Error("Erro ao buscar lista de categorias");
      const data = await response.json();
      setListaCategorias(data);
    } catch (error) {
      console.error("Erro ao carregar categorias:", error);
    }
  };

  // Carrega tudo ao montar o componente
  useEffect(() => {
    fetchRequests();
    fetchListaObras();
    fetchListaTitulares();
    fetchListaBancos();
    fetchListaCategorias();
    // Se tiver fetchListaUsuarios(), chame aqui
  }, []);

  // =========================================================================
  // 2. GERAÇÃO DINÂMICA DE COLUNAS
  // =========================================================================
  
  // O useMemo garante que as colunas sejam recriadas quando listaObras for carregada via API.
  const columns = useMemo(
    () => getTableColumns(listaUsuarios, listaObras, listaTitulares, listaBancos, listaCategorias),
    [listaUsuarios, listaObras, listaTitulares, listaBancos, listaCategorias]
  );

  const expandedFieldsConfig = useMemo(
    () => getExpandedFields(listaUsuarios, listaCategorias),
    [listaUsuarios, listaCategorias]
  );

  // =========================================================================
  // 3. LÓGICA DE FILTRAGEM
  // =========================================================================
  
  const filteredRequests = requests.filter((req) => {
    // FILTRO DE STATUS
    if (filters.statusLancamento !== "") {
      const filterBool = filters.statusLancamento === "true";
      if (req.statusLancamento !== filterBool) return false;
    }

    // FILTRO DE FORMA DE PAGAMENTO
    if (filters.formaDePagamento) {
      const filterValue = filters.formaDePagamento.trim().toUpperCase();
      const requestValue = req.formaDePagamento
        ? String(req.formaDePagamento).trim().toUpperCase()
        : "";
      if (requestValue !== filterValue) return false;
    }

    // FILTRO DE DATA (Single Date)
    if (filters.data && req.dataPagamento !== filters.data) return false;

    // FILTRO DE DATA INTERVALO (Data Início - Fim)
    if (filters.dataInicio && req.dataPagamento < filters.dataInicio) return false;
    if (filters.dataFim && req.dataPagamento > filters.dataFim) return false;

    // FILTRO DE OBRA (Comparação Robusta de IDs)
    if (filters.obra) {
      const filterIdString = String(filters.obra);
      const requestObraIdString = req.obra ? String(req.obra) : "";
      if (requestObraIdString !== filterIdString) return false;
    }

    // FILTRO DE TITULAR
    if (filters.titular) {
      const filterValue = filters.titular.trim().toUpperCase();
      const requestValue = req.titular
        ? String(req.titular).trim().toUpperCase()
        : "";
      if (requestValue !== filterValue) return false;
    }

    // FILTRO DE SOLICITANTE
    if (filters.solicitante) {
      const filterValue = filters.solicitante.trim().toUpperCase();
      const requestValue = req.solicitante
        ? String(req.solicitante).trim().toUpperCase()
        : "";
      if (!requestValue.includes(filterValue)) return false;
    }

    // FILTRO DE REFERENTE (DESCRIÇÃO)
    if (filters.referente) {
      const filterValue = filters.referente.trim().toUpperCase();
      const requestValue = req.referente
        ? String(req.referente).trim().toUpperCase()
        : "";
      if (!requestValue.includes(filterValue)) return false;
    }

    // FILTRO DE BUSCA MISTA (Valor, Titular, Referente)
    if (filters.busca) {
      const searchValue = filters.busca.trim().toUpperCase();
      const valor = req.valor ? String(req.valor).toUpperCase() : "";
      const titular = req.titular ? String(req.titular).toUpperCase() : "";
      const referente = req.referente ? String(req.referente).toUpperCase() : "";
      
      const encontrado = valor.includes(searchValue) || 
                        titular.includes(searchValue) || 
                        referente.includes(searchValue);
      
      if (!encontrado) return false;
    }

    // ✅ NOVO: FILTRO DE MÚLTIPLOS LANÇAMENTOS (usando grupo_lancamento ao invés de multiplos_lancamentos)
    if (filters.multiplayosLancamentos === "sim") {
      // Mostra apenas lançamentos que têm grupo_lancamento (múltiplos)
      if (!req.grupo_lancamento) return false;
    } else if (filters.multiplayosLancamentos === "nao") {
      // Mostra apenas lançamentos que NÃO têm grupo_lancamento (simples)
      if (req.grupo_lancamento) return false;
    }
    // Se "todos", não filtra nada

    return true;
  });

  // ✅ FUNÇÃO PARA EXTRAIR NÚMERO DE PARCELA DO REFERENTE
  // Exemplo: "Compra de cimento (2/3)" → 2
  const extractInstallmentNumber = (referente) => {
    if (!referente) return 0;
    const match = referente.match(/\((\d+)\/\d+\)$/);
    return match ? parseInt(match[1], 10) : 0;
  };

  // ✅ NOVO: Agrupar lançamentos por grupo_lancamento (para múltiplos lançamentos)
  // NOTA: O backend já retorna apenas 1 por grupo, então essa função não precisa fazer muito
  const groupLancamentosByGroup = (lancamentos) => {
    // O backend já retorna apenas o primeiro de cada grupo
    // Apenas retorna os dados como estão
    return lancamentos;
  };

  // ✅ ORDENAR POR DATA, DEPOIS POR NÚMERO DE PARCELA
  const sortedAndFilteredRequests = [...filteredRequests].sort((a, b) => {
    // Primeiro, ordena por data de pagamento (crescente)
    const dateA = new Date(a.dataPagamento || "1900-01-01");
    const dateB = new Date(b.dataPagamento || "1900-01-01");
    
    if (dateA.getTime() !== dateB.getTime()) {
      return dateA.getTime() - dateB.getTime();
    }

    // Se as datas são iguais, ordena por número de parcela (crescente)
    const installmentA = extractInstallmentNumber(a.referente);
    const installmentB = extractInstallmentNumber(b.referente);
    
    return installmentA - installmentB;
  });

  // ✅ NOVO: Agrupar lançamentos por grupo_lancamento
  const groupedAndSortedRequests = groupLancamentosByGroup(sortedAndFilteredRequests);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      statusLancamento: "false", // ✅ Mantém padrão "Não (Pendente)"
      formaDePagamento: "",
      data: "",
      dataInicio: "",
      dataFim: "",
      obra: "",
      titular: "",
      solicitante: "",
      referente: "",
      busca: "",
    });
    toast.success("Filtros limpos");
  };

  // =========================================================================
  // 4. HANDLERS DE TABELA, EDIÇÃO E REMOÇÃO
  // =========================================================================

  const toggleRowExpansion = (id) => {
    setExpandedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  const handleSelectOne = (id) => {
    // ✅ NOVO: Bloqueia seleção de múltiplos
    const request = groupedAndSortedRequests.find(r => r.id === id);
    if (request?.grupo_lancamento && request?.obras_relacionadas?.length > 0) {
      toast.error("Lançamentos múltiplos não podem ser exportados para CSV");
      return;
    }
    
    setSelectedRequests((prevSelected) =>
      prevSelected.includes(id)
        ? prevSelected.filter((reqId) => reqId !== id)
        : [...prevSelected, id]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      // ✅ NOVO: Seleciona apenas lançamentos simples (não múltiplos)
      const simpleLaunches = groupedAndSortedRequests.filter(
        req => !req.grupo_lancamento || req.obras_relacionadas?.length === 0
      );
      setSelectedRequests(simpleLaunches.map((req) => req.id));
    } else {
      setSelectedRequests([]);
    }
  };

  const isAllSelected =
    sortedAndFilteredRequests.length > 0 &&
    selectedRequests.length === groupedAndSortedRequests.length;

  const handleEdit = (request) => {
    if (editingId) {
      toast.error("Finalize a edição atual antes de iniciar outra.");
      return;
    }
    
    
    // Abre a linha para edição
    setExpandedRows((prev) =>
      prev.includes(request.id) ? prev : [...prev, request.id]
    );
    
    // Desmarca seleção da linha em edição para evitar conflitos
    setSelectedRequests((prevSelected) =>
      prevSelected.filter((id) => id !== request.id)
    );
    
    setEditingId(request.id);

    // ✅ CORREÇÃO: Prepara o formulário. 
    // Converte 'obra', 'conta' e 'quemPaga' para string para garantir que o <select> encontre o valor correto.
    // Se 'conta' não estiver preenchido mas 'quemPaga' estiver, usa 'quemPaga' como padrão
    const contaValue = request.conta || request.quemPaga || "";
    const quemPagaValue = request.quemPaga || "";
    
    
    const newFormData = {
      ...request,
      obra: request.obra ? String(request.obra) : "",
      conta: contaValue ? String(contaValue) : "",
      quemPaga: quemPagaValue ? String(quemPagaValue) : "",
    };
    
    setEditFormData(newFormData);

    setIsTitularLocked(false);

    // ✅ NOVO: Se não tiver 'conta' mas tiver 'obra', busca o banco vinculado à obra
    if (request.obra && !request.conta) {
      fetch(`${API_URL}/obras/${request.obra}`)
        .then((response) => {
          if (!response.ok) throw new Error("Erro ao buscar obra");
          return response.json();
        })
        .then((obra) => {
          
          // ✅ Usa diretamente o banco_id da obra
          if (obra.banco_id) {
            setEditFormData((prev) => ({
              ...prev,
              quemPaga: obra.quem_paga,
              conta: Number(obra.banco_id),
            }));
          } else {
          }
        })
        .catch((error) => console.error("❌ Erro ao sincronizar banco:", error));
    }

    // Scroll suave até a linha
    setTimeout(() => {
      document
        .getElementById(`row-${request.id}`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    let newValue = value;

    if (name === "valor") newValue = value.replace(/\D/g, "");
    if (type === "checkbox") newValue = checked;
    if (["quemPaga", "obra", "conta", "titular"].includes(name)) {
      if (name === "titular" && typeof value === "string") {
        newValue = value;
        setIsTitularLocked(false);
      } else {
        // Obra, quemPaga e conta são numéricos no backend
        newValue = Number(value);
      }
    }

    setEditFormData((prevData) => ({ ...prevData, [name]: newValue }));
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
      
      // ✅ NOVO: Se é múltiplo e alterou o valor, distribui entre as obras
      const requestAtual = groupedAndSortedRequests.find(r => r.id === editingId);
      console.log("🔍 handleSave - requestAtual:", { id: editingId, grupo_lancamento: requestAtual?.grupo_lancamento, obras_relacionadas_length: requestAtual?.obras_relacionadas?.length });
      
      if (requestAtual?.grupo_lancamento && requestAtual?.obras_relacionadas?.length > 0) {
        // Calcula novo valor total
        const novoValorTotal = parseInt(rawValue);
        const numObras = (requestAtual.obras_relacionadas?.length || 0) + 1;
        const valorPorObra = Math.floor(novoValorTotal / numObras);
        const resto = novoValorTotal % numObras;
        
        // A primeira obra (principal) fica com o resto
        const valorPrincipal = valorPorObra + resto;
        
        dataToSave.valor = String(valorPrincipal);
        
        // Salva a principal
        await atualizarFormulario(editingId, dataToSave);
        
        // Atualiza as obras relacionadas com valor igual
        if (requestAtual.obras_relacionadas?.length > 0) {
          for (const obra of requestAtual.obras_relacionadas) {
            await atualizarFormulario(obra.id, { valor: String(valorPorObra) });
          }
        }
      } else {
        // Lançamento simples, salva normalmente
        await atualizarFormulario(editingId, dataToSave);
      }
      
      toast.success("Solicitação atualizada com sucesso!");
      setEditingId(null);
      setEditFormData({});
      setIsTitularLocked(false);
      
      // Recarrega os dados para atualizar a tabela
      await fetchRequests();
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

  // =========================================================================
  // ✅ NOVO HANDLER: Toggle Status de Lançamento
  // =========================================================================
  const handleToggleLancamento = async (id, isCurrentlyLancado) => {
    if (editingId) {
      toast.error("Finalize a edição atual antes de mudar o status.");
      return;
    }
    
    const novoStatus = !isCurrentlyLancado;
    const actionText = novoStatus ? "Lançado" : "Pendente";
    
    const toastId = toast.loading(`Atualizando status para ${actionText}...`);
    try {
      // 1. Chama o serviço API para atualizar no banco de dados
      await atualizarStatusLancamento(id, novoStatus);
      
      // 2. Atualiza o estado local para uma resposta rápida da UI
      setRequests(prevRequests =>
        prevRequests.map(req =>
          req.id === id ? { ...req, statusLancamento: novoStatus } : req
        )
      );
      
      toast.success(`Status alterado para ${actionText} com sucesso.`, { id: toastId });
    } catch (error) {
      console.error("Erro ao alternar status:", error);
      toast.error("Erro ao salvar o novo status.", { id: toastId });
    }
  };


  // =========================================================================
  // 5. LÓGICA DE AUTOCOMPLETE E DEPENDÊNCIAS
  // =========================================================================

  // Buscar Titulares (Autocomplete)
  useEffect(() => {
    const fetchTitularesSuggestions = async () => {
      if (
        !editFormData.titular ||
        typeof editFormData.titular !== "string" ||
        !editFormData.titular.trim()
      ) {
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

    const debounceTimer = setTimeout(fetchTitularesSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [editFormData.titular]);

  // Buscar quem_paga e sincronizar conta quando obra mudar
  useEffect(() => {
    const fetchQuemPaga = async () => {
      // Se não tiver obra selecionada, não busca
      if (!editFormData.obra) {
        return;
      }

      try {
        const response = await fetch(`${API_URL}/obras/${editFormData.obra}`);
        if (!response.ok) throw new Error("Erro ao buscar obra");

        const obra = await response.json();
        
        // ✅ Usa diretamente o banco_id da obra
        if (obra.banco_id) {
          setEditFormData((prev) => { 
            const updated = {
              ...prev, 
              quemPaga: obra.quem_paga,
              conta: Number(obra.banco_id),
            };
            return updated;
          });
        } else {
        }
      } catch (error) {
        console.error("❌ Erro ao buscar quem_paga:", error);
      }
    };

    if (editingId !== null && editFormData.obra) {
      fetchQuemPaga();
    }
  }, [editFormData.obra, editingId]);

  // Fechar sugestões ao clicar fora
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

  const handleGenerateCSV = async () => {
    if (selectedRequests.length === 0) {
      toast.error("Selecione pelo menos um registro para gerar o Excel.");
      return;
    }
    
    setIsSaving(true);
    
    try {
      // ✅ GARANTIR QUE LISTA DE OBRAS ESTÁ CARREGADA
      let obrasAtualizada = listaObras;
      if (!listaObras || listaObras.length === 0) {
        try {
          const response = await fetch(`${API_URL}/obras`);
          if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
          obrasAtualizada = await response.json();
        } catch (error) {
          console.error("⚠️ Erro ao recarregar lista de obras:", error);
          obrasAtualizada = [];
        }
      }
      
      // Preparar dados para o Excel com a estrutura correta
      const dataToExport = selectedRequests.map((id) => {
        const request = requests.find((r) => r.id === id);
        if (!request) return null;
        
        // Buscar obra com tratamento robusto
        const obraEncontrada = obrasAtualizada && obrasAtualizada.length > 0
          ? obrasAtualizada.find(o => Number(o.id) === Number(request.obra))
          : null;

        // Buscar banco pelo ID
        const bancoEncontrado = listaBancos && listaBancos.length > 0
          ? listaBancos.find(b => Number(b.id) === Number(request.conta))
          : null;

        // Buscar categoria pelo ID
        const categoriaEncontrada = listaCategorias && listaCategorias.length > 0
          ? listaCategorias.find(c => Number(c.id) === Number(request.categoria))
          : null;
        
        // Formatar datas para DD/MM/YYYY
        const formatDate = (dateStr) => {
          if (!dateStr) return "";
          const date = new Date(dateStr);
          // ✅ CORREÇÃO: Adicionar 1 dia para compensar diferença de timezone
          date.setDate(date.getDate() + 1);
          return date.toLocaleDateString('pt-BR');
        };

        // Formatar valor apenas em números, sem R$ ou símbolo de moeda
        const formatCurrency = (value) => {
          if (!value) return "";
          const num = Number(value) / 100;
          return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        };

        return {
          "Data de competência*": formatDate(request.dataCompetencia),
          "Data de vencimento*": formatDate(request.dataPagamento),
          "Data de pagamento": "",
          "Valor*": formatCurrency(request.valor),
          "Pago a (Fornecedor)": request.titular || "",
          "Descrição": request.referente || "",
          "Número do Documento": request.chavePix || "",
          "Categoria*": categoriaEncontrada?.nome || "",
          "Forma de Pagamento": request.formaDePagamento || "",
          "Quem Paga*": "Empresa",
          "Conta Bancária*": bancoEncontrado?.nome || "",
          "Centro de Custo*": "Obra",
          // ✅ CORREÇÃO: Trazer o NOME da obra do endpoint /obras (campo "nome")
          "Obra": obraEncontrada?.nome || "",
          "Índice Etapa / Item": "",
        };
      }).filter(item => item !== null);
      
      // Criar workbook e worksheet
      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Planilha de Importação");
      
      // ✅ NOVO: Aplicar formato de data às colunas de data
      // Colunas A, B, C são as datas (Data de competência, Data de vencimento, Data de pagamento)
      const range = XLSX.utils.decode_range(ws['!ref']);
      for (let R = range.s.r; R <= range.e.r; ++R) {
        // Coluna A (Data de competência) - índice 0
        const cellA = XLSX.utils.encode_cell({ r: R, c: 0 });
        if (ws[cellA]) ws[cellA].z = 'dd/mm/yyyy';
        
        // Coluna B (Data de vencimento) - índice 1
        const cellB = XLSX.utils.encode_cell({ r: R, c: 1 });
        if (ws[cellB]) ws[cellB].z = 'dd/mm/yyyy';
        
        // Coluna C (Data de pagamento) - índice 2
        const cellC = XLSX.utils.encode_cell({ r: R, c: 2 });
        if (ws[cellC]) ws[cellC].z = 'dd/mm/yyyy';
      }
      
      // Ajustar largura das colunas
      const colWidths = [
        { wch: 18 },  // Data de competência
        { wch: 18 },  // Data de vencimento
        { wch: 18 },  // Data de pagamento
        { wch: 15 },  // Valor
        { wch: 25 },  // Pago a (Fornecedor)
        { wch: 30 },  // Descrição
        { wch: 15 },  // Número do Documento
        { wch: 18 },  // Categoria
        { wch: 18 },  // Forma de Pagamento
        { wch: 18 },  // Quem Paga
        { wch: 20 },  // Conta Bancária
        { wch: 18 },  // Centro de Custo
        { wch: 20 },  // Obra
        { wch: 18 },  // Índice Etapa / Item
      ];
      ws['!cols'] = colWidths;
      
      // Gerar nome do arquivo com data/hora
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
      const fileName = `Planilha de Importação_${dateStr}_${timeStr}.xlsx`;
      
      // Fazer download
      XLSX.writeFile(wb, fileName);
      
      // Atualizar status para "Lançado" se estiver "Pendente"
      let statusUpdateErrors = 0;
      for (const id of selectedRequests) {
        const request = requests.find((r) => r.id === id);
        if (request && !request.statusLancamento) {
          // Se status é false (Pendente), atualiza para true (Lançado)
          try {
            await atualizarStatusLancamento(id, true);
          } catch (error) {
            console.error(`Erro ao atualizar status do ID ${id}:`, error);
            statusUpdateErrors++;
          }
        }
      }
      
      // Recarrega os dados após atualizar status
      await fetchRequests();
      
      // Mensagem de sucesso com informações adicionais se houver erros
      if (statusUpdateErrors > 0) {
        toast.success(`Excel gerado com ${selectedRequests.length} registro(s)! (⚠️ ${statusUpdateErrors} status não atualizados)`);
      } else {
        toast.success(`Excel gerado com ${selectedRequests.length} registro(s)!`);
      }
      setSelectedRequests([]);
      
    } catch (error) {
      console.error("Erro ao gerar Excel:", error);
      toast.error("Erro ao gerar arquivo Excel.");
    } finally {
      setIsSaving(false);
    }
  };

  // =========================================================================
  // 6. RENDERIZAÇÃO
  // =========================================================================

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
            <p>Gerenciamento do Sistema</p>
          </Link>
        </div>

        {/* Container de Filtros */}
        <div className="bg-white rounded-2xl shadow-md p-5 mb-6 border border-gray-100">
          <div className="flex items-center gap-2 mb-4 text-gray-700 font-semibold border-b pb-2">
            <Filter className="w-5 h-5 text-indigo-600" />
            <span>Filtros de Pesquisa</span>
          </div>
          
          {/* Linha 1: Status, Forma Pagto, Data, Obra */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end mb-4">
            
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

            {/* Data Única */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500 uppercase">
                Data (Exata)
              </label>
              <input
                type="date"
                name="data"
                value={filters.data}
                onChange={handleFilterChange}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
              ></input>
            </div>

            {/* Obra */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500 uppercase">
                Obra
              </label>
              <select
                name="obra"
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
          </div>

          {/* Linha 2: Intervalo de Data, Titular, Solicitante */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end mb-4">
            
            {/* Data Início (Intervalo) */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500 uppercase">
                Data Início
              </label>
              <input
                type="date"
                name="dataInicio"
                value={filters.dataInicio}
                onChange={handleFilterChange}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
              ></input>
            </div>

            {/* Data Fim (Intervalo) */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500 uppercase">
                Data Fim
              </label>
              <input
                type="date"
                name="dataFim"
                value={filters.dataFim}
                onChange={handleFilterChange}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
              ></input>
            </div>

            {/* Titular */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500 uppercase">
                Titular
              </label>
              <select
                name="titular"
                value={filters.titular}
                onChange={handleFilterChange}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">Todos</option>
                {listaTitulares.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Solicitante */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500 uppercase">
                Solicitante
              </label>
              <input
                type="text"
                name="solicitante"
                placeholder="Digitar nome..."
                value={filters.solicitante}
                onChange={handleFilterChange}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            {/* ✅ NOVO: Múltiplos Lançamentos */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500 uppercase">
                Múltiplos Lançamentos
              </label>
              <select
                name="multiplayosLancamentos"
                value={filters.multiplayosLancamentos}
                onChange={handleFilterChange}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="todos">Todos</option>
                <option value="sim">Sim (Múltiplos)</option>
                <option value="nao">Não (Simples)</option>
              </select>
            </div>
          </div>

          {/* Linha 3: Descrição (Referente), Busca Mista, Botão Limpar */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            
            {/* Descrição (Referente) */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500 uppercase">
                Descrição
              </label>
              <input
                type="text"
                name="referente"
                placeholder="Buscar descrição..."
                value={filters.referente}
                onChange={handleFilterChange}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            {/* Busca Mista (Valor, Titular, Referente) */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500 uppercase">
                Busca Rápida
              </label>
              <input
                type="text"
                name="busca"
                placeholder="Valor, titular ou descrição..."
                value={filters.busca}
                onChange={handleFilterChange}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            {/* Botão Limpar - Espande para 2 colunas em telas pequenas */}
            <button
              onClick={clearFilters}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 text-sm h-[42px] lg:col-span-2"
            >
              <RotateCcw className="w-4 h-4" /> Limpar Filtros
            </button>
          </div>
        </div>

        {/* Tabela de Pagamentos */}
        {isLoadingData ? (
          <div className="flex justify-center items-center p-12">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            <span className="ml-3 text-gray-600">Carregando dados...</span>
          </div>
        ) : (
          <PaymentTable
            // Props de Configuração
            columns={columns}
            expandedFieldsConfig={expandedFieldsConfig}
            
            // Listas Auxiliares (Passadas explicitamente)
            listaObras={listaObras}
            listaTitulares={listaTitulares}
            listaUsuarios={listaUsuarios}
            listaBancos={listaBancos}
            listaCategorias={listaCategorias}
            
            // Props de Dados (✅ USANDO DADOS AGRUPADOS POR GRUPO_LANCAMENTO)
            filteredRequests={groupedAndSortedRequests}
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
            //{/* ✅ NOVO: Passando o handler de status */}

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
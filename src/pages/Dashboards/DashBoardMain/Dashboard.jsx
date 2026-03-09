import React, { useState, useRef, useEffect, useMemo } from "react";
import toast, { Toaster } from "react-hot-toast";
import { Loader2, FileText, Filter, RotateCcw, User, History, ChevronDown, Clock, Hash, Users } from "lucide-react";
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
  const obraFilterRef = useRef(null);
  const [obraFilterText, setObraFilterText] = useState("");
  const [isObraDropdownOpen, setIsObraDropdownOpen] = useState(false);

  const titularFilterRef = useRef(null);
  const [titularFilterText, setTitularFilterText] = useState("");
  const [isTitularDropdownOpen, setIsTitularDropdownOpen] = useState(false);

  // --- Estados para Histórico de Exportações ---
  const [historicoExportacoes, setHistoricoExportacoes] = useState([]);
  const [isHistoricoOpen, setIsHistoricoOpen] = useState(false);
  const [historicoFiltroAtivo, setHistoricoFiltroAtivo] = useState(null); // ID da exportação filtrada
  const [isLoadingHistorico, setIsLoadingHistorico] = useState(false);
  const [historicoFilterIds, setHistoricoFilterIds] = useState(null); // IDs dos formulários para filtrar
  const historicoRef = useRef(null);

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
  // HISTÓRICO DE EXPORTAÇÕES
  // =========================================================================

  const fetchHistorico = async () => {
    try {
      const response = await fetch(`${API_URL}/historico/exportacoes`);
      if (!response.ok) throw new Error("Erro ao buscar histórico");
      const data = await response.json();
      setHistoricoExportacoes(data.exportacoes || []);
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
    }
  };

  const handleSelecionarHistorico = async (exportacao) => {
    if (historicoFiltroAtivo === exportacao.id) {
      // Se clicar no mesmo, remove o filtro
      setHistoricoFiltroAtivo(null);
      setHistoricoFilterIds(null);
      setIsHistoricoOpen(false);
      toast.success("Filtro de histórico removido.");
      return;
    }

    try {
      setIsLoadingHistorico(true);
      const response = await fetch(`${API_URL}/historico/exportacoes/${exportacao.id}/itens`);
      if (!response.ok) throw new Error("Erro ao buscar itens");
      const data = await response.json();

      setHistoricoFilterIds(data.formulario_ids || []);
      setHistoricoFiltroAtivo(exportacao.id);
      setIsHistoricoOpen(false);

      // Limpar filtro de status para mostrar todos (lançados e pendentes)
      setFilters(prev => ({ ...prev, statusLancamento: "" }));

      toast.success(`Filtrando ${exportacao.quantidade} lançamento(s) do histórico #${exportacao.id}`);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar itens do histórico.");
    } finally {
      setIsLoadingHistorico(false);
    }
  };

  const handleLimparHistoricoFiltro = () => {
    setHistoricoFiltroAtivo(null);
    setHistoricoFilterIds(null);
    toast.success("Filtro de histórico removido.");
  };

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (historicoRef.current && !historicoRef.current.contains(e.target)) {
        setIsHistoricoOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fechar dropdown de obra ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (obraFilterRef.current && !obraFilterRef.current.contains(e.target)) {
        setIsObraDropdownOpen(false);
      }
      if (titularFilterRef.current && !titularFilterRef.current.contains(e.target)) {
        setIsTitularDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Lista de obras filtradas e ordenadas para o autocomplete
  const obrasFiltradasOrdenadas = useMemo(() => {
    const sorted = [...listaObras].sort((a, b) =>
      (a.nome || "").localeCompare(b.nome || "", "pt-BR")
    );
    if (!obraFilterText.trim()) return sorted;
    const search = obraFilterText.trim().toLowerCase();
    return sorted.filter((o) => (o.nome || "").toLowerCase().includes(search));
  }, [listaObras, obraFilterText]);

  // Lista de titulares filtrados e ordenados para o autocomplete
  const titularesFiltradosOrdenados = useMemo(() => {
    // Extrair titulares únicos dos lançamentos carregados
    const titularesUnicos = new Map();
    requests.forEach((req) => {
      if (req.titular && req.titular.trim()) {
        const nome = req.titular.trim();
        if (!titularesUnicos.has(nome.toUpperCase())) {
          titularesUnicos.set(nome.toUpperCase(), nome);
        }
      }
    });
    const sorted = Array.from(titularesUnicos.values()).sort((a, b) =>
      a.localeCompare(b, "pt-BR")
    );
    if (!titularFilterText.trim()) return sorted;
    const search = titularFilterText.trim().toLowerCase();
    return sorted.filter((nome) => nome.toLowerCase().includes(search));
  }, [requests, titularFilterText]);

  // =========================================================================
  // 1. CARREGAMENTO DE DADOS (Consolidado)
  // =========================================================================
  
  const fetchRequests = async (silent = false) => {
    if (!silent) setIsLoadingData(true);
    try {
      const data = await listarFormularios();
      setRequests(data);
    } catch (error) {
      console.error("Erro ao carregar requisições:", error);
      toast.error("Erro ao carregar a lista de lançamentos.");
    } finally {
      if (!silent) setIsLoadingData(false);
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
    fetchHistorico();
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

    // FILTRO DE TITULAR (por nome)
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
      
      // ✅ CORREÇÃO: Também busca no valor formatado em reais (ex: "30,02")
      // O valor no banco está em centavos (3002), formata para "30,02" para comparação
      const valorReaisFormatado = req.valor 
        ? (Number(req.valor) / 100).toFixed(2).replace(".", ",") 
        : "";
      
      const encontrado = valor.includes(searchValue) || 
                        valorReaisFormatado.includes(searchValue) ||
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

    // FILTRO DE HISTÓRICO DE EXPORTAÇÃO
    if (historicoFilterIds && historicoFilterIds.length > 0) {
      if (!historicoFilterIds.includes(req.id)) return false;
    }

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
      multiplayosLancamentos: "todos", // ✅ CORREÇÃO: Resetar filtro de múltiplos
    });
    setObraFilterText("");
    setIsObraDropdownOpen(false);
    setTitularFilterText("");
    setIsTitularDropdownOpen(false);
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
    const isMultiple = request?.grupo_lancamento && request?.obras_relacionadas?.length > 0;
    
    console.warn(`⚠️ handleSelectOne - ID ${id}`);
    console.warn(`   request encontrado:`, !!request);
    if (request) {
      console.warn(`   grupo_lancamento:`, request.grupo_lancamento);
      console.warn(`   obras_relacionadas:`, request.obras_relacionadas?.length);
    }
    console.warn(`   isMultiple:`, isMultiple);
    
    if (isMultiple) {
      console.error(`❌ BLOQUEADO: Tentou marcar múltiplo ID ${id}`);
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
    
    
    // ✅ MÁSCARA: Converter valor de centavos para reais com vírgula ao abrir edição
    const valorCentavos = Number(request.valor) || 0;
    const valorFormatado = (valorCentavos / 100).toFixed(2).replace(".", ",");

    // ✅ MÁSCARA: Converter valores das obras relacionadas de centavos para reais com vírgula
    const obrasRelacionadasFormatadas = (request.obras_relacionadas || []).map(obra => ({
      ...obra,
      valor: obra.valor ? (Number(obra.valor) / 100).toFixed(2).replace(".", ",") : "0,00",
    }));

    const newFormData = {
      ...request,
      obra: request.obra ? String(request.obra) : "",
      conta: contaValue ? String(contaValue) : "",
      quemPaga: quemPagaValue ? String(quemPagaValue) : "",
      valor: valorFormatado, // ✅ Ex: 1289 → "12,89"
      // ✅ NOVO: Copiar obras_relacionadas para edição (já formatadas)
      obras_relacionadas: obrasRelacionadasFormatadas,
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

    if (name === "valor") {
      // ✅ MÁSCARA: Aceita apenas dígitos e vírgula (a máscara do input já filtra)
      newValue = value.replace(/[^\d,]/g, "");
      // Garante no máximo 1 vírgula e máx 2 casas decimais
      const parts = newValue.split(",");
      if (parts.length > 2) newValue = parts[0] + "," + parts.slice(1).join("");
      if (parts.length === 2 && parts[1].length > 2) newValue = parts[0] + "," + parts[1].slice(0, 2);
    }
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

  // ✅ NOVO: Handler para editar obras relacionadas
  const handleEditObraRelacionada = (index, field, value) => {
    setEditFormData((prevData) => {
      const novasObras = [...(prevData.obras_relacionadas || [])];
      if (!novasObras[index]) {
        novasObras[index] = { obra: prevData.obras_relacionadas?.[index]?.obra || 0 };
      }
      
      if (field === "valor") {
        // ✅ MÁSCARA: Permite dígitos e vírgula, máx 1 vírgula, máx 2 decimais
        let raw = value.replace(/[^\d,]/g, "");
        const parts = raw.split(",");
        if (parts.length > 2) raw = parts[0] + "," + parts.slice(1).join("");
        if (parts.length === 2 && parts[1].length > 2) raw = parts[0] + "," + parts[1].slice(0, 2);
        novasObras[index][field] = raw || "0";
      } else {
        // Para 'obra', converte para número
        novasObras[index][field] = Number(value);
      }
      
      return { ...prevData, obras_relacionadas: novasObras };
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    // ✅ NOVO: Converte vírgula ou ponto para decimal corretamente
    const normalizedValue = String(editFormData.valor).replace(",", ".");
    const rawValue = normalizedValue.replace(/[^\d.]/g, "");
    if (rawValue.length === 0 || parseFloat(rawValue) === 0) {
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
      // ✅ CORREÇÃO: O valor está em reais (ex: "12.89"), converter para centavos antes de salvar
      const valorEmReais = rawValue ? Number(rawValue) : 0;
      const valorEmCentavos = Math.round(valorEmReais * 100);
      const dataToSave = { ...editFormData, valor: valorEmCentavos };
      const requestAtual = groupedAndSortedRequests.find(r => r.id === editingId);
      
      if (requestAtual?.grupo_lancamento && editFormData.obras_relacionadas?.length > 0) {
        // Salva a obra principal
        await atualizarFormulario(editingId, dataToSave);
        
        // Salva cada obra relacionada com seu valor editado
        if (editFormData.obras_relacionadas?.length > 0) {
          for (const obra of editFormData.obras_relacionadas) {
            // ✅ CORREÇÃO: obra.valor está em reais com vírgula (ex: "12,89"), converter para centavos
            const obraValorNorm = String(obra.valor).replace(",", ".");
            const obraValorEmReais = Number(obraValorNorm) || 0;
            const obraValorEmCentavos = Math.round(obraValorEmReais * 100);
            const obraDataToSave = {
              ...obra,
              valor: obraValorEmCentavos,
              data_pagamento: editFormData.dataPagamento,
            };
            await atualizarFormulario(obra.id, obraDataToSave);
          }
        }
      } else {
        await atualizarFormulario(editingId, dataToSave);
      }
      
      toast.success("Solicitação atualizada com sucesso!");
      // ✅ Recolhe a linha expandida após salvar
      setExpandedRows((prev) => prev.filter((rowId) => rowId !== editingId));
      setEditingId(null);
      setEditFormData({});
      setIsTitularLocked(false);
      await fetchRequests(true);
    } catch (error) {
      console.error("❌ ERRO ao salvar:", error);
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
    
    // ✅ CORREÇÃO: Detectar se é lançamento múltiplo e avisar o usuário
    const request = groupedAndSortedRequests.find(r => r.id === id);
    const isMultiple = request?.grupo_lancamento && request?.obras_relacionadas?.length > 0;
    const totalNoGrupo = isMultiple ? (request.obras_relacionadas.length + 1) : 1;
    
    const confirmMessage = isMultiple
      ? `⚠️ Este lançamento faz parte de um grupo com ${totalNoGrupo} obras.\n\nDeseja excluir TODOS os ${totalNoGrupo} lançamentos do grupo?`
      : "Tem certeza que deseja remover esta solicitação?";
    
    if (window.confirm(confirmMessage)) {
      try {
        const result = await deletarFormulario(id);
        const idsDeletados = result?.ids_deletados || [id];
        const totalDeletados = result?.total_deletados || 1;
        
        // ✅ Remover TODOS os IDs deletados da lista local (inclui todos do grupo)
        const idsSet = new Set(idsDeletados.map(Number));
        setRequests((prev) => prev.filter((req) => !idsSet.has(Number(req.id))));
        setSelectedRequests((prev) => prev.filter((reqId) => !idsSet.has(Number(reqId))));
        
        if (totalDeletados > 1) {
          toast.success(`${totalDeletados} lançamentos do grupo removidos com sucesso.`);
        } else {
          toast.success("Solicitação removida.");
        }
        
        // ✅ CORREÇÃO: Recarregar dados do servidor para garantir consistência
        // Isso previne que registros órfãos do grupo fiquem visíveis
        await fetchRequests(true);
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

  // ✅ NOVO: Handler para foco no campo titular - força abertura do dropdown
  const handleTitularFocus = () => {
    if (editFormData.titular && typeof editFormData.titular === "string" && editFormData.titular.trim()) {
      setShowTitularSuggestions(true);
    }
  };

  // ✅ NOVO: Desbloquear titular para permitir troca de fornecedor
  const handleUnlockTitular = () => {
    setIsTitularLocked(false);
    setEditFormData((prev) => ({ ...prev, titular: "" }));
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

  // =========================================================================
  // ✅ TOTALIZADOR: Soma dos valores dos lançamentos selecionados
  // =========================================================================
  const selecaoResumo = useMemo(() => {
    if (selectedRequests.length === 0) return { total: 0, quantidade: 0 };
    let total = 0;
    for (const id of selectedRequests) {
      const req = requests.find((r) => r.id === id);
      if (req) {
        // valor_total para múltiplos, valor para simples — ambos em centavos
        total += (req.valor_total || req.valor || 0);
      }
    }
    return { total, quantidade: selectedRequests.length };
  }, [selectedRequests, requests]);

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
          try {
            const strDate = String(dateStr).trim();
            // Se está no formato YYYY-MM-DD, faz parse manual SEM ajuste de dia
            if (/^\d{4}-\d{2}-\d{2}$/.test(strDate)) {
              const [year, month, day] = strDate.split("-").map(Number);
              if (isNaN(year) || isNaN(month) || isNaN(day)) return "";
              return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
            }
            // Para ISO com T
            if (strDate.includes("T")) {
              const datePart = strDate.split("T")[0];
              const [year, month, day] = datePart.split("-").map(Number);
              if (isNaN(year) || isNaN(month) || isNaN(day)) return "";
              return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
            }
            // Fallback - usar UTC para evitar problemas de timezone
            const date = new Date(strDate);
            if (isNaN(date.getTime())) return "";
            const day = date.getUTCDate();
            const month = date.getUTCMonth() + 1;
            const year = date.getUTCFullYear();
            return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
          } catch {
            return "";
          }
        };

        // ✅ CORREÇÃO: Valor em CENTAVOS → converter para REAIS como número puro
        const valorReais = (value) => {
          if (!value && value !== 0) return 0;
          const centavos = Number(value) || 0;
          return Math.round(centavos) / 100;  // Número puro: 1234.56
        };

        return {
          "Data de competência*": formatDate(request.dataCompetencia),
          "Data de vencimento*": formatDate(request.dataPagamento),
          "Data de pagamento": "",
          "Valor*": valorReais(request.valor),  // NÚMERO puro, não string formatada
          "Pago a (Fornecedor)": request.titular || "",
          "Descrição": request.referente || "",
          "Número do Documento": request.chavePix || "",
          "Categoria*": categoriaEncontrada?.nome || "",
          "Forma de Pagamento": request.formaDePagamento || "",
          "Quem Paga*": "Empresa",
          "Conta Bancária*": bancoEncontrado?.nome || "",
          "Centro de Custo*": "Obra",
          "Obra": obraEncontrada?.nome || "",
          "Índice Etapa / Item": "",
        };
      }).filter(item => item !== null);
      
      // ✅ CORREÇÃO DEFINITIVA: Construir worksheet manualmente célula por célula
      const headers = [
        "Data de competência*",
        "Data de vencimento*",
        "Data de pagamento",
        "Valor*",
        "Pago a (Fornecedor)",
        "Descrição",
        "Número do Documento",
        "Categoria*",
        "Forma de Pagamento",
        "Quem Paga*",
        "Conta Bancária*",
        "Centro de Custo*",
        "Obra",
        "Índice Etapa / Item",
      ];
      
      const keys = [
        "Data de competência*",
        "Data de vencimento*",
        "Data de pagamento",
        "Valor*",
        "Pago a (Fornecedor)",
        "Descrição",
        "Número do Documento",
        "Categoria*",
        "Forma de Pagamento",
        "Quem Paga*",
        "Conta Bancária*",
        "Centro de Custo*",
        "Obra",
        "Índice Etapa / Item",
      ];

      // Criar worksheet vazio
      const ws = {};
      const totalRows = dataToExport.length + 1; // +1 para header
      const totalCols = headers.length;
      
      // Definir range
      ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: totalRows - 1, c: totalCols - 1 } });
      
      // Escrever cabeçalhos (linha 0)
      headers.forEach((h, c) => {
        const cellRef = XLSX.utils.encode_cell({ r: 0, c });
        ws[cellRef] = { v: h, t: 's' };
      });
      
      // Função para converter data DD/MM/YYYY em serial number do Excel
      // Excel conta dias desde 01/01/1900 (com bug do leap year 1900)
      const dateToExcelSerial = (dateStr) => {
        if (!dateStr) return null;
        const parts = String(dateStr).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        if (!parts) return null;
        const [, day, month, year] = parts.map(Number);
        // Criar data UTC para evitar timezone
        const date = new Date(Date.UTC(year, month - 1, day));
        if (isNaN(date.getTime())) return null;
        // Epoch do Excel: 30/12/1899 (dia 0) — inclui bug do 29/02/1900
        const excelEpoch = new Date(Date.UTC(1899, 11, 30));
        const diffMs = date.getTime() - excelEpoch.getTime();
        const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000));
        return diffDays;
      };

      // Colunas que são datas (índices 0 e 1)
      const dateKeys = ["Data de competência*", "Data de vencimento*", "Data de pagamento"];

      // Escrever dados (linha 1 em diante)
      dataToExport.forEach((item, rowIdx) => {
        keys.forEach((key, colIdx) => {
          const cellRef = XLSX.utils.encode_cell({ r: rowIdx + 1, c: colIdx });
          const val = item[key];
          
          if (key === "Valor*") {
            // Valor como NÚMERO puro — Excel reconhece sem aspas
            const numVal = Number(val) || 0;
            ws[cellRef] = { v: numVal, t: 'n', z: '#,##0.00' };
          } else if (dateKeys.includes(key) && val) {
            // Data como número serial do Excel — sem aspas, formato DD/MM/YYYY
            const serial = dateToExcelSerial(val);
            if (serial) {
              ws[cellRef] = { v: serial, t: 'n', z: 'dd/mm/yyyy' };
            } else {
              ws[cellRef] = { v: String(val || ""), t: 's' };
            }
          } else {
            // Texto puro
            ws[cellRef] = { v: String(val || ""), t: 's' };
          }
        });
      });
      
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Planilha de Importação");
      
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
      
      // Fazer download - usar write com bookSST false para evitar quote prefix
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array', bookSST: false });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      
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
      await fetchRequests(true);
      
      // Registrar no histórico de exportações
      try {
        const usuario = localStorage.getItem("nome") || localStorage.getItem("usuario") || "Desconhecido";
        await fetch(`${API_URL}/historico/exportacoes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            usuario: usuario,
            formulario_ids: selectedRequests,
          }),
        });
        // Recarregar histórico
        await fetchHistorico();
      } catch (histError) {
        console.error("Erro ao salvar histórico:", histError);
        // Não bloqueia o fluxo principal
      }
      
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
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] px-6 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            {/* Resumo da seleção */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm">
                  {selecaoResumo.quantidade}
                </span>
                <span className="text-sm text-gray-600 font-medium">
                  {selecaoResumo.quantidade === 1 ? "lançamento selecionado" : "lançamentos selecionados"}
                </span>
              </div>
              <div className="h-8 w-px bg-gray-300" />
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Total:</span>
                <span className="text-xl font-bold text-green-700">
                  {(selecaoResumo.total / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>
              </div>
            </div>

            {/* Botão Gerar CSV */}
            <button
              onClick={handleGenerateCSV}
              className="flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-semibold py-3 px-8 rounded-xl shadow-lg hover:shadow-indigo-500/50 hover:scale-105 transition-all duration-300"
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
        </div>
      )}

      <div className="w-full">
        <div className="bg-white rounded-2xl shadow-xl p-6 lg:p-8 mb-6">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">
            Gerenciamento de Pagamentos
          </h1>
          <div className="flex gap-4 mt-10 flex-wrap items-start">
            <Link
              to="/dashboard/users"
              className="flex gap-x-2 bg-green-500 w-fit text-white p-3 rounded-xl shadow-lg shadow-gray-400 cursor-pointer"
            >
              <User />
              <p>Gerenciamento do Sistema</p>
            </Link>

            {/* Botão Histórico de Lançamentos */}
            <div className="relative" ref={historicoRef}>
              <button
                onClick={() => { setIsHistoricoOpen(!isHistoricoOpen); if (!isHistoricoOpen) fetchHistorico(); }}
                className={`flex gap-x-2 ${historicoFiltroAtivo ? 'bg-amber-500' : 'bg-indigo-600'} w-fit text-white p-3 rounded-xl shadow-lg shadow-gray-400 cursor-pointer hover:opacity-90 transition`}
              >
                <History className="w-5 h-5" />
                <p>Histórico Lançamento</p>
                <ChevronDown className={`w-5 h-5 transition-transform ${isHistoricoOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown do Histórico */}
              {isHistoricoOpen && (
                <div className="absolute top-full left-0 mt-2 w-[420px] bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-[400px] overflow-y-auto">
                  <div className="p-3 border-b bg-gray-50 rounded-t-xl">
                    <h3 className="font-bold text-gray-700 text-sm flex items-center gap-2">
                      <History className="w-4 h-4 text-indigo-600" />
                      Histórico de Exportações
                    </h3>
                  </div>

                  {/* Botão limpar filtro se ativo */}
                  {historicoFiltroAtivo && (
                    <div className="p-2 border-b bg-amber-50">
                      <button
                        onClick={handleLimparHistoricoFiltro}
                        className="w-full text-center text-sm font-semibold text-amber-700 hover:text-amber-900 py-1"
                      >
                        <RotateCcw className="w-4 h-4 inline mr-1" />
                        Limpar filtro ativo (#{historicoFiltroAtivo})
                      </button>
                    </div>
                  )}

                  {isLoadingHistorico ? (
                    <div className="p-6 text-center">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-500" />
                    </div>
                  ) : historicoExportacoes.length === 0 ? (
                    <div className="p-6 text-center text-gray-400 text-sm">
                      Nenhuma exportação registrada.
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {historicoExportacoes.map((exp) => (
                        <button
                          key={exp.id}
                          onClick={() => handleSelecionarHistorico(exp)}
                          className={`w-full text-left p-3 hover:bg-indigo-50 transition flex items-center justify-between gap-3 ${
                            historicoFiltroAtivo === exp.id ? 'bg-amber-100 border-l-4 border-l-amber-500' : ''
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                              <Hash className="w-3.5 h-3.5 text-gray-400" />
                              Exportação #{exp.id}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {exp.data_geracao}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {exp.usuario}
                              </span>
                            </div>
                          </div>
                          <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap">
                            {exp.quantidade} lanç.
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
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

            {/* Obra - Autocomplete */}
            <div className="flex flex-col gap-1 relative" ref={obraFilterRef}>
              <label className="text-xs font-semibold text-gray-500 uppercase">
                Obra
              </label>
              <input
                type="text"
                placeholder="Buscar obra..."
                value={obraFilterText}
                onChange={(e) => {
                  setObraFilterText(e.target.value);
                  setIsObraDropdownOpen(true);
                  // Se apagar o texto, limpa o filtro
                  if (!e.target.value.trim()) {
                    setFilters((prev) => ({ ...prev, obra: "" }));
                  }
                }}
                onFocus={() => setIsObraDropdownOpen(true)}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
              />
              {filters.obra && (
                <button
                  onClick={() => {
                    setFilters((prev) => ({ ...prev, obra: "" }));
                    setObraFilterText("");
                    setIsObraDropdownOpen(false);
                  }}
                  className="absolute right-2 top-[28px] text-gray-400 hover:text-red-500 text-xs"
                  title="Limpar obra"
                >✕</button>
              )}
              {isObraDropdownOpen && (
                <ul className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {obrasFiltradasOrdenadas.length === 0 ? (
                    <li className="px-3 py-2 text-sm text-gray-400 italic">Nenhuma obra encontrada</li>
                  ) : (
                    obrasFiltradasOrdenadas.map((opt) => (
                      <li
                        key={opt.id}
                        onClick={() => {
                          setFilters((prev) => ({ ...prev, obra: String(opt.id) }));
                          setObraFilterText(opt.nome);
                          setIsObraDropdownOpen(false);
                        }}
                        className={`px-3 py-2 text-sm cursor-pointer hover:bg-indigo-50 ${
                          String(filters.obra) === String(opt.id) ? "bg-indigo-100 font-semibold" : ""
                        }`}
                      >
                        {opt.nome}
                      </li>
                    ))
                  )}
                </ul>
              )}
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

            {/* Titular - Autocomplete */}
            <div className="flex flex-col gap-1 relative" ref={titularFilterRef}>
              <label className="text-xs font-semibold text-gray-500 uppercase">
                Titular
              </label>
              <input
                type="text"
                placeholder="Buscar titular..."
                value={titularFilterText}
                onChange={(e) => {
                  setTitularFilterText(e.target.value);
                  setIsTitularDropdownOpen(true);
                  if (!e.target.value.trim()) {
                    setFilters((prev) => ({ ...prev, titular: "" }));
                  }
                }}
                onFocus={() => setIsTitularDropdownOpen(true)}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
              />
              {filters.titular && (
                <button
                  onClick={() => {
                    setFilters((prev) => ({ ...prev, titular: "" }));
                    setTitularFilterText("");
                    setIsTitularDropdownOpen(false);
                  }}
                  className="absolute right-2 top-[28px] text-gray-400 hover:text-red-500 text-xs"
                  title="Limpar titular"
                >✕</button>
              )}
              {isTitularDropdownOpen && (
                <ul className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {titularesFiltradosOrdenados.length === 0 ? (
                    <li className="px-3 py-2 text-sm text-gray-400 italic">Nenhum titular encontrado</li>
                  ) : (
                    titularesFiltradosOrdenados.map((nome, idx) => (
                      <li
                        key={idx}
                        onClick={() => {
                          setFilters((prev) => ({ ...prev, titular: nome }));
                          setTitularFilterText(nome);
                          setIsTitularDropdownOpen(false);
                        }}
                        className={`px-3 py-2 text-sm cursor-pointer hover:bg-indigo-50 ${
                          filters.titular === nome ? "bg-indigo-100 font-semibold" : ""
                        }`}
                      >
                        {nome}
                      </li>
                    ))
                  )}
                </ul>
              )}
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
            handleEditObraRelacionada={handleEditObraRelacionada} // ✅ NOVO
            handleToggleLancamento={handleToggleLancamento}

            // Props de Autocomplete
            titularSuggestions={titularSuggestions}
            isLoadingSuggestions={isLoadingSuggestions}
            showTitularSuggestions={showTitularSuggestions}
            selectedSuggestionIndex={selectedSuggestionIndex}
            isTitularLocked={isTitularLocked}
            handleSelectTitular={handleSelectTitular}
            handleKeyDown={handleKeyDown}
            handleTitularFocus={handleTitularFocus}
            handleUnlockTitular={handleUnlockTitular}
            autocompleteDropdownRef={autocompleteDropdownRef}
          />
        )}

        {/* Espaçador para não sobrepor a barra fixa do totalizador */}
        {selectedRequests.length > 0 && <div className="h-20" />}
      </div>
    </div>
  );
};

export default Dashboard;
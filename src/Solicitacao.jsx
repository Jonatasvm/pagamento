import React, { useState, useRef, useEffect, useMemo } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  User,
  Building,
  Tag,
  Paperclip,
  DollarSign,
  Key,
  Calendar,
  CreditCard,
  Send,
  Loader2,
  X,
  ChevronDown,
  List,
  AlertCircle,
} from "lucide-react";

// --- CONFIGURACAO ---
const API_URL = "http://91.98.132.210:5631";

// --- UTILITARIOS (Helpers) ---

const cleanDigits = (value) => value.replace(/\D/g, "");

const formatCurrency = (value) => {
  const digits = cleanDigits(value).substring(0, 15);
  if (!digits) return "";
  const cents = digits.slice(-2).padStart(2, "0");
  const reais = digits.slice(0, -2) || "0";
  return `R$ ${parseInt(reais, 10).toLocaleString("pt-BR")},${cents}`;
};

const parseCurrencyToFloat = (value) => {
  if (!value) return 0;
  return parseFloat(value.replace(/[R$\s.]/g, "").replace(",", "."));
};

const formatCpfCnpj = (value) => {
  const clean = cleanDigits(value).substring(0, 14);
  if (clean.length <= 11) {
    return clean
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d{1,2})/, "$1.$2.$3-$4");
  }
  return clean
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3/$4")
    .replace(/(\d{4})(\d)/, "$1-$2");
};

// ✅ MÁSCARA PARA PIX - Aplica máscara de acordo com o tipo
const formatPixKey = (value, keyType) => {
  const clean = cleanDigits(value);
  
  if (keyType === "CPF") {
    // CPF: xxx.xxx.xxx-xx
    return clean
      .substring(0, 11)
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d{1,2})/, "$1.$2.$3-$4");
  }
  
  if (keyType === "CNPJ") {
    // CNPJ: xx.xxx.xxx/xxxx-xx
    return clean
      .substring(0, 14)
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3/$4")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }
  
  if (keyType === "Telefone") {
    // Telefone: (xx) xxxxx-xxxx ou (xx) xxxxxx-xxx conforme requisitado
    return clean
      .substring(0, 11)
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2");
  }
  
  // E-mail e Chave Aleatoria não recebem máscara
  return value;
};

const addMonths = (dateStr, months) => {
  // Faz parsing da string de data (formato YYYY-MM-DD)
  const [year, month, day] = dateStr.split("-").map(Number);
  
  // Cria a data usando a data local (não UTC)
  const d = new Date(year, month - 1, day);
  const originalDay = d.getDate();
  
  // Adiciona os meses
  d.setMonth(d.getMonth() + months);
  
  // Se o dia mudou (ex: 31 jan -> 28 fev), volta para o último dia do mês
  if (d.getDate() !== originalDay) {
    d.setDate(0);
  }
  
  // Retorna a data no formato YYYY-MM-DD sem problemas de timezone
  const year2 = d.getFullYear();
  const month2 = String(d.getMonth() + 1).padStart(2, "0");
  const day2 = String(d.getDate()).padStart(2, "0");
  return `${year2}-${month2}-${day2}`;
};

// Calculo de Parcelas
const calculateInstallments = (totalValueStr, count, startDateStr) => {
  const totalCents = parseInt(cleanDigits(totalValueStr), 10);
  if (!totalCents || count < 1 || !startDateStr) return [];

  const installmentCents = Math.floor(totalCents / count);
  const remainderCents = totalCents % count;
  const results = [];

  for (let i = 0; i < count; i++) {
    let currentCents = installmentCents;
    if (i === 0) currentCents += remainderCents; // Resto vai na 1a parcela

    const valStr = currentCents.toString().padStart(3, "0");
    results.push({
      number: i + 1,
      value: formatCurrency(valStr),
      date: addMonths(startDateStr, i),
    });
  }
  return results;
};

// --- CONSTANTES ESTATICAS ---
const PIX_KEY_TYPES = ["CPF", "CNPJ", "E-mail", "Telefone", "Chave Aleatoria"];
const PIX_LIMITS = {
  CPF: { len: 11, type: "numeric" },
  CNPJ: { len: 14, type: "numeric" },
  Telefone: { len: 14, type: "numeric" },
  "E-mail": { len: 100, type: "text" },
  "Chave Aleatoria": { len: 36, type: "text" },
};
const INSTALLMENT_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);

// --- COMPONENTE PRINCIPAL ---
const TelaSolicitacao = () => {
  const fileInputRef = useRef(null);
  const autocompleteDropdownRef = useRef(null);
  // Estado do Formulario
  const [formData, setFormData] = useState({
    obra: "",
    referente: "",
    valor: "",
    paymentMethod: "Pix",
    pixKeyType: "CPF",
    pixKey: "",
    titular: "",
    cpfCnpj: "",
    dataVencimento: "",
    installmentsCount: 1,
    anexos: [], // Multiplos arquivos
    observacao: "", // ? NOVO: Campo de observacao
    conta: "", // ? NOVO: Campo de banco (conta bancaria)
  });

  // Estados de Controle
  const [obras, setObras] = useState([]);
  const [isLoadingObras, setIsLoadingObras] = useState(true);
  const [bancos, setBancos] = useState([]); // ? NOVO: Lista de bancos
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [schedule, setSchedule] = useState([]); // Parcelas calculadas
  const [customInstallments, setCustomInstallments] = useState(""); // ✅ NOVO: Parcelas personalizadas
  const [isCustomInstallments, setIsCustomInstallments] = useState(false); // ✅ NOVO: Flag para modo personalizado
  const [multipleWorks, setMultipleWorks] = useState(false); // ✅ NOVO: Flag para múltiplas obras
  const [selectedWorks, setSelectedWorks] = useState([]); // ✅ NOVO: Obras selecionadas com valores

  // Estados para Autocomplete de Titular
  const [titularSuggestions, setTitularSuggestions] = useState([]);
  const [isCpfCnpjLocked, setIsCpfCnpjLocked] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [titularJustSelected, setTitularJustSelected] = useState(false);

  // Estados para Autocomplete de Obra
  const [obraBusca, setObraBusca] = useState("");
  const [showObraDropdown, setShowObraDropdown] = useState(false);
  const obraDropdownRef = useRef(null);

  // 1. Buscar Obras (Com Filtro de Usuario)
  useEffect(() => {
    const fetchObras = async () => {
      try {
        const userId = localStorage.getItem("user_id");
        if (!userId) {
          toast.error("Sessao invalida. Faca login novamente.");
          return;
        }
        const response = await fetch(`${API_URL}/obras?user_id=${userId}`);
        if (!response.ok) throw new Error("Erro ao buscar obras");

        const data = await response.json();
        setObras(data);
      } catch (error) {
        console.error(error);
        toast.error("Erro ao carregar obras.");
      } finally {
        setIsLoadingObras(false);
      }
    };
    fetchObras();

    // ? NOVO: Buscar lista de bancos
    const fetchBancos = async () => {
      try {
        const response = await fetch(`${API_URL}/bancos`);
        if (!response.ok) throw new Error("Erro ao buscar bancos");
        const data = await response.json();
        setBancos(data);
      } catch (error) {
        console.error("Erro ao carregar bancos:", error);
      }
    };
    fetchBancos();
  }, []);

  // ? Sincronizar banco quando obra mudar (usando banco_id da obra)
  useEffect(() => {
    if (formData.obra) {
      const obraEncontrada = obras.find((o) => o.id === Number(formData.obra));
      if (obraEncontrada) {
        
        // Usa o banco_id diretamente da obra
        if (obraEncontrada.banco_id) {
          setFormData((prev) => ({
            ...prev,
            conta: String(obraEncontrada.banco_id),
          }));
        } else {
          setFormData((prev) => ({
            ...prev,
            conta: "",
          }));
        }
      }
    }
  }, [formData.obra, obras]);
  // 2. Recalcular Parcelas Automaticamente
  useEffect(() => {
    if (
      formData.installmentsCount > 1 &&
      formData.valor &&
      formData.dataVencimento
    ) {
      const newSchedule = calculateInstallments(
        formData.valor,
        formData.installmentsCount,
        formData.dataVencimento
      );

      // So atualiza se houver mudanca real para evitar loop
      if (JSON.stringify(newSchedule) !== JSON.stringify(schedule)) {
        setSchedule(newSchedule);
      }
    } else {
      setSchedule([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.valor, formData.installmentsCount, formData.dataVencimento]);

  // ✅ NOVO: Distribuir valores automaticamente entre obras quando o número de obras mudar
  useEffect(() => {
    if (multipleWorks && selectedWorks.length > 0 && formData.valor) {
      const valorTotal = parseCurrencyToFloat(formData.valor);
      const numObras = selectedWorks.length + 1; // +1 da obra principal
      const valorPorObra = valorTotal / numObras;
      const valorFormatado = formatCurrency((valorPorObra * 100).toFixed(0));
      
      // Atualizar valores de todas as obras adicionais
      setSelectedWorks(prev => 
        prev.map(w => ({ ...w, valor: valorFormatado }))
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWorks.length, multipleWorks]);

  // 3. Buscar Titulares para Autocomplete
  useEffect(() => {
    // Se acabou de selecionar um titular, nao buscar novamente
    if (titularJustSelected) {
      return;
    }

    const fetchTitulares = async () => {
      if (!formData.titular.trim()) {
        setTitularSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setIsLoadingSuggestions(true);
      try {
        const response = await fetch(
          `${API_URL}/formulario/titulares/search?q=${encodeURIComponent(
            formData.titular
          )}`
        );
        if (!response.ok) throw new Error("Erro ao buscar titulares");

        const data = await response.json();
        setTitularSuggestions(data);
        setShowSuggestions(true);
        setSelectedSuggestionIndex(-1);
      } catch (error) {
        console.error("Erro ao buscar titulares:", error);
        setTitularSuggestions([]);
      } finally {
        setIsLoadingSuggestions(false);
      }
    };

    // Debounce de 300ms para evitar muitas requisicoes
    const debounceTimer = setTimeout(fetchTitulares, 300);
    return () => clearTimeout(debounceTimer);
  }, [formData.titular, titularJustSelected]);

  // --- HANDLERS ---

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;

    // Mascaras especificas
    if (name === "valor") newValue = formatCurrency(value);
    if (name === "cpfCnpj") newValue = formatCpfCnpj(value);
    if (name === "pixKey") {
      // ✅ APLICAR MÁSCARA DE ACORDO COM TIPO DE CHAVE PIX
      const limit = PIX_LIMITS[formData.pixKeyType];
      if (limit.type === "numeric")
        newValue = cleanDigits(value).substring(0, limit.len);
      else newValue = value.substring(0, limit.len);
      
      // Aplicar máscara apropriada
      newValue = formatPixKey(newValue, formData.pixKeyType);
    }

    // Logica especifica de troca de tipo de pagamento ou chave
    if (name === "paymentMethod") {
      setFormData((prev) => ({
        ...prev,
        [name]: newValue,
        pixKey: "",
        pixKeyType: "CPF",
      }));
      return;
    }
    if (name === "pixKeyType") {
      setFormData((prev) => ({ ...prev, [name]: newValue, pixKey: "" }));
      return;
    }

    // Se for o campo titular, limpar o CNPJ ao digitar
    if (name === "titular") {
      setFormData((prev) => ({ ...prev, [name]: newValue }));
      setIsCpfCnpjLocked(false); // Desbloqueia ao digitar
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: newValue }));
  };

  // Handler para selecionar um titular da lista de sugestoes
  const handleSelectTitular = (suggestion) => {
    setTitularJustSelected(true); // Marca que acabou de selecionar
    setFormData((prev) => ({
      ...prev,
      titular: suggestion.titular,
      cpfCnpj: formatCpfCnpj(suggestion.cpf_cnpj),
    }));
    setIsCpfCnpjLocked(true); // Bloqueia apos selecao
    setShowSuggestions(false);
    setTitularSuggestions([]);
  };

  // ✅ FUNÇÃO PARA SALVAR FORNECEDOR AUTOMATICAMENTE
  const salvarFornecedorSeNaoExistir = async () => {
    if (!formData.titular || !formData.cpfCnpj) {
      return; // Se não tem titular ou CPF/CNPJ, não salva
    }

    // Se o usuário selecionou um fornecedor do autocomplete, não salva (porque já existe)
    if (isCpfCnpjLocked) {
      return;
    }

    const cpfCnpjLimpo = cleanDigits(formData.cpfCnpj);

    try {
      // Primeiro, verifica se o fornecedor já existe pelo CPF/CNPJ
      const searchResponse = await fetch(
        `${API_URL}/formulario/titulares/search?q=${encodeURIComponent(formData.titular)}`
      );
      
      if (searchResponse.ok) {
        const fornecedoresExistentes = await searchResponse.json();
        
        // Verifica se já existe um fornecedor com o mesmo CPF/CNPJ
        const jaExiste = fornecedoresExistentes.some(
          (f) => cleanDigits(f.cpf_cnpj) === cpfCnpjLimpo
        );
        
        if (jaExiste) {
          console.log("ℹ️ Fornecedor já existe no banco");
          return; // Fornecedor já existe, não precisa criar
        }
      }

      // Se não existe, cria o fornecedor
      const createResponse = await fetch(`${API_URL}/fornecedor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titular: formData.titular.trim(),
          cpf_cnpj: cpfCnpjLimpo,
          chave_pix: formData.pixKey || "",
          banco_padrao: formData.conta ? Number(formData.conta) : null,
        }),
      });

      const responseData = await createResponse.json();

      if (createResponse.ok) {
        console.log("✅ Fornecedor criado com sucesso:", responseData);
      } else if (createResponse.status === 409) {
        // CPF/CNPJ já cadastrado
        console.log("ℹ️ Fornecedor já existe no banco (duplicado):", responseData);
      } else {
        console.error("❌ Erro ao salvar fornecedor:", createResponse.status, responseData);
      }
    } catch (error) {
      console.error("❌ Erro ao conectar ao servidor de fornecedor:", error);
      // Não bloqueia o envio do formulário se houver erro ao salvar fornecedor
    }
  };

  // Handler para navegacao com teclado nas sugestoes
  const handleKeyDown = (e) => {
    if (!showSuggestions || titularSuggestions.length === 0) return;

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
        setShowSuggestions(false);
        break;
      default:
        break;
    }
  };

  // Fechar sugestoes ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        autocompleteDropdownRef.current &&
        !autocompleteDropdownRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
      // Fechar dropdown de obra
      if (
        obraDropdownRef.current &&
        !obraDropdownRef.current.contains(event.target)
      ) {
        setShowObraDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handler para selecionar obra do autocomplete
  const handleSelectObra = (obra) => {
    setFormData((prev) => ({ ...prev, obra: String(obra.id) }));
    setObraBusca(obra.nome);
    setShowObraDropdown(false);
  };

  // Filtrar obras baseado na busca
  const obrasFiltradas = obras.filter((obra) =>
    obra.nome.toLowerCase().includes(obraBusca.toLowerCase())
  );

  const handleFileChange = (e) => {
    if (e.target.files) {
      // Adiciona os novos arquivos a lista existente
      const newFiles = Array.from(e.target.files);
      setFormData((prev) => ({
        ...prev,
        anexos: [...prev.anexos, ...newFiles],
      }));
    }
  };

  const removeFile = (index) => {
    setFormData((prev) => ({
      ...prev,
      anexos: prev.anexos.filter((_, i) => i !== index),
    }));
    // Limpa o input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Edicao manual das parcelas (Tabela)
  const handleScheduleEdit = (index, field, value) => {
    const newSchedule = [...schedule];
    let finalValue = value;

    if (field === "value") finalValue = formatCurrency(value);

    newSchedule[index] = { ...newSchedule[index], [field]: finalValue };
    setSchedule(newSchedule);
  };

  // ENVIO DO FORMULARIO
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // ✅ SALVAR FORNECEDOR AUTOMATICAMENTE ANTES DE ENVIAR
    await salvarFornecedorSeNaoExistir();

    // ? AJUSTE 1: VALIDACAO DO ANEXO OBRIGATORIO (CORRIGIDO)
    const isPaymentMethodRequiringFile = 
      formData.paymentMethod === "Cheque" || 
      formData.paymentMethod === "Boleto";    if (isPaymentMethodRequiringFile && formData.anexos.length === 0) {
      toast.error("Voce precisa enviar pelo menos um arquivo para Cheque e Boleto.", { 
          duration: 4000 
      });
      setIsSubmitting(false); // Reseta o botao de envio
      return; //  Impede a submissao
    }
    // ----------------------------------------------------

    // Validacao Basica
    const required = [
      "obra",
      "referente",
      "valor",
      "titular",
      "cpfCnpj",
      "dataVencimento",
    ];
    if (formData.paymentMethod === "Pix") required.push("pixKey");

    const hasEmptyFields = required.some((field) => !formData[field]);
    if (hasEmptyFields) {
      toast.error("Preencha todos os campos obrigatorios.");
      setIsSubmitting(false);
      return;
    }

    // Validacao Soma Parcelas
    if (formData.installmentsCount > 1) {
      const total = parseCurrencyToFloat(formData.valor);
      const sumInstallments = schedule.reduce(
        (acc, item) => acc + parseCurrencyToFloat(item.value),
        0
      );

      // Margem de erro de 1 centavo para arredondamento JS
      if (Math.abs(total - sumInstallments) > 0.01) {
        toast.error("A soma das parcelas difere do valor total.");
        setIsSubmitting(false);
        return;
      }
    }

    const usuarioLogado = localStorage.getItem("usuario") || "Usuario";
    const hoje = new Date().toISOString().split("T")[0];    try {
      const requests = [];
      const basePayload = {
        data_lancamento: hoje,
        solicitante: usuarioLogado,
        titular: formData.titular,
        obra: formData.obra,
        forma_pagamento: formData.paymentMethod, // Usando o estado atual
        lancado: "N",
        cpf_cnpj: cleanDigits(formData.cpfCnpj), // Enviar sem formatacao
        chave_pix: formData.pixKey || "",
        observacao: formData.observacao || "", // ? NOVO: Usar observacao do formulario
        conta: formData.conta ? Number(formData.conta) : null, // ? NOVO: Enviar o banco (conta)
        multiplos_lancamentos: multipleWorks ? 1 : 0, // ✅ NOVO: Flag para múltiplas obras
        obras_adicionais: multipleWorks ? selectedWorks : [], // ✅ NOVO: Obras adicionais com valores
        // O anexo sera tratado separadamente ou via outro campo/API, aqui e so o dado
      };

      if (formData.installmentsCount > 1) {
        // Multiplas requisicoes
        schedule.forEach((parcela) => {
          requests.push(
            fetch(`${API_URL}/formulario`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...basePayload,
                referente: `${formData.referente} (${parcela.number}/${formData.installmentsCount})`,
                valor: parseCurrencyToFloat(parcela.value),
                data_pagamento: parcela.date,
                data_competencia: parcela.date,
              }),
            })
          );
        });
      } else {
        // Requisicao Unica
        requests.push(
          fetch(`${API_URL}/formulario`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...basePayload,
              referente: formData.referente,
              valor: parseCurrencyToFloat(formData.valor),
              data_pagamento: formData.dataVencimento,
              data_competencia: formData.dataVencimento,
            }),
            })
        );
      }

      const responses = await Promise.all(requests);
      const responseData = await Promise.all(
        responses.map(async (r) => {
          if (!r.ok) throw new Error("Falha em um dos envios");
          return r.json();
        })
      );

      // Se houver anexos, fazer upload para TODOS os formulários criados
      if (formData.anexos.length > 0 && responseData.length > 0) {
        // Faz upload para cada formulário/parcela criado
        const uploadPromises = responseData.map((formResponse) => {
          const formId = formResponse?.id;
          if (!formId) return Promise.resolve();

          const formDataUpload = new FormData();
          formData.anexos.forEach((file) => {
            formDataUpload.append("files", file);
          });

          return fetch(
            `${API_URL}/formulario/${formId}/upload-anexos`,
            {
              method: "POST",
              body: formDataUpload,
            }
          ).then((response) => {
            if (!response.ok) {
              console.warn(`Aviso: Falha ao fazer upload dos arquivos para o formulário ${formId}`);
            }
            return response.json();
          }).catch((error) => {
            console.warn(`Erro ao fazer upload para formulário ${formId}:`, error);
          });
        });

        try {
          await Promise.all(uploadPromises);
        } catch (error) {
          console.warn("Aviso: Alguns anexos não foram enviados, mas os formulários foram criados");
        }
      }

      toast.success("Solicitacao enviada com sucesso!");

      // Reset Form
      setFormData({
        obra: "",
        referente: "",
        valor: "",
        paymentMethod: "Pix",
        pixKeyType: "CPF",
        pixKey: "",
        titular: "",
        cpfCnpj: "",
        dataVencimento: "",
        installmentsCount: 1,
        anexos: [],
        observacao: "", // ? NOVO: Reset observacao
      });
      setSchedule([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error(error);
      toast.error("Erro ao conectar com o servidor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- RENDERIZADORES AUXILIARES ---
  const inputClass =
    "mt-1 block w-full border border-gray-300 rounded-lg py-2.5 px-4 shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-800 transition";
  const labelClass =
    "flex items-center text-sm font-semibold text-gray-700 mb-1.5";

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center py-2 px-2 sm:px-2 lg:px-2 font-sans">
      <Toaster position="top-right" />

      <div className="max-w-4xl w-full bg-white shadow-2xl rounded-xl border border-gray-100 p-4 md:p-10">
        {/* HEADER */}
        <div className="border-b-4 border-blue-500/50 pb-4 mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900 flex items-center">
            <DollarSign className="w-8 h-8 mr-3 text-blue-600" />
            Solicitacao de Pagamento
          </h2>
          <p className="text-gray-500 mt-1 text-sm">
            Preencha os dados da despesa para aprovacao.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* BLOCO 1: OBRA E DESCRICAO */}
          <div className="grid grid-cols-1 gap-6">
            <div ref={obraDropdownRef} className="relative">
              <label htmlFor="obra" className={labelClass}>
                <Building className="w-4 h-4 mr-2 text-blue-600" /> Obra{" "}
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={obraBusca}
                  onChange={(e) => {
                    setObraBusca(e.target.value);
                    setShowObraDropdown(true);
                    // Limpa a selecao se o usuario digitar algo diferente
                    if (formData.obra) {
                      const obraSelecionada = obras.find(o => o.id === Number(formData.obra));
                      if (obraSelecionada && e.target.value !== obraSelecionada.nome) {
                        setFormData(prev => ({ ...prev, obra: "" }));
                      }
                    }
                  }}
                  onFocus={() => setShowObraDropdown(true)}
                  placeholder={isLoadingObras ? "Carregando..." : "Digite para buscar a obra..."}
                  disabled={isLoadingObras}
                  className={`${inputClass} bg-white`}
                  autoComplete="off"
                />
                <ChevronDown 
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 cursor-pointer" 
                  onClick={() => setShowObraDropdown(!showObraDropdown)}
                />
              </div>
              
              {/* Dropdown de Obras */}
              {showObraDropdown && !isLoadingObras && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {obrasFiltradas.length > 0 ? (
                    <ul className="divide-y divide-gray-200">
                      {obrasFiltradas.map((obra) => (
                        <li
                          key={obra.id}
                          onClick={() => handleSelectObra(obra)}
                          className={`px-4 py-3 cursor-pointer transition hover:bg-blue-50 ${
                            formData.obra === String(obra.id) ? "bg-blue-100 text-blue-900" : "text-gray-800"
                          }`}
                        >
                          <div className="font-medium text-sm">{obra.nome}</div>
                          {obra.quem_paga && (
                            <div className="text-xs text-gray-500 mt-1">{obra.quem_paga}</div>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="px-4 py-3 text-center text-gray-500 text-sm">
                      Nenhuma obra encontrada
                    </div>
                  )}
                </div>
              )}
              
              {!isLoadingObras && obras.length === 0 && (
                <p className="text-sm text-red-500 mt-1 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" /> Nenhuma obra
                  encontrada para seu usuario.
                </p>
              )}

              {/* ✅ NOVO: Checkbox para Múltiplas Obras */}
              {formData.obra && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <label className="flex items-center cursor-pointer gap-3">
                    <input
                      type="checkbox"
                      checked={multipleWorks}
                      onChange={(e) => {
                        setMultipleWorks(e.target.checked);
                        if (!e.target.checked) {
                          setSelectedWorks([]); // Limpa obras selecionadas se desabilitar
                        } else {
                          // Quando habilita múltiplas obras, pré-preenche o valor da obra principal
                          // com o valor total (se houver)
                          if (!formData.valor) {
                            toast.error("Por favor, informe o valor total primeiro", { duration: 3000 });
                            return;
                          }
                        }
                      }}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Este lançamento é para múltiplas obras?
                    </span>
                  </label>
                  <p className="text-xs text-gray-600 mt-2 ml-8">
                    Selecione se o valor será dividido entre duas ou mais obras
                  </p>
                </div>
              )}

              {/* ✅ NOVO: Seletor de Obras Adicionais */}
              {multipleWorks && formData.obra && (
                <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <h4 className="text-sm font-semibold text-gray-800 mb-3">
                    Distribuir valor entre as obras:
                  </h4>
                  <p className="text-xs text-gray-600 mb-3">
                    Edite os valores livremente para distribuir entre as obras
                  </p>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {obras.map((obra) => {
                      const obraAtual = Number(formData.obra) === obra.id;
                      const isSelected = selectedWorks.find(w => w.obra_id === obra.id);
                      const valor = isSelected ? isSelected.valor : "";
                      
                      return (
                        <div key={obra.id} className="flex items-center gap-3 p-2 bg-white rounded border border-gray-200">
                          <input
                            type="checkbox"
                            checked={obraAtual || !!isSelected}
                            disabled={obraAtual}
                            onChange={(e) => {
                              if (e.target.checked) {
                                // Quando marca uma nova obra, divide o valor total entre todas as obras
                                setSelectedWorks([...selectedWorks, { 
                                  obra_id: obra.id, 
                                  valor: "" 
                                }]);
                              } else {
                                setSelectedWorks(selectedWorks.filter(w => w.obra_id !== obra.id));
                              }
                            }}
                            className="w-4 h-4 text-purple-600 border-gray-300 rounded"
                          />
                          <span className="text-sm font-medium text-gray-700 flex-1">
                            {obra.nome} {obraAtual && "(Obra Principal)"}
                          </span>
                          {(obraAtual || isSelected) && (
                            <input
                              type="text"
                              value={obraAtual ? (() => {
                                // Calcular o valor sugerido para a obra principal
                                if (selectedWorks.length > 0) {
                                  const valorTotal = parseCurrencyToFloat(formData.valor);
                                  const numObras = selectedWorks.length + 1;
                                  const valorPorObra = valorTotal / numObras;
                                  return formatCurrency((valorPorObra * 100).toFixed(0));
                                }
                                return formData.valor;
                              })() : valor}
                              onChange={(e) => {
                                const newValue = formatCurrency(e.target.value);
                                if (obraAtual) {
                                  // Não permite editar a obra principal quando há múltiplas obras
                                  // O valor da obra principal é calculado automaticamente
                                  return;
                                } else {
                                  // Se for obra adicional, atualiza selectedWorks
                                  setSelectedWorks(
                                    selectedWorks.map(w =>
                                      w.obra_id === obra.id ? { ...w, valor: newValue } : w
                                    )
                                  );
                                }
                              }}
                              placeholder="R$ 0,00"
                              className={`w-40 text-sm border border-gray-300 rounded px-3 py-1.5 font-semibold focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                                obraAtual && selectedWorks.length > 0 ? 'bg-gray-100 cursor-not-allowed' : ''
                              }`}
                              inputMode="numeric"
                              disabled={obraAtual && selectedWorks.length > 0}
                              title={obraAtual && selectedWorks.length > 0 ? "Valor calculado automaticamente" : ""}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Mostrar soma total dos valores */}
                  {selectedWorks.length > 0 && (
                    <div className="mt-4 p-3 bg-white rounded border-2 border-purple-300">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-gray-700">
                          Valor Total (fixo):
                        </span>
                        <span className="text-lg font-bold text-green-700">
                          {formData.valor}
                        </span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <div className="text-xs text-gray-600 space-y-1">
                          <div className="flex justify-between">
                            <span>Obra Principal:</span>
                            <span className="font-semibold">
                              {(() => {
                                const valorTotal = parseCurrencyToFloat(formData.valor);
                                const numObras = selectedWorks.length + 1;
                                const valorPorObra = valorTotal / numObras;
                                return formatCurrency((valorPorObra * 100).toFixed(0));
                              })()}
                            </span>
                          </div>
                          {selectedWorks.map((w, idx) => {
                            const obraInfo = obras.find(o => o.id === w.obra_id);
                            return (
                              <div key={idx} className="flex justify-between">
                                <span>{obraInfo?.nome || `Obra ${idx + 2}`}:</span>
                                <span className="font-semibold">{w.valor || "R$ 0,00"}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        💡 O valor total permanece fixo e é dividido entre as obras
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="referente" className={labelClass}>
                  <Tag className="w-4 h-4 mr-2 text-blue-600" /> Referente
                  (Detalhes) <span className="text-red-500 ml-1">*</span>
                </label>
                <textarea
                  name="referente"
                  rows="3"
                  value={formData.referente}
                  onChange={handleChange}
                  placeholder="Ex: Compra de cimento..."
                  className={`${inputClass} resize-none`}
                />
              </div>
              <div>
                <label htmlFor="valor" className={labelClass}>
                  <DollarSign className="w-4 h-4 mr-2 text-blue-600" /> Valor
                  Total <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  name="valor"
                  value={formData.valor}
                  onChange={handleChange}
                  placeholder="R$ 0,00"
                  inputMode="numeric"
                  className={`${inputClass} text-lg font-medium text-gray-900`}
                />
              </div>
            </div>
          </div>

          {/* BLOCO 2: PAGAMENTO */}
          <div className="border-t pt-6">
            <label className={labelClass}>
              <CreditCard className="w-4 h-4 mr-2 text-blue-600" /> Forma de
              Pagamento
            </label>
            <div className="flex flex-wrap gap-3 mt-2">
              {["Pix", "Boleto", "Cheque"].map((method) => (
                <label
                  key={method}
                  className={`cursor-pointer px-4 py-2 rounded-full border text-sm font-medium transition ${
                    formData.paymentMethod === method
                      ? "bg-blue-600 text-white border-blue-600 shadow-md"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method}
                    checked={formData.paymentMethod === method}
                    onChange={handleChange}
                    className="hidden"
                  />
                  {method}
                </label>
              ))}
            </div>
          </div>

          {/* BLOCO 3: DETALHES ESPECIFICOS (PIX e PARCELAS) */}
          <div className="bg-gray-50 rounded-xl p-2 border border-gray-200 space-y-6">
            {/* LINHA 1: PIX (Se selecionado) */}
            {formData.paymentMethod === "Pix" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fadeIn">
                <div className="md:col-span-1">
                  <label className={labelClass}>Tipo Chave</label>
                  <div className="relative">
                    <select
                      name="pixKeyType"
                      value={formData.pixKeyType}
                      onChange={handleChange}
                      className={`${inputClass} appearance-none`}
                    >
                      {PIX_KEY_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>
                    Chave PIX <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="pixKey"
                      value={formData.pixKey}
                      onChange={handleChange}
                      placeholder="Chave do recebedor"
                      className={`${inputClass} pl-10`}
                    />
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </div>
            )}

            {/* LINHA 2: VENCIMENTO E PARCELAS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>
                  <Calendar className="w-4 h-4 mr-2 text-blue-600" /> Data 1o
                  Vencimento <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="date"
                  name="dataVencimento"
                  value={formData.dataVencimento}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>
                  <List className="w-4 h-4 mr-2 text-blue-600" /> Parcelamento
                </label>
                <div className="relative">
                  <select
                    name="installmentsCount"
                    value={isCustomInstallments ? "custom" : formData.installmentsCount}
                    onChange={(e) => {
                      if (e.target.value === "custom") {
                        setIsCustomInstallments(true);
                        setCustomInstallments("");
                      } else {
                        setIsCustomInstallments(false);
                        handleChange({ target: { name: "installmentsCount", value: e.target.value } });
                      }
                    }}
                    className={`${inputClass} appearance-none`}
                  >
                    {INSTALLMENT_OPTIONS.map((i) => (
                      <option key={i} value={i}>
                        {i}x {i > 1 ? "(Parcelado)" : "(A vista)"}
                      </option>
                    ))}
                    <option value="custom">Personalizado</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
              </div>

              {/* ✅ NOVO: Campo de parcelas personalizadas */}
              {isCustomInstallments && (
                <div>
                  <label className={labelClass}>
                    Número de Parcelas
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="999"
                    value={customInstallments}
                    onChange={(e) => {
                      const valor = Math.max(1, Math.min(999, parseInt(e.target.value) || 1));
                      setCustomInstallments(valor.toString());
                      // Atualizar formData com o valor customizado
                      handleChange({ target: { name: "installmentsCount", value: valor.toString() } });
                    }}
                    placeholder="Ex: 14, 20, 30..."
                    className={inputClass}
                  />
                </div>
              )}
            </div>            {/* TABELA DE PARCELAS (Se > 1) */}
            {formData.installmentsCount > 1 && schedule.length > 0 && (
              <div className="border border-gray-200 bg-white rounded-lg overflow-x-auto md:overflow-hidden">
                <table className="w-full divide-y divide-gray-200 md:w-full">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="px-3 md:px-4 py-2 text-xs md:text-sm font-medium text-gray-500 uppercase text-left whitespace-nowrap">
                        Parc.
                      </th>
                      <th className="px-3 md:px-4 py-2 text-xs md:text-sm font-medium text-gray-500 uppercase text-left whitespace-nowrap">
                        Valor
                      </th>
                      <th className="px-3 md:px-4 py-2 text-xs md:text-sm font-medium text-gray-500 uppercase text-left whitespace-nowrap">
                        Data
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {schedule.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-3 md:px-4 py-2 text-xs md:text-sm font-medium text-gray-900 whitespace-nowrap">
                          {item.number}
                        </td>
                        <td className="px-3 md:px-4 py-2 min-w-[110px] md:min-w-auto">
                          <input
                            type="text"
                            value={item.value}
                            onChange={(e) =>
                              handleScheduleEdit(idx, "value", e.target.value)
                            }
                            className="w-full text-xs md:text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-green-600 font-semibold px-2 py-1"
                          />
                        </td>
                        <td className="px-3 md:px-4 py-2 min-w-[120px] md:min-w-auto">
                          <input
                            type="date"
                            value={item.date}
                            onChange={(e) =>
                              handleScheduleEdit(idx, "date", e.target.value)
                            }
                            className="w-full text-xs md:text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 px-2 py-1"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* BLOCO 4: RECEBEDOR E ANEXO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-6">
            <div ref={autocompleteDropdownRef} className="relative">
              <label className={labelClass}>
                <User className="w-4 h-4 mr-2 text-blue-600" /> Fornecedor /
                Titular <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                name="titular"
                value={formData.titular}
                onChange={(e) => {
                  handleChange(e);
                  setTitularJustSelected(false);
                }}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  if (!titularJustSelected && formData.titular.trim() && titularSuggestions.length > 0) {
                    setShowSuggestions(true);
                  }
                }}
                placeholder="Digite o nome do fornecedor..."
                className={inputClass}
                autoComplete="off"
              />

              {/* Dropdown de Sugestoes */}
              {showSuggestions && (
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
                      Nenhum fornecedor encontrado. Voce pode cadastrar um novo.
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className={labelClass}>
                <CreditCard className="w-4 h-4 mr-2 text-blue-600" /> CPF / CNPJ{" "}
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                name="cpfCnpj"
                value={formData.cpfCnpj}
                onChange={handleChange}
                placeholder="000.000.000-00"
                maxLength={18}
                className={`${inputClass} ${
                  isCpfCnpjLocked ? "bg-gray-100 cursor-not-allowed" : ""
                }`}
                disabled={isCpfCnpjLocked}
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>
                <Paperclip className="w-4 h-4 mr-2 text-blue-600" /> Anexo
                (Comprovante/Boleto)
                {/* ? AJUSTE 2: INDICADOR VISUAL CONDICIONAL */}
                {(formData.paymentMethod === "Cheque" || formData.paymentMethod === "Boleto") && (
                    <span className="text-red-500 ml-1">*</span>
                )}
              </label>              <div className="mt-1 flex flex-col gap-3">
                <div className="flex items-center">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    multiple
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current.click()}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Escolher arquivo(s)
                  </button>
                  <span className="ml-2 text-xs text-gray-500">
                    {formData.anexos.length > 0 && `${formData.anexos.length} arquivo(s) selecionado(s)`}
                  </span>
                </div>
                {formData.anexos.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {formData.anexos.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between text-sm text-gray-600 bg-blue-50 px-3 py-2 rounded-md"
                      >
                        <span className="truncate">{file.name}</span>
                        <X
                          className="w-4 h-4 ml-2 cursor-pointer text-red-500 hover:text-red-700 shrink-0"
                          onClick={() => removeFile(index)}
                        />
                      </div>
                    ))}
                  </div>
                )}              </div>
            </div>

            {/* BLOCO: OBSERVACOES */}
            <div>
              <label htmlFor="observacao" className={labelClass}>
                <AlertCircle className="w-4 h-4 mr-2 text-blue-600" /> Observacoes (Opcional)
              </label>
              <textarea
                name="observacao"
                rows="3"
                value={formData.observacao}
                onChange={handleChange}
                placeholder="Adicione qualquer observacao ou detalhe importante sobre esta solicitacao..."
                className={`${inputClass} resize-none`}
              />
            </div>
          </div>

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={isSubmitting || (obras.length === 0 && !isLoadingObras)}
            className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-lg font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50 disabled:bg-blue-300 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5"
          >
            {isSubmitting ? (
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
            ) : (
              <Send className="w-6 h-6 mr-2" />
            )}
            {isSubmitting ? "Processando..." : "Enviar Solicitacao"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TelaSolicitacao;
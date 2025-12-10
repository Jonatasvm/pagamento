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

// --- CONFIGURAÇÃO ---
const API_URL = "http://91.98.132.210:5631";

// --- UTILITÁRIOS (Helpers) ---

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

const addMonths = (dateStr, months) => {
  const d = new Date(dateStr + "T00:00:00"); // T00:00:00 evita problemas de fuso
  const originalDay = d.getDate();
  d.setMonth(d.getMonth() + months);
  if (d.getDate() !== originalDay) {
    d.setDate(0); // Ajuste para virada de mês (ex: 31 jan -> 28 fev)
  }
  return d.toISOString().split("T")[0];
};

// Cálculo de Parcelas
const calculateInstallments = (totalValueStr, count, startDateStr) => {
  const totalCents = parseInt(cleanDigits(totalValueStr), 10);
  if (!totalCents || count < 1 || !startDateStr) return [];

  const installmentCents = Math.floor(totalCents / count);
  const remainderCents = totalCents % count;
  const results = [];

  for (let i = 0; i < count; i++) {
    let currentCents = installmentCents;
    if (i === 0) currentCents += remainderCents; // Resto vai na 1ª parcela

    const valStr = currentCents.toString().padStart(3, "0");
    results.push({
      number: i + 1,
      value: formatCurrency(valStr),
      date: addMonths(startDateStr, i),
    });
  }
  return results;
};

// --- CONSTANTES ESTÁTICAS ---
const PIX_KEY_TYPES = ["CPF", "CNPJ", "E-mail", "Telefone", "Chave Aleatória"];
const PIX_LIMITS = {
  CPF: { len: 11, type: "numeric" },
  CNPJ: { len: 14, type: "numeric" },
  Telefone: { len: 14, type: "numeric" },
  "E-mail": { len: 100, type: "text" },
  "Chave Aleatória": { len: 36, type: "text" },
};
const INSTALLMENT_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);

// --- COMPONENTE PRINCIPAL ---
const TelaSolicitacao = () => {
  const fileInputRef = useRef(null);
  const autocompleteDropdownRef = useRef(null);
  // Estado do Formulário
  const [formData, setFormData] = useState({
    obra: "",
    referente: "",
    valor: "",
    paymentMethod: "PIX",
    pixKeyType: "CPF",
    pixKey: "",
    titular: "",
    cpfCnpj: "",
    dataVencimento: "",
    installmentsCount: 1,
    anexos: [], // Múltiplos arquivos
  });

  // Estados de Controle
  const [obras, setObras] = useState([]);
  const [isLoadingObras, setIsLoadingObras] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [schedule, setSchedule] = useState([]); // Parcelas calculadas

  // Estados para Autocomplete
  const [titularSuggestions, setTitularSuggestions] = useState([]);
  const [isCpfCnpjLocked, setIsCpfCnpjLocked] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  // 1. Buscar Obras (Com Filtro de Usuário)
  useEffect(() => {
    const fetchObras = async () => {
      try {
        const userId = localStorage.getItem("user_id");
        if (!userId) {
          toast.error("Sessão inválida. Faça login novamente.");
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
  }, []);

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

      // Só atualiza se houver mudança real para evitar loop
      if (JSON.stringify(newSchedule) !== JSON.stringify(schedule)) {
        setSchedule(newSchedule);
      }
    } else {
      setSchedule([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.valor, formData.installmentsCount, formData.dataVencimento]);

  // 3. Buscar Titulares para Autocomplete
  useEffect(() => {
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

    // Debounce de 300ms para evitar muitas requisições
    const debounceTimer = setTimeout(fetchTitulares, 300);
    return () => clearTimeout(debounceTimer);
  }, [formData.titular]);

  // --- HANDLERS ---

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;

    // Máscaras específicas
    if (name === "valor") newValue = formatCurrency(value);
    if (name === "cpfCnpj") newValue = formatCpfCnpj(value);
    if (name === "pixKey") {
      const limit = PIX_LIMITS[formData.pixKeyType];
      if (limit.type === "numeric")
        newValue = cleanDigits(value).substring(0, limit.len);
      else newValue = value.substring(0, limit.len);
    }

    // Lógica específica de troca de tipo de pagamento ou chave
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

  // Handler para selecionar um titular da lista de sugestões
  const handleSelectTitular = (suggestion) => {
    setFormData((prev) => ({
      ...prev,
      titular: suggestion.titular,
      cpfCnpj: formatCpfCnpj(suggestion.cpf_cnpj),
    }));
    setIsCpfCnpjLocked(true); // Bloqueia após seleção
    setShowSuggestions(false);
    setTitularSuggestions([]);
  };

  // Handler para navegação com teclado nas sugestões
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

  // Fechar sugestões ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        autocompleteDropdownRef.current &&
        !autocompleteDropdownRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const handleFileChange = (e) => {
    if (e.target.files) {
      // Adiciona os novos arquivos à lista existente
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

  // Edição manual das parcelas (Tabela)
  const handleScheduleEdit = (index, field, value) => {
    const newSchedule = [...schedule];
    let finalValue = value;

    if (field === "value") finalValue = formatCurrency(value);

    newSchedule[index] = { ...newSchedule[index], [field]: finalValue };
    setSchedule(newSchedule);
  };

  // ENVIO DO FORMULÁRIO
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // 🛑 AJUSTE 1: VALIDAÇÃO DO ANEXO OBRIGATÓRIO (CORRIGIDO)
    const isPaymentMethodRequiringFile = 
      formData.paymentMethod === "Cheque" || 
      formData.paymentMethod === "Boleto";    if (isPaymentMethodRequiringFile && formData.anexos.length === 0) {
      toast.error("Você precisa enviar pelo menos um arquivo para Cheque e Boleto.", { 
          duration: 4000 
      });
      setIsSubmitting(false); // Reseta o botão de envio
      return; //  Impede a submissão
    }
    // ----------------------------------------------------

    // Validação Básica
    const required = [
      "obra",
      "referente",
      "valor",
      "titular",
      "cpfCnpj",
      "dataVencimento",
    ];
    if (formData.paymentMethod === "PIX") required.push("pixKey");

    const hasEmptyFields = required.some((field) => !formData[field]);
    if (hasEmptyFields) {
      toast.error("Preencha todos os campos obrigatórios.");
      setIsSubmitting(false);
      return;
    }

    // Validação Soma Parcelas
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

    const usuarioLogado = localStorage.getItem("usuario") || "Usuário";
    const hoje = new Date().toISOString().split("T")[0];    try {
      const requests = [];
      const basePayload = {
        data_lancamento: hoje,
        solicitante: usuarioLogado,
        titular: formData.titular,
        obra: formData.obra,
        forma_pagamento: formData.paymentMethod, // Usando o estado atual
        lancado: "N",
        cpf_cnpj: cleanDigits(formData.cpfCnpj), // Enviar sem formatação
        chave_pix: formData.pixKey || "",
        observacao: "",
        // O anexo será tratado separadamente ou via outro campo/API, aqui é só o dado
      };

      if (formData.installmentsCount > 1) {
        // Múltiplas requisições
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
        // Requisição Única
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

      // Pega o ID do primeiro formulário criado (se múltiplos, usa o primeiro)
      const firstFormId = responseData[0]?.id;

      // Se houver anexos, fazer upload para Google Drive
      if (formData.anexos.length > 0 && firstFormId) {
        const formDataUpload = new FormData();
        formData.anexos.forEach((file) => {
          formDataUpload.append("files", file);
        });

        const uploadResponse = await fetch(
          `${API_URL}/formulario/${firstFormId}/upload-anexos`,
          {
            method: "POST",
            body: formDataUpload,
          }
        );

        if (!uploadResponse.ok) {
          console.warn("Aviso: Formulário criado, mas falha ao fazer upload dos arquivos");
        } else {
          const uploadData = await uploadResponse.json();
          console.log("Arquivos upados com sucesso:", uploadData);
        }
      }

      toast.success("Solicitação enviada com sucesso!");

      // Reset Form
      setFormData({
        obra: "",
        referente: "",
        valor: "",
        paymentMethod: "PIX",
        pixKeyType: "CPF",
        pixKey: "",
        titular: "",
        cpfCnpj: "",
        dataVencimento: "",
        installmentsCount: 1,
        anexos: [],
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
    <div className="min-h-screen bg-gray-50 flex justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <Toaster position="top-right" />

      <div className="max-w-4xl w-full bg-white shadow-2xl rounded-xl border border-gray-100 p-8 md:p-10">
        {/* HEADER */}
        <div className="border-b-4 border-blue-500/50 pb-4 mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900 flex items-center">
            <DollarSign className="w-8 h-8 mr-3 text-blue-600" />
            Solicitação de Pagamento
          </h2>
          <p className="text-gray-500 mt-1 text-sm">
            Preencha os dados da despesa para aprovação.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* BLOCO 1: OBRA E DESCRIÇÃO */}
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label htmlFor="obra" className={labelClass}>
                <Building className="w-4 h-4 mr-2 text-blue-600" /> Obra{" "}
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative">
                <select
                  name="obra"
                  value={formData.obra}
                  onChange={handleChange}
                  disabled={isLoadingObras}
                  className={`${inputClass} appearance-none bg-white`}
                >
                  <option value="" disabled>
                    {isLoadingObras
                      ? "Carregando..."
                      : "Selecione a obra vinculada"}
                  </option>
                  {obras.map((obra) => (
                    <option key={obra.id} value={obra.id}>
                      {obra.nome}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
              {!isLoadingObras && obras.length === 0 && (
                <p className="text-sm text-red-500 mt-1 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" /> Nenhuma obra
                  encontrada para seu usuário.
                </p>
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
              {["PIX", "Boleto", "Cheque"].map((method) => (
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

          {/* BLOCO 3: DETALHES ESPECÍFICOS (PIX e PARCELAS) */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 space-y-6">
            {/* LINHA 1: PIX (Se selecionado) */}
            {formData.paymentMethod === "PIX" && (
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
                  <Calendar className="w-4 h-4 mr-2 text-blue-600" /> Data 1º
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
                    value={formData.installmentsCount}
                    onChange={handleChange}
                    className={`${inputClass} appearance-none`}
                  >
                    {INSTALLMENT_OPTIONS.map((i) => (
                      <option key={i} value={i}>
                        {i}x {i > 1 ? "(Parcelado)" : "(À vista)"}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>

            {/* TABELA DE PARCELAS (Se > 1) */}
            {formData.installmentsCount > 1 && schedule.length > 0 && (
              <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase text-left">
                        Parc.
                      </th>
                      <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase text-left">
                        Valor
                      </th>
                      <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase text-left">
                        Data
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {schedule.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-2 text-sm font-medium text-gray-900">
                          {item.number}
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={item.value}
                            onChange={(e) =>
                              handleScheduleEdit(idx, "value", e.target.value)
                            }
                            className="w-full text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-green-600 font-semibold"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="date"
                            value={item.date}
                            onChange={(e) =>
                              handleScheduleEdit(idx, "date", e.target.value)
                            }
                            className="w-full text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
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
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  if (formData.titular.trim() && titularSuggestions.length > 0) {
                    setShowSuggestions(true);
                  }
                }}
                placeholder="Digite o nome do fornecedor..."
                className={inputClass}
                autoComplete="off"
              />

              {/* Dropdown de Sugestões */}
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
                      Nenhum fornecedor encontrado. Você pode cadastrar um novo.
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
                {/* 🎯 AJUSTE 2: INDICADOR VISUAL CONDICIONAL */}
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
                )}
              </div>
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
            {isSubmitting ? "Processando..." : "Enviar Solicitação"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TelaSolicitacao;
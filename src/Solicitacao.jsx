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
const API_URL = "http://127.0.0.1:5631";

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
    anexo: null,
  });

  // Estados de Controle
  const [obras, setObras] = useState([]);
  const [isLoadingObras, setIsLoadingObras] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [schedule, setSchedule] = useState([]); // Parcelas calculadas

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

    setFormData((prev) => ({ ...prev, [name]: newValue }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFormData((prev) => ({ ...prev, anexo: e.target.files[0] }));
    }
  };

  const removeFile = () => {
    setFormData((prev) => ({ ...prev, anexo: null }));
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
    const hoje = new Date().toISOString().split("T")[0];

    try {
      const requests = [];
      const basePayload = {
        data_lancamento: hoje,
        solicitante: usuarioLogado,
        titular: formData.titular,
        obra: formData.obra,
        forma_pagamento: formData.paymentMethod,
        lancado: "N",
        cpf_cnpj: formData.cpfCnpj,
        chave_pix: formData.pixKey || "",
        observacao: "",
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
      if (responses.some((r) => !r.ok))
        throw new Error("Falha em um dos envios");

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
        anexo: null,
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
                    <option key={obra.id} value={obra.nome}>
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
            <div>
              <label className={labelClass}>
                <User className="w-4 h-4 mr-2 text-blue-600" /> Fornecedor /
                Titular <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                name="titular"
                value={formData.titular}
                onChange={handleChange}
                placeholder="Nome ou Razão Social"
                className={inputClass}
              />
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
                className={inputClass}
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>
                <Paperclip className="w-4 h-4 mr-2 text-blue-600" /> Anexo
                (Comprovante/Boleto)
              </label>
              <div className="mt-1 flex items-center">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current.click()}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Escolher arquivo
                </button>
                {formData.anexo && (
                  <span className="ml-3 flex items-center text-sm text-gray-600 bg-blue-50 px-2 py-1 rounded-md">
                    {formData.anexo.name}
                    <X
                      className="w-4 h-4 ml-2 cursor-pointer text-red-500"
                      onClick={removeFile}
                    />
                  </span>
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

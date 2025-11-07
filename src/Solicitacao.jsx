import React, { useState, useRef, useMemo, useEffect } from "react";
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
} from "lucide-react";

// --- Funções de Máscara em JavaScript ---

// Função para formatar o Valor (R$ 1.234,50)
const formatCurrencyDisplay = (rawDigits) => {
  const digits = rawDigits.replace(/\D/g, "").substring(0, 15);

  if (!digits) return "";

  const cents = digits.slice(-2).padStart(2, "0");
  const reais = digits.slice(0, -2) || "0";

  // Usamos parseInt(reais, 10) para garantir que '00' se torne '0' antes da formatação.
  const formattedReais = parseInt(reais, 10).toLocaleString("pt-BR");

  return `R$ ${formattedReais},${cents}`;
};

// Função para formatar CPF (000.000.000-00) ou CNPJ (00.000.000/0000-00)
const formatCpfCnpj = (value) => {
  const cleanValue = value.replace(/\D/g, "").substring(0, 14);

  if (cleanValue.length <= 11) {
    // CPF: 000.000.000-00
    return cleanValue
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d{1,2})/, "$1.$2.$3-$4");
  } else {
    // CNPJ: 00.000.000/0000-00
    return cleanValue
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3/$4")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }
};

// Helper para adicionar meses de forma segura (para lidar com final de mês)
const addMonths = (date, months) => {
  const d = new Date(date.getTime());
  const originalDay = d.getDate();
  d.setMonth(d.getMonth() + months);
  if (d.getDate() !== originalDay) {
    d.setDate(0); // Volta para o último dia do mês anterior
  }
  return d;
};

// Lógica de Parcelamento (Gera o cronograma inicial para o Boleto parcelado)
const calculateInstallments = (totalValueRaw, count, startDateStr) => {
  const totalValueDigits = totalValueRaw.replace(/\D/g, "");
  if (!totalValueDigits || count < 1 || !startDateStr) return [];

  // Usar 'T00:00:00' para garantir a interpretação consistente da data
  let startDateObj = new Date(startDateStr + "T00:00:00");
  if (isNaN(startDateObj.getTime())) return [];

  const totalCents = parseInt(totalValueDigits, 10);
  const installmentCents = Math.floor(totalCents / count);
  const remainderCents = totalCents % count;

  const results = [];

  for (let i = 0; i < count; i++) {
    let currentInstallmentCents = installmentCents;

    // Adiciona o resto na primeira parcela
    if (i === 0) {
      currentInstallmentCents += remainderCents;
    }

    const currentInstallmentValue = formatCurrencyDisplay(
      currentInstallmentCents.toString().padStart(3, "0")
    );

    const installmentDate = addMonths(startDateObj, i);
    // Formata a data para ISO string (YYYY-MM-DD) para estado interno e input[type="date"]
    const isoDate = installmentDate.toISOString().split("T")[0];

    results.push({
      number: i + 1,
      value: currentInstallmentValue, // formatted string (R$ X,XX)
      date: isoDate, // ISO string (YYYY-MM-DD)
    });
  }

  return results;
};

// --- Dados Mock para Dropdowns e Valores Fixos ---
const solicitanteLockedValue = "João Silva";
const obrasMock = [
  "Projeto Alpha",
  "Construção Beta",
  "Reforma Gamma",
  "Expansão Delta",
];
const pixKeyTypes = ["CPF", "CNPJ", "E-mail", "Telefone", "Chave Aleatória"];

// Opções de parcela
const installmentOptions = Array.from({ length: 12 }, (_, i) => i + 1);

// --- Limites de caracteres para a Chave PIX ---
const PIX_LIMITS = {
  CPF: { len: 11, type: "numeric" },
  CNPJ: { len: 14, type: "numeric" },
  Telefone: { len: 14, type: "numeric" },
  "E-mail": { len: 100, type: "text" },
  "Chave Aleatória": { len: 36, type: "text" },
};

// --- Componente do Formulário ---
const Tela1 = () => {
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    solicitante: solicitanteLockedValue,
    obra: "",
    referente: "",
    valor: "",
    // Campos de Pagamento
    paymentMethod: "PIX",
    pixKeyType: "CPF",
    pixKey: "",
    // Comuns
    titular: "",
    cpfCnpj: "",
    // Boleto/Data
    dataVencimento: "", // Usado como 1º Vencimento Boleto
    installmentsCount: 1, // Número de parcelas
    // Anexo
    anexo: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  // Estado para armazenar o cronograma de parcelas editável
  const [editableInstallmentSchedule, setEditableInstallmentSchedule] =
    useState([]);

  // Efeito para inicializar ou resetar o cronograma de parcelas ao mudar valor, data ou contagem
  useEffect(() => {
    const isMultiInstallmentBoleto =
      formData.paymentMethod === "Boleto" && formData.installmentsCount > 1;

    if (isMultiInstallmentBoleto && formData.valor && formData.dataVencimento) {
      const currentSchedule = calculateInstallments(
        formData.valor,
        formData.installmentsCount,
        formData.dataVencimento
      );

      // Checa se a contagem mudou ou se os valores calculados mudaram
      const shouldReset =
        editableInstallmentSchedule.length !== currentSchedule.length ||
        JSON.stringify(
          currentSchedule.map((item) => item.value + item.date)
        ) !==
          JSON.stringify(
            editableInstallmentSchedule.map((item) => item.value + item.date)
          );

      if (shouldReset) {
        setEditableInstallmentSchedule(currentSchedule);
      }
    } else {
      // Limpa se não for Boleto ou se for apenas 1 parcela
      setEditableInstallmentSchedule([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    formData.paymentMethod,
    formData.valor,
    formData.installmentsCount,
    formData.dataVencimento,
  ]);

  // Handler para edição manual de parcelas (valor ou data)
  const handleInstallmentChange = (index, field, value) => {
    setEditableInstallmentSchedule((prevSchedule) => {
      const newSchedule = [...prevSchedule];
      let newValue = value;

      if (field === "value") {
        // Aplica a máscara de moeda
        const rawDigits = value.replace(/\D/g, "");
        // Garante que o valor exibido tenha o formato R$ X,XX
        newValue = formatCurrencyDisplay(rawDigits.substring(0, 15));
      }

      // Se for date, o valor já está no formato ISO (YYYY-MM-DD)

      newSchedule[index] = {
        ...newSchedule[index],
        [field]: newValue,
      };
      return newSchedule;
    });
  };

  const handleRemoveFile = () => {
    setFormData((prevData) => ({ ...prevData, anexo: null }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    toast.success("Anexo removido.");
  };

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;

    if (type === "file") {
      setFormData((prevData) => ({ ...prevData, [name]: files[0] }));
      return;
    }

    let newValue = value;

    if (name === "valor") {
      const rawDigits = value.replace(/\D/g, "");
      newValue = rawDigits.substring(0, 15);
    } else if (name === "cpfCnpj") {
      newValue = formatCpfCnpj(value);
    } else if (name === "pixKey") {
      const { len, type } = PIX_LIMITS[formData.pixKeyType] || {
        len: 50,
        type: "text",
      };

      if (type === "numeric") {
        const cleanDigits = value.replace(/\D/g, "");
        newValue = cleanDigits.substring(0, len);
      } else {
        newValue = value.substring(0, len);
      }
    }

    // Se o tipo de chave PIX for alterado, limpa o campo da chave
    if (name === "pixKeyType") {
      setFormData((prevData) => ({
        ...prevData,
        [name]: newValue,
        pixKey: "",
      }));
      return;
    }

    // Se o método de pagamento for alterado, reseta as informações específicas
    if (name === "paymentMethod") {
      const resetFields = {
        pixKey: "",
        pixKeyType: "CPF",
        installmentsCount: 1,
        dataVencimento: "",
      };
      setFormData((prevData) => ({
        ...prevData,
        ...resetFields,
        [name]: newValue,
      }));
      setEditableInstallmentSchedule([]); // Garante que o schedule seja limpo
      return;
    }

    setFormData((prevData) => ({ ...prevData, [name]: newValue }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);

    const commonRequiredFields = [
      "obra",
      "referente",
      "valor",
      "titular",
      "cpfCnpj",
    ];

    let conditionalRequiredFields = [];

    if (formData.paymentMethod === "PIX") {
      conditionalRequiredFields = ["pixKey"]; // PIX não exige data
    } else if (formData.paymentMethod === "Boleto") {
      // Data de 1º vencimento é obrigatória para Boleto (mesmo em 1x)
      conditionalRequiredFields = ["dataVencimento"];

      // Se for parcelado (> 1)
      if (
        formData.installmentsCount > 1 &&
        editableInstallmentSchedule.length === 0
      ) {
        toast.error(
          "Erro ao calcular parcelamento. Verifique o valor e a data de vencimento."
        );
        setIsLoading(false);
        return;
      }

      // Validação: Soma das parcelas deve ser igual ao Valor Total
      if (formData.installmentsCount > 1) {
        const totalCents = parseInt(formData.valor.replace(/\D/g, ""), 10) || 0;

        const sumOfInstallmentsCents = editableInstallmentSchedule.reduce(
          (sum, item) => {
            // Remove R$ . , e converte para centavos (ex: "R$ 1.500,00" -> 150000)
            const rawDigits = item.value.replace(/\D/g, "");
            const cents = parseInt(rawDigits, 10) || 0;
            return sum + cents;
          },
          0
        );

        if (sumOfInstallmentsCents !== totalCents) {
          toast.error(
            "ERRO DE VALIDAÇÃO: A soma das parcelas editadas não corresponde ao Valor Total."
          );
          setIsLoading(false);
          return;
        }
      }
    }

    const allRequiredFields = [
      ...commonRequiredFields,
      ...conditionalRequiredFields,
    ];

    const isInvalid = allRequiredFields.some(
      (field) =>
        !formData[field] ||
        (field === "valor" && formData.valor.replace(/\D/g, "") === "")
    );

    if (isInvalid) {
      toast.error("Preencha todos os campos obrigatórios (*).");
      setIsLoading(false);
      return;
    }

    // Prepara dados para envio (simulação)
    const submissionData = {
      ...formData,
      valorDisplay: formatCurrencyDisplay(formData.valor),
      valorRaw: formData.valor.replace(/\D/g, ""),
      installmentSchedule:
        formData.paymentMethod === "Boleto" && formData.installmentsCount > 1
          ? editableInstallmentSchedule
          : null,
      singlePaymentVencimento:
        formData.paymentMethod === "Boleto" && formData.installmentsCount === 1
          ? formData.dataVencimento
          : null,
    };

    // Lógica de envio (simulação)
    setTimeout(() => {
      console.log("Dados do Formulário para Envio:", submissionData);
      toast.success("Solicitação de pagamento enviada com sucesso!");

      // Resetar o formulário
      setFormData({
        solicitante: solicitanteLockedValue,
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
      setEditableInstallmentSchedule([]); // Reseta o schedule editável
      setIsLoading(false);
    }, 2000);
  };

  const displayValor = formatCurrencyDisplay(formData.valor);
  const cpfCnpjPlaceholder = "000.000.000-00 ou 00.000.000/0000-00";
  const isBoleto = formData.paymentMethod === "Boleto";

  // Classes de estilo base
  const baseInputStyle =
    "mt-1 block w-full border border-gray-300 transition duration-300 focus:ring-blue-500 focus:border-blue-500 rounded-lg py-2.5 shadow-sm text-gray-800 focus:shadow-md";

  // Estilo específico para inputs
  const inputStyle = `${baseInputStyle} px-4`;
  // Estilo para campo travado (aplicado ao div)
  const disabledStyle = "bg-gray-100 cursor-not-allowed text-gray-600";
  const selectStyle = `${baseInputStyle} pl-4 pr-10 appearance-none bg-white`;

  const labelStyle =
    "flex items-center text-sm font-semibold text-gray-700 mb-1.5";
  const iconColor = "text-blue-600";
  const requiredSpan = <span className="text-red-500 ml-1 font-bold">*</span>;

  const activePixLimit = PIX_LIMITS[formData.pixKeyType];

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center py-12 px-4 sm:px-6 lg:px-8 font-inter">
      <Toaster position="top-right" />

      <div className="max-w-4xl w-full bg-white shadow-2xl rounded-xl border border-gray-100 p-8 md:p-10">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-8 pb-3 border-b-4 border-blue-500/50">
          <DollarSign className="inline w-7 h-7 mr-3 mb-1 text-blue-600" />
          Solicitação de Pagamento
        </h2>

        <form onSubmit={handleSubmit} className="space-y-7">
          {/* GRUPO 1: Solicitante (FIXO) e Obra (Dropdown) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
            {/* Solicitante (FIXO) */}
            <div>
              <label htmlFor="solicitante-display" className={labelStyle}>
                <User className={`w-4 h-4 mr-2 ${iconColor}`} /> Solicitante{" "}
                {requiredSpan}
              </label>
              <div
                id="solicitante-display"
                className={`${inputStyle} ${disabledStyle} h-[46px] flex items-center`}
              >
                {formData.solicitante}
              </div>
            </div>

            {/* Obra (Dropdown) */}
            <div>
              <label htmlFor="obra" className={labelStyle}>
                <Building className={`w-4 h-4 mr-2 ${iconColor}`} /> Obra{" "}
                {requiredSpan}
              </label>
              <div className="relative">
                <select
                  id="obra"
                  name="obra"
                  value={formData.obra}
                  onChange={handleChange}
                  className={`${selectStyle}`}
                >
                  <option value="" disabled>
                    Selecione a obra
                  </option>
                  {obrasMock.map((obra) => (
                    <option key={obra} value={obra}>
                      {obra}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* GRUPO 2: Referente (TextArea) e Valor (Mask Real) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
            {/* Referente (TextArea) */}
            <div>
              <label htmlFor="referente" className={labelStyle}>
                <Tag className={`w-4 h-4 mr-2 ${iconColor}`} /> Referente
                (Detalhes da despesa) {requiredSpan}
              </label>
              <textarea
                id="referente"
                name="referente"
                rows="3"
                value={formData.referente}
                onChange={handleChange}
                placeholder="Ex: Compra de materiais elétricos (Nota 456), com detalhes sobre o fornecedor e a utilização."
                className={`${inputStyle} resize-none h-auto min-h-[100px]`}
              ></textarea>
            </div>

            {/* Valor (Mask Real) */}
            <div>
              <label htmlFor="valor" className={labelStyle}>
                <DollarSign className={`w-4 h-4 mr-2 ${iconColor}`} /> Valor
                Total {requiredSpan}
              </label>
              <input
                type="text"
                id="valor"
                name="valor"
                value={displayValor}
                onChange={handleChange}
                placeholder="R$ 1.234,50"
                className={inputStyle}
                inputMode="numeric"
              />
            </div>
          </div>

          {/* GRUPO 3: FORMA DE PAGAMENTO (PIX / BOLETO) */}
          <div className="border-t border-gray-200 pt-6">
            <label className={labelStyle}>
              <CreditCard className={`w-4 h-4 mr-2 ${iconColor}`} /> Forma de
              Pagamento {requiredSpan}
            </label>
            <div className="flex space-x-4 mt-2">
              {["PIX", "Boleto"].map((method) => (
                <label
                  key={method}
                  className={`inline-flex items-center px-4 py-2 border rounded-full text-sm font-medium cursor-pointer transition ${
                    formData.paymentMethod === method
                      ? "bg-blue-600 text-white border-blue-600 shadow-md"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
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

          {/* --- BLOCO PIX (CONDICIONAL) --- */}
          {formData.paymentMethod === "PIX" && (
            <div className="space-y-7">
              {/* PIX KEY INPUTS */}
              <div>
                <label className={labelStyle}>
                  <Key className={`w-4 h-4 mr-2 ${iconColor}`} /> Chave PIX{" "}
                  {requiredSpan}
                </label>
                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                  {/* Tipo de Chave (Dropdown) */}
                  <div className="relative sm:w-1/3">
                    <select
                      name="pixKeyType"
                      value={formData.pixKeyType}
                      onChange={handleChange}
                      className={`${selectStyle} w-full`}
                    >
                      {pixKeyTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
                  </div>

                  {/* Input da Chave */}
                  <input
                    type={activePixLimit.type === "numeric" ? "tel" : "text"}
                    name="pixKey"
                    value={formData.pixKey}
                    onChange={handleChange}
                    placeholder={`Insira a chave (${formData.pixKeyType})`}
                    className={`${inputStyle} sm:w-2/3`}
                    inputMode={
                      activePixLimit.type === "numeric" ? "numeric" : "text"
                    }
                    maxLength={
                      activePixLimit.type === "text"
                        ? activePixLimit.len
                        : undefined
                    }
                  />
                </div>
              </div>
            </div>
          )}
          {/* --- FIM BLOCO PIX --- */}

          {/* --- BLOCO BOLETO (CONDICIONAL) --- */}
          {isBoleto && (
            <div className="space-y-7">
              {/* Data de Vencimento e Número de Parcelas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
                {/* Data de Vencimento da Primeira Parcela */}
                <div>
                  <label htmlFor="dataVencimento" className={labelStyle}>
                    <Calendar className={`w-4 h-4 mr-2 ${iconColor}`} /> Data 1º
                    Vencimento {requiredSpan}
                  </label>
                  <input
                    type="date"
                    id="dataVencimento"
                    name="dataVencimento"
                    value={formData.dataVencimento}
                    onChange={handleChange}
                    className={`${inputStyle} appearance-none`}
                  />
                </div>

                {/* Número de Parcelas */}
                <div>
                  <label htmlFor="installmentsCount" className={labelStyle}>
                    <List className={`w-4 h-4 mr-2 ${iconColor}`} /> Número de
                    Parcelas
                  </label>
                  <div className="relative">
                    <select
                      id="installmentsCount"
                      name="installmentsCount"
                      value={formData.installmentsCount}
                      onChange={handleChange}
                      className={`${selectStyle}`}
                    >
                      {installmentOptions.map((count) => (
                        <option key={count} value={count}>
                          {count} {count > 1 ? "parcelas" : "parcela"}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Tabela de Parcelamento Gerado/Editável (Apenas se houver mais de 1 parcela) */}
              {formData.installmentsCount > 1 &&
                editableInstallmentSchedule.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <h4 className="font-bold text-gray-700 mb-3 flex items-center">
                      <List className="w-4 h-4 mr-2 text-blue-500" />
                      {editableInstallmentSchedule.length} Parcelas Editáveis
                      (Total: {displayValor})
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tl-lg">
                              #
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">
                              Valor
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tr-lg w-1/3">
                              Vencimento
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200 text-sm">
                          {editableInstallmentSchedule.map((item, index) => (
                            <tr
                              key={index}
                              className={
                                index % 2 === 0 ? "bg-white" : "bg-gray-50"
                              }
                            >
                              <td className="px-3 py-2 whitespace-nowrap font-medium text-gray-900">
                                {item.number}
                              </td>
                              {/* Campo Valor Editável */}
                              <td className="px-3 py-2">
                                <input
                                  type="text"
                                  value={item.value}
                                  onChange={(e) =>
                                    handleInstallmentChange(
                                      index,
                                      "value",
                                      e.target.value
                                    )
                                  }
                                  className="w-full py-1 px-2 border rounded-md text-green-600 font-semibold text-sm focus:border-blue-500"
                                  inputMode="numeric"
                                />
                              </td>
                              {/* Campo Data Editável */}
                              <td className="px-3 py-2">
                                <input
                                  type="date"
                                  value={item.date} // Já está em ISO YYYY-MM-DD
                                  onChange={(e) =>
                                    handleInstallmentChange(
                                      index,
                                      "date",
                                      e.target.value
                                    )
                                  }
                                  className="w-full py-1 px-2 border rounded-md text-gray-800 text-sm focus:border-blue-500"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="mt-3 text-xs text-gray-500">
                      **Atenção:** Se você editar os valores, a soma das
                      parcelas deve ser igual ao **Valor Total**.
                    </p>
                  </div>
                )}

              {/* Aviso para Boleto de 1x */}
              {formData.installmentsCount === 1 && (
                <div className="bg-blue-50 border-l-4 border-blue-400 text-blue-700 p-3 rounded-md text-sm">
                  Pagamento em parcela única com vencimento em **
                  {formData.dataVencimento}**.
                </div>
              )}
            </div>
          )}
          {/* --- FIM BLOCO BOLETO --- */}

          {/* GRUPO 4: Titular e CPF/CNPJ (COMUM A AMBOS) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-7 border-t border-gray-200 pt-6">
            <h3 className="md:col-span-2 text-lg font-bold text-gray-800 border-b pb-2 mb-2">
              Dados do Recebedor
            </h3>
            {/* Titular */}
            <div>
              <label htmlFor="titular" className={labelStyle}>
                <User className={`w-4 h-4 mr-2 ${iconColor}`} /> Titular{" "}
                {requiredSpan}
              </label>
              <input
                type="text"
                id="titular"
                name="titular"
                value={formData.titular}
                onChange={handleChange}
                placeholder="Nome ou Razão Social do recebedor"
                className={inputStyle}
              />
            </div>

            {/* CPF/CNPJ (Mask) */}
            <div>
              <label htmlFor="cpfCnpj" className={labelStyle}>
                <CreditCard className={`w-4 h-4 mr-2 ${iconColor}`} /> CPF/CNPJ{" "}
                {requiredSpan}
              </label>
              <input
                type="text"
                id="cpfCnpj"
                name="cpfCnpj"
                value={formData.cpfCnpj}
                onChange={handleChange}
                placeholder={cpfCnpjPlaceholder}
                className={inputStyle}
                inputMode="numeric"
                maxLength={18}
              />
            </div>
          </div>

          {/* GRUPO 5: Anexo (Opcional - Customizado) */}
          <div>
            <label htmlFor="anexo" className={labelStyle}>
              <Paperclip className={`w-4 h-4 mr-2 ${iconColor}`} /> Anexo
              (Opcional)
            </label>

            <input
              type="file"
              id="anexo"
              name="anexo"
              ref={fileInputRef}
              onChange={handleChange}
              className="hidden"
            />

            <div className="flex items-center space-x-3 mt-1 h-[46px] w-full border border-gray-300 rounded-lg p-1">
              <button
                type="button"
                onClick={() => fileInputRef.current.click()}
                className="flex-shrink-0 flex items-center justify-center px-3 py-2 bg-blue-500 text-white font-semibold rounded-md shadow-md hover:bg-blue-600 transition duration-150 text-sm h-full"
              >
                <Paperclip className="w-4 h-4 mr-2" />
                {formData.anexo ? "Alterar" : "Selecionar"}
              </button>

              <span
                className={`text-sm flex-grow truncate ${
                  formData.anexo ? "text-gray-800" : "text-gray-500"
                }`}
              >
                {formData.anexo
                  ? formData.anexo.name
                  : "Nenhum arquivo selecionado"}
              </span>

              {formData.anexo && (
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="text-red-500 hover:text-red-700 transition flex-shrink-0 p-1"
                  aria-label="Remover anexo"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Botão de Envio */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-lg font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50 disabled:bg-blue-400 transition duration-300 transform hover:scale-[1.01]"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 mr-3 animate-spin" />
            ) : (
              <Send className="w-5 h-5 mr-3" />
            )}
            {isLoading ? "Enviando Solicitação..." : "Enviar Solicitação"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Tela1;

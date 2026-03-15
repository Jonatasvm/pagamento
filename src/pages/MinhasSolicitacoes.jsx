import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { ArrowLeft, Filter, Loader2, Search } from "lucide-react";
import { listarFormularios } from "./Dashboards/DashBoardMain/formularioService";
import {
  formatCurrencyDisplay,
  formatDatePT,
  getNameById,
  getStatusClasses,
} from "./Dashboards/DashBoardMain/dashboard.data";

const API_URL = "http://91.98.132.210:5631";

export default function MinhasSolicitacoes() {
  // Dados
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [listaObras, setListaObras] = useState([]);
  const [listaCategorias, setListaCategorias] = useState([]);
  const [listaTitulares, setListaTitulares] = useState([]);
  const [listaBancos, setListaBancos] = useState([]);

  // Filtros
  const [filtroObra, setFiltroObra] = useState("");
  const [filtroFornecedor, setFiltroFornecedor] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("pendente"); // "pendente" por padrão
  const [filtroDataInicio, setFiltroDataInicio] = useState("");
  const [filtroDataFim, setFiltroDataFim] = useState("");

  // Toggle Resumido
  const [resumido, setResumido] = useState(true);

  const nomeUsuario =
    localStorage.getItem("nome") ||
    localStorage.getItem("usuario") ||
    "";

  // Buscar dados
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const safeFetch = async (url) => {
          const r = await fetch(url);
          if (!r.ok) return [];
          return r.json();
        };

        const [formData, obrasRes, titularesRes, bancosRes, categoriasRes] =
          await Promise.all([
            listarFormularios(),
            safeFetch(`${API_URL}/obras`),
            safeFetch(`${API_URL}/titulares/list`),
            safeFetch(`${API_URL}/bancos`),
            safeFetch(`${API_URL}/categoria`),
          ]);

        setRequests(formData);
        setListaObras(obrasRes || []);
        setListaTitulares(titularesRes || []);
        setListaBancos(bancosRes || []);
        setListaCategorias(categoriasRes || []);
      } catch (err) {
        console.error(err);
        toast.error("Erro ao carregar dados.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchAll();
  }, []);

  // Filtrar apenas as solicitações do usuário logado
  const minhasSolicitacoes = useMemo(() => {
    if (!nomeUsuario) return [];
    return requests.filter((r) => {
      const solicitante = String(r.solicitante || "").toLowerCase().trim();
      return solicitante === nomeUsuario.toLowerCase().trim();
    });
  }, [requests, nomeUsuario]);

  // Aplicar filtros
  const filteredRequests = useMemo(() => {
    return minhasSolicitacoes.filter((r) => {
      // Filtro obra
      if (filtroObra && String(r.obra) !== filtroObra) return false;

      // Filtro fornecedor (busca parcial no titular)
      if (filtroFornecedor) {
        const titular = String(r.titular || "").toLowerCase();
        if (!titular.includes(filtroFornecedor.toLowerCase())) return false;
      }

      // Filtro status lançamento
      if (filtroStatus === "pendente" && r.statusLancamento) return false;
      if (filtroStatus === "lancado" && !r.statusLancamento) return false;

      // Filtro data
      if (filtroDataInicio && r.dataPagamento < filtroDataInicio) return false;
      if (filtroDataFim && r.dataPagamento > filtroDataFim) return false;

      return true;
    });
  }, [minhasSolicitacoes, filtroObra, filtroFornecedor, filtroStatus, filtroDataInicio, filtroDataFim]);

  // Obras disponíveis para o filtro (apenas as que o usuário tem solicitações)
  const obrasDoUsuario = useMemo(() => {
    const ids = [...new Set(minhasSolicitacoes.map((r) => r.obra))];
    return listaObras.filter((o) => ids.includes(o.id));
  }, [minhasSolicitacoes, listaObras]);

  // Total dos filtrados
  const totalFiltrado = useMemo(() => {
    return filteredRequests.reduce((acc, r) => acc + (r.valor || 0), 0);
  }, [filteredRequests]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Carregando...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              Minhas Solicitações
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {nomeUsuario} &mdash; {filteredRequests.length} registro(s)
            </p>
          </div>
          <Link
            to="/solicitacao"
            className="flex items-center gap-2 bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg hover:bg-gray-300 transition text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-semibold text-gray-700">Filtros</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Obra */}
          <select
            value={filtroObra}
            onChange={(e) => setFiltroObra(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas as Obras</option>
            {obrasDoUsuario
              .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" }))
              .map((o) => (
                <option key={o.id} value={o.id}>
                  {o.nome}
                </option>
              ))}
          </select>

          {/* Fornecedor */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={filtroFornecedor}
              onChange={(e) => setFiltroFornecedor(e.target.value)}
              placeholder="Fornecedor..."
              className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status */}
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos</option>
            <option value="pendente">Não Lançados</option>
            <option value="lancado">Lançados</option>
          </select>

          {/* Data início */}
          <input
            type="date"
            value={filtroDataInicio}
            onChange={(e) => setFiltroDataInicio(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            title="Data início"
          />

          {/* Data fim */}
          <input
            type="date"
            value={filtroDataFim}
            onChange={(e) => setFiltroDataFim(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            title="Data fim"
          />
        </div>

        {/* Toggle Resumido + Total */}
        <div className="flex items-center justify-between mt-4 flex-wrap gap-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <span className="text-sm font-medium text-gray-700">Resumido</span>
            <div
              onClick={() => setResumido(!resumido)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                resumido ? "bg-blue-600" : "bg-gray-300"
              }`}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  resumido ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </div>
          </label>

          <div className="text-sm font-semibold text-gray-700">
            Total:{" "}
            <span className="text-green-700 text-base">
              R$ {formatCurrencyDisplay(totalFiltrado)}
            </span>
          </div>
        </div>
      </div>

      {/* Tabela / Cards */}
      {filteredRequests.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-8 text-center text-gray-500">
          Nenhuma solicitação encontrada.
        </div>
      ) : resumido ? (
        /* Modo Resumido - Cards compactos para mobile */
        <div className="space-y-2">
          {filteredRequests.map((r) => (
            <div
              key={r.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-3"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500">
                  {formatDatePT(r.dataPagamento)}
                </span>
                <span className="font-bold text-green-700 text-sm">
                  R$ {formatCurrencyDisplay(r.valor)}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-900 truncate">
                {r.titular || "—"}
              </p>
              <p className="text-xs text-gray-500 truncate mt-0.5">
                {r.referente || "—"}
              </p>
            </div>
          ))}
        </div>
      ) : (
        /* Modo Completo - Tabela com scroll horizontal */
        <div className="bg-white rounded-xl shadow-md overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Data Pgto</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Titular</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Referente</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Obra</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Conta</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Forma Pgto</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">CPF/CNPJ</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Chave Pix</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Observação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRequests.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2">
                    <span className={getStatusClasses(r.statusLancamento)}>
                      {r.statusLancamento ? "LANÇADO" : "PENDENTE"}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">{formatDatePT(r.dataPagamento)}</td>
                  <td className="px-3 py-2 whitespace-nowrap font-semibold text-green-700">
                    R$ {formatCurrencyDisplay(r.valor)}
                  </td>
                  <td className="px-3 py-2">{r.titular || "—"}</td>
                  <td className="px-3 py-2 max-w-[200px] break-words">{r.referente || "—"}</td>
                  <td className="px-3 py-2">{getNameById(listaCategorias, r.categoria)}</td>
                  <td className="px-3 py-2">{getNameById(listaObras, r.obra)}</td>
                  <td className="px-3 py-2">{getNameById(listaBancos, r.conta)}</td>
                  <td className="px-3 py-2">{r.formaDePagamento || "—"}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{r.cpfCnpjTitularConta || "—"}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{r.chavePix || "—"}</td>
                  <td className="px-3 py-2 max-w-[200px] break-words">{r.observacao || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

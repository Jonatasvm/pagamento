import React, { useState, useEffect } from "react";
import { Toaster, toast } from "react-hot-toast";
import { Building2, Users, Landmark, Home, Users2, Layers } from "lucide-react";
import { Link } from "react-router-dom";
// IMPORTANTE: Certifique-se que os managers são exportados como 'export const'
// Se estiver usando 'export default', tire as chaves { } do import abaixo.
import { ObrasManager } from "./ObrasManager"; 
import { UserManager } from "./UsersManager";
import { BanksManager } from "./BanksManager";
import { FornecedorManager } from "./FornecedorManager"; 
import { CategoriaManager } from "./CategoriaManager"; 

const API_IP = "http://91.98.132.210:5631";

export default function DashboardUsers() {
  // --- ESTADO DE NAVEGAÇÃO ENTRE ABAS ---
  const [currentTab, setCurrentTab] = useState("menu"); // "menu" | "obras" | "usuarios" | "bancos" | "fornecedores"
  
  const [obrasList, setObrasList] = useState([]);
  const [loadingObras, setLoadingObras] = useState(false);

  const [banksList, setBanksList] = useState([]);
  const [loadingBanks, setLoadingBanks] = useState(false);

  const [fornecedoresList, setFornecedoresList] = useState([]);
  const [loadingFornecedores, setLoadingFornecedores] = useState(false);

  const [categoriasList, setCategoriasList] = useState([]);
  const [loadingCategorias, setLoadingCategorias] = useState(false);

  // --- 1. GET: Buscar Obras ---
  const fetchObras = async () => {
    setLoadingObras(true);
    try {
      const response = await fetch(`${API_IP}/obras`);
      if (!response.ok) throw new Error("Falha ao conectar com servidor");
      const data = await response.json();
      setObrasList(data);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar lista de obras.");
    } finally {
      setLoadingObras(false);
    }
  };

  useEffect(() => {
    fetchObras();
    fetchBanks(); // ✅ NOVO: Carrega também a lista de bancos ao iniciar
    fetchFornecedores(); // ✅ NOVO: Carrega também a lista de fornecedores ao iniciar
    fetchCategorias(); // ✅ NOVO: Carrega também a lista de categorias ao iniciar
  }, []);

  // --- 2. POST: Adicionar Obra ---
  // Esta é a função que o ObrasManager está reclamando que não existe.
  const handleAddObra = async (nomeObra, quemPaga, bancoId) => {
    setLoadingObras(true);
    try {
      const payload = {
        nome: nomeObra,
        quem_paga: quemPaga,
        banco_id: bancoId ? Number(bancoId) : null, // ✅ NOVO: Enviar banco_id
      };

      const response = await fetch(`${API_IP}/obras`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Erro ao salvar no banco");
      }

      toast.success("Obra criada com sucesso!");
      await fetchObras(); 
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Não foi possível adicionar a obra.");
    } finally {
      setLoadingObras(false);
    }
  };

  // --- 3. PUT: Atualizar Obra ---
  const handleUpdateObra = async (id, novoNome, novoQuemPaga, bancoId) => {
    try {
      const payload = {
        nome: novoNome,
        quem_paga: novoQuemPaga,
        banco_id: bancoId ? Number(bancoId) : null,
      };


      const response = await fetch(`${API_IP}/obras/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (!response.ok) throw new Error("Erro ao atualizar");

      toast.success("Obra atualizada!");
      await fetchObras();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao editar obra.");
    }
  };

  // --- 4. DELETE: Remover Obra ---
  const handleDeleteObra = async (id) => {
    try {
      const response = await fetch(`${API_IP}/obras/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Erro ao deletar");

      toast.success("Obra removida!");
      setObrasList((prev) => prev.filter((o) => o.id !== id));
    } catch (error) {
      console.error(error);
      toast.error("Erro ao excluir obra.");
    }
  };

  const obrasNamesForDropdown = obrasList.map((o) => o.nome);

  // --- FUNÇÕES PARA BANCOS ---
  // GET: Buscar Bancos
  const fetchBanks = async () => {
    setLoadingBanks(true);
    try {
      const response = await fetch(`${API_IP}/bancos`);
      if (!response.ok) throw new Error("Falha ao conectar com servidor");
      const data = await response.json();
      setBanksList(data);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar lista de bancos.");
    } finally {
      setLoadingBanks(false);
    }
  };

  // POST: Adicionar Banco
  const handleAddBank = async (nomeBanco) => {
    setLoadingBanks(true);
    try {
      const payload = { nome: nomeBanco };

      const response = await fetch(`${API_IP}/bancos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Erro ao salvar no banco");
      }

      toast.success("Banco criado com sucesso!");
      await fetchBanks();
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Não foi possível adicionar o banco.");
    } finally {
      setLoadingBanks(false);
    }
  };

  // PUT: Atualizar Banco
  const handleUpdateBank = async (id, novoNome) => {
    try {
      const payload = { nome: novoNome };

      const response = await fetch(`${API_IP}/bancos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Erro ao atualizar");

      toast.success("Banco atualizado!");
      await fetchBanks();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao editar banco.");
    }
  };

  // DELETE: Remover Banco
  const handleDeleteBank = async (id) => {
    try {
      const response = await fetch(`${API_IP}/bancos/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Erro ao deletar");

      toast.success("Banco removido!");
      setBanksList((prev) => prev.filter((b) => b.id !== id));
    } catch (error) {
      console.error(error);
      toast.error("Erro ao excluir banco.");
    }
  };

  // --- FUNÇÕES PARA FORNECEDORES ---
  // GET: Buscar Fornecedores
  const fetchFornecedores = async () => {
    setLoadingFornecedores(true);
    try {
      const response = await fetch(`${API_IP}/fornecedor`);
      if (!response.ok) throw new Error("Falha ao conectar com servidor");
      const data = await response.json();
      setFornecedoresList(data);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar lista de fornecedores.");
    } finally {
      setLoadingFornecedores(false);
    }
  };

  // POST: Adicionar Fornecedor
  const handleAddFornecedor = async (fornecedorData) => {
    setLoadingFornecedores(true);
    try {
      const response = await fetch(`${API_IP}/fornecedor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fornecedorData),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Erro ao salvar no banco");
      }

      toast.success("Fornecedor criado com sucesso!");
      await fetchFornecedores();
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Não foi possível adicionar o fornecedor.");
    } finally {
      setLoadingFornecedores(false);
    }
  };

  // PUT: Atualizar Fornecedor
  const handleUpdateFornecedor = async (id, fornecedorData) => {
    try {
      const response = await fetch(`${API_IP}/fornecedor/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fornecedorData),
      });

      if (!response.ok) throw new Error("Erro ao atualizar");

      toast.success("Fornecedor atualizado!");
      await fetchFornecedores();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao editar fornecedor.");
    }
  };

  // DELETE: Remover Fornecedor
  const handleDeleteFornecedor = async (id) => {
    try {
      const response = await fetch(`${API_IP}/fornecedor/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Erro ao deletar");

      toast.success("Fornecedor removido!");
      setFornecedoresList((prev) => prev.filter((f) => f.id !== id));
    } catch (error) {
      console.error(error);
      toast.error("Erro ao excluir fornecedor.");
    }
  };

  // --- FUNÇÕES PARA CATEGORIAS ---
  // GET: Buscar Categorias
  const fetchCategorias = async () => {
    setLoadingCategorias(true);
    try {
      const response = await fetch(`${API_IP}/categoria`);
      if (!response.ok) throw new Error("Falha ao conectar com servidor");
      const data = await response.json();
      setCategoriasList(data);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar lista de categorias.");
    } finally {
      setLoadingCategorias(false);
    }
  };

  // POST: Adicionar Categoria
  const handleAddCategoria = async (categoriaData) => {
    setLoadingCategorias(true);
    try {
      const response = await fetch(`${API_IP}/categoria`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(categoriaData),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Erro ao salvar no banco");
      }

      toast.success("Categoria criada com sucesso!");
      await fetchCategorias();
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Não foi possível adicionar a categoria.");
    } finally {
      setLoadingCategorias(false);
    }
  };

  // PUT: Atualizar Categoria
  const handleUpdateCategoria = async (id, categoriaData) => {
    try {
      const response = await fetch(`${API_IP}/categoria/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(categoriaData),
      });

      if (!response.ok) throw new Error("Erro ao atualizar");

      toast.success("Categoria atualizada!");
      await fetchCategorias();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao editar categoria.");
    }
  };

  // DELETE: Remover Categoria
  const handleDeleteCategoria = async (id) => {
    try {
      const response = await fetch(`${API_IP}/categoria/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Erro ao deletar");

      toast.success("Categoria removida!");
      setCategoriasList((prev) => prev.filter((c) => c.id !== id));
    } catch (error) {
      console.error(error);
      toast.error("Erro ao excluir categoria.");
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen font-sans text-slate-800">
      <Toaster position="top-right" />

      {/* HEADER - Sem o botão de voltar aqui */}

      <div className="p-6">
        <div className="max-w-6xl mx-auto">
        
        {/* --- MENU PRINCIPAL (Seleção de Gerenciadores) --- */}
        {currentTab === "menu" && (
          <div className="bg-white rounded-3xl shadow-2xl p-8 border border-blue-100">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
                  Gerenciamento do Sistema
                </h1>
                <p className="text-gray-600">
                  Selecione uma opção para começar
                </p>
              </div>
              <Link
                to="/dashboard"
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold"
              >
                <Home size={20} /> Voltar ao Dashboard
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              {/* --- CARD GERENCIAR OBRAS --- */}
              <button
                onClick={() => {
                  setCurrentTab("obras");
                  fetchObras();
                  fetchBanks(); // ✅ NOVO: Carrega também os bancos ao abrir a aba de obras
                }}
                className="h-48 bg-linear-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all p-6 flex flex-col items-center justify-center gap-4 text-white"
              >
                <Building2 size={48} className="text-blue-100" />
                <h2 className="text-2xl font-bold">Gerenciar Obras</h2>
                <p className="text-sm text-blue-100">
                  Adicionar, editar e remover obras
                </p>
              </button>

              {/* --- CARD GERENCIAR USUÁRIOS --- */}
              <button
                onClick={() => setCurrentTab("usuarios")}
                className="h-48 bg-linear-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all p-6 flex flex-col items-center justify-center gap-4 text-white"
              >
                <Users size={48} className="text-purple-100" />
                <h2 className="text-2xl font-bold">Gerenciar Usuários</h2>
                <p className="text-sm text-purple-100">
                  Criar usuários e vincular às obras
                </p>
              </button>

              {/* --- CARD GERENCIAR BANCOS --- */}
              <button
                onClick={() => {
                  setCurrentTab("bancos");
                  fetchBanks();
                }}
                className="h-48 bg-linear-to-br from-green-500 to-green-600 rounded-2xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all p-6 flex flex-col items-center justify-center gap-4 text-white"
              >
                <Landmark size={48} className="text-green-100" />
                <h2 className="text-2xl font-bold">Gerenciar Bancos</h2>
                <p className="text-sm text-green-100">
                  Cadastrar contas bancárias
                </p>
              </button>

              {/* --- CARD GERENCIAR FORNECEDORES --- */}
              <button
                onClick={() => {
                  setCurrentTab("fornecedores");
                  fetchFornecedores();
                  fetchBanks();
                }}
                className="h-48 bg-linear-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all p-6 flex flex-col items-center justify-center gap-4 text-white"
              >
                <Users2 size={48} className="text-orange-100" />
                <h2 className="text-2xl font-bold">Gerenciar Fornecedores</h2>
                <p className="text-sm text-orange-100">
                  Cadastrar e gerenciar fornecedores
                </p>
              </button>

              {/* --- CARD GERENCIAR CATEGORIAS --- */}
              <button
                onClick={() => {
                  setCurrentTab("categorias");
                  fetchCategorias();
                }}
                className="h-48 bg-linear-to-br from-green-500 to-green-600 rounded-2xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all p-6 flex flex-col items-center justify-center gap-4 text-white"
              >
                <Layers size={48} className="text-green-100" />
                <h2 className="text-2xl font-bold">Gerenciar Categorias</h2>
                <p className="text-sm text-green-100">
                  Cadastrar e gerenciar categorias
                </p>
              </button>
            </div>
          </div>
        )}

        {/* --- ABA GERENCIAR OBRAS --- */}
        {currentTab === "obras" && (
          <div className="bg-white rounded-3xl shadow-2xl p-8 border border-blue-100 space-y-6">
            <div className="flex items-center justify-between mb-6">
              <Link
                to="/dashboard"
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold"
              >
                <Home size={20} /> Voltar ao Dashboard
              </Link>
            </div>
            {/* Componente de Obras */}
            <ObrasManager
              obras={obrasList}
              isLoading={loadingObras}
              availableBanks={banksList}
              onAddObra={handleAddObra}
              onUpdateObra={handleUpdateObra}
              onRequestDeleteObra={handleDeleteObra}
            />
          </div>
        )}

        {/* --- ABA GERENCIAR USUÁRIOS --- */}
        {currentTab === "usuarios" && (
          <div className="bg-white rounded-3xl shadow-2xl p-8 border border-blue-100 space-y-6">
            <div className="flex items-center justify-between mb-6">
              <Link
                to="/dashboard"
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold"
              >
                <Home size={20} /> Voltar ao Dashboard
              </Link>
            </div>
            {/* Componente de Usuários */}
            <UserManager API_IP={API_IP} availableObras={obrasList} />
          </div>
        )}

        {/* --- ABA GERENCIAR BANCOS --- */}
        {currentTab === "bancos" && (
          <div className="bg-white rounded-3xl shadow-2xl p-8 border border-blue-100 space-y-6">
            <div className="flex items-center justify-between mb-6">
              <Link
                to="/dashboard"
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold"
              >
                <Home size={20} /> Voltar ao Dashboard
              </Link>
            </div>
            {/* Componente de Bancos */}
            <BanksManager
              banks={banksList}
              isLoading={loadingBanks}
              onAddBank={handleAddBank}
              onUpdateBank={handleUpdateBank}
              onDeleteBank={handleDeleteBank}
            />
          </div>
        )}

        {/* --- ABA GERENCIAR FORNECEDORES --- */}
        {currentTab === "fornecedores" && (
          <div className="bg-white rounded-3xl shadow-2xl p-8 border border-blue-100 space-y-6">
            <div className="flex items-center justify-between mb-6">
              <Link
                to="/dashboard"
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold"
              >
                <Home size={20} /> Voltar ao Dashboard
              </Link>
            </div>
            {/* Componente de Fornecedores */}
            <FornecedorManager
              fornecedores={fornecedoresList}
              isLoading={loadingFornecedores}
              availableBanks={banksList}
              onAddFornecedor={handleAddFornecedor}
              onUpdateFornecedor={handleUpdateFornecedor}
              onDeleteFornecedor={handleDeleteFornecedor}
            />
          </div>
        )}

        {/* --- ABA GERENCIAR CATEGORIAS --- */}
        {currentTab === "categorias" && (
          <div className="bg-white rounded-3xl shadow-2xl p-8 border border-blue-100 space-y-6">
            <div className="flex items-center justify-between mb-6">
              <Link
                to="/dashboard"
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold"
              >
                <Home size={20} /> Voltar ao Dashboard
              </Link>
            </div>
            {/* Componente de Categorias */}
            <CategoriaManager
              categorias={categoriasList}
              isLoading={loadingCategorias}
              onAddCategoria={handleAddCategoria}
              onUpdateCategoria={handleUpdateCategoria}
              onDeleteCategoria={handleDeleteCategoria}
            />
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
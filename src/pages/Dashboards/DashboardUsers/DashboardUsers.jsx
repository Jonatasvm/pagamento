import React, { useState, useEffect } from "react";
import { Toaster, toast } from "react-hot-toast";
import { ObrasManager } from "./ObrasManager"; // Ajuste o caminho se necessário
import { UserManager } from "./UsersManager"; // Ajuste o caminho se necessário

const API_IP = "http://127.0.0.1:5631";

export default function DashboardUsers() {
  const [obrasList, setObrasList] = useState([]);
  const [loadingObras, setLoadingObras] = useState(false);

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
  }, []);

  // --- 2. POST: Adicionar Obra ---
  // ATUALIZADO: Agora recebe nome e quemPaga
  const handleAddObra = async (nomeObra, quemPaga) => {
    setLoadingObras(true);
    try {
      const payload = {
        nome: nomeObra,
        quem_paga: quemPaga, // Enviando para o backend (snake_case)
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
      await fetchObras(); // Recarrega a lista atualizada do servidor
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Não foi possível adicionar a obra.");
    } finally {
      setLoadingObras(false);
    }
  };

  // --- 3. PUT: Atualizar Obra ---
  // ATUALIZADO: Agora recebe id, nome e quemPaga
  const handleUpdateObra = async (id, novoNome, novoQuemPaga) => {
    try {
      const payload = {
        nome: novoNome,
        quem_paga: novoQuemPaga,
      };

      const response = await fetch(`${API_IP}/obras/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

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
      // Atualização local para ser mais rápido
      setObrasList((prev) => prev.filter((o) => o.id !== id));
    } catch (error) {
      console.error(error);
      toast.error("Erro ao excluir obra.");
    }
  };

  // Preparar lista de nomes para o UserManager (Dropdown)
  const obrasNamesForDropdown = obrasList.map((o) => o.nome);

  return (
    <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen font-sans text-slate-800">
      <Toaster position="top-right" />

      <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-2xl p-8 border border-blue-100 space-y-12">
        {/* Componente de Obras: Recebe dados e passa funções de controle */}
        <ObrasManager
          obras={obrasList}
          isLoading={loadingObras}
          onAddObra={handleAddObra}
          onUpdateObra={handleUpdateObra}
          onRequestDeleteObra={handleDeleteObra}
        />

        <hr className="border-gray-200" />

        {/* Componente de Usuários */}
        <UserManager API_IP={API_IP} availableObras={obrasNamesForDropdown} />
      </div>
    </div>
  );
}

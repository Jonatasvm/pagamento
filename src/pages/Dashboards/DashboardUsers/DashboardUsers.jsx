import React, { useState, useEffect } from "react";
import { Toaster, toast } from "react-hot-toast";
import { ObrasManager } from "./ObrasManager"; // Ajuste o caminho se necessário
import { UserManager } from "./UsersManager"; // Ajuste o caminho se necessário

const API_IP = "http://91.98.132.210:5631";

// Função auxiliar para obter o Token e os Headers
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json' // Para POST e PUT
  };
};

export default function DashboardUsers() {
  const [obrasList, setObrasList] = useState([]);
  const [loadingObras, setLoadingObras] = useState(false);

  // --- 1. GET: Buscar Obras (CORRIGIDO) ---
  const fetchObras = async () => {
    setLoadingObras(true);
    try {
      const response = await fetch(`${API_IP}/obras`, {
        headers: getAuthHeaders(), // <--- ADICIONADO AUTORIZAÇÃO
      });
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

  // --- 2. POST: Adicionar Obra (CORRIGIDO) ---
  const handleAddObra = async (nomeObra, quemPaga) => {
    setLoadingObras(true);
    try {
      const response = await fetch(`${API_IP}/obras`, {
        method: "POST",
        headers: getAuthHeaders(), // <--- ADICIONADO AUTORIZAÇÃO
        body: JSON.stringify({
          nome: nomeObra,
          quem_paga: quemPaga
        }),
      });

      if (response.status === 409) {
        toast.error("Obra já existe.");
        return;
      }
      if (!response.ok) throw new Error("Erro ao adicionar");

      const novaObra = await response.json();
      toast.success("Obra adicionada!");
      setObrasList((prev) => [...prev, novaObra]);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao adicionar obra.");
    } finally {
      setLoadingObras(false);
    }
  };

  // --- 3. PUT: Editar Obra (CORRIGIDO) ---
  const handleEditObra = async (id, nomeObra, quemPaga) => {
    try {
      const response = await fetch(`${API_IP}/obras/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(), // <--- ADICIONADO AUTORIZAÇÃO
        body: JSON.stringify({
          nome: nomeObra,
          quem_paga: quemPaga
        }),
      });

      if (!response.ok) throw new Error("Erro ao editar");

      const obraAtualizada = await response.json();
      toast.success("Obra editada!");
      // Atualização local para ser mais rápido
      setObrasList((prev) =>
        prev.map((o) => (o.id === id ? obraAtualizada : o))
      );
    } catch (error) {
      console.error(error);
      toast.error("Erro ao editar obra.");
    }
  };

  // --- 4. DELETE: Remover Obra (CORRIGIDO) ---
  const handleDeleteObra = async (id) => {
    try {
      const response = await fetch(`${API_IP}/obras/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(), // <--- ADICIONADO AUTORIZAÇÃO
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
          loading={loadingObras}
          handleAdd={handleAddObra}
          handleEdit={handleEditObra}
          handleDelete={handleDeleteObra}
        />

        {/* Componente de Usuários: Assumimos que ele está sendo renderizado abaixo */}
        <UserManager obrasNames={obrasNamesForDropdown} />
      </div>
    </div>
  );
}
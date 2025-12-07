import React, { useState, useEffect } from "react";
import { Toaster, toast } from "react-hot-toast";
// IMPORTANTE: Certifique-se que o ObrasManager é exportado como 'export const ObrasManager'
// Se estiver usando 'export default', tire as chaves { } do import abaixo.
import { ObrasManager } from "./ObrasManager"; 
import { UserManager } from "./UsersManager"; 

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
  // Esta é a função que o ObrasManager está reclamando que não existe.
  const handleAddObra = async (nomeObra, quemPaga) => {
    console.log("Tentando adicionar obra:", nomeObra, quemPaga); // Debug
    setLoadingObras(true);
    try {
      const payload = {
        nome: nomeObra,
        quem_paga: quemPaga,
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
      setObrasList((prev) => prev.filter((o) => o.id !== id));
    } catch (error) {
      console.error(error);
      toast.error("Erro ao excluir obra.");
    }
  };

  const obrasNamesForDropdown = obrasList.map((o) => o.nome);

  return (
    <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen font-sans text-slate-800">
      <Toaster position="top-right" />

      <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-2xl p-8 border border-blue-100 space-y-12">
        
        {/* AQUI ESTAVA O PROBLEMA POTENCIAL */}
        {/* Estamos passando explicitamente a função handleAddObra para a prop onAddObra */}
        <ObrasManager
          obras={obrasList}
          isLoading={loadingObras}
          onAddObra={handleAddObra}       // <--- Verifique se esta linha existe e está colorida no seu editor
          onUpdateObra={handleUpdateObra}
          onRequestDeleteObra={handleDeleteObra}
        />

        <hr className="border-gray-200" />

        <UserManager API_IP={API_IP} availableObras={obrasNamesForDropdown} />
      </div>
    </div>
  );
}
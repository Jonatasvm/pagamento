import React, { useState, useEffect } from "react";
import { Edit, Trash2, Save, X, Plus, Layers } from "lucide-react";
import { toast } from "react-hot-toast";

export const CategoriaManager = ({
  categorias,
  isLoading,
  onAddCategoria,
  onUpdateCategoria,
  onDeleteCategoria,
}) => {
  const [newCategoriaData, setNewCategoriaData] = useState({
    nome: "",
    descricao: "",
  });

  const [editingCategoriaId, setEditingCategoriaId] = useState(null);
  const [editedData, setEditedData] = useState({
    nome: "",
    descricao: "",
  });

  const checkCategoriaExists = (nome, excludeId = null) => {
    if (!categorias) return false;
    const nomeLimpo = nome.trim().toLowerCase();
    return categorias.some((c) => {
      if (excludeId && c.id === excludeId) return false;
      return c.nome.trim().toLowerCase() === nomeLimpo;
    });
  };

  const handleNewCategoriaChange = (field, value) => {
    setNewCategoriaData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddClick = () => {
    const nome = newCategoriaData.nome.trim();
    const descricao = newCategoriaData.descricao.trim();

    if (!nome) {
      toast.error("Preencha o nome da categoria.");
      return;
    }

    if (checkCategoriaExists(nome)) {
      toast.error("Categoria com este nome já existe!");
      return;
    }

    onAddCategoria({
      nome: nome,
      descricao: descricao || null,
    });

    setNewCategoriaData({
      nome: "",
      descricao: "",
    });
  };

  const handleStartEdit = (categoria) => {
    setEditingCategoriaId(categoria.id);
    setEditedData({
      nome: categoria.nome,
      descricao: categoria.descricao || "",
    });
  };

  const handleEditChange = (field, value) => {
    setEditedData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveClick = (id) => {
    const nome = editedData.nome.trim();

    if (!nome) {
      toast.error("Preencha o nome da categoria.");
      return;
    }

    if (checkCategoriaExists(nome, id)) {
      toast.error("Já existe outra categoria com este nome!");
      return;
    }

    onUpdateCategoria(id, {
      nome: nome,
      descricao: editedData.descricao.trim() || null,
    });

    setEditingCategoriaId(null);
  };

  const handleDeleteClick = (id) => {
    if (window.confirm("Tem certeza que deseja excluir esta categoria?")) {
      onDeleteCategoria(id);
    }
  };

  return (
    <section>
      <h1 className="text-3xl font-extrabold text-pink-700 mb-8 border-b pb-2 flex items-center gap-2">
        <Layers size={28} className="text-pink-500" /> Gerenciar Categorias
      </h1>

      {/* --- Inputs de Adicionar --- */}
      <div className="mb-8 p-4 bg-gray-50 rounded-xl border border-gray-200 shadow-inner space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500 font-semibold mb-1 block">
              Nome da Categoria <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newCategoriaData.nome}
              onChange={(e) =>
                handleNewCategoriaChange("nome", e.target.value)
              }
              placeholder="Ex: Material de Construção"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm outline-none focus:border-green-500 focus:ring-1 transition"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 font-semibold mb-1 block">
              Descrição (Opcional)
            </label>
            <input
              type="text"
              value={newCategoriaData.descricao}
              onChange={(e) =>
                handleNewCategoriaChange("descricao", e.target.value)
              }
              placeholder="Ex: Materiais usados na construção"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm outline-none focus:border-green-500 focus:ring-1 transition"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleAddClick}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-6 py-2 h-[42px] text-sm font-semibold rounded-lg text-white bg-pink-600 hover:bg-pink-700 transition shadow-md disabled:opacity-50"
          >
            <Plus size={18} /> {isLoading ? "..." : "Adicionar"}
          </button>
        </div>
      </div>

      {/* --- Tabela --- */}
      <div className="overflow-x-auto rounded-xl shadow-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-pink-500">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase">
                Nome
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase">
                Descrição
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-white uppercase">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {isLoading && (!categorias || categorias.length === 0) ? (
              <tr>
                <td colSpan="3" className="p-6 text-center text-gray-500">
                  Carregando dados...
                </td>
              </tr>
            ) : !categorias || categorias.length === 0 ? (
              <tr>
                <td colSpan="3" className="p-6 text-center text-gray-500 italic">
                  Nenhuma categoria cadastrada. Comece adicionando uma nova.
                </td>
              </tr>
            ) : (
              categorias.map((categoria) => (
                <tr
                  key={categoria.id}
                  className="hover:bg-pink-50 transition duration-150"
                >
                  <td className="px-6 py-3 text-sm font-medium text-gray-900 align-middle">
                    {editingCategoriaId === categoria.id ? (
                      <input
                        type="text"
                        value={editedData.nome}
                        onChange={(e) =>
                          handleEditChange("nome", e.target.value)
                        }
                        className="border border-pink-400 rounded px-3 py-1 w-full outline-none"
                        autoFocus
                      />
                    ) : (
                      categoria.nome
                    )}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-700 align-middle">
                    {editingCategoriaId === categoria.id ? (
                      <input
                        type="text"
                        value={editedData.descricao}
                        onChange={(e) =>
                          handleEditChange("descricao", e.target.value)
                        }
                        className="border border-pink-400 rounded px-3 py-1 w-full outline-none"
                      />
                    ) : (
                      categoria.descricao || "-"
                    )}
                  </td>
                  <td className="px-6 py-3 text-right align-middle">
                    <div className="flex gap-2 justify-end">
                      {editingCategoriaId === categoria.id ? (
                        <>
                          <button
                            onClick={() => handleSaveClick(categoria.id)}
                            className="p-2 rounded-full bg-pink-500 text-white hover:bg-pink-600"
                          >
                            <Save size={16} />
                          </button>
                          <button
                            onClick={() => setEditingCategoriaId(null)}
                            className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600"
                          >
                            <X size={16} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleStartEdit(categoria)}
                            className="p-2 rounded-full text-pink-600 hover:bg-pink-100"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(categoria.id)}
                            className="p-2 rounded-full text-red-600 hover:bg-red-100"
                          >
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

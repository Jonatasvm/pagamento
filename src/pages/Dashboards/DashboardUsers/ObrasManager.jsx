import React, { useState } from "react";
import { Edit, Trash2, Save, X, Plus, Zap } from "lucide-react";
import { toast } from "react-hot-toast";

export const ObrasManager = ({
  obras, // Lista vinda do Pai
  isLoading, // Status de loading vindo do Pai
  onAddObra, // Função do Pai para criar (espera: nome, quemPaga)
  onUpdateObra, // Função do Pai para editar (espera: id, nome, quemPaga)
  onRequestDeleteObra, // Função do Pai para deletar
}) => {
  // --- Estados Locais ---
  const [newObraName, setNewObraName] = useState("");
  const [newQuemPaga, setNewQuemPaga] = useState(""); // NOVO ESTADO

  const [editingObraId, setEditingObraId] = useState(null);
  const [editedObraName, setEditedObraName] = useState("");
  const [editedQuemPaga, setEditedQuemPaga] = useState(""); // NOVO ESTADO

  // --- Auxiliar: Checar duplicidade na lista recebida ---
  const checkNameExists = (name, excludeId = null) => {
    const normalizedName = name.trim().toLowerCase();
    return obras.some((obra) => {
      if (excludeId && obra.id === excludeId) return false;
      return obra.nome.trim().toLowerCase() === normalizedName;
    });
  };

  // --- Handler: Adicionar ---
  const handleAddClick = () => {
    const trimmedName = newObraName.trim();
    const trimmedQuemPaga = newQuemPaga.trim();

    if (!trimmedName) {
      toast.error("O nome da Obra não pode ser vazio.");
      return;
    }

    if (!trimmedQuemPaga) {
      toast.error("O campo 'Quem Paga' é obrigatório.");
      return;
    }

    if (checkNameExists(trimmedName)) {
      toast.error("Já existe uma obra com este nome!");
      return;
    }

    // Passa NOME e QUEM PAGA para o Pai
    onAddObra(trimmedName, trimmedQuemPaga);

    // Limpa inputs
    setNewObraName("");
    setNewQuemPaga("");
  };

  // --- Handler: Iniciar Edição ---
  const handleStartEdit = (id, name, quemPaga) => {
    setEditingObraId(id);
    setEditedObraName(name);
    setEditedQuemPaga(quemPaga || ""); // Preenche com valor atual ou vazio
  };

  // --- Handler: Salvar Edição ---
  const handleSaveClick = (id) => {
    const trimmedName = editedObraName.trim();
    const trimmedQuemPaga = editedQuemPaga.trim();

    if (!trimmedName || !trimmedQuemPaga) {
      toast.error("Todos os campos são obrigatórios.");
      return;
    }

    if (checkNameExists(trimmedName, id)) {
      toast.error("Já existe outra obra com este nome!");
      return;
    }

    // Passa os dados atualizados para o Pai
    onUpdateObra(id, trimmedName, trimmedQuemPaga);

    // Encerra modo de edição
    setEditingObraId(null);
    setEditedObraName("");
    setEditedQuemPaga("");
  };

  // --- Handler: Deletar ---
  const handleDeleteClick = (id) => {
    if (window.confirm("Tem certeza que deseja excluir esta obra?")) {
      onRequestDeleteObra(id);
    }
  };

  return (
    <section>
      <h1 className="text-3xl font-extrabold text-blue-700 mb-8 border-b pb-2 flex items-center gap-2">
        <Zap size={28} className="text-blue-500" /> Gestão de Obras Disponíveis
      </h1>

      {/* --- Área de Adicionar (Inputs) --- */}
      <div className="flex flex-col md:flex-row gap-4 mb-8 p-4 bg-gray-50 rounded-xl border border-gray-200 shadow-inner items-end md:items-end">
        {/* Input Nome */}
        <div className="flex-1">
          <label className="text-xs text-gray-500 font-semibold mb-1 block">
            Nome da Obra
          </label>
          <input
            type="text"
            value={newObraName}
            onChange={(e) => setNewObraName(e.target.value)}
            placeholder="Ex: Residencial Flores"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
          />
        </div>

        {/* Input Quem Paga */}
        <div className="flex-1">
          <label className="text-xs text-gray-500 font-semibold mb-1 block">
            Quem Paga
          </label>
          <input
            type="text"
            value={newQuemPaga}
            onChange={(e) => setNewQuemPaga(e.target.value)}
            placeholder="Ex: Construtora XYZ"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
            onKeyPress={(e) => e.key === "Enter" && handleAddClick()}
          />
        </div>

        {/* Botão */}
        <div className="flex-shrink-0">
          <button
            onClick={handleAddClick}
            disabled={isLoading}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2 h-[42px] text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition shadow-md disabled:opacity-50"
          >
            <Plus size={18} /> {isLoading ? "..." : "Adicionar"}
          </button>
        </div>
      </div>

      {/* --- Tabela de Obras --- */}
      <div className="overflow-hidden rounded-xl shadow-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-blue-500">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider w-2/5">
                Nome da Obra
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider w-2/5">
                Quem Paga
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {isLoading && obras.length === 0 ? (
              <tr>
                <td colSpan="3" className="p-6 text-center text-gray-500">
                  Carregando dados...
                </td>
              </tr>
            ) : obras.length === 0 ? (
              <tr>
                <td
                  colSpan="3"
                  className="p-6 text-center text-gray-500 italic"
                >
                  Nenhuma obra disponível.
                </td>
              </tr>
            ) : (
              obras.map((obra) => (
                <tr
                  key={obra.id}
                  className="hover:bg-blue-50 transition duration-150 group"
                >
                  {/* Coluna Nome */}
                  <td className="px-6 py-3 text-sm font-medium text-gray-900 align-middle">
                    {editingObraId === obra.id ? (
                      <input
                        type="text"
                        value={editedObraName}
                        onChange={(e) => setEditedObraName(e.target.value)}
                        className="border border-blue-400 rounded px-3 py-1 w-full focus:ring-2 focus:ring-blue-500 outline-none"
                        autoFocus
                      />
                    ) : (
                      <span className="text-gray-800">{obra.nome}</span>
                    )}
                  </td>

                  {/* Coluna Quem Paga */}
                  <td className="px-6 py-3 text-sm text-gray-600 align-middle">
                    {editingObraId === obra.id ? (
                      <input
                        type="text"
                        value={editedQuemPaga}
                        onChange={(e) => setEditedQuemPaga(e.target.value)}
                        className="border border-blue-400 rounded px-3 py-1 w-full focus:ring-2 focus:ring-blue-500 outline-none"
                        onKeyPress={(e) =>
                          e.key === "Enter" && handleSaveClick(obra.id)
                        }
                      />
                    ) : (
                      <span className="text-gray-600">
                        {obra.quem_paga || "-"}
                      </span>
                    )}
                  </td>

                  {/* Coluna Ações */}
                  <td className="px-6 py-3 text-right align-middle">
                    <div className="flex gap-2 justify-end">
                      {editingObraId === obra.id ? (
                        <>
                          <button
                            onClick={() => handleSaveClick(obra.id)}
                            title="Salvar"
                            className="p-2 rounded-full bg-green-500 text-white hover:bg-green-600 transition shadow-sm"
                          >
                            <Save size={16} />
                          </button>
                          <button
                            onClick={() => setEditingObraId(null)}
                            title="Cancelar"
                            className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition shadow-sm"
                          >
                            <X size={16} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() =>
                              handleStartEdit(
                                obra.id,
                                obra.nome,
                                obra.quem_paga
                              )
                            }
                            title="Editar"
                            className="p-2 rounded-full text-blue-600 hover:bg-blue-100 transition"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(obra.id)}
                            title="Excluir"
                            className="p-2 rounded-full text-red-600 hover:bg-red-100 transition"
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

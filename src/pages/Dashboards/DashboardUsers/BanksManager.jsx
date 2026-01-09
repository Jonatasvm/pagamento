import React, { useState, useEffect } from "react";
import { Edit, Trash2, Save, X, Plus, Building2 } from "lucide-react";
import { toast } from "react-hot-toast";

export const BanksManager = ({
  banks,
  isLoading,
  onAddBank,
  onUpdateBank,
  onDeleteBank,
}) => {
  const [newBankName, setNewBankName] = useState("");
  const [editingBankId, setEditingBankId] = useState(null);
  const [editedBankName, setEditedBankName] = useState("");

  const checkNameExists = (name, excludeId = null) => {
    if (!banks) return false;
    const normalizedName = name.trim().toLowerCase();
    return banks.some((bank) => {
      if (excludeId && bank.id === excludeId) return false;
      return bank.nome.trim().toLowerCase() === normalizedName;
    });
  };

  const handleAddClick = () => {
    const trimmedName = newBankName.trim();

    if (!trimmedName) {
      toast.error("O nome do banco não pode ser vazio.");
      return;
    }
    if (checkNameExists(trimmedName)) {
      toast.error("Já existe um banco com este nome!");
      return;
    }

    onAddBank(trimmedName);
    setNewBankName("");
  };

  const handleStartEdit = (id, name) => {
    setEditingBankId(id);
    setEditedBankName(name);
  };

  const handleSaveClick = (id) => {
    const trimmedName = editedBankName.trim();

    if (!trimmedName) {
      toast.error("O nome do banco não pode ser vazio.");
      return;
    }
    if (checkNameExists(trimmedName, id)) {
      toast.error("Já existe outro banco com este nome!");
      return;
    }

    onUpdateBank(id, trimmedName);
    setEditingBankId(null);
    setEditedBankName("");
  };

  const handleDeleteClick = (id) => {
    if (window.confirm("Tem certeza que deseja excluir este banco?")) {
      onDeleteBank(id);
    }
  };

  return (
    <section>
      <h1 className="text-3xl font-extrabold text-green-700 mb-8 border-b pb-2 flex items-center gap-2">
        <Building2 size={28} className="text-green-500" /> Gerenciar Contas Bancárias
      </h1>

      {/* --- Inputs de Adicionar --- */}
      <div className="flex flex-col md:flex-row gap-4 mb-8 p-4 bg-gray-50 rounded-xl border border-gray-200 shadow-inner items-end">
        <div className="flex-1 w-full">
          <label className="text-xs text-gray-500 font-semibold mb-1 block">
            Nome do Banco
          </label>
          <input
            type="text"
            value={newBankName}
            onChange={(e) => setNewBankName(e.target.value)}
            placeholder="Ex: Banco do Brasil, Caixa, Itaú"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm outline-none focus:border-green-500 focus:ring-1 transition"
            onKeyPress={(e) => e.key === "Enter" && handleAddClick()}
          />
        </div>
        <div className="shrink-0 w-full md:w-auto">
          <button
            onClick={handleAddClick}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 px-6 py-2 h-[42px] text-sm font-semibold rounded-lg text-white bg-green-600 hover:bg-green-700 transition shadow-md disabled:opacity-50"
          >
            <Plus size={18} /> {isLoading ? "..." : "Adicionar"}
          </button>
        </div>
      </div>

      {/* --- Tabela --- */}
      <div className="overflow-x-auto rounded-xl shadow-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-green-500">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase w-full">
                Nome do Banco
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-white uppercase">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {isLoading && (!banks || banks.length === 0) ? (
              <tr>
                <td colSpan="2" className="p-6 text-center text-gray-500">
                  Carregando dados...
                </td>
              </tr>
            ) : !banks || banks.length === 0 ? (
              <tr>
                <td colSpan="2" className="p-6 text-center text-gray-500 italic">
                  Nenhum banco cadastrado. Comece adicionando um novo banco.
                </td>
              </tr>
            ) : (
              banks.map((bank) => (
                <tr
                  key={bank.id}
                  className="hover:bg-green-50 transition duration-150"
                >
                  <td className="px-6 py-3 text-sm font-medium text-gray-900 align-middle">
                    {editingBankId === bank.id ? (
                      <input
                        type="text"
                        value={editedBankName}
                        onChange={(e) => setEditedBankName(e.target.value)}
                        className="border border-green-400 rounded px-3 py-1 w-full outline-none"
                        autoFocus
                      />
                    ) : (
                      bank.nome
                    )}
                  </td>
                  <td className="px-6 py-3 text-right align-middle">
                    <div className="flex gap-2 justify-end">
                      {editingBankId === bank.id ? (
                        <>
                          <button
                            onClick={() => handleSaveClick(bank.id)}
                            className="p-2 rounded-full bg-green-500 text-white hover:bg-green-600"
                          >
                            <Save size={16} />
                          </button>
                          <button
                            onClick={() => setEditingBankId(null)}
                            className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600"
                          >
                            <X size={16} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleStartEdit(bank.id, bank.nome)}
                            className="p-2 rounded-full text-green-600 hover:bg-green-100"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(bank.id)}
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

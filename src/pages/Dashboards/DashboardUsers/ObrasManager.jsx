import React, { useState, useMemo, useRef, useEffect } from "react";
import { Edit, Trash2, Save, X, Plus, Zap, Search, ChevronDown, CheckSquare, Square } from "lucide-react";
import { toast } from "react-hot-toast";

// CORREÇÃO AQUI: As chaves { } garantem que as props sejam lidas corretamente
export const ObrasManager = ({
  obras,
  isLoading,
  availableBanks,
  availableUsers = [],
  onAddObra,
  onUpdateObra,
  onRequestDeleteObra,
}) => {
  const [newObraName, setNewObraName] = useState("");
  const [newBankId, setNewBankId] = useState("");
  const [newSelectedUsers, setNewSelectedUsers] = useState([]);
  const [newUserDropdownOpen, setNewUserDropdownOpen] = useState(false);
  const [newUserSearch, setNewUserSearch] = useState("");
  const newUserDropdownRef = useRef(null);

  const [editingObraId, setEditingObraId] = useState(null);
  const [editedObraName, setEditedObraName] = useState("");
  const [editedBankId, setEditedBankId] = useState("");
  const [editSelectedUsers, setEditSelectedUsers] = useState([]);
  const [editUserDropdownOpen, setEditUserDropdownOpen] = useState(false);
  const [editUserSearch, setEditUserSearch] = useState("");
  const editUserDropdownRef = useRef(null);

  // ✅ NOVO: Estado para busca
  const [searchTerm, setSearchTerm] = useState("");

  // Fechar dropdowns ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (newUserDropdownRef.current && !newUserDropdownRef.current.contains(e.target)) {
        setNewUserDropdownOpen(false);
      }
      if (editUserDropdownRef.current && !editUserDropdownRef.current.contains(e.target)) {
        setEditUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Lista de usuários ordenada e filtrada
  const getFilteredUsers = (search) => {
    const sorted = [...(availableUsers || [])].sort((a, b) =>
      (a.nome || a.username || "").localeCompare(b.nome || b.username || "", "pt-BR")
    );
    if (!search.trim()) return sorted;
    const termo = search.toLowerCase().trim();
    return sorted.filter(
      (u) =>
        (u.nome || "").toLowerCase().includes(termo) ||
        (u.username || "").toLowerCase().includes(termo)
    );
  };

  const toggleUser = (userId, selectedUsers, setSelectedUsers) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const selectAllUsers = (filteredUsers, selectedUsers, setSelectedUsers) => {
    const allIds = filteredUsers.map((u) => u.user_id || u.id);
    const allSelected = allIds.every((id) => selectedUsers.includes(id));
    if (allSelected) {
      setSelectedUsers((prev) => prev.filter((id) => !allIds.includes(id)));
    } else {
      setSelectedUsers((prev) => [...new Set([...prev, ...allIds])]);
    }
  };

  // Componente de multi-select de usuários reutilizável
  const UserMultiSelect = ({ selectedUsers, setSelectedUsers, isOpen, setIsOpen, search, setSearch, dropdownRef }) => {
    const filtered = getFilteredUsers(search);
    const allIds = filtered.map((u) => u.user_id || u.id);
    const allSelected = allIds.length > 0 && allIds.every((id) => selectedUsers.includes(id));

    return (
      <div ref={dropdownRef} className="relative w-full">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 transition flex items-center justify-between bg-white"
        >
          <span className={selectedUsers.length === 0 ? "text-gray-400" : "text-gray-700"}>
            {selectedUsers.length === 0
              ? "-- Selecione funcionários --"
              : `${selectedUsers.length} funcionário(s) selecionado(s)`}
          </span>
          <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {isOpen && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-xl max-h-60 overflow-hidden">
            {/* Campo de busca */}
            <div className="p-2 border-b border-gray-200">
              <div className="relative">
                <Search size={14} className="absolute left-2 top-2.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar funcionário..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-7 pr-3 py-1.5 border border-gray-200 rounded text-sm outline-none focus:border-blue-400"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>

            {/* Selecionar todos */}
            <div
              onClick={() => selectAllUsers(filtered, selectedUsers, setSelectedUsers)}
              className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-blue-50 border-b border-gray-100 text-xs font-semibold text-blue-600"
            >
              {allSelected ? <CheckSquare size={14} /> : <Square size={14} />}
              {allSelected ? "Desmarcar todos" : "Selecionar todos"}
            </div>

            {/* Lista de usuários */}
            <div className="max-h-40 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-400 italic">Nenhum funcionário encontrado</div>
              ) : (
                filtered.map((user) => {
                  const uid = user.user_id || user.id;
                  const isChecked = selectedUsers.includes(uid);
                  return (
                    <div
                      key={uid}
                      onClick={() => toggleUser(uid, selectedUsers, setSelectedUsers)}
                      className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50 text-sm ${isChecked ? "bg-blue-50" : ""}`}
                    >
                      {isChecked ? <CheckSquare size={14} className="text-blue-600" /> : <Square size={14} className="text-gray-400" />}
                      <span className="font-medium">{user.nome || user.username}</span>
                      {user.nome && user.username && (
                        <span className="text-xs text-gray-400">({user.username})</span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ✅ NOVO: Filtrar obras por busca (reativo)
  const obrasFiltradas = useMemo(() => {
    if (!obras || obras.length === 0) return [];
    const sorted = [...obras].sort((a, b) => (a.nome || "").localeCompare(b.nome || "", "pt-BR"));
    if (!searchTerm.trim()) return sorted;
    const termo = searchTerm.toLowerCase().trim();
    const palavras = termo.split(/\s+/).filter(p => p.length > 0);
    return sorted.filter((obra) => {
      const nome = (obra.nome || "").toLowerCase();
      const banco = (obra.quem_paga || "").toLowerCase();
      return palavras.every(p => nome.includes(p) || banco.includes(p));
    });
  }, [obras, searchTerm]);

  const checkNameExists = (name, excludeId = null) => {
    if (!obras) return false;
    const normalizedName = name.trim().toLowerCase();
    return obras.some((obra) => {
      if (excludeId && obra.id === excludeId) return false;
      return obra.nome.trim().toLowerCase() === normalizedName;
    });
  };

  const handleAddClick = () => {
    // PROTEÇÃO EXTRA: Verifica se a função existe antes de chamar
    if (typeof onAddObra !== "function") {
      console.error("ERRO CRÍTICO: onAddObra não é uma função.", onAddObra);
      toast.error("Erro interno: Função de adicionar não encontrada.");
      return;
    }

    const trimmedName = newObraName.trim();

    if (!trimmedName) {
      toast.error("O nome da Obra não pode ser vazio.");
      return;
    }
    if (!newBankId) {
      toast.error("Selecione um banco.");
      return;
    }
    if (checkNameExists(trimmedName)) {
      toast.error("Já existe uma obra com este nome!");
      return;
    }

    // Encontra o banco selecionado para obter o nome
    const selectedBank = availableBanks.find((b) => b.id === parseInt(newBankId));
    if (!selectedBank) {
      toast.error("Banco inválido.");
      return;
    }

    // Chama a função do Pai com o nome do banco e o ID
    onAddObra(trimmedName, selectedBank.nome, selectedBank.id, newSelectedUsers);

    setNewObraName("");
    setNewBankId("");
    setNewSelectedUsers([]);
    setNewUserSearch("");
  };

  const handleStartEdit = (id, name, bankId) => {
    setEditingObraId(id);
    setEditedObraName(name);
    setEditedBankId(bankId || "");
    // Carrega os usuários vinculados à obra
    const obra = obras.find((o) => o.id === id);
    setEditSelectedUsers(obra?.user_ids || []);
    setEditUserSearch("");
  };

  const handleSaveClick = (id) => {
    const trimmedName = editedObraName.trim();

    if (!trimmedName) {
      toast.error("O nome da Obra não pode ser vazio.");
      return;
    }
    if (!editedBankId) {
      toast.error("Selecione um banco.");
      return;
    }
    if (checkNameExists(trimmedName, id)) {
      toast.error("Já existe outra obra com este nome!");
      return;
    }

    // Encontra o banco selecionado para obter o nome
    const selectedBank = availableBanks.find((b) => b.id === parseInt(editedBankId));
    if (!selectedBank) {
      toast.error("Banco inválido.");
      return;
    }

    onUpdateObra(id, trimmedName, selectedBank.nome, selectedBank.id, editSelectedUsers);
    setEditingObraId(null);
    setEditedObraName("");
    setEditedBankId("");
    setEditSelectedUsers([]);
    setEditUserSearch("");
  };

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

      {/* --- Inputs de Adicionar --- */}
      <div className="flex flex-col md:flex-row gap-4 mb-8 p-4 bg-gray-50 rounded-xl border border-gray-200 shadow-inner items-end">
        <div className="flex-1 w-full">
          <label className="text-xs text-gray-500 font-semibold mb-1 block">
            Nome da Obra
          </label>
          <input
            type="text"
            value={newObraName}
            onChange={(e) => setNewObraName(e.target.value)}
            placeholder="Ex: Residencial Flores"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 transition"
          />
        </div>
        <div className="flex-1 w-full">
          <label className="text-xs text-gray-500 font-semibold mb-1 block">
            Conta Bancária
          </label>
          <select
            value={newBankId}
            onChange={(e) => setNewBankId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 transition"
          >
            <option value="">-- Selecione um banco --</option>
            {availableBanks && availableBanks.length > 0 ? (
              availableBanks.map((bank) => (
                <option key={bank.id} value={bank.id}>
                  {bank.nome}
                </option>
              ))
            ) : (
              <option disabled>Nenhum banco disponível</option>
            )}
          </select>
        </div>
        <div className="flex-1 w-full">
          <label className="text-xs text-gray-500 font-semibold mb-1 block">
            Funcionários
          </label>
          <UserMultiSelect
            selectedUsers={newSelectedUsers}
            setSelectedUsers={setNewSelectedUsers}
            isOpen={newUserDropdownOpen}
            setIsOpen={setNewUserDropdownOpen}
            search={newUserSearch}
            setSearch={setNewUserSearch}
            dropdownRef={newUserDropdownRef}
          />
        </div>
        <div className="shrink-0 w-full md:w-auto">
          <button
            onClick={handleAddClick}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 px-6 py-2 h-[42px] text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition shadow-md disabled:opacity-50"
          >
            <Plus size={18} /> {isLoading ? "..." : "Adicionar"}
          </button>
        </div>
      </div>

      {/* ✅ NOVO: Campo de Busca */}
      <div className="mb-6 flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome da obra ou banco..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 transition"
          />
        </div>
        {searchTerm && (
          <span className="text-xs text-gray-500">
            {obrasFiltradas.length} resultado(s)
          </span>
        )}
      </div>

      {/* --- Tabela --- */}
      <div className="overflow-x-auto rounded-xl shadow-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-blue-500">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase">Nome da Obra</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase">Conta Bancária</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase">Funcionários</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-white uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {isLoading && (!obras || obras.length === 0) ? (
              <tr><td colSpan="4" className="p-6 text-center text-gray-500">Carregando dados...</td></tr>
            ) : !obras || obras.length === 0 ? (
              <tr><td colSpan="4" className="p-6 text-center text-gray-500 italic">Nenhuma obra disponível.</td></tr>
            ) : (
              obrasFiltradas.map((obra) => (
                <tr key={obra.id} className="hover:bg-blue-50 transition duration-150">
                  <td className="px-6 py-3 text-sm font-medium text-gray-900 align-middle">
                    {editingObraId === obra.id ? (
                      <input type="text" value={editedObraName} onChange={(e) => setEditedObraName(e.target.value)} className="border border-blue-400 rounded px-3 py-1 w-full outline-none" autoFocus />
                    ) : obra.nome}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-600 align-middle">
                    {editingObraId === obra.id ? (
                      <select
                        value={editedBankId}
                        onChange={(e) => setEditedBankId(e.target.value)}
                        className="border border-blue-400 rounded px-3 py-1 w-full outline-none"
                      >
                        <option value="">-- Selecione --</option>
                        {availableBanks && availableBanks.map((bank) => (
                          <option key={bank.id} value={bank.id}>
                            {bank.nome}
                          </option>
                        ))}
                      </select>
                    ) : (obra.quem_paga || "-")}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-600 align-middle">
                    {editingObraId === obra.id ? (
                      <UserMultiSelect
                        selectedUsers={editSelectedUsers}
                        setSelectedUsers={setEditSelectedUsers}
                        isOpen={editUserDropdownOpen}
                        setIsOpen={setEditUserDropdownOpen}
                        search={editUserSearch}
                        setSearch={setEditUserSearch}
                        dropdownRef={editUserDropdownRef}
                      />
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {(obra.user_ids || []).length === 0 ? (
                          <span className="text-gray-400 italic text-xs">Nenhum</span>
                        ) : (
                          (obra.user_ids || []).map((uid) => {
                            const user = (availableUsers || []).find((u) => (u.user_id || u.id) === uid);
                            return (
                              <span
                                key={uid}
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700"
                              >
                                {user ? (user.nome || user.username) : `ID ${uid}`}
                              </span>
                            );
                          })
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-3 text-right align-middle">
                    <div className="flex gap-2 justify-end">
                      {editingObraId === obra.id ? (
                        <>
                          <button onClick={() => handleSaveClick(obra.id)} className="p-2 rounded-full bg-green-500 text-white hover:bg-green-600"><Save size={16} /></button>
                          <button onClick={() => setEditingObraId(null)} className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600"><X size={16} /></button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => handleStartEdit(obra.id, obra.nome, obra.bank_id)} className="p-2 rounded-full text-blue-600 hover:bg-blue-100"><Edit size={18} /></button>
                          <button onClick={() => handleDeleteClick(obra.id)} className="p-2 rounded-full text-red-600 hover:bg-red-100"><Trash2 size={18} /></button>
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
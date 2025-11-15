import React, { useState, useCallback, useMemo } from "react";
import {
  Eye,
  EyeOff,
  Edit,
  Trash2,
  Save,
  X,
  AlertTriangle,
  ChevronDown,
  Plus,
  Zap, // Icone para Obras
  UserPlus, // Novo ícone para Adicionar Usuário
  Users, // Importado para Gestão de Usuários
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

// Componente de Modal de Confirmação Unificado
const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm transform transition-all p-6">
        <div className="flex flex-col items-center">
          <AlertTriangle className="h-10 w-10 text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">{title}</h2>

          <p className="text-sm text-gray-600 text-center mb-6">{message}</p>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-semibold rounded-lg text-gray-700 bg-gray-200 hover:bg-gray-300 transition"
          >
            Cancelar
          </button>

          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-semibold rounded-lg text-white bg-red-600 hover:bg-red-700 transition"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente para exibir o Nível como Badge
const LevelBadge = ({ level }) => {
  const isAdministrator = level.toLowerCase() === "administrador";
  const className = isAdministrator
    ? "bg-purple-100 text-purple-800 font-bold"
    : "bg-green-100 text-green-800 font-medium";

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs ${className}`}
    >
      {level}
    </span>
  );
};

export default function DashboardUsers() {
  // --- Níveis Disponíveis ---
  const availableLevels = useMemo(() => ["Usuario", "Administrador"], []);

  // --- Estados Principais ---
  const initialObras = useMemo(
    () => [
      "Obra A",
      "Obra B",
      "Obra C",
      "Projeto XPTO",
      "Manutenção",
      "Nova Instalação",
      "Fiscalização",
      "Reforma Estrutural",
    ],
    []
  );

  const [availableObras, setAvailableObras] = useState(initialObras);

  const [users, setUsers] = useState([
    {
      id: 1,
      user: "joao",
      password: "senhaSecreta1",
      obras: ["Obra A", "Obra B"],
      level: "Administrador", // ADICIONADO NÍVEL
    },
    {
      id: 2,
      user: "maria",
      password: "minhaPass2",
      obras: ["Obra C"],
      level: "Usuario", // ADICIONADO NÍVEL
    },
    {
      id: 3,
      user: "carlos",
      password: "12345678",
      obras: ["Projeto XPTO", "Manutenção"],
      level: "Usuario", // ADICIONADO NÍVEL
    },
  ]); // --- Estados para Gerenciamento de Obras ---

  const [newObraName, setNewObraName] = useState("");
  const [editingObraIndex, setEditingObraIndex] = useState(null);
  const [editedObraName, setEditedObraName] = useState(""); // --- Estados para Gerenciamento de Usuários (Tabela) ---

  const [visible, setVisible] = useState({}); // Controla a visibilidade no modo de visualização (Tabela)
  const [editingUserId, setEditingUserId] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [editUserData, setEditUserData] = useState({
    user: "",
    password: "",
    obras: [],
    level: "", // ATUALIZADO
  });

  const [isEditPasswordVisible, setIsEditPasswordVisible] = useState(false);

  // --- Estados para Adicionar Novo Usuário (Novo Painel) ---

  const [newUserData, setNewUserData] = useState({
    user: "",
    password: "",
    obras: [],
    level: "Usuario", // VALOR PADRÃO
  });
  const [isNewUserDropdownOpen, setIsNewUserDropdownOpen] = useState(false);
  const [isNewUserPasswordVisible, setIsNewUserPasswordVisible] =
    useState(false);

  // --- Estados do Modal (Unificado) ---

  const [modalData, setModalData] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    onCancel: () => setModalData({ isOpen: false }),
  }); // --- LÓGICA DE OBRAS (Sem Alteração) ---

  const handleAddObra = () => {
    const trimmedName = newObraName.trim();
    if (!trimmedName) {
      toast.error("O nome da Obra não pode ser vazio.");
      return;
    }
    if (
      availableObras.some((o) => o.toLowerCase() === trimmedName.toLowerCase())
    ) {
      toast.error("Esta Obra já existe.");
      return;
    }

    setAvailableObras((prev) => [...prev, trimmedName]);
    setNewObraName("");
    toast.success(`Obra '${trimmedName}' adicionada!`);
  };

  const handleStartEditObra = (index, name) => {
    setEditingObraIndex(index);
    setEditedObraName(name);
  };

  const handleSaveObra = (index) => {
    const trimmedName = editedObraName.trim();

    const isDuplicate = availableObras.some(
      (o, i) => i !== index && o.toLowerCase() === trimmedName.toLowerCase()
    );

    if (!trimmedName) {
      toast.error("O nome da Obra não pode ser vazio.");
      return;
    }

    if (isDuplicate) {
      toast.error("O nome da Obra já existe.");
      return;
    }

    const oldName = availableObras[index];

    setAvailableObras((prev) =>
      prev.map((o, i) => (i === index ? trimmedName : o))
    );

    setUsers((prevUsers) =>
      prevUsers.map((user) => ({
        ...user,
        obras: user.obras.map((obra) =>
          obra === oldName ? trimmedName : obra
        ),
      }))
    );

    setEditingObraIndex(null);
    setEditedObraName("");
    toast.success(`Obra atualizada para '${trimmedName}'!`);
  };

  const handleConfirmRemoveObra = (obraToRemove) => {
    setUsers((prevUsers) =>
      prevUsers.map((user) => ({
        ...user,
        obras: user.obras.filter((o) => o !== obraToRemove),
      }))
    );

    setAvailableObras((prev) => prev.filter((o) => o !== obraToRemove));
    toast.success(
      `Obra '${obraToRemove}' removida! (Removida dos usuários também)`
    );
    setModalData({ isOpen: false });
  };

  const handleRemoveObra = (obraToRemove) => {
    setModalData({
      isOpen: true,
      title: "Confirmar Exclusão de Obra",
      message: `Tem certeza que deseja remover a obra '${obraToRemove}'? Esta obra será removida de TODOS os usuários que a possuem.`,
      onConfirm: () => handleConfirmRemoveObra(obraToRemove),
      onCancel: () => setModalData({ isOpen: false }),
    });
  }; // --- LÓGICA DE ADIÇÃO DE USUÁRIO ---

  const handleNewUserInputChange = (field, value) => {
    setNewUserData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleNewUserPasswordVisibility = () => {
    setIsNewUserPasswordVisible((prev) => !prev);
  };

  const toggleNewUserObra = (obra) => {
    setNewUserData((prev) => {
      const isSelected = prev.obras.includes(obra);
      const newObras = isSelected
        ? prev.obras.filter((o) => o !== obra)
        : [...prev.obras, obra];
      return { ...prev, obras: newObras };
    });
  };

  const handleAddNewUser = () => {
    const trimmedUser = newUserData.user.trim();
    const password = newUserData.password.trim();

    if (!trimmedUser || !password) {
      toast.error("Usuário e Senha não podem ser vazios.");
      return;
    }

    if (users.some((u) => u.user.toLowerCase() === trimmedUser.toLowerCase())) {
      toast.error("O nome de usuário já existe.");
      return;
    } // Generate a new unique ID (simple approach using max id + 1)

    const newId =
      users.length > 0 ? Math.max(...users.map((u) => u.id)) + 1 : 1;

    const newUser = {
      id: newId,
      user: trimmedUser,
      password: password,
      obras: newUserData.obras,
      level: newUserData.level, // INCLUÍDO
    };

    setUsers((prev) => [...prev, newUser]); // Reset form

    setNewUserData({ user: "", password: "", obras: [], level: "Usuario" });
    setIsNewUserDropdownOpen(false);
    setIsNewUserPasswordVisible(false);

    toast.success(`Usuário '${trimmedUser}' adicionado com sucesso!`);
  }; // --- LÓGICA DE EDIÇÃO/REMOÇÃO DE USUÁRIOS (Tabela) ---

  const toggleVisible = (id) => {
    setVisible((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleEditPasswordVisibility = () => {
    setIsEditPasswordVisible((prev) => !prev);
  };

  const handleEdit = (userToEdit) => {
    setEditingUserId(userToEdit.id);
    setEditUserData({
      user: userToEdit.user,
      password: userToEdit.password,
      obras: [...userToEdit.obras],
      level: userToEdit.level, // ATUALIZADO
    });
    setIsDropdownOpen(false);
    setIsEditPasswordVisible(false);
  };

  const handleInputChange = (field, value) => {
    setEditUserData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleObra = (obra) => {
    setEditUserData((prev) => {
      const isSelected = prev.obras.includes(obra);
      const newObras = isSelected
        ? prev.obras.filter((o) => o !== obra)
        : [...prev.obras, obra];
      return { ...prev, obras: newObras };
    });
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setEditUserData({ user: "", password: "", obras: [], level: "" });
    setIsDropdownOpen(false);
    setIsEditPasswordVisible(false);
  };

  const handleSaveUser = (id) => {
    const newUserValue = editUserData.user.trim();

    const isDuplicate = users.some(
      (u) => u.id !== id && u.user.toLowerCase() === newUserValue.toLowerCase()
    );

    if (!newUserValue) {
      toast.error("O nome de usuário não pode estar vazio.");
      return;
    }

    if (isDuplicate) {
      toast.error("O nome de usuário já existe. Por favor, escolha outro.");
      return;
    }

    setUsers((prev) =>
      prev.map((u) =>
        u.id === id
          ? {
              ...u,
              user: newUserValue,
              password: editUserData.password,
              obras: editUserData.obras,
              level: editUserData.level, // INCLUÍDO
            }
          : u
      )
    );
    setEditingUserId(null);
    setEditUserData({ user: "", password: "", obras: [], level: "" });
    setIsDropdownOpen(false);
    setIsEditPasswordVisible(false);
    toast.success("Usuário atualizado com sucesso!");
  };

  const handleConfirmRemoveUser = (id) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
    toast.success("Usuário removido!");
    setModalData({ isOpen: false });
  };

  const handleRemoveUser = (id) => {
    const user = users.find((u) => u.id === id);
    setModalData({
      isOpen: true,
      title: "Confirmar Remoção de Usuário",
      message: `Esta ação irá remover permanentemente o usuário '${user.user}'. Deseja continuar?`,
      onConfirm: () => handleConfirmRemoveUser(id),
      onCancel: () => setModalData({ isOpen: false }),
    });
  }; // --- Renderização ---

  return (
    <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 min-h-screen font-sans">
      <Toaster position="top-right" /> {/* Modal de Confirmação */}
      <ConfirmationModal
        isOpen={modalData.isOpen}
        title={modalData.title}
        message={modalData.message}
        onConfirm={modalData.onConfirm}
        onCancel={modalData.onCancel}
      />
      {/* Container principal com espaçamento consistente */}
      <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-2xl p-8 border border-blue-100 space-y-12">
        {/* --- SEÇÃO 1: GESTÃO DE OBRAS (SEM MUDANÇA) --- */}
        <section>
          <h1 className="text-3xl font-extrabold text-blue-700 mb-8 border-b pb-2 flex items-center gap-2">
            <Zap size={28} className="text-blue-500" /> Gestão de Obras
            Disponíveis
          </h1>
          {/* Adicionar Obra */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8 p-4 bg-gray-50 rounded-xl border border-gray-200 shadow-inner">
            <input
              type="text"
              value={newObraName}
              onChange={(e) => setNewObraName(e.target.value)}
              placeholder="Digite o nome da nova Obra..."
              className="flex-grow border border-gray-300 rounded-lg px-4 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition shadow-sm"
              onKeyPress={(e) => {
                if (e.key === "Enter") handleAddObra();
              }}
            />

            <button
              onClick={handleAddObra}
              className="flex-shrink-0 flex items-center justify-center gap-2 px-6 py-2 text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition shadow-md"
            >
              <Plus size={18} /> Adicionar Obra
            </button>
          </div>
          {/* Tabela de Obras */}
          <div className="overflow-x-auto rounded-xl shadow-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-blue-500">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider w-3/4">
                    Nome da Obra
                  </th>

                  <th className="px-6 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-100">
                {availableObras.length === 0 ? (
                  <tr>
                    <td
                      colSpan="2"
                      className="px-6 py-4 text-center text-gray-500 italic"
                    >
                      Nenhuma obra disponível. Adicione uma para começar.
                    </td>
                  </tr>
                ) : (
                  availableObras.map((obra, index) => (
                    <tr
                      key={obra}
                      className="hover:bg-blue-50 transition duration-150 align-middle"
                    >
                      {/* Nome da Obra */}

                      <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900 align-middle">
                        {editingObraIndex === index ? (
                          <input
                            type="text"
                            value={editedObraName}
                            onChange={(e) => setEditedObraName(e.target.value)}
                            className="border border-blue-400 rounded-lg px-3 py-2 text-sm w-full focus:ring-2 focus:ring-blue-500 transition shadow-sm"
                            onKeyPress={(e) => {
                              if (e.key === "Enter") handleSaveObra(index);
                            }}
                          />
                        ) : (
                          <span className="text-gray-800 flex items-center min-h-[40px] py-1">
                            {obra}
                          </span>
                        )}
                      </td>
                      {/* Ações da Obra */}

                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-700 align-middle text-right">
                        <div className="flex gap-2 justify-end">
                          {editingObraIndex === index ? (
                            <>
                              <button
                                onClick={() => handleSaveObra(index)}
                                title="Salvar Obra"
                                className="p-2 rounded-full bg-green-500 text-white hover:bg-green-600 transition shadow-md"
                              >
                                <Save size={18} />
                              </button>

                              <button
                                onClick={() => setEditingObraIndex(null)}
                                title="Cancelar Edição"
                                className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition shadow-md"
                              >
                                <X size={18} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleStartEditObra(index, obra)}
                                title="Editar Obra"
                                className="p-2 rounded-full text-blue-600 hover:bg-blue-100 transition"
                              >
                                <Edit size={18} />
                              </button>

                              <button
                                onClick={() => handleRemoveObra(obra)}
                                title="Remover Obra"
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

        {/* --- NOVO PAINEL: ADICIONAR NOVO USUÁRIO --- */}
        <section className="p-6 bg-blue-50 rounded-2xl shadow-xl border border-blue-200">
          <h2 className="text-2xl font-bold text-blue-700 mb-6 border-b pb-2 flex items-center gap-2">
            <UserPlus size={24} /> Criar Novo Usuário
          </h2>

          {/* ATUALIZADO: Grid agora tem 4 colunas (Usuário, Senha, Nível, Obras) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {/* Campo Usuário */}
            <div>
              <label
                htmlFor="newUser"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Nome de Usuário
              </label>

              <input
                id="newUser"
                type="text"
                value={newUserData.user}
                onChange={(e) =>
                  handleNewUserInputChange("user", e.target.value)
                }
                placeholder="Ex: novo.gestor"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition shadow-sm"
              />
            </div>
            {/* Campo Senha */}
            <div className="relative">
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Senha
              </label>

              <div className="relative">
                <input
                  id="newPassword"
                  type={isNewUserPasswordVisible ? "text" : "password"} // Tipo dinâmico
                  value={newUserData.password}
                  onChange={(e) =>
                    handleNewUserInputChange("password", e.target.value)
                  }
                  placeholder="Senha inicial"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition shadow-sm pr-10 font-mono"
                />
                <button
                  type="button"
                  onClick={toggleNewUserPasswordVisibility}
                  aria-label={
                    isNewUserPasswordVisible ? "Ocultar senha" : "Mostrar senha"
                  }
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-blue-600 transition"
                >
                  {isNewUserPasswordVisible ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>
            {/* NOVO CAMPO: Nível */}
            <div>
              <label
                htmlFor="newLevel"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Nível de Acesso
              </label>
              <select
                id="newLevel"
                value={newUserData.level}
                onChange={(e) =>
                  handleNewUserInputChange("level", e.target.value)
                }
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition shadow-sm appearance-none bg-white pr-8"
              >
                {availableLevels.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
            {/* Campo Obras - Ajustado para a quarta coluna */}
            <div className="relative md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Obras Associadas
              </label>

              <div
                className={`min-h-[40px] border rounded-lg px-3 py-2 cursor-pointer bg-white transition shadow-sm 
                  ${
                    isNewUserDropdownOpen
                      ? "border-blue-500 ring-2 ring-blue-500"
                      : "border-gray-300"
                  }`}
                onClick={() => setIsNewUserDropdownOpen((prev) => !prev)}
              >
                <div className="flex flex-wrap gap-1 items-center">
                  {newUserData.obras.length > 0 ? (
                    newUserData.obras.map((obra, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500 text-white hover:bg-blue-600 transition"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleNewUserObra(obra);
                        }}
                      >
                        {obra}
                        <X size={12} className="ml-1 cursor-pointer" />
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400 italic">
                      Selecione obras...
                    </span>
                  )}
                  <ChevronDown
                    size={16}
                    className={`ml-auto text-blue-500 transition-transform ${
                      isNewUserDropdownOpen ? "rotate-180" : "rotate-0"
                    }`}
                  />
                </div>
              </div>
              {/* Dropdown de Obras para Novo Usuário */}

              {isNewUserDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-48 overflow-y-auto z-10">
                  {availableObras.length === 0 ? (
                    <div className="p-3 text-sm text-gray-500 italic">
                      Nenhuma obra cadastrada.
                    </div>
                  ) : (
                    availableObras.map((obra) => (
                      <div
                        key={obra}
                        onClick={() => toggleNewUserObra(obra)}
                        className={`px-3 py-2 text-sm cursor-pointer transition 
                          ${
                            newUserData.obras.includes(obra)
                              ? "bg-blue-100 text-blue-700 font-semibold"
                              : "hover:bg-gray-100 text-gray-800"
                          }`}
                      >
                        {obra}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
          {/* Botão de Adicionar */}
          <div className="flex justify-end pt-4 border-t border-blue-100">
            <button
              onClick={handleAddNewUser}
              className="flex items-center justify-center gap-2 px-6 py-2 text-sm font-bold rounded-lg text-white bg-green-600 hover:bg-green-700 transition shadow-lg"
            >
              <Plus size={18} /> Adicionar Usuário
            </button>
          </div>
        </section>

        {/* --- SEÇÃO 2: GESTÃO DE USUÁRIOS --- */}
        <section>
          <h1 className="text-3xl font-extrabold text-blue-700 mb-8 border-b pb-2 flex items-center gap-2">
            <Users size={28} className="text-blue-500" /> Gestão de Usuários
          </h1>

          <div className="overflow-x-auto rounded-xl shadow-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              {/* Cabeçalho - Azul ATUALIZADO */}
              <thead className="bg-blue-600">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider w-1/5">
                    Usuário
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider w-1/5">
                    Senha
                  </th>

                  {/* NOVA COLUNA */}
                  <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider w-1/6">
                    Nível
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider w-2/5">
                    Obras
                  </th>

                  <th className="px-6 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider w-1/6">
                    Ações
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-100">
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-blue-50 transition duration-150 align-top"
                  >
                    {/* Usuário (User) */}

                    <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900 align-top">
                      {editingUserId === u.id ? (
                        <input
                          type="text"
                          value={editUserData.user}
                          onChange={(e) =>
                            handleInputChange("user", e.target.value)
                          }
                          className="border border-blue-400 rounded-lg px-3 py-2 text-sm w-full focus:ring-2 focus:ring-blue-500 transition shadow-sm"
                          placeholder="Nome do usuário"
                        />
                      ) : (
                        <span className="text-gray-800 flex items-center min-h-[40px] py-1">
                          {u.user}
                        </span>
                      )}
                    </td>
                    {/* Senha (Password) */}

                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-700 align-top">
                      {editingUserId === u.id ? (
                        <div className="flex items-center relative w-44">
                          <input
                            type={isEditPasswordVisible ? "text" : "password"} // Tipo dinâmico
                            value={editUserData.password}
                            onChange={(e) =>
                              handleInputChange("password", e.target.value)
                            }
                            className="border border-blue-400 rounded-lg px-3 py-2 text-sm w-full font-mono focus:ring-2 focus:ring-blue-500 transition shadow-sm pr-10"
                            placeholder="Senha"
                          />
                          <button
                            type="button"
                            onClick={toggleEditPasswordVisibility} // Toggle para o modo de edição
                            aria-label={
                              isEditPasswordVisible
                                ? "Ocultar senha"
                                : "Mostrar senha"
                            }
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-blue-600 transition"
                          >
                            {isEditPasswordVisible ? (
                              <EyeOff size={18} />
                            ) : (
                              <Eye size={18} />
                            )}
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 min-h-[40px] py-1">
                          <span className="font-mono tracking-wider">
                            {visible[u.id]
                              ? u.password
                              : "•".repeat(
                                  Math.min(Math.max(u.password.length, 6), 15)
                                )}
                          </span>

                          <button
                            onClick={() => toggleVisible(u.id)}
                            aria-label={
                              visible[u.id] ? "Ocultar senha" : "Mostrar senha"
                            }
                            className="ml-2 p-1 rounded-full text-blue-500 hover:bg-blue-100 focus:outline-none transition"
                          >
                            {visible[u.id] ? (
                              <EyeOff size={18} />
                            ) : (
                              <Eye size={18} />
                            )}
                          </button>
                        </div>
                      )}
                    </td>

                    {/* NÍVEL (Level) - NOVA CÉLULA */}
                    <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900 align-top">
                      {editingUserId === u.id ? (
                        <select
                          value={editUserData.level}
                          onChange={(e) =>
                            handleInputChange("level", e.target.value)
                          }
                          className="border border-blue-400 rounded-lg px-3 py-2 text-sm w-full focus:ring-2 focus:ring-blue-500 transition shadow-sm appearance-none bg-white"
                        >
                          {availableLevels.map((level) => (
                            <option key={level} value={level}>
                              {level}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="flex items-center min-h-[40px] py-1">
                          <LevelBadge level={u.level} />
                        </div>
                      )}
                    </td>

                    {/* Obras (Obras) */}

                    <td className="px-6 py-3 text-sm text-gray-700 relative align-top">
                      {editingUserId === u.id ? (
                        <div className="relative">
                          {/* Campo de Seleção (Mostra tags) */}

                          <div
                            className={`min-h-[40px] border rounded-lg px-3 py-2 cursor-pointer bg-white transition shadow-sm 
                              ${
                                isDropdownOpen
                                  ? "border-blue-500 ring-2 ring-blue-500"
                                  : "border-blue-400"
                              }`}
                            onClick={() => setIsDropdownOpen((prev) => !prev)}
                          >
                            <div className="flex flex-wrap gap-1 items-center">
                              {editUserData.obras.length > 0 ? (
                                editUserData.obras.map((obra, i) => (
                                  <span
                                    key={i}
                                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500 text-white hover:bg-blue-600 transition"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleObra(obra);
                                    }}
                                  >
                                    {obra}
                                    <X
                                      size={12}
                                      className="ml-1 cursor-pointer"
                                    />
                                  </span>
                                ))
                              ) : (
                                <span className="text-gray-400 italic">
                                  Selecione obras...
                                </span>
                              )}
                              <ChevronDown
                                size={16}
                                className={`ml-auto text-blue-500 transition-transform ${
                                  isDropdownOpen ? "rotate-180" : "rotate-0"
                                }`}
                              />
                            </div>
                          </div>
                          {/* Dropdown com opções - Usa 'availableObras' */}

                          {isDropdownOpen && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-48 overflow-y-auto z-10">
                              {availableObras.length === 0 ? (
                                <div className="p-3 text-sm text-gray-500 italic">
                                  Nenhuma obra cadastrada.
                                </div>
                              ) : (
                                availableObras.map((obra) => (
                                  <div
                                    key={obra}
                                    onClick={() => toggleObra(obra)}
                                    className={`px-3 py-2 text-sm cursor-pointer transition 
                                      ${
                                        editUserData.obras.includes(obra)
                                          ? "bg-blue-100 text-blue-700 font-semibold"
                                          : "hover:bg-gray-100 text-gray-800"
                                      }`}
                                  >
                                    {obra}
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      ) : // Modo de Visualização
                      u.obras.length > 0 ? (
                        <div className="flex flex-wrap gap-1 items-center min-h-[40px] py-1">
                          {u.obras.map((obra, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {obra}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center min-h-[40px] py-1">
                          <span className="text-gray-400 italic text-sm">
                            — sem obras associadas —
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Ações (Actions) */}

                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-700 align-top text-right">
                      <div className="flex gap-2 justify-end">
                        {editingUserId === u.id ? (
                          <>
                            <button
                              onClick={() => handleSaveUser(u.id)}
                              title="Salvar"
                              className="p-2 rounded-full bg-green-500 text-white hover:bg-green-600 transition shadow-md"
                            >
                              <Save size={18} />
                            </button>

                            <button
                              onClick={handleCancelEdit}
                              title="Cancelar"
                              className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition shadow-md"
                            >
                              <X size={18} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEdit(u)}
                              title="Editar"
                              className="p-2 rounded-full text-blue-600 hover:bg-blue-100 transition"
                            >
                              <Edit size={18} />
                            </button>

                            <button
                              onClick={() => handleRemoveUser(u.id)}
                              title="Remover"
                              className="p-2 rounded-full text-red-600 hover:bg-red-100 transition"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

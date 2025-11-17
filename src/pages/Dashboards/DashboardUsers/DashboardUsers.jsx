import React, { useState, useCallback, useMemo } from "react";
import toast, { Toaster } from "react-hot-toast";

// Importa os componentes separados
import { ConfirmationModal } from "./ConfirmationModal";
import { ObraManagement } from "./ObraManagement";
import { UserCreationForm } from "./UserCreationForm";
import { UserTable } from "./UserTable";

// Renomeado de DashboardUsers para App (convenção do React)
export default function App() {
  // --- Níveis Disponíveis ---
  const availableLevels = useMemo(() => ["Usuario", "Administrador"], []);

  // --- Estados Iniciais ---
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
      level: "Administrador",
    },
    {
      id: 2,
      user: "maria",
      password: "minhaPass2",
      obras: ["Obra C"],
      level: "Usuario",
    },
    {
      id: 3,
      user: "carlos",
      password: "12345678",
      obras: ["Projeto XPTO", "Manutenção"],
      level: "Usuario",
    },
  ]);

  // --- Estados para Gerenciamento de Obras ---
  const [newObraName, setNewObraName] = useState("");
  const [editingObraIndex, setEditingObraIndex] = useState(null);
  const [editedObraName, setEditedObraName] = useState("");

  // --- Estados para Gerenciamento de Usuários (Tabela) ---
  const [visible, setVisible] = useState({});
  const [editingUserId, setEditingUserId] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [editUserData, setEditUserData] = useState({
    user: "",
    password: "",
    obras: [],
    level: "",
  });
  const [isEditPasswordVisible, setIsEditPasswordVisible] = useState(false);

  // --- Estados para Adicionar Novo Usuário (Novo Painel) ---
  const [newUserData, setNewUserData] = useState({
    user: "",
    password: "",
    obras: [],
    level: "Usuario",
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
  });

  // ====================================================================
  // LÓGICA DE OBRAS (Funções)
  // ====================================================================

  const handleAddObra = useCallback(() => {
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
  }, [newObraName, availableObras]);

  const handleStartEditObra = useCallback((index, name) => {
    setEditingObraIndex(index);
    setEditedObraName(name);
  }, []);

  const handleSaveObra = useCallback(
    (index) => {
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
    },
    [editedObraName, availableObras]
  );

  const handleConfirmRemoveObra = useCallback((obraToRemove) => {
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
  }, []);

  const handleRemoveObra = useCallback(
    (obraToRemove) => {
      setModalData({
        isOpen: true,
        title: "Confirmar Exclusão de Obra",
        message: `Tem certeza que deseja remover a obra '${obraToRemove}'? Esta obra será removida de TODOS os usuários que a possuem.`,
        onConfirm: () => handleConfirmRemoveObra(obraToRemove),
        onCancel: () => setModalData({ isOpen: false }),
      });
    },
    [handleConfirmRemoveObra]
  );

  // ====================================================================
  // LÓGICA DE ADIÇÃO DE USUÁRIO (Funções)
  // ====================================================================

  const handleNewUserInputChange = useCallback((field, value) => {
    setNewUserData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const toggleNewUserPasswordVisibility = useCallback(() => {
    setIsNewUserPasswordVisible((prev) => !prev);
  }, []);

  const toggleNewUserObra = useCallback((obra) => {
    setNewUserData((prev) => {
      const isSelected = prev.obras.includes(obra);
      const newObras = isSelected
        ? prev.obras.filter((o) => o !== obra)
        : [...prev.obras, obra];
      return { ...prev, obras: newObras };
    });
  }, []);

  const handleAddNewUser = useCallback(async () => {
    const trimmedUser = newUserData.user.trim();
    const password = newUserData.password.trim();

    if (!trimmedUser || !password) {
      toast.error("Usuário e Senha não podem ser vazios.");
      return;
    }

    if (users.some((u) => u.user.toLowerCase() === trimmedUser.toLowerCase())) {
      toast.error("O nome de usuário já existe.");
      return;
    }

    try {
      // Chama API para criar usuário
      const res = await createUsuario({
        usuario: trimmedUser,
        password: password,
        role: newUserData.level,
      });

      const newId =
        res.id ||
        (users.length > 0 ? Math.max(...users.map((u) => u.id)) + 1 : 1);

      const newUser = {
        id: newId,
        user: trimmedUser,
        password: password,
        obras: newUserData.obras,
        level: newUserData.level,
      };

      setUsers((prev) => [...prev, newUser]);

      setNewUserData({ user: "", password: "", obras: [], level: "user" });
      setIsNewUserDropdownOpen(false);
      setIsNewUserPasswordVisible(false);

      toast.success(`Usuário '${trimmedUser}' adicionado com sucesso!`);
    } catch (err) {
      toast.error("Erro ao adicionar usuário");
    }
  }, [newUserData, users]);

  // ====================================================================
  // LÓGICA DE EDIÇÃO/REMOÇÃO DE USUÁRIOS (Funções)
  // ====================================================================

  const toggleVisible = useCallback((id) => {
    setVisible((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const toggleEditPasswordVisibility = useCallback(() => {
    setIsEditPasswordVisible((prev) => !prev);
  }, []);

  const handleEdit = useCallback((userToEdit) => {
    setEditingUserId(userToEdit.id);
    setEditUserData({
      user: userToEdit.user,
      password: userToEdit.password,
      obras: [...userToEdit.obras],
      level: userToEdit.level,
    });
    setIsDropdownOpen(false);
    setIsEditPasswordVisible(false);
  }, []);

  const handleInputChange = useCallback((field, value) => {
    setEditUserData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const toggleObra = useCallback((obra) => {
    setEditUserData((prev) => {
      const isSelected = prev.obras.includes(obra);
      const newObras = isSelected
        ? prev.obras.filter((o) => o !== obra)
        : [...prev.obras, obra];
      return { ...prev, obras: newObras };
    });
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingUserId(null);
    setEditUserData({ user: "", password: "", obras: [], level: "" });
    setIsDropdownOpen(false);
    setIsEditPasswordVisible(false);
  }, []);

  const handleSaveUser = useCallback(
    (id) => {
      const newUserValue = editUserData.user.trim();

      const isDuplicate = users.some(
        (u) =>
          u.id !== id && u.user.toLowerCase() === newUserValue.toLowerCase()
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
                level: editUserData.level,
              }
            : u
        )
      );
      setEditingUserId(null);
      setEditUserData({ user: "", password: "", obras: [], level: "" });
      setIsDropdownOpen(false);
      setIsEditPasswordVisible(false);
      toast.success("Usuário atualizado com sucesso!");
    },
    [editUserData, users]
  );

  const handleConfirmRemoveUser = useCallback((id) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
    toast.success("Usuário removido!");
    setModalData({ isOpen: false });
  }, []);

  const handleRemoveUser = useCallback(
    (id) => {
      const user = users.find((u) => u.id === id);
      setModalData({
        isOpen: true,
        title: "Confirmar Remoção de Usuário",
        message: `Esta ação irá remover permanentemente o usuário '${user.user}'. Deseja continuar?`,
        onConfirm: () => handleConfirmRemoveUser(id),
        onCancel: () => setModalData({ isOpen: false }),
      });
    },
    [users, handleConfirmRemoveUser]
  );

  // ====================================================================
  // RENDERIZAÇÃO
  // ====================================================================

  return (
    <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 min-h-screen font-sans">
      <Toaster position="top-right" />
      {/* Modal de Confirmação */}
      <ConfirmationModal
        isOpen={modalData.isOpen}
        title={modalData.title}
        message={modalData.message}
        onConfirm={modalData.onConfirm}
        onCancel={modalData.onCancel}
      />
      {/* Container principal */}
      <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-2xl p-8 border border-blue-100 space-y-12">
        {/* Gestão de Obras */}
        <ObraManagement
          availableObras={availableObras}
          newObraName={newObraName}
          setNewObraName={setNewObraName}
          editingObraIndex={editingObraIndex}
          handleStartEditObra={handleStartEditObra}
          editedObraName={editedObraName}
          setEditedObraName={setEditedObraName}
          handleSaveObra={handleSaveObra}
          setEditingObraIndex={setEditingObraIndex}
          handleAddObra={handleAddObra}
          handleRemoveObra={handleRemoveObra}
        />

        {/* Criação de Novo Usuário */}
        <UserCreationForm
          newUserData={newUserData}
          handleNewUserInputChange={handleNewUserInputChange}
          isNewUserPasswordVisible={isNewUserPasswordVisible}
          toggleNewUserPasswordVisibility={toggleNewUserPasswordVisibility}
          toggleNewUserObra={toggleNewUserObra}
          availableObras={availableObras}
          isNewUserDropdownOpen={isNewUserDropdownOpen}
          setIsNewUserDropdownOpen={setIsNewUserDropdownOpen}
          handleAddNewUser={handleAddNewUser}
          availableLevels={availableLevels}
        />

        {/* Tabela de Usuários */}
        <UserTable
          users={users}
          editingUserId={editingUserId}
          editUserData={editUserData}
          visible={visible}
          isDropdownOpen={isDropdownOpen}
          isEditPasswordVisible={isEditPasswordVisible}
          availableObras={availableObras}
          availableLevels={availableLevels}
          toggleVisible={toggleVisible}
          handleEdit={handleEdit}
          handleRemoveUser={handleRemoveUser}
          handleCancelEdit={handleCancelEdit}
          handleSaveUser={handleSaveUser}
          handleInputChange={handleInputChange}
          toggleObra={toggleObra}
          toggleEditPasswordVisibility={toggleEditPasswordVisibility}
          setIsDropdownOpen={setIsDropdownOpen}
        />
      </div>
    </div>
  );
}

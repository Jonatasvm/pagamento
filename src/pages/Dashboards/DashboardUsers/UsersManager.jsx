import React, { useState, useEffect, useMemo } from "react";
import {
  Eye,
  EyeOff,
  Edit,
  Trash2,
  Save,
  X,
  UserPlus,
  Users,
  ChevronDown,
  AlertTriangle,
  Plus,
  Loader2,
} from "lucide-react";
import { toast } from "react-hot-toast";

// --- COMPONENTES UTILITÁRIOS ---

const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm transform transition-all p-6">
        <div className="flex flex-col items-center">
          <div className="bg-red-100 p-3 rounded-full mb-4">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
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

const LevelBadge = ({ level }) => {
  const isAdministrator =
    level?.toLowerCase() === "admin" ||
    level?.toLowerCase() === "administrador";
  const className = isAdministrator
    ? "bg-purple-100 text-purple-800 border border-purple-200"
    : "bg-green-100 text-green-800 border border-green-200";
  const displayLabel = isAdministrator ? "Administrador" : "Usuário";

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${className}`}
    >
      {displayLabel}
    </span>
  );
};

// --- COMPONENTE USER MANAGER ---

export const UserManager = ({ API_IP, availableObras }) => {
  const availableLevels = useMemo(
    () => [
      { value: "user", label: "Usuário" },
      { value: "admin", label: "Administrador" },
    ],
    []
  );

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [visible, setVisible] = useState({});
  const [editingUserId, setEditingUserId] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Estado de Edição
  const [editUserData, setEditUserData] = useState({
    user: "",
    password: "",
    obras: [],
    level: "",
  });
  const [isEditPasswordVisible, setIsEditPasswordVisible] = useState(false);

  // Estado de Novo Usuário
  const [newUserData, setNewUserData] = useState({
    user: "",
    password: "",
    obras: [],
    level: "user",
  });
  const [isNewUserDropdownOpen, setIsNewUserDropdownOpen] = useState(false);
  const [isNewUserPasswordVisible, setIsNewUserPasswordVisible] =
    useState(false);

  const [modalData, setModalData] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  // --- GET USERS ---
  const fetchUsers = async () => {
    if (!API_IP) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_IP}/usuarios`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error("Erro ao buscar dados.");

      const data = await response.json();

      // O Backend provavelmente retorna algo como { usuarios: [...] } ou uma lista direta
      // Ajuste conforme a resposta real da sua lógica de agrupamento no Python
      let listaUsuarios = [];
      if (data.usuarios && Array.isArray(data.usuarios)) {
        listaUsuarios = data.usuarios;
      } else if (Array.isArray(data)) {
        listaUsuarios = data;
      }

      // ADAPTADOR: Converte os campos do Backend (username, role)
      // para os campos do Frontend (user, level)
      const usuariosAdaptados = listaUsuarios.map((u) => ({
        id: u.user_id || u.id, // Garante compatibilidade com o SELECT do backend
        user: u.username, // Backend manda 'username', UI usa 'user'
        level: u.role, // Backend manda 'role', UI usa 'level'
        password: u.password_hash || "******", // Hash para exibição
        obras: Array.isArray(u.obras) ? u.obras : [],
      }));

      setUsers(usuariosAdaptados);
    } catch (error) {
      console.error(error);
      toast.error("Falha ao carregar usuários.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [API_IP]);

  // --- CREATE USER ---
  const handleNewUserInputChange = (field, value) =>
    setNewUserData((prev) => ({ ...prev, [field]: value }));

  const toggleNewUserObra = (obra) => {
    setNewUserData((prev) => {
      const newObras = prev.obras.includes(obra)
        ? prev.obras.filter((o) => o !== obra)
        : [...prev.obras, obra];
      return { ...prev, obras: newObras };
    });
  };

  const handleAddClick = async () => {
    const trimmedUser = newUserData.user.trim();
    const password = newUserData.password.trim();

    if (!trimmedUser || !password) {
      toast.error("Usuário e Senha são obrigatórios.");
      return;
    }

    setActionLoading(true);
    try {
      // PAYLOAD CORRIGIDO: Chaves compatíveis com auth_routes.py
      const payload = {
        usuario: trimmedUser, // Backend espera 'usuario'
        password: password,
        role: newUserData.level, // Backend espera 'role'
        obras: newUserData.obras, // Lista de nomes de obras
      };

      const response = await fetch(`${API_IP}/register`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "Erro ao criar usuário");
      }

      toast.success("Usuário criado com sucesso!");

      // Limpar formulário
      setNewUserData({ user: "", password: "", obras: [], level: "user" });
      setIsNewUserDropdownOpen(false);
      setIsNewUserPasswordVisible(false);

      // Recarregar lista
      fetchUsers();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  // --- UPDATE USER ---
  const handleStartEdit = (user) => {
    setEditingUserId(user.id);
    setEditUserData({
      user: user.user, // Frontend 'user' -> Edit 'user'
      password: "", // Senha vazia ao iniciar edição para não reenviar hash antigo
      obras: user.obras || [],
      level: user.level, // Frontend 'level' -> Edit 'level'
    });
    setIsDropdownOpen(false);
    setIsEditPasswordVisible(false);
  };

  const toggleObraEdit = (obra) => {
    setEditUserData((prev) => {
      const newObras = prev.obras.includes(obra)
        ? prev.obras.filter((o) => o !== obra)
        : [...prev.obras, obra];
      return { ...prev, obras: newObras };
    });
  };

  const handleSaveClick = async (id) => {
    if (!editUserData.user.trim()) {
      toast.error("Nome de usuário inválido.");
      return;
    }

    try {
      // PAYLOAD CORRIGIDO para o Backend Python
      const payload = {
        usuario: editUserData.user,
        role: editUserData.level,
        obras: editUserData.obras,
        // Só envia password se o usuário digitou algo novo
        ...(editUserData.password ? { password: editUserData.password } : {}),
      };

      const response = await fetch(`${API_IP}/usuarios/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        // Tenta ler msg de erro do backend se houver
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.error || "Erro ao atualizar.");
      }

      toast.success("Usuário atualizado!");
      setEditingUserId(null);
      fetchUsers();
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    }
  };

  // --- DELETE USER ---
  const handleDeleteClick = (user) => {
    setModalData({
      isOpen: true,
      title: "Remover Usuário",
      message: `Remover permanentemente o usuário '${user.user}'?`,
      onConfirm: async () => {
        try {
          const response = await fetch(`${API_IP}/usuarios/${user.id}`, {
            method: "DELETE",
            headers: getAuthHeaders(),
          });

          if (!response.ok) throw new Error("Erro ao remover.");

          toast.success("Usuário removido.");
          // Atualiza lista localmente para ser mais rápido, ou chama fetchUsers()
          setUsers((prev) => prev.filter((u) => u.id !== user.id));
        } catch (error) {
          toast.error("Erro ao excluir usuário.");
        } finally {
          setModalData({
            isOpen: false,
            title: "",
            message: "",
            onConfirm: () => {},
          });
        }
      },
    });
  };

  return (
    <>
      <ConfirmationModal
        isOpen={modalData.isOpen}
        title={modalData.title}
        message={modalData.message}
        onConfirm={modalData.onConfirm}
        onCancel={() => setModalData({ ...modalData, isOpen: false })}
      />

      {/* SEÇÃO DE CRIAÇÃO */}
      <section className="p-6 bg-blue-50 rounded-2xl shadow-md border border-blue-100">
        <h2 className="text-2xl font-bold text-blue-700 mb-6 border-b border-blue-200 pb-3 flex items-center gap-2">
          <UserPlus size={24} /> Criar Novo Usuário
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          {/* Campo Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome de Usuário
            </label>
            <input
              type="text"
              value={newUserData.user}
              onChange={(e) => handleNewUserInputChange("user", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              placeholder="Ex: novo.gestor"
            />
          </div>

          {/* Campo Senha */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Senha
            </label>
            <div className="relative">
              <input
                type={isNewUserPasswordVisible ? "text" : "password"}
                value={newUserData.password}
                onChange={(e) =>
                  handleNewUserInputChange("password", e.target.value)
                }
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none pr-10 font-mono"
                placeholder="Senha inicial"
              />
              <button
                type="button"
                onClick={() =>
                  setIsNewUserPasswordVisible(!isNewUserPasswordVisible)
                }
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-blue-600"
              >
                {isNewUserPasswordVisible ? (
                  <EyeOff size={16} />
                ) : (
                  <Eye size={16} />
                )}
              </button>
            </div>
          </div>

          {/* Campo Nível */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nível de Acesso
            </label>
            <select
              value={newUserData.level}
              onChange={(e) =>
                handleNewUserInputChange("level", e.target.value)
              }
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white"
            >
              {availableLevels.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          {/* Campo Obras (Multi-Select) */}
          <div className="relative md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Obras Associadas
            </label>
            <div
              className={`min-h-[40px] border rounded-lg px-3 py-2 cursor-pointer bg-white transition ${
                isNewUserDropdownOpen
                  ? "border-blue-500 ring-2 ring-blue-200"
                  : "border-gray-300"
              }`}
              onClick={() => setIsNewUserDropdownOpen(!isNewUserDropdownOpen)}
            >
              <div className="flex flex-wrap gap-1 items-center">
                {newUserData.obras.length > 0 ? (
                  newUserData.obras.map((obra, i) => (
                    <span
                      key={i}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleNewUserObra(obra);
                      }}
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500 text-white hover:bg-blue-600 transition"
                    >
                      {obra} <X size={12} className="ml-1" />
                    </span>
                  ))
                ) : (
                  <span className="text-gray-400 italic text-xs">
                    Selecionar...
                  </span>
                )}
                <ChevronDown
                  size={16}
                  className={`ml-auto text-blue-500 transition ${
                    isNewUserDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </div>
            </div>
            {isNewUserDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-y-auto z-20">
                {availableObras.length === 0 ? (
                  <div className="p-3 text-sm text-gray-500">
                    Nenhuma obra disponível
                  </div>
                ) : (
                  availableObras.map((obra) => (
                    <div
                      key={obra}
                      onClick={() => toggleNewUserObra(obra)}
                      className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${
                        newUserData.obras.includes(obra)
                          ? "bg-blue-100 text-blue-700 font-semibold"
                          : "text-gray-700"
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
        <div className="flex justify-end pt-4 border-t border-blue-200">
          <button
            onClick={handleAddClick}
            disabled={actionLoading}
            className="flex items-center gap-2 px-6 py-2 text-sm font-bold rounded-lg text-white bg-green-600 hover:bg-green-700 transition shadow-md disabled:opacity-50"
          >
            {actionLoading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <Plus size={18} />
            )}{" "}
            Adicionar Usuário
          </button>
        </div>
      </section>

      {/* LISTA DE USUÁRIOS */}
      <section>
        <h1 className="text-3xl font-extrabold text-blue-700 mb-8 border-b pb-2 flex items-center gap-2">
          <Users size={28} className="text-blue-500" /> Gestão de Usuários
        </h1>
        <div className="overflow-visible rounded-xl shadow-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-600">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase w-1/5">
                  Usuário
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase w-1/5">
                  Senha
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase w-1/6">
                  Nível
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase w-2/5">
                  Obras
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-white uppercase w-1/6">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">
                    <div className="flex justify-center items-center gap-2">
                      <Loader2
                        className="animate-spin text-blue-500"
                        size={24}
                      />
                      <span>Carregando usuários...</span>
                    </div>
                  </td>
                </tr>
              ) : !Array.isArray(users) || users.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="p-8 text-center text-gray-500 italic"
                  >
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-blue-50 transition align-top"
                  >
                    {/* Coluna Usuário */}
                    <td className="px-6 py-3 text-sm font-medium text-gray-900">
                      {editingUserId === u.id ? (
                        <input
                          type="text"
                          value={editUserData.user}
                          onChange={(e) =>
                            setEditUserData({
                              ...editUserData,
                              user: e.target.value,
                            })
                          }
                          className="border border-blue-400 rounded px-2 py-1 w-full text-sm"
                        />
                      ) : (
                        u.user
                      )}
                    </td>

                    {/* Coluna Senha */}
                    <td className="px-6 py-3 text-sm text-gray-700">
                      {editingUserId === u.id ? (
                        <div className="relative">
                          <input
                            type={isEditPasswordVisible ? "text" : "password"}
                            value={editUserData.password}
                            onChange={(e) =>
                              setEditUserData({
                                ...editUserData,
                                password: e.target.value,
                              })
                            }
                            className="border border-blue-400 rounded px-2 py-1 w-full text-sm font-mono pr-8"
                            placeholder="Nova senha (opcional)"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setIsEditPasswordVisible(!isEditPasswordVisible)
                            }
                            className="absolute right-2 top-1.5 text-gray-500"
                          >
                            {isEditPasswordVisible ? (
                              <EyeOff size={14} />
                            ) : (
                              <Eye size={14} />
                            )}
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-mono">
                            {visible[u.id] ? u.password : "••••••"}
                          </span>
                          <button
                            onClick={() =>
                              setVisible((p) => ({ ...p, [u.id]: !p[u.id] }))
                            }
                            className="text-blue-400 hover:text-blue-600"
                          >
                            {visible[u.id] ? (
                              <EyeOff size={14} />
                            ) : (
                              <Eye size={14} />
                            )}
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Coluna Nível */}
                    <td className="px-6 py-3">
                      {editingUserId === u.id ? (
                        <select
                          value={editUserData.level}
                          onChange={(e) =>
                            setEditUserData({
                              ...editUserData,
                              level: e.target.value,
                            })
                          }
                          className="border border-blue-400 rounded px-2 py-1 w-full text-sm bg-white"
                        >
                          {availableLevels.map((l) => (
                            <option key={l.value} value={l.value}>
                              {l.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <LevelBadge level={u.level} />
                      )}
                    </td>

                    {/* Coluna Obras */}
                    <td className="px-6 py-3 relative">
                      {editingUserId === u.id ? (
                        <div className="relative">
                          <div
                            className={`border rounded px-2 py-1 bg-white cursor-pointer min-h-[32px] flex flex-wrap gap-1 ${
                              isDropdownOpen
                                ? "border-blue-500 ring-1 ring-blue-200"
                                : "border-blue-400"
                            }`}
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                          >
                            {editUserData.obras.map((o, i) => (
                              <span
                                key={i}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleObraEdit(o);
                                }}
                                className="bg-blue-500 text-white text-xs px-1.5 rounded flex items-center"
                              >
                                {o} <X size={10} className="ml-1" />
                              </span>
                            ))}
                            <ChevronDown
                              size={14}
                              className="ml-auto text-blue-500"
                            />
                          </div>
                          {isDropdownOpen && (
                            <div className="absolute top-full left-0 w-full mt-1 bg-white border rounded shadow-lg z-50 max-h-40 overflow-y-auto">
                              {availableObras.map((o) => (
                                <div
                                  key={o}
                                  onClick={() => toggleObraEdit(o)}
                                  className={`px-2 py-1 text-sm hover:bg-gray-100 cursor-pointer ${
                                    editUserData.obras.includes(o)
                                      ? "bg-blue-50 font-semibold text-blue-700"
                                      : ""
                                  }`}
                                >
                                  {o}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {u.obras && u.obras.length ? (
                            u.obras.map((o, i) => (
                              <span
                                key={i}
                                className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full"
                              >
                                {o}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-400 text-xs italic">
                              -
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Coluna Ações */}
                    <td className="px-6 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        {editingUserId === u.id ? (
                          <>
                            <button
                              onClick={() => handleSaveClick(u.id)}
                              className="p-1.5 bg-green-500 text-white rounded hover:bg-green-600"
                            >
                              <Save size={16} />
                            </button>
                            <button
                              onClick={() => {
                                setEditingUserId(null);
                                setIsDropdownOpen(false);
                              }}
                              className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600"
                            >
                              <X size={16} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleStartEdit(u)}
                              className="p-1.5 text-blue-600 hover:bg-blue-100 rounded"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(u)}
                              className="p-1.5 text-red-600 hover:bg-red-100 rounded"
                            >
                              <Trash2 size={16} />
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
    </>
  );
};

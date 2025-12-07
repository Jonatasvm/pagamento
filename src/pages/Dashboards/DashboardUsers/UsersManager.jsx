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

const API_IP = "http://91.98.132.210:5631";

// --- FUNÇÃO AUXILIAR PARA AUTORIZAÇÃO (NOVO) ---
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

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
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---

export const UserManager = ({ obrasNames = [] }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    role: "user",
    obras: [],
  });

  // Estados de Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isObraModalOpen, setIsObraModalOpen] = useState(false);
  const [userToManageObra, setUserToManageObra] = useState(null);
  const [newObraName, setNewObraName] = useState("");
  const [isRemoveObraModalOpen, setIsRemoveObraModalOpen] = useState(false);
  const [obraToRemove, setObraToRemove] = useState(null);

  // --- MÉTODOS DE DADOS ---

  // 1. GET Usuários (CORRIGIDO: Adicionado Headers)
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_IP}/usuarios`, {
        headers: getAuthHeaders(), // <--- CORREÇÃO APLICADA
      });

      if (response.status === 401 || response.status === 403) {
        throw new Error("Não autorizado ou sem permissão de administrador.");
      }

      if (!response.ok) throw new Error("Erro ao buscar dados.");
      
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error(error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // --- MÉTODOS DE EDIÇÃO E CRIAÇÃO ---

  const handleNewUserChange = (e) => {
    const { name, value } = e.target;
    setNewUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditingUserChange = (e) => {
    const { name, value } = e.target;
    setEditingUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleStartEdit = (user) => {
    setEditingUserId(user.id);
    setEditingUser({ ...user });
    setIsDropdownOpen(false); // Garante que dropdown feche ao iniciar edição
  };

  // 2. POST/PUT Usuário (CORRIGIDO: Adicionado Headers)
  const handleSave = async (user) => {
    const isNew = user.id === undefined;
    const method = isNew ? "POST" : "PUT";
    const url = isNew ? `${API_IP}/register` : `${API_IP}/usuarios/${user.id}`;

    // Payload para o backend
    let payload = {
      username: user.username,
      role: user.role,
      obras: user.obras || [],
    };

    // Senha só é necessária no POST (registro) ou se for explicitamente alterada no PUT
    if (user.password) {
      payload.password = user.password;
    }

    // Se for PUT, o backend pode não exigir a senha, mas garantimos que username e role estejam presentes.
    if (!isNew && !user.username) {
      toast.error("O nome de usuário não pode estar vazio.");
      return;
    }

    try {
      const response = await fetch(url, {
        method: method,
        headers: getAuthHeaders(), // <--- CORREÇÃO APLICADA
        body: JSON.stringify(payload),
      });

      if (response.status === 409) {
        toast.error("Usuário já existe.");
        return;
      }
      if (!response.ok) throw new Error("Erro ao salvar.");

      toast.success(isNew ? "Usuário criado!" : "Usuário atualizado!");

      // Limpa estados
      setNewUser({ username: "", password: "", role: "user", obras: [] });
      setEditingUserId(null);
      setEditingUser(null);
      // Re-busca os dados para atualizar a lista
      fetchUsers();
    } catch (error) {
      console.error("Erro ao salvar usuário:", error);
      toast.error(`Erro ao salvar: ${error.message}`);
    }
  };

  // --- MÉTODOS DE DELETE ---

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  // 3. DELETE Usuário (CORRIGIDO: Adicionado Headers)
  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    try {
      const response = await fetch(`${API_IP}/usuarios/${userToDelete.id}`, {
        method: "DELETE",
        headers: getAuthHeaders(), // <--- CORREÇÃO APLICADA
      });

      if (!response.ok) throw new Error("Erro ao deletar.");

      toast.success(`Usuário ${userToDelete.username} deletado!`);
      fetchUsers();
    } catch (error) {
      console.error("Erro ao deletar usuário:", error);
      toast.error("Erro ao deletar usuário.");
    } finally {
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
    }
  };

  // --- MÉTODOS DE GERENCIAMENTO DE OBRAS ---

  const handleManageObraClick = (user) => {
    setUserToManageObra(user);
    setIsObraModalOpen(true);
    setNewObraName(""); // Limpa o campo de nova obra
  };

  // 4. POST Adicionar Obra (CORRIGIDO: Adicionado Headers)
  const handleAddObraConfirm = async () => {
    if (!newObraName || !userToManageObra) return;

    try {
      const response = await fetch(
        `${API_IP}/usuarios/${userToManageObra.id}/adicionar-obra`,
        {
          method: "POST",
          headers: getAuthHeaders(), // <--- CORREÇÃO APLICADA
          body: JSON.stringify({ obra: newObraName }),
        }
      );

      if (response.status === 404) {
        toast.error(`Obra '${newObraName}' não existe.`);
        return;
      }
      if (response.status === 409) {
        toast.error(`Usuário já possui a obra '${newObraName}'.`);
        return;
      }
      if (!response.ok) throw new Error("Erro ao adicionar obra.");

      toast.success(`Obra '${newObraName}' adicionada a ${userToManageObra.username}!`);
      setIsObraModalOpen(false);
      fetchUsers(); // Atualiza a lista
    } catch (error) {
      console.error("Erro ao adicionar obra:", error);
      toast.error("Erro ao adicionar obra.");
    }
  };

  const handleRemoveObraClick = (user, obra) => {
    setUserToManageObra(user);
    setObraToRemove(obra);
    setIsRemoveObraModalOpen(true);
  };

  // 5. DELETE Remover Obra (CORRIGIDO: Adicionado Headers)
  const handleRemoveObraConfirm = async () => {
    if (!userToManageObra || !obraToRemove) return;

    try {
      const response = await fetch(
        `${API_IP}/usuarios/${userToManageObra.id}/remover-obra`,
        {
          method: "DELETE",
          headers: getAuthHeaders(), // <--- CORREÇÃO APLICADA
          body: JSON.stringify({ obra: obraToRemove.nome }), // O backend espera o nome da obra no body
        }
      );

      if (!response.ok) throw new Error("Erro ao remover obra.");

      toast.success(`Obra '${obraToRemove.nome}' removida de ${userToManageObra.username}!`);
      setIsRemoveObraModalOpen(false);
      fetchUsers(); // Atualiza a lista
    } catch (error) {
      console.error("Erro ao remover obra:", error);
      toast.error("Erro ao remover obra.");
    } finally {
      setUserToManageObra(null);
      setObraToRemove(null);
    }
  };

  // --- RENDERING DO MODAL DE OBRAS ---

  const ObraManagementModal = ({ isOpen, user, obrasNames, onClose }) => {
    if (!isOpen || !user) return null;

    const availableObras = obrasNames.filter(
      (name) => !user.obras.some((o) => o.nome === name)
    );

    return (
      <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg transform transition-all p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Gerenciar Obras de {user.username}
          </h2>

          {/* Adicionar Obra */}
          <div className="mb-6 p-4 border rounded-lg bg-gray-50">
            <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
              <Plus size={16} className="mr-2" /> Adicionar Obra
            </h3>
            <div className="flex gap-2">
              <select
                value={newObraName}
                onChange={(e) => setNewObraName(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Selecione uma Obra</option>
                {availableObras.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddObraConfirm}
                disabled={!newObraName}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-green-300 transition"
              >
                Adicionar
              </button>
            </div>
            {availableObras.length === 0 && (
              <p className="text-xs text-red-500 mt-2">
                Todas as obras já estão vinculadas a este usuário.
              </p>
            )}
          </div>

          {/* Obras Vinculadas */}
          <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
            <List size={16} className="mr-2" /> Obras Atuais ({user.obras.length})
          </h3>
          <div className="h-40 overflow-y-auto border p-3 rounded-lg bg-white shadow-inner">
            {user.obras.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                Nenhuma obra vinculada.
              </p>
            ) : (
              <ul className="space-y-2">
                {user.obras.map((obra) => (
                  <li
                    key={obra.id || obra.nome}
                    className="flex justify-between items-center bg-blue-50 p-2 rounded-md"
                  >
                    <span className="text-sm font-medium text-gray-700">
                      {obra.nome}
                    </span>
                    <button
                      onClick={() => handleRemoveObraClick(user, obra)}
                      className="text-red-500 hover:text-red-700 p-1 rounded transition"
                    >
                      <X size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    );
  };

  // --- RENDERING ---

  return (
    <>
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja deletar o usuário ${userToDelete?.username}? Esta ação é irreversível.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setIsDeleteModalOpen(false)}
      />

      <ConfirmationModal
        isOpen={isRemoveObraModalOpen}
        title="Remover Obra"
        message={`Tem certeza que deseja desvincular a obra "${obraToRemove?.nome}" do usuário ${userToManageObra?.username}?`}
        onConfirm={handleRemoveObraConfirm}
        onCancel={() => setIsRemoveObraModalOpen(false)}
      />

      <ObraManagementModal
        isOpen={isObraModalOpen}
        user={userToManageObra}
        obrasNames={obrasNames}
        onClose={() => setIsObraModalOpen(false)}
      />

      <section className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
        <h2 className="text-2xl font-extrabold text-slate-800 mb-6 flex items-center">
          <Users className="w-6 h-6 mr-3 text-indigo-600" />
          Gerenciamento de Usuários
        </h2>

        {/* Formulário de Criação de Novo Usuário */}
        <div className="mb-8 p-6 bg-indigo-50 rounded-xl border border-indigo-100">
          <h3 className="font-bold text-lg text-indigo-700 mb-4 flex items-center">
            <UserPlus size={18} className="mr-2" />
            Adicionar Novo Usuário
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <input
              type="text"
              name="username"
              value={newUser.username}
              onChange={handleNewUserChange}
              placeholder="Nome de Usuário"
              className="p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            />
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={newUser.password}
                onChange={handleNewUserChange}
                placeholder="Senha"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <select
              name="role"
              value={newUser.role}
              onChange={handleNewUserChange}
              className="p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="user">Usuário Comum</option>
              <option value="admin">Administrador</option>
            </select>
            <button
              onClick={() => handleSave(newUser)}
              disabled={!newUser.username || !newUser.password}
              className="flex justify-center items-center p-3 font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 transition duration-150"
            >
              <Plus size={20} className="mr-2" /> Criar Usuário
            </button>
          </div>
        </div>

        {/* Tabela de Usuários */}
        <div className="overflow-x-auto shadow-md rounded-xl border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cargo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Obras Vinculadas
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="4" className="text-center py-6">
                    <Loader2 className="w-6 h-6 text-indigo-500 animate-spin mx-auto" />
                    <span className="text-sm text-gray-600 mt-2 block">
                      Carregando usuários...
                    </span>
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingUserId === u.id ? (
                        <input
                          type="text"
                          name="username"
                          value={editingUser.username}
                          onChange={handleEditingUserChange}
                          className="border border-gray-300 rounded-lg p-1.5 text-sm w-full"
                        />
                      ) : (
                        <span className="text-sm font-medium text-gray-900">
                          {u.username}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingUserId === u.id ? (
                        <select
                          name="role"
                          value={editingUser.role}
                          onChange={handleEditingUserChange}
                          className="border border-gray-300 rounded-lg p-1.5 text-sm w-full"
                        >
                          <option value="user">Usuário Comum</option>
                          <option value="admin">Administrador</option>
                        </select>
                      ) : (
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            u.role === "admin"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative inline-block text-left">
                        <button
                          onClick={() => handleManageObraClick(u)}
                          className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                        >
                          {u.obras.length} Obra(s)
                          <ChevronDown
                            className="-mr-1 ml-2 h-5 w-5"
                            aria-hidden="true"
                          />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        {editingUserId === u.id ? (
                          <>
                            <button
                              onClick={() => handleSave(editingUser)}
                              disabled={!editingUser.username}
                              className="p-1.5 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-green-300"
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
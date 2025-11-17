import {
  Edit,
  Eye,
  Trash2,
  Users,
  EyeOff,
  X,
  ChevronDown,
  Save,
} from "lucide-react";
import { LevelBadge } from "./LevelBadge";

export const UserTable = ({
  users,
  editingUserId,
  editUserData,
  visible,
  isDropdownOpen,
  isEditPasswordVisible,
  availableObras,
  availableLevels,
  toggleVisible,
  handleEdit,
  handleRemoveUser,
  handleCancelEdit,
  handleSaveUser,
  handleInputChange,
  toggleObra,
  toggleEditPasswordVisibility,
  setIsDropdownOpen,
}) => {
  return (
    <section>
      <h1 className="text-3xl font-extrabold text-blue-700 mb-8 border-b pb-2 flex items-center gap-2">
        <Users size={28} className="text-blue-500" /> Gestão de Usuários
      </h1>
      <div className="overflow-x-auto rounded-xl shadow-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          {/* Cabeçalho */}
          <thead className="bg-blue-600">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider w-1/5">
                Usuário
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider w-1/5">
                Senha
              </th>
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
                        type={isEditPasswordVisible ? "text" : "password"}
                        value={editUserData.password}
                        onChange={(e) =>
                          handleInputChange("password", e.target.value)
                        }
                        className="border border-blue-400 rounded-lg px-3 py-2 text-sm w-full font-mono focus:ring-2 focus:ring-blue-500 transition shadow-sm pr-10"
                        placeholder="Senha"
                      />
                      <button
                        type="button"
                        onClick={toggleEditPasswordVisibility}
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

                {/* NÍVEL (Level) */}
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
  );
};

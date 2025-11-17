import { ChevronDown, Eye, Plus, UserPlus, X } from "lucide-react";

export const UserCreationForm = ({
  newUserData,
  handleNewUserInputChange,
  isNewUserPasswordVisible,
  toggleNewUserPasswordVisibility,
  toggleNewUserObra,
  availableObras,
  isNewUserDropdownOpen,
  setIsNewUserDropdownOpen,
  handleAddNewUser,
  availableLevels,
}) => {
  return (
    <section className="p-6 bg-blue-50 rounded-2xl shadow-xl border border-blue-200">
      <h2 className="text-2xl font-bold text-blue-700 mb-6 border-b pb-2 flex items-center gap-2">
        <UserPlus size={24} /> Criar Novo Usuário
      </h2>
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
            onChange={(e) => handleNewUserInputChange("user", e.target.value)}
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
              type={isNewUserPasswordVisible ? "text" : "password"}
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
        {/* Campo Nível */}
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
            onChange={(e) => handleNewUserInputChange("level", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition shadow-sm appearance-none bg-white pr-8"
          >
            {availableLevels.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </div>
        {/* Campo Obras */}
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
                <span className="text-gray-400 italic">Selecione obras...</span>
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
  );
};

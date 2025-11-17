import { Plus, Zap, Edit, Trash2, Save, X } from "lucide-react";

export const ObraManagement = ({
  availableObras,
  newObraName,
  setNewObraName,
  editingObraIndex,
  handleStartEditObra,
  editedObraName,
  setEditedObraName,
  handleSaveObra,
  setEditingObraIndex,
  handleAddObra,
  handleRemoveObra,
}) => {
  return (
    <section>
      <h1 className="text-3xl font-extrabold text-blue-700 mb-8 border-b pb-2 flex items-center gap-2">
        <Zap size={28} className="text-blue-500" /> Gestão de Obras Disponíveis
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
  );
};

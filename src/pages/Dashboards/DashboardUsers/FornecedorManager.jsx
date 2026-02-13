import React, { useState, useEffect, useMemo } from "react";
import { Edit, Trash2, Save, X, Plus, Users2, Search } from "lucide-react";
import { toast } from "react-hot-toast";

export const FornecedorManager = ({
  fornecedores,
  isLoading,
  availableBanks,
  onAddFornecedor,
  onUpdateFornecedor,
  onDeleteFornecedor,
}) => {
  const [newFornecedorData, setNewFornecedorData] = useState({
    titular: "",
    cpf_cnpj: "",
  });

  const [editingFornecedorId, setEditingFornecedorId] = useState(null);
  const [editedData, setEditedData] = useState({
    titular: "",
    cpf_cnpj: "",
  });

  // ✅ NOVO: Estados para paginação e busca
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Formatar CPF/CNPJ para exibição
  const formatarCpfCnpj = (valor) => {
    if (!valor) return "";
    const limpo = valor.replace(/\D/g, "");
    if (limpo.length <= 11) {
      return limpo
        .replace(/^(\d{3})(\d)/, "$1.$2")
        .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d{1,2})/, "$1.$2.$3-$4");
    }
    return limpo
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3/$4")
      .replace(/(\d{4})(\d)/, "$1-$2");
  };

  // Limpar CPF/CNPJ (remover caracteres especiais)
  const limparCpfCnpj = (valor) => {
    return valor.replace(/\D/g, "");
  };

  const checkFornecedorExists = (titulo, cpf, excludeId = null) => {
    if (!fornecedores) return false;
    const cpfLimpo = limparCpfCnpj(cpf).toLowerCase();
    return fornecedores.some((f) => {
      if (excludeId && f.id === excludeId) return false;
      return (
        f.titular.trim().toLowerCase() === titulo.trim().toLowerCase() ||
        limparCpfCnpj(f.cpf_cnpj).toLowerCase() === cpfLimpo
      );
    });
  };

  const handleNewFornecedorChange = (field, value) => {
    if (field === "cpf_cnpj") {
      value = limparCpfCnpj(value);
    }
    setNewFornecedorData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddClick = () => {
    const titulo = newFornecedorData.titular.trim();
    const cpf = newFornecedorData.cpf_cnpj.trim();

    if (!titulo || !cpf) {
      toast.error("Preencha título e CPF/CNPJ.");
      return;
    }

    if (cpf.length < 11) {
      toast.error("CPF/CNPJ inválido.");
      return;
    }

    if (checkFornecedorExists(titulo, cpf)) {
      toast.error("Fornecedor com este título ou CPF/CNPJ já existe!");
      return;
    }

    onAddFornecedor({
      titular: titulo,
      cpf_cnpj: cpf,
    });

    setNewFornecedorData({
      titular: "",
      cpf_cnpj: "",
    });
  };

  const handleStartEdit = (fornecedor) => {
    setEditingFornecedorId(fornecedor.id);
    setEditedData({
      titular: fornecedor.titular,
      cpf_cnpj: fornecedor.cpf_cnpj,
      chave_pix: fornecedor.chave_pix || "",
      banco_padrao: fornecedor.banco_padrao || "",
    });
  };

  const handleEditChange = (field, value) => {
    if (field === "cpf_cnpj") {
      value = limparCpfCnpj(value);
    }
    setEditedData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveClick = (id) => {
    const titulo = editedData.titular.trim();
    const cpf = editedData.cpf_cnpj.trim();

    if (!titulo || !cpf) {
      toast.error("Preencha título e CPF/CNPJ.");
      return;
    }

    if (cpf.length < 11) {
      toast.error("CPF/CNPJ inválido.");
      return;
    }

    if (checkFornecedorExists(titulo, cpf, id)) {
      toast.error("Já existe outro fornecedor com este título ou CPF/CNPJ!");
      return;
    }

    onUpdateFornecedor(id, {
      titular: titulo,
      cpf_cnpj: cpf,
    });

    setEditingFornecedorId(null);
  };

  const handleDeleteClick = (id) => {
    if (
      window.confirm("Tem certeza que deseja excluir este fornecedor?")
    ) {
      onDeleteFornecedor(id);
    }
  };

  const getBancoNome = (bancoId) => {
    if (!bancoId || !availableBanks) return "-";
    const banco = availableBanks.find((b) => b.id === bancoId);
    return banco ? banco.nome : "-";
  };

  // ✅ NOVO: Filtrar fornecedores por busca
  const fornecedoresFiltrados = useMemo(() => {
    if (!fornecedores) return [];
    if (!searchTerm.trim()) return fornecedores;
    
    const termo = searchTerm.toLowerCase();
    return fornecedores.filter((f) =>
      f.titular.toLowerCase().includes(termo) ||
      f.cpf_cnpj.replace(/\D/g, "").includes(termo.replace(/\D/g, ""))
    );
  }, [fornecedores, searchTerm]);

  // ✅ NOVO: Calcular paginação
  const totalPages = Math.ceil(fornecedoresFiltrados.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const fornecedoresPaginados = fornecedoresFiltrados.slice(startIndex, endIndex);

  // ✅ NOVO: Resetar página ao buscar
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <section>
      <h1 className="text-3xl font-extrabold text-orange-700 mb-8 border-b pb-2 flex items-center gap-2">
        <Users2 size={28} className="text-orange-500" /> Gerenciar Fornecedores
      </h1>

      {/* --- Inputs de Adicionar --- */}
      <div className="mb-8 p-4 bg-gray-50 rounded-xl border border-gray-200 shadow-inner space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500 font-semibold mb-1 block">
              Título / Razão Social
            </label>
            <input
              type="text"
              value={newFornecedorData.titular}
              onChange={(e) =>
                handleNewFornecedorChange("titular", e.target.value)
              }
              placeholder="Ex: João Silva"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm outline-none focus:border-orange-500 focus:ring-1 transition"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 font-semibold mb-1 block">
              CPF / CNPJ
            </label>
            <input
              type="text"
              value={formatarCpfCnpj(newFornecedorData.cpf_cnpj)}
              onChange={(e) =>
                handleNewFornecedorChange("cpf_cnpj", e.target.value)
              }
              placeholder="Ex: 123.456.789-00"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm outline-none focus:border-orange-500 focus:ring-1 transition"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleAddClick}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-6 py-2 h-[42px] text-sm font-semibold rounded-lg text-white bg-orange-600 hover:bg-orange-700 transition shadow-md disabled:opacity-50"
          >
            <Plus size={18} /> {isLoading ? "..." : "Adicionar"}
          </button>
        </div>
      </div>

      {/* --- Campo de Busca --- */}
      <div className="my-6 flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou CPF/CNPJ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-orange-500 focus:ring-1 transition"
          />
        </div>
        <span className="text-sm text-gray-600">
          {fornecedoresFiltrados.length} de {fornecedores?.length || 0} fornecedores
        </span>
      </div>

      {/* --- Tabela --- */}
      <div className="overflow-x-auto rounded-xl shadow-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-orange-500">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase">
                Título / Razão Social
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase">
                CPF / CNPJ
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-white uppercase">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {isLoading && (!fornecedores || fornecedores.length === 0) ? (
              <tr>
                <td colSpan="3" className="p-6 text-center text-gray-500">
                  Carregando dados...
                </td>
              </tr>
            ) : fornecedoresFiltrados.length === 0 ? (
              <tr>
                <td colSpan="3" className="p-6 text-center text-gray-500 italic">
                  {searchTerm ? "Nenhum fornecedor encontrado com este termo de busca." : "Nenhum fornecedor cadastrado. Comece adicionando um novo."}
                </td>
              </tr>
            ) : (
              fornecedoresPaginados.map((fornecedor) => (
                <tr
                  key={fornecedor.id}
                  className="hover:bg-orange-50 transition duration-150"
                >
                  <td className="px-6 py-3 text-sm font-medium text-gray-900 align-middle">
                    {editingFornecedorId === fornecedor.id ? (
                      <input
                        type="text"
                        value={editedData.titular}
                        onChange={(e) =>
                          handleEditChange("titular", e.target.value)
                        }
                        className="border border-orange-400 rounded px-3 py-1 w-full outline-none"
                        autoFocus
                      />
                    ) : (
                      fornecedor.titular
                    )}
                  </td>
                  <td className="px-6 py-3 text-sm font-medium text-gray-900 align-middle">
                    {editingFornecedorId === fornecedor.id ? (
                      <input
                        type="text"
                        value={formatarCpfCnpj(editedData.cpf_cnpj)}
                        onChange={(e) =>
                          handleEditChange("cpf_cnpj", e.target.value)
                        }
                        className="border border-orange-400 rounded px-3 py-1 w-full outline-none"
                      />
                    ) : (
                      formatarCpfCnpj(fornecedor.cpf_cnpj)
                    )}
                  </td>
                  <td className="px-6 py-3 text-right align-middle">
                    <div className="flex gap-2 justify-end">
                      {editingFornecedorId === fornecedor.id ? (
                        <>
                          <button
                            onClick={() => handleSaveClick(fornecedor.id)}
                            className="p-2 rounded-full bg-orange-500 text-white hover:bg-orange-600"
                          >
                            <Save size={16} />
                          </button>
                          <button
                            onClick={() => setEditingFornecedorId(null)}
                            className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600"
                          >
                            <X size={16} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleStartEdit(fornecedor)}
                            className="p-2 rounded-full text-orange-600 hover:bg-orange-100"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(fornecedor.id)}
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

      {/* --- Paginação --- */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            ← Anterior
          </button>

          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              // Mostrar apenas páginas próximas (5 páginas no máximo)
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium ${
                      currentPage === page
                        ? "bg-orange-600 text-white"
                        : "border border-gray-300 bg-white hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                );
              }
              if (
                page === currentPage - 2 ||
                page === currentPage + 2
              ) {
                return <span key={page} className="px-2">...</span>;
              }
              return null;
            })}
          </div>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            Próxima →
          </button>

          <span className="ml-4 text-sm text-gray-600">
            Página {currentPage} de {totalPages}
          </span>
        </div>
      )}
    </section>
  );
};

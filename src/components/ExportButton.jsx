import React, { useState } from 'react';
import { FileSpreadsheet, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = "http://91.98.132.210:5631";

const ExportButton = ({ selectedRequests, requests, disabled }) => {
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        if (selectedRequests.length === 0) {
            toast.error('Selecione pelo menos um registro para exportar');
            return;
        }

        setIsExporting(true);
        const toastId = toast.loading('Gerando arquivo Excel...');

        try {
            // Pega os dados completos dos registros selecionados
            const registrosParaExportar = requests.filter(req => 
                selectedRequests.includes(req.id)
            );

            const response = await fetch(`${API_URL}/api/export/xls`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ registros: registrosParaExportar }),
            });

            if (!response.ok) {
                throw new Error('Erro ao gerar arquivo');
            }

            // Criar blob e fazer download
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Planilha de Importação_${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success(`${selectedRequests.length} registro(s) exportado(s) com sucesso!`, { id: toastId });

        } catch (error) {
            console.error('Erro:', error);
            toast.error('Erro ao exportar dados', { id: toastId });
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <button
            onClick={handleExport}
            disabled={disabled || selectedRequests.length === 0 || isExporting}
            className="flex items-center gap-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold py-4 px-8 rounded-2xl shadow-2xl hover:shadow-green-500/50 hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
            {isExporting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
                <FileSpreadsheet className="w-5 h-5" />
            )}
            Exportar XLS ({selectedRequests.length})
        </button>
    );
};

export default ExportButton;
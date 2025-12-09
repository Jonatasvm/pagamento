import React from 'react';
import { Button } from '@mui/material'; // ou seu componente de botão
import FileDownloadIcon from '@mui/icons-material/FileDownload';

const ExportButton = ({ selectedRows, disabled }) => {
    const handleExport = async () => {
        if (selectedRows.length === 0) {
            alert('Selecione pelo menos um registro para exportar');
            return;
        }

        try {
            const response = await fetch("http://91.98.132.210:5631", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ registros: selectedRows }),
            });

            if (!response.ok) {
                throw new Error('Erro ao gerar arquivo');
            }

            // Criar blob e fazer download
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `pagamentos_${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao exportar dados');
        }
    };

    return (
        <Button
            variant="contained"
            color="success"
            startIcon={<FileDownloadIcon />}
            onClick={handleExport}
            disabled={disabled || selectedRows.length === 0}
        >
            Exportar XLS ({selectedRows.length})
        </Button>
    );
};

export default ExportButton;
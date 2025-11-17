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
  Zap,
  UserPlus,
  Users,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

// ====================================================================
// 1. COMPONENTE MODAL DE CONFIRMAÇÃO
// ====================================================================

export const ConfirmationModal = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
}) => {
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

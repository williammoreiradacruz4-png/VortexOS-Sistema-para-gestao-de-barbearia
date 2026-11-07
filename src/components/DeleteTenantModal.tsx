import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, AlertTriangle, Building2 } from 'lucide-react';
import { Tenant } from '../types';

interface DeleteTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: Tenant | null;
  onConfirmDelete: (tenantId: string, tenantName: string) => void;
}

export const DeleteTenantModal: React.FC<DeleteTenantModalProps> = ({
  isOpen,
  onClose,
  tenant,
  onConfirmDelete,
}) => {
  if (!isOpen || !tenant) return null;

  const handleDelete = () => {
    onConfirmDelete(tenant.id, tenant.name);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md bg-gray-800 border border-red-500/30 rounded-xl shadow-2xl overflow-hidden text-gray-100"
        >
          {/* Header */}
          <div className="p-5 border-b border-gray-700 flex items-center justify-between bg-red-950/20">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-red-600/20 text-red-400 flex items-center justify-center border border-red-500/30 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Excluir Empresa</h3>
                <p className="text-xs text-red-300">Ação irreversível de exclusão</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-700 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            <div className="flex items-start space-x-3 p-3.5 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-200">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Você está prestes a remover permanentemente esta empresa do ecossistema SaaS. Todos os acessos e configurações vinculados serão desativados.
              </p>
            </div>

            {/* Tenant details */}
            <div className="bg-gray-900/80 p-4 rounded-xl border border-gray-700/80 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Nome da Empresa:</span>
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                  {tenant.name}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">CNPJ:</span>
                <span className="font-mono text-gray-200">{tenant.cnpj}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Subdomínio:</span>
                <span className="font-mono text-indigo-400">://{tenant.subdomain}.saasapp.com</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Mensalidade:</span>
                <span className="font-mono text-emerald-400 font-medium">
                  {tenant.monthlyValue.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 text-sm font-medium transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="btnConfirmarExclusao"
                onClick={handleDelete}
                className="px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-semibold flex items-center space-x-2 transition cursor-pointer shadow-lg shadow-red-600/30"
              >
                <Trash2 className="w-4 h-4" />
                <span>Confirmar Exclusão</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

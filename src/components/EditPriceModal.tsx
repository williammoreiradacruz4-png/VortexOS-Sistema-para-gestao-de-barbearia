import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, DollarSign, Check, Building2 } from 'lucide-react';
import { Tenant } from '../types';

interface EditPriceModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: Tenant | null;
  onSavePrice: (tenantId: string, newPrice: number) => void;
}

export const EditPriceModal: React.FC<EditPriceModalProps> = ({
  isOpen,
  onClose,
  tenant,
  onSavePrice,
}) => {
  const [priceStr, setPriceStr] = useState('450,00');

  useEffect(() => {
    if (tenant) {
      setPriceStr(tenant.monthlyValue.toFixed(2).replace('.', ','));
    }
  }, [tenant]);

  if (!isOpen || !tenant) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numeric = parseFloat(
      priceStr.replace(/\./g, '').replace(',', '.').replace(/[^0-9.]/g, '')
    );
    if (!isNaN(numeric)) {
      onSavePrice(tenant.id, numeric);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden text-gray-100"
        >
          {/* Header */}
          <div className="p-5 border-b border-gray-700 flex items-center justify-between bg-gray-800/80">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Alterar Valor Mensal</h3>
                <p className="text-xs text-gray-400">{tenant.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="bg-gray-900/60 p-3.5 rounded-lg border border-gray-700/60 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-indigo-400" />
                <span className="text-gray-300 font-medium">{tenant.name}</span>
              </div>
              <span className="text-indigo-400 font-mono">://{tenant.subdomain}.saasapp.com</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                Novo Valor da Mensalidade (R$)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-emerald-400 font-bold text-sm">
                  R$
                </span>
                <input
                  type="text"
                  required
                  value={priceStr}
                  onChange={(e) => setPriceStr(e.target.value)}
                  placeholder="0,00"
                  className="w-full pl-11 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-lg font-bold text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition font-mono"
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">
                O novo valor será cobrado no próximo ciclo de faturamento da empresa.
              </p>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[11px] text-gray-400">Atalhos:</span>
              {[250, 350, 450, 600, 850].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setPriceStr(`${preset},00`)}
                  className="px-2 py-1 text-xs bg-gray-700/80 hover:bg-gray-700 text-gray-300 rounded border border-gray-600 transition"
                >
                  R$ {preset}
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-gray-700 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm font-medium transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium flex items-center space-x-2 transition cursor-pointer shadow-lg shadow-indigo-600/30"
              >
                <Check className="w-4 h-4" />
                <span>Salvar Novo Valor</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

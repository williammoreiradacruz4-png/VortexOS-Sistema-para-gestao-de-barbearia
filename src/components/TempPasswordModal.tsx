import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Key, Copy, Check, Clock, AlertTriangle, ExternalLink } from 'lucide-react';
import { Tenant } from '../types';

interface TempPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: Tenant | null;
  generatedPassword: string;
  onRegenerate: () => void;
  onOpenBarberWithPassword?: (tenant: Tenant, passwordCode: string) => void;
}

export const TempPasswordModal: React.FC<TempPasswordModalProps> = ({
  isOpen,
  onClose,
  tenant,
  generatedPassword,
  onRegenerate,
  onOpenBarberWithPassword,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !tenant) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDirectAccess = () => {
    if (onOpenBarberWithPassword) {
      onOpenBarberWithPassword(tenant, generatedPassword);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md bg-gray-800 border border-amber-500/30 rounded-xl shadow-2xl overflow-hidden text-gray-100"
        >
          {/* Header */}
          <div className="p-5 border-b border-gray-700 flex items-center justify-between bg-amber-950/20">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Senha Temporária Gerada</h3>
                <p className="text-xs text-amber-300/90 font-medium">{tenant.name}</p>
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
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3.5 flex items-start space-x-3 text-xs text-amber-200">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-100">Acesso Restrito ao Painel da Barbearia</p>
                <p className="text-amber-300/80 mt-0.5">
                  O gerente da barbearia só poderá autenticar e acessar o painel fornecendo esta chave temporária. Válida por <strong>2 horas</strong>.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Chave de Acesso Temporária da Barbearia
              </label>
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gray-900 border border-amber-500/40 rounded-lg px-4 py-3 font-mono text-xl font-bold text-amber-400 tracking-widest text-center select-all shadow-inner">
                  {generatedPassword}
                </div>
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`px-4 py-3 rounded-lg font-medium text-sm transition flex items-center space-x-1.5 cursor-pointer shadow-md ${
                    copied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold'
                  }`}
                  title="Copiar Senha"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
              <div className="flex items-center space-x-1.5">
                <Clock className="w-4 h-4 text-amber-400/80" />
                <span>Validade: 02:00:00 restantes</span>
              </div>
              <button
                type="button"
                onClick={onRegenerate}
                className="text-amber-400 hover:text-amber-300 font-medium transition cursor-pointer underline"
              >
                Gerar Outra
              </button>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-3">
              {onOpenBarberWithPassword && (
                <button
                  type="button"
                  onClick={handleDirectAccess}
                  className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md shadow-orange-600/30"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Acessar Painel Barbearia com Esta Senha</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-xs font-medium transition cursor-pointer ml-auto"
              >
                Fechar
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Building2,
  Globe,
  FileText,
  DollarSign,
  Mail,
  Plus,
  Lock,
  ShieldCheck,
  QrCode,
  Smartphone,
  ExternalLink
} from 'lucide-react';
import { Tenant } from '../types';
import {
  getTenantClientRegisterUrl,
  generateBarberQrCodeDataUrl
} from '../lib/qrCodeHelper';

interface NewTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTenant: (tenant: Omit<Tenant, 'id' | 'createdAt'>, adminPassword?: string) => void;
}

export const NewTenantModal: React.FC<NewTenantModalProps> = ({
  isOpen,
  onClose,
  onAddTenant,
}) => {
  const [name, setName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [monthlyValue, setMonthlyValue] = useState('450,00');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('482910');

  // Live QR Code preview state
  const [liveQrDataUrl, setLiveQrDataUrl] = useState<string>('');
  const [showLiveQrPreview, setShowLiveQrPreview] = useState<boolean>(true);

  const cleanSubdomain = subdomain.trim()
    ? subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '')
    : name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const previewRegisterUrl = getTenantClientRegisterUrl(cleanSubdomain || 'empresa');

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const targetUrl = getTenantClientRegisterUrl(cleanSubdomain || 'empresa');
    generateBarberQrCodeDataUrl(targetUrl)
      .then((url) => {
        if (isMounted) setLiveQrDataUrl(url);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [isOpen, cleanSubdomain]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const numericValue = parseFloat(
      monthlyValue.replace(/\./g, '').replace(',', '.').replace(/[^0-9.]/g, '')
    ) || 450;

    const formattedSubdomain = subdomain.trim()
      ? subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '')
      : name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    onAddTenant(
      {
        name: name.trim(),
        subdomain: formattedSubdomain,
        cnpj: cnpj.trim() || '12.345.678/0001-90',
        monthlyValue: numericValue,
        status: 'Ativo',
        adminEmail: adminEmail.trim() || `admin@${formattedSubdomain}.com`,
      },
      adminPassword.trim() || '482910'
    );

    setName('');
    setSubdomain('');
    setCnpj('');
    setMonthlyValue('450,00');
    setAdminEmail('');
    setAdminPassword('482910');
    onClose();
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!subdomain) {
      setSubdomain(val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
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
          className="relative w-full max-w-lg bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden text-gray-100"
        >
          {/* Header */}
          <div className="p-5 border-b border-gray-700 flex items-center justify-between bg-gray-800/80">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Cadastrar Nova Empresa</h3>
                <p className="text-xs text-gray-400">Salva na coleção 'tenants' e cria senha no Firebase Auth</p>
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
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                Nome da Empresa / Barbearia
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <Building2 className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Ex: Barbearia Viking Club"
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                  Subdomínio
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <Globe className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={subdomain}
                    onChange={(e) => setSubdomain(e.target.value)}
                    placeholder="viking-club"
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-sm text-indigo-400 placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition font-mono"
                  />
                </div>
                <p className="text-[11px] text-gray-500 mt-1 truncate">
                  URL: https://{subdomain || 'empresa'}.saasapp.com
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                  CNPJ
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <FileText className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                    placeholder="00.000.000/0001-00"
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  />
                </div>
              </div>
            </div>

            {/* Live QR Code Preview Card */}
            <div className="p-3.5 bg-gray-900/90 rounded-xl border border-gray-700/80">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <QrCode className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white">QR Code de Cadastro da Barbearia</span>
                    <span className="text-[10px] text-amber-400/90 block">Gerado instantaneamente para esta barbearia</span>
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-medium border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Isolado
                </span>
              </div>

              <div className="flex items-center gap-3 bg-gray-950 p-2.5 rounded-lg border border-gray-800">
                {liveQrDataUrl ? (
                  <div className="p-1 bg-white rounded-lg shadow-sm shrink-0">
                    <img
                      src={liveQrDataUrl}
                      alt="QR Code Preview"
                      className="w-14 h-14 object-contain block"
                    />
                  </div>
                ) : (
                  <div className="w-14 h-14 bg-gray-800 rounded-lg flex items-center justify-center text-gray-500 shrink-0">
                    <QrCode className="w-6 h-6 animate-pulse" />
                  </div>
                )}
                <div className="min-w-0 flex-1 text-xs">
                  <p className="text-gray-300 text-[11px]">
                    Destino: <strong className="text-amber-300">Tela de Cadastro Exclusiva</strong>
                  </p>
                  <p className="text-[10px] font-mono text-indigo-400 truncate mt-0.5">
                    {previewRegisterUrl}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-1">
                    Ao salvar, o QR Code em alta resolução fica pronto para download e impressão de balcão.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                  Valor Mensal (R$)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 font-bold text-xs">
                    R$
                  </span>
                  <input
                    type="text"
                    required
                    value={monthlyValue}
                    onChange={(e) => setMonthlyValue(e.target.value)}
                    placeholder="450,00"
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                  E-mail do Administrador
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="gerente@empresa.com"
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                Senha / Código de Acesso da Barbearia (6 números)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  maxLength={6}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="482910"
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition font-mono tracking-widest"
                />
              </div>
              <p className="text-[11px] text-emerald-400/80 mt-1 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Código de 6 dígitos numéricos para login direto no painel da barbearia</span>
              </p>
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
                <Plus className="w-4 h-4" />
                <span>Salvar no Firebase</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

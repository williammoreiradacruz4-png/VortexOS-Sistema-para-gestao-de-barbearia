import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  QrCode,
  Download,
  Copy,
  Check,
  Printer,
  ExternalLink,
  Smartphone,
  ShieldCheck,
  Building2,
  Sparkles
} from 'lucide-react';
import {
  getTenantClientRegisterUrl,
  generateBarberQrCodeDataUrl,
  downloadQrCodeImage,
  printBarberCounterStand,
} from '../lib/qrCodeHelper';

interface BarberQrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: {
    name: string;
    subdomain: string;
    adminPassword?: string;
    adminAccessCode?: string;
  } | null;
  isNewlyCreated?: boolean;
  onOpenRegisterScreen?: (subdomain: string) => void;
}

export const BarberQrCodeModal: React.FC<BarberQrCodeModalProps> = ({
  isOpen,
  onClose,
  tenant,
  isNewlyCreated = false,
  onOpenRegisterScreen,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isLoadingQr, setIsLoadingQr] = useState<boolean>(true);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const registerUrl = tenant ? getTenantClientRegisterUrl(tenant.subdomain) : '';

  useEffect(() => {
    if (!isOpen || !tenant) {
      setQrDataUrl('');
      return;
    }

    let isMounted = true;
    setIsLoadingQr(true);

    const targetUrl = getTenantClientRegisterUrl(tenant.subdomain);
    generateBarberQrCodeDataUrl(targetUrl)
      .then((dataUrl) => {
        if (isMounted) {
          setQrDataUrl(dataUrl);
          setIsLoadingQr(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsLoadingQr(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, tenant]);

  if (!isOpen || !tenant) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(registerUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = registerUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    downloadQrCodeImage(qrDataUrl, tenant.subdomain, tenant.name);
  };

  const handlePrint = () => {
    if (!qrDataUrl) return;
    printBarberCounterStand(tenant.name, tenant.subdomain, qrDataUrl, registerUrl);
  };

  const handleTestInNewTab = () => {
    window.open(registerUrl, '_blank');
  };

  const handleDirectRegister = () => {
    if (onOpenRegisterScreen) {
      onOpenRegisterScreen(tenant.subdomain);
      onClose();
    } else {
      window.location.href = registerUrl;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden text-gray-100 my-8"
        >
          {/* Header */}
          <div className="p-5 border-b border-gray-800 flex items-center justify-between bg-gray-800/80">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    {isNewlyCreated ? 'Cadastro Concluído & QR Code' : 'QR Code Oficial da Barbearia'}
                  </h3>
                  {isNewlyCreated && (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Novo
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400">
                  Totalmente isolado para: <span className="text-amber-400 font-semibold">{tenant.name}</span>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-gray-700/60 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 sm:p-6 space-y-5">
            {/* Aviso de isolamento */}
            <div className="p-3 rounded-xl bg-gray-800/70 border border-gray-700/80 flex items-start gap-3 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-gray-300">
                <p className="font-semibold text-white">QR Code Exclusivo & Isolado</p>
                <p className="text-gray-400 mt-0.5">
                  Ao escanear com a câmera do celular, o cliente abre <strong className="text-amber-300">diretamente a tela de cadastro</strong> vinculada a esta barbearia (<span className="font-mono text-indigo-300">b={tenant.subdomain}</span>).
                </p>
              </div>
            </div>

            {/* Cartão Central do QR Code */}
            <div className="flex flex-col items-center justify-center p-6 bg-gray-950 rounded-2xl border border-gray-800 text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold mb-3">
                <Building2 className="w-3.5 h-3.5" />
                <span>{tenant.name}</span>
              </div>

              {/* Box da Imagem do QR Code */}
              <div className="relative p-3 bg-white rounded-2xl shadow-xl shadow-black/60 border-2 border-amber-500/40 my-2">
                {isLoadingQr ? (
                  <div className="w-52 h-52 flex flex-col items-center justify-center text-gray-400">
                    <QrCode className="w-12 h-12 animate-pulse text-gray-300 mb-2" />
                    <span className="text-xs text-gray-500 font-mono">Gerando QR Code...</span>
                  </div>
                ) : qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`QR Code ${tenant.name}`}
                    className="w-52 h-52 sm:w-56 sm:h-56 object-contain block select-none"
                  />
                ) : (
                  <div className="w-52 h-52 flex items-center justify-center text-red-400 text-xs">
                    Falha ao renderizar imagem.
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-xs text-gray-300 font-medium mt-3">
                <Smartphone className="w-4 h-4 text-amber-400 animate-bounce" />
                <span>Aponte a câmera do celular para testar</span>
              </div>
              <p className="text-[11px] text-gray-500 font-mono mt-1">
                Subdomínio: {tenant.subdomain}
              </p>
            </div>

            {/* Link Direto com Botão de Copiar */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                Link Direto da Barbearia (Destino do QR Code)
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-xs font-mono text-indigo-300 truncate select-all">
                  {registerUrl}
                </div>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
                    copiedLink
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700'
                  }`}
                  title="Copiar URL para área de transferência"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-gray-300" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Ações de Exportação e Teste */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-gray-800">
              {/* Baixar PNG */}
              <button
                type="button"
                onClick={handleDownload}
                disabled={!qrDataUrl}
                className="w-full py-2.5 px-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-gray-950 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-amber-500/20"
                title="Baixar imagem em PNG de alta resolução"
              >
                <Download className="w-4 h-4" />
                <span>Baixar PNG</span>
              </button>

              {/* Imprimir Display */}
              <button
                type="button"
                onClick={handlePrint}
                disabled={!qrDataUrl}
                className="w-full py-2.5 px-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
                title="Imprimir placa para colocar no balcão da barbearia"
              >
                <Printer className="w-4 h-4 text-indigo-400" />
                <span>Imprimir Display</span>
              </button>

              {/* Testar / Abrir Cadastro */}
              <button
                type="button"
                onClick={handleDirectRegister}
                className="w-full py-2.5 px-3 bg-indigo-600/30 hover:bg-indigo-600/40 border border-indigo-500/40 text-indigo-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                title="Abrir tela de cadastro do cliente agora"
              >
                <ExternalLink className="w-4 h-4 text-indigo-400" />
                <span>Testar Tela</span>
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-gray-800/60 border-t border-gray-800 flex items-center justify-between">
            <button
              type="button"
              onClick={handleTestInNewTab}
              className="text-xs text-gray-400 hover:text-amber-400 flex items-center gap-1 transition cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Abrir em Nova Aba</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200 rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

import React, { useState } from 'react';
import { Download, Smartphone, X, Share2, PlusSquare } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'full' | 'subtle';
  className?: string;
  label?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'compact',
  className = '',
  label = 'Instalar Aplicativo',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed standalone PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    if (variant === 'full') {
      return (
        <button
          type="button"
          onClick={install}
          className={`flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-gray-950 font-bold px-4 py-2.5 shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer ${className}`}
        >
          <Download className="w-4 h-4 text-gray-950 stroke-[2.5]" />
          <span>{label}</span>
        </button>
      );
    }

    if (variant === 'subtle') {
      return (
        <button
          type="button"
          onClick={install}
          className={`flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${className}`}
          title="Instalar no celular / computador"
        >
          <Download className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>{label}</span>
        </button>
      );
    }

    // Default compact
    return (
      <button
        type="button"
        onClick={install}
        className={`flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-gray-950 font-semibold px-2.5 py-1.5 text-xs shadow-md transition-all active:scale-95 cursor-pointer ${className}`}
        title="Instalar aplicativo no seu dispositivo"
      >
        <Download className="w-3.5 h-3.5 stroke-[2.5]" />
        <span>Instalar App</span>
      </button>
    );
  }

  // iOS Safari flow (beforeinstallprompt is not fired by Safari WebKit)
  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1.5 text-xs font-semibold text-amber-300 transition-colors cursor-pointer ${className}`}
          title="Instalar no iPhone / iPad"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Instalar no iPhone</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-amber-500/30 p-6 shadow-2xl text-left relative">
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-zinc-800 transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <img src="/logo.png" alt="Logo" className="w-12 h-12 rounded-xl object-contain bg-zinc-950 border border-amber-500/30 p-1" />
                <div>
                  <h3 className="text-base font-bold text-white">Instalar no iPhone / iPad</h3>
                  <p className="text-xs text-amber-400">Tenha o app direto na sua tela inicial</p>
                </div>
              </div>

              <div className="space-y-3 text-xs text-zinc-300">
                <div className="flex items-start gap-2.5 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800">
                  <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <p>
                    1. No rodapé do Safari, toque no botão <strong>Compartilhar</strong> (ícone de quadrado com seta para cima).
                  </p>
                </div>

                <div className="flex items-start gap-2.5 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800">
                  <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
                    <PlusSquare className="w-4 h-4" />
                  </div>
                  <p>
                    2. Role o menu para baixo e selecione <strong>Adicionar à Tela de Início</strong>.
                  </p>
                </div>

                <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-200/90 text-[11px]">
                  ✓ O aplicativo funcionará em tela cheia como um app nativo, rápido e sem barra de navegação!
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold py-2.5 text-xs transition cursor-pointer"
              >
                Entendi, fechar
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

import React, { useState, useRef } from 'react';
import {
  Lock,
  Eye,
  EyeOff,
  Key,
  ShieldCheck,
  Image as ImageIcon,
  Upload,
  RefreshCw,
  Palette,
  Check,
  Sparkles,
  Sliders,
  CheckCircle2,
  Trash2,
  ExternalLink,
  Scissors,
  Crown,
  Calendar,
  Award,
  AlertTriangle,
  Globe,
  Link2,
  Copy,
  QrCode,
  Share2
} from 'lucide-react';
import barberMascotImg from '../assets/images/barber_mascot_1786873404835.jpg';
import { updateTenantAdminPasswordInFirestore } from '../lib/firebaseServices';

export interface ThemeColorOption {
  id: string;
  name: string;
  category: string;
  hex: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  hoverClass: string;
  ringClass: string;
  gradientClass: string;
}

export const THEME_20_COLORS: ThemeColorOption[] = [
  {
    id: 'amber-gold',
    name: 'Dourado Imperial / Amber',
    category: 'Clássico Barber',
    hex: '#F59E0B',
    bgClass: 'bg-amber-500',
    borderClass: 'border-amber-500',
    textClass: 'text-amber-400',
    hoverClass: 'hover:bg-amber-400',
    ringClass: 'ring-amber-500',
    gradientClass: 'from-amber-500 to-amber-600',
  },
  {
    id: 'yellow-vintage',
    name: 'Amarelo Ouro Vintage',
    category: 'Retrô Clássico',
    hex: '#EAB308',
    bgClass: 'bg-yellow-500',
    borderClass: 'border-yellow-500',
    textClass: 'text-yellow-400',
    hoverClass: 'hover:bg-yellow-400',
    ringClass: 'ring-yellow-500',
    gradientClass: 'from-yellow-400 to-amber-500',
  },
  {
    id: 'orange-sunset',
    name: 'Laranja Sunset Vibrante',
    category: 'Moderno',
    hex: '#F97316',
    bgClass: 'bg-orange-500',
    borderClass: 'border-orange-500',
    textClass: 'text-orange-400',
    hoverClass: 'hover:bg-orange-400',
    ringClass: 'ring-orange-500',
    gradientClass: 'from-orange-500 to-amber-600',
  },
  {
    id: 'orange-rust',
    name: 'Laranja Queimado Rust',
    category: 'Industrial Wood',
    hex: '#EA580C',
    bgClass: 'bg-orange-600',
    borderClass: 'border-orange-600',
    textClass: 'text-orange-500',
    hoverClass: 'hover:bg-orange-500',
    ringClass: 'ring-orange-600',
    gradientClass: 'from-orange-600 to-red-700',
  },
  {
    id: 'red-crimson',
    name: 'Vermelho Carmesim Barbershop',
    category: 'Pole Tradicional',
    hex: '#EF4444',
    bgClass: 'bg-red-500',
    borderClass: 'border-red-500',
    textClass: 'text-red-400',
    hoverClass: 'hover:bg-red-400',
    ringClass: 'ring-red-500',
    gradientClass: 'from-red-500 to-rose-600',
  },
  {
    id: 'rose-ruby',
    name: 'Rubi Nobre / Rose',
    category: 'Luxo Premium',
    hex: '#E11D48',
    bgClass: 'bg-rose-600',
    borderClass: 'border-rose-600',
    textClass: 'text-rose-400',
    hoverClass: 'hover:bg-rose-500',
    ringClass: 'ring-rose-600',
    gradientClass: 'from-rose-500 to-pink-600',
  },
  {
    id: 'wine-marsala',
    name: 'Vinho Marsala / Borgonha',
    category: 'Elegância Dark',
    hex: '#BE123C',
    bgClass: 'bg-rose-700',
    borderClass: 'border-rose-700',
    textClass: 'text-rose-300',
    hoverClass: 'hover:bg-rose-600',
    ringClass: 'ring-rose-700',
    gradientClass: 'from-rose-700 to-purple-900',
  },
  {
    id: 'purple-imperial',
    name: 'Púrpura Imperial',
    category: 'Realeza & Status',
    hex: '#9333EA',
    bgClass: 'bg-purple-600',
    borderClass: 'border-purple-600',
    textClass: 'text-purple-400',
    hoverClass: 'hover:bg-purple-500',
    ringClass: 'ring-purple-600',
    gradientClass: 'from-purple-600 to-indigo-700',
  },
  {
    id: 'violet-neon',
    name: 'Violeta Neon / Cyber',
    category: 'Jovem & Urbano',
    hex: '#8B5CF6',
    bgClass: 'bg-violet-500',
    borderClass: 'border-violet-500',
    textClass: 'text-violet-400',
    hoverClass: 'hover:bg-violet-400',
    ringClass: 'ring-violet-500',
    gradientClass: 'from-violet-500 to-purple-600',
  },
  {
    id: 'indigo-navy',
    name: 'Índigo Meia-Noite',
    category: 'Clássico Executivo',
    hex: '#6366F1',
    bgClass: 'bg-indigo-500',
    borderClass: 'border-indigo-500',
    textClass: 'text-indigo-400',
    hoverClass: 'hover:bg-indigo-400',
    ringClass: 'ring-indigo-500',
    gradientClass: 'from-indigo-500 to-blue-600',
  },
  {
    id: 'blue-sapphire',
    name: 'Azul Safira / Royal',
    category: 'Confiança & Clube',
    hex: '#3B82F6',
    bgClass: 'bg-blue-500',
    borderClass: 'border-blue-500',
    textClass: 'text-blue-400',
    hoverClass: 'hover:bg-blue-400',
    ringClass: 'ring-blue-500',
    gradientClass: 'from-blue-500 to-cyan-600',
  },
  {
    id: 'sky-ocean',
    name: 'Azul Oceano Profundo',
    category: 'Moderno Fresh',
    hex: '#0284C7',
    bgClass: 'bg-sky-600',
    borderClass: 'border-sky-600',
    textClass: 'text-sky-400',
    hoverClass: 'hover:bg-sky-500',
    ringClass: 'ring-sky-600',
    gradientClass: 'from-sky-500 to-blue-700',
  },
  {
    id: 'cyan-electric',
    name: 'Ciano Elétrico / Turquoise',
    category: 'Vibrante Tech',
    hex: '#06B6D4',
    bgClass: 'bg-cyan-500',
    borderClass: 'border-cyan-500',
    textClass: 'text-cyan-400',
    hoverClass: 'hover:bg-cyan-400',
    ringClass: 'ring-cyan-500',
    gradientClass: 'from-cyan-500 to-teal-600',
  },
  {
    id: 'teal-mint',
    name: 'Verde Menta Frescor',
    category: 'Spa & Barboterapia',
    hex: '#14B8A6',
    bgClass: 'bg-teal-500',
    borderClass: 'border-teal-500',
    textClass: 'text-teal-400',
    hoverClass: 'hover:bg-teal-400',
    ringClass: 'ring-teal-500',
    gradientClass: 'from-teal-500 to-emerald-600',
  },
  {
    id: 'emerald-classic',
    name: 'Esmeralda Classic Club',
    category: 'Gentleman & Whisky',
    hex: '#10B981',
    bgClass: 'bg-emerald-500',
    borderClass: 'border-emerald-500',
    textClass: 'text-emerald-400',
    hoverClass: 'hover:bg-emerald-400',
    ringClass: 'ring-emerald-500',
    gradientClass: 'from-emerald-500 to-teal-700',
  },
  {
    id: 'emerald-forest',
    name: 'Verde Floresta Britânico',
    category: 'Vintage British',
    hex: '#059669',
    bgClass: 'bg-emerald-600',
    borderClass: 'border-emerald-600',
    textClass: 'text-emerald-300',
    hoverClass: 'hover:bg-emerald-500',
    ringClass: 'ring-emerald-600',
    gradientClass: 'from-emerald-600 to-green-800',
  },
  {
    id: 'lime-tactical',
    name: 'Verde Lima Tático / Energy',
    category: 'High Impact',
    hex: '#84CC16',
    bgClass: 'bg-lime-500',
    borderClass: 'border-lime-500',
    textClass: 'text-lime-400',
    hoverClass: 'hover:bg-lime-400',
    ringClass: 'ring-lime-500',
    gradientClass: 'from-lime-500 to-emerald-600',
  },
  {
    id: 'bronze-copper',
    name: 'Bronze Acobreado Rust',
    category: 'Couro & Madeira',
    hex: '#B45309',
    bgClass: 'bg-amber-700',
    borderClass: 'border-amber-700',
    textClass: 'text-amber-300',
    hoverClass: 'hover:bg-amber-600',
    ringClass: 'ring-amber-700',
    gradientClass: 'from-amber-700 to-yellow-800',
  },
  {
    id: 'titan-silver',
    name: 'Prata Platina / Titânio',
    category: 'Minimalista Sleek',
    hex: '#94A3B8',
    bgClass: 'bg-slate-400',
    borderClass: 'border-slate-400',
    textClass: 'text-slate-200',
    hoverClass: 'hover:bg-slate-300',
    ringClass: 'ring-slate-400',
    gradientClass: 'from-slate-400 to-slate-600',
  },
  {
    id: 'pink-cyber',
    name: 'Rosa Choque / Cyber Pink',
    category: 'Despojado & Modern',
    hex: '#EC4899',
    bgClass: 'bg-pink-500',
    borderClass: 'border-pink-500',
    textClass: 'text-pink-400',
    hoverClass: 'hover:bg-pink-400',
    ringClass: 'ring-pink-500',
    gradientClass: 'from-pink-500 to-rose-600',
  },
];

interface BarberSettingsTabProps {
  tenantName: string;
  tenantSubdomain: string;
  tempPasswordUsed?: string;
  currentLogoUrl: string;
  currentColorHex: string;
  onUpdateLogo: (newLogo: string) => void;
  onUpdateColor: (color: ThemeColorOption) => void;
  onShowToast: (msg: string) => void;
}

export const BarberSettingsTab: React.FC<BarberSettingsTabProps> = ({
  tenantName,
  tenantSubdomain,
  tempPasswordUsed,
  currentLogoUrl,
  currentColorHex,
  onUpdateLogo,
  onUpdateColor,
  onShowToast,
}) => {
  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [savedActivePassword, setSavedActivePassword] = useState<string>(() => {
    try {
      return localStorage.getItem(`tenant_admin_password_${tenantSubdomain}`) || tempPasswordUsed || '482910';
    } catch {
      return tempPasswordUsed || '482910';
    }
  });

  // Logo State
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Selected Color
  const selectedTheme =
    THEME_20_COLORS.find((c) => c.hex.toLowerCase() === currentColorHex.toLowerCase()) ||
    THEME_20_COLORS[0];

  // Domain & Links State
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://barberpro.app';
  const clientInternalUrl = `${baseUrl}/?b=${tenantSubdomain}`;
  const adminInternalUrl = `${baseUrl}/?admin=${tenantSubdomain}`;
  const customSubdomainUrl = `https://${tenantSubdomain}.barberpro.app`;

  const copyToClipboard = (text: string, keyName: string, label: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedKey(keyName);
      onShowToast(`📋 ${label} copiado com sucesso!`);
      setTimeout(() => setCopiedKey(null), 2500);
    } catch {
      onShowToast('Não foi possível copiar automaticamente.');
    }
  };

  // Password strength calculation
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { label: 'Em branco', color: 'text-gray-500', width: '0%' };
    if (pwd.length < 6) return { label: 'Fraca (mínimo 6 dígitos)', color: 'text-red-400', width: '25%' };
    if (pwd.length >= 8 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) {
      return { label: 'Forte (Excelente)', color: 'text-emerald-400', width: '100%' };
    }
    return { label: 'Média (Aceitável)', color: 'text-yellow-400', width: '60%' };
  };

  const strength = getPasswordStrength(newPassword);

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) {
      onShowToast('Digite a nova senha desejada.');
      return;
    }
    if (newPassword.length < 4) {
      onShowToast('A nova senha deve ter no mínimo 4 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      onShowToast('A confirmação de senha não confere!');
      return;
    }

    setIsSavingPassword(true);
    try {
      const res = await updateTenantAdminPasswordInFirestore(tenantSubdomain, newPassword);
      setIsSavingPassword(false);

      if (res.success) {
        setSavedActivePassword(newPassword);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        onShowToast('🔒 Senha do gerente atualizada com sucesso no banco de dados!');
      } else {
        onShowToast(res.error || 'Erro ao atualizar senha.');
      }
    } catch (err: any) {
      setIsSavingPassword(false);
      onShowToast(err.message || 'Erro ao conectar ao banco de dados.');
    }
  };

  const handleGenerateNumericPin = () => {
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    setNewPassword(pin);
    setConfirmPassword(pin);
    setShowPassword(true);
    onShowToast(`🔢 PIN numérico de 6 dígitos gerado: ${pin}`);
  };

  const handleGenerateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let gen = '';
    for (let i = 0; i < 6; i++) {
      gen += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(gen);
    setConfirmPassword(gen);
    setShowPassword(true);
    onShowToast(`Nova senha alfanumérica de 6 dígitos gerada: ${gen}`);
  };

  // Logo Handlers
  const processImageFile = (file: File) => {
    if (file.size > 3 * 1024 * 1024) {
      onShowToast('A imagem deve ter no máximo 3MB.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        onUpdateLogo(reader.result);
        onShowToast('🎉 Nova Logo da empresa atualizada com sucesso!');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDropFile = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingFile(false);
  };

  const handleResetToDefaultLogo = () => {
    onUpdateLogo('/logo.png');
    onShowToast('Logo restaurada para a imagem oficial da barbearia!');
  };

  return (
    <div id="tab-configuracoes" className="space-y-8 pb-10">
      
      {/* Cabeçalho da Aba */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: selectedTheme.hex }}
            />
            <h2 className="text-xl font-bold text-white">Configurações da Barbearia</h2>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Personalize a segurança de acesso, identidade visual da marca e a paleta de cores do painel.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-900 border border-gray-800 px-3 py-1.5 rounded-lg font-mono">
          <span>Unidade:</span>
          <span className="font-bold text-white">{tenantName}</span>
        </div>
      </div>

      {/* SEÇÃO 1: ALTERAR SENHA DO GERENTE */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5 sm:p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-950 font-bold"
              style={{ backgroundColor: selectedTheme.hex }}
            >
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">1. Alterar Senha de Acesso do Gerente</h3>
              <p className="text-xs text-gray-400">
                Defina a credencial administrativa para acessar este painel sem depender de senhas temporárias.
              </p>
            </div>
          </div>

          {/* Senha Ativa Atual */}
          <div className="flex items-center gap-2 bg-gray-950 border border-gray-800 px-3 py-1.5 rounded-xl text-xs font-mono">
            <Key className="w-3.5 h-3.5" style={{ color: selectedTheme.hex }} />
            <span className="text-gray-400">Senha Ativa:</span>
            <span className="font-bold text-amber-400">{savedActivePassword}</span>
            <button
              type="button"
              onClick={() => copyToClipboard(savedActivePassword, 'active_pwd', 'Senha ativa')}
              className="ml-1 text-gray-400 hover:text-white p-0.5 rounded hover:bg-gray-800 transition"
              title="Copiar senha ativa"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSavePassword} className="space-y-4 max-w-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                Nova Senha / Código PIN
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Ex: 6 dígitos (482910) ou texto"
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 transition pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                Confirmar Nova Senha
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha"
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 transition"
              />
            </div>
          </div>

          {/* Indicador de Força */}
          {newPassword && (
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Força da Senha:</span>
                <span className={`font-semibold ${strength.color}`}>{strength.label}</span>
              </div>
              <div className="w-full h-1.5 bg-gray-950 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    strength.width === '100%'
                      ? 'bg-emerald-500'
                      : strength.width === '60%'
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: strength.width }}
                />
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleGenerateNumericPin}
                className="text-xs text-gray-300 hover:text-white flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-gray-950 hover:bg-gray-800 transition cursor-pointer border border-gray-800 font-semibold"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Gerar PIN 6 Dígitos</span>
              </button>

              <button
                type="button"
                onClick={handleGenerateRandomPassword}
                className="text-xs text-gray-400 hover:text-white flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-gray-950 hover:bg-gray-800 transition cursor-pointer border border-gray-800"
              >
                <span>Código Alfanumérico</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={isSavingPassword}
              className="font-bold py-2.5 px-5 rounded-xl text-xs flex items-center gap-2 text-gray-950 transition cursor-pointer shadow-lg active:scale-95"
              style={{ backgroundColor: selectedTheme.hex }}
            >
              {isSavingPassword ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Salvando no Banco...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Salvar Nova Senha</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* SEÇÃO 2: ALTERAR LOGO DA EMPRESA */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5 sm:p-6 shadow-xl space-y-5">
        <div className="flex items-center space-x-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-950 font-bold"
            style={{ backgroundColor: selectedTheme.hex }}
          >
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">2. Alterar Logo da Empresa</h3>
            <p className="text-xs text-gray-400">
              Faça upload do brasão/logo da sua barbearia ou insira uma imagem para estampar no cabeçalho e nos cartões de clientes.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Visualizador da Logo Atual */}
          <div className="bg-gray-950 border border-gray-800 rounded-xl p-4 flex flex-col items-center justify-center text-center space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Logo Atual da Barbearia
            </span>
            <div
              className="w-28 h-28 rounded-2xl p-2 bg-gray-900 border-2 shadow-inner flex items-center justify-center overflow-hidden"
              style={{ borderColor: selectedTheme.hex }}
            >
              <img
                src={currentLogoUrl}
                alt="Logo Atual Barbearia"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/logo.png';
                }}
                className="w-full h-full object-contain drop-shadow-md"
              />
            </div>
            <div className="text-xs text-gray-300 font-semibold">{tenantName}</div>
            <p className="text-[10px] text-gray-500">Exibida no topo e nas mensagens de fidelidade</p>
          </div>

          {/* Upload de Arquivo Exclusivo */}
          <div className="lg:col-span-2 space-y-4">
            
            <div className="bg-gray-950 border border-gray-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-semibold text-white">
                    Enviar Imagem / Logo da Barbearia
                  </label>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Selecione o arquivo da logo no seu computador ou celular para atualizar a identidade do painel.
                  </p>
                </div>
                <span className="hidden sm:inline-block text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full font-medium">
                  Upload Direto
                </span>
              </div>
              
              <input
                type="file"
                ref={fileInputRef}
                accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml"
                onChange={handleFileUpload}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDropFile}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-3 ${
                  isDraggingFile
                    ? 'border-amber-400 bg-amber-500/10 scale-[1.01]'
                    : 'border-gray-800 hover:border-gray-600 bg-gray-900/50 hover:bg-gray-900'
                }`}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center transition"
                  style={{ backgroundColor: `${selectedTheme.hex}20`, color: selectedTheme.hex }}
                >
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">
                    {isDraggingFile ? 'Solte a imagem aqui para enviar' : 'Clique ou arraste a imagem aqui'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Formatos aceitos: PNG, JPG, SVG ou WEBP (Tamanho máximo: 3MB)
                  </p>
                </div>
                <button
                  type="button"
                  className="mt-2 px-4 py-2 rounded-xl text-xs font-bold text-gray-950 transition"
                  style={{ backgroundColor: selectedTheme.hex }}
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  Escolher Arquivo
                </button>
              </div>
            </div>

            {/* Botão de Restaurar Padrão */}
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleResetToDefaultLogo}
                className="text-xs text-gray-400 hover:text-white flex items-center gap-1.5 py-2 px-3.5 rounded-lg bg-gray-950 hover:bg-gray-800 transition cursor-pointer border border-gray-800"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Restaurar Mascote Oficial Padrão</span>
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* SEÇÃO 3: TABELA COM 20 CORES DE ESTILO */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5 sm:p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-950 font-bold"
              style={{ backgroundColor: selectedTheme.hex }}
            >
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">3. Tabela de Cores do Painel (20 Opções de Estilo)</h3>
              <p className="text-xs text-gray-400">
                Selecione a paleta visual que melhor representa a identidade e o gosto do gerente da barbearia.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-gray-950 border border-gray-800 px-3 py-1.5 rounded-xl text-xs">
            <span className="text-gray-400">Estilo Ativo:</span>
            <span className="font-bold flex items-center gap-1.5 text-white">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: selectedTheme.hex }}
              />
              {selectedTheme.name}
            </span>
          </div>
        </div>

        {/* Grade Visual com as 20 Cores */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {THEME_20_COLORS.map((theme, index) => {
            const isSelected = theme.hex.toLowerCase() === selectedTheme.hex.toLowerCase();

            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => {
                  onUpdateColor(theme);
                  onShowToast(`🎨 Estilo alterado para: ${theme.name}!`);
                }}
                className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between overflow-hidden cursor-pointer select-none active:scale-95 ${
                  isSelected
                    ? 'bg-gray-950 border-2 shadow-lg ring-2 ring-offset-2 ring-offset-gray-900'
                    : 'bg-gray-950/60 hover:bg-gray-950 border-gray-800/80 hover:border-gray-700'
                }`}
                style={{
                  borderColor: isSelected ? theme.hex : undefined,
                  boxShadow: isSelected ? `0 0 15px ${theme.hex}30` : undefined,
                }}
              >
                {/* Cabeçalho da Cor com Amostra e Check */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-6 h-6 rounded-lg shadow-sm flex items-center justify-center shrink-0 border border-white/20"
                      style={{ backgroundColor: theme.hex }}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 text-gray-950 stroke-[3]" />}
                    </span>
                    <span className="text-[10px] font-mono text-gray-400">
                      #{index + 1}
                    </span>
                  </div>

                  <span className="text-[9px] font-mono text-gray-400 bg-gray-900 px-1.5 py-0.5 rounded">
                    {theme.hex}
                  </span>
                </div>

                {/* Nome e Categoria */}
                <div>
                  <h4 className="text-xs font-bold text-white truncate leading-tight">
                    {theme.name.split('/')[0]}
                  </h4>
                  <p className="text-[10px] text-gray-500 truncate mt-0.5">
                    {theme.category}
                  </p>
                </div>

                {/* Barra inferior colorida */}
                <div
                  className="w-full h-1 rounded-full mt-2"
                  style={{ backgroundColor: theme.hex }}
                />
              </button>
            );
          })}
        </div>

        {/* PRÉ-VISUALIZAÇÃO EM TEMPO REAL DO ESTILO SELECIONADO */}
        <div className="bg-gray-950 border border-gray-800 rounded-xl p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-800 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
              <Sliders className="w-4 h-4" style={{ color: selectedTheme.hex }} />
              <span>Pré-visualização do Estilo no Sistema</span>
            </span>
            <span
              className="text-[11px] font-bold px-2.5 py-0.5 rounded-full"
              style={{
                backgroundColor: `${selectedTheme.hex}20`,
                color: selectedTheme.hex,
                border: `1px solid ${selectedTheme.hex}40`,
              }}
            >
              Tema: {selectedTheme.name}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Exemplo 1: Botão Principal */}
            <div className="bg-gray-900 p-4 rounded-xl border border-gray-800/80 flex flex-col justify-between space-y-3">
              <span className="text-[11px] text-gray-400">Botão de Ação & Destaques</span>
              <button
                type="button"
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-gray-950 flex items-center justify-center gap-1.5 shadow-md"
                style={{ backgroundColor: selectedTheme.hex }}
              >
                <Scissors className="w-4 h-4" />
                <span>+ Novo Agendamento</span>
              </button>
            </div>

            {/* Exemplo 2: Badge e Indicadores */}
            <div className="bg-gray-900 p-4 rounded-xl border border-gray-800/80 flex flex-col justify-between space-y-3">
              <span className="text-[11px] text-gray-400">Badges & Notificações</span>
              <div className="flex items-center gap-2">
                <span
                  className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"
                  style={{
                    backgroundColor: `${selectedTheme.hex}20`,
                    color: selectedTheme.hex,
                    border: `1px solid ${selectedTheme.hex}40`,
                  }}
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>10 Pontos</span>
                </span>
                <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
                  Livre
                </span>
              </div>
            </div>

            {/* Exemplo 3: Card Agendamento Mini */}
            <div
              className="bg-gray-900 p-3 rounded-xl border flex items-center justify-between"
              style={{ borderColor: `${selectedTheme.hex}50` }}
            >
              <div className="flex items-center space-x-2.5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-gray-950"
                  style={{ backgroundColor: selectedTheme.hex }}
                >
                  09h
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Corte + Barboterapia</p>
                  <p className="text-[10px] text-gray-400">Cliente VIP • Marcos</p>
                </div>
              </div>
              <span className="font-mono text-xs font-bold text-white">R$ 95,00</span>
            </div>

          </div>
        </div>

      </div>

      {/* SEÇÃO 4: DOMÍNIO INTERNO & LINKS DE ACESSO */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5 sm:p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-950 font-bold shrink-0"
              style={{ backgroundColor: selectedTheme.hex }}
            >
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">4. Domínio Interno & Links Exclusivos</h3>
              <p className="text-xs text-gray-400">
                Endereços de acesso direto da sua barbearia para compartilhar no Instagram, WhatsApp e QR Codes.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono bg-gray-950 border border-gray-800 text-amber-400 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Slug: <strong>{tenantSubdomain}</strong></span>
            </span>
          </div>
        </div>

        {/* Grid de Links Gerados */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Link 1: App do Cliente (Agendamentos) */}
          <div className="bg-gray-950 border border-gray-800 rounded-xl p-4 space-y-3 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Share2 className="w-4 h-4 text-emerald-400" />
                  <span>Link de Agendamento do Cliente</span>
                </span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-mono">
                  Principal
                </span>
              </div>
              <p className="text-[11px] text-gray-400">
                Envie para clientes ou coloque na bio do Instagram. Abre direto a sua barbearia.
              </p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-lg p-2.5 flex items-center justify-between gap-2">
              <span className="text-xs font-mono text-gray-300 truncate max-w-[280px]">
                {clientInternalUrl}
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => copyToClipboard(clientInternalUrl, 'client', 'Link do Cliente')}
                  className="px-2.5 py-1.5 rounded-md text-xs font-semibold text-gray-950 flex items-center gap-1 transition cursor-pointer"
                  style={{ backgroundColor: selectedTheme.hex }}
                  title="Copiar Link de Agendamento"
                >
                  {copiedKey === 'client' ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
                <a
                  href={clientInternalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-md text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 transition"
                  title="Testar em nova aba"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Link 2: Painel de Gerência (Administrativo) */}
          <div className="bg-gray-950 border border-gray-800 rounded-xl p-4 space-y-3 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-amber-400" />
                  <span>Link Direto do Painel da Barbearia</span>
                </span>
                <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded font-mono">
                  Gerência
                </span>
              </div>
              <p className="text-[11px] text-gray-400">
                Acesso direto dos barbeiros e recepção para gerenciar a agenda e o caixa.
              </p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-lg p-2.5 flex items-center justify-between gap-2">
              <span className="text-xs font-mono text-gray-300 truncate max-w-[280px]">
                {adminInternalUrl}
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => copyToClipboard(adminInternalUrl, 'admin', 'Link da Gerência')}
                  className="px-2.5 py-1.5 rounded-md text-xs font-semibold text-gray-950 flex items-center gap-1 transition cursor-pointer"
                  style={{ backgroundColor: selectedTheme.hex }}
                  title="Copiar Link de Gerência"
                >
                  {copiedKey === 'admin' ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
                <a
                  href={adminInternalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-md text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 transition"
                  title="Testar em nova aba"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* QR Code & Guia de Domínio Próprio / Subdomínio Netlify */}
        <div className="bg-gray-950 border border-gray-800 rounded-xl p-5 flex flex-col md:flex-row items-center gap-6">
          
          {/* Card QR Code Balcão */}
          <div className="bg-gray-900 border-2 rounded-2xl p-4 flex flex-col items-center justify-center text-center space-y-2.5 shrink-0 shadow-lg" style={{ borderColor: selectedTheme.hex }}>
            <div className="p-3 bg-white rounded-xl shadow-inner flex items-center justify-center">
              {/* QR Code Simulado em Alta Resolução em SVG */}
              <svg
                viewBox="0 0 100 100"
                className="w-24 h-24 text-gray-950"
                fill="currentColor"
              >
                <rect x="0" y="0" width="30" height="30" rx="3" />
                <rect x="5" y="5" width="20" height="20" fill="white" rx="2" />
                <rect x="9" y="9" width="12" height="12" fill="currentColor" rx="1" />

                <rect x="70" y="0" width="30" height="30" rx="3" />
                <rect x="75" y="5" width="20" height="20" fill="white" rx="2" />
                <rect x="79" y="9" width="12" height="12" fill="currentColor" rx="1" />

                <rect x="0" y="70" width="30" height="30" rx="3" />
                <rect x="5" y="75" width="20" height="20" fill="white" rx="2" />
                <rect x="9" y="79" width="12" height="12" fill="currentColor" rx="1" />

                <rect x="36" y="10" width="8" height="8" />
                <rect x="48" y="10" width="8" height="8" />
                <rect x="36" y="24" width="8" height="8" />
                <rect x="48" y="36" width="8" height="8" />
                <rect x="10" y="36" width="8" height="8" />
                <rect x="24" y="48" width="8" height="8" />
                <rect x="36" y="48" width="8" height="8" />
                <rect x="48" y="60" width="8" height="8" />
                <rect x="60" y="48" width="8" height="8" />
                <rect x="72" y="36" width="8" height="8" />
                <rect x="84" y="48" width="8" height="8" />
                <rect x="36" y="72" width="8" height="8" />
                <rect x="48" y="84" width="8" height="8" />
                <rect x="60" y="72" width="8" height="8" />
                <rect x="72" y="84" width="8" height="8" />
                <rect x="84" y="72" width="8" height="8" />
              </svg>
            </div>
            <div>
              <span className="text-xs font-bold text-white block">{tenantName}</span>
              <span className="text-[10px] text-gray-400 font-mono">://{tenantSubdomain}</span>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(clientInternalUrl, 'qr', 'Link do QR Code')}
              className="text-[11px] font-semibold text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded-lg transition"
            >
              Imprimir / Compartilhar
            </button>
          </div>

          {/* Explicação Didática */}
          <div className="space-y-3 flex-1 text-left">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Link2 className="w-4 h-4 text-amber-400" />
              <span>Como funciona o Domínio Interno no Sistema?</span>
            </h4>
            <div className="space-y-2 text-xs text-gray-300 leading-relaxed">
              <p>
                • <strong>Modo Link Direto / Parâmetro Interno (Ativo Agora):</strong> Qualquer cliente que clicar no link <code>?b={tenantSubdomain}</code> entra diretamente na sua barbearia com a sua logo, cores e serviços configurados.
              </p>
              <p>
                • <strong>Modo Subdomínio Netlify / Vercel (DNS Wildcard):</strong> Se você configurar o domínio próprio no Netlify com wildcard <code>*.seudominio.com.br</code>, a barbearia responderá automaticamente em <code>{tenantSubdomain}.seudominio.com.br</code> sem precisar de novas configurações.
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

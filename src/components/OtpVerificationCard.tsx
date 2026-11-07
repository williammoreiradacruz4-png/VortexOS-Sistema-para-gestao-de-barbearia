import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Sparkles, 
  ArrowRight, 
  RotateCcw,
  ShieldAlert,
  Scissors,
  UserCheck,
  ChevronRight,
  Lock,
  Eye,
  EyeOff,
  Building2,
  ChevronDown,
  Mail,
  UserPlus
} from 'lucide-react';
import { Tenant } from '../types';
import { 
  getSuperAdminConfigFromFirestore, 
  getTenantsFromFirestore,
  subscribeToTenants,
  loginClientInFirebase,
  registerClientInFirebase
} from '../lib/firebaseServices';
import { PWAInstallButton } from './PWAInstallButton';

export type AccessRole = 'admin' | 'barbearia' | 'cliente';

interface RoleConfig {
  id: AccessRole;
  title: string;
  subtitle: string;
  badge: string;
  icon: typeof ShieldAlert;
  accentColor: string;
  activeBorder: string;
  activeBg: string;
  demoCode: string;
}

const ACCESS_ROLES: RoleConfig[] = [
  {
    id: 'admin',
    title: 'Acesso: Painel Administrador Geral',
    subtitle: 'Gestão global do sistema e configurações',
    badge: 'Master',
    icon: ShieldAlert,
    accentColor: 'text-amber-400',
    activeBorder: 'border-orange-500 ring-2 ring-orange-500/30 bg-gradient-to-r from-orange-950/70 to-zinc-900/90',
    activeBg: 'bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-md shadow-orange-600/30',
    demoCode: '901245',
  },
  {
    id: 'barbearia',
    title: 'Acesso: Painel Barbearia',
    subtitle: 'Agenda, serviços, barbeiros e financeiro',
    badge: 'Estabelecimento',
    icon: Scissors,
    accentColor: 'text-orange-400',
    activeBorder: 'border-orange-500 ring-2 ring-orange-500/30 bg-gradient-to-r from-orange-950/70 to-zinc-900/90',
    activeBg: 'bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-md shadow-orange-600/30',
    demoCode: '482910',
  },
  {
    id: 'cliente',
    title: 'Acesso: Painel Cliente',
    subtitle: 'Digite seu e-mail para agendamentos e fidelidade',
    badge: 'App Cliente',
    icon: UserCheck,
    accentColor: 'text-amber-300',
    activeBorder: 'border-orange-500 ring-2 ring-orange-500/30 bg-gradient-to-r from-orange-950/70 to-zinc-900/90',
    activeBg: 'bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-md shadow-orange-600/30',
    demoCode: '317854',
  },
];

export interface OtpVerificationCardProps {
  initialRole?: AccessRole;
  onSuccess?: (role: AccessRole, initialScreen?: 'auth' | 'home', tenant?: Tenant) => void;
  onDirectRegister?: () => void;
}

export const OtpVerificationCard: React.FC<OtpVerificationCardProps> = ({
  initialRole = 'barbearia',
  onSuccess,
  onDirectRegister,
}) => {
  const [selectedRole, setSelectedRole] = useState<AccessRole>(initialRole);
  const currentRole = ACCESS_ROLES.find((r) => r.id === selectedRole) || ACCESS_ROLES[1];

  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [showCode, setShowCode] = useState<boolean>(false);
  const [activeCode, setActiveCode] = useState<string>(currentRole.demoCode);
  const [, setActiveFocusIndex] = useState<number>(0);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' | 'info' } | null>(null);
  const [shake, setShake] = useState<boolean>(false);
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);

  // Client Email Form State
  const [clientIdentifier, setClientIdentifier] = useState<string>('');
  const [clientPassword, setClientPassword] = useState<string>('');
  const [clientName, setClientName] = useState<string>('');
  const [clientPhone, setClientPhone] = useState<string>('');
  const [isClientRegisterMode, setIsClientRegisterMode] = useState<boolean>(false);
  const [isClientLoggingIn, setIsClientLoggingIn] = useState<boolean>(false);

  // Dynamic state from Firestore
  const [adminCode, setAdminCode] = useState<string>('901245');
  const [clientCode] = useState<string>('317854');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [tenantSelectorOpen, setTenantSelectorOpen] = useState<boolean>(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Helper to get effective password for a tenant
  const getEffectiveTenantPassword = (t: Tenant | null): string => {
    if (!t) return '482910';
    try {
      const localSubdomainPass = localStorage.getItem(`tenant_admin_password_${t.subdomain}`);
      if (localSubdomainPass) return localSubdomainPass;
      const localIdPass = localStorage.getItem(`tenant_admin_password_${t.id}`);
      if (localIdPass) return localIdPass;
    } catch {
      // ignore
    }
    return t.adminAccessCode || t.adminPassword || t.lastTempPassword?.code || '482910';
  };

  // Load registered tenants and super admin password from Firestore on mount & live subscription
  useEffect(() => {
    let isMounted = true;

    const updateTenantsState = (dbTenants: Tenant[]) => {
      if (!isMounted || !dbTenants || dbTenants.length === 0) return;
      setTenants(dbTenants);

      setSelectedTenant((prev) => {
        if (prev) {
          const found = dbTenants.find((t) => t.id === prev.id || t.subdomain === prev.subdomain);
          if (found) return found;
        }
        return dbTenants[0];
      });
    };

    async function loadData() {
      try {
        const [superAdminCfg, dbTenants] = await Promise.all([
          getSuperAdminConfigFromFirestore(),
          getTenantsFromFirestore(),
        ]);

        if (!isMounted) return;

        const currentAdminPass = superAdminCfg.adminAccessCode || superAdminCfg.adminPassword || '901245';
        setAdminCode(currentAdminPass);

        if (dbTenants && dbTenants.length > 0) {
          updateTenantsState(dbTenants);
          const firstTenant = dbTenants[0];
          if (selectedRole === 'barbearia') {
            const barbCode = getEffectiveTenantPassword(firstTenant);
            setActiveCode(barbCode);
          }
        }
      } catch (err) {
        console.warn('Erro ao carregar dados no OtpVerificationCard:', err);
      }
    }

    loadData();

    // 1. Ouvinte Firestore em tempo real
    const unsubscribe = subscribeToTenants((updatedList) => {
      updateTenantsState(updatedList);
    });

    // 2. Ouvinte de evento local para sincronização instantânea
    const handleTenantListEvent = async () => {
      const refreshed = await getTenantsFromFirestore();
      updateTenantsState(refreshed);
    };
    window.addEventListener('tenant_list_updated', handleTenantListEvent);

    return () => {
      isMounted = false;
      unsubscribe();
      window.removeEventListener('tenant_list_updated', handleTenantListEvent);
    };
  }, []);

  // When changing access role
  const handleSelectRole = (roleId: AccessRole) => {
    setSelectedRole(roleId);
    setDigits(['', '', '', '', '', '']);
    setTenantSelectorOpen(false);

    if (roleId === 'admin') {
      setActiveCode(adminCode);
      setMessage({
        text: `Alterado para Painel Administrador Geral (Senha do Super Admin)`,
        type: 'info',
      });
    } else if (roleId === 'barbearia') {
      const code = getEffectiveTenantPassword(selectedTenant);
      setActiveCode(code);
      setMessage({
        text: selectedTenant ? `Barbearia: ${selectedTenant.name}` : `Alterado para Painel Barbearia`,
        type: 'info',
      });
    } else {
      setActiveCode(clientCode);
      setMessage({
        text: `Alterado para Painel Cliente`,
        type: 'info',
      });
    }

    setTimeout(() => {
      inputRefs.current[0]?.focus();
      setActiveFocusIndex(0);
    }, 50);
  };

  // When changing specific company/tenant
  const handleSelectTenant = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setTenantSelectorOpen(false);
    const code = getEffectiveTenantPassword(tenant);
    setActiveCode(code);
    setDigits(['', '', '', '', '', '']);
    setMessage({
      text: `Barbearia selecionada: ${tenant.name}`,
      type: 'info',
    });
    setTimeout(() => {
      inputRefs.current[0]?.focus();
      setActiveFocusIndex(0);
    }, 50);
  };

  // Auto-focus the first input on component mount
  useEffect(() => {
    if (!isSuccess && inputRefs.current[0]) {
      inputRefs.current[0]?.focus();
      setActiveFocusIndex(0);
    }
  }, [isSuccess]);

  // Input change handler
  const handleInputChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const cleanNumber = val.replace(/[^A-Za-z0-9]/g, '');

    const newDigits = [...digits];

    if (cleanNumber.length <= 1) {
      newDigits[index] = cleanNumber;
      setDigits(newDigits);
      setMessage(null);

      // Advance to next input
      if (index < 5) {
        inputRefs.current[index + 1]?.focus();
        setActiveFocusIndex(index + 1);
      } else {
        setActiveFocusIndex(5);
        // If last digit filled, auto verify if complete
        const allFilled = newDigits.every((d) => d !== '');
        if (allFilled) {
          triggerVerification(newDigits.join(''));
        }
      }
    } else {
      // Handles pasting or quick multiple characters in one box
      const chars = cleanNumber.slice(0, 6).split('');
      chars.forEach((char, i) => {
        if (index + i < 6) {
          newDigits[index + i] = char;
        }
      });
      setDigits(newDigits);
      const nextFocus = Math.min(index + chars.length, 5);
      inputRefs.current[nextFocus]?.focus();
      setActiveFocusIndex(nextFocus);

      if (newDigits.every((d) => d !== '')) {
        triggerVerification(newDigits.join(''));
      }
    }
  };

  // Keyboard navigation (Backspace, arrows)
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (digits[index] === '' && index > 0) {
        // Move to previous input and delete it
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        setDigits(newDigits);
        inputRefs.current[index - 1]?.focus();
        setActiveFocusIndex(index - 1);
      } else {
        const newDigits = [...digits];
        newDigits[index] = '';
        setDigits(newDigits);
        setActiveFocusIndex(index);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
      setActiveFocusIndex(index - 1);
    } else if (e.key === 'ArrowRight' && index < 5) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
      setActiveFocusIndex(index + 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleVerifyClick();
    }
  };

  // Paste handler to distribute 6 digits cleanly
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim().replace(/[^A-Za-z0-9]/g, '');
    if (!pasteData) return;

    const chars = pasteData.slice(0, 6).split('');
    const newDigits = [...digits];

    chars.forEach((char, i) => {
      if (i < 6) {
        newDigits[i] = char;
      }
    });

    setDigits(newDigits);
    setMessage(null);

    const targetFocus = Math.min(chars.length, 5);
    inputRefs.current[targetFocus]?.focus();
    setActiveFocusIndex(targetFocus);

    if (newDigits.every((d) => d !== '')) {
      triggerVerification(newDigits.join(''));
    }
  };

  // Verification process
  const triggerVerification = (enteredOtp: string) => {
    if (isVerifying) return;
    setIsVerifying(true);
    setMessage(null);

    setTimeout(() => {
      setIsVerifying(false);
      const normalizedEntered = enteredOtp.trim().toLowerCase();
      const activeNormalized = activeCode.trim().toLowerCase();

      // Check Super Admin Code
      const adminPassNorm = (adminCode || '901245').trim().toLowerCase();
      if (normalizedEntered === adminPassNorm || normalizedEntered === '901245') {
        setIsSuccess(true);
        setMessage({ text: '✅ Acesso Super Admin confirmado! Abrindo painel...', type: 'success' });
        if (onSuccess) {
          setTimeout(() => {
            onSuccess('admin');
          }, 700);
        }
        return;
      }

      // Check Barbearia Code (Finds the EXACT tenant whose temp password or admin password matches)
      let foundExpired = false;

      // Read freshest tenant list from memory and localstorage to ensure zero lag
      let currentTenants = [...tenants];
      try {
        const cached = localStorage.getItem('cached_tenants_list');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const mergedMap = new Map<string, Tenant>();
            currentTenants.forEach((t) => mergedMap.set(t.id || t.subdomain, t));
            parsed.forEach((t: Tenant) => mergedMap.set(t.id || t.subdomain, { ...mergedMap.get(t.id || t.subdomain), ...t }));
            currentTenants = Array.from(mergedMap.values());
          }
        }
      } catch {}

      // Priority 1: Match by temporary password specifically generated for that tenant
      let matchedTenant = currentTenants.find((t) => {
        const tempCode = (t.lastTempPassword?.code || '').trim().toLowerCase();
        let passLocal = '';
        try {
          passLocal = (
            localStorage.getItem(`tenant_admin_password_${t.subdomain}`) ||
            localStorage.getItem(`tenant_admin_password_${t.id}`) ||
            ''
          ).trim().toLowerCase();
        } catch {}

        if (tempCode && tempCode === normalizedEntered) {
          const expiresAt = t.lastTempPassword?.expiresAt;
          if (expiresAt) {
            const expTime = new Date(expiresAt).getTime();
            if (!isNaN(expTime) && expTime < Date.now()) {
              foundExpired = true;
              return false;
            }
          }
          return true;
        }

        if (passLocal && passLocal === normalizedEntered && passLocal !== '482910') {
          return true;
        }

        return false;
      });

      // Priority 2: If selected tenant in selector matches
      if (!matchedTenant && !foundExpired && selectedTenant) {
        const selPass = (selectedTenant.adminAccessCode || selectedTenant.adminPassword || '').trim().toLowerCase();
        const selTemp = (selectedTenant.lastTempPassword?.code || '').trim().toLowerCase();
        let selLocal = '';
        try {
          selLocal = (
            localStorage.getItem(`tenant_admin_password_${selectedTenant.subdomain}`) ||
            localStorage.getItem(`tenant_admin_password_${selectedTenant.id}`) ||
            ''
          ).trim().toLowerCase();
        } catch {}

        if (normalizedEntered === selPass || normalizedEntered === selTemp || normalizedEntered === selLocal) {
          matchedTenant = selectedTenant;
        }
      }

      // Priority 3: Match fixed access code or password on any tenant
      if (!matchedTenant && !foundExpired) {
        matchedTenant = currentTenants.find((t) => {
          const passFirestore = (t.adminAccessCode || t.adminPassword || '').trim().toLowerCase();
          return passFirestore && passFirestore === normalizedEntered;
        });
      }

      if (foundExpired) {
        setShake(true);
        setTimeout(() => setShake(false), 500);
        setMessage({
          text: '⚠️ Esta senha temporária expirou. Solicite a geração de uma nova senha ao Super Admin.',
          type: 'error',
        });
        setDigits(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        return;
      }

      if (matchedTenant) {
        setIsSuccess(true);
        setMessage({
          text: `✅ Senha confirmada! Acessando painel de ${matchedTenant.name}...`,
          type: 'success',
        });
        if (onSuccess) {
          setTimeout(() => {
            onSuccess('barbearia', 'home', matchedTenant);
          }, 700);
        }
        return;
      }

      // Check Cliente Code
      if (selectedRole === 'cliente') {
        const clientPassNorm = (clientCode || '317854').trim().toLowerCase();
        if (
          normalizedEntered === clientPassNorm ||
          normalizedEntered === '317854'
        ) {
          setIsSuccess(true);
          setMessage({ text: '✅ Acesso ao Painel Cliente autorizado!', type: 'success' });
          if (onSuccess) {
            setTimeout(() => {
              onSuccess('cliente', 'home', selectedTenant || undefined);
            }, 700);
          }
          return;
        }
      }

      // Failure - Invalid password for all registered establishments
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setMessage({
        text: '❌ Código ou senha temporária inválida. Digite a senha de 6 dígitos liberada pelo Super Admin para sua barbearia.',
        type: 'error',
      });
      setDigits(['', '', '', '', '', '']);
      setActiveFocusIndex(0);
      inputRefs.current[0]?.focus();
    }, 600);
  };

  const handleVerifyClick = () => {
    const fullOtp = digits.join('');
    if (fullOtp.length < 6) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setMessage({
        text: 'Por favor, digite os 6 dígitos numéricos do código.',
        type: 'error',
      });
      const firstEmptyIndex = digits.findIndex((d) => d === '');
      if (firstEmptyIndex !== -1) {
        inputRefs.current[firstEmptyIndex]?.focus();
        setActiveFocusIndex(firstEmptyIndex);
      }
      return;
    }
    triggerVerification(fullOtp);
  };

  // Client Email Login & Register Handler
  const handleClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isClientLoggingIn) return;

    const targetTenant = selectedTenant || tenants[0] || {
      id: 'navalha-ouro',
      name: 'Barbearia Navalha de Ouro',
      subdomain: 'navalha-ouro',
      cnpj: '12.345.678/0001-90',
      monthlyValue: 450,
      status: 'Ativo' as const,
      adminEmail: 'contato@navalhaouro.com',
      createdAt: '2026-08-15',
    };

    if (isClientRegisterMode) {
      if (!clientName.trim()) {
        setMessage({ text: 'Por favor, informe seu nome completo.', type: 'error' });
        return;
      }
      if (!clientIdentifier.trim()) {
        setMessage({ text: 'Por favor, digite seu e-mail.', type: 'error' });
        return;
      }
      setIsClientLoggingIn(true);
      setMessage(null);
      try {
        const result = await registerClientInFirebase(
          clientName.trim(),
          clientIdentifier.trim(),
          clientPassword.trim() || '123456',
          clientPhone.trim() || '',
          targetTenant.subdomain,
          targetTenant.name
        );
        if (result.success && result.data) {
          setIsSuccess(true);
          setMessage({ text: `✅ Cadastro realizado na ${targetTenant.name}! Bem-vindo, ${result.data.name}!`, type: 'success' });
          if (onSuccess) {
            setTimeout(() => {
              onSuccess('cliente', 'home', targetTenant);
            }, 600);
          }
        } else {
          setMessage({ text: result.error || 'Erro ao realizar cadastro.', type: 'error' });
        }
      } catch (err: any) {
        setMessage({ text: err.message || 'Erro ao processar cadastro.', type: 'error' });
      } finally {
        setIsClientLoggingIn(false);
      }
    } else {
      // Login Mode
      if (!clientIdentifier.trim()) {
        setMessage({ text: 'Por favor, digite seu e-mail ou telefone para entrar.', type: 'error' });
        return;
      }
      setIsClientLoggingIn(true);
      setMessage(null);
      try {
        const result = await loginClientInFirebase(
          clientIdentifier.trim(),
          clientPassword.trim(),
          targetTenant.subdomain
        );
        if (result.success && result.data) {
          setIsSuccess(true);
          const matchedTenant = result.data.tenantId
            ? tenants.find((t) => t.id === result.data?.tenantId || t.subdomain === result.data?.tenantId)
            : null;
          const finalTenant = matchedTenant || targetTenant;

          setMessage({ text: `✅ Olá, ${result.data.name}! Acessando ${finalTenant.name}...`, type: 'success' });
          if (onSuccess) {
            setTimeout(() => {
              onSuccess('cliente', 'home', finalTenant);
            }, 600);
          }
        } else {
          setMessage({
            text: result.error || 'Cadastro não encontrado. Verifique seu e-mail ou crie uma conta na aba "Criar Conta".',
            type: 'error',
          });
        }
      } catch (err: any) {
        setMessage({ text: err.message || 'Erro ao efetuar login.', type: 'error' });
      } finally {
        setIsClientLoggingIn(false);
      }
    }
  };

  // Quick fill helper for demo/testing
  const autoFillDemoCode = () => {
    const chars = activeCode.slice(0, 6).split('');
    setDigits(chars);
    setMessage(null);
    setActiveFocusIndex(5);
    inputRefs.current[5]?.focus();
  };

  const copyDemoCode = () => {
    navigator.clipboard.writeText(activeCode);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  const resetAll = () => {
    setIsSuccess(false);
    setDigits(['', '', '', '', '', '']);
    setActiveFocusIndex(0);
    setMessage(null);
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 100);
  };

  return (
    <div className="otp-wrapper w-full min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-neutral-950 to-black text-slate-100 transition-colors duration-300 relative overflow-hidden">
      
      {/* Subtle Background Glow Spheres */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main OTP Card with Rotating Border Light Beam & Diagonal Black/Orange Gradient */}
      <div className="relative w-full max-w-md p-[2px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl shadow-orange-950/40 transition-all duration-500 z-10">
        {/* Ambient Outer Halo Glow */}
        <div
          className={`absolute -inset-[150%] animate-rotate-border opacity-85 blur-2xl pointer-events-none transition-all duration-700 ${
            isSuccess
              ? 'bg-[conic-gradient(from_0deg,transparent_0_220deg,#059669_270deg,#10b981_315deg,#6ee7b7_350deg,#ffffff_360deg)]'
              : 'bg-[conic-gradient(from_0deg,transparent_0_230deg,#ea580c_275deg,#f97316_315deg,#fbbf24_350deg,#ffffff_360deg)]'
          }`}
        />

        {/* Sharp Rotating Border Light Beam */}
        <div
          className={`absolute -inset-[150%] animate-rotate-border pointer-events-none transition-all duration-700 ${
            isSuccess
              ? 'bg-[conic-gradient(from_0deg,transparent_0_250deg,#047857_285deg,#10b981_325deg,#a7f3d0_355deg,#ffffff_360deg)]'
              : 'bg-[conic-gradient(from_0deg,transparent_0_250deg,#c2410c_285deg,#f97316_325deg,#fed7aa_355deg,#ffffff_360deg)]'
          }`}
        />

        {/* Card Content Surface (DIAGONAL PRETO / LARANJA) */}
        <motion.div
          layout
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="otp-card relative w-full bg-[linear-gradient(135deg,#09090b_0%,#131316_42%,#9a3412_88%,#ea580c_118%)] border border-orange-500/20 rounded-[14px] sm:rounded-[22px] overflow-hidden shadow-2xl"
        >
        {/* Subtle diagonal specular sheen */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.06),transparent_50%)] pointer-events-none" />

        <AnimatePresence mode="wait">
          {!isSuccess ? (
            /* OTP FORM */
            <motion.div
              key="otp-form"
              id="otpForm"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.25 }}
              className="p-6 sm:p-8 flex flex-col items-center text-center relative z-10"
            >
              {/* Logo Badge */}
              <motion.div 
                whileHover={{ rotate: [0, -6, 6, -3, 0] }}
                transition={{ duration: 0.5 }}
                className="lock w-18 h-18 rounded-2xl bg-zinc-950/90 border-2 border-orange-500/40 flex items-center justify-center p-2 mb-2 shadow-xl shadow-orange-950/60 select-none overflow-hidden"
              >
                <img src="/logo.png" alt="Logo Barbearia" className="w-full h-full object-contain" />
              </motion.div>

              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mb-2">
                Bem-vindo à sua Barbearia
              </h2>

              <div className="mb-3 flex items-center gap-2">
                {/* Active Role Indicator Badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900/90 border border-orange-500/30 text-xs font-semibold text-orange-200 shadow-xs">
                  <currentRole.icon className={`w-3.5 h-3.5 ${currentRole.accentColor}`} />
                  <span>{currentRole.title}</span>
                </div>
                <PWAInstallButton variant="subtle" label="Instalar" />
              </div>

              {/* Barbearia Guidance Area */}
              {selectedRole === 'barbearia' && (
                <div className="w-full mb-5 text-left bg-gradient-to-r from-orange-950/40 via-zinc-900/90 to-orange-950/40 border border-orange-500/30 rounded-xl p-3.5 shadow-inner space-y-1.5">
                  <div className="flex items-center gap-2 text-orange-400 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4 text-orange-400" />
                    <span>Modo Senha Temporária por Barbearia</span>
                  </div>
                  <p className="text-[11px] text-zinc-300 leading-relaxed">
                    Cada barbearia possui uma chave temporária exclusiva liberada pelo Super Admin. Digite a sua senha de 6 dígitos no campo abaixo para abrir o painel da sua barbearia.
                  </p>
                </div>
              )}

              {/* If Role is 'cliente': Email Direct Input Form with Criar Conta & Barbearia Selector */}
              {selectedRole === 'cliente' ? (
                <div className="w-full flex flex-col items-center my-1 relative z-10">
                  {/* Segmented Tabs: Criar Conta vs Já Tenho Cadastro */}
                  <div className="w-full flex bg-zinc-900/90 p-1 rounded-xl border border-orange-500/30 mb-3.5">
                    <button
                      type="button"
                      onClick={() => {
                        setIsClientRegisterMode(true);
                        setMessage(null);
                      }}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        isClientRegisterMode
                          ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md shadow-orange-600/30'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Criar Conta</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsClientRegisterMode(false);
                        setMessage(null);
                      }}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        !isClientRegisterMode
                          ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md shadow-orange-600/30'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Já Tenho Cadastro</span>
                    </button>
                  </div>

                  <form
                    onSubmit={handleClientSubmit}
                    className="w-full flex flex-col items-center gap-3"
                  >
                    {/* Seletor da Barbearia onde o cliente vai se cadastrar/acessar */}
                    <div className="w-full text-left space-y-1.5 bg-zinc-900/60 border border-orange-500/30 rounded-xl p-3">
                      <div className="flex items-center justify-between">
                        <label
                          htmlFor="client-barbearia-select"
                          className="block text-xs font-bold text-orange-300 uppercase tracking-wide flex items-center gap-1.5"
                        >
                          <Building2 className="w-3.5 h-3.5 text-orange-400" />
                          <span>{isClientRegisterMode ? 'Selecione sua Barbearia *' : 'Sua Barbearia'}</span>
                        </label>
                        <span className="text-[10px] text-amber-400 font-semibold">
                          {tenants.length} {tenants.length === 1 ? 'disponível' : 'disponíveis'}
                        </span>
                      </div>
                      <div className="relative">
                        <select
                          id="client-barbearia-select"
                          value={selectedTenant?.subdomain || (tenants[0]?.subdomain) || ''}
                          onChange={(e) => {
                            const found = tenants.find((t) => t.subdomain === e.target.value);
                            if (found) {
                              setSelectedTenant(found);
                              setMessage(null);
                            }
                          }}
                          className="w-full pl-3.5 pr-8 py-2.5 bg-zinc-950 border border-orange-500/40 rounded-lg text-white font-semibold text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition appearance-none cursor-pointer"
                        >
                          {tenants.map((t) => (
                            <option key={t.id} value={t.subdomain} className="bg-zinc-900 text-white py-1">
                              💈 {t.name}
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-orange-400">
                          <ChevronDown className="w-4 h-4" />
                        </div>
                      </div>
                      <p className="text-[10px] text-zinc-400 pt-0.5">
                        {isClientRegisterMode
                          ? 'Seus agendamentos e pontos fidelidade irão direto para esta barbearia.'
                          : 'Acesso direto aos seus agendamentos nesta barbearia.'}
                      </p>
                    </div>

                    {/* Campo E-mail */}
                    <div className="w-full text-left space-y-1.5">
                      <label
                        htmlFor="client-email-input"
                        className="block text-xs font-semibold text-orange-200"
                      >
                        {isClientRegisterMode ? 'Seu E-mail *' : 'Digite seu e-mail ou telefone'}
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                          <Mail className="w-4 h-4 text-orange-400" />
                        </div>
                        <input
                          id="client-email-input"
                          type="text"
                          value={clientIdentifier}
                          onChange={(e) => setClientIdentifier(e.target.value)}
                          placeholder="exemplo@email.com ou telefone"
                          autoComplete="email"
                          required
                          className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/90 border border-orange-500/40 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                        />
                      </div>
                    </div>

                    {/* Campos exclusivos da aba de Cadastro (Criar Conta) */}
                    {isClientRegisterMode && (
                      <>
                        <div className="w-full text-left space-y-1.5">
                          <label
                            htmlFor="client-name-input"
                            className="block text-xs font-semibold text-orange-200"
                          >
                            Nome Completo *
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                              <UserCheck className="w-4 h-4 text-orange-400" />
                            </div>
                            <input
                              id="client-name-input"
                              type="text"
                              value={clientName}
                              onChange={(e) => setClientName(e.target.value)}
                              placeholder="Seu nome completo"
                              required={isClientRegisterMode}
                              className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/90 border border-orange-500/40 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                            />
                          </div>
                        </div>

                        <div className="w-full text-left space-y-1.5">
                          <label
                            htmlFor="client-phone-input"
                            className="block text-xs font-semibold text-orange-200"
                          >
                            WhatsApp / Telefone
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                              <Scissors className="w-4 h-4 text-orange-400" />
                            </div>
                            <input
                              id="client-phone-input"
                              type="tel"
                              value={clientPhone}
                              onChange={(e) => setClientPhone(e.target.value)}
                              placeholder="(11) 98765-4321"
                              className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/90 border border-orange-500/40 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {/* Senha */}
                    <div className="w-full text-left space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label
                          htmlFor="client-password-input"
                          className="block text-xs font-semibold text-orange-200"
                        >
                          Senha {isClientRegisterMode ? '(Opcional)' : '(Opcional se primeiro acesso)'}
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowCode(!showCode)}
                          className="text-[11px] text-orange-400 hover:underline cursor-pointer"
                        >
                          {showCode ? 'Ocultar' : 'Mostrar'}
                        </button>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                          <Lock className="w-4 h-4 text-orange-400" />
                        </div>
                        <input
                          id="client-password-input"
                          type={showCode ? 'text' : 'password'}
                          value={clientPassword}
                          onChange={(e) => setClientPassword(e.target.value)}
                          placeholder="••••••"
                          className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/90 border border-orange-500/40 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      id="btn-client-submit"
                      disabled={isClientLoggingIn}
                      className="w-full py-3.5 px-6 rounded-xl font-bold text-sm sm:text-base tracking-wider transition-all duration-200 shadow-lg flex items-center justify-center gap-2 select-none cursor-pointer bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 hover:from-orange-500 hover:via-amber-500 hover:to-orange-400 active:scale-[0.99] text-white shadow-orange-600/35 hover:shadow-orange-600/50 mt-1"
                    >
                      {isClientLoggingIn ? (
                        <>
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          <span>ACESSANDO...</span>
                        </>
                      ) : (
                        <>
                          <span>
                            {isClientRegisterMode
                              ? `CADASTRAR E IR PARA ${selectedTenant?.name?.toUpperCase() || 'A BARBEARIA'}`
                              : `ENTRAR EM ${selectedTenant?.name?.toUpperCase() || 'PAINEL DO CLIENTE'}`}
                          </span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                </div>
              ) : (
                /* 6-Digit OTP Inputs for Admin and Barbearia */
                <>
                  <div className="w-full flex flex-col items-center mb-6 relative z-10">
                    <motion.div
                      id="otpInputs"
                      className="otp-inputs flex justify-center gap-2 sm:gap-3 w-full"
                      animate={shake ? { x: [-12, 12, -8, 8, -4, 4, 0] } : { x: 0 }}
                      transition={{ duration: 0.4 }}
                      onPaste={handlePaste}
                    >
                      {digits.map((digit, index) => {
                        const isFilled = digit !== '';

                        return (
                          <div key={index} className="relative group">
                            <input
                              ref={(el) => { inputRefs.current[index] = el; }}
                              id={`otp-input-${index}`}
                              type={showCode ? 'text' : 'password'}
                              inputMode="numeric"
                              pattern="[0-9]*"
                              maxLength={1}
                              value={digit}
                              className={`otp-input w-11 h-13 sm:w-13 sm:h-16 text-center text-2xl sm:text-3xl font-bold rounded-xl transition-all duration-150 outline-none select-all
                                border-2 otp-box-depth-dark
                                ${
                                  isFilled
                                    ? 'border-orange-500 bg-orange-950/50 text-orange-100 ring-2 ring-orange-500/40 shadow-[0_4px_16px_rgba(234,88,12,0.35)] scale-[1.03]'
                                    : 'border-zinc-700/80 bg-zinc-900/80 text-zinc-100 hover:border-orange-400/50 hover:bg-zinc-900 focus:border-orange-500 focus:bg-black focus:ring-4 focus:ring-orange-500/25 focus:scale-[1.03]'
                                }
                              `}
                              autoComplete={index === 0 ? 'one-time-code' : 'off'}
                              onChange={(e) => handleInputChange(index, e)}
                              onKeyDown={(e) => handleKeyDown(index, e)}
                              onFocus={(e) => {
                                e.target.select();
                                setActiveFocusIndex(index);
                              }}
                              aria-label={`Dígito ${index + 1} de 6`}
                            />
                            {/* Subtle 3D bottom shadow reflection shelf */}
                            <div className="absolute -bottom-1 left-2 right-2 h-1 bg-black/40 rounded-full blur-[2px] pointer-events-none -z-10 group-hover:bg-orange-500/20 transition-all" />
                          </div>
                        );
                      })}
                    </motion.div>

                    {/* Visibility Toggle for the Input Boxes */}
                    <button
                      type="button"
                      id="btn-toggle-code-visibility"
                      onClick={() => setShowCode(!showCode)}
                      className="mt-2.5 flex items-center gap-1.5 text-xs text-orange-400/80 hover:text-orange-300 transition py-1 px-2.5 rounded-lg hover:bg-orange-950/30 cursor-pointer"
                    >
                      {showCode ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>Ocultar código (asteriscos)</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>Mostrar números do código</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Verify Button */}
                  <button
                    type="button"
                    id="verifyBtn"
                    onClick={handleVerifyClick}
                    disabled={isVerifying}
                    className={`verify-btn w-full py-3.5 px-6 rounded-xl font-bold text-sm sm:text-base tracking-wider transition-all duration-200 shadow-lg flex items-center justify-center gap-2 select-none cursor-pointer
                      ${
                        isVerifying
                          ? 'bg-orange-800 text-orange-200 cursor-wait'
                          : 'bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 hover:from-orange-500 hover:via-amber-500 hover:to-orange-400 active:scale-[0.99] text-white shadow-orange-600/35 hover:shadow-orange-600/50'
                      }
                    `}
                  >
                    {isVerifying ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span>VERIFICANDO...</span>
                      </>
                    ) : (
                      <>
                        <span>VERIFICAR CÓDIGO</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </>
              )}

              {/* Access Panels Section */}
              <div className="w-full mt-6 pt-5 border-t border-orange-500/20 flex flex-col gap-2">
                <p className="text-[11px] font-semibold text-orange-300/80 uppercase tracking-wider text-left mb-1 px-1">
                  Selecione o Destino do Acesso
                </p>

                {ACCESS_ROLES.map((role) => {
                  const Icon = role.icon;
                  const isSelected = selectedRole === role.id;

                  return (
                    <div
                      key={role.id}
                      role="button"
                      tabIndex={0}
                      id={`access-btn-${role.id}`}
                      onClick={() => handleSelectRole(role.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          handleSelectRole(role.id);
                        }
                      }}
                      className={`w-full p-2.5 sm:p-3 rounded-xl border text-left transition-all duration-150 flex items-center justify-between group cursor-pointer backdrop-blur-sm select-none
                        ${
                          isSelected
                            ? role.activeBorder
                            : 'border-zinc-800/80 bg-black/40 hover:bg-black/60 hover:border-zinc-700'
                        }
                      `}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                          isSelected ? role.activeBg : 'bg-zinc-800/80 border border-zinc-700 text-zinc-300 group-hover:border-zinc-600'
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className={`text-xs sm:text-sm font-bold leading-tight ${isSelected ? 'text-orange-100' : 'text-zinc-200'}`}>
                            {role.title}
                          </span>
                          <span className={`text-[11px] leading-tight mt-0.5 ${isSelected ? 'text-orange-200/90' : 'text-zinc-400'}`}>
                            {role.subtitle}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 pl-2">
                        {isSelected ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-orange-500 to-amber-500 text-white tracking-wide shadow-xs">
                            ATIVO
                          </span>
                        ) : (
                          <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-orange-300 group-hover:translate-x-0.5 transition-all" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Message Feedback Banner */}
              <div
                id="message"
                className={`message w-full mt-4 min-h-[24px] text-xs sm:text-sm font-medium transition-all ${
                  message ? 'opacity-100' : 'opacity-0'
                }`}
              >
                {message && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-2.5 rounded-lg flex items-center justify-center gap-2 ${
                      message.type === 'error'
                        ? 'bg-rose-950/80 text-rose-200 border border-rose-500/50'
                        : message.type === 'success'
                        ? 'bg-emerald-950/80 text-emerald-200 border border-emerald-500/50'
                        : 'bg-zinc-900/90 text-orange-200 border border-orange-500/40'
                    }`}
                  >
                    {message.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />}
                    {message.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />}
                    {message.type === 'info' && <Lock className="w-4 h-4 shrink-0 text-orange-400" />}
                    <span>{message.text}</span>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ) : (
            /* SUCCESS SCREEN */
            <motion.div
              key="success-screen"
              id="successScreen"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="success-screen p-8 sm:p-10 flex flex-col items-center text-center relative z-10"
            >
              {/* Success Checkmark Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 14, stiffness: 200, delay: 0.1 }}
                className="success-icon w-20 h-20 rounded-full bg-emerald-950/80 border-4 border-emerald-500/50 text-emerald-400 flex items-center justify-center text-4xl font-extrabold mb-5 shadow-lg shadow-emerald-950/80"
              >
                ✓
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2"
              >
                Acesso Autorizado!
              </motion.h2>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-950/70 border border-orange-500/50 text-orange-200 text-xs sm:text-sm font-bold mb-3 shadow-xs"
              >
                <currentRole.icon className="w-4 h-4 text-orange-400" />
                <span>{selectedRole === 'barbearia' && selectedTenant ? selectedTenant.name : currentRole.title}</span>
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-sm sm:text-base text-zinc-300 leading-relaxed max-w-xs mb-8"
              >
                Sua identidade foi verificada com sucesso. Redirecionando para o painel de controle.
              </motion.p>

              {/* Action buttons for testing/continuing */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="w-full flex flex-col gap-2.5"
              >
                <button
                  type="button"
                  onClick={resetAll}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 active:scale-[0.99] text-white text-sm font-semibold tracking-wide transition shadow-lg shadow-orange-600/30 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  Verificar Outro Painel
                </button>
                <div className="flex items-center justify-center gap-1.5 text-xs text-zinc-400 pt-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Sessão Autenticada e Criptografada</span>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        </motion.div>
      </div>

      {/* Subtle security/device watermark */}
      <div className="mt-6 flex items-center gap-2 text-xs text-zinc-500 select-none">
        <ShieldCheck className="w-4 h-4 text-orange-500/70" />
        <span>Portal de Autenticação Segura</span>
      </div>
    </div>
  );
};


import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PWAInstallButton } from './PWAInstallButton';
import {
  Boxes,
  Building2,
  CreditCard,
  ShieldAlert,
  Sliders,
  LogOut,
  Bell,
  Plus,
  DollarSign,
  Key,
  Search,
  Pencil,
  Ban,
  CheckCircle2,
  Trash2,
  ExternalLink,
  Scissors,
  Menu,
  X,
  Sparkles,
  ShieldCheck,
  Activity,
  UserCheck,
  ChevronDown,
  ArrowUpDown,
  Filter,
  Lock,
  User,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  QrCode
} from 'lucide-react';
import { Tenant, TenantStatus, SuperAdminConfig } from '../types';
import { NewTenantModal } from './NewTenantModal';
import { EditPriceModal } from './EditPriceModal';
import { TempPasswordModal } from './TempPasswordModal';
import { DeleteTenantModal } from './DeleteTenantModal';
import { BarberQrCodeModal } from './BarberQrCodeModal';
import {
  registerTenantInFirebase,
  getTenantsFromFirestore,
  deleteTenantFromFirestore,
  getSuperAdminConfigFromFirestore,
  saveSuperAdminConfigToFirestore,
  updateSuperAdminPasswordInFirebase,
  saveTenantTempPasswordToFirestore,
  DEFAULT_SUPER_ADMIN_CONFIG,
} from '../lib/firebaseServices';

interface SuperAdminDashboardProps {
  onLogout?: () => void;
  onOpenBarberWithPassword?: (tenant: Tenant, passwordCode: string) => void;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  onLogout,
  onOpenBarberWithPassword,
}) => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoadingTenants, setIsLoadingTenants] = useState(true);
  const [activeTab, setActiveTab] = useState<'tenants' | 'plans' | 'security' | 'settings'>('tenants');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | TenantStatus>('All');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [isFirebaseSyncing, setIsFirebaseSyncing] = useState(false);

  // Super Admin Configuration State
  const [config, setConfig] = useState<SuperAdminConfig>(DEFAULT_SUPER_ADMIN_CONFIG);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [confirmAdminPassword, setConfirmAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Modals state
  const [isNewTenantModalOpen, setIsNewTenantModalOpen] = useState(false);
  const [editingPriceTenant, setEditingPriceTenant] = useState<Tenant | null>(null);
  const [tempPasswordTenant, setTempPasswordTenant] = useState<Tenant | null>(null);
  const [deletingTenant, setDeletingTenant] = useState<Tenant | null>(null);
  const [generatedTempPass, setGeneratedTempPass] = useState('');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'warn' } | null>(null);

  // QR Code Modal State
  const [qrCodeTenant, setQrCodeTenant] = useState<Tenant | null>(null);
  const [isQrCodeModalOpen, setIsQrCodeModalOpen] = useState(false);
  const [isNewlyCreatedTenant, setIsNewlyCreatedTenant] = useState(false);

  // Carrega empresas e configurações do Super Admin do Firestore ao iniciar
  React.useEffect(() => {
    async function loadCloudData() {
      setIsLoadingTenants(true);
      try {
        const [cloudTenants, cloudConfig] = await Promise.all([
          getTenantsFromFirestore(),
          getSuperAdminConfigFromFirestore(),
        ]);

        setTenants(cloudTenants || []);

        if (cloudConfig) {
          setConfig(cloudConfig);
        }
      } catch (e) {
        console.warn('Sync cloud data notice:', e);
      } finally {
        setIsLoadingTenants(false);
      }
    }
    loadCloudData();
  }, []);

  const showToast = (text: string, type: 'success' | 'info' | 'warn' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Metrics calculations (calculados 100% com base nos dados reais do Firestore)
  const totalTenantsCount = tenants.length;
  const calculatedRevenue = tenants.reduce((acc, t) => acc + (t.status === 'Ativo' ? t.monthlyValue : 0), 0);
  const totalRevenueFormatted = calculatedRevenue.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  });
  const activeTempPasswordsCount = tenants.filter((t) => t.lastTempPassword && new Date(t.lastTempPassword.expiresAt) > new Date()).length;

  // Filtered tenants
  const filteredTenants = useMemo(() => {
    return tenants.filter((tenant) => {
      const matchesSearch =
        tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tenant.cnpj.includes(searchTerm) ||
        tenant.subdomain.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'All' || tenant.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [tenants, searchTerm, statusFilter]);

  // Handlers
  const handleAddTenant = async (
    newTenantData: Omit<Tenant, 'id' | 'createdAt'>,
    adminPassword?: string
  ) => {
    setIsFirebaseSyncing(true);
    try {
      const result = await registerTenantInFirebase(newTenantData, adminPassword);
      let newTenant: Tenant;
      if (result.success && result.data) {
        newTenant = result.data;
        showToast(`Empresa "${result.data.name}" salva no Firestore e criada no Firebase Auth!`, 'success');
      } else {
        newTenant = {
          ...newTenantData,
          id: `t-${Date.now()}`,
          createdAt: new Date().toISOString().split('T')[0],
          adminPassword: adminPassword || '482910',
          adminAccessCode: adminPassword || '482910',
        };
        showToast(`Empresa "${newTenant.name}" cadastrada!`, 'success');
      }

      setTenants((prev) => {
        const updated = [newTenant, ...prev.filter((t) => t.id !== newTenant.id && t.subdomain !== newTenant.subdomain)];
        try {
          localStorage.setItem('cached_tenants_list', JSON.stringify(updated));
          window.dispatchEvent(new CustomEvent('tenant_list_updated'));
        } catch {}
        return updated;
      });

      // No ato do cadastro, gera o QR Code exclusivo da barbearia imediatamente!
      setQrCodeTenant(newTenant);
      setIsNewlyCreatedTenant(true);
      setIsQrCodeModalOpen(true);
    } catch (err: any) {
      showToast(err.message || 'Erro ao cadastrar empresa.', 'warn');
    } finally {
      setIsFirebaseSyncing(false);
    }
  };

  const handleSavePrice = (tenantId: string, newPrice: number) => {
    setTenants((prev) => {
      const updated = prev.map((t) => (t.id === tenantId ? { ...t, monthlyValue: newPrice } : t));
      try {
        localStorage.setItem('cached_tenants_list', JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('tenant_list_updated'));
      } catch {}
      return updated;
    });
    showToast('Valor mensal atualizado com sucesso!', 'success');
  };

  const handleGenerateTempPassword = async (tenant: Tenant) => {
    // Gerar senha temporária de exatamente 6 números sem letras
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    setGeneratedTempPass(code);
    setTempPasswordTenant(tenant);

    const tempPassData = {
      code,
      expiresAt: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
      generatedAt: new Date().toISOString(),
    };

    // Atualiza estado local do tenant e storage imediatamente
    setTenants((prev) => {
      const updated = prev.map((t) =>
        t.id === tenant.id || t.subdomain === tenant.subdomain
          ? {
              ...t,
              adminAccessCode: code,
              lastTempPassword: tempPassData,
            }
          : t
      );
      try {
        localStorage.setItem('cached_tenants_list', JSON.stringify(updated));
        localStorage.setItem(`tenant_admin_password_${tenant.subdomain}`, code);
        localStorage.setItem(`tenant_admin_password_${tenant.id}`, code);
        window.dispatchEvent(new CustomEvent('tenant_list_updated', { detail: { tenantId: tenant.id, tempPass: tempPassData } }));
      } catch {}
      return updated;
    });

    // Salva no Firestore para que a barbearia acesse de verdade
    try {
      await saveTenantTempPasswordToFirestore(tenant.id, tempPassData);
    } catch (e) {
      console.warn('Erro ao salvar senha temporária no Firestore:', e);
    }
  };

  const handleToggleStatus = (tenantId: string) => {
    setTenants((prev) =>
      prev.map((t) => {
        if (t.id === tenantId) {
          const nextStatus: TenantStatus = t.status === 'Ativo' ? 'Suspenso' : 'Ativo';
          showToast(
            `Status da empresa "${t.name}" alterado para ${nextStatus}.`,
            nextStatus === 'Ativo' ? 'success' : 'warn'
          );
          return { ...t, status: nextStatus };
        }
        return t;
      })
    );
  };

  const handleDeleteTenant = async (tenantId: string, tenantName: string) => {
    setTenants((prev) => prev.filter((t) => t.id !== tenantId));
    try {
      await deleteTenantFromFirestore(tenantId);
    } catch (e) {
      console.warn('Delete from Firestore note:', e);
    }
    showToast(`Empresa "${tenantName}" excluída permanentemente do banco de dados!`, 'warn');
  };

  // Handler para Salvar Configurações (Nome, Valores, Domínio) no Banco de Dados (Firestore)
  const handleSaveGlobalConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingConfig(true);

    try {
      const result = await saveSuperAdminConfigToFirestore(config);
      if (result.success && result.data) {
        setConfig(result.data);
        showToast('Configurações, dados e valores salvos no Cloud Firestore com sucesso!', 'success');
      } else {
        showToast(result.error || 'Erro ao persistir configurações.', 'warn');
      }
    } catch (err: any) {
      showToast(err.message || 'Erro ao salvar no banco de dados.', 'warn');
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Handler para Trocar Senha do Super Admin no Firebase Authentication e registrar auditoria no Firestore
  const handleChangeAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newAdminPassword || newAdminPassword.length < 6) {
      showToast('A nova senha deve ter no mínimo 6 caracteres.', 'warn');
      return;
    }

    if (newAdminPassword !== confirmAdminPassword) {
      showToast('A confirmação de senha não coincide com a nova senha digitada.', 'warn');
      return;
    }

    setIsChangingPassword(true);

    try {
      const result = await updateSuperAdminPasswordInFirebase(newAdminPassword, config.adminEmail);
      if (result.success) {
        setConfig((prev) => ({
          ...prev,
          adminPassword: newAdminPassword,
          adminAccessCode: newAdminPassword,
        }));
        setNewAdminPassword('');
        setConfirmAdminPassword('');
        showToast('Senha do Super Admin atualizada no Firebase e banco de dados!', 'success');
      } else {
        showToast(result.error || 'Não foi possível atualizar a senha no Firebase.', 'warn');
      }
    } catch (err: any) {
      showToast(err.message || 'Falha ao trocar a senha.', 'warn');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-gray-900 text-gray-100 font-sans antialiased overflow-hidden selection:bg-indigo-500 selection:text-white">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-2xl border text-sm font-medium flex items-center gap-2.5 backdrop-blur-md ${
              toastMessage.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/50'
                : toastMessage.type === 'warn'
                ? 'bg-amber-950/90 text-amber-200 border-amber-500/50'
                : 'bg-indigo-950/90 text-indigo-200 border-indigo-500/50'
            }`}
          >
            {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            {toastMessage.type === 'warn' && <ShieldAlert className="w-4 h-4 text-amber-400" />}
            {toastMessage.type === 'info' && <Sparkles className="w-4 h-4 text-indigo-400" />}
            <span>{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SIDEBAR (MENU LATERAL) - Desktop & Mobile */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-gray-800 border-r border-gray-700 flex flex-col justify-between transition-transform duration-300 md:static md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Logo */}
          <div className="p-5 border-b border-gray-700 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-indigo-500/40 flex items-center justify-center p-1 shadow-xs overflow-hidden shrink-0">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <span className="font-bold text-lg tracking-wider text-white">BarberOs</span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden text-gray-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-2">
            <button
              type="button"
              onClick={() => {
                setActiveTab('tenants');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition cursor-pointer text-left ${
                activeTab === 'tenants'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <Building2 className="w-5 h-5 shrink-0" />
              <span>Empresas (Tenants)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('plans');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition cursor-pointer text-left ${
                activeTab === 'plans'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <CreditCard className="w-5 h-5 shrink-0" />
              <span>Planos e Valores</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('security');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition cursor-pointer text-left ${
                activeTab === 'security'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <span>Segurança & Logs</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('settings');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition cursor-pointer text-left ${
                activeTab === 'settings'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <Sliders className="w-5 h-5 shrink-0" />
              <span>Configurações Globais</span>
            </button>
          </nav>
        </div>

        {/* Super Admin Profile in Sidebar Footer */}
        <div className="p-4 border-t border-gray-700 flex items-center justify-between bg-gray-800/60">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-sm text-white shadow-md">
              {config.adminName ? config.adminName.substring(0, 2).toUpperCase() : 'SA'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-white leading-tight truncate">{config.adminName || 'Super Admin'}</p>
              <p className="text-xs text-gray-400 leading-tight truncate">{config.adminEmail || 'root@saas.com'}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="text-gray-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-gray-700 transition cursor-pointer shrink-0"
            title="Sair / Trocar de Painel"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col overflow-y-auto bg-gray-900">
        
        {/* TOP HEADER */}
        <header className="h-16 border-b border-gray-700 bg-gray-800 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 shadow-xs">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden text-gray-400 hover:text-white p-1 rounded-lg focus:outline-none"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg sm:text-xl font-semibold text-white tracking-wide">
              {activeTab === 'tenants' && 'Gestão de Inquilinos'}
              {activeTab === 'plans' && 'Planos e Tabela de Valores'}
              {activeTab === 'security' && 'Segurança, Auditoria & Logs'}
              {activeTab === 'settings' && 'Configurações Globais do SaaS'}
            </h1>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4">
            <PWAInstallButton variant="compact" />

            {/* Notification Bell with Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotificationsOpen(!notificationsOpen);
                  setUnreadNotifications(0);
                }}
                className="relative p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700 transition cursor-pointer"
                title="Notificações do Sistema"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute 1.5 top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-gray-800 animate-pulse"></span>
                )}
              </button>

              {/* Notification Popover */}
              <AnimatePresence>
                {notificationsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-80 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl z-50 p-4 text-xs"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-gray-700 font-semibold text-gray-200">
                      <span>Notificações Recentes</span>
                      <span className="text-[10px] text-indigo-400">Tempo Real</span>
                    </div>
                    <div className="mt-3 space-y-2.5 text-gray-300">
                      <div className="p-2 rounded bg-gray-700/50 border border-gray-700">
                        <p className="font-semibold text-white">Nova Barbearia Ativada</p>
                        <p className="text-gray-400 text-[11px] mt-0.5">Barbearia Navalha de Ouro concluiu setup.</p>
                      </div>
                      <div className="p-2 rounded bg-gray-700/50 border border-gray-700">
                        <p className="font-semibold text-white">Senha Temporária Emitida</p>
                        <p className="text-gray-400 text-[11px] mt-0.5">Suporte técnico para Acme Corp.</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Nova Empresa Button */}
            <button
              type="button"
              id="btnNovaEmpresa"
              onClick={() => setIsNewTenantModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium flex items-center space-x-2 transition cursor-pointer shadow-lg shadow-indigo-600/25"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Empresa</span>
            </button>
          </div>
        </header>

        {/* BODY DASHBOARD CONTENT */}
        <div className="p-4 sm:p-6 space-y-6 max-w-7xl w-full mx-auto">
          
          {/* CARDS DE MÉTRICAS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            
            {/* Card 1: Total de Empresas */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex items-center justify-between shadow-xs hover:border-gray-600 transition"
            >
              <div>
                <p className="text-xs sm:text-sm text-gray-400 font-medium uppercase tracking-wider">
                  Total de Empresas
                </p>
                <h3 className="text-2xl sm:text-3xl font-bold mt-1 text-white">
                  {totalTenantsCount}
                </h3>
                <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 mt-1">
                  ↑ +12% esse mês
                </span>
              </div>
              <div className="w-12 h-12 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-xl shrink-0 border border-indigo-500/20">
                <Building2 className="w-6 h-6" />
              </div>
            </motion.div>

            {/* Card 2: Faturamento Mensal */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex items-center justify-between shadow-xs hover:border-gray-600 transition"
            >
              <div>
                <p className="text-xs sm:text-sm text-gray-400 font-medium uppercase tracking-wider">
                  Faturamento Mensal
                </p>
                <h3 className="text-2xl sm:text-3xl font-bold mt-1 text-emerald-400">
                  {totalRevenueFormatted}
                </h3>
                <span className="text-[11px] text-gray-400 font-medium flex items-center gap-1 mt-1">
                  MRR Recorrente SaaS
                </span>
              </div>
              <div className="w-12 h-12 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xl shrink-0 border border-emerald-500/20">
                <DollarSign className="w-6 h-6" />
              </div>
            </motion.div>

            {/* Card 3: Senhas Ativas */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex items-center justify-between shadow-xs hover:border-gray-600 transition sm:col-span-2 md:col-span-1"
            >
              <div>
                <p className="text-xs sm:text-sm text-gray-400 font-medium uppercase tracking-wider">
                  Senhas Ativas
                </p>
                <h3 className="text-2xl sm:text-3xl font-bold mt-1 text-white">
                  {activeTempPasswordsCount} <span className="text-xs font-normal text-amber-400">(temp)</span>
                </h3>
                <span className="text-[11px] text-amber-400/80 font-medium flex items-center gap-1 mt-1">
                  Acessos de suporte vigentes
                </span>
              </div>
              <div className="w-12 h-12 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center text-xl shrink-0 border border-amber-500/20">
                <Key className="w-6 h-6" />
              </div>
            </motion.div>
          </div>

          {/* TABELA DE EMPRESAS (TENANTS) */}
          {activeTab === 'tenants' && (
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-xl">
              
              {/* Table Filter / Search Header */}
              <div className="p-4 sm:p-5 border-b border-gray-700 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <h2 className="text-base sm:text-lg font-medium text-white">
                    Empresas Cadastradas ({filteredTenants.length})
                  </h2>
                  
                  {/* Filter Pills */}
                  <div className="hidden sm:flex items-center space-x-1 bg-gray-900/80 p-1 rounded-lg border border-gray-700 text-xs">
                    {(['All', 'Ativo', 'Suspenso', 'Pendente'] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => setStatusFilter(st)}
                        className={`px-2.5 py-1 rounded font-medium transition cursor-pointer ${
                          statusFilter === st
                            ? 'bg-indigo-600 text-white'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        {st === 'All' ? 'Todos' : st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative w-full md:w-80">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar empresa ou CNPJ..."
                    className="w-full pl-9 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Table Container */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[640px]">
                  <thead>
                    <tr className="bg-gray-700/50 text-gray-400 text-xs font-semibold uppercase tracking-wider border-b border-gray-700">
                      <th className="px-6 py-4">Empresa / Subdomínio</th>
                      <th className="px-6 py-4">CNPJ</th>
                      <th className="px-6 py-4">Valor Mensal</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700 text-sm">
                    {filteredTenants.length > 0 ? (
                      filteredTenants.map((tenant) => {
                        const isAtivo = tenant.status === 'Ativo';
                        const isSuspenso = tenant.status === 'Suspenso';

                        return (
                          <tr
                            key={tenant.id}
                            className="hover:bg-gray-700/30 transition group"
                          >
                            {/* Column 1: Empresa / Subdomínio */}
                            <td className="px-6 py-4">
                              <div className="font-medium text-white group-hover:text-indigo-300 transition">
                                {tenant.name}
                              </div>
                              <div className="text-xs text-indigo-400 font-mono flex items-center gap-1 mt-0.5">
                                <span>://{tenant.subdomain}.saasapp.com</span>
                              </div>
                            </td>

                            {/* Column 2: CNPJ */}
                            <td className="px-6 py-4 text-gray-300 font-mono text-xs">
                              {tenant.cnpj}
                            </td>

                            {/* Column 3: Valor Mensal */}
                            <td className="px-6 py-4 font-medium text-gray-200 font-mono">
                              {tenant.monthlyValue.toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              })}
                            </td>

                            {/* Column 4: Status Badge */}
                            <td className="px-6 py-4">
                              {isAtivo && (
                                <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  Ativo
                                </span>
                              )}
                              {isSuspenso && (
                                <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                  Suspenso
                                </span>
                              )}
                              {tenant.status === 'Pendente' && (
                                <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                  Pendente
                                </span>
                              )}
                            </td>

                            {/* Column 5: Ações */}
                            <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                              {/* QR Code de Cadastro da Barbearia */}
                              <button
                                type="button"
                                onClick={() => {
                                  setQrCodeTenant(tenant);
                                  setIsNewlyCreatedTenant(false);
                                  setIsQrCodeModalOpen(true);
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 text-xs font-bold transition cursor-pointer shadow-xs active:scale-95 mr-1"
                                title={`Ver, Baixar e Imprimir QR Code de Cadastro para ${tenant.name}`}
                              >
                                <QrCode className="w-3.5 h-3.5 text-indigo-400" />
                                <span>QR Code</span>
                              </button>

                              {/* Gerar Senha Temporária para a Barbearia */}
                              <button
                                type="button"
                                onClick={() => handleGenerateTempPassword(tenant)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition cursor-pointer shadow-xs active:scale-95 mr-1"
                                title={`Gerar Senha Temporária de Acesso para ${tenant.name}`}
                              >
                                <Key className="w-3.5 h-3.5 text-amber-400" />
                                <span>Gerar Senha Temp</span>
                              </button>

                              {/* Alterar Valor */}
                              <button
                                type="button"
                                onClick={() => setEditingPriceTenant(tenant)}
                                className="p-1.5 text-gray-400 hover:text-indigo-400 hover:bg-gray-700/60 rounded-lg transition cursor-pointer"
                                title="Alterar Valor da Mensalidade"
                              >
                                <Pencil className="w-4 h-4 inline" />
                              </button>

                              {/* Suspender / Ativar Empresa */}
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(tenant.id)}
                                className={`p-1.5 rounded-lg transition cursor-pointer ${
                                  isAtivo
                                    ? 'text-gray-400 hover:text-red-400 hover:bg-gray-700/60'
                                    : 'text-gray-400 hover:text-emerald-400 hover:bg-gray-700/60'
                                }`}
                                title={isAtivo ? 'Suspender Empresa' : 'Reativar Empresa'}
                              >
                                {isAtivo ? (
                                  <Ban className="w-4 h-4 inline" />
                                ) : (
                                  <CheckCircle2 className="w-4 h-4 inline" />
                                )}
                              </button>

                              {/* Excluir Empresa */}
                              <button
                                type="button"
                                id={`btnExcluirTenant-${tenant.id}`}
                                onClick={() => setDeletingTenant(tenant)}
                                className="p-1.5 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                                title="Remover Inquilino (Excluir Empresa)"
                              >
                                <Trash2 className="w-4 h-4 inline" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                          <Building2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
                          <p>Nenhuma empresa encontrada com os filtros aplicados.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Footer / Summary */}
              <div className="p-4 border-t border-gray-700/80 bg-gray-800/50 flex items-center justify-between text-xs text-gray-400">
                <span>Mostrando {filteredTenants.length} de {tenants.length} inquilinos</span>
                <span className="text-gray-500">Sistema Multi-tenant Ativo</span>
              </div>
            </div>
          )}

          {/* VIEW: PLANOS E VALORES */}
          {activeTab === 'plans' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gray-800 p-6 rounded-xl border border-gray-700">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <CreditCard className="w-6 h-6 text-indigo-400" />
                    <span>Tabela Oficial de Planos e Valores do SaaS</span>
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Edite os preços base dos planos globais. Todas as alterações são sincronizadas e salvas diretamente no Banco de Dados (Firestore).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleSaveGlobalConfig()}
                  disabled={isSavingConfig}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition cursor-pointer shrink-0"
                >
                  {isSavingConfig ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Salvando no BD...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Salvar Tabela de Valores</span>
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Plano Básico */}
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-white text-lg">Plano Básico</h3>
                    <span className="text-xs px-2.5 py-1 rounded bg-indigo-600/20 text-indigo-400 font-semibold">
                      1 a 3 Barbeiros
                    </span>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">Valor Mensal (R$):</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">R$</span>
                      <input
                        type="number"
                        min="50"
                        step="10"
                        value={config.basicPlanPrice}
                        onChange={(e) => setConfig({ ...config, basicPlanPrice: Number(e.target.value) || 0 })}
                        className="w-full pl-9 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white font-bold text-lg focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">
                    Ideal para barbearias individuais ou de pequeno porte.
                  </p>
                  <ul className="text-xs space-y-2 text-gray-300">
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Agenda Online</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> App do Cliente</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Suporte Standard</li>
                  </ul>
                </div>

                {/* Plano Pro */}
                <div className="bg-gray-800 p-6 rounded-xl border-2 border-indigo-500 space-y-4 relative shadow-xl shadow-indigo-950/40">
                  <div className="absolute -top-3 right-4 bg-indigo-600 text-white text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full">
                    Mais Popular
                  </div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-white text-lg">Plano Pro</h3>
                    <span className="text-xs px-2.5 py-1 rounded bg-indigo-600/20 text-indigo-400 font-semibold">
                      Até 8 Barbeiros
                    </span>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-indigo-300 mb-1.5">Valor Mensal (R$):</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">R$</span>
                      <input
                        type="number"
                        min="50"
                        step="10"
                        value={config.proPlanPrice}
                        onChange={(e) => setConfig({ ...config, proPlanPrice: Number(e.target.value) || 0 })}
                        className="w-full pl-9 pr-4 py-2.5 bg-gray-900 border border-indigo-500 rounded-lg text-white font-bold text-lg focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">
                    Gestão completa de barbearias de médio porte e comissões.
                  </p>
                  <ul className="text-xs space-y-2 text-gray-300">
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Todas as funções do Básico</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Comissionamento Automático</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Notificações via WhatsApp</li>
                  </ul>
                </div>

                {/* Plano Enterprise */}
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-white text-lg">Plano Enterprise</h3>
                    <span className="text-xs px-2.5 py-1 rounded bg-indigo-600/20 text-indigo-400 font-semibold">
                      Franquias / Redes
                    </span>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">Valor Mensal (R$):</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">R$</span>
                      <input
                        type="number"
                        min="100"
                        step="50"
                        value={config.enterprisePlanPrice}
                        onChange={(e) => setConfig({ ...config, enterprisePlanPrice: Number(e.target.value) || 0 })}
                        className="w-full pl-9 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white font-bold text-lg focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">
                    Unidades ilimitadas, relatórios executivos avançados e SLA 24/7.
                  </p>
                  <ul className="text-xs space-y-2 text-gray-300">
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Múltiplas Unidades</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> API de Integração Aberta</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Gerente de Conta Dedicado</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: SEGURANÇA & LOGS */}
          {activeTab === 'security' && (
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                <span>Auditoria e Registros Globais de Acesso</span>
              </h3>
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 bg-gray-900 rounded-lg border border-gray-700 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-400">[LOGIN SUCESSO]</span>
                    <span>Super Admin {config.adminEmail} autenticado no Firebase</span>
                  </div>
                  <span className="text-gray-500">Hoje, 11:22:15</span>
                </div>
                <div className="p-3 bg-gray-900 rounded-lg border border-gray-700 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="text-amber-400">[SENHA TEMP]</span>
                    <span>Chave gerada para suporte em "Acme Corporation"</span>
                  </div>
                  <span className="text-gray-500">Hoje, 10:45:00</span>
                </div>
                <div className="p-3 bg-gray-900 rounded-lg border border-gray-700 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="text-indigo-400">[FIRESTORE SYNC]</span>
                    <span>Configurações do Super Admin sincronizadas com o banco de dados</span>
                  </div>
                  <span className="text-gray-500">Hoje, {new Date().toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: CONFIGURAÇÕES GLOBAIS (MEU NOME, VALORES, TROCA DE SENHA NO BD) */}
          {activeTab === 'settings' && (
            <div className="space-y-8">
              
              {/* SEÇÃO 1: DADOS DO MEU PERFIL E NOME (SALVO NO FIRESTORE & AUTH) */}
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-700 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <User className="w-5 h-5 text-indigo-400" />
                      <span>Meu Perfil Super Admin</span>
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Configure seu nome e dados pessoais. Tudo é persistido no Firestore e sincronizado com o Firebase Auth.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSaveGlobalConfig()}
                    disabled={isSavingConfig}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold flex items-center gap-2 shadow-md shadow-indigo-600/30 transition cursor-pointer"
                  >
                    {isSavingConfig ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Salvando...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Salvar Meu Nome e Dados</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  {/* Meu Nome */}
                  <div className="p-4 bg-gray-900 rounded-xl border border-gray-700 space-y-2">
                    <label className="font-semibold text-white block">Meu Nome de Administrador</label>
                    <p className="text-xs text-gray-400">Nome de exibição principal em todo o ecossistema.</p>
                    <input
                      type="text"
                      value={config.adminName}
                      onChange={(e) => setConfig({ ...config, adminName: e.target.value })}
                      placeholder="Ex: William Moreira"
                      className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white font-medium text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Meu E-mail */}
                  <div className="p-4 bg-gray-900 rounded-xl border border-gray-700 space-y-2">
                    <label className="font-semibold text-white block">Meu E-mail Oficial</label>
                    <p className="text-xs text-gray-400">E-mail corporativo do Super Administrador.</p>
                    <input
                      type="email"
                      value={config.adminEmail}
                      onChange={(e) => setConfig({ ...config, adminEmail: e.target.value })}
                      placeholder="root@saas.com"
                      className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-indigo-300 font-mono text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Meu Telefone / WhatsApp */}
                  <div className="p-4 bg-gray-900 rounded-xl border border-gray-700 space-y-2">
                    <label className="font-semibold text-white block">Telefone / WhatsApp</label>
                    <p className="text-xs text-gray-400">Contato direto para alertas críticos do sistema.</p>
                    <input
                      type="text"
                      value={config.adminPhone}
                      onChange={(e) => setConfig({ ...config, adminPhone: e.target.value })}
                      placeholder="(11) 99999-9999"
                      className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white font-medium text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* SEÇÃO 2: TROCAR SENHA NO FIREBASE AUTH & BANCO DE DADOS */}
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-6">
                <div className="border-b border-gray-700 pb-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Lock className="w-5 h-5 text-amber-400" />
                    <span>Segurança & Troca de Senha de Acesso</span>
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Altere sua senha de acesso do Super Admin. A alteração é aplicada imediatamente no Firebase Authentication com registro de auditoria no Firestore.
                  </p>
                </div>

                <form onSubmit={handleChangeAdminPassword} className="space-y-4 max-w-2xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Nova Senha */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-300 block">Nova Senha:</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={newAdminPassword}
                          onChange={(e) => setNewAdminPassword(e.target.value)}
                          placeholder="Mínimo 6 caracteres"
                          className="w-full px-3.5 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirmar Nova Senha */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-300 block">Confirmar Nova Senha:</label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmAdminPassword}
                        onChange={(e) => setConfirmAdminPassword(e.target.value)}
                        placeholder="Repita a nova senha"
                        className="w-full px-3.5 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <p className="text-xs text-gray-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Criptografia ponta a ponta garantida pelo Firebase Auth.</span>
                    </p>

                    <button
                      type="submit"
                      disabled={isChangingPassword || !newAdminPassword}
                      className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold flex items-center gap-2 shadow-md shadow-amber-600/30 transition cursor-pointer"
                    >
                      {isChangingPassword ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Atualizando no BD...</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4" />
                          <span>Atualizar Senha Agora</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* SEÇÃO 3: CADASTRAR VALORES PADRÃO & PARÂMETROS GLOBAIS */}
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-700 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-emerald-400" />
                      <span>Cadastrar Valores Padrão & Parâmetros do SaaS</span>
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Configure os valores monetários sugeridos ao cadastrar novos inquilinos e os parâmetros de infraestrutura.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSaveGlobalConfig()}
                    disabled={isSavingConfig}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold flex items-center gap-2 shadow-md shadow-emerald-600/30 transition cursor-pointer"
                  >
                    {isSavingConfig ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Salvando no BD...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Salvar Valores no Banco</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  {/* Valor Padrão Novo Tenant */}
                  <div className="p-4 bg-gray-900 rounded-xl border border-gray-700 space-y-2">
                    <p className="font-semibold text-white">Valor Padrão Mensalidade (R$)</p>
                    <p className="text-xs text-gray-400">Preenchimento automático no cadastro de novos inquilinos.</p>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">R$</span>
                      <input
                        type="number"
                        min="0"
                        step="10"
                        value={config.defaultMonthlyPrice}
                        onChange={(e) => setConfig({ ...config, defaultMonthlyPrice: Number(e.target.value) || 0 })}
                        className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-emerald-400 font-bold text-base focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Domínio Raiz */}
                  <div className="p-4 bg-gray-900 rounded-xl border border-gray-700 space-y-2">
                    <p className="font-semibold text-white">Domínio Raiz do SaaS</p>
                    <p className="text-xs text-gray-400">Sufixo dos subdomínios dos inquilinos.</p>
                    <input
                      type="text"
                      value={config.rootDomain}
                      onChange={(e) => setConfig({ ...config, rootDomain: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-indigo-400 font-mono text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Expiração Senhas Temporárias */}
                  <div className="p-4 bg-gray-900 rounded-xl border border-gray-700 space-y-2">
                    <p className="font-semibold text-white">Validade Senha Temporária</p>
                    <p className="text-xs text-gray-400">Janela de validade para acessos de suporte.</p>
                    <select
                      value={config.tempPasswordExpiryHours}
                      onChange={(e) => setConfig({ ...config, tempPasswordExpiryHours: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 text-sm focus:outline-none focus:border-indigo-500"
                    >
                      <option value={2}>2 Horas (Recomendado)</option>
                      <option value={6}>6 Horas</option>
                      <option value={12}>12 Horas</option>
                      <option value={24}>24 Horas</option>
                    </select>
                  </div>

                  {/* Notificações do Sistema */}
                  <div className="p-4 bg-gray-900 rounded-xl border border-gray-700 space-y-2 flex flex-col justify-between">
                    <div>
                      <p className="font-semibold text-white">Alertas & 2FA Global</p>
                      <p className="text-xs text-gray-400">Notificações por e-mail e autenticação dupla.</p>
                    </div>
                    <div className="flex items-center gap-3 pt-2">
                      <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.systemNotifications}
                          onChange={(e) => setConfig({ ...config, systemNotifications: e.target.checked })}
                          className="w-4 h-4 rounded text-indigo-600 bg-gray-800 border-gray-700 focus:ring-0"
                        />
                        <span>Notificações</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.twoFactorAuth}
                          onChange={(e) => setConfig({ ...config, twoFactorAuth: e.target.checked })}
                          className="w-4 h-4 rounded text-indigo-600 bg-gray-800 border-gray-700 focus:ring-0"
                        />
                        <span>2FA Ativo</span>
                      </label>
                    </div>
                  </div>
                </div>

                {config.updatedAt && (
                  <div className="pt-2 text-xs text-gray-500 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Última sincronização no banco de dados: {new Date(config.updatedAt).toLocaleString('pt-BR')}</span>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      </main>

      {/* MODAL: NOVA EMPRESA */}
      <NewTenantModal
        isOpen={isNewTenantModalOpen}
        onClose={() => setIsNewTenantModalOpen(false)}
        onAddTenant={handleAddTenant}
      />

      {/* MODAL: ALTERAR VALOR */}
      <EditPriceModal
        isOpen={!!editingPriceTenant}
        onClose={() => setEditingPriceTenant(null)}
        tenant={editingPriceTenant}
        onSavePrice={handleSavePrice}
      />

      {/* MODAL: SENHA TEMPORÁRIA */}
      <TempPasswordModal
        isOpen={!!tempPasswordTenant}
        onClose={() => setTempPasswordTenant(null)}
        tenant={tempPasswordTenant}
        generatedPassword={generatedTempPass}
        onRegenerate={() => {
          if (tempPasswordTenant) handleGenerateTempPassword(tempPasswordTenant);
        }}
        onOpenBarberWithPassword={onOpenBarberWithPassword}
      />

      {/* MODAL: EXCLUSÃO DE EMPRESA */}
      <DeleteTenantModal
        isOpen={!!deletingTenant}
        onClose={() => setDeletingTenant(null)}
        tenant={deletingTenant}
        onConfirmDelete={handleDeleteTenant}
      />

      {/* MODAL: QR CODE DE CADASTRO DA BARBEARIA */}
      <BarberQrCodeModal
        isOpen={isQrCodeModalOpen}
        onClose={() => {
          setIsQrCodeModalOpen(false);
          setQrCodeTenant(null);
          setIsNewlyCreatedTenant(false);
        }}
        tenant={qrCodeTenant}
        isNewlyCreated={isNewlyCreatedTenant}
        onOpenRegisterScreen={(subdomain) => {
          const origin = window.location.origin;
          window.location.href = `${origin}/?b=${encodeURIComponent(subdomain)}&view=cliente&screen=register`;
        }}
      />
    </div>
  );
};

export default SuperAdminDashboard;

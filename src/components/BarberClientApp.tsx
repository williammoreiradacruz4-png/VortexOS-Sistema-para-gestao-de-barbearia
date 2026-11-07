import React, { useState, useMemo, useEffect } from 'react';
import barberMascotImg from '../assets/images/barber_mascot_1786873404835.jpg';
import {
  Scissors,
  Star,
  Gift,
  Check,
  Calendar,
  Clock,
  LogOut,
  ChevronLeft,
  CalendarPlus,
  Sparkles,
  Award,
  MapPin,
  Phone,
  CheckCircle2,
  AlertCircle,
  X,
  User,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  RefreshCw,
  Trash2,
  CalendarCheck,
  Crown,
  Plus,
  Smartphone,
  Mail,
  UserCheck,
  Search,
  CheckCircle,
  Loader2,
  QrCode
} from 'lucide-react';
import { ClientUser, ClientBooking, BarberClient, BarberPromotionBanner } from '../types';
import {
  registerClientInFirebase,
  loginClientInFirebase,
  updateClientFidelityInFirestore,
  saveBookingToFirestore,
  getClientsFromFirestore,
  subscribeToTenantClients,
  subscribeToClientFidelity,
  getClientBookingsFromFirestore,
  getBannersFromFirestore,
  subscribeToTenantBanners,
} from '../lib/firebaseServices';
import { DEFAULT_PROMOTION_BANNERS } from '../lib/promoBannersData';
import { PromoBannerCarousel } from './PromoBannerCarousel';
import { PWAInstallButton } from './PWAInstallButton';

interface BarberClientAppProps {
  tenantName?: string;
  tenantSubdomain?: string;
  initialScreen?: ClientScreen;
  initialAuthMode?: 'register' | 'login';
  onLogout?: () => void;
}

export type ClientScreen = 'auth' | 'home' | 'booking' | 'success' | 'history' | 'profile';

const AVAILABLE_SERVICES: { id: string; name: string; price: number; duration?: string; durationMinutes?: number; desc?: string; description?: string; category?: string }[] = [];

const BARBERS: { id: string; name: string; role?: string }[] = [];

// Helper to generate time slots (Manhã 07:00 às 11:30 | Almoço 12:00 às 13:00 | Tarde/Noite 13:00 às 20:00)
const TIME_SLOTS = [
  // Manhã (07:00 às 11:30) - Todos os horários liberados
  { time: '07:00', available: true, period: 'morning' },
  { time: '07:30', available: true, period: 'morning' },
  { time: '08:00', available: true, period: 'morning' },
  { time: '08:30', available: true, period: 'morning' },
  { time: '09:00', available: true, period: 'morning' },
  { time: '09:30', available: true, period: 'morning' },
  { time: '10:00', available: true, period: 'morning' },
  { time: '10:30', available: true, period: 'morning' },
  { time: '11:00', available: true, period: 'morning' },
  { time: '11:30', available: true, period: 'morning' },

  // Tarde e Noite (13:00 às 20:00) - Todos os horários liberados
  { time: '13:00', available: true, period: 'afternoon' },
  { time: '13:30', available: true, period: 'afternoon' },
  { time: '14:00', available: true, period: 'afternoon' },
  { time: '14:30', available: true, period: 'afternoon' },
  { time: '15:00', available: true, period: 'afternoon' },
  { time: '15:30', available: true, period: 'afternoon' },
  { time: '16:00', available: true, period: 'afternoon' },
  { time: '16:30', available: true, period: 'afternoon' },
  { time: '17:00', available: true, period: 'afternoon' },
  { time: '17:30', available: true, period: 'afternoon' },
  { time: '18:00', available: true, period: 'afternoon' },
  { time: '18:30', available: true, period: 'afternoon' },
  { time: '19:00', available: true, period: 'afternoon' },
  { time: '19:30', available: true, period: 'afternoon' },
  { time: '20:00', available: true, period: 'afternoon' },
];

export const BarberClientApp: React.FC<BarberClientAppProps> = ({
  tenantName = 'Barbearia Navalha de Ouro',
  tenantSubdomain = 'navalha-ouro',
  initialScreen = 'home',
  initialAuthMode = 'login',
  onLogout,
}) => {
  // Verifica se o acesso veio de escaneamento de QR Code
  const isFromQrCode = (() => {
    try {
      if (typeof window === 'undefined') return false;
      const params = new URLSearchParams(window.location.search);
      return (
        params.get('screen') === 'register' ||
        params.get('mode') === 'register' ||
        params.get('screen') === 'auth' ||
        initialScreen === 'auth'
      );
    } catch {
      return initialScreen === 'auth';
    }
  })();

  // Navigation & User State
  const [currentScreen, setCurrentScreen] = useState<ClientScreen>(() => {
    if (initialScreen === 'auth') return 'auth';
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        if (params.get('screen') === 'register' || params.get('screen') === 'auth') {
          return 'auth';
        }
      }
      const stored = localStorage.getItem(`active_client_user_${tenantSubdomain}`) || localStorage.getItem('active_client_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.name && parsed.id !== 'cli-carlos-1') return 'home';
      }
    } catch {}
    return 'auth';
  });

  const [user, setUser] = useState<ClientUser | null>(() => {
    try {
      const stored = localStorage.getItem(`active_client_user_${tenantSubdomain}`) || localStorage.getItem('active_client_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.name && parsed.id !== 'cli-carlos-1') {
          return {
            ...parsed,
            fidelityPoints: typeof parsed.fidelityPoints === 'number' ? parsed.fidelityPoints : 0,
          };
        }
      }
    } catch {}
    return null;
  });

  // Services & Barbers da barbearia (carregados do cadastro real do tenant)
  const [services, setServices] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem(`tenant_services_${tenantSubdomain}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.filter((s: any) => s && !String(s.id).startsWith('srv-'));
        }
      }
    } catch {}
    return AVAILABLE_SERVICES;
  });

  const [barbers, setBarbers] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem(`tenant_employees_${tenantSubdomain}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.filter((e: any) => e && e.id !== 'emp-1' && e.name !== 'Barbeiro Principal');
        }
      }
    } catch {}
    return BARBERS;
  });

  // Agendamentos reais do cliente (inicia vazio, sem agendamento demo falso)
  const [bookings, setBookings] = useState<ClientBooking[]>([]);
  const [lastCreatedBooking, setLastCreatedBooking] = useState<ClientBooking | null>(null);

  // Registered Clients from Database
  const [registeredDbClients, setRegisteredDbClients] = useState<BarberClient[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState<boolean>(true);
  const [clientSearchQuery, setClientSearchQuery] = useState<string>('');
  const [showClientPickerModal, setShowClientPickerModal] = useState<boolean>(false);

  // Auth Form State
  const [authName, setAuthName] = useState('');
  const [authEmailOrPhone, setAuthEmailOrPhone] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authMode, setAuthMode] = useState<'register' | 'login'>(() => {
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        if (params.get('screen') === 'register' || params.get('mode') === 'register') {
          return 'register';
        }
      }
    } catch {}
    return initialAuthMode;
  });
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);

  // Booking Form State
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [selectedBarber, setSelectedBarber] = useState<string>('Atendimento Geral / Barbeiro da Casa');
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    today.setDate(today.getDate() + 1);
    return today.toISOString().split('T')[0];
  });
  const [selectedTime, setSelectedTime] = useState<string>('14:30');
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);

  // Sincroniza serviços e barbeiros cadastrados pelo admin
  useEffect(() => {
    const handleServicesUpdated = (e: any) => {
      if (e?.detail?.tenantId === tenantSubdomain && Array.isArray(e?.detail?.services)) {
        setServices(e.detail.services);
      }
    };
    const handleEmployeesUpdated = (e: any) => {
      if (e?.detail?.tenantId === tenantSubdomain && Array.isArray(e?.detail?.employees)) {
        setBarbers(e.detail.employees);
      }
    };
    window.addEventListener('tenant_services_updated', handleServicesUpdated);
    window.addEventListener('tenant_employees_updated', handleEmployeesUpdated);
    return () => {
      window.removeEventListener('tenant_services_updated', handleServicesUpdated);
      window.removeEventListener('tenant_employees_updated', handleEmployeesUpdated);
    };
  }, [tenantSubdomain]);

  useEffect(() => {
    if (services.length > 0 && !selectedServiceId) {
      setSelectedServiceId(services[0].id);
    }
  }, [services, selectedServiceId]);

  useEffect(() => {
    if (barbers.length > 0 && (!selectedBarber || selectedBarber === 'Atendimento Geral / Barbeiro da Casa')) {
      setSelectedBarber(barbers[0].name);
    }
  }, [barbers, selectedBarber]);

  // Promotion Banners State
  const [banners, setBanners] = useState<BarberPromotionBanner[]>(DEFAULT_PROMOTION_BANNERS);
  const [appliedPromoBanner, setAppliedPromoBanner] = useState<BarberPromotionBanner | null>(null);

  // UI Feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Ao clicar em uma promoção do carrossel
  const handleSelectPromoBanner = (banner: BarberPromotionBanner) => {
    setAppliedPromoBanner(banner);
    if (banner.serviceTargetId) {
      setSelectedServiceId(banner.serviceTargetId);
    }
    showToast(`🔥 Promoção "${banner.title}" aplicada! Escolha seu horário.`);
    setCurrentScreen('booking');
  };

  // Load clients from Firestore & localStorage
  const loadDatabaseClients = async () => {
    setIsLoadingClients(true);
    try {
      const dbClients = await getClientsFromFirestore(tenantSubdomain);
      if (dbClients && dbClients.length > 0) {
        setRegisteredDbClients(dbClients);
      } else {
        setRegisteredDbClients([]);
      }
    } catch (e) {
      console.warn('Erro ao carregar clientes:', e);
    } finally {
      setIsLoadingClients(false);
    }
  };

  // Carrega e escuta banners promocionais em tempo real
  useEffect(() => {
    const loadBanners = async () => {
      try {
        const list = await getBannersFromFirestore(tenantSubdomain);
        if (list && list.length > 0) {
          setBanners(list);
        }
      } catch (e) {
        console.warn('Erro ao carregar banners:', e);
      }
    };
    loadBanners();

    const unsubBanners = subscribeToTenantBanners(tenantSubdomain, (liveBanners) => {
      if (liveBanners && liveBanners.length > 0) {
        setBanners(liveBanners);
      }
    });

    const handleCustomBannerEvent = (e: any) => {
      if (e.detail?.tenantId === tenantSubdomain && e.detail?.banners) {
        setBanners(e.detail.banners);
      }
    };
    window.addEventListener('barber_banners_updated', handleCustomBannerEvent);

    return () => {
      unsubBanners();
      window.removeEventListener('barber_banners_updated', handleCustomBannerEvent);
    };
  }, [tenantSubdomain]);

  useEffect(() => {
    loadDatabaseClients();

    const unsubscribe = subscribeToTenantClients(tenantSubdomain, (liveClients) => {
      if (liveClients) {
        setRegisteredDbClients(liveClients);

        // Se o usuário logado estiver na lista, sincroniza seus pontos de fidelidade em tempo real
        setUser((prevUser) => {
          if (!prevUser) return prevUser;
          const updatedRecord = liveClients.find(
            (c: any) => c.id === prevUser.id || (c.email && c.email.toLowerCase() === prevUser.email.toLowerCase())
          );
          if (updatedRecord && typeof updatedRecord.fidelityPoints === 'number' && updatedRecord.fidelityPoints !== prevUser.fidelityPoints) {
            const nextUser = { ...prevUser, fidelityPoints: updatedRecord.fidelityPoints };
            try {
              localStorage.setItem(`active_client_user_${tenantSubdomain}`, JSON.stringify(nextUser));
              localStorage.setItem('active_client_user', JSON.stringify(nextUser));
            } catch {}
            showToast(`⭐ O gerente atualizou seus selos de fidelidade: ${updatedRecord.fidelityPoints}/10!`);
            return nextUser;
          }
          return prevUser;
        });
      }
    });

    // Ouvinte imediato via Custom Event de fidelidade
    const handleFidelityEvent = (e: any) => {
      const detail = e.detail;
      if (detail && detail.points !== undefined) {
        setUser((prev) => {
          if (!prev) return prev;
          if (prev.id === detail.clientId || (detail.tenantSubdomain && detail.tenantSubdomain === tenantSubdomain)) {
            const nextUser = { ...prev, fidelityPoints: detail.points };
            try {
              localStorage.setItem(`active_client_user_${tenantSubdomain}`, JSON.stringify(nextUser));
              localStorage.setItem('active_client_user', JSON.stringify(nextUser));
            } catch {}
            showToast(`⭐ O gerente atualizou seus selos de fidelidade: ${detail.points}/10!`);
            return nextUser;
          }
          return prev;
        });
      }
    };

    window.addEventListener('barber_fidelity_updated', handleFidelityEvent);

    return () => {
      unsubscribe();
      window.removeEventListener('barber_fidelity_updated', handleFidelityEvent);
    };
  }, [tenantSubdomain]);

  // Ouvinte direto e focado no documento do cliente autenticado via onSnapshot
  useEffect(() => {
    if (!user?.id) return;

    const unsubscribeDirect = subscribeToClientFidelity(tenantSubdomain, user.id, (data) => {
      if (typeof data.fidelityPoints === 'number') {
        setUser((prev) => {
          if (!prev) return prev;
          if (prev.fidelityPoints !== data.fidelityPoints) {
            const nextUser = { ...prev, fidelityPoints: data.fidelityPoints };
            try {
              localStorage.setItem(`active_client_user_${tenantSubdomain}`, JSON.stringify(nextUser));
              localStorage.setItem('active_client_user', JSON.stringify(nextUser));
            } catch {}
            showToast(`⭐ O gerente atualizou seus selos de fidelidade: ${data.fidelityPoints}/10!`);
            return nextUser;
          }
          return prev;
        });
      }
    });

    return () => {
      unsubscribeDirect();
    };
  }, [tenantSubdomain, user?.id]);

  // Se não houver cliente logado e a tela for home, redireciona para login/cadastro
  useEffect(() => {
    if (!user && currentScreen !== 'auth') {
      setCurrentScreen('auth');
    }
  }, [user, currentScreen]);

  // Select an existing registered client directly
  const handleSelectExistingClient = (client: BarberClient) => {
    const clientUserData: ClientUser = {
      id: client.id,
      name: client.name,
      email: client.email || `${client.name.toLowerCase().replace(/\s+/g, '')}@barbearia.com`,
      phone: client.phone || '',
      fidelityPoints: client.fidelityPoints ?? 0,
      fidelityTarget: 10,
      memberSince: (client as any).memberSince || 'Agosto 2026',
    };

    setUser(clientUserData);
    try {
      localStorage.setItem(`active_client_user_${tenantSubdomain}`, JSON.stringify(clientUserData));
      localStorage.setItem('active_client_user', JSON.stringify(clientUserData));
    } catch {}

    setCurrentScreen('home');
    setShowClientPickerModal(false);
    showToast(`Bem-vindo, ${client.name}! Painel do cliente aberto.`);
  };

  // Carrega agendamentos reais do cliente atual
  useEffect(() => {
    async function loadUserBookings() {
      if (user?.id) {
        try {
          const userBookings = await getClientBookingsFromFirestore(
            user.id,
            tenantSubdomain,
            user.email,
            user.phone
          );
          setBookings(userBookings || []);
        } catch (e) {
          console.warn('Erro ao carregar agendamentos do cliente:', e);
          setBookings([]);
        }
      } else {
        setBookings([]);
      }
    }
    loadUserBookings();
  }, [user?.id, user?.email, user?.phone, tenantSubdomain]);

  // Auth Handler: Register or Login
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingAuth(true);

    try {
      if (authMode === 'register') {
        if (!authName.trim()) {
          showToast('Por favor, informe seu nome completo.');
          setIsSubmittingAuth(false);
          return;
        }

        const result = await registerClientInFirebase(
          authName.trim(),
          authEmail.trim() || `${authName.toLowerCase().replace(/\s+/g, '')}@barbearia.com`,
          authPassword.trim() || '123456',
          authPhone.trim() || '(11) 98765-4321',
          tenantSubdomain,
          tenantName
        );

        if (result.success && result.data) {
          setUser(result.data);
          setBookings([]); // Novo cadastro começa limpo sem agendamentos
          try {
            localStorage.setItem(`active_client_user_${tenantSubdomain}`, JSON.stringify(result.data));
            localStorage.setItem('active_client_user', JSON.stringify(result.data));
          } catch {}
          setCurrentScreen('home');
          showToast(`Cadastro criado com sucesso! Bem-vindo, ${result.data.name}!`);
          loadDatabaseClients();
        } else {
          showToast(result.error || 'Erro ao criar cadastro.');
        }
      } else {
        // Login Mode
        const identifier = authEmailOrPhone.trim() || authEmail.trim() || authName.trim() || 'cliente';
        const result = await loginClientInFirebase(identifier, authPassword.trim(), tenantSubdomain);

        if (result.success && result.data) {
          setUser(result.data);
          try {
            localStorage.setItem(`active_client_user_${tenantSubdomain}`, JSON.stringify(result.data));
            localStorage.setItem('active_client_user', JSON.stringify(result.data));
          } catch {}
          // Busca agendamentos reais do usuário logado
          try {
            const bks = await getClientBookingsFromFirestore(
              result.data.id,
              tenantSubdomain,
              result.data.email,
              result.data.phone
            );
            setBookings(bks || []);
          } catch {
            setBookings([]);
          }
          setCurrentScreen('home');
          showToast(`Olá, ${result.data.name}! Login efetuado com sucesso.`);
        } else {
          showToast(result.error || 'Não encontramos seu cadastro. Verifique os dados ou crie uma conta.');
        }
      }
    } catch (err: any) {
      console.error('Erro na autenticação:', err);
      showToast('Ocorreu um erro ao processar. Tente novamente.');
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  // Confirm booking
  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingBooking) return;
    setIsSubmittingBooking(true);

    try {
      if (!services || services.length === 0) {
        showToast('Nenhum serviço disponível para agendamento.');
        return;
      }

      const service = services.find((s: any) => s.id === selectedServiceId) || services[0];
      const servicePrice = typeof service.price === 'number' ? service.price : (parseFloat(service.price) || 0);

      const dateParts = selectedDate.split('-');
      const formatted = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : selectedDate;

      const newBooking: ClientBooking = {
        id: `bk-${Date.now()}`,
        serviceId: service.id,
        serviceName: service.name,
        servicePrice: servicePrice,
        barberName: selectedBarber || 'Atendimento Geral',
        date: selectedDate,
        formattedDate: formatted,
        time: selectedTime,
        status: 'Agendado',
        createdAt: new Date().toISOString(),
        clientId: user?.id,
        clientName: user?.name || 'Cliente Online',
        clientPhone: user?.phone || '',
        clientEmail: user?.email || '',
        tenantId: tenantSubdomain,
      };

      setBookings((prev) => [newBooking, ...prev]);
      setLastCreatedBooking(newBooking);

      // Save to Firestore & LocalStorage
      await saveBookingToFirestore(tenantSubdomain, newBooking, {
        id: user?.id,
        name: user?.name,
        phone: user?.phone,
        email: user?.email,
      });

      setCurrentScreen('success');
      showToast('Agendamento confirmado e gravado com sucesso!');
    } catch (err) {
      console.error('Erro ao confirmar agendamento:', err);
      showToast('Erro ao salvar agendamento. Tente novamente.');
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  // Cancel booking
  const handleCancelBooking = (bookingId: string) => {
    setBookings((prev) =>
      prev.map((bk) => (bk.id === bookingId ? { ...bk, status: 'Cancelado' } : bk))
    );
    showToast('Agendamento cancelado.');
  };

  const selectedServiceObj = useMemo(() => {
    if (!services || services.length === 0) return null;
    return services.find((s: any) => s.id === selectedServiceId) || services[0];
  }, [services, selectedServiceId]);

  // Filter registered clients for fast selection
  const filteredClients = useMemo(() => {
    if (!clientSearchQuery.trim()) return registeredDbClients;
    const q = clientSearchQuery.toLowerCase();
    return registeredDbClients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q))
    );
  }, [registeredDbClients, clientSearchQuery]);

  const points = user?.fidelityPoints ?? 0;
  const target = user?.fidelityTarget ?? 10;
  const isRewardReady = points >= target;

  return (
    <div className="w-full min-h-screen bg-gray-950 flex flex-col items-center justify-start md:py-6 px-0 sm:px-4 selection:bg-amber-500 selection:text-gray-950">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className="fixed top-4 z-50 px-4 py-3 rounded-xl shadow-2xl border text-xs sm:text-sm font-medium flex items-center gap-2.5 backdrop-blur-md bg-amber-950/95 text-amber-200 border-amber-500/50 max-w-sm mx-auto"
        >
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* MODAL: Selecionar Cliente Cadastrado */}
      {showClientPickerModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-2xl space-y-4 max-h-[85vh] flex flex-col"
          >
              <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                <div className="flex items-center gap-2 text-amber-400">
                  <UserCheck className="w-5 h-5" />
                  <h3 className="text-base font-bold text-white">Clientes Cadastrados no Banco</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowClientPickerModal(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Buscar por nome, telefone ou e-mail..."
                  value={clientSearchQuery}
                  onChange={(e) => setClientSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {filteredClients.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-xs">
                    Nenhum cliente encontrado com este termo.
                  </div>
                ) : (
                  filteredClients.map((cli) => (
                    <button
                      key={cli.id}
                      type="button"
                      onClick={() => handleSelectExistingClient(cli)}
                      className="w-full p-3 rounded-xl bg-gray-950 border border-gray-800 hover:border-amber-500/60 hover:bg-gray-800/40 text-left transition flex items-center justify-between group cursor-pointer"
                    >
                      <div className="space-y-0.5">
                        <p className="text-sm font-bold text-white group-hover:text-amber-400 transition">
                          {cli.name}
                        </p>
                        <p className="text-xs text-gray-400 flex items-center gap-2">
                          {cli.phone && <span>📱 {cli.phone}</span>}
                          {cli.email && <span className="truncate max-w-[150px]">✉️ {cli.email}</span>}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-lg">
                          ⭐ {cli.fidelityPoints ?? 0}/10 selos
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>

              <div className="pt-3 border-t border-gray-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowClientPickerModal(false);
                    setCurrentScreen('auth');
                    setAuthMode('register');
                  }}
                  className="text-xs text-amber-400 hover:underline font-semibold"
                >
                  + Cadastrar Novo Cliente
                </button>
              </div>
            </div>
          </div>
        )}

      {/* CONTAINER PRINCIPAL (Simula App Mobile / Web Compacto) */}
      <div className="w-full max-w-md bg-gray-900 md:rounded-2xl md:border md:border-gray-800 shadow-2xl min-h-screen md:min-h-[850px] flex flex-col relative overflow-hidden text-gray-100">
        
        {/* TOP BAR GLOBAL (Apenas para usuário logado navegando no app) */}
        {currentScreen !== 'auth' && (
          <header className="bg-gray-950 border-b border-gray-800 px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-gray-900 border border-amber-500/30 flex items-center justify-center p-0.5 overflow-hidden shadow-xs shrink-0">
                <img
                  src="/logo.png"
                  alt="Logo Barbearia"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = barberMascotImg;
                  }}
                />
              </div>
              <div>
                <span className="font-bold text-xs text-amber-400 block leading-tight">
                  BARBER_PRO • CLIENTE
                </span>
                <span className="text-[10px] text-gray-400 block truncate max-w-[140px]">
                  {tenantName}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <PWAInstallButton variant="compact" />

              <button
                type="button"
                onClick={() => setShowClientPickerModal(true)}
                className="text-[11px] bg-gray-800 hover:bg-gray-700 text-amber-300 px-2.5 py-1 rounded-lg border border-gray-700 font-medium transition cursor-pointer flex items-center gap-1"
                title="Trocar ou Buscar Cliente"
              >
                <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Clientes</span> ({registeredDbClients.length})
              </button>

              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-gray-800 transition cursor-pointer"
                  title="Sair / Trocar de Acesso"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          </header>
        )}

        {/* ========================================================
            1. TELA: CADASTRO / LOGIN (id="screen-auth")
           ======================================================== */}
        {currentScreen === 'auth' && (
          <div id="screen-auth" className="p-6 flex flex-col justify-between h-full flex-1 overflow-y-auto">
            
            {/* Header com Logo */}
            <div className="text-center my-3">
              <div className="w-20 h-20 rounded-2xl bg-zinc-950 border-2 border-amber-500/40 flex items-center justify-center mx-auto mb-3 shadow-xl overflow-hidden p-1.5">
                <img
                  src="/logo.png"
                  alt="Logo"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = barberMascotImg;
                  }}
                />
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mt-2 mb-0.5">
                Bem-vindo à sua Barbearia
              </h2>
              <h1 className="text-xs font-bold tracking-wider text-amber-500 uppercase">PORTAL DO CLIENTE</h1>
              <p className="text-gray-400 text-xs mt-0.5">Cartão Fidelidade & Agendamento Online</p>
              <span className="inline-block mt-1.5 text-[11px] bg-amber-500/10 text-amber-400 px-3 py-0.5 rounded-full border border-amber-500/20 font-medium">
                {tenantName}
              </span>
              <div className="mt-3 flex justify-center">
                <PWAInstallButton variant="subtle" label="Instalar no Celular" />
              </div>
            </div>

            {/* Banner Informativo se veio do QR Code */}
            {isFromQrCode && (
              <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 text-left">
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
                  <QrCode className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-300">Escaneado via QR Code</span>
                    <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Oficial
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-300 mt-0.5 leading-snug">
                    Cadastre-se para agendar cortes e pontuar na fidelidade exclusiva de <strong className="text-white">{tenantName}</strong>.
                  </p>
                </div>
              </div>
            )}

            {/* Alternador de Modo (Abas Login / Cadastro) */}
            <div className="flex bg-gray-950 p-1 rounded-xl border border-gray-800 mb-4">
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  authMode === 'login'
                    ? 'bg-amber-500 text-gray-950 shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Já Tenho Cadastro</span>
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  authMode === 'register'
                    ? 'bg-amber-500 text-gray-950 shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Novo Cadastro</span>
              </button>
            </div>

            {/* Formulário de Cadastro / Login */}
            <form onSubmit={handleAuth} className="space-y-3">
              {authMode === 'register' ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      id="auth-name"
                      required
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      placeholder="Ex: Carlos Eduardo"
                      className="w-full px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-sm focus:outline-none focus:border-amber-500 text-white transition placeholder-gray-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                      WhatsApp / Telefone
                    </label>
                    <input
                      type="text"
                      id="auth-phone"
                      value={authPhone}
                      onChange={(e) => setAuthPhone(e.target.value)}
                      placeholder="(11) 98765-4321"
                      className="w-full px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-sm focus:outline-none focus:border-amber-500 text-white transition placeholder-gray-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                      E-mail (opcional)
                    </label>
                    <input
                      type="email"
                      id="auth-email"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="cliente@email.com"
                      className="w-full px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-sm focus:outline-none focus:border-amber-500 text-white transition placeholder-gray-600"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                      Telefone, WhatsApp ou E-mail
                    </label>
                    <input
                      type="text"
                      id="auth-login-identifier"
                      required
                      value={authEmailOrPhone}
                      onChange={(e) => setAuthEmailOrPhone(e.target.value)}
                      placeholder="Ex: (11) 98765-4321 ou carlos@email.com"
                      className="w-full px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-sm focus:outline-none focus:border-amber-500 text-white transition placeholder-gray-600"
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                id="btn-submit-auth"
                disabled={isSubmittingAuth}
                className="w-full bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-gray-950 font-bold py-3.5 rounded-xl transition shadow-lg shadow-amber-500/20 text-sm cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                {isSubmittingAuth ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>{authMode === 'register' ? 'Criar Cartão & Entrar' : 'Acessar Meu Painel'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Acesso Rápido por Clientes Já Cadastrados */}
            <div className="mt-4 pt-3 border-t border-gray-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Ou escolha um cliente já cadastrado:</span>
                <button
                  type="button"
                  onClick={() => setShowClientPickerModal(true)}
                  className="text-amber-400 hover:underline font-semibold"
                >
                  Ver todos ({registeredDbClients.length})
                </button>
              </div>

              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {registeredDbClients.slice(0, 3).map((cli) => (
                  <button
                    key={cli.id}
                    type="button"
                    onClick={() => handleSelectExistingClient(cli)}
                    className="w-full px-3 py-2 rounded-lg bg-gray-950 border border-gray-800/80 hover:border-amber-500/50 flex items-center justify-between text-left text-xs transition cursor-pointer"
                  >
                    <span className="font-semibold text-gray-200">{cli.name}</span>
                    <span className="text-amber-400 font-mono text-[11px]">⭐ {cli.fidelityPoints ?? 0}/10 selos</span>
                  </button>
                ))}
              </div>
            </div>

            {onLogout && (
              <div className="mt-4 pt-2 text-center border-t border-gray-800/60">
                <button
                  type="button"
                  onClick={onLogout}
                  className="text-xs text-gray-400 hover:text-amber-400 transition cursor-pointer font-medium"
                >
                  Entrar como Barbeiro ou Administrador →
                </button>
              </div>
            )}

          </div>
        )}

        {/* ========================================================
            2. TELA: PAINEL PRINCIPAL DO CLIENTE (id="screen-home")
           ======================================================== */}
        {currentScreen === 'home' && (
          <div id="screen-home" className="p-4 sm:p-6 pb-24 space-y-6 flex-1 overflow-y-auto">
            
            {/* Banner de Boas-Vindas */}
            <div className="flex items-center justify-between bg-gray-950/80 border border-gray-800 rounded-2xl p-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-lg">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'C'}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Cliente VIP</span>
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <h2 className="text-base font-bold text-white truncate max-w-[180px]">
                    {user?.name || 'Cliente'}
                  </h2>
                  <p className="text-[11px] text-gray-400">
                    {user?.phone || user?.email || 'Membro Oficial'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowClientPickerModal(true)}
                className="text-[10px] bg-gray-800 hover:bg-gray-700 text-amber-300 px-2.5 py-1.5 rounded-lg border border-gray-700 font-semibold transition cursor-pointer"
              >
                Trocar
              </button>
            </div>

            {/* ========================================================
                CARROSSEL DE BANNERS PROMOCIONAIS DA BARBEARIA
               ======================================================== */}
            {banners.filter((b) => b.active).length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 fill-amber-400" />
                    <span>Destaques & Promoções Especiais</span>
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {banners.filter((b) => b.active).length} ofertas ativas
                  </span>
                </div>
                <PromoBannerCarousel
                  banners={banners}
                  onSelectPromo={handleSelectPromoBanner}
                  autoPlayInterval={5500}
                />
              </div>
            )}

            {/* ========================================================
                CARTÃO FIDELIDADE DIGITAL (10 SELOS)
               ======================================================== */}
            <div className="bg-gradient-to-b from-gray-900 to-gray-950 rounded-2xl border border-amber-500/30 p-5 shadow-xl shadow-amber-500/5 space-y-4 relative overflow-hidden">
              
              {/* Brilho decorativo de fundo */}
              <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-wide">CARTÃO FIDELIDADE</h3>
                    <p className="text-[10px] text-gray-400">Acumule 10 selos e ganhe 1 corte grátis</p>
                  </div>
                </div>
                <span className="text-xs font-black font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded-lg">
                  {points} / {target} SELOS
                </span>
              </div>

              {/* Barra de Progresso */}
              <div className="space-y-1">
                <div className="w-full h-2.5 bg-gray-950 rounded-full overflow-hidden border border-gray-800">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (points / target) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-gray-400">
                  <span>Início</span>
                  <span>{isRewardReady ? '🎉 Prêmio Liberado!' : `Faltam ${Math.max(0, target - points)} selo(s)`}</span>
                  <span>10 Selos</span>
                </div>
              </div>

              {/* Grid dos 10 Selos */}
              <div className="grid grid-cols-5 gap-2.5 pt-1">
                {Array.from({ length: target }).map((_, index) => {
                  const stampNumber = index + 1;
                  const isStamped = stampNumber <= points;
                  const isLast = stampNumber === target;

                  return (
                    <div
                      key={stampNumber}
                      className={`aspect-square rounded-xl border flex flex-col items-center justify-center relative transition-all ${
                        isStamped
                          ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-md shadow-amber-500/10'
                          : 'bg-gray-950/80 border-gray-800 text-gray-600'
                      }`}
                    >
                      {isStamped ? (
                        <div className="flex flex-col items-center">
                          {isLast ? (
                            <Gift className="w-5 h-5 text-amber-300 animate-bounce" />
                          ) : (
                            <Scissors className="w-4 h-4 text-amber-400 rotate-45" />
                          )}
                          <span className="text-[9px] font-black mt-0.5 font-mono">#{stampNumber}</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          {isLast ? (
                            <Gift className="w-4 h-4 text-gray-600" />
                          ) : (
                            <span className="text-xs font-bold font-mono">#{stampNumber}</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Status do Prêmio */}
              {isRewardReady ? (
                <div className="bg-emerald-500/20 border border-emerald-500/40 rounded-xl p-3 text-center space-y-1">
                  <p className="text-xs font-bold text-emerald-300 flex items-center justify-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    PARABÉNS! SEU CORTE GRÁTIS ESTÁ LIBERADO!
                  </p>
                  <p className="text-[11px] text-gray-300">
                    Apresente seu cartão na recepção da {tenantName} para resgatar sua cortesia.
                  </p>
                </div>
              ) : (
                <div className="bg-gray-950/60 rounded-xl p-3 border border-gray-800 space-y-1.5 text-xs text-gray-400">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0" />
                      <span className="text-gray-300 font-semibold">Crédito Exclusivo pelo Admin</span>
                    </div>
                    <span className="text-amber-400 font-bold font-mono">{points}/10 selos</span>
                  </div>
                  <p className="text-[11px] text-gray-400 leading-tight">
                    Novos cadastros iniciam com 0 selos. Cada ponto é creditado exclusivamente pelo administrador ou gerente da barbearia após o corte no balcão.
                  </p>
                </div>
              )}
            </div>

            {/* BOTÃO PRINCIPAL: AGENDAR NOVO HORÁRIO */}
            <button
              type="button"
              id="btn-nav-booking"
              onClick={() => setCurrentScreen('booking')}
              className="w-full bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-gray-950 font-bold py-4 rounded-xl flex items-center justify-center space-x-2 transition shadow-xl shadow-amber-500/20 cursor-pointer text-sm"
            >
              <CalendarPlus className="w-5 h-5 text-gray-950" />
              <span>Agendar Horário na Barbearia</span>
            </button>

            {/* SEUS AGENDAMENTOS */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Seus Agendamentos
                </h3>
                {bookings.length > 0 && (
                  <span className="text-[11px] text-amber-400 font-mono">
                    {bookings.filter((b) => b.status === 'Agendado').length} ativo(s)
                  </span>
                )}
              </div>

              <div id="lista-meus-agendamentos" className="space-y-2.5">
                {bookings.length === 0 ? (
                  <div className="bg-gray-950/60 border border-gray-800 rounded-xl p-6 text-center space-y-2">
                    <Clock className="w-8 h-8 text-gray-600 mx-auto" />
                    <p className="text-sm text-gray-400">
                      Nenhum agendamento marcado para os próximos dias.
                    </p>
                    <button
                      type="button"
                      onClick={() => setCurrentScreen('booking')}
                      className="text-xs text-amber-400 hover:underline font-semibold"
                    >
                      Clique aqui para reservar seu corte
                    </button>
                  </div>
                ) : (
                  bookings.map((bk) => (
                    <div
                      key={bk.id}
                      className="p-4 rounded-xl bg-gray-950 border border-gray-800 hover:border-gray-700 space-y-3 transition"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                              bk.status === 'Agendado'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : bk.status === 'Concluído'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}
                          >
                            {bk.status}
                          </span>
                          <h4 className="font-bold text-white text-sm mt-1">{bk.serviceName}</h4>
                          <p className="text-xs text-gray-400">Barbeiro: {bk.barberName}</p>
                        </div>

                        <span className="text-sm font-bold text-emerald-400 font-mono">
                          {bk.servicePrice.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-gray-800/80 flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2 text-gray-300">
                          <Calendar className="w-3.5 h-3.5 text-amber-400" />
                          <span className="font-mono">{bk.formattedDate}</span>
                          <span className="text-amber-400 font-bold font-mono">às {bk.time}</span>
                        </div>

                        {bk.status === 'Agendado' && (
                          <button
                            type="button"
                            onClick={() => handleCancelBooking(bk.id)}
                            className="text-gray-500 hover:text-red-400 text-xs transition cursor-pointer"
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Informações da Unidade */}
            <div className="bg-gray-950/60 rounded-xl border border-gray-800 p-4 space-y-2 text-xs text-gray-400">
              <div className="flex items-center gap-2 text-white font-semibold">
                <MapPin className="w-4 h-4 text-amber-500" />
                <span>{tenantName} — Unidade Principal</span>
              </div>
              <p className="pl-6">Av. Paulista, 1000 - Bela Vista, São Paulo - SP</p>
              <p className="pl-6 text-gray-500">Segunda a Sábado: 07:00 às 20:00 • Almoço: 12:00 às 13:00</p>
            </div>

          </div>
        )}

        {/* ========================================================
            3. TELA: FORMULÁRIO DE AGENDAMENTO (id="screen-booking")
           ======================================================== */}
        {currentScreen === 'booking' && (
          <div id="screen-booking" className="p-5 pb-24 space-y-5 flex-1 overflow-y-auto">
            
            {/* Header com Voltar */}
            <div className="flex items-center space-x-3 mb-2">
              <button
                type="button"
                id="btn-back-home"
                onClick={() => setCurrentScreen('home')}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition cursor-pointer"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h2 className="text-lg font-bold text-white">Escolha data e horário</h2>
            </div>

            <form onSubmit={handleConfirmBooking} className="space-y-4">
              
              {/* Seleção de Serviço */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                  Serviço Desejado
                </label>
                {services.length === 0 ? (
                  <div className="p-4 bg-gray-950/80 border border-gray-800 rounded-xl text-center space-y-1">
                    <p className="text-xs font-semibold text-amber-400">Nenhum serviço cadastrado na barbearia</p>
                    <p className="text-[11px] text-gray-500">
                      O cardápio de cortes e serviços ainda não foi preenchido pelo administrador.
                    </p>
                  </div>
                ) : (
                  <>
                    <select
                      id="book-service"
                      required
                      value={selectedServiceId}
                      onChange={(e) => setSelectedServiceId(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-950 border border-gray-800 rounded-xl text-sm focus:outline-none focus:border-amber-500 text-white transition cursor-pointer"
                    >
                      {services.map((srv: any) => (
                        <option key={srv.id} value={srv.id}>
                          {srv.name} — {(Number(srv.price) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} {srv.durationMinutes ? `(${srv.durationMinutes} min)` : srv.duration ? `(${srv.duration})` : ''}
                        </option>
                      ))}
                    </select>
                    {selectedServiceObj && (
                      <p className="text-[11px] text-gray-400 mt-1">
                        {selectedServiceObj.description || selectedServiceObj.desc || ''} {selectedServiceObj.durationMinutes ? `• Estimativa: ${selectedServiceObj.durationMinutes} min` : selectedServiceObj.duration ? `• Estimativa: ${selectedServiceObj.duration}` : ''}
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Seleção de Profissional / Barbeiro */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                  Profissional / Barbeiro
                </label>
                <select
                  id="book-barber"
                  value={selectedBarber}
                  onChange={(e) => setSelectedBarber(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-950 border border-gray-800 rounded-xl text-sm focus:outline-none focus:border-amber-500 text-white transition cursor-pointer"
                >
                  {barbers.length > 0 ? (
                    <>
                      {barbers.map((b: any) => (
                        <option key={b.id || b.name} value={b.name}>
                          {b.name} {b.role ? `(${b.role})` : ''}
                        </option>
                      ))}
                      <option value="Qualquer Barbeiro Disponível">Qualquer Barbeiro Disponível (Mais Rápido)</option>
                    </>
                  ) : (
                    <option value="Atendimento Geral / Barbeiro da Casa">Atendimento Geral / Barbeiro da Casa</option>
                  )}
                </select>
              </div>

              {/* Seleção de Data */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                  Selecione o Dia
                </label>
                <input
                  type="date"
                  id="book-date"
                  required
                  value={selectedDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-950 border border-gray-800 rounded-xl text-sm focus:outline-none focus:border-amber-500 text-white transition cursor-pointer"
                />

                {/* Quick Date Chips */}
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      setSelectedDate(d.toISOString().split('T')[0]);
                    }}
                    className="text-[11px] px-2.5 py-1 bg-gray-950 border border-gray-800 hover:border-amber-500 rounded-lg text-gray-300 transition cursor-pointer"
                  >
                    Hoje
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 1);
                      setSelectedDate(d.toISOString().split('T')[0]);
                    }}
                    className="text-[11px] px-2.5 py-1 bg-gray-950 border border-gray-800 hover:border-amber-500 rounded-lg text-gray-300 transition cursor-pointer"
                  >
                    Amanhã
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 2);
                      setSelectedDate(d.toISOString().split('T')[0]);
                    }}
                    className="text-[11px] px-2.5 py-1 bg-gray-950 border border-gray-800 hover:border-amber-500 rounded-lg text-gray-300 transition cursor-pointer"
                  >
                    Em 2 dias
                  </button>
                </div>
              </div>

              {/* Seleção de Horário Dinâmico */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Horários Disponíveis
                  </label>
                  <span className="text-[10px] text-amber-400 font-mono">
                    07:00 às 20:00
                  </span>
                </div>

                {/* Turno da Manhã */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400">
                    <span>☀️ Turno da Manhã</span>
                    <span className="text-[10px] text-gray-500 font-normal font-mono">(07:00 - 11:30)</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {TIME_SLOTS.filter((s) => s.period === 'morning').map((slot) => {
                      const isSelected = selectedTime === slot.time;
                      const isAvailable = slot.available;

                      return (
                        <button
                          key={slot.time}
                          type="button"
                          disabled={!isAvailable}
                          onClick={() => setSelectedTime(slot.time)}
                          className={`py-2 rounded-lg font-mono text-xs font-semibold transition flex flex-col items-center justify-center ${
                            !isAvailable
                              ? 'bg-gray-950/40 text-gray-600 border border-gray-900 cursor-not-allowed line-through'
                              : isSelected
                              ? 'bg-amber-500 text-gray-950 font-bold ring-2 ring-amber-500/50 shadow-md shadow-amber-500/20'
                              : 'bg-gray-950 text-gray-300 border border-gray-800 hover:border-amber-500/60 hover:text-white cursor-pointer'
                          }`}
                        >
                          <span>{slot.time}</span>
                          <span className="text-[8px] font-normal mt-0.5 opacity-80">
                            {isAvailable ? 'Livre' : 'Ocupado'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Intervalo de Almoço */}
                <div className="bg-gray-950/80 border border-amber-500/20 rounded-lg py-1.5 px-3 flex items-center justify-between text-[11px] text-gray-400">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400/70 shrink-0" />
                    <span>Intervalo de Almoço:</span>
                  </div>
                  <span className="font-mono font-bold text-amber-400/90 text-xs">
                    12:00 às 13:00 (Fechado)
                  </span>
                </div>

                {/* Turno da Tarde & Noite */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400">
                    <span>🌙 Turno da Tarde & Noite</span>
                    <span className="text-[10px] text-gray-500 font-normal font-mono">(13:00 - 20:00)</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {TIME_SLOTS.filter((s) => s.period === 'afternoon').map((slot) => {
                      const isSelected = selectedTime === slot.time;
                      const isAvailable = slot.available;

                      return (
                        <button
                          key={slot.time}
                          type="button"
                          disabled={!isAvailable}
                          onClick={() => setSelectedTime(slot.time)}
                          className={`py-2 rounded-lg font-mono text-xs font-semibold transition flex flex-col items-center justify-center ${
                            !isAvailable
                              ? 'bg-gray-950/40 text-gray-600 border border-gray-900 cursor-not-allowed line-through'
                              : isSelected
                              ? 'bg-amber-500 text-gray-950 font-bold ring-2 ring-amber-500/50 shadow-md shadow-amber-500/20'
                              : 'bg-gray-950 text-gray-300 border border-gray-800 hover:border-amber-500/60 hover:text-white cursor-pointer'
                          }`}
                        >
                          <span>{slot.time}</span>
                          <span className="text-[8px] font-normal mt-0.5 opacity-80">
                            {isAvailable ? 'Livre' : 'Ocupado'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Resumo do Agendamento */}
              {selectedServiceObj ? (
                <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 space-y-2">
                  <div className="flex justify-between items-center text-xs text-gray-400">
                    <span>Valor do Serviço:</span>
                    <span className="text-base font-bold text-emerald-400 font-mono">
                      {(Number(selectedServiceObj.price) || 0).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-400">
                    <span>Pontos no Cartão Fidelidade:</span>
                    <span className="text-amber-400 font-semibold">+1 Selo após corte</span>
                  </div>
                </div>
              ) : null}

              {/* Botão de Confirmação */}
              <button
                type="submit"
                id="btn-confirm-booking"
                disabled={isSubmittingBooking || services.length === 0}
                className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99] text-gray-950 font-bold py-4 rounded-xl transition shadow-lg shadow-amber-500/20 cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmittingBooking ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Confirmando Agendamento...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Confirmar Agendamento</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ========================================================
            4. TELA: SUCESSO DO AGENDAMENTO (id="screen-success")
           ======================================================== */}
        {currentScreen === 'success' && lastCreatedBooking && (
          <div id="screen-success" className="p-6 pb-24 flex flex-col justify-between h-full flex-1 overflow-y-auto">
            
            <div className="text-center my-auto py-6 space-y-4">
              <div
                className="w-20 h-20 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto shadow-xl"
              >
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-2xl font-bold text-white">Horário Reservado!</h3>
                <p className="text-xs text-gray-400 mt-1">
                  Seu agendamento foi registrado com sucesso na {tenantName}.
                </p>
              </div>

              {/* Card de Detalhes */}
              <div className="bg-gray-950 border border-gray-800 rounded-xl p-5 text-left space-y-3 max-w-sm mx-auto shadow-md">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-semibold">Serviço</p>
                  <p className="text-sm font-bold text-white">{lastCreatedBooking.serviceName}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-800/80">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-semibold">Data</p>
                    <p className="text-xs font-semibold text-gray-200 font-mono">{lastCreatedBooking.formattedDate}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-semibold">Horário</p>
                    <p className="text-xs font-bold text-amber-400 font-mono">{lastCreatedBooking.time}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-800/80 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-semibold">Barbeiro</p>
                    <p className="text-xs font-semibold text-gray-200">{lastCreatedBooking.barberName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-400 uppercase font-semibold">Total</p>
                    <p className="text-sm font-extrabold text-emerald-400 font-mono">
                      {lastCreatedBooking.servicePrice.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => setCurrentScreen('home')}
                className="w-full bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold py-3.5 rounded-xl transition cursor-pointer shadow-lg shadow-amber-500/10"
              >
                Voltar para Início
              </button>
            </div>

          </div>
        )}

        {/* BARRA DE NAVEGAÇÃO INFERIOR */}
        {currentScreen !== 'auth' && (
          <nav className="absolute bottom-0 inset-x-0 bg-gray-950/95 backdrop-blur-md border-t border-gray-800 h-16 flex items-center justify-around px-4 z-20">
            <button
              type="button"
              onClick={() => setCurrentScreen('home')}
              className={`flex flex-col items-center justify-center space-y-1 transition cursor-pointer ${
                currentScreen === 'home' ? 'text-amber-400 font-bold' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Star className="w-5 h-5" />
              <span className="text-[10px]">Fidelidade</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentScreen('booking')}
              className={`flex flex-col items-center justify-center space-y-1 transition cursor-pointer ${
                currentScreen === 'booking' ? 'text-amber-400 font-bold' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Calendar className="w-5 h-5" />
              <span className="text-[10px]">Agendar</span>
            </button>

            <button
              type="button"
              onClick={() => setShowClientPickerModal(true)}
              className="flex flex-col items-center justify-center space-y-1 transition cursor-pointer text-gray-500 hover:text-gray-300"
            >
              <User className="w-5 h-5" />
              <span className="text-[10px]">Trocar Cliente</span>
            </button>
          </nav>
        )}

      </div>
    </div>
  );
};

export default BarberClientApp;

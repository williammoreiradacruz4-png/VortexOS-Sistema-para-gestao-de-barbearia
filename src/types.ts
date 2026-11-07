export interface OtpState {
  digits: string[];
  isVerifying: boolean;
  isSuccess: boolean;
  errorMessage: string | null;
  successMessage: string | null;
  attempts: number;
  maxAttempts: number;
}

export interface PhoneNumberInfo {
  countryCode: string;
  masked: string;
  raw: string;
}

export type TenantStatus = 'Ativo' | 'Suspenso' | 'Pendente';

export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  cnpj: string;
  monthlyValue: number; // in BRL
  status: TenantStatus;
  adminEmail: string;
  adminPassword?: string;
  adminAccessCode?: string;
  createdAt: string;
  lastTempPassword?: {
    code: string;
    expiresAt: string;
    generatedAt: string;
  };
}

export interface SuperAdminConfig {
  adminName: string;
  adminEmail: string;
  adminPhone: string;
  adminPassword?: string;
  adminAccessCode?: string;
  rootDomain: string;
  tempPasswordExpiryHours: number;
  defaultMonthlyPrice: number;
  basicPlanPrice: number;
  proPlanPrice: number;
  enterprisePlanPrice: number;
  systemNotifications: boolean;
  twoFactorAuth: boolean;
  updatedAt?: string;
}

// Barber Dashboard Interfaces
export interface BarberAppointment {
  id: string;
  clientName: string;
  clientPhone: string;
  serviceName: string;
  servicePrice: number;
  barberName: string;
  dateTime: string;
  time: string;
  origin: 'Painel Cliente' | 'Presencial' | 'WhatsApp' | 'Telefone';
  status: 'Agendado' | 'Em Andamento' | 'Concluído' | 'Cancelado';
}

export interface BarberClient {
  id: string;
  name: string;
  phone: string;
  email: string;
  totalVisits: number;
  fidelityPoints: number;
  lastVisit: string;
  favoriteBarber: string;
  status: 'Ativo' | 'Inativo';
  tenantSubdomain?: string;
  tenantId?: string;
}

export interface BarberService {
  id: string;
  name: string;
  category: string;
  durationMinutes: number;
  price: number;
  description: string;
  active: boolean;
}

export interface BarberEmployee {
  id: string;
  name: string;
  role: string;
  phone: string;
  commissionPercentage: number;
  totalCutsMonth: number;
  status: 'Disponível' | 'Em Atendimento' | 'Folga';
  avatarInitials: string;
}

export interface BarberProduct {
  id: string;
  name: string;
  category: string;
  sku: string;
  costPrice: number;
  salePrice: number;
  stockQty: number;
  minStockQty: number;
  status: 'Normal' | 'Estoque Baixo' | 'Esgotado';
}

export interface CashTransaction {
  id: string;
  description: string;
  category: string;
  amount: number;
  type: 'entrada' | 'saida';
  paymentMethod: 'Pix' | 'Cartão Crédito' | 'Cartão Débito' | 'Dinheiro';
  time: string;
  operator: string;
  date?: string;
  tenantSubdomain?: string;
  tenantId?: string;
}

// Client Portal Interfaces
export interface BarberPromotionBanner {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  imageUrl: string;
  ctaText: string;
  ctaAction?: 'booking' | 'service' | 'whatsapp' | 'info';
  serviceTargetId?: string;
  serviceTargetName?: string;
  originalPrice?: number;
  promoPrice?: number;
  discountPercentage?: number;
  expiresAt?: string;
  active: boolean;
  order: number;
  themeColor?: 'amber' | 'emerald' | 'blue' | 'rose' | 'purple' | 'gold';
  createdAt?: string;
}

export interface ClientUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  fidelityPoints: number;
  fidelityTarget: number;
  memberSince: string;
  tenantSubdomain?: string;
  tenantId?: string;
  tenantName?: string;
}

export interface ClientBooking {
  id: string;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  barberName: string;
  date: string;
  formattedDate: string;
  time: string;
  status: 'Agendado' | 'Em Andamento' | 'Concluído' | 'Cancelado';
  createdAt?: string;
  clientId?: string;
  clientName?: string;
  clientPhone?: string;
  clientEmail?: string;
  tenantSubdomain?: string;
  tenantId?: string;
}

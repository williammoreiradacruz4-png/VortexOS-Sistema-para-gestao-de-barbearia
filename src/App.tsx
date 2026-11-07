import React, { useState, useEffect } from 'react';
import SplashScreen from './components/SplashScreen';
import './App.css'; // Estilos gerais da sua aplicação
import { SuperAdminDashboard } from './components/SuperAdminDashboard';
import { BarberAdminDashboard } from './components/BarberAdminDashboard';
import { BarberClientApp } from './components/BarberClientApp';
import { OtpVerificationCard, AccessRole } from './components/OtpVerificationCard';
import { ErrorBoundary } from './components/ErrorBoundary';
import { OfflineIndicator } from './components/OfflineIndicator';
import { Tenant } from './types';

export default function App() {
  const [loading, setLoading] = useState<boolean>(true);

  // Mode: 'auth' (default password screen) | 'superadmin' (Super Admin) | 'barbearia' (Barbearia Admin) | 'cliente' (Painel do Cliente)
  const [currentView, setCurrentView] = useState<'auth' | 'superadmin' | 'barbearia' | 'cliente'>('auth');
  const [activeRole, setActiveRole] = useState<AccessRole>('barbearia');
  const [clientScreenMode, setClientScreenMode] = useState<'home' | 'auth'>('home');

  // Barber Tenant active session data
  const [activeBarberTenant, setActiveBarberTenant] = useState<{
    name: string;
    subdomain: string;
    tempPasswordUsed?: string;
  }>({
    name: 'Barbearia Navalha de Ouro',
    subdomain: 'navalha-ouro',
    tempPasswordUsed: undefined,
  });

  // Detect internal domain or query parameters on mount (e.g. ?b=navalha-ouro or ?admin=navalha-ouro)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tenantParam = params.get('b') || params.get('tenant') || params.get('barbearia');
      const adminParam = params.get('admin');
      const viewParam = params.get('view');

      // Check also hostname subdomains (e.g., navalha-ouro.meuapp.com)
      const hostname = window.location.hostname.toLowerCase();
      let detectedSubdomain = tenantParam;

      const isHostingDomain =
        hostname.includes('localhost') ||
        hostname.includes('127.0.0.1') ||
        hostname.includes('run.app') ||
        hostname.includes('netlify.app') ||
        hostname.includes('vercel.app') ||
        hostname.includes('web.app') ||
        hostname.includes('firebaseapp.com') ||
        hostname.includes('pages.dev') ||
        hostname.includes('onrender.com') ||
        hostname.includes('stackblitz.io') ||
        hostname.includes('cloudworkstations.dev') ||
        hostname.includes('google.com') ||
        hostname.includes('github.io');

      if (!detectedSubdomain && hostname && !isHostingDomain) {
        const parts = hostname.split('.');
        if (parts.length > 2 && parts[0] !== 'www') {
          detectedSubdomain = parts[0];
        }
      }

      if (detectedSubdomain) {
        let realName = '';
        try {
          const cached = localStorage.getItem('cached_tenants_list');
          if (cached) {
            const list = JSON.parse(cached);
            const found = list.find(
              (t: any) =>
                (t.subdomain && t.subdomain.toLowerCase() === detectedSubdomain?.toLowerCase()) ||
                (t.id && t.id.toLowerCase() === detectedSubdomain?.toLowerCase())
            );
            if (found && found.name) realName = found.name;
          }
        } catch {}

        const formattedName =
          realName ||
          detectedSubdomain
            .split('-')
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');

        setActiveBarberTenant((prev) => ({
          ...prev,
          name: realName || (prev.subdomain === detectedSubdomain ? prev.name : `Barbearia ${formattedName}`),
          subdomain: detectedSubdomain,
        }));
      }

      const screenParam = params.get('screen');
      const modeParam = params.get('mode') || params.get('auth');

      if (viewParam === 'superadmin') {
        setActiveRole('admin');
        setCurrentView('superadmin');
      } else if (viewParam === 'admin' || viewParam === 'barbearia') {
        setActiveRole('barbearia');
        setCurrentView('barbearia');
      } else if (viewParam === 'auth' || adminParam) {
        setActiveRole('barbearia');
        setCurrentView('auth');
      } else {
        // Padrão: Visão do App do Cliente
        setActiveRole('cliente');
        setCurrentView('cliente');
        if (screenParam === 'register' || screenParam === 'auth' || modeParam === 'register') {
          setClientScreenMode('auth');
        }
      }
    } catch (e) {
      console.warn('Erro ao verificar domínio interno da URL:', e);
    }

    // Limpa a splash prévia do index.html para o componente SplashScreen assumir
    if (typeof (window as any).__dismissSplash === 'function') {
      (window as any).__dismissSplash();
    }
  }, []);

  const handleAuthSuccess = (
    role: AccessRole,
    initialScreen: 'auth' | 'home' = 'home',
    tenant?: Tenant
  ) => {
    setActiveRole(role);
    if (role === 'admin') {
      setCurrentView('superadmin');
    } else if (role === 'barbearia') {
      if (tenant) {
        setActiveBarberTenant({
          name: tenant.name,
          subdomain: tenant.subdomain,
          tempPasswordUsed: tenant.lastTempPassword?.code || tenant.adminAccessCode || tenant.adminPassword,
        });
      }
      setCurrentView('barbearia');
    } else if (role === 'cliente') {
      if (tenant) {
        setActiveBarberTenant({
          name: tenant.name,
          subdomain: tenant.subdomain,
        });
      }
      setClientScreenMode(initialScreen);
      setCurrentView('cliente');
    }
  };

  const handleDirectRegister = () => {
    setActiveRole('cliente');
    setClientScreenMode('auth');
    setCurrentView('cliente');
  };

  const handleLogout = () => {
    setCurrentView('auth');
  };

  const handleOpenBarberWithPassword = (tenant: Tenant, passwordCode: string) => {
    setActiveBarberTenant({
      name: tenant.name,
      subdomain: tenant.subdomain,
      tempPasswordUsed: passwordCode,
    });
    setCurrentView('barbearia');
  };

  return (
    <>
      {loading ? (
        <SplashScreen onFinished={() => setLoading(false)} />
      ) : (
        <div className="min-h-screen w-full bg-gray-950 text-gray-100 font-sans antialiased relative">
          <ErrorBoundary fallbackTitle="Painel Principal">
            <OfflineIndicator />
            {currentView === 'superadmin' && (
              <SuperAdminDashboard
                onLogout={handleLogout}
                onOpenBarberWithPassword={handleOpenBarberWithPassword}
              />
            )}

            {currentView === 'barbearia' && (
              <BarberAdminDashboard
                key={activeBarberTenant.subdomain}
                tenantName={activeBarberTenant.name}
                tenantSubdomain={activeBarberTenant.subdomain}
                tempPasswordUsed={activeBarberTenant.tempPasswordUsed}
                onLogout={handleLogout}
                onSwitchToSuperAdmin={() => setCurrentView('superadmin')}
                onSwitchToClientApp={() => setCurrentView('cliente')}
              />
            )}

            {currentView === 'cliente' && (
              <BarberClientApp
                key={`${activeBarberTenant.subdomain}_${clientScreenMode}`}
                tenantName={activeBarberTenant.name}
                tenantSubdomain={activeBarberTenant.subdomain}
                initialScreen={clientScreenMode}
                initialAuthMode={clientScreenMode === 'auth' ? 'register' : 'register'}
                onLogout={handleLogout}
              />
            )}

            {currentView === 'auth' && (
              <main className="min-h-screen w-full flex items-center justify-center p-4 animate-fade-in">
                <OtpVerificationCard
                  initialRole={activeRole}
                  onSuccess={handleAuthSuccess}
                  onDirectRegister={handleDirectRegister}
                />
              </main>
            )}
          </ErrorBoundary>
        </div>
      )}
    </>
  );
}

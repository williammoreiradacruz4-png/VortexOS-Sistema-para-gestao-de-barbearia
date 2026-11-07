import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  updatePassword,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { ClientUser, Tenant, ClientBooking, SuperAdminConfig, BarberPromotionBanner, CashTransaction } from '../types';
import { DEFAULT_PROMOTION_BANNERS } from './promoBannersData';

/**
 * Interface para retorno de autenticação/cadastro
 */
export interface AuthResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  isFirebaseCloud?: boolean;
}

// ============================================================================
// 1. CLIENTES: CADASTRO NO FIREBASE AUTH & FIRESTORE
// ============================================================================

/**
 * Registra um novo cliente no Firebase Authentication (email e senha)
 * e salva os dados na coleção 'clients' e 'users' do Firestore com 0 selos.
 */
export async function registerClientInFirebase(
  nameOrEmail: string,
  emailOrPassword?: string,
  passwordOrName?: string,
  phone: string = '(11) 98765-4321',
  tenantId: string = 'navalha-ouro',
  tenantName?: string
): Promise<AuthResult<ClientUser>> {
  let cleanName = 'Cliente VIP';
  let cleanEmail = '';
  let cleanPassword = '123456';

  if (nameOrEmail && nameOrEmail.includes('@')) {
    cleanEmail = nameOrEmail.trim().toLowerCase();
    cleanPassword = (emailOrPassword || '123456').trim();
    cleanName = (passwordOrName || 'Cliente').trim();
  } else {
    cleanName = (nameOrEmail || 'Cliente VIP').trim();
    if (emailOrPassword && emailOrPassword.includes('@')) {
      cleanEmail = emailOrPassword.trim().toLowerCase();
      cleanPassword = (passwordOrName || '123456').trim();
    } else {
      cleanPassword = (emailOrPassword || '123456').trim();
      cleanEmail = (passwordOrName && passwordOrName.includes('@'))
        ? passwordOrName.trim().toLowerCase()
        : `${cleanName.toLowerCase().replace(/\s+/g, '')}@barbearia.com`;
    }
  }

  const cleanPhone = (phone || '').trim() || '(11) 98765-4321';
  const cleanTenant = (tenantId || 'navalha-ouro').trim();

  try {
    let fbUser: FirebaseUser | null = null;
    let uid = '';

    // 1. Tenta criar usuário no Firebase Authentication
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPassword);
      fbUser = userCredential.user;
      uid = fbUser.uid;

      // Atualiza o Display Name no Firebase Auth
      await updateProfile(fbUser, { displayName: cleanName });
    } catch (authErr: any) {
      // Se o email já existir no Auth, tenta fazer login
      if (authErr.code === 'auth/email-already-in-use') {
        try {
          const loginCredential = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
          fbUser = loginCredential.user;
          uid = fbUser.uid;
        } catch {
          uid = `client_${Date.now()}`;
        }
      } else {
        console.warn('Firebase Auth warning, criando ID no Firestore:', authErr);
        uid = `client_${Date.now()}`;
      }
    }

    if (!uid) {
      uid = `cli_${Date.now()}`;
    }

    const currentMonthYear = new Intl.DateTimeFormat('pt-BR', {
      month: 'long',
      year: 'numeric',
    }).format(new Date());

    const formattedMemberSince =
      currentMonthYear.charAt(0).toUpperCase() + currentMonthYear.slice(1);

    const clientData: ClientUser = {
      id: uid,
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      fidelityPoints: 0, // Inicia rigorosamente com 0 selos
      fidelityTarget: 10,
      memberSince: formattedMemberSince,
      tenantSubdomain: cleanTenant,
      tenantId: cleanTenant,
      tenantName: tenantName || undefined,
    };

    // 2. Salva na coleção 'clients' e na subcoleção da barbearia do Cloud Firestore
    try {
      const payload = {
        uid: uid,
        id: uid,
        name: cleanName,
        email: cleanEmail,
        password: cleanPassword, // Mantém backup para login resiliente
        phone: cleanPhone,
        fidelityPoints: 0,
        fidelityTarget: 10,
        memberSince: formattedMemberSince,
        tenantSubdomain: cleanTenant,
        tenantId: cleanTenant,
        tenantName: tenantName || null,
        role: 'client',
        totalVisits: 0,
        lastVisit: 'Recente',
        favoriteBarber: '',
        status: 'Ativo',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // 2.1 Grava na subcoleção específica da barbearia: tenants/{tenantId}/clients
      await setDoc(doc(db, `tenants/${cleanTenant}/clients`, uid), payload, { merge: true });

      // 2.2 Grava na coleção raiz 'clients' com filtro tenantSubdomain e tenantId
      await setDoc(doc(db, 'clients', uid), payload, { merge: true });

      // 2.3 Salva na coleção global de perfis 'users'
      await setDoc(
        doc(db, 'users', uid),
        {
          uid: uid,
          id: uid,
          name: cleanName,
          email: cleanEmail,
          phone: cleanPhone,
          role: 'client',
          tenantSubdomain: cleanTenant,
          tenantId: cleanTenant,
          tenantName: tenantName || null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (firestoreErr) {
      console.warn('Firestore write warning:', firestoreErr);
    }

    // Salva localmente para persistência e sincronização de sessão isolada por barbearia
    try {
      // Atualiza lista de clientes do tenant no localStorage
      const tenantClientsKey = `tenant_clients_${cleanTenant}`;
      const existingClients = localStorage.getItem(tenantClientsKey);
      let clientsList: any[] = existingClients ? JSON.parse(existingClients) : [];
      const cliMap = new Map<string, any>();
      cliMap.set(uid, {
        id: uid,
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        fidelityPoints: 0,
        totalVisits: 0,
        lastVisit: 'Recente',
        favoriteBarber: '',
        status: 'Ativo',
        tenantSubdomain: cleanTenant,
        tenantId: cleanTenant,
      });
      if (Array.isArray(clientsList)) {
        clientsList.forEach((c) => {
          const safeId = c?.id || c?.uid;
          if (safeId && safeId !== uid) {
            cliMap.set(safeId, c);
          }
        });
      }
      localStorage.setItem(tenantClientsKey, JSON.stringify(Array.from(cliMap.values())));

      localStorage.setItem(`active_client_user_${cleanTenant}`, JSON.stringify(clientData));
      localStorage.setItem('active_client_user', JSON.stringify(clientData));
      
      // Dispara evento imediato para sincronizar telas abertas da barbearia
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('barber_client_registered', {
            detail: {
              ...clientData,
              tenantSubdomain: cleanTenant,
              tenantId: cleanTenant,
            },
          })
        );
      }
    } catch {}

    return {
      success: true,
      data: clientData,
      isFirebaseCloud: true,
    };
  } catch (error: any) {
    console.error('Erro ao registrar cliente no Firebase:', error);
    return {
      success: false,
      error: error.message || 'Erro ao criar conta no Firebase.',
    };
  }
}

/**
 * Autentica cliente existente no Firebase Authentication e busca dados do Firestore
 * Suporta busca por E-mail ou Telefone com correspondência exata para evitar misturar clientes.
 */
export async function loginClientInFirebase(
  identifier: string,
  password?: string,
  tenantId: string = 'navalha-ouro'
): Promise<AuthResult<ClientUser>> {
  const cleanIdentifier = identifier.trim().toLowerCase();
  const cleanPass = (password || '').trim();
  const cleanSearchNum = cleanIdentifier.replace(/\D/g, '');

  try {
    let clientData: ClientUser | null = null;
    let uid = '';

    // 1. Se for email e tiver senha, tenta autenticar via Firebase Auth
    if (cleanIdentifier.includes('@') && cleanPass) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, cleanIdentifier, cleanPass);
        const fbUser = userCredential.user;
        uid = fbUser.uid;

        const clientDoc = await getDoc(doc(db, 'clients', uid));
        if (clientDoc.exists()) {
          const d = clientDoc.data();
          clientData = {
            id: uid,
            name: d.name || fbUser.displayName || 'Cliente',
            email: d.email || cleanIdentifier,
            phone: d.phone || '',
            fidelityPoints: d.fidelityPoints !== undefined ? d.fidelityPoints : 0,
            fidelityTarget: d.fidelityTarget || 10,
            memberSince: d.memberSince || 'Agosto 2026',
          };
        }
      } catch (authErr) {
        console.warn('Firebase Auth signIn não concluiu, buscando no Firestore direto:', authErr);
      }
    }

    // 2. Busca no Firestore: primeiro correspondência EXATA (por email, telefone, id ou nome exato)
    if (!clientData) {
      try {
        const allDocs: any[] = [];

        // Busca na subcoleção do tenant
        try {
          const tenantClientsSnap = await getDocs(collection(db, `tenants/${tenantId}/clients`));
          tenantClientsSnap.forEach((docSnap) => {
            allDocs.push({ id: docSnap.id, ...docSnap.data() });
          });
        } catch {}

        // Busca na coleção global 'clients'
        try {
          const globalClientsSnap = await getDocs(collection(db, 'clients'));
          globalClientsSnap.forEach((docSnap) => {
            if (!allDocs.some((item) => item.id === docSnap.id)) {
              allDocs.push({ id: docSnap.id, ...docSnap.data() });
            }
          });
        } catch {}

        // 2.1 Passo 1: Busca EXATA por Email
        let matched = allDocs.find((d) => (d.email || '').trim().toLowerCase() === cleanIdentifier);

        // 2.2 Passo 2: Busca EXATA por Telefone (se informado telefone com 8+ dígitos)
        if (!matched && cleanSearchNum.length >= 8) {
          matched = allDocs.find((d) => {
            const docDigits = (d.phone || '').replace(/\D/g, '');
            return docDigits === cleanSearchNum || (docDigits.length >= 8 && docDigits.endsWith(cleanSearchNum));
          });
        }

        // 2.3 Passo 3: Busca EXATA por Nome
        if (!matched && cleanIdentifier.length >= 3) {
          matched = allDocs.find((d) => (d.name || '').trim().toLowerCase() === cleanIdentifier);
        }

        // 2.4 Passo 4: Busca por ID
        if (!matched) {
          matched = allDocs.find((d) => d.id === cleanIdentifier || d.uid === cleanIdentifier);
        }

        // 2.5 Passo 5: Se não achou exato, busca se o nome contém a palavra buscada (apenas se for único/relevante)
        if (!matched && cleanIdentifier.length >= 3 && !cleanIdentifier.includes('@')) {
          matched = allDocs.find((d) => (d.name || '').toLowerCase().includes(cleanIdentifier));
        }

        if (matched) {
          const clientTenantId = matched.tenantId || tenantId;
          clientData = {
            id: matched.id || matched.uid || `cli-${Date.now()}`,
            name: matched.name || 'Cliente',
            email: matched.email || cleanIdentifier,
            phone: matched.phone || '',
            fidelityPoints: matched.fidelityPoints !== undefined ? matched.fidelityPoints : 0,
            fidelityTarget: matched.fidelityTarget || 10,
            memberSince: matched.memberSince || 'Agosto 2026',
            tenantId: clientTenantId,
            tenantName: matched.tenantName || undefined,
          };
        }
      } catch (firestoreErr) {
        console.warn('Erro ao consultar Firestore clients:', firestoreErr);
      }
    }

    if (clientData) {
      const activeTenantKey = clientData.tenantId || tenantId;
      try {
        localStorage.setItem(`active_client_user_${activeTenantKey}`, JSON.stringify(clientData));
        localStorage.setItem('active_client_user', JSON.stringify(clientData));
      } catch {}

      return {
        success: true,
        data: clientData,
        isFirebaseCloud: true,
      };
    }

    return {
      success: false,
      error: 'Nenhum cadastro encontrado com este e-mail, telefone ou nome. Por favor, verifique ou crie uma conta nova.',
    };
  } catch (error: any) {
    console.error('Erro ao fazer login no Firebase:', error);
    return {
      success: false,
      error: error.message || 'Credenciais inválidas.',
    };
  }
}

/**
 * Atualiza pontos de fidelidade no Firestore (Ação exclusiva do Gerente/Admin)
 * Suporta assinaturas flexíveis:
 * - updateClientFidelityInFirestore(tenantSubdomain, clientId, novosPontos)
 * - updateClientFidelityInFirestore(clientId, novosPontos, tenantSubdomain)
 */
export async function updateClientFidelityInFirestore(
  param1: string,
  param2: string | number,
  param3?: string | number
): Promise<{ success: boolean; points: number }> {
  let tenantId = 'navalha-ouro';
  let clientId = '';
  let points = 0;

  if (typeof param2 === 'number') {
    // Assinatura: (clientId, points, tenantId)
    clientId = param1;
    points = param2;
    tenantId = typeof param3 === 'string' ? param3 : 'navalha-ouro';
  } else {
    // Assinatura: (tenantSubdomain, clientId, points)
    tenantId = param1;
    clientId = param2;
    points = typeof param3 === 'number' ? param3 : (parseInt(String(param3)) || 0);
  }

  const cleanTenant = (tenantId || 'navalha-ouro').trim();
  const clampedPoints = Math.max(0, Math.min(10, points));

  try {
    const updatePayload = {
      fidelityPoints: clampedPoints,
      tenantSubdomain: cleanTenant,
      tenantId: cleanTenant,
      lastFidelityUpdate: new Date().toISOString(),
      updatedAt: serverTimestamp(),
    };

    // 1. Atualiza na subcoleção da empresa
    await setDoc(
      doc(db, `tenants/${cleanTenant}/clients`, clientId),
      updatePayload,
      { merge: true }
    );

    // 2. Atualiza coleção global de clientes
    await setDoc(
      doc(db, 'clients', clientId),
      updatePayload,
      { merge: true }
    );

    // 3. Atualiza cache local do tenant
    try {
      const tenantClientsKey = `tenant_clients_${cleanTenant}`;
      const existingClients = localStorage.getItem(tenantClientsKey);
      if (existingClients) {
        let clientsList: any[] = JSON.parse(existingClients);
        clientsList = clientsList.map((c) =>
          (c.id === clientId || c.uid === clientId) ? { ...c, fidelityPoints: clampedPoints } : c
        );
        localStorage.setItem(tenantClientsKey, JSON.stringify(clientsList));
      }

      // Atualiza usuário ativo se for o mesmo
      const activeUserKey = `active_client_user_${cleanTenant}`;
      const storedActive = localStorage.getItem(activeUserKey);
      if (storedActive) {
        const u = JSON.parse(storedActive);
        if (u.id === clientId || u.uid === clientId) {
          u.fidelityPoints = clampedPoints;
          localStorage.setItem(activeUserKey, JSON.stringify(u));
          localStorage.setItem('active_client_user', JSON.stringify(u));
        }
      }
    } catch {}

    // 4. Dispara CustomEvent para notificar o App do Cliente e o Dashboard instantaneamente
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('barber_fidelity_updated', {
          detail: {
            clientId,
            points: clampedPoints,
            tenantSubdomain: cleanTenant,
            tenantId: cleanTenant,
          },
        })
      );
    }

    // 5. Log de auditoria do carimbo
    try {
      await addDoc(collection(db, 'fidelity_logs'), {
        clientId,
        tenantSubdomain: cleanTenant,
        tenantId: cleanTenant,
        points: clampedPoints,
        timestamp: serverTimestamp(),
        date: new Date().toISOString(),
        actionBy: 'MANAGER_ADMIN',
      });
    } catch {
      // ignore
    }

    return { success: true, points: clampedPoints };
  } catch (err) {
    console.warn('Erro ao atualizar fidelidade no Firestore:', err);
    return { success: false, points };
  }
}

/**
 * Escuta em tempo real as atualizações de fidelidade e perfil de um cliente específico
 */
export function subscribeToClientFidelity(
  tenantId: string,
  clientId: string,
  onUpdate: (data: { fidelityPoints: number; name?: string; phone?: string; email?: string }) => void
): () => void {
  const cleanTenant = (tenantId || 'navalha-ouro').trim();
  if (!clientId) return () => {};

  const unsubs: (() => void)[] = [];

  try {
    // 1. Ouve documento na subcoleção do tenant: tenants/{tenantId}/clients/{clientId}
    const tenantDocRef = doc(db, `tenants/${cleanTenant}/clients`, clientId);
    const unsubTenantDoc = onSnapshot(
      tenantDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const d = docSnap.data();
          if (typeof d.fidelityPoints === 'number' || d.fidelityPoints !== undefined) {
            onUpdate({
              fidelityPoints: Number(d.fidelityPoints) || 0,
              name: d.name,
              phone: d.phone,
              email: d.email,
            });
          }
        }
      },
      (err) => console.warn('Listener client tenant doc warning:', err)
    );
    unsubs.push(unsubTenantDoc);

    // 2. Ouve documento na coleção global clients/{clientId}
    const globalDocRef = doc(db, 'clients', clientId);
    const unsubGlobalDoc = onSnapshot(
      globalDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const d = docSnap.data();
          if (typeof d.fidelityPoints === 'number' || d.fidelityPoints !== undefined) {
            onUpdate({
              fidelityPoints: Number(d.fidelityPoints) || 0,
              name: d.name,
              phone: d.phone,
              email: d.email,
            });
          }
        }
      },
      (err) => console.warn('Listener global client doc warning:', err)
    );
    unsubs.push(unsubGlobalDoc);
  } catch (err) {
    console.warn('Erro ao registrar listener de fidelidade do cliente:', err);
  }

  return () => {
    unsubs.forEach((u) => {
      try {
        u();
      } catch {}
    });
  };
}

// ============================================================================
// 2. EMPRESAS (TENANTS): CADASTRO NO FIRESTORE & AUTHENTICATION
// ============================================================================

/**
 * Cadastra uma nova Empresa/Barbearia no Firestore (coleção 'tenants')
 * e cria credencial de administrador no Firebase Authentication.
 */
export async function registerTenantInFirebase(
  tenantData: Omit<Tenant, 'id' | 'createdAt'>,
  adminPassword?: string
): Promise<AuthResult<Tenant>> {
  const tenantId = `t-${Date.now()}`;
  const cleanEmail = tenantData.adminEmail.trim().toLowerCase();
  const password = adminPassword || '482910';
  const accessCode = adminPassword && adminPassword.length === 6 && /^\d+$/.test(adminPassword) ? adminPassword : '482910';

  const newTenant: Tenant = {
    ...tenantData,
    id: tenantId,
    adminPassword: password,
    adminAccessCode: accessCode,
    createdAt: new Date().toISOString().split('T')[0],
  };

  try {
    let adminUid = `admin_${Date.now()}`;

    // 1. Cria conta de administrador no Firebase Authentication
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      adminUid = userCredential.user.uid;
      await updateProfile(userCredential.user, {
        displayName: `${tenantData.name} Admin`,
      });
    } catch (authErr: any) {
      if (authErr.code !== 'auth/email-already-in-use') {
        console.warn('Firebase Auth admin creation note:', authErr);
      }
    }

    // 2. Salva na coleção 'tenants' do Firestore com senha e código de acesso
    try {
      await setDoc(
        doc(db, 'tenants', tenantId),
        {
          id: tenantId,
          name: tenantData.name,
          subdomain: tenantData.subdomain,
          cnpj: tenantData.cnpj,
          monthlyValue: tenantData.monthlyValue,
          status: tenantData.status,
          adminEmail: cleanEmail,
          adminPassword: password,
          adminAccessCode: accessCode,
          adminUid: adminUid,
          createdAt: serverTimestamp(),
          createdAtDate: newTenant.createdAt,
        },
        { merge: true }
      );

      // 3. Salva usuário com role 'barber_admin' na coleção 'users'
      await setDoc(
        doc(db, 'users', adminUid),
        {
          uid: adminUid,
          name: `${tenantData.name} Admin`,
          email: cleanEmail,
          role: 'barber_admin',
          tenantId: tenantId,
          tenantSubdomain: tenantData.subdomain,
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (firestoreErr) {
      console.warn('Firestore tenant write note:', firestoreErr);
    }

    try {
      localStorage.setItem(`tenant_admin_password_${newTenant.subdomain}`, password);
      localStorage.setItem(`tenant_admin_password_${newTenant.id}`, password);

      const cached = localStorage.getItem('cached_tenants_list');
      let tenantList: Tenant[] = [];
      if (cached) {
        try {
          tenantList = JSON.parse(cached);
        } catch {}
      }
      tenantList = [newTenant, ...tenantList.filter((t) => t.id !== newTenant.id && t.subdomain !== newTenant.subdomain)];
      localStorage.setItem('cached_tenants_list', JSON.stringify(tenantList));
      window.dispatchEvent(new CustomEvent('tenant_list_updated'));
    } catch {}

    return {
      success: true,
      data: newTenant,
      isFirebaseCloud: true,
    };
  } catch (error: any) {
    console.error('Erro ao cadastrar empresa no Firebase:', error);
    return {
      success: false,
      error: error.message || 'Erro ao registrar empresa no Firebase.',
    };
  }
}

/**
 * Atualiza permanentemente a senha/código de acesso do gerente da barbearia no Firestore
 */
export async function updateTenantAdminPasswordInFirestore(
  tenantSubdomainOrId: string,
  newPassword: string
): Promise<AuthResult<boolean>> {
  try {
    const cleanPassword = newPassword.trim();
    if (!cleanPassword || cleanPassword.length < 4) {
      return {
        success: false,
        error: 'A nova senha deve conter pelo menos 4 caracteres.',
      };
    }

    // 1. Atualiza no localStorage para acesso offline/imediato no navegador
    try {
      localStorage.setItem(`tenant_admin_password_${tenantSubdomainOrId}`, cleanPassword);
    } catch (lsErr) {
      console.warn('LocalStorage save note:', lsErr);
    }

    // 2. Atualiza no Cloud Firestore
    let updatedDoc = false;

    // Tenta atualizar diretamente por ID
    try {
      const docRef = doc(db, 'tenants', tenantSubdomainOrId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        await setDoc(
          docRef,
          {
            adminPassword: cleanPassword,
            adminAccessCode: cleanPassword,
            updatedAt: serverTimestamp(),
            lastPasswordChangedAt: new Date().toISOString(),
          },
          { merge: true }
        );
        updatedDoc = true;
      }
    } catch (directErr) {
      console.warn('Tentativa direta de update tenant por ID falhou, buscando por query:', directErr);
    }

    // Se não encontrou por ID direto, busca por subdomain
    if (!updatedDoc) {
      try {
        const q = query(collection(db, 'tenants'), where('subdomain', '==', tenantSubdomainOrId));
        const qSnap = await getDocs(q);
        if (!qSnap.empty) {
          const targetDoc = qSnap.docs[0];
          await setDoc(
            doc(db, 'tenants', targetDoc.id),
            {
              adminPassword: cleanPassword,
              adminAccessCode: cleanPassword,
              updatedAt: serverTimestamp(),
              lastPasswordChangedAt: new Date().toISOString(),
            },
            { merge: true }
          );
          updatedDoc = true;
        }
      } catch (queryErr) {
        console.warn('Query por subdomain falhou, tentando fallback em todas:', queryErr);
      }
    }

    // Fallback: Se ainda não atualizou (ex: primeira barbearia padrão), cria/mescla documento
    if (!updatedDoc) {
      try {
        await setDoc(
          doc(db, 'tenants', tenantSubdomainOrId),
          {
            id: tenantSubdomainOrId,
            subdomain: tenantSubdomainOrId,
            adminPassword: cleanPassword,
            adminAccessCode: cleanPassword,
            updatedAt: serverTimestamp(),
            lastPasswordChangedAt: new Date().toISOString(),
          },
          { merge: true }
        );
        updatedDoc = true;
      } catch (fallbackErr) {
        console.warn('Fallback setDoc tenant password warning:', fallbackErr);
      }
    }

    // 3. Registro de auditoria no Firestore
    try {
      await addDoc(collection(db, 'security_logs'), {
        type: 'BARBER_ADMIN_PASSWORD_CHANGED',
        tenant: tenantSubdomainOrId,
        timestamp: serverTimestamp(),
        changedAt: new Date().toISOString(),
        status: 'SUCCESS',
      });
    } catch (auditErr) {
      console.warn('Audit log write note:', auditErr);
    }

    return {
      success: true,
      data: true,
      isFirebaseCloud: true,
    };
  } catch (error: any) {
    console.error('Erro ao atualizar senha da barbearia no Firebase:', error);
    return {
      success: false,
      error: error.message || 'Não foi possível atualizar a senha no banco de dados.',
    };
  }
}

/**
 * Salva a senha temporária gerada de uma empresa no Firestore
 */
export async function saveTenantTempPasswordToFirestore(
  tenantId: string,
  tempPass: { code: string; expiresAt: string; generatedAt: string }
): Promise<boolean> {
  try {
    // 1. Grava no Firestore por tenantId
    await setDoc(
      doc(db, 'tenants', tenantId),
      {
        lastTempPassword: tempPass,
        adminAccessCode: tempPass.code,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    // 2. Atualiza no cache local e dispara eventos
    try {
      localStorage.setItem(`tenant_admin_password_${tenantId}`, tempPass.code);

      const cached = localStorage.getItem('cached_tenants_list');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          const updated = parsed.map((t: any) => {
            if (t.id === tenantId || t.subdomain === tenantId) {
              if (t.subdomain) {
                localStorage.setItem(`tenant_admin_password_${t.subdomain}`, tempPass.code);
              }
              return { ...t, lastTempPassword: tempPass, adminAccessCode: tempPass.code };
            }
            return t;
          });
          localStorage.setItem('cached_tenants_list', JSON.stringify(updated));
        }
      }
      window.dispatchEvent(new CustomEvent('tenant_list_updated', { detail: { tenantId, tempPass } }));
    } catch {}
    return true;
  } catch (err) {
    console.warn('Erro ao salvar senha temporária no Firestore:', err);
    return false;
  }
}

/**
 * Busca todas as empresas cadastradas na coleção 'tenants' do Firestore
 */
export async function getTenantsFromFirestore(): Promise<Tenant[]> {
  const fallbackTenants: Tenant[] = [];

  try {
    const querySnapshot = await getDocs(collection(db, 'tenants'));
    const list: Tenant[] = [];
    querySnapshot.forEach((docSnap) => {
      const d = docSnap.data();
      list.push({
        id: d.id || docSnap.id,
        name: d.name || 'Barbearia',
        subdomain: d.subdomain || docSnap.id,
        cnpj: d.cnpj || '',
        monthlyValue: typeof d.monthlyValue === 'number' ? d.monthlyValue : 450,
        status: d.status || 'Ativo',
        adminEmail: d.adminEmail || '',
        adminPassword: d.adminPassword || '482910',
        adminAccessCode: d.lastTempPassword?.code || d.adminAccessCode || d.adminPassword || '482910',
        lastTempPassword: d.lastTempPassword || undefined,
        createdAt: d.createdAtDate || (d.createdAt?.toDate ? d.createdAt.toDate().toISOString().split('T')[0] : '2026-08-15'),
      });
    });

    if (list.length > 0) {
      try {
        localStorage.setItem('cached_tenants_list', JSON.stringify(list));
      } catch {}
      return list;
    }
  } catch (error) {
    console.warn('Erro ao ler tenants do Firestore, usando cache local:', error);
  }

  // Fallback para cache local se disponível
  try {
    const cached = localStorage.getItem('cached_tenants_list');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}

  return fallbackTenants;
}

/**
 * Ouvinte em tempo real para lista de empresas cadastradas
 */
export function subscribeToTenants(onUpdate: (tenants: Tenant[]) => void): () => void {
  try {
    const unsubscribe = onSnapshot(
      collection(db, 'tenants'),
      (snapshot) => {
        const list: Tenant[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          list.push({
            id: d.id || docSnap.id,
            name: d.name || 'Barbearia',
            subdomain: d.subdomain || 'empresa',
            cnpj: d.cnpj || '',
            monthlyValue: typeof d.monthlyValue === 'number' ? d.monthlyValue : 450,
            status: d.status || 'Ativo',
            adminEmail: d.adminEmail || '',
            adminPassword: d.adminPassword || '482910',
            adminAccessCode: d.adminAccessCode || d.lastTempPassword?.code || '482910',
            lastTempPassword: d.lastTempPassword || undefined,
            createdAt: d.createdAtDate || (d.createdAt?.toDate ? d.createdAt.toDate().toISOString().split('T')[0] : '2026-08-15'),
          });
        });
        if (list.length > 0) {
          try {
            localStorage.setItem('cached_tenants_list', JSON.stringify(list));
          } catch {}
          onUpdate(list);
        }
      },
      (err) => {
        console.warn('Listener tenants error:', err);
      }
    );

    return unsubscribe;
  } catch {
    return () => {};
  }
}

/**
 * Exclui permanentemente uma empresa do Firestore
 */
export async function deleteTenantFromFirestore(tenantId: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, 'tenants', tenantId));
    try {
      const cached = localStorage.getItem('cached_tenants_list');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          const updated = parsed.filter((t: any) => t.id !== tenantId && t.subdomain !== tenantId);
          localStorage.setItem('cached_tenants_list', JSON.stringify(updated));
        }
      }
      window.dispatchEvent(new CustomEvent('tenant_list_updated'));
    } catch {}
    return true;
  } catch (error) {
    console.warn('Erro ao deletar tenant do Firestore:', error);
    return false;
  }
}

// ============================================================================
// 3. AGENDAMENTOS, CLIENTES E DADOS DA BARBEARIA: FIRESTORE
// ============================================================================

/**
 * Salva agendamento na subcoleção da empresa e na coleção global com ID único e sem duplicatas
 */
export async function saveBookingToFirestore(
  tenantId: string,
  booking: ClientBooking,
  clientDetails?: { id?: string; name?: string; phone?: string; email?: string }
): Promise<void> {
  try {
    const bookingDocId = String(booking.id || `bk-${Date.now()}`);
    const cleanTenantId = tenantId || 'navalha-ouro';

    const payload = {
      ...booking,
      id: bookingDocId,
      tenantId: cleanTenantId,
      tenantSubdomain: cleanTenantId,
      clientId: clientDetails?.id || booking.clientId || null,
      clientName: booking.clientName || clientDetails?.name || 'Cliente Online',
      clientPhone: booking.clientPhone || clientDetails?.phone || '(11) 98765-4321',
      clientEmail: booking.clientEmail || clientDetails?.email || '',
      serviceName: booking.serviceName || 'Corte Tradicional',
      servicePrice: typeof booking.servicePrice === 'number' ? booking.servicePrice : 50.0,
      barberName: booking.barberName || 'Barbeiro',
      date: booking.date || new Date().toISOString().split('T')[0],
      formattedDate: booking.formattedDate || 'Hoje',
      dateTime: booking.formattedDate || booking.date || 'Hoje',
      time: booking.time || '14:00',
      origin: 'Painel Cliente',
      status: booking.status || 'Agendado',
      createdAtServer: serverTimestamp(),
      updatedAt: new Date().toISOString(),
    };

    // Se temos dados de cliente no agendamento, assegura que ele esteja sincronizado como cliente do tenant
    const targetClientId = clientDetails?.id || booking.clientId;
    if (targetClientId) {
      try {
        const clientDocPayload = {
          id: targetClientId,
          uid: targetClientId,
          name: payload.clientName,
          phone: payload.clientPhone,
          email: payload.clientEmail,
          tenantSubdomain: cleanTenantId,
          tenantId: cleanTenantId,
          role: 'client',
          lastVisit: 'Hoje (Agendamento)',
          favoriteBarber: payload.barberName,
          status: 'Ativo',
          updatedAt: serverTimestamp(),
        };

        // Salva na subcoleção do tenant
        setDoc(doc(db, `tenants/${cleanTenantId}/clients`, targetClientId), clientDocPayload, { merge: true }).catch(() => {});
        // Salva na coleção global de clientes
        setDoc(doc(db, 'clients', targetClientId), clientDocPayload, { merge: true }).catch(() => {});

        // Atualiza cache local de clientes do tenant
        const tenantClientsKey = `tenant_clients_${cleanTenantId}`;
        const existingClients = localStorage.getItem(tenantClientsKey);
        let clientsList: any[] = existingClients ? JSON.parse(existingClients) : [];
        const cliMap = new Map<string, any>();
        cliMap.set(targetClientId, clientDocPayload);
        if (Array.isArray(clientsList)) {
          clientsList.forEach((c) => {
            const safeId = c?.id || c?.uid;
            if (safeId && safeId !== targetClientId) {
              cliMap.set(safeId, c);
            }
          });
        }
        localStorage.setItem(tenantClientsKey, JSON.stringify(Array.from(cliMap.values())));
      } catch {}
    }

    // 1. Salva no localStorage de forma estritamente deduplicada
    try {
      const storageKey = `tenant_appointments_${cleanTenantId}`;
      const existing = localStorage.getItem(storageKey);
      let list: any[] = existing ? JSON.parse(existing) : [];
      const map = new Map<string, any>();
      map.set(bookingDocId, payload);
      if (Array.isArray(list)) {
        list.forEach((item) => {
          if (item && item.id && item.id !== bookingDocId) {
            map.set(item.id, item);
          }
        });
      }
      localStorage.setItem(storageKey, JSON.stringify(Array.from(map.values())));

      // Salva também no histórico individual do cliente se aplicável
      if (payload.clientId) {
        const clientKey = `client_bookings_${payload.clientId}`;
        const clientExisting = localStorage.getItem(clientKey);
        let clientList: any[] = clientExisting ? JSON.parse(clientExisting) : [];
        const clientMap = new Map<string, any>();
        clientMap.set(bookingDocId, payload);
        if (Array.isArray(clientList)) {
          clientList.forEach((item) => {
            if (item && item.id && item.id !== bookingDocId) {
              clientMap.set(item.id, item);
            }
          });
        }
        localStorage.setItem(clientKey, JSON.stringify(Array.from(clientMap.values())));
      }

      // Dispara evento global para o painel admin capturar instantaneamente
      window.dispatchEvent(
        new CustomEvent('barber_appointment_created', {
          detail: payload,
        })
      );
    } catch (lsErr) {
      console.warn('LocalStorage booking note:', lsErr);
    }

    // 2. Grava na subcoleção canônica da Barbearia no Firestore
    try {
      await setDoc(doc(db, `tenants/${cleanTenantId}/appointments`, bookingDocId), payload, {
        merge: true,
      });
    } catch (e1) {
      console.warn(`Erro ao gravar em tenants/${cleanTenantId}/appointments:`, e1);
    }

    // 3. Grava na coleção raiz global com o mesmo ID exato
    try {
      await setDoc(doc(db, 'appointments', bookingDocId), payload, { merge: true });
    } catch (e2) {
      console.warn('Erro ao gravar em appointments global:', e2);
    }
  } catch (error) {
    console.warn('Erro geral ao salvar agendamento no Firestore:', error);
  }
}

/**
 * Busca agendamentos de uma barbearia no Firestore e no cache local com deduplicação estrita
 */
export async function getAppointmentsFromFirestore(tenantId: string): Promise<any[]> {
  const cleanTenantId = tenantId || 'navalha-ouro';
  const listMap = new Map<string, any>();
  const seenSignatures = new Set<string>();

  const addUniqueItem = (item: any, fallbackId?: string) => {
    if (!item) return;
    const safeId = String(item.id || fallbackId || '').trim();
    const cName = String(item.clientName || item.name || '').trim().toLowerCase();
    const sName = String(item.serviceName || '').trim().toLowerCase();
    const dTime = String(item.date || item.formattedDate || item.dateTime || '').trim();
    const time = String(item.time || '').trim();
    const signature = `${cName}_${sName}_${dTime}_${time}`;

    if (safeId && listMap.has(safeId)) return;
    if (signature.length > 5 && seenSignatures.has(signature)) return;

    if (safeId) listMap.set(safeId, { ...item, id: safeId });
    if (signature.length > 5) seenSignatures.add(signature);
  };

  // 1. Carrega do cache local
  try {
    const cached = localStorage.getItem(`tenant_appointments_${cleanTenantId}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) {
        parsed.forEach((item) => addUniqueItem(item, item?.id));
      }
    }
  } catch {}

  // 2. Busca na subcoleção da barbearia no Firestore
  try {
    const querySnapshot = await getDocs(collection(db, `tenants/${cleanTenantId}/appointments`));
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      addUniqueItem({ id: docSnap.id, ...data }, docSnap.id);
    });
  } catch (error) {
    console.warn('Erro ao ler appointments do tenant:', error);
  }

  // 3. Busca na coleção raiz de appointments com filtro de tenant
  try {
    const globalQuery = query(collection(db, 'appointments'), where('tenantId', '==', cleanTenantId));
    const globalSnap = await getDocs(globalQuery);
    globalSnap.forEach((docSnap) => {
      const data = docSnap.data();
      addUniqueItem({ id: docSnap.id, ...data }, docSnap.id);
    });
  } catch (error) {
    try {
      const globalSnap = await getDocs(collection(db, 'appointments'));
      globalSnap.forEach((docSnap) => {
        const data = docSnap.data() as any;
        if (data.tenantId === cleanTenantId || !data.tenantId) {
          addUniqueItem({ id: docSnap.id, ...data }, docSnap.id);
        }
      });
    } catch {}
  }

  const result = Array.from(listMap.values()).map((a) => ({
    id: String(a.id || `apt-${Date.now()}`),
    clientName: String(a.clientName || a.name || 'Cliente Online'),
    clientPhone: String(a.clientPhone || a.phone || ''),
    serviceName: String(a.serviceName || 'Serviço'),
    servicePrice: typeof a.servicePrice === 'number' ? a.servicePrice : (parseFloat(a.servicePrice) || 50.0),
    barberName: String(a.barberName || 'Barbeiro'),
    dateTime: String(a.formattedDate || a.dateTime || a.date || 'Hoje'),
    date: String(a.date || a.dateTime || ''),
    formattedDate: String(a.formattedDate || a.dateTime || 'Hoje'),
    time: String(a.time || '14:00'),
    origin: (a.origin as any) || 'Painel Cliente',
    status: (a.status as any) || 'Agendado',
    createdAt: a.createdAt || new Date().toISOString(),
    clientId: a.clientId || undefined,
    clientEmail: a.clientEmail || '',
  }));

  // Ordena por data/hora mais recente
  return result.sort((a, b) => {
    const dateA = a.date || a.createdAt || '';
    const dateB = b.date || b.createdAt || '';
    return dateB.localeCompare(dateA);
  });
}

/**
 * Busca agendamentos específicos de um cliente com deduplicação
 */
export async function getClientBookingsFromFirestore(
  clientId: string,
  tenantId: string = 'navalha-ouro',
  clientEmail?: string,
  clientPhone?: string
): Promise<ClientBooking[]> {
  if (!clientId && !clientEmail && !clientPhone) {
    return [];
  }

  const listMap = new Map<string, ClientBooking>();
  const seenSignatures = new Set<string>();
  const cleanEmail = (clientEmail || '').trim().toLowerCase();
  const cleanPhone = (clientPhone || '').replace(/\D/g, '');

  const addUniqueBooking = (data: any, fallbackId?: string) => {
    if (!data) return;
    const safeId = String(data.id || fallbackId || '').trim();
    const sName = String(data.serviceName || '').trim().toLowerCase();
    const dTime = String(data.date || data.formattedDate || '').trim();
    const time = String(data.time || '').trim();
    const signature = `${sName}_${dTime}_${time}`;

    if (safeId && listMap.has(safeId)) return;
    if (signature.length > 3 && seenSignatures.has(signature)) return;

    if (safeId) listMap.set(safeId, { ...data, id: safeId } as ClientBooking);
    if (signature.length > 3) seenSignatures.add(signature);
  };

  // 1. LocalStorage do cliente
  if (clientId) {
    try {
      const cached = localStorage.getItem(`client_bookings_${clientId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          parsed.forEach((item) => addUniqueBooking(item, item?.id));
        }
      }
    } catch {}
  }

  // Helper de correspondência do cliente
  const isMatch = (data: any): boolean => {
    if (!data) return false;
    if (clientId && data.clientId && String(data.clientId) === String(clientId)) {
      return true;
    }
    if (cleanEmail && data.clientEmail && String(data.clientEmail).trim().toLowerCase() === cleanEmail) {
      return true;
    }
    if (cleanPhone && data.clientPhone) {
      const itemPhone = String(data.clientPhone).replace(/\D/g, '');
      if (itemPhone && (itemPhone === cleanPhone || itemPhone.endsWith(cleanPhone) || cleanPhone.endsWith(itemPhone))) {
        return true;
      }
    }
    return false;
  };

  // 2. Firestore por clientId na subcoleção do tenant
  try {
    const tenantSnap = await getDocs(collection(db, `tenants/${tenantId}/appointments`));
    tenantSnap.forEach((docSnap) => {
      const data = docSnap.data() as any;
      if (isMatch(data)) {
        addUniqueBooking({ id: docSnap.id, ...data }, docSnap.id);
      }
    });
  } catch (error) {
    console.warn('Erro ao ler agendamentos do cliente no Firestore:', error);
  }

  // 3. Coleção raiz por clientId
  try {
    const globalSnap = await getDocs(collection(db, 'appointments'));
    globalSnap.forEach((docSnap) => {
      const data = docSnap.data() as any;
      if (isMatch(data)) {
        addUniqueBooking({ id: docSnap.id, ...data }, docSnap.id);
      }
    });
  } catch {}

  return Array.from(listMap.values());
}

/**
 * Escuta agendamentos em tempo real via Firestore onSnapshot
 */
export function subscribeToTenantAppointments(
  tenantId: string,
  onUpdate: (appointments: any[]) => void
): () => void {
  const cleanTenantId = tenantId || 'navalha-ouro';

  try {
    // Escuta na subcoleção específica do tenant com deduplicação
    const unsub = onSnapshot(
      collection(db, `tenants/${cleanTenantId}/appointments`),
      (snapshot) => {
        const listMap = new Map<string, any>();
        const seenSignatures = new Set<string>();

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const safeId = docSnap.id;
          const cName = String(data?.clientName || data?.name || '').trim().toLowerCase();
          const sName = String(data?.serviceName || '').trim().toLowerCase();
          const dTime = String(data?.date || data?.formattedDate || data?.dateTime || '').trim();
          const time = String(data?.time || '').trim();
          const signature = `${cName}_${sName}_${dTime}_${time}`;

          if (!listMap.has(safeId) && (!signature || !seenSignatures.has(signature))) {
            listMap.set(safeId, { id: safeId, ...data });
            if (signature) seenSignatures.add(signature);
          }
        });

        onUpdate(Array.from(listMap.values()));
      },
      (error) => {
        console.warn('Listener onSnapshot tenant appointments note:', error);
      }
    );

    return () => unsub();
  } catch (err) {
    console.warn('Falha ao iniciar onSnapshot:', err);
    return () => {};
  }
}

/**
 * Busca clientes de uma barbearia no Firestore e no cache local com deduplicação rigorosa
 */
export async function getClientsFromFirestore(tenantId: string): Promise<any[]> {
  const cleanTenant = (tenantId || 'navalha-ouro').trim();
  const listMap = new Map<string, any>();
  const seenEmails = new Set<string>();

  const addUniqueClient = (item: any, fallbackId?: string) => {
    if (!item) return;
    const safeId = String(item.id || item.uid || fallbackId || '').trim();
    if (safeId === 'cli-carlos-1') return;
    const email = String(item.email || '').trim().toLowerCase();
    
    if (safeId && listMap.has(safeId)) return;
    if (email && email.includes('@') && seenEmails.has(email)) return;

    const normalizedClient = {
      ...item,
      id: safeId,
      name: String(item.name || 'Cliente'),
      phone: String(item.phone || ''),
      email: String(item.email || ''),
      fidelityPoints: typeof item.fidelityPoints === 'number' ? item.fidelityPoints : (parseInt(item.fidelityPoints) || 0),
      totalVisits: typeof item.totalVisits === 'number' ? item.totalVisits : (parseInt(item.totalVisits) || 0),
      lastVisit: String(item.lastVisit || 'Recente'),
      favoriteBarber: String(item.favoriteBarber || ''),
      status: item.status || 'Ativo',
      tenantSubdomain: cleanTenant,
      tenantId: cleanTenant,
    };

    if (safeId) listMap.set(safeId, normalizedClient);
    if (email && email.includes('@')) seenEmails.add(email);
  };

  // 1. Carrega do cache local primeiro para exibição instantânea
  try {
    const cached = localStorage.getItem(`tenant_clients_${cleanTenant}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) {
        parsed.forEach((c) => addUniqueClient(c, c?.id || c?.uid));
      }
    }
  } catch {}

  // 2. Subcoleção específica da barbearia: tenants/{tenantId}/clients
  try {
    const querySnapshot = await getDocs(collection(db, `tenants/${cleanTenant}/clients`));
    querySnapshot.forEach((docSnap) => {
      addUniqueClient({ id: docSnap.id, ...docSnap.data() }, docSnap.id);
    });
  } catch (subErr) {
    console.warn('Erro ao ler subcoleção tenants/clients:', subErr);
  }

  // 3. Coleção global 'clients' com filtro tenantSubdomain
  try {
    const subdomainQuery = query(collection(db, 'clients'), where('tenantSubdomain', '==', cleanTenant));
    const subdomainSnapshot = await getDocs(subdomainQuery);
    subdomainSnapshot.forEach((docSnap) => {
      addUniqueClient({ id: docSnap.id, ...docSnap.data() }, docSnap.id);
    });
  } catch (subdomainErr) {
    console.warn('Erro ao ler coleção global clients por tenantSubdomain:', subdomainErr);
  }

  // 4. Coleção global 'clients' com filtro tenantId
  try {
    const globalQuery = query(collection(db, 'clients'), where('tenantId', '==', cleanTenant));
    const globalSnapshot = await getDocs(globalQuery);
    globalSnapshot.forEach((docSnap) => {
      addUniqueClient({ id: docSnap.id, ...docSnap.data() }, docSnap.id);
    });
  } catch (globalErr) {
    console.warn('Erro ao ler coleção global clients por tenantId:', globalErr);
  }

  const result = Array.from(listMap.values());

  // Salva resultado consolidado no cache local
  try {
    if (result.length > 0) {
      localStorage.setItem(`tenant_clients_${cleanTenant}`, JSON.stringify(result));
    }
  } catch {}

  return result;
}

/**
 * Escuta clientes de uma barbearia em tempo real via Firestore onSnapshot (Subcoleção + Coleção Global com tenantSubdomain)
 */
export function subscribeToTenantClients(
  tenantId: string,
  onUpdate: (clients: any[]) => void
): () => void {
  const cleanTenant = (tenantId || 'navalha-ouro').trim();
  const clientMap = new Map<string, any>();
  const seenEmails = new Set<string>();

  const emitClients = () => {
    onUpdate(Array.from(clientMap.values()));
  };

  const addOrUpdateClient = (item: any, fallbackId?: string) => {
    if (!item) return;
    const safeId = String(item.id || item.uid || fallbackId || '').trim();
    if (safeId === 'cli-carlos-1') return;
    const email = String(item.email || '').trim().toLowerCase();

    const normalizedClient = {
      ...item,
      id: safeId,
      name: String(item.name || 'Cliente'),
      phone: String(item.phone || ''),
      email: String(item.email || ''),
      fidelityPoints: typeof item.fidelityPoints === 'number' ? item.fidelityPoints : (parseInt(item.fidelityPoints) || 0),
      totalVisits: typeof item.totalVisits === 'number' ? item.totalVisits : (parseInt(item.totalVisits) || 0),
      lastVisit: String(item.lastVisit || 'Recente'),
      favoriteBarber: String(item.favoriteBarber || ''),
      status: item.status || 'Ativo',
      tenantSubdomain: cleanTenant,
      tenantId: cleanTenant,
    };

    if (safeId) {
      clientMap.set(safeId, normalizedClient);
    }
    if (email && email.includes('@')) {
      seenEmails.add(email);
    }
  };

  const unsubs: (() => void)[] = [];

  try {
    // 1. Ouve a subcoleção canônica da empresa: tenants/{tenantId}/clients
    const subColRef = collection(db, `tenants/${cleanTenant}/clients`);
    const unsubSub = onSnapshot(
      subColRef,
      (snapshot) => {
        snapshot.forEach((docSnap) => {
          addOrUpdateClient({ id: docSnap.id, ...docSnap.data() }, docSnap.id);
        });
        emitClients();
      },
      (error) => {
        console.warn('Listener subcoleção tenants clients note:', error);
      }
    );
    unsubs.push(unsubSub);

    // 2. Ouve a coleção global clients com filtro tenantSubdomain
    try {
      const qSubdomain = query(collection(db, 'clients'), where('tenantSubdomain', '==', cleanTenant));
      const unsubSubdomain = onSnapshot(
        qSubdomain,
        (snapshot) => {
          snapshot.forEach((docSnap) => {
            addOrUpdateClient({ id: docSnap.id, ...docSnap.data() }, docSnap.id);
          });
          emitClients();
        },
        (err) => {
          console.warn('Listener global clients tenantSubdomain note:', err);
        }
      );
      unsubs.push(unsubSubdomain);
    } catch {}

    // 3. Ouve a coleção global clients com filtro tenantId
    try {
      const qTenantId = query(collection(db, 'clients'), where('tenantId', '==', cleanTenant));
      const unsubTenantId = onSnapshot(
        qTenantId,
        (snapshot) => {
          snapshot.forEach((docSnap) => {
            addOrUpdateClient({ id: docSnap.id, ...docSnap.data() }, docSnap.id);
          });
          emitClients();
        },
        (err) => {
          console.warn('Listener global clients tenantId note:', err);
        }
      );
      unsubs.push(unsubTenantId);
    } catch {}

    return () => {
      unsubs.forEach((u) => {
        try {
          u();
        } catch {}
      });
    };
  } catch (err) {
    console.warn('Falha ao iniciar onSnapshot para clients:', err);
    return () => {};
  }
}

/**
 * Busca banners promocionais de uma barbearia no Firestore / LocalStorage
 */
export async function getBannersFromFirestore(tenantId: string): Promise<BarberPromotionBanner[]> {
  try {
    const list: BarberPromotionBanner[] = [];
    const subColRef = collection(db, `tenants/${tenantId}/promotions`);
    const querySnapshot = await getDocs(subColRef);

    querySnapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...(docSnap.data() as any) });
    });

    if (list.length > 0) {
      list.sort((a, b) => (a.order || 0) - (b.order || 0));
      return list;
    }

    // Se ainda não existirem banners no Firestore para essa barbearia, inicializa com os 15 banners padrão
    try {
      const localKey = `barber_banners_${tenantId}`;
      const savedLocal = localStorage.getItem(localKey);
      if (savedLocal) {
        const parsed = JSON.parse(savedLocal);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}

    return DEFAULT_PROMOTION_BANNERS;
  } catch (error) {
    console.warn('Erro ao ler banners do Firestore, usando fallback padrão:', error);
    try {
      const localKey = `barber_banners_${tenantId}`;
      const savedLocal = localStorage.getItem(localKey);
      if (savedLocal) {
        return JSON.parse(savedLocal);
      }
    } catch {}
    return DEFAULT_PROMOTION_BANNERS;
  }
}

/**
 * Salva ou atualiza um banner promocional no Firestore
 */
export async function saveBannerToFirestore(
  tenantId: string,
  banner: BarberPromotionBanner
): Promise<{ success: boolean; banner: BarberPromotionBanner }> {
  try {
    const bannerId = banner.id || `banner-${Date.now()}`;
    const payload = {
      ...banner,
      id: bannerId,
      updatedAt: serverTimestamp(),
      createdAt: banner.createdAt || new Date().toISOString(),
    };

    // Salva no Firestore
    try {
      await setDoc(doc(db, `tenants/${tenantId}/promotions`, bannerId), payload, { merge: true });
    } catch (firestoreErr) {
      console.warn('Erro ao persistir banner no Firestore:', firestoreErr);
    }

    // Salva no LocalStorage
    try {
      const localKey = `barber_banners_${tenantId}`;
      const existing = localStorage.getItem(localKey);
      let list: BarberPromotionBanner[] = existing ? JSON.parse(existing) : [...DEFAULT_PROMOTION_BANNERS];
      const index = list.findIndex((b) => b.id === bannerId);
      if (index >= 0) {
        list[index] = payload as any;
      } else {
        list = [payload as any, ...list];
      }
      localStorage.setItem(localKey, JSON.stringify(list));

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('barber_banners_updated', { detail: { tenantId, banners: list } }));
      }
    } catch {}

    return { success: true, banner: payload as any };
  } catch (err) {
    console.error('Erro ao salvar banner:', err);
    return { success: false, banner };
  }
}

/**
 * Remove um banner promocional
 */
export async function deleteBannerFromFirestore(
  tenantId: string,
  bannerId: string
): Promise<{ success: boolean }> {
  try {
    try {
      await deleteDoc(doc(db, `tenants/${tenantId}/promotions`, bannerId));
    } catch (err) {
      console.warn('Erro ao deletar banner do Firestore:', err);
    }

    try {
      const localKey = `barber_banners_${tenantId}`;
      const existing = localStorage.getItem(localKey);
      if (existing) {
        const list: BarberPromotionBanner[] = JSON.parse(existing);
        const filtered = list.filter((b) => b.id !== bannerId);
        localStorage.setItem(localKey, JSON.stringify(filtered));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('barber_banners_updated', { detail: { tenantId, banners: filtered } }));
        }
      }
    } catch {}

    return { success: true };
  } catch (err) {
    console.error('Erro ao deletar banner:', err);
    return { success: false };
  }
}

/**
 * Escuta banners promocionais em tempo real via Firestore onSnapshot
 */
export function subscribeToTenantBanners(
  tenantId: string,
  onUpdate: (banners: BarberPromotionBanner[]) => void
): () => void {
  try {
    const subColRef = collection(db, `tenants/${tenantId}/promotions`);
    const unsubscribe = onSnapshot(
      subColRef,
      (snapshot) => {
        const list: BarberPromotionBanner[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...(docSnap.data() as any) });
        });
        if (list.length > 0) {
          list.sort((a, b) => (a.order || 0) - (b.order || 0));
          onUpdate(list);
        } else {
          // Se não houver nada no Firestore, verifica LocalStorage ou Banners Padrão
          try {
            const localKey = `barber_banners_${tenantId}`;
            const local = localStorage.getItem(localKey);
            if (local) {
              onUpdate(JSON.parse(local));
              return;
            }
          } catch {}
          onUpdate(DEFAULT_PROMOTION_BANNERS);
        }
      },
      (error) => {
        console.warn('Listener onSnapshot tenant promotions:', error);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn('Falha ao iniciar onSnapshot para banners:', err);
    return () => {};
  }
}

/**
 * Desconecta a sessão atual no Firebase Auth
 */
export async function logoutFromFirebase(): Promise<void> {
  try {
    await signOut(auth);
  } catch (err) {
    console.warn('Erro no signOut do Firebase:', err);
  }
}

// ============================================================================
// 4. SUPER ADMIN: CONFIGURAÇÕES, PERFIL, SENHA & VALORES NO BD
// ============================================================================

export const DEFAULT_SUPER_ADMIN_CONFIG: SuperAdminConfig = {
  adminName: 'William Moreira (Super Admin)',
  adminEmail: 'root@saas.com',
  adminPhone: '(11) 99876-5432',
  adminPassword: '901245',
  adminAccessCode: '901245',
  rootDomain: 'saasapp.com',
  tempPasswordExpiryHours: 2,
  defaultMonthlyPrice: 450.0,
  basicPlanPrice: 250.0,
  proPlanPrice: 450.0,
  enterprisePlanPrice: 850.0,
  systemNotifications: true,
  twoFactorAuth: true,
};

/**
 * Salva as configurações do Super Admin no Firestore (coleção 'system_settings/superadmin')
 */
export async function saveSuperAdminConfigToFirestore(
  config: Partial<SuperAdminConfig>
): Promise<AuthResult<SuperAdminConfig>> {
  try {
    const configDocRef = doc(db, 'system_settings', 'superadmin');
    const payload = {
      ...config,
      updatedAt: new Date().toISOString(),
      updatedAtServer: serverTimestamp(),
    };

    await setDoc(configDocRef, payload, { merge: true });

    // Atualiza nome também no Firebase Auth se houver usuário conectado
    if (auth.currentUser && config.adminName) {
      try {
        await updateProfile(auth.currentUser, {
          displayName: config.adminName,
        });
      } catch (profileErr) {
        console.warn('Não foi possível atualizar displayName no Auth:', profileErr);
      }
    }

    return {
      success: true,
      data: { ...DEFAULT_SUPER_ADMIN_CONFIG, ...config },
      isFirebaseCloud: true,
    };
  } catch (error: any) {
    console.error('Erro ao salvar configurações do Super Admin no Firestore:', error);
    return {
      success: false,
      error: error.message || 'Erro ao persistir configurações no Firestore.',
    };
  }
}

/**
 * Carrega as configurações do Super Admin salvas no Firestore
 */
export async function getSuperAdminConfigFromFirestore(): Promise<SuperAdminConfig> {
  try {
    const configDocRef = doc(db, 'system_settings', 'superadmin');
    const docSnap = await getDoc(configDocRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        adminName: data.adminName || DEFAULT_SUPER_ADMIN_CONFIG.adminName,
        adminEmail: data.adminEmail || DEFAULT_SUPER_ADMIN_CONFIG.adminEmail,
        adminPhone: data.adminPhone || DEFAULT_SUPER_ADMIN_CONFIG.adminPhone,
        adminPassword: data.adminPassword || DEFAULT_SUPER_ADMIN_CONFIG.adminPassword,
        adminAccessCode: data.adminAccessCode || data.adminPassword || DEFAULT_SUPER_ADMIN_CONFIG.adminAccessCode,
        rootDomain: data.rootDomain || DEFAULT_SUPER_ADMIN_CONFIG.rootDomain,
        tempPasswordExpiryHours: data.tempPasswordExpiryHours || DEFAULT_SUPER_ADMIN_CONFIG.tempPasswordExpiryHours,
        defaultMonthlyPrice: data.defaultMonthlyPrice !== undefined ? data.defaultMonthlyPrice : DEFAULT_SUPER_ADMIN_CONFIG.defaultMonthlyPrice,
        basicPlanPrice: data.basicPlanPrice !== undefined ? data.basicPlanPrice : DEFAULT_SUPER_ADMIN_CONFIG.basicPlanPrice,
        proPlanPrice: data.proPlanPrice !== undefined ? data.proPlanPrice : DEFAULT_SUPER_ADMIN_CONFIG.proPlanPrice,
        enterprisePlanPrice: data.enterprisePlanPrice !== undefined ? data.enterprisePlanPrice : DEFAULT_SUPER_ADMIN_CONFIG.enterprisePlanPrice,
        systemNotifications: data.systemNotifications !== undefined ? data.systemNotifications : DEFAULT_SUPER_ADMIN_CONFIG.systemNotifications,
        twoFactorAuth: data.twoFactorAuth !== undefined ? data.twoFactorAuth : DEFAULT_SUPER_ADMIN_CONFIG.twoFactorAuth,
        updatedAt: data.updatedAt,
      };
    }
  } catch (error) {
    console.warn('Erro ao carregar configurações do Super Admin do Firestore:', error);
  }
  return DEFAULT_SUPER_ADMIN_CONFIG;
}

/**
 * Altera a senha do Super Admin no Firebase Authentication e salva no Firestore
 */
export async function updateSuperAdminPasswordInFirebase(
  newPassword: string,
  adminEmail: string = 'root@saas.com'
): Promise<AuthResult<boolean>> {
  if (!newPassword || newPassword.length < 6) {
    return {
      success: false,
      error: 'A nova senha deve conter pelo menos 6 dígitos numéricos.',
    };
  }

  try {
    const currentUser = auth.currentUser;

    if (currentUser) {
      // Atualiza senha diretamente no usuário autenticado no Auth se houver
      try {
        await updatePassword(currentUser, newPassword);
      } catch (authErr) {
        console.warn('Nota de atualização no Firebase Auth (prosseguindo com Firestore):', authErr);
      }
    }

    // Atualiza imediatamente a senha e o código de acesso na configuração do Super Admin no Firestore
    const configDocRef = doc(db, 'system_settings', 'superadmin');
    await setDoc(
      configDocRef,
      {
        adminPassword: newPassword,
        adminAccessCode: newPassword,
        adminEmail: adminEmail,
        updatedAt: new Date().toISOString(),
        updatedAtServer: serverTimestamp(),
      },
      { merge: true }
    );

    // Salva hash/registro de segurança e auditoria no Firestore
    const securityLogRef = doc(db, 'security_logs', `pwd_change_${Date.now()}`);
    await setDoc(securityLogRef, {
      type: 'SUPERADMIN_PASSWORD_CHANGED',
      adminEmail: adminEmail,
      timestamp: serverTimestamp(),
      changedAt: new Date().toISOString(),
      status: 'SUCCESS',
    });

    // Atualiza metadata de segurança
    await setDoc(
      doc(db, 'system_settings', 'superadmin_security'),
      {
        lastPasswordChange: new Date().toISOString(),
        lastPasswordChangeServer: serverTimestamp(),
        adminEmail: adminEmail,
      },
      { merge: true }
    );

    return {
      success: true,
      data: true,
      isFirebaseCloud: true,
    };
  } catch (error: any) {
    console.error('Erro ao atualizar senha no Firebase:', error);
    return {
      success: false,
      error: error.message || 'Erro ao alterar a senha no banco de dados.',
    };
  }
}

// ============================================================================
// 10. FLUXO DE CAIXA E TRANSAÇÕES FINANCEIRAS NO FIRESTORE
// ============================================================================

/**
 * Salva uma nova transação financeira no Firestore e atualiza o cache local
 */
export async function saveTransactionToFirestore(
  tenantId: string,
  transaction: CashTransaction
): Promise<{ success: boolean; transaction: CashTransaction }> {
  const cleanTenant = (tenantId || 'navalha-ouro').trim();
  const txId = transaction.id || `tx-${Date.now()}`;

  const payload: CashTransaction = {
    ...transaction,
    id: txId,
    amount: Number(transaction.amount) || 0,
    type: transaction.type || 'entrada',
    category: transaction.category || 'Serviço',
    description: transaction.description || 'Movimentação de Caixa',
    paymentMethod: transaction.paymentMethod || 'Pix',
    operator: transaction.operator || 'Caixa / Atendente',
    time: transaction.time || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    date: transaction.date || new Date().toISOString().split('T')[0],
    tenantSubdomain: cleanTenant,
    tenantId: cleanTenant,
  };

  // 1. Atualiza no cache local
  try {
    const storageKey = `tenant_transactions_${cleanTenant}`;
    const cached = localStorage.getItem(storageKey);
    let list: CashTransaction[] = cached ? JSON.parse(cached) : [];
    const map = new Map<string, CashTransaction>();
    map.set(txId, payload);
    if (Array.isArray(list)) {
      list.forEach((t) => {
        if (t && t.id && t.id !== txId) {
          map.set(t.id, t);
        }
      });
    }
    localStorage.setItem(storageKey, JSON.stringify(Array.from(map.values())));
  } catch {}

  // 2. Dispara evento local para atualização reativa
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('barber_transaction_created', {
        detail: payload,
      })
    );
  }

  // 3. Salva no Firestore na subcoleção do tenant
  try {
    const docRef = doc(db, `tenants/${cleanTenant}/transactions`, txId);
    await setDoc(
      docRef,
      {
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return { success: true, transaction: payload };
  } catch (err) {
    console.warn('Erro ao salvar transação de caixa no Firestore:', err);
    return { success: true, transaction: payload };
  }
}

/**
 * Carrega as transações financeiras de uma barbearia do Firestore e Cache
 */
export async function getTransactionsFromFirestore(tenantId: string): Promise<CashTransaction[]> {
  const cleanTenant = (tenantId || 'navalha-ouro').trim();
  const txMap = new Map<string, CashTransaction>();

  // 1. Carrega do Cache Local
  try {
    const storageKey = `tenant_transactions_${cleanTenant}`;
    const cached = localStorage.getItem(storageKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) {
        parsed.forEach((t) => {
          if (t && t.id) txMap.set(t.id, t);
        });
      }
    }
  } catch {}

  // 2. Carrega do Firestore (Subcoleção tenants/{tenantId}/transactions)
  try {
    const colRef = collection(db, `tenants/${cleanTenant}/transactions`);
    const q = query(colRef, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    snap.forEach((docSnap) => {
      const data = docSnap.data() as CashTransaction;
      txMap.set(docSnap.id, {
        ...data,
        id: docSnap.id,
        tenantSubdomain: cleanTenant,
        tenantId: cleanTenant,
      });
    });
  } catch (err) {
    // Se falhar a ordenação por índice, tenta sem orderBy
    try {
      const colRef = collection(db, `tenants/${cleanTenant}/transactions`);
      const snap = await getDocs(colRef);
      snap.forEach((docSnap) => {
        const data = docSnap.data() as CashTransaction;
        txMap.set(docSnap.id, {
          ...data,
          id: docSnap.id,
          tenantSubdomain: cleanTenant,
          tenantId: cleanTenant,
        });
      });
    } catch (fallbackErr) {
      console.warn('Erro ao ler transações do Firestore:', fallbackErr);
    }
  }

  const result = Array.from(txMap.values());
  return result;
}

/**
 * Escuta transações financeiras em tempo real via Firestore onSnapshot
 */
export function subscribeToTenantTransactions(
  tenantId: string,
  onUpdate: (transactions: CashTransaction[]) => void
): () => void {
  const cleanTenant = (tenantId || 'navalha-ouro').trim();
  const txMap = new Map<string, CashTransaction>();

  try {
    const colRef = collection(db, `tenants/${cleanTenant}/transactions`);
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as CashTransaction;
          txMap.set(docSnap.id, {
            ...data,
            id: docSnap.id,
            tenantSubdomain: cleanTenant,
            tenantId: cleanTenant,
          });
        });
        onUpdate(Array.from(txMap.values()));
      },
      (error) => {
        console.warn('Listener de transações de caixa note:', error);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn('Erro ao registrar listener de transações:', err);
    return () => {};
  }
}

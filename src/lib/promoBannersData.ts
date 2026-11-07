import { BarberPromotionBanner } from '../types';

/**
 * Banco de Imagens Curadas da Web / Google / Unsplash com alta resolução
 */
export const SAMPLE_GOOGLE_BARBER_IMAGES = [
  {
    title: 'Degradê / Fade Navalhado Moderno',
    category: 'Cortes',
    url: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Barboterapia com Toalha Quente & Navalha',
    category: 'Barba',
    url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Corte Clássico na Tesoura & Acabamento',
    category: 'Cortes',
    url: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Experiência VIP / Dia do Noivo',
    category: 'VIP',
    url: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Ambiente Barber Lounge & Cerveja',
    category: 'Lounge',
    url: 'https://images.unsplash.com/photo-1512690459411-b9245aed614b?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Pai & Filho no Estilo',
    category: 'Combo',
    url: 'https://images.unsplash.com/photo-1517832606299-7ae9b720a186?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Tratamento de Barba & Óleos Nobres',
    category: 'Barba',
    url: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Produtos & Pomadas Modeladoras',
    category: 'Produtos',
    url: 'https://images.unsplash.com/photo-1534778356534-d3d45b6df1da?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Acabamento Preciso com Navalhete',
    category: 'Acabamento',
    url: 'https://images.unsplash.com/photo-1622287162716-f311baa1a2b8?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Corte Infantil & Jovem Estiloso',
    category: 'Kids/Jovem',
    url: 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Nevou / Platinado Perfeito',
    category: 'Química',
    url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Barbearia Vintage Premium',
    category: 'Lounge',
    url: 'https://images.unsplash.com/photo-1593702295094-aea22597af65?auto=format&fit=crop&w=1200&q=80',
  },
];

/**
 * 15 Banners Iniciais de Promoções de Alto Impacto para a Barbearia
 */
export const DEFAULT_PROMOTION_BANNERS: BarberPromotionBanner[] = [];

/**
 * Temas para o Assistente Criativo de IA de Marketing
 */
export const AI_PROMO_PRESETS = [
  {
    id: 'combo-barba',
    name: 'Combo Cabelo + Barba',
    keywords: 'combo cabelo barba desconto cerveja toalha quente',
    tone: 'Impactante & Moderno',
  },
  {
    id: 'quarta-maluca',
    name: 'Promoção Quarta Maluca',
    keywords: 'quarta maluca corte fade metade do preco horario tranquilo',
    tone: 'Urgência & Desconto',
  },
  {
    id: 'fidelidade-dobro',
    name: 'Selo de Fidelidade em Dobro',
    keywords: 'cartao fidelidade 2 selos premio corte gratis rapido',
    tone: 'Recompensa & Gamificação',
  },
  {
    id: 'happy-hour',
    name: 'Happy Hour com Chopp Free',
    keywords: 'happy hour chopp artesanal gratis corte final do dia amigos',
    tone: 'Descontraído & VIP',
  },
  {
    id: 'pai-filho',
    name: 'Especial Pai & Filho',
    keywords: 'pai e filho estilo familia desconto segundo corte sabado',
    tone: 'Emocional & Estiloso',
  },
  {
    id: 'nevou',
    name: 'Nevou / Platinado Masculino',
    keywords: 'nevou platinado loiro matizacao degradê fim de semana',
    tone: 'Jovem & Tendência',
  },
  {
    id: 'primeira-vez',
    name: 'Boas-Vindas Novo Cliente',
    keywords: 'primeira vez primeira visita desconto cupom 30% off',
    tone: 'Convidativo & Acolhedor',
  },
  {
    id: 'barboterapia',
    name: 'Barboterapia & Relaxamento',
    keywords: 'barboterapia toalha quente oleos essenciais massagem barba perfeita',
    tone: 'Luxo & Sofisticação',
  },
];

/**
 * Gerador de Textos Criativos com IA de Marketing para Barbearia
 */
export function generateAIBannerCopy(options: {
  themeName: string;
  serviceTarget?: string;
  discountNumber?: number;
  toneStyle?: string;
}): {
  title: string;
  subtitle: string;
  badge: string;
  ctaText: string;
  themeColor: 'amber' | 'emerald' | 'blue' | 'rose' | 'purple' | 'gold';
  suggestedImageUrl: string;
} {
  const { themeName, discountNumber = 30, serviceTarget = 'Corte + Barba' } = options;
  const t = themeName.toLowerCase();
  const disc = discountNumber || 30;

  if (t.includes('quarta') || t.includes('terça') || t.includes('maluca')) {
    return {
      title: `Quarta Maluca: ${serviceTarget} com Preço de Balcão`,
      subtitle: `Economize ${disc}% e saia alinhado para o restante da semana com bebida cortesia.`,
      badge: `⚡ SÓ ESSA SEMANA • -${disc}%`,
      ctaText: 'Garantir Meu Horário na Quarta',
      themeColor: 'emerald',
      suggestedImageUrl: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=1200&q=80',
    };
  }

  if (t.includes('fidelidade') || t.includes('selo') || t.includes('dobro')) {
    return {
      title: `Turbine sua Fidelidade: Ganhe Selos em Dobro!`,
      subtitle: `Agendando hoje pelo aplicativo você recebe 2x carimbos e fica a 1 passo do corte grátis.`,
      badge: `⭐ 2X SELOS NA CONTA`,
      ctaText: 'Agendar e Dobrar Meus Selos',
      themeColor: 'purple',
      suggestedImageUrl: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=1200&q=80',
    };
  }

  if (t.includes('barba') || t.includes('barboterapia') || t.includes('navalha')) {
    return {
      title: `Ritual Barba de Respeito com Toalha Quente`,
      subtitle: `Esfoliação facial, óleos nobres, navalhete cirúrgico e massagem pós-barba relaxante.`,
      badge: `💈 EXPERIÊNCIA PREMIUM`,
      ctaText: 'Quero Minha Barba Perfeita',
      themeColor: 'gold',
      suggestedImageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&q=80',
    };
  }

  if (t.includes('chopp') || t.includes('happy') || t.includes('cerveja')) {
    return {
      title: `Happy Hour na Barbearia: Corte Feito + Chopp Gelado`,
      subtitle: `Atendimento impecável com seu estilo renovado e cerveja artesanal na faixa.`,
      badge: `🍺 CHOPP ARTESANAL GRÁTIS`,
      ctaText: 'Marcar no Happy Hour',
      themeColor: 'amber',
      suggestedImageUrl: 'https://images.unsplash.com/photo-1512690459411-b9245aed614b?auto=format&fit=crop&w=1200&q=80',
    };
  }

  if (t.includes('pai') || t.includes('filho') || t.includes('familia')) {
    return {
      title: `Combo Família: Pai & Filho no Mesmo Estilo`,
      subtitle: `Corte em dose dupla com 50% de desconto no segundo atendimento neste final de semana.`,
      badge: `👨‍👦 DUPLA DE RESPEITO`,
      ctaText: 'Agendar Pai & Filho',
      themeColor: 'blue',
      suggestedImageUrl: 'https://images.unsplash.com/photo-1517832606299-7ae9b720a186?auto=format&fit=crop&w=1200&q=80',
    };
  }

  if (t.includes('nevou') || t.includes('platinado') || t.includes('loiro')) {
    return {
      title: `Efeito Nevou: Platinado de Respeito sem Danificar`,
      subtitle: `Descoloração profissional com pigmento importado e matização platinum ultra brilhante.`,
      badge: `❄️ NEVOU TENDÊNCIA 2026`,
      ctaText: 'Quero Platinar meu Cabelo',
      themeColor: 'blue',
      suggestedImageUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=1200&q=80',
    };
  }

  if (t.includes('primeira') || t.includes('boas') || t.includes('novo')) {
    return {
      title: `Seu Primeiro Corte com -${disc}% de Desconto`,
      subtitle: `Conheça a melhor experiência de barbearia da região com condição exclusiva no App.`,
      badge: `🎁 PRESENTE DE BOAS-VINDAS`,
      ctaText: 'Resgatar Desconto de Boas-Vindas',
      themeColor: 'emerald',
      suggestedImageUrl: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1200&q=80',
    };
  }

  // Fallback padrão criativo
  return {
    title: `Combo Especial ${serviceTarget}: O Toque que seu Visual Merece`,
    subtitle: `Aproveite ${disc}% de desconto exclusivo agendando diretamente pelo nosso aplicativo oficial.`,
    badge: `🔥 PROMOÇÃO EXCLUSIVA -${disc}%`,
    ctaText: 'Aproveitar Oferta Especial',
    themeColor: 'amber',
    suggestedImageUrl: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=1200&q=80',
  };
}

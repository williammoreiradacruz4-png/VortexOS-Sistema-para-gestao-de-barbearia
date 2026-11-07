import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Plus,
  Image as ImageIcon,
  Upload,
  Link2,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  Eye,
  Flame,
  Clock,
  ArrowRight,
  RefreshCw,
  Layers,
  Wand2,
  Search,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  Percent,
  Tag,
  Gift,
  Zap,
} from 'lucide-react';
import { BarberPromotionBanner } from '../types';
import {
  SAMPLE_GOOGLE_BARBER_IMAGES,
  AI_PROMO_PRESETS,
  generateAIBannerCopy,
  DEFAULT_PROMOTION_BANNERS,
} from '../lib/promoBannersData';

interface BarberPromotionsManagerProps {
  banners: BarberPromotionBanner[];
  tenantSubdomain?: string;
  themeColorHex?: string;
  onSaveBanner: (banner: BarberPromotionBanner) => void | Promise<void>;
  onDeleteBanner: (bannerId: string) => void | Promise<void>;
  onToggleActive: (banner: BarberPromotionBanner) => void | Promise<void>;
  onResetToDefaultBanners?: () => void | Promise<void>;
  onResetDefaults?: () => void | Promise<void>;
}

export const BarberPromotionsManager: React.FC<BarberPromotionsManagerProps> = ({
  banners,
  onSaveBanner,
  onDeleteBanner,
  onToggleActive,
  onResetToDefaultBanners,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BarberPromotionBanner | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formSubtitle, setFormSubtitle] = useState('');
  const [formBadge, setFormBadge] = useState('🔥 30% OFF');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formCtaText, setFormCtaText] = useState('Aproveitar Promoção');
  const [formOriginalPrice, setFormOriginalPrice] = useState<string>('');
  const [formPromoPrice, setFormPromoPrice] = useState<string>('');
  const [formDiscountPercentage, setFormDiscountPercentage] = useState<string>('30');
  const [formExpiresAt, setFormExpiresAt] = useState('Válido até domingo');
  const [formThemeColor, setFormThemeColor] = useState<'amber' | 'emerald' | 'blue' | 'rose' | 'purple' | 'gold'>('amber');
  const [formActive, setFormActive] = useState(true);

  // AI Generator State
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSelectedTheme, setAiSelectedTheme] = useState(AI_PROMO_PRESETS[0].name);
  const [aiCustomPrompt, setAiCustomPrompt] = useState('');
  const [aiNotification, setAiNotification] = useState<string | null>(null);

  // Google Image Gallery Picker State
  const [showGoogleGallery, setShowGoogleGallery] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Reset/Open Form
  const handleOpenCreateModal = () => {
    setEditingBanner(null);
    setFormTitle('Combo Especial: Cabelo + Barba Alinhada');
    setFormSubtitle('Ganhe hidratação capilar e uma cerveja artesanal gelada cortesia.');
    setFormBadge('🔥 30% OFF');
    setFormImageUrl(SAMPLE_GOOGLE_BARBER_IMAGES[0].url);
    setFormCtaText('Agendar Promoção');
    setFormOriginalPrice('80');
    setFormPromoPrice('55');
    setFormDiscountPercentage('30');
    setFormExpiresAt('Válido esta semana');
    setFormThemeColor('amber');
    setFormActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (banner: BarberPromotionBanner) => {
    setEditingBanner(banner);
    setFormTitle(banner.title);
    setFormSubtitle(banner.subtitle);
    setFormBadge(banner.badge);
    setFormImageUrl(banner.imageUrl);
    setFormCtaText(banner.ctaText);
    setFormOriginalPrice(banner.originalPrice ? String(banner.originalPrice) : '');
    setFormPromoPrice(banner.promoPrice ? String(banner.promoPrice) : '');
    setFormDiscountPercentage(banner.discountPercentage ? String(banner.discountPercentage) : '');
    setFormExpiresAt(banner.expiresAt || '');
    setFormThemeColor(banner.themeColor || 'amber');
    setFormActive(banner.active);
    setIsModalOpen(true);
  };

  // Upload imagem do celular ou PC
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      alert('A imagem é muito grande. Escolha uma imagem de até 4MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setFormImageUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // Gerador de Textos com IA
  const handleGenerateWithAI = () => {
    setIsAiLoading(true);
    setTimeout(() => {
      const copy = generateAIBannerCopy({
        themeName: aiCustomPrompt.trim() || aiSelectedTheme,
        discountNumber: Number(formDiscountPercentage) || 30,
      });

      setFormTitle(copy.title);
      setFormSubtitle(copy.subtitle);
      setFormBadge(copy.badge);
      setFormCtaText(copy.ctaText);
      setFormThemeColor(copy.themeColor);
      if (!formImageUrl || formImageUrl.includes('unsplash')) {
        setFormImageUrl(copy.suggestedImageUrl);
      }

      setIsAiLoading(false);
      setAiNotification('✨ Textos persuasivos e chamativos gerados pela IA com sucesso!');
      setTimeout(() => setAiNotification(null), 4000);
    }, 450);
  };

  // Salvar Banner
  const handleSubmitBanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formImageUrl.trim()) {
      alert('Por favor, informe ao menos o título e a imagem do banner.');
      return;
    }

    const newBanner: BarberPromotionBanner = {
      id: editingBanner ? editingBanner.id : `banner-${Date.now()}`,
      title: formTitle.trim(),
      subtitle: formSubtitle.trim(),
      badge: formBadge.trim() || 'PROMOÇÃO',
      imageUrl: formImageUrl.trim(),
      ctaText: formCtaText.trim() || 'Aproveitar',
      ctaAction: 'booking',
      originalPrice: formOriginalPrice ? parseFloat(formOriginalPrice) : undefined,
      promoPrice: formPromoPrice ? parseFloat(formPromoPrice) : undefined,
      discountPercentage: formDiscountPercentage ? parseInt(formDiscountPercentage, 10) : undefined,
      expiresAt: formExpiresAt.trim() || undefined,
      themeColor: formThemeColor,
      active: formActive,
      order: editingBanner ? editingBanner.order : banners.length + 1,
      createdAt: editingBanner?.createdAt || new Date().toISOString(),
    };

    onSaveBanner(newBanner);
    setIsModalOpen(false);
  };

  const filteredBanners = banners.filter((b) => {
    const matchesSearch =
      b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.subtitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.badge.toLowerCase().includes(searchTerm.toLowerCase());

    if (statusFilter === 'active') return matchesSearch && b.active;
    if (statusFilter === 'paused') return matchesSearch && !b.active;
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header com Ações Rápidas */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-gray-950 flex items-center justify-center font-bold shadow-lg shadow-amber-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>Gestão de Banners Promocionais</span>
                <span className="text-xs bg-amber-500/20 text-amber-300 font-semibold px-2.5 py-0.5 rounded-full border border-amber-500/30">
                  {banners.length} Banners cadastrados
                </span>
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Crie promoções com fotos do celular/PC ou links do Google, e use a Inteligência Artificial para gerar textos que convertem.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onResetToDefaultBanners && (
            <button
              type="button"
              onClick={onResetToDefaultBanners}
              className="bg-gray-800 hover:bg-gray-750 text-gray-300 border border-gray-700 px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="Restaurar os 15 banners promocionais originais"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Carregar 15 Banners Padrão</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Criar Novo Banner</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-900/60 p-4 rounded-xl border border-gray-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por título, tag ou serviço..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-950 border border-gray-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-amber-500 text-gray-950'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            Todos ({banners.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              statusFilter === 'active'
                ? 'bg-emerald-500 text-gray-950'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            Ativos ({banners.filter((b) => b.active).length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('paused')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              statusFilter === 'paused'
                ? 'bg-red-500 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            Pausados ({banners.filter((b) => !b.active).length})
          </button>
        </div>
      </div>

      {/* Grid de Banners Cadastrados */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredBanners.map((banner, index) => (
          <div
            key={`promo-card-${banner.id || index}-${index}`}
            className={`bg-gray-900 rounded-2xl border overflow-hidden flex flex-col justify-between transition group shadow-lg ${
              banner.active ? 'border-gray-800 hover:border-amber-500/50' : 'border-gray-800/50 opacity-60'
            }`}
          >
            {/* Topo: Imagem & Badges */}
            <div className="relative h-44 w-full bg-gray-950 overflow-hidden">
              <img
                src={banner.imageUrl}
                alt={banner.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 filter brightness-90"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&q=80';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/40 to-transparent" />

              {/* Badges Flutuantes */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-amber-500/90 text-gray-950 font-mono shadow-md flex items-center gap-1 backdrop-blur-sm">
                  <Flame className="w-3 h-3 fill-current" />
                  <span>{banner.badge}</span>
                </span>

                <button
                  type="button"
                  onClick={() => onToggleActive(banner)}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition cursor-pointer backdrop-blur-sm ${
                    banner.active
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                      : 'bg-red-500/20 text-red-300 border-red-500/40 hover:bg-red-500/30'
                  }`}
                >
                  {banner.active ? '● Ativo no App' : '○ Pausado'}
                </button>
              </div>

              {banner.expiresAt && (
                <div className="absolute bottom-2 left-3 text-[10px] text-gray-300 flex items-center gap-1 bg-gray-950/80 px-2 py-0.5 rounded backdrop-blur-sm">
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span>{banner.expiresAt}</span>
                </div>
              )}
            </div>

            {/* Conteúdo do Card */}
            <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <h3 className="font-bold text-sm text-white line-clamp-1 group-hover:text-amber-400 transition">
                  {banner.title}
                </h3>
                <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                  {banner.subtitle}
                </p>
              </div>

              {banner.promoPrice && (
                <div className="flex items-baseline gap-2 pt-1 border-t border-gray-800/80">
                  {banner.originalPrice && (
                    <span className="text-xs text-gray-500 line-through font-mono">
                      {banner.originalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  )}
                  <span className="text-sm font-black text-emerald-400 font-mono">
                    {banner.promoPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                  {banner.discountPercentage && (
                    <span className="text-[10px] bg-emerald-500/15 text-emerald-400 font-bold px-1.5 py-0.2 rounded">
                      -{banner.discountPercentage}%
                    </span>
                  )}
                </div>
              )}

              {/* Ações de Edição e Exclusão */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-800 gap-2">
                <span className="text-[11px] text-gray-500 font-mono">
                  CTA: <span className="text-gray-300 font-semibold">{banner.ctaText}</span>
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(banner)}
                    className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-amber-400 transition cursor-pointer"
                    title="Editar Banner"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Deseja realmente excluir o banner "${banner.title}"?`)) {
                        onDeleteBanner(banner.id);
                      }
                    }}
                    className="p-1.5 rounded-lg bg-gray-800 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition cursor-pointer"
                    title="Excluir Banner"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredBanners.length === 0 && (
        <div className="text-center py-12 bg-gray-900 rounded-2xl border border-gray-800 p-8">
          <Sparkles className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">Nenhum banner promocional encontrado</h3>
          <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
            {searchTerm
              ? 'Nenhum banner corresponde ao termo buscado.'
              : 'Clique em "Criar Novo Banner" para cadastrar sua primeira promoção com IA ou imagens do celular.'}
          </p>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="mt-4 bg-amber-500 hover:bg-amber-400 text-gray-950 text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer"
          >
            + Criar Banner Agora
          </button>
        </div>
      )}

      {/* Modal de Criação / Edição de Banner com IA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div
            className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto"
          >
              {/* Topo do Modal */}
              <div className="p-5 border-b border-gray-800 flex items-center justify-between bg-gray-950/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500 text-gray-950 flex items-center justify-center font-bold">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">
                      {editingBanner ? 'Editar Banner Promocional' : 'Lançar Nova Promoção'}
                    </h3>
                    <p className="text-xs text-gray-400">
                      Configure imagem, textos com IA e condições especiais da promoção.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center transition cursor-pointer"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {/* Corpo do Modal com Scroll */}
              <form onSubmit={handleSubmitBanner} className="p-5 space-y-5 overflow-y-auto flex-1 text-xs">
                {/* Assistente IA de Copywriting */}
                <div className="bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-amber-500/5 border border-amber-500/30 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wand2 className="w-4 h-4 text-amber-400 animate-pulse" />
                      <span className="font-bold text-amber-300 text-xs">
                        Assistente Criativo de IA (Marketing da Barbearia)
                      </span>
                    </div>
                    <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-semibold">
                      IA Gemini Copy
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] text-gray-400 mb-1">
                        Escolha um Tema ou Campanha:
                      </label>
                      <select
                        value={aiSelectedTheme}
                        onChange={(e) => setAiSelectedTheme(e.target.value)}
                        className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-amber-500"
                      >
                        {AI_PROMO_PRESETS.map((p) => (
                          <option key={p.id} value={p.name}>
                            {p.name} ({p.tone})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] text-gray-400 mb-1">
                        Ou digite palavras-chave (ex: "Barba + Cerveja 40% OFF"):
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Corte navalhado com desconto de quinta..."
                        value={aiCustomPrompt}
                        onChange={(e) => setAiCustomPrompt(e.target.value)}
                        className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      disabled={isAiLoading}
                      onClick={handleGenerateWithAI}
                      className="bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-gray-950 font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition cursor-pointer active:scale-95"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isAiLoading ? 'Gerando com IA...' : '✨ Gerar Textos Chamativos com IA'}</span>
                    </button>

                    {aiNotification && (
                      <span className="text-[11px] text-emerald-400 font-semibold animate-fade-in">
                        {aiNotification}
                      </span>
                    )}
                  </div>
                </div>

                {/* Seleção de Imagem: Celular/PC ou Link do Google */}
                <div className="space-y-2.5">
                  <label className="block font-bold text-white">
                    Imagem do Banner (Galeria do Celular/PC ou Link do Google):
                  </label>

                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-gray-800 hover:bg-gray-700 text-white font-semibold px-3.5 py-2 rounded-xl flex items-center gap-1.5 border border-gray-700 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-amber-400" />
                      <span>Enviar da Galeria (Celular / PC)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowGoogleGallery(!showGoogleGallery)}
                      className="bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold px-3.5 py-2 rounded-xl flex items-center gap-1.5 border border-gray-700 cursor-pointer"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
                      <span>Banco de Fotos HD Google ({SAMPLE_GOOGLE_BARBER_IMAGES.length})</span>
                    </button>
                  </div>

                  {/* Input direto de URL da Imagem */}
                  <div className="relative mt-2">
                    <Link2 className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="url"
                      placeholder="Ou cole aqui o link da imagem (ex: https://images.unsplash.com/...)"
                      value={formImageUrl}
                      onChange={(e) => setFormImageUrl(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-700 rounded-xl pl-8 pr-4 py-2.5 text-white placeholder-gray-500 focus:border-amber-500"
                    />
                  </div>

                  {/* Galeria de Fotos Curadas do Google/Unsplash para Escolha Rápida */}
                  {showGoogleGallery && (
                    <div className="bg-gray-950 p-3 rounded-xl border border-gray-800 space-y-2">
                      <p className="text-[11px] text-gray-400 font-semibold">
                        Clique em qualquer foto profissional para aplicar instantaneamente ao banner:
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
                        {SAMPLE_GOOGLE_BARBER_IMAGES.map((img, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              setFormImageUrl(img.url);
                              setShowGoogleGallery(false);
                            }}
                            className={`group relative h-20 rounded-lg overflow-hidden border cursor-pointer transition ${
                              formImageUrl === img.url
                                ? 'border-amber-400 ring-2 ring-amber-400/50'
                                : 'border-gray-800 hover:border-amber-500/60'
                            }`}
                          >
                            <img
                              src={img.url}
                              alt={img.title}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover:scale-105 transition"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-1">
                              <span className="text-[9px] text-white font-medium line-clamp-1">
                                {img.title}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Campos do Formulário: Título, Descrição, Tag e CTA */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-white mb-1">Título da Promoção (Chamada Principal):</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Combo Supremo: Cabelo + Barba Alinhada"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3.5 py-2.5 text-white placeholder-gray-500 focus:border-amber-500 font-semibold"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-white mb-1">Subtítulo / Descrição Persuasiva:</label>
                    <textarea
                      rows={2}
                      placeholder="Ex: Ganhe hidratação capilar e uma cerveja artesanal gelada cortesia."
                      value={formSubtitle}
                      onChange={(e) => setFormSubtitle(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3.5 py-2 text-white placeholder-gray-500 focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">Tag / Badge Chamativa:</label>
                    <input
                      type="text"
                      placeholder="Ex: 🔥 30% OFF, ⚡ SÓ HOJE, ⭐ SELO 2X"
                      value={formBadge}
                      onChange={(e) => setFormBadge(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3.5 py-2 text-white focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">Texto do Botão (CTA):</label>
                    <input
                      type="text"
                      placeholder="Ex: Agendar Promoção, Aproveitar Oferta"
                      value={formCtaText}
                      onChange={(e) => setFormCtaText(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3.5 py-2 text-white focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">Preço Original (R$):</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="85.00"
                      value={formOriginalPrice}
                      onChange={(e) => setFormOriginalPrice(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3.5 py-2 text-white focus:border-amber-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">Preço Promocional (R$):</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="59.90"
                      value={formPromoPrice}
                      onChange={(e) => setFormPromoPrice(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3.5 py-2 text-emerald-400 font-bold focus:border-amber-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">Validade da Promoção:</label>
                    <input
                      type="text"
                      placeholder="Ex: Válido até domingo, Toda quarta"
                      value={formExpiresAt}
                      onChange={(e) => setFormExpiresAt(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3.5 py-2 text-white focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">Tema / Cor do Banner:</label>
                    <select
                      value={formThemeColor}
                      onChange={(e) => setFormThemeColor(e.target.value as any)}
                      className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3.5 py-2 text-white focus:border-amber-500"
                    >
                      <option value="amber">Âmbar / Dourado</option>
                      <option value="emerald">Verde Esmeralda (Desconto)</option>
                      <option value="blue">Azul Moderno</option>
                      <option value="purple">Roxo VIP</option>
                      <option value="rose">Rosa / Coral</option>
                      <option value="gold">Gold Premium</option>
                    </select>
                  </div>
                </div>

                {/* Status Ativo / Pausado */}
                <div className="flex items-center justify-between p-3.5 bg-gray-950 rounded-xl border border-gray-800">
                  <div>
                    <p className="font-bold text-white">Status do Banner:</p>
                    <p className="text-gray-400 text-[11px]">
                      Se ativado, aparecerá imediatamente no carrossel de todos os clientes.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formActive}
                      onChange={(e) => setFormActive(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>

                {/* Prévia ao Vivo */}
                <div className="space-y-1.5 pt-2">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-amber-400" />
                    <span>Pré-visualização ao vivo do Carrossel do Cliente:</span>
                  </p>

                  <div className="relative h-44 rounded-xl overflow-hidden border border-gray-700 bg-gray-950 flex flex-col justify-between p-4 shadow-lg">
                    {formImageUrl && (
                      <img
                        src={formImageUrl}
                        alt="Preview"
                        referrerPolicy="no-referrer"
                        className="absolute inset-0 w-full h-full object-cover brightness-75 contrast-110"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/60 to-transparent" />

                    <div className="relative z-10 flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-500 text-gray-950">
                        {formBadge || 'PROMOÇÃO'}
                      </span>
                      {formExpiresAt && (
                        <span className="text-[10px] text-gray-300 bg-black/60 px-2 py-0.5 rounded-full">
                          {formExpiresAt}
                        </span>
                      )}
                    </div>

                    <div className="relative z-10">
                      <h4 className="font-black text-white text-base line-clamp-1">{formTitle}</h4>
                      <p className="text-gray-300 text-[11px] line-clamp-1">{formSubtitle}</p>
                      <div className="mt-2 flex items-center justify-between">
                        {formPromoPrice ? (
                          <span className="text-emerald-400 font-bold font-mono">
                            R$ {parseFloat(formPromoPrice).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-amber-400 font-semibold text-[11px]">Oferta Especial</span>
                        )}
                        <span className="bg-amber-500 text-gray-950 font-bold px-3 py-1 rounded-lg text-[11px]">
                          {formCtaText}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Botões de Ação do Modal */}
                <div className="pt-3 border-t border-gray-800 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold shadow-lg shadow-amber-500/20 transition cursor-pointer active:scale-95"
                  >
                    {editingBanner ? 'Salvar Alterações' : 'Lançar Promoção no App'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </div>
  );
};

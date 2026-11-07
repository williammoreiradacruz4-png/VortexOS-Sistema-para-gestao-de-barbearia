import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Flame,
  Clock,
  Tag,
  ArrowRight,
  Percent,
  Calendar,
  Gift,
} from 'lucide-react';
import { BarberPromotionBanner } from '../types';

interface PromoBannerCarouselProps {
  banners: BarberPromotionBanner[];
  onSelectPromo?: (banner: BarberPromotionBanner) => void;
  autoPlayInterval?: number;
}

export const PromoBannerCarousel: React.FC<PromoBannerCarouselProps> = ({
  banners,
  onSelectPromo,
  autoPlayInterval = 6000,
}) => {
  const activeBanners = banners.filter((b) => b.active);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const total = activeBanners.length;

  useEffect(() => {
    if (total <= 1 || isPaused) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % total);
    }, autoPlayInterval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [total, isPaused, autoPlayInterval]);

  if (total === 0) {
    return null;
  }

  const currentBanner = activeBanners[currentIndex] || activeBanners[0];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % total);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (diff > 45) {
      handleNext();
    } else if (diff < -45) {
      handlePrev();
    }
    setTouchStartX(null);
  };

  const getThemeGradient = (theme?: string) => {
    switch (theme) {
      case 'emerald':
        return 'from-emerald-950/90 via-gray-950/80 to-gray-950/95 border-emerald-500/30';
      case 'purple':
        return 'from-purple-950/90 via-gray-950/80 to-gray-950/95 border-purple-500/30';
      case 'blue':
        return 'from-blue-950/90 via-gray-950/80 to-gray-950/95 border-blue-500/30';
      case 'rose':
        return 'from-rose-950/90 via-gray-950/80 to-gray-950/95 border-rose-500/30';
      case 'gold':
        return 'from-amber-950/90 via-gray-950/80 to-gray-950/95 border-amber-500/40';
      default:
        return 'from-amber-950/90 via-gray-950/80 to-gray-950/95 border-amber-500/30';
    }
  };

  const getBadgeStyle = (theme?: string) => {
    switch (theme) {
      case 'emerald':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'purple':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'blue':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'rose':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      default:
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    }
  };

  return (
    <div
      id="barber-promo-carousel-container"
      className="relative w-full overflow-hidden rounded-2xl border border-gray-800 bg-gray-900 shadow-2xl"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Banner Principal com Transição Estável */}
      <div
        key={`promo-carousel-slide-${currentBanner.id || currentIndex}-${currentIndex}`}
        className="relative min-h-[220px] sm:min-h-[240px] md:min-h-[260px] flex flex-col justify-between overflow-hidden transition-all duration-300"
      >
          {/* Imagem de Fundo com Overlay */}
          <div className="absolute inset-0 z-0">
            <img
              src={currentBanner.imageUrl}
              alt={currentBanner.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center transform scale-105 filter brightness-75 contrast-110"
              onError={(e) => {
                // Fallback gracioso caso a imagem expire ou link quebre
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&q=80';
              }}
            />
            {/* Gradiente Duplo para Legibilidade Perfeita */}
            <div className={`absolute inset-0 bg-gradient-to-t ${getThemeGradient(currentBanner.themeColor)}`} />
            <div className="absolute inset-0 bg-gradient-to-r from-gray-950/90 via-gray-950/60 to-transparent" />
          </div>

          {/* Conteúdo Superior: Badges e Contador */}
          <div className="relative z-10 p-4 sm:p-5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-[11px] sm:text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full border shadow-sm flex items-center gap-1.5 backdrop-blur-md ${getBadgeStyle(
                  currentBanner.themeColor
                )}`}
              >
                <Flame className="w-3.5 h-3.5 fill-current animate-pulse text-amber-400" />
                <span>{currentBanner.badge || 'PROMOÇÃO EXCLUSIVA'}</span>
              </span>

              {currentBanner.expiresAt && (
                <span className="text-[10px] sm:text-[11px] text-gray-300 bg-gray-950/70 border border-gray-700/60 px-2.5 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-sm">
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span>{currentBanner.expiresAt}</span>
                </span>
              )}
            </div>

            <div className="bg-gray-950/80 border border-gray-800 text-gray-300 text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full backdrop-blur-sm">
              {currentIndex + 1}/{total}
            </div>
          </div>

          {/* Conteúdo Central e Inferior: Título, Descrição, Preços e Botão de Ação */}
          <div className="relative z-10 p-4 sm:p-5 pt-0">
            <h2 className="text-lg sm:text-xl md:text-2xl font-black text-white leading-tight drop-shadow-md max-w-xl">
              {currentBanner.title}
            </h2>

            <p className="text-xs sm:text-sm text-gray-200 mt-1.5 line-clamp-2 max-w-lg drop-shadow-sm font-medium">
              {currentBanner.subtitle}
            </p>

            <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3">
              {/* Bloco de Preço Promocional se houver */}
              {currentBanner.promoPrice ? (
                <div className="flex items-baseline gap-2 bg-gray-950/80 border border-gray-800/80 px-3 py-1.5 rounded-xl backdrop-blur-sm">
                  {currentBanner.originalPrice && (
                    <span className="text-xs text-gray-400 line-through font-mono">
                      {currentBanner.originalPrice.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </span>
                  )}
                  <span className="text-base sm:text-lg font-black text-emerald-400 font-mono">
                    {currentBanner.promoPrice.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </span>
                  {currentBanner.discountPercentage && (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.5 rounded">
                      -{currentBanner.discountPercentage}%
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1 text-xs text-amber-300 font-semibold bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/20">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Oferta Especial da Barbearia</span>
                </div>
              )}

              {/* Botão de Agendamento da Promoção */}
              <button
                type="button"
                onClick={() => onSelectPromo && onSelectPromo(currentBanner)}
                className="bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-gray-950 font-black text-xs sm:text-sm px-4 sm:px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-amber-500/25 active:scale-95 transition cursor-pointer group"
              >
                <span>{currentBanner.ctaText || 'Aproveitar Promoção'}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
      </div>

      {/* Controles de Navegação Anterior / Próximo */}
      {total > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Banner anterior"
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-gray-950/70 hover:bg-gray-900 border border-gray-700/80 text-white flex items-center justify-center transition cursor-pointer backdrop-blur-sm opacity-80 hover:opacity-100 z-20 shadow-md"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleNext}
            aria-label="Próximo banner"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-gray-950/70 hover:bg-gray-900 border border-gray-700/80 text-white flex items-center justify-center transition cursor-pointer backdrop-blur-sm opacity-80 hover:opacity-100 z-20 shadow-md"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}

      {/* Indicadores de Paginação (Dots) */}
      {total > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-950/60 backdrop-blur-xs border border-gray-800/60">
          {activeBanners.map((b, idx) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Ir para banner ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                idx === currentIndex
                  ? 'w-5 bg-amber-400'
                  : 'w-1.5 bg-gray-600 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

import React from 'react';
import {
  ExternalLink,
  Truck,
  Zap,
  MapPin,
  Heart,
  TrendingUp,
  Info,
  CheckCircle,
  AlertCircle,
  ArrowRightLeft,
} from 'lucide-react';
import { MarketplaceProduct } from '../types/marketplace';
import {
  formatCurrencyBRL,
  getConditionLabel,
  getReputationBadge,
} from '../utils/formatters';

interface ProductCardProps {
  product: MarketplaceProduct;
  isCheapest: boolean;
  isFavorite: boolean;
  onToggleFavorite: (product: MarketplaceProduct) => void;
  onSelectForDetails: (product: MarketplaceProduct) => void;
  onLoadInResaleCalculator: (product: MarketplaceProduct) => void;
  isCompared: boolean;
  onToggleCompare: (product: MarketplaceProduct) => void;
  onViewDemoNotice: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isCheapest,
  isFavorite,
  onToggleFavorite,
  onSelectForDetails,
  onLoadInResaleCalculator,
  isCompared,
  onToggleCompare,
  onViewDemoNotice,
}) => {
  const reputation = getReputationBadge(
    product.seller.powerSellerStatus,
    product.seller.reputationLevel
  );

  const handleLinkClick = (e: React.MouseEvent) => {
    if (product.isDemo) {
      e.preventDefault();
      onViewDemoNotice();
    }
  };

  return (
    <div
      className={`group relative bg-[#0D1836] rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-md hover:shadow-2xl hover:shadow-lime-500/5 ${
        isCheapest
          ? 'border-lime-400/60 ring-1 ring-lime-400/40'
          : isCompared
          ? 'border-blue-500/80 ring-1 ring-blue-500/40'
          : 'border-slate-800/90 hover:border-slate-700'
      }`}
    >
      {/* Top badges */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-1.5 flex-wrap">
          {isCheapest && (
            <span className="px-2 py-0.5 rounded-md bg-lime-400 text-slate-950 font-extrabold text-[11px] shadow-md uppercase tracking-wider">
              ★ Menor Preço
            </span>
          )}
          {product.isDemo && (
            <span className="px-2 py-0.5 rounded-md bg-amber-500/90 text-slate-950 font-bold text-[10px] shadow-sm uppercase">
              Demonstração
            </span>
          )}
          <span className="px-2 py-0.5 rounded-md bg-slate-900/90 backdrop-blur-sm text-slate-300 border border-slate-700/80 text-[10px] font-semibold">
            {getConditionLabel(product.condition)}
          </span>
        </div>

        {/* Favorite button */}
        <button
          type="button"
          onClick={() => onToggleFavorite(product)}
          className={`pointer-events-auto p-1.5 rounded-full backdrop-blur-md transition-all ${
            isFavorite
              ? 'bg-rose-500 text-white shadow-md'
              : 'bg-slate-900/80 text-slate-400 hover:text-rose-400 border border-slate-700/60'
          }`}
          title={isFavorite ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
        >
          <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
      </div>

      <div>
        {/* Thumbnail Container */}
        <div className="relative w-full pt-[75%] bg-[#080F24] overflow-hidden">
          <img
            src={product.thumbnail || 'https://placehold.co/400x300/0a1128/94a3b8?text=Sem+Foto'}
            alt={product.title}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://placehold.co/400x300/0a1128/94a3b8?text=Imagem+Indisponível';
            }}
          />
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-3">
          {/* Title */}
          <h3
            onClick={() => onSelectForDetails(product)}
            className="text-sm font-semibold text-slate-100 hover:text-lime-300 cursor-pointer line-clamp-2 leading-snug transition-colors"
            title={product.title}
          >
            {product.title}
          </h3>

          {/* Price & Installments */}
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white tracking-tight">
                {formatCurrencyBRL(product.price)}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-xs text-slate-500 line-through">
                  {formatCurrencyBRL(product.originalPrice)}
                </span>
              )}
            </div>

            {product.installments ? (
              <p className="text-[11px] text-slate-400 font-medium">
                em {product.installments.quantity}x de{' '}
                <strong className="text-slate-300">
                  {formatCurrencyBRL(product.installments.amount)}
                </strong>
                {product.installments.rate === 0 && ' sem juros'}
              </p>
            ) : (
              <p className="text-[11px] text-slate-400">Parcelamento: Informação indisponível</p>
            )}
          </div>

          {/* Shipping Badge */}
          <div className="flex items-center gap-2 text-xs">
            {product.shipping.freeShipping ? (
              <span className="inline-flex items-center gap-1 font-bold text-emerald-400">
                <Truck className="w-3.5 h-3.5" />
                Frete Grátis
              </span>
            ) : product.shipping.cost !== null && product.shipping.cost !== undefined ? (
              <span className="inline-flex items-center gap-1 text-slate-400">
                <Truck className="w-3.5 h-3.5" />
                Frete: {formatCurrencyBRL(product.shipping.cost)}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-slate-400">
                <Truck className="w-3.5 h-3.5" />
                Frete a calcular
              </span>
            )}

            {product.shipping.tag && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-lime-400/15 text-lime-400 border border-lime-400/30 font-bold text-[10px]">
                <Zap className="w-3 h-3 fill-current" />
                {product.shipping.tag}
              </span>
            )}
          </div>

          {/* Seller & Reputation */}
          <div className="pt-2.5 border-t border-slate-800/80 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 truncate max-w-[170px]" title={product.seller.name}>
                Por: <strong className="text-slate-200">{product.seller.name}</strong>
              </span>
              {(product.seller.city || product.seller.state) && (
                <span className="text-[11px] text-slate-400 flex items-center gap-0.5 shrink-0">
                  <MapPin className="w-3 h-3" />
                  {[product.seller.city, product.seller.state].filter(Boolean).join(', ')}
                </span>
              )}
            </div>

            {/* Seller Reputation Badge */}
            <div className="flex items-center justify-between">
              <span
                className={`text-[10px] px-2 py-0.5 rounded-md border font-medium inline-block truncate ${reputation.colorClass}`}
                title={reputation.label}
              >
                {reputation.label}
              </span>

              {product.seller.positiveRatingPercent !== null && (
                <span className="text-[11px] text-slate-400 font-medium">
                  {product.seller.positiveRatingPercent}% positivas
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Card Actions Footer */}
      <div className="p-4 pt-0 space-y-2">
        <div className="flex items-center gap-2">
          {/* Main "Ver Anúncio" Button */}
          <a
            href={product.isDemo ? '#' : product.permalink}
            target={product.isDemo ? '_self' : '_blank'}
            rel="noopener noreferrer"
            onClick={handleLinkClick}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl font-bold text-xs transition-all ${
              product.isDemo
                ? 'bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/40'
                : 'bg-lime-400 hover:bg-lime-300 text-slate-950 shadow-md shadow-lime-400/15'
            }`}
          >
            <span>{product.isDemo ? 'Ver anúncio (Demo)' : 'Ver anúncio'}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          {/* Details Button */}
          <button
            type="button"
            onClick={() => onSelectForDetails(product)}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-semibold transition-colors"
            title="Ver ficha técnica e atributos detalhados"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>

        {/* Secondary Row: Compare & Resale Calculator Actions */}
        <div className="flex items-center justify-between pt-1 text-[11px]">
          <button
            type="button"
            onClick={() => onToggleCompare(product)}
            className={`flex items-center gap-1 font-medium px-2 py-1 rounded transition-colors ${
              isCompared
                ? 'text-blue-300 bg-blue-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowRightLeft className="w-3 h-3" />
            {isCompared ? 'Comparando' : 'Comparar'}
          </button>

          <button
            type="button"
            onClick={() => onLoadInResaleCalculator(product)}
            className="flex items-center gap-1 text-lime-400 hover:text-lime-300 font-semibold px-2 py-1 rounded hover:bg-lime-400/10 transition-colors"
            title="Carregar preço deste anúncio na calculadora de revenda"
          >
            <TrendingUp className="w-3 h-3" />
            Simular Revenda
          </button>
        </div>
      </div>
    </div>
  );
};

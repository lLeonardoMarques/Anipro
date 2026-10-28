import React from 'react';
import {
  X,
  ArrowRightLeft,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Truck,
  Check,
  TrendingUp,
} from 'lucide-react';
import { MarketplaceProduct } from '../types/marketplace';
import {
  formatCurrencyBRL,
  getConditionLabel,
  getReputationBadge,
} from '../utils/formatters';

interface CompareModalProps {
  products: MarketplaceProduct[];
  onClose: () => void;
  onRemoveProduct: (productId: string) => void;
  onClearAll: () => void;
  onLoadInResaleCalculator: (product: MarketplaceProduct) => void;
  onViewDemoNotice: () => void;
}

export const CompareModal: React.FC<CompareModalProps> = ({
  products,
  onClose,
  onRemoveProduct,
  onClearAll,
  onLoadInResaleCalculator,
  onViewDemoNotice,
}) => {
  if (products.length === 0) return null;

  const minPriceInComparison = Math.min(...products.map((p) => p.price));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] bg-[#0A1227] border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-[#080E21]">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <ArrowRightLeft className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Comparador de Anúncios e Vendedores
              </h2>
              <p className="text-xs text-slate-400">
                Comparando {products.length} de no máximo 3 anúncios selecionados lado a lado
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClearAll}
              className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Limpar seleção
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Comparison Grid */}
        <div className="p-4 sm:p-6 overflow-x-auto overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-w-[640px]">
            {products.map((product) => {
              const reputation = getReputationBadge(
                product.seller.powerSellerStatus,
                product.seller.reputationLevel
              );
              const isBestPrice = product.price === minPriceInComparison;

              return (
                <div
                  key={product.id}
                  className={`bg-[#0D1836] rounded-xl border p-4 flex flex-col justify-between space-y-4 relative ${
                    isBestPrice
                      ? 'border-lime-400/80 shadow-lg shadow-lime-400/5'
                      : 'border-slate-800'
                  }`}
                >
                  {/* Remove pill */}
                  <button
                    type="button"
                    onClick={() => onRemoveProduct(product.id)}
                    className="absolute top-2 right-2 p-1.5 rounded-lg text-slate-400 hover:text-rose-400 bg-slate-900/80 border border-slate-800"
                    title="Remover do comparador"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>

                  <div className="space-y-3">
                    {/* Badge */}
                    <div className="flex items-center gap-1.5">
                      {isBestPrice && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-lime-400 text-slate-950 uppercase">
                          Melhor Preço
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
                        {getConditionLabel(product.condition)}
                      </span>
                    </div>

                    {/* Image & Title */}
                    <div className="h-32 bg-[#080F24] rounded-lg p-2 flex items-center justify-center">
                      <img
                        src={product.thumbnail}
                        alt={product.title}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>

                    <h4 className="text-xs font-semibold text-slate-200 line-clamp-2 leading-snug">
                      {product.title}
                    </h4>

                    {/* Price */}
                    <div>
                      <div className="text-xl font-black text-white">
                        {formatCurrencyBRL(product.price)}
                      </div>
                      {product.installments ? (
                        <p className="text-[11px] text-slate-400">
                          {product.installments.quantity}x de{' '}
                          {formatCurrencyBRL(product.installments.amount)}
                        </p>
                      ) : (
                        <p className="text-[11px] text-slate-500">Sem info de parcelamento</p>
                      )}
                    </div>

                    {/* Vendedor */}
                    <div className="p-2.5 rounded-lg bg-[#070D1F] border border-slate-800/80 space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Vendedor:</span>
                        <strong className="text-slate-200 truncate max-w-[120px]">
                          {product.seller.name}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Reputação:</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${reputation.colorClass}`}>
                          {reputation.label}
                        </span>
                      </div>
                      {product.seller.city && (
                        <div className="flex items-center justify-between text-slate-400 text-[11px]">
                          <span>Origem:</span>
                          <span>{product.seller.city}, {product.seller.state}</span>
                        </div>
                      )}
                    </div>

                    {/* Envio */}
                    <div className="p-2.5 rounded-lg bg-[#070D1F] border border-slate-800/80 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Envio:</span>
                        <span className={`font-semibold ${product.shipping.freeShipping ? 'text-emerald-400' : 'text-slate-300'}`}>
                          {product.shipping.freeShipping ? 'Frete Grátis' : 'Pago à parte'}
                        </span>
                      </div>
                      {product.shipping.tag && (
                        <div className="text-[11px] text-lime-400 font-bold">
                          ⚡ {product.shipping.tag}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        onLoadInResaleCalculator(product);
                        onClose();
                      }}
                      className="w-full py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-lime-400 text-xs font-semibold flex items-center justify-center gap-1.5"
                    >
                      <TrendingUp className="w-3.5 h-3.5" />
                      Simular Revenda
                    </button>

                    {product.isDemo ? (
                      <button
                        type="button"
                        onClick={onViewDemoNotice}
                        className="w-full py-2 px-3 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/40 text-xs font-bold"
                      >
                        Ver Anúncio (Demonstração)
                      </button>
                    ) : (
                      <a
                        href={product.permalink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2 px-3 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-lime-400/15"
                      >
                        <span>Ver no Mercado Livre</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

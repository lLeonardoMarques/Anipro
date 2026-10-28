import React from 'react';
import {
  X,
  ExternalLink,
  ShieldCheck,
  Truck,
  MapPin,
  Calendar,
  Layers,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { MarketplaceProduct } from '../types/marketplace';
import {
  formatCurrencyBRL,
  formatDateTimeBR,
  getConditionLabel,
  getReputationBadge,
} from '../utils/formatters';

interface ProductDetailsModalProps {
  product: MarketplaceProduct | null;
  onClose: () => void;
  onLoadInResaleCalculator: (product: MarketplaceProduct) => void;
  onViewDemoNotice: () => void;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  product,
  onClose,
  onLoadInResaleCalculator,
  onViewDemoNotice,
}) => {
  if (!product) return null;

  const reputation = getReputationBadge(
    product.seller.powerSellerStatus,
    product.seller.reputationLevel
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-[#0A1227] border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-[#080E21]">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-lime-400/10 text-lime-400 border border-lime-400/20">
              <Layers className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-white">Detalhes do Anúncio</h2>
              <p className="text-xs text-slate-400">
                Identificador: <span className="font-mono text-slate-300">{product.id}</span>
                {product.isDemo && ' (Item de Demonstração)'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Main Info Hero */}
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            <div className="w-full sm:w-48 h-48 bg-[#060A17] rounded-xl border border-slate-800 flex items-center justify-center p-3 shrink-0">
              <img
                src={product.thumbnail || 'https://placehold.co/400x300/0a1128/94a3b8?text=Sem+Foto'}
                alt={product.title}
                className="max-h-full max-w-full object-contain"
              />
            </div>

            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-semibold">
                  Condição: {getConditionLabel(product.condition)}
                </span>
                {product.isDemo ? (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold">
                    Anúncio de Demonstração
                  </span>
                ) : (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold">
                    Mercado Livre Oficial
                  </span>
                )}
              </div>

              <h1 className="text-base sm:text-lg font-bold text-white leading-tight">
                {product.title}
              </h1>

              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-black text-lime-400">
                  {formatCurrencyBRL(product.price)}
                </span>
                {product.originalPrice && (
                  <span className="text-sm text-slate-500 line-through">
                    {formatCurrencyBRL(product.originalPrice)}
                  </span>
                )}
              </div>

              {product.installments ? (
                <p className="text-xs text-slate-300">
                  Parcelamento disponível: {product.installments.quantity}x de{' '}
                  <strong className="text-white">
                    {formatCurrencyBRL(product.installments.amount)}
                  </strong>
                  {product.installments.rate === 0 && ' sem acréscimo de juros'}
                </p>
              ) : (
                <p className="text-xs text-slate-500">Parcelamento: Informação indisponível</p>
              )}

              <div className="text-xs text-slate-400 flex items-center gap-1.5 pt-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Consulta realizada em: {formatDateTimeBR(product.queryTimestamp)}</span>
              </div>
            </div>
          </div>

          {/* Dados do Vendedor e Reputação */}
          <div className="bg-[#0D1836] border border-slate-800 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-lime-400" />
              Informações do Vendedor
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Nome / Identificação:</span>
                <span className="font-semibold text-slate-100">
                  {product.seller.name || 'Informação indisponível'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Nível de Reputação:</span>
                <span className={`inline-block px-2 py-0.5 rounded border text-[11px] ${reputation.colorClass}`}>
                  {reputation.label}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Localização:</span>
                <span className="font-semibold text-slate-200 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {product.seller.city || product.seller.state
                    ? [product.seller.city, product.seller.state].filter(Boolean).join(', ')
                    : 'Informação indisponível'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Vendas Concluídas:</span>
                <span className="font-semibold text-slate-200">
                  {product.seller.completedTransactions !== null
                    ? `${product.seller.completedTransactions.toLocaleString('pt-BR')} vendas`
                    : 'Informação indisponível'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Opiniões Positivas:</span>
                <span className="font-semibold text-slate-200">
                  {product.seller.positiveRatingPercent !== null
                    ? `${product.seller.positiveRatingPercent}% positivas`
                    : 'Informação indisponível'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Estoque Disponível:</span>
                <span className="font-semibold text-slate-200">
                  {product.availableQuantity !== null && product.availableQuantity !== undefined
                    ? `${product.availableQuantity} unidades`
                    : 'Informação indisponível'}
                </span>
              </div>
            </div>
          </div>

          {/* Dados de Envio */}
          <div className="bg-[#0D1836] border border-slate-800 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Truck className="w-4 h-4 text-lime-400" />
              Modalidade e Custo de Envio
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Frete Grátis:</span>
                <span className={`font-bold ${product.shipping.freeShipping ? 'text-emerald-400' : 'text-slate-300'}`}>
                  {product.shipping.freeShipping ? 'Sim (Frete Grátis anunciado)' : 'Não informado ou pago à parte'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Logística de Envio:</span>
                <span className="font-semibold text-slate-200">
                  {product.shipping.tag || product.shipping.logisticType || 'Padrão / Não especificado'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Previsão / Custo Estimado:</span>
                <span className="font-semibold text-slate-200">
                  {product.shipping.cost !== null && product.shipping.cost !== undefined
                    ? formatCurrencyBRL(product.shipping.cost)
                    : product.shipping.freeShipping
                    ? 'Grátis para regiões atendidas'
                    : 'Informação indisponível (calculado no CEP)'}
                </span>
              </div>
            </div>
          </div>

          {/* Atributos e Características Técnicas */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Info className="w-4 h-4 text-lime-400" />
              Características e Ficha Técnica
            </h3>

            {product.attributes && product.attributes.length > 0 ? (
              <div className="border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800/80 text-xs">
                {product.attributes.map((attr, index) => (
                  <div
                    key={attr.id || index}
                    className="grid grid-cols-3 p-2.5 bg-[#0C152D] hover:bg-slate-800/40 transition-colors"
                  >
                    <span className="font-semibold text-slate-300 col-span-1">
                      {attr.name}
                    </span>
                    <span className="text-slate-200 col-span-2">
                      {attr.value_name || 'Informação indisponível'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400">
                Nenhum atributo adicional retornado pela API para este anúncio. (Informação indisponível)
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-[#080E21] flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              onLoadInResaleCalculator(product);
              onClose();
            }}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-lime-400 font-semibold text-xs border border-slate-700 transition-colors flex items-center gap-2"
          >
            <span>Simular Revenda com este Custo</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
            >
              Fechar
            </button>

            {product.isDemo ? (
              <button
                type="button"
                onClick={onViewDemoNotice}
                className="px-5 py-2.5 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/40 font-bold text-xs flex items-center gap-1.5"
              >
                <span>Aviso de Demonstração</span>
                <Info className="w-3.5 h-3.5" />
              </button>
            ) : (
              <a
                href={product.permalink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-lime-400/10"
              >
                <span>Ver anúncio no Mercado Livre</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

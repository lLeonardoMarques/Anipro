import React from 'react';
import {
  X,
  Heart,
  Trash2,
  ExternalLink,
  FileSpreadsheet,
  TrendingUp,
} from 'lucide-react';
import { MarketplaceProduct } from '../types/marketplace';
import { formatCurrencyBRL, getConditionLabel } from '../utils/formatters';

interface FavoritesModalProps {
  isOpen: boolean;
  onClose: () => void;
  favorites: MarketplaceProduct[];
  onRemoveFavorite: (productId: string) => void;
  onSelectProduct: (product: MarketplaceProduct) => void;
  onLoadInResaleCalculator: (product: MarketplaceProduct) => void;
  onExportCSV: () => void;
}

export const FavoritesModal: React.FC<FavoritesModalProps> = ({
  isOpen,
  onClose,
  favorites,
  onRemoveFavorite,
  onSelectProduct,
  onLoadInResaleCalculator,
  onExportCSV,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-[#0A1227] border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-[#080E21]">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <Heart className="w-5 h-5 fill-current" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Anúncios Salvos ({favorites.length})
              </h2>
              <p className="text-xs text-slate-400">
                Seus produtos favoritados guardados no navegador
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-3">
          {favorites.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <Heart className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-300">
                Nenhum anúncio favoritado ainda
              </p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Clique no ícone de coração nos cartões de anúncios para salvar itens e compará-los depois.
              </p>
            </div>
          ) : (
            favorites.map((product) => (
              <div
                key={product.id}
                className="bg-[#0D1836] border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <img
                    src={product.thumbnail}
                    alt={product.title}
                    className="w-14 h-14 object-contain rounded-lg bg-[#060D1E] p-1 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h4
                      onClick={() => {
                        onSelectProduct(product);
                        onClose();
                      }}
                      className="text-xs font-semibold text-white hover:text-lime-300 cursor-pointer truncate"
                      title={product.title}
                    >
                      {product.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-sm font-black text-lime-400">
                        {formatCurrencyBRL(product.price)}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        {getConditionLabel(product.condition)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      onLoadInResaleCalculator(product);
                      onClose();
                    }}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-lime-400"
                    title="Simular revenda deste anúncio"
                  >
                    <TrendingUp className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onRemoveFavorite(product.id)}
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-400 bg-slate-800 hover:bg-slate-700"
                    title="Remover dos favoritos"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {favorites.length > 0 && (
          <div className="p-4 border-t border-slate-800 bg-[#080E21] flex items-center justify-between">
            <button
              type="button"
              onClick={onExportCSV}
              className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-lime-400 font-medium"
            >
              <FileSpreadsheet className="w-4 h-4 text-lime-400" />
              Exportar Favoritos (CSV)
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
            >
              Fechar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

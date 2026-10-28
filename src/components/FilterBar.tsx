import React from 'react';
import {
  ArrowUpDown,
  Filter,
  Truck,
  CheckCircle2,
  FileSpreadsheet,
  RotateCcw,
} from 'lucide-react';
import { FilterState, MarketplaceProduct } from '../types/marketplace';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  products: MarketplaceProduct[];
  onResetFilters: () => void;
  onExportCSV: () => void;
  hasActiveFilters: boolean;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  products,
  onResetFilters,
  onExportCSV,
  hasActiveFilters,
}) => {
  // Check if data supports condition filtering
  const hasNew = products.some((p) => p.condition === 'new');
  const hasUsed = products.some((p) => p.condition === 'used');
  const hasFreeShipping = products.some((p) => p.shipping.freeShipping);
  const hasReputableSellers = products.some(
    (p) => Boolean(p.seller.powerSellerStatus) || p.seller.reputationLevel === 'green'
  );

  return (
    <div className="bg-[#0A1329] border border-slate-800/90 rounded-2xl p-3.5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Sorting */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-lime-400" />
          <span className="text-xs font-semibold text-slate-300">Ordenar por:</span>
          <select
            value={filters.sortBy}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                sortBy: e.target.value as FilterState['sortBy'],
              })
            }
            className="bg-[#060D1E] border border-slate-700 text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-lime-400 font-medium"
          >
            <option value="price_asc">Menor Preço (Recomendado)</option>
            <option value="price_desc">Maior Preço</option>
            <option value="relevance">Mais Relevantes</option>
            <option value="reputation">Melhor Reputação do Vendedor</option>
          </select>
        </div>

        {/* Right: Export & Clear actions */}
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-white px-2 py-1 rounded-md bg-slate-800/70 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Limpar filtros
            </button>
          )}

          <button
            type="button"
            onClick={onExportCSV}
            className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-lime-400 px-2.5 py-1.5 rounded-lg border border-slate-700/80 bg-[#0E1834] transition-colors font-medium"
            title="Exportar dados analisados em arquivo CSV para revenda ou planilha"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-lime-400" />
            <span className="hidden sm:inline">Exportar</span> Relatório (CSV)
          </button>
        </div>
      </div>

      {/* Filter Toggles (only rendered if supported by dataset) */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/60">
        <span className="text-xs text-slate-400 flex items-center gap-1 mr-1">
          <Filter className="w-3.5 h-3.5 text-slate-400" /> Filtros rápidos:
        </span>

        {/* Condition Filter (only if both new/used exist or at least one exists) */}
        {(hasNew || hasUsed) && (
          <div className="flex items-center bg-[#070E22] border border-slate-800 rounded-lg p-0.5 text-xs">
            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, condition: 'all' })}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filters.condition === 'all'
                  ? 'bg-slate-700 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Todas Condições
            </button>
            {hasNew && (
              <button
                type="button"
                onClick={() => onFilterChange({ ...filters, condition: 'new' })}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  filters.condition === 'new'
                    ? 'bg-lime-400 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Novos
              </button>
            )}
            {hasUsed && (
              <button
                type="button"
                onClick={() => onFilterChange({ ...filters, condition: 'used' })}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  filters.condition === 'used'
                    ? 'bg-lime-400 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Usados
              </button>
            )}
          </div>
        )}

        {/* Free Shipping Filter (only if free shipping exists) */}
        {hasFreeShipping && (
          <button
            type="button"
            onClick={() =>
              onFilterChange({
                ...filters,
                freeShippingOnly: !filters.freeShippingOnly,
              })
            }
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
              filters.freeShippingOnly
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-semibold'
                : 'bg-[#070E22] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            Frete Grátis
          </button>
        )}

        {/* Reputable Sellers Filter */}
        {hasReputableSellers && (
          <button
            type="button"
            onClick={() =>
              onFilterChange({
                ...filters,
                reputableSellersOnly: !filters.reputableSellersOnly,
              })
            }
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
              filters.reputableSellersOnly
                ? 'bg-blue-500/20 border-blue-400 text-blue-300 font-semibold'
                : 'bg-[#070E22] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Vendedores MercadoLíder
          </button>
        )}
      </div>
    </div>
  );
};

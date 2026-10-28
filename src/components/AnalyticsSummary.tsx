import React from 'react';
import {
  TrendingDown,
  TrendingUp,
  Scale,
  Package,
  AlertTriangle,
  Clock,
  Truck,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { PriceAnalysisSummary } from '../types/marketplace';
import { formatCurrencyBRL, formatDateTimeBR } from '../utils/formatters';

interface AnalyticsSummaryProps {
  summary: PriceAnalysisSummary;
  source: 'live' | 'demo';
}

export const AnalyticsSummary: React.FC<AnalyticsSummaryProps> = ({
  summary,
  source,
}) => {
  if (summary.totalAnalyzed === 0) return null;

  const priceSpread = summary.maxPrice - summary.minPrice;
  const spreadPercent = summary.minPrice > 0 ? Math.round((priceSpread / summary.minPrice) * 100) : 0;

  return (
    <div className="w-full space-y-4">
      {/* Top Bar with Query Context and Timestamp */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0B142B] border border-slate-800/90 rounded-xl px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-lime-400"></span>
          <span className="text-sm font-semibold text-white">
            Resultados para &ldquo;<span className="text-lime-400">{summary.queryTerm}</span>&rdquo;
          </span>
          <span className="text-xs text-slate-400">
            ({summary.totalAnalyzed} {summary.totalAnalyzed === 1 ? 'anúncio analisado' : 'anúncios analisados'})
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>
            Última consulta: <strong className="text-slate-200">{formatDateTimeBR(summary.lastQueryDate)}</strong>
          </span>
          {source === 'demo' ? (
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
              Dados de demonstração
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
              Mercado Livre Oficial
            </span>
          )}
        </div>
      </div>

      {/* 4 Core Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Menor Preço */}
        <div className="bg-[#0D1836] border border-lime-500/30 rounded-2xl p-4 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-lime-400/5 rounded-full blur-2xl pointer-events-none group-hover:bg-lime-400/10 transition-colors" />
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 text-lime-400">
              <TrendingDown className="w-4 h-4" />
              Menor Preço
            </span>
            <span className="text-[11px] px-1.5 py-0.5 rounded bg-lime-400/20 text-lime-300 font-bold">
              Melhor oferta
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
            {formatCurrencyBRL(summary.minPrice)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <Info className="w-3 h-3 text-slate-400 shrink-0" />
            Sujeito a custo de envio
          </p>
        </div>

        {/* Preço Médio */}
        <div className="bg-[#0D1836] border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Scale className="w-4 h-4 text-blue-400" />
              Preço Médio
            </span>
            <span className="text-[11px] text-slate-400">
              Média simples
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight mt-1">
            {formatCurrencyBRL(summary.avgPrice)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Mediana: <strong className="text-slate-300">{formatCurrencyBRL(summary.medianPrice)}</strong>
          </p>
        </div>

        {/* Maior Preço */}
        <div className="bg-[#0D1836] border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 text-slate-300">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              Maior Preço
            </span>
            <span className="text-[11px] text-amber-400 font-medium">
              +{spreadPercent}% variação
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-200 tracking-tight mt-1">
            {formatCurrencyBRL(summary.maxPrice)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Diferença: <strong className="text-slate-300">{formatCurrencyBRL(priceSpread)}</strong>
          </p>
        </div>

        {/* Total Analisado & Envio */}
        <div className="bg-[#0D1836] border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Package className="w-4 h-4 text-emerald-400" />
              Anúncios
            </span>
            <span className="text-[11px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
              {summary.freeShippingCount} c/ Frete Grátis
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
            {summary.totalAnalyzed}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {summary.newConditionCount} Novos • {summary.usedConditionCount} Usados
          </p>
        </div>
      </div>

      {/* Mandatory Analytical Disclaimers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-amber-950/25 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-200 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-amber-300 block mb-0.5">Variações e Quantidades:</strong>
            Os resultados de pesquisa podem conter versões, tamanhos, capacidades, voltagens ou kits com quantidades diferentes do produto anunciado. Verifique a descrição antes de concluir a compra.
          </div>
        </div>

        <div className="bg-blue-950/25 border border-blue-500/30 rounded-xl p-3 text-xs text-blue-200 flex items-start gap-2.5">
          <Truck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-blue-300 block mb-0.5">Custo Final e Frete:</strong>
            O menor preço anunciado do produto não representa necessariamente o menor custo final caso o frete não esteja disponível ou seja cobrado à parte pelo vendedor para a sua região.
          </div>
        </div>
      </div>
    </div>
  );
};

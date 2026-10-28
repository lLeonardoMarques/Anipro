import React, { useState, useEffect } from 'react';
import {
  Calculator,
  DollarSign,
  TrendingUp,
  Percent,
  Truck,
  ShieldAlert,
  HelpCircle,
  RotateCcw,
  Sparkles,
  Info,
} from 'lucide-react';
import { ResaleCalculationInput, ResaleCalculationResult } from '../types/marketplace';
import { formatCurrencyBRL } from '../utils/formatters';

interface ResaleCalculatorProps {
  initialCost?: number | null;
  productTitle?: string | null;
}

const TARIFF_PRESETS = [
  { label: 'ML Clássico (12%)', percent: 12, fixed: 6.0 },
  { label: 'ML Premium (17%)', percent: 17, fixed: 6.0 },
  { label: 'Venda Direta (0%)', percent: 0, fixed: 0 },
  { label: 'Personalizado', percent: 14, fixed: 0 },
];

export const ResaleCalculator: React.FC<ResaleCalculatorProps> = ({
  initialCost,
  productTitle,
}) => {
  const [costPrice, setCostPrice] = useState<number>(initialCost || 100);
  const [salePrice, setSalePrice] = useState<number>(initialCost ? Math.round(initialCost * 1.45) : 160);
  const [tariffPercent, setTariffPercent] = useState<number>(14);
  const [fixedFee, setFixedFee] = useState<number>(6.0); // Taxa fixa ML para itens com frete
  const [shippingCost, setShippingCost] = useState<number>(20.0);
  const [taxesPercent, setTaxesPercent] = useState<number>(6.0); // Simples Nacional médio
  const [otherCosts, setOtherCosts] = useState<number>(5.0); // Embalagem, fita, etc.

  // Sincroniza se o usuário clicar em "Simular Revenda" a partir de um anúncio
  useEffect(() => {
    if (initialCost && initialCost > 0) {
      setCostPrice(initialCost);
      setSalePrice(Math.round(initialCost * 1.45 * 100) / 100);
    }
  }, [initialCost]);

  // Cálculos financeiros rigorosos
  const marketplaceFeeAmount = (salePrice * (tariffPercent / 100)) + fixedFee;
  const taxesAmount = salePrice * (taxesPercent / 100);
  const totalVariableCosts = marketplaceFeeAmount + taxesAmount + shippingCost + otherCosts;
  const totalCosts = costPrice + totalVariableCosts;
  const netProfit = salePrice - totalCosts;
  const netMarginPercent = salePrice > 0 ? (netProfit / salePrice) * 100 : 0;
  const markupPercent = costPrice > 0 ? (netProfit / costPrice) * 100 : 0;

  // Ponto de equilíbrio (preço mínimo de venda para cobrir custo sem lucro nem prejuízo)
  const combinedPercent = (tariffPercent + taxesPercent) / 100;
  const breakEvenPrice =
    combinedPercent < 1
      ? (costPrice + fixedFee + shippingCost + otherCosts) / (1 - combinedPercent)
      : 0;

  const handleApplyPreset = (preset: typeof TARIFF_PRESETS[0]) => {
    setTariffPercent(preset.percent);
    setFixedFee(preset.fixed);
  };

  const handleReset = () => {
    setCostPrice(100);
    setSalePrice(160);
    setTariffPercent(14);
    setFixedFee(6.0);
    setShippingCost(20.0);
    setTaxesPercent(6.0);
    setOtherCosts(5.0);
  };

  return (
    <div className="bg-[#0A1329] border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-6 shadow-xl">
      {/* Title & Context */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-lime-400/10 text-lime-400 border border-lime-400/20">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              Calculadora de Lucro e Margem para Revenda
              <span className="px-2 py-0.5 rounded text-[11px] bg-slate-800 text-lime-400 font-semibold border border-lime-400/20">
                Arbitragem
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              {productTitle ? (
                <span>
                  Baseado no produto:{' '}
                  <strong className="text-slate-200 truncate max-w-sm inline-block align-bottom">
                    {productTitle}
                  </strong>
                </span>
              ) : (
                'Simule o custo de aquisição, taxas da plataforma, envio e impostos para descobrir sua margem real.'
              )}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Redefinir valores
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Columns: Inputs (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Custo de Compra */}
            <div className="bg-[#060D1E] p-3.5 rounded-xl border border-slate-800 focus-within:border-lime-400/80 transition-colors">
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Custo de Aquisição (R$)
              </label>
              <div className="relative flex items-center">
                <span className="text-xs text-slate-500 font-bold mr-1.5">R$</span>
                <input
                  type="number"
                  min="0"
                  step="0.10"
                  value={costPrice || ''}
                  onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
                  className="w-full bg-transparent text-white font-mono font-bold text-base focus:outline-none"
                  placeholder="0,00"
                />
              </div>
              <span className="text-[10px] text-slate-400 block mt-1">
                Preço que você paga no fornecedor ou anúncio
              </span>
            </div>

            {/* Preço de Venda */}
            <div className="bg-[#060D1E] p-3.5 rounded-xl border border-lime-400/50 focus-within:border-lime-400 transition-colors">
              <label className="text-xs font-bold text-lime-400 block mb-1">
                Preço de Venda Pretendido (R$)
              </label>
              <div className="relative flex items-center">
                <span className="text-xs text-lime-400 font-bold mr-1.5">R$</span>
                <input
                  type="number"
                  min="0"
                  step="0.10"
                  value={salePrice || ''}
                  onChange={(e) => setSalePrice(parseFloat(e.target.value) || 0)}
                  className="w-full bg-transparent text-lime-300 font-mono font-bold text-base focus:outline-none"
                  placeholder="0,00"
                />
              </div>
              <span className="text-[10px] text-slate-400 block mt-1">
                Valor anunciado para o cliente final
              </span>
            </div>
          </div>

          {/* Presets de Taxa */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Taxas da Plataforma (Marketplace)
              </label>
              <span className="text-[11px] text-slate-400">Atalhos Mercado Livre</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TARIFF_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-all ${
                    tariffPercent === preset.percent && fixedFee === preset.fixed
                      ? 'bg-lime-400/20 border-lime-400 text-lime-300 font-bold'
                      : 'bg-[#060D1E] border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sub-inputs de taxas e custos adicionais */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#060D1E] p-2.5 rounded-xl border border-slate-800">
              <label className="text-[11px] text-slate-400 block mb-0.5">Comissão (%)</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={tariffPercent}
                onChange={(e) => setTariffPercent(parseFloat(e.target.value) || 0)}
                className="w-full bg-transparent text-white font-mono text-sm focus:outline-none"
              />
            </div>

            <div className="bg-[#060D1E] p-2.5 rounded-xl border border-slate-800">
              <label className="text-[11px] text-slate-400 block mb-0.5">Taxa Fixa (R$)</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={fixedFee}
                onChange={(e) => setFixedFee(parseFloat(e.target.value) || 0)}
                className="w-full bg-transparent text-white font-mono text-sm focus:outline-none"
              />
            </div>

            <div className="bg-[#060D1E] p-2.5 rounded-xl border border-slate-800">
              <label className="text-[11px] text-slate-400 block mb-0.5">Frete Envio (R$)</label>
              <input
                type="number"
                min="0"
                step="1"
                value={shippingCost}
                onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
                className="w-full bg-transparent text-white font-mono text-sm focus:outline-none"
              />
            </div>

            <div className="bg-[#060D1E] p-2.5 rounded-xl border border-slate-800">
              <label className="text-[11px] text-slate-400 block mb-0.5">Impostos (%)</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={taxesPercent}
                onChange={(e) => setTaxesPercent(parseFloat(e.target.value) || 0)}
                className="w-full bg-transparent text-white font-mono text-sm focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Right Columns: Results Cards (5 cols) */}
        <div className="lg:col-span-5 bg-[#070E22] border border-slate-800/90 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Demonstrativo de Resultado da Simulação
            </span>

            {/* Lucro Líquido Box */}
            <div
              className={`p-4 rounded-xl border ${
                netProfit > 0
                  ? 'bg-lime-400/10 border-lime-400/40 text-lime-300'
                  : 'bg-rose-500/10 border-rose-500/40 text-rose-300'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-semibold">
                <span>Lucro Líquido Real</span>
                <span className="font-bold text-xs uppercase">
                  {netProfit > 0 ? 'Margem Positiva' : 'Prejuízo Estimado'}
                </span>
              </div>
              <div className="text-3xl font-black tracking-tight mt-1">
                {formatCurrencyBRL(netProfit)}
              </div>
              <div className="flex items-center gap-4 mt-2 text-xs font-semibold">
                <span>
                  Margem Líquida:{' '}
                  <strong className={netProfit > 0 ? 'text-lime-400' : 'text-rose-400'}>
                    {netMarginPercent.toFixed(1)}%
                  </strong>
                </span>
                <span>
                  Markup:{' '}
                  <strong className="text-white">
                    {markupPercent.toFixed(1)}%
                  </strong>
                </span>
              </div>
            </div>

            {/* Financial Breakdown Table */}
            <div className="space-y-2 text-xs divide-y divide-slate-800/70 pt-1">
              <div className="flex justify-between pt-1 text-slate-300">
                <span>Faturamento Bruto:</span>
                <span className="font-mono font-semibold">{formatCurrencyBRL(salePrice)}</span>
              </div>
              <div className="flex justify-between pt-1 text-slate-400">
                <span>(-) Custo de Aquisição:</span>
                <span className="font-mono text-rose-300">{formatCurrencyBRL(costPrice)}</span>
              </div>
              <div className="flex justify-between pt-1 text-slate-400">
                <span>(-) Taxas da Plataforma:</span>
                <span className="font-mono text-rose-300">{formatCurrencyBRL(marketplaceFeeAmount)}</span>
              </div>
              <div className="flex justify-between pt-1 text-slate-400">
                <span>(-) Frete do Envio:</span>
                <span className="font-mono text-rose-300">{formatCurrencyBRL(shippingCost)}</span>
              </div>
              <div className="flex justify-between pt-1 text-slate-400">
                <span>(-) Impostos e Tributos:</span>
                <span className="font-mono text-rose-300">{formatCurrencyBRL(taxesAmount)}</span>
              </div>
              <div className="flex justify-between pt-2 font-bold text-slate-200">
                <span>Ponto de Equilíbrio (Break-even):</span>
                <span className="font-mono text-amber-300" title="Preço mínimo para não ter prejuízo">
                  {formatCurrencyBRL(breakEvenPrice)}
                </span>
              </div>
            </div>
          </div>

          {/* Strict Regulatory / Prudence Disclaimer */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-[11px] text-slate-400 flex items-start gap-2">
            <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-300 block mb-0.5">Aviso de Prudência:</strong>
              O AnPrice não estima volume de vendas, comissões futuras ou faturamento sem dados confiáveis e comprovados da plataforma. Esta calculadora é uma ferramenta matemática de simulação financeira para apoio à tomada de decisão.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

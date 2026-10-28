import React from 'react';
import { X, Sparkles, ShieldCheck, ArrowRight, Layers } from 'lucide-react';

interface DemoNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLive: () => void;
}

export const DemoNoticeModal: React.FC<DemoNoticeModalProps> = ({
  isOpen,
  onClose,
  onSwitchToLive,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0A1227] border border-amber-500/50 rounded-2xl shadow-2xl p-6 text-slate-100 space-y-4">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon & Title */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-400/20 text-amber-400 border border-amber-400/40 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              Anúncio de Demonstração
            </h3>
            <span className="text-xs text-amber-300 font-semibold">
              Ambiente de Teste Seguro
            </span>
          </div>
        </div>

        {/* Notice Body */}
        <div className="space-y-3 text-xs text-slate-300 leading-relaxed bg-[#060D1E] p-4 rounded-xl border border-slate-800">
          <p>
            Em conformidade com as diretrizes do AnPrice, <strong>não criamos links fictícios que simulem compras reais</strong> nem misturamos dados de teste com anúncios verdadeiros.
          </p>
          <p>
            Este item faz parte do catálogo de demonstração para você testar gratuitamente todas as funcionalidades do AnPrice:
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-400">
            <li>Cálculo de menor preço, média e mediana</li>
            <li>Filtros dinâmicos e ordenação</li>
            <li>Calculadora de margem e lucro de revenda</li>
            <li>Comparador de anúncios lado a lado</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-2 pt-2">
          <button
            type="button"
            onClick={() => {
              onSwitchToLive();
              onClose();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-lime-400/15"
          >
            <Layers className="w-4 h-4" />
            <span>Ir para API Oficial do Mercado Livre</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
          >
            Continuar no Modo Demonstração
          </button>
        </div>
      </div>
    </div>
  );
};

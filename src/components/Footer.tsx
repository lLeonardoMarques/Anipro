import React from 'react';
import { ShieldCheck, ExternalLink, HelpCircle, Layers, Heart } from 'lucide-react';

interface FooterProps {
  onOpenConfigModal: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenConfigModal }) => {
  return (
    <footer className="mt-16 bg-[#050A18] border-t border-slate-800/80 text-slate-400 text-xs py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-lime-400 text-slate-950 font-black flex items-center justify-center text-base">
                An
              </div>
              <span className="text-lg font-black text-white">
                An<span className="text-lime-400">Price</span>
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-lime-400 border border-lime-400/20 font-semibold">
                Análise de Preço
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-200">
              “Pesquise melhor. Pague menos.”
            </p>
            <p className="text-xs text-slate-400 leading-relaxed max-w-md">
              Ferramenta independente de pesquisa comparativa, análise de preços de mercado e apoio à tomada de decisão para consumidores, revendedores e afiliados do Mercado Livre.
            </p>
          </div>

          {/* Integração & Conformidade */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-lime-400" />
              Conformidade & API
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li>
                <button
                  type="button"
                  onClick={onOpenConfigModal}
                  className="hover:text-lime-400 text-left transition-colors"
                >
                  Configuração de Credenciais
                </button>
              </li>
              <li>
                <a
                  href="https://developers.mercadolivre.com.br"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-lime-400 flex items-center gap-1 transition-colors"
                >
                  <span>Portal Mercado Livre Devs</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>Proteção contra limites (Rate Limit 429)</li>
              <li>Sem web scraping não autorizado</li>
            </ul>
          </div>

          {/* Transparência e Termos */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Avisos Legais
            </h4>
            <p className="text-[11px] text-slate-400 leading-normal">
              O AnPrice não possui vínculo societário com o Mercado Livre. Os nomes, logotipos e marcas pertencem a seus respectivos titulares. Cálculos e simulações de margem são estimativas matemáticas baseadas nos dados fornecidos pelo usuário.
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
          <div>
            © {new Date().getFullYear()} AnPrice — Análise de Preço. Todos os direitos reservados.
          </div>
          <div className="flex items-center gap-1">
            <span>Desenvolvido com foco em velocidade, transparência e segurança.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

import React, { useState } from 'react';
import {
  X,
  Server,
  Lock,
  Layers,
  Sparkles,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  LogOut,
  HelpCircle,
} from 'lucide-react';
import { RenderServerStatus } from '../types/marketplace';
import { RenderApiService, RENDER_SERVER_ORIGIN } from '../services/renderApiService';

interface ApiConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  serverStatus: RenderServerStatus | null;
  isAdminLoggedIn: boolean;
  onOpenAdminLogin: () => void;
  onConnectMercadoLivre: () => void;
  isConnectingMl: boolean;
  onLogout: () => void;
  onRefreshStatus: () => void;
  onSelectDemoMode: () => void;
}

export const ApiConfigModal: React.FC<ApiConfigModalProps> = ({
  isOpen,
  onClose,
  serverStatus,
  isAdminLoggedIn,
  onOpenAdminLogin,
  onConnectMercadoLivre,
  isConnectingMl,
  onLogout,
  onRefreshStatus,
  onSelectDemoMode,
}) => {
  const [useProxy, setUseProxy] = useState<boolean>(RenderApiService.isUsingProxy());
  const [isRefreshing, setIsRefreshing] = useState(false);

  if (!isOpen) return null;

  const handleToggleProxy = (enable: boolean) => {
    setUseProxy(enable);
    RenderApiService.setUseProxy(enable);
    onRefreshStatus();
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await onRefreshStatus();
    setIsRefreshing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-[#0A1227] border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-[#080E21]">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-lime-400/10 text-lime-400 border border-lime-400/20">
              <Server className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Integração do Servidor AnPrice (Render)
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                {RENDER_SERVER_ORIGIN}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs sm:text-sm">
          {/* Status Geral das Rotas */}
          <div className="bg-[#0D1836] border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Status da Conexão em Tempo Real
              </span>
              <button
                type="button"
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="text-xs text-lime-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Atualizar Status</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-[#060D1E] p-3 rounded-lg border border-slate-800 space-y-1">
                <span className="text-slate-400 block text-[11px]">Sessão de Administrador:</span>
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      isAdminLoggedIn ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                    }`}
                  />
                  <strong className="text-white">
                    {isAdminLoggedIn ? 'Autenticado (Cookie Ativo)' : 'Não Autenticado'}
                  </strong>
                </div>
                {!isAdminLoggedIn ? (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenAdminLogin();
                      onClose();
                    }}
                    className="text-lime-400 underline font-semibold text-[11px] block pt-1"
                  >
                    Fazer login com senha
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      onLogout();
                      onClose();
                    }}
                    className="text-rose-400 hover:text-rose-300 font-semibold text-[11px] flex items-center gap-1 pt-1"
                  >
                    <LogOut className="w-3 h-3" />
                    Sair da sessão (POST /api/logout)
                  </button>
                )}
              </div>

              <div className="bg-[#060D1E] p-3 rounded-lg border border-slate-800 space-y-1">
                <span className="text-slate-400 block text-[11px]">Conta Mercado Livre:</span>
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      serverStatus?.conectado ? 'bg-emerald-400' : 'bg-amber-400'
                    }`}
                  />
                  <strong className="text-white">
                    {serverStatus?.conectado ? 'Conectada à API Oficial' : 'Desconectada'}
                  </strong>
                </div>
                {isAdminLoggedIn && !serverStatus?.conectado && (
                  <button
                    type="button"
                    onClick={() => {
                      onConnectMercadoLivre();
                      onClose();
                    }}
                    disabled={isConnectingMl}
                    className="text-amber-400 underline font-semibold text-[11px] flex items-center gap-1 pt-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Conectar Mercado Livre (OAuth)
                  </button>
                )}
              </div>
            </div>

            {serverStatus?.mensagem && (
              <p className="text-[11px] text-slate-300 bg-[#060D1E] p-2 rounded-lg border border-slate-800/80">
                Retorno do servidor: <span className="font-mono text-slate-200">{serverStatus.mensagem}</span>
              </p>
            )}
          </div>

          {/* Controle de Método de Transporte e Explicação de Cookies */}
          <div className="bg-[#0D1836] border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-lime-400" />
                Diagnóstico de Cookies de Terceiros e CORS
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-lime-400 font-mono">
                {useProxy ? 'Túnel /render-api' : 'Direto no Render'}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              O AnPrice envia <code className="font-mono text-lime-300">credentials: "include"</code> em todas as 5 rotas para que os cookies de sessão sejam preservados.
            </p>

            <div className="p-3 rounded-lg bg-[#060D1E] border border-slate-800 text-xs space-y-2">
              <strong className="text-amber-300 block">
                Se a sessão falhar com erro de rede ou 401 constante:
              </strong>
              <p className="text-slate-400 text-[11px] leading-normal">
                Navegadores atuais bloqueiam cookies cruzados entre domínios diferentes (como <code className="text-slate-300">run.app</code> e <code className="text-slate-300">onrender.com</code>). Para garantir funcionamento imediato sem alterar configurações do navegador, utilize o <strong>Modo Túnel Seguro</strong>.
              </p>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleToggleProxy(false)}
                  className={`py-2 px-3 rounded-lg border text-xs font-medium transition-colors ${
                    !useProxy
                      ? 'bg-lime-400/20 border-lime-400 text-lime-300 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Conexão Direta (Render)
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleProxy(true)}
                  className={`py-2 px-3 rounded-lg border text-xs font-medium transition-colors ${
                    useProxy
                      ? 'bg-lime-400/20 border-lime-400 text-lime-300 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Modo Túnel Seguro (Proxy)
                </button>
              </div>
            </div>
          </div>

          {/* Tabela de Rotas Integradas */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Mapeamento das 5 Rotas da API
            </h4>

            <div className="border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800/80 text-xs">
              <div className="p-2.5 bg-[#0C152D] flex items-center justify-between">
                <div>
                  <span className="font-mono font-bold text-emerald-400 mr-2">POST</span>
                  <span className="font-mono text-slate-200">/api/login</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Autentica com <code className="text-slate-300 font-mono">&#123; "password": senha &#125;</code>. Senha não persistida.
                  </p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  credentials: include
                </span>
              </div>

              <div className="p-2.5 bg-[#0C152D] flex items-center justify-between">
                <div>
                  <span className="font-mono font-bold text-blue-400 mr-2">GET</span>
                  <span className="font-mono text-slate-200">/api/status</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Verifica conexão da conta Mercado Livre e sessão.
                  </p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  credentials: include
                </span>
              </div>

              <div className="p-2.5 bg-[#0C152D] flex items-center justify-between">
                <div>
                  <span className="font-mono font-bold text-emerald-400 mr-2">POST</span>
                  <span className="font-mono text-slate-200">/api/auth/iniciar</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Obtém URL para autorização na mesma janela.
                  </p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  credentials: include
                </span>
              </div>

              <div className="p-2.5 bg-[#0C152D] flex items-center justify-between">
                <div>
                  <span className="font-mono font-bold text-blue-400 mr-2">GET</span>
                  <span className="font-mono text-slate-200">/api/buscar?q=termo</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Retorna consulta, consultadoEm, resultados e totalInformado.
                  </p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  credentials: include
                </span>
              </div>

              <div className="p-2.5 bg-[#0C152D] flex items-center justify-between">
                <div>
                  <span className="font-mono font-bold text-rose-400 mr-2">POST</span>
                  <span className="font-mono text-slate-200">/api/logout</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Encerra a sessão administrativa ativa no servidor.
                  </p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  credentials: include
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#080E21] flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              onSelectDemoMode();
              onClose();
            }}
            className="flex items-center gap-1.5 text-xs text-amber-300 hover:text-amber-200 font-semibold px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Alternar para Modo Demonstração
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

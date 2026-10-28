import React from 'react';
import {
  TrendingUp,
  Key,
  Heart,
  Sparkles,
  Layers,
  ArrowRightLeft,
  Lock,
  LogOut,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Server,
} from 'lucide-react';
import { ApiStatusResponse, RenderServerStatus } from '../types/marketplace';

interface HeaderProps {
  appMode: 'live' | 'demo';
  onToggleAppMode: (mode: 'live' | 'demo') => void;
  apiStatus: ApiStatusResponse | null;
  serverStatus: RenderServerStatus | null;
  isAdminLoggedIn: boolean;
  onOpenAdminLogin: () => void;
  onConnectMercadoLivre: () => void;
  isConnectingMl: boolean;
  onLogout: () => void;
  onOpenConfigModal: () => void;
  onOpenFavoritesModal: () => void;
  favoritesCount: number;
  viewMode: 'consumer' | 'reseller';
  onToggleViewMode: (view: 'consumer' | 'reseller') => void;
  compareCount: number;
  onOpenCompareModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  appMode,
  onToggleAppMode,
  apiStatus,
  serverStatus,
  isAdminLoggedIn,
  onOpenAdminLogin,
  onConnectMercadoLivre,
  isConnectingMl,
  onLogout,
  onOpenConfigModal,
  onOpenFavoritesModal,
  favoritesCount,
  viewMode,
  onToggleViewMode,
  compareCount,
  onOpenCompareModal,
}) => {
  const isMlConnected = Boolean(serverStatus?.conectado);

  return (
    <header className="sticky top-0 z-40 bg-[#070D1E]/95 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Slogan */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-lime-400 to-lime-600 flex items-center justify-center shadow-lg shadow-lime-500/20 text-slate-950 font-black text-xl tracking-tight">
              An
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-extrabold text-white tracking-tight">
                  An<span className="text-lime-400">Price</span>
                </span>
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-slate-800 text-lime-400 border border-lime-400/30 rounded-md">
                  Análise de Preço
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium tracking-wide hidden sm:block">
                Pesquise melhor. Pague menos.
              </p>
            </div>
          </div>

          {/* Controls: Mode, Server Auth, Resale View, API Status, Favorites */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mode Switcher: Demo vs Servidor Render (Mercado Livre) */}
            <div className="bg-slate-900/90 p-1 rounded-xl border border-slate-800 flex items-center text-xs">
              <button
                type="button"
                onClick={() => onToggleAppMode('demo')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                  appMode === 'demo'
                    ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Modo Demonstração com dados fictícios para testes seguros"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden md:inline">Modo</span> Demonstração
              </button>

              <button
                type="button"
                onClick={() => onToggleAppMode('live')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                  appMode === 'live'
                    ? 'bg-lime-400 text-slate-950 font-semibold shadow-md shadow-lime-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Conectar com o servidor oficial do AnPrice no Render"
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Servidor</span> Render
              </button>
            </div>

            {/* Admin Session & ML Connection Controls (Active in Live mode) */}
            {appMode === 'live' && (
              <div className="flex items-center gap-2">
                {!isAdminLoggedIn ? (
                  <button
                    type="button"
                    onClick={onOpenAdminLogin}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-lime-400 hover:bg-lime-300 text-slate-950 transition-colors shadow-sm shadow-lime-400/10"
                    title="Entrar com a senha de administrador do servidor"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Login Admin</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    {/* ML Connection Status & Connect Button */}
                    {isMlConnected ? (
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="hidden sm:inline">Mercado Livre</span> Conectado
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={onConnectMercadoLivre}
                        disabled={isConnectingMl}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 transition-all shadow-md shadow-amber-400/20"
                        title="Iniciar autorização OAuth oficial com o Mercado Livre"
                      >
                        {isConnectingMl ? (
                          <div className="w-3 h-3 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <ExternalLink className="w-3.5 h-3.5" />
                        )}
                        <span>Conectar Mercado Livre</span>
                      </button>
                    )}

                    {/* Logout Button */}
                    <button
                      type="button"
                      onClick={onLogout}
                      className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-slate-700 transition-colors"
                      title="Sair da sessão administrativa (POST /api/logout)"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* View Mode: Consumidor vs Revendedor */}
            <button
              type="button"
              onClick={() => onToggleViewMode(viewMode === 'consumer' ? 'reseller' : 'consumer')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                viewMode === 'reseller'
                  ? 'bg-lime-400/15 border-lime-400/50 text-lime-400 shadow-sm shadow-lime-400/10'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-lime-400" />
              <span className="hidden lg:inline">Visão:</span>{' '}
              {viewMode === 'reseller' ? 'Modo Revenda' : 'Consumidor'}
            </button>

            {/* Comparador Quick Trigger */}
            {compareCount > 0 && (
              <button
                type="button"
                onClick={onOpenCompareModal}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-blue-600/20 border border-blue-500/40 text-blue-300 hover:bg-blue-600/30 transition-all"
                title="Comparar anúncios selecionados"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Comparar ({compareCount})</span>
              </button>
            )}

            {/* Favorites Button */}
            <button
              type="button"
              onClick={onOpenFavoritesModal}
              className="relative p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-rose-400 hover:border-slate-700 transition-colors"
              title="Ver anúncios favoritados"
            >
              <Heart className="w-4 h-4" />
              {favoritesCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                  {favoritesCount}
                </span>
              )}
            </button>

            {/* Server Settings & Status Modal */}
            <button
              type="button"
              onClick={onOpenConfigModal}
              className={`p-2 rounded-xl border transition-colors ${
                isAdminLoggedIn && isMlConnected
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-lime-400'
              }`}
              title="Configurações e rotas da API no Render"
            >
              <Server className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Demo Mode Notice Banner */}
        {appMode === 'demo' && (
          <div className="pb-2.5">
            <div className="bg-amber-950/40 border border-amber-600/40 rounded-lg px-3 py-1.5 text-xs text-amber-200/90 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>
                  <strong>Modo Demonstração Ativo:</strong> Exibindo catálogo de simulação. Para buscar dados reais do Mercado Livre, alterne para <strong>Servidor Render</strong>.
                </span>
              </div>
              <button
                type="button"
                onClick={() => onToggleAppMode('live')}
                className="text-amber-300 underline font-semibold hover:text-amber-100 text-[11px] ml-2 shrink-0"
              >
                Ativar Servidor Render
              </button>
            </div>
          </div>
        )}

        {/* Live Mode Notice Banner when Admin is NOT logged in or ML disconnected */}
        {appMode === 'live' && !isAdminLoggedIn && (
          <div className="pb-2.5">
            <div className="bg-blue-950/40 border border-blue-500/40 rounded-lg px-3 py-1.5 text-xs text-blue-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-blue-400" />
                <span>
                  <strong>Servidor Render Conectado (anprice-servidor.onrender.com):</strong> É necessário fazer login de administrador para consultar status e buscar anúncios reais.
                </span>
              </div>
              <button
                type="button"
                onClick={onOpenAdminLogin}
                className="text-lime-300 underline font-bold hover:text-lime-200 text-xs ml-2 shrink-0"
              >
                Fazer Login de Admin
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

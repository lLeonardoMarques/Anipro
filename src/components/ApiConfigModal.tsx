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
import { RenderApiService, DiagnosticoEndpoint } from '../services/renderApiService';

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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [diagnostico, setDiagnostico] = useState<DiagnosticoEndpoint[] | null>(null);
  const [diagnosticoErro, setDiagnosticoErro] = useState<string | null>(null);
  const [diagnosticando, setDiagnosticando] = useState(false);
  const [referencia, setReferencia] = useState('');

  if (!isOpen) return null;

  const handleDiagnostico = async () => {
    setDiagnosticando(true);
    setDiagnosticoErro(null);
    const r = await RenderApiService.diagnosticarEndpoints(referencia);
    if (r.success) setDiagnostico(r.resultados || []);
    else setDiagnosticoErro(r.error || 'Não foi possível executar o diagnóstico.');
    setDiagnosticando(false);
  };

  const rotuloCodigo = (codigo: string) => {
    if (codigo === 'OK') return { texto: 'Liberado', cor: 'text-emerald-400' };
    if (codigo === 'ML_BLOQUEADO_POLITICA') return { texto: 'Bloqueado (política)', cor: 'text-rose-400' };
    if (codigo === 'ML_SEM_PERMISSAO') return { texto: 'Sem permissão', cor: 'text-rose-400' };
    if (codigo === 'NAO_TESTADO') return { texto: 'Não testado', cor: 'text-slate-500' };
    if (codigo === 'ML_NAO_ENCONTRADO') return { texto: 'Não encontrado', cor: 'text-amber-400' };
    return { texto: codigo, cor: 'text-amber-400' };
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
                Integração do Servidor AnPrice
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                {window.location.origin}
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
                    {isAdminLoggedIn ? 'Autenticado' : 'Não Autenticado'}
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
                {isAdminLoggedIn && (
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
                    {serverStatus?.conectado ? 'Reconectar Mercado Livre (OAuth)' : 'Conectar Mercado Livre (OAuth)'}
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

          {/* Diagnóstico de acesso à API do Mercado Livre */}
          <div className="bg-[#0D1836] border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-lime-400" />
                Diagnóstico da API do Mercado Livre
              </span>
              <button
                type="button"
                onClick={handleDiagnostico}
                disabled={!isAdminLoggedIn || !serverStatus?.conectado || diagnosticando || serverStatus?.diagnosticoAtivo === false}
                className="text-xs px-3 py-1.5 rounded-lg bg-lime-400 text-slate-950 font-bold disabled:opacity-40 flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3 h-3 ${diagnosticando ? 'animate-spin' : ''}`} />
                {diagnosticando ? 'Testando...' : 'Executar diagnóstico'}
              </button>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Testa, com o token salvo no servidor, quais endpoints oficiais estão liberados para esta aplicação.
              Só status e códigos são exibidos — nenhum dado de anúncio ou token sai do servidor.
              {serverStatus?.diagnosticoAtivo === false && ' (Desativado no servidor.)'}
            </p>

            <label className="block space-y-1">
              <span className="text-[11px] font-semibold text-slate-300">
                Link de um anúncio do Mercado Livre (opcional)
              </span>
              <input
                type="text"
                value={referencia}
                onChange={(e) => setReferencia(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !diagnosticando) handleDiagnostico();
                }}
                placeholder="https://produto.mercadolivre.com.br/MLB-... ou MLB1234567890"
                className="w-full bg-[#060D1E] border border-slate-700 focus:border-lime-400 rounded-lg px-3 py-2 text-[11px] text-white placeholder-slate-500 focus:outline-none font-mono"
              />
              <span className="text-[10px] text-slate-500 block">
                Com a busca bloqueada, o link permite testar as consultas por anúncio, produto e vendedor.
              </span>
            </label>

            {diagnosticoErro && (
              <p className="text-[11px] text-rose-300 bg-rose-950/30 p-2 rounded-lg border border-rose-500/30">{diagnosticoErro}</p>
            )}

            {diagnostico && (
              <div className="border border-slate-800 rounded-lg overflow-hidden divide-y divide-slate-800/80 text-[11px]">
                {diagnostico.map((d) => {
                  const r = rotuloCodigo(d.codigo);
                  return (
                    <div key={d.endpoint} className="p-2 bg-[#060D1E] flex items-center justify-between gap-2">
                      <span className="font-mono text-slate-200 break-all">{d.endpoint}</span>
                      <span className={`font-semibold whitespace-nowrap ${r.cor}`}>
                        {d.status ?? '—'} · {r.texto}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tabela de Rotas Integradas */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Rotas da API
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
                  mesma origem
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
                  mesma origem
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
                  mesma origem
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
                  mesma origem
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
                  mesma origem
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

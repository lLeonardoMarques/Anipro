import React, { useState } from 'react';
import {
  X,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertTriangle,
  Server,
  Info,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { RenderApiService, RENDER_SERVER_ORIGIN } from '../services/renderApiService';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
  initialError?: string | null;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  initialError,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(initialError || null);
  const [isCookieIssue, setIsCookieIssue] = useState(false);
  const [useProxy, setUseProxy] = useState<boolean>(RenderApiService.isUsingProxy());

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setErrorMessage('Por favor, informe a senha de administrador.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setIsCookieIssue(false);

    try {
      const result = await RenderApiService.login(password);

      // Limpa imediatamente a senha da memória (NÃO salva em localStorage ou arquivos)
      setPassword('');

      if (result.success) {
        onLoginSuccess();
        onClose();
      } else {
        setErrorMessage(result.error || 'Falha ao autenticar.');
        if (result.isCookieOrCorsIssue) {
          setIsCookieIssue(true);
        }
      }
    } catch (err: any) {
      setPassword('');
      setErrorMessage(`Erro ao enviar autenticação: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleProxy = (enabled: boolean) => {
    setUseProxy(enabled);
    RenderApiService.setUseProxy(enabled);
    setErrorMessage(null);
    setIsCookieIssue(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0A1227] border border-slate-700/80 rounded-2xl shadow-2xl p-6 sm:p-7 text-slate-100 space-y-6">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-lime-400/20 text-lime-400 border border-lime-400/30 flex items-center justify-center shrink-0">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Acesso do Administrador
            </h2>
            <p className="text-xs text-slate-400">
              Conexão com <span className="font-mono text-lime-300">anprice-servidor.onrender.com</span>
            </p>
          </div>
        </div>

        {/* Security Rule Badge */}
        <div className="bg-[#060D1E] p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-lime-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-slate-200 block mb-0.5">Segurança & Privacidade:</strong>
            Sua senha é enviada via HTTPS via rota segura <code className="text-lime-300 font-mono">POST /api/login</code> e <strong>nunca é armazenada no código, no localStorage ou em arquivos</strong>. A sessão é mantida por cookie com <code className="text-slate-300 font-mono">credentials: "include"</code>.
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="bg-rose-950/40 border border-rose-500/50 rounded-xl p-3.5 text-xs text-rose-200 space-y-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-rose-100 block mb-0.5">Aviso de Acesso:</strong>
                <span>{errorMessage}</span>
              </div>
            </div>

            {/* Explanation of Third-Party Cookies Blocking */}
            {isCookieIssue && (
              <div className="bg-black/30 p-2.5 rounded-lg border border-rose-500/20 text-[11px] text-slate-300 space-y-1.5 mt-2">
                <strong className="text-amber-300 block">
                  Por que isso acontece? (Bloqueio de Cookies entre Domínios)
                </strong>
                <p>
                  A interface web atual e o servidor <code className="font-mono text-amber-200">{RENDER_SERVER_ORIGIN}</code> estão em domínios diferentes. Navegadores modernos (Chrome, Safari, Firefox) bloqueiam cookies de terceiros por padrão ou exigem cabeçalhos CORS explícitos (<code className="font-mono text-slate-200">Access-Control-Allow-Credentials: true</code>).
                </p>
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => handleToggleProxy(true)}
                    className="w-full py-1.5 px-3 rounded-lg bg-lime-400 hover:bg-lime-300 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Server className="w-3.5 h-3.5" />
                    Ativar Modo Túnel Seguro (Resolve o bloqueio de cookies)
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Senha do Administrador
            </label>
            <div className="relative flex items-center">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite a senha configurada no servidor..."
                autoFocus
                disabled={isLoading}
                className="w-full bg-[#060D1E] border border-slate-700 focus:border-lime-400 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none pr-10 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-slate-400 hover:text-white"
                title={showPassword ? 'Ocultar senha' : 'Ver senha'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            <span className="text-[10px] text-slate-400 block mt-1">
              A senha será limpa da memória imediatamente após o envio.
            </span>
          </div>

          {/* Connection Mode Toggle (Direct vs Tunnel) */}
          <div className="bg-[#070E22] p-3 rounded-xl border border-slate-800 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-lime-400" />
                Método de Conexão:
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {useProxy ? 'Túnel /render-api' : 'Direto no Render'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleToggleProxy(false)}
                className={`py-1.5 px-2 rounded-lg border text-xs font-medium transition-colors ${
                  !useProxy
                    ? 'bg-lime-400/20 border-lime-400 text-lime-300 font-bold'
                    : 'bg-[#060D1E] border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Conexão Direta
              </button>

              <button
                type="button"
                onClick={() => handleToggleProxy(true)}
                className={`py-1.5 px-2 rounded-lg border text-xs font-medium transition-colors ${
                  useProxy
                    ? 'bg-lime-400/20 border-lime-400 text-lime-300 font-bold'
                    : 'bg-[#060D1E] border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Túnel Seguro (Anti-CORS)
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !password}
            className="w-full py-3 px-4 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-lime-400/15 disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Autenticando no Render...</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Entrar como Administrador</span>
              </>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="text-center pt-1 border-t border-slate-800/80">
          <p className="text-[11px] text-slate-400">
            Após o login, o AnPrice verificará o status da conta do Mercado Livre em <code className="text-slate-300">GET /api/status</code>.
          </p>
        </div>
      </div>
    </div>
  );
};

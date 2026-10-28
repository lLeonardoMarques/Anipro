import React, { useState } from 'react';
import {
  X,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertTriangle,
  Info,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { RenderApiService } from '../services/renderApiService';

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
  const [isServerWaking, setIsServerWaking] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setErrorMessage('Por favor, informe a senha de administrador.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setIsServerWaking(false);

    try {
      const result = await RenderApiService.login(password);

      // Limpa imediatamente a senha da memória (NÃO salva em localStorage ou arquivos)
      setPassword('');

      if (result.success) {
        onLoginSuccess();
        onClose();
      } else {
        setErrorMessage(result.error || 'Falha ao autenticar.');
        setIsServerWaking(Boolean(result.servidorInacessivel));
      }
    } catch (err: any) {
      setPassword('');
      setErrorMessage(`Erro ao enviar autenticação: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
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
              Servidor AnPrice · <span className="font-mono text-lime-300">{window.location.host}</span>
            </p>
          </div>
        </div>

        {/* Security Rule Badge */}
        <div className="bg-[#060D1E] p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-lime-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-slate-200 block mb-0.5">Segurança & Privacidade:</strong>
            Sua senha é enviada via HTTPS via rota segura <code className="text-lime-300 font-mono">POST /api/login</code> e <strong>nunca é armazenada no código, no localStorage ou em arquivos</strong>. A sessão é mantida por um cookie <code className="text-slate-300 font-mono">HttpOnly</code> do próprio site.
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

            {isServerWaking && (
              <p className="text-[11px] text-slate-300 bg-black/30 p-2.5 rounded-lg border border-rose-500/20">
                Dica: abra <code className="font-mono text-amber-200">/health</code> neste mesmo endereço, aguarde a resposta e tente entrar de novo.
              </p>
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

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !password}
            className="w-full py-3 px-4 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-lime-400/15 disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Autenticando...</span>
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

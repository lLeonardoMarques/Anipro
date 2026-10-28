/**
 * AnPrice — Formatadores e Utilitários de Apresentação
 */

export function formatCurrencyBRL(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return 'Informação indisponível';
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDateTimeBR(isoString: string | null | undefined): string {
  if (!isoString) return 'Data não disponível';
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  } catch {
    return isoString;
  }
}

export function getConditionLabel(condition: string | null | undefined): string {
  switch (condition) {
    case 'new':
      return 'Novo';
    case 'used':
      return 'Usado';
    case 'reconditioned':
      return 'Recondicionado';
    default:
      return 'Não informado';
  }
}

export function getReputationBadge(powerStatus: string | null | undefined, repLevel: string | null | undefined): {
  label: string;
  colorClass: string;
} {
  if (powerStatus === 'platinum') {
    return {
      label: 'MercadoLíder Platinum',
      colorClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    };
  }
  if (powerStatus === 'gold') {
    return {
      label: 'MercadoLíder Gold',
      colorClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    };
  }
  if (powerStatus === 'silver') {
    return {
      label: 'MercadoLíder',
      colorClass: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    };
  }
  if (repLevel === 'green') {
    return {
      label: 'Reputação Verde (Excelente)',
      colorClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    };
  }
  if (repLevel === 'yellow') {
    return {
      label: 'Reputação Amarela (Atenção)',
      colorClass: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
    };
  }
  if (repLevel === 'orange' || repLevel === 'red') {
    return {
      label: 'Reputação Baixa',
      colorClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    };
  }
  return {
    label: 'Vendedor Comum',
    colorClass: 'bg-slate-700/40 text-slate-400 border-slate-700',
  };
}

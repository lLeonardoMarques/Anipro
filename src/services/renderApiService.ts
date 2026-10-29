/**
 * AnPrice — Serviço de Integração com o Servidor
 *
 * Arquitetura (mesma origem):
 *  - Produção: o servidor do Render entrega este frontend E a API.
 *    As chamadas usam caminhos relativos (/api/...), sem CORS e com
 *    cookie de sessão de primeira parte (SameSite=Lax).
 *  - Desenvolvimento (npm run dev): o Vite encaminha /api e /auth para
 *    o servidor (vite.config.ts). O navegador continua vendo uma única origem.
 *
 * Rotas:
 *  POST /api/login                - { password } → cookie de sessão
 *  GET  /api/status               - { conectado, diagnosticoAtivo }
 *  POST /api/auth/iniciar         - { url } para autorizar no Mercado Livre
 *  GET  /api/buscar?q=            - { consulta, consultadoEm, fonte, resultados, totalInformado }
 *  POST /api/logout
 *  GET  /api/diagnostico/endpoints - status de cada endpoint do Mercado Livre (temporário)
 *
 * Erros do servidor sempre trazem { codigo, erro }. A interface decide pelo
 * `codigo`, nunca só pelo status HTTP.
 */

import {
  MarketplaceProduct,
  RenderServerStatus,
  RenderSearchResponse,
  RenderAuthResponse,
} from '../types/marketplace';

// Endereço público do servidor (exibição e documentação).
export const RENDER_SERVER_ORIGIN = 'https://anprice-servidor.onrender.com';

// Base das chamadas: relativa à origem atual, respeitando o `base` do Vite.
const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

export interface ApiErro {
  codigo?: string;
  error?: string;
  detalhes?: string;
  servidorInacessivel?: boolean;
}

export interface DiagnosticoEndpoint {
  endpoint: string;
  status: number | null;
  codigo: string;
  politica: string | null;
}

const CODIGOS_SESSAO = new Set(['SESSAO_AUSENTE', 'SESSAO_EXPIRADA']);

const MSG_SERVIDOR_INACESSIVEL =
  'Não foi possível contatar o servidor. No plano gratuito do Render ele pode levar até 1 minuto para iniciar — aguarde e tente novamente.';

async function lerErro(response: Response): Promise<ApiErro> {
  const data: any = await response.json().catch(() => null);
  if (data && typeof data === 'object' && typeof data.codigo === 'string') {
    const partes: string[] = [];
    if (data.statusMercadoLivre) partes.push(`Mercado Livre HTTP ${data.statusMercadoLivre}`);
    if (data.politica) partes.push(`política: ${data.politica}`);
    if (Array.isArray(data.tentativas) && data.tentativas.length) {
      partes.push(
        'tentativas: ' +
          data.tentativas
            .map((t: any) => `${t.endpoint} → ${t.status ?? ''} ${t.codigo}`.replace('  ', ' '))
            .join(' · ')
      );
    }
    return {
      codigo: data.codigo,
      error: data.erro || data.codigo,
      detalhes: partes.length ? partes.join(' | ') : undefined,
    };
  }
  // Resposta sem o formato do AnPrice: proxy, gateway ou servidor iniciando.
  if (response.status >= 502 && response.status <= 504) {
    return { codigo: 'SERVIDOR_INDISPONIVEL', error: MSG_SERVIDOR_INACESSIVEL, servidorInacessivel: true };
  }
  return { codigo: 'RESPOSTA_INESPERADA', error: `O servidor respondeu com status ${response.status}.` };
}

function erroDeRede(): ApiErro {
  return { codigo: 'SERVIDOR_INACESSIVEL', error: MSG_SERVIDOR_INACESSIVEL, servidorInacessivel: true };
}

async function chamar(caminho: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${API_BASE}${caminho}`, {
    credentials: 'same-origin',
    ...init,
    headers: { Accept: 'application/json', ...(init.headers || {}) },
  });
}

export class RenderApiService {
  /** POST /api/login — a senha não é guardada em lugar nenhum do navegador. */
  public static async login(password: string): Promise<{ success: boolean } & ApiErro> {
    try {
      const response = await chamar('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (response.ok) return { success: true };
      return { success: false, ...(await lerErro(response)) };
    } catch {
      return { success: false, ...erroDeRede() };
    }
  }

  /** GET /api/status */
  public static async getStatus(): Promise<
    { success: boolean; status?: RenderServerStatus; unauthorized?: boolean } & ApiErro
  > {
    try {
      const response = await chamar('/api/status');
      if (!response.ok) {
        const e = await lerErro(response);
        const unauthorized = CODIGOS_SESSAO.has(e.codigo || '');
        return {
          success: false,
          unauthorized,
          ...e,
          status: unauthorized
            ? { conectado: false, adminLogado: false, mensagem: e.error }
            : undefined,
        };
      }
      const data = await response.json();
      const conectado = data.conectado === true;
      return {
        success: true,
        status: {
          conectado,
          adminLogado: true,
          usuario: null,
          diagnosticoAtivo: data.diagnosticoAtivo !== false,
          mensagem: conectado
            ? 'Conta do Mercado Livre conectada.'
            : 'Conta do Mercado Livre desconectada.',
          raw: data,
        },
      };
    } catch {
      return { success: false, ...erroDeRede() };
    }
  }

  /** POST /api/auth/iniciar — devolve a URL de autorização do Mercado Livre. */
  public static async iniciarAuthMercadoLivre(): Promise<
    { success: boolean; url?: string; unauthorized?: boolean } & ApiErro
  > {
    try {
      const response = await chamar('/api/auth/iniciar', { method: 'POST' });
      if (!response.ok) {
        const e = await lerErro(response);
        return { success: false, unauthorized: CODIGOS_SESSAO.has(e.codigo || ''), ...e };
      }
      const data: RenderAuthResponse = await response.json();
      if (!data.url) {
        return { success: false, error: 'O servidor não retornou a URL de autorização.' };
      }
      return { success: true, url: data.url };
    } catch {
      return { success: false, ...erroDeRede() };
    }
  }

  /** GET /api/buscar?q= */
  public static async buscar(termo: string): Promise<
    {
      success: boolean;
      data?: RenderSearchResponse;
      products: MarketplaceProduct[];
      unauthorized?: boolean;
    } & ApiErro
  > {
    try {
      const response = await chamar(`/api/buscar?q=${encodeURIComponent(termo.trim())}`);
      if (!response.ok) {
        const e = await lerErro(response);
        return { success: false, products: [], unauthorized: CODIGOS_SESSAO.has(e.codigo || ''), ...e };
      }
      const data: RenderSearchResponse = await response.json();
      const rawItems = Array.isArray(data.resultados) ? data.resultados : [];
      const queryDate = data.consultadoEm || new Date().toISOString();
      return {
        success: true,
        data,
        products: rawItems.map((item, index) => this.mapRenderItemToProduct(item, index, queryDate)),
      };
    } catch {
      return { success: false, products: [], ...erroDeRede() };
    }
  }

  /** POST /api/logout */
  public static async logout(): Promise<{ success: boolean } & ApiErro> {
    try {
      const response = await chamar('/api/logout', { method: 'POST' });
      if (!response.ok) return { success: false, ...(await lerErro(response)) };
      return { success: true };
    } catch {
      return { success: false, ...erroDeRede() };
    }
  }

  /** GET /api/diagnostico/endpoints[?ref=link-ou-código] — só status e códigos, sem dados. */
  public static async diagnosticarEndpoints(referencia?: string): Promise<
    { success: boolean; resultados?: DiagnosticoEndpoint[]; executadoEm?: string } & ApiErro
  > {
    try {
      const ref = (referencia || '').trim();
      const response = await chamar(
        '/api/diagnostico/endpoints' + (ref ? `?ref=${encodeURIComponent(ref)}` : '')
      );
      if (!response.ok) return { success: false, ...(await lerErro(response)) };
      const data = await response.json();
      return { success: true, resultados: data.resultados || [], executadoEm: data.executadoEm };
    } catch {
      return { success: false, ...erroDeRede() };
    }
  }

  /**
   * Converte itens de /api/buscar para MarketplaceProduct.
   * Regra: não inventa dados. Campo ausente → null/vazio.
   */
  public static mapRenderItemToProduct(
    item: any,
    index: number,
    queryDate: string
  ): MarketplaceProduct {
    const title = item.titulo || item.title || item.nome || 'Informação indisponível';

    let price = 0;
    if (typeof item.preco === 'number') price = item.preco;
    else if (typeof item.price === 'number') price = item.price;
    else if (typeof item.valor === 'number') price = item.valor;
    else if (typeof item.preco === 'string') price = parseFloat(item.preco.replace(',', '.')) || 0;

    const originalPrice =
      typeof item.precoOriginal === 'number'
        ? item.precoOriginal
        : typeof item.original_price === 'number'
        ? item.original_price
        : null;

    let condition: MarketplaceProduct['condition'] = 'not_specified';
    const condStr = String(item.condicao || item.condition || '').toLowerCase();
    if (condStr.includes('novo') || condStr === 'new') condition = 'new';
    else if (condStr.includes('usado') || condStr === 'used') condition = 'used';
    else if (condStr.includes('recondicionado') || condStr === 'refurbished') condition = 'reconditioned';

    const thumbnail = String(
      item.imagem || item.thumbnail || item.thumbnailUrl || item.foto || item.pictures?.[0]?.url || ''
    ).replace(/^http:\/\//, 'https://');

    const permalink = item.link || item.permalink || item.url || '';

    let sellerName = 'Informação indisponível';
    let sellerReputation: MarketplaceProduct['seller']['reputationLevel'] = null;
    let sellerPowerStatus: MarketplaceProduct['seller']['powerSellerStatus'] = null;
    let sellerCity: string | null = item.address?.city_name || null;
    let sellerState: string | null = item.address?.state_name || null;
    let sellerRatingPercent: number | null = null;
    let sellerTransactions: number | null = null;

    if (typeof item.vendedor === 'string') {
      sellerName = item.vendedor;
    } else if (item.vendedor && typeof item.vendedor === 'object') {
      sellerName = item.vendedor.nome || item.vendedor.nickname || 'Informação indisponível';
      sellerCity = item.vendedor.cidade || item.vendedor.city || sellerCity;
      sellerState = item.vendedor.estado || item.vendedor.state || sellerState;
      if (item.vendedor.reputacao) sellerReputation = item.vendedor.reputacao;
      if (item.vendedor.nivel) sellerPowerStatus = item.vendedor.nivel;
      if (typeof item.vendedor.positivas === 'number') sellerRatingPercent = item.vendedor.positivas;
    } else if (item.seller && typeof item.seller === 'object') {
      sellerName =
        item.seller.nickname ||
        item.seller.name ||
        (item.seller.id ? `Vendedor ${item.seller.id}` : 'Informação indisponível');
      const rep = item.seller.seller_reputation;
      if (rep) {
        const level = String(rep.level_id || '');
        if (level.includes('green')) sellerReputation = 'green';
        else if (level.includes('yellow')) sellerReputation = 'yellow';
        else if (level.includes('orange')) sellerReputation = 'orange';
        else if (level.includes('red')) sellerReputation = 'red';
        if (['platinum', 'gold', 'silver'].includes(rep.power_seller_status)) {
          sellerPowerStatus = rep.power_seller_status;
        }
        if (typeof rep.metrics?.sales?.completed === 'number') {
          sellerTransactions = rep.metrics.sales.completed;
        }
      }
    }

    let freeShipping = false;
    let shippingTag: string | null = null;
    let shippingCost: number | null = null;

    if (item.freteGratis === true || item.frete_gratis === true || item.shipping?.free_shipping === true) {
      freeShipping = true;
      shippingCost = 0;
    } else if (typeof item.custoFrete === 'number') {
      shippingCost = item.custoFrete;
    } else if (typeof item.frete === 'string' && item.frete.toLowerCase().includes('grátis')) {
      freeShipping = true;
      shippingCost = 0;
    }

    if (item.full === true || item.shipping?.logistic_type === 'fulfillment') {
      shippingTag = 'Mercado Envios Full';
    }

    let installments = null;
    if (item.parcelamento && typeof item.parcelamento === 'object') {
      installments = {
        quantity: item.parcelamento.quantidade || item.parcelamento.quantity || 1,
        amount: item.parcelamento.valor || item.parcelamento.amount || price,
        rate: item.parcelamento.taxa || item.parcelamento.rate || 0,
      };
    } else if (item.installments) {
      installments = {
        quantity: item.installments.quantity || 1,
        amount: item.installments.amount || price,
        rate: item.installments.rate || 0,
      };
    }

    const attributes = Array.isArray(item.atributos)
      ? item.atributos.map((a: any, i: number) => ({
          id: a.id || a.nome || `attr-${i}`,
          name: a.nome || a.name || 'Característica',
          value_name: a.valor || a.value_name || null,
        }))
      : Array.isArray(item.attributes)
      ? item.attributes.map((a: any) => ({
          id: a.id || a.name,
          name: a.name,
          value_name: a.value_name ?? null,
        }))
      : [];

    return {
      id: String(item.id || item.codigo || `item-${index}`),
      marketplace: 'mercadolivre',
      title,
      price,
      originalPrice,
      currencyId: item.moeda || item.currency_id || item.currencyId || 'BRL',
      condition,
      thumbnail,
      permalink,
      isDemo: false,
      availableQuantity: item.estoqueDisponivel ?? item.available_quantity ?? null,
      soldQuantity: item.quantidadeVendida ?? item.sold_quantity ?? null,
      seller: {
        id: String(item.vendedorId || item.seller?.id || ''),
        name: sellerName,
        reputationLevel: sellerReputation,
        powerSellerStatus: sellerPowerStatus,
        positiveRatingPercent: sellerRatingPercent,
        completedTransactions: sellerTransactions,
        city: sellerCity,
        state: sellerState,
      },
      shipping: {
        freeShipping,
        logisticType: item.tipoLogistica || item.shipping?.logistic_type || null,
        mode: item.modoEnvio || item.shipping?.mode || null,
        tag: shippingTag,
        cost: shippingCost,
      },
      installments,
      attributes,
      queryTimestamp: queryDate,
    };
  }
}

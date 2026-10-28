/**
 * AnPrice — Serviço de Integração com o Servidor Render
 * URL Oficial: https://anprice-servidor.onrender.com
 * 
 * Rotas integradas:
 * 1. POST /api/login        - Autenticação do administrador via JSON { password } com credentials: 'include'
 * 2. GET  /api/status       - Status da conexão da conta do Mercado Livre
 * 3. POST /api/auth/iniciar - Início do fluxo OAuth do Mercado Livre (retorna { url })
 * 4. GET  /api/buscar?q=... - Busca de anúncios reais { consulta, consultadoEm, resultados, totalInformado }
 * 5. POST /api/logout       - Encerramento da sessão administrativa
 */

import {
  MarketplaceProduct,
  RenderServerStatus,
  RenderSearchResponse,
  RenderAuthResponse,
} from '../types/marketplace';

// URL do servidor oficial do usuário no Render
export const RENDER_SERVER_ORIGIN = 'https://anprice-servidor.onrender.com';

// Chave para armazenar preferência de rota (direta vs túnel proxy) - NÃO armazena senhas!
const PREFERRED_TRANSPORT_KEY = 'anprice_transport_v1';

export class RenderApiService {
  private static useProxy = false;

  public static setUseProxy(enable: boolean) {
    this.useProxy = enable;
    try {
      localStorage.setItem(PREFERRED_TRANSPORT_KEY, enable ? 'proxy' : 'direct');
    } catch {
      // Ignora erro de localStorage
    }
  }

  public static isUsingProxy(): boolean {
    if (this.useProxy) return true;
    try {
      return localStorage.getItem(PREFERRED_TRANSPORT_KEY) === 'proxy';
    } catch {
      return false;
    }
  }

  public static getBaseUrl(): string {
    // Se o modo túnel estiver ativo, usa o proxy do próprio servidor local/Vite
    if (this.isUsingProxy()) {
      return '/render-api';
    }
    return RENDER_SERVER_ORIGIN;
  }

  /**
   * 1. POST /api/login
   * Envia { password: senhaInformada } com credentials: 'include'
   * A senha NUNCA é salva em código, localStorage ou arquivos.
   */
  public static async login(password: string): Promise<{
    success: boolean;
    data?: any;
    error?: string;
    isCookieOrCorsIssue?: boolean;
  }> {
    const url = `${this.getBaseUrl()}/api/login`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/plain',
        },
        credentials: 'include',
        body: JSON.stringify({ password }),
      });

      if (response.status === 403) {
        return {
          success: false,
          error: 'Senha de administrador incorreta. Acesso não autorizado pelo servidor.',
        };
      }

      if (response.status === 401) {
        return {
          success: false,
          error: 'Credenciais inválidas. Verifique a senha do servidor.',
        };
      }

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        return {
          success: false,
          error: `O servidor retornou status ${response.status}: ${text || 'Erro de autenticação'}`,
        };
      }

      const data = await response.json().catch(() => ({ ok: true }));
      return { success: true, data };
    } catch (err: any) {
      const isCorsOrCookie = this.detectCorsOrCookieError(err);
      return {
        success: false,
        error: isCorsOrCookie
          ? 'Falha de conexão com o servidor do Render. O navegador pode ter bloqueado requisições de origens cruzadas (CORS) ou cookies entre domínios.'
          : `Erro de rede ao conectar com ${RENDER_SERVER_ORIGIN}: ${err.message}`,
        isCookieOrCorsIssue: isCorsOrCookie,
      };
    }
  }

  /**
   * 2. GET /api/status
   * Consulta o status da conta do Mercado Livre e da sessão do administrador
   */
  public static async getStatus(): Promise<{
    success: boolean;
    status?: RenderServerStatus;
    error?: string;
    unauthorized?: boolean;
    isCookieOrCorsIssue?: boolean;
  }> {
    const url = `${this.getBaseUrl()}/api/status`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        credentials: 'include',
      });

      if (response.status === 401) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          unauthorized: true,
          error: errorData.erro || 'Faça login de administrador.',
          status: {
            conectado: false,
            adminLogado: false,
            mensagem: errorData.erro || 'Sessão de administrador não autenticada',
          },
        };
      }

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        return {
          success: false,
          error: `Erro ${response.status} ao consultar status: ${text}`,
        };
      }

      const data = await response.json();

      // Mapeia flexivelmente as propriedades retornadas pelo servidor
      const isMlConnected = Boolean(
        data.conectado === true ||
        data.connected === true ||
        data.mercadoLivreConectado === true ||
        data.mlConectado === true ||
        data.status === 'conectado' ||
        data.status === 'connected'
      );

      return {
        success: true,
        status: {
          conectado: isMlConnected,
          adminLogado: true,
          usuario: data.usuario || data.user || data.nickname || null,
          mensagem: data.mensagem || data.message || (isMlConnected ? 'Conta do Mercado Livre conectada com sucesso.' : 'Conta do Mercado Livre desconectada.'),
          raw: data,
        },
      };
    } catch (err: any) {
      const isCorsOrCookie = this.detectCorsOrCookieError(err);
      return {
        success: false,
        error: isCorsOrCookie
          ? 'Bloqueio de cookies de terceiros ou CORS entre a interface e o domínio do Render.'
          : `Erro de conexão: ${err.message}`,
        isCookieOrCorsIssue: isCorsOrCookie,
      };
    }
  }

  /**
   * 3. POST /api/auth/iniciar
   * Inicia fluxo OAuth. A resposta contém a propriedade "url".
   * Abre a URL retornada na mesma janela do navegador conforme especificado.
   */
  public static async iniciarAuthMercadoLivre(): Promise<{
    success: boolean;
    url?: string;
    error?: string;
    unauthorized?: boolean;
  }> {
    const endpoint = `${this.getBaseUrl()}/api/auth/iniciar`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
        },
        credentials: 'include',
      });

      if (response.status === 401) {
        return {
          success: false,
          unauthorized: true,
          error: 'Sessão de administrador expirada ou inexistente. Faça login novamente.',
        };
      }

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        return {
          success: false,
          error: `Erro ao iniciar autenticação (${response.status}): ${text}`,
        };
      }

      const data: RenderAuthResponse = await response.json();

      if (!data.url) {
        return {
          success: false,
          error: data.erro || data.mensagem || 'A API não retornou uma URL válida para conexão.',
        };
      }

      return {
        success: true,
        url: data.url,
      };
    } catch (err: any) {
      return {
        success: false,
        error: `Falha ao iniciar autenticação com o Mercado Livre: ${err.message}`,
      };
    }
  }

  /**
   * 4. GET /api/buscar?q=termo
   * Consulta os anúncios no servidor Render
   * Resposta contém: consulta, consultadoEm, resultados, totalInformado
   */
  public static async buscar(termo: string): Promise<{
    success: boolean;
    data?: RenderSearchResponse;
    products: MarketplaceProduct[];
    error?: string;
    unauthorized?: boolean;
    isCookieOrCorsIssue?: boolean;
  }> {
    const url = `${this.getBaseUrl()}/api/buscar?q=${encodeURIComponent(termo.trim())}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        credentials: 'include',
      });

      if (response.status === 401) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          unauthorized: true,
          products: [],
          error: errorData.erro || 'Faça login de administrador para realizar pesquisas.',
        };
      }

      if (response.status === 429) {
        return {
          success: false,
          products: [],
          error: 'Limite de requisições excedido pelo servidor do Mercado Livre. Aguarde alguns instantes.',
        };
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          products: [],
          error: errorData.erro || errorData.mensagem || `Erro no servidor (${response.status})`,
        };
      }

      const data: RenderSearchResponse = await response.json();

      if (data.erro) {
        return {
          success: false,
          products: [],
          error: data.erro,
          data,
        };
      }

      const rawItems = Array.isArray(data.resultados) ? data.resultados : [];
      const queryDate = data.consultadoEm || new Date().toISOString();

      const mappedProducts: MarketplaceProduct[] = rawItems.map((item, index) =>
        this.mapRenderItemToProduct(item, index, queryDate)
      );

      return {
        success: true,
        data,
        products: mappedProducts,
      };
    } catch (err: any) {
      const isCorsOrCookie = this.detectCorsOrCookieError(err);
      return {
        success: false,
        products: [],
        error: isCorsOrCookie
          ? 'Falha de comunicação ou cookies bloqueados pelo navegador com o servidor do Render.'
          : `Erro de rede ao buscar: ${err.message}`,
        isCookieOrCorsIssue: isCorsOrCookie,
      };
    }
  }

  /**
   * 5. POST /api/logout
   * Encerra a sessão administrativa
   */
  public static async logout(): Promise<{
    success: boolean;
    error?: string;
  }> {
    const url = `${this.getBaseUrl()}/api/logout`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok && response.status !== 401) {
        const text = await response.text().catch(() => '');
        return {
          success: false,
          error: `Erro ao sair da sessão (${response.status}): ${text}`,
        };
      }

      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: `Erro de rede ao efetuar logout: ${err.message}`,
      };
    }
  }

  /**
   * Converte itens retornados pela API /api/buscar para o modelo MarketplaceProduct
   * Regra rígida: Não inventa dados! Caso indisponível, define como null/vazio.
   */
  public static mapRenderItemToProduct(
    item: any,
    index: number,
    queryDate: string
  ): MarketplaceProduct {
    // Título
    const title = item.titulo || item.title || item.nome || 'Informação indisponível';

    // Preço
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

    // Condição
    let condition: MarketplaceProduct['condition'] = 'not_specified';
    const condStr = (item.condicao || item.condition || '').toLowerCase();
    if (condStr.includes('novo') || condStr === 'new') condition = 'new';
    else if (condStr.includes('usado') || condStr === 'used') condition = 'used';
    else if (condStr.includes('recondicionado') || condStr === 'refurbished') condition = 'reconditioned';

    // Imagem
    const thumbnail =
      item.imagem ||
      item.thumbnail ||
      item.thumbnailUrl ||
      item.foto ||
      item.pictures?.[0]?.url ||
      '';

    // Link original
    const permalink = item.link || item.permalink || item.url || '';

    // Vendedor
    let sellerName = 'Informação indisponível';
    let sellerReputation: any = null;
    let sellerPowerStatus: any = null;
    let sellerCity: string | null = null;
    let sellerState: string | null = null;
    let sellerRatingPercent: number | null = null;
    let sellerTransactions: number | null = null;

    if (typeof item.vendedor === 'string') {
      sellerName = item.vendedor;
    } else if (item.vendedor && typeof item.vendedor === 'object') {
      sellerName = item.vendedor.nome || item.vendedor.nickname || 'Informação indisponível';
      sellerCity = item.vendedor.cidade || item.vendedor.city || null;
      sellerState = item.vendedor.estado || item.vendedor.state || null;
      if (item.vendedor.reputacao) sellerReputation = item.vendedor.reputacao;
      if (item.vendedor.nivel) sellerPowerStatus = item.vendedor.nivel;
      if (typeof item.vendedor.positivas === 'number') sellerRatingPercent = item.vendedor.positivas;
    } else if (item.seller && typeof item.seller === 'object') {
      sellerName = item.seller.nickname || item.seller.name || 'Informação indisponível';
      const rep = item.seller.seller_reputation;
      if (rep) {
        if (rep.level_id?.includes('green')) sellerReputation = 'green';
        else if (rep.level_id?.includes('yellow')) sellerReputation = 'yellow';
        else if (rep.level_id?.includes('red')) sellerReputation = 'red';
        if (rep.power_seller_status) sellerPowerStatus = rep.power_seller_status;
        if (rep.metrics?.sales?.completed) sellerTransactions = rep.metrics.sales.completed;
      }
    }

    // Envio / Frete
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

    // Parcelamento
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

    // Atributos
    const attributes = Array.isArray(item.atributos)
      ? item.atributos.map((a: any) => ({
          id: a.id || a.nome || String(Math.random()),
          name: a.nome || a.name || 'Característica',
          value_name: a.valor || a.value_name || null,
        }))
      : Array.isArray(item.attributes)
      ? item.attributes.map((a: any) => ({
          id: a.id || a.name,
          name: a.name,
          value_name: a.value_name,
        }))
      : [];

    return {
      id: String(item.id || item.codigo || `item-${index}`),
      marketplace: 'mercadolivre',
      title,
      price,
      originalPrice,
      currencyId: item.moeda || item.currencyId || 'BRL',
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
        mode: item.modoEnvio || null,
        tag: shippingTag,
        cost: shippingCost,
      },
      installments,
      attributes,
      queryTimestamp: queryDate,
    };
  }

  private static detectCorsOrCookieError(err: any): boolean {
    const msg = (err?.message || '').toLowerCase();
    return (
      msg.includes('failed to fetch') ||
      msg.includes('networkerror') ||
      msg.includes('cross-origin') ||
      msg.includes('cors') ||
      msg.includes('blocked')
    );
  }
}

/**
 * AnPrice — Serviço Modular de Marketplace
 * Abstrai consultas ao backend, cache e suporte a múltiplos provedores
 */

import {
  MarketplaceProduct,
  PriceAnalysisSummary,
  ApiStatusResponse,
} from '../types/marketplace';
import { searchDemoProducts } from '../mock/demoProducts';

export interface SearchResultResponse {
  products: MarketplaceProduct[];
  source: 'live' | 'demo';
  query: string;
  lastQueryDate: string;
  totalFound: number;
  error?: string;
  errorDetails?: string;
}

export class MarketplaceService {
  /**
   * Consulta status de conexão e credenciais da API no servidor
   */
  static async checkApiStatus(): Promise<ApiStatusResponse> {
    try {
      const response = await fetch('/api/status');
      if (response.ok) {
        return await response.json();
      }
      return {
        configured: false,
        mode: 'demo',
        hasClientId: false,
        hasClientSecret: false,
        hasAccessToken: false,
        message: 'Servidor respondeu com status inesperado.',
        officialDocUrl: 'https://developers.mercadolivre.com.br/pt_br/guia-de-inicio',
      };
    } catch (err: any) {
      return {
        configured: false,
        mode: 'demo',
        hasClientId: false,
        hasClientSecret: false,
        hasAccessToken: false,
        message: `Não foi possível verificar status da API: ${err.message}`,
        officialDocUrl: 'https://developers.mercadolivre.com.br/pt_br/guia-de-inicio',
      };
    }
  }

  /**
   * Testa credenciais no servidor
   */
  static async testCredentials(payload: {
    clientId?: string;
    clientSecret?: string;
    accessToken?: string;
  }): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch('/api/config-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return await response.json();
    } catch (err: any) {
      return {
        success: false,
        message: `Falha na requisição: ${err.message}`,
      };
    }
  }

  /**
   * Executa busca de produtos no modo selecionado (Oficial ou Demonstração)
   */
  static async searchProducts(
    query: string,
    mode: 'live' | 'demo',
    category?: string
  ): Promise<SearchResultResponse> {
    const trimmedQuery = query.trim();
    const now = new Date().toISOString();

    // 1. Se modo selecionado for demonstração, pesquisa no catálogo local de teste
    if (mode === 'demo') {
      const demoItems = searchDemoProducts(trimmedQuery, category);
      return {
        products: demoItems,
        source: 'demo',
        query: trimmedQuery,
        lastQueryDate: now,
        totalFound: demoItems.length,
      };
    }

    // 2. Se modo for 'live', consulta o backend seguro do Mercado Livre
    try {
      const url = `/api/search?q=${encodeURIComponent(trimmedQuery)}&mode=live`;
      const response = await fetch(url);

      if (response.status === 429) {
        const errorData = await response.json();
        return {
          products: [],
          source: 'live',
          query: trimmedQuery,
          lastQueryDate: now,
          totalFound: 0,
          error: errorData.message || 'Limite de requisições por minuto atingido no Mercado Livre (Erro 429). Aguarde alguns instantes.',
        };
      }

      if (response.status === 401 || response.status === 403) {
        const errorData = await response.json();
        return {
          products: [],
          source: 'live',
          query: trimmedQuery,
          lastQueryDate: now,
          totalFound: 0,
          error: 'A API oficial do Mercado Livre requer autenticação por aplicativo (App ID e Secret ou Access Token).',
          errorDetails: errorData.details,
        };
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          products: [],
          source: 'live',
          query: trimmedQuery,
          lastQueryDate: now,
          totalFound: 0,
          error: errorData.message || `Erro ao consultar a API (${response.status})`,
        };
      }

      const data = await response.json();
      return {
        products: data.results || [],
        source: 'live',
        query: trimmedQuery,
        lastQueryDate: data.timestamp || now,
        totalFound: data.total || (data.results?.length ?? 0),
      };
    } catch (err: any) {
      return {
        products: [],
        source: 'live',
        query: trimmedQuery,
        lastQueryDate: now,
        totalFound: 0,
        error: `Falha de rede ao consultar o servidor: ${err.message}`,
      };
    }
  }

  /**
   * Obtém detalhes de um item
   */
  static async getItemDetails(itemId: string): Promise<any> {
    try {
      const response = await fetch(`/api/items/${itemId}`);
      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  }

  /**
   * Calcula o resumo analítico de preços e métricas com base no conjunto retornado
   */
  static computePriceAnalysis(
    products: MarketplaceProduct[],
    queryTerm: string,
    lastQueryDate: string
  ): PriceAnalysisSummary {
    if (!products || products.length === 0) {
      return {
        minPrice: 0,
        maxPrice: 0,
        avgPrice: 0,
        medianPrice: 0,
        totalAnalyzed: 0,
        freeShippingCount: 0,
        newConditionCount: 0,
        usedConditionCount: 0,
        cheapestProductId: null,
        lastQueryDate: lastQueryDate || new Date().toISOString(),
        queryTerm,
      };
    }

    const prices = products
      .map((p) => p.price)
      .filter((pr) => typeof pr === 'number' && pr > 0)
      .sort((a, b) => a - b);

    if (prices.length === 0) {
      return {
        minPrice: 0,
        maxPrice: 0,
        avgPrice: 0,
        medianPrice: 0,
        totalAnalyzed: products.length,
        freeShippingCount: 0,
        newConditionCount: 0,
        usedConditionCount: 0,
        cheapestProductId: null,
        lastQueryDate,
        queryTerm,
      };
    }

    const minPrice = prices[0];
    const maxPrice = prices[prices.length - 1];
    const sum = prices.reduce((acc, curr) => acc + curr, 0);
    const avgPrice = sum / prices.length;

    // Mediana
    let medianPrice = avgPrice;
    const mid = Math.floor(prices.length / 2);
    if (prices.length % 2 === 0) {
      medianPrice = (prices[mid - 1] + prices[mid]) / 2;
    } else {
      medianPrice = prices[mid];
    }

    // Achar produto com menor preço
    const cheapestProduct = products.reduce((prev, curr) =>
      curr.price < prev.price ? curr : prev
    );

    const freeShippingCount = products.filter((p) => p.shipping.freeShipping).length;
    const newConditionCount = products.filter((p) => p.condition === 'new').length;
    const usedConditionCount = products.filter((p) => p.condition === 'used').length;

    return {
      minPrice,
      maxPrice,
      avgPrice,
      medianPrice,
      totalAnalyzed: products.length,
      freeShippingCount,
      newConditionCount,
      usedConditionCount,
      cheapestProductId: cheapestProduct.id,
      lastQueryDate: lastQueryDate || new Date().toISOString(),
      queryTerm,
    };
  }
}

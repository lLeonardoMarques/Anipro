/**
 * AnPrice — Serviço Modular de Marketplace
 * Catálogo de demonstração e cálculos de análise de preços
 */

import { MarketplaceProduct, PriceAnalysisSummary } from '../types/marketplace';
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

    // 2. O modo 'live' é atendido por RenderApiService.buscar (servidor AnPrice).
    return {
      products: [],
      source: 'live',
      query: trimmedQuery,
      lastQueryDate: now,
      totalFound: 0,
      error: 'Busca ao vivo é feita pelo servidor AnPrice (RenderApiService.buscar).',
    };
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

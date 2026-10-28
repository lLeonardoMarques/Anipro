/**
 * AnPrice — Gerenciador de Armazenamento Local
 * Gerencia favoritos, histórico de consultas e simulações para revendedores
 */

import { MarketplaceProduct } from '../types/marketplace';

const FAVORITES_KEY = 'anprice_favorites_v1';
const HISTORY_KEY = 'anprice_search_history_v1';

export interface SearchHistoryItem {
  id: string;
  query: string;
  timestamp: string;
  totalFound: number;
  minPrice: number;
  avgPrice: number;
  source: 'live' | 'demo';
}

export class StorageService {
  // --- FAVORITOS ---
  static getFavorites(): MarketplaceProduct[] {
    try {
      const data = localStorage.getItem(FAVORITES_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static isFavorite(productId: string): boolean {
    const favorites = this.getFavorites();
    return favorites.some((p) => p.id === productId);
  }

  static toggleFavorite(product: MarketplaceProduct): boolean {
    const favorites = this.getFavorites();
    const exists = favorites.some((p) => p.id === product.id);

    let updated: MarketplaceProduct[];
    if (exists) {
      updated = favorites.filter((p) => p.id !== product.id);
    } else {
      updated = [product, ...favorites];
    }

    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Falha ao salvar favoritos no localStorage', e);
    }

    return !exists;
  }

  static removeFavorite(productId: string): void {
    const favorites = this.getFavorites();
    const updated = favorites.filter((p) => p.id !== productId);
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }
  }

  // --- HISTÓRICO DE BUSCAS ---
  static getHistory(): SearchHistoryItem[] {
    try {
      const data = localStorage.getItem(HISTORY_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static addHistory(item: Omit<SearchHistoryItem, 'id'>): void {
    const history = this.getHistory();
    const newItem: SearchHistoryItem = {
      ...item,
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };

    // Mantém as últimas 20 buscas
    const updated = [newItem, ...history.filter((h) => h.query.toLowerCase() !== item.query.toLowerCase())].slice(0, 20);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }
  }

  static clearHistory(): void {
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch (e) {
      console.warn(e);
    }
  }

  // --- EXPORTAÇÃO DE RELATÓRIO PARA REVENDEDORES ---
  static exportProductsToCSV(products: MarketplaceProduct[], filename = 'anprice_relatorio_precos.csv'): void {
    const headers = [
      'ID',
      'Título',
      'Preço (R$)',
      'Condição',
      'Vendedor',
      'Reputação',
      'Frete Grátis',
      'Tipo de Envio',
      'Link',
      'Data Consulta',
    ];

    const rows = products.map((p) => [
      `"${p.id}"`,
      `"${p.title.replace(/"/g, '""')}"`,
      p.price.toFixed(2).replace('.', ','),
      p.condition === 'new' ? 'Novo' : p.condition === 'used' ? 'Usado' : 'Outro',
      `"${p.seller.name.replace(/"/g, '""')}"`,
      p.seller.powerSellerStatus || p.seller.reputationLevel || 'Normal',
      p.shipping.freeShipping ? 'Sim' : 'Não',
      `"${p.shipping.tag || p.shipping.logisticType || 'Padrão'}"`,
      `"${p.permalink}"`,
      `"${p.queryTimestamp}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

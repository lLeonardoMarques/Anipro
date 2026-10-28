/**
 * AnPrice — Tipos de Dados e Modelos de Domínio
 * Arquitetura modular extensível para múltiplos marketplaces
 */

export type MarketplaceType = 'mercadolivre' | 'amazon' | 'shopee' | 'demo';

export type ProductCondition = 'new' | 'used' | 'reconditioned' | 'not_specified';

export interface SellerInfo {
  id: string;
  name: string;
  reputationLevel: 'green' | 'yellow' | 'orange' | 'red' | null;
  powerSellerStatus: 'platinum' | 'gold' | 'silver' | null;
  positiveRatingPercent: number | null;
  completedTransactions: number | null;
  city: string | null;
  state: string | null;
  cancellationRate?: number | null;
}

export interface ShippingInfo {
  freeShipping: boolean;
  logisticType: 'fulfillment' | 'drop_off' | 'cross_docking' | 'xd_drop_off' | 'self_service' | null;
  mode: string | null;
  tag: string | null; // e.g. "Mercado Envios Full"
  estimatedDays?: number | null;
  cost?: number | null;
}

export interface InstallmentInfo {
  quantity: number;
  amount: number;
  rate: number; // 0 para sem juros
}

export interface ProductAttribute {
  id: string;
  name: string;
  value_name: string | null;
}

export interface MarketplaceProduct {
  id: string;
  marketplace: MarketplaceType;
  title: string;
  price: number;
  originalPrice?: number | null;
  currencyId: string;
  condition: ProductCondition;
  thumbnail: string;
  permalink: string;
  isDemo: boolean;
  availableQuantity?: number | null;
  soldQuantity?: number | null;
  seller: SellerInfo;
  shipping: ShippingInfo;
  installments?: InstallmentInfo | null;
  attributes: ProductAttribute[];
  queryTimestamp: string;
}

export interface PriceAnalysisSummary {
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
  medianPrice: number;
  totalAnalyzed: number;
  freeShippingCount: number;
  newConditionCount: number;
  usedConditionCount: number;
  cheapestProductId: string | null;
  lastQueryDate: string;
  queryTerm: string;
}

export interface FilterState {
  condition: 'all' | 'new' | 'used';
  freeShippingOnly: boolean;
  reputableSellersOnly: boolean;
  fullShippingOnly: boolean;
  minPrice: string;
  maxPrice: string;
  sortBy: 'price_asc' | 'price_desc' | 'relevance' | 'reputation';
}

export interface ResaleCalculationInput {
  costPrice: number;
  salePrice: number;
  marketplaceFeePercent: number;
  marketplaceFixedFee: number;
  shippingCost: number;
  taxesPercent: number;
  otherCosts: number;
}

export interface ResaleCalculationResult {
  grossRevenue: number;
  marketplaceFeeAmount: number;
  taxesAmount: number;
  totalCosts: number;
  netProfit: number;
  netMarginPercent: number;
  markupPercent: number;
  breakEvenPrice: number;
}

export interface ApiStatusResponse {
  configured: boolean;
  mode: 'live' | 'demo';
  hasClientId: boolean;
  hasClientSecret: boolean;
  hasAccessToken: boolean;
  rateLimitRemaining?: number;
  message: string;
  officialDocUrl: string;
}

// Modelos da API do servidor AnPrice (mesma origem do frontend)
export interface RenderServerStatus {
  conectado: boolean;
  adminLogado: boolean;
  usuario?: string | null;
  mensagem?: string | null;
  diagnosticoAtivo?: boolean;
  raw?: any;
}

export interface RenderSearchResponse {
  consulta: string;
  consultadoEm: string;
  resultados: any[];
  totalInformado: number | null;
  fonte?: 'catalogo' | 'busca_site';
  tentativas?: { endpoint: string; codigo: string; status?: number | null }[];
  cache?: boolean;
  erro?: string;
  mensagem?: string;
}

export interface RenderAuthResponse {
  url?: string;
  erro?: string;
  mensagem?: string;
}

import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Layers,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  PackageX,
  FileSpreadsheet,
  ArrowRightLeft,
  RefreshCw,
  Info,
  Lock,
  ExternalLink,
  Server,
  CheckCircle,
} from 'lucide-react';
import {
  MarketplaceProduct,
  FilterState,
  ApiStatusResponse,
  RenderServerStatus,
} from './types/marketplace';
import { MarketplaceService } from './services/marketplaceService';
import { RenderApiService } from './services/renderApiService';
import { StorageService } from './services/storageService';
import { Header } from './components/Header';
import { SearchBar } from './components/SearchBar';
import { AnalyticsSummary } from './components/AnalyticsSummary';
import { FilterBar } from './components/FilterBar';
import { ProductCard } from './components/ProductCard';
import { ProductDetailsModal } from './components/ProductDetailsModal';
import { ResaleCalculator } from './components/ResaleCalculator';
import { CompareModal } from './components/CompareModal';
import { ApiConfigModal } from './components/ApiConfigModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { FavoritesModal } from './components/FavoritesModal';
import { DemoNoticeModal } from './components/DemoNoticeModal';
import { Footer } from './components/Footer';

const INITIAL_FILTERS: FilterState = {
  condition: 'all',
  freeShippingOnly: false,
  reputableSellersOnly: false,
  fullShippingOnly: false,
  minPrice: '',
  maxPrice: '',
  sortBy: 'price_asc',
};

export default function App() {
  const [appMode, setAppMode] = useState<'live' | 'demo'>('live');
  const [viewMode, setViewMode] = useState<'consumer' | 'reseller'>('consumer');
  const [currentQuery, setCurrentQuery] = useState<string>('Dior Sauvage');
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [lastQueryDate, setLastQueryDate] = useState<string>(new Date().toISOString());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [isServerUnreachable, setIsServerUnreachable] = useState<boolean>(false);

  // Render Server Authentication & Status
  const [serverStatus, setServerStatus] = useState<RenderServerStatus | null>(null);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState<boolean>(false);
  const [isConnectingMl, setIsConnectingMl] = useState<boolean>(false);

  // Filters
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);

  // Modals & Drawers
  const [apiStatus, setApiStatus] = useState<ApiStatusResponse | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isFavoritesModalOpen, setIsFavoritesModalOpen] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [isDemoNoticeModalOpen, setIsDemoNoticeModalOpen] = useState(false);
  const [selectedProductForDetails, setSelectedProductForDetails] = useState<MarketplaceProduct | null>(null);

  // Selections
  const [comparedProducts, setComparedProducts] = useState<MarketplaceProduct[]>([]);
  const [favorites, setFavorites] = useState<MarketplaceProduct[]>([]);

  // Resale Calculator target item
  const [resaleCostTarget, setResaleCostTarget] = useState<number | null>(null);
  const [resaleTitleTarget, setResaleTitleTarget] = useState<string | null>(null);

  // 1. Check Server Status & Load Favorites on mount
  useEffect(() => {
    setFavorites(StorageService.getFavorites());

    // Retorno do OAuth do Mercado Livre: /?ml=conectado | /?ml=erro&motivo=...
    const params = new URLSearchParams(window.location.search);
    const ml = params.get('ml');
    let avisoOAuth: string | null = null;
    if (ml === 'erro') {
      const motivos: Record<string, string> = {
        AUTORIZACAO_NEGADA: 'A autorização foi cancelada no Mercado Livre.',
        STATE_INVALIDO: 'O link de autorização expirou ou já foi usado. Inicie a conexão novamente.',
        PARAMETROS_AUSENTES: 'O Mercado Livre retornou sem o código de autorização.',
        TROCA_FALHOU: 'O Mercado Livre recusou a troca do código pelo token. Confira Client ID, Secret e Redirect URI.',
      };
      avisoOAuth = motivos[params.get('motivo') || ''] || 'Não foi possível conectar o Mercado Livre.';
    }
    if (ml) {
      params.delete('ml');
      params.delete('motivo');
      const resto = params.toString();
      window.history.replaceState(null, '', window.location.pathname + (resto ? `?${resto}` : '') + window.location.hash);
    }

    checkServerConnection().then(() => {
      if (avisoOAuth) setErrorMessage(avisoOAuth);
    });
  }, []);

  const checkServerConnection = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setIsServerUnreachable(false);

    try {
      const result = await RenderApiService.getStatus();

      if (result.success && result.status) {
        setServerStatus(result.status);
        setIsAdminLoggedIn(true);

        // Se estiver autenticado e houver consulta, realiza a busca inicial
        executeSearch('Dior Sauvage', 'live');
      } else {
        setServerStatus(result.status || null);
        setIsAdminLoggedIn(false);

        if (result.servidorInacessivel) {
          setIsServerUnreachable(true);
          setErrorMessage(result.error || 'Servidor inacessível.');
        } else if (result.unauthorized) {
          // Sessão não iniciada: modo normal de teste
          setErrorMessage('Sessão de administrador não encontrada. Faça login para acessar o servidor do Mercado Livre.');
        } else if (result.error) {
          setErrorMessage(result.error);
        }
      }
    } catch (err: any) {
      setErrorMessage(`Erro ao verificar status do servidor: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Main Search Execution
  const executeSearch = async (
    queryToSearch: string,
    modeToUse: 'live' | 'demo' = appMode,
    category?: string
  ) => {
    if (!queryToSearch.trim()) return;

    setIsLoading(true);
    setErrorMessage(null);
    setErrorDetails(null);
    setIsServerUnreachable(false);
    setCurrentQuery(queryToSearch);

    try {
      // MODO DEMONSTRAÇÃO
      if (modeToUse === 'demo') {
        const response = await MarketplaceService.searchProducts(
          queryToSearch,
          'demo',
          category
        );
        setProducts(response.products);
        setLastQueryDate(response.lastQueryDate);
        if (response.products.length > 0) {
          const stats = MarketplaceService.computePriceAnalysis(
            response.products,
            queryToSearch,
            response.lastQueryDate
          );
          setResaleCostTarget(stats.minPrice);
          setResaleTitleTarget(response.products[0]?.title || queryToSearch);
        }
        setIsLoading(false);
        return;
      }

      // MODO AO VIVO: Consulta GET /api/buscar?q=termo com credentials: "include"
      const result = await RenderApiService.buscar(queryToSearch);

      if (result.unauthorized) {
        setIsAdminLoggedIn(false);
        setProducts([]);
        setErrorMessage(result.error || 'Faça login de administrador para realizar pesquisas no servidor.');
        setIsAdminLoginOpen(true);
      } else if (!result.success) {
        setProducts([]);
        setErrorMessage(result.error || 'Não foi possível concluir a busca.');
        setErrorDetails(result.detalhes || null);
        setIsServerUnreachable(Boolean(result.servidorInacessivel));
        if (result.codigo === 'ML_NAO_CONECTADO' || result.codigo === 'ML_REAUTORIZAR') {
          setServerStatus((prev) => (prev ? { ...prev, conectado: false } : prev));
        }
      } else {
        setProducts(result.products);
        const queryDate = result.data?.consultadoEm || new Date().toISOString();
        setLastQueryDate(queryDate);

        if (result.products.length > 0) {
          const stats = MarketplaceService.computePriceAnalysis(
            result.products,
            queryToSearch,
            queryDate
          );
          StorageService.addHistory({
            query: queryToSearch,
            timestamp: queryDate,
            totalFound: result.products.length,
            minPrice: stats.minPrice,
            avgPrice: stats.avgPrice,
            source: 'live',
          });

          setResaleCostTarget(stats.minPrice);
          setResaleTitleTarget(result.products[0]?.title || queryToSearch);
        }
      }
    } catch (err: any) {
      setProducts([]);
      setErrorMessage(`Erro inesperado ao pesquisar: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Conectar Mercado Livre (POST /api/auth/iniciar)
  const handleConnectMercadoLivre = async () => {
    setIsConnectingMl(true);
    setErrorMessage(null);

    try {
      const result = await RenderApiService.iniciarAuthMercadoLivre();

      if (result.unauthorized) {
        setIsAdminLoggedIn(false);
        setIsAdminLoginOpen(true);
        setErrorMessage('Faça login de administrador antes de conectar o Mercado Livre.');
      } else if (result.success && result.url) {
        // Redireciona na mesma janela conforme especificado nas regras
        window.location.href = result.url;
      } else {
        setErrorMessage(result.error || 'Não foi possível obter a URL de autorização.');
      }
    } catch (err: any) {
      setErrorMessage(`Erro ao iniciar autorização: ${err.message}`);
    } finally {
      setIsConnectingMl(false);
    }
  };

  // 4. Logout (POST /api/logout)
  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await RenderApiService.logout();
      setIsAdminLoggedIn(false);
      setServerStatus(null);
      setProducts([]);
      setErrorMessage('Sessão administrativa encerrada.');
    } catch (err: any) {
      setErrorMessage(`Erro ao efetuar logout: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Mode change handler
  const handleToggleAppMode = (newMode: 'live' | 'demo') => {
    setAppMode(newMode);
    executeSearch(currentQuery, newMode);
  };

  // Admin login success callback
  const handleAdminLoginSuccess = async () => {
    setIsAdminLoggedIn(true);
    setIsAdminLoginOpen(false);
    // checkServerConnection já executa a busca inicial quando a sessão é válida.
    await checkServerConnection();
  };

  // Favorites Handlers
  const handleToggleFavorite = (product: MarketplaceProduct) => {
    StorageService.toggleFavorite(product);
    setFavorites(StorageService.getFavorites());
  };

  const handleRemoveFavorite = (productId: string) => {
    StorageService.removeFavorite(productId);
    setFavorites(StorageService.getFavorites());
  };

  // Comparison Handlers
  const handleToggleCompare = (product: MarketplaceProduct) => {
    setComparedProducts((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      if (exists) {
        return prev.filter((p) => p.id !== product.id);
      }
      if (prev.length >= 3) {
        alert('Você pode comparar no máximo 3 anúncios simultaneamente.');
        return prev;
      }
      return [...prev, product];
    });
  };

  const handleRemoveCompared = (productId: string) => {
    setComparedProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  // Resale simulation loader
  const handleLoadInResaleCalculator = (product: MarketplaceProduct) => {
    setResaleCostTarget(product.price);
    setResaleTitleTarget(product.title);
    setViewMode('reseller');
    const el = document.getElementById('resale-calculator-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Filter by Condition
    if (filters.condition !== 'all') {
      result = result.filter((p) => p.condition === filters.condition);
    }

    // Filter by Free Shipping
    if (filters.freeShippingOnly) {
      result = result.filter((p) => p.shipping.freeShipping);
    }

    // Filter by Reputable Sellers
    if (filters.reputableSellersOnly) {
      result = result.filter(
        (p) => Boolean(p.seller.powerSellerStatus) || p.seller.reputationLevel === 'green'
      );
    }

    // Sort
    result.sort((a, b) => {
      if (filters.sortBy === 'price_asc') {
        return a.price - b.price;
      }
      if (filters.sortBy === 'price_desc') {
        return b.price - a.price;
      }
      if (filters.sortBy === 'reputation') {
        const getScore = (p: MarketplaceProduct) => {
          if (p.seller.powerSellerStatus === 'platinum') return 4;
          if (p.seller.powerSellerStatus === 'gold') return 3;
          if (p.seller.powerSellerStatus === 'silver') return 2;
          if (p.seller.reputationLevel === 'green') return 1;
          return 0;
        };
        return getScore(b) - getScore(a);
      }
      return 0;
    });

    return result;
  }, [products, filters]);

  // Analytics summary
  const summary = useMemo(() => {
    return MarketplaceService.computePriceAnalysis(
      filteredProducts,
      currentQuery,
      lastQueryDate
    );
  }, [filteredProducts, currentQuery, lastQueryDate]);

  const hasActiveFilters =
    filters.condition !== 'all' ||
    filters.freeShippingOnly ||
    filters.reputableSellersOnly ||
    filters.sortBy !== 'price_asc';

  return (
    <div className="min-h-screen bg-[#070D1E] text-slate-100 flex flex-col font-sans selection:bg-lime-400 selection:text-slate-950">
      {/* Top Global Header */}
      <Header
        appMode={appMode}
        onToggleAppMode={handleToggleAppMode}
        apiStatus={apiStatus}
        serverStatus={serverStatus}
        isAdminLoggedIn={isAdminLoggedIn}
        onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
        onConnectMercadoLivre={handleConnectMercadoLivre}
        isConnectingMl={isConnectingMl}
        onLogout={handleLogout}
        onOpenConfigModal={() => setIsConfigModalOpen(true)}
        onOpenFavoritesModal={() => setIsFavoritesModalOpen(true)}
        favoritesCount={favorites.length}
        viewMode={viewMode}
        onToggleViewMode={setViewMode}
        compareCount={comparedProducts.length}
        onOpenCompareModal={() => setIsCompareModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero & Search Section */}
        <section className="space-y-4 text-center max-w-3xl mx-auto pt-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-lime-400 font-semibold mb-2">
            <span className="w-2 h-2 rounded-full bg-lime-400 animate-ping"></span>
            Servidor AnPrice: <span className="font-mono text-slate-200">{window.location.host}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Pesquise melhor. <span className="text-lime-400">Pague menos.</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto">
            Pesquise produtos e compare preços e vendedores do Mercado Livre pela API oficial, através do seu servidor dedicado com autenticação e cookies protegidos.
          </p>

          <div className="pt-2">
            <SearchBar
              onSearch={(q, cat) => executeSearch(q, appMode, cat)}
              isLoading={isLoading}
              currentQuery={currentQuery}
            />
          </div>
        </section>

        {/* Status Banner when Mercado Livre is not connected yet */}
        {appMode === 'live' && isAdminLoggedIn && serverStatus && !serverStatus.conectado && (
          <section className="bg-amber-950/30 border border-amber-500/40 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30">
                <AlertCircle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  Conta do Mercado Livre Desconectada
                </h3>
                <p className="text-xs text-amber-200/80">
                  Para buscar anúncios oficiais de diferentes vendedores, conecte sua conta do Mercado Livre ao servidor via OAuth.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleConnectMercadoLivre}
              disabled={isConnectingMl}
              className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md shadow-amber-400/20 shrink-0"
            >
              {isConnectingMl ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Obtendo URL...</span>
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4" />
                  <span>Conectar Mercado Livre</span>
                </>
              )}
            </button>
          </section>
        )}

        {/* Resale View Notice Banner */}
        {viewMode === 'reseller' && (
          <section className="bg-gradient-to-r from-lime-950/40 via-[#0A1633] to-[#0A1633] border border-lime-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-lime-400 text-slate-950 font-black">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  Visão Especializada para Revenda & Afiliados Ativada
                </h3>
                <p className="text-xs text-slate-300">
                  Compare preços de compra vs concorrência e calcule o lucro líquido descontando tarifas e custos.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('resale-calculator-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-3.5 py-2 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-bold text-xs transition-colors"
              >
                Abrir Calculadora
              </button>
              <button
                type="button"
                onClick={() => setViewMode('consumer')}
                className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs"
              >
                Voltar à Visão Consumidor
              </button>
            </div>
          </section>
        )}

        {/* Error / Authentication Help Alert */}
        {errorMessage && (
          <section className="bg-rose-950/30 border border-rose-500/50 rounded-2xl p-5 text-rose-200 space-y-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-rose-100">
                  Aviso do AnPrice
                </h3>
                <p className="text-xs text-rose-300 leading-relaxed font-medium">
                  {errorMessage}
                </p>
                {errorDetails && (
                  <p className="text-[11px] font-mono text-rose-400 bg-black/40 p-2 rounded-lg mt-1 overflow-x-auto">
                    {errorDetails}
                  </p>
                )}
              </div>
            </div>

            {isServerUnreachable && (
              <div className="bg-black/40 p-3 rounded-xl border border-rose-500/30 text-xs text-slate-300 flex flex-wrap items-center gap-2">
                <Info className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-[11px] flex-1 min-w-[200px]">
                  O servidor pode estar iniciando (plano gratuito do Render hiberna após inatividade).
                </span>
                <button
                  type="button"
                  onClick={() => checkServerConnection()}
                  className="px-3 py-1.5 rounded-lg bg-lime-400 hover:bg-lime-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Tentar novamente
                </button>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-rose-500/20 text-xs">
              {!isAdminLoggedIn && (
                <button
                  type="button"
                  onClick={() => setIsAdminLoginOpen(true)}
                  className="px-4 py-2 rounded-xl bg-lime-400 text-slate-950 font-bold hover:bg-lime-300 transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Lock className="w-3.5 h-3.5" />
                  Abrir Tela de Login de Administrador
                </button>
              )}

              <button
                type="button"
                onClick={() => handleToggleAppMode('demo')}
                className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 font-medium hover:border-slate-500 transition-colors flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Usar Modo Demonstração (Sem servidor)
              </button>

              <button
                type="button"
                onClick={() => checkServerConnection()}
                className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 font-medium hover:border-slate-500 transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Tentar Novamente
              </button>
            </div>
          </section>
        )}

        {/* Analytics Summary Bar */}
        {filteredProducts.length > 0 && (
          <section>
            <AnalyticsSummary summary={summary} source={appMode} />
          </section>
        )}

        {/* Interactive Resale Calculator */}
        {viewMode === 'reseller' && (
          <section id="resale-calculator-section">
            <ResaleCalculator
              initialCost={resaleCostTarget}
              productTitle={resaleTitleTarget}
            />
          </section>
        )}

        {/* Filter and Sorting Bar */}
        {products.length > 0 && (
          <section>
            <FilterBar
              filters={filters}
              onFilterChange={setFilters}
              products={products}
              onResetFilters={() => setFilters(INITIAL_FILTERS)}
              onExportCSV={() => StorageService.exportProductsToCSV(filteredProducts)}
              hasActiveFilters={hasActiveFilters}
            />
          </section>
        )}

        {/* Product Cards Grid */}
        <section className="space-y-4">
          {isLoading ? (
            <div className="py-20 text-center space-y-4">
              <div className="w-12 h-12 border-4 border-lime-400 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-base font-bold text-white">
                Consultando servidor em anprice-servidor.onrender.com...
              </p>
              <p className="text-xs text-slate-400">
                Obtendo anúncios oficiais do Mercado Livre com credentials: "include"
              </p>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredProducts.map((product) => {
                const isCheapest = product.id === summary.cheapestProductId;
                const isFavorite = favorites.some((f) => f.id === product.id);
                const isCompared = comparedProducts.some((p) => p.id === product.id);

                return (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isCheapest={isCheapest}
                    isFavorite={isFavorite}
                    onToggleFavorite={handleToggleFavorite}
                    onSelectForDetails={setSelectedProductForDetails}
                    onLoadInResaleCalculator={handleLoadInResaleCalculator}
                    isCompared={isCompared}
                    onToggleCompare={handleToggleCompare}
                    onViewDemoNotice={() => setIsDemoNoticeModalOpen(true)}
                  />
                );
              })}
            </div>
          ) : !errorMessage ? (
            <div className="py-16 text-center bg-[#091124] border border-slate-800 rounded-2xl p-8 space-y-3">
              <PackageX className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-white">
                Nenhum anúncio encontrado com os filtros selecionados
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Tente redefinir os filtros rápidos ou pesquisar por termos como &ldquo;Perfume&rdquo; ou &ldquo;iPhone&rdquo;.
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => setFilters(INITIAL_FILTERS)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-lime-400 text-xs font-semibold hover:bg-slate-700 transition-colors"
                >
                  Redefinir Filtros
                </button>
              )}
            </div>
          ) : null}
        </section>

        {/* Resale Calculator Section (at bottom of page when in Consumer mode) */}
        {viewMode === 'consumer' && filteredProducts.length > 0 && (
          <section id="resale-calculator-section" className="pt-8 border-t border-slate-800/80">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-lime-400" />
                  Calculadora de Lucro para Revenda e Arbitragem
                </h2>
                <p className="text-xs text-slate-400">
                  Planeje suas vendas simulando custos de produto, frete e comissões do Mercado Livre.
                </p>
              </div>
            </div>
            <ResaleCalculator
              initialCost={resaleCostTarget}
              productTitle={resaleTitleTarget}
            />
          </section>
        )}
      </main>

      {/* Footer */}
      <Footer onOpenConfigModal={() => setIsConfigModalOpen(true)} />

      {/* Modals & Dialogs */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onLoginSuccess={handleAdminLoginSuccess}
        initialError={errorMessage}
      />

      <ProductDetailsModal
        product={selectedProductForDetails}
        onClose={() => setSelectedProductForDetails(null)}
        onLoadInResaleCalculator={handleLoadInResaleCalculator}
        onViewDemoNotice={() => setIsDemoNoticeModalOpen(true)}
      />

      <CompareModal
        products={comparedProducts}
        onClose={() => setIsCompareModalOpen(false)}
        onRemoveProduct={handleRemoveCompared}
        onClearAll={() => setComparedProducts([])}
        onLoadInResaleCalculator={handleLoadInResaleCalculator}
        onViewDemoNotice={() => setIsDemoNoticeModalOpen(true)}
      />

      <ApiConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        serverStatus={serverStatus}
        isAdminLoggedIn={isAdminLoggedIn}
        onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
        onConnectMercadoLivre={handleConnectMercadoLivre}
        isConnectingMl={isConnectingMl}
        onLogout={handleLogout}
        onRefreshStatus={checkServerConnection}
        onSelectDemoMode={() => handleToggleAppMode('demo')}
      />

      <FavoritesModal
        isOpen={isFavoritesModalOpen}
        onClose={() => setIsFavoritesModalOpen(false)}
        favorites={favorites}
        onRemoveFavorite={handleRemoveFavorite}
        onSelectProduct={setSelectedProductForDetails}
        onLoadInResaleCalculator={handleLoadInResaleCalculator}
        onExportCSV={() => StorageService.exportProductsToCSV(favorites, 'anprice_favoritos.csv')}
      />

      <DemoNoticeModal
        isOpen={isDemoNoticeModalOpen}
        onClose={() => setIsDemoNoticeModalOpen(false)}
        onSwitchToLive={() => handleToggleAppMode('live')}
      />
    </div>
  );
}

import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// In-memory cache to prevent burning Mercado Livre rate limits
interface CacheEntry {
  data: any;
  expiresAt: number;
}
const apiCache = new Map<string, CacheEntry>();

function getFromCache(key: string): any | null {
  const entry = apiCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    apiCache.delete(key);
    return null;
  }
  return entry.data;
}

function setInCache(key: string, data: any, ttlSeconds = 180) {
  apiCache.set(key, {
    data,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

// Temporary in-memory runtime credentials (if set by user in UI session)
let runtimeMeliToken = process.env.MELI_ACCESS_TOKEN || '';
let runtimeClientId = process.env.MELI_CLIENT_ID || '';
let runtimeClientSecret = process.env.MELI_CLIENT_SECRET || '';

// --- RENDER SERVER REVERSE PROXY TUNNEL ---
// Encaminha requisições e cookies para https://anprice-servidor.onrender.com
// quando o navegador do usuário bloqueia cookies entre o domínio do applet e o onrender.com
app.all('/render-api/*', async (req: Request, res: Response) => {
  const targetPath = req.originalUrl.replace(/^\/render-api/, '');
  const targetUrl = `https://anprice-servidor.onrender.com${targetPath}`;

  try {
    const headers: Record<string, string> = {
      'User-Agent': (req.headers['user-agent'] as string) || 'Mozilla/5.0 (AnPrice-Proxy)',
    };
    if (req.headers['content-type']) headers['content-type'] = req.headers['content-type'] as string;
    if (req.headers['cookie']) headers['cookie'] = req.headers['cookie'] as string;
    if (req.headers['accept']) headers['accept'] = req.headers['accept'] as string;

    const fetchOptions: RequestInit = {
      method: req.method,
      headers,
    };

    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body && Object.keys(req.body).length > 0) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const renderRes = await fetch(targetUrl, fetchOptions);

    // Repassa os cookies recebidos
    const setCookie = renderRes.headers.get('set-cookie');
    if (setCookie) {
      res.setHeader('Set-Cookie', setCookie);
    }

    res.status(renderRes.status);
    const contentType = renderRes.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await renderRes.json();
      return res.json(data);
    } else {
      const text = await renderRes.text();
      return res.send(text);
    }
  } catch (err: any) {
    return res.status(502).json({
      erro: `Falha na conexão do túnel com ${targetUrl}: ${err.message}`,
    });
  }
});

// 1. API Status Endpoint
app.get('/api/status', (_req: Request, res: Response) => {
  const hasClientId = Boolean(runtimeClientId || process.env.MELI_CLIENT_ID);
  const hasClientSecret = Boolean(runtimeClientSecret || process.env.MELI_CLIENT_SECRET);
  const hasAccessToken = Boolean(runtimeMeliToken || process.env.MELI_ACCESS_TOKEN);

  res.json({
    configured: hasAccessToken || (hasClientId && hasClientSecret),
    hasClientId,
    hasClientSecret,
    hasAccessToken,
    mode: (hasAccessToken || (hasClientId && hasClientSecret)) ? 'live' : 'demo',
    message: hasAccessToken
      ? 'Credenciais da API Oficial do Mercado Livre ativas no servidor.'
      : 'Modo Demonstração ativo por padrão. Credenciais do Mercado Livre não detectadas ou aguardando configuração.',
    officialDocUrl: 'https://developers.mercadolivre.com.br/pt_br/guia-de-inicio',
    cacheEntries: apiCache.size,
  });
});

// 2. Set/Test runtime credentials endpoint (stored only on server in memory, never exposed to client)
app.post('/api/config-test', async (req: Request, res: Response) => {
  const { clientId, clientSecret, accessToken } = req.body;

  if (accessToken) {
    runtimeMeliToken = accessToken.trim();
  }
  if (clientId) {
    runtimeClientId = clientId.trim();
  }
  if (clientSecret) {
    runtimeClientSecret = clientSecret.trim();
  }

  // Test request to Mercado Livre API
  try {
    const headers: Record<string, string> = {
      'User-Agent': 'AnPrice-PriceAnalyzer/1.0',
    };
    if (runtimeMeliToken) {
      headers['Authorization'] = `Bearer ${runtimeMeliToken}`;
    }

    const testUrl = 'https://api.mercadolibre.com/sites/MLB';
    const response = await fetch(testUrl, { headers });

    if (response.ok) {
      const siteData = await response.json();
      return res.json({
        success: true,
        message: 'Conexão com a API do Mercado Livre Brasil (MLB) realizada com sucesso!',
        site: siteData.name,
      });
    } else {
      const errBody = await response.text();
      return res.status(response.status).json({
        success: false,
        status: response.status,
        message: `A API do Mercado Livre retornou status ${response.status}: ${errBody || 'Verifique as permissões de acesso.'}`,
      });
    }
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: `Falha na conexão de rede com a API do Mercado Livre: ${err.message}`,
    });
  }
});

// Helper to map Mercado Livre raw API items to AnPrice Product contract
function mapMeliItemToProduct(item: any): any {
  let condition: 'new' | 'used' | 'reconditioned' | 'not_specified' = 'not_specified';
  if (item.condition === 'new') condition = 'new';
  else if (item.condition === 'used') condition = 'used';
  else if (item.condition === 'refurbished') condition = 'reconditioned';

  const sellerRep = item.seller?.seller_reputation;
  let reputationLevel: 'green' | 'yellow' | 'orange' | 'red' | null = null;
  const levelId = sellerRep?.level_id;
  if (levelId === '5_green') reputationLevel = 'green';
  else if (levelId === '4_light_green') reputationLevel = 'green';
  else if (levelId === '3_yellow') reputationLevel = 'yellow';
  else if (levelId === '2_orange') reputationLevel = 'orange';
  else if (levelId === '1_red') reputationLevel = 'red';

  let powerSellerStatus: 'platinum' | 'gold' | 'silver' | null = null;
  const powerStatus = sellerRep?.power_seller_status;
  if (powerStatus === 'platinum') powerSellerStatus = 'platinum';
  else if (powerStatus === 'gold') powerSellerStatus = 'gold';
  else if (powerStatus === 'silver') powerSellerStatus = 'silver';

  const shipping = item.shipping || {};

  return {
    id: item.id,
    marketplace: 'mercadolivre',
    title: item.title,
    price: item.price,
    originalPrice: item.original_price || null,
    currencyId: item.currency_id || 'BRL',
    condition,
    thumbnail: (item.thumbnail || '').replace('http://', 'https://'),
    permalink: item.permalink,
    isDemo: false,
    availableQuantity: item.available_quantity ?? null,
    soldQuantity: item.sold_quantity ?? null,
    seller: {
      id: String(item.seller?.id || ''),
      name: item.seller?.nickname || 'Vendedor Mercado Livre',
      reputationLevel,
      powerSellerStatus,
      positiveRatingPercent: sellerRep?.metrics?.sales?.completed
        ? Math.round((1 - (sellerRep?.metrics?.claims?.rate || 0)) * 100)
        : null,
      completedTransactions: sellerRep?.metrics?.sales?.completed ?? null,
      city: item.address?.city_name || item.seller_address?.city?.name || null,
      state: item.address?.state_name || item.seller_address?.state?.name || null,
    },
    shipping: {
      freeShipping: Boolean(shipping.free_shipping),
      logisticType: shipping.logistic_type || null,
      mode: shipping.mode || null,
      tag: shipping.logistic_type === 'fulfillment' ? 'Mercado Envios Full' : null,
      cost: shipping.free_shipping ? 0 : null,
    },
    installments: item.installments
      ? {
          quantity: item.installments.quantity,
          amount: item.installments.amount,
          rate: item.installments.rate,
        }
      : null,
    attributes: Array.isArray(item.attributes)
      ? item.attributes.map((a: any) => ({
          id: a.id,
          name: a.name,
          value_name: a.value_name,
        }))
      : [],
    queryTimestamp: new Date().toISOString(),
  };
}

// 3. Search Products Endpoint (Mercado Livre official or fallback)
app.get('/api/search', async (req: Request, res: Response) => {
  const query = (req.query.q as string || '').trim();
  const requestedMode = req.query.mode as string; // 'live' | 'demo'

  if (!query) {
    return res.status(400).json({ error: 'Termo de busca não fornecido.' });
  }

  // If client explicitly requested demo mode or if no credentials exist and demo is enabled
  const hasCredentials = Boolean(runtimeMeliToken || process.env.MELI_ACCESS_TOKEN || (runtimeClientId && runtimeClientSecret));

  if (requestedMode === 'demo') {
    // Client will use demo provider directly or fallback
    return res.json({
      source: 'demo',
      query,
      results: [],
      timestamp: new Date().toISOString(),
      message: 'Modo demonstração ativado pelo cliente.',
    });
  }

  // Check cache
  const cacheKey = `search:${query.toLowerCase()}`;
  const cached = getFromCache(cacheKey);
  if (cached) {
    return res.json({
      ...cached,
      cached: true,
    });
  }

  try {
    const meliUrl = `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(query)}&limit=50`;
    const headers: Record<string, string> = {
      'User-Agent': 'AnPrice-App/1.0',
      'Accept': 'application/json',
    };

    const token = runtimeMeliToken || process.env.MELI_ACCESS_TOKEN;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const meliResponse = await fetch(meliUrl, { headers });

    // Handle rate limit (429)
    if (meliResponse.status === 429) {
      const retryAfter = meliResponse.headers.get('Retry-After') || '60';
      return res.status(429).json({
        error: 'Rate Limit',
        status: 429,
        retryAfter,
        message: `Limite de requisições por minuto atingido na API do Mercado Livre. Por favor, aguarde ${retryAfter} segundos antes de tentar novamente.`,
      });
    }

    // Handle authentication/permission errors (401 or 403)
    if (meliResponse.status === 401 || meliResponse.status === 403) {
      const errText = await meliResponse.text();
      return res.status(meliResponse.status).json({
        error: 'Authentication Error',
        status: meliResponse.status,
        message: 'A API oficial do Mercado Livre requer credenciais de aplicação autorizadas para buscas públicas. Utilize o Modo Demonstração ou configure seu Client ID/Access Token em Configurações.',
        details: errText,
      });
    }

    if (!meliResponse.ok) {
      const errText = await meliResponse.text();
      return res.status(meliResponse.status).json({
        error: 'Mercado Livre API Error',
        status: meliResponse.status,
        message: `Erro retornado pelo Mercado Livre (${meliResponse.status}): ${errText}`,
      });
    }

    const data = await meliResponse.json();
    const rawResults = data.results || [];
    const mappedProducts = rawResults.map(mapMeliItemToProduct);

    const resultPayload = {
      source: 'mercadolivre',
      query,
      results: mappedProducts,
      total: data.paging?.total || mappedProducts.length,
      timestamp: new Date().toISOString(),
    };

    setInCache(cacheKey, resultPayload, 180);
    return res.json(resultPayload);
  } catch (err: any) {
    return res.status(500).json({
      error: 'Connection Error',
      message: `Falha ao conectar com o serviço do Mercado Livre: ${err.message}. Você pode usar o Modo de Demonstração para testar todas as funcionalidades.`,
    });
  }
});

// 4. Item Detail Endpoint
app.get('/api/items/:id', async (req: Request, res: Response) => {
  const itemId = req.params.id;
  if (!itemId) return res.status(400).json({ error: 'ID do item obrigatório.' });

  const cacheKey = `item:${itemId}`;
  const cached = getFromCache(cacheKey);
  if (cached) return res.json(cached);

  try {
    const headers: Record<string, string> = {
      'User-Agent': 'AnPrice-App/1.0',
    };
    const token = runtimeMeliToken || process.env.MELI_ACCESS_TOKEN;
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const itemUrl = `https://api.mercadolibre.com/items/${itemId}`;
    const response = await fetch(itemUrl, { headers });

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Não foi possível obter os detalhes do anúncio (${response.status})`,
      });
    }

    const itemData = await response.json();
    let sellerData = null;

    if (itemData.seller_id) {
      try {
        const userUrl = `https://api.mercadolibre.com/users/${itemData.seller_id}`;
        const userResp = await fetch(userUrl, { headers });
        if (userResp.ok) {
          sellerData = await userResp.json();
        }
      } catch {
        // Seller details optional
      }
    }

    const payload = {
      ...itemData,
      sellerDetail: sellerData,
    };

    setInCache(cacheKey, payload, 300);
    return res.json(payload);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Mount Vite or serve static files
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[AnPrice Server] Servidor executando em http://localhost:${PORT}`);
  });
}

startServer();

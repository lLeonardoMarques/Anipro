import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// O frontend é servido pelo servidor AnPrice (Render) na raiz do domínio.
// Em desenvolvimento, o Vite encaminha /api e /auth para o servidor, então
// o navegador vê uma única origem (http://localhost:5173): sem CORS e com
// cookie de sessão de primeira parte.
//
// Servidor de destino do proxy (padrão: produção no Render):
//   ANPRICE_API_URL=http://localhost:3000 npm run dev   → backend local
const apiTarget = process.env.ANPRICE_API_URL || 'https://anprice-servidor.onrender.com';
const apiOrigin = new URL(apiTarget).origin;

const proxy = {
  target: apiTarget,
  changeOrigin: true,
  secure: true,
  configure: (p: any) => {
    // O servidor só aceita POSTs vindos da própria origem (proteção CSRF).
    // O proxy roda fora do navegador e reescreve o Origin para a origem do servidor.
    p.on('proxyReq', (req: any) => {
      if (req.getHeader('origin')) req.setHeader('origin', apiOrigin);
    });
  },
};

export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    proxy: {
      '/api': proxy,
      '/auth': proxy,
      '/health': proxy,
    },
  },
});

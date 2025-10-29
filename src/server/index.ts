import { handleLogin, handleChangePassword, handleGetCurrentUser } from './auth';
import { initializeUsers } from './db/init';
import {
  searchConstructionSites,
  getWeeklyPlans,
  getWeeklyPlan,
  createWeeklyPlan,
  updateWeeklyPlan,
  deleteWeeklyPlan,
  getAllUsers,
} from './weekly-plans';
import {
  searchConstructionSites as searchSitesForDaily,
  getDailyPlans,
  getDailyPlan,
  createDailyPlan,
  updateDailyPlan,
  deleteDailyPlan,
  getAllUsers as getAllUsersForDaily,
} from './daily-plans';
import { getActivityStats } from './activity-stats';
import { getSalesStats } from './sales-stats';

const PORT = process.env.PORT || 3001;
const isDevelopment = process.env.NODE_ENV !== 'production';

console.log('🚀 Starting Misung E&C CRM Server...');
console.log('📁 Environment:', isDevelopment ? 'development' : 'production');
console.log('🔌 Port:', PORT);

// Initialize users from CSV
initializeUsers().catch((err) => {
  console.error('Failed to initialize users:', err);
});

// Create Vite server in middleware mode (only in development)
let vite: any = null;
if (isDevelopment) {
  const { createServer } = await import('vite');
  vite = await createServer({
    server: { middlewareMode: true },
    appType: 'spa',
    root: 'src/frontend',
  });
}

const server = Bun.serve({
  port: PORT,
  hostname: '0.0.0.0', // Bind to all network interfaces for Render
  idleTimeout: 60, // 60초 타임아웃 (기본 10초에서 증가)
  async fetch(req) {
    const url = new URL(req.url);
    const pathname = url.pathname;

    // Serve PWA assets directly
    if (pathname === '/manifest.json' ||
        pathname === '/service-worker.js' ||
        pathname === '/icon.svg' ||
        pathname.startsWith('/icon-')) {
      const file = Bun.file(`public${pathname}`);
      if (await file.exists()) {
        return new Response(file, {
          headers: {
            'Content-Type':
              pathname.endsWith('.json') ? 'application/json' :
              pathname.endsWith('.js') ? 'application/javascript' :
              pathname.endsWith('.svg') ? 'image/svg+xml' :
              'text/plain',
            'Cache-Control': pathname === '/service-worker.js'
              ? 'no-cache' // Service worker should always be fresh
              : 'public, max-age=3600'
          }
        });
      }
    }

    // API Routes
    if (pathname.startsWith('/api/')) {
      if (pathname === '/api/auth/login' && req.method === 'POST') {
        const body = await req.json();
        const result = await handleLogin(body);
        return Response.json(result, { status: result.success ? 200 : 401 });
      }

      if (pathname === '/api/auth/change-password' && req.method === 'POST') {
        const body = await req.json();
        const result = await handleChangePassword(body);
        return Response.json(result, { status: result.success ? 200 : 400 });
      }

      if (pathname === '/api/user/me' && req.method === 'GET') {
        const token = req.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
          return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }
        const result = await handleGetCurrentUser(token);
        return Response.json(result, { status: result.success ? 200 : 401 });
      }

      // Weekly Plans API
      if (pathname === '/api/construction-sites/search' && req.method === 'GET') {
        const query = url.searchParams.get('q') || '';
        const result = await searchConstructionSites(query);
        return Response.json(result, { status: result.success ? 200 : 400 });
      }

      if (pathname === '/api/weekly-plans' && req.method === 'GET') {
        const token = req.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
          return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const filters = {
          user_id: url.searchParams.get('user_id') || undefined,
          year: parseInt(url.searchParams.get('year') || new Date().getFullYear().toString()),
          month: parseInt(url.searchParams.get('month') || (new Date().getMonth() + 1).toString()),
          page: parseInt(url.searchParams.get('page') || '1'),
          limit: parseInt(url.searchParams.get('limit') || '20'),
        };

        const result = await getWeeklyPlans(filters);
        return Response.json(result, { status: result.success ? 200 : 400 });
      }

      if (pathname === '/api/weekly-plans' && req.method === 'POST') {
        const token = req.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
          return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const user = await handleGetCurrentUser(token);
        if (!user.success || !user.user) {
          return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const result = await createWeeklyPlan(body, user.user.id, user.user.name);
        return Response.json(result, { status: result.success ? 201 : 400 });
      }

      if (pathname.match(/^\/api\/weekly-plans\/\d+$/) && req.method === 'GET') {
        const id = parseInt(pathname.split('/').pop()!);
        const result = await getWeeklyPlan(id);
        return Response.json(result, { status: result.success ? 200 : 404 });
      }

      if (pathname.match(/^\/api\/weekly-plans\/\d+$/) && req.method === 'PUT') {
        const token = req.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
          return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const user = await handleGetCurrentUser(token);
        if (!user.success || !user.user) {
          return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const id = parseInt(pathname.split('/').pop()!);
        const body = await req.json();
        const result = await updateWeeklyPlan(id, body, user.user.id, user.user.name, user.user.role);
        return Response.json(result, { status: result.success ? 200 : 400 });
      }

      if (pathname.match(/^\/api\/weekly-plans\/\d+$/) && req.method === 'DELETE') {
        const token = req.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
          return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const user = await handleGetCurrentUser(token);
        if (!user.success || !user.user) {
          return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const id = parseInt(pathname.split('/').pop()!);
        const result = await deleteWeeklyPlan(id, user.user.id, user.user.role);
        return Response.json(result, { status: result.success ? 200 : 400 });
      }

      // Daily Plans API Routes
      if (pathname === '/api/daily-plans' && req.method === 'GET') {
        const token = req.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
          return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const filters = {
          user_id: url.searchParams.get('user_id') || undefined,
          year: parseInt(url.searchParams.get('year') || new Date().getFullYear().toString()),
          month: parseInt(url.searchParams.get('month') || (new Date().getMonth() + 1).toString()),
          page: parseInt(url.searchParams.get('page') || '1'),
          limit: parseInt(url.searchParams.get('limit') || '20'),
        };

        const result = await getDailyPlans(filters);
        return Response.json(result, { status: result.success ? 200 : 400 });
      }

      if (pathname === '/api/daily-plans' && req.method === 'POST') {
        const token = req.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
          return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const user = await handleGetCurrentUser(token);
        if (!user.success || !user.user) {
          return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const result = await createDailyPlan(body, user.user.id, user.user.name);
        return Response.json(result, { status: result.success ? 201 : 400 });
      }

      if (pathname.match(/^\/api\/daily-plans\/\d+$/) && req.method === 'GET') {
        const id = parseInt(pathname.split('/').pop()!);
        const result = await getDailyPlan(id);
        return Response.json(result, { status: result.success ? 200 : 404 });
      }

      if (pathname.match(/^\/api\/daily-plans\/\d+$/) && req.method === 'PUT') {
        const token = req.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
          return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const user = await handleGetCurrentUser(token);
        if (!user.success || !user.user) {
          return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const id = parseInt(pathname.split('/').pop()!);
        const body = await req.json();
        const result = await updateDailyPlan(id, body, user.user.id, user.user.name, user.user.role);
        return Response.json(result, { status: result.success ? 200 : 400 });
      }

      if (pathname.match(/^\/api\/daily-plans\/\d+$/) && req.method === 'DELETE') {
        const token = req.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
          return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const user = await handleGetCurrentUser(token);
        if (!user.success || !user.user) {
          return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const id = parseInt(pathname.split('/').pop()!);
        const result = await deleteDailyPlan(id, user.user.id, user.user.role);
        return Response.json(result, { status: result.success ? 200 : 400 });
      }

      // Activity Stats API Route
      if (pathname === '/api/activity-stats' && req.method === 'GET') {
        const token = req.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
          return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const year = parseInt(url.searchParams.get('year') || new Date().getFullYear().toString());
        const userId = url.searchParams.get('user_id') || undefined;
        const result = await getActivityStats(year, userId);
        return Response.json(result, { status: result.success ? 200 : 400 });
      }

      // Sales Stats API Route
      if (pathname === '/api/sales-stats' && req.method === 'GET') {
        const token = req.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
          return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const year = parseInt(url.searchParams.get('year') || new Date().getFullYear().toString());
        const userName = url.searchParams.get('user_name');

        if (!userName) {
          return Response.json({ success: false, message: 'user_name parameter is required' }, { status: 400 });
        }

        const result = await getSalesStats(year, userName);
        return Response.json(result, { status: result.success ? 200 : 400 });
      }

      if (pathname === '/api/users' && req.method === 'GET') {
        const authHeader = req.headers.get('Authorization');
        const token = authHeader?.replace('Bearer ', '').trim();

        if (!token || token === 'null' || token === 'undefined') {
          return Response.json({ success: false, message: 'Unauthorized - No token' }, { status: 401 });
        }

        const user = await handleGetCurrentUser(token);
        if (!user.success || !user.user || user.user.role !== 'admin') {
          return Response.json({ success: false, message: 'Admin only' }, { status: 403 });
        }

        const result = await getAllUsers();
        return Response.json(result, { status: result.success ? 200 : 400 });
      }

      return Response.json({ success: false, message: 'API route not found' }, { status: 404 });
    }

    // In production, serve static files from dist directory
    if (!isDevelopment) {
      const file = Bun.file(`dist${pathname}`);
      if (await file.exists()) {
        // 정적 파일 제공 시 캐시 헤더 설정
        const headers = new Headers();

        // HTML 파일은 캐시 안 함
        if (pathname.endsWith('.html')) {
          headers.set('Content-Type', 'text/html');
          headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
          headers.set('Pragma', 'no-cache');
          headers.set('Expires', '0');
        }
        // CSS/JS 파일은 1년 캐시 (파일명에 해시가 있으므로)
        else if (pathname.endsWith('.js') || pathname.endsWith('.css')) {
          headers.set('Cache-Control', 'public, max-age=31536000, immutable');
        }

        return new Response(file, { headers });
      }
      // Fallback to index.html for SPA routing
      const indexFile = Bun.file('dist/index.html');
      if (await indexFile.exists()) {
        return new Response(indexFile, {
          headers: {
            'Content-Type': 'text/html',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          }
        });
      }
      return new Response('Not Found', { status: 404 });
    }

    // In development, use Vite middleware
    return new Promise((resolve) => {
      // Convert Web Request to Node.js request/response
      const nodeReq: any = {
        url: pathname + url.search,
        method: req.method,
        headers: Object.fromEntries(req.headers.entries()),
      };

      const nodeRes: any = {
        statusCode: 200,
        headers: {},
        setHeader(name: string, value: string | string[]) {
          this.headers[name] = value;
        },
        getHeader(name: string) {
          return this.headers[name];
        },
        appendHeader(name: string, value: string) {
          const existing = this.headers[name];
          if (existing) {
            this.headers[name] = Array.isArray(existing)
              ? [...existing, value]
              : [existing, value];
          } else {
            this.headers[name] = value;
          }
        },
        removeHeader(name: string) {
          delete this.headers[name];
        },
        hasHeader(name: string) {
          return name in this.headers;
        },
        writeHead(status: number, headers?: any) {
          this.statusCode = status;
          if (headers) {
            Object.entries(headers).forEach(([key, value]) => {
              this.setHeader(key, value as string);
            });
          }
        },
        end(data: any) {
          const headers = new Headers();

          // 개발 환경에서 캐시 무효화 헤더 강제 추가
          if (isDevelopment) {
            headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            headers.set('Pragma', 'no-cache');
            headers.set('Expires', '0');
          }

          Object.entries(this.headers).forEach(([key, value]) => {
            if (Array.isArray(value)) {
              value.forEach(v => headers.append(key, v));
            } else {
              headers.set(key, value as string);
            }
          });
          resolve(new Response(data, {
            status: this.statusCode,
            headers,
          }));
        },
        write() {},
      };

      vite.middlewares(nodeReq, nodeRes, () => {
        // Fallback to index.html for SPA
        nodeRes.statusCode = 200;
        nodeRes.setHeader('Content-Type', 'text/html');
        nodeRes.end('<!DOCTYPE html><html><body><div id="root"></div><script type="module" src="/index.tsx"></script></body></html>');
      });
    });
  },
});

console.log(`✅ Server running on 0.0.0.0:${server.port}`);
console.log(`🌍 Access at http://localhost:${server.port}`);

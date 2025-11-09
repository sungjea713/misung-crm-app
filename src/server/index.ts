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
import { getOrderStats } from './order-stats';
import { getCostEfficiencyStats } from './cost-efficiency-stats';
import { getCollectionStats } from './collection-stats';
import {
  searchConstructionSites as searchSitesForSales,
  getSalesActivities,
  getSalesActivity,
  createSalesActivity,
  updateSalesActivity,
  deleteSalesActivity,
  getAllUsers as getAllUsersForSales,
} from './sales-activities';
import {
  searchConstructionSites as searchSitesForInvoice,
  getInvoiceRecords,
  getInvoiceRecord,
  createInvoiceRecord,
  updateInvoiceRecord,
  deleteInvoiceRecord,
  getSiteSummary,
} from './invoice-records';
import {
  getMonthlyOverInvestment,
  saveMonthlyOverInvestment,
  deleteMonthlyOverInvestment,
} from './monthly-over-investment';
import {
  getMonthlyCollection,
  saveMonthlyCollection,
  deleteMonthlyCollection,
} from './monthly-collection';
import {
  searchConstructionSites as searchSitesForCollection,
  getCollectionRecords,
  getCollectionRecord,
  createCollectionRecord,
  updateCollectionRecord,
  deleteCollectionRecord,
  getAllUsers as getAllUsersForCollection,
} from './collections';

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

    // Serve PWA assets and static files from public directory
    if (pathname === '/manifest.json' ||
        pathname === '/service-worker.js' ||
        pathname === '/icon.svg' ||
        pathname.startsWith('/icon-') ||
        pathname === '/misung-logo.png' ||
        pathname === '/favicon-512.png' ||
        pathname === '/favicon.ico') {
      const file = Bun.file(`public${pathname}`);
      if (await file.exists()) {
        return new Response(file, {
          headers: {
            'Content-Type':
              pathname.endsWith('.json') ? 'application/json' :
              pathname.endsWith('.js') ? 'application/javascript' :
              pathname.endsWith('.svg') ? 'image/svg+xml' :
              pathname.endsWith('.png') ? 'image/png' :
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
          created_by: url.searchParams.get('created_by') || undefined,
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
          created_by: url.searchParams.get('created_by') || undefined,
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
        const createdBy = url.searchParams.get('created_by') || undefined;
        const result = await getActivityStats(year, userId, createdBy);
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
        const showAllBranches = url.searchParams.get('show_all_branches') === 'true';

        if (!userName) {
          return Response.json({ success: false, message: 'user_name parameter is required' }, { status: 400 });
        }

        console.log('GET /api/sales-stats - Year:', year, 'User:', userName, 'ShowAllBranches:', showAllBranches);

        const result = await getSalesStats(year, userName, showAllBranches);
        return Response.json(result, { status: result.success ? 200 : 400 });
      }

      // Order Stats API Route (수주 실적)
      if (pathname === '/api/order-stats' && req.method === 'GET') {
        const token = req.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
          return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const year = parseInt(url.searchParams.get('year') || new Date().getFullYear().toString());
        const userName = url.searchParams.get('user_name');
        const showAllBranches = url.searchParams.get('show_all_branches') === 'true';

        if (!userName) {
          return Response.json({ success: false, message: 'user_name parameter is required' }, { status: 400 });
        }

        console.log('GET /api/order-stats - Year:', year, 'User:', userName, 'ShowAllBranches:', showAllBranches);

        const result = await getOrderStats(year, userName, showAllBranches);
        return Response.json(result, { status: result.success ? 200 : 400 });
      }

      // Cost Efficiency Stats API Route (원가 투입 효율 관리)
      if (pathname === '/api/cost-efficiency-stats' && req.method === 'GET') {
        const token = req.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
          return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const year = parseInt(url.searchParams.get('year') || new Date().getFullYear().toString());
        const userName = url.searchParams.get('user_name');
        const showAllBranches = url.searchParams.get('show_all_branches') === 'true';

        if (!userName) {
          return Response.json({ success: false, message: 'user_name parameter is required' }, { status: 400 });
        }

        console.log('GET /api/cost-efficiency-stats - Year:', year, 'User:', userName, 'ShowAllBranches:', showAllBranches);

        const result = await getCostEfficiencyStats(year, userName, showAllBranches);
        return Response.json(result, { status: result.success ? 200 : 400 });
      }

      // Collection Stats API Route (수금 실적 및 미수금 관리 현황)
      if (pathname === '/api/collection-stats' && req.method === 'GET') {
        const token = req.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
          return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const year = parseInt(url.searchParams.get('year') || new Date().getFullYear().toString());
        const userName = url.searchParams.get('user_name');
        const showAllBranches = url.searchParams.get('show_all_branches') === 'true';

        if (!userName) {
          return Response.json({ success: false, message: 'user_name parameter is required' }, { status: 400 });
        }

        console.log('GET /api/collection-stats - Year:', year, 'User:', userName, 'ShowAllBranches:', showAllBranches);

        const result = await getCollectionStats(year, userName, showAllBranches);
        return Response.json(result, { status: result.success ? 200 : 400 });
      }

      // Sales Activities API Routes
      // Search construction sites for sales activities
      if (pathname === '/api/sales-activities/construction-sites/search' && req.method === 'GET') {
        const token = req.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
          return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const query = url.searchParams.get('q') || '';
        const result = await searchSitesForSales(query);
        return Response.json(result, { status: result.success ? 200 : 400 });
      }

      // Get all users for sales activities (admin only)
      if (pathname === '/api/sales-activities/users' && req.method === 'GET') {
        const token = req.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
          return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const result = await handleGetCurrentUser(token);
        console.log('GET /api/sales-activities/users - Result:', result);
        if (!result.success || !result.user) {
          return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const user = result.user;
        console.log('User:', user.name, 'Role:', user.role);
        if (user.role !== 'admin') {
          console.log('Access denied - user is not admin');
          return Response.json({ success: false, message: 'Admin only' }, { status: 403 });
        }

        const usersResult = await getAllUsersForSales();
        return Response.json(usersResult, { status: usersResult.success ? 200 : 400 });
      }

      // Get all sales activities
      if (pathname === '/api/sales-activities' && req.method === 'GET') {
        const token = req.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
          return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const result = await handleGetCurrentUser(token);
        if (!result.success || !result.user) {
          return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const user = result.user;

        const filters = {
          user_id: url.searchParams.get('user_id') || undefined,
          created_by: url.searchParams.get('created_by') || undefined,
          year: parseInt(url.searchParams.get('year') || new Date().getFullYear().toString()),
          month: parseInt(url.searchParams.get('month') || (new Date().getMonth() + 1).toString()),
          activity_type: url.searchParams.get('activity_type') || undefined,
          site_type: url.searchParams.get('site_type') || undefined,
          page: parseInt(url.searchParams.get('page') || '1'),
          limit: parseInt(url.searchParams.get('limit') || '20'),
        };

        console.log('GET /api/sales-activities - User:', user.name, 'Role:', user.role, 'Filters:', filters);

        const activitiesResult = await getSalesActivities(user.role, user.id, filters);
        return Response.json(activitiesResult, { status: activitiesResult.success ? 200 : 400 });
      }

      // Get single sales activity
      if (pathname.match(/^\/api\/sales-activities\/\d+$/) && req.method === 'GET') {
        const token = req.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
          return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const result = await handleGetCurrentUser(token);
        if (!result.success || !result.user) {
          return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const user = result.user;
        const id = parseInt(pathname.split('/').pop()!);
        const activityResult = await getSalesActivity(id, user.role, user.id);
        return Response.json(activityResult, { status: activityResult.success ? 200 : 400 });
      }

      // Create sales activity
      if (pathname === '/api/sales-activities' && req.method === 'POST') {
        const token = req.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
          return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const result = await handleGetCurrentUser(token);
        if (!result.success || !result.user) {
          return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const user = result.user;
        const body = await req.json();
        // Remove created_by and updated_by from body - these should be set by the function
        const { created_by, updated_by, ...bodyWithoutAuditFields } = body;
        const activityData = {
          ...bodyWithoutAuditFields,
          user_id: user.id,
        };

        const createResult = await createSalesActivity(activityData, user.name);
        return Response.json(createResult, { status: createResult.success ? 201 : 400 });
      }

      // Update sales activity
      if (pathname.match(/^\/api\/sales-activities\/\d+$/) && req.method === 'PUT') {
        const token = req.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
          return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const result = await handleGetCurrentUser(token);
        if (!result.success || !result.user) {
          return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const user = result.user;
        const id = parseInt(pathname.split('/').pop()!);
        const body = await req.json();
        // Remove created_by and updated_by from body - these should be set by the function
        const { created_by, updated_by, ...bodyWithoutAuditFields } = body;

        const updateResult = await updateSalesActivity(id, bodyWithoutAuditFields, user.role, user.id, user.name);
        return Response.json(updateResult, { status: updateResult.success ? 200 : 400 });
      }

      // Delete sales activity
      if (pathname.match(/^\/api\/sales-activities\/\d+$/) && req.method === 'DELETE') {
        const token = req.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
          return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const result = await handleGetCurrentUser(token);
        if (!result.success || !result.user) {
          return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const user = result.user;
        const id = parseInt(pathname.split('/').pop()!);
        const deleteResult = await deleteSalesActivity(id, user.role, user.id);
        return Response.json(deleteResult, { status: deleteResult.success ? 200 : 400 });
      }

      // ========== Invoice Records API ==========

      // Search construction sites for invoice records
      if (pathname === '/api/invoice-records/construction-sites/search' && req.method === 'GET') {
        const query = url.searchParams.get('q');
        if (!query || query.length < 2) {
          return Response.json({ success: false, message: 'Query must be at least 2 characters' }, { status: 400 });
        }

        const result = await searchSitesForInvoice(query);
        return Response.json(result, { status: result.success ? 200 : 400 });
      }

      // Get site summary (매출/매입 금액)
      if (pathname === '/api/invoice-records/site-summary' && req.method === 'GET') {
        const cms = url.searchParams.get('cms');
        if (!cms) {
          return Response.json({ success: false, message: 'CMS code is required' }, { status: 400 });
        }

        const result = await getSiteSummary(cms);
        return Response.json(result, { status: result.success ? 200 : 400 });
      }

      // Get invoice records list
      if (pathname === '/api/invoice-records' && req.method === 'GET') {
        const token = req.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
          return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const result = await handleGetCurrentUser(token);
        if (!result.success || !result.user) {
          return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const user = result.user;

        const year = parseInt(url.searchParams.get('year') || new Date().getFullYear().toString());
        const month = parseInt(url.searchParams.get('month') || (new Date().getMonth() + 1).toString());
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '20');
        const userIdFilter = url.searchParams.get('user_id');

        // 관리자가 아닌 경우 본인 데이터만 조회
        const filters = {
          user_id: user.role === 'admin' && userIdFilter ? userIdFilter : user.id,
          year,
          month,
          page,
          limit,
        };

        const invoiceResult = await getInvoiceRecords(filters);
        return Response.json(invoiceResult, { status: invoiceResult.success ? 200 : 400 });
      }

      // Create invoice record
      if (pathname === '/api/invoice-records' && req.method === 'POST') {
        const token = req.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
          return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const result = await handleGetCurrentUser(token);
        if (!result.success || !result.user) {
          return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const user = result.user;
        const invoiceData = await req.json();

        console.log('POST /api/invoice-records - User:', user.name, 'Data:', invoiceData);

        const createResult = await createInvoiceRecord(invoiceData, user.id, user.name);
        return Response.json(createResult, { status: createResult.success ? 200 : 400 });
      }

      // Get invoice record by ID
      if (pathname.match(/^\/api\/invoice-records\/\d+$/) && req.method === 'GET') {
        const token = req.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
          return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const result = await handleGetCurrentUser(token);
        if (!result.success || !result.user) {
          return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const id = parseInt(pathname.split('/').pop()!);
        const invoiceResult = await getInvoiceRecord(id);
        return Response.json(invoiceResult, { status: invoiceResult.success ? 200 : 400 });
      }

      // Update invoice record
      if (pathname.match(/^\/api\/invoice-records\/\d+$/) && req.method === 'PUT') {
        const token = req.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
          return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const result = await handleGetCurrentUser(token);
        if (!result.success || !result.user) {
          return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const user = result.user;
        const id = parseInt(pathname.split('/').pop()!);
        const invoiceData = await req.json();

        console.log('PUT /api/invoice-records/' + id, '- User:', user.name, 'Data:', invoiceData);

        const updateResult = await updateInvoiceRecord(id, invoiceData, user.id, user.name, user.role);
        return Response.json(updateResult, { status: updateResult.success ? 200 : 400 });
      }

      // Delete invoice record
      if (pathname.match(/^\/api\/invoice-records\/\d+$/) && req.method === 'DELETE') {
        const token = req.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
          return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const result = await handleGetCurrentUser(token);
        if (!result.success || !result.user) {
          return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const user = result.user;
        const id = parseInt(pathname.split('/').pop()!);
        const deleteResult = await deleteInvoiceRecord(id, user.id, user.role);
        return Response.json(deleteResult, { status: deleteResult.success ? 200 : 400 });
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

      // Monthly Over Investment API Routes
      // Get monthly over investment data
      if (pathname === '/api/monthly-over-investment' && req.method === 'GET') {
        const token = req.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
          return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const year = parseInt(url.searchParams.get('year') || new Date().getFullYear().toString());
        const month = parseInt(url.searchParams.get('month') || (new Date().getMonth() + 1).toString());

        const result = await getMonthlyOverInvestment(year, month);
        return Response.json(result, { status: result.success ? 200 : 400 });
      }

      // Save monthly over investment data
      if (pathname === '/api/monthly-over-investment' && req.method === 'POST') {
        const token = req.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
          return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const userResult = await handleGetCurrentUser(token);
        if (!userResult.success || !userResult.user || userResult.user.role !== 'admin') {
          return Response.json({ success: false, message: 'Admin only' }, { status: 403 });
        }

        const data = await req.json();
        const result = await saveMonthlyOverInvestment(data, userResult.user.name);
        return Response.json(result, { status: result.success ? 200 : 400 });
      }

      // Delete monthly over investment data
      if (pathname === '/api/monthly-over-investment' && req.method === 'DELETE') {
        const token = req.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
          return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const userResult = await handleGetCurrentUser(token);
        if (!userResult.success || !userResult.user || userResult.user.role !== 'admin') {
          return Response.json({ success: false, message: 'Admin only' }, { status: 403 });
        }

        const year = parseInt(url.searchParams.get('year') || new Date().getFullYear().toString());
        const month = parseInt(url.searchParams.get('month') || (new Date().getMonth() + 1).toString());

        const result = await deleteMonthlyOverInvestment(year, month);
        return Response.json(result, { status: result.success ? 200 : 400 });
      }

      // Monthly Collection API Routes
      // Get monthly collection data
      if (pathname === '/api/monthly-collection' && req.method === 'GET') {
        const token = req.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
          return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const year = parseInt(url.searchParams.get('year') || new Date().getFullYear().toString());
        const month = parseInt(url.searchParams.get('month') || (new Date().getMonth() + 1).toString());

        const result = await getMonthlyCollection(year, month);
        return Response.json(result, { status: result.success ? 200 : 400 });
      }

      // Save monthly collection data
      if (pathname === '/api/monthly-collection' && req.method === 'POST') {
        const token = req.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
          return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const userResult = await handleGetCurrentUser(token);
        if (!userResult.success || !userResult.user || userResult.user.role !== 'admin') {
          return Response.json({ success: false, message: 'Admin only' }, { status: 403 });
        }

        const data = await req.json();
        const result = await saveMonthlyCollection(data, userResult.user.name);
        return Response.json(result, { status: result.success ? 200 : 400 });
      }

      // Delete monthly collection data
      if (pathname === '/api/monthly-collection' && req.method === 'DELETE') {
        const token = req.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
          return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const userResult = await handleGetCurrentUser(token);
        if (!userResult.success || !userResult.user || userResult.user.role !== 'admin') {
          return Response.json({ success: false, message: 'Admin only' }, { status: 403 });
        }

        const year = parseInt(url.searchParams.get('year') || new Date().getFullYear().toString());
        const month = parseInt(url.searchParams.get('month') || (new Date().getMonth() + 1).toString());

        const result = await deleteMonthlyCollection(year, month);
        return Response.json(result, { status: result.success ? 200 : 400 });
      }

      // Collection Records API Routes
      // Get all users for collection (admin only)
      if (pathname === '/api/collections/users' && req.method === 'GET') {
        const token = req.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
          return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const userResult = await handleGetCurrentUser(token);
        if (!userResult.success || !userResult.user || userResult.user.role !== 'admin') {
          return Response.json({ success: false, message: 'Admin only' }, { status: 403 });
        }

        const result = await getAllUsersForCollection();
        return Response.json(result, { status: result.success ? 200 : 400 });
      }

      // Search construction sites for collections
      if (pathname === '/api/collections/sites' && req.method === 'GET') {
        const token = req.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
          return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const query = url.searchParams.get('query') || '';
        const result = await searchSitesForCollection(query);
        return Response.json(result, { status: result.success ? 200 : 400 });
      }

      // Get collection records (list)
      if (pathname === '/api/collections' && req.method === 'GET') {
        const token = req.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
          return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const filters = {
          user_id: url.searchParams.get('user_id') || undefined,
          created_by: url.searchParams.get('created_by') || undefined,
          year: parseInt(url.searchParams.get('year') || new Date().getFullYear().toString()),
          month: parseInt(url.searchParams.get('month') || (new Date().getMonth() + 1).toString()),
          page: parseInt(url.searchParams.get('page') || '1'),
          limit: parseInt(url.searchParams.get('limit') || '20'),
        };

        const result = await getCollectionRecords(filters);
        return Response.json(result, { status: result.success ? 200 : 400 });
      }

      // Create collection record
      if (pathname === '/api/collections' && req.method === 'POST') {
        const token = req.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
          return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const userResult = await handleGetCurrentUser(token);
        if (!userResult.success || !userResult.user) {
          return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const data = await req.json();
        const result = await createCollectionRecord(userResult.user.id, userResult.user.name, data);
        return Response.json(result, { status: result.success ? 201 : 400 });
      }

      // Get single collection record
      if (pathname.match(/^\/api\/collections\/\d+$/) && req.method === 'GET') {
        const token = req.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
          return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const id = parseInt(pathname.split('/')[3]);
        const result = await getCollectionRecord(id);
        return Response.json(result, { status: result.success ? 200 : 400 });
      }

      // Update collection record
      if (pathname.match(/^\/api\/collections\/\d+$/) && req.method === 'PUT') {
        const token = req.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
          return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const userResult = await handleGetCurrentUser(token);
        if (!userResult.success || !userResult.user) {
          return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const id = parseInt(pathname.split('/')[3]);
        const data = await req.json();
        const result = await updateCollectionRecord(id, userResult.user.id, userResult.user.name, data);
        return Response.json(result, { status: result.success ? 200 : 400 });
      }

      // Delete collection record
      if (pathname.match(/^\/api\/collections\/\d+$/) && req.method === 'DELETE') {
        const token = req.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
          return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const userResult = await handleGetCurrentUser(token);
        if (!userResult.success || !userResult.user) {
          return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const id = parseInt(pathname.split('/')[3]);
        const result = await deleteCollectionRecord(id, userResult.user.id);
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

    // Development: use Vite middleware
    if (isDevelopment) {
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
            headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            headers.set('Pragma', 'no-cache');
            headers.set('Expires', '0');

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
    }

    // Production: Use Bun.serve with HTML import
    // Try to serve static files from src/frontend
    const filePath = `src/frontend${pathname}`;
    const file = Bun.file(filePath);

    if (await file.exists()) {
      // Determine content type
      let contentType = 'text/plain';
      if (pathname.endsWith('.tsx') || pathname.endsWith('.ts')) {
        contentType = 'application/javascript';
      } else if (pathname.endsWith('.jsx') || pathname.endsWith('.js')) {
        contentType = 'application/javascript';
      } else if (pathname.endsWith('.css')) {
        contentType = 'text/css';
      } else if (pathname.endsWith('.json')) {
        contentType = 'application/json';
      } else if (pathname.endsWith('.svg')) {
        contentType = 'image/svg+xml';
      } else if (pathname.endsWith('.png')) {
        contentType = 'image/png';
      } else if (pathname.endsWith('.jpg') || pathname.endsWith('.jpeg')) {
        contentType = 'image/jpeg';
      }

      return new Response(file, {
        headers: {
          'Content-Type': contentType,
        },
      });
    }

    // SPA fallback: serve index.html for all other routes
    const indexHtml = Bun.file('src/frontend/index.html');
    if (await indexHtml.exists()) {
      return new Response(indexHtml, {
        headers: {
          'Content-Type': 'text/html',
        },
      });
    }

    // If index.html doesn't exist, return 404
    return new Response('Not Found', { status: 404 });
  },
});

console.log(`✅ Server running on 0.0.0.0:${server.port}`);
console.log(`🌍 Access at http://localhost:${server.port}`);

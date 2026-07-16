export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REFRESH_TOKEN: '/auth/refresh-token',
    LOGOUT: '/auth/logout',
    ME: '/auth/me'
  },
  DASHBOARD: {
    OVERVIEW: '/dashboard/overview',
    SALES: '/dashboard/sales',
    FINANCE: '/dashboard/finance',
    BUDGET_REPORT: '/dashboard/budget-report'
  },
  INVENTORY: {
    BASE: '/inventory',
    ALERTS: '/inventory/alerts',
    RECOMMENDATIONS: '/inventory/recommendations'
  },
  PRODUCTS: '/products',
  SALES: '/sales',
  SUPPLIERS: '/suppliers',
  MARKET: '/market'
};

export const ROLES = {
  ADMIN: 'admin',
  WAREHOUSE_MANAGER: 'warehouse',
  SALES_DIRECTOR: 'sales_director',
  PURCHASE_MANAGER: 'purchase',
  FINANCE_MANAGER: 'finance'
};

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
};

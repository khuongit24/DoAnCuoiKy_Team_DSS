export const ROLES = {
  ADMIN: 'admin',
  PURCHASE_MANAGER: 'purchase_manager',
  WAREHOUSE_MANAGER: 'warehouse_manager',
  SALES_DIRECTOR: 'sales_director',
  FINANCE: 'finance'
};

export const ROLE_MENU_MAPPING = {
  [ROLES.ADMIN]: ['dashboard', 'products', 'inventory', 'sales', 'suppliers', 'market'],
  [ROLES.PURCHASE_MANAGER]: ['dashboard', 'products', 'suppliers', 'market'],
  [ROLES.WAREHOUSE_MANAGER]: ['dashboard', 'products', 'inventory'],
  [ROLES.SALES_DIRECTOR]: ['dashboard', 'products', 'sales', 'market'],
  [ROLES.FINANCE]: ['dashboard', 'sales', 'inventory', 'suppliers'],
};

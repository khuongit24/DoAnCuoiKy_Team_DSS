const fs = require('fs');

const files = [
    "src/pages/DataManagement/InventoryPage.jsx",
    "src/pages/DataManagement/MarketPage.jsx",
    "src/pages/DataManagement/ProductsPage.jsx",
    "src/pages/DataManagement/SalesPage.jsx",
    "src/pages/DataManagement/SuppliersPage.jsx",
    "src/pages/Finance/FinanceDashboard.jsx",
    "src/pages/Login/LoginPage.jsx",
    "src/pages/NotFound/NotFoundPage.jsx",
    "src/pages/PurchaseManager/PurchaseManagerDashboard.jsx",
    "src/pages/SalesDirector/SalesDirectorDashboard.jsx",
    "src/pages/Settings/SettingsPage.jsx",
    "src/pages/Unauthorized/UnauthorizedPage.jsx",
    "src/pages/Warehouse/WarehouseDashboard.jsx"
];

for (const file of files) {
    let content = fs.readFileSync(file, 'utf-8');
    
    // Clean up all imports of useDocumentTitle
    content = content.replace(/import useDocumentTitle from '.*';\n?/g, '');
    
    // Clean up all usages
    content = content.replace(/[ \t]*useDocumentTitle\([^)]+\);\n?/g, '');

    // Add exactly one import after the first import React
    content = content.replace(/(import React.*?from 'react';\n?)/, `$1import useDocumentTitle from '../../hooks/useDocumentTitle';\n`);

    // Determine title
    let componentNameMatch = content.match(/const\s+([A-Za-z0-9_]+)\s*=\s*\(/) || content.match(/function\s+([A-Za-z0-9_]+)\s*\(/);
    let componentName = componentNameMatch ? componentNameMatch[1] : '';
    
    let title = componentName.replace(/Page|Dashboard/, '');
    if (title === 'PurchaseManager') title = 'Purchase Manager';
    if (title === 'SalesDirector') title = 'Sales Director';
    if (title === 'NotFound') title = '404 Không tìm thấy';
    if (title === 'Unauthorized') title = '403 Không có quyền';
    if (title === 'Login') title = 'Đăng nhập';

    // Add exactly one usage inside the component body
    const hookUsage = `  useDocumentTitle('${title}');\n`;
    content = content.replace(new RegExp(`(const ${componentName} = \\([^)]*\\) => {\\n)`), `$1${hookUsage}`);
    content = content.replace(new RegExp(`(function ${componentName}\\([^)]*\\) {\\n)`), `$1${hookUsage}`);

    fs.writeFileSync(file, content);
}

/* assets/components/sidebar.js */
const Sidebar = {
    render: (activePage = 'dashboard') => {
        const menuItems = [
            { id: 'dashboard', name: 'Dashboard', icon: 'fa-solid fa-chart-pie', link: 'index.html' },
            { id: 'transactions', name: 'Transactions', icon: 'fa-solid fa-money-bill-transfer', link: 'transactions.html' },
            { id: 'categories', name: 'Categories', icon: 'fa-solid fa-tags', link: 'categories.html' },
            { id: 'accounts', name: 'Accounts', icon: 'fa-solid fa-building-columns', link: 'accounts.html' },
            { id: 'budget', name: 'Budget', icon: 'fa-solid fa-wallet', link: 'budget.html' },
            { id: 'reports', name: 'Reports', icon: 'fa-solid fa-chart-line', link: 'reports.html' },
            { id: 'kpi', name: 'KPI Metrics', icon: 'fa-solid fa-gauge-high', link: 'kpi.html' },
            { id: 'settings', name: 'Settings', icon: 'fa-solid fa-gear', link: 'settings.html' }
        ];

        let menuHtml = menuItems.map(item => `
            <a href="${item.link}" class="menu-item ${activePage === item.id ? 'active' : ''}">
                <i class="${item.icon}"></i>
                <span>${item.name}</span>
            </a>
        `).join('');

        return `
            <aside class="sidebar" id="sidebar">
                <div class="sidebar-header">
                    <div class="logo">
                        <i class="fa-solid fa-leaf text-primary"></i>
                        <h2>MyFinance</h2>
                    </div>
                    <button class="close-sidebar" id="closeSidebarBtn">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <nav class="sidebar-nav">
                    ${menuHtml}
                </nav>
                <div class="sidebar-footer">
                    <p class="text-muted" style="font-size: 0.8rem; text-align: center;">© 2026 MyFinance</p>
                </div>
            </aside>
        `;
    }
};
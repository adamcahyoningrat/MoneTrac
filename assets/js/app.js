/* assets/js/app.js */
const App = {
    init: (pageId, pageTitle) => {
        // Render Components
        const appContainer = document.getElementById('app-container');
        
        // Insert Sidebar
        appContainer.insertAdjacentHTML('afterbegin', Sidebar.render(pageId));
        
        // Insert Navbar inside main-content
        const mainContent = document.getElementById('main-content');
        mainContent.insertAdjacentHTML('afterbegin', Navbar.render(pageTitle));

        App.bindEvents();
        App.applyTheme();
    },

    bindEvents: () => {
        // Mobile Sidebar Toggle
        const menuToggleBtn = document.getElementById('menuToggleBtn');
        const closeSidebarBtn = document.getElementById('closeSidebarBtn');
        const sidebar = document.getElementById('sidebar');

        if (menuToggleBtn) {
            menuToggleBtn.addEventListener('click', () => {
                sidebar.classList.add('active');
            });
        }

        if (closeSidebarBtn) {
            closeSidebarBtn.addEventListener('click', () => {
                sidebar.classList.remove('active');
            });
        }

        // Theme Toggle
        const themeToggleBtn = document.getElementById('themeToggleBtn');
        if (themeToggleBtn) {
            themeToggleBtn.addEventListener('click', App.toggleTheme);
        }

        // --- KODE BARU DITARUH DI SINI ---
        // Dengarkan event selesai tarik dari cloud (Google Sheets)
        window.addEventListener('cloudDataReady', () => {
            Utils.showToast('Data synced with cloud ☁️', 'success');
            // Jika ada fungsi render di halaman yang sedang aktif, jalankan
            if (typeof Dashboard !== 'undefined') Dashboard.init();
            if (typeof Transactions !== 'undefined') Transactions.applyFiltersAndRender();
            if (typeof Categories !== 'undefined') Categories.render();
            if (typeof Accounts !== 'undefined') Accounts.render();
            if (typeof Budget !== 'undefined') Budget.render();
            if (typeof KPI !== 'undefined') KPI.init();
            App.applyTheme();
        });
    },

    applyTheme: () => {
        const settings = StorageDB.getSettings();
        document.documentElement.setAttribute('data-theme', settings.theme);
        
        const themeIcon = document.querySelector('#themeToggleBtn i');
        if (themeIcon) {
            themeIcon.className = settings.theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
        }
    },

    toggleTheme: () => {
        const settings = StorageDB.getSettings();
        settings.theme = settings.theme === 'light' ? 'dark' : 'light';
        StorageDB.saveSettings(settings);
        App.applyTheme();
        
        // Dispatch event so charts can re-render colors if needed
        window.dispatchEvent(new Event('themeChanged'));
    }
};
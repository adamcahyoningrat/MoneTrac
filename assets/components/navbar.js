/* assets/components/navbar.js */
const Navbar = {
    render: (pageTitle = 'Dashboard') => {
        return `
            <header class="top-navbar">
                <div class="nav-left">
                    <button class="menu-toggle" id="menuToggleBtn">
                        <i class="fa-solid fa-bars"></i>
                    </button>
                    <h2 class="page-title">${pageTitle}</h2>
                </div>
                <div class="nav-right">
                    <button class="theme-toggle" id="themeToggleBtn" title="Toggle Dark Mode">
                        <i class="fa-solid fa-moon"></i>
                    </button>
                    <div class="user-profile">
                        <div class="avatar">
                            <i class="fa-solid fa-user"></i>
                        </div>
                    </div>
                </div>
            </header>
        `;
    }
};
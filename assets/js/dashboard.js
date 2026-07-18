/* assets/js/dashboard.js */
document.addEventListener('DOMContentLoaded', () => {
    App.init('dashboard', 'Dashboard');
    Dashboard.init();
});

const Dashboard = {
    charts: {
        cashflow: null,
        expenseCategory: null
    },

    init: () => {
        Dashboard.calculateKPIs();
        Dashboard.renderCharts();
        
        // Re-render charts on theme change for color adaptation
        window.addEventListener('themeChanged', () => {
            Dashboard.renderCharts();
        });
    },

    getChartColors: () => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        return {
            textColor: isDark ? '#94A3B8' : '#64748B',
            gridColor: isDark ? '#334155' : '#E2E8F0',
            income: '#16A34A',
            expense: '#DC2626',
            palette: ['#2563EB', '#16A34A', '#F59E0B', '#DC2626', '#8B5CF6', '#38BDF8']
        };
    },

    calculateKPIs: () => {
        const accounts = StorageDB.getData(StorageDB.keys.ACCOUNTS);
        const transactions = StorageDB.getData(StorageDB.keys.TRANSACTIONS);
        const settings = StorageDB.getSettings();
        const { start, end } = Utils.getCurrentMonthRange();

        // Total Balance
        const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);

        // Monthly calculations
        let monthlyIncome = 0;
        let monthlyExpense = 0;

        transactions.forEach(t => {
            const tDate = new Date(t.date);
            if (tDate >= start && tDate <= end) {
                if (t.type === 'Income') monthlyIncome += Number(t.amount);
                if (t.type === 'Expense') monthlyExpense += Number(t.amount);
            }
        });

        const cashFlow = monthlyIncome - monthlyExpense;

        // Update DOM
        document.getElementById('kpi-balance').textContent = Utils.formatCurrency(totalBalance, settings.currency);
        document.getElementById('kpi-income').textContent = Utils.formatCurrency(monthlyIncome, settings.currency);
        document.getElementById('kpi-expense').textContent = Utils.formatCurrency(monthlyExpense, settings.currency);
        document.getElementById('kpi-cashflow').textContent = Utils.formatCurrency(cashFlow, settings.currency);
    },

    renderCharts: () => {
        const colors = Dashboard.getChartColors();
        const transactions = StorageDB.getData(StorageDB.keys.TRANSACTIONS);
        const { start, end } = Utils.getCurrentMonthRange();

        // Filter this month's transactions
        const monthTx = transactions.filter(t => {
            const d = new Date(t.date);
            return d >= start && d <= end;
        });

        // Prepare data for Cashflow Chart (Income vs Expense over time)
        // Group by day
        const dailyData = {};
        monthTx.forEach(t => {
            const day = new Date(t.date).getDate();
            if (!dailyData[day]) dailyData[day] = { income: 0, expense: 0 };
            if (t.type === 'Income') dailyData[day].income += Number(t.amount);
            if (t.type === 'Expense') dailyData[day].expense += Number(t.amount);
        });

        const labels = Object.keys(dailyData).sort((a,b) => a - b).map(d => `Day ${d}`);
        const incomeData = Object.keys(dailyData).sort((a,b) => a - b).map(d => dailyData[d].income);
        const expenseData = Object.keys(dailyData).sort((a,b) => a - b).map(d => dailyData[d].expense);

        // Prepare data for Category Chart
        const catData = {};
        monthTx.filter(t => t.type === 'Expense').forEach(t => {
            catData[t.category] = (catData[t.category] || 0) + Number(t.amount);
        });

        // Destroy previous charts if they exist (for theme toggling)
        if (Dashboard.charts.cashflow) Dashboard.charts.cashflow.destroy();
        if (Dashboard.charts.expenseCategory) Dashboard.charts.expenseCategory.destroy();

        // Render Cashflow Bar Chart
        const ctx1 = document.getElementById('cashflowChart').getContext('2d');
        Dashboard.charts.cashflow = new Chart(ctx1, {
            type: 'bar',
            data: {
                labels: labels.length ? labels : ['No Data'],
                datasets: [
                    { label: 'Income', data: incomeData.length ? incomeData : [0], backgroundColor: colors.income, borderRadius: 4 },
                    { label: 'Expense', data: expenseData.length ? expenseData : [0], backgroundColor: colors.expense, borderRadius: 4 }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { labels: { color: colors.textColor } } },
                scales: {
                    x: { ticks: { color: colors.textColor }, grid: { display: false } },
                    y: { ticks: { color: colors.textColor }, grid: { color: colors.gridColor } }
                }
            }
        });

        // Render Doughnut Chart
        const ctx2 = document.getElementById('expenseCategoryChart').getContext('2d');
        Dashboard.charts.expenseCategory = new Chart(ctx2, {
            type: 'doughnut',
            data: {
                labels: Object.keys(catData).length ? Object.keys(catData) : ['No Data'],
                datasets: [{
                    data: Object.values(catData).length ? Object.values(catData) : [1],
                    backgroundColor: Object.keys(catData).length ? colors.palette : [colors.gridColor],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { color: colors.textColor } } },
                cutout: '75%'
            }
        });
    }
};

// Helper function to insert sample transactions if DB is completely empty 
// (Fulfilling the "Generate sample dashboard data" requirement)
function generateSampleData() {
    let transactions = StorageDB.getData(StorageDB.keys.TRANSACTIONS);
    if (transactions.length === 0) {
        const categories = StorageDB.getData(StorageDB.keys.CATEGORIES);
        const accounts = StorageDB.getData(StorageDB.keys.ACCOUNTS);
        
        if (categories.length > 0 && accounts.length > 0) {
            const today = new Date();
            const sampleTx = [
                { id: Utils.generateId(), date: today.toISOString(), type: 'Income', category: 'Salary', account: accounts[1].id, amount: 4500, description: 'Monthly Salary' },
                { id: Utils.generateId(), date: today.toISOString(), type: 'Expense', category: 'Food & Dining', account: accounts[0].id, amount: 150, description: 'Groceries' },
                { id: Utils.generateId(), date: new Date(today.setDate(today.getDate() - 2)).toISOString(), type: 'Expense', category: 'Utilities', account: accounts[1].id, amount: 200, description: 'Electric Bill' }
            ];
            StorageDB.saveData(StorageDB.keys.TRANSACTIONS, sampleTx);
        }
    }
}
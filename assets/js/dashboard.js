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
        
        // 1. Dapatkan waktu saat ini dengan Javascript murni (Anti-Gagal Zona Waktu)
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        // 2. Hitung Saldo Tiap Akun Secara REAL-TIME (Dinamis dari riwayat transaksi)
        let totalBalance = 0;
        
        accounts.forEach(acc => {
            // Gunakan angka saldo statis lama sebagai saldo awal (initial balance)
            let accBalance = Number(acc.balance || 0); 
            
            transactions.forEach(t => {
                // Jika transaksi menggunakan akun ini (Uang Keluar/Masuk)
                if (t.account === acc.id) {
                    if (t.type === 'Income') accBalance += Number(t.amount);
                    if (t.type === 'Expense') accBalance -= Number(t.amount);
                    if (t.type === 'Transfer') accBalance -= Number(t.amount); // Uang keluar dari akun sumber
                }
                // Jika akun ini menerima uang dari Transfer
                if (t.type === 'Transfer' && t.toAccount === acc.id) {
                    accBalance += Number(t.amount); 
                }
            });
            
            totalBalance += accBalance;
        });

        // 3. Hitung Income & Expense KHUSUS bulan ini saja
        let monthlyIncome = 0;
        let monthlyExpense = 0;

        transactions.forEach(t => {
            const tDate = new Date(t.date);
            // Pengecekan bulan & tahun yang akurat menggunakan getMonth()
            if (tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear) {
                // Gunakan toLowerCase() agar tidak gagal walau ada salah ketik huruf besar/kecil
                const txType = (t.type || '').trim().toLowerCase();
                if (txType === 'income') monthlyIncome += Number(t.amount);
                if (txType === 'expense') monthlyExpense += Number(t.amount);
            }
        });

        const cashFlow = monthlyIncome - monthlyExpense;

        // 4. Update Angka di Layar
        const elBalance = document.getElementById('kpi-balance');
        const elIncome = document.getElementById('kpi-income');
        const elExpense = document.getElementById('kpi-expense');
        const elCashflow = document.getElementById('kpi-cashflow');

        if (elBalance) elBalance.textContent = Utils.formatCurrency(totalBalance, settings.currency);
        if (elIncome) elIncome.textContent = Utils.formatCurrency(monthlyIncome, settings.currency);
        if (elExpense) elExpense.textContent = Utils.formatCurrency(monthlyExpense, settings.currency);
        if (elCashflow) elCashflow.textContent = Utils.formatCurrency(cashFlow, settings.currency);
    },

    renderCharts: () => {
        const colors = Dashboard.getChartColors();
        const transactions = StorageDB.getData(StorageDB.keys.TRANSACTIONS);
        
        // Gunakan pencocokan tanggal yang akurat
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        // Ambil data transaksi bulan ini saja untuk grafik
        const monthTx = transactions.filter(t => {
            const d = new Date(t.date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });

        // Siapkan data Grafik Cashflow (Bar)
        const dailyData = {};
        monthTx.forEach(t => {
            const day = new Date(t.date).getDate();
            if (!dailyData[day]) dailyData[day] = { income: 0, expense: 0 };
            
            const txType = (t.type || '').trim().toLowerCase();
            if (txType === 'income') dailyData[day].income += Number(t.amount);
            if (txType === 'expense') dailyData[day].expense += Number(t.amount);
        });

        const labels = Object.keys(dailyData).sort((a,b) => a - b).map(d => `Day ${d}`);
        const incomeData = Object.keys(dailyData).sort((a,b) => a - b).map(d => dailyData[d].income);
        const expenseData = Object.keys(dailyData).sort((a,b) => a - b).map(d => dailyData[d].expense);

        // Siapkan data Grafik Kategori (Doughnut)
        const catData = {};
        monthTx.filter(t => (t.type || '').trim().toLowerCase() === 'expense').forEach(t => {
            catData[t.category] = (catData[t.category] || 0) + Number(t.amount);
        });

        // Hapus canvas grafik lama jika tema diganti
        if (Dashboard.charts.cashflow) Dashboard.charts.cashflow.destroy();
        if (Dashboard.charts.expenseCategory) Dashboard.charts.expenseCategory.destroy();

        // Render Grafik Cashflow
        const ctx1 = document.getElementById('cashflowChart');
        if (ctx1) {
            Dashboard.charts.cashflow = new Chart(ctx1.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: labels.length ? labels : ['No Data'],
                    datasets: [
                        { label: 'Income', data: incomeData.length ? incomeData : [0], backgroundColor: colors.income, borderRadius: 4 },
                        { label: 'Expense', data: expenseData.length ? expenseData : [0], backgroundColor: colors.expense, borderRadius: 4 }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { labels: { color: colors.textColor } } },
                    scales: {
                        x: { ticks: { color: colors.textColor }, grid: { display: false } },
                        y: { ticks: { color: colors.textColor }, grid: { color: colors.gridColor } }
                    }
                }
            });
        }

        // Render Grafik Kategori
        const ctx2 = document.getElementById('expenseCategoryChart');
        if (ctx2) {
            Dashboard.charts.expenseCategory = new Chart(ctx2.getContext('2d'), {
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
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom', labels: { color: colors.textColor } } },
                    cutout: '75%'
                }
            });
        }
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
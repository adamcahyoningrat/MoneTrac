/* assets/js/kpi.js */
document.addEventListener('DOMContentLoaded', () => {
    App.init('kpi', 'KPI Metrics');
    KPI.init();
});

const KPI = {
    transactions: [],
    budgets: [],
    currency: 'USD',

    init: () => {
        KPI.transactions = StorageDB.getData(StorageDB.keys.TRANSACTIONS);
        KPI.budgets = StorageDB.getData(StorageDB.keys.BUDGETS);
        KPI.currency = StorageDB.getSettings().currency;
        KPI.render();
    },

    getMonthlyData: (dateObj) => {
        const start = new Date(dateObj.getFullYear(), dateObj.getMonth(), 1);
        const end = new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0);

        let income = 0;
        let expense = 0;

        KPI.transactions.forEach(t => {
            const d = new Date(t.date);
            if (d >= start && d <= end) {
                if (t.type === 'Income') income += Number(t.amount);
                if (t.type === 'Expense') expense += Number(t.amount);
            }
        });

        return { income, expense };
    },

    calculateMetrics: () => {
        const now = new Date();
        const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        const currentMonth = KPI.getMonthlyData(now);
        const lastMonth = KPI.getMonthlyData(lastMonthDate);

        // Calculations
        const savingsRate = currentMonth.income > 0 ? ((currentMonth.income - currentMonth.expense) / currentMonth.income) * 100 : 0;
        const expenseRatio = currentMonth.income > 0 ? (currentMonth.expense / currentMonth.income) * 100 : 0;
        
        const incomeGrowth = lastMonth.income > 0 ? ((currentMonth.income - lastMonth.income) / lastMonth.income) * 100 : 0;
        const expenseGrowth = lastMonth.expense > 0 ? ((currentMonth.expense - lastMonth.expense) / lastMonth.expense) * 100 : 0;

        // Budget Usage
        const totalBudget = KPI.budgets.reduce((sum, b) => sum + Number(b.amount), 0);
        let budgetedExpense = 0;
        const budgetCategories = KPI.budgets.map(b => b.category);
        
        KPI.transactions.forEach(t => {
            const d = new Date(t.date);
            if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && t.type === 'Expense' && budgetCategories.includes(t.category)) {
                budgetedExpense += Number(t.amount);
            }
        });
        const budgetUsage = totalBudget > 0 ? (budgetedExpense / totalBudget) * 100 : 0;

        return [
            {
                title: 'Savings Rate',
                value: `${savingsRate.toFixed(1)}%`,
                icon: 'piggy-bank',
                desc: 'Target: > 20%',
                trend: savingsRate >= 20 ? 'up' : 'down',
                trendText: savingsRate >= 20 ? 'Healthy' : 'Needs Work'
            },
            {
                title: 'Expense Ratio',
                value: `${expenseRatio.toFixed(1)}%`,
                icon: 'chart-pie',
                desc: 'Target: < 80%',
                trend: expenseRatio <= 80 ? 'up' : 'down',
                trendText: expenseRatio <= 80 ? 'Healthy' : 'High'
            },
            {
                title: 'Income Growth',
                value: `${incomeGrowth > 0 ? '+' : ''}${incomeGrowth.toFixed(1)}%`,
                icon: 'arrow-trend-up',
                desc: 'vs Last Month',
                trend: incomeGrowth >= 0 ? 'up' : 'down',
                trendText: `${Math.abs(incomeGrowth).toFixed(1)}%`
            },
            {
                title: 'Expense Growth',
                value: `${expenseGrowth > 0 ? '+' : ''}${expenseGrowth.toFixed(1)}%`,
                icon: 'arrow-trend-down',
                desc: 'vs Last Month',
                trend: expenseGrowth <= 0 ? 'up' : 'down', 
                trendText: `${Math.abs(expenseGrowth).toFixed(1)}%`
            },
            {
                title: 'Net Cash Flow',
                value: Utils.formatCurrency(currentMonth.income - currentMonth.expense, KPI.currency),
                icon: 'scale-balanced',
                desc: 'Current Month',
                trend: (currentMonth.income - currentMonth.expense) >= 0 ? 'up' : 'down',
                trendText: (currentMonth.income - currentMonth.expense) >= 0 ? 'Positive' : 'Negative'
            },
            {
                title: 'Budget Usage',
                value: `${budgetUsage.toFixed(1)}%`,
                icon: 'wallet',
                desc: 'Of total monthly budget',
                trend: budgetUsage <= 100 ? 'up' : 'down',
                trendText: budgetUsage <= 100 ? 'On Track' : 'Over Budget'
            }
        ];
    },

    render: () => {
        const container = document.getElementById('kpi-container');
        const metrics = KPI.calculateMetrics();

        container.innerHTML = metrics.map(m => {
            const trendIcon = m.trend === 'up' ? 'arrow-up' : (m.trend === 'down' ? 'arrow-down' : 'minus');
            
            return `
                <div class="card kpi-card">
                    <div class="kpi-header">
                        <span class="kpi-title">${m.title}</span>
                        <div class="kpi-icon">
                            <i class="fa-solid fa-${m.icon}"></i>
                        </div>
                    </div>
                    <div class="kpi-value">${m.value}</div>
                    <div class="kpi-footer">
                        <span class="kpi-trend ${m.trend}">
                            <i class="fa-solid fa-${trendIcon}"></i> ${m.trendText}
                        </span>
                        <span class="kpi-desc">${m.desc}</span>
                    </div>
                </div>
            `;
        }).join('');
    }
};
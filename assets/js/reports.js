/* assets/js/reports.js */
document.addEventListener('DOMContentLoaded', () => {
    App.init('reports', 'Reports');
    Reports.init();
});

const Reports = {
    transactions: [],
    categories: [],
    currency: 'USD',
    chartInstance: null,
    currentData: [], // Stores data for CSV export

    init: () => {
        Reports.transactions = StorageDB.getData(StorageDB.keys.TRANSACTIONS);
        Reports.categories = StorageDB.getData(StorageDB.keys.CATEGORIES);
        Reports.currency = StorageDB.getSettings().currency;

        Reports.bindEvents();
        Reports.generateReport();
        
        window.addEventListener('themeChanged', () => {
            Reports.generateReport();
        });
    },

    bindEvents: () => {
        document.getElementById('report-type').addEventListener('change', Reports.generateReport);
        document.getElementById('report-period').addEventListener('change', Reports.generateReport);
    },

    getFilteredTransactions: () => {
        const period = document.getElementById('report-period').value;
        const now = new Date();
        let start, end;

        if (period === 'this-month') {
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        } else if (period === 'last-month') {
            start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            end = new Date(now.getFullYear(), now.getMonth(), 0);
        } else if (period === 'this-year') {
            start = new Date(now.getFullYear(), 0, 1);
            end = new Date(now.getFullYear(), 11, 31);
        } else {
            // all-time
            start = new Date(2000, 0, 1);
            end = new Date(2100, 0, 1);
        }

        return Reports.transactions.filter(t => {
            const d = new Date(t.date);
            return d >= start && d <= end;
        });
    },

    getChartColors: () => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        return {
            textColor: isDark ? '#94A3B8' : '#64748B',
            gridColor: isDark ? '#334155' : '#E2E8F0',
            income: '#16A34A',
            expense: '#DC2626'
        };
    },

    generateReport: () => {
        const type = document.getElementById('report-type').value;
        const txs = Reports.getFilteredTransactions();

        if (type === 'expense-category' || type === 'income-category') {
            Reports.generateCategoryReport(txs, type === 'expense-category' ? 'Expense' : 'Income');
        } else if (type === 'cashflow-trend') {
            Reports.generateCashflowTrend(txs);
        }
    },

    generateCategoryReport: (txs, type) => {
        const dataMap = {};
        const colors = [];
        
        txs.filter(t => t.type === type).forEach(t => {
            if (!dataMap[t.category]) {
                dataMap[t.category] = 0;
            }
            dataMap[t.category] += Number(t.amount);
        });

        // Prepare Table Data
        const labels = Object.keys(dataMap);
        const values = Object.values(dataMap);
        const total = values.reduce((a, b) => a + b, 0);

        Reports.currentData = labels.map(label => {
            const amount = dataMap[label];
            const percentage = total > 0 ? ((amount / total) * 100).toFixed(1) : 0;
            
            // Map category color
            const catDef = Reports.categories.find(c => c.name === label);
            colors.push(catDef ? catDef.color : '#64748B');

            return { label, amount, percentage };
        }).sort((a, b) => b.amount - a.amount); // Sort descending

        // Render Table
        document.getElementById('report-table-head').innerHTML = `
            <tr>
                <th>Category</th>
                <th>Amount</th>
                <th>% of Total</th>
            </tr>
        `;
        document.getElementById('report-table-body').innerHTML = Reports.currentData.length ? Reports.currentData.map(row => `
            <tr>
                <td>${row.label}</td>
                <td style="font-weight: 600;">${Utils.formatCurrency(row.amount, Reports.currency)}</td>
                <td>${row.percentage}%</td>
            </tr>
        `).join('') : `<tr><td colspan="3" style="text-align:center;">No data available</td></tr>`;

        // Render Chart
        Reports.renderChart('doughnut', Reports.currentData.map(d => d.label), [{
            data: Reports.currentData.map(d => d.amount),
            backgroundColor: colors,
            borderWidth: 0
        }]);
    },

    generateCashflowTrend: (txs) => {
        const dataMap = {};
        
        // Group by YYYY-MM
        txs.forEach(t => {
            const dateObj = new Date(t.date);
            const month = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
            
            if (!dataMap[month]) dataMap[month] = { income: 0, expense: 0 };
            
            if (t.type === 'Income') dataMap[month].income += Number(t.amount);
            if (t.type === 'Expense') dataMap[month].expense += Number(t.amount);
        });

        const labels = Object.keys(dataMap).sort(); // Chronological
        
        Reports.currentData = labels.map(label => {
            const { income, expense } = dataMap[label];
            // Format label nicely (e.g. "Jan 2026")
            const dateStr = new Date(label + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            return { rawLabel: label, label: dateStr, income, expense, net: income - expense };
        });

        // Render Table
        document.getElementById('report-table-head').innerHTML = `
            <tr>
                <th>Month</th>
                <th>Income</th>
                <th>Expense</th>
                <th>Net Cashflow</th>
            </tr>
        `;
        document.getElementById('report-table-body').innerHTML = Reports.currentData.length ? Reports.currentData.map(row => `
            <tr>
                <td>${row.label}</td>
                <td style="color: var(--success); font-weight: 600;">${Utils.formatCurrency(row.income, Reports.currency)}</td>
                <td style="color: var(--danger); font-weight: 600;">${Utils.formatCurrency(row.expense, Reports.currency)}</td>
                <td style="font-weight: 600; color: ${row.net >= 0 ? 'var(--success)' : 'var(--danger)'}">${Utils.formatCurrency(row.net, Reports.currency)}</td>
            </tr>
        `).join('') : `<tr><td colspan="4" style="text-align:center;">No data available</td></tr>`;

        // Render Chart
        const themeColors = Reports.getChartColors();
        Reports.renderChart('bar', Reports.currentData.map(d => d.label), [
            { label: 'Income', data: Reports.currentData.map(d => d.income), backgroundColor: themeColors.income, borderRadius: 4 },
            { label: 'Expense', data: Reports.currentData.map(d => d.expense), backgroundColor: themeColors.expense, borderRadius: 4 }
        ]);
    },

    renderChart: (type, labels, datasets) => {
        if (Reports.chartInstance) {
            Reports.chartInstance.destroy();
        }

        const ctx = document.getElementById('reportChart').getContext('2d');
        const themeColors = Reports.getChartColors();

        const options = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: themeColors.textColor } } }
        };

        if (type === 'bar') {
            options.scales = {
                x: { ticks: { color: themeColors.textColor }, grid: { display: false } },
                y: { ticks: { color: themeColors.textColor }, grid: { color: themeColors.gridColor } }
            };
        } else if (type === 'doughnut') {
            options.cutout = '65%';
            options.plugins.legend.position = 'right';
        }

        Reports.chartInstance = new Chart(ctx, { type, data: { labels: labels.length ? labels : ['No Data'], datasets }, options });
    },

    exportCSV: () => {
        if (!Reports.currentData.length) {
            Utils.showToast('No data to export', 'danger');
            return;
        }

        const type = document.getElementById('report-type').value;
        let csvContent = "data:text/csv;charset=utf-8,";

        if (type === 'expense-category' || type === 'income-category') {
            csvContent += "Category,Amount,Percentage\n";
            Reports.currentData.forEach(row => {
                csvContent += `"${row.label}",${row.amount},${row.percentage}%\n`;
            });
        } else {
            csvContent += "Month,Income,Expense,Net Cashflow\n";
            Reports.currentData.forEach(row => {
                csvContent += `"${row.label}",${row.income},${row.expense},${row.net}\n`;
            });
        }

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `report_${type}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};
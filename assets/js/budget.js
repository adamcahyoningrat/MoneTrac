/* assets/js/budget.js */
document.addEventListener('DOMContentLoaded', () => {
    App.init('budget', 'Budget');
    Budget.init();
});

const Budget = {
    data: [],
    transactions: [],
    categories: [],
    currency: 'USD',

    init: () => {
        Budget.data = StorageDB.getData(StorageDB.keys.BUDGETS);
        Budget.transactions = StorageDB.getData(StorageDB.keys.TRANSACTIONS);
        Budget.categories = StorageDB.getData(StorageDB.keys.CATEGORIES).filter(c => c.type === 'Expense');
        Budget.currency = StorageDB.getSettings().currency;

        document.getElementById('budget-month-label').textContent = `Tracking spending for ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`;
        
        Budget.populateCategoryDropdown();
        Budget.render();
    },

    populateCategoryDropdown: () => {
        const select = document.getElementById('budget-category');
        select.innerHTML = Budget.categories.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
    },

    calculateSpent: (categoryName) => {
        const { start, end } = Utils.getCurrentMonthRange();
        
        return Budget.transactions
            .filter(t => t.type === 'Expense' && t.category === categoryName)
            .filter(t => {
                const d = new Date(t.date);
                return d >= start && d <= end;
            })
            .reduce((sum, t) => sum + Number(t.amount), 0);
    },

    render: () => {
        const container = document.getElementById('budget-container');
        
        if (Budget.data.length === 0) {
            container.innerHTML = `<p class="text-muted" style="grid-column: 1/-1; text-align: center; padding: 2rem;">No budgets set for this month.</p>`;
            return;
        }

        container.innerHTML = Budget.data.map(budget => {
            const spent = Budget.calculateSpent(budget.category);
            const percentage = Math.min((spent / budget.amount) * 100, 100).toFixed(1);
            const remaining = budget.amount - spent;
            
            // Determine progress bar color
            let color = 'var(--success)';
            let statusText = 'On Track';
            let statusColor = 'var(--success)';
            
            if (percentage >= 100) {
                color = 'var(--danger)';
                statusText = 'Over Budget';
                statusColor = 'var(--danger)';
            } else if (percentage >= 85) {
                color = 'var(--warning)';
                statusText = 'Near Limit';
                statusColor = 'var(--warning)';
            }

            const catDetails = Budget.categories.find(c => c.name === budget.category) || { icon: 'tag', color: 'var(--text-muted)' };

            return `
                <div class="card budget-card">
                    <div class="budget-header">
                        <div class="budget-category">
                            <div class="budget-icon" style="background-color: ${catDetails.color};">
                                <i class="fa-solid fa-${catDetails.icon}"></i>
                            </div>
                            ${budget.category}
                        </div>
                        <div class="action-btns">
                            <button class="btn-icon" onclick="Budget.openForm('${budget.id}')"><i class="fa-solid fa-pen"></i></button>
                            <button class="btn-icon delete" onclick="Budget.confirmDelete('${budget.id}')"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </div>
                    
                    <div>
                        <div class="budget-amounts">
                            <span><span class="spent">${Utils.formatCurrency(spent, Budget.currency)}</span> spent</span>
                            <span>${Utils.formatCurrency(budget.amount, Budget.currency)} limit</span>
                        </div>
                        <div class="progress-wrapper">
                            <div class="progress-bar" style="width: ${percentage}%; background-color: ${color};"></div>
                        </div>
                    </div>

                    <div class="budget-footer">
                        <span class="budget-status" style="color: ${statusColor};">${percentage}% • ${statusText}</span>
                        <span>${remaining >= 0 ? Utils.formatCurrency(remaining, Budget.currency) + ' left' : Utils.formatCurrency(Math.abs(remaining), Budget.currency) + ' over'}</span>
                    </div>
                </div>
            `;
        }).join('');
    },

    openForm: (id = null) => {
        const form = document.getElementById('budget-form');
        form.reset();
        
        if (id) {
            document.getElementById('modal-title').textContent = 'Edit Budget';
            const budget = Budget.data.find(b => b.id === id);
            document.getElementById('budget-id').value = budget.id;
            document.getElementById('budget-category').value = budget.category;
            document.getElementById('budget-amount').value = budget.amount;
            document.getElementById('budget-category').disabled = true; // Prevent changing category on edit
        } else {
            document.getElementById('modal-title').textContent = 'Set Budget';
            document.getElementById('budget-id').value = '';
            document.getElementById('budget-category').disabled = false;
        }
        
        Modal.open('budget-modal');
    },

    save: () => {
        const form = document.getElementById('budget-form');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const id = document.getElementById('budget-id').value;
        const category = document.getElementById('budget-category').value;
        const amount = parseFloat(document.getElementById('budget-amount').value);

        // Check for duplicates if adding new
        if (!id && Budget.data.some(b => b.category === category)) {
            Utils.showToast('A budget for this category already exists.', 'danger');
            return;
        }

        const newBudget = { id: id || Utils.generateId(), category, amount };

        if (id) {
            const index = Budget.data.findIndex(b => b.id === id);
            Budget.data[index] = newBudget;
            Utils.showToast('Budget updated');
        } else {
            Budget.data.push(newBudget);
            Utils.showToast('Budget created');
        }

        StorageDB.saveData(StorageDB.keys.BUDGETS, Budget.data);
        Budget.render();
        Modal.close('budget-modal');
    },

    confirmDelete: (id) => {
        Modal.confirm('Delete Budget', 'Are you sure you want to remove this budget limit?', () => {
            Budget.data = Budget.data.filter(b => b.id !== id);
            StorageDB.saveData(StorageDB.keys.BUDGETS, Budget.data);
            Budget.render();
            Utils.showToast('Budget removed', 'success');
        });
    }
};
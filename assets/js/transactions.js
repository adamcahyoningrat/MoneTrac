/* assets/js/transactions.js */
document.addEventListener('DOMContentLoaded', () => {
    App.init('transactions', 'Transactions');
    Transactions.init();
});

const Transactions = {
    data: [],
    filteredData: [],
    accounts: [],
    categories: [],
    currency: 'USD',
    
    // Pagination & Sorting State
    currentPage: 1,
    itemsPerPage: 10,
    sortCol: 'date',
    sortAsc: false,

    init: () => {
        // Load data from LocalStorage
        Transactions.data = StorageDB.getData(StorageDB.keys.TRANSACTIONS);
        Transactions.accounts = StorageDB.getData(StorageDB.keys.ACCOUNTS);
        Transactions.categories = StorageDB.getData(StorageDB.keys.CATEGORIES);
        Transactions.currency = StorageDB.getSettings().currency;

        Transactions.populateDropdowns();
        Transactions.bindEvents();
        Transactions.applyFiltersAndRender();
    },

    bindEvents: () => {
        // Filter Events
        document.getElementById('search-input').addEventListener('input', () => {
            Transactions.currentPage = 1;
            Transactions.applyFiltersAndRender();
        });
        document.getElementById('filter-type').addEventListener('change', () => {
            Transactions.currentPage = 1;
            Transactions.applyFiltersAndRender();
        });
        document.getElementById('filter-account').addEventListener('change', () => {
            Transactions.currentPage = 1;
            Transactions.applyFiltersAndRender();
        });

        // Sorting Events
        document.querySelectorAll('th[data-sort]').forEach(th => {
            th.addEventListener('click', () => {
                const col = th.getAttribute('data-sort');
                if (Transactions.sortCol === col) {
                    Transactions.sortAsc = !Transactions.sortAsc; // Toggle direction
                } else {
                    Transactions.sortCol = col;
                    Transactions.sortAsc = true;
                }
                Transactions.applyFiltersAndRender();
            });
        });

        // Dynamic category loading based on type
        document.getElementById('tx-type').addEventListener('change', (e) => {
            Transactions.updateCategoryDropdown(e.target.value);
        });
    },

    populateDropdowns: () => {
        const accFilter = document.getElementById('filter-account');
        const formAcc = document.getElementById('tx-account');
        
        let accHtml = '';
        Transactions.accounts.forEach(acc => {
            accHtml += `<option value="${acc.id}">${acc.name}</option>`;
        });

        accFilter.innerHTML = '<option value="">All Accounts</option>' + accHtml;
        formAcc.innerHTML = accHtml;
        
        // Initial category load for default type (Expense)
        Transactions.updateCategoryDropdown('Expense');
    },

    updateCategoryDropdown: (type) => {
        const formCat = document.getElementById('tx-category');
        formCat.innerHTML = '';
        const filteredCats = Transactions.categories.filter(c => c.type === type || type === 'Transfer');
        
        filteredCats.forEach(cat => {
            formCat.innerHTML += `<option value="${cat.name}">${cat.name}</option>`;
        });
    },

    applyFiltersAndRender: () => {
        const searchTerm = document.getElementById('search-input').value.toLowerCase();
        const typeTerm = document.getElementById('filter-type').value;
        const accTerm = document.getElementById('filter-account').value;

        // Filter
        Transactions.filteredData = Transactions.data.filter(tx => {
            const matchSearch = tx.description.toLowerCase().includes(searchTerm) || tx.category.toLowerCase().includes(searchTerm);
            const matchType = typeTerm === '' || tx.type === typeTerm;
            const matchAcc = accTerm === '' || tx.account === accTerm;
            return matchSearch && matchType && matchAcc;
        });

        // Sort
        Transactions.filteredData.sort((a, b) => {
            let valA = a[Transactions.sortCol];
            let valB = b[Transactions.sortCol];

            if (Transactions.sortCol === 'amount') {
                valA = Number(valA);
                valB = Number(valB);
            } else if (Transactions.sortCol === 'date') {
                valA = new Date(valA).getTime();
                valB = new Date(valB).getTime();
            } else {
                // Resolve account ID to name for sorting
                if (Transactions.sortCol === 'account') {
                    const accA = Transactions.accounts.find(ac => ac.id === valA);
                    const accB = Transactions.accounts.find(ac => ac.id === valB);
                    valA = accA ? accA.name.toLowerCase() : '';
                    valB = accB ? accB.name.toLowerCase() : '';
                } else {
                    valA = valA.toLowerCase();
                    valB = valB.toLowerCase();
                }
            }

            if (valA < valB) return Transactions.sortAsc ? -1 : 1;
            if (valA > valB) return Transactions.sortAsc ? 1 : -1;
            return 0;
        });

        Transactions.renderTable();
        Transactions.renderPagination();
    },

    renderTable: () => {
        const tbody = document.getElementById('table-body');
        tbody.innerHTML = '';

        const startIdx = (Transactions.currentPage - 1) * Transactions.itemsPerPage;
        const endIdx = startIdx + Transactions.itemsPerPage;
        const pageData = Transactions.filteredData.slice(startIdx, endIdx);

        if (pageData.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 3rem; color: var(--text-muted);">No transactions found.</td></tr>`;
            return;
        }

        pageData.forEach(tx => {
            const account = Transactions.accounts.find(a => a.id === tx.account);
            const accName = account ? account.name : 'Unknown';
            const badgeClass = tx.type.toLowerCase();
            const formattedAmount = Utils.formatCurrency(tx.amount, Transactions.currency);

            tbody.innerHTML += `
                <tr>
                    <td>${Utils.formatDate(tx.date)}</td>
                    <td><span class="badge ${badgeClass}">${tx.type}</span></td>
                    <td>${tx.category}</td>
                    <td>${accName}</td>
                    <td>${tx.description}</td>
                    <td style="font-weight: 600; color: ${tx.type === 'Income' ? 'var(--success)' : (tx.type === 'Expense' ? 'var(--danger)' : 'var(--text-main)')};">
                        ${tx.type === 'Expense' ? '-' : ''}${formattedAmount}
                    </td>
                    <td>
                        <div class="action-btns">
                            <button class="btn-icon" title="Edit" onclick="Transactions.openForm('${tx.id}')"><i class="fa-solid fa-pen"></i></button>
                            <button class="btn-icon" title="Duplicate" onclick="Transactions.duplicate('${tx.id}')"><i class="fa-solid fa-copy"></i></button>
                            <button class="btn-icon delete" title="Delete" onclick="Transactions.confirmDelete('${tx.id}')"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </td>
                </tr>
            `;
        });
    },

    renderPagination: () => {
        const container = document.getElementById('pagination-container');
        const totalPages = Math.ceil(Transactions.filteredData.length / Transactions.itemsPerPage);
        
        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        let html = `<div class="text-muted" style="font-size: 0.875rem;">Showing page ${Transactions.currentPage} of ${totalPages}</div>`;
        html += `<div class="page-controls">
                    <button class="page-btn" ${Transactions.currentPage === 1 ? 'disabled' : ''} onclick="Transactions.changePage(${Transactions.currentPage - 1})"><i class="fa-solid fa-chevron-left"></i></button>`;
        
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= Transactions.currentPage - 1 && i <= Transactions.currentPage + 1)) {
                html += `<button class="page-btn ${Transactions.currentPage === i ? 'active' : ''}" onclick="Transactions.changePage(${i})">${i}</button>`;
            } else if (i === Transactions.currentPage - 2 || i === Transactions.currentPage + 2) {
                html += `<span style="padding: 0.5rem; color: var(--text-muted);">...</span>`;
            }
        }

        html += `<button class="page-btn" ${Transactions.currentPage === totalPages ? 'disabled' : ''} onclick="Transactions.changePage(${Transactions.currentPage + 1})"><i class="fa-solid fa-chevron-right"></i></button>
                </div>`;
        
        container.innerHTML = html;
    },

    changePage: (page) => {
        Transactions.currentPage = page;
        Transactions.renderTable();
        Transactions.renderPagination();
    },

    openForm: (id = null) => {
        const form = document.getElementById('transaction-form');
        form.reset();
        
        if (id) {
            // Edit Mode
            document.getElementById('modal-title').textContent = 'Edit Transaction';
            const tx = Transactions.data.find(t => t.id === id);
            
            document.getElementById('tx-id').value = tx.id;
            document.getElementById('tx-type').value = tx.type;
            document.getElementById('tx-date').value = tx.date.split('T')[0];
            document.getElementById('tx-amount').value = tx.amount;
            document.getElementById('tx-account').value = tx.account;
            document.getElementById('tx-description').value = tx.description;
            
            Transactions.updateCategoryDropdown(tx.type);
            document.getElementById('tx-category').value = tx.category;
        } else {
            // Add Mode
            document.getElementById('modal-title').textContent = 'Add Transaction';
            document.getElementById('tx-id').value = '';
            document.getElementById('tx-date').value = new Date().toISOString().split('T')[0];
            Transactions.updateCategoryDropdown('Expense');
        }
        
        Modal.open('transaction-modal');
    },

    save: () => {
        const form = document.getElementById('transaction-form');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const id = document.getElementById('tx-id').value;
        const newTx = {
            id: id || Utils.generateId(),
            type: document.getElementById('tx-type').value,
            date: document.getElementById('tx-date').value + 'T00:00:00.000Z',
            amount: parseFloat(document.getElementById('tx-amount').value),
            account: document.getElementById('tx-account').value,
            category: document.getElementById('tx-category').value,
            description: document.getElementById('tx-description').value,
            timestamp: new Date().toISOString()
        };

        if (id) {
            const index = Transactions.data.findIndex(t => t.id === id);
            Transactions.data[index] = newTx;
            Utils.showToast('Transaction updated successfully');
        } else {
            Transactions.data.push(newTx);
            Utils.showToast('Transaction added successfully');
        }

        StorageDB.saveData(StorageDB.keys.TRANSACTIONS, Transactions.data);
        Transactions.applyFiltersAndRender();
        Modal.close('transaction-modal');
    },

    duplicate: (id) => {
        const tx = Transactions.data.find(t => t.id === id);
        if (tx) {
            const duplicateTx = { ...tx, id: Utils.generateId(), timestamp: new Date().toISOString() };
            Transactions.data.push(duplicateTx);
            StorageDB.saveData(StorageDB.keys.TRANSACTIONS, Transactions.data);
            Transactions.applyFiltersAndRender();
            Utils.showToast('Transaction duplicated');
        }
    },

    confirmDelete: (id) => {
        Modal.confirm('Delete Transaction', 'Are you sure you want to delete this transaction? This action cannot be undone.', () => {
            Transactions.data = Transactions.data.filter(t => t.id !== id);
            StorageDB.saveData(StorageDB.keys.TRANSACTIONS, Transactions.data);
            Transactions.applyFiltersAndRender();
            Utils.showToast('Transaction deleted', 'success');
        });
    },

    exportCSV: () => {
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Date,Type,Category,Account,Description,Amount\n";

        Transactions.filteredData.forEach(tx => {
            const account = Transactions.accounts.find(a => a.id === tx.account);
            const accName = account ? account.name : 'Unknown';
            // Escape commas in description
            const desc = `"${tx.description.replace(/"/g, '""')}"`;
            const row = [tx.date.split('T')[0], tx.type, tx.category, accName, desc, tx.amount].join(",");
            csvContent += row + "\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `transactions_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};
/* assets/js/accounts.js */
document.addEventListener('DOMContentLoaded', () => {
    App.init('accounts', 'Accounts');
    Accounts.init();
});

const Accounts = {
    data: [],
    currency: 'USD',
    availableIcons: [
        'wallet', 'money-bill', 'money-bill-wave', 'building-columns', 'piggy-bank', 
        'credit-card', 'vault', 'coins', 'sack-dollar', 'bitcoin', 'paypal', 'stripe', 'apple-pay'
    ],

    init: () => {
        Accounts.data = StorageDB.getData(StorageDB.keys.ACCOUNTS);
        Accounts.currency = StorageDB.getSettings().currency;
        Accounts.renderIconSelector();
        Accounts.render();
    },

    renderIconSelector: () => {
        const container = document.getElementById('icon-selector');
        container.innerHTML = Accounts.availableIcons.map(icon => 
            `<div class="icon-option" data-icon="${icon}" onclick="Accounts.selectIcon('${icon}')">
                <i class="fa-solid fa-${icon} ${icon.includes('pay') || icon.includes('bitcoin') || icon.includes('stripe') ? 'fa-brands' : ''}"></i>
            </div>`
        ).join('');
    },

    selectIcon: (iconName) => {
        document.getElementById('acc-icon').value = iconName;
        document.querySelectorAll('.icon-option').forEach(el => el.classList.remove('selected'));
        document.querySelector(`.icon-option[data-icon="${iconName}"]`).classList.add('selected');
    },

    render: () => {
        const container = document.getElementById('accounts-container');
        
        if (Accounts.data.length === 0) {
            container.innerHTML = `<p class="text-muted" style="grid-column: 1/-1; text-align: center; padding: 2rem;">No accounts found.</p>`;
            return;
        }

        container.innerHTML = Accounts.data.map(acc => {
            const formattedBalance = Utils.formatCurrency(acc.balance, Accounts.currency);
            
            // Adjust FontAwesome prefix for brand icons
            const iconPrefix = ['paypal', 'stripe', 'apple-pay', 'bitcoin'].includes(acc.icon) ? 'fa-brands' : 'fa-solid';

            return `
                <div class="card item-card" style="--accent-color: ${acc.color};">
                    <div class="item-header">
                        <div style="display: flex; gap: 1rem; align-items: center;">
                            <div class="item-icon" style="background-color: ${acc.color};">
                                <i class="${iconPrefix} fa-${acc.icon}"></i>
                            </div>
                            <div class="item-details">
                                <h4>${acc.name}</h4>
                                <p>${acc.type}</p>
                            </div>
                        </div>
                        <div class="action-btns">
                            <button class="btn-icon" title="Edit" onclick="Accounts.openForm('${acc.id}')"><i class="fa-solid fa-pen"></i></button>
                            <button class="btn-icon delete" title="Delete" onclick="Accounts.confirmDelete('${acc.id}')"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </div>
                    <div class="item-balance" style="color: ${acc.balance < 0 ? 'var(--danger)' : 'var(--text-main)'}">
                        ${formattedBalance}
                    </div>
                </div>
            `;
        }).join('');
    },

    openForm: (id = null) => {
        const form = document.getElementById('account-form');
        form.reset();
        
        if (id) {
            document.getElementById('modal-title').textContent = 'Edit Account';
            const acc = Accounts.data.find(a => a.id === id);
            
            document.getElementById('acc-id').value = acc.id;
            document.getElementById('acc-name').value = acc.name;
            document.getElementById('acc-type').value = acc.type;
            document.getElementById('acc-balance').value = acc.balance;
            document.getElementById('acc-color').value = acc.color;
            Accounts.selectIcon(acc.icon);
        } else {
            document.getElementById('modal-title').textContent = 'Add Account';
            document.getElementById('acc-id').value = '';
            document.getElementById('acc-color').value = '#16A34A';
            Accounts.selectIcon('wallet');
        }
        
        Modal.open('account-modal');
    },

    save: () => {
        const form = document.getElementById('account-form');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const id = document.getElementById('acc-id').value;
        const newAcc = {
            id: id || Utils.generateId(),
            name: document.getElementById('acc-name').value,
            type: document.getElementById('acc-type').value,
            balance: parseFloat(document.getElementById('acc-balance').value),
            color: document.getElementById('acc-color').value,
            icon: document.getElementById('acc-icon').value
        };

        if (id) {
            const index = Accounts.data.findIndex(a => a.id === id);
            Accounts.data[index] = newAcc;
            Utils.showToast('Account updated');
        } else {
            Accounts.data.push(newAcc);
            Utils.showToast('Account added');
        }

        StorageDB.saveData(StorageDB.keys.ACCOUNTS, Accounts.data);
        Accounts.render();
        Modal.close('account-modal');
    },

    confirmDelete: (id) => {
        Modal.confirm('Delete Account', 'Are you sure? Note: Deleting this account will detach it from existing transactions.', () => {
            Accounts.data = Accounts.data.filter(a => a.id !== id);
            StorageDB.saveData(StorageDB.keys.ACCOUNTS, Accounts.data);
            Accounts.render();
            Utils.showToast('Account deleted', 'success');
        });
    }
};
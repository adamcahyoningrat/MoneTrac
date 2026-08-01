/* assets/js/settings.js */
document.addEventListener('DOMContentLoaded', () => {
    App.init('settings', 'Settings');
    Settings.init();
});

const Settings = {
    init: () => {
        const settings = StorageDB.getSettings();
        document.getElementById('setting-currency').value = settings.currency || 'USD';
        document.getElementById('setting-theme').value = settings.theme || 'light';
    },

    savePreferences: () => {
        const currency = document.getElementById('setting-currency').value;
        const theme = document.getElementById('setting-theme').value;
        
        const settings = StorageDB.getSettings();
        settings.currency = currency;
        
        // Handle theme change directly if it changed
        if (settings.theme !== theme) {
            settings.theme = theme;
            StorageDB.saveSettings(settings);
            App.applyTheme();
        } else {
            StorageDB.saveSettings(settings);
        }

        Utils.showToast('Preferences saved successfully');
    },

    exportData: () => {
        const exportData = {
            transactions: StorageDB.getData(StorageDB.keys.TRANSACTIONS),
            accounts: StorageDB.getData(StorageDB.keys.ACCOUNTS),
            categories: StorageDB.getData(StorageDB.keys.CATEGORIES),
            budgets: StorageDB.getData(StorageDB.keys.BUDGETS),
            settings: StorageDB.getSettings(),
            exportDate: new Date().toISOString()
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `myfinance_backup_${new Date().toISOString().split('T')[0]}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        Utils.showToast('Backup downloaded successfully');
    },

    processRestore: (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                
                // Validate structure roughly
                if (importedData.transactions && importedData.accounts && importedData.categories) {
                    Modal.confirm('Restore Data', 'This will overwrite all your current data. Are you sure you want to proceed?', () => {
                        StorageDB.saveData(StorageDB.keys.TRANSACTIONS, importedData.transactions);
                        StorageDB.saveData(StorageDB.keys.ACCOUNTS, importedData.accounts);
                        StorageDB.saveData(StorageDB.keys.CATEGORIES, importedData.categories);
                        if (importedData.budgets) StorageDB.saveData(StorageDB.keys.BUDGETS, importedData.budgets);
                        if (importedData.settings) StorageDB.saveSettings(importedData.settings);
                        
                        Utils.showToast('Data restored successfully. Reloading...');
                        setTimeout(() => window.location.reload(), 1500);
                    });
                } else {
                    Utils.showToast('Invalid backup file format.', 'danger');
                }
            } catch (error) {
                Utils.showToast('Error reading the backup file.', 'danger');
            }
        };
        
        reader.readAsText(file);
        // Reset input
        event.target.value = '';
    },

    confirmReset: () => {
        Modal.confirm('Factory Reset', 'This will PERMANENTLY delete all your data. This action cannot be undone. Are you absolutely sure?', () => {
            localStorage.clear();
            Utils.showToast('Application reset successfully.');
            // Re-initialize default data
            StorageDB.init();
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        });
    }
};
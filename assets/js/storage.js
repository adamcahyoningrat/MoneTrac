const StorageDB = {
    // URL Google Sheets kamu (Sudah Benar)
    API_URL: 'https://script.google.com/macros/s/AKfycbyFv22RXT2CjnlcqqrSKYiA_Gprpn_4IAL7ynxk9vNJuWWuP87OXxXwtrDbh9z3XdY/exec',

    keys: {
        TRANSACTIONS: 'myfinance_transactions',
        ACCOUNTS: 'myfinance_accounts',
        CATEGORIES: 'myfinance_categories',
        BUDGETS: 'myfinance_budgets',
        SETTINGS: 'myfinance_settings'
    },

    getData: (key) => {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    },

    saveData: (key, data) => {
        localStorage.setItem(key, JSON.stringify(data));
        StorageDB.pushToCloud(); // Otomatis sync ke Google Sheets setiap ada perubahan
    },

    getSettings: () => {
        const data = localStorage.getItem(StorageDB.keys.SETTINGS);
        return data ? JSON.parse(data) : { theme: 'light', currency: 'USD' };
    },

    saveSettings: (settings) => {
        localStorage.setItem(StorageDB.keys.SETTINGS, JSON.stringify(settings));
        StorageDB.pushToCloud();
    },

    // --- LOGIK SINKRONISASI CLOUD ---

    pushToCloud: () => {
        // Blok "if" peringatan sudah dihapus agar tidak memblokir pengiriman!

        const payload = {
            action: 'save',
            data: {
                [StorageDB.keys.TRANSACTIONS]: StorageDB.getData(StorageDB.keys.TRANSACTIONS),
                [StorageDB.keys.ACCOUNTS]: StorageDB.getData(StorageDB.keys.ACCOUNTS),
                [StorageDB.keys.CATEGORIES]: StorageDB.getData(StorageDB.keys.CATEGORIES),
                [StorageDB.keys.BUDGETS]: StorageDB.getData(StorageDB.keys.BUDGETS),
                [StorageDB.keys.SETTINGS]: StorageDB.getSettings()
            }
        };

        // Kirim diam-diam di background (Non-blocking)
        fetch(StorageDB.API_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify(payload)
        }).then(() => {
            console.log('Data terkirim ke cloud!');
            Utils.showToast('Backup ke Cloud berhasil ☁️', 'success');
        }).catch(err => {
            console.error('Gagal sync ke cloud:', err);
            Utils.showToast('Gagal mengirim ke Cloud', 'danger');
        });
    },

    pullFromCloud: async () => {
        // Blok "if" peringatan sudah dihapus juga di sini

        try {
            const response = await fetch(StorageDB.API_URL);
            const cloudData = await response.json();
            
            // Jika ada data di Google Sheets, timpa LocalStorage kita
            if (cloudData && Object.keys(cloudData).length > 0) {
                for (let key in cloudData) {
                    localStorage.setItem(key, JSON.stringify(cloudData[key]));
                }
                return true;
            }
        } catch (error) {
            console.error('Gagal menarik data dari cloud:', error);
        }
        return false;
    },

    // --- INISIALISASI ---

    init: async () => {
        // Cek cloud dulu saat aplikasi pertama dibuka
        const synced = await StorageDB.pullFromCloud();
        
        if (synced) {
            // Beritahu pengguna dan paksa UI render ulang
            window.dispatchEvent(new Event('cloudDataReady'));
        }

        // SETTINGS: Hanya buat jika belum pernah disetting
        if (!localStorage.getItem(StorageDB.keys.SETTINGS)) {
            StorageDB.saveSettings({ theme: 'light', currency: 'USD' });
        }
        
        // ACCOUNTS: Hanya buat bawaan jika aplikasinya benar-benar baru pertama kali dibuka di browser ini
        if (!localStorage.getItem(StorageDB.keys.ACCOUNTS)) {
            const defaultAccounts = [
                { id: Utils.generateId(), name: 'Cash', type: 'Cash', balance: 1500, color: '#16A34A', icon: 'money-bill' },
                { id: Utils.generateId(), name: 'Main Bank', type: 'Bank', balance: 12500, color: '#2563EB', icon: 'building-columns' }
            ];
            StorageDB.saveData(StorageDB.keys.ACCOUNTS, defaultAccounts);
        }
        
        // CATEGORIES: Hanya buat bawaan jika aplikasinya benar-benar baru
        if (!localStorage.getItem(StorageDB.keys.CATEGORIES)) {
            const defaultCategories = [
                { id: Utils.generateId(), name: 'Salary', type: 'Income', color: '#16A34A', icon: 'briefcase' },
                { id: Utils.generateId(), name: 'Food', type: 'Expense', color: '#F59E0B', icon: 'utensils' }
            ];
            StorageDB.saveData(StorageDB.keys.CATEGORIES, defaultCategories);
        }
        
        // TRANSACTIONS & BUDGETS: Set array kosong jika belum ada
        if (!localStorage.getItem(StorageDB.keys.TRANSACTIONS)) StorageDB.saveData(StorageDB.keys.TRANSACTIONS, []);
        if (!localStorage.getItem(StorageDB.keys.BUDGETS)) StorageDB.saveData(StorageDB.keys.BUDGETS, []);
    }
};

// Mulai inisialisasi dan tarikan data
StorageDB.init();
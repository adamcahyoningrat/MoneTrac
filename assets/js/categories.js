/* assets/js/categories.js */
document.addEventListener('DOMContentLoaded', () => {
    App.init('categories', 'Categories');
    Categories.init();
});

const Categories = {
    data: [],
    availableIcons: [
        'tag', 'tags', 'briefcase', 'laptop', 'building', 'car', 'bus', 'train', 'plane',
        'utensils', 'burger', 'pizza-slice', 'mug-hot', 'cart-shopping', 'basket-shopping',
        'bolt', 'droplet', 'fire', 'wifi', 'house', 'tv', 'gamepad', 'music', 'graduation-cap',
        'book', 'heart-pulse', 'pills', 'hospital', 'shirt', 'glasses', 'gift', 'paw'
    ],

    init: () => {
        Categories.data = StorageDB.getData(StorageDB.keys.CATEGORIES);
        Categories.renderIconSelector();
        Categories.bindEvents();
        Categories.render();
    },

    bindEvents: () => {
        document.getElementById('filter-type').addEventListener('change', Categories.render);
    },

    renderIconSelector: () => {
        const container = document.getElementById('icon-selector');
        container.innerHTML = Categories.availableIcons.map(icon => 
            `<div class="icon-option" data-icon="${icon}" onclick="Categories.selectIcon('${icon}')">
                <i class="fa-solid fa-${icon}"></i>
            </div>`
        ).join('');
    },

    selectIcon: (iconName) => {
        document.getElementById('cat-icon').value = iconName;
        document.querySelectorAll('.icon-option').forEach(el => el.classList.remove('selected'));
        document.querySelector(`.icon-option[data-icon="${iconName}"]`).classList.add('selected');
    },

    render: () => {
        const container = document.getElementById('categories-container');
        const filterType = document.getElementById('filter-type').value;
        
        let filteredData = Categories.data;
        if (filterType) {
            filteredData = Categories.data.filter(cat => cat.type === filterType);
        }

        if (filteredData.length === 0) {
            container.innerHTML = `<p class="text-muted" style="grid-column: 1/-1; text-align: center; padding: 2rem;">No categories found.</p>`;
            return;
        }

        container.innerHTML = filteredData.map(cat => `
            <div class="card item-card">
                <div class="item-info">
                    <div class="item-icon" style="background-color: ${cat.color};">
                        <i class="fa-solid fa-${cat.icon}"></i>
                    </div>
                    <div class="item-details">
                        <h4>${cat.name}</h4>
                        <span class="${cat.type}">${cat.type}</span>
                    </div>
                </div>
                <div class="action-btns">
                    <button class="btn-icon" title="Edit" onclick="Categories.openForm('${cat.id}')"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn-icon delete" title="Delete" onclick="Categories.confirmDelete('${cat.id}')"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
        `).join('');
    },

    openForm: (id = null) => {
        const form = document.getElementById('category-form');
        form.reset();
        
        if (id) {
            document.getElementById('modal-title').textContent = 'Edit Category';
            const cat = Categories.data.find(c => c.id === id);
            
            document.getElementById('cat-id').value = cat.id;
            document.getElementById('cat-name').value = cat.name;
            document.getElementById('cat-type').value = cat.type;
            document.getElementById('cat-color').value = cat.color;
            Categories.selectIcon(cat.icon);
        } else {
            document.getElementById('modal-title').textContent = 'Add Category';
            document.getElementById('cat-id').value = '';
            document.getElementById('cat-color').value = '#2563EB';
            Categories.selectIcon('tag'); // default icon
        }
        
        Modal.open('category-modal');
    },

    save: () => {
        const form = document.getElementById('category-form');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const id = document.getElementById('cat-id').value;
        const newCat = {
            id: id || Utils.generateId(),
            name: document.getElementById('cat-name').value,
            type: document.getElementById('cat-type').value,
            color: document.getElementById('cat-color').value,
            icon: document.getElementById('cat-icon').value
        };

        if (id) {
            const index = Categories.data.findIndex(c => c.id === id);
            Categories.data[index] = newCat;
            Utils.showToast('Category updated');
        } else {
            Categories.data.push(newCat);
            Utils.showToast('Category added');
        }

        StorageDB.saveData(StorageDB.keys.CATEGORIES, Categories.data);
        Categories.render();
        Modal.close('category-modal');
    },

    confirmDelete: (id) => {
        Modal.confirm('Delete Category', 'Are you sure? Note: Existing transactions using this category will retain the category name, but styling may be lost.', () => {
            Categories.data = Categories.data.filter(c => c.id !== id);
            StorageDB.saveData(StorageDB.keys.CATEGORIES, Categories.data);
            Categories.render();
            Utils.showToast('Category deleted', 'success');
        });
    }
};
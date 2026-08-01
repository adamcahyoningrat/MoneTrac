/* assets/components/modal.js */
const Modal = {
    open: (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            // Prevent body scrolling
            document.body.style.overflow = 'hidden';
        }
    },

    close: (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    },

    // Dynamic Confirmation Dialog
    confirm: (title, message, onConfirm) => {
        // Remove existing if any
        const existingConfirm = document.getElementById('confirm-dialog');
        if (existingConfirm) existingConfirm.remove();

        const html = `
            <div class="modal active" id="confirm-dialog">
                <div class="modal-content" style="max-width: 400px; text-align: center;">
                    <div class="modal-header" style="justify-content: center; border-bottom: none;">
                        <div class="kpi-icon warning" style="margin: 0 auto; margin-bottom: 1rem;">
                            <i class="fa-solid fa-triangle-exclamation"></i>
                        </div>
                        <h2 style="margin-bottom: 0.5rem;">${title}</h2>
                    </div>
                    <div class="modal-body" style="margin-bottom: 2rem;">
                        <p class="text-muted">${message}</p>
                    </div>
                    <div class="modal-footer" style="justify-content: center; border-top: none;">
                        <button class="btn" onclick="Modal.close('confirm-dialog')" style="background: var(--border-color); color: var(--text-main);">Cancel</button>
                        <button class="btn btn-primary" id="confirm-dialog-btn" style="background: var(--danger);">Confirm</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', html);
        
        document.getElementById('confirm-dialog-btn').addEventListener('click', () => {
            onConfirm();
            Modal.close('confirm-dialog');
        });
    }
};
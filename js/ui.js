// UI Manager
// Handles all user interface interactions and updates

export class UIManager {
    constructor() {
        this.currentScreen = 'welcomeScreen';
        this.toastTimeout = null;
    }

    /**
     * Show a specific screen and hide others
     */
    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        // Show target screen
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentScreen = screenId;

            // Clear form inputs when switching screens
            if (screenId === 'createVaultScreen') {
                document.getElementById('createPassword').value = '';
                document.getElementById('confirmPassword').value = '';
                this.hidePasswordStrength();
            } else if (screenId === 'accessVaultScreen') {
                document.getElementById('accessPassword').value = '';
                // Don't clear CID as it might be pre-filled from session
            }
        }
    }

    /**
     * Show loading overlay with message
     */
    showLoading(message = 'Processing...') {
        const overlay = document.getElementById('loadingOverlay');
        const text = document.getElementById('loadingText');
        
        text.textContent = message;
        overlay.classList.add('active');
    }

    /**
     * Hide loading overlay
     */
    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        overlay.classList.remove('active');
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info', duration = 4000) {
        const container = document.getElementById('toastContainer');
        
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = this.getToastIcon(type);
        
        toast.innerHTML = `
            <div class="toast-content">
                <div class="toast-icon">${icon}</div>
                <div class="toast-message">${this.escapeHtml(message)}</div>
            </div>
        `;
        
        container.appendChild(toast);
        
        // Auto remove after duration
        setTimeout(() => {
            toast.style.animation = 'toastSlide 0.3s ease reverse';
            setTimeout(() => {
                container.removeChild(toast);
            }, 300);
        }, duration);
    }

    /**
     * Update password strength indicator
     */
    updatePasswordStrength(password) {
        const strengthEl = document.getElementById('passwordStrength');
        const strengthBar = strengthEl.querySelector('.strength-bar');
        const strengthText = strengthEl.querySelector('.strength-text');

        if (!password) {
            this.hidePasswordStrength();
            return;
        }

        // Import crypto check (we'll do a simple check here)
        const result = this.checkPasswordStrength(password);

        strengthEl.classList.add('visible');
        strengthEl.style.setProperty('--strength', `${result.strength}%`);
        strengthEl.style.setProperty('--strength-color', result.color);
        
        strengthText.textContent = `${result.level} - ${result.feedback.join(', ') || 'Good password!'}`;
    }

    /**
     * Hide password strength indicator
     */
    hidePasswordStrength() {
        const strengthEl = document.getElementById('passwordStrength');
        strengthEl.classList.remove('visible');
    }

    /**
     * Simple password strength check (duplicated from crypto.js for UI independence)
     */
    checkPasswordStrength(password) {
        let strength = 0;
        let feedback = [];

        if (password.length >= 8) strength += 20;
        if (password.length >= 12) strength += 20;
        if (password.length >= 16) strength += 10;

        if (/[a-z]/.test(password)) strength += 10;
        if (/[A-Z]/.test(password)) strength += 10;
        if (/[0-9]/.test(password)) strength += 10;
        if (/[^a-zA-Z0-9]/.test(password)) strength += 20;

        if (password.length < 8) feedback.push('Too short');
        if (!/[a-z]/.test(password)) feedback.push('Add lowercase');
        if (!/[A-Z]/.test(password)) feedback.push('Add uppercase');
        if (!/[0-9]/.test(password)) feedback.push('Add numbers');
        if (!/[^a-zA-Z0-9]/.test(password)) feedback.push('Add symbols');

        let level = 'Weak';
        let color = '#ff0055';

        if (strength >= 70) {
            level = 'Strong';
            color = '#00ff88';
        } else if (strength >= 50) {
            level = 'Medium';
            color = '#ffaa00';
        }

        return {
            strength: Math.min(strength, 100),
            level: level,
            color: color,
            feedback: feedback
        };
    }

    /**
     * Get icon for toast type
     */
    getToastIcon(type) {
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };
        return icons[type] || icons.info;
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Format bytes to human readable
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    /**
     * Truncate text with ellipsis
     */
    truncate(text, maxLength = 50) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    /**
     * Show confirmation dialog
     */
    confirm(message) {
        return window.confirm(message);
    }

    /**
     * Animate element
     */
    animate(element, animationClass, duration = 500) {
        return new Promise((resolve) => {
            element.classList.add(animationClass);
            setTimeout(() => {
                element.classList.remove(animationClass);
                resolve();
            }, duration);
        });
    }

    /**
     * Scroll to element smoothly
     */
    scrollTo(element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    /**
     * Copy text to clipboard
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (error) {
            console.error('Failed to copy:', error);
            return false;
        }
    }

    /**
     * Get current screen
     */
    getCurrentScreen() {
        return this.currentScreen;
    }

    /**
     * Show/hide element
     */
    show(element) {
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }
        if (element) {
            element.style.display = 'block';
        }
    }

    hide(element) {
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }
        if (element) {
            element.style.display = 'none';
        }
    }

    /**
     * Enable/disable element
     */
    enable(element) {
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }
        if (element) {
            element.disabled = false;
        }
    }

    disable(element) {
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }
        if (element) {
            element.disabled = true;
        }
    }

    /**
     * Add loading class to button
     */
    setButtonLoading(button, loading = true) {
        if (typeof button === 'string') {
            button = document.getElementById(button);
        }
        
        if (!button) return;

        if (loading) {
            button.disabled = true;
            button.dataset.originalText = button.textContent;
            button.textContent = 'Loading...';
            button.classList.add('loading');
        } else {
            button.disabled = false;
            button.textContent = button.dataset.originalText || button.textContent;
            button.classList.remove('loading');
        }
    }
}

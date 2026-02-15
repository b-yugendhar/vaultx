// VaultX - Decentralized Zero-Knowledge File Storage
// Main Application Module

import { IPFSManager } from './ipfs.js';
import { CryptoManager } from './crypto.js';
import { UIManager } from './ui.js';

class VaultXApp {
    constructor() {
        this.ipfs = new IPFSManager();
        this.crypto = new CryptoManager();
        this.ui = new UIManager();
        
        this.currentVault = null;
        this.masterKey = null;
        this.metadataCID = null;
        
        this.init();
    }

    async init() {
        console.log('🚀 Initializing VaultX...');
        
        // Initialize IPFS connection
        await this.ipfs.connect();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Check for saved vault in session
        this.checkSession();
        
        console.log('✅ VaultX initialized');
    }

    setupEventListeners() {
        // Welcome screen buttons
        document.getElementById('btnCreateVault').addEventListener('click', () => {
            this.ui.showScreen('createVaultScreen');
        });

        document.getElementById('btnAccessVault').addEventListener('click', () => {
            this.ui.showScreen('accessVaultScreen');
        });

        // Create vault form
        document.getElementById('btnBackFromCreate').addEventListener('click', () => {
            this.ui.showScreen('welcomeScreen');
        });

        document.getElementById('createPassword').addEventListener('input', (e) => {
            this.ui.updatePasswordStrength(e.target.value);
        });

        document.getElementById('btnConfirmCreate').addEventListener('click', () => {
            this.handleCreateVault();
        });

        // Access vault form
        document.getElementById('btnBackFromAccess').addEventListener('click', () => {
            this.ui.showScreen('welcomeScreen');
        });

        document.getElementById('btnConfirmAccess').addEventListener('click', () => {
            this.handleAccessVault();
        });

        // Vault dashboard
        document.getElementById('btnLogout').addEventListener('click', () => {
            this.handleLogout();
        });

        document.getElementById('btnCopyCID').addEventListener('click', () => {
            this.handleCopyCID();
        });

        // File upload
        const uploadZone = document.getElementById('uploadZone');
        const fileInput = document.getElementById('fileInput');

        uploadZone.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
            this.handleFileUpload(e.target.files);
        });

        // Drag and drop
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.classList.add('drag-over');
        });

        uploadZone.addEventListener('dragleave', () => {
            uploadZone.classList.remove('drag-over');
        });

        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('drag-over');
            this.handleFileUpload(e.dataTransfer.files);
        });
    }

    async handleCreateVault() {
        const password = document.getElementById('createPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Validation
        if (!password || password.length < 8) {
            this.ui.showToast('Password must be at least 8 characters long', 'error');
            return;
        }

        if (password !== confirmPassword) {
            this.ui.showToast('Passwords do not match', 'error');
            return;
        }

        try {
            this.ui.showLoading('Creating your vault...');

            // Derive master key from password
            this.masterKey = await this.crypto.deriveKey(password);

            // Create empty vault metadata
            const vaultMetadata = {
                version: '1.0',
                created: new Date().toISOString(),
                files: []
            };

            // Encrypt and upload metadata
            const encryptedMetadata = await this.crypto.encrypt(
                JSON.stringify(vaultMetadata),
                this.masterKey
            );

            this.metadataCID = await this.ipfs.uploadData(encryptedMetadata);

            this.currentVault = vaultMetadata;

            // Save to session
            sessionStorage.setItem('vaultCID', this.metadataCID);

            this.ui.hideLoading();
            this.ui.showToast(`Vault created! CID: ${this.metadataCID}`, 'success');
            
            // Show vault screen
            this.ui.showScreen('vaultScreen');
            this.updateVaultUI();

        } catch (error) {
            console.error('Error creating vault:', error);
            this.ui.hideLoading();
            this.ui.showToast('Failed to create vault: ' + error.message, 'error');
        }
    }

    async handleAccessVault() {
        const cid = document.getElementById('metadataCID').value.trim();
        const password = document.getElementById('accessPassword').value;

        if (!cid) {
            this.ui.showToast('Please enter your Metadata CID', 'error');
            return;
        }

        if (!password) {
            this.ui.showToast('Please enter your password', 'error');
            return;
        }

        try {
            this.ui.showLoading('Accessing your vault...');

            // Derive key from password
            this.masterKey = await this.crypto.deriveKey(password);

            // Fetch encrypted metadata from IPFS
            const encryptedMetadata = await this.ipfs.fetchData(cid);

            // Decrypt metadata
            const decryptedMetadata = await this.crypto.decrypt(encryptedMetadata, this.masterKey);
            this.currentVault = JSON.parse(decryptedMetadata);

            this.metadataCID = cid;

            // Save to session
            sessionStorage.setItem('vaultCID', cid);

            this.ui.hideLoading();
            this.ui.showToast('Vault accessed successfully!', 'success');
            
            // Show vault screen
            this.ui.showScreen('vaultScreen');
            this.updateVaultUI();

        } catch (error) {
            console.error('Error accessing vault:', error);
            this.ui.hideLoading();
            this.ui.showToast('Failed to access vault. Check your CID and password.', 'error');
        }
    }

    async handleFileUpload(files) {
        if (!files || files.length === 0) return;

        if (!this.currentVault || !this.masterKey) {
            this.ui.showToast('Please create or access a vault first', 'error');
            return;
        }

        const fileArray = Array.from(files);
        
        try {
            this.ui.showLoading(`Uploading ${fileArray.length} file(s)...`);

            for (const file of fileArray) {
                await this.uploadSingleFile(file);
            }

            // Update vault metadata on IPFS
            await this.saveVaultMetadata();

            this.ui.hideLoading();
            this.ui.showToast(`Successfully uploaded ${fileArray.length} file(s)`, 'success');
            this.updateVaultUI();

            // Clear file input
            document.getElementById('fileInput').value = '';

        } catch (error) {
            console.error('Error uploading files:', error);
            this.ui.hideLoading();
            this.ui.showToast('Failed to upload files: ' + error.message, 'error');
        }
    }

    async uploadSingleFile(file) {
        // Read file
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        // Encrypt file data
        const encryptedData = await this.crypto.encrypt(uint8Array, this.masterKey);

        // Upload to IPFS
        const fileCID = await this.ipfs.uploadData(encryptedData);

        // Add to vault metadata
        const fileMetadata = {
            id: this.generateFileId(),
            name: file.name,
            size: file.size,
            type: file.type,
            cid: fileCID,
            uploadedAt: new Date().toISOString()
        };

        this.currentVault.files.push(fileMetadata);

        console.log(`✅ Uploaded: ${file.name} -> ${fileCID}`);
    }

    async handleFileDownload(fileId) {
        const fileMetadata = this.currentVault.files.find(f => f.id === fileId);
        
        if (!fileMetadata) {
            this.ui.showToast('File not found', 'error');
            return;
        }

        try {
            this.ui.showLoading(`Downloading ${fileMetadata.name}...`);

            // Fetch encrypted data from IPFS
            const encryptedData = await this.ipfs.fetchData(fileMetadata.cid);

            // Decrypt file
            const decryptedData = await this.crypto.decrypt(encryptedData, this.masterKey);

            // Create blob and download
            const blob = new Blob([decryptedData], { type: fileMetadata.type });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = fileMetadata.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.ui.hideLoading();
            this.ui.showToast(`Downloaded ${fileMetadata.name}`, 'success');

        } catch (error) {
            console.error('Error downloading file:', error);
            this.ui.hideLoading();
            this.ui.showToast('Failed to download file: ' + error.message, 'error');
        }
    }

    async handleFileDelete(fileId) {
        const fileMetadata = this.currentVault.files.find(f => f.id === fileId);
        
        if (!fileMetadata) return;

        if (!confirm(`Delete ${fileMetadata.name}?`)) return;

        try {
            this.ui.showLoading('Deleting file...');

            // Remove from vault metadata
            this.currentVault.files = this.currentVault.files.filter(f => f.id !== fileId);

            // Update vault metadata on IPFS
            await this.saveVaultMetadata();

            this.ui.hideLoading();
            this.ui.showToast(`Deleted ${fileMetadata.name}`, 'success');
            this.updateVaultUI();

        } catch (error) {
            console.error('Error deleting file:', error);
            this.ui.hideLoading();
            this.ui.showToast('Failed to delete file: ' + error.message, 'error');
        }
    }

    async saveVaultMetadata() {
        // Encrypt metadata
        const encryptedMetadata = await this.crypto.encrypt(
            JSON.stringify(this.currentVault),
            this.masterKey
        );

        // Upload to IPFS (this creates a new CID)
        const newCID = await this.ipfs.uploadData(encryptedMetadata);
        
        this.metadataCID = newCID;
        sessionStorage.setItem('vaultCID', newCID);

        console.log(`📝 Updated vault metadata: ${newCID}`);
    }

    updateVaultUI() {
        // Update CID display
        document.getElementById('currentCID').textContent = this.metadataCID;

        // Update file count
        const fileCount = this.currentVault.files.length;
        document.getElementById('fileCount').textContent = 
            `${fileCount} file${fileCount !== 1 ? 's' : ''}`;

        // Update files list
        const filesList = document.getElementById('filesList');
        
        if (fileCount === 0) {
            filesList.innerHTML = `
                <div class="empty-state">
                    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                        <rect x="20" y="15" width="40" height="50" rx="2" stroke="currentColor" stroke-width="2" opacity="0.3"/>
                        <path d="M30 30H50M30 40H50M30 50H40" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.3"/>
                    </svg>
                    <p>No files uploaded yet</p>
                </div>
            `;
        } else {
            filesList.innerHTML = this.currentVault.files
                .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
                .map(file => this.createFileItem(file))
                .join('');

            // Attach event listeners to file action buttons
            this.currentVault.files.forEach(file => {
                const downloadBtn = document.getElementById(`download-${file.id}`);
                const deleteBtn = document.getElementById(`delete-${file.id}`);

                if (downloadBtn) {
                    downloadBtn.addEventListener('click', () => this.handleFileDownload(file.id));
                }

                if (deleteBtn) {
                    deleteBtn.addEventListener('click', () => this.handleFileDelete(file.id));
                }
            });
        }
    }

    createFileItem(file) {
        const fileIcon = this.getFileIcon(file.type);
        const fileSize = this.formatFileSize(file.size);
        const uploadDate = new Date(file.uploadedAt).toLocaleDateString();

        return `
            <div class="file-item">
                <div class="file-icon">${fileIcon}</div>
                <div class="file-info">
                    <div class="file-name">${this.escapeHtml(file.name)}</div>
                    <div class="file-meta">${fileSize} • ${uploadDate} • CID: ${file.cid.substring(0, 12)}...</div>
                </div>
                <div class="file-actions">
                    <button class="btn-icon-only" id="download-${file.id}" title="Download">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M8 2V11M8 11L5 8M8 11L11 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M14 11V13C14 13.5523 13.5523 14 13 14H3C2.44772 14 2 13.5523 2 13V11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                        </svg>
                    </button>
                    <button class="btn-icon-only danger" id="delete-${file.id}" title="Delete">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M3 4H13M5 4V3C5 2.44772 5.44772 2 6 2H10C10.5523 2 11 2.44772 11 3V4M6 7V11M10 7V11M4 4H12V13C12 13.5523 11.5523 14 11 14H5C4.44772 14 4 13.5523 4 13V4Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }

    handleCopyCID() {
        const cid = this.metadataCID;
        
        navigator.clipboard.writeText(cid).then(() => {
            this.ui.showToast('CID copied to clipboard!', 'success');
        }).catch(err => {
            this.ui.showToast('Failed to copy CID', 'error');
        });
    }

    handleLogout() {
        if (confirm('Are you sure you want to logout? Make sure you have saved your CID!')) {
            sessionStorage.removeItem('vaultCID');
            this.currentVault = null;
            this.masterKey = null;
            this.metadataCID = null;
            
            this.ui.showScreen('welcomeScreen');
            this.ui.showToast('Logged out successfully', 'success');
        }
    }

    checkSession() {
        const savedCID = sessionStorage.getItem('vaultCID');
        
        if (savedCID) {
            // Auto-show access vault screen with CID pre-filled
            document.getElementById('metadataCID').value = savedCID;
            this.ui.showScreen('accessVaultScreen');
            this.ui.showToast('Please enter your password to access your vault', 'info');
        }
    }

    getFileIcon(mimeType) {
        if (mimeType.startsWith('image/')) return '🖼️';
        if (mimeType.startsWith('video/')) return '🎥';
        if (mimeType.startsWith('audio/')) return '🎵';
        if (mimeType.includes('pdf')) return '📄';
        if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
        if (mimeType.includes('sheet') || mimeType.includes('excel')) return '📊';
        if (mimeType.includes('zip') || mimeType.includes('compressed')) return '🗜️';
        if (mimeType.includes('text')) return '📃';
        return '📁';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    generateFileId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.vaultxApp = new VaultXApp();
    });
} else {
    window.vaultxApp = new VaultXApp();
}

// VaultX - Decentralized Zero-Knowledge File Storage
// Main Application Module

import { IPFSManager } from './ipfs.js';
import { CryptoManager } from './crypto.js';
import { UIManager } from './ui.js';

const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:3000' 
    : 'https://vaultx-backend.onrender.com'; // TODO: Replace this with your actual deployed backend URL

class VaultXApp {
    constructor() {
        this.ipfs = new IPFSManager();
        this.crypto = new CryptoManager();
        this.ui = new UIManager();
        
        this.currentVault = null;
        this.masterKey = null;
        this.metadataCID = null;
        this.sessionUsername = null;
        this.sessionPassword = null;
        
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
        
        // Initialize lucide icons
        if (window.lucide) {
            window.lucide.createIcons();
        }

        // Check hash for share link
        this.checkShareLink();
        
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

        // Modals
        document.getElementById('btnClosePreview')?.addEventListener('click', () => {
            document.getElementById('previewModal').classList.remove('active');
            document.getElementById('previewBody').innerHTML = ''; // Clear memory
        });

        document.getElementById('btnCloseShare')?.addEventListener('click', () => {
            document.getElementById('shareModal').classList.remove('active');
        });

        document.getElementById('btnCopyShareLink')?.addEventListener('click', () => {
            const linkInput = document.getElementById('shareLinkInput');
            linkInput.select();
            document.execCommand('copy');
            this.ui.showToast('Share link copied!', 'success');
        });
    }

    async handleCreateVault() {
        const username = document.getElementById('createUsername').value.trim();
        const password = document.getElementById('createPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Validation
        if (!username || username.length < 3) {
            this.ui.showToast('Username must be at least 3 characters', 'error');
            return;
        }

        if (!password || password.length < 8) {
            this.ui.showToast('Password must be at least 8 characters long', 'error');
            return;
        }

        if (password !== confirmPassword) {
            this.ui.showToast('Passwords do not match', 'error');
            return;
        }

        try {
            this.ui.showLoading('Creating your account and vault...');

            // 1. Register with backend
            const regRes = await fetch(`${API_BASE_URL}/api/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (!regRes.ok) {
                const errData = await regRes.json();
                throw new Error(errData.error || 'Registration failed');
            }

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

            const newCID = await this.ipfs.uploadData(encryptedMetadata);
            this.metadataCID = newCID;
            this.currentVault = vaultMetadata;
            
            // Save state for session
            this.sessionUsername = username;
            this.sessionPassword = password;
            sessionStorage.setItem('vaultCID', this.metadataCID);

            // 2. Update CID on backend
            await fetch('http://localhost:3000/api/vault/cid', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, cid: newCID })
            });

            this.ui.hideLoading();
            this.ui.showToast('Account and Vault created!', 'success');
            
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
        const username = document.getElementById('accessUsername').value.trim();
        const password = document.getElementById('accessPassword').value;

        if (!username) {
            this.ui.showToast('Please enter your username', 'error');
            return;
        }

        if (!password) {
            this.ui.showToast('Please enter your password', 'error');
            return;
        }

        try {
            this.ui.showLoading('Authenticating and accessing vault...');

            // 1. Authenticate with backend and get CID
            const loginRes = await fetch(`${API_BASE_URL}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (!loginRes.ok) {
                const errData = await loginRes.json();
                throw new Error(errData.error || 'Login failed');
            }
            
            const { cid } = await loginRes.json();
            if (!cid) {
                throw new Error('No vault associated with this account (database may be corrupt).');
            }

            // Fetch encrypted metadata from IPFS first to extract the original salt
            const encryptedMetadata = await this.ipfs.fetchData(cid);
            const salt = encryptedMetadata.slice(0, this.crypto.saltLength);

            // Derive key from password using the extracted salt
            this.masterKey = await this.crypto.deriveKey(password, salt);

            // Decrypt metadata
            const decryptedMetadata = await this.crypto.decrypt(encryptedMetadata, this.masterKey);
            
            const decodedString = new TextDecoder().decode(decryptedMetadata);
            this.currentVault = JSON.parse(decodedString);

            this.metadataCID = cid;
            this.sessionUsername = username;
            this.sessionPassword = password;

            // Save to session
            sessionStorage.setItem('vaultCID', cid);
            sessionStorage.setItem('vaultUsername', username);

            this.ui.hideLoading();
            this.ui.showToast('Vault accessed successfully!', 'success');
            
            // Show vault screen
            this.ui.showScreen('vaultScreen');
            this.updateVaultUI();

        } catch (error) {
            console.error('Error accessing vault:', error);
            this.ui.hideLoading();
            this.ui.showToast('Failed to access vault: ' + error.message, 'error');
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
            this.ui.showLoading(`Starting upload of ${fileArray.length} file(s)...`);
            this.ui.setProgress(0, `Uploading 0 of ${fileArray.length}...`);

            for (let i = 0; i < fileArray.length; i++) {
                const file = fileArray[i];
                this.ui.setProgress(
                    (i / fileArray.length) * 100, 
                    `Uploading ${i + 1} of ${fileArray.length}: ${this.ui.truncate(file.name, 20)}`
                );
                await this.uploadSingleFile(file);
            }
            
            this.ui.setProgress(100, "Finalizing upload...");

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

    async handleFilePreview(fileId) {
        const fileMetadata = this.currentVault?.files?.find(f => f.id === fileId);
        if (!fileMetadata) return;

        try {
            this.ui.showLoading(`Decrypting ${fileMetadata.name}...`);
            const encryptedData = await this.ipfs.fetchData(fileMetadata.cid);
            const decryptedData = await this.crypto.decrypt(encryptedData, this.masterKey);
            this.ui.hideLoading();

            const blob = new Blob([decryptedData], { type: fileMetadata.type });
            const url = URL.createObjectURL(blob);
            
            const previewModal = document.getElementById('previewModal');
            const previewBody = document.getElementById('previewBody');
            
            if (fileMetadata.type.startsWith('image/')) {
                previewBody.innerHTML = `<img src="${url}" class="preview-image" alt="Preview">`;
                previewModal.classList.add('active');
            } else if (fileMetadata.type.startsWith('text/') || fileMetadata.type === 'application/json') {
                const text = await blob.text();
                previewBody.innerHTML = `<div class="preview-text">${this.escapeHtml(text)}</div>`;
                previewModal.classList.add('active');
            } else {
                this.ui.showToast('Preview not supported for this file type.', 'warning');
            }
        } catch (error) {
            console.error('Preview error:', error);
            this.ui.hideLoading();
            this.ui.showToast('Failed to preview: ' + error.message, 'error');
        }
    }

    async handleFileShare(fileId) {
        const fileMetadata = this.currentVault?.files?.find(f => f.id === fileId);
        if (!fileMetadata) return;

        try {
            // Export the master key to include in the fragment
            const exportedKey = await window.crypto.subtle.exportKey('jwk', this.masterKey.key);
            const keyString = btoa(JSON.stringify(exportedKey));
            
            const url = new URL(window.location.href);
            url.hash = `share=${fileMetadata.cid}&key=${keyString}&name=${encodeURIComponent(fileMetadata.name)}&type=${encodeURIComponent(fileMetadata.type)}`;
            
            document.getElementById('shareLinkInput').value = url.toString();
            document.getElementById('shareModal').classList.add('active');
            
        } catch (error) {
            console.error('Share error:', error);
            this.ui.showToast('Failed to generate share link', 'error');
        }
    }

    async checkShareLink() {
        if (!window.location.hash) return;
        
        const hash = window.location.hash.substring(1);
        if (!hash.startsWith('share=')) return;

        const params = new URLSearchParams(hash);
        const cid = params.get('share');
        const keyBase64 = params.get('key');
        const fileName = params.get('name') || 'Shared File';
        const fileType = params.get('type') || 'application/octet-stream';

        if (!cid || !keyBase64) return;

        try {
            this.ui.showLoading('Decrypting shared file...');
            
            // Import key
            const jwk = JSON.parse(atob(keyBase64));
            const key = await window.crypto.subtle.importKey(
                'jwk',
                jwk,
                { name: 'AES-GCM', length: 256 },
                true,
                ['encrypt', 'decrypt']
            );

            // Fetch and decrypt
            const encryptedData = await this.ipfs.fetchData(cid);
            const decryptedData = await this.crypto.decrypt(encryptedData, { key: key });
            this.ui.hideLoading();

            // Offer download or preview
            const blob = new Blob([decryptedData], { type: fileType });
            const url = URL.createObjectURL(blob);
            
            if (fileType.startsWith('image/')) {
                const previewModal = document.getElementById('previewModal');
                document.getElementById('previewBody').innerHTML = `
                    <div style="text-align: center; margin-bottom: 1rem;">
                        <a href="${url}" download="${fileName}" class="btn btn-primary">Download ${fileName}</a>
                    </div>
                    <img src="${url}" class="preview-image" alt="Preview">
                `;
                document.getElementById('previewTitle').textContent = 'Shared File';
                previewModal.classList.add('active');
            } else {
                // Direct download for non-images
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                this.ui.showToast('Shared file downloaded!', 'success');
            }
            
            // Clear hash
            history.replaceState(null, null, window.location.pathname);
            
        } catch (error) {
            console.error('Share decode error:', error);
            this.ui.hideLoading();
            this.ui.showToast('Invalid or expired share link!', 'error');
            history.replaceState(null, null, window.location.pathname);
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

        // Update database with new CID
        if (this.sessionUsername && this.sessionPassword) {
            try {
                await fetch(`${API_BASE_URL}/api/vault/cid`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        username: this.sessionUsername, 
                        password: this.sessionPassword, 
                        cid: newCID 
                    })
                });
            } catch (err) {
                console.error("Failed to sync CID to backend:", err);
            }
        }

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
                const previewBtn = document.getElementById(`preview-${file.id}`);
                const shareBtn = document.getElementById(`share-${file.id}`);

                if (downloadBtn) {
                    downloadBtn.addEventListener('click', () => this.handleFileDownload(file.id));
                }

                if (deleteBtn) {
                    deleteBtn.addEventListener('click', () => this.handleFileDelete(file.id));
                }

                if (previewBtn) {
                    previewBtn.addEventListener('click', () => this.handleFilePreview(file.id));
                }

                if (shareBtn) {
                    shareBtn.addEventListener('click', () => this.handleFileShare(file.id));
                }
            });
            
            if (window.lucide) {
                window.lucide.createIcons();
            }
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
                    <button class="btn-icon-only" id="preview-${file.id}" title="Preview">
                        <i data-lucide="eye"></i>
                    </button>
                    <button class="btn-icon-only" id="share-${file.id}" title="Share">
                        <i data-lucide="share-2"></i>
                    </button>
                    <button class="btn-icon-only" id="download-${file.id}" title="Download">
                        <i data-lucide="download"></i>
                    </button>
                    <button class="btn-icon-only danger" id="delete-${file.id}" title="Delete">
                        <i data-lucide="trash-2"></i>
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
        if (confirm('Are you sure you want to logout?')) {
            sessionStorage.removeItem('vaultCID');
            sessionStorage.removeItem('vaultUsername');
            this.currentVault = null;
            this.masterKey = null;
            this.metadataCID = null;
            this.sessionUsername = null;
            this.sessionPassword = null;
            
            this.ui.showScreen('welcomeScreen');
            this.ui.showToast('Logged out successfully', 'success');
        }
    }

    checkSession() {
        const savedUsername = sessionStorage.getItem('vaultUsername');
        
        if (savedUsername) {
            // Auto-show access vault screen with username pre-filled
            document.getElementById('accessUsername').value = savedUsername;
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

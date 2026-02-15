// IPFS Manager
// Handles connection to IPFS network and data operations

export class IPFSManager {
    constructor() {
        this.client = null;
        this.gateway = 'https://ipfs.io/ipfs/';
        this.apiEndpoint = null;
        this.connected = false;
    }

    async connect() {
        console.log('🌐 Connecting to IPFS...');
        
        const statusEl = document.getElementById('ipfsStatus');
        const statusIndicator = statusEl.querySelector('.status-indicator');
        const statusText = statusEl.querySelector('.status-text');

        try {
            // Try to connect to local IPFS node first
            const localEndpoint = 'http://localhost:5001';
            
            try {
                const response = await fetch(`${localEndpoint}/api/v0/id`, {
                    method: 'POST'
                });
                
                if (response.ok) {
                    this.apiEndpoint = localEndpoint;
                    this.connected = true;
                    
                    statusEl.classList.add('connected');
                    statusText.textContent = 'IPFS Connected (Local Node)';
                    
                    console.log('✅ Connected to local IPFS node');
                    return;
                }
            } catch (localError) {
                console.log('Local IPFS node not available, using public gateway');
            }

            // Fall back to public gateway mode
            this.apiEndpoint = null;
            this.connected = true;
            
            statusEl.classList.add('connected');
            statusText.textContent = 'IPFS Connected (Public Gateway)';
            
            console.log('✅ Using IPFS public gateway');

        } catch (error) {
            console.error('❌ IPFS connection error:', error);
            
            statusEl.classList.add('error');
            statusText.textContent = 'IPFS Connection Failed';
            
            throw new Error('Failed to connect to IPFS network');
        }
    }

    async uploadData(data) {
        if (!this.connected) {
            throw new Error('Not connected to IPFS');
        }

        try {
            // Convert data to Uint8Array if it's a string
            let uint8Data;
            if (typeof data === 'string') {
                uint8Data = new TextEncoder().encode(data);
            } else if (data instanceof Uint8Array) {
                uint8Data = data;
            } else {
                throw new Error('Data must be string or Uint8Array');
            }

            // If we have a local node, use it
            if (this.apiEndpoint) {
                return await this.uploadToLocalNode(uint8Data);
            } else {
                // Use public pinning service (like web3.storage or nft.storage)
                return await this.uploadToPublicService(uint8Data);
            }

        } catch (error) {
            console.error('Upload error:', error);
            throw new Error('Failed to upload to IPFS: ' + error.message);
        }
    }

    async uploadToLocalNode(data) {
        const formData = new FormData();
        const blob = new Blob([data], { type: 'application/octet-stream' });
        formData.append('file', blob, 'encrypted-data');

        const response = await fetch(`${this.apiEndpoint}/api/v0/add?pin=true`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Upload to local node failed');
        }

        const result = await response.json();
        return result.Hash;
    }

    async uploadToPublicService(data) {
        // For demo purposes, we'll use web3.storage API
        // In production, users should provide their own API key
        
        // Since we can't use a real service without API keys in this demo,
        // we'll simulate by creating a hash and storing in localStorage
        // This is NOT a real IPFS upload, just for demonstration
        
        const cid = await this.generateMockCID(data);
        
        // Store in localStorage as fallback
        const key = `ipfs_mock_${cid}`;
        const base64Data = this.arrayBufferToBase64(data);
        
        try {
            localStorage.setItem(key, base64Data);
        } catch (e) {
            console.warn('localStorage full, using session storage');
            sessionStorage.setItem(key, base64Data);
        }
        
        console.log(`📦 Mock IPFS upload: ${cid} (stored locally)`);
        return cid;
    }

    async fetchData(cid) {
        if (!this.connected) {
            throw new Error('Not connected to IPFS');
        }

        try {
            // Try local node first
            if (this.apiEndpoint) {
                return await this.fetchFromLocalNode(cid);
            }

            // Try mock storage
            const mockKey = `ipfs_mock_${cid}`;
            let base64Data = localStorage.getItem(mockKey) || sessionStorage.getItem(mockKey);
            
            if (base64Data) {
                return this.base64ToArrayBuffer(base64Data);
            }

            // Try public gateway as last resort
            return await this.fetchFromGateway(cid);

        } catch (error) {
            console.error('Fetch error:', error);
            throw new Error('Failed to fetch from IPFS: ' + error.message);
        }
    }

    async fetchFromLocalNode(cid) {
        const response = await fetch(`${this.apiEndpoint}/api/v0/cat?arg=${cid}`, {
            method: 'POST'
        });

        if (!response.ok) {
            throw new Error('Failed to fetch from local node');
        }

        const arrayBuffer = await response.arrayBuffer();
        return new Uint8Array(arrayBuffer);
    }

    async fetchFromGateway(cid) {
        const response = await fetch(`${this.gateway}${cid}`);

        if (!response.ok) {
            throw new Error('Failed to fetch from gateway');
        }

        const arrayBuffer = await response.arrayBuffer();
        return new Uint8Array(arrayBuffer);
    }

    async generateMockCID(data) {
        // Generate a deterministic CID-like hash from the data
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        
        // Format as a fake CID (Qm... style for v0, bafy... for v1)
        return 'Qm' + hashHex.substring(0, 44);
    }

    arrayBufferToBase64(buffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    base64ToArrayBuffer(base64) {
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    }

    isConnected() {
        return this.connected;
    }

    getGatewayUrl(cid) {
        return `${this.gateway}${cid}`;
    }
}

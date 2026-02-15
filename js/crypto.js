// Crypto Manager
// Handles all encryption, decryption, and key derivation

export class CryptoManager {
    constructor() {
        this.algorithm = 'AES-GCM';
        this.keyLength = 256;
        this.ivLength = 12; // 96 bits for GCM
        this.saltLength = 16;
        this.iterations = 100000; // PBKDF2 iterations
    }

    /**
     * Derive encryption key from password using PBKDF2
     */
    async deriveKey(password, salt = null) {
        console.log('🔑 Deriving encryption key...');

        // Generate or use provided salt
        const saltBuffer = salt || crypto.getRandomValues(new Uint8Array(this.saltLength));

        // Convert password to key material
        const passwordBuffer = new TextEncoder().encode(password);
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            passwordBuffer,
            'PBKDF2',
            false,
            ['deriveBits', 'deriveKey']
        );

        // Derive key using PBKDF2
        const key = await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: saltBuffer,
                iterations: this.iterations,
                hash: 'SHA-256'
            },
            keyMaterial,
            {
                name: this.algorithm,
                length: this.keyLength
            },
            true, // extractable
            ['encrypt', 'decrypt']
        );

        // Export key and combine with salt
        const exportedKey = await crypto.subtle.exportKey('raw', key);
        
        // Return combined salt + key for future use
        return {
            key: key,
            salt: saltBuffer,
            exportedKey: new Uint8Array(exportedKey)
        };
    }

    /**
     * Encrypt data using AES-256-GCM
     */
    async encrypt(data, keyData) {
        try {
            // Convert data to Uint8Array if needed
            let dataBuffer;
            if (typeof data === 'string') {
                dataBuffer = new TextEncoder().encode(data);
            } else if (data instanceof Uint8Array) {
                dataBuffer = data;
            } else {
                throw new Error('Data must be string or Uint8Array');
            }

            // Generate random IV
            const iv = crypto.getRandomValues(new Uint8Array(this.ivLength));

            // Encrypt
            const encryptedBuffer = await crypto.subtle.encrypt(
                {
                    name: this.algorithm,
                    iv: iv
                },
                keyData.key,
                dataBuffer
            );

            const encryptedData = new Uint8Array(encryptedBuffer);

            // Combine: salt + iv + encrypted data
            const combined = new Uint8Array(
                keyData.salt.length + iv.length + encryptedData.length
            );
            
            combined.set(keyData.salt, 0);
            combined.set(iv, keyData.salt.length);
            combined.set(encryptedData, keyData.salt.length + iv.length);

            return combined;

        } catch (error) {
            console.error('Encryption error:', error);
            throw new Error('Failed to encrypt data: ' + error.message);
        }
    }

    /**
     * Decrypt data using AES-256-GCM
     */
    async decrypt(encryptedData, keyData) {
        try {
            // Extract components
            const salt = encryptedData.slice(0, this.saltLength);
            const iv = encryptedData.slice(this.saltLength, this.saltLength + this.ivLength);
            const data = encryptedData.slice(this.saltLength + this.ivLength);

            // Decrypt
            const decryptedBuffer = await crypto.subtle.decrypt(
                {
                    name: this.algorithm,
                    iv: iv
                },
                keyData.key,
                data
            );

            return new Uint8Array(decryptedBuffer);

        } catch (error) {
            console.error('Decryption error:', error);
            throw new Error('Failed to decrypt data. Wrong password or corrupted data.');
        }
    }

    /**
     * Generate random encryption key (alternative to password-based)
     */
    async generateRandomKey() {
        const key = await crypto.subtle.generateKey(
            {
                name: this.algorithm,
                length: this.keyLength
            },
            true,
            ['encrypt', 'decrypt']
        );

        const exportedKey = await crypto.subtle.exportKey('raw', key);
        const salt = crypto.getRandomValues(new Uint8Array(this.saltLength));

        return {
            key: key,
            salt: salt,
            exportedKey: new Uint8Array(exportedKey)
        };
    }

    /**
     * Hash data using SHA-256
     */
    async hash(data) {
        const buffer = typeof data === 'string' 
            ? new TextEncoder().encode(data)
            : data;

        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        return new Uint8Array(hashBuffer);
    }

    /**
     * Convert Uint8Array to hex string
     */
    toHex(buffer) {
        return Array.from(buffer)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    /**
     * Convert hex string to Uint8Array
     */
    fromHex(hex) {
        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < hex.length; i += 2) {
            bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
        }
        return bytes;
    }

    /**
     * Validate password strength
     */
    checkPasswordStrength(password) {
        let strength = 0;
        let feedback = [];

        // Length check
        if (password.length >= 8) strength += 20;
        if (password.length >= 12) strength += 20;
        if (password.length >= 16) strength += 10;

        // Character variety
        if (/[a-z]/.test(password)) strength += 10;
        if (/[A-Z]/.test(password)) strength += 10;
        if (/[0-9]/.test(password)) strength += 10;
        if (/[^a-zA-Z0-9]/.test(password)) strength += 20;

        // Feedback
        if (password.length < 8) {
            feedback.push('Use at least 8 characters');
        }
        if (!/[a-z]/.test(password)) {
            feedback.push('Add lowercase letters');
        }
        if (!/[A-Z]/.test(password)) {
            feedback.push('Add uppercase letters');
        }
        if (!/[0-9]/.test(password)) {
            feedback.push('Add numbers');
        }
        if (!/[^a-zA-Z0-9]/.test(password)) {
            feedback.push('Add special characters');
        }

        // Determine level
        let level = 'weak';
        let color = '#ff0055';

        if (strength >= 70) {
            level = 'strong';
            color = '#00ff88';
        } else if (strength >= 50) {
            level = 'medium';
            color = '#ffaa00';
        }

        return {
            strength: Math.min(strength, 100),
            level: level,
            color: color,
            feedback: feedback
        };
    }
}

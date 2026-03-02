# 🔒 VaultX - Decentralized Zero-Knowledge File Storage

<p align="center">
  <img src="https://img.shields.io/badge/VaultX-Decentralized%20Storage-00f0ff?style=for-the-badge" alt="VaultX"/>
  <img src="https://img.shields.io/badge/Zero--Knowledge-AES--256--GCM-ff00ea?style=for-the-badge" alt="Zero-Knowledge"/>
  <img src="https://img.shields.io/badge/IPFS-Distributed-7000ff?style=for-the-badge" alt="IPFS"/>
</p>

A beautiful, fully functional decentralized file storage system with **zero-knowledge encryption**, built on IPFS and pure browser technology. No backend required!

## ✨ Features

### 🔐 Security First
- **Zero-Knowledge Architecture** - Files encrypted client-side before upload
- **AES-256-GCM Encryption** - Military-grade encryption standard
- **PBKDF2 Key Derivation** - 100,000 iterations for password security
- **No Passwords Stored** - Your password never leaves your device

### 🌐 Truly Decentralized
- **IPFS Storage** - Files distributed across the global IPFS network
- **No Central Server** - Works entirely in your browser
- **Censorship Resistant** - No single point of failure
- **Peer-to-Peer** - Direct file sharing via IPFS

### 🎨 Beautiful UI/UX
- **Cyberpunk Design** - Modern neon aesthetic
- **Smooth Animations** - Polished user experience
- **Responsive** - Works on desktop, tablet, and mobile
- **Drag & Drop** - Easy file uploads

### 🚀 Easy to Use
- **No Accounts** - Just create a vault with a password
- **Instant Setup** - No installation or configuration
- **Browser-Based** - Works in any modern browser
- **Privacy First** - No tracking, no analytics, no data collection

## 🚀 Quick Start

### Option 1: Use with Local IPFS Node (Recommended)

1. **Install IPFS Desktop**
   ```bash
   # Download from: https://github.com/ipfs/ipfs-desktop/releases
   # Or install via package manager:
   
   # macOS
   brew install --cask ipfs
   
   # Windows
   choco install ipfs-desktop
   
   # Linux
   wget https://github.com/ipfs/ipfs-desktop/releases/download/v0.32.0/ipfs-desktop-0.32.0-linux-x86_64.AppImage
   chmod +x ipfs-desktop-*.AppImage
   ./ipfs-desktop-*.AppImage
   ```

2. **Configure IPFS CORS**
   ```bash
   # Enable CORS for web access
   ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin '["http://localhost:8080", "http://127.0.0.1:8080", "*"]'
   ipfs config --json API.HTTPHeaders.Access-Control-Allow-Methods '["PUT", "POST", "GET"]'
   ```

3. **Start IPFS Daemon**
   ```bash
   ipfs daemon
   ```

4. **Run VaultX**
   ```bash
   # Option A: Using Python
   python3 -m http.server 8080
   
   # Option B: Using Node.js
   npx http-server -p 8080
   
   # Option C: Using PHP
   php -S localhost:8080
   ```

5. **Open in Browser**
   ```
   http://localhost:8080
   ```

### Option 2: Use with Public IPFS Gateway (Easy Start)

1. **Just open `index.html` in your browser!**
   - The app will automatically use public IPFS gateways
   - No IPFS installation required
   - Files stored in browser storage (mock mode for demo)

**Note:** For production use with real IPFS storage, use Option 1 with a local IPFS node.

## 📖 How to Use

### Creating Your First Vault

1. Click **"Create New Vault"**
2. Enter a strong master password
   - At least 8 characters
   - Mix of uppercase, lowercase, numbers, and symbols
   - **IMPORTANT:** This password cannot be recovered!
3. Click **"Create Vault"**
4. **Save your CID!** - You'll need this to access your vault later

### Accessing Your Vault

1. Click **"Access Existing Vault"**
2. Enter your Metadata CID
3. Enter your master password
4. Click **"Access Vault"**

### Uploading Files

1. **Drag & Drop** - Drag files onto the upload zone
2. **Click to Browse** - Click the upload zone to select files
3. Files are automatically encrypted and uploaded to IPFS
4. Your vault metadata is updated with new file references

### Downloading Files

1. Click the **download icon** next to any file
2. File is fetched from IPFS, decrypted, and downloaded
3. Original filename and type are preserved

### Managing Files

- **Delete Files** - Click the trash icon to remove files from your vault
- **View Details** - See file size, upload date, and IPFS CID
- **Copy CID** - Copy your vault CID to share or backup

## 🏗️ Architecture

### How It Works

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Browser   │ ──────> │  Encryption  │ ──────> │    IPFS     │
│             │         │  (AES-256)   │         │   Network   │
└─────────────┘         └──────────────┘         └─────────────┘
      ↑                                                   ↓
      │                                                   │
      └───────────────── Decryption ─────────────────────┘
```

1. **File Upload Flow:**
   - User selects file
   - File read as ArrayBuffer
   - Encrypted with AES-256-GCM using derived key
   - Uploaded to IPFS → Returns CID
   - Metadata updated and re-encrypted
   - New metadata CID returned

2. **File Download Flow:**
   - User requests file
   - Fetch encrypted data from IPFS using CID
   - Decrypt with user's key
   - Create blob and download to user's device

3. **Key Derivation:**
   - Password → PBKDF2 (100k iterations) → 256-bit key
   - Each encryption uses unique IV (Initialization Vector)
   - Salt stored with encrypted data

### File Structure

```
vaultx/
├── index.html          # Main HTML structure
├── css/
│   └── styles.css      # Cyberpunk themed CSS
├── js/
│   ├── app.js          # Main application logic
│   ├── ipfs.js         # IPFS connection & operations
│   ├── crypto.js       # Encryption & key management
│   └── ui.js           # UI management & interactions
└── README.md           # This file
```

### Data Format

**Vault Metadata:**
```json
{
  "version": "1.0",
  "created": "2024-01-15T10:30:00.000Z",
  "files": [
    {
      "id": "unique-file-id",
      "name": "document.pdf",
      "size": 1048576,
      "type": "application/pdf",
      "cid": "QmXxxx...",
      "uploadedAt": "2024-01-15T10:35:00.000Z"
    }
  ]
}
```

**Encrypted Data Structure:**
```
[Salt (16 bytes)][IV (12 bytes)][Encrypted Data (variable)]
```

## 🔒 Security Features

### Encryption
- **Algorithm:** AES-256-GCM (Galois/Counter Mode)
- **Key Derivation:** PBKDF2 with SHA-256
- **Iterations:** 100,000
- **IV:** 96-bit random (unique per encryption)
- **Salt:** 128-bit random (unique per key derivation)

### Zero-Knowledge Properties
- ✅ Files encrypted before leaving your device
- ✅ Encryption key never transmitted
- ✅ Password never stored or transmitted
- ✅ Server/IPFS nodes cannot decrypt your files
- ✅ Only you can access your data

### Best Practices
1. **Use Strong Passwords**
   - At least 12 characters
   - Mix of character types
   - Avoid common words or patterns

2. **Backup Your CID**
   - Write it down securely
   - Store in password manager
   - Share via secure channel only

3. **Keep Your Password Safe**
   - Never share your password
   - Use a password manager
   - Cannot be recovered if lost!

## 🌐 IPFS Integration

### Local Node Benefits
- ✅ Faster uploads and downloads
- ✅ True decentralization
- ✅ Pin files permanently
- ✅ Contribute to IPFS network

### Public Gateway Mode
- ✅ No installation required
- ✅ Quick start for testing
- ✅ Works immediately
- ⚠️ Files stored in browser (demo mode)

### IPFS Commands

```bash
# Check IPFS status
ipfs id

# Pin a file (keep it available)
ipfs pin add <CID>

# List pinned files
ipfs pin ls

# Get file from IPFS
ipfs cat <CID>

# Check if file is available
ipfs dht findprovs <CID>
```

## 🛠️ Development

### Prerequisites
- Modern browser with Web Crypto API support
- (Optional) Local IPFS node for production use

### Local Development

```bash
# Clone or download the project
cd vaultx

# Start a local server
python3 -m http.server 8080

# Or with Node.js
npx http-server -p 8080

# Open in browser
open http://localhost:8080
```

### Building

No build process required! Pure vanilla JavaScript, HTML, and CSS.

### Browser Support

- ✅ Chrome/Edge 80+
- ✅ Firefox 75+
- ✅ Safari 14+
- ✅ Opera 67+

Requires:
- Web Crypto API
- ES6 Modules
- Fetch API
- FileReader API

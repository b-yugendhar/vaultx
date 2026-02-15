# VaultX Quick Start Guide

Get up and running in 5 minutes!

## 🚀 Fastest Way to Start

### 1. Extract the ZIP file
```bash
unzip vaultx.zip
cd vaultx
```

### 2. Start a Local Server

**Python (Easiest):**
```bash
python3 -m http.server 8080
```

**Or Node.js:**
```bash
npx http-server -p 8080
```

**Or PHP:**
```bash
php -S localhost:8080
```

### 3. Open in Browser
```
http://localhost:8080
```

That's it! You can now use VaultX. 🎉

## 📝 First Steps

### Create Your Vault
1. Click **"Create New Vault"**
2. Enter a strong password (12+ characters recommended)
3. Click **"Create Vault"**
4. **IMPORTANT:** Copy and save your CID somewhere safe!

### Upload Files
1. Drag & drop files onto the upload zone
2. Or click to browse and select files
3. Files are automatically encrypted and uploaded

### Download Files
1. Click the download icon next to any file
2. File is decrypted and downloaded to your device

## ⚡ Quick Tips

- **Backup your CID** - You need it to access your vault later
- **Use strong passwords** - Your security depends on it
- **Test with small files first** - Start with files under 10MB
- **Save your work** - Log out saves your CID in session storage

## 🌐 IPFS Mode

By default, VaultX works in **demo mode** (files stored in browser).

For **real IPFS storage**:
1. Install IPFS Desktop from https://github.com/ipfs/ipfs-desktop/releases
2. Enable CORS (see SETUP.md for details)
3. Restart VaultX

## 📚 Need More Help?

- **Full Setup Guide:** See SETUP.md
- **Security Info:** See SECURITY.md
- **All Features:** See README.md

## ⚠️ Important Notes

1. **No Password Recovery** - If you lose your password, your files are gone forever
2. **Save Your CID** - You need it to access your vault
3. **Strong Passwords** - Use at least 12 characters with mixed types
4. **Demo Mode** - Without IPFS, files are stored in browser only

## 🎯 Common Commands

```bash
# Start server (Python)
python3 -m http.server 8080

# Start server (Node.js)
npx http-server -p 8080

# Start IPFS daemon (if installed)
ipfs daemon

# Check IPFS status
ipfs id
```

---

**Happy encrypting! 🔒**

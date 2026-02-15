# VaultX Setup Guide

Complete setup instructions for running VaultX locally with full IPFS integration.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [IPFS Installation](#ipfs-installation)
3. [IPFS Configuration](#ipfs-configuration)
4. [Running VaultX](#running-vaultx)
5. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection

### Optional (for full IPFS functionality)
- IPFS Desktop or IPFS CLI
- Local web server (Python, Node.js, or PHP)

## IPFS Installation

### Option 1: IPFS Desktop (Easiest)

**Windows:**
```powershell
# Download from GitHub
# https://github.com/ipfs/ipfs-desktop/releases

# Or use Chocolatey
choco install ipfs-desktop
```

**macOS:**
```bash
# Using Homebrew
brew install --cask ipfs

# Or download from GitHub
# https://github.com/ipfs/ipfs-desktop/releases
```

**Linux:**
```bash
# Ubuntu/Debian - Download AppImage
wget https://github.com/ipfs/ipfs-desktop/releases/download/v0.32.0/ipfs-desktop-0.32.0-linux-x86_64.AppImage

# Make executable
chmod +x ipfs-desktop-*.AppImage

# Run
./ipfs-desktop-*.AppImage
```

### Option 2: IPFS CLI (Advanced)

**All Platforms:**
```bash
# Download go-ipfs
# Visit: https://dist.ipfs.tech/#go-ipfs

# Extract and install
tar -xvzf go-ipfs_v0.22.0_linux-amd64.tar.gz
cd go-ipfs
sudo bash install.sh

# Verify installation
ipfs --version
```

**Initialize IPFS:**
```bash
ipfs init
```

## IPFS Configuration

### 1. Enable CORS (Required for Web Access)

**Using IPFS Desktop:**
1. Open IPFS Desktop
2. Go to Settings
3. Find "IPFS Config"
4. Add CORS settings:

```json
{
  "API": {
    "HTTPHeaders": {
      "Access-Control-Allow-Origin": [
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "*"
      ],
      "Access-Control-Allow-Methods": [
        "PUT",
        "POST",
        "GET"
      ]
    }
  }
}
```

**Using IPFS CLI:**
```bash
# Allow all origins (for testing)
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin '["*"]'

# Or specific origins (recommended)
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin '["http://localhost:8080", "http://127.0.0.1:8080"]'

# Allow required methods
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Methods '["PUT", "POST", "GET"]'
```

### 2. Start IPFS Daemon

**Using IPFS Desktop:**
- IPFS Desktop automatically starts the daemon
- Check status in the app

**Using IPFS CLI:**
```bash
# Start daemon
ipfs daemon

# You should see:
# Daemon is ready
# API server listening on /ip4/127.0.0.1/tcp/5001
# Gateway server listening on /ip4/127.0.0.1/tcp/8081
```

### 3. Verify IPFS is Running

```bash
# Check IPFS status
ipfs id

# Test API endpoint
curl http://localhost:5001/api/v0/version

# Or visit in browser
http://localhost:5001/webui
```

## Running VaultX

### Method 1: Python (Easiest)

```bash
# Navigate to VaultX directory
cd vaultx

# Start server
python3 -m http.server 8080

# Open in browser
http://localhost:8080
```

### Method 2: Node.js

```bash
# Install http-server globally (one time)
npm install -g http-server

# Navigate to VaultX directory
cd vaultx

# Start server
http-server -p 8080

# Or using npx (no install)
npx http-server -p 8080

# Open in browser
http://localhost:8080
```

### Method 3: PHP

```bash
# Navigate to VaultX directory
cd vaultx

# Start server
php -S localhost:8080

# Open in browser
http://localhost:8080
```

### Method 4: Live Server (VSCode)

1. Install "Live Server" extension in VSCode
2. Right-click `index.html`
3. Select "Open with Live Server"

### Method 5: Direct File Open (Limited)

⚠️ **Not Recommended** - CORS and ES6 modules won't work properly

```
file:///path/to/vaultx/index.html
```

## Quick Start Checklist

- [ ] IPFS installed
- [ ] IPFS daemon running
- [ ] CORS configured
- [ ] Web server running
- [ ] Browser opened to http://localhost:8080
- [ ] IPFS status shows "Connected"

## Troubleshooting

### IPFS Status Shows "Connection Failed"

**Problem:** VaultX can't connect to IPFS

**Solutions:**
1. Check IPFS daemon is running:
   ```bash
   ipfs id
   ```

2. Check API endpoint:
   ```bash
   curl http://localhost:5001/api/v0/version
   ```

3. Verify CORS configuration:
   ```bash
   ipfs config API.HTTPHeaders.Access-Control-Allow-Origin
   ```

4. Restart IPFS daemon:
   ```bash
   # Stop
   ipfs shutdown
   
   # Start
   ipfs daemon
   ```

### CORS Errors in Browser Console

**Error:** `Access to fetch at 'http://localhost:5001' from origin 'http://localhost:8080' has been blocked by CORS policy`

**Solution:**
```bash
# Re-apply CORS settings
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin '["*"]'
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Methods '["PUT", "POST", "GET"]'

# Restart daemon
ipfs shutdown
ipfs daemon
```

### Module Import Errors

**Error:** `Failed to load module script: Expected a JavaScript module script`

**Problem:** Opening file directly instead of through web server

**Solution:**
- Always use a local web server
- Don't open `file://` URLs directly

### Port Already in Use

**Error:** `Address already in use: 8080`

**Solution:**
```bash
# Use different port
python3 -m http.server 8081

# Or find and kill process
# Linux/Mac
lsof -ti:8080 | xargs kill -9

# Windows
netstat -ano | findstr :8080
taskkill /PID <PID> /F
```

### IPFS Not Installing

**Windows:**
- Run installer as Administrator
- Check antivirus isn't blocking
- Try manual installation from GitHub releases

**macOS:**
- Allow app in Security & Privacy settings
- Try: `xattr -d com.apple.quarantine /Applications/IPFS\ Desktop.app`

**Linux:**
- Make AppImage executable: `chmod +x ipfs-desktop-*.AppImage`
- Install FUSE: `sudo apt install fuse`

### Files Not Uploading

**Check:**
1. IPFS daemon is running
2. CORS is configured
3. Check browser console for errors
4. Verify file size isn't too large (start with <10MB)
5. Check available disk space

### Can't Access Vault After Creating

**Problem:** Lost CID or wrong password

**Solution:**
- CID cannot be recovered without backup
- Password cannot be reset
- This is by design (zero-knowledge)
- Always backup your CID immediately

### Performance Issues

**Slow uploads:**
1. Use local IPFS node
2. Check network connection
3. Consider file size
4. Enable file chunking for large files

**Slow downloads:**
1. Wait for IPFS network propagation
2. Use gateway with good connectivity
3. Pin files for faster retrieval

## Advanced Configuration

### Custom IPFS Gateway

Edit `js/ipfs.js`:
```javascript
this.gateway = 'https://your-gateway.com/ipfs/';
```

### Custom API Endpoint

Edit `js/ipfs.js`:
```javascript
const localEndpoint = 'http://your-ipfs-node:5001';
```

### File Size Limits

Adjust in `js/app.js`:
```javascript
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
```

## Security Best Practices

1. **Use HTTPS in Production**
   ```bash
   # Generate self-signed cert
   openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
   
   # Run with HTTPS
   http-server -S -C cert.pem -K key.pem
   ```

2. **Limit CORS Origins**
   ```bash
   # Production - specific origins only
   ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin '["https://yourdomain.com"]'
   ```

3. **Use Strong Passwords**
   - Minimum 12 characters
   - Mix of character types
   - Use password manager

4. **Backup Your CID**
   - Write it down
   - Store securely
   - Don't share publicly

## Getting Help

- Check browser console for errors
- Review IPFS logs: `ipfs log tail`
- Visit IPFS documentation: https://docs.ipfs.tech
- Ask in IPFS forums: https://discuss.ipfs.tech

## Next Steps

Once everything is working:
1. Create your first vault
2. Upload a test file
3. Backup your CID
4. Try accessing from another device
5. Explore IPFS features

---

**Happy decentralized storage! 🚀**

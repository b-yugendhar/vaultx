# VaultX Security Documentation

## Security Overview

VaultX implements **zero-knowledge encryption** ensuring that only you can access your files. This document explains the security architecture, encryption methods, and best practices.

## 🔒 Security Architecture

### Zero-Knowledge Principle

**What it means:**
- Your files are encrypted **before** leaving your device
- Encryption keys are derived from your password locally
- Neither IPFS nodes nor anyone else can decrypt your files
- Only you possess the password needed to decrypt

**How it works:**
```
User Password → PBKDF2 → Encryption Key → AES-256-GCM → Encrypted Data → IPFS
```

## 🛡️ Encryption Details

### AES-256-GCM

**Algorithm:** Advanced Encryption Standard with Galois/Counter Mode
- **Key Size:** 256 bits (32 bytes)
- **Block Size:** 128 bits (16 bytes)
- **Mode:** GCM (Authenticated Encryption)

**Why AES-256-GCM?**
- Military-grade encryption standard
- Authenticated encryption (prevents tampering)
- Fast and efficient
- Native browser support via Web Crypto API
- NIST recommended

### Key Derivation (PBKDF2)

**Function:** Password-Based Key Derivation Function 2
- **Hash:** SHA-256
- **Iterations:** 100,000
- **Salt:** 128-bit random (16 bytes)
- **Output:** 256-bit key

**Why PBKDF2?**
- Slows down brute-force attacks
- Unique salt per vault prevents rainbow tables
- Industry standard
- Native browser support

### Initialization Vector (IV)

- **Size:** 96 bits (12 bytes) - optimal for GCM
- **Generation:** Cryptographically secure random
- **Uniqueness:** New IV for every encryption operation
- **Storage:** Prepended to encrypted data

### Data Structure

```
┌────────────┬──────────┬────────────────────┐
│ Salt       │ IV       │ Encrypted Data     │
│ 16 bytes   │ 12 bytes │ Variable           │
└────────────┴──────────┴────────────────────┘
```

## 🔑 Key Management

### Password Requirements

**Minimum:**
- 8 characters minimum
- Mix of uppercase and lowercase
- Include numbers
- Include special characters

**Recommended:**
- 12+ characters
- No dictionary words
- No personal information
- Unique to VaultX
- Use password manager

### Password Strength Scoring

```javascript
Weak:     0-49%  - Too short, lacks variety
Medium:  50-69%  - Good length, some variety
Strong:  70-100% - Long, high variety, secure
```

**Password Checker:**
- Length (8+, 12+, 16+ characters)
- Lowercase letters (a-z)
- Uppercase letters (A-Z)
- Numbers (0-9)
- Special characters (!@#$%^&*)

### Key Storage

**What's Stored:**
- ❌ Password - NEVER stored anywhere
- ❌ Encryption key - NEVER stored
- ✅ Vault CID - Session storage (temporary)
- ✅ Salt - Stored with encrypted data

**Key Lifecycle:**
1. User enters password
2. Key derived in memory
3. Used for encryption/decryption
4. Cleared when user logs out
5. Never persisted to disk

## 🌐 IPFS Security Considerations

### What IPFS Stores

**IPFS nodes see:**
- ✅ Encrypted data (ciphertext)
- ✅ File size (encrypted size)
- ✅ CID (content identifier)
- ❌ Original filename
- ❌ File content
- ❌ Encryption key

### Content Addressing

**CID (Content Identifier):**
- Cryptographic hash of encrypted data
- Same content = same CID
- Different encryption = different CID
- Content verifiable by hash

**Privacy:**
- CID doesn't reveal file content
- CID changes with each vault update
- Treat CID as sensitive (like a password)

### Data Persistence

**Pinning:**
- Files stored on IPFS until garbage collected
- Pin files to keep them permanently
- Use pinning services for reliability

**Deletion:**
- Removing from vault doesn't delete from IPFS
- Files remain on nodes that pinned them
- True deletion requires unpinning everywhere
- Consider data immutability

## 🚨 Threat Model

### What VaultX Protects Against

✅ **Server Compromise**
- No central server to hack
- Files encrypted at rest

✅ **Network Eavesdropping**
- Files encrypted before transmission
- Only ciphertext visible on network

✅ **IPFS Node Compromise**
- Nodes can't decrypt files
- Only see encrypted data

✅ **Unauthorized Access**
- Requires password to decrypt
- No access without correct password

### What VaultX Doesn't Protect Against

❌ **Weak Passwords**
- Dictionary attacks
- Brute-force attacks
- Use strong passwords!

❌ **Phishing**
- Fake VaultX sites
- Keyloggers
- Social engineering

❌ **Browser Compromise**
- Malware on your device
- Browser extensions
- Keep system secure

❌ **Physical Access**
- Someone with device access
- Keyloggers
- Screen capture

❌ **Lost Passwords**
- No password recovery
- No backdoors
- Backup your CID!

## 🔐 Best Practices

### For Users

1. **Password Management**
   ```
   ✅ Use password manager
   ✅ Generate random passwords
   ✅ Unique password per vault
   ❌ Don't reuse passwords
   ❌ Don't share passwords
   ```

2. **CID Management**
   ```
   ✅ Backup immediately
   ✅ Store securely
   ✅ Use multiple backups
   ❌ Don't share publicly
   ❌ Don't lose it!
   ```

3. **Device Security**
   ```
   ✅ Keep OS updated
   ✅ Use antivirus
   ✅ Enable firewall
   ✅ Use HTTPS sites
   ❌ Don't use public computers
   ```

4. **Operational Security**
   ```
   ✅ Verify VaultX URL
   ✅ Check for HTTPS
   ✅ Log out when done
   ✅ Clear browser cache
   ❌ Don't use on public WiFi
   ```

### For Developers

1. **Code Security**
   ```javascript
   // ✅ Good - Secure random
   crypto.getRandomValues(new Uint8Array(16))
   
   // ❌ Bad - Predictable
   Math.random()
   ```

2. **Key Handling**
   ```javascript
   // ✅ Good - Clear sensitive data
   password = null;
   key = null;
   
   // ❌ Bad - Leave in memory
   // (no cleanup)
   ```

3. **Input Validation**
   ```javascript
   // ✅ Good - Validate input
   if (!password || password.length < 8) {
     throw new Error('Invalid password');
   }
   
   // ❌ Bad - No validation
   deriveKey(password);
   ```

## 🔍 Security Audit Checklist

### Encryption
- [ ] AES-256-GCM used correctly
- [ ] Unique IV per encryption
- [ ] Secure random number generation
- [ ] Proper key derivation
- [ ] No hardcoded keys

### Key Management
- [ ] Password not stored
- [ ] Key not persisted
- [ ] Proper key lifecycle
- [ ] Memory cleared on logout
- [ ] No key logging

### Data Protection
- [ ] Client-side encryption
- [ ] Encrypted before upload
- [ ] Decrypted after download
- [ ] No plaintext transmission
- [ ] No plaintext storage

### Implementation
- [ ] Web Crypto API used
- [ ] No custom crypto
- [ ] No eval() usage
- [ ] Input sanitization
- [ ] XSS prevention

## 🐛 Vulnerability Reporting

If you discover a security vulnerability:

1. **Don't** publicly disclose
2. **Do** report privately
3. Include:
   - Description of vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

## 📚 Security Resources

### Standards & Specifications
- [NIST AES](https://csrc.nist.gov/publications/detail/fips/197/final)
- [RFC 5869 - PBKDF2](https://tools.ietf.org/html/rfc2898)
- [RFC 5288 - AES-GCM](https://tools.ietf.org/html/rfc5288)

### Recommended Reading
- [OWASP Cryptographic Storage](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [Zero-Knowledge Proofs](https://en.wikipedia.org/wiki/Zero-knowledge_proof)

### Tools
- [zxcvbn - Password Strength](https://github.com/dropbox/zxcvbn)
- [KeePassXC - Password Manager](https://keepassxc.org/)
- [Have I Been Pwned](https://haveibeenpwned.com/)

## ⚖️ Security vs Usability

### Trade-offs

**More Secure:**
- Longer passwords
- More PBKDF2 iterations
- No password hints
- No recovery options

**More Usable:**
- Shorter passwords allowed
- Fewer iterations (faster)
- Password hints
- Recovery mechanisms

**VaultX Choice:**
- Balanced approach
- 8 character minimum (allows flexibility)
- 100k iterations (security + speed)
- No recovery (true zero-knowledge)
- Encourage strong passwords

## 🔄 Security Updates

### Current Version: 1.0.0

**Security Features:**
- ✅ AES-256-GCM encryption
- ✅ PBKDF2 key derivation
- ✅ Secure random generation
- ✅ Zero-knowledge architecture
- ✅ No data collection

**Known Limitations:**
- ⚠️ No 2FA support
- ⚠️ No password recovery
- ⚠️ Browser-based only
- ⚠️ Single user per vault

### Future Enhancements
- [ ] Hardware key support (WebAuthn)
- [ ] Multi-signature access
- [ ] Key rotation
- [ ] Audit logging
- [ ] Security monitoring

## 📞 Security Contact

For security concerns:
- Review this documentation
- Check for updates
- Report vulnerabilities privately
- Follow security best practices

---

**Remember: Security is a shared responsibility!**

*Your security depends on:*
- Strong passwords
- Secure devices
- Careful operations
- Regular backups

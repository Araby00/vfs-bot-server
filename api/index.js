import pkg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const { Pool } = pkg;

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
});

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "VFSAdmin2025!Secret";

async function checkLicense(key, country, deviceId) {
  try {
    const result = await pool.query(
      'SELECT * FROM vfs_licenses WHERE license_key = $1',
      [key]
    );
    
    if (result.rows.length === 0) {
      return { valid: false, reason: "License key not found" };
    }
    
    const license = result.rows[0];
    
    if (!license.active) {
      return { valid: false, reason: "This license has been disabled by administrator" };
    }
    
    const expireDate = new Date(license.expires);
    const today = new Date();
    
    if (expireDate < today) {
      return { valid: false, reason: "License expired on " + license.expires };
    }
    
    if (license.country !== "both" && license.country !== country) {
      return { 
        valid: false, 
        reason: `License only valid for ${license.country}, not ${country}` 
      };
    }
    
    if (license.device_id === null) {
      await pool.query(
        'UPDATE vfs_licenses SET device_id = $1 WHERE license_key = $2',
        [deviceId, key]
      );
      
      console.log(`[DEVICE LOCK] License ${key} locked to device: ${deviceId}`);
      
      return { 
        valid: true, 
        email: license.email, 
        expires: license.expires,
        firstActivation: true 
      };
    }
    
    if (license.device_id !== deviceId) {
      return { 
        valid: false, 
        reason: "This license is already activated on another device. Contact support to transfer." 
      };
    }
    
    return { 
      valid: true, 
      email: license.email, 
      expires: license.expires,
      firstActivation: false 
    };
    
  } catch (error) {
    console.error('[DB ERROR]', error);
    return { valid: false, reason: "Database error" };
  }
}

export default async function handler(req, res) {
  // ⭐⭐⭐ SERVE BOT.ENC FILE FIRST ⭐⭐⭐
  if (req.url === '/public/bot.enc' || req.url === '/bot.enc') {
    try {
      // Try public folder first
      let botPath = join(__dirname, '../public/bot.enc');
      let botEnc;
      
      try {
        botEnc = readFileSync(botPath, 'utf8');
      } catch {
        // If not in public, try root
        botPath = join(__dirname, '../bot.enc');
        botEnc = readFileSync(botPath, 'utf8');
      }
      
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Access-Control-Allow-Origin', '*');
      console.log('[BOT.ENC] File served successfully');
      return res.status(200).send(botEnc);
    } catch (error) {
      console.error('[BOT.ENC ERROR]', error);
      return res.status(404).json({ 
        error: 'bot.enc not found', 
        details: error.message 
      });
    }
  }

  // REST OF YOUR CODE (CORS + LICENSE VALIDATION)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const body = req.body || {};
  const { action, licenseKey, country, adminPassword, deviceId } = body;

  if (action === 'validate') {
    console.log(`[VALIDATE] License: ${licenseKey}, Country: ${country}, Device: ${deviceId}`);
    
    const check = await checkLicense(licenseKey, country, deviceId);
    
    if (check.valid) {
      return res.json({ 
        success: true, 
        message: check.firstActivation ? 'License activated and locked to this device!' : 'Welcome back!',
        email: check.email,
        expires: check.expires
      });
    } else {
      return res.status(403).json({ 
        success: false, 
        message: check.reason 
      });
    }
  }

  if (action === 'disableUser') {
    if (adminPassword !== ADMIN_PASSWORD) {
      return res.status(403).json({ success: false, error: 'Invalid admin password' });
    }
    
    try {
      await pool.query('UPDATE vfs_licenses SET active = false WHERE license_key = $1', [licenseKey]);
      console.log(`[ADMIN] ❌ DISABLED: ${licenseKey}`);
      return res.json({ success: true, message: `License ${licenseKey} has been DISABLED` });
    } catch (error) {
      return res.status(500).json({ success: false, error: 'Database error' });
    }
  }

  if (action === 'enableUser') {
    if (adminPassword !== ADMIN_PASSWORD) {
      return res.status(403).json({ success: false, error: 'Invalid admin password' });
    }
    
    try {
      await pool.query('UPDATE vfs_licenses SET active = true WHERE license_key = $1', [licenseKey]);
      console.log(`[ADMIN] ✅ ENABLED: ${licenseKey}`);
      return res.json({ success: true, message: `License ${licenseKey} has been enabled` });
    } catch (error) {
      return res.status(500).json({ success: false, error: 'Database error' });
    }
  }

  if (action === 'resetDevice') {
    if (adminPassword !== ADMIN_PASSWORD) {
      return res.status(403).json({ success: false, error: 'Invalid admin password' });
    }
    
    try {
      await pool.query('UPDATE vfs_licenses SET device_id = NULL WHERE license_key = $1', [licenseKey]);
      console.log(`[ADMIN] 🔄 RESET: ${licenseKey}`);
      return res.json({ success: true, message: `Device lock removed for ${licenseKey}` });
    } catch (error) {
      return res.status(500).json({ success: false, error: 'Database error' });
    }
  }

  if (action === 'addLicense') {
    if (adminPassword !== ADMIN_PASSWORD) {
      return res.status(403).json({ success: false, error: 'Invalid admin password' });
    }
    
    const { email, expires, country } = body;
    
    try {
      await pool.query(
        'INSERT INTO vfs_licenses (license_key, email, expires, country, active, device_id) VALUES ($1, $2, $3, $4, true, NULL)',
        [licenseKey, email, expires, country]
      );
      
      console.log(`[ADMIN] ➕ ADDED: ${licenseKey}`);
      return res.json({ success: true, message: `License ${licenseKey} created successfully` });
    } catch (error) {
      return res.status(500).json({ success: false, error: 'Database error: ' + error.message });
    }
  }

  return res.status(400).json({ success: false, error: 'Unknown action: ' + action });
}

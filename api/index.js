import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000
});

// Keep DB connection warm
pool.query('SELECT 1').catch(() => {});

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "ARABY";

// BUG FIX 3: No-cache headers so browsers never cache license results
function setHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
}

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
  setHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let body = req.body;
  if (!body || typeof body === 'string') {
    try { body = JSON.parse(body || '{}'); } catch { body = {}; }
  }
  if (typeof body !== 'object' || body === null) body = {};

  const { action, licenseKey, country, adminPassword, deviceId } = body;

  console.log(`[REQUEST] action=${action} | key=${licenseKey} | country=${country} | device=${deviceId}`);

  // VALIDATE
  if (action === 'validate') {
    const check = await checkLicense(licenseKey, country, deviceId);
    if (check.valid) {
      return res.json({
        success: true,
        message: check.firstActivation ? 'License activated and locked to this device!' : 'Welcome back!',
        email: check.email,
        expires: check.expires
      });
    } else {
      return res.status(403).json({ success: false, message: check.reason });
    }
  }

  // ADMIN PASSWORD CHECK for all admin actions
  const adminActions = ['disableUser','enableUser','resetDevice','extendExpiry','addLicense','listLicenses','searchLicense','stats'];
  if (adminActions.includes(action)) {
    if (adminPassword !== ADMIN_PASSWORD) {
      return res.status(403).json({ success: false, error: 'Invalid admin password' });
    }
  }

  // DISABLE
  if (action === 'disableUser') {
    try {
      await pool.query('UPDATE vfs_licenses SET active = false WHERE license_key = $1', [licenseKey]);
      console.log(`[ADMIN] DISABLED: ${licenseKey}`);
      return res.json({ success: true, message: `License ${licenseKey} has been DISABLED` });
    } catch (error) {
      return res.status(500).json({ success: false, error: 'Database error' });
    }
  }

  // ENABLE
  if (action === 'enableUser') {
    try {
      await pool.query('UPDATE vfs_licenses SET active = true WHERE license_key = $1', [licenseKey]);
      console.log(`[ADMIN] ENABLED: ${licenseKey}`);
      return res.json({ success: true, message: `License ${licenseKey} has been enabled` });
    } catch (error) {
      return res.status(500).json({ success: false, error: 'Database error' });
    }
  }

  // RESET DEVICE - BUG FIX 1: returns 404 if key not found, old device locked out immediately
  if (action === 'resetDevice') {
    try {
      const result = await pool.query(
        'UPDATE vfs_licenses SET device_id = NULL WHERE license_key = $1 RETURNING *',
        [licenseKey]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'License key not found' });
      }
      console.log(`[ADMIN] RESET DEVICE: ${licenseKey}`);
      return res.json({ success: true, message: `Device lock removed for ${licenseKey}. Next device to validate will be locked in.` });
    } catch (error) {
      return res.status(500).json({ success: false, error: 'Database error' });
    }
  }

  // EXTEND EXPIRY
  if (action === 'extendExpiry') {
    const { newExpires } = body;
    if (!newExpires) {
      return res.status(400).json({ success: false, error: 'New expiration date is required' });
    }
    try {
      const result = await pool.query(
        'UPDATE vfs_licenses SET expires = $1 WHERE license_key = $2 RETURNING *',
        [newExpires, licenseKey]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'License key not found' });
      }
      console.log(`[ADMIN] EXTENDED: ${licenseKey} to ${newExpires}`);
      return res.json({ success: true, message: `License ${licenseKey} expiration updated to ${newExpires}`, newExpires });
    } catch (error) {
      return res.status(500).json({ success: false, error: 'Database error: ' + error.message });
    }
  }

  // ADD LICENSE
  if (action === 'addLicense') {
    const { email, expires, country } = body;
    if (!licenseKey || !email || !expires || !country) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    try {
      await pool.query(
        'INSERT INTO vfs_licenses (license_key, email, expires, country, active, device_id) VALUES ($1, $2, $3, $4, true, NULL)',
        [licenseKey, email, expires, country]
      );
      console.log(`[ADMIN] ADDED: ${licenseKey}`);
      return res.json({ success: true, message: `License ${licenseKey} created successfully` });
    } catch (error) {
      return res.status(500).json({ success: false, error: 'Database error: ' + error.message });
    }
  }

  // LIST ALL LICENSES
  if (action === 'listLicenses') {
    try {
      const result = await pool.query(
        'SELECT license_key, email, expires, country, active, device_id, created_at FROM vfs_licenses ORDER BY created_at DESC'
      );
      return res.json({ success: true, licenses: result.rows });
    } catch (error) {
      return res.status(500).json({ success: false, error: 'Database error: ' + error.message });
    }
  }

  // SEARCH BY EMAIL OR KEY
  if (action === 'searchLicense') {
    const { query } = body;
    if (!query) {
      return res.status(400).json({ success: false, error: 'Search query is required' });
    }
    try {
      const result = await pool.query(
        `SELECT license_key, email, expires, country, active, device_id, created_at 
         FROM vfs_licenses 
         WHERE license_key ILIKE $1 OR email ILIKE $1
         ORDER BY created_at DESC LIMIT 20`,
        [`%${query}%`]
      );
      return res.json({ success: true, licenses: result.rows });
    } catch (error) {
      return res.status(500).json({ success: false, error: 'Database error: ' + error.message });
    }
  }

  // STATS
  if (action === 'stats') {
    try {
      const total        = await pool.query('SELECT COUNT(*) FROM vfs_licenses');
      const active       = await pool.query('SELECT COUNT(*) FROM vfs_licenses WHERE active = true');
      const disabled     = await pool.query('SELECT COUNT(*) FROM vfs_licenses WHERE active = false');
      const expired      = await pool.query("SELECT COUNT(*) FROM vfs_licenses WHERE expires < NOW()");
      const expiringSoon = await pool.query("SELECT COUNT(*) FROM vfs_licenses WHERE active = true AND expires BETWEEN NOW() AND NOW() + INTERVAL '7 days'");
      const byCountry    = await pool.query('SELECT country, COUNT(*) as count FROM vfs_licenses GROUP BY country ORDER BY count DESC');

      return res.json({
        success: true,
        stats: {
          total:        parseInt(total.rows[0].count),
          active:       parseInt(active.rows[0].count),
          disabled:     parseInt(disabled.rows[0].count),
          expired:      parseInt(expired.rows[0].count),
          expiringSoon: parseInt(expiringSoon.rows[0].count),
          byCountry:    byCountry.rows
        }
      });
    } catch (error) {
      return res.status(500).json({ success: false, error: 'Database error: ' + error.message });
    }
  }

  return res.status(400).json({ success: false, error: 'Unknown action: ' + action });
}

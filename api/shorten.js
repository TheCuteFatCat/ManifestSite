// api/shorten.js
const redis = require('./_redis');

module.exports = async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Nur POST-Anfragen erlaubt' });
    return;
  }

  try {
    const { magnet, slug } = req.body || {};
    
    if (!magnet || !slug) {
      res.status(400).json({ error: 'Magnet-Link und Slug sind erforderlich' });
      return;
    }

    // Validierung
    if (!magnet.startsWith('magnet:')) {
      res.status(400).json({ error: 'Ungültiger Magnet-Link' });
      return;
    }

    if (!/^[a-zA-Z0-9-_]+$/.test(slug)) {
      res.status(400).json({ error: 'Slug darf nur Buchstaben, Zahlen, Bindestriche und Unterstriche enthalten' });
      return;
    }

    if (slug.length > 50) {
      res.status(400).json({ error: 'Slug zu lang (max. 50 Zeichen)' });
      return;
    }

    // Prüfen, ob Slug bereits existiert
    const exists = await redis.get(`link:${slug}`);
    if (exists) {
      res.status(409).json({ error: 'Dieser Slug ist bereits vergeben' });
      return;
    }

    // Speichern mit Timestamp
    const data = {
      magnet,
      created: new Date().toISOString()
    };
    
    await redis.set(`link:${slug}`, JSON.stringify(data));
    
    res.status(200).json({ 
      success: true, 
      shortUrl: `${req.headers.host}/${slug}` 
    });
    
  } catch (error) {
    console.error('Redis error:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
}

// api/_redis.js
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export default redis;

// =========================================

// api/shorten.js
import redis from './_redis.js';

export default async function handler(req, res) {
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

// =========================================

// api/[slug].js
import redis from './_redis.js';

export default async function handler(req, res) {
  try {
    const { slug } = req.query;
    
    if (!slug) {
      res.status(400).send('Ungültiger Slug');
      return;
    }

    const data = await redis.get(`link:${slug}`);
    
    if (!data) {
      res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Link nicht gefunden</title>
          <style>
            body { font-family: sans-serif; text-align: center; margin-top: 100px; }
            h1 { color: #ff6b6b; }
            a { color: #4ecdc4; text-decoration: none; }
          </style>
        </head>
        <body>
          <h1>404 - Link nicht gefunden</h1>
          <p>Der angeforderte Kurz-Link existiert nicht.</p>
          <a href="/">← Zurück zur Startseite</a>
        </body>
        </html>
      `);
      return;
    }

    const linkData = JSON.parse(data);
    
    // Redirect auf Magnet-Link
    res.writeHead(302, { 
      Location: linkData.magnet,
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });
    res.end();
    
  } catch (error) {
    console.error('Redis error:', error);
    res.status(500).send('Interner Serverfehler');
  }
}
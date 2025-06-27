// api/[slug].js
const redis = require('./_redis');

module.exports = async function handler(req, res) {
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
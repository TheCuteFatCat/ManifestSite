const crypto = require('crypto');

// In-Memory Speicher (gleiche Instanz wie in shorten.js)
let linkDatabase = new Map();

// Funktion um Links zu rekonstruieren (für den Fall dass der Memory-Speicher leer ist)
function reconstructLink(shortId) {
    // Diese Funktion könnte erweitert werden um Links aus einer persistenten Quelle zu laden
    // Für jetzt returnieren wir null wenn der Link nicht gefunden wird
    return null;
}

export default function handler(req, res) {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }
    
    try {
        const { id } = req.query;
        
        if (!id) {
            return res.status(400).json({ 
                success: false, 
                error: 'Short ID ist erforderlich' 
            });
        }
        
        // Suche den Link in der Datenbank
        let linkData = linkDatabase.get(id);
        
        // Falls nicht gefunden, versuche zu rekonstruieren
        if (!linkData) {
            linkData = reconstructLink(id);
        }
        
        if (!linkData) {
            // Fallback HTML Seite für nicht gefundene Links
            const notFoundHtml = `
                <!DOCTYPE html>
                <html lang="de">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Link nicht gefunden - MagnetShort</title>
                    <style>
                        body {
                            background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
                            min-height: 100vh;
                            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                            color: #e2e8f0;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            margin: 0;
                        }
                        .container {
                            text-align: center;
                            background: rgba(255, 255, 255, 0.1);
                            backdrop-filter: blur(20px);
                            border: 1px solid rgba(255, 255, 255, 0.2);
                            border-radius: 20px;
                            padding: 3rem;
                            max-width: 500px;
                        }
                        h1 {
                            color: #f87171;
                            margin-bottom: 1rem;
                        }
                        a {
                            color: #667eea;
                            text-decoration: none;
                            background: rgba(102, 126, 234, 0.2);
                            padding: 0.5rem 1rem;
                            border-radius: 8px;
                            display: inline-block;
                            margin-top: 1rem;
                            transition: all 0.3s ease;
                        }
                        a:hover {
                            background: rgba(102, 126, 234, 0.3);
                            transform: translateY(-2px);
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>404 - Link nicht gefunden</h1>
                        <p>Der angeforderte kurze Link existiert nicht oder ist abgelaufen.</p>
                        <p>Möglicherweise wurde er falsch eingegeben oder ist nicht mehr gültig.</p>
                        <a href="/">Zurück zur Startseite</a>
                    </div>
                </body>
                </html>
            `;
            
            res.setHeader('Content-Type', 'text/html');
            return res.status(404).send(notFoundHtml);
        }
        
        // Aktualisiere Zugriffszähler
        linkData.accessCount = (linkData.accessCount || 0) + 1;
        linkData.lastAccessed = new Date().toISOString();
        
        // Speichere die aktualisierten Daten
        linkDatabase.set(id, linkData);
        
        // Erstelle Redirect-HTML Seite
        const redirectHtml = `
            <!DOCTYPE html>
            <html lang="de">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Weiterleitung - MagnetShort</title>
                <style>
                    body {
                        background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
                        min-height: 100vh;
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        color: #e2e8f0;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin: 0;
                    }
                    .container {
                        text-align: center;
                        background: rgba(255, 255, 255, 0.1);
                        backdrop-filter: blur(20px);
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        border-radius: 20px;
                        padding: 3rem;
                        max-width: 600px;
                    }
                    .spinner {
                        width: 50px;
                        height: 50px;
                        border: 4px solid rgba(255, 255, 255, 0.1);
                        border-top: 4px solid #667eea;
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                        margin: 0 auto 2rem;
                    }
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                    .manual-link {
                        background: rgba(255, 255, 255, 0.1);
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        border-radius: 10px;
                        padding: 1rem;
                        margin: 1rem 0;
                        word-break: break-all;
                        font-family: 'Courier New', monospace;
                        font-size: 0.9rem;
                    }
                    .btn {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        border: none;
                        border-radius: 8px;
                        color: white;
                        padding: 0.8rem 1.5rem;
                        cursor: pointer;
                        font-size: 1rem;
                        margin: 0.5rem;
                        transition: all 0.3s ease;
                    }
                    .btn:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="spinner"></div>
                    <h2>Weiterleitung zu deinem Magnet Link...</h2>
                    <p>Du wirst automatisch weitergeleitet. Falls nicht, klicke auf einen der Buttons unten:</p>
                    
                    <div class="manual-link">${linkData.magnetLink}</div>
                    
                    <button class="btn" onclick="openMagnetLink()">Magnet Link öffnen</button>
                    <button class="btn" onclick="copyMagnetLink()">Link kopieren</button>
                    
                    <script>
                        const magnetLink = ${JSON.stringify(linkData.magnetLink)};
                        
                        function openMagnetLink() {
                            window.location.href = magnetLink;
                        }
                        
                        function copyMagnetLink() {
                            navigator.clipboard.writeText(magnetLink).then(() => {
                                alert('Magnet Link wurde in die Zwischenablage kopiert!');
                            });
                        }
                        
                        // Automatische Weiterleitung nach 3 Sekunden
                        setTimeout(() => {
                            window.location.href = magnetLink;
                        }, 3000);
                        
                        // Sofortige Weiterleitung beim Laden versuchen
                        window.onload = function() {
                            setTimeout(() => {
                                window.location.href = magnetLink;
                            }, 1000);
                        };
                    </script>
                </div>
            </body>
            </html>
        `;
        
        res.setHeader('Content-Type', 'text/html');
        res.status(200).send(redirectHtml);
        
    } catch (error) {
        console.error('Redirect error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Server Fehler' 
        });
    }
}
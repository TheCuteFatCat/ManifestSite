const crypto = require('crypto');

// In-Memory Speicher (wird bei jedem Deployment zurückgesetzt, aber für Demo ausreichend)
let linkDatabase = new Map();

// Für Produktionsumgebung könntest du eine externe Datenbank verwenden
// oder die Links in einer JSON-Datei speichern

function generateShortId(magnetLink) {
    // Erstelle einen Hash vom Magnet Link für Konsistenz
    const hash = crypto.createHash('sha256').update(magnetLink).digest('hex');
    // Nimm die ersten 6 Zeichen für einen kurzen Code
    return hash.substring(0, 6);
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
    
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }
    
    try {
        const { magnetLink } = req.body;
        
        // Validierung
        if (!magnetLink || typeof magnetLink !== 'string') {
            return res.status(400).json({ 
                success: false, 
                error: 'Magnet Link ist erforderlich' 
            });
        }
        
        if (!magnetLink.startsWith('magnet:')) {
            return res.status(400).json({ 
                success: false, 
                error: 'Ungültiger Magnet Link' 
            });
        }
        
        // Generiere kurze ID
        const shortId = generateShortId(magnetLink);
        
        // Speichere in der Datenbank
        linkDatabase.set(shortId, {
            magnetLink: magnetLink,
            createdAt: new Date().toISOString(),
            accessCount: 0
        });
        
        // Erstelle kurze URL
        const protocol = req.headers['x-forwarded-proto'] || 'https';
        const host = req.headers.host;
        const shortUrl = `${protocol}://${host}/s/${shortId}`;
        
        res.status(200).json({
            success: true,
            shortUrl: shortUrl,
            shortId: shortId
        });
        
    } catch (error) {
        console.error('Shortening error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Server Fehler' 
        });
    }
}
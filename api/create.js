// api/create.js
export default async function handler(req, res) {
    // CORS Headers hinzufügen
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { magnetLink, customName } = req.body;

        console.log('Received data:', { magnetLink: magnetLink?.substring(0, 50) + '...', customName });

        if (!magnetLink || !customName) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (!magnetLink.startsWith('magnet:?')) {
            return res.status(400).json({ error: 'Invalid magnet link' });
        }

        if (!/^[a-zA-Z0-9_-]+$/.test(customName) || customName.length > 50) {
            return res.status(400).json({ error: 'Invalid custom name' });
        }

        const shortCode = customName.toLowerCase().replace(/[^a-z0-9_-]/g, '');

        // Temporärer In-Memory Storage (für Tests)
        // In Produktion solltest du eine echte Datenbank verwenden
        global.magnetLinks = global.magnetLinks || {};
        
        if (global.magnetLinks[shortCode]) {
            return res.status(409).json({ error: 'Short code already exists' });
        }

        // Link speichern
        global.magnetLinks[shortCode] = {
            magnetLink,
            customName,
            createdAt: new Date().toISOString(),
            clicks: 0
        };

        console.log('Link saved:', shortCode);

        return res.status(200).json({ 
            success: true, 
            shortCode,
            url: `${req.headers.host}/${shortCode}`
        });

    } catch (error) {
        console.error('Error in create API:', error);
        return res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
}
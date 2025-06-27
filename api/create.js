// api/create.js - Neuer Endpoint
import { kv } from '@vercel/kv';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { magnetLink, customName } = req.body;

    if (!magnetLink || !customName) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!magnetLink.startsWith('magnet:?')) {
        return res.status(400).json({ error: 'Invalid magnet link' });
    }

    const shortCode = customName.toLowerCase().replace(/[^a-z0-9_-]/g, '');

    try {
        // Prüfen ob Short Code bereits existiert
        const existing = await kv.get(`magnet_${shortCode}`);
        if (existing) {
            return res.status(409).json({ error: 'Short code already exists' });
        }

        // Link speichern
        await kv.set(`magnet_${shortCode}`, magnetLink);
        await kv.set(`meta_${shortCode}`, {
            customName,
            createdAt: new Date().toISOString(),
            clicks: 0
        });

        res.status(200).json({ 
            success: true, 
            shortCode,
            url: `${req.headers.host}/${shortCode}`
        });

    } catch (error) {
        console.error('Error creating link:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
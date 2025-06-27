// api/shorten.js - Vercel Serverless Function
export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method === 'POST') {
        const { magnetLink, shortCode } = req.body;

        // Validation
        if (!magnetLink || !magnetLink.startsWith('magnet:?') || !magnetLink.includes('xt=urn:btih:')) {
            return res.status(400).json({ error: 'Ungültiger Magnet-Link' });
        }

        // In a real implementation, you would use a database like:
        // - Vercel KV (Redis)
        // - PlanetScale (MySQL)
        // - Supabase (PostgreSQL)
        // - MongoDB Atlas

        // For demo purposes, we'll simulate database operations
        const finalShortCode = shortCode || generateShortCode();
        
        // Here you would save to your database
        // await db.collection('links').add({
        //     shortCode: finalShortCode,
        //     magnetLink: magnetLink,
        //     created: new Date(),
        //     clicks: 0
        // });

        const shortUrl = `${req.headers.host}/${finalShortCode}`;

        return res.status(200).json({
            success: true,
            shortUrl: shortUrl,
            shortCode: finalShortCode
        });
    }

    if (req.method === 'GET') {
        const { code } = req.query;
        
        if (!code) {
            return res.status(400).json({ error: 'Kein Code angegeben' });
        }

        // Here you would query your database
        // const link = await db.collection('links').where('shortCode', '==', code).get();
        
        // For demo, return error
        return res.status(404).json({ error: 'Link nicht gefunden' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
}

function generateShortCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
// api/[shortCode].js - Verbesserte Version
import { kv } from '@vercel/kv';

export default async function handler(req, res) {
    const { shortCode } = req.query;

    if (!shortCode) {
        return res.status(404).json({ error: 'Short code not found' });
    }

    try {
        // Magnet Link aus der Datenbank abrufen
        const magnetLink = await kv.get(`magnet_${shortCode}`);
        
        if (!magnetLink) {
            return res.status(404).send(getErrorHTML());
        }

        // Click-Counter erhöhen
        await kv.incr(`clicks_${shortCode}`);

        const html = getRedirectHTML(shortCode, magnetLink);
        res.setHeader('Content-Type', 'text/html');
        return res.status(200).send(html);

    } catch (error) {
        console.error('Error handling redirect:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

function getRedirectHTML(shortCode, magnetLink) {
    return `<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Magnet Link Redirect</title>
    <!-- Dein CSS hier -->
</head>
<body>
    <div class="container">
        <h1>🧲 Magnet Link Weiterleitung</h1>
        <div class="success">✅ Magnet Link gefunden!</div>
        <div class="countdown" id="countdown">Weiterleitung in 5 Sekunden...</div>
        <button class="btn" onclick="redirectNow()">Jetzt öffnen</button>
        <button class="btn btn-secondary" onclick="copyMagnetLink()">Link kopieren</button>
    </div>

    <script>
        const magnetLink = '${magnetLink.replace(/'/g, "\\'")}';
        
        let countdownSeconds = 5;
        const countdownElement = document.getElementById('countdown');
        
        const timer = setInterval(() => {
            countdownSeconds--;
            countdownElement.textContent = "Weiterleitung in " + countdownSeconds + " Sekunden...";
            
            if (countdownSeconds <= 0) {
                clearInterval(timer);
                window.location.href = magnetLink;
            }
        }, 1000);
        
        function redirectNow() {
            clearInterval(timer);
            window.location.href = magnetLink;
        }
        
        function copyMagnetLink() {
            navigator.clipboard.writeText(magnetLink).then(() => {
                alert('Magnet Link kopiert!');
            });
        }
    </script>
</body>
</html>`;
}
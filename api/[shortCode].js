// api/[shortCode].js
export default async function handler(req, res) {
    const { shortCode } = req.query;

    console.log('Looking for shortCode:', shortCode);

    if (!shortCode) {
        return res.status(404).json({ error: 'Short code not found' });
    }

    try {
        // In-Memory Storage abrufen (temporär)
        global.magnetLinks = global.magnetLinks || {};
        const linkData = global.magnetLinks[shortCode];

        console.log('Found linkData:', linkData ? 'yes' : 'no');

        let magnetLink = null;

        if (linkData) {
            magnetLink = linkData.magnetLink;
            // Click counter erhöhen
            global.magnetLinks[shortCode].clicks = (global.magnetLinks[shortCode].clicks || 0) + 1;
        } else {
            // Fallback: Aus URL Parameter lesen (für bestehende Links)
            const urlParams = new URLSearchParams(req.url.split('?')[1] || '');
            magnetLink = urlParams.get('magnet');
        }

        if (!magnetLink) {
            const html = getErrorHTML();
            res.setHeader('Content-Type', 'text/html');
            return res.status(404).send(html);
        }

        const html = getRedirectHTML(shortCode, magnetLink);
        res.setHeader('Content-Type', 'text/html');
        return res.status(200).send(html);

    } catch (error) {
        console.error('Error handling redirect:', error);
        const html = getErrorHTML();
        res.setHeader('Content-Type', 'text/html');
        return res.status(500).send(html);
    }
}

function getErrorHTML() {
    return `<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Link nicht gefunden</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #0d1117;
            color: #e6edf3;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            text-align: center;
        }
        .container {
            max-width: 500px;
            background-color: #161b22;
            border: 1px solid #30363d;
            border-radius: 12px;
            padding: 2rem;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }
        .error { color: #f85149; margin-bottom: 1rem; }
        .btn {
            background: linear-gradient(135deg, #238636, #2ea043);
            color: white;
            border: none;
            border-radius: 6px;
            padding: 0.75rem 1.5rem;
            font-size: 1rem;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            margin: 0.5rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="error">❌ Link nicht gefunden</div>
        <p>Möglicherweise ist der Link abgelaufen oder wurde gelöscht.</p>
        <a href="/" class="btn">Neuen Link erstellen</a>
    </div>
</body>
</html>`;
}

function getRedirectHTML(shortCode, magnetLink) {
    // Escape single quotes für JavaScript
    const escapedMagnetLink = magnetLink.replace(/'/g, "\\'").replace(/\\/g, "\\\\");
    
    return `<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Magnet Link Redirect</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #0d1117;
            color: #e6edf3;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            text-align: center;
        }
        .container {
            max-width: 500px;
            background-color: #161b22;
            border: 1px solid #30363d;
            border-radius: 12px;
            padding: 2rem;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }
        h1 { color: #58a6ff; margin-bottom: 1rem; }
        .success { color: #3fb950; margin: 1rem 0; }
        .countdown {
            font-size: 1.2rem;
            color: #58a6ff;
            margin: 1rem 0;
        }
        .btn {
            background: linear-gradient(135deg, #238636, #2ea043);
            color: white;
            border: none;
            border-radius: 6px;
            padding: 0.75rem 1.5rem;
            font-size: 1rem;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            margin: 0.5rem;
            transition: all 0.2s ease;
        }
        .btn:hover {
            background: linear-gradient(135deg, #2ea043, #238636);
        }
        .btn-secondary {
            background: #21262d;
            border: 1px solid #30363d;
            color: #e6edf3;
        }
        .btn-secondary:hover {
            background: #30363d;
        }
        .manual-link {
            background-color: #21262d;
            padding: 1rem;
            border-radius: 6px;
            border: 1px solid #30363d;
            margin: 1rem 0;
            word-break: break-all;
            font-family: 'Courier New', monospace;
            color: #58a6ff;
            cursor: pointer;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🧲 Magnet Link Weiterleitung</h1>
        
        <div class="success">✅ Magnet Link gefunden!</div>
        
        <div id="countdown-section">
            <div class="countdown" id="countdown">Weiterleitung in 5 Sekunden...</div>
            <button class="btn" onclick="redirectNow()">Jetzt öffnen</button>
            <button class="btn btn-secondary" onclick="copyMagnetLink()">Link kopieren</button>
        </div>
        
        <div id="manual-section" style="display: none;">
            <p>Klicken Sie auf den Link, um ihn zu öffnen:</p>
            <div class="manual-link" onclick="openMagnetLink()">${escapedMagnetLink}</div>
            <button class="btn" onclick="openMagnetLink()">🔗 Magnet Link öffnen</button>
            <button class="btn btn-secondary" onclick="copyMagnetLink()">📋 Link kopieren</button>
        </div>
    </div>

    <script>
        const magnetLink = '${escapedMagnetLink}';
        let countdownSeconds = 5;
        let countdownTimer = null;
        
        function startCountdown() {
            const countdownElement = document.getElementById('countdown');
            
            countdownTimer = setInterval(() => {
                countdownSeconds--;
                countdownElement.textContent = "Weiterleitung in " + countdownSeconds + " Sekunden...";
                
                if (countdownSeconds <= 0) {
                    clearInterval(countdownTimer);
                    redirectNow();
                }
            }, 1000);
        }
        
        function redirectNow() {
            if (countdownTimer) {
                clearInterval(countdownTimer);
            }
            
            try {
                window.location.href = magnetLink;
            } catch (error) {
                // Fallback to manual section
                document.getElementById('countdown-section').style.display = 'none';
                document.getElementById('manual-section').style.display = 'block';
            }
        }
        
        function openMagnetLink() {
            window.location.href = magnetLink;
        }
        
        function copyMagnetLink() {
            navigator.clipboard.writeText(magnetLink).then(() => {
                alert('Magnet Link kopiert!');
            }).catch(() => {
                // Fallback für ältere Browser
                const textArea = document.createElement('textarea');
                textArea.value = magnetLink;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                alert('Magnet Link kopiert!');
            });
        }
        
        // Mobile detection
        if (navigator.userAgent.includes('Mobile') || !window.chrome) {
            document.getElementById('countdown-section').style.display = 'none';
            document.getElementById('manual-section').style.display = 'block';
        } else {
            startCountdown();
        }
    </script>
</body>
</html>`;
}
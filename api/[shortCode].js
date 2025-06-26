// api/[shortCode].js
export default async function handler(req, res) {
    const { shortCode } = req.query;

    if (!shortCode) {
        return res.status(404).json({ error: 'Short code not found' });
    }

    try {
        const html = `
<!DOCTYPE html>
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
        h1 { 
            color: #58a6ff; 
            margin-bottom: 1rem; 
        }
        .spinner {
            border: 4px solid #30363d;
            border-top: 4px solid #58a6ff;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 1rem auto;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .error {
            color: #f85149;
            margin-top: 1rem;
        }
        .success {
            color: #3fb950;
            margin-top: 1rem;
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
        .countdown {
            font-size: 1.2rem;
            color: #58a6ff;
            margin: 1rem 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🧲 Magnet Link Weiterleitung</h1>
        
        <div id="loading">
            <div class="spinner"></div>
            <p>Suche nach dem Magnet Link...</p>
        </div>
        
        <div id="found" style="display: none;">
            <div class="success">✅ Magnet Link gefunden!</div>
            <div class="countdown" id="countdown">Weiterleitung in 5 Sekunden...</div>
            <button class="btn" onclick="redirectNow()">Jetzt öffnen</button>
            <button class="btn btn-secondary" onclick="copyMagnetLink()">Link kopieren</button>
        </div>
        
        <div id="manual" style="display: none;">
            <div class="success">✅ Magnet Link gefunden!</div>
            <p>Klicken Sie auf den Link, um ihn zu öffnen:</p>
            <div class="manual-link" id="magnetLinkDiv" onclick="openMagnetLink()"></div>
            <button class="btn" onclick="openMagnetLink()">🔗 Magnet Link öffnen</button>
            <button class="btn btn-secondary" onclick="copyMagnetLink()">📋 Link kopieren</button>
        </div>
        
        <div id="error" style="display: none;">
            <div class="error">❌ Link nicht gefunden</div>
            <p>Möglicherweise ist der Link abgelaufen oder wurde gelöscht.</p>
            <a href="/" class="btn">Neuen Link erstellen</a>
        </div>
    </div>

    <script>
        let magnetLinkFound = null;
        let countdownTimer = null;
        let countdownSeconds = 5;
        
        const shortCode = '${shortCode}';
        
        function searchForMagnetLink() {
            const magnetLink = localStorage.getItem('magnet_' + shortCode);
            
            if (magnetLink) {
                magnetLinkFound = magnetLink;
                showFoundState();
                return;
            }
            
            const urlParams = new URLSearchParams(window.location.search);
            const magnetParam = urlParams.get('magnet');
            
            if (magnetParam) {
                magnetLinkFound = decodeURIComponent(magnetParam);
                showFoundState();
                return;
            }
            
            setTimeout(() => {
                showErrorState();
            }, 3000);
        }
        
        function showFoundState() {
            document.getElementById('loading').style.display = 'none';
            
            if (navigator.userAgent.includes('Mobile') || !window.chrome) {
                document.getElementById('manual').style.display = 'block';
                document.getElementById('magnetLinkDiv').textContent = magnetLinkFound;
            } else {
                document.getElementById('found').style.display = 'block';
                startCountdown();
            }
        }
        
        function showErrorState() {
            document.getElementById('loading').style.display = 'none';
            document.getElementById('error').style.display = 'block';
        }
        
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
            
            incrementClickCounter();
            
            try {
                window.location.href = magnetLinkFound;
            } catch (error) {
                document.getElementById('found').style.display = 'none';
                document.getElementById('manual').style.display = 'block';
                document.getElementById('magnetLinkDiv').textContent = magnetLinkFound;
            }
        }
        
        function openMagnetLink() {
            incrementClickCounter();
            window.location.href = magnetLinkFound;
        }
        
        function copyMagnetLink() {
            navigator.clipboard.writeText(magnetLinkFound).then(() => {
                alert('Magnet Link kopiert!');
            }).catch(() => {
                const textArea = document.createElement('textarea');
                textArea.value = magnetLinkFound;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                alert('Magnet Link kopiert!');
            });
        }
        
        function incrementClickCounter() {
            try {
                const existingLinks = JSON.parse(localStorage.getItem('magnetLinks') || '{}');
                if (existingLinks[shortCode]) {
                    existingLinks[shortCode].clicks = (existingLinks[shortCode].clicks || 0) + 1;
                    localStorage.setItem('magnetLinks', JSON.stringify(existingLinks));
                }
            } catch (error) {
                // Ignore errors in click counting
            }
        }
        
        searchForMagnetLink();
    </script>
</body>
</html>`;

        res.setHeader('Content-Type', 'text/html');
        return res.status(200).send(html);

    } catch (error) {
        console.error('Error handling redirect:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
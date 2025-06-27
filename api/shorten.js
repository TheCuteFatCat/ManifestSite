// api/shorten.js
import redis from './_redis';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Nur POST erlaubt' });
    return;
  }
  const { magnet, slug } = req.body || {};
  if (!magnet || !slug) {
    res.status(400).json({ error: 'magnet und slug erforderlich' });
    return;
  }

  // Prüfen, ob slug schon existiert
  const exists = await redis.get(slug);
  if (exists) {
    res.status(409).json({ error: 'Slug bereits vergeben' });
    return;
  }

  // Speichern
  await redis.set(slug, magnet);
  res.status(200).json({ ok: true });
}

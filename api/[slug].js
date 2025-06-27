// api/[slug].js
import redis from './_redis';

export default async function handler(req, res) {
  const { slug } = req.query;
  const magnet = await redis.get(slug);
  if (!magnet) {
    res.status(404).send('Nicht gefunden');
    return;
  }
  // Redirect auf magnet:‑Link
  res.writeHead(302, { Location: magnet });
  res.end();
}

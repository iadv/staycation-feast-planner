import { put, list } from '@vercel/blob';

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

  if (!blobToken) {
    return res.status(200).json({
      success: false,
      isBlobAvailable: false,
      message: 'No BLOB_READ_WRITE_TOKEN environment variable configured on Vercel.'
    });
  }

  try {
    if (req.method === 'GET') {
      // Find the existing staycation_dishes.json blob
      const { blobs } = await list({ prefix: 'staycation_dishes.json' });
      const existingBlob = blobs.find((b) => b.pathname === 'staycation_dishes.json');

      if (!existingBlob) {
        return res.status(200).json({
          success: true,
          isBlobAvailable: true,
          dishes: null,
          message: 'No dishes blob found yet.'
        });
      }

      // Fetch the raw JSON content from Vercel Blob CDN
      const response = await fetch(`${existingBlob.url}?t=${Date.now()}`, {
        cache: 'no-store'
      });
      const dishes = await response.json();

      return res.status(200).json({
        success: true,
        isBlobAvailable: true,
        dishes: Array.isArray(dishes) ? dishes : [],
        updatedAt: existingBlob.uploadedAt
      });
    }

    if (req.method === 'POST') {
      const { dishes } = req.body || {};

      if (!Array.isArray(dishes)) {
        return res.status(400).json({ error: 'dishes array is required' });
      }

      // Overwrite / save staycation_dishes.json in Vercel Blob
      const blob = await put('staycation_dishes.json', JSON.stringify(dishes, null, 2), {
        access: 'public',
        addRandomSuffix: false
      });

      return res.status(200).json({
        success: true,
        isBlobAvailable: true,
        url: blob.url
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Vercel Blob dishes endpoint error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}

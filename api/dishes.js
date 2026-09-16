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

  // Check standard token name or Vercel store-specific token name
  const blobToken =
    process.env.BLOB_READ_WRITE_TOKEN ||
    process.env.staycation_feast_planner_blob_READ_WRITE_TOKEN ||
    process.env.STAYCATION_FEAST_PLANNER_BLOB_READ_WRITE_TOKEN;

  if (!blobToken) {
    return res.status(200).json({
      success: false,
      isBlobAvailable: false,
      message: 'No BLOB_READ_WRITE_TOKEN found in Vercel environment variables.'
    });
  }

  try {
    if (req.method === 'GET') {
      const { blobs } = await list({ token: blobToken });
      const existingBlob = blobs.find((b) => b.pathname.includes('staycation_dishes.json'));

      if (!existingBlob) {
        return res.status(200).json({
          success: true,
          isBlobAvailable: true,
          dishes: null,
          message: 'No dishes blob found in storage yet.'
        });
      }

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

      const blob = await put('staycation_dishes.json', JSON.stringify(dishes, null, 2), {
        access: 'public',
        addRandomSuffix: false,
        token: blobToken
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
    return res.status(200).json({
      success: false,
      isBlobAvailable: false,
      message: `Vercel Blob operation failed: ${err.message}`
    });
  }
}

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

  // Debug keys present in process.env
  const blobEnvKeys = Object.keys(process.env).filter(
    (k) => k.toLowerCase().includes('blob') || k.toLowerCase().includes('token')
  );

  if (!blobToken) {
    return res.status(200).json({
      success: false,
      isBlobAvailable: false,
      message: `BLOB_READ_WRITE_TOKEN missing in server environment. Environment keys found: [${blobEnvKeys.join(', ')}]`
    });
  }

  try {
    if (req.method === 'GET') {
      const { blobs } = await list({ token: blobToken });
      const matchingBlobs = blobs.filter((b) => b.pathname.includes('staycation_dishes.json'));

      if (!matchingBlobs || matchingBlobs.length === 0) {
        return res.status(200).json({
          success: true,
          isBlobAvailable: true,
          dishes: null,
          message: 'No dishes blob found in storage yet.'
        });
      }

      // Sort matching blobs by uploadedAt descending (newest first)
      matchingBlobs.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
      const latestBlob = matchingBlobs[0];

      // Support reading both public & private blobs with authorization header
      const headers = {
        authorization: `Bearer ${blobToken}`
      };

      const response = await fetch(`${latestBlob.url}?t=${Date.now()}`, {
        headers,
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch blob contents: HTTP ${response.status}`);
      }

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

      let blob;
      try {
        // Try public access first
        blob = await put('staycation_dishes.json', JSON.stringify(dishes, null, 2), {
          access: 'public',
          addRandomSuffix: false,
          token: blobToken
        });
      } catch (putErr) {
        if (putErr.message && putErr.message.toLowerCase().includes('private')) {
          // If store is configured as private, fallback to private access
          blob = await put('staycation_dishes.json', JSON.stringify(dishes, null, 2), {
            access: 'private',
            addRandomSuffix: false,
            token: blobToken
          });
        } else {
          throw putErr;
        }
      }

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

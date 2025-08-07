// backend/api/media.js
import { uploadMedia, deleteMedia, listMediaInFolder, getMediaUrl } from '../lib/r2.js';
import { fetchInstagramData } from '../lib/instagram.js';

export default async function handler(req, res) {
  // 設定 CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    switch (req.method) {
      case 'GET': {
        const { folderId } = req.query;
        if (!folderId) {
          return res.status(400).json({ error: 'folderId is required' });
        }
        const media = await listMediaInFolder(folderId);
        return res.status(200).json({ media });
      }

      case 'POST': {
        const { url, folderId } = req.body || {};
        
        if (!url || !folderId) {
          return res.status(400).json({ 
            error: 'URL and folderId are required' 
          });
        }

        try {
          // 獲取 Instagram 資料
          console.log('Fetching Instagram data for:', url);
          const igData = await fetchInstagramData(url);
          
          if (!igData.videoUrl && !igData.imageUrl) {
            return res.status(400).json({ 
              error: 'No media found in the Instagram post' 
            });
          }

          // 準備媒體資料
          const mediaData = {
            url: url,
            type: igData.videoUrl ? 'video' : 'image',
            mediaUrl: igData.videoUrl || igData.imageUrl,
            thumbnailUrl: igData.thumbnailUrl || igData.imageUrl,
            caption: igData.caption || '',
            username: igData.username || '',
            timestamp: new Date().toISOString()
          };

          // 上傳到 R2
          const uploadedMedia = await uploadMedia(folderId, mediaData);
          
          return res.status(201).json({ 
            media: uploadedMedia,
            success: true 
          });
        } catch (error) {
          console.error('Media processing error:', error);
          return res.status(500).json({ 
            error: 'Failed to process media',
            message: error.message 
          });
        }
      }

      case 'DELETE': {
        const { folderId, mediaId } = req.query;
        
        if (!folderId || !mediaId) {
          return res.status(400).json({ 
            error: 'folderId and mediaId are required' 
          });
        }

        try {
          await deleteMedia(folderId, mediaId);
          return res.status(200).json({ success: true });
        } catch (error) {
          console.error('Delete media error:', error);
          return res.status(500).json({ 
            error: 'Failed to delete media',
            message: error.message 
          });
        }
      }

      default:
        return res.status(405).json({ 
          error: `Method ${req.method} not allowed` 
        });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
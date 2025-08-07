// backend/api/embed.js
import { getEmbedData } from '../lib/r2.js';

export default async function handler(req, res) {
  // 設定 CORS - 允許嵌入到任何網站
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ 
      error: `Method ${req.method} not allowed` 
    });
  }

  try {
    const { folderId } = req.query;
    
    if (!folderId) {
      return res.status(400).json({ 
        error: 'folderId is required' 
      });
    }

    // 獲取資料夾的嵌入資料
    const embedData = await getEmbedData(folderId);
    
    if (!embedData) {
      return res.status(404).json({ 
        error: 'Folder not found' 
      });
    }

    // 返回嵌入所需的資料
    return res.status(200).json({
      folderId: embedData.folderId,
      displayName: embedData.displayName,
      media: embedData.media.map(item => ({
        id: item.id,
        type: item.type,
        mediaUrl: item.mediaUrl,
        thumbnailUrl: item.thumbnailUrl,
        caption: item.caption,
        username: item.username,
        originalUrl: item.url,
        timestamp: item.timestamp
      })),
      totalItems: embedData.media.length,
      lastUpdated: embedData.lastUpdated || new Date().toISOString()
    });
  } catch (error) {
    console.error('Embed API Error:', error);
    
    // 如果是找不到資料夾的錯誤
    if (error.message && error.message.includes('not found')) {
      return res.status(404).json({ 
        error: 'Folder not found',
        message: error.message 
      });
    }
    
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
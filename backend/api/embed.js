// backend/api/embed.js
import { R2Service } from '../lib/r2.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // 設置快取
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const { folderId } = req.query;
  
  if (!folderId) {
    return res.status(400).json({ error: '需要資料夾 ID' });
  }
  
  try {
    // 並行獲取資料夾和媒體資料
    const [folder, mediaList] = await Promise.all([
      R2Service.getFolder(folderId),
      R2Service.getMedia(folderId)
    ]);
    
    if (!folder) {
      return res.status(404).json({ error: '資料夾不存在' });
    }
    
    // 記錄瀏覽次數（可選）
    if (folder.views !== undefined) {
      folder.views = (folder.views || 0) + 1;
      // 異步更新，不影響響應速度
      R2Service.saveFolder(folderId, folder).catch(console.error);
    }
    
    return res.json({
      folder,
      mediaList: mediaList || [],
      settings: folder.settings || {}
    });
  } catch (error) {
    console.error('Embed API error:', error);
    res.status(500).json({ error: '載入失敗' });
  }
}
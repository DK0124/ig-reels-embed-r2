// backend/api/media.js
import { R2Service } from '../lib/r2.js';
import { InstagramService } from '../lib/instagram.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const { folderId } = req.query;
  
  if (!folderId) {
    return res.status(400).json({ error: '需要資料夾 ID' });
  }
  
  try {
    switch (req.method) {
      case 'GET':
        // 獲取媒體列表
        const mediaList = await R2Service.getMedia(folderId);
        return res.json({ mediaList });
        
      case 'POST':
        // 添加媒體
        const { urls, mediaData } = req.body;
        
        let newMedia = [];
        
        if (urls && Array.isArray(urls)) {
          // 從 Instagram URLs 獲取媒體
          newMedia = await InstagramService.getMultipleMedia(urls);
        } else if (mediaData) {
          // 直接添加媒體資料
          newMedia = Array.isArray(mediaData) ? mediaData : [mediaData];
        } else {
          return res.status(400).json({ error: '需要提供 urls 或 mediaData' });
        }
        
        // 獲取現有媒體
        const currentMedia = await R2Service.getMedia(folderId);
        
        // 合併並去重
        const mediaMap = new Map();
        [...currentMedia, ...newMedia].forEach(media => {
          mediaMap.set(media.mediaId || media.url, media);
        });
        
        const updatedMedia = Array.from(mediaMap.values());
        
        // 保存更新後的媒體列表
        await R2Service.saveMedia(folderId, updatedMedia);
        
        // 更新資料夾的媒體數量
        const folder = await R2Service.getFolder(folderId);
        if (folder) {
          folder.mediaCount = updatedMedia.length;
          folder.updatedAt = new Date().toISOString();
          await R2Service.saveFolder(folderId, folder);
        }
        
        return res.json({ 
          success: true, 
          added: newMedia.length,
          total: updatedMedia.length 
        });
        
      case 'PUT':
        // 更新媒體資訊
        const { mediaId } = req.query;
        const updateInfo = req.body;
        
        const media = await R2Service.getMedia(folderId);
        const index = media.findIndex(m => m.mediaId === mediaId);
        
        if (index === -1) {
          return res.status(404).json({ error: '媒體不存在' });
        }
        
        media[index] = { ...media[index], ...updateInfo };
        await R2Service.saveMedia(folderId, media);
        
        return res.json({ success: true, media: media[index] });
        
      case 'DELETE':
        // 刪除媒體
        const { mediaIds } = req.body;
        const deleteIds = Array.isArray(mediaIds) ? mediaIds : [mediaIds];
        
        const currentMediaList = await R2Service.getMedia(folderId);
        const filteredMedia = currentMediaList.filter(
          m => !deleteIds.includes(m.mediaId)
        );
        
        await R2Service.saveMedia(folderId, filteredMedia);
        
        // 更新資料夾媒體數量
        const folderInfo = await R2Service.getFolder(folderId);
        if (folderInfo) {
          folderInfo.mediaCount = filteredMedia.length;
          folderInfo.updatedAt = new Date().toISOString();
          await R2Service.saveFolder(folderId, folderInfo);
        }
        
        return res.json({ success: true, remaining: filteredMedia.length });
        
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Media API error:', error);
    res.status(500).json({ error: error.message });
  }
}
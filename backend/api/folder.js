// backend/api/folder.js
import { R2Service } from '../lib/r2.js';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    switch (req.method) {
      case 'GET':
        // 獲取所有資料夾
        const folders = await R2Service.getAllFolders();
        return res.json({ folders });
        
      case 'POST':
        // 創建新資料夾
        const { name, settings = {} } = req.body;
        
        if (!name) {
          return res.status(400).json({ error: '資料夾名稱必填' });
        }
        
        const folderId = uuidv4();
        const folderData = {
          id: folderId,
          name,
          settings: {
            layout: 'grid',
            columns: 3,
            mobileColumns: 2,
            spacing: 10,
            showOverlay: true,
            clickAction: 'lightbox',
            autoplay: false,
            autoplaySpeed: 3000,
            ...settings
          },
          createdAt: new Date().toISOString(),
          mediaCount: 0
        };
        
        await R2Service.saveFolder(folderId, folderData);
        await R2Service.saveMedia(folderId, []); // 初始化空媒體列表
        
        return res.json({ folder: folderData });
        
      case 'PUT':
        // 更新資料夾設定
        const { folderId } = req.query;
        const updateData = req.body;
        
        const folder = await R2Service.getFolder(folderId);
        if (!folder) {
          return res.status(404).json({ error: '資料夾不存在' });
        }
        
        const updatedFolder = {
          ...folder,
          ...updateData,
          settings: { ...folder.settings, ...(updateData.settings || {}) },
          updatedAt: new Date().toISOString()
        };
        
        await R2Service.saveFolder(folderId, updatedFolder);
        
        return res.json({ folder: updatedFolder });
        
      case 'DELETE':
        // 刪除資料夾
        const { folderId: deleteId } = req.query;
        
        await R2Service.deleteObject(`folders/${deleteId}/config.json`);
        await R2Service.deleteObject(`folders/${deleteId}/media.json`);
        
        return res.json({ success: true });
        
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Folder API error:', error);
    res.status(500).json({ error: error.message });
  }
}
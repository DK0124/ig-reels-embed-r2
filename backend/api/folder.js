// backend/api/folder.js
import { listFolders, createFolder, deleteFolder } from '../lib/r2.js';

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
        const folders = await listFolders();
        return res.status(200).json({ folders });
      }

      case 'POST': {
        const { name, displayName } = req.body || {};
        if (!name || !displayName) {
          return res.status(400).json({ error: 'Name and displayName are required' });
        }
        const folder = await createFolder(name, displayName);
        return res.status(201).json({ folder });
      }

      case 'DELETE': {
        const { folderId } = req.query;
        if (!folderId) {
          return res.status(400).json({ error: 'folderId is required' });
        }
        await deleteFolder(folderId);
        return res.status(200).json({ success: true });
      }

      default:
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
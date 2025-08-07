// backend/lib/r2.js
import { S3Client, GetObjectCommand, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY
  }
});

export class R2Service {
  // 獲取物件
  static async getObject(key) {
    try {
      const command = new GetObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key
      });
      
      const response = await r2Client.send(command);
      const text = await response.Body.transformToString();
      return JSON.parse(text);
    } catch (error) {
      if (error.name === 'NoSuchKey') {
        return null;
      }
      throw error;
    }
  }
  
  // 儲存物件
  static async putObject(key, data) {
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: JSON.stringify(data),
      ContentType: 'application/json'
    });
    
    await r2Client.send(command);
  }
  
  // 刪除物件
  static async deleteObject(key) {
    const command = new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key
    });
    
    await r2Client.send(command);
  }
  
  // 列出物件
  static async listObjects(prefix) {
    const command = new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      Prefix: prefix
    });
    
    const response = await r2Client.send(command);
    return response.Contents || [];
  }
  
  // 資料夾操作
  static async getFolder(folderId) {
    return this.getObject(`folders/${folderId}/config.json`);
  }
  
  static async saveFolder(folderId, data) {
    await this.putObject(`folders/${folderId}/config.json`, data);
  }
  
  static async getMedia(folderId) {
    return this.getObject(`folders/${folderId}/media.json`) || [];
  }
  
  static async saveMedia(folderId, mediaList) {
    await this.putObject(`folders/${folderId}/media.json`, mediaList);
  }
  
  static async getAllFolders() {
    const objects = await this.listObjects('folders/');
    const folderIds = new Set();
    
    objects.forEach(obj => {
      const match = obj.Key.match(/folders\/([^\/]+)\//);
      if (match) {
        folderIds.add(match[1]);
      }
    });
    
    const folders = [];
    for (const folderId of folderIds) {
      const config = await this.getFolder(folderId);
      if (config) {
        folders.push(config);
      }
    }
    
    return folders;
  }
}
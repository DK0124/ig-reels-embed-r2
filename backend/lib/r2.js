// backend/lib/r2.js
import { S3Client, ListObjectsV2Command, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

// 驗證環境變數
const requiredEnvVars = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME'];
for (const varName of requiredEnvVars) {
  if (!process.env[varName]) {
    console.error(`Missing environment variable: ${varName}`);
    throw new Error(`Missing required environment variable: ${varName}`);
  }
}

// R2 配置
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;

// S3 客戶端配置
const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

// 列出所有資料夾
export async function listFolders() {
  console.log('開始列出資料夾...');
  try {
    const command = new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      Prefix: 'folders/',
      Delimiter: '/'
    });

    const response = await s3Client.send(command);
    console.log('R2 回應:', response);
    
    const folders = [];

    // 檢查 CommonPrefixes（子資料夾）
    if (response.CommonPrefixes) {
      console.log('找到 CommonPrefixes:', response.CommonPrefixes.length);
      for (const prefix of response.CommonPrefixes) {
        const folderPath = prefix.Prefix;
        const folderId = folderPath.replace('folders/', '').replace('/', '');
        
        try {
          // 讀取元資料
          const getCommand = new GetObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: `folders/${folderId}/metadata.json`
          });
          const getResponse = await s3Client.send(getCommand);
          const metadata = JSON.parse(await getResponse.Body.transformToString());
          folders.push(metadata);
        } catch (error) {
          console.error(`讀取 ${folderId} 元資料失敗:`, error);
        }
      }
    }

    // 也檢查 Contents
    if (response.Contents) {
      console.log('找到 Contents:', response.Contents.length);
      for (const item of response.Contents) {
        if (item.Key.endsWith('/metadata.json')) {
          try {
            const getCommand = new GetObjectCommand({
              Bucket: R2_BUCKET_NAME,
              Key: item.Key
            });
            const getResponse = await s3Client.send(getCommand);
            const metadata = JSON.parse(await getResponse.Body.transformToString());
            
            // 避免重複
            if (!folders.find(f => f.folderId === metadata.folderId)) {
              folders.push(metadata);
            }
          } catch (error) {
            console.error(`讀取元資料失敗 ${item.Key}:`, error);
          }
        }
      }
    }

    console.log(`總共找到 ${folders.length} 個資料夾`);
    return folders;
  } catch (error) {
    console.error('列出資料夾錯誤:', error);
    throw error;
  }
}

// 創建資料夾
export async function createFolder(name, displayName) {
  const folderId = `${name}-${uuidv4().slice(0, 8)}`;
  const metadata = {
    folderId,
    name,
    displayName,
    createdAt: new Date().toISOString(),
    mediaCount: 0
  };

  try {
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: `folders/${folderId}/metadata.json`,
      Body: JSON.stringify(metadata),
      ContentType: 'application/json'
    });

    await s3Client.send(command);
    return metadata;
  } catch (error) {
    console.error('Error creating folder:', error);
    throw error;
  }
}

// 刪除資料夾
export async function deleteFolder(folderId) {
  try {
    // 列出資料夾中的所有物件
    const listCommand = new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      Prefix: `folders/${folderId}/`
    });

    const listResponse = await s3Client.send(listCommand);

    if (listResponse.Contents) {
      // 刪除所有物件
      for (const item of listResponse.Contents) {
        const deleteCommand = new DeleteObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: item.Key
        });
        await s3Client.send(deleteCommand);
      }
    }

    return true;
  } catch (error) {
    console.error('Error deleting folder:', error);
    throw error;
  }
}

// 上傳媒體
export async function uploadMedia(folderId, mediaData) {
  const mediaId = uuidv4();
  const media = {
    id: mediaId,
    ...mediaData,
    uploadedAt: new Date().toISOString()
  };

  try {
    // 保存媒體元資料
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: `folders/${folderId}/media/${mediaId}.json`,
      Body: JSON.stringify(media),
      ContentType: 'application/json'
    });

    await s3Client.send(command);

    // 更新資料夾的媒體計數
    await updateFolderMediaCount(folderId);

    return media;
  } catch (error) {
    console.error('Error uploading media:', error);
    throw error;
  }
}

// 刪除媒體
export async function deleteMedia(folderId, mediaId) {
  try {
    const command = new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: `folders/${folderId}/media/${mediaId}.json`
    });

    await s3Client.send(command);
    await updateFolderMediaCount(folderId);
    
    return true;
  } catch (error) {
    console.error('Error deleting media:', error);
    throw error;
  }
}

// 列出資料夾中的媒體
export async function listMediaInFolder(folderId) {
  try {
    const command = new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      Prefix: `folders/${folderId}/media/`
    });

    const response = await s3Client.send(command);
    const mediaList = [];

    if (response.Contents) {
      for (const item of response.Contents) {
        if (item.Key.endsWith('.json')) {
          try {
            const getCommand = new GetObjectCommand({
              Bucket: R2_BUCKET_NAME,
              Key: item.Key
            });
            const getResponse = await s3Client.send(getCommand);
            const media = JSON.parse(await getResponse.Body.transformToString());
            mediaList.push(media);
          } catch (error) {
            console.error(`Error reading media ${item.Key}:`, error);
          }
        }
      }
    }

    // 按上傳時間排序（最新的在前）
    mediaList.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

    return mediaList;
  } catch (error) {
    console.error('Error listing media:', error);
    throw error;
  }
}

// 獲取媒體 URL
export async function getMediaUrl(folderId, mediaId) {
  try {
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: `folders/${folderId}/media/${mediaId}.json`
    });

    const response = await s3Client.send(command);
    const media = JSON.parse(await response.Body.transformToString());
    
    return media;
  } catch (error) {
    console.error('Error getting media URL:', error);
    throw error;
  }
}

// 獲取嵌入資料
export async function getEmbedData(folderId) {
  try {
    // 獲取資料夾元資料
    const metadataCommand = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: `folders/${folderId}/metadata.json`
    });

    const metadataResponse = await s3Client.send(metadataCommand);
    const metadata = JSON.parse(await metadataResponse.Body.transformToString());

    // 獲取媒體列表
    const media = await listMediaInFolder(folderId);

    return {
      ...metadata,
      media,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting embed data:', error);
    throw error;
  }
}

// 更新資料夾的媒體計數
async function updateFolderMediaCount(folderId) {
  try {
    // 獲取當前元資料
    const getCommand = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: `folders/${folderId}/metadata.json`
    });

    const getResponse = await s3Client.send(getCommand);
    const metadata = JSON.parse(await getResponse.Body.transformToString());

    // 計算媒體數量
    const media = await listMediaInFolder(folderId);
    metadata.mediaCount = media.length;
    metadata.lastUpdated = new Date().toISOString();

    // 更新元資料
    const putCommand = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: `folders/${folderId}/metadata.json`,
      Body: JSON.stringify(metadata),
      ContentType: 'application/json'
    });

    await s3Client.send(putCommand);
  } catch (error) {
    console.error('Error updating folder media count:', error);
  }
}

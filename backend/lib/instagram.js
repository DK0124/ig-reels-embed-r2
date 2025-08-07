// backend/lib/instagram.js
import axios from 'axios';

// 從 Instagram URL 提取資訊
function parseInstagramUrl(url) {
  const patterns = [
    /instagram\.com\/p\/([A-Za-z0-9_-]+)/,
    /instagram\.com\/reel\/([A-Za-z0-9_-]+)/,
    /instagram\.com\/reels\/([A-Za-z0-9_-]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return {
        shortcode: match[1],
        type: url.includes('/reel') ? 'reel' : 'post'
      };
    }
  }

  throw new Error('Invalid Instagram URL');
}

// 使用 oEmbed API 獲取 Instagram 資料
export async function fetchInstagramData(url) {
  try {
    const { shortcode, type } = parseInstagramUrl(url);
    
    // 使用 Instagram oEmbed API
    const oembedUrl = `https://graph.facebook.com/v8.0/instagram_oembed?url=${encodeURIComponent(url)}&access_token=YOUR_ACCESS_TOKEN`;
    
    // 如果沒有 Facebook access token，使用基本方法
    try {
      // 嘗試使用公開的 oEmbed endpoint
      const response = await axios.get(`https://api.instagram.com/oembed?url=${encodeURIComponent(url)}`);
      
      return {
        url: url,
        shortcode: shortcode,
        type: type,
        embedHtml: response.data.html,
        thumbnailUrl: response.data.thumbnail_url,
        title: response.data.title || '',
        authorName: response.data.author_name || '',
        authorUrl: response.data.author_url || '',
        width: response.data.width || 658,
        height: response.data.height || null,
        mediaId: response.data.media_id || shortcode,
        version: response.data.version || '1.0'
      };
    } catch (error) {
      console.log('oEmbed API failed, using fallback method');
      
      // 後備方案：返回基本嵌入資訊
      return {
        url: url,
        shortcode: shortcode,
        type: type,
        embedHtml: `<blockquote class="instagram-media" data-instgrm-captioned data-instgrm-permalink="${url}" data-instgrm-version="14"></blockquote>`,
        thumbnailUrl: null,
        title: '',
        authorName: '',
        authorUrl: '',
        width: 658,
        height: null,
        mediaId: shortcode,
        version: '1.0'
      };
    }
  } catch (error) {
    console.error('Error fetching Instagram data:', error);
    throw error;
  }
}

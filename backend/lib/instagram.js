// backend/lib/instagram.js
import axios from 'axios';

// 從 Instagram URL 提取 shortcode
function extractShortcode(url) {
  const patterns = [
    /instagram\.com\/p\/([A-Za-z0-9_-]+)/,
    /instagram\.com\/reel\/([A-Za-z0-9_-]+)/,
    /instagram\.com\/reels\/([A-Za-z0-9_-]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  throw new Error('Invalid Instagram URL');
}

// 獲取 Instagram 資料
export async function fetchInstagramData(url) {
  try {
    const shortcode = extractShortcode(url);
    
    // 使用 RapidAPI 的 Instagram 資料 API
    // 注意：這需要你有 RapidAPI 的 key
    // 你也可以使用其他 Instagram 資料提取服務
    
    // 方法 1: 使用公開的嵌入端點（基本資訊）
    try {
      const embedUrl = `https://api.instagram.com/oembed?url=${encodeURIComponent(url)}`;
      const response = await axios.get(embedUrl);
      
      return {
        videoUrl: null, // 嵌入端點不提供影片 URL
        imageUrl: response.data.thumbnail_url,
        thumbnailUrl: response.data.thumbnail_url,
        caption: response.data.title || '',
        username: response.data.author_name || '',
        shortcode: shortcode
      };
    } catch (embedError) {
      console.error('Instagram embed API error:', embedError);
    }

    // 方法 2: 使用網頁抓取（備用方案）
    // 注意：這個方法可能會被 Instagram 阻擋
    const pageUrl = `https://www.instagram.com/p/${shortcode}/`;
    const pageResponse = await axios.get(pageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const html = pageResponse.data;
    
    // 嘗試從 HTML 中提取資料
    const videoMatch = html.match(/"video_url":"([^"]+)"/);
    const imageMatch = html.match(/"display_url":"([^"]+)"/);
    const captionMatch = html.match(/"edge_media_to_caption":\{"edges":\[{"node":{"text":"([^"]+)"/);
    const usernameMatch = html.match(/"username":"([^"]+)"/);

    return {
      videoUrl: videoMatch ? videoMatch[1].replace(/\\u0026/g, '&') : null,
      imageUrl: imageMatch ? imageMatch[1].replace(/\\u0026/g, '&') : null,
      thumbnailUrl: imageMatch ? imageMatch[1].replace(/\\u0026/g, '&') : null,
      caption: captionMatch ? captionMatch[1] : '',
      username: usernameMatch ? usernameMatch[1] : '',
      shortcode: shortcode
    };
  } catch (error) {
    console.error('Error fetching Instagram data:', error);
    
    // 如果所有方法都失敗，返回基本資料
    return {
      videoUrl: null,
      imageUrl: null,
      thumbnailUrl: null,
      caption: '',
      username: '',
      shortcode: extractShortcode(url)
    };
  }
}

// 簡化版本 - 只保存 URL，不抓取實際媒體
export async function getInstagramInfo(url) {
  try {
    const shortcode = extractShortcode(url);
    
    // 使用 Instagram 的公開 oEmbed API
    const embedUrl = `https://api.instagram.com/oembed?url=${encodeURIComponent(url)}`;
    
    try {
      const response = await axios.get(embedUrl);
      
      return {
        url: url,
        type: 'instagram',
        mediaUrl: url, // 直接使用原始 URL
        thumbnailUrl: response.data.thumbnail_url,
        caption: response.data.title || '',
        username: response.data.author_name || '',
        shortcode: shortcode,
        embedHtml: response.data.html
      };
    } catch (error) {
      // 如果 oEmbed 失敗，返回基本資訊
      return {
        url: url,
        type: 'instagram',
        mediaUrl: url,
        thumbnailUrl: `https://www.instagram.com/p/${shortcode}/media/?size=l`,
        caption: '',
        username: '',
        shortcode: shortcode,
        embedHtml: null
      };
    }
  } catch (error) {
    console.error('Error getting Instagram info:', error);
    throw error;
  }
}
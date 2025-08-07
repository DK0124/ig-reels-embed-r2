// backend/lib/instagram.js
import axios from 'axios';

export class InstagramService {
  // 使用多個方法獲取媒體資訊
  static async getMediaInfo(url) {
    // 方法1: 嘗試使用 oEmbed
    try {
      return await this.getOEmbedInfo(url);
    } catch (error) {
      console.log('oEmbed failed, trying alternative method');
    }
    
    // 方法2: 使用基本資訊
    return this.getBasicInfo(url);
  }
  
  // oEmbed API（無需認證）
  static async getOEmbedInfo(url) {
    const oembedUrl = `https://graph.facebook.com/v18.0/instagram_oembed?url=${encodeURIComponent(url)}&access_token=|`;
    const response = await axios.get(oembedUrl);
    
    return {
      mediaId: this.extractMediaId(url),
      type: 'instagram',
      title: response.data.title || '',
      authorName: response.data.author_name,
      authorUrl: response.data.author_url,
      thumbnailUrl: response.data.thumbnail_url,
      html: response.data.html,
      width: response.data.width,
      height: response.data.height,
      url: url,
      createdAt: new Date().toISOString()
    };
  }
  
  // 基本資訊提取
  static getBasicInfo(url) {
    const mediaId = this.extractMediaId(url);
    const username = this.extractUsername(url);
    
    return {
      mediaId: mediaId || `media_${Date.now()}`,
      type: 'instagram',
      title: '',
      authorName: username || 'instagram',
      authorUrl: username ? `https://www.instagram.com/${username}/` : '',
      thumbnailUrl: '', // 需要用戶手動提供
      html: this.generateEmbedHtml(url),
      url: url,
      createdAt: new Date().toISOString()
    };
  }
  
  // 提取媒體 ID
  static extractMediaId(url) {
    const patterns = [
      /instagram\.com\/p\/([A-Za-z0-9_-]+)/,
      /instagram\.com\/reel\/([A-Za-z0-9_-]+)/,
      /instagram\.com\/tv\/([A-Za-z0-9_-]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  }
  
  // 提取用戶名
  static extractUsername(url) {
    const match = url.match(/instagram\.com\/([^\/]+)\/(p|reel|tv)\//);
    return match ? match[1] : null;
  }
  
  // 生成嵌入 HTML
  static generateEmbedHtml(url) {
    return `<iframe src="${url}embed" width="400" height="480" frameborder="0" scrolling="no" allowtransparency="true"></iframe>`;
  }
  
  // 批量處理
  static async getMultipleMedia(urls) {
    const results = await Promise.allSettled(
      urls.map(url => this.getMediaInfo(url))
    );
    
    return results
      .filter(result => result.status === 'fulfilled')
      .map(result => result.value);
  }
}
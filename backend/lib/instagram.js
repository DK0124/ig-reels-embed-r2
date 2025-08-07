// backend/lib/instagram.js
export async function fetchInstagramData(url) {
  try {
    // 從 URL 提取 shortcode
    const patterns = [
      /instagram\.com\/p\/([A-Za-z0-9_-]+)/,
      /instagram\.com\/reel\/([A-Za-z0-9_-]+)/,
      /instagram\.com\/reels\/([A-Za-z0-9_-]+)/
    ];

    let shortcode = null;
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        shortcode = match[1];
        break;
      }
    }

    if (!shortcode) {
      throw new Error('Invalid Instagram URL');
    }

    // 返回基本資訊，使用 Instagram 的嵌入功能
    return {
      url: url,
      shortcode: shortcode,
      type: url.includes('/reel') ? 'reel' : 'post',
      // 使用 Instagram 的縮圖 URL（可能無法直接訪問）
      thumbnailUrl: `https://www.instagram.com/p/${shortcode}/media/?size=m`,
      // 直接使用原始 URL 作為媒體 URL
      mediaUrl: url,
      imageUrl: `https://www.instagram.com/p/${shortcode}/media/?size=l`,
      videoUrl: null,
      caption: '',
      username: '',
      // 添加嵌入 HTML
      embedHtml: `<blockquote class="instagram-media" data-instgrm-permalink="${url}" data-instgrm-version="14"></blockquote>`
    };
  } catch (error) {
    console.error('Error processing Instagram URL:', error);
    throw error;
  }
}

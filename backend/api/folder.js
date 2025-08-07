// 在 docs/js/folder.js 中更新 createMediaCard 函數
function createMediaCard(media) {
    const card = document.createElement('div');
    card.className = 'media-card';
    
    // 使用 Instagram 嵌入或圖片預覽
    const preview = media.embedHtml ? 
        `<div class="instagram-embed-container">${media.embedHtml}</div>` :
        `<img src="${media.thumbnailUrl || media.imageUrl || 'https://via.placeholder.com/300x300?text=Instagram'}" alt="${media.caption || 'Instagram Media'}" onerror="this.src='https://via.placeholder.com/300x300?text=Instagram'">`;
    
    card.innerHTML = `
        <div class="media-preview">
            ${preview}
        </div>
        <div class="media-info">
            <p class="media-caption">${media.caption || media.shortcode || '無標題'}</p>
            <p class="media-meta">類型: ${media.type || 'unknown'}</p>
            <p class="media-date">${new Date(media.uploadedAt || media.timestamp).toLocaleString()}</p>
            <div class="media-actions">
                <a href="${media.url}" target="_blank" class="btn btn-sm btn-secondary">查看原文</a>
                <button onclick="deleteMedia('${media.id}')" class="btn btn-sm btn-danger">刪除</button>
            </div>
        </div>
    `;
    
    // 如果有嵌入 HTML，載入 Instagram 的嵌入腳本
    if (media.embedHtml) {
        setTimeout(() => {
            if (window.instgrm) {
                window.instgrm.Embeds.process();
            }
        }, 100);
    }
    
    return card;
}

// 在 DOMContentLoaded 事件中添加 Instagram 嵌入腳本
document.addEventListener('DOMContentLoaded', function() {
    // ... 原有代碼 ...
    
    // 載入 Instagram 嵌入腳本
    if (!document.getElementById('instagram-embed-script')) {
        const script = document.createElement('script');
        script.id = 'instagram-embed-script';
        script.async = true;
        script.src = '//www.instagram.com/embed.js';
        document.body.appendChild(script);
    }
});

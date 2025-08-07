// docs/js/embed.js
const API_URL = 'https://ig-reels-embed-r2.vercel.app/api';

// 從 URL 獲取資料夾 ID
function getFolderIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('folderId');
}

// 載入並顯示媒體
async function loadEmbedContent() {
    const folderId = getFolderIdFromUrl();
    
    if (!folderId) {
        displayError('Missing folder ID');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/embed?folderId=${folderId}`);
        const data = await response.json();
        
        if (response.ok) {
            displayEmbedData(data);
        } else {
            displayError(data.error || 'Failed to load content');
        }
    } catch (error) {
        console.error('Error loading embed:', error);
        displayError('Failed to load content');
    }
}

// 顯示嵌入資料
function displayEmbedData(data) {
    // 更新標題
    const headerElement = document.getElementById('embedHeader');
    if (headerElement) {
        headerElement.textContent = data.displayName || 'Instagram Collection';
    }
    
    document.title = data.displayName || 'Instagram Collection';
    
    // 顯示媒體
    displayMedia(data.media || []);
}

// 顯示媒體網格
function displayMedia(mediaList) {
    const container = document.getElementById('embedGrid');
    container.innerHTML = '';
    
    if (!mediaList || mediaList.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #ccc;">
                <p>這個收藏夾還沒有內容</p>
            </div>
        `;
        return;
    }
    
    // 根據媒體數量調整佈局
    if (mediaList.length === 1) {
        container.className = 'embed-grid single-item';
    } else if (mediaList.length === 2) {
        container.className = 'embed-grid two-items';
    } else {
        container.className = 'embed-grid';
    }
    
    mediaList.forEach((media, index) => {
        const item = createEmbedItem(media, index);
        container.appendChild(item);
    });
    
    // 載入 Instagram 嵌入腳本
    loadInstagramEmbed();
}

// 創建嵌入項目
function createEmbedItem(media, index) {
    const item = document.createElement('div');
    item.className = 'embed-item';
    
    // 使用 Instagram oEmbed
    item.innerHTML = `
        <div class="instagram-embed-wrapper" data-media-id="${media.id}">
            ${media.embedHtml || ''}
        </div>
    `;
    
    return item;
}

// 載入 Instagram 嵌入腳本
function loadInstagramEmbed() {
    if (!window.instgrm) {
        const script = document.createElement('script');
        script.async = true;
        script.src = '//www.instagram.com/embed.js';
        script.onload = () => {
            if (window.instgrm) {
                window.instgrm.Embeds.process();
            }
        };
        document.body.appendChild(script);
    } else {
        window.instgrm.Embeds.process();
    }
}

// 顯示錯誤訊息
function displayError(message) {
    const container = document.getElementById('embedGrid');
    container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #ff6b6b;">
            <h2>無法載入內容</h2>
            <p>${message}</p>
        </div>
    `;
}

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    loadEmbedContent();
    
    // 每 5 分鐘自動刷新
    setInterval(() => {
        loadEmbedContent();
    }, 5 * 60 * 1000);
});
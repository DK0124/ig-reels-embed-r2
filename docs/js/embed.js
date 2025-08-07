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
        console.log('Loading embed content for folder:', folderId);
        
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
    
    // 設置頁面標題
    document.title = data.displayName || 'Instagram Collection';
    
    // 顯示媒體
    displayMedia(data.media || []);
    
    // 如果沒有媒體，顯示提示
    if (!data.media || data.media.length === 0) {
        const container = document.getElementById('embedGrid');
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #ccc;">
                <p>這個收藏夾還沒有內容</p>
            </div>
        `;
    }
}

// 顯示媒體網格
function displayMedia(mediaList) {
    const container = document.getElementById('embedGrid');
    container.innerHTML = '';
    
    if (!mediaList || mediaList.length === 0) {
        return;
    }
    
    // 根據媒體數量調整網格
    if (mediaList.length === 1) {
        container.style.gridTemplateColumns = '1fr';
    } else if (mediaList.length === 2) {
        container.style.gridTemplateColumns = 'repeat(2, 1fr)';
    } else {
        container.style.gridTemplateColumns = 'repeat(auto-fit, minmax(300px, 1fr))';
    }
    
    mediaList.forEach((media, index) => {
        const item = createEmbedItem(media, index);
        container.appendChild(item);
    });
    
    // 載入 Instagram 嵌入腳本
    loadInstagramEmbed();
    
    // 初始化 lightbox
    initializeLightbox();
}

// 創建嵌入項目
function createEmbedItem(media, index) {
    const item = document.createElement('div');
    item.className = 'embed-item';
    item.setAttribute('data-index', index);
    
    // 檢查是否有 embedHtml
    if (media.embedHtml) {
        // 使用 Instagram 官方嵌入
        item.innerHTML = `
            <div class="instagram-embed-wrapper">
                ${media.embedHtml}
            </div>
        `;
    } else if (media.type === 'video' || media.type === 'reel') {
        // 視頻類型
        item.innerHTML = `
            <div class="media-wrapper" onclick="openLightbox(${index})">
                <video 
                    src="${media.mediaUrl}" 
                    poster="${media.thumbnailUrl || ''}"
                    muted
                    loop
                    onmouseover="this.play()"
                    onmouseout="this.pause()"
                    onerror="handleMediaError(this, '${media.url}')"
                >
                </video>
                <div class="embed-overlay">
                    <div class="play-icon">▶</div>
                </div>
            </div>
            <div class="embed-caption">
                <p>${media.caption || media.shortcode || ''}</p>
                <a href="${media.originalUrl || media.url}" target="_blank" class="view-original">
                    在 Instagram 查看
                </a>
            </div>
        `;
    } else {
        // 圖片類型
        item.innerHTML = `
            <div class="media-wrapper" onclick="openLightbox(${index})">
                <img 
                    src="${media.imageUrl || media.thumbnailUrl || media.mediaUrl}" 
                    alt="${media.caption || 'Instagram post'}"
                    loading="lazy"
                    onerror="handleMediaError(this, '${media.url}')"
                >
            </div>
            <div class="embed-caption">
                <p>${media.caption || media.shortcode || ''}</p>
                <a href="${media.originalUrl || media.url}" target="_blank" class="view-original">
                    在 Instagram 查看
                </a>
            </div>
        `;
    }
    
    return item;
}

// 處理媒體載入錯誤
function handleMediaError(element, instagramUrl) {
    console.error('Media load error:', instagramUrl);
    
    // 創建 Instagram 嵌入作為後備方案
    const wrapper = element.closest('.media-wrapper');
    if (wrapper) {
        wrapper.innerHTML = `
            <div class="error-placeholder">
                <p>無法載入媒體</p>
                <a href="${instagramUrl}" target="_blank" class="btn-view-instagram">
                    在 Instagram 查看
                </a>
            </div>
        `;
    }
}

// 載入 Instagram 嵌入腳本
function loadInstagramEmbed() {
    if (!document.getElementById('instagram-embed-script')) {
        const script = document.createElement('script');
        script.id = 'instagram-embed-script';
        script.async = true;
        script.src = '//www.instagram.com/embed.js';
        script.onload = () => {
            console.log('Instagram embed script loaded');
            // 處理所有嵌入
            if (window.instgrm) {
                window.instgrm.Embeds.process();
            }
        };
        document.body.appendChild(script);
    } else if (window.instgrm) {
        // 如果腳本已載入，直接處理
        window.instgrm.Embeds.process();
    }
}

// Lightbox 功能
let currentMediaIndex = 0;
let mediaData = [];

function initializeLightbox() {
    // 儲存媒體資料供 lightbox 使用
    const items = document.querySelectorAll('.embed-item');
    mediaData = Array.from(items).map((item, index) => {
        const video = item.querySelector('video');
        const img = item.querySelector('img');
        const caption = item.querySelector('.embed-caption p')?.textContent || '';
        const link = item.querySelector('.view-original')?.href || '';
        
        return {
            type: video ? 'video' : 'image',
            src: video ? video.src : (img ? img.src : ''),
            poster: video ? video.poster : '',
            caption: caption,
            link: link
        };
    });
}

function openLightbox(index) {
    currentMediaIndex = index;
    const media = mediaData[index];
    
    if (!media) return;
    
    // 創建 lightbox
    const lightbox = document.createElement('div');
    lightbox.id = 'lightbox';
    lightbox.className = 'lightbox';
    lightbox.innerHTML = `
        <div class="lightbox-content">
            <button class="lightbox-close" onclick="closeLightbox()">×</button>
            <button class="lightbox-nav lightbox-prev" onclick="navigateLightbox(-1)">‹</button>
            <button class="lightbox-nav lightbox-next" onclick="navigateLightbox(1)">›</button>
            <div class="lightbox-media-container">
                ${media.type === 'video' ? 
                    `<video src="${media.src}" poster="${media.poster}" controls autoplay></video>` :
                    `<img src="${media.src}" alt="${media.caption}">`
                }
            </div>
            <div class="lightbox-caption">
                <p>${media.caption}</p>
                <a href="${media.link}" target="_blank" class="btn-view-instagram">在 Instagram 查看</a>
            </div>
        </div>
    `;
    
    document.body.appendChild(lightbox);
    document.body.style.overflow = 'hidden';
    
    // ESC 鍵關閉
    document.addEventListener('keydown', handleLightboxKeydown);
    
    // 點擊背景關閉
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    if (lightbox) {
        lightbox.remove();
        document.body.style.overflow = '';
        document.removeEventListener('keydown', handleLightboxKeydown);
    }
}

function navigateLightbox(direction) {
    currentMediaIndex += direction;
    
    if (currentMediaIndex < 0) {
        currentMediaIndex = mediaData.length - 1;
    } else if (currentMediaIndex >= mediaData.length) {
        currentMediaIndex = 0;
    }
    
    closeLightbox();
    openLightbox(currentMediaIndex);
}

function handleLightboxKeydown(e) {
    switch(e.key) {
        case 'Escape':
            closeLightbox();
            break;
        case 'ArrowLeft':
            navigateLightbox(-1);
            break;
        case 'ArrowRight':
            navigateLightbox(1);
            break;
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

// 響應式處理
function handleResize() {
    const container = document.getElementById('embedGrid');
    const items = container.querySelectorAll('.embed-item');
    
    if (window.innerWidth < 600 && items.length > 4) {
        container.style.gridTemplateColumns = 'repeat(2, 1fr)';
    } else if (window.innerWidth < 400) {
        container.style.gridTemplateColumns = '1fr';
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('Embed page loaded');
    
    // 載入內容
    loadEmbedContent();
    
    // 監聽視窗大小變化
    window.addEventListener('resize', handleResize);
    
    // 自動刷新（每 5 分鐘）
    setInterval(() => {
        console.log('Auto-refreshing embed content...');
        loadEmbedContent();
    }, 5 * 60 * 1000);
});

// 全域函數
window.openLightbox = openLightbox;
window.closeLightbox = closeLightbox;
window.navigateLightbox = navigateLightbox;
window.handleMediaError = handleMediaError;

// 添加 CSS 樣式
const style = document.createElement('style');
style.textContent = `
    .instagram-embed-wrapper {
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 400px;
    }
    
    .media-wrapper {
        cursor: pointer;
        position: relative;
        overflow: hidden;
        aspect-ratio: 1;
        background: #000;
    }
    
    .media-wrapper video,
    .media-wrapper img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
    
    .embed-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.3s;
    }
    
    .media-wrapper:hover .embed-overlay {
        opacity: 1;
    }
    
    .play-icon {
        font-size: 48px;
        color: white;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
    }
    
    .error-placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        padding: 20px;
        background: #f0f0f0;
        color: #666;
    }
    
    .btn-view-instagram {
        margin-top: 10px;
        padding: 8px 16px;
        background: #E1306C;
        color: white;
        text-decoration: none;
        border-radius: 4px;
        font-size: 14px;
    }
    
    .btn-view-instagram:hover {
        background: #C13584;
    }
    
    /* Lightbox styles */
    .lightbox {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.95);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
    }
    
    .lightbox-content {
        position: relative;
        max-width: 90%;
        max-height: 90%;
    }
    
    .lightbox-media-container {
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .lightbox-media-container video,
    .lightbox-media-container img {
        max-width: 100%;
        max-height: 80vh;
        object-fit: contain;
    }
    
    .lightbox-close {
        position: absolute;
        top: 20px;
        right: 20px;
        font-size: 40px;
        color: white;
        background: none;
        border: none;
        cursor: pointer;
        z-index: 10;
    }
    
    .lightbox-nav {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        font-size: 60px;
        color: white;
        background: none;
        border: none;
        cursor: pointer;
        padding: 20px;
    }
    
    .lightbox-prev {
        left: 20px;
    }
    
    .lightbox-next {
        right: 20px;
    }
    
    .lightbox-caption {
        position: absolute;
        bottom: 20px;
        left: 20px;
        right: 20px;
        color: white;
        text-align: center;
        background: rgba(0, 0, 0, 0.7);
        padding: 15px;
        border-radius: 8px;
    }
`;
document.head.appendChild(style);

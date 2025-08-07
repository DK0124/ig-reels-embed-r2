// frontend/js/admin.js
const API_URL = 'https://https://ig-reels-embed-r2.vercel.app/api'; // 替換成你的 Vercel URL
let currentFolderId = null;
let folders = [];

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    loadFolders();
    setupEventListeners();
});

// 設定事件監聽
function setupEventListeners() {
    // 標籤切換
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            switchTab(e.target.dataset.tab);
        });
    });
    
    // 創建資料夾表單
    document.getElementById('create-folder-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        await createFolder();
    });
    
    // 設定變更監聽
    ['layout-select', 'columns', 'mobile-columns', 'spacing', 'click-action', 'show-overlay'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', () => {
                updatePreview();
                generateEmbedCode();
            });
        }
    });
}

// 切換標籤
function switchTab(tabName) {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `${tabName}-tab`);
    });
}

// 載入資料夾列表
async function loadFolders() {
    try {
        const response = await fetch(`${API_URL}/folder`);
        const data = await response.json();
        
        folders = data.folders || [];
        renderFolders();
    } catch (error) {
        console.error('載入資料夾失敗:', error);
        showNotification('載入資料夾失敗', 'error');
    }
}

// 渲染資料夾列表
function renderFolders() {
    const container = document.getElementById('folders-list');
    
    if (folders.length === 0) {
        container.innerHTML = '<div class="empty-state">尚無資料夾，請創建第一個資料夾開始使用！</div>';
        return;
    }
    
    container.innerHTML = folders.map(folder => `
        <div class="folder-card">
            <div class="folder-icon">📁</div>
            <h3>${folder.name}</h3>
            <p class="folder-meta">
                ${folder.mediaCount || 0} 個媒體 · 
                創建於 ${new Date(folder.createdAt).toLocaleDateString()}
            </p>
            <div class="folder-actions">
                <button onclick="openMediaModal('${folder.id}', '${folder.name}')" class="btn btn-sm btn-primary">
                    管理媒體
                </button>
                <button onclick="deleteFolder('${folder.id}')" class="btn btn-sm btn-danger">
                    刪除
                </button>
            </div>
        </div>
    `).join('');
}

// 創建資料夾
async function createFolder() {
    const nameInput = document.getElementById('folder-name');
    const name = nameInput.value.trim();
    
    if (!name) return;
    
    try {
        const response = await fetch(`${API_URL}/folder`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            folders.unshift(data.folder);
            renderFolders();
            nameInput.value = '';
            showNotification('資料夾創建成功！', 'success');
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        showNotification('創建失敗: ' + error.message, 'error');
    }
}

// 刪除資料夾
async function deleteFolder(folderId) {
    if (!confirm('確定要刪除這個資料夾嗎？所有媒體都會被刪除。')) return;
    
    try {
        const response = await fetch(`${API_URL}/folder?folderId=${folderId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            folders = folders.filter(f => f.id !== folderId);
            renderFolders();
            showNotification('資料夾已刪除', 'success');
        }
    } catch (error) {
        showNotification('刪除失敗', 'error');
    }
}

// 打開媒體管理模態框
async function openMediaModal(folderId, folderName) {
    currentFolderId = folderId;
    document.getElementById('modal-folder-name').textContent = folderName;
    document.getElementById('media-modal').classList.add('active');
    
    // 載入資料夾設定
    const folder = folders.find(f => f.id === folderId);
    if (folder && folder.settings) {
        document.getElementById('layout-select').value = folder.settings.layout || 'grid';
        document.getElementById('columns').value = folder.settings.columns || 3;
        document.getElementById('mobile-columns').value = folder.settings.mobileColumns || 2;
        document.getElementById('spacing').value = folder.settings.spacing || 10;
        document.getElementById('click-action').value = folder.settings.clickAction || 'lightbox';
        document.getElementById('show-overlay').checked = folder.settings.showOverlay !== false;
    }
    
    await loadMedia();
    generateEmbedCode();
    updatePreview();
}

// 關閉媒體管理模態框
function closeMediaModal() {
    document.getElementById('media-modal').classList.remove('active');
    currentFolderId = null;
}

// 載入媒體列表
async function loadMedia() {
    if (!currentFolderId) return;
    
    try {
        const response = await fetch(`${API_URL}/media?folderId=${currentFolderId}`);
        const data = await response.json();
        
        renderMedia(data.mediaList || []);
    } catch (error) {
        console.error('載入媒體失敗:', error);
    }
}

// 渲染媒體列表
function renderMedia(mediaList) {
    const container = document.getElementById('media-list');
    document.getElementById('media-count').textContent = mediaList.length;
    
    if (mediaList.length === 0) {
        container.innerHTML = '<div class="empty-state">尚無媒體，請添加 Instagram 連結</div>';
        return;
    }
    
    container.innerHTML = mediaList.map(media => `
        <div class="media-card">
            ${media.thumbnailUrl ? 
                `<img src="${media.thumbnailUrl}" alt="${media.title || ''}" class="media-thumb">` :
                `<div class="media-placeholder">
                    <span>IG</span>
                </div>`
            }
            <div class="media-info">
                <p class="media-author">@${media.authorName}</p>
                <button onclick="removeMedia('${media.mediaId}')" class="btn btn-sm btn-danger">
                    移除
                </button>
            </div>
        </div>
    `).join('');
}

// 添加媒體
async function addMedia() {
    const textarea = document.getElementById('media-urls');
    const urls = textarea.value.split('\n').filter(url => url.trim());
    
    if (urls.length === 0) {
        showNotification('請輸入至少一個 Instagram 連結', 'warning');
        return;
    }
    
    // 驗證 URL 格式
    const validUrls = urls.filter(url => {
        return /instagram\.com\/(p|reel|tv)\//.test(url);
    });
    
    if (validUrls.length === 0) {
        showNotification('請輸入有效的 Instagram 連結', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/media?folderId=${currentFolderId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ urls: validUrls })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification(`成功添加 ${data.added} 個媒體`, 'success');
            textarea.value = '';
            await loadMedia();
            
            // 更新資料夾媒體數量
            const folder = folders.find(f => f.id === currentFolderId);
            if (folder) {
                folder.mediaCount = data.total;
            }
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        showNotification('添加失敗: ' + error.message, 'error');
    }
}

// 移除媒體
async function removeMedia(mediaId) {
    if (!confirm('確定要移除這個媒體嗎？')) return;
    
    try {
        const response = await fetch(`${API_URL}/media?folderId=${currentFolderId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mediaIds: [mediaId] })
        });
        
        if (response.ok) {
            await loadMedia();
            showNotification('媒體已移除', 'success');
        }
    } catch (error) {
        showNotification('移除失敗', 'error');
    }
}

// 保存設定
async function saveSettings() {
    const settings = {
        layout: document.getElementById('layout-select').value,
        columns: parseInt(document.getElementById('columns').value),
        mobileColumns: parseInt(document.getElementById('mobile-columns').value),
        spacing: parseInt(document.getElementById('spacing').value),
        clickAction: document.getElementById('click-action').value,
        showOverlay: document.getElementById('show-overlay').checked
    };
    
    try {
        const response = await fetch(`${API_URL}/folder?folderId=${currentFolderId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ settings })
        });
        
        if (response.ok) {
            showNotification('設定已保存', 'success');
            
            // 更新本地資料
            const folder = folders.find(f => f.id === currentFolderId);
            if (folder) {
                folder.settings = settings;
            }
        }
    } catch (error) {
        showNotification('保存失敗', 'error');
    }
}

// 生成嵌入代碼
function generateEmbedCode() {
    if (!currentFolderId) return;
    
    const embedUrl = `https://YOUR_GITHUB_USERNAME.github.io/ig-reels-embed/embed.html?folderId=${currentFolderId}`;
    
    const code = `<!-- IG Reels 嵌入代碼 -->
<iframe 
    src="${embedUrl}"
    width="100%"
    height="600"
    frameborder="0"
    style="border: none; background: transparent;"
    loading="lazy"
></iframe>

<!-- 自動調整高度（可選） -->
<script>
window.addEventListener('message', function(e) {
    if (e.origin !== 'https://YOUR_GITHUB_USERNAME.github.io') return;
    
    if (e.data.type === 'resize') {
        const iframe = document.querySelector('iframe[src*="${currentFolderId}"]');
        if (iframe) iframe.style.height = e.data.height + 'px';
    }
});
</script>`;
    
    document.getElementById('embed-code').value = code;
}

// 複製嵌入代碼
function copyEmbedCode() {
    const textarea = document.getElementById('embed-code');
    textarea.select();
    document.execCommand('copy');
    showNotification('嵌入代碼已複製到剪貼簿', 'success');
}

// 更新預覽
function updatePreview() {
    if (!currentFolderId) return;
    
    const iframe = document.getElementById('preview-frame');
    iframe.src = `embed.html?folderId=${currentFolderId}`;
}

// 顯示通知
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// ESC 鍵關閉模態框
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && currentFolderId) {
        closeMediaModal();
    }

});

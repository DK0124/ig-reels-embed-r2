// docs/js/folder.js
const API_URL = 'https://ig-reels-embed-r2.vercel.app/api';

// 從 URL 獲取資料夾 ID
function getFolderIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

const currentFolderId = getFolderIdFromUrl();

// 載入資料夾資訊和媒體
async function loadFolderContent() {
    if (!currentFolderId) {
        showMessage('無效的資料夾 ID', 'error');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        return;
    }

    try {
        // 載入資料夾資訊
        const folderResponse = await fetch(`${API_URL}/folder`);
        const folderData = await folderResponse.json();
        
        const currentFolder = folderData.folders.find(f => f.folderId === currentFolderId);
        if (currentFolder) {
            document.getElementById('folderDisplayName').textContent = currentFolder.displayName;
            document.getElementById('folderId').textContent = currentFolder.folderId;
        }

        // 載入媒體列表
        const mediaResponse = await fetch(`${API_URL}/media?folderId=${currentFolderId}`);
        const mediaData = await mediaResponse.json();
        
        displayMedia(mediaData.media || []);
    } catch (error) {
        console.error('載入失敗:', error);
        showMessage('載入內容失敗', 'error');
    }
}

// 顯示媒體列表
function displayMedia(mediaList) {
    const mediaContainer = document.getElementById('mediaList');
    
    if (mediaList.length === 0) {
        mediaContainer.innerHTML = '<p class="no-media">尚無媒體內容，請新增 Instagram 連結。</p>';
        return;
    }

    mediaContainer.innerHTML = '';
    mediaList.forEach(media => {
        const mediaCard = createMediaCard(media);
        mediaContainer.appendChild(mediaCard);
    });
}

// 創建媒體卡片
function createMediaCard(media) {
    const card = document.createElement('div');
    card.className = 'media-card';
    card.innerHTML = `
        <div class="media-preview">
            ${media.type === 'video' ? 
                `<video src="${media.mediaUrl}" poster="${media.thumbnailUrl}" controls></video>` :
                `<img src="${media.thumbnailUrl || media.mediaUrl}" alt="${media.caption}">`
            }
        </div>
        <div class="media-info">
            <p class="media-caption">${media.caption || '無標題'}</p>
            <p class="media-meta">@${media.username || 'unknown'}</p>
            <p class="media-date">${new Date(media.uploadedAt).toLocaleString()}</p>
            <div class="media-actions">
                <a href="${media.url}" target="_blank" class="btn btn-sm btn-secondary">查看原文</a>
                <button onclick="deleteMedia('${media.id}')" class="btn btn-sm btn-danger">刪除</button>
            </div>
        </div>
    `;
    return card;
}

// 新增媒體
async function addMedia() {
    const urlInput = document.getElementById('instagramUrl');
    const url = urlInput.value.trim();
    
    if (!url) {
        showMessage('請輸入 Instagram 連結', 'error');
        return;
    }
    
    // 驗證 URL 格式
    if (!url.includes('instagram.com/')) {
        showMessage('請輸入有效的 Instagram 連結', 'error');
        return;
    }
    
    try {
        showMessage('正在處理...', 'info');
        
        const response = await fetch(`${API_URL}/media`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url: url,
                folderId: currentFolderId
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('新增成功', 'success');
            urlInput.value = '';
            loadFolderContent(); // 重新載入內容
        } else {
            throw new Error(data.error || '新增失敗');
        }
    } catch (error) {
        console.error('新增媒體失敗:', error);
        showMessage('新增失敗: ' + error.message, 'error');
    }
}

// 刪除媒體
async function deleteMedia(mediaId) {
    if (!confirm('確定要刪除此內容嗎？')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/media?folderId=${currentFolderId}&mediaId=${mediaId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showMessage('已刪除', 'success');
            loadFolderContent(); // 重新載入內容
        } else {
            throw new Error('刪除失敗');
        }
    } catch (error) {
        console.error('刪除失敗:', error);
        showMessage('刪除失敗', 'error');
    }
}

// 獲取嵌入代碼
function getEmbedCode() {
    const embedUrl = `${window.location.origin}${window.location.pathname.replace('folder.html', '')}embed.html?folderId=${currentFolderId}`;
    const embedCode = `<iframe src="${embedUrl}" width="100%" height="600" frameborder="0" allowfullscreen></iframe>`;
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>嵌入代碼</h2>
            <p>將以下代碼複製到您的網站：</p>
            <textarea class="embed-code" readonly>${embedCode}</textarea>
            <p>預覽連結：<a href="${embedUrl}" target="_blank">${embedUrl}</a></p>
            <button onclick="copyEmbedCode(this)" class="btn btn-primary">複製代碼</button>
            <button onclick="closeModal()" class="btn btn-secondary">關閉</button>
        </div>
    `;
    document.getElementById('modalContainer').appendChild(modal);
}

// 預覽嵌入
function previewEmbed() {
    const embedUrl = `${window.location.origin}${window.location.pathname.replace('folder.html', '')}embed.html?folderId=${currentFolderId}`;
    window.open(embedUrl, '_blank');
}

// 複製嵌入代碼
function copyEmbedCode(button) {
    const textarea = button.parentElement.querySelector('.embed-code');
    textarea.select();
    document.execCommand('copy');
    button.textContent = '已複製！';
    setTimeout(() => {
        button.textContent = '複製代碼';
    }, 2000);
}

// 關閉彈窗
function closeModal() {
    const modal = document.querySelector('.modal');
    if (modal) {
        modal.remove();
    }
}

// 顯示訊息
function showMessage(message, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    document.getElementById('messageContainer').appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    loadFolderContent();
    
    // 綁定新增按鈕事件
    const addBtn = document.getElementById('addMediaBtn');
    if (addBtn) {
        addBtn.addEventListener('click', addMedia);
    }
    
    // Enter 鍵提交
    const urlInput = document.getElementById('instagramUrl');
    if (urlInput) {
        urlInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                addMedia();
            }
        });
    }
});
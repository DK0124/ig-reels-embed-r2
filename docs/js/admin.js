// docs/js/admin.js
const API_URL = 'https://ig-reels-embed-r2.vercel.app/api';

// 載入資料夾列表
async function loadFolders() {
    try {
        const response = await fetch(`${API_URL}/folder`);
        const data = await response.json();
        
        const folderList = document.getElementById('folderList');
        folderList.innerHTML = '';
        
        if (data.folders && data.folders.length > 0) {
            data.folders.forEach(folder => {
                const folderCard = createFolderCard(folder);
                folderList.appendChild(folderCard);
            });
        } else {
            folderList.innerHTML = '<p class="no-folders">尚無資料夾，請新增一個開始使用。</p>';
        }
    } catch (error) {
        console.error('載入資料夾失敗:', error);
        showMessage('載入資料夾失敗', 'error');
    }
}

// 創建資料夾
async function createFolder() {
    const nameInput = document.getElementById('folderName');
    const displayNameInput = document.getElementById('folderDisplayName');
    
    const name = nameInput.value.trim();
    const displayName = displayNameInput.value.trim();
    
    if (!name || !displayName) {
        showMessage('請填寫資料夾名稱和顯示名稱', 'error');
        return;
    }
    
    try {
        console.log('Creating folder with:', { name, displayName }); // Debug log
        
        const response = await fetch(`${API_URL}/folder`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: name,
                displayName: displayName
            })
        });
        
        const responseData = await response.json();
        console.log('Response:', response.status, responseData); // Debug log
        
        if (response.ok) {
            showMessage('資料夾創建成功', 'success');
            nameInput.value = '';
            displayNameInput.value = '';
            loadFolders();
        } else {
            throw new Error(responseData.error || '創建失敗');
        }
    } catch (error) {
        console.error('創建資料夾失敗:', error);
        showMessage('創建失敗: ' + error.message, 'error');
    }
}

// 刪除資料夾
async function deleteFolder(folderId) {
    if (!confirm('確定要刪除此資料夾嗎？所有內容將被永久刪除。')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/folder?folderId=${folderId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showMessage('資料夾已刪除', 'success');
            loadFolders();
        } else {
            throw new Error('刪除失敗');
        }
    } catch (error) {
        console.error('刪除資料夾失敗:', error);
        showMessage('刪除失敗', 'error');
    }
}

// 創建資料夾卡片
function createFolderCard(folder) {
    const card = document.createElement('div');
    card.className = 'folder-card';
    card.innerHTML = `
        <h3>${folder.displayName}</h3>
        <p>ID: ${folder.folderId}</p>
        <p>媒體數量: ${folder.mediaCount || 0}</p>
        <p>創建時間: ${new Date(folder.createdAt).toLocaleString()}</p>
        <div class="folder-actions">
            <button onclick="viewFolder('${folder.folderId}')" class="btn btn-primary">查看內容</button>
            <button onclick="getEmbedCode('${folder.folderId}')" class="btn btn-secondary">嵌入代碼</button>
            <button onclick="deleteFolder('${folder.folderId}')" class="btn btn-danger">刪除</button>
        </div>
    `;
    return card;
}

// 查看資料夾內容
function viewFolder(folderId) {
    window.location.href = `folder.html?id=${folderId}`;
}

// 獲取嵌入代碼
function getEmbedCode(folderId) {
    const embedUrl = `${window.location.origin}${window.location.pathname.replace('index.html', '')}embed.html?folderId=${folderId}`;
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
    document.body.appendChild(modal);
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
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    loadFolders();
    
    // 綁定創建按鈕事件
    const createBtn = document.getElementById('createFolderBtn');
    if (createBtn) {
        createBtn.addEventListener('click', createFolder);
    }
    
    // Enter 鍵提交
    const inputs = document.querySelectorAll('#folderName, #folderDisplayName');
    inputs.forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                createFolder();
            }
        });
    });
});
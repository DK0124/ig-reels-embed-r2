// docs/js/admin.js
const API_URL = 'https://ig-reels-embed-r2.vercel.app/api';

// 載入資料夾列表
async function loadFolders() {
    console.log('開始載入資料夾...');
    try {
        const response = await fetch(`${API_URL}/folder`);
        console.log('API 回應狀態:', response.status);
        
        const data = await response.json();
        console.log('API 回應資料:', data);
        
        const folderList = document.getElementById('folderList');
        folderList.innerHTML = '';
        
        if (data.folders && data.folders.length > 0) {
            console.log(`找到 ${data.folders.length} 個資料夾`);
            data.folders.forEach(folder => {
                const folderCard = createFolderCard(folder);
                folderList.appendChild(folderCard);
            });
        } else {
            console.log('沒有找到資料夾');
            folderList.innerHTML = '<p class="no-folders">尚無資料夾，請新增一個開始使用。</p>';
        }
    } catch (error) {
        console.error('載入資料夾失敗:', error);
        document.getElementById('folderList').innerHTML = 
            `<p class="error">載入失敗: ${error.message}</p>`;
        showMessage('載入資料夾失敗: ' + error.message, 'error');
    }
}

// 創建資料夾
async function createFolder() {
    const nameInput = document.getElementById('folderName');
    const displayNameInput = document.getElementById('folderDisplayName');
    
    const name = nameInput.value.trim();
    const displayName = displayNameInput.value.trim();
    
    console.log('準備創建資料夾:', { name, displayName });
    
    if (!name || !displayName) {
        showMessage('請填寫資料夾名稱和顯示名稱', 'error');
        return;
    }
    
    // 驗證名稱格式
    if (!/^[a-z0-9-]+$/.test(name)) {
        showMessage('資料夾名稱只能使用小寫英文、數字和連字符', 'error');
        return;
    }
    
    try {
        const requestBody = {
            name: name,
            displayName: displayName
        };
        console.log('發送請求:', requestBody);
        
        const response = await fetch(`${API_URL}/folder`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });
        
        console.log('創建回應狀態:', response.status);
        const responseData = await response.json();
        console.log('創建回應資料:', responseData);
        
        if (response.ok) {
            showMessage('資料夾創建成功', 'success');
            nameInput.value = '';
            displayNameInput.value = '';
            // 延遲一秒後重新載入，確保資料已儲存
            setTimeout(() => {
                loadFolders();
            }, 1000);
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
    
    console.log('準備刪除資料夾:', folderId);
    
    try {
        const response = await fetch(`${API_URL}/folder?folderId=${folderId}`, {
            method: 'DELETE'
        });
        
        console.log('刪除回應狀態:', response.status);
        
        if (response.ok) {
            showMessage('資料夾已刪除', 'success');
            setTimeout(() => {
                loadFolders();
            }, 500);
        } else {
            const error = await response.json();
            throw new Error(error.error || '刪除失敗');
        }
    } catch (error) {
        console.error('刪除資料夾失敗:', error);
        showMessage('刪除失敗: ' + error.message, 'error');
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
        <p>創建時間: ${new Date(folder.createdAt).toLocaleString('zh-TW')}</p>
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
    console.log('導航到資料夾:', folderId);
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
    console.log(`[${type.toUpperCase()}] ${message}`);
    
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
    console.log('頁面載入完成，初始化中...');
    loadFolders();
    
    // 綁定創建按鈕事件
    const createBtn = document.getElementById('createFolderBtn');
    if (createBtn) {
        createBtn.addEventListener('click', createFolder);
        console.log('創建按鈕已綁定');
    } else {
        console.error('找不到創建按鈕元素');
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
    
    // 每 30 秒自動刷新一次資料夾列表
    setInterval(() => {
        console.log('自動刷新資料夾列表...');
        loadFolders();
    }, 30000);
});

// 全域錯誤處理
window.addEventListener('error', function(e) {
    console.error('全域錯誤:', e.error);
    showMessage('發生錯誤: ' + e.error.message, 'error');
});
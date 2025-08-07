// frontend/js/embed.js
const API_URL = 'https://your-backend.vercel.app/api'; // 替換成你的 Vercel URL

class IGReelsEmbed {
    constructor() {
        this.container = document.getElementById('embedContainer');
        this.lightbox = document.getElementById('lightbox');
        this.lightboxBody = document.getElementById('lightboxBody');
        this.folderId = null;
        this.folder = null;
        this.mediaList = [];
        this.settings = {};
        this.currentSlideIndex = 0;
        this.autoplayInterval = null;
        
        this.init();
    }
    
    async init() {
        // 獲取 URL 參數
        const params = new URLSearchParams(window.location.search);
        this.folderId = params.get('folderId');
        
        if (!this.folderId) {
            this.showError('未指定資料夾 ID');
            return;
        }
        
        // 載入資料
        await this.loadData();
        
        // 監聽視窗大小變化
        window.addEventListener('resize', () => this.handleResize());
        
        // 監聽鍵盤事件
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
    }
    
    async loadData() {
        try {
            const response = await fetch(`${API_URL}/embed?folderId=${this.folderId}`);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || '載入失敗');
            }
            
            this.folder = data.folder;
            this.mediaList = data.mediaList;
            this.settings = data.settings || {};
            
            // 渲染內容
            this.render();
            
            // 通知父視窗
            this.notifyParent('loaded', {
                folderId: this.folderId,
                mediaCount: this.mediaList.length
            });
        } catch (error) {
            this.showError('載入失敗: ' + error.message);
        }
    }
    
    render() {
        const layout = this.settings.layout || 'grid';
        const columns = this.getColumnCount();
        
        let html = '';
        
        switch (layout) {
            case 'slider':
                html = this.renderSlider();
                break;
            case 'masonry':
                html = this.renderMasonry();
                break;
            case 'grid':
            default:
                html = this.renderGrid(columns);
                break;
        }
        
        this.container.innerHTML = html;
        
        // 設定事件監聽
        this.setupEventListeners();
        
        // 通知父視窗高度變化
        this.notifyHeightChange();
        
        // 啟動自動播放（如果是 slider）
        if (layout === 'slider' && this.settings.autoplay) {
            this.startAutoplay();
        }
    }
    
    renderGrid(columns) {
        const spacing = this.settings.spacing || 10;
        
        return `
            <div class="layout-grid" style="grid-template-columns: repeat(${columns}, 1fr); gap: ${spacing}px;">
                ${this.mediaList.map((media, index) => this.renderMediaItem(media, index)).join('')}
            </div>
        `;
    }
    
    renderSlider() {
        return `
            <div class="layout-slider">
                <div class="slider-track" id="sliderTrack">
                    ${this.mediaList.map((media, index) => `
                        <div class="slider-item">
                            ${this.renderMediaItem(media, index)}
                        </div>
                    `).join('')}
                </div>
                ${this.mediaList.length > 1 ? `
                    <div class="slider-controls">
                        <button class="slider-btn" onclick="embed.prevSlide()">‹</button>
                        <button class="slider-btn" onclick="embed.nextSlide()">›</button>
                    </div>
                    <div class="slider-dots">
                        ${this.mediaList.map((_, index) => `
                            <span class="dot ${index === 0 ? 'active' : ''}" onclick="embed.goToSlide(${index})"></span>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    renderMasonry() {
        const spacing = this.settings.spacing || 10;
        
        return `
            <div class="layout-masonry" style="column-gap: ${spacing}px;">
                ${this.mediaList.map((media, index) => `
                    <div class="masonry-item">
                        ${this.renderMediaItem(media, index)}
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    renderMediaItem(media, index) {
        const showOverlay = this.settings.showOverlay !== false;
        const thumbnailUrl = media.thumbnailUrl || '/placeholder.jpg';
        
        return `
            <div class="media-item" data-index="${index}">
                <img 
                    src="${thumbnailUrl}" 
                    alt="${this.escapeHtml(media.title || '')}" 
                    loading="lazy"
                    onerror="this.src='/placeholder.jpg'"
                >
                ${showOverlay ? `
                    <div class="media-overlay">
                        <div class="author-info">
                            <div class="author-avatar">
                                ${media.authorName ? media.authorName.charAt(0).toUpperCase() : 'IG'}
                            </div>
                            <div class="author-name">@${media.authorName || 'instagram'}</div>
                        </div>
                        ${media.title ? `<div class="media-caption">${this.escapeHtml(media.title)}</div>` : ''}
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    setupEventListeners() {
        // 點擊事件
        document.querySelectorAll('.media-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const index = parseInt(item.dataset.index);
                this.handleMediaClick(index);
            });
        });
        
        // 燈箱關閉
        this.lightbox.addEventListener('click', (e) => {
            if (e.target === this.lightbox) {
                this.closeLightbox();
            }
        });
    }
    
    handleMediaClick(index) {
        const media = this.mediaList[index];
        if (!media) return;
        
        // 發送點擊事件到父視窗
        this.notifyParent('mediaClick', {
            media: media,
            index: index,
            folderId: this.folderId
        });
        
        // 執行點擊動作
        switch (this.settings.clickAction) {
            case 'instagram':
                window.open(media.url, '_blank');
                break;
            case 'none':
                // 無動作
                break;
            case 'lightbox':
            default:
                this.openLightbox(media);
                break;
        }
    }
    
    openLightbox(media) {
        // 如果有 oEmbed HTML，使用它
        if (media.html) {
            this.lightboxBody.innerHTML = media.html;
        } else {
            // 否則使用 iframe
            this.lightboxBody.innerHTML = `
                <iframe 
                    src="${media.url}embed" 
                    frameborder="0" 
                    scrolling="no" 
                    allowtransparency="true"
                    allow="autoplay; fullscreen"
                ></iframe>
            `;
        }
        
        this.lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    closeLightbox() {
        this.lightbox.classList.remove('active');
        this.lightboxBody.innerHTML = '';
        document.body.style.overflow = '';
    }
    
    // Slider 控制
    prevSlide() {
        this.currentSlideIndex = Math.max(0, this.currentSlideIndex - 1);
        this.updateSlider();
    }
    
    nextSlide() {
        this.currentSlideIndex = Math.min(this.mediaList.length - 1, this.currentSlideIndex + 1);
        this.updateSlider();
    }
    
    goToSlide(index) {
        this.currentSlideIndex = index;
        this.updateSlider();
    }
    
    updateSlider() {
        const track = document.getElementById('sliderTrack');
        if (track) {
            track.style.transform = `translateX(-${this.currentSlideIndex * 100}%)`;
            
            // 更新點點
            document.querySelectorAll('.dot').forEach((dot, index) => {
                dot.classList.toggle('active', index === this.currentSlideIndex);
            });
        }
    }
    
    startAutoplay() {
        if (this.autoplayInterval) {
            clearInterval(this.autoplayInterval);
        }
        
        this.autoplayInterval = setInterval(() => {
            if (this.currentSlideIndex >= this.mediaList.length - 1) {
                this.currentSlideIndex = 0;
            } else {
                this.currentSlideIndex++;
            }
            this.updateSlider();
        }, this.settings.autoplaySpeed || 3000);
    }
    
    stopAutoplay() {
        if (this.autoplayInterval) {
            clearInterval(this.autoplayInterval);
            this.autoplayInterval = null;
        }
    }
    
    // 工具方法
    getColumnCount() {
        const isMobile = window.innerWidth < 768;
        return isMobile ? (this.settings.mobileColumns || 2) : (this.settings.columns || 3);
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    showError(message) {
        this.container.innerHTML = `
            <div class="error">
                <p>${message}</p>
            </div>
        `;
    }
    
    // 與父視窗通訊
    notifyParent(type, data) {
        if (window.parent !== window) {
            window.parent.postMessage({
                type: type,
                ...data
            }, '*');
        }
    }
    
    notifyHeightChange() {
        if (window.parent !== window) {
            // 使用 requestAnimationFrame 確保 DOM 已更新
            requestAnimationFrame(() => {
                const height = document.body.scrollHeight;
                this.notifyParent('resize', { height: height });
            });
        }
    }
    
    handleResize() {
        // 如果是 grid 或 masonry 佈局，需要重新渲染
        if (this.settings.layout === 'grid' || this.settings.layout === 'masonry') {
            const currentColumns = this.getColumnCount();
            const container = this.container.querySelector('.layout-grid, .layout-masonry');
            
            if (container && this.settings.layout === 'grid') {
                container.style.gridTemplateColumns = `repeat(${currentColumns}, 1fr)`;
            }
        }
        
        // 通知父視窗高度變化
        this.notifyHeightChange();
    }
    
    handleKeyPress(e) {
        if (this.lightbox.classList.contains('active')) {
            if (e.key === 'Escape') {
                this.closeLightbox();
            }
        } else if (this.settings.layout === 'slider') {
            if (e.key === 'ArrowLeft') {
                this.prevSlide();
            } else if (e.key === 'ArrowRight') {
                this.nextSlide();
            }
        }
    }
}

// 創建全域實例
const embed = new IGReelsEmbed();

// 暴露必要的方法給 onclick 使用
window.embed = embed;
window.closeLightbox = () => embed.closeLightbox();
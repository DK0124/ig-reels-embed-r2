# IG Reels 嵌入系統

一個免費、開源的 Instagram Reels 嵌入解決方案，使用 Cloudflare R2 + Vercel + GitHub Pages 構建。

## 功能特點

- 🎨 多種展示佈局（網格、輪播、瀑布流）
- 📱 完全響應式設計
- 🚀 全球 CDN 加速
- 💰 完全免費（使用免費額度）
- 🔧 易於自訂和擴展
- 📊 支援多個資料夾管理
- 🎯 無需 Instagram API 認證

## 技術架構

- **前端**: HTML + Vanilla JavaScript（託管在 GitHub Pages）
- **後端**: Node.js Serverless Functions（部署在 Vercel）
- **儲存**: Cloudflare R2（S3 相容的物件儲存）
- **CDN**: Cloudflare 全球網路

## 快速開始

### 1. 設定 Cloudflare R2

1. 登入 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 創建 R2 bucket: `ig-reels-data`
3. 創建 API Token 並獲取憑證
4. 設定 CORS 政策

### 2. 部署後端

```bash
cd backend
npm install
vercel
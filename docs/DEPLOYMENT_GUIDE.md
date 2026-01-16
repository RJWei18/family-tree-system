# 網站建置與部署指南 (Deployment Guide)

## 1. 環境需求
-   **Node.js**: v16.0.0 或以上
-   **npm**: v7.0.0 或以上
-   **Git**: 用於版本控制與推送

## 2. 本地開發 (Local Development)

### 安裝依賴
```bash
npm install
```

### 啟動開發伺服器
```bash
npm run dev
```
啟動後，請瀏覽器開啟 `http://localhost:5173/` (或終端機顯示的 URL)。

## 3. 部署至 GitHub Pages

本專案已設定好自動部署流程，使用 `gh-pages` 套件。

### 3.1 設定 `vite.config.ts`
確保 `base` 路徑正確設定為您的 Repo 名稱：
```typescript
export default defineConfig({
  plugins: [react()],
  base: '/family-tree-system/', // <--- 修改這裡為您的 Repo 名稱
  // ...
})
```

### 3.2 執行部署指令
在終端機執行：
```bash
npm run deploy
```

此指令會自動執行以下步驟：
1.  `npm run build`：編譯 TypeScript 與 React 程式碼，產出靜態檔案至 `dist/` 資料夾。
2.  `gh-pages -d dist`：將 `dist/` 資料夾內容推送到遠端的 `gh-pages` 分支。

### 3.3 確認上線
-   前往 GitHub Repository 的 **Settings** -> **Pages**。
-   確認 "Build and deployment" Source 設為 `Deploy from a branch`。
-   Branch 選擇 `gh-pages` / `root`。
-   等待約 1-2 分鐘，上方會顯示 Live Site URL (例如 `https://username.github.io/family-tree-system/`)。

## 4. 常見部署問題

### 404 Not Found (資源載入失敗)
-   **原因**：通常是 `vite.config.ts` 中的 `base` 路徑設定錯誤。
-   **解法**：確認 `base` 是否與 GitHub Pages 的子路徑一致。

### 404 Not Found (重整頁面)
-   **原因**：GitHub Pages 是靜態與服器，不支援 SPA (Single Page Application) 的 History API 路由。
-   **解法**：
    1.  改用 `HashRouter` (本專案目前的做法)。
    2.  或者在 `public/` 資料夾加入 `404.html` hack script。

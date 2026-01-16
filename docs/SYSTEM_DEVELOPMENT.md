# 系統開發文件 (System Development Documentation)

## 1. 系統簡介
本專案為「家族樹管理系統 (Family Tree System)」，旨在提供一個直覺、視覺化的介面來管理家族成員資料與親屬關係。系統採用現代化前端技術構建，支援 RWD 響應式設計，並部署於 GitHub Pages。

## 2. 技術架構 (Technology Stack)

### 核心框架
-   **Frontend Framework**: React 18
-   **Language**: TypeScript
-   **Build Tool**: Vite

### 狀態與資料管理
-   **State Management**: Zustand (配合 `persist` middleware 進行 LocalStorage 持久化)
-   **Graph Visualization**: ReactFlow (家族樹渲染)
-   **Graph Layout**: Dagre (自動樹狀排版演算法)

### UI 與樣式
-   **Styling**: Tailwind CSS (Utility-first CSS)
-   **Icons**: Lucide React
-   **Animations**: Tailwind CSS Animate (`tailwindcss-animate`)

### 外部整合
-   **Photo Storage**: Google Drive (使用 `thumbnail` API 進行即時預覽)
-   **Data Automation**: Google Apps Script (用於同步 Drive 照片連結至 Excel/CSV)

## 3. 專案結構說明
```
src/
├── components/         # UI 元件
│   ├── common/         # 共用元件 (如 FamilyAvatar.tsx)
│   ├── layout/         # 版面配置 (MainLayout.tsx)
│   ├── members/        # 成員列表相關 (MemberTable.tsx)
│   ├── tools/          # 工具類 (KinshipCalculator.tsx)
│   └── tree/           # 家族樹核心 (FamilyGraph.tsx, CustomNode.tsx)
├── pages/              # 頁面入口 (BirthdayCalendar.tsx, FamilyTree.tsx...)
├── store/              # Zustand 狀態管理 (useFamilyStore.ts)
├── types/              # TypeScript 型別定義
└── utils/              # 工具函式
    ├── dateHelpers.ts  # 日期計算
    ├── generationHelpers.ts # 世代計算
    ├── imageHelpers.ts # 圖片連結轉換
    ├── layout.ts       # Dagre 排版邏輯
    └── zodiac.ts       # 生肖星座計算
```

## 4. 關鍵設計邏輯

### 4.1 家族樹排版 (Dagre Layout)
-   位於 `src/utils/layout.ts`。
-   採用 **"Virtual Node" (虛擬節點)** 策略來處理婚姻關係。
-   **邏輯**：不直接連接配偶，而是建立一個隱形的「婚姻節點」在兩人中間，子女再連接至此婚姻節點，形成 T 字型系譜圖。

### 4.2 圖片處理
-   位於 `src/utils/imageHelpers.ts`。
-   針對 Google Drive 連結進行正規化處理，轉換為 `drive.google.com/thumbnail?id=...` 以避開跨域與權限問題。
-   前端使用 `referrerPolicy="no-referrer"` 確保圖片能順利載入。

### 4.3 效能優化
-   **Granular Selectors**: 在 `CustomNode.tsx` 中使用細粒度的 Zustand selector，確保只有被點擊/高亮的成員節點會重新渲染，大幅提升大型家族樹的操作流暢度。

## 5. 常見問題排錯 (Troubleshooting)

### Q1: 家族樹圖片破圖或無法顯示？
-   **檢查**：確認 `MemberTable` 中的連結是否為 Google Drive 連結。
-   **權限**：確認 Google Drive 檔案權限已設為「知道連結者皆可檢視」。
-   **解決**：使用 `docs/PHOTO_AUTOMATION.md` 中的腳本重新同步連結。

### Q2: 家族樹排版錯亂？
-   **檢查**：是否有「循環參照」的關係 (例如 A 是 B 的父親，B 又是 A 的父親)。
-   **解決**：刪除錯誤的關係，Dagre 演算法無法處理循環依賴。

### Q3: 部署後看到空白頁面？
-   **檢查**：`vite.config.ts` 中的 `base` URL 設定是否正確 (應設為 `/RepoName/`)。
-   **路由**：GitHub Pages 不支援 SPA 路由，若重新整理出現 404，需檢查是否使用了 HashRouter 或建立了 `404.html` 導向 hack。

## 6. 開發與部署
-   **啟動開發伺服器**：`npm run dev`
-   **建置測試**：`npm run build`
-   **部署**：`npm run deploy` (會自動推送 `dist` 資料夾至 `gh-pages` 分支)

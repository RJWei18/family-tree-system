# 🌳 Digital Family Tree System (數位家族樹系統)

一個現代化、互動式的家族樹視覺化系統。專為保存家族歷史設計，支援動態視覺化、即時編輯與雲端同步。

## ✨ 核心特色

*   **互動式家族圖譜**：
    *   基於 `ReactFlow` 與 `Dagre` 的智慧佈局演算法。
    *   支援拖曳、縮放與節點微調。
    *   獨創「愛心錨點 (Heart Anchor)」設計，完美呈現夫妻與子女關係。
*   **完整的成員管理**：
    *   支援新增、編輯、刪除家族成員。
    *   批次操作模式（批量刪除、批量設定父母）。
    *   支援多種性別與詳細個人資料（職業、備註、過世原因）。
*   **資料同步與匯出**：
    *   **Google Sheet 同步**：透過 CSV 發布連結，一鍵同步雲端資料。
    *   **圖像匯出**：支援高解析度 PNG 匯出（內建 CORS 容錯機制）。
    *   **CSV 匯入/匯出**：完整的資料備份方案。
*   **優異的 UI/UX**：
    *   支援明亮/深色模式 (Dark Mode)。
    *   響應式設計，支援手機與桌面操作。
    *   精緻的微互動與動畫效果。

## 🛠️ 技術棧 (Tech Stack)

*   **Frontend**: React 18, TypeScript, Vite
*   **Visualization**: ReactFlow, Dagre.js (Layout Engine)
*   **State Management**: Zustand
*   **Styling**: TailwindCSS, Lucide React (Icons)
*   **Data Handling**: PapaParse (CSV), html-to-image (Export)

## 🚀 快速啟動 (Quick Start)

### 1. 環境需求
*   Node.js (v16+)
*   npm (v7+)

### 2. 安裝依賴
```bash
npm install
```

### 3. 啟動開發伺服器
```bash
npm run dev
```
打開瀏覽器訪問 `http://localhost:5173`。

### 4. 部署 (GitHub Pages)
```bash
npm run deploy
```

## 📂 專案結構

*   `src/components/tree`: 家族樹核心組件 (CustomNode, FamilyGroupNode, HeartAnchorNode)。
*   `src/utils/layout.ts`: 核心佈局演算法 (Dagre 整合 + 幾何中心計算)。
*   `src/store`: 全域狀態管理 (useFamilyStore)。
*   `docs/`: 詳細系統文件。

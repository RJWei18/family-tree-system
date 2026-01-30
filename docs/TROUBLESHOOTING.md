# 🔧 疑難排解與常見問題 (Troubleshooting)

本文件記錄開發過程中遇到的技術問題及其解決方案。

## 1. 圖像匯出失敗 (Image Export Failure)

### 症狀
點擊「匯出圖片」按鈕後沒有反應，或顯示 "Network/CORS Error"。

### 原因
`html-to-image` 套件在繪製 Canvas 時，若遇到跨域 (CORS) 且未設定 `Access-Control-Allow-Origin` 的外部圖片資源，會因為安全性限制由瀏覽器阻擋請求，導致繪製流程中斷。

### 解決方案
我們在 `ExportButton.tsx` 中實作了三層防護機制：
1. **移除 `cacheBust`**：避免對本地 Blob URL 強制刷新導致的存取錯誤。
2. **自動重試 (Retry Logic)**：若第一次高解析度匯出失敗，系統會嘗試降級（移除字型、降低像素比）再次匯出。
3. **Placeholder 替換 (CORS Strategy)**：
   若圖片載入仍失敗 (Network Error)，系統會自動攔截錯誤，並將無法讀取的圖片替換為內建的 `PLACEHOLDER_IMAGE` (Base64 空白圖)。這確保了即使照片壞掉，使用者仍能取得完整的家族結構圖。

## 2. 節點重疊與佈局 (Layout Overlap)

### 症狀
在成員眾多的情況下，子女節點或配偶節點發生重疊。

### 解決方案
調整了 `src/utils/layout.ts` 中的各種間距參數：
*   **`nodesep` (節點橫向間距)**：設為 `80`。這提供了足夠的 breathing room。雖然曾嘗試縮減至 15 以求緊湊，但會導致視覺混亂。
*   **`ranksep` (層級縱向間距)**：設為 `100`。
*   **權重策略 (Edge Weight)**：
    *   親子連線 (Lineage) 權重設為 `20`，強制垂直對齊。
    *   夫妻連線 (Spouse) 權重設為 `5`，確保他們靠在一起但優先級低於代際關係。

## 3. Google Sheet 資料不同步

### 症狀
在 Google Sheet 新增了「職業」或「備註」欄位，但系統讀取後沒有顯示。

### 原因
CSV 解析器是根據標題列 (Header) 來對應欄位。如果 Google Sheet 的第一列標題與程式碼定義的 Key 不一致，資料就會被忽略。

### 解決方案
確保 Google Sheet 第一列包含以下精確標題（不含引號）：
*   `職業`
*   `備註`
*   `過世原因`
*   `出生日期` (格式建議 YYYY-MM-DD)
*   `死亡日期`
*   `狀態` (填寫 "殁" 會觸發黑色外框)

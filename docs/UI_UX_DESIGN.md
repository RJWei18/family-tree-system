# UI/UX 設計文件 (UI/UX Design Documentation)

## 1. 設計核心理念 (Design Principles)
-   **Warm & Heritage (溫暖與傳承)**：使用暖色系背景 (`#F9F4E8`) 與紙張質感，營造家族歷史的溫馨氛圍，避免許多管理後台的冷硬科技感。
-   **Clarity (清晰直覺)**：在複雜的家族樹狀結構中，透過「呼吸燈效」與「路徑高亮」來引導使用者視線，讓人能一眼辨識當前聚焦的成員及其關係。
-   **Responsive (響應式)**：確保在桌面大螢幕能綜觀全貌，在手機上也能透過卡片式清單輕鬆查找資料。

## 2. 色彩系統 (Color System)

### 主色調 (Primary Specs)
-   **Violet (紫羅蘭)**：用於主要按鈕、選取狀態。象徵高貴與智慧。
    -   Primary: `violet-600` (#7C3AED)
    -   Light: `violet-50` (用於 Hover 背景)
-   **Amber (琥珀金)**：用於高亮、呼吸燈效。象徵溫暖與榮耀。
    -   Highlight: `#FAD089`

### 中性色 (Neutrals)
-   **Slate (岩灰色)**：用於文字與邊框，提供良好的閱讀對比度，比純黑柔和。
    -   Text: `slate-700`
    -   Border: `slate-200`
-   **Paper (紙張底色)**：
    -   Background: `#F9F4E8` (米黃色，模擬紙張質感)

### 功能色 (Functional Colors)
-   **Gender**:
    -   Male: `sky-600` (天藍)
    -   Female: `pink-600` (粉紅)
    -   Deceased: `grayscale` (黑白/低飽和度)
-   **Generation (世代標籤)**:
    -   Gen 1: `Amber` (金)
    -   Gen 2: `Sky` (藍)
    -   Gen 3: `Emerald` (綠)

## 3. 字體規範 (Typography)
-   **Font Family**: 優先使用系統內建無襯線字體，確保跨平台載入速度。
    -   `system-ui`, `-apple-system`, `PingFang TC` (macOS 繁黑), `Microsoft JhengHei` (微軟正黑)。
-   **Weights**:
    -   Bold (700): 用於姓名、標題。
    -   Medium (500): 用於按鈕、標籤。
    -   Regular (400): 用於一般內文。

## 4. 關鍵元件設計 (Component Guidelines)

### 4.1 成員頭像 (FamilyAvatar)
-   **尺寸規範**：
    -   列表/Sidebar: `48px` (md)
    -   家族樹節點: `80px` (lg)
    -   Grid View: `24px` (sm)
-   **互動設計**：
    -   **Hover Preview**：滑鼠停留在小頭像上時，會浮出放大預覽圖 (Scale 1.05 + Shadow)。
    -   **Fallback**：若無圖片，顯示帶有性別顏色的文字縮寫。
-   **已故狀態 (Deceased Styling)**：
    -   **Grayscale**: 圖片轉為灰階 (`grayscale`)。
    -   **Dashed Border**: 外框改為虛線 (`border-dashed`)。
    -   **Memorial Icon**: 右上角標示蠟燭/絲帶圖示 (`†`)。

### 4.2 家族樹節點 (CustomNode)
-   **視覺層次**：
    1.  **頭像**：視覺中心，最大最顯眼。
    2.  **姓名緞帶**：位於頭像下方，白底黑字，清晰易讀。已故者背景為灰色。
    3.  **輔助資訊**：年齡/生肖以小字顯示於姓名下方。
-   **高亮狀態 (Focus State)**：
    -   當選取某成員時，啟動 `BreathingHalo` (呼吸光環) 動畫。
    -   光環由內向外擴散，使用 Amber 色調，模擬生命力。

### 4.3 愛心錨點 (HeartAnchor)
用於連接夫妻關係並作為子女連線的起點：
-   **動態置中**：透過 JavaScript 計算，永遠位於配偶雙方的幾何中心點。
-   **視覺設計**：粉色愛心圖示，象徵愛的結晶。
-   **連線邏輯**：
    -   **Spouse Edge**: 夫妻之間使用直線 (`straight`) 連接。
    -   **Child Edge**: 從愛心下方出發，使用平滑階梯線 (`smoothstep`) 連接至子女上方。

### 4.4 卡片與容器
-   **Glassmorphism (毛玻璃)**：
    -   側邊欄與浮動面板採用 `bg-white/90` + `backdrop-blur`。
    -   讓背景的家族樹線條能微微透出，增加層次感而不干擾閱讀。
-   **Rounded Corners**：
    -   統一使用 `rounded-xl` (12px) 或 `rounded-2xl` (16px)，營造親切柔和的感覺。

## 5. RWD 響應策略
-   **Desktop**: 顯示完整側邊欄與家族樹畫布。
-   **Mobile**: 
    -   側邊欄收折為漢堡選單 (Dialog)。
    -   家族樹支援觸控拖曳 (Touch Gestures)。
    -   部分表格欄位 (如世代、詳細日期) 在手機上自動隱藏，保留核心資訊。

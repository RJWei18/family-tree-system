# 家族樹照片自動化同步指南 (Google Apps Script)

這份指南提供了一段 Google Apps Script 腳本，能協助您自動將 Google Drive 資料夾中的照片連結，同步到 Google Sheets 的成員名單中。

## 核心功能

1.  **自動匹配**：根據照片檔名（例如 `魏錕源.jpg`）自動匹配成員名字。
2.  **自動權限**：自動將照片權限設為「知道連結者皆可檢視 (Anyone with link)」。
3.  **自動填寫**：將公開的圖片連結直接填入 Excel 對應欄位。

---

## 設定步驟

### 第一步：準備 Google Drive 資料夾
1.  在 Google Drive 建立一個資料夾（例如命名為 `FamilyPhotos`）。
2.  將成員照片上傳到此資料夾。
    *   **重要**：檔名必須包含成員名字，例如 `魏錕源.jpg` 或 `魏錕源_2024.png`。
    *   腳本會搜尋檔名是否「包含」成員名字。

### 第二步：安裝腳本到 Google Sheet
1.  開啟您的家族樹 Google Sheet。
2.  點選上方選單的 **「擴充功能 (Extensions)」** > **「Apps Script」**。
3.  在開啟的編輯器中，刪除原本的內容，並貼上後方的 **程式碼**。
4.  在程式碼最上方，填入您的 **資料夾 ID**。
    *   資料夾 ID 是網址列最後一段亂碼：`drive.google.com/drive/folders/【這裡就是 ID】`
5.  按磁片圖示 **存檔**，專案名稱可取名為「照片同步工具」。

### 第三步：執行同步
1.  回到 Google Sheet 頁面，重新整理網頁。
2.  您會看到上方多了一個 **「家族樹工具」** 的選單（可能需要等幾秒鐘）。
3.  點選 **「家族樹工具」** > **「更新照片連結」**。
4.  初次執行會要求 **授權**，請依序點選「繼續」> 選擇帳號 >「進階」>「前往... (不安全)」>「允許」。
    *   *註：這是因為腳本是您自己寫的，Google 會做標準的安全提醒，請放心使用。*
5.  腳本執行完畢後，會跳出視窗告知成功更新了幾筆資料。

---

## Google Apps Script 程式碼

請複製以下程式碼：

```javascript
// ==========================================
// 設定區域 (請修改這裡)
// ==========================================
const CONFIG = {
  // 請將下方引號內的亂碼換成您的 Google Drive 照片資料夾 ID
  FOLDER_ID: '1xXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', 
  
  // Google Sheet 中的欄位名稱設定
  SHEET_NAME: '成員名單', // 您的工作表名稱 (Sheet1 或 Members)
  COL_NAME_ID: 'Name',   // 名字所在的欄位標題 (例如 firstName 或 Name)
  COL_PHOTO_ID: 'Photo', // 照片連結要填入的欄位標題 (例如 photoUrl)
  
  // 是否覆蓋原本已經有照片的欄位？ (true: 覆蓋, false: 跳過)
  OVERWRITE_EXISTING: false 
};

// ==========================================
// 主程式 (以下不需要修改)
// ==========================================

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('家族樹工具')
    .addItem('更新照片連結', 'syncPhotosFromDrive')
    .addToUi();
}

function syncPhotosFromDrive() {
  const ui = SpreadsheetApp.getUi();
  const folderId = CONFIG.FOLDER_ID;
  
  if (!folderId || folderId.includes('XXX')) {
    ui.alert('設定錯誤', '請先在腳本中設定正確的 FOLDER_ID (Google Drive 資料夾 ID)', ui.ButtonSet.OK);
    return;
  }

  try {
    const folder = DriveApp.getFolderById(folderId);
    const files = folder.getFiles();
    const photoMap = new Map();

    // 1. 建立照片索引 (檔名 -> 檔案物件)
    while (files.hasNext()) {
      const file = files.next();
      const name = file.getName(); // e.g., "魏錕源.jpg"
      const cleanName = name.split('.')[0].trim(); // "魏錕源"
      photoMap.set(cleanName, file);
    }

    // 2. 讀取 Sheet 資料
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME);
    if (!sheet) {
      ui.alert('錯誤', `找不到名為 "${CONFIG.SHEET_NAME}" 的工作表，請檢查名稱。`, ui.ButtonSet.OK);
      return;
    }

    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    const headers = values[0];

    // 找欄位索引
    const nameIndex = headers.indexOf(CONFIG.COL_NAME_ID);
    const photoIndex = headers.indexOf(CONFIG.COL_PHOTO_ID);

    if (nameIndex === -1 || photoIndex === -1) {
      ui.alert('錯誤', `找不到指定欄位。請確認第一列標題包含 "${CONFIG.COL_NAME_ID}" 和 "${CONFIG.COL_PHOTO_ID}"`, ui.ButtonSet.OK);
      return;
    }

    let updateCount = 0;

    // 3. 逐列比對更新
    for (let i = 1; i < values.length; i++) {
      const rowName = String(values[i][nameIndex]).trim();
      const currentPhoto = values[i][photoIndex];

      if (!rowName) continue;
      
      // 如果已經有照片且設定不覆蓋，則跳過
      if (currentPhoto && !CONFIG.OVERWRITE_EXISTING) continue;

      // 在照片庫中尋找
      // 策略：完全匹配 > 包含匹配
      let matchedFile = photoMap.get(rowName);
      
      if (!matchedFile) {
        // 嘗試部分匹配 (例如檔名是 "魏錕源_old.jpg")
        for (const [fName, file] of photoMap.entries()) {
          if (fName.includes(rowName)) {
            matchedFile = file;
            break;
          }
        }
      }

      if (matchedFile) {
        // 設定權限為公開 (如果尚未公開)
        try {
           matchedFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        } catch (e) {
           // 可能是已經公開或是權限不足，略過錯誤
           console.log(`權限設定警告: ${rowName}`);
        }
        
        // 取得下載連結
        // 這裡我們直接用標準的 view 連結，前端 imageHelpers 會自動處理它
        const url = matchedFile.getUrl();
        
        // 寫入儲存格 (i + 1 因為陣列是 0-base 但 Sheet 是 1-base)
        sheet.getRange(i + 1, photoIndex + 1).setValue(url);
        updateCount++;
      }
    }

    ui.alert('同步完成', `成功更新了 ${updateCount} 位成員的照片連結！`, ui.ButtonSet.OK);

  } catch (error) {
    ui.alert('發生錯誤', error.toString(), ui.ButtonSet.OK);
  }
}
```

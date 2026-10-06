# 沙漏圖（Hourglass View）開發規格書

| 項目 | 內容 |
|:---|:---|
| 專案 | family-tree-system（React 19 + TypeScript + Vite 7 + ReactFlow 11 + Zustand 5） |
| 基準版本 | `main` @ `474d6c9`（PIN 保護版，已定版並推送） |
| 開發分支 | `feature/hourglass-view`（自 `main` 建立，禁止直接改 `main`） |
| 文件目的 | 讓其他開發者／model 不需額外詢問即可實作並驗證 |
| 撰寫日期 | 2026-10-06 |

---

## 1. 背景與目標

### 1.1 問題
現有「全家族圖」使用 Dagre 對整個關係圖做單一平面排版，在下列資料特性下會失效：

1. 家系深達 6 代。
2. 同時存在父系、母系、配偶（岳家）三個以上家系。
3. 一個人同時有「自己的父母」與「配偶的父母」兩條來源，圖不再是樹，而是網。Dagre 為了避免重疊與交錯，會把子女推到離父母很遠的位置。

已嘗試的做法（改 ranker、提高親子權重、事後置中與推擠）皆無實質改善，原因是演算法類型不對，而不是參數問題。**不得再以調整 Dagre 參數作為解法。**

### 1.2 目標
在「家族樹」頁面下新增第二種檢視模式「沙漏圖」，以單一焦點人物為中心：

- 往上顯示該人物的直系祖先（預設 3 代）。
- 往下顯示該人物的所有後代（可折疊）。
- 配偶只顯示本人；配偶的娘家／夫家以徽章表示，點擊後切換焦點進入。
- 任何時刻畫面都是「樹」，因此可用確定性的樹狀排版，保證子女在父母正下方、節點不重疊。

### 1.3 非目標
- 不修改既有「全家族圖」的任何行為與程式碼。
- 不做 3D、不做多圖層疊加。
- 不改資料來源與 Google Sheet 欄位格式，不改 PIN 流程。
- 第一版不做旁系（手足、叔伯姑姨）的就地展開，旁系透過「切換焦點到共同祖先」查看（見 D5）。

---

## 2. 已定案決策

| 編號 | 決策 | 來源 |
|:---|:---|:---|
| D1 | 採用「沙漏圖 + 折疊 + 換焦點」；全家族圖保留不動 | 使用者確認 |
| D2 | 沙漏圖做在「家族樹」頁面下，以頁首的分段切換（全家族圖 / 沙漏圖）進入，不新增頂層導覽項 | 使用者確認 |
| D3 | 預設焦點人物：魏子傑；向上預設 3 代 | 使用者確認 |
| D4 | 三個書籤，名稱固定為：「我的家系」、「母系」、「配偶家系」。書籤以「首頁人物」為基準（因為首頁人物可能是女性，配偶家系即其夫家） | 使用者確認 |
| D5 | 旁系不就地展開。要看父親那邊兄弟姊妹各自的家庭，就把焦點切換到父親（其後代即包含全部手足與其家庭）。這是沙漏圖的原生特性 | 設計決策 |
| D6 | 配偶的上代（岳家／夫家）與「更多祖先」一律以「切換焦點」進入，不就地展開 | 設計決策 |
| D7 | 每個人物最多畫一次；重複出現者畫成「參照節點（ghost）」，不再遞迴展開 | 設計決策 |
| D8 | 沙漏圖節點固定位置、不可拖曳（確保結果可重現、可驗證） | 設計決策 |
| D9 | 版面為純函式（輸入資料與選項，輸出座標），與 React 完全分離，可單元測試 | 設計決策 |

待確認但不阻擋開發的預設值見第 14 節。

---

## 3. 名詞定義

| 名詞 | 定義 |
|:---|:---|
| 焦點人物（focus） | 沙漏圖的中心人物，所在列為第 0 列 |
| 首頁人物（home） | 書籤的基準人物，預設魏子傑，可由使用者「設為首頁」改變 |
| 列（row） | 世代列。焦點為 0，祖先為負數（-1 為父母），後代為正數（+1 為子女） |
| 單元（Unit） | 一列中相鄰顯示的一組人物：一對夫妻、單親，或一人加其配偶們。版面的最小排版單位 |
| 血緣人物（blood person） | 單元中屬於焦點血緣線的那一位；其餘為配偶 |
| 愛心錨點（heart） | 一對夫妻中心的愛心節點，子女連線的出發點（沿用既有 `HeartAnchorNode`） |
| 範圍（extent） | 單元連同其整個子樹相對於單元中心 x 的 `[left, right]` 水平範圍 |
| 徽章（badge） | 疊在畫面上的小型互動節點：切換焦點入口、折疊／展開開關 |
| 參照節點（ghost） | 已在畫面其他位置出現的人物的簡化重複節點 |

---

## 4. 使用者流程

### 4.1 進入與預設狀態
1. 登入（PIN）後進入「家族樹」頁，預設為「沙漏圖」，並記住使用者上次的選擇。
2. 焦點為首頁人物；向上 3 代、向下 3 代；畫面自動 `fitView`。
3. 頁首右側可切換「全家族圖」，回到現行畫面（行為不變）。

### 4.2 沙漏圖畫面配置
```
+----------------------------------------------------------------------------------+
| 家族樹狀圖                                        [ 全家族圖 | (沙漏圖) ]            |  <- 既有頁首 + 切換
+----------------------------------------------------------------------------------+
| < 返回  魏子傑 > 母親 > 外公        [我的家系][母系][配偶家系]   上:[3] 下:[3] 設為首頁 |  <- HourglassToolbar
+----------------------------------------------------------------------------------+
| [搜尋成員...]                                                    [匯出圖片]        |
|                                                                                  |
|            曾祖輩 (第 -3 列)   [更多祖先 >]                                      |
|                 祖輩 (第 -2 列)                                                   |
|                    父母 (第 -1 列)                                                |
|              [魏子傑]--愛心--[配偶]  [配偶家系 >]       (第 0 列)                  |
|                      |                                                           |
|                  子女們 (第 +1 列)   [-]                                          |
|                      |                                                           |
|                  孫輩 (第 +2 列)     [+4 後代]                                    |
|                                          [ 以此人為焦點 ]  <- 選取節點後出現       |
+----------------------------------------------------------------------------------+
```

### 4.3 互動規則
| 操作 | 結果 |
|:---|:---|
| 點擊人物節點 | 選取並高亮（沿用 `highlightedMemberId`），底部出現「以此人為焦點」按鈕 |
| 按「以此人為焦點」，或雙擊人物節點 | 切換焦點；舊焦點壓入麵包屑歷史 |
| 點「配偶家系 >」徽章 | 焦點切換為該配偶（等同進入配偶那邊的圖層） |
| 點「更多祖先 >」徽章 | 焦點切換為該祖先 |
| 點「[-]」徽章 | 折疊該人物的後代，改顯示「[+N 後代]」 |
| 點「[+N 後代]」徽章 | 展開該人物的後代 |
| 點麵包屑某一層 | 焦點跳回該層，其後的歷史被截斷 |
| 按「返回」 | 回到上一個焦點 |
| 點書籤 | 以首頁人物為基準切換焦點（見 4.4），並重置歷史為 `[首頁人物, 目標]` 或 `[首頁人物]` |
| 搜尋並選取成員 | 若該人物目前可見：高亮並定位；若不可見：切換焦點到該人物 |
| 上／下代數選單 | 變更顯示代數，清除手動折疊／展開覆寫，重新排版 |
| 設為首頁 | 將目前焦點存為首頁人物（localStorage） |

### 4.4 書籤定義
| 書籤 | 目標焦點 | 停用條件 |
|:---|:---|:---|
| 我的家系 | 首頁人物 (Home) 本人 | 無 |
| 母系 | 目前焦點人物 (Focus) 的母親（`parentsOf[Focus]` 中性別為女者） | 焦點人物沒有已登錄的母親 |
| 配偶家系 | 目前焦點人物 (Focus) 的配偶；若有多位，點擊後以下拉選單選擇 | 焦點人物沒有配偶 |

目前焦點等於書籤目標時，該書籤顯示為選取狀態。停用書籤要顯示原因（tooltip：「尚未登錄母親」等）。

---

## 5. 資料模型

不更動既有 `Member`、`Relationship` 型別（`src/types/index.ts`）。注意現有資料特性：

- CSV 匯入時姓名全部放在 `firstName`，`lastName` 為空字串。查人名一律用 `` `${lastName}${firstName}`.trim() ``。
- `Relationship` 的 `parent` 類型：`sourceMemberId` 為父或母，`targetMemberId` 為子女。
- `spouse` 類型可能只存單向，也可能雙向，需去重。
- CSV 中的父親ID／母親ID／配偶ID 可能指向不存在的成員，建索引時必須過濾。

### 5.1 衍生索引（`familyIndex.ts`）
```ts
export interface FamilyIndex {
  members: Record<string, Member>;
  parentsOf: Record<string, string[]>;   // childId -> [父, 母]，最多 2 筆，已排序（見下）
  childrenOf: Record<string, string[]>;  // parentId -> childId[]，依出生日期遞增，缺日期者排最後，再依 id
  spousesOf: Record<string, string[]>;   // personId -> spouseId[]，去重，依 id 排序
}
export const buildFamilyIndex: (
  members: Record<string, Member>,
  relationships: Relationship[],
) => FamilyIndex;
```

建索引規則：
1. 忽略兩端任一不存在於 `members` 的關係。
2. 忽略自我關係（source 等於 target）。
3. `parentsOf[child]` 排序：性別為 male 者在前、female 在後、other 依 id 補位。超過 2 位父母時取前 2 位，並以 `console.warn` 提示一次（含 child id）。
4. 所有輸出陣列一律明確排序，**不得依賴物件鍵順序**，以保證確定性。

### 5.2 可見集合模型（`hourglassModel.ts`）
```ts
export type UnitRole = 'focus' | 'ancestor' | 'descendant';

export interface UnitMember {
  id: string;          // 人物 id
  ghost: boolean;      // true 表示參照節點
  nodeId: string;      // 實際節點 id：真實人物為 id；ghost 為 `ghost:${id}:${序號}`
}

export interface Unit {
  id: string;                 // `u:${members 的 id 以 + 串接}`，ghost 重複時加序號
  role: UnitRole;
  row: number;                // 0 焦點、負祖先、正後代
  members: UnitMember[];      // 由左至右；血緣人物位置見 7.1
  bloodIndex: number;         // 血緣人物在 members 中的索引（祖先單元為 -1）
}

export interface ParentLink {
  fromUnitId: string;
  fromPair: string[];         // 長度 2：由該對夫妻的 heart 出發；長度 1：由該人物 bottom 出發
  toNodeId: string;           // 子女節點 id（真實或 ghost）
}

export type BadgeKind = 'inlaw' | 'moreAncestors' | 'collapsed' | 'collapseToggle';
export interface BadgeSpec {
  id: string;
  kind: BadgeKind;
  anchorNodeId: string;       // 疊在哪個人物節點旁
  targetMemberId: string;     // inlaw / moreAncestors：點擊後要切換到的人物；collapsed / collapseToggle：折疊對象
  count?: number;             // collapsed：被隱藏的後代總數
}

export interface HourglassModel {
  focusId: string;
  units: Unit[];
  links: ParentLink[];
  badges: BadgeSpec[];
}

export interface HourglassOptions {
  focusId: string;
  ancestorDepth: number;                  // 預設 3，可選 2 到 5
  descendantDepth: number | null;         // 預設 3，null 表示不限
  collapsedOverride: ReadonlySet<string>; // 使用者手動折疊的人物 id
  expandedOverride: ReadonlySet<string>;  // 使用者手動展開（超過預設深度）的人物 id
}
export const buildHourglassModel: (index: FamilyIndex, opts: HourglassOptions) => HourglassModel;
```

---

## 6. 可見集合建構規則（`buildHourglassModel`）

走訪順序固定為：焦點單元 → 祖先（廣度或深度皆可，但須固定）→ 後代（深度優先，子女依 `childrenOf` 順序）。以一個 `visited: Set<string>` 保證每人只畫一次，後到者畫成 ghost。

### 6.1 焦點單元（第 0 列）
- `members = [焦點本人, ...配偶們]`，配偶依 `spousesOf` 順序。
- 版面位置：第 1 位配偶在焦點右側，第 2 位在左側，之後交替，確保每一對夫妻相鄰（見 7.1）。超過 2 位配偶時，第 3 位起放在最右側，不畫愛心，其子女掛在焦點的 bottom 控點。
- 對每位有已登錄父母的配偶，加入 `inlaw` 徽章（錨定該配偶）。

### 6.2 祖先（第 -1 到 -ancestorDepth 列）
```
anc(person, row):
  parents = parentsOf[person]
  if parents 為空: return
  if row < -ancestorDepth:
      加入 moreAncestors 徽章（錨定 person，target = person）; return
  unit = 新 Unit(role 'ancestor', row, members = parents 逐一建立；已 visited 者標為 ghost)
  links.push({ from: unit, pair: [兩位父母的 id] 或 [單親 id], to: person 的節點 })
  對 unit 中每位「非 ghost」的父母 p:  visited.add(p); anc(p, row - 1)
```
- 祖先單元只放「該路徑上子女的生父與生母」，祖先的其他配偶不顯示。
- 父母即使沒有登錄 spouse 關係，仍視為一對並畫愛心（資料常只登錄親子關係）。

### 6.3 後代（第 +1 列起）
```
desc(blood, unit, depthBelowFocus):
  kids = childrenOf[blood]
  if kids 為空: return
  if 實際折疊(blood, depthBelowFocus):
      加入 collapsed 徽章 (count = 被隱藏後代總數); return
  加入 collapseToggle 徽章（錨定 blood）
  依「另一位家長」分組（另一位家長在 unit.members 中則該組掛在該對 heart；否則掛 blood 的 bottom）
  組別順序與 unit 內配偶由左至右順序一致，組內依 childrenOf 順序
  對每位 kid:
      kidUnit = 新 Unit(role 'descendant', row+1, members = [kid, ...kid 的配偶們])
      已 visited 者標為 ghost（ghost 不遞迴）
      對 kid 的每位有父母的配偶加入 inlaw 徽章
      desc(kid, kidUnit, depthBelowFocus + 1)
```
- 子女只計入血緣人物自己的孩子。配偶與他人所生的孩子不計入（屬於配偶自己的單元）。
- 實際折疊判斷：
  - `collapsedOverride.has(blood)` 為真，折疊。
  - 否則 `expandedOverride.has(blood)` 為真，展開。
  - 否則依深度：`descendantDepth !== null && depthBelowFocus >= descendantDepth` 時折疊。
  - `depthBelowFocus` 為 blood 所在列相對焦點列的距離（焦點本人為 0，其子女為 1）。
- 被隱藏後代總數需以獨立遞迴計算（含防循環），並與可見集合排除重複。

### 6.4 邊界情況清單（每項必須有對應測試）
| 編號 | 情況 | 預期行為 |
|:---|:---|:---|
| EC-01 | 焦點沒有父母 | 無祖先列，只有第 0 列與後代 |
| EC-02 | 只有一位父母已登錄 | 祖先單元只有單一人物 |
| EC-03 | 父母之間沒有 spouse 關係 | 仍視為一對，畫愛心 |
| EC-04 | 近親通婚（同一人從父母兩側都是祖先） | 第二次出現畫 ghost，不遞迴 |
| EC-05 | 配偶 0、1、2、3 位以上 | 依 6.1 規則排列，不重疊，愛心只畫在相鄰對 |
| EC-06 | 資料循環（A 是 B 的父母，B 又是 A 的父母） | 不得無窮遞迴，測試需有逾時保護 |
| EC-07 | 某人有 3 位以上父母紀錄 | 取前 2 位並警告一次 |
| EC-08 | 配偶與他人所生子女 | 不出現在焦點後代中 |
| EC-09 | 成員缺出生日期 | 排在同胞最後，再依 id |
| EC-10 | 資料為空 | 顯示空狀態，不崩潰 |
| EC-11 | 同步資料後焦點人物消失 | 回退到首頁人物；仍不存在則顯示人物選擇空狀態 |
| EC-12 | 首頁人物姓名重複 | 取 id 排序第一位，並 `console.warn` |
| EC-13 | 同一人既是配偶又是血緣後代（家族內通婚） | 第二次出現畫 ghost |
| EC-14 | 關係指向不存在的成員 id | 忽略 |
| EC-15 | 重複的 spouse 紀錄（雙向各一筆） | 去重為一對 |
| EC-16 | 500 位成員的資料量 | 建模加版面總時間在測試環境 < 500ms（寬鬆門檻，避免不穩定） |

---

## 7. 版面演算法（`hourglassLayout.ts`，純函式）

### 7.1 常數（`constants.ts`，數值對照 `src/utils/layout.ts`，**不得 import 該檔**，以免耦合）
```ts
export const MEMBER_WIDTH = 120;   // 對照 index.css .family-node-container
export const HEART_WIDTH  = 32;
export const SLOT_WIDTH   = 180;   // 單元內每位成員佔位寬度
export const HEART_Y_OFFSET = 24;  // 愛心 y = 成員 y + 24（對照 layout.ts：成員 y=50、愛心 y=74）
export const ROW_PITCH    = 280;   // 列距；初值，需依實際畫面微調，但一律用常數
export const SIBLING_GAP  = 40;    // 相鄰子樹 / 相鄰單元的水平間距
export const BADGE_ABOVE_Y = -36;  // 徽章在人物上方的 y 偏移（inlaw、moreAncestors）
export const BADGE_BELOW_Y = 128;  // 徽章在人物下方的 y 偏移（collapsed、collapseToggle）
```

單元寬度：`unitWidth = members.length * SLOT_WIDTH`。
單元內成員中心 x：`center_i = unitCenter - unitWidth/2 + i*SLOT_WIDTH + SLOT_WIDTH/2`。
React Flow `position.x = center_i - MEMBER_WIDTH/2`，`position.y = row * ROW_PITCH`。
愛心（兩位相鄰成員 a、b）：`position.x = (center_a + center_b)/2 - HEART_WIDTH/2`，`position.y = row*ROW_PITCH + HEART_Y_OFFSET`。

血緣人物在後代／焦點單元中的位置：配偶依序放右、左、右、左…，使每一對夫妻相鄰。例：配偶 2 位時 `members = [配偶2, 血緣, 配偶1]`；3 位時 `[配偶2, 血緣, 配偶1, 配偶3]`（配偶3 無愛心）。

### 7.2 範圍（extent）
```ts
interface Extent { left: number; right: number }   // 相對於該單元中心
```

### 7.3 後代版面（由下往上算範圍，再由上往下定位）
```
extentDesc(unit):
  children = unit 的子單元（依 6.3 順序）
  for child in children: ext[child] = extentDesc(child)
  cursor = 0
  for child in children:
      offset[child] = cursor - ext[child].left          # 子單元中心相對「子區塊左端」
      cursor = offset[child] + ext[child].right + SIBLING_GAP
  blockLeft  = min over child (offset[child] + ext[child].left)   # 即 0
  blockRight = cursor - SIBLING_GAP
  shift = -(blockLeft + blockRight) / 2                          # 讓子區塊以單元中心為中心
  for child: offset[child] += shift
  half = unitWidth(unit) / 2
  return { left: min(-half, blockLeft + shift), right: max(half, blockRight + shift) }

placeDesc(unit, cx):
  unit.cx = cx
  for child: placeDesc(child, cx + offset[child])
```
- 沒有子女或已折疊：範圍為單元自身 `[-half, half]`。
- 保證：同一單元的所有子女在正下一列、彼此連續、整組以父母單元為中心；不同子樹的範圍互不重疊，因此不需要任何事後推擠。

### 7.4 祖先版面（往上）
```
extentAnc(unit):
  對 unit.members 中每位非 ghost 且有上一代單元 pu 的成員 m: ext[pu] = extentAnc(pu)
  理想位置 ideal[pu] = m 的中心 x（相對 unit 中心）
  若同時有兩個上一代單元 pa（左）、pb（右）:
      need = ext[pa].right + SIBLING_GAP - ext[pb].left          # 兩單元中心至少要相距 need
      gap  = ideal[pb] - ideal[pa]
      if gap < need: 兩者各向外位移 (need - gap) / 2
  offset[pu] = 位移後位置
  return union( [-unitWidth/2, unitWidth/2], 每個 pu 的 [offset + ext.left, offset + ext.right] )

placeAnc(unit, cx):
  unit.cx = cx
  for pu: placeAnc(pu, cx + offset[pu])
```
- 祖先單元最多 2 位成員，因此每個單元最多 2 個上一代單元，位移只需處理一對。
- 保證：夫妻在每一代都相鄰；上一代單元不重疊；左右順序與子女順序一致，連線不交叉（見不變量 I10）。

### 7.5 組合
1. 令焦點人物中心 `x = 0`，焦點單元中心 `U0.cx = -(焦點在單元內的偏移)`。
2. 焦點的父母單元 `U1` 置中於焦點人物正上方（`U1.cx = 0`），再遞迴 `placeAnc`。
3. 後代以 `U0.cx` 為中心 `placeDesc`。
4. 祖先在負列、後代在正列，不同列不互相影響；第 0 列只有焦點單元。

### 7.6 徽章與連線
- `inlaw`、`moreAncestors`：x 對齊錨定人物中心，y = 列 y + `BADGE_ABOVE_Y`。
- `collapsed`、`collapseToggle`：x 對齊血緣人物中心，y = 列 y + `BADGE_BELOW_Y`。
- 配偶連線：相鄰成員之間 `straight`，source handle `right`，target handle `left`。
- 親子連線：source 為該對的愛心（handle `bottom`）或單親人物（handle `bottom`），target 為子女（handle `top`），類型 `smoothstep`，`pathOptions: { borderRadius: 20, offset: 25 }`，stroke `#8D6E63`、寬 2；來源已過世時虛線、opacity 0.6。樣式常數複製自 `layout.ts`，愛心樣式（`active`、`widowed`、`deceased`）判斷邏輯同 `layout.ts` 第 142–147 行。

### 7.7 輸出
```ts
export interface PositionedNode {
  id: string;
  kind: 'member' | 'ghost' | 'heart' | 'badge';
  x: number; y: number;            // React Flow position（左上角）
  width: number; height: number;
  row: number;
  payload: unknown;                // member / heartVariant / BadgeSpec
}
export interface PositionedEdge { id: string; source: string; target: string; sourceHandle: string; targetHandle: string; kind: 'spouse' | 'lineage'; dashed: boolean }
export interface LayoutResult { nodes: PositionedNode[]; edges: PositionedEdge[]; bounds: { minX: number; maxX: number; minY: number; maxY: number } }
export const layoutHourglass: (model: HourglassModel, index: FamilyIndex) => LayoutResult;
```
輸出必須完全確定：同樣輸入產生逐位元相同的結果（座標以 `Math.round(x*100)/100` 取兩位小數）。

---

## 8. 元件設計

### 8.1 新增元件
| 元件 | 路徑 | 說明 |
|:---|:---|:---|
| `HourglassView` | `src/components/tree/hourglass/HourglassView.tsx` | 沙漏圖本體。自帶 `ReactFlowProvider`。`useMemo` 依 `members、relationships、焦點、選項` 計算 model 與 layout，轉成 React Flow nodes／edges。沿用 `Controls`、`MiniMap`、`TreeSearch`、`ExportButton` |
| `HourglassToolbar` | `.../HourglassToolbar.tsx` | 返回、麵包屑、三個書籤、上／下代數選單、設為首頁。小螢幕可水平捲動 |
| `HgBadgeNode` | `.../HgBadgeNode.tsx` | 徽章節點，四種 kind。點擊直接呼叫 store 動作。觸控目標至少 32px |
| `GhostMemberNode` | `.../GhostMemberNode.tsx` | 參照節點：虛線外框、半透明、顯示姓名與「已顯示於他處」，點擊後在畫面中高亮原節點 |
| `SelectionActionBar` | `.../SelectionActionBar.tsx` | 選取人物後在畫布底部置中顯示「以此人為焦點」，手機也可操作 |
| `HourglassEmptyState` | `.../HourglassEmptyState.tsx` | 找不到首頁人物或無資料時，顯示人物選擇（搜尋清單） |
| `ViewModeSwitch` | `src/components/tree/ViewModeSwitch.tsx` | 全家族圖／沙漏圖分段切換 |

### 8.2 沿用元件（不修改）
- `CustomNode`：node `data` 即 `Member`，沿用其 handle id（`top`、`bottom`、`left`、`right`）。
- `HeartAnchorNode`：`data: { variant }`。
- `ExportButton`：依賴 `.react-flow__viewport` 與 `useReactFlow().getNodes()`，在沙漏圖內可直接使用，需驗證（見驗證計畫 V-E2E-5）。

### 8.3 nodeTypes
`nodeTypes` 必須定義在模組層級或 `useMemo`，否則 React Flow 會警告並重複掛載：
```ts
const nodeTypes = { custom: CustomNode, heart: HeartAnchorNode, ghost: GhostMemberNode, hgBadge: HgBadgeNode };
```

### 8.4 React Flow 設定
`nodesDraggable={false}`、`nodesConnectable={false}`、`elementsSelectable`、`minZoom={0.1}`、`maxZoom={1.5}`、`fitView`。layout 結果改變（焦點、選項、資料）後，下一個 animation frame 呼叫 `fitView({ padding: 0.2, duration: 300 })`。

### 8.5 既有元件的最小修改
- `FamilyTree.tsx`：頁首加入 `ViewModeSwitch`；依 `treeMode` 渲染 `FamilyGraph` 或 `HourglassView`；`QuickAddModal` 兩種模式共用。
- `TreeSearch.tsx`：新增**選用** prop `onPick?: (memberId: string) => void`。未傳入時行為與現在完全相同（全家族圖不受影響）。
- `useUIStore.ts`：新增 `treeMode: 'full' | 'hourglass'` 與 `setTreeMode`，以 `persist` 的 `partialize` 只持久化 `treeMode`（key：`family-tree-ui`），**不得**持久化 QuickAdd 狀態。
- `familyConfig.ts`：新增 `homeMemberName`，來源 `import.meta.env.VITE_HOME_MEMBER_NAME || '魏子傑'`。同步更新 `.env.example`。

---

## 9. 狀態管理（`src/store/useHourglassStore.ts`）

```ts
interface HourglassState {
  homeMemberId: string | null;          // 持久化 key: family-tree-hourglass
  ancestorDepth: number;                // 持久化，預設 3
  descendantDepth: number | null;       // 持久化，預設 3
  focusId: string | null;               // 不持久化，每次進入預設為首頁人物
  history: string[];                    // 先前的焦點（不含目前），上限 12
  collapsedOverride: Record<string, true>;
  expandedOverride: Record<string, true>;

  resolveInitial: (members: Record<string, Member>, homeName: string) => void;
  validateFocus: (members: Record<string, Member>) => void;  // EC-11
  setFocus: (id: string) => void;       // 連續相同 id 不重複入列
  goBack: () => void;
  jumpTo: (breadcrumbIndex: number) => void;
  resetToHome: () => void;              // 同時清除覆寫
  setHome: (id: string) => void;
  setAncestorDepth: (n: number) => void;  // 同時清除覆寫
  setDescendantDepth: (n: number | null) => void;
  toggleDescendants: (id: string, currentlyCollapsed: boolean) => void;
}
```
- `partialize` 僅保留 `homeMemberId`、`ancestorDepth`、`descendantDepth`。
- 書籤目標計算為純函式 `resolveBookmarks(index, homeId)`，放在 `hourglassModel.ts` 旁，需單元測試。
- Google Sheet 同步（`setBatchFamilyData`）造成資料更新時，視圖自動重算；每次資料更新後呼叫 `validateFocus`。

---

## 10. 檔案清單

### 10.1 新增
```
src/utils/hourglass/constants.ts
src/utils/hourglass/types.ts
src/utils/hourglass/familyIndex.ts
src/utils/hourglass/hourglassModel.ts
src/utils/hourglass/hourglassLayout.ts
src/utils/hourglass/toFlow.ts                    # LayoutResult -> React Flow nodes/edges
src/utils/hourglass/__tests__/*.test.ts
src/utils/hourglass/__fixtures__/*.ts            # 合成資料產生器與固定案例（不含真實資料）
src/store/useHourglassStore.ts
src/components/tree/ViewModeSwitch.tsx
src/components/tree/hourglass/{HourglassView,HourglassToolbar,HgBadgeNode,GhostMemberNode,SelectionActionBar,HourglassEmptyState}.tsx
scripts/anonymize-csv.mjs                         # 真實資料去識別化（見 12.8）
e2e/*.spec.ts                                     # Playwright（選用，見 12.7）
```

### 10.2 允許修改
`src/pages/FamilyTree.tsx`、`src/store/useUIStore.ts`、`src/components/tree/TreeSearch.tsx`（僅加選用 prop）、`src/config/familyConfig.ts`、`.env.example`、`package.json`（測試依賴與 script）、`vite.config.ts`（test 設定）、`.gitignore`（加入 `fixtures/local/`、`.env.e2e`）、`docs/FEATURES.md`、`docs/USER_MANUAL.md`、`docs/SYSTEM_TEST_ACCEPTANCE.md`、`README.md`。

### 10.3 禁止修改（凍結）
`src/utils/layout.ts`、`src/components/tree/FamilyGraph.tsx`、`CustomNode.tsx`、`HeartAnchorNode.tsx`、`FamilyGroupNode.tsx`、`ExportButton.tsx`、`src/utils/cryptoHelpers.ts`、`src/components/auth/PinAuthGate.tsx`、`scripts/encrypt-url.js`、`src/utils/csvHelpers.ts`、`src/utils/generationHelpers.ts`。

驗證指令（必須輸出空白）：
```bash
git diff --stat main -- src/utils/layout.ts src/components/tree/FamilyGraph.tsx \
  src/components/tree/CustomNode.tsx src/components/tree/HeartAnchorNode.tsx \
  src/utils/cryptoHelpers.ts src/components/auth/PinAuthGate.tsx
```

---

## 11. 開發階段與完成定義（DoD）

每階段結束都要：`npm run build` 零錯誤、`npm run test` 全綠、單獨 commit（訊息格式見各階段）。

### Phase 0：基礎建設
- 建立分支 `feature/hourglass-view`。
- 安裝測試工具：`vitest`（需與 Vite 7 相容，3.2 以上）；若要做元件測試再加 `jsdom` 與 `@testing-library/react`（React 19 相容版本）。安裝後以 `npx vitest --version` 與 `npm run build` 確認相容。
- `package.json` 新增 `"test": "vitest run"`、`"test:watch": "vitest"`。
- `vite.config.ts` 改用 `vitest/config` 的 `defineConfig` 並加入 `test: { environment: 'node', include: ['src/**/*.test.ts'] }`，**保留** `base: '/family-tree-system/'` 與 react plugin。
- DoD：既有建置不受影響；有一個空的範例測試可執行。
- commit：`chore: add vitest for hourglass view`

### Phase 1：資料索引與可見集合（純邏輯，先寫測試再實作）
- 實作 `familyIndex.ts`、`hourglassModel.ts`、`resolveBookmarks`。
- 建立合成資料產生器與固定案例（見 12.3）。
- DoD：EC-01 到 EC-15 的測試全綠；不變量 I2、I3、I6、I8 在所有案例通過。
- commit：`feat(hourglass): family index and visible-set model`

### Phase 2：版面
- 實作 `hourglassLayout.ts`、`toFlow.ts`。
- DoD：不變量 I1 到 I11 在所有固定案例與 200 組隨機案例通過；效能測試通過；座標快照建立。
- commit：`feat(hourglass): deterministic tree layout with invariant tests`

### Phase 3：唯讀渲染與模式切換
- 實作 `HourglassView`（不含互動）、`GhostMemberNode`、`HgBadgeNode`（先只顯示）、`ViewModeSwitch`，修改 `FamilyTree.tsx`、`useUIStore.ts`。
- DoD：切換兩種模式皆可正常渲染；全家族圖行為與 `main` 一致；使用合成資料目視檢查。
- commit：`feat(hourglass): read-only hourglass view and mode switch`

### Phase 4：互動
- 實作 `useHourglassStore`、`HourglassToolbar`、`SelectionActionBar`、徽章點擊、搜尋整合（`TreeSearch.onPick`）、`familyConfig.homeMemberName`。
- DoD：第 4.3 節所有互動可操作；元件／store 測試全綠；E2E 主要流程通過。
- commit：`feat(hourglass): focus navigation, bookmarks, collapse and search`

### Phase 5：驗收與文件
- 以使用者真實資料執行人工驗收（第 12.8）。
- 更新 `docs/FEATURES.md`、`docs/USER_MANUAL.md`、`docs/SYSTEM_TEST_ACCEPTANCE.md`（新增 TC-16 起的案例）、`README.md`。
- DoD：第 12 節所有閘門通過；第 10.3 節凍結檔案 diff 為空。
- commit：`docs: hourglass view manual and acceptance cases`
- 合併與部署由使用者決定，開發者不得自行 push `main` 或執行 `npm run deploy`。

---

## 12. 驗證計畫

本節是這次改版最重要的部分。先前的排版調整失敗，是因為只靠目視判斷、沒有可量測指標。**所有版面品質都必須以自動化指標驗證，不得以「看起來比較好」作為完成依據。**

### 12.1 驗證層級總覽
| 層級 | 工具 | 驗證對象 | 執行時機 |
|:---|:---|:---|:---|
| L1 單元測試 | vitest（node） | 索引、可見集合、書籤、版面、不變量 | 每次 commit 前 |
| L2 隨機性質測試 | vitest + 種子化亂數 | 200 組隨機家族的不變量 | 每次 commit 前 |
| L3 元件／store 測試 | vitest（jsdom，選用） | store 行為、工具列、麵包屑、模式切換持久化 | Phase 4 |
| L4 端對端 | Playwright（建議） | 使用者流程、手機版面、匯出、PIN 不受影響 | Phase 4、5 |
| L5 人工驗收 | 使用者真實資料（僅本機） | 真實家系的視覺與流程 | Phase 5 |
| L6 迴歸閘門 | git diff + build | 凍結檔案未變、全家族圖未變 | 每次 commit 前 |

### 12.2 建置閘門
```bash
npm run build     # tsc + vite build 必須零錯誤
npm run test      # 必須全綠
git diff --stat main -- <第 10.3 節凍結檔案>   # 必須為空
```

### 12.3 測試資料
**不得把真實家族資料放進此 repo（repo 為 public）。** 一律使用合成資料。

固定案例（`__fixtures__`，皆以程式建構，id 使用 `P001` 形式）：
| 編號 | 案例 | 用途 |
|:---|:---|:---|
| F1 | 最小案例：本人、配偶、2 位子女 | 基本流程 |
| F2 | 六代、雙系：本人有父系 4 代、母系 4 代，配偶有 4 代，本人有 3 位手足且各有家庭，後代 3 代 | 模擬使用者真實規模，主要指標案例 |
| F3 | 缺資料：缺父、缺母、僅單親、無祖先 | EC-01、EC-02、EC-03 |
| F4 | 近親通婚（表親結婚） | EC-04、EC-13 |
| F5 | 多配偶：1、2、3 位 | EC-05、EC-08 |
| F6 | 壞資料：循環、3 位父母、指向不存在 id、重複 spouse、自我關係 | EC-06、EC-07、EC-14、EC-15 |
| F7 | 大資料：500 位成員 | EC-16 效能 |
| F8 | 空資料與單人資料 | EC-10 |

隨機產生器 `generateFamily(seed, options)`：使用 mulberry32 之類的種子化亂數，參數包含世代數（3 到 7）、每對夫妻子女數範圍、配偶比例、缺資料機率、家族內通婚機率。固定 seed 範圍 1 到 200，任何失敗都必須可由 seed 重現並於測試訊息中輸出 seed。

### 12.4 單元測試案例（L1）
`familyIndex`：
- 缺失 id、自我關係、重複 spouse 被過濾。
- `parentsOf` 排序：male 在前；超過 2 位父母取前 2 位並警告一次。
- `childrenOf` 依出生日期、缺日期最後、同日依 id。
- 輸入物件鍵順序打亂後輸出完全相同。

`hourglassModel`：
- 逐項覆蓋第 6.4 節 EC-01 到 EC-15。
- 祖先深度：`ancestorDepth = 2、3、5` 時最小列數正確；最上層人物若還有上代則出現 `moreAncestors` 徽章，否則不出現。
- 折疊：預設深度折疊、`collapsedOverride`、`expandedOverride` 三種來源的優先順序（手動折疊 > 手動展開 > 深度預設）。
- `collapsed` 徽章的 `count` 與以獨立方法（測試內自行寫的廣度走訪）計算的後代數相同。
- 配偶有父母時產生 `inlaw` 徽章；無父母時不產生。

`resolveBookmarks`：
- 一般情況三個目標正確。
- 無母親時「母系」停用；無配偶時「配偶家系」停用；多配偶回傳清單。
- 首頁人物為女性時，「配偶家系」指向其丈夫。

`hourglassLayout`（座標斷言）：
- F1：焦點單元中心、子女置中、愛心座標符合 7.1 公式（誤差 0.5px 內）。
- 配偶 2 位時順序為 `[配偶2, 血緣, 配偶1]`，兩個愛心皆位於相鄰成員中點。

### 12.5 版面不變量（L1 + L2，對所有固定案例與 200 組隨機案例執行）
| 編號 | 不變量 | 說明 |
|:---|:---|:---|
| I1 | 無重疊 | 同一列中，依 x 排序後，相鄰人物節點需滿足 `next.left - prev.right >= 40` |
| I2 | 每人一次 | 畫面上每個真實人物 id 恰好出現一次；重複者只能是 ghost |
| I3 | 列正確 | 祖先列為負且等於 -(世代距離)；後代列為正且等於世代距離；配偶與其伴侶同列 |
| I4 | 夫妻相鄰 | 同單元中有愛心的兩人相鄰，愛心 x 等於兩人中心中點 |
| I5 | 連線有效 | 每條邊的兩端節點都存在；親子邊的來源列 + 1 等於目標列 |
| I6 | 代數限制 | 最小列 >= -ancestorDepth；後代列不超過 descendantDepth，超過者必有 `collapsed` 徽章 |
| I7 | 確定性 | 同輸入執行兩次輸出深度相等；打亂 `members` 鍵順序與 `relationships` 順序後輸出仍相等 |
| I8 | 折疊正確 | 折疊後該人物的所有後代從輸出消失；`count` 等於被隱藏人數；展開後還原至折疊前輸出 |
| I9 | 子女不偏離（針對使用者「小孩畫得很遠」的痛點） | 對每個有可見子女的單元：(a) 所有子女在正下一列；(b) 同胞在該列中連續，其間沒有不屬於這些同胞的節點；(c) 單元中心落在子女成員包絡框 `[minX, maxX]` 內（容差 1px）。三者皆須成立 |
| I10 | 連線不交叉 | 祖先單元：成員由左至右的順序與其上一代單元中心由左至右順序一致；多配偶單元：各組子女由左至右順序與愛心由左至右順序一致 |
| I11 | 不使用凍結模組 | 靜態檢查：`src/utils/hourglass/**` 不得 import `src/utils/layout`（以 grep 測試） |

另外記錄並輸出（不作為失敗條件，供比較）：F2 在預設選項下的總寬度、最大親子水平距離。

### 12.6 效能與快照
- F7（500 人）建模加版面耗時 < 500ms；F2 < 50ms。
- F1、F2、F3、F5 以 `toMatchSnapshot()` 保存座標（取兩位小數）。**更新快照必須人工檢視差異並於 commit 訊息說明原因**，不得為了讓測試通過而直接更新。

### 12.7 元件與端對端（L3、L4）
L3（選用，需 jsdom）：
- `useHourglassStore`：`setFocus` 入列、連續相同 id 不重複；`goBack`、`jumpTo` 截斷歷史；歷史上限 12；`resetToHome` 清除覆寫；`validateFocus` 在焦點消失時回退首頁。
- 持久化：只保存 `homeMemberId`、`ancestorDepth`、`descendantDepth`；重新載入後 `focusId` 回到首頁人物。
- `useUIStore.treeMode` 持久化，QuickAdd 狀態不持久化。

L4（Playwright，建議）。為了不繞過 PIN 機制，E2E 的做法如下：
1. 以合成 CSV 作為 fixture，Playwright 以 `page.route` 攔截 Google Sheet 的請求並回傳 fixture。
2. 用 `scripts/encrypt-url.js` 以測試 PIN（例如 `12345678`）加密一個假網址，寫入 `.env.e2e`（不進版控），以 `vite build --mode e2e` 加 `vite preview` 啟動。注意 `base` 為 `/family-tree-system/`。
3. 不得為測試加入任何繞過 PIN 的開關。

| 編號 | 流程 | 斷言 |
|:---|:---|:---|
| V-E2E-1 | 輸入 PIN 後進入，預設沙漏圖，焦點為首頁人物 | `.react-flow__node[data-id="<首頁人物id>"]` 存在；節點總數等於 model 預期 |
| V-E2E-2 | 點「配偶家系」徽章 | 麵包屑長度 +1；焦點變為配偶；畫面出現配偶的祖先列 |
| V-E2E-3 | 點書籤「母系」、「我的家系」 | 焦點正確；選取狀態正確；無母親時書籤停用 |
| V-E2E-4 | 折疊與展開某子女 | 後代節點數量減少與還原；徽章數字正確 |
| V-E2E-5 | 匯出圖片 | 觸發 `family-tree.png` 下載，檔案大小 > 0 |
| V-E2E-6 | 切換到全家族圖 | 節點數與 `main` 相同；搜尋與定位正常（TC-08） |
| V-E2E-7 | 搜尋不可見的人物 | 焦點切換到該人物並置中 |
| V-E2E-8 | 手機視窗 390x844 | 工具列可水平捲動；點節點出現「以此人為焦點」；徽章可點擊；無橫向頁面溢出 |
| V-E2E-9 | 鎖定後重新輸入 PIN | PIN 流程不受影響，回到沙漏圖 |
| V-E2E-10 | 重新整理 | 保留 `treeMode`、代數設定、首頁人物；焦點回到首頁人物 |

### 12.8 真實資料驗證（L5，僅在使用者本機，不進版控）
`scripts/anonymize-csv.mjs <輸入.csv> <輸出.csv>`：
- 將 ID 重新編號為 `P001...`（保持父親ID、母親ID、配偶ID 對應一致）。
- 姓名改為「人物 001」格式，保留性別與狀態欄。
- 出生／死亡日期只保留年份（排序用）。
- 備註、職業、位置、照片URL 清空。
- 輸出到 `fixtures/local/real-structure.csv`，並把 `fixtures/local/` 加入 `.gitignore`。
- 對應測試以 `describe.skipIf(!fileExists)` 包起來：有檔案時對真實結構跑不變量 I1 到 I10，沒檔案時略過。這讓使用者能用自己的真實結構驗證，而不洩漏資料。

人工驗收清單（使用者執行，記錄在 `docs/SYSTEM_TEST_ACCEPTANCE.md`）：
| 編號 | 項目 | 通過標準 |
|:---|:---|:---|
| A1 | 開啟沙漏圖 | 預設焦點為魏子傑，向上 3 代、向下 3 代 |
| A2 | 祖先顯示 | 父母、祖父母、曾祖父母三列完整；最上層若有更上代則有「更多祖先」徽章 |
| A3 | 子女位置 | 目視無「離父母很遠」的子女；與自動指標 I9 一致 |
| A4 | 配偶家系 | 太太旁有「配偶家系」徽章；點擊後焦點切到太太並顯示其祖先；返回回到魏子傑 |
| A5 | 母系 | 點「母系」後焦點為母親；下方可看到魏子傑與其兄弟姊妹各自的家庭 |
| A6 | 折疊 | 任一子樹可折疊與展開，數字正確，其餘部分排版合理 |
| A7 | 搜尋 | 搜尋任何成員皆能抵達 |
| A8 | 全家族圖 | 與改版前 `main` 的畫面一致（以同一組資料截圖比對） |
| A9 | 手機 | 單手可操作、無破版 |
| A10 | 匯出 | 沙漏圖匯出的 PNG 完整、頭像正常 |
| A11 | PIN | 鎖定、輸入、記住裝置流程與改版前一致 |
| A12 | 速度 | 切換焦點視覺上無延遲（量測 < 300ms） |

---

## 13. 風險與對策
| 編號 | 風險 | 對策 |
|:---|:---|:---|
| R1 | 焦點選在高階祖先時，後代列過寬 | 預設向下 3 代，更深以「[+N 後代]」折疊；使用者可調代數 |
| R2 | 近親通婚造成祖先重複 | D7：ghost 參照節點，不遞迴 |
| R3 | `ROW_PITCH` 與徽章偏移與實際節點高度不符 | 以常數集中管理；Phase 3 目視微調一次後以快照固定 |
| R4 | 資料品質（缺父母、錯誤 id、循環） | 索引層過濾；EC-06、EC-14 專項測試 |
| R5 | 改動影響既有全家族圖或 PIN | 第 10.3 節凍結清單與 diff 閘門；E2E V-E2E-6、V-E2E-9 |
| R6 | 測試工具與 Vite 7、React 19 相容性 | Phase 0 先驗證，不相容時退回只做純邏輯測試，元件測試以 E2E 取代 |
| R7 | 真實家族資料外流 | 禁止真實資料進 repo；匿名化腳本與 `fixtures/local/` 忽略；repo 為 public |
| R8 | 事後補丁式修正再次失敗 | 不得調整 Dagre 參數；版面不通過不變量時修演算法，不得削弱測試；若必須調整門檻，需在文件記錄理由 |

---

## 14. 待確認事項（已確認）
| 編號 | 問題 | 確認結果 |
|:---|:---|:---|
| Q1 | 進入家族樹時預設顯示哪個模式 | 預設沙漏圖，並記住「該設備」上次的選擇（支援同帳號在不同設備有不同檢視習慣）。 |
| Q2 | 「母系」的意義 | 以「該焦點人物」的母親為焦點去展開。 |
| Q3 | 向下預設代數 | 預設向下 3 代，可在工具列調整。 |
| Q4 | 祖先的其他配偶（繼父母、前配偶） | 本版先不顯示。下一版將以連線畫出（但不展開其家系）。 |
| Q5 | 麵包屑歷史是否同步到網址 hash | 不做上一頁支援，使用者直接點擊麵包屑回頭看即可。 |

---

## 15. 給開發者的工作守則
1. 先讀完本文件與 `src/utils/layout.ts`（僅參考，不 import）、`CustomNode.tsx`、`HeartAnchorNode.tsx`。
2. Phase 1、2 採測試先行：先寫不變量與案例，再實作。
3. 每個 Phase 結束時回報：測試輸出、`npm run build` 結果、第 12.5 節記錄的總寬度與最大親子距離數值。
4. 不得修改凍結檔案；不得 push `main`；不得部署；不得提交真實資料。
5. 保留既有檔案中與本次修改無關的註解與文件字串。
6. 遇到本文件未涵蓋的情況，先記錄於本文件第 14 節「待確認事項」，採用最保守的做法並在回報中說明。

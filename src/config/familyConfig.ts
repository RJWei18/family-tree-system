/**
 * 家族樹系統安全性與預設組態設定
 */

export interface FamilyAppConfig {
  // 透過 8 碼 PIN 加密後的 Google Sheet CSV 網址密文 (支援單一字串，或陣列以支援多來源)
  encryptedSheetUrl: string | string[];
  // 透過管理員 Master Key 加密後的 Google Sheet CSV 網址密文 (選填備用救援，亦支援多組)
  encryptedMasterUrl?: string | string[];
  // 家族名稱 / 系統標題
  title: string;
  // 忘記 PIN 碼時的聯絡說明
  contactPrompt: string;
  // 密碼長度規則 (預設 8 碼)
  pinLength: number;
  // 預設首頁人物名稱
  homeMemberName: string;
}

export const familyConfig: FamilyAppConfig = {
  encryptedSheetUrl: import.meta.env.VITE_ENCRYPTED_SHEET_URL 
    ? (import.meta.env.VITE_ENCRYPTED_SHEET_URL as string).split(',').map((s: string) => s.trim())
    : [
        'eyJ2ZXJzaW9uIjoxLCJzYWx0IjoiTEN0dXpkdTVibWJxTmhwcFdHam9QZz09IiwiaXYiOiJaeE1sdVpaNjBQdUQvNTJRIiwiZGF0YSI6Ii8vUmh1RlhZREU5b3dBaXdOWVNmdTZQYUZUbSs2WVFKNkJ1a05tcGQ5Q0dvbjBhR2FzZjgzeS92a3FscVlqTUhURHNTQ1RuVi9YZW9iSVdmRjVsNm5iUDdkS3hYOEM3K1JYTGFBS0dTOElXRE9ia214SjArMVlNa3N2aVB5V1Vqc1c3STRPcGJjd3JMWjNUbzVHYmg4c0RPcEJJVEt0QU5wUVVLWlFVYWhMZDZDcExyQ2JETlR0QWxZZjYrRXdqWUN4MlFwNWhqUmo5MWRrQmpuMS8yWkxXVU4yNWVDVVhabWtkSWRqN3RGWUErTG1oRDhzcmVmZz09In0=',
        'eyJ2ZXJzaW9uIjoxLCJzYWx0IjoiVnFiM0VTSElqZnQ2bXp0ZlM2cU0wdz09IiwiaXYiOiIwalVid1J6emYyWThvWHVLIiwiZGF0YSI6Ijc4VlRuZEtpTEc1QWJJb0EzM2xEWVpCWWZXUHhVUkJUdTRNbVRqRlpySHZ0VUlzdE9ISXBDSmZJRkdpWW1BOExOZ2U5emFsc1Z0cFB5RERVVjg2c0d4U0VaQ29yMjROYjhLT1dWSXh0My80S0pmUjdYSng3cmd4S2JiLytZM0FnUktEd2NCL1Y4ZXF4Tzk1blJ5cldmcUpGSE9rTi9iSDhWcUp1M3QrRTNLRG5xck1XNEczK25aQ2FRNTlucEpVNDYvdGJpTGZDZDJtTVQ1MFpzSS9oeUI5b05nWmd4cW5mZkZsZWFhdmlaL2VLNmVISzIwb2N3TEhGODdiZWk2VT0ifQ=='
      ],
  
  encryptedMasterUrl: import.meta.env.VITE_ENCRYPTED_MASTER_URL
    ? (import.meta.env.VITE_ENCRYPTED_MASTER_URL as string).split(',').map((s: string) => s.trim())
    : ['eyJ2ZXJzaW9uIjoxLCJzYWx0IjoiT21CcmFNa1F1cFdiaVVxUi9JN0Q2Zz09IiwiaXYiOiJva1c4Z1ZPaW9Xb01FajUzIiwiZGF0YSI6IklXZUltRGN3dW1PcTZ5YnRrcFM0UFd6dGhlL2xMc0h3YkJtMi90aTd3WDRaemM4OE1JM0hBRkRGd3Z1cFk3UXp3eG5vaCs3ZE1HMk9iTWZaYnBjUzdYcm1NQ3N1dDhxQ3hDYVBXUWdHWmFBM2prUzNtSWthc1dTUGZxb0dvdWVuQUtybGM0ekE5T1gyOUs4N3B1emtmQi9oWm9wWUdxNnkxbTFQVEU2ZEVETkpQVUwrOVc3dEU3NjAwWGpYYTVQYyt1aHhZeENQMmlIUXU0ZytEQzBFWWxUTkF2RVdBdXZ4aW9mZkFndVR2cFhEZ2N2UlQrTjIrQT09In0='],
  
  title: import.meta.env.VITE_FAMILY_TITLE || '🌳 數位家族樹系統',
  contactPrompt: import.meta.env.VITE_ADMIN_CONTACT || '若忘記 PIN 碼，請聯繫家族管理員取得解鎖金鑰。',
  pinLength: 8,
  homeMemberName: import.meta.env.VITE_HOME_MEMBER_NAME || '魏子傑',
};

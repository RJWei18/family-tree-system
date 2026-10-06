/**
 * 家族樹系統安全性與預設組態設定
 */

export interface FamilyAppConfig {
  // 透過 8 碼 PIN 加密後的 Google Sheet CSV 網址密文
  encryptedSheetUrl: string;
  // 透過管理員 Master Key 加密後的 Google Sheet CSV 網址密文 (選填備用救援)
  encryptedMasterUrl?: string;
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
  encryptedSheetUrl:
    import.meta.env.VITE_ENCRYPTED_SHEET_URL ||
    'eyJ2ZXJzaW9uIjoxLCJzYWx0IjoiTEN0dXpkdTVibWJxTmhwcFdHam9QZz09IiwiaXYiOiJaeE1sdVpaNjBQdUQvNTJRIiwiZGF0YSI6Ii8vUmh1RlhZREU5b3dBaXdOWVNmdTZQYUZUbSs2WVFKNkJ1a05tcGQ5Q0dvbjBhR2FzZjgzeS92a3FscVlqTUhURHNTQ1RuVi9YZW9iSVdmRjVsNm5iUDdkS3hYOEM3K1JYTGFBS0dTOElXRE9ia214SjArMVlNa3N2aVB5V1Vqc1c3STRPcGJjd3JMWjNUbzVHYmg4c0RPcEJJVEt0QU5wUVVLWlFVYWhMZDZDcExyQ2JETlR0QWxZZjYrRXdqWUN4MlFwNWhqUmo5MWRrQmpuMS8yWkxXVU4yNWVDVVhabWtkSWRqN3RGWUErTG1oRDhzcmVmZz09In0=',
  encryptedMasterUrl:
    import.meta.env.VITE_ENCRYPTED_MASTER_URL ||
    'eyJ2ZXJzaW9uIjoxLCJzYWx0IjoiT21CcmFNa1F1cFdiaVVxUi9JN0Q2Zz09IiwiaXYiOiJva1c4Z1ZPaW9Xb01FajUzIiwiZGF0YSI6IklXZUltRGN3dW1PcTZ5YnRrcFM0UFd6dGhlL2xMc0h3YkJtMi90aTd3WDRaemM4OE1JM0hBRkRGd3Z1cFk3UXp3eG5vaCs3ZE1HMk9iTWZaYnBjUzdYcm1NQ3N1dDhxQ3hDYVBXUWdHWmFBM2prUzNtSWthc1dTUGZxb0dvdWVuQUtybGM0ekE5T1gyOUs4N3B1emtmQi9oWm9wWUdxNnkxbTFQVEU2ZEVETkpQVUwrOVc3dEU3NjAwWGpYYTVQYyt1aHhZeENQMmlIUXU0ZytEQzBFWWxUTkF2RVdBdXZ4aW9mZkFndVR2cFhEZ2N2UlQrTjIrQT09In0=',
  title: import.meta.env.VITE_FAMILY_TITLE || '🌳 數位家族樹系統',
  contactPrompt: import.meta.env.VITE_ADMIN_CONTACT || '若忘記 PIN 碼，請聯繫家族管理員取得解鎖金鑰。',
  pinLength: 8,
  homeMemberName: import.meta.env.VITE_HOME_MEMBER_NAME || '魏子傑',
};

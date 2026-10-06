#!/usr/bin/env node

/**
 * 家族樹 Google Sheet 網址加密腳本
 * 使用 Node.js 內建 crypto 模組（Web Crypto API 相容）
 * 
 * 使用方式：
 *   node scripts/encrypt-url.js <8位數PIN> "<Google-Sheet-CSV-URL>" [可選MasterKey]
 * 
 * 範例：
 *   node scripts/encrypt-url.js 12345678 "https://docs.google.com/spreadsheets/d/e/.../pub?output=csv"
 */

import { webcrypto } from 'node:crypto';

const crypto = globalThis.crypto || webcrypto;

const bufferToBase64 = (buffer) => {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return Buffer.from(bytes).toString('base64');
};

const deriveKey = async (pin, salt, iterations = 100000) => {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(pin),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
};

const encryptUrl = async (plainText, pin) => {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const key = await deriveKey(pin, salt);
  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv
    },
    key,
    enc.encode(plainText)
  );

  const payload = {
    version: 1,
    salt: bufferToBase64(salt),
    iv: bufferToBase64(iv),
    data: bufferToBase64(encrypted)
  };

  return Buffer.from(JSON.stringify(payload)).toString('base64');
};

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log(`
======================================================
🌳 家族樹 Google Sheet 網址加密產生器
======================================================

使用方式:
  node scripts/encrypt-url.js <8位數PIN> "<Google-Sheet-CSV-URL>" [MasterKey]

參數說明:
  1. 8位數PIN       : 家人日常解鎖用的 8 位數字 PIN 碼 (例: 88889999)
  2. Google Sheet網址: 發布到網路的 CSV 格式網址
  3. MasterKey (選填): 管理員備用萬用密碼 (例: myAdminSecret2026)

範例:
  node scripts/encrypt-url.js 88889999 "https://docs.google.com/spreadsheets/d/e/2PACX-.../pub?output=csv"
======================================================
    `);
    process.exit(1);
  }

  const pin = args[0].trim();
  const rawUrl = args[1].trim();
  const masterKey = args[2]?.trim();

  if (pin.length < 6) {
    console.error('⚠️ 警告: PIN 碼建議至少 6~8 碼以確保安全性。');
  }

  console.log('\n🔐 正在使用 AES-256-GCM 加密 Google Sheet 網址...');
  const encryptedPayload = await encryptUrl(rawUrl, pin);

  console.log('\n✅ 加密成功！請將以下內容貼到 .env 或 src/config/familyConfig.ts:\n');
  console.log('------------------------------------------------------');
  console.log(`VITE_ENCRYPTED_SHEET_URL="${encryptedPayload}"`);

  if (masterKey) {
    const masterPayload = await encryptUrl(rawUrl, masterKey);
    console.log(`VITE_ENCRYPTED_MASTER_URL="${masterPayload}"`);
  }
  console.log('------------------------------------------------------\n');
  console.log('💡 提醒: 原始 Google Sheet 網址已被安全加密，可放心提交至 GitHub。\n');
}

main().catch((err) => {
  console.error('❌ 加密失敗:', err);
  process.exit(1);
});

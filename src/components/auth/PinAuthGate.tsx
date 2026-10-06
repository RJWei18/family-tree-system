import React, { useState, useEffect, useRef } from 'react';
import { Lock, KeyRound, HelpCircle, ShieldAlert, ArrowRight, RefreshCw, Smartphone } from 'lucide-react';
import { decryptUrl } from '../../utils/cryptoHelpers';
import { familyConfig } from '../../config/familyConfig';

interface PinAuthGateProps {
  onSuccess: (sheetUrl: string) => void;
  isLoadingData?: boolean;
}

export const PinAuthGate: React.FC<PinAuthGateProps> = ({ onSuccess, isLoadingData = false }) => {
  const [pin, setPin] = useState('');
  const [rememberDevice, setRememberDevice] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showRescueModal, setShowRescueModal] = useState(false);
  const [directUrl, setDirectUrl] = useState('');
  const [rescueKey, setRescueKey] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const encryptedUrl = familyConfig.encryptedSheetUrl || localStorage.getItem('family_tree_encrypted_url') || '';
  const encryptedMasterUrl = familyConfig.encryptedMasterUrl || '';

  // Auto-verify if PIN was remembered previously
  useEffect(() => {
    const savedPin = localStorage.getItem('family_tree_saved_pin');
    if (savedPin && encryptedUrl) {
      handleVerify(savedPin, false);
    } else {
      inputRef.current?.focus();
    }
  }, [encryptedUrl]);

  const handleVerify = async (inputPin: string, isManual = true) => {
    const cleanPin = inputPin.trim();
    if (!cleanPin) {
      if (isManual) setErrorMsg('請輸入 PIN 碼');
      return;
    }

    if (!encryptedUrl && !encryptedMasterUrl) {
      setErrorMsg('尚未配置加密網址，請使用下方救援通道手動輸入。');
      return;
    }

    setIsVerifying(true);
    setErrorMsg(null);

    try {
      let resolvedUrl: string | null = null;

      // 1. Try decrypting standard payload
      if (encryptedUrl) {
        try {
          resolvedUrl = await decryptUrl(encryptedUrl, cleanPin);
        } catch {
          // Fallback to master
        }
      }

      // 2. Try decrypting master payload if first failed
      if (!resolvedUrl && encryptedMasterUrl) {
        try {
          resolvedUrl = await decryptUrl(encryptedMasterUrl, cleanPin);
        } catch {
          // Failed
        }
      }

      if (!resolvedUrl) {
        throw new Error('INVALID_PIN');
      }

      // Save remembered device status
      if (rememberDevice) {
        localStorage.setItem('family_tree_saved_pin', cleanPin);
      } else {
        localStorage.removeItem('family_tree_saved_pin');
      }

      onSuccess(resolvedUrl);
    } catch {
      setErrorMsg('PIN 碼錯誤，請重新輸入。');
      if (!isManual) {
        localStorage.removeItem('family_tree_saved_pin');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleVerify(pin, true);
  };

  const handleDirectUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directUrl.trim()) return;
    onSuccess(directUrl.trim());
  };

  const handleRescueKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescueKey.trim()) return;
    await handleVerify(rescueKey.trim(), true);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        boxSizing: 'border-box',
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%)'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          padding: '36px 32px',
          boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.08), 0 0 1px 1px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e2e8f0',
          boxSizing: 'border-box'
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              backgroundColor: '#fef3c7',
              color: '#d97706',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}
          >
            <Lock size={28} />
          </div>
          <h1
            style={{
              margin: '0 0 8px 0',
              fontSize: '22px',
              fontWeight: 700,
              color: '#1e293b',
              letterSpacing: '-0.02em'
            }}
          >
            {familyConfig.title}
          </h1>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
            請輸入 8 位數家族 PIN 碼解鎖進入
          </p>
        </div>

        {/* Loading State */}
        {isLoadingData ? (
          <div style={{ padding: '36px 0', textAlign: 'center' }}>
            <RefreshCw
              size={36}
              className="animate-spin"
              style={{ color: '#d97706', margin: '0 auto 16px auto', display: 'block' }}
            />
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#1e293b', marginBottom: '4px' }}>
              正在同步家族資料...
            </div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>自 Google Sheets 載入最新成員與圖譜</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#475569'
                }}
              >
                <span>家族安全 PIN 碼</span>
                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 400 }}>8 碼數字</span>
              </div>

              <input
                ref={inputRef}
                type="password"
                inputMode="numeric"
                maxLength={12}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  textAlign: 'center',
                  fontSize: '24px',
                  letterSpacing: '0.4em',
                  fontFamily: 'monospace',
                  padding: '12px 16px',
                  borderRadius: '14px',
                  backgroundColor: '#f8fafc',
                  border: errorMsg ? '2px solid #f87171' : '1.5px solid #cbd5e1',
                  color: '#0f172a',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'all 0.2s'
                }}
              />

              {errorMsg && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    color: '#ef4444',
                    marginTop: '8px'
                  }}
                >
                  <ShieldAlert size={14} />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>

            {/* Remember & Forgot options */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '13px'
              }}
            >
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  color: '#475569',
                  userSelect: 'none'
                }}
              >
                <input
                  type="checkbox"
                  checked={rememberDevice}
                  onChange={(e) => setRememberDevice(e.target.checked)}
                  style={{ width: '15px', height: '15px', accentColor: '#d97706', cursor: 'pointer' }}
                />
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                  <Smartphone size={13} />
                  記住這台裝置
                </span>
              </label>

              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  fontSize: '12px',
                  color: '#b45309',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                忘記 PIN 碼？
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isVerifying || !pin}
              style={{
                width: '100%',
                padding: '13px 20px',
                borderRadius: '14px',
                backgroundColor: isVerifying || !pin ? '#d1d5db' : '#d97706',
                color: '#ffffff',
                border: 'none',
                fontWeight: 600,
                fontSize: '15px',
                cursor: isVerifying || !pin ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: isVerifying || !pin ? 'none' : '0 4px 12px rgba(217, 119, 6, 0.25)',
                transition: 'all 0.2s'
              }}
            >
              {isVerifying ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  <span>驗證中...</span>
                </>
              ) : (
                <>
                  <span>解鎖進入家族樹</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer */}
        <div
          style={{
            marginTop: '28px',
            paddingTop: '20px',
            borderTop: '1px solid #f1f5f9',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '11px',
            color: '#94a3b8'
          }}
        >
          <span>AES-256 加密保護</span>
          <button
            type="button"
            onClick={() => setShowRescueModal(true)}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              fontSize: '11px',
              color: '#94a3b8',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            管理員救援通道
          </button>
        </div>
      </div>

      {/* Forgot PIN Modal */}
      {showForgotModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '380px',
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              padding: '24px',
              boxShadow: '0 20px 30px rgba(0,0,0,0.15)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: '#fef3c7',
                  color: '#d97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <HelpCircle size={20} />
              </div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>
                忘記 PIN 碼說明
              </h3>
            </div>

            <p
              style={{
                margin: '0 0 20px 0',
                fontSize: '13px',
                color: '#475569',
                lineHeight: '1.6',
                backgroundColor: '#f8fafc',
                padding: '14px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0'
              }}
            >
              {familyConfig.contactPrompt}
            </p>

            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '10px',
                backgroundColor: '#f1f5f9',
                color: '#334155',
                border: 'none',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              我知道了
            </button>
          </div>
        </div>
      )}

      {/* Admin Rescue Modal */}
      {showRescueModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '440px',
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              padding: '28px',
              boxShadow: '0 20px 30px rgba(0,0,0,0.15)'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '20px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <KeyRound size={20} style={{ color: '#d97706' }} />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>
                  管理員緊急救援通道
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRescueModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                關閉
              </button>
            </div>

            {/* Option 1: Master Key */}
            <form
              onSubmit={handleRescueKeySubmit}
              style={{ marginBottom: '18px', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}
            >
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#475569',
                  marginBottom: '8px'
                }}
              >
                方案 1：輸入 Master Key 萬用金鑰
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="password"
                  value={rescueKey}
                  onChange={(e) => setRescueKey(e.target.value)}
                  placeholder="Master Key 密碼"
                  style={{
                    flex: 1,
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
                <button
                  type="submit"
                  style={{
                    padding: '9px 16px',
                    borderRadius: '10px',
                    backgroundColor: '#1e293b',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  解鎖
                </button>
              </div>
            </form>

            {/* Option 2: Direct URL */}
            <form onSubmit={handleDirectUrlSubmit}>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#475569',
                  marginBottom: '8px'
                }}
              >
                方案 2：直接輸入 Google Sheet CSV 網址
              </label>
              <textarea
                rows={3}
                value={directUrl}
                onChange={(e) => setDirectUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/e/.../pub?output=csv"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  boxSizing: 'border-box',
                  resize: 'none',
                  outline: 'none',
                  marginBottom: '10px'
                }}
              />
              <button
                type="submit"
                disabled={!directUrl.trim()}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '10px',
                  backgroundColor: directUrl.trim() ? '#d97706' : '#e2e8f0',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: directUrl.trim() ? 'pointer' : 'not-allowed'
                }}
              >
                直接載入此試算表
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

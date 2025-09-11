// MemoirFlow 加密回憶錄主腳本
// 回憶錄ID: 4548b929-5c16-4ee7-a189-60679e2165be
// 生成時間: 2025-09-11T21:06:04.201611600+00:00

// ========== 提取的腳本區塊 ==========

        (() => {
            const q = (s) => document.querySelector(s);
            const BACKEND_URL      = q('meta[name="backend-url"]')?.content || 'https://mastermaso.com/memoirflow';
            const MEMOIR_ID    = q('meta[name="memoir-id"]')?.content || '';
            const CONTENT_HASH = q('meta[name="content-hash"]')?.content || '';
            const REQUIRE      = q('meta[name="approval-required"]')?.content === 'true';
            const REQUIRE_PW   = q('meta[name="require-password"]')?.content === 'true';

            window.__APPROVAL__ = { ok: true, token: null, status: 'checking', checked: false };


            // 增強的瀏覽量追蹤函數
            async function trackPageView(eventType = 'page_view') {
                if (!BACKEND_URL || !MEMOIR_ID) return;
                
                const viewData = {
                    memoir_id: MEMOIR_ID,
                    content_hash: CONTENT_HASH,
                    event_type: eventType,
                    timestamp: new Date().toISOString(),
                    page_path: window.location.pathname,
                    repo_url: window.location.origin + window.location.pathname.split('/').slice(0,3).join('/'),
                    referrer: document.referrer || null,
                    user_agent: navigator.userAgent,
                    viewport: {
                        width: window.innerWidth,
                        height: window.innerHeight
                    },
                    approval_token: window.__APPROVAL__?.token || null
                };

                try {
                    await fetch(`${BACKEND_URL}/api/analytics/track`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify(viewData)
                    });
                } catch (error) {
                    console.warn('追蹤事件發送失敗:', error);
                }
            }

            async function audit(endpoint, body) {
                if (!BACKEND_URL) return;
                try {
                await fetch(`${BACKEND_URL}${endpoint}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                    memoir_id: MEMOIR_ID,
                    content_hash: CONTENT_HASH,
                    page_path: location.pathname,
                    repo_url: location.origin + location.pathname.split('/').slice(0,3).join('/'),
                    user_agent: navigator.userAgent,
                    ...body
                    })
                });
                } catch (_) {}
            }

            async function checkApprovalOnce() {
                if (window.__APPROVAL__.checked) {
                return { ok: window.__APPROVAL__.ok, status: window.__APPROVAL__.status };
                }
                if (!REQUIRE || !BACKEND_URL) {
                window.__APPROVAL__ = { ok: true, token: null, status: 'skipped', checked: true };
                return { ok: true, status: 'skipped' };
                }

                await audit('/api/admin/track/attempt', { event: 'view_attempt' });

                try {
                const res = await fetch(`${BACKEND_URL}/api/access/authorize`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                    memoir_id: MEMOIR_ID,
                    content_hash: CONTENT_HASH,
                    page_path: location.pathname,
                    repo_url: location.origin + location.pathname.split('/').slice(0,3).join('/'),
                    })
                });

                if (res.ok) {
                    const data = await res.json();
                    window.__APPROVAL__.status  = data.status;
                    window.__APPROVAL__.token   = data.token || null;
                    window.__APPROVAL__.checked = true;

                    if (data.status === 'approved' || data.status === 'pending') {
                    window.__APPROVAL__.ok = true;
                    return { ok: true, status: data.status };
                    } else {
                    window.__APPROVAL__.ok = false;
                    showBlocked(data.reason || '審核未通過', data.status);
                    await audit('/api/admin/track/deny', { event:'view_denied', status:data.status, reason:data.reason });
                    return { ok: false, status: data.status };
                    }
                } else {
                    let data;
                    try { data = await res.json(); } catch { data = { status:'rejected' }; }
                    window.__APPROVAL__.ok      = false;
                    window.__APPROVAL__.status  = data.status || 'rejected';
                    window.__APPROVAL__.checked = true;

                    const reason = data?.reason || data?.message || `審核被拒絕 (HTTP ${res.status})`;
                    showBlocked(reason, data.status || 'rejected');
                    await audit('/api/admin/track/deny', { event:'view_denied', status:window.__APPROVAL__.status, reason, http_status:res.status });
                    return { ok: false, status: window.__APPROVAL__.status };
                }
                } catch (err) {
                window.__APPROVAL__ = { ok: true, token: null, status: 'network_error_fallback', checked: true };
                return { ok: true, status: 'network_error_fallback' };
                }
            }

            // 🚨 修改這個函數使用 blockedScreen
            function showBlocked(reason, status) {
                
                const loading = document.getElementById('loadingScreen');
                const pwd     = document.getElementById('passwordModal');
                const app     = document.getElementById('app');
                const blocked = document.getElementById('blockedScreen');
                const reasonElement = document.getElementById('blockedReason');

                // 隱藏其他畫面
                loading?.classList.add('hidden');
                pwd?.classList.add('hidden');
                app?.classList.add('hidden');

                // 設置拒絕原因
                if (reasonElement) {
                    // 根據 status 提供更詳細的說明
                    let displayReason = reason || '依據審核政策，該內容尚未通過審核或已被暫停公開。';
                    
                    if (status === 'rejected') {
                        displayReason = `${reason || '內容不符合發布標準'}`;
                    } else if (status === 'pending') {
                        displayReason = `審核進行中：${reason || '內容正在等待審核，請稍後再試'}`;
                    } else if (status === 'suspended') {
                        displayReason = `內容已暫停：${reason || '該內容已被暫時停止公開'}`;
                    } else if (status === 'expired') {
                        displayReason = `內容已過期：${reason || '該內容的分享期限已到期'}`;
                    }
                    
                    reasonElement.textContent = displayReason;
                }
                
                // 根據狀態設置不同的圖標
                if (blocked) {
                    const iconElement = blocked.querySelector('div[style*="font-size:64px"]');
                    if (iconElement) {
                        let icon = '🚫'; // 默認
                        if (status === 'pending') {
                            icon = '⏳';
                        } else if (status === 'suspended') {
                            icon = '⏸️';
                        } else if (status === 'expired') {
                            icon = '⏰';
                        } else if (status === 'rejected') {
                            icon = '🚫';
                        }
                        iconElement.textContent = icon;
                    }
                    
                    blocked.classList.remove('hidden');
                }

                // 停止解密系統
                if (window.MemoirFlowDecryptionSystem) {
                    window.MemoirFlowDecryptionSystem = false;
                }
            }

            window.__preInitApproval__ = async () => {
                try {
                const gate = await checkApprovalOnce();
                return !!(gate?.ok || gate?.status === 'pending');
                } catch {
                return true;
                }
            };

            async function gateAndBoot() {
                const ok = await window.__preInitApproval__();
                if (!ok) return;                
                if (typeof window.__bootApp__ === 'function') {
                window.__bootApp__();
                }
            }

            // 🚨 修正：檢查重新整理狀態
            const hasSessionFlag = sessionStorage.getItem('mf_pw_unlocked') === '1';
            const hasActualData = !!(window.MEMOIR_DATA && window.MEMOIR_DATA.events && window.MEMOIR_DATA.events.length > 0);

            // 如果有 session 標記但沒有實際數據，清除標記
            if (hasSessionFlag && !hasActualData) {
                console.log('⚠️ 檢測到重新整理狀態，清除 session');
                sessionStorage.removeItem('mf_pw_unlocked');
            }

            // 確保密碼模式下正確顯示密碼輸入介面
            if (REQUIRE_PW && !sessionStorage.getItem('mf_pw_unlocked')) {
                const modal  = document.getElementById('passwordModal');
                if (modal) {
                    modal.classList.remove('hidden');
                }
                const input  = document.getElementById('memoirPassword');
                const submit = document.getElementById('unlockBtn');

                // 🚨 關鍵修改：顯示密碼輸入介面
                if (modal) {
                    modal.classList.remove('hidden');
                    console.log('🔒 顯示密碼輸入介面');
                }

                const tryUnlock = async () => {
                    const passwordInput = document.getElementById('memoirPassword');
                    const unlockBtn = document.getElementById('unlockBtn');
                    const errorDiv = document.getElementById('passwordError');
                    
                    // 🚨 關鍵修正：確保密碼是字符串類型
                    const password = passwordInput?.value?.trim() || '';
                    
                    // 清除之前的錯誤信息
                    if (errorDiv) {
                        errorDiv.classList.add('hidden');
                    }
                    
                    console.log('🔐 解鎖按鈕被點擊，密碼長度:', password.length);
                    console.log('🔐 密碼類型檢查:', typeof password, '值:', password);
                    
                    // 驗證密碼長度
                    if (password.length < 6) {
                        if (errorDiv) {
                            errorDiv.textContent = '密碼長度不足，至少需要6個字元';
                            errorDiv.classList.remove('hidden');
                        }
                        return;
                    }
                    
                    // 禁用按鈕防止重複點擊
                    if (unlockBtn) {
                        unlockBtn.disabled = true;
                        unlockBtn.textContent = '解鎖中...';
                    }
                    
                    try {
                        // 🚨 關鍵修正：直接傳遞字符串而非對象
                        let success = false;
                        
                        if (typeof window.autoDecrypt === 'function') {
                            console.log('📞 調用 autoDecrypt，密碼:', password);
                            success = await window.autoDecrypt(password); // 直接傳遞字符串
                        } else if (typeof window.decryptMemoirData === 'function') {
                            console.log('📞 調用 decryptMemoirData，密碼:', password);
                            success = await window.decryptMemoirData(password); // 直接傳遞字符串
                        } else {
                            throw new Error('解密函數未載入');
                        }
                        
                        console.log('🔓 解鎖結果:', success);
                        
                        if (success) {
                            // 解鎖成功
                            sessionStorage.setItem('mf_pw_unlocked', '1');
                            const modal = document.getElementById('passwordModal');
                            if (modal) {
                                modal.classList.add('hidden');
                            }
                            
                            // 觸發應用程式載入
                            if (typeof gateAndBoot === 'function') {
                                await gateAndBoot();
                            }
                        } else {
                            throw new Error('密碼驗證失敗');
                        }
                        
                    } catch (error) {
                        console.error('🚨 解鎖過程出錯:', error);
                        
                        // 顯示錯誤信息
                        if (errorDiv) {
                            errorDiv.textContent = '密碼錯誤，請重新輸入';
                            errorDiv.classList.remove('hidden');
                        }
                    } finally {
                        // 恢復按鈕狀態
                        if (unlockBtn) {
                            unlockBtn.disabled = false;
                            unlockBtn.textContent = '解鎖';
                        }
                    }
                };

                submit?.addEventListener('click', tryUnlock);
                input?.addEventListener('keydown', (e) => { 
                    if (e.key === 'Enter') tryUnlock(); 
                });

                return; // 不繼續執行 gateAndBoot
            }

            gateAndBoot();

            // 頁面載入時追蹤
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => trackPageView('page_view'));
            } else {
                trackPageView('page_view');
            }

            // 解密成功時追蹤
            window.addEventListener('memoir:decrypted', () => {
                trackPageView('content_decrypted');
            });

            // 頁面即將離開時追蹤（會話時長）
            let startTime = Date.now();
            window.addEventListener('beforeunload', () => {
                const sessionDuration = Date.now() - startTime;
                navigator.sendBeacon(`${BACKEND_URL}/api/analytics/track`, JSON.stringify({
                    memoir_id: MEMOIR_ID,
                    event_type: 'session_end',
                    session_duration: sessionDuration,
                    timestamp: new Date().toISOString()
                }));
            });

            // 媒體互動追蹤
            window.addEventListener('memoir:media_view', (e) => {
                trackPageView('media_interaction');
            });
        })();
    

// ========== 提取的腳本區塊 ==========

        let _autoDecryptImpl;
        let __HAS_AUTO_DECRYPT_IMPL__ = false;

        Object.defineProperty(window, 'autoDecrypt', {
            configurable: true,
            set(fn) { 
                _autoDecryptImpl = fn; 
                __HAS_AUTO_DECRYPT_IMPL__ = true; 
            },
            get() {
                if (!__HAS_AUTO_DECRYPT_IMPL__) {
                    return undefined;
                }
                
                return async (opts = {}) => {
                    if (window.__APPROVAL__?.checked && !window.__APPROVAL__.ok) {
                        return false;
                    }
                    return _autoDecryptImpl?.({ ...opts, approvalToken: window.__APPROVAL__?.token });
                };
            }
        });
    

// ========== 提取的腳本區塊 ==========

        window.decryptMemoirData = (pwd) => window.autoDecrypt?.(pwd);

        window.debugDecryption = async function() {
            const encEl = document.getElementById('enc-payload');
            if (!encEl) {
                return;
            }
            
            const encText = encEl.textContent || encEl.innerText || '';
            
            try {
                const encData = JSON.parse(encText);
            } catch (e) {
                console.error(e);
                return;
            }
            
            const params = new URLSearchParams(location.hash.slice(1));
            const k = params.get('k');
            
            if (k) {
                try {
                    const b64 = k.replace(/-/g, '+').replace(/_/g, '/');
                    const padLength = (4 - (b64.length % 4)) % 4;
                    const paddedB64 = b64 + '='.repeat(padLength);
                    
                    const raw = atob(paddedB64);
                    const secretBytes = new Uint8Array([...raw].map(c => c.charCodeAt(0)));
                } catch (e) {
                    console.error(e);
                }
            }
        };

    

// ========== 提取的腳本區塊 ==========

        document.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            return false;
        });
        
        document.addEventListener('selectstart', e => e.preventDefault());
        document.addEventListener('dragstart', e => e.preventDefault());
        
        document.addEventListener('keydown', function(e) {
            if (e.keyCode === 123 || 
                (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) ||
                (e.ctrlKey && e.keyCode === 85)) {
                e.preventDefault();
                return false;
            }
        });
        
        let devtools = {open: false, orientation: null};
        const threshold = 160;
        setInterval(function() {
            if (window.outerHeight - window.innerHeight > threshold || 
                window.outerWidth - window.innerWidth > threshold) {
                if (!devtools.open) {
                    devtools.open = true;
                }
            } else {
                devtools.open = false;
            }
        }, 500);
        
        if (typeof lucide !== 'undefined') {
            try {
                lucide.createIcons();
            } catch (e) {
                console.warn(e);
            }
        }
        
        window.showPasswordPrompt = window.showPasswordPrompt || function(errorMessage = '') {
            const loadingScreen = document.getElementById('loadingScreen');
            const passwordModal = document.getElementById('passwordModal');
            
            if (loadingScreen) loadingScreen.classList.add('hidden');
            if (passwordModal) {
                passwordModal.classList.remove('hidden');
                
                const errorDiv = document.getElementById('passwordError');
                if (errorMessage && errorDiv) {
                    errorDiv.textContent = errorMessage;
                    errorDiv.classList.remove('hidden');
                } else if (errorDiv) {
                    errorDiv.classList.add('hidden');
                }
                
                const passwordInput = document.getElementById('memoirPassword');
                if (passwordInput) {
                    setTimeout(() => passwordInput.focus(), 100);
                }
            }
        };
        
        document.addEventListener('DOMContentLoaded', function() {
            window.debugDecryption();

            const unlockBtn = document.getElementById('unlockBtn');
            const passwordInput = document.getElementById('memoirPassword');
            const cancelBtn = document.getElementById('cancelBtn');
            const toggleBtn = document.getElementById('togglePasswordBtn');

            if (!passwordInput || !toggleBtn) return;

            let inputTimeout;
            passwordInput.addEventListener('input', function(e) {
                clearTimeout(inputTimeout);
                inputTimeout = setTimeout(() => {
                    // 這裡可以添加必要的輸入處理邏輯
                }, 150); // 150ms 防抖
            });

            let isPasswordVisible = false;
            
            toggleBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                isPasswordVisible = !isPasswordVisible;
                
                if (isPasswordVisible) {
                    passwordInput.type = 'text';
                    toggleBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;
                    toggleBtn.title = '隱藏密碼';
                } else {
                    passwordInput.type = 'password';
                    toggleBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
                    toggleBtn.title = '顯示密碼';
                }
                
                // 🚨 保持焦點在輸入框
                passwordInput.focus();
                
                // 🚨 保持游標位置
                const cursorPos = passwordInput.selectionStart;
                setTimeout(() => {
                    passwordInput.setSelectionRange(cursorPos, cursorPos);
                }, 0);
            });
            
            // 🚨 鍵盤快捷鍵：Ctrl/Cmd + Shift + H 切換顯示
            passwordInput.addEventListener('keydown', function(e) {
                if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'H') {
                    e.preventDefault();
                    toggleBtn.click();
                }
            });
            
            // 🚨 性能優化：移除不必要的事件監聽
            passwordInput.addEventListener('focus', function() {
                // 移除可能導致卡頓的動畫
                this.style.transition = 'border-color 0.15s ease';
            });
            
            passwordInput.addEventListener('blur', function() {
                // 恢復正常狀態
                this.style.transition = 'border-color 0.15s ease';
            });

            if (unlockBtn) {
                unlockBtn.addEventListener('click', async function () {
                    const password = passwordInput ? passwordInput.value.trim() : '';
                    console.log('🔐 解鎖按鈕被點擊，密碼長度:', password.length);
                    
                    // 隱藏之前的錯誤訊息
                    const errorDiv = document.getElementById('passwordError');
                    if (errorDiv) {
                        errorDiv.classList.add('hidden');
                    }
                    
                    if (!password) {
                        if (errorDiv) {
                            errorDiv.textContent = '請輸入密碼';
                            errorDiv.classList.remove('hidden');
                        }
                        return;
                    }
                    
                    if (password.length < 6) {
                        if (errorDiv) {
                            errorDiv.textContent = '密碼長度不足，至少需要6個字元';
                            errorDiv.classList.remove('hidden');
                        }
                        return;
                    }
                    
                    // 禁用按鈕防止重複點擊
                    unlockBtn.disabled = true;
                    unlockBtn.textContent = '解鎖中...';
                    console.log(`password=${password}`)
                    try {
                        if (typeof window.autoDecrypt === 'function') {
                            const success = await window.autoDecrypt(password);
                            console.log(`success=${success}`)
                            if (!success) {
                                throw new Error('解鎖失敗');
                            }
                        } else if (typeof window.decryptMemoirData === 'function') {
                            const success = await window.decryptMemoirData(password);
                            console.log(`success=${success}`)
                            if (!success) {
                                throw new Error('解鎖失敗');
                            }
                        } else {
                            throw new Error('解密函數未載入');
                        }
                    } catch (error) {
                        console.error('解鎖過程出錯:', error);
                        if (errorDiv) {
                            errorDiv.textContent = error.message || '解鎖失敗，請檢查密碼';
                            errorDiv.classList.remove('hidden');
                        }
                    } finally {
                        // 恢復按鈕狀態
                        unlockBtn.disabled = false;
                        unlockBtn.textContent = '解鎖查看';
                    }
                });
            }
            
            if (passwordInput) {
                passwordInput.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') {
                        unlockBtn.click();
                    }
                });
            }
        });
    

// ========== 提取的腳本區塊 ==========

        window.__bootApp__ = function bootAppWhenReady() {
            try {
                const hasData = !!(window.MEMOIR_DATA && window.MEMOIR_DATA.events);
                
                if (!hasData) {
                    return false; 
                }
                
                if (typeof initializeApp === 'function') {
                    initializeApp();
                    return true;
                } else {
                    document.dispatchEvent(new Event('memoir:app:start'));
                    return true;
                }
            } catch (e) {
                console.error(e);
                return false;
            }
        };

        window.addEventListener('memoir:decrypted', (e) => {
            if (e && e.detail) {
                const memoirData = e.detail.data || e.detail; 
                window.MEMOIR_DATA = memoirData;
                
                setTimeout(() => {
                    if (typeof window.__bootApp__ === 'function') {
                        const started = window.__bootApp__();
                        if (!started) {
                            setTimeout(() => window.__bootApp__(), 5000);
                        }
                    }
                }, 100);
            }
        });

        document.addEventListener('DOMContentLoaded', function () {
            const getMode = () => document.querySelector('meta[name="encryption-mode"]')?.content || 'static';

            function fillFromPreloadJSON() {
                if (window.MEMOIR_DATA?.events) return true;
                const el = document.getElementById('preloaded-memoir-data');
                if (!el) return false;
                try {
                    const txt = el.textContent || '';
                    window.MEMOIR_DATA = JSON.parse(txt);
                    return !!window.MEMOIR_DATA?.events;
                } catch (e) {
                    console.warn(e);
                    return false;
                }
            }

            function bootIfReady() {
                const ready = fillFromPreloadJSON() || !!(window.MEMOIR_DATA && window.MEMOIR_DATA.events);
                if (ready) {
                    if (typeof initializeApp === 'function') {
                        initializeApp();
                    } else if (typeof window.__bootApp__ === 'function') {
                        window.__bootApp__();
                    }
                    return true;
                }
                return false;
            }

            window.__bootApp__ = bootIfReady;

            setTimeout(async () => {

                const ok = await (window.__preInitApproval__?.() ?? true);
                if (!ok) {
                    return;
                }


                const mode = getMode();

                if (mode === 'server') {
                    if (!bootIfReady()) {

                        window.addEventListener('memoir:decrypted', (e) => {
                            if (e?.detail) {
                                const memoirData = e.detail.data || e.detail;
                                window.MEMOIR_DATA = memoirData;
                                bootIfReady();
                            }
                        }, { once: true });

                        if (typeof window.autoDecrypt === 'function') {
                            window.autoDecrypt().catch(err => {
                                console.error(err);
                            });
                        } else {
                            let attempts = 0;
                            const checkInterval = setInterval(() => {
                                if (typeof window.autoDecrypt === 'function') {
                                    clearInterval(checkInterval);
                                    window.autoDecrypt().catch(err => {
                                        console.error(err);
                                    });
                                } else if (++attempts > 50) {
                                    clearInterval(checkInterval);
                                }
                            }, 100);
                        }

                        setTimeout(() => {
                            if (!bootIfReady()) {
                                showError('伺服器解密逾時，請稍後再試或改用密碼解鎖。');
                            }
                        }, 15000);
                    }
                } else {
                    if (!bootIfReady()) {
                        if (typeof window.autoDecrypt === 'function') {
                            window.autoDecrypt().catch(err => {
                                console.warn(err);
                            });
                        }
                    }
                }
            }, 1500);
        });

        window.addEventListener('error', function(e) {
            if (!document.getElementById('app')?.classList.contains('hidden')) {
                return;
            }
            showError(`系統錯誤: ${e.error?.message || '未知錯誤'}`);
        });

        window.addEventListener('unhandledrejection', function(e) {
            console.error(e.reason);
            if (!document.getElementById('app')?.classList.contains('hidden')) {
                return;
            }
            showError(`載入錯誤: ${e.reason?.message || '網路連接問題'}`);
        });

        function showError(message) {
            console.error('💥 顯示錯誤訊息:', message);
            
            // 隱藏其他畫面
            const loading = document.getElementById('loadingScreen');
            const app = document.getElementById('app');
            const password = document.getElementById('passwordModal');
            
            loading?.classList.add('hidden');
            app?.classList.add('hidden');
            password?.classList.add('hidden');
            
            // 創建錯誤畫面 - 使用禁止符號
            const errorScreen = document.createElement('div');
            errorScreen.style.cssText = `
                position: fixed; 
                inset: 0; 
                background: linear-gradient(135deg, #1a1a2e, #16213e); 
                display: flex; 
                flex-direction: column; 
                align-items: center; 
                justify-content: center; 
                z-index: 10000; 
                text-align: center; 
                padding: 20px; 
                color: white;
                font-family: Arial, sans-serif;
            `;
            
            errorScreen.innerHTML = `
                <div style="font-size: 80px; margin-bottom: 30px; color: #ef4444;">🚫</div>
                <h1 style="font-size: 32px; font-weight: bold; margin-bottom: 20px;">載入失敗</h1>
                <p style="font-size: 18px; margin-bottom: 30px; max-width: 600px; line-height: 1.6; color: #9ca3af;">
                    ${message}
                </p>
                <button onclick="location.reload()" style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); 
                        color: white; border: none; padding: 16px 32px; border-radius: 12px; font-size: 18px; 
                        font-weight: 600; cursor: pointer; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);">
                    🔄 重新載入
                </button>
            `;
            
            document.body.appendChild(errorScreen);
        }

        window.initializeMemoirApp = typeof initializeApp !== 'undefined' ? initializeApp : function() {
            console.warn('⚠️ initializeApp 未定義，使用空函數');
        };
    

// ========== 提取的腳本區塊 ==========

        (function() {
            'use strict';
            
            let ENCRYPTION_ENABLED = document.querySelector('meta[name="memoir-encryption"]')?.content === 'true';;
            let MEMOIR_DATA = null;

            try {
            const pre = document.getElementById('preloaded-memoir-data');
            if (!MEMOIR_DATA && pre && pre.textContent && pre.textContent.trim().length) {
                MEMOIR_DATA = JSON.parse(pre.textContent);
            } else if (!MEMOIR_DATA && typeof window !== 'undefined' && typeof window.MEMOIR_DATA !== 'undefined') {
                MEMOIR_DATA = window.MEMOIR_DATA;
            }
            } catch (e) {
            console.warn(e);
            }

            let isUnlocked = false;
            let currentEventIndex = 0;
            let currentMediaIndex = 0;
            let showSubtitles = true;
            let showGrid = false;

            const TYPEWRITER_KEY = 'memoirflow:typewriter';
            let typewriterEnabled = localStorage.getItem(TYPEWRITER_KEY) !== 'false'; // 預設開啟

            const FONT_SIZE_KEY = 'memoirflow:font';
            let fontSize = localStorage.getItem(FONT_SIZE_KEY) || 'medium';

            let isTransitioning = false;
            let typewriterTimer = null;
            let typewriterText = '';
            let typewriterIndex = 0;
            let isTyping = false;

            const elements = {
                fontSmall: document.getElementById('fontSmall'),
                fontMedium: document.getElementById('fontMedium'),
                fontLarge: document.getElementById('fontLarge'),
                loadingScreen: document.getElementById('loadingScreen'),
                passwordModal: document.getElementById('passwordModal'),
                app: document.getElementById('app'),
                loadingStatus: document.getElementById('loadingStatus'),
                typewriterToggle: document.getElementById('typewriterToggle'),
                settingsBtn: document.getElementById('settingsBtn'),
                settingsMenu: document.getElementById('settingsMenu'),
                timelineBtn: document.getElementById('timelineBtn'),
                helpBtn: document.getElementById('helpBtn'),
                skipTypingBtn: document.getElementById('skipTypingBtn'),
                prevEventBtn: document.getElementById('prevEventBtn'),
                nextEventBtn: document.getElementById('nextEventBtn'),
                prevMediaBtn: document.getElementById('prevMediaBtn'),
                nextMediaBtn: document.getElementById('nextMediaBtn'),
                gridToggle: document.getElementById('gridToggle'),
                subtitleToggle: document.getElementById('subtitleToggle'),
                subtitleArea: document.getElementById('subtitleArea'),
                mainContent: document.getElementById('mainContent'),
                mediaCarousel: document.getElementById('mediaCarousel'),
                mediaGrid: document.getElementById('mediaGrid'),
                mediaDisplay: document.getElementById('mediaDisplay'),
                thumbnailsScroll: document.getElementById('thumbnailsScroll'),
                gridContainer: document.getElementById('gridContainer'),
                currentEventNum: document.getElementById('currentEventNum'),
                totalEvents: document.getElementById('totalEvents'),
                mediaCount: document.getElementById('mediaCount'),
                eventDate: document.getElementById('eventDate'),
                eventTitle: document.getElementById('eventTitle'),
                eventDescription: document.getElementById('eventDescription'),
                mediaCounterOverlay: document.getElementById('mediaCounterOverlay'),
                timelinePanel: document.getElementById('timelinePanel'),
                timelineClose: document.getElementById('timelineClose'),
                timelineScroll: document.getElementById('timelineScroll'),
                helpPanel: document.getElementById('helpPanel'),
                helpClose: document.getElementById('helpClose'),
                mediaViewer: document.getElementById('mediaViewer'),
                mediaViewerContent: document.getElementById('mediaViewerContent'),
                headerToggleBtn: document.getElementById('headerToggleBtn'),
                mobileHeaderToggleBtn: document.getElementById('mobileHeaderToggleBtn'),
                headerContent: document.getElementById('headerContent'),
                header: document.querySelector('.header'),            
                progressIndicator: document.getElementById('progressIndicator'),
                progressDots: document.getElementById('progressDots'),
                currentPosition: document.getElementById('currentPosition'),
                totalEvents: document.getElementById('totalEvents'),
                currentDate: document.getElementById('currentDate'),
                quickDock: document.getElementById('quickDock'),
                quickSettingsBtn: document.getElementById('quickSettingsBtn'),
                quickTimelineBtn: document.getElementById('quickTimelineBtn'),
            };

            const SETTINGS_POS_KEY = 'memoirflow:settings-pos';
            let settingsDragReady = false;

            function initDraggableSettingsMenu(){
                const menu = elements.settingsMenu;
                if (!menu) return;


                // 選單的關閉圖示

                menu.classList.add('floating');

                const handle = menu.querySelector('.settings-header');
                handle.id = 'settingsDragHandle';

                const closeBtn = handle.querySelector('#settingsClose');
                if (closeBtn) {
                closeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();              // 不觸發拖曳
                    menu.classList.remove('visible'); // 關閉選單（依你的 CSS 狀態）
                    // menu.classList.add('hidden');  // 若需要同時加 hidden，就打開這行
                });
                }

                const saved = JSON.parse(localStorage.getItem(SETTINGS_POS_KEY) || 'null');
                if (saved && Number.isFinite(saved.left) && Number.isFinite(saved.top)) {
                    menu.style.left = saved.left + 'px';
                    menu.style.top  = saved.top  + 'px';
                } else {
                    positionSettingsNearButton();
                }

                let startX=0, startY=0, startLeft=0, startTop=0;

                handle.addEventListener('pointerdown', (e) => {
                // ✋ 點到關閉鈕或裡面的圖示就不拖
                if (e.target.closest('#settingsClose')) return;

                e.preventDefault();
                e.stopPropagation();
                menu.setPointerCapture?.(e.pointerId);

                const rect = menu.getBoundingClientRect();
                startLeft = rect.left;
                startTop  = rect.top;
                startX = e.clientX;
                startY = e.clientY;

                menu.classList.add('dragging');
                window.addEventListener('pointermove', onMove);
                window.addEventListener('pointerup', onUp, { once:true });
                });

                function onMove(e){
                    const dx = e.clientX - startX;
                    const dy = e.clientY - startY;

                    const w = menu.offsetWidth;
                    const h = menu.offsetHeight;
                    const minL = 0, minT = 0;
                    const maxL = window.innerWidth  - w;
                    const maxT = window.innerHeight - h;

                    const left = Math.min(Math.max(startLeft + dx, minL), maxL);
                    const top  = Math.min(Math.max(startTop  + dy, minT), maxT);

                    menu.style.left = left + 'px';
                    menu.style.top  = top  + 'px';
                }

                function onUp(){
                    menu.classList.remove('dragging');
                    window.removeEventListener('pointermove', onMove);

                    const rect = menu.getBoundingClientRect();
                    localStorage.setItem(SETTINGS_POS_KEY,
                    JSON.stringify({ left: Math.round(rect.left), top: Math.round(rect.top) })
                    );
                }

                window.addEventListener('resize', ()=>{
                    const rect = menu.getBoundingClientRect();
                    const w = menu.offsetWidth;
                    const h = menu.offsetHeight;
                    const left = Math.min(Math.max(rect.left, 0), window.innerWidth - w);
                    const top  = Math.min(Math.max(rect.top , 0), window.innerHeight - h);
                    menu.style.left = left + 'px';
                    menu.style.top  = top  + 'px';
                });

                function positionSettingsNearButton(){
                    const trigger = elements.quickSettingsBtn || elements.settingsBtn;
                    if (!trigger) return;
                    const b = trigger.getBoundingClientRect();

                    const wasHidden = !menu.classList.contains('visible');
                    if (wasHidden) { menu.style.visibility='hidden'; menu.classList.add('visible'); }

                    const menuW = menu.offsetWidth, menuH = menu.offsetHeight;

                    let left = b.left + b.width + 12;
                    let top  = b.top;
                    left = Math.min(Math.max(12, left), window.innerWidth  - menuW - 12);
                    top  = Math.min(Math.max(12, top ), window.innerHeight - menuH - 12);

                    menu.style.left = left + 'px';
                    menu.style.top  = top  + 'px';

                    if (wasHidden) { menu.classList.remove('visible'); menu.style.visibility=''; }
                }

                window.positionSettingsNearButton = positionSettingsNearButton;
                settingsDragReady = true;
            }

            function renderProgressIndicator() {
                if (!elements.progressDots || !MEMOIR_DATA || !MEMOIR_DATA.events) return;
                
                const sortedEvents = getSortedEvents();
                const totalCount = sortedEvents.length;
                
                if (elements.currentPosition) {
                    elements.currentPosition.textContent = currentEventIndex + 1;
                }
                if (elements.totalEvents) {
                    elements.totalEvents.textContent = totalCount;
                }
                
                if (elements.currentDate && sortedEvents[currentEventIndex]) {
                    const currentEvent = sortedEvents[currentEventIndex];
                    try {
                        const eventDate = new Date(currentEvent.date).toLocaleDateString('zh-TW', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        });
                        elements.currentDate.textContent = eventDate;
                    } catch (e) {
                        elements.currentDate.textContent = currentEvent.date;
                    }
                }
                
                elements.progressDots.innerHTML = '';
                
                const useScrollMode = totalCount > 40;
                if (useScrollMode) {
                    elements.progressDots.classList.add('scrollable');
                } else {
                    elements.progressDots.classList.remove('scrollable');
                }
                
                for (let i = 0; i < totalCount; i++) {
                    const dot = document.createElement('div');
                    dot.className = 'progress-dot';
                    
                    if (i < currentEventIndex) {
                        dot.classList.add('completed');
                    } else if (i === currentEventIndex) {
                        dot.classList.add('current');
                    }
                    
                    const event = sortedEvents[i];
                    if (event) {
                        try {
                            const eventDate = new Date(event.date).toLocaleDateString('zh-TW');
                            const tooltip = `${event.title} - ${eventDate}`;
                            dot.setAttribute('data-tooltip', tooltip);
                        } catch (e) {
                            const tooltip = `${event.title} - ${event.date}`;
                            dot.setAttribute('data-tooltip', tooltip);
                        }
                    }
                    
                    dot.addEventListener('click', () => {
                        goToEventFromProgress(i);
                    });
                    
                    elements.progressDots.appendChild(dot);
                }
                
                if (useScrollMode) {
                    setTimeout(() => {
                        const currentDot = elements.progressDots.children[currentEventIndex];
                        if (currentDot) {
                            currentDot.scrollIntoView({
                                behavior: 'smooth',
                                block: 'nearest',
                                inline: 'center'
                            });
                        }
                    }, 100);
                }
            }

            function goToEventFromProgress(index) {
                if (!MEMOIR_DATA || !MEMOIR_DATA.events) return;
                
                const sortedEvents = getSortedEvents();
                if (index >= 0 && index < sortedEvents.length) {
                    const dots = document.querySelectorAll('.progress-dot');
                    if (dots[index]) {
                        dots[index].style.transform = dots[index].classList.contains('current') ? 'scale(1.6)' : 'scale(1.5)';
                        setTimeout(() => {
                            dots[index].style.transform = '';
                        }, 200);
                    }
                    
                    goToEvent(index);
                }
            }

            const DOCK_OPEN_KEY = 'memoirflow:dock-open';
            let isDockOpen = (localStorage.getItem(DOCK_OPEN_KEY) ?? 'true') === 'true';

            function initDock() {                
                const storedState = localStorage.getItem(DOCK_OPEN_KEY);
                if (storedState !== null) {
                    isDockOpen = storedState === 'true';
                }
                
                applyDockState(false);
                updateDockToggleIcon();
                
                if (elements.quickTimelineBtn) {
                    elements.quickTimelineBtn.onclick = function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        showTimeline();
                        
                        if (isDockOpen) {
                            isDockOpen = false;
                            localStorage.setItem(DOCK_OPEN_KEY, 'false');
                            applyDockState(true);
                            updateDockToggleIcon();
                        }
                    };
                }
            }

            function toggleDock() {
                isDockOpen = !isDockOpen;
                localStorage.setItem(DOCK_OPEN_KEY, String(isDockOpen));
                
                applyDockState(true);
                updateDockToggleIcon();
            }

            function applyDockState(animate = false) {
                if (isDockOpen) {
                    elements.quickDock.classList.add('open');
                } else {
                    elements.quickDock.classList.remove('open');
                }
            }

            function updateDockToggleIcon() {
                const buttons = [elements.headerToggleBtn, elements.mobileHeaderToggleBtn];
                buttons.forEach((btn, index) => {
                    if (!btn) return;
                    
                    const icon = btn.querySelector('i[data-lucide]');
                    if (!icon) return;

                    if (isDockOpen) {
                        btn.classList.remove('collapsed');
                        btn.title = '收合快速工具列';
                        icon.setAttribute('data-lucide', 'chevron-down');
                    } else {
                        btn.classList.add('collapsed');
                        btn.title = '展開快速工具列';
                        icon.setAttribute('data-lucide', 'chevron-up');
                    }
                });
                
                if (typeof lucide !== 'undefined') { 
                    try { lucide.createIcons(); } catch (e) {} 
                }
            }

            const HEADER_COLLAPSED_KEY = 'memoirflow:header-collapsed';
            let isHeaderCollapsed = localStorage.getItem(HEADER_COLLAPSED_KEY) === 'true';

            function toggleHeaderCollapse() {
                isHeaderCollapsed = !isHeaderCollapsed;
                localStorage.setItem(HEADER_COLLAPSED_KEY, String(isHeaderCollapsed));
                applyHeaderCollapseState();
            }

            // 修改標題收合邏輯
            function applyHeaderCollapseState() {
                if (!elements.headerContent || !elements.header) return;
                
                if (isHeaderCollapsed) {
                    // 收縮狀態
                    elements.headerContent.style.display = 'none';
                    elements.header.classList.add('collapsed');
                    
                    // 添加空間優化類
                    document.body.classList.add('header-collapsed');
                    
                    // 字幕區域保持可見，但位置調整
                    if (elements.subtitleArea) {
                        elements.subtitleArea.style.marginTop = '6px';
                    }
                    
                    updateToggleButtonIcon(true);
                } else {
                    // 展開狀態
                    elements.headerContent.style.display = 'flex';
                    elements.header.classList.remove('collapsed');
                    
                    // 移除空間優化類
                    document.body.classList.remove('header-collapsed');
                    
                    // 恢復字幕區域正常位置
                    if (elements.subtitleArea) {
                        elements.subtitleArea.style.marginTop = '';
                    }
                    
                    updateToggleButtonIcon(false);
                }
                
                // 重新計算媒體區域大小
                optimizeMediaSpace();
            }

            // 新增：媒體空間優化函數
            function optimizeMediaSpace() {
                const mainContent = elements.mainContent;
                const mediaArea = elements.mediaArea;
                const mediaCarousel = elements.mediaCarousel;
                
                if (!mainContent || !mediaArea) return;
                
                // 計算可用空間
                let availableSpace = window.innerHeight;
                
                // 減去標題區域占用的空間
                if (!isHeaderCollapsed) {
                    const titleContainer = document.getElementById('title-container');
                    const headerContent = elements.headerContent;
                    if (titleContainer) availableSpace -= titleContainer.offsetHeight;
                    if (headerContent && headerContent.style.display !== 'none') {
                        availableSpace -= headerContent.offsetHeight;
                    }
                } else {
                    // 標題收合時只保留最小高度
                    availableSpace -= 60; // 收合後的最小標題高度
                }
                
                // 減去字幕區域占用的空間
                if (elements.subtitleArea && elements.subtitleArea.style.display !== 'none') {
                    let subtitleHeight = elements.subtitleArea.offsetHeight;
                    
                    // 如果字幕內容被隱藏，使用較小的高度
                    if (!showSubtitles) {
                        const headerInfo = elements.subtitleArea.querySelector('.subtitle-header-info');
                        const subtitleHeader = elements.subtitleArea.querySelector('.subtitle-header');
                        if (headerInfo && subtitleHeader) {
                            subtitleHeight = headerInfo.offsetHeight + subtitleHeader.offsetHeight + 32; // 加上 padding
                        }
                    }
                    
                    availableSpace -= subtitleHeight;
                }
                
                // 設置媒體區域的高度
                if (mediaArea) {
                    const newHeight = Math.max(300, availableSpace - 40); // 最小高度 300px，預留 40px 邊距
                    mediaArea.style.height = `${newHeight}px`;
                }
                
                // 觸發媒體顯示更新
                if (window.displayMedia) {
                    setTimeout(() => {
                        window.displayMedia();
                    }, 100);
                }
            }            
            
            function updateToggleButtonIcon(collapsed) {
                const buttons = [elements.headerToggleBtn, elements.mobileHeaderToggleBtn];
                buttons.forEach(btn => {
                    if (btn) {
                        const icon = btn.querySelector('i[data-lucide]');
                        if (icon) {
                            if (collapsed) {
                                btn.classList.add('collapsed');
                                btn.title = '展開控制面板';
                                icon.setAttribute('data-lucide', 'chevron-down');
                            } else {
                                btn.classList.remove('collapsed');
                                btn.title = '收合控制面板';
                                icon.setAttribute('data-lucide', 'chevron-up');
                            }
                        }
                    }
                });
                
                if (typeof lucide !== 'undefined') {
                    try {
                        lucide.createIcons();
                    } catch (e) {
                        console.warn(e);
                    }
                }
            }

            function initializeEncryption() {
                if (ENCRYPTION_ENABLED) {
                    if (typeof window.decryptMemoirData !== 'function') {
                    showError('系統錯誤：缺少解密組件');
                    return false;
                    }

                    if (typeof window.requiresPassword === 'boolean' && window.requiresPassword) {
                    window.showPasswordPrompt();
                    return false;
                    }

                    const tryAuto = typeof window.autoDecrypt === 'function' ? window.autoDecrypt : undefined;
                    if (tryAuto) {
                    const t = setTimeout(() => {
                        showError('解密模組載入逾時，請重整或稍後再試');
                    }, 6000);

                    Promise.resolve(tryAuto()).finally(() => clearTimeout(t));
                    return false;
                    }
                }
                return true;
            }

            function updateLoadingStatus(message) {
                if (elements.loadingStatus) {
                    elements.loadingStatus.textContent = message;
                }
            }
            
            function showError(message) {
                if (elements.app) elements.app.classList.add('hidden');
                if (elements.loadingScreen) elements.loadingScreen.classList.add('hidden');
                if (elements.passwordModal) elements.passwordModal.classList.add('hidden');
                
                document.body.innerHTML += `
                    <div style="position: fixed; inset: 0; background: linear-gradient(135deg, #1a1a2e, #16213e); 
                                display: flex; flex-direction: column; align-items: center; justify-content: center; 
                                z-index: 10000; text-align: center; padding: 20px; color: white;">
                        <div style="font-size: 80px; margin-bottom: 30px; color: #ef4444;">🔒</div>
                        <h1 style="font-size: 32px; font-weight: bold; margin-bottom: 20px;">載入失敗</h1>
                        <p style="font-size: 18px; margin-bottom: 30px; max-width: 600px; line-height: 1.6; color: #9ca3af;">
                            ${message}
                        </p>
                        <button onclick="location.reload()" style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); 
                                color: white; border: none; padding: 16px 32px; border-radius: 12px; font-size: 18px; 
                                font-weight: 600; cursor: pointer; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);">
                            🔄 重新載入
                        </button>
                    </div>
                `;
            }

            function teardownMarquee(el){
            if(!el) return;
            if(el.classList && el.classList.contains('marquee')){
                const inner = el.querySelector('.marquee__inner');
                if(inner){
                const first = inner.querySelector('.marquee__content');
                if(first){
                    el.textContent = first.textContent;
                }
                }
                el.classList.remove('marquee');
                el.classList.add('truncate-one-line');
                return;
            }
            const marquee = el.querySelector?.('.marquee');
            if(marquee){
                const inner = marquee.querySelector('.marquee__inner');
                const first = inner?.querySelector('.marquee__content');
                el.textContent = first?.textContent || el.textContent;
            }
            el.classList?.add('truncate-one-line');
            }

            function applyMarqueeIfOverflow(el, {minSpeed = 60, maxSpeed = 140, gap = 48} = {}){
            if(!el) return;

            teardownMarquee(el);

            el.classList.add('truncate-one-line');

            const isOverflow = el.scrollWidth > el.clientWidth;
            if(!isOverflow) return; 

            const text = el.textContent;

            el.classList.remove('truncate-one-line');
            el.classList.add('marquee');
            el.innerHTML = `
                <div class="marquee__inner" aria-hidden="false">
                <span class="marquee__content"></span>
                <span class="marquee__content"></span>
                </div>
            `;
            const contents = el.querySelectorAll('.marquee__content');
            contents.forEach(c => c.textContent = text);
            const first = el.querySelector('.marquee__content');
            const temp = document.createElement('span');
            temp.style.position = 'absolute';
            temp.style.visibility = 'hidden';
            temp.style.whiteSpace = 'nowrap';
            temp.style.font = getComputedStyle(el).font; 
            temp.textContent = text;
            document.body.appendChild(temp);
            const contentWidth = temp.offsetWidth;
            document.body.removeChild(temp);

            const containerWidth = el.clientWidth;
            const totalTravel = contentWidth + gap + contentWidth + gap; 
            const ratio = Math.min(3, Math.max(1, contentWidth / containerWidth));
            const pxPerSecond = Math.max(minSpeed, Math.min(maxSpeed, 60 * ratio));
            const duration = Math.max(8, Math.min(40, totalTravel / pxPerSecond)); // 限制在 8~40 秒
            const inner = el.querySelector('.marquee__inner');
            inner.style.setProperty('--gap', `${gap}px`);
            inner.style.setProperty('--duration', `${duration}s`);
            }

            function startTypewriter(text, element, speed = 50) {
                if (!typewriterEnabled || !text || !element) {
                    if (element) element.textContent = text || '';
                    return Promise.resolve();
                }
                
                return new Promise((resolve) => {
                    typewriterText = text;
                    typewriterIndex = 0;
                    isTyping = true;
                    element.textContent = '';
                    
                    if (elements.skipTypingBtn) {
                        elements.skipTypingBtn.classList.remove('hidden');
                    }
                    
                    function typeNextChar() {
                        if (typewriterIndex < typewriterText.length && isTyping) {
                            element.textContent = typewriterText.slice(0, typewriterIndex + 1) + '|';
                            typewriterIndex++;
                            typewriterTimer = setTimeout(typeNextChar, speed);
                        } else {
                            element.textContent = typewriterText;
                            isTyping = false;
                            if (elements.skipTypingBtn) {
                                elements.skipTypingBtn.classList.add('hidden');
                            }
                            resolve();
                        }
                    }
                    
                    typeNextChar();
                });
            }

            function toggleTypewriter() {
                typewriterEnabled = !typewriterEnabled;
                localStorage.setItem(TYPEWRITER_KEY, String(typewriterEnabled));
                updateTypewriterToggle();
                if (isTyping) stopTypewriter();
            }

            function updateTypewriterToggle() {
                if (elements.typewriterToggle) {
                    if (typewriterEnabled) {
                        elements.typewriterToggle.classList.add('active');
                    } else {
                        elements.typewriterToggle.classList.remove('active');
                    }
                }
            }

            function setFontSize(size) {
                fontSize = size;
                localStorage.setItem(FONT_SIZE_KEY, fontSize);
                applyFontSize();
                updateFontSizeButtons();
                applyMarqueeIfOverflow(document.querySelector('.title-text'));
                applyMarqueeIfOverflow(document.querySelector('.mobile-title'));
                applyMarqueeIfOverflow(elements.eventTitle);
            }

            function toggleGridMode() {
                showGrid = !showGrid;
                updateGridToggle();
                updateViewMode();
            }

            function updateFontSizeButtons() {
                if (elements.fontSmall) elements.fontSmall.classList.toggle('active', fontSize === 'small');
                if (elements.fontMedium) elements.fontMedium.classList.toggle('active', fontSize === 'medium');
                if (elements.fontLarge) elements.fontLarge.classList.toggle('active', fontSize === 'large');
                
                switch (fontSize) {
                    case 'small':
                        if (elements.fontSmall) elements.fontSmall.classList.add('active');
                        break;
                    case 'medium':
                        if (elements.fontMedium) elements.fontMedium.classList.add('active');
                        break;
                    case 'large':
                        if (elements.fontLarge) elements.fontLarge.classList.add('active');
                        break;
                }
            }

            function applyFontSize() {
                document.documentElement.setAttribute('data-font', fontSize);
            }

            function stopTypewriter() {
                if (typewriterTimer) {
                    clearTimeout(typewriterTimer);
                    typewriterTimer = null;
                }
                isTyping = false;
                if (elements.skipTypingBtn) {
                    elements.skipTypingBtn.classList.add('hidden');
                }
                if (elements.eventDescription && typewriterText) {
                    elements.eventDescription.textContent = typewriterText;
                }
            }
            
            function initEventListeners() {
                
                initDock();
                initDraggableSettingsMenu();

                elements.settingsMenu?.classList.remove('visible');
                elements.quickSettingsBtn = document.getElementById('quickSettingsBtn');

                window.addEventListener('resize', () => {
                    applyMarqueeIfOverflow(document.querySelector('.title-text'));
                    applyMarqueeIfOverflow(document.querySelector('.mobile-title'));
                    applyMarqueeIfOverflow(elements.eventTitle);
                    setTimeout(optimizeMediaSpace, 100);
                });

                if (elements.fontSmall) {
                    elements.fontSmall.addEventListener('click', () => setFontSize('small'));
                }
                if (elements.fontMedium) {
                    elements.fontMedium.addEventListener('click', () => setFontSize('medium'));
                }
                if (elements.fontLarge) {
                    elements.fontLarge.addEventListener('click', () => setFontSize('large'));
                }

                // 🚨 settings 按鈕事件綁定 - 添加詳細日誌
                if (elements.settingsBtn) {
                    elements.settingsBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        toggleSettingsMenu();
                    });
                }
                
                // 🚨 quickSettings 按鈕事件綁定 - 添加詳細日誌和多種綁定方式
                if (elements.quickSettingsBtn) {
                    
                    elements.quickSettingsBtn.addEventListener('click', (e) => {
                        console.log('🖱️ quickSettingsBtn 被點擊 (addEventListener)');
                        e.stopPropagation();
                        e.preventDefault();
                        toggleSettingsMenu();
                    });
                    
                } else {
                    
                    // 🚨 嘗試多種方式查找元素
                    const altQuickBtn1 = document.querySelector('#quickSettingsBtn');
                    const altQuickBtn2 = document.querySelector('.dock-item:first-child');
                    const altQuickBtn3 = document.querySelector('[id*="Settings"]');
                    
                    if (altQuickBtn1) {
                        elements.quickSettingsBtn = altQuickBtn1;
                        elements.quickSettingsBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            toggleSettingsMenu();
                        });
                    }
                }

                // 在點擊外部區域時收起的邏輯
                document.addEventListener('click', (e) => {
                    const clickInsideDock = elements.quickDock?.contains(e.target);
                    const clickOnToggles =
                        elements.headerToggleBtn?.contains(e.target) ||
                        elements.mobileHeaderToggleBtn?.contains(e.target);

                    const clickInsideSettings = elements.settingsMenu?.contains(e.target);
                    const clickOnAnySettingsBtn =
                        elements.settingsBtn?.contains(e.target) || 
                        elements.quickSettingsBtn?.contains(e.target);

                    // 關閉設定選單
                    if (!clickInsideSettings && !clickOnAnySettingsBtn && elements.settingsMenu) {
                        elements.settingsMenu.classList.remove('visible');
                    }

                    // 關閉 dock（但不在點擊切換按鈕時關閉）
                    if (!clickInsideDock && !clickOnToggles && isDockOpen) {
                        isDockOpen = false;
                        localStorage.setItem(DOCK_OPEN_KEY, 'false');
                        applyDockState(true);
                        updateDockToggleIcon();
                    }
                });

                if (elements.gridToggle) {
                    elements.gridToggle.addEventListener('click', toggleGridMode);
                }                

                // 字幕切換按鈕
                if (elements.subtitleToggle) {
                    elements.subtitleToggle.addEventListener('click', () => {
                        showSubtitles = !showSubtitles;
                        updateSubtitleToggle();
                        updateSubtitleVisibility();
                    });
                }
                
                if (elements.timelineBtn) {
                    elements.timelineBtn.addEventListener('click', showTimeline);
                }
                
                if (elements.helpBtn) {
                    elements.helpBtn.addEventListener('click', showHelp);
                }
                
                if (elements.skipTypingBtn) {
                    elements.skipTypingBtn.addEventListener('click', skipTyping);
                }
                
                if (elements.prevEventBtn) {
                    elements.prevEventBtn.addEventListener('click', () => {
                        if (currentEventIndex > 0) {
                            goToEvent(currentEventIndex - 1);
                        }
                    });
                }
                
                if (elements.nextEventBtn) {
                    elements.nextEventBtn.addEventListener('click', () => {
                        if (MEMOIR_DATA && currentEventIndex < MEMOIR_DATA.events.length - 1) {
                            goToEvent(currentEventIndex + 1);
                        }
                    });
                }
                
                if (elements.prevMediaBtn) {
                    elements.prevMediaBtn.addEventListener('click', () => {
                        if (currentMediaIndex > 0) {
                            goToMedia(currentMediaIndex - 1);
                        }
                    });
                }
                
                if (elements.nextMediaBtn) {
                    elements.nextMediaBtn.addEventListener('click', () => {
                        const currentEvent = getCurrentEvent();
                        if (currentEvent && currentMediaIndex < currentEvent.media.length - 1) {
                            goToMedia(currentMediaIndex + 1);
                        }
                    });
                }
                
                if (elements.timelineClose) {
                    elements.timelineClose.addEventListener('click', hideTimeline);
                }
                
                if (elements.helpClose) {
                    elements.helpClose.addEventListener('click', hideHelp);
                }
                                
                if (elements.mediaViewer) {
                    elements.mediaViewer.addEventListener('click', (e) => {
                        if (e.target === elements.mediaViewer) {
                            hideMediaViewer();
                        }
                    });
                }

                if (elements.typewriterToggle) {
                    elements.typewriterToggle.addEventListener('click', () => {
                        toggleTypewriter();
                        const ev = getCurrentEvent();
                        if (ev && elements.eventDescription && showSubtitles) {
                            stopTypewriter();
                            if (typewriterEnabled) {
                                startTypewriter(ev.description, elements.eventDescription);
                            } else {
                                elements.eventDescription.textContent = ev.description || '';
                            }
                        }
                    });
                }

                document.addEventListener('keydown', handleKeyPress);
                initTouchSwipe();
            }
            
            window.onDecryptionSuccess = function(decryptedData) {
                MEMOIR_DATA = decryptedData;
                isUnlocked = true;

                if (!window.__APPROVAL__?.ok) {
                    showBlocked('未通過審核，無法載入內容。');
                    return;
                }
                
                if (elements.passwordModal) {
                    elements.passwordModal.classList.add('hidden');
                }
                
                setTimeout(() => {
                    if (typeof window.__bootApp__ === 'function') {
                        window.__bootApp__(); // 有 MEMOIR_DATA 就會立刻啟動；沒有就不啟動
                    } else {
                        initializeApp();
                    }
                }, 500);
            };
            
            window.onDecryptionError = function(errorMessage) {
                if (elements.passwordModal && !elements.passwordModal.classList.contains('hidden')) {
                    window.showPasswordPrompt(errorMessage || '密碼錯誤，請重新輸入');
                } else {
                    showError(`解密失敗: ${errorMessage || '未知錯誤'}`);
                }
            };

            function toggleSettingsMenu() {
                if (!elements.settingsMenu) {
                    console.error('⚠ settingsMenu 元素不存在');
                    return;
                }
                
                const menu = elements.settingsMenu;

                if (!settingsDragReady) {
                    initDraggableSettingsMenu();
                }

                menu.classList.add('floating');
                const willOpen = !menu.classList.contains('visible');
                
                // 🔥 新增：如果要開啟設定選單，先關閉 dock
                if (willOpen && elements.quickDock) {
                    elements.quickDock.classList.remove('open');
                    isDockOpen = false;
                    localStorage.setItem(DOCK_OPEN_KEY, 'false');
                    updateDockToggleIcon();
                }
                
                menu.classList.toggle('visible');
                
                if (willOpen && !localStorage.getItem(SETTINGS_POS_KEY)) {
                    window.positionSettingsNearButton && window.positionSettingsNearButton();
                }
            }

            function updateGridToggle() {
                if (elements.gridToggle) {
                    if (showGrid) {
                        elements.gridToggle.classList.add('active');
                    } else {
                        elements.gridToggle.classList.remove('active');
                    }
                }
            }
            
            function updateViewMode() {
                if (showGrid) {
                    if (elements.mediaCarousel) elements.mediaCarousel.style.display = 'none';
                    if (elements.mediaGrid) {
                        elements.mediaGrid.style.display = 'block';
                        elements.mediaGrid.classList.remove('hidden');
                    }
                    if (elements.mainContent) elements.mainContent.classList.add('grid-mode');
                    renderGridView();
                } else {
                    if (elements.mediaCarousel) elements.mediaCarousel.style.display = 'flex';
                    if (elements.mediaGrid) {
                        elements.mediaGrid.style.display = 'none';
                        elements.mediaGrid.classList.add('hidden');
                    }
                    if (elements.mainContent) elements.mainContent.classList.remove('grid-mode');
                }
            }
            
            // 修正字幕切換
            function toggleSubtitles() {
                showSubtitles = !showSubtitles;
                updateSubtitleToggle();
                updateSubtitleVisibility();
                
                // 如果開啟字幕，重新載入當前事件描述
                if (showSubtitles) {
                    const currentEvent = getCurrentEvent();
                    if (currentEvent && elements.eventDescription) {
                        if (typewriterEnabled) {
                            startTypewriter(currentEvent.description || '', elements.eventDescription);
                        } else {
                            elements.eventDescription.textContent = currentEvent.description || '';
                        }
                    }
                }
            }
            
            function updateSubtitleToggle() {
                if (elements.subtitleToggle) {
                    if (showSubtitles) {
                        elements.subtitleToggle.classList.add('active');
                    } else {
                        elements.subtitleToggle.classList.remove('active');
                    }
                }
            }
            
            // 修改字幕顯示控制邏輯
            function updateSubtitleVisibility() {
                if (!elements.subtitleArea) return;
                
                const descriptionContainer = document.getElementById('eventDescriptionContainer');
                
                if (showSubtitles) {
                    // 顯示字幕內容
                    elements.subtitleArea.classList.remove('description-hidden');
                    elements.subtitleArea.removeAttribute('data-description-hidden');
                    
                    if (descriptionContainer) {
                        descriptionContainer.style.display = 'block';
                        descriptionContainer.style.opacity = '1';
                        descriptionContainer.style.maxHeight = '200px';
                    }
                    
                    // 字幕區域本身始終可見
                    elements.subtitleArea.style.display = 'block';
                    
                } else {
                    // 隱藏字幕內容，但保持日期和標題可見
                    elements.subtitleArea.classList.add('description-hidden');
                    elements.subtitleArea.setAttribute('data-description-hidden', 'true');
                    
                    if (descriptionContainer) {
                        descriptionContainer.style.opacity = '0';
                        descriptionContainer.style.maxHeight = '0';
                        // 不要設置 display: none，使用 maxHeight 和 opacity 來實現平滑動畫
                    }
                    
                    // 字幕區域保持可見，只是內容部分隱藏
                    elements.subtitleArea.style.display = 'block';
                }
                
                // 添加或移除狀態類，用於 CSS 空間優化
                if (showSubtitles) {
                    document.body.classList.remove('subtitle-hidden');
                } else {
                    document.body.classList.add('subtitle-hidden');
                }
                
                // 重新計算媒體區域大小
                optimizeMediaSpace();
            }
            
            function skipTyping() {
                stopTypewriter();
            }
            
            function showTimeline() {
                renderTimeline();
                if (elements.timelinePanel) {
                    elements.timelinePanel.classList.add('visible');
                }
            }
            
            function hideTimeline() {
                if (elements.timelinePanel) {
                    elements.timelinePanel.classList.remove('visible');
                }
            }
            
            function showHelp() {
                if (elements.helpPanel) {
                    elements.helpPanel.classList.add('visible');
                }
            }
            
            function hideHelp() {
                if (elements.helpPanel) {
                    elements.helpPanel.classList.remove('visible');
                }
            }

            // ===== 3. 可收縮的標題功能 =====
            function initCollapsibleHeader() {
                const headerContainer = document.querySelector('#title-container');
                if (!headerContainer) return;
                
                // 創建收縮狀態
                let isCollapsed = false;
                
                // 創建拖拉按鈕
                const toggleButton = document.createElement('div');
                toggleButton.innerHTML = '📖';
                toggleButton.style.cssText = `
                    position: fixed;
                    top: 10px;
                    right: 20px;
                    width: 40px;
                    height: 40px;
                    background: rgba(0,0,0,0.7);
                    color: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    z-index: 1000;
                    transition: all 0.3s ease;
                    font-size: 18px;
                    backdrop-filter: blur(10px);
                `;
                
                // 切換函數
                function toggleHeader() {
                    isCollapsed = !isCollapsed;
                    
                    if (isCollapsed) {
                        headerContainer.style.cssText = `
                            transform: translateY(-80%);
                            transition: transform 0.3s ease;
                        `;
                        toggleButton.innerHTML = '📋';
                        toggleButton.style.background = 'rgba(59, 130, 246, 0.8)';
                        
                        // 調整主內容區域
                        const mainContent = document.querySelector('#mainContent');
                        if (mainContent) {
                            mainContent.style.paddingTop = '60px';
                            mainContent.style.transition = 'padding-top 0.3s ease';
                        }
                    } else {
                        headerContainer.style.cssText = `
                            transform: translateY(0);
                            transition: transform 0.3s ease;
                        `;
                        toggleButton.innerHTML = '📖';
                        toggleButton.style.background = 'rgba(0,0,0,0.7)';
                        
                        // 恢復主內容區域
                        const mainContent = document.querySelector('#mainContent');
                        if (mainContent) {
                            mainContent.style.paddingTop = '';
                            mainContent.style.transition = 'padding-top 0.3s ease';
                        }
                    }
                }        

                // 標題收合按鈕
                if (elements.headerToggleBtn) {
                    elements.headerToggleBtn.addEventListener('click', toggleHeader);
                }
                
                if (elements.mobileHeaderToggleBtn) {
                    elements.mobileHeaderToggleBtn.addEventListener('click', toggleHeader);
                }        

                toggleButton.onclick = toggleHeader;
                document.body.appendChild(toggleButton);
                
                // 鍵盤快捷鍵 (Ctrl+H)
                document.addEventListener('keydown', (e) => {
                    if (e.ctrlKey && e.key === 'h') {
                        e.preventDefault();
                        toggleHeader();
                    }
                });
            }

            function showMediaViewer(_unusedSrc, mediaType, startIndex = 0) {
                if (!elements.mediaViewer || !elements.mediaViewerContent) return;

                const currentEvent = getCurrentEvent();
                const allMedia = currentEvent?.media || [];

                // 建立圖片列表
                const imageList = [];
                allMedia.forEach((m, i) => {
                    const isImg = (m.type === 'image' || m.media_type === 'image');
                    if (isImg) imageList.push({ media: m, idx: i });
                });

                if (imageList.length === 0) return;

                let viewerPos = Math.max(0, imageList.findIndex((x) => x.idx === startIndex));
                if (viewerPos === -1) viewerPos = 0;

                // 渲染當前圖片
                function renderViewer() {
                    elements.mediaViewerContent.innerHTML = '';
                    
                    if (mediaType === 'image' && imageList.length > 0) {
                        const { media } = imageList[viewerPos];
                        
                        // 創建圖片容器
                        const imgContainer = document.createElement('div');
                        imgContainer.style.cssText = `
                            position: relative;
                            width: 100%;
                            height: 100%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        `;
                        
                        const img = document.createElement('img');
                        const imgSrc = getMediaSrc(media);
                        
                        // *** 關鍵修正：處理MSE解密的圖片 ***
                        if (imgSrc && imgSrc.includes('media/')) {
                            img.setAttribute('data-needs-mse-decrypt', 'true');
                            img.setAttribute('data-original-src', imgSrc);
                            // 設定載入動畫
                            img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSJ1cmwoI2cpIi8+PGNpcmNsZSBjeD0iMjAwIiBjeT0iMTUwIiByPSIyMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjM2I4MmY2IiBzdHJva2Utd2lkdGg9IjMiPjxhbmltYXRlVHJhbnNmb3JtIGF0dHJpYnV0ZU5hbWU9InRyYW5zZm9ybSIgdHlwZT0icm90YXRlIiB2YWx1ZXM9IjAgMjAwIDE1MDszNjAgMjAwIDE1MCIgZHVyPSIxcyIgcmVwZWF0Q291bnQ9ImluZGVmaW5pdGUiLz48L2NpcmNsZT48L3N2Zz4=';
                            
                            // 觸發解密
                            if (window.decryptSingleMedia) {
                                setTimeout(() => {
                                    window.decryptSingleMedia(img, false);
                                }, 100);
                            }
                        } else {
                            img.src = imgSrc;
                        }
                        
                        img.alt = '全螢幕圖片';
                        img.style.cssText = `
                            max-width: 90vw;
                            max-height: 90vh;
                            object-fit: contain;
                            cursor: pointer;
                            border-radius: 8px;
                            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                        `;
                        
                        imgContainer.appendChild(img);
                        
                        // *** 新增：左右導航按鈕 ***
                        if (imageList.length > 1) {
                            // 左按鈕
                            const leftBtn = document.createElement('button');
                            leftBtn.innerHTML = '‹';
                            leftBtn.style.cssText = `
                                position: absolute;
                                left: 20px;
                                top: 50%;
                                transform: translateY(-50%);
                                background: rgba(0,0,0,0.6);
                                color: white;
                                border: none;
                                width: 50px;
                                height: 50px;
                                border-radius: 50%;
                                font-size: 24px;
                                cursor: pointer;
                                z-index: 1001;
                                transition: all 0.2s ease;
                                display: ${viewerPos > 0 ? 'block' : 'none'};
                            `;
                            leftBtn.onmouseover = () => leftBtn.style.background = 'rgba(0,0,0,0.8)';
                            leftBtn.onmouseout = () => leftBtn.style.background = 'rgba(0,0,0,0.6)';
                            leftBtn.onclick = (e) => {
                                e.stopPropagation();
                                if (viewerPos > 0) {
                                    viewerPos--;
                                    renderViewer();
                                    goToMedia(imageList[viewerPos].idx);
                                }
                            };
                            
                            // 右按鈕
                            const rightBtn = document.createElement('button');
                            rightBtn.innerHTML = '›';
                            rightBtn.style.cssText = `
                                position: absolute;
                                right: 20px;
                                top: 50%;
                                transform: translateY(-50%);
                                background: rgba(0,0,0,0.6);
                                color: white;
                                border: none;
                                width: 50px;
                                height: 50px;
                                border-radius: 50%;
                                font-size: 24px;
                                cursor: pointer;
                                z-index: 1001;
                                transition: all 0.2s ease;
                                display: ${viewerPos < imageList.length - 1 ? 'block' : 'none'};
                            `;
                            rightBtn.onmouseover = () => rightBtn.style.background = 'rgba(0,0,0,0.8)';
                            rightBtn.onmouseout = () => rightBtn.style.background = 'rgba(0,0,0,0.6)';
                            rightBtn.onclick = (e) => {
                                e.stopPropagation();
                                if (viewerPos < imageList.length - 1) {
                                    viewerPos++;
                                    renderViewer();
                                    goToMedia(imageList[viewerPos].idx);
                                }
                            };
                            
                            imgContainer.appendChild(leftBtn);
                            imgContainer.appendChild(rightBtn);
                        }
                        
                        // *** 新增：關閉按鈕 ***
                        const closeBtn = document.createElement('button');
                        closeBtn.innerHTML = '×';
                        closeBtn.style.cssText = `
                            position: absolute;
                            top: 20px;
                            right: 20px;
                            background: rgba(0,0,0,0.6);
                            color: white;
                            border: none;
                            width: 40px;
                            height: 40px;
                            border-radius: 50%;
                            font-size: 24px;
                            cursor: pointer;
                            z-index: 1001;
                            transition: all 0.2s ease;
                        `;
                        closeBtn.onmouseover = () => closeBtn.style.background = 'rgba(0,0,0,0.8)';
                        closeBtn.onmouseout = () => closeBtn.style.background = 'rgba(0,0,0,0.6)';
                        closeBtn.onclick = (e) => {
                            e.stopPropagation();
                            hideMediaViewer();
                        };
                        
                        imgContainer.appendChild(closeBtn);
                        elements.mediaViewerContent.appendChild(imgContainer);
                    }
                }

                // *** 修正：點擊背景關閉燈箱 ***
                elements.mediaViewer.onclick = () => hideMediaViewer();
                elements.mediaViewerContent.onclick = (e) => e.stopPropagation();

                // 鍵盤事件處理
                function onKeyDown(e) {
                    if (mediaType !== 'image' || imageList.length <= 1) return;
                    if (e.key === 'ArrowRight' && viewerPos < imageList.length - 1) {
                        viewerPos++;
                        renderViewer();
                        goToMedia(imageList[viewerPos].idx);
                    } else if (e.key === 'ArrowLeft' && viewerPos > 0) {
                        viewerPos--;
                        renderViewer();
                        goToMedia(imageList[viewerPos].idx);
                    } else if (e.key === 'Escape') {
                        hideMediaViewer();
                    }
                }
                document.addEventListener('keydown', onKeyDown);

                // 顯示燈箱
                elements.mediaViewer.classList.add('visible');
                renderViewer();

                // 清理函數
                const originalHide = hideMediaViewer;
                hideMediaViewer = function() {
                    document.removeEventListener('keydown', onKeyDown);
                    elements.mediaViewer.classList.remove('visible');
                    hideMediaViewer = originalHide;
                };
            }

            function hideMediaViewer() {
                if (elements.mediaViewer) {
                    elements.mediaViewer.classList.remove('visible');
                }
            }
            
            function getCurrentEvent() {
                if (!MEMOIR_DATA || !MEMOIR_DATA.events) return null;
                const sortedEvents = getSortedEvents();
                return sortedEvents[currentEventIndex] || null;
            }
            
            function getSortedEvents() {
                if (!MEMOIR_DATA || !MEMOIR_DATA.events) return [];
                return [...MEMOIR_DATA.events].sort((a, b) => 
                    new Date(a.date).getTime() - new Date(b.date).getTime()
                );
            }
            
            function goToEvent(eventIndex) {
                if (!MEMOIR_DATA || !MEMOIR_DATA.events) return;
                
                const sortedEvents = getSortedEvents();
                if (eventIndex < 0 || eventIndex >= sortedEvents.length || eventIndex === currentEventIndex) return;
                
                if (elements.subtitleArea) elements.subtitleArea.classList.add('transitioning');
                if (elements.mainContent) elements.mainContent.classList.add('transitioning');
                
                isTransitioning = true;
                stopTypewriter();
                
                setTimeout(() => {
                    currentEventIndex = eventIndex;
                    currentMediaIndex = 0;
                    loadEvent();
                    
                    renderProgressIndicator();
                    
                    setTimeout(() => {
                        if (elements.subtitleArea) elements.subtitleArea.classList.remove('transitioning');
                        if (elements.mainContent) elements.mainContent.classList.remove('transitioning');
                        isTransitioning = false;
                    }, 300);
                }, 150);
            }
            
            function goToMedia(mediaIndex) {
                const currentEvent = getCurrentEvent();
                if (!currentEvent || !currentEvent.media) return;
                
                if (mediaIndex < 0 || mediaIndex >= currentEvent.media.length || mediaIndex === currentMediaIndex) return;
                
                currentMediaIndex = mediaIndex;
                displayMedia();
                updateMediaNavigation();
                renderThumbnails();
                
                if (showGrid) {
                    renderGridView();
                }
            }
            
            function loadEvent() {
                const currentEvent = getCurrentEvent();
                if (!currentEvent) {
                    return;
                }
                
                // 更新事件信息
                updateEventInfo(currentEvent);
                
                // 更新導航按鈕
                updateEventNavigation();
                
                // 更新進度指示器
                renderProgressIndicator();
                
                // 顯示媒體
                displayMedia();
                
                // 更新媒體導航
                updateMediaNavigation();
                
                // 渲染縮圖
                renderThumbnails();
                
                // 如果是網格模式，渲染網格視圖
                if (showGrid) {
                    renderGridView();
                }
            }
            
            function updateEventInfo(event) {
                if (!event) return;
                
                // 確保元素存在並更新
                if (elements.currentEventNum) {
                    elements.currentEventNum.textContent = currentEventIndex + 1;
                }
                if (elements.totalEvents) {
                    elements.totalEvents.textContent = getSortedEvents().length;
                }
                
                // 更新媒體計數
                if (elements.mediaCount) {
                    const totalMedia = event.media ? event.media.length : 0;
                    elements.mediaCount.textContent = totalMedia;
                }
                
                // 更新事件日期
                if (elements.eventDate) {
                    try {
                        const eventDate = new Date(event.date).toLocaleDateString('zh-TW', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        });
                        elements.eventDate.textContent = eventDate;
                        elements.eventDate.style.display = 'block';
                    } catch (e) {
                        elements.eventDate.textContent = event.date;
                        elements.eventDate.style.display = 'block';
                    }
                }
                
                // 更新事件標題
                if (elements.eventTitle) {
                    elements.eventTitle.textContent = event.title || '';
                    elements.eventTitle.style.display = 'block';
                    
                    // 應用跑馬燈效果
                    setTimeout(() => {
                        applyMarqueeIfOverflow(elements.eventTitle);
                    }, 100);
                }
                
                // 更新事件描述
                if (elements.eventDescription && showSubtitles) {
                    elements.eventDescription.style.display = 'block';
                    if (typewriterEnabled) {
                        startTypewriter(event.description || '', elements.eventDescription);
                    } else {
                        elements.eventDescription.textContent = event.description || '';
                    }
                }
                
                // 確保字幕區域可見
                if (elements.subtitleArea) {
                    elements.subtitleArea.style.display = 'block';
                    elements.subtitleArea.style.opacity = '1';
                    elements.subtitleArea.style.visibility = 'visible';
                }
            }

            // 新增媒體位置指示器更新函數
            function updateMediaPositionIndicator() {
                const currentEvent = getCurrentEvent();
                if (!currentEvent || !currentEvent.media) return;
                
                // 更新媒體計數顯示 (修正 1/1 問題)
                const mediaCountElement = document.querySelector('.media-count');
                if (mediaCountElement) {
                    mediaCountElement.textContent = `${currentMediaIndex + 1}/${currentEvent.media.length}`;
                }
            }            

            function updateEventNavigation() {
                const totalEvents = getSortedEvents().length;
                
                if (elements.prevEventBtn) {
                    if (currentEventIndex === 0) {
                        elements.prevEventBtn.classList.add('disabled');
                    } else {
                        elements.prevEventBtn.classList.remove('disabled');
                    }
                }
                
                if (elements.nextEventBtn) {
                    if (currentEventIndex === totalEvents - 1) {
                        elements.nextEventBtn.classList.add('disabled');
                    } else {
                        elements.nextEventBtn.classList.remove('disabled');
                    }
                }
            }
            
            function displayMedia() {
                const currentEvent = getCurrentEvent();
                if (!currentEvent || !currentEvent.media || currentEvent.media.length === 0) {
                    showNoMediaMessage();
                    return;
                }

                const media = currentEvent.media[currentMediaIndex];
                if (!media) {
                    showNoMediaMessage();
                    return;
                }

                if (elements.mediaDisplay) {
                    elements.mediaDisplay.innerHTML = '';

                    try {
                        let mediaElement;

                        if (media.type === 'image' || media.media_type === 'image') {
                            mediaElement = document.createElement('img');
                            
                            // 確保圖片正確縮放
                            mediaElement.style.cssText = `
                                max-width: 100%;
                                max-height: 100%;
                                width: auto;
                                height: auto;
                                object-fit: contain;
                                object-position: center;
                                cursor: pointer;
                                border-radius: 4px;
                                display: block;
                                margin: 0 auto;
                            `;
                            
                            mediaElement.alt = '回憶錄圖片';

                            mediaElement.onclick = () => {
                                showMediaViewer(null, 'image', currentMediaIndex);
                            };

                            // MSE解密支持
                            const imageSrc = getMediaSrc(media);
                            
                            if (imageSrc && imageSrc.includes('media/')) {
                                mediaElement.setAttribute('data-needs-mse-decrypt', 'true');
                                mediaElement.setAttribute('data-original-src', imageSrc);
                                
                                // 設定載入中的佔位圖
                                mediaElement.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSJ1cmwoI2cpIi8+PGNpcmNsZSBjeD0iMjAwIiBjeT0iMTUwIiByPSIyMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjM2I4MmY2IiBzdHJva2Utd2lkdGg9IjMiPjxhbmltYXRlVHJhbnNmb3JtIGF0dHJpYnV0ZU5hbWU9InRyYW5zZm9ybSIgdHlwZT0icm90YXRlIiB2YWx1ZXM9IjAgMjAwIDE1MDszNjAgMjAwIDE1MCIgZHVyPSIxcyIgcmVwZWF0Q291bnQ9ImluZGVmaW5pdGUiLz48L2NpcmNsZT48L3N2Zz4=';
                                
                                if (window.forceDecryptMedia) {
                                    setTimeout(() => {
                                        window.forceDecryptMedia();
                                    }, 100);
                                }
                            } else {
                                mediaElement.src = imageSrc;
                                mediaElement.onerror = () => {
                                    showMediaError('圖片載入失敗');
                                };
                            }

                        } else if (media.type === 'video' || media.media_type === 'video') {
                            if (media.isUrl && (media.url?.includes('youtube.com') || media.url?.includes('youtu.be'))) {
                                const videoId = extractYouTubeId(media.url);
                                if (videoId) {
                                    const youtubeContainer = document.createElement('div');
                                    youtubeContainer.className = 'youtube-container';
                                    youtubeContainer.style.cssText = `
                                        position: relative;
                                        width: 100%;
                                        height: 0;
                                        padding-bottom: 56.25%;
                                        overflow: hidden;
                                        border-radius: 8px;
                                    `;
                                    
                                    const iframe = document.createElement('iframe');
                                    iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`;
                                    iframe.setAttribute('allowfullscreen', '');
                                    iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
                                    iframe.style.cssText = `
                                        position: absolute;
                                        top: 0;
                                        left: 0;
                                        width: 100%;
                                        height: 100%;
                                        border: none;
                                    `;
                                    
                                    youtubeContainer.appendChild(iframe);
                                    elements.mediaDisplay.appendChild(youtubeContainer);
                                    return;
                                }
                            } else {
                                mediaElement = document.createElement('video');
                                mediaElement.style.cssText = `
                                    max-width: 100%;
                                    max-height: 100%;
                                    width: auto;
                                    height: auto;
                                    object-fit: contain;
                                    object-position: center;
                                    cursor: pointer;
                                `;
                                mediaElement.controls = true;
                                mediaElement.muted = true;
                                mediaElement.playsInline = true;

                                mediaElement.onclick = () => {
                                    showMediaViewer(getMediaSrc(media), 'video');
                                };
                                
                                const videoSrc = getMediaSrc(media);
                                if (videoSrc && videoSrc.includes('media/')) {
                                    mediaElement.setAttribute('data-needs-mse-decrypt', 'true');
                                    mediaElement.setAttribute('data-original-src', videoSrc);
                                    
                                    if (window.forceDecryptMedia) {
                                        setTimeout(() => {
                                            window.forceDecryptMedia();
                                        }, 100);
                                    }
                                } else {
                                    mediaElement.src = videoSrc;
                                }
                            }
                        }

                        if (mediaElement) {
                            elements.mediaDisplay.appendChild(mediaElement);
                        }

                        // 更新媒體計數器
                        updateMediaCounterOverlay();

                    } catch (error) {
                        showMediaError(`媒體顯示錯誤: ${error.message}`);
                    }
                }
            }

            // 修正媒體計數器更新
            function updateMediaCounterOverlay() {
                const currentEvent = getCurrentEvent();
                if (!currentEvent || !currentEvent.media) return;
                
                if (elements.mediaCounterOverlay) {
                    const currentPos = currentMediaIndex + 1;
                    const totalCount = currentEvent.media.length;
                    elements.mediaCounterOverlay.textContent = `${currentPos} / ${totalCount}`;
                    elements.mediaCounterOverlay.style.display = totalCount > 1 ? 'block' : 'none';
                }
            }            

            function getMediaSrc(media) {
                if (media.isUrl || media.is_url) {
                    return media.url || media.path;
                } else {
                    let mediaSrc = media.path;
                    
                    if (!mediaSrc.startsWith('./') && !mediaSrc.startsWith('http')) {
                        if (mediaSrc.startsWith('media/')) {
                            mediaSrc = './' + mediaSrc;
                        } else {
                            // mediaSrc = './media/' + (mediaSrc.split('/').pop() || mediaSrc);
                            mediaSrc = `./media/${media.filename}`;
                        }
                    }
                    
                    return mediaSrc;
                }
            }
            
            function extractYouTubeId(url) {
                const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
                const match = url.match(regExp);
                return (match && match[2].length === 11) ? match[2] : null;
            }
            
            function showMediaError(message) {
                if (elements.mediaDisplay) {
                    elements.mediaDisplay.innerHTML = `
                        <div style="text-align: center; color: #ef4444; padding: 40px;">
                            <div style="font-size: 48px; margin-bottom: 20px;">❌</div>
                            <div style="font-size: 16px;">${message}</div>
                        </div>
                    `;
                }
            }
            
            function showNoMediaMessage() {
                if (elements.mediaDisplay) {
                    const icon = ENCRYPTION_ENABLED ? '🔒' : '📷';
                    elements.mediaDisplay.innerHTML = `
                        <div style="text-align: center; color: #9ca3af; padding: 40px;">
                            <div style="font-size: 48px; margin-bottom: 20px;">${icon}</div>
                            <div style="font-size: 16px;">此時間節點沒有媒體內容</div>
                        </div>
                    `;
                }
            }
            
            function updateMediaNavigation() {
                const currentEvent = getCurrentEvent();
                if (!currentEvent || !currentEvent.media) return;

                const totalMedia = currentEvent.media.length;
                
                // 更新導航按鈕狀態
                if (elements.prevMediaBtn) {
                    if (currentMediaIndex === 0) {
                        elements.prevMediaBtn.classList.add('disabled');
                        elements.prevMediaBtn.disabled = true;
                    } else {
                        elements.prevMediaBtn.classList.remove('disabled');
                        elements.prevMediaBtn.disabled = false;
                    }
                }
                
                if (elements.nextMediaBtn) {
                    if (currentMediaIndex === totalMedia - 1) {
                        elements.nextMediaBtn.classList.add('disabled');
                        elements.nextMediaBtn.disabled = true;
                    } else {
                        elements.nextMediaBtn.classList.remove('disabled');
                        elements.nextMediaBtn.disabled = false;
                    }
                }
                
                // 更新媒體計數器
                updateMediaCounterOverlay();
            }

            function showGridView() {
                const currentEvent = getCurrentEvent();
                if (!currentEvent || !currentEvent.media) return;

                const gridContainer = document.getElementById('media-grid') || elements.mediaDisplay;
                if (!gridContainer) return;

                gridContainer.innerHTML = '';
                gridContainer.className = 'media-grid';
                gridContainer.style.display = 'grid';
                gridContainer.style.gridTemplateColumns = 'repeat(auto-fill, minmax(200px, 1fr))';
                gridContainer.style.gap = '16px';
                gridContainer.style.padding = '16px';

                currentEvent.media.forEach((media, index) => {
                    const gridItem = document.createElement('div');
                    gridItem.className = 'grid-item';
                    gridItem.style.cursor = 'pointer';
                    gridItem.style.borderRadius = '8px';
                    gridItem.style.overflow = 'hidden';
                    gridItem.style.aspectRatio = '1';
                    gridItem.style.backgroundColor = '#f5f5f5';

                    if (media.type === 'image' || media.media_type === 'image') {
                        const img = document.createElement('img');
                        img.style.width = '100%';
                        img.style.height = '100%';
                        img.style.objectFit = 'cover';
                        img.alt = `圖片 ${index + 1}`;

                        const imageSrc = getMediaSrc(media);
                        
                        if (imageSrc && imageSrc.includes('media/')) {
                            img.setAttribute('data-needs-mse-decrypt', 'true');
                            img.setAttribute('data-original-src', imageSrc);                            
                            img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJnIj48c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0idXJsKCNnKSIvPjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iMjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzNiODJmNiIgc3Ryb2tlLXdpZHRoPSIzIj48YW5pbWF0ZVRyYW5zZm9ybSBhdHRyaWJ1dGVOYW1lPSJ0cmFuc2Zvcm0iIHR5cGU9InJvdGF0ZSIgdmFsdWVzPSIwIDEwMCAxMDA7MzYwIDEwMCAxMDAiIGR1cj0iMXMiIHJlcGVhdENvdW50PSJpbmRlZmluaXRlIi8+PC9jaXJjbGU+PC9zdmc+';
                        } else {
                            img.src = imageSrc;
                        }

                        gridItem.appendChild(img);
                    } else {
                        // 影片圖示
                        const videoIcon = document.createElement('div');
                        videoIcon.innerHTML = '🎥';
                        videoIcon.style.width = '100%';
                        videoIcon.style.height = '100%';
                        videoIcon.style.display = 'flex';
                        videoIcon.style.alignItems = 'center';
                        videoIcon.style.justifyContent = 'center';
                        videoIcon.style.fontSize = '48px';
                        gridItem.appendChild(videoIcon);
                    }

                    gridItem.onclick = () => {
                        currentMediaIndex = index;
                        displayMedia();
                        // 可能需要切換回單一顯示模式
                    };

                    gridContainer.appendChild(gridItem);
                });

                // 觸發網格圖片解密
                if (window.decryptThumbnails) {
                    setTimeout(() => {
                        window.decryptThumbnails();
                    }, 200);
                }
            }            

            // ===== 4. 修復媒體選擇器carousel =====
            function renderThumbnails() {
                if (!elements.thumbnailsScroll) {
                    // 如果沒有 thumbnailsScroll，嘗試查找其他縮圖容器
                    const thumbnailContainer = elements.mediaThumbnails || 
                                            document.querySelector('.thumbnails-scroll') ||
                                            document.querySelector('.media-thumbnails');
                    if (!thumbnailContainer) return;
                    
                    // 創建縮圖容器結構
                    if (!elements.thumbnailsScroll) {
                        elements.thumbnailsScroll = thumbnailContainer;
                    }
                }
                
                const currentEvent = getCurrentEvent();
                if (!currentEvent || !currentEvent.media) {
                    elements.thumbnailsScroll.innerHTML = '';
                    return;
                }

                elements.thumbnailsScroll.innerHTML = '';

                currentEvent.media.forEach((media, index) => {
                    const thumbnailItem = document.createElement('div');
                    thumbnailItem.className = `thumbnail-item ${index === currentMediaIndex ? 'active' : ''}`;
                    
                    thumbnailItem.style.cssText = `
                        position: relative;
                        width: 60px;
                        height: 60px;
                        margin: 0 4px;
                        border-radius: 8px;
                        overflow: hidden;
                        cursor: pointer;
                        border: 2px solid ${index === currentMediaIndex ? '#3b82f6' : 'transparent'};
                        transition: all 0.2s ease;
                        flex-shrink: 0;
                        background: rgba(255, 255, 255, 0.1);
                    `;
                    
                    thumbnailItem.onmouseover = () => {
                        if (index !== currentMediaIndex) {
                            thumbnailItem.style.border = '2px solid rgba(59, 130, 246, 0.5)';
                        }
                    };
                    
                    thumbnailItem.onmouseout = () => {
                        if (index !== currentMediaIndex) {
                            thumbnailItem.style.border = '2px solid transparent';
                        }
                    };
                    
                    thumbnailItem.onclick = () => goToMedia(index);

                    const thumbnailImage = document.createElement('img');
                    thumbnailImage.className = 'thumbnail-image';
                    thumbnailImage.style.cssText = `
                        width: 100%;
                        height: 100%;
                        object-fit: cover;
                        object-position: center;
                    `;
                    thumbnailImage.alt = `縮圖 ${index + 1}`;
                    
                    if ((media.type === 'video' || media.media_type === 'video') && 
                        media.isUrl && (media.url?.includes('youtube.com') || media.url?.includes('youtu.be'))) {
                        
                        const videoId = extractYouTubeId(media.url);
                        if (videoId) {
                            thumbnailImage.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                            
                            thumbnailImage.onerror = () => {
                                thumbnailImage.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjZmYwMDAwIi8+Cjx0ZXh0IHg9IjMwIiB5PSIzMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjE2IiBmaWxsPSJ3aGl0ZSI+VklERU88L3RleHQ+Cjwvc3ZnPgo=';
                            };
                        }
                    } else {
                        const imageSrc = getMediaSrc(media);
                        
                        if (imageSrc && imageSrc.includes('media/')) {
                            thumbnailImage.setAttribute('data-needs-mse-decrypt', 'true');
                            thumbnailImage.setAttribute('data-original-src', imageSrc);
                            
                            thumbnailImage.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiNmOWZhZmIiLz48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSI4IiBmaWxsPSJub25lIiBzdHJva2U9IiNkMWQ1ZGIiIHN0cm9rZS13aWR0aD0iMiI+PGFuaW1hdGVUcmFuc2Zvcm0gYXR0cmlidXRlTmFtZT0idHJhbnNmb3JtIiB0eXBlPSJyb3RhdGUiIHZhbHVlcz0iMCAzMCAzMDszNjAgMzAgMzAiIGR1cj0iMXMiIHJlcGVhdENvdW50PSJpbmRlZmluaXRlIi8+PC9jaXJjbGU+PC9zdmc+';
                        } else {
                            thumbnailImage.src = imageSrc;
                            thumbnailImage.onerror = () => {
                                thumbnailImage.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjZjVmNWY1Ii8+Cjx0ZXh0IHg9IjMwIiB5PSIzMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjEyIiBmaWxsPSIjOTk5Ij7mlZnoqJTnj5E8L3RleHQ+Cjwvc3ZnPgo=';
                            };
                        }
                    }

                    thumbnailItem.appendChild(thumbnailImage);

                    // 影片播放圖示
                    if (media.type === 'video' || media.media_type === 'video') {
                        const playIcon = document.createElement('div');
                        playIcon.innerHTML = '▶';
                        playIcon.style.cssText = `
                            position: absolute;
                            top: 50%;
                            left: 50%;
                            transform: translate(-50%, -50%);
                            color: white;
                            font-size: 16px;
                            text-shadow: 0 0 4px rgba(0,0,0,0.8);
                            pointer-events: none;
                        `;
                        thumbnailItem.appendChild(playIcon);
                    }

                    elements.thumbnailsScroll.appendChild(thumbnailItem);
                });
                
                // 觸發縮圖解密
                if (window.decryptThumbnails) {
                    setTimeout(() => {
                        window.decryptThumbnails();
                    }, 200);
                }
            }

            // ===== 初始化所有改進功能 =====
            function initializeUIImprovements() {
                // 等待DOM載入完成
                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', () => {
                        setTimeout(() => {
                            initCollapsibleHeader();
                            // 確保媒體計數顯示正確
                            if (getCurrentEvent()) {
                                updateEventInfo(getCurrentEvent());
                            }
                        }, 1000);
                    });
                } else {
                    setTimeout(() => {
                        initCollapsibleHeader();
                        if (getCurrentEvent()) {
                            updateEventInfo(getCurrentEvent());
                        }
                    }, 1000);
                }
            }

            function renderGridView() {
                if (!elements.mediaGrid) return;
                
                const currentEvent = getCurrentEvent();
                if (!currentEvent || !currentEvent.media) {
                    elements.mediaGrid.innerHTML = '';
                    return;
                }

                elements.mediaGrid.innerHTML = '';

                currentEvent.media.forEach((media, index) => {
                    const gridItem = document.createElement('div');
                    gridItem.className = `grid-item ${index === currentMediaIndex ? 'active' : ''}`;
                    gridItem.onclick = () => goToMedia(index);

                    const gridContent = document.createElement('div');
                    gridContent.className = 'grid-item-content';

                    if ((media.type === 'video' || media.media_type === 'video') && 
                        media.isUrl && (media.url?.includes('youtube.com') || media.url?.includes('youtu.be'))) {
                        
                        const videoId = extractYouTubeId(media.url);
                        if (videoId) {
                            const mediaElement = document.createElement('img');
                            mediaElement.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                            mediaElement.alt = `YouTube影片 ${index + 1}`;
                            
                            mediaElement.onerror = () => {
                                mediaElement.src = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
                            };
                            
                            gridContent.appendChild(mediaElement);
                        }
                    } else {
                        const mediaElement = document.createElement('img');
                        
                        // *** 修正：使用通用描述 ***
                        mediaElement.alt = `媒體 ${index + 1}`;
                        
                        const imageSrc = getMediaSrc(media);
                        
                        // *** 關鍵修正：為網格圖片加入MSE解密支援 ***
                        if (imageSrc && imageSrc.includes('media/')) {
                            mediaElement.setAttribute('data-needs-mse-decrypt', 'true');
                            mediaElement.setAttribute('data-original-src', imageSrc);
                            
                            // 網格載入動畫
                            mediaElement.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJnIj48c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0idXJsKCNnKSIvPjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iMTUiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzNiODJmNiIgc3Ryb2tlLXdpZHRoPSIzIj48YW5pbWF0ZVRyYW5zZm9ybSBhdHRyaWJ1dGVOYW1lPSJ0cmFuc2Zvcm0iIHR5cGU9InJvdGF0ZSIgdmFsdWVzPSIwIDEwMCAxMDA7MzYwIDEwMCAxMDAiIGR1cj0iMXMiIHJlcGVhdENvdW50PSJpbmRlZmluaXRlIi8+PC9jaXJjbGU+PC9zdmc+';
                        } else {
                            mediaElement.src = imageSrc;
                            mediaElement.onerror = () => {
                                mediaElement.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNmNWY1ZjUiLz48dGV4dCB4PSIxMDAiIHk9IjEwMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjE2IiBmaWxsPSIjOTk5Ij7osIHlpLHml5848L+UhjwvdGV4dD48L3N2Zz4=';
                            };
                        }

                        gridContent.appendChild(mediaElement);
                    }

                    gridItem.appendChild(gridContent);
                    elements.mediaGrid.appendChild(gridItem);
                });
                
                // *** 觸發網格解密 ***
                if (window.decryptThumbnails) {
                    setTimeout(() => {
                        window.decryptThumbnails();
                    }, 200);
                }
            }
            
            function renderTimeline() {
            if (!MEMOIR_DATA || !elements.timelineScroll) return;

            const sortedEvents = getSortedEvents();
            elements.timelineScroll.innerHTML = '<div class="timeline-line"></div>';

            sortedEvents.forEach((event, index) => {
                const item = document.createElement('div');
                item.className = `timeline-item ${index === currentEventIndex ? 'active' : ''}`;

                const node = document.createElement('div');
                node.className = 'timeline-node';

                const wrapper = document.createElement('div');
                wrapper.className = 'timeline-event';

                const content = document.createElement('div');
                content.className = 'timeline-event-content';

                const header = document.createElement('div');
                header.className = 'timeline-event-header';

                const dateEl = document.createElement('div');
                dateEl.className = 'timeline-event-date';
                dateEl.textContent = new Date(event.date).toLocaleDateString('zh-TW');

                const titleEl = document.createElement('div');
                titleEl.className = 'timeline-event-title';
                titleEl.textContent = event.title;

                const descEl = document.createElement('div');
                descEl.className = 'timeline-event-description';
                descEl.textContent = event.description;

                header.append(dateEl, titleEl);
                content.append(header, descEl);
                wrapper.appendChild(content);

                item.append(node, wrapper);
                item.onclick = () => { goToEvent(index); hideTimeline(); };

                elements.timelineScroll.appendChild(item);
            });

            if (typeof lucide !== 'undefined') lucide.createIcons();
            }

            function handleKeyPress(e) {
                if (elements.timelinePanel?.classList.contains('visible') || 
                    elements.helpPanel?.classList.contains('visible') || 
                    elements.mediaViewer?.classList.contains('visible')) {
                    if (e.key === 'Escape') {
                        e.preventDefault();
                        hideTimeline();
                        hideHelp();
                        hideMediaViewer();
                    }
                    return;
                }

                if (!(elements.timelinePanel?.classList.contains('visible') ||
                    elements.helpPanel?.classList.contains('visible') ||
                    elements.mediaViewer?.classList.contains('visible'))) {
                    const withCtrl = (e.ctrlKey || e.metaKey);
                    if (withCtrl && (e.key === '+' || e.key === '=')) {
                        e.preventDefault();
                        setFontSize(fontSize === 'small' ? 'medium' : 'large');
                        return;
                    }
                    if (withCtrl && e.key === '-') {
                        e.preventDefault();
                        setFontSize(fontSize === 'large' ? 'medium' : 'small');
                        return;
                    }
                    if (withCtrl && e.key === '0') {
                        e.preventDefault();
                        setFontSize('medium');
                        return;
                    }
                }

                switch (e.key) {
                    case 'ArrowLeft':
                        e.preventDefault();
                        if (currentEventIndex > 0) {
                            goToEvent(currentEventIndex - 1);
                        }
                        break;
                    case 'ArrowRight':
                        e.preventDefault();
                        if (MEMOIR_DATA && currentEventIndex < getSortedEvents().length - 1) {
                            goToEvent(currentEventIndex + 1);
                        }
                        break;
                    case 'Home':
                        e.preventDefault();
                        if (MEMOIR_DATA && MEMOIR_DATA.events) {
                            goToEvent(0);
                        }
                        break;
                    case 'End':
                        e.preventDefault();
                        if (MEMOIR_DATA && MEMOIR_DATA.events) {
                            goToEvent(getSortedEvents().length - 1);
                        }
                        break;
                    case 'g':
                    case 'G':
                        e.preventDefault();
                        toggleGridMode();
                        break;
                    case 't':
                    case 'T':
                        e.preventDefault();
                        showTimeline();
                        break;
                    case 'h':
                    case 'H':
                    case '?':
                        e.preventDefault();
                        showHelp();
                        break;
                    case 'Escape':
                        e.preventDefault();
                        if (showGrid) {
                            toggleGridMode();
                        }
                        break;
                    case ' ':
                        e.preventDefault();
                        const video = elements.mediaDisplay?.querySelector('video');
                        if (video) {
                            if (video.paused) {
                                video.play();
                            } else {
                                video.pause();
                            }
                        }
                        break;
                }
            }

            function initTouchSwipe() {
                let touchStartX = 0;
                let touchEndX = 0;
                const minSwipeDistance = 50;
                
                const swipeArea = elements.subtitleArea || document.body;
                
                swipeArea.addEventListener('touchstart', (e) => {
                    touchStartX = e.touches[0].clientX;
                }, { passive: true });
                
                swipeArea.addEventListener('touchend', (e) => {
                    touchEndX = e.changedTouches[0].clientX;
                    const deltaX = touchEndX - touchStartX;
                    
                    if (Math.abs(deltaX) > minSwipeDistance) {
                        if (deltaX > 0 && currentEventIndex > 0) {
                            goToEvent(currentEventIndex - 1);
                        } else if (deltaX < 0 && MEMOIR_DATA && currentEventIndex < getSortedEvents().length - 1) {
                            goToEvent(currentEventIndex + 1);
                        }
                    }
                }, { passive: true });
            }
            
            function initializeApp() {
                try {
                    if (window._memoirAppInitialized) {
                        console.log('應用已初始化，跳過重複執行');
                        return;
                    }
                    window._memoirAppInitialized = true;

                    if (!MEMOIR_DATA) {
                        if (window.MEMOIR_DATA) {
                            MEMOIR_DATA = window.MEMOIR_DATA;
                        } else {
                            if (typeof window.__bootApp__ === 'function') {
                                setTimeout(() => window.__bootApp__(), 500);
                            }
                            return; 
                        }
                    }

                    // 重新獲取可能缺失的元素
                    if (!elements.thumbnailsScroll) {
                        elements.thumbnailsScroll = document.getElementById('thumbnailsScroll') || 
                                                document.querySelector('.thumbnails-scroll') ||
                                                elements.mediaThumbnails;
                    }
                    
                    if (!elements.subtitleArea) {
                        elements.subtitleArea = document.getElementById('subtitleArea');
                    }
                    
                    if (!elements.eventDate) {
                        elements.eventDate = document.getElementById('eventDate');
                    }
                    
                    if (!elements.eventTitle) {
                        elements.eventTitle = document.getElementById('eventTitle');
                    }
                    
                    if (!elements.eventDescription) {
                        elements.eventDescription = document.getElementById('eventDescription');
                    }
                    
                    if (!elements.mediaCounterOverlay) {
                        elements.mediaCounterOverlay = document.getElementById('mediaCounterOverlay');
                    }

                    // 顯示主應用程式
                    if (elements.app) elements.app.classList.remove('hidden');
                    
                    // 初始化 UI
                    initEventListeners();
                    updateGridToggle();
                    updateSubtitleToggle();
                    updateSubtitleVisibility();
                    updateTypewriterToggle();
                    updateFontSizeButtons();
                    applyFontSize();

                    // 添加媒體互動追蹤
                    if (elements.mediaDisplay) {
                        elements.mediaDisplay.addEventListener('click', () => {
                            window.dispatchEvent(new CustomEvent('memoir:media_view', {
                                detail: { 
                                    eventIndex: currentEventIndex,
                                    mediaIndex: currentMediaIndex 
                                }
                            }));
                        });
                    }
                    
                    // 事件切換追蹤
                    const originalGoToEvent = goToEvent;
                    goToEvent = function(index) {
                        originalGoToEvent(index);
                        // 發送事件切換追蹤
                        if (window.trackPageView) {
                            window.trackPageView('event_navigation');
                        }
                    };

                    // 跑馬燈：回憶錄名稱（桌機 + 手機）
                    const memoirTitleDesktop = document.querySelector('.title-text');
                    const memoirTitleMobile  = document.querySelector('.mobile-title');
                    applyMarqueeIfOverflow(memoirTitleDesktop);
                    applyMarqueeIfOverflow(memoirTitleMobile);

                    // 載入第一個事件
                    if (MEMOIR_DATA.events && MEMOIR_DATA.events.length > 0) {
                        loadEvent();
                        // 初始化進度指示器
                        renderProgressIndicator();
                    } else {
                        showEmptyState();
                    }
                    
                    // 隱藏載入畫面
                    setTimeout(() => {
                        if (elements.loadingScreen) {
                            elements.loadingScreen.classList.add('hidden');
                        }
                    }, 1000);

                    (function sendView(){
                        const memoirId = document.querySelector('meta[name="memoir-id"]')?.content || '';
                        const backend  = document.querySelector('meta[name="backend-url"]')?.content || '';
                        const payload  = {
                            memoir_id: memoirId,
                            page_path: location.pathname,
                            repo_url: location.origin + location.pathname.split('/').slice(0,3).join('/'),
                            approval_token: window.__APPROVAL__?.token || null, // ← 一起帶上，方便關聯
                        };
                        if (backend) {
                            fetch(`${backend}/api/admin/track/view`, {
                            method: 'POST',
                            headers: {'Content-Type':'application/json'},
                            body: JSON.stringify(payload)
                            }).catch(()=>{});
                        }
                    })();

                    // 初始化空間優化
                    setTimeout(() => {
                        optimizeMediaSpace();
                    }, 200);
                    
                    // 設置初始狀態類
                    if (isHeaderCollapsed) {
                        document.body.classList.add('header-collapsed');
                    }
                    
                    if (!showSubtitles) {
                        document.body.classList.add('subtitle-hidden');
                    }
                } catch (error) {
                    showError(`應用程式初始化失敗: ${error.message}`);
                }
            }
            
            function showEmptyState() {
                if (elements.mediaDisplay) {
                    const status = ENCRYPTION_ENABLED ? '加密回憶錄已載入' : '回憶錄已載入';
                    elements.mediaDisplay.innerHTML = `
                        <div style="text-align: center; color: #9ca3af; padding: 40px;">
                            <div style="font-size: 18px; margin-bottom: 10px;">${status}</div>
                            <div style="font-size: 14px;">但暫時沒有時間節點內容</div>
                        </div>
                    `;
                }
            }
            
            document.addEventListener('DOMContentLoaded', function () {
                updateLoadingStatus('正在準備加密系統...');

                if (typeof lucide !== 'undefined') {
                    try { lucide.createIcons(); } catch (e) { console.warn(e); }
                }

                const getMode = () =>
                document.querySelector('meta[name="encryption-mode"]')?.content || 'static';

                function fillFromPreloadJSON() {
                    if (window.MEMOIR_DATA?.events) return true;
                    const el = document.getElementById('preloaded-memoir-data');
                    if (!el) return false;
                    try {
                        const txt = el.textContent || '';
                        window.MEMOIR_DATA = JSON.parse(txt);
                        return !!window.MEMOIR_DATA?.events;
                    } catch (e) {
                        console.warn(e);
                        return false;
                    }
                }

                function bootIfReady() {
                    const ready = fillFromPreloadJSON() || !!(window.MEMOIR_DATA && window.MEMOIR_DATA.events);
                    if (ready) {
                        if (typeof initializeApp === 'function') initializeApp();
                        return true;
                    }
                    return false;
                }

                window.__bootApp__ = bootIfReady;

                setTimeout(async () => {
                updateLoadingStatus('正在檢查加密狀態...');
                setTimeout(async () => {

                    const ok = await (window.__preInitApproval__?.() ?? true);
                    if (!ok) return;

                    const initOK = initializeEncryption();
                    if (!initOK) return;

                    const mode = getMode();

                    if (mode === 'server') {
                    if (!bootIfReady()) {

                        window.addEventListener(
                        'memoir:decrypted',
                        (e) => {
                            if (e?.detail) window.MEMOIR_DATA = e.detail;
                            bootIfReady();
                        },
                        { once: true }
                        );

                        setTimeout(() => {
                        if (!bootIfReady()) {
                            showError('伺服器解密逾時，請稍後再試或改用密碼解鎖。');
                        }
                        }, 15000);
                    }
                    } else {
                    if (!bootIfReady()) {
                        showError('初始化失敗：找不到 MEMOIR_DATA。請確認已注入預載 JSON，或密碼解鎖流程會呼叫 window.__bootApp__。');
                    }
                    }
                }, 800);
                }, 1500);
            });

            window.addEventListener('error', function(e) {
                if (!elements.app || elements.app.classList.contains('hidden')) {
                showError(`系統錯誤: ${e.error?.message || '未知錯誤'}`);
                }
            });

            window.addEventListener('unhandledrejection', function(e) {
                if (!elements.app || elements.app.classList.contains('hidden')) {
                showError(`載入錯誤: ${e.reason?.message || '網路連接問題'}`);
                }
            });

            const payload = {
                memoir_id: window.__MEMOIR_ID__,
                repo_url: window.location.origin + window.location.pathname.split('/').slice(0,3).join('/'),
                page_path: window.location.pathname
            };

            window.initializeMemoirApp = initializeApp;

            // 覆蓋原有的媒體切換函數，確保計數更新
            const originalGoToMedia = goToMedia;
            goToMedia = function(mediaIndex) {
                originalGoToMedia(mediaIndex);
                updateMediaPositionIndicator();
                
                // 更新縮圖active狀態
                const thumbnails = document.querySelectorAll('.thumbnail-item');
                thumbnails.forEach((thumb, index) => {
                    if (index === mediaIndex) {
                        thumb.classList.add('active');
                        thumb.style.border = '2px solid #3b82f6';
                    } else {
                        thumb.classList.remove('active');
                        thumb.style.border = '2px solid transparent';
                    }
                });
            };

            // 啟動所有改進
            initializeUIImprovements();
        })();
    

// ========== 提取的腳本區塊 ==========

        // 確保 blockedScreen 的重新嘗試按鈕正常工作
        document.addEventListener('DOMContentLoaded', function() {
            const retryBtn = document.getElementById('retryBtn');
            if (retryBtn) {
                retryBtn.addEventListener('click', () => {
                    location.reload();
                });
            }
        });

        // 也可以直接設置（防止 DOMContentLoaded 已經觸發的情況）
        document.getElementById('retryBtn')?.addEventListener('click', () => {
            location.reload();
        });
    

// ========== 提取的腳本區塊 ==========

        if (window.autoDecrypt && !window.decryptMemoirData) {
        window.decryptMemoirData = window.autoDecrypt;
        }

        window.addEventListener('DOMContentLoaded', () => {
            if (window.autoDecrypt) {
                window.autoDecrypt();
            } else {
                if (typeof window.showError === 'function') {
                window.showError('系統錯誤：缺少解密組件');
                }
            }
        });

        window.addEventListener('memoir:authorized', () => {
        window.autoDecrypt && window.autoDecrypt();
        });
    

// ========== 提取的腳本區塊 ==========

        // 🔒 安全全域變數初始化
        window.secureGlobals = {
            MEMOIR_DATA: null,
            decryptionMode: null,
            decryptionAttempts: 0,
            MAX_ATTEMPTS: 5,
            lastAccessTime: null,
            sessionExpiry: null
        };
        
        window.secureUtils = {
            showDecryptionError: function(message) {
                console.error('🔒 解密錯誤:', message);
                if (typeof window.showError === 'function') {
                    window.showError(message);
                } else {
                    alert('錯誤: ' + message);
                }
            },
            
            initializeApp: function() {
                console.log('🚀 初始化應用程式');
                if (typeof window.onMemoirDecrypted === 'function') {
                    window.onMemoirDecrypted(secureGlobals.MEMOIR_DATA);
                } else {
                    console.log('✅ 回憶錄解密完成，資料可用');
                }
            }
        };
        
        console.log('🔒 安全框架初始化完成');
    

// ========== 提取的腳本區塊 ==========

            // 混合解密模式：密碼驗證 + 後端金鑰
            console.log('🔐 載入混合解密模式');
            
            window.passwordModeData = 'eyJjaGluZXNlX25hbWUiOiLplovnmbzogIXml6XoqowiLCJjcmVhdGVkQXQiOiIyMDI1LTA5LTA5VDA1OjAxOjEyLjI1MDcxNzMwMCswMDowMCIsImVuZ2xpc2hfbmFtZSI6ImRldmVsb3Blci1sb2ciLCJldmVudHMiOlt7ImRhdGUiOiIyMDI1LTA5LTA5IiwiZGVzY3JpcHRpb24iOiLlpqXljZTkuoZcblxu55yL5L6GVGF1cmnlsLHmmK/kuIDplovlp4vopoHlrprnvqnmuIXmpZropoHnlKjom4flnovpgoTmmK/pp53ls7DlnovnmoTlnovliKXlkI3nqLHvvIzliKrpmaTlv6vlj5bkuYvpoZ7nmoTpg73mspLmnInmlYjmnpwiLCJpZCI6IjE3NTczOTQxMTUwNzIiLCJtZWRpYSI6W3siZmlsZW5hbWUiOiJwcmV2aWV3LndlYnAiLCJpZCI6IjMyOTQ0NmVjLWExOTktNDJjZi04ZjM4LTZhMzhlM2M0OGVlNiIsImlzVXJsIjpmYWxzZSwib3JpZ2luYWxOYW1lIjoicHJldmlldy53ZWJwIiwicGF0aCI6Im1lZGlhL3ByZXZpZXcud2VicCIsInR5cGUiOiJpbWFnZSIsInVybCI6bnVsbH0seyJmaWxlbmFtZSI6IlNfXzU3Mjk0OTEzLmpwZyIsImlkIjoiY2NhYzAyNmMtYTkwYy00MjMwLTkyMmEtZjg0ZmYwZTM0MWZiIiwiaXNVcmwiOmZhbHNlLCJvcmlnaW5hbE5hbWUiOiJTX181NzI5NDkxMy5qcGciLCJwYXRoIjoibWVkaWEvU19fNTcyOTQ5MTMuanBnIiwidHlwZSI6ImltYWdlIiwidXJsIjpudWxsfV0sIm9yZGVyIjowLCJ0aXRsZSI6IuS/ruaUueS6humXnOaWvOWRveWQjeeahOWVj+mhjCJ9LHsiZGF0ZSI6IjIwMjUtMDktMDkiLCJkZXNjcmlwdGlvbiI6IuS/ruaUueS6huS4u+imgeaqlOahiFxuZnJvbnRlbmRfZW5jcnlwdGlvbi5yc1xubWVkaWFfc3RlYWx0aF9lbmNyeXB0aW9uLnJzXG5tZW1vaXJfY29tbWFuZHMucnMiLCJpZCI6IjE3NTc0MjQxMzM5NzIiLCJtZWRpYSI6W3siZmlsZW5hbWUiOiJTX181NzI3ODU4Ny5qcGciLCJpZCI6IjdkZTVkMDEzLWFlNzYtNDExYi1hMzRkLTE4YjMxMGM1N2ZjZSIsImlzVXJsIjpmYWxzZSwib3JpZ2luYWxOYW1lIjoiU19fNTcyNzg1ODcuanBnIiwicGF0aCI6Im1lZGlhL1NfXzU3Mjc4NTg3LmpwZyIsInR5cGUiOiJpbWFnZSIsInVybCI6bnVsbH1dLCJvcmRlciI6MSwidGl0bGUiOiLlj6/ku6Xkvb/nlKhNU0XliqDlr4blrozmiJDlqpLpq5TmqpTmoYjkv53orbcifV0sImlkIjoiNDU0OGI5MjktNWMxNi00ZWU3LWExODktNjA2NzllMjE2NWJlIiwibGFzdE1vZGlmaWVkIjoiMjAyNS0wOS0wOVQxMzoyMjoyNy42NjUzNzM5MDArMDA6MDAifQ==|5377171fcec1791d45b66c2c70ef41f7';
            const [encodedData, expectedPasswordHash] = window.passwordModeData.split('|');
            
            // 🚨 新增：重新整理狀態檢查函數
            function checkRefreshState() {
                const hasSessionFlag = sessionStorage.getItem('mf_pw_unlocked') === '1';
                const hasActualData = !!(window.MEMOIR_DATA && window.MEMOIR_DATA.events && window.MEMOIR_DATA.events.length > 0);
                
                console.log('🔄 檢查重新整理狀態:', {
                    hasSessionFlag,
                    hasActualData,
                    memoirDataExists: !!window.MEMOIR_DATA,
                    eventsCount: window.MEMOIR_DATA?.events?.length || 0
                });
                
                // 如果有 session 標記但沒有實際數據，說明是重新整理後的狀態
                if (hasSessionFlag && !hasActualData) {
                    console.log('⚠️ 檢測到重新整理狀態，清除 session 並顯示密碼輸入');
                    
                    // 清除無效的 session
                    sessionStorage.removeItem('mf_pw_unlocked');
                    
                    // 立即顯示密碼輸入介面
                    setTimeout(() => {
                        const loadingScreen = document.getElementById('loadingScreen');
                        const passwordModal = document.getElementById('passwordModal');
                        const app = document.getElementById('app');
                        
                        if (loadingScreen) loadingScreen.classList.add('hidden');
                        if (app) app.classList.add('hidden');
                        if (passwordModal) {
                            passwordModal.classList.remove('hidden');
                            console.log('🔒 已顯示密碼輸入介面');
                            
                            // 聚焦到密碼輸入框
                            const passwordInput = document.getElementById('memoirPassword');
                            if (passwordInput) {
                                passwordInput.focus();
                                passwordInput.value = '';
                            }
                        }
                    }, 100);
                    
                    return true; // 表示需要重新輸入密碼
                }
                
                return false; // 表示狀態正常
            }
            
            // 內部解密函數（保持原有邏輯）
            window._internalAutoDecrypt = async function(passwordInput) {
                console.log('🔍 _internalAutoDecrypt 被調用');
                
                try {
                    let password = null;
                    
                    if (typeof passwordInput === 'string') {
                        password = passwordInput.trim();
                    } else if (passwordInput && typeof passwordInput === 'object') {
                        if (passwordInput.password) {
                            password = passwordInput.password.trim();
                        } else if (passwordInput['0'] !== undefined) {
                            const chars = [];
                            let i = 0;
                            while (passwordInput[i] !== undefined) {
                                chars.push(passwordInput[i]);
                                i++;
                            }
                            password = chars.join('').trim();
                        }
                    }
                    
                    if (!password || password.length === 0) {
                        console.error('❌ 無法解析密碼參數');
                        return false;
                    }
                    
                    console.log('🔑 開始密碼驗證，長度:', password.length);
                    
                    if (encodedData && expectedPasswordHash) {
                        const calculatedHash = await hashPassword(password);
                        
                        if (calculatedHash === expectedPasswordHash) {
                            console.log('✅ 密碼驗證成功');
                            
                            try {
                                const decodedBytes = Uint8Array.from(atob(encodedData), c => c.charCodeAt(0));
                                const textDecoder = new TextDecoder('utf-8', { fatal: true });
                                const decodedText = textDecoder.decode(decodedBytes);
                                const memoirData = JSON.parse(decodedText);
                                
                                if (!memoirData || typeof memoirData !== 'object') {
                                    throw new Error('解密後的數據無效');
                                }
                                
                                // 🚨 關鍵：正確設置全域數據
                                window.MEMOIR_DATA = memoirData;
                                
                                // 🚨 重要：立即更新 UI 狀態
                                sessionStorage.setItem('mf_pw_unlocked', '1');
                                
                                // 隱藏密碼輸入，顯示應用
                                const passwordModal = document.getElementById('passwordModal');
                                const app = document.getElementById('app');
                                const loadingScreen = document.getElementById('loadingScreen');
                                
                                if (passwordModal) passwordModal.classList.add('hidden');
                                if (loadingScreen) loadingScreen.classList.add('hidden');
                                if (app) app.classList.remove('hidden');
                                
                                // 觸發解密完成事件
                                const decryptEvent = new CustomEvent('memoir:decrypted', { 
                                    detail: { data: memoirData, mode: 'password' }
                                });
                                window.dispatchEvent(decryptEvent);
                                
                                // 觸發應用啟動
                                setTimeout(() => {
                                    if (typeof window.__bootApp__ === 'function') {
                                        window.__bootApp__();
                                    } else if (typeof initializeApp === 'function') {
                                        initializeApp();
                                    }
                                }, 100);
                                
                                console.log('✅ 密碼解密完成');
                                return true;
                                
                            } catch (decodeError) {
                                console.error('❌ 數據解碼失敗:', decodeError);
                                return false;
                            }
                        } else {
                            console.log('❌ 密碼驗證失敗');
                            return false;
                        }
                    }
                    
                    return false;
                    
                } catch (error) {
                    console.error('🚨 解密過程發生錯誤:', error);
                    return false;
                }
            };
            
            // 代理函數
            window.autoDecrypt = async function(opts = {}) {
                console.log('🔍 autoDecrypt 被調用');
                
                // 🚨 首先檢查是否是重新整理狀態
                if (checkRefreshState()) {
                    console.log('🔄 檢測到重新整理狀態，等待用戶輸入密碼');
                    return false;
                }
                
                let password = null;
                
                if (typeof opts === 'string') {
                    password = opts;
                } else if (opts && typeof opts === 'object') {
                    if (opts.password) {
                        password = opts.password;
                    } else if (opts['0'] !== undefined) {
                        const chars = [];
                        let i = 0;
                        while (opts[i] !== undefined) {
                            chars.push(opts[i]);
                            i++;
                        }
                        password = chars.join('');
                    }
                }
                
                if (!password) {
                    console.log('🔍 無密碼參數，檢查是否需要顯示密碼輸入');
                    
                    // 如果沒有密碼參數，顯示密碼輸入介面
                    setTimeout(() => {
                        const loadingScreen = document.getElementById('loadingScreen');
                        const passwordModal = document.getElementById('passwordModal');
                        const app = document.getElementById('app');
                        
                        if (loadingScreen) loadingScreen.classList.add('hidden');
                        if (app) app.classList.add('hidden');
                        if (passwordModal) {
                            passwordModal.classList.remove('hidden');
                            console.log('🔒 顯示密碼輸入介面');
                        }
                    }, 100);
                    
                    return false;
                }
                
                return await window._internalAutoDecrypt(password);
            };

            // 密碼哈希函數
            async function hashPassword(password) {
                try {
                    const saltedPassword = password + '_memoir_salt_2024';
                    const encoder = new TextEncoder();
                    const data = encoder.encode(saltedPassword);
                    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
                    const hashArray = Array.from(new Uint8Array(hashBuffer));
                    const fullHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
                    return fullHash.substring(0, 32);
                } catch (e) {
                    console.warn('⚠️ 使用備用哈希算法');
                    let hash = 0;
                    const saltedPassword = password + '_memoir_salt_2024';
                    for (let i = 0; i < saltedPassword.length; i++) {
                        const char = saltedPassword.charCodeAt(i);
                        hash = ((hash << 5) - hash) + char;
                        hash = hash & hash;
                    }
                    return Math.abs(hash).toString(16).padStart(8, '0').repeat(4).substring(0, 32);
                }
            }
            
            // 🚨 頁面載入完成後立即檢查狀態
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', function() {
                    setTimeout(() => {
                        console.log('🔄 頁面載入完成，檢查重新整理狀態');
                        checkRefreshState();
                    }, 500);
                });
            } else {
                setTimeout(() => {
                    console.log('🔄 立即檢查重新整理狀態');
                    checkRefreshState();
                }, 500);
            }
            
            console.log('✅ 混合解密模式載入完成');
        

// ========== 提取的腳本區塊 ==========

            // MSE 媒體檔案自動解密程式碼 - UI改進版
            (function() {
                'use strict';
                
                console.log('🔓 MSE媒體解密模組已載入');
                
                const MSE_OFFSET = 37;
                const GITHUB_BASE_URL = 'https://maso0310.github.io/memoir-developer-log/media/';
                
                // 創建載入動畫的CSS樣式
                const loadingStyles = `
                    .mse-loading-container {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        width: 100%;
                        height: 100%;
                        min-height: 200px;
                        background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
                        border-radius: 8px;
                        backdrop-filter: blur(10px);
                    }
                    
                    .mse-loading-spinner {
                        width: 40px;
                        height: 40px;
                        border: 3px solid rgba(255,255,255,0.3);
                        border-top: 3px solid #3b82f6;
                        border-radius: 50%;
                        animation: mse-spin 1s linear infinite;
                    }
                    
                    .mse-loading-text {
                        margin-left: 12px;
                        color: rgba(255,255,255,0.8);
                        font-size: 14px;
                        font-weight: 500;
                    }
                    
                    .mse-thumbnail-loading {
                        width: 100%;
                        height: 100%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        background: linear-gradient(45deg, #f0f0f0 25%, transparent 25%), 
                                    linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), 
                                    linear-gradient(45deg, transparent 75%, #f0f0f0 75%), 
                                    linear-gradient(-45deg, transparent 75%, #f0f0f0 75%);
                        background-size: 20px 20px;
                        background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
                        animation: mse-loading-bg 1s linear infinite;
                    }
                    
                    .mse-thumbnail-spinner {
                        width: 24px;
                        height: 24px;
                        border: 2px solid rgba(0,0,0,0.1);
                        border-top: 2px solid #3b82f6;
                        border-radius: 50%;
                        animation: mse-spin 0.8s linear infinite;
                    }
                    
                    @keyframes mse-spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                    
                    @keyframes mse-loading-bg {
                        0% { background-position: 0 0, 0 10px, 10px -10px, -10px 0px; }
                        100% { background-position: 20px 20px, 20px 30px, 30px 10px, 10px 20px; }
                    }
                    
                    /* 隱藏成功解密後的邊框 */
                    .mse-decrypted {
                        border: none !important;
                    }
                    
                    /* 縮圖容器樣式 */
                    .mse-thumbnail-container {
                        position: relative;
                        overflow: hidden;
                        border-radius: 4px;
                    }
                `;
                
                // 注入樣式
                if (!document.getElementById('mse-styles')) {
                    const styleSheet = document.createElement('style');
                    styleSheet.id = 'mse-styles';
                    styleSheet.textContent = loadingStyles;
                    document.head.appendChild(styleSheet);
                }
                
                // MSE位元組偏移解密函數
                function mseByteDecode(encryptedData) {
                    const decrypted = new Uint8Array(encryptedData.length);
                    for (let i = 0; i < encryptedData.length; i++) {
                        decrypted[i] = (encryptedData[i] + 256 - MSE_OFFSET) % 256;
                    }
                    return decrypted;
                }
                
                // 創建載入中的佔位元素
                function createLoadingPlaceholder(isLarge = true) {
                    const container = document.createElement('div');
                    if (isLarge) {
                        container.className = 'mse-loading-container';
                        const spinner = document.createElement('div');
                        spinner.className = 'mse-loading-spinner';
                        const text = document.createElement('div');
                        text.className = 'mse-loading-text';
                        text.textContent = '正在解密圖片...';
                        container.appendChild(spinner);
                        container.appendChild(text);
                    } else {
                        container.className = 'mse-thumbnail-loading';
                        const spinner = document.createElement('div');
                        spinner.className = 'mse-thumbnail-spinner';
                        container.appendChild(spinner);
                    }
                    return container;
                }
                
                // 載入並解密媒體檔案
                async function loadAndDecryptMedia(mediaUrl) {
                    try {
                        console.log(`📥 載入加密檔案: ${mediaUrl}`);
                        
                        const response = await fetch(mediaUrl);
                        if (!response.ok) {
                            throw new Error(`載入失敗: ${response.status}`);
                        }
                        
                        const encryptedBuffer = await response.arrayBuffer();
                        const encryptedData = new Uint8Array(encryptedBuffer);
                        
                        // 執行MSE解密
                        const decryptedData = mseByteDecode(encryptedData);
                        
                        // 判斷檔案類型並設定MIME
                        let mimeType = 'application/octet-stream';
                        if (decryptedData[0] === 0xFF && decryptedData[1] === 0xD8) {
                            mimeType = 'image/jpeg';
                        } else if (decryptedData[0] === 0x89 && decryptedData[1] === 0x50) {
                            mimeType = 'image/png';
                        } else if (decryptedData.slice(8, 12).every((b, i) => b === [0x57, 0x45, 0x42, 0x50][i])) {
                            mimeType = 'image/webp';
                        }
                        
                        const blob = new Blob([decryptedData], { type: mimeType });
                        const decryptedUrl = URL.createObjectURL(blob);
                        
                        console.log(`✅ 解密完成: ${mediaUrl}`);
                        return decryptedUrl;
                        
                    } catch (error) {
                        console.error(`❌ 解密失敗 ${mediaUrl}:`, error);
                        return null;
                    }
                }
                
                // 處理單個媒體元素的解密
                async function decryptSingleMediaElement(element, isThumbnail = false) {
                    const originalSrc = element.getAttribute('data-original-src');
                    if (!originalSrc) return false;
                    
                    // 構建完整URL
                    let fullUrl;
                    if (originalSrc.startsWith('media/')) {
                        const filename = originalSrc.replace('media/', '');
                        fullUrl = GITHUB_BASE_URL + filename;
                    } else if (originalSrc.includes('/media/')) {
                        fullUrl = originalSrc;
                    } else {
                        return false;
                    }
                    
                    console.log(`🔄 處理${isThumbnail ? '縮圖' : '媒體'}元素: ${fullUrl}`);
                    
                    // 顯示載入動畫
                    if (isThumbnail) {
                        // 為縮圖創建載入狀態
                        const parent = element.parentElement;
                        if (parent) {
                            const loadingElement = createLoadingPlaceholder(false);
                            loadingElement.style.position = 'absolute';
                            loadingElement.style.top = '0';
                            loadingElement.style.left = '0';
                            loadingElement.style.width = '100%';
                            loadingElement.style.height = '100%';
                            loadingElement.style.zIndex = '1';
                            parent.style.position = 'relative';
                            parent.appendChild(loadingElement);
                            
                            const decryptedUrl = await loadAndDecryptMedia(fullUrl);
                            if (decryptedUrl) {
                                element.src = decryptedUrl;
                                element.classList.add('mse-decrypted');
                                element.removeAttribute('data-needs-mse-decrypt');
                                parent.removeChild(loadingElement);
                                console.log(`✅ 縮圖解密成功`);
                                return true;
                            } else {
                                parent.removeChild(loadingElement);
                                console.log(`❌ 縮圖解密失敗`);
                                return false;
                            }
                        }
                    } else {
                        const decryptedUrl = await loadAndDecryptMedia(fullUrl);
                        if (decryptedUrl) {
                            element.src = decryptedUrl;
                            element.classList.add('mse-decrypted'); // 移除邊框的class
                            element.removeAttribute('data-needs-mse-decrypt');
                            console.log(`✅ 媒體元素解密成功`);
                            return true;
                        } else {
                            console.log(`❌ 媒體元素解密失敗`);
                            return false;
                        }
                    }
                }
                
                // 處理縮圖和網格模式的圖片
                async function decryptThumbnailsAndGrid() {
                    // 處理carousel縮圖
                    const thumbnails = document.querySelectorAll('.media-thumbnail img[data-needs-mse-decrypt], .carousel-thumbnail img[data-needs-mse-decrypt], .thumbnail img[data-needs-mse-decrypt]');
                    console.log(`🖼️ 找到 ${thumbnails.length} 個縮圖需要解密`);
                    
                    for (const thumb of thumbnails) {
                        await decryptSingleMediaElement(thumb, true);
                        await new Promise(resolve => setTimeout(resolve, 50)); // 短暫延遲
                    }
                    
                    // 處理網格模式的圖片
                    const gridImages = document.querySelectorAll('.grid-item img[data-needs-mse-decrypt], .media-grid img[data-needs-mse-decrypt]');
                    console.log(`🔲 找到 ${gridImages.length} 個網格圖片需要解密`);
                    
                    for (const img of gridImages) {
                        await decryptSingleMediaElement(img, true);
                        await new Promise(resolve => setTimeout(resolve, 50));
                    }
                }
                
                // 自動解密所有媒體檔案
                async function autoDecryptAllMedia() {
                    console.log('🔍 搜尋需要解密的媒體檔案...');
                    
                    // 尋找標記為需要MSE解密的主要媒體元素
                    const markedElements = document.querySelectorAll('[data-needs-mse-decrypt="true"]:not(.media-thumbnail img):not(.carousel-thumbnail img):not(.thumbnail img):not(.grid-item img):not(.media-grid img)');
                    console.log(`🏷️ 找到 ${markedElements.length} 個主要媒體元素`);
                    
                    // 尋找傳統的media路徑圖片（向後相容）
                    const traditionalImages = document.querySelectorAll('img[src*="media/"]:not([data-needs-mse-decrypt]):not(.media-thumbnail img):not(.carousel-thumbnail img):not(.thumbnail img)');
                    console.log(`📷 找到 ${traditionalImages.length} 個傳統media路徑圖片`);
                    
                    let successCount = 0;
                    let totalCount = 0;
                    
                    // 處理主要媒體元素
                    for (let i = 0; i < markedElements.length; i++) {
                        const element = markedElements[i];
                        totalCount++;
                        console.log(`🎯 處理主要元素 ${i + 1}/${markedElements.length}`);
                        
                        const success = await decryptSingleMediaElement(element, false);
                        if (success) successCount++;
                        
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }
                    
                    // 處理傳統圖片
                    for (let i = 0; i < traditionalImages.length; i++) {
                        const img = traditionalImages[i];
                        const originalSrc = img.getAttribute('src');
                        totalCount++;
                        
                        let fullUrl;
                        if (originalSrc.startsWith('media/')) {
                            const filename = originalSrc.replace('media/', '');
                            fullUrl = GITHUB_BASE_URL + filename;
                        } else if (originalSrc.includes('/media/')) {
                            fullUrl = originalSrc;
                        } else {
                            continue;
                        }
                        
                        console.log(`🖼️ 處理傳統圖片 ${i + 1}/${traditionalImages.length}: ${fullUrl}`);
                        
                        const decryptedUrl = await loadAndDecryptMedia(fullUrl);
                        if (decryptedUrl) {
                            img.src = decryptedUrl;
                            img.classList.add('mse-decrypted');
                            successCount++;
                            console.log(`✅ 圖片解密成功`);
                        } else {
                            console.log(`❌ 圖片解密失敗`);
                        }
                        
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }
                    
                    // 處理縮圖和網格
                    await decryptThumbnailsAndGrid();
                    
                    console.log(`🎉 媒體解密程序完成！成功: ${successCount}/${totalCount}`);
                    return { success: successCount, total: totalCount };
                }
                
                // DOM載入完成後自動執行解密
                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', () => {
                        setTimeout(autoDecryptAllMedia, 500); // 延遲執行確保DOM完全載入
                    });
                } else {
                    setTimeout(autoDecryptAllMedia, 500);
                }
                
                // 監聽動態內容變化
                if (typeof MutationObserver !== 'undefined') {
                    const observer = new MutationObserver((mutations) => {
                        mutations.forEach((mutation) => {
                            if (mutation.type === 'childList') {
                                // 檢查新增的標記元素
                                const addedMarkedElements = Array.from(mutation.addedNodes)
                                    .filter(node => node.nodeType === Node.ELEMENT_NODE)
                                    .flatMap(node => [
                                        ...(node.hasAttribute && node.hasAttribute('data-needs-mse-decrypt') ? [node] : []),
                                        ...node.querySelectorAll ? node.querySelectorAll('[data-needs-mse-decrypt="true"]') : []
                                    ]);
                                
                                if (addedMarkedElements.length > 0) {
                                    console.log(`🔄 檢測到 ${addedMarkedElements.length} 個新的標記媒體元素，開始解密...`);
                                    setTimeout(() => {
                                        addedMarkedElements.forEach(async (element) => {
                                            const isThumbnail = element.closest('.media-thumbnail, .carousel-thumbnail, .thumbnail, .grid-item, .media-grid') !== null;
                                            await decryptSingleMediaElement(element, isThumbnail);
                                        });
                                    }, 100);
                                }
                            }
                        });
                    });
                    
                    observer.observe(document.body, {
                        childList: true,
                        subtree: true
                    });
                }
                
                // 提供全域函數供手動呼叫
                window.forceDecryptMedia = autoDecryptAllMedia;
                window.decryptSingleMedia = decryptSingleMediaElement;
                window.decryptThumbnails = decryptThumbnailsAndGrid;
                
            })();
        

// ========== 提取的腳本區塊 ==========

            // 🚨 密碼輸入修正邏輯
            document.addEventListener('DOMContentLoaded', function() {
                console.log('🔑 設置密碼輸入事件處理器');
                
                const passwordInput = document.getElementById('memoirPassword');
                const unlockBtn = document.getElementById('unlockBtn');
                const errorDiv = document.getElementById('passwordError');
                
                if (!passwordInput || !unlockBtn) {
                    console.error('❌ 找不到密碼輸入元素');
                    return;
                }
                
                const handleUnlock = async () => {
                    const password = passwordInput.value?.trim() || '';
                    
                    console.log('🔐 用戶點擊解鎖按鈕，密碼長度:', password.length);
                    
                    if (errorDiv) errorDiv.classList.add('hidden');
                    
                    if (password.length < 6) {
                        if (errorDiv) {
                            errorDiv.textContent = '密碼長度不足，至少需要6個字元';
                            errorDiv.classList.remove('hidden');
                        }
                        return;
                    }
                    
                    unlockBtn.disabled = true;
                    unlockBtn.textContent = '解鎖中...';
                    
                    try {
                        let success = false;
                        
                        if (typeof window._internalAutoDecrypt === 'function') {
                            success = await window._internalAutoDecrypt(password);
                        } else {
                            console.error('❌ 找不到解密函數');
                        }
                        
                        if (!success) {
                            if (errorDiv) {
                                errorDiv.textContent = '密碼錯誤，請重新輸入';
                                errorDiv.classList.remove('hidden');
                            }
                            passwordInput.value = '';
                            passwordInput.focus();
                        }
                        
                    } catch (error) {
                        console.error('🚨 解鎖失敗:', error);
                        if (errorDiv) {
                            errorDiv.textContent = '解鎖失敗，請重試';
                            errorDiv.classList.remove('hidden');
                        }
                    } finally {
                        unlockBtn.disabled = false;
                        unlockBtn.textContent = '解鎖查看';
                    }
                };
                
                // 綁定事件（移除舊的事件監聽器）
                unlockBtn.replaceWith(unlockBtn.cloneNode(true));
                const newUnlockBtn = document.getElementById('unlockBtn');
                newUnlockBtn.addEventListener('click', handleUnlock);
                
                passwordInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        handleUnlock();
                    }
                });
                
                console.log('✅ 密碼輸入事件處理器設置完成');
            });
        

// ========== 提取的腳本區塊 ==========

            // 🚨 重新整理修正：頁面狀態管理
            document.addEventListener('DOMContentLoaded', function() {
                console.log('🔄 初始化重新整理修正邏輯');
                
                // 等待所有元素載入
                setTimeout(() => {
                    const passwordModal = document.getElementById('passwordModal');
                    const loadingScreen = document.getElementById('loadingScreen');
                    const app = document.getElementById('app');
                    const passwordInput = document.getElementById('memoirPassword');
                    const unlockBtn = document.getElementById('unlockBtn');
                    const errorDiv = document.getElementById('passwordError');
                    
                    // 🚨 關鍵：檢查重新整理後的狀態
                    function checkAndFixState() {
                        const hasSessionFlag = sessionStorage.getItem('mf_pw_unlocked') === '1';
                        const hasActualData = !!(window.MEMOIR_DATA && window.MEMOIR_DATA.events);
                        
                        console.log('📊 狀態檢查:', {
                            hasSessionFlag,
                            hasActualData,
                            dataExists: !!window.MEMOIR_DATA,
                            eventsCount: window.MEMOIR_DATA?.events?.length || 0
                        });
                        
                        // 狀態不一致的修正
                        if (hasSessionFlag && !hasActualData) {
                            console.log('⚠️ 檢測到重新整理後狀態不一致，修正中...');
                            
                            // 清除無效的 session
                            sessionStorage.removeItem('mf_pw_unlocked');
                            
                            // 正確設置 UI 狀態
                            if (loadingScreen) loadingScreen.classList.add('hidden');
                            if (app) app.classList.add('hidden');
                            if (passwordModal) {
                                passwordModal.classList.remove('hidden');
                                console.log('🔒 顯示密碼輸入介面');
                            }
                            
                            return 'need_password';
                        }
                        
                        // 正常需要密碼的情況
                        if (!hasSessionFlag) {
                            console.log('🔐 正常密碼保護狀態');
                            
                            if (loadingScreen) loadingScreen.classList.add('hidden');
                            if (app) app.classList.add('hidden');
                            if (passwordModal) {
                                passwordModal.classList.remove('hidden');
                                console.log('🔒 顯示密碼輸入介面');
                            }
                            
                            return 'need_password';
                        }
                        
                        // 已解鎖且有數據
                        if (hasSessionFlag && hasActualData) {
                            console.log('✅ 已解鎖狀態，正常載入');
                            
                            if (passwordModal) passwordModal.classList.add('hidden');
                            if (loadingScreen) loadingScreen.classList.add('hidden');
                            if (app) app.classList.remove('hidden');
                            
                            return 'unlocked';
                        }
                        
                        return 'unknown';
                    }
                    
                    const pageState = checkAndFixState();
                    
                    if (pageState === 'need_password') {
                        console.log('🔑 設置密碼輸入功能');
                        
                        // 清理介面
                        if (errorDiv) {
                            errorDiv.classList.add('hidden');
                            errorDiv.textContent = '';
                        }
                        
                        if (passwordInput) {
                            passwordInput.focus();
                            passwordInput.value = '';
                        }
                        
                        const tryUnlock = async () => {
                            const password = passwordInput?.value?.trim() || '';
                            
                            console.log('🔐 嘗試解鎖，密碼長度:', password.length);
                            
                            if (errorDiv) errorDiv.classList.add('hidden');
                            
                            if (password.length < 6) {
                                if (errorDiv) {
                                    errorDiv.textContent = '密碼長度不足，至少需要6個字元';
                                    errorDiv.classList.remove('hidden');
                                }
                                return;
                            }
                            
                            if (unlockBtn) {
                                unlockBtn.disabled = true;
                                unlockBtn.textContent = '解鎖中...';
                            }
                            
                            try {
                                let success = false;
                                
                                if (typeof window._internalAutoDecrypt === 'function') {
                                    success = await window._internalAutoDecrypt(password);
                                } else {
                                    console.error('❌ 找不到解密函數');
                                    throw new Error('解密函數未載入');
                                }
                                
                                console.log('🔓 解鎖結果:', success);
                                
                                if (success) {
                                    // 等待數據確認
                                    setTimeout(() => {
                                        const hasData = !!(window.MEMOIR_DATA && window.MEMOIR_DATA.events);
                                        
                                        if (hasData) {
                                            console.log('🎉 解鎖成功且數據已載入');
                                            
                                            sessionStorage.setItem('mf_pw_unlocked', '1');
                                            
                                            if (passwordModal) passwordModal.classList.add('hidden');
                                            if (app) app.classList.remove('hidden');
                                            if (loadingScreen) loadingScreen.classList.add('hidden');
                                            
                                            // 觸發應用初始化
                                            if (typeof window.__bootApp__ === 'function') {
                                                window.__bootApp__();
                                            } else if (typeof initializeApp === 'function') {
                                                initializeApp();
                                            }
                                        } else {
                                            console.error('❌ 解鎖成功但數據無效');
                                            throw new Error('解鎖成功但無法載入數據');
                                        }
                                    }, 100);
                                } else {
                                    throw new Error('密碼驗證失敗');
                                }
                                
                            } catch (error) {
                                console.error('🚨 解鎖過程出錯:', error);
                                
                                sessionStorage.removeItem('mf_pw_unlocked');
                                
                                if (errorDiv) {
                                    errorDiv.textContent = error.message || '密碼錯誤，請重新輸入';
                                    errorDiv.classList.remove('hidden');
                                }
                            } finally {
                                if (unlockBtn) {
                                    unlockBtn.disabled = false;
                                    unlockBtn.textContent = '解鎖查看';
                                }
                            }
                        };
                        
                        // 綁定事件
                        if (unlockBtn) {
                            unlockBtn.addEventListener('click', tryUnlock);
                        }
                        
                        if (passwordInput) {
                            passwordInput.addEventListener('keydown', (e) => {
                                if (e.key === 'Enter') {
                                    tryUnlock();
                                }
                            });
                        }
                    }
                    
                    // 🚨 監聽解密成功事件
                    window.addEventListener('memoir:decrypted', function(event) {
                        console.log('📡 收到解密成功事件');
                        
                        setTimeout(() => {
                            const hasData = !!(window.MEMOIR_DATA && window.MEMOIR_DATA.events);
                            
                            if (hasData) {
                                sessionStorage.setItem('mf_pw_unlocked', '1');
                                
                                if (passwordModal) passwordModal.classList.add('hidden');
                                if (app) app.classList.remove('hidden');
                                if (loadingScreen) loadingScreen.classList.add('hidden');
                                
                                console.log('✅ 解密事件後 UI 狀態已更新');
                            }
                        }, 50);
                    });
                    
                    // 🚨 頁面可見性變化監聽（處理標籤頁切換）
                    document.addEventListener('visibilitychange', function() {
                        if (!document.hidden) {
                            setTimeout(() => {
                                const hasSessionFlag = sessionStorage.getItem('mf_pw_unlocked') === '1';
                                const hasActualData = !!(window.MEMOIR_DATA && window.MEMOIR_DATA.events);
                                
                                if (hasSessionFlag && !hasActualData) {
                                    console.log('⚠️ 標籤頁切換回來檢測到狀態不一致');
                                    sessionStorage.removeItem('mf_pw_unlocked');
                                    
                                    if (app) app.classList.add('hidden');
                                    if (loadingScreen) loadingScreen.classList.add('hidden');
                                    if (passwordModal) passwordModal.classList.remove('hidden');
                                }
                            }, 500);
                        }
                    });
                    
                }, 500); // 延遲確保所有元素都已載入
                
                console.log('✅ 重新整理修正邏輯初始化完成');
            });
        


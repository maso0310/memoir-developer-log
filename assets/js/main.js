// MemoirFlow 加密回憶錄主腳本
// 回憶錄ID: 4548b929-5c16-4ee7-a189-60679e2165be
// 生成時間: 2025-09-12T17:43:41.227709+00:00

// ========== 提取的腳本區塊 ==========

        // 全局變數
        let MEMOIR_DATA = null;
        let currentEventIndex = 0;
        let currentMediaIndex = 0;
        let isDecrypting = false;

        // DOM 元素緩存
        const elements = {
            loadingScreen: document.getElementById('loadingScreen'),
            app: document.getElementById('app'),
            mediaDisplay: document.getElementById('mediaDisplay'),
            eventDescription: document.getElementById('eventDescription'),
            currentEventNum: document.getElementById('currentEventNum'),
            totalEvents: document.getElementById('totalEvents'),
            currentMediaNum: document.getElementById('currentMediaNum'),
            mediaCount: document.getElementById('mediaCount'),
            timeline: document.getElementById('timeline'),
            thumbnails: document.getElementById('thumbnails'),
            prevEventBtn: document.getElementById('prevEventBtn'),
            nextEventBtn: document.getElementById('nextEventBtn'),
            prevMediaBtn: document.getElementById('prevMediaBtn'),
            nextMediaBtn: document.getElementById('nextMediaBtn')
        };

        // 性能優化：事件防抖
        function debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func.apply(this, args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        }

        // 快速媒體解密（移除複雜調度）
        function quickDecryptMedia() {
            if (!window.forceDecryptMedia || isDecrypting) return;
            isDecrypting = true;
            
            try {
                // 直接調用解密函數，不使用複雜的非阻塞調度
                window.forceDecryptMedia();
            } finally {
                isDecrypting = false;
            }
        }

        // 獲取當前事件
        function getCurrentEvent() {
            if (!MEMOIR_DATA) {
                console.warn('⚠️ MEMOIR_DATA 尚未載入');
                return null;
            }
            if (!MEMOIR_DATA.timeline_events) {
                console.warn('⚠️ MEMOIR_DATA.timeline_events 不存在');
                return null;
            }
            if (currentEventIndex >= MEMOIR_DATA.timeline_events.length) {
                console.warn('⚠️ currentEventIndex 超出範圍');
                return null;
            }
            return MEMOIR_DATA.timeline_events[currentEventIndex];
        }

        // 快速顯示媒體
        function displayMedia() {
            const currentEvent = getCurrentEvent();
            if (!currentEvent?.media || currentEvent.media.length === 0) {
                elements.mediaDisplay.innerHTML = '<div>此事件沒有媒體檔案</div>';
                return;
            }

            const media = currentEvent.media[currentMediaIndex];
            if (!media) return;

            // 清空顯示區
            elements.mediaDisplay.innerHTML = '';

            // 創建媒體元素
            let mediaElement;
            if (media.type === 'image' || media.media_type === 'image') {
                mediaElement = document.createElement('img');
                mediaElement.alt = '回憶錄圖片';
                
                // 設置媒體源
                const mediaSrc = media.src || media.url || `./media/${media.filename}`;
                
                // 如果需要解密
                if (mediaSrc.includes('media/')) {
                    mediaElement.setAttribute('data-needs-mse-decrypt', 'true');
                    mediaElement.setAttribute('data-original-src', mediaSrc);
                    
                    // 設置載入中圖片
                    mediaElement.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSI4IiBmaWxsPSJub25lIiBzdHJva2U9IiMzYjgyZjYiIHN0cm9rZS13aWR0aD0iMiI+PGFuaW1hdGVUcmFuc2Zvcm0gYXR0cmlidXRlTmFtZT0idHJhbnNmb3JtIiB0eXBlPSJyb3RhdGUiIHZhbHVlcz0iMCAyMCAyMDszNjAgMjAgMjAiIGR1cj0iMXMiIHJlcGVhdENvdW50PSJpbmRlZmluaXRlIi8+PC9jaXJjbGU+PC9zdmc+';
                    
                    // 快速解密
                    setTimeout(quickDecryptMedia, 10);
                } else {
                    mediaElement.src = mediaSrc;
                }
            } else if (media.type === 'video' || media.media_type === 'video') {
                mediaElement = document.createElement('video');
                mediaElement.controls = true;
                mediaElement.src = media.src || media.url || `./media/${media.filename}`;
            }

            if (mediaElement) {
                elements.mediaDisplay.appendChild(mediaElement);
            }
        }

        // 快速渲染縮圖
        function renderThumbnails() {
            const currentEvent = getCurrentEvent();
            if (!currentEvent?.media) {
                elements.thumbnails.innerHTML = '';
                return;
            }

            const fragment = document.createDocumentFragment();
            
            currentEvent.media.forEach((media, index) => {
                const thumbnail = document.createElement('div');
                thumbnail.className = `thumbnail ${index === currentMediaIndex ? 'active' : ''}`;
                
                if (media.type === 'image' || media.media_type === 'image') {
                    const img = document.createElement('img');
                    const mediaSrc = media.src || media.url || `./media/${media.filename}`;
                    
                    if (mediaSrc.includes('media/')) {
                        img.setAttribute('data-needs-mse-decrypt', 'true');
                        img.setAttribute('data-original-src', mediaSrc);
                        img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiNmOWZhZmIiLz48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSI4IiBmaWxsPSJub25lIiBzdHJva2U9IiNkMWQ1ZGIiIHN0cm9rZS13aWR0aD0iMiI+PGFuaW1hdGVUcmFuc2Zvcm0gYXR0cmlidXRlTmFtZT0idHJhbnNmb3JtIiB0eXBlPSJyb3RhdGUiIHZhbHVlcz0iMCAzMCAzMDszNjAgMzAgMzAiIGR1cj0iMXMiIHJlcGVhdENvdW50PSJpbmRlZmluaXRlIi8+PC9jaXJjbGU+PC9zdmc+';
                    } else {
                        img.src = mediaSrc;
                    }
                    
                    thumbnail.appendChild(img);
                }
                
                // 點擊事件
                thumbnail.addEventListener('click', () => {
                    currentMediaIndex = index;
                    loadEvent();
                });
                
                fragment.appendChild(thumbnail);
            });
            
            elements.thumbnails.innerHTML = '';
            elements.thumbnails.appendChild(fragment);
        }

        // 快速載入事件
        function loadEvent() {
            const currentEvent = getCurrentEvent();
            if (!currentEvent) return;

            // 更新資訊
            elements.currentEventNum.textContent = currentEventIndex + 1;
            elements.totalEvents.textContent = MEMOIR_DATA.timeline_events.length;
            elements.mediaCount.textContent = currentEvent.media ? currentEvent.media.length : 0;
            elements.currentMediaNum.textContent = currentMediaIndex + 1;

            // 更新描述（簡化的打字機效果）
            elements.eventDescription.textContent = currentEvent.description || '';

            // 更新導航按鈕
            elements.prevEventBtn.disabled = currentEventIndex === 0;
            elements.nextEventBtn.disabled = currentEventIndex === MEMOIR_DATA.timeline_events.length - 1;
            elements.prevMediaBtn.disabled = currentMediaIndex === 0;
            elements.nextMediaBtn.disabled = !currentEvent.media || currentMediaIndex === currentEvent.media.length - 1;

            // 快速載入媒體
            displayMedia();
            renderThumbnails();
            
            // 快速解密
            setTimeout(quickDecryptMedia, 50);
        }

        // 事件處理器
        elements.prevEventBtn.addEventListener('click', () => {
            if (currentEventIndex > 0) {
                currentEventIndex--;
                currentMediaIndex = 0;
                loadEvent();
            }
        });

        elements.nextEventBtn.addEventListener('click', () => {
            if (currentEventIndex < MEMOIR_DATA.timeline_events.length - 1) {
                currentEventIndex++;
                currentMediaIndex = 0;
                loadEvent();
            }
        });

        elements.prevMediaBtn.addEventListener('click', () => {
            const currentEvent = getCurrentEvent();
            if (currentEvent?.media && currentMediaIndex > 0) {
                currentMediaIndex--;
                loadEvent();
            }
        });

        elements.nextMediaBtn.addEventListener('click', () => {
            const currentEvent = getCurrentEvent();
            if (currentEvent?.media && currentMediaIndex < currentEvent.media.length - 1) {
                currentMediaIndex++;
                loadEvent();
            }
        });

        // 鍵盤導航
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT') return;
            
            switch(e.key) {
                case 'ArrowLeft':
                    elements.prevMediaBtn.click();
                    break;
                case 'ArrowRight':
                    elements.nextMediaBtn.click();
                    break;
                case 'ArrowUp':
                    elements.prevEventBtn.click();
                    break;
                case 'ArrowDown':
                    elements.nextEventBtn.click();
                    break;
            }
        });

        // 數據結構轉換函數
        function normalizeDataStructure(data) {
            if (!data) return null;
            
            // 如果已經有 timeline_events，直接返回
            if (data.timeline_events) {
                console.log('✅ 數據已為 timeline_events 格式');
                return data;
            }
            
            // 如果有 events，轉換為 timeline_events 格式
            if (data.events && Array.isArray(data.events)) {
                console.log('🔄 轉換 events 到 timeline_events 格式');
                const converted = {
                    ...data,
                    timeline_events: data.events
                };
                console.log('✅ 數據結構轉換完成:', converted);
                return converted;
            }
            
            console.warn('⚠️ 無法識別的數據結構:', data);
            return data;
        }

        // 初始化函數
        function initializeApp() {
            console.log('🚀 初始化高性能應用');
            console.log('📊 MEMOIR_DATA 狀態:', MEMOIR_DATA);
            
            if (!MEMOIR_DATA) {
                console.error('❌ MEMOIR_DATA 為空，無法初始化應用');
                return;
            }
            
            // 正規化數據結構
            MEMOIR_DATA = normalizeDataStructure(MEMOIR_DATA);
            if (!MEMOIR_DATA) {
                console.error('❌ 數據正規化失敗');
                return;
            }
            
            if (!MEMOIR_DATA.timeline_events) {
                console.error('❌ MEMOIR_DATA.timeline_events 不存在');
                console.log('📊 可用的數據鍵:', Object.keys(MEMOIR_DATA));
                return;
            }
            
            console.log('📅 事件數量:', MEMOIR_DATA.timeline_events.length);
            
            // 隱藏載入畫面
            elements.loadingScreen.classList.add('hidden');
            elements.app.classList.remove('hidden');

            // 載入第一個事件
            if (MEMOIR_DATA.timeline_events.length > 0) {
                loadEvent();
            } else {
                console.warn('⚠️ 沒有回憶錄事件可顯示');
                elements.mediaDisplay.innerHTML = '<div>此回憶錄沒有事件內容</div>';
            }

            console.log('✅ 高性能應用初始化完成');
        }

        // 解密成功回調
        window.onDecryptionSuccess = function(decryptedData) {
            console.log('🎯 onDecryptionSuccess 被調用，數據:', decryptedData);
            MEMOIR_DATA = decryptedData;
            initializeApp();
        };

        // 監聽解密成功事件
        document.addEventListener('decryptionSuccess', function(event) {
            console.log('🎯 收到 decryptionSuccess 事件，數據:', event.detail);
            if (event.detail) {
                MEMOIR_DATA = event.detail;
                const passwordModal = document.getElementById('passwordModal');
                if (passwordModal) {
                    passwordModal.classList.add('hidden');
                }
                initializeApp();
            }
        });

        // 監聽 memoir:decrypted 事件（主要的解密成功事件）
        window.addEventListener('memoir:decrypted', function(event) {
            console.log('🎯 收到 memoir:decrypted 事件，數據:', event.detail);
            
            let memoirData = null;
            if (event.detail && event.detail.data) {
                memoirData = event.detail.data;
            } else if (event.detail) {
                memoirData = event.detail;
            }
            
            if (memoirData) {
                // 設置到全域變數
                window.MEMOIR_DATA = memoirData;
                MEMOIR_DATA = memoirData;
                
                console.log('✅ 從 memoir:decrypted 設置 MEMOIR_DATA:', MEMOIR_DATA);
                console.log('📊 數據結構檢查 - events:', !!MEMOIR_DATA.events, 'timeline_events:', !!MEMOIR_DATA.timeline_events);
                
                const passwordModal = document.getElementById('passwordModal');
                if (passwordModal) {
                    passwordModal.classList.add('hidden');
                }
                initializeApp();
            }
        });

        // 密碼驗證函數
        function setupPasswordModal() {
            const unlockBtn = document.getElementById('unlockBtn');
            const passwordInput = document.getElementById('memoirPassword');
            const passwordModal = document.getElementById('passwordModal');
            const passwordError = document.getElementById('passwordError');

            if (!unlockBtn || !passwordInput) return;

            const tryUnlock = async () => {
                const password = passwordInput.value.trim();
                
                if (!password) {
                    if (passwordError) {
                        passwordError.textContent = '請輸入密碼';
                        passwordError.classList.remove('hidden');
                    }
                    return;
                }

                // 禁用按鈕防止重複點擊
                unlockBtn.disabled = true;
                unlockBtn.textContent = '解鎖中...';

                try {
                    // 調用解密函數
                    let success = false;
                    let decryptedData = null;
                    
                    if (typeof window.attemptDecryption === 'function') {
                        const result = await window.attemptDecryption(password);
                        success = !!result;
                        decryptedData = result;
                    } else if (typeof window.decryptWithPassword === 'function') {
                        const result = await window.decryptWithPassword(password);
                        success = !!result;
                        decryptedData = result;
                    }

                    console.log('🔓 解鎖結果:', success, '數據:', decryptedData);

                    if (success) {
                        // 解鎖成功
                        sessionStorage.setItem('mf_pw_unlocked', '1');
                        if (passwordModal) {
                            passwordModal.classList.add('hidden');
                        }
                        
                        // 設置解密的數據
                        let finalData = null;
                        if (decryptedData) {
                            finalData = decryptedData;
                            console.log('✅ 從解密函數取得數據:', finalData);
                        } else if (window.MEMOIR_DATA) {
                            finalData = window.MEMOIR_DATA;
                            console.log('✅ 從 window.MEMOIR_DATA 取得數據:', finalData);
                        }
                        
                        if (finalData) {
                            // 設置到全域和本地變數
                            window.MEMOIR_DATA = finalData;
                            MEMOIR_DATA = finalData;
                            
                            console.log('🎯 最終數據設置完成:', MEMOIR_DATA);
                            console.log('📊 數據結構檢查 - events:', !!MEMOIR_DATA.events, 'timeline_events:', !!MEMOIR_DATA.timeline_events);
                            
                            // 調用解密成功回調
                            if (typeof window.onDecryptionSuccess === 'function') {
                                console.log('🎯 調用 onDecryptionSuccess 回調');
                                window.onDecryptionSuccess(MEMOIR_DATA);
                            } else {
                                // 直接初始化應用
                                initializeApp();
                            }
                        } else {
                            console.error('❌ 無法取得解密數據');
                        }
                    } else {
                        // 密碼錯誤
                        if (passwordError) {
                            passwordError.textContent = '密碼錯誤，請重新輸入';
                            passwordError.classList.remove('hidden');
                        }
                        passwordInput.value = '';
                        passwordInput.focus();
                    }
                } finally {
                    // 恢復按鈕狀態
                    unlockBtn.disabled = false;
                    unlockBtn.textContent = '解鎖查看';
                }
            };

            // 綁定事件
            unlockBtn.addEventListener('click', tryUnlock);
            passwordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    tryUnlock();
                }
            });

            // 隱藏錯誤信息當用戶開始輸入
            passwordInput.addEventListener('input', () => {
                if (passwordError) {
                    passwordError.classList.add('hidden');
                }
            });
        }

        // 顯示密碼提示函數
        window.showPasswordPrompt = function(errorMessage = '') {
            const loadingScreen = document.getElementById('loadingScreen');
            const passwordModal = document.getElementById('passwordModal');
            const app = document.getElementById('app');
            
            if (loadingScreen) loadingScreen.classList.add('hidden');
            if (app) app.classList.add('hidden');
            
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

        // 自動啟動
        document.addEventListener('DOMContentLoaded', () => {
            // 設置密碼模態框
            setupPasswordModal();
            
            console.log('🔍 DOM 載入完成，檢查數據狀態');
            console.log('📊 window.MEMOIR_DATA:', !!window.MEMOIR_DATA);
            console.log('🔐 REQUIRE_PW:', typeof window.REQUIRE_PW !== 'undefined' ? window.REQUIRE_PW : 'undefined');
            console.log('🔓 已解鎖:', !!sessionStorage.getItem('mf_pw_unlocked'));
            
            // 檢查是否需要密碼驗證
            if (typeof window.REQUIRE_PW !== 'undefined' && window.REQUIRE_PW && !sessionStorage.getItem('mf_pw_unlocked')) {
                console.log('🔒 需要密碼驗證');
                window.showPasswordPrompt();
            } else if (window.MEMOIR_DATA) {
                // 如果數據已經載入，直接初始化
                console.log('✅ 發現現有數據，直接初始化');
                MEMOIR_DATA = window.MEMOIR_DATA;
                initializeApp();
            } else {
                console.log('⏳ 等待數據載入...');
            }
        });

        // 性能優化：預載入下一個媒體
        function preloadNextMedia() {
            const currentEvent = getCurrentEvent();
            if (!currentEvent?.media) return;
            
            const nextIndex = currentMediaIndex + 1;
            if (nextIndex < currentEvent.media.length) {
                const nextMedia = currentEvent.media[nextIndex];
                if (nextMedia && (nextMedia.type === 'image' || nextMedia.media_type === 'image')) {
                    const img = new Image();
                    img.src = nextMedia.src || nextMedia.url || `./media/${nextMedia.filename}`;
                }
            }
        }

        // 在載入完成後預載入
        setTimeout(preloadNextMedia, 1000);
    

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

            // MSE 媒體檔案自動解密程式碼 - 性能優化版
            (function() {
                'use strict';
                
                console.log('🔓 MSE媒體解密模組已載入 (性能優化版)');
                
                const MSE_OFFSET = 37;
                const GITHUB_BASE_URL = 'https://maso0310.github.io/memoir-developer-log/media/';
                
                // *** 新增：Blob URL 管理器 ***
                class BlobURLManager {
                    constructor() {
                        this.urls = new Map();
                        this.maxCacheSize = 20; // 最多快取20個解密的媒體
                        this.cacheHits = new Map(); // 追蹤使用頻率
                    }
                    
                    // 獲取快取的 URL 或創建新的
                    getOrCreate(key, blob) {
                        if (this.urls.has(key)) {
                            this.cacheHits.set(key, (this.cacheHits.get(key) || 0) + 1);
                            console.log(`♻️ 重用 Blob URL: ${key}`);
                            return this.urls.get(key);
                        }
                        
                        // 檢查快取大小，清理舊的 URL
                        if (this.urls.size >= this.maxCacheSize) {
                            this.cleanupOldest();
                        }
                        
                        const url = URL.createObjectURL(blob);
                        this.urls.set(key, url);
                        this.cacheHits.set(key, 1);
                        console.log(`🆕 創建 Blob URL: ${key}`);
                        return url;
                    }
                    
                    // 清理最少使用的 URL
                    cleanupOldest() {
                        const entries = Array.from(this.cacheHits.entries())
                            .sort((a, b) => a[1] - b[1]); // 按使用次數排序
                        
                        const toRemove = entries.slice(0, 5); // 移除5個最少使用的
                        for (const [key] of toRemove) {
                            const url = this.urls.get(key);
                            if (url) {
                                URL.revokeObjectURL(url);
                                this.urls.delete(key);
                                this.cacheHits.delete(key);
                                console.log(`🗑️ 清理舊 Blob URL: ${key}`);
                            }
                        }
                    }
                    
                    // 清理所有 URL
                    cleanup() {
                        for (const [key, url] of this.urls) {
                            URL.revokeObjectURL(url);
                            console.log(`🗑️ 清理 Blob URL: ${key}`);
                        }
                        this.urls.clear();
                        this.cacheHits.clear();
                    }
                }
                
                // 全域 Blob URL 管理器實例
                const blobManager = new BlobURLManager();
                
                // 頁面卸載時清理所有 URL
                window.addEventListener('beforeunload', () => {
                    blobManager.cleanup();
                });
                
                // *** 新增：解密結果快取 ***
                const decryptCache = new Map();
                
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
                
                // 載入並解密媒體檔案 - 優化版本，使用緩存和 Blob URL 管理
                async function loadAndDecryptMedia(mediaUrl) {
                    try {
                        // 檢查解密結果緩存
                        if (decryptCache.has(mediaUrl)) {
                            console.log(`♻️ 使用快取解密結果: ${mediaUrl}`);
                            const cachedData = decryptCache.get(mediaUrl);
                            return blobManager.getOrCreate(mediaUrl, cachedData.blob);
                        }
                        
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
                        
                        // 快取解密結果（只快取 blob 對象，不快取 URL）
                        decryptCache.set(mediaUrl, { blob, mimeType });
                        
                        // 使用 Blob URL 管理器創建和管理 URL
                        const decryptedUrl = blobManager.getOrCreate(mediaUrl, blob);
                        
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

            // MSE 媒體檔案自動解密程式碼 - 性能優化版
            (function() {
                'use strict';
                
                console.log('🔓 MSE媒體解密模組已載入 (性能優化版)');
                
                const MSE_OFFSET = 37;
                const GITHUB_BASE_URL = 'https://maso0310.github.io/memoir-developer-log/media/';
                
                // *** 新增：Blob URL 管理器 ***
                class BlobURLManager {
                    constructor() {
                        this.urls = new Map();
                        this.maxCacheSize = 20; // 最多快取20個解密的媒體
                        this.cacheHits = new Map(); // 追蹤使用頻率
                    }
                    
                    // 獲取快取的 URL 或創建新的
                    getOrCreate(key, blob) {
                        if (this.urls.has(key)) {
                            this.cacheHits.set(key, (this.cacheHits.get(key) || 0) + 1);
                            console.log(`♻️ 重用 Blob URL: ${key}`);
                            return this.urls.get(key);
                        }
                        
                        // 檢查快取大小，清理舊的 URL
                        if (this.urls.size >= this.maxCacheSize) {
                            this.cleanupOldest();
                        }
                        
                        const url = URL.createObjectURL(blob);
                        this.urls.set(key, url);
                        this.cacheHits.set(key, 1);
                        console.log(`🆕 創建 Blob URL: ${key}`);
                        return url;
                    }
                    
                    // 清理最少使用的 URL
                    cleanupOldest() {
                        const entries = Array.from(this.cacheHits.entries())
                            .sort((a, b) => a[1] - b[1]); // 按使用次數排序
                        
                        const toRemove = entries.slice(0, 5); // 移除5個最少使用的
                        for (const [key] of toRemove) {
                            const url = this.urls.get(key);
                            if (url) {
                                URL.revokeObjectURL(url);
                                this.urls.delete(key);
                                this.cacheHits.delete(key);
                                console.log(`🗑️ 清理舊 Blob URL: ${key}`);
                            }
                        }
                    }
                    
                    // 清理所有 URL
                    cleanup() {
                        for (const [key, url] of this.urls) {
                            URL.revokeObjectURL(url);
                            console.log(`🗑️ 清理 Blob URL: ${key}`);
                        }
                        this.urls.clear();
                        this.cacheHits.clear();
                    }
                }
                
                // 全域 Blob URL 管理器實例
                const blobManager = new BlobURLManager();
                
                // 頁面卸載時清理所有 URL
                window.addEventListener('beforeunload', () => {
                    blobManager.cleanup();
                });
                
                // *** 新增：解密結果快取 ***
                const decryptCache = new Map();
                
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
                
                // 載入並解密媒體檔案 - 優化版本，使用緩存和 Blob URL 管理
                async function loadAndDecryptMedia(mediaUrl) {
                    try {
                        // 檢查解密結果緩存
                        if (decryptCache.has(mediaUrl)) {
                            console.log(`♻️ 使用快取解密結果: ${mediaUrl}`);
                            const cachedData = decryptCache.get(mediaUrl);
                            return blobManager.getOrCreate(mediaUrl, cachedData.blob);
                        }
                        
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
                        
                        // 快取解密結果（只快取 blob 對象，不快取 URL）
                        decryptCache.set(mediaUrl, { blob, mimeType });
                        
                        // 使用 Blob URL 管理器創建和管理 URL
                        const decryptedUrl = blobManager.getOrCreate(mediaUrl, blob);
                        
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
        


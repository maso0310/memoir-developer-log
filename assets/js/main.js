// MemoirFlow 加密回憶錄主腳本
// 回憶錄ID: 4548b929-5c16-4ee7-a189-60679e2165be
// 生成時間: 2025-09-29T01:26:57.862825200+00:00

// ========== 提取的腳本區塊 ==========

        // 全局變數
        let MEMOIR_DATA = null;
        let currentEventIndex = 0;
        let currentMediaIndex = 0;
        let currentLightboxMediaIndex = 0;
        let isDecrypting = false;
        let isTypewriterEnabled = true;

        // 全域圖片快取系統
        const globalImageCache = new Map();

        // 事件級別的圖片快取系統 - 根據事件和媒體索引直接獲取
        const eventMediaCache = new Map(); // 格式: eventIndex -> Map(mediaIndex -> blobUrl)

        // 添加圖片到快取
        function cacheImage(src, blobUrl) {
            globalImageCache.set(src, {
                blobUrl: blobUrl,
                timestamp: Date.now()
            });
        }

        // 事件級別快取管理函數
        function cacheEventMedia(eventIndex, mediaIndex, blobUrl) {
            if (!eventMediaCache.has(eventIndex)) {
                eventMediaCache.set(eventIndex, new Map());
            }
            eventMediaCache.get(eventIndex).set(mediaIndex, blobUrl);
            console.log(`📦 事件 ${eventIndex} 媒體 ${mediaIndex} 已快取`);
        }

        function getEventMediaCache(eventIndex, mediaIndex) {
            const eventCache = eventMediaCache.get(eventIndex);
            return eventCache ? eventCache.get(mediaIndex) : null;
        }

        function clearEventCache(eventIndex) {
            if (eventMediaCache.has(eventIndex)) {
                eventMediaCache.delete(eventIndex);
                console.log(`🗑️ 清除事件 ${eventIndex} 的快取`);
            }
        }

        // 從快取獲取圖片
        function getCachedImage(src) {
            const cached = globalImageCache.get(src);
            if (cached) {
                // 更新時間戳
                cached.timestamp = Date.now();
                return cached.blobUrl;
            }
            return null;
        }

        // 檢查圖片是否已快取
        function isImageCached(src) {
            return globalImageCache.has(src);
        }
        // 從localStorage載入打字速度設定，預設為部署時設定的值
        let typingSpeed = parseInt(localStorage.getItem('memoirflow:typing-speed')) || 100;
        let fontSize = 2;
        let isMenuOpen = false;
        let isThumbnailsVisible = true;
        let isFontSizeMenuOpen = false;
        let isTypewriterMenuOpen = false;
        let isLightboxOpen = false;
        let thumbnailsStateBeforeLightbox = false; // 記錄燈箱開啟前的縮圖列狀態
        let isThumbnailsCollapsed = false; // 記錄縮圖列是否被收合
        let isSubtitleVisible = true;
        let areControlsHidden = !true;
        let isDateHidden = !false;
        let isTitleHidden = !true;
        let isThemeMenuOpen = false;
        // 優先使用部署時的主題設定，不被 localStorage 覆蓋
        let deploymentTheme = 'sunset';
        let currentTheme = deploymentTheme && deploymentTheme !== 'undefined' && deploymentTheme !== ''
            ? deploymentTheme
            : (localStorage.getItem('memoir-theme') || 'default');


        // 全域調試函數，方便檢查主題狀態
        window.debugTheme = function() {
        };

        // *** 新增：清除縮圖快取的調試函數 ***
        window.clearThumbnailCache = function() {
            const oldSize = thumbnailCache.size;
            const oldDecryptedSize = thumbnailDecryptedState.size;
            thumbnailCache.clear();
            thumbnailDecryptedState.clear();
            console.log(`🗑️ 清理縮圖快取: ${oldSize} 個HTML快取 + ${oldDecryptedSize} 個解密狀態快取`);
            // 重新渲染縮圖
            renderThumbnails();
        };

        // *** 新增：查看縮圖快取狀態的調試函數 ***
        window.showThumbnailCacheStatus = function() {
            console.log('📊 縮圖快取狀態報告:');
            console.log(`- HTML快取: ${thumbnailCache.size} 個事件`);
            console.log(`- 解密狀態快取: ${thumbnailDecryptedState.size} 個事件`);

            thumbnailCache.forEach((content, key) => {
                const decryptedCount = thumbnailDecryptedState.get(key)?.size || 0;
                console.log(`  📁 ${key}: ${content.length}字符, ${decryptedCount}個已解密縮圖`);
            });
        };

        // 版本控制變數
        let actualFontSize = parseFloat(localStorage.getItem('memoir-font-size')) || fontSize;
        let actualTypingSpeed = parseInt(localStorage.getItem('memoirflow:typing-speed')) || typingSpeed;
        let actualThumbnailsVisible = localStorage.getItem('memoir-thumbnails-visible') !== null
            ? localStorage.getItem('memoir-thumbnails-visible') === 'true'
            : isThumbnailsVisible;

        // DOM 元素緩存
        const elements = {
            loadingScreen: document.getElementById('loadingScreen'),
            app: document.getElementById('app'),
            mediaDisplay: document.getElementById('mediaDisplay'),
            eventDescription: document.getElementById('eventDescription'),
            timeline: document.getElementById('timeline'),
            currentEventDate: document.getElementById('currentEventDate'),
            currentMemoirTitle: document.getElementById('currentMemoirTitle'),
            thumbnails: document.getElementById('thumbnails'),
            prevEventBtn: document.getElementById('prevEventBtn'),
            nextEventBtn: document.getElementById('nextEventBtn'),
            prevMediaBtn: document.getElementById('prevMediaBtn'),
            nextMediaBtn: document.getElementById('nextMediaBtn'),
            timelineBtn: document.getElementById('timelineBtn'),
            timelinePanel: document.getElementById('timelinePanel'),
            closeTimelineBtn: document.getElementById('closeTimelineBtn'),
            descriptionContainer: document.getElementById('descriptionContainer'),
            subtitleToggleBtn: document.getElementById('subtitleToggleBtn'),
            menuBtn: document.getElementById('menuBtn'),
            menuBtnIcon: document.getElementById('menuBtnIcon'),
            menuDropdown: document.getElementById('menuDropdown'),
            typewriterToggleBtn: document.getElementById('typewriterToggleBtn'),
            typewriterSpeedBtn: document.getElementById('typewriterSpeedBtn'),
            typewriterSpeedDropdown: document.getElementById('typewriterSpeedDropdown'),
            thumbnailBtn: document.getElementById('thumbnailBtn'),
            fontSizeBtn: document.getElementById('fontSizeBtn'),
            fontSizeDropdown: document.getElementById('fontSizeDropdown'),
            thumbnailsContainer: document.getElementById('thumbnailsContainer'),
            thumbnailToggleArrow: document.getElementById('thumbnailToggleArrow'),
            hideControlsBtn: document.getElementById('hideControlsBtn'),
            hideDateBtn: document.getElementById('hideDateBtn'),
            hideTitleBtn: document.getElementById('hideTitleBtn'),
            themeBtn: document.getElementById('themeBtn'),
            themeDropdown: document.getElementById('themeDropdown'),
            themeOverlay: document.getElementById('themeOverlay'),
            lightbox: document.getElementById('lightbox'),
            lightboxClose: document.getElementById('lightboxClose'),
            lightboxPrev: document.getElementById('lightboxPrev'),
            lightboxNext: document.getElementById('lightboxNext'),
            lightboxMedia: document.getElementById('lightboxMedia')
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

        // 沉浸式體驗功能
        let currentEventId = null; // 追蹤當前事件ID
        let thumbnailCache = new Map(); // 縮圖快取，避免重複渲染
        let thumbnailDecryptedState = new Map(); // 快取已解密的縮圖狀態
        let isTimelineCollapsed = false;
        let touchStartX = 0;
        let touchStartY = 0;

        // 打字機動畫效果 - 支援速度調整
        function typewriterEffect(element, text, speed = typingSpeed, eventId = null) {
            if (!element || !text) return Promise.resolve();

            return new Promise(resolve => {
                // 立即清空元素內容
                element.textContent = '';
                element.classList.add('typewriter', 'typewriter-cursor');

                let index = 0;
                let isCompleted = false;

                const timer = setInterval(() => {
                    // 檢查是否已經切換到不同的事件
                    if (eventId !== null && currentEventId !== eventId) {
                        clearInterval(timer);
                        element.classList.remove('typewriter-cursor');
                        if (!isCompleted) {
                            isCompleted = true;
                            resolve();
                        }
                        return;
                    }

                    if (index < text.length) {
                        element.textContent += text.charAt(index);
                        index++;
                    } else {
                        clearInterval(timer);
                        element.classList.remove('typewriter-cursor');
                        if (!isCompleted) {
                            isCompleted = true;
                            resolve();
                        }
                    }
                }, speed);

                // 點擊跳過打字機效果
                const skipTyping = () => {
                    if (!isCompleted) {
                        clearInterval(timer);
                        element.textContent = text;
                        element.classList.remove('typewriter-cursor');
                        element.removeEventListener('click', skipTyping);
                        isCompleted = true;
                        resolve();
                    }
                };

                element.addEventListener('click', skipTyping, { once: true });
                // 不再設定全域變數，避免衝突
            });
        }

        // 淡入淡出轉場效果
        function fadeTransition(element, newContent, callback) {
            if (!element) return Promise.resolve();
            
            return new Promise(resolve => {
                element.classList.add('fade-out');
                
                setTimeout(() => {
                    if (typeof newContent === 'function') {
                        newContent();
                    } else if (typeof newContent === 'string') {
                        element.innerHTML = newContent;
                    }
                    
                    element.classList.remove('fade-out');
                    element.classList.add('fade-in');
                    
                    setTimeout(() => {
                        element.classList.remove('fade-in');
                        if (callback) callback();
                        resolve();
                    }, 800);
                }, 500);
            });
        }

        // 滑動轉場效果（流暢優化版本）
        function slideTransition(element, direction = 'right', callback, fastMode = false) {
            if (!element) return Promise.resolve();

            return new Promise(resolve => {
                const slideClass = direction === 'right' ? 'slide-in-right' : 'slide-in-left';

                // 創建動畫結束處理函數
                const handleAnimationEnd = (event) => {
                    if (event.target === element) {
                        element.removeEventListener('animationend', handleAnimationEnd);
                        element.classList.remove(slideClass);
                        resolve();
                    }
                };

                // 監聽動畫結束事件
                element.addEventListener('animationend', handleAnimationEnd);

                // 使用 requestAnimationFrame 確保動畫流暢執行
                requestAnimationFrame(() => {
                    if (callback) callback();

                    // 確保元素準備好進行動畫
                    requestAnimationFrame(() => {
                        element.classList.add(slideClass);
                    });
                });

                // 備用的 setTimeout 防止動畫事件遺失
                const fallbackTime = fastMode ? 200 : 650;
                setTimeout(() => {
                    if (element.classList.contains(slideClass)) {
                        element.removeEventListener('animationend', handleAnimationEnd);
                        element.classList.remove(slideClass);
                        resolve();
                    }
                }, fallbackTime);
            });
        }

        // 防抖動機制 - 防止按鈕快速重複點擊
        let buttonDebounceTimeouts = new Map();
        
        function debounceButtonClick(buttonId, callback, delay = 300) {
            // 清除之前的計時器
            if (buttonDebounceTimeouts.has(buttonId)) {
                clearTimeout(buttonDebounceTimeouts.get(buttonId));
            }
            
            // 設置新的計時器
            const timeout = setTimeout(() => {
                callback();
                buttonDebounceTimeouts.delete(buttonId);
            }, delay);
            
            buttonDebounceTimeouts.set(buttonId, timeout);
        }
        
        // 觸控回饋效果
        function addTouchFeedback(element) {
            if (!element) return;
            
            element.classList.add('touch-feedback');
            
            // 觸控開始事件
            element.addEventListener('touchstart', (e) => {
                element.classList.add('touching');
                setTimeout(() => {
                    element.classList.remove('touching');
                }, 800); // 匹配新的動畫時間
            });
            
            // 鼠標點擊事件支援（桌面端） - 使用 mousedown 避免與主要 click 事件衝突
            element.addEventListener('mousedown', (e) => {
                element.classList.add('touching');
                setTimeout(() => {
                    element.classList.remove('touching');
                }, 800); // 匹配新的動畫時間
            });
        }

        // 時間軸渲染
        function renderTimeline() {
            if (!MEMOIR_DATA?.timeline_events || !elements.timeline) return;
            
            // 清空時間軸容器但保留路線圖線條
            const timelineLine = elements.timeline.querySelector('.timeline-line');
            elements.timeline.innerHTML = '';
            if (timelineLine) {
                elements.timeline.appendChild(timelineLine);
            } else {
                // 如果沒有線條則創建一個
                const line = document.createElement('div');
                line.className = 'timeline-line';
                elements.timeline.appendChild(line);
            }
            
            const fragment = document.createDocumentFragment();
            
            MEMOIR_DATA.timeline_events.forEach((event, index) => {
                const item = document.createElement('div');
                item.className = `timeline-item ${index === currentEventIndex ? 'active' : ''}`;
                
                // 添加標題和日期
                const title = event.title || event.name || `事件 ${index + 1}`;
                const date = event.date || '';
                
                item.innerHTML = `
                    <div style="font-size: 0.9rem; font-weight: 600; color: var(--text-primary); margin-bottom: 0.25rem;">
                        ${title}
                    </div>
                    ${date ? `<div style="font-size: 0.75rem; color: var(--primary); margin-bottom: 0.25rem;">${date}</div>` : ''}
                    <div style="font-size: 0.7rem; color: var(--text-secondary); line-height: 1.2;">
                        ${event.description ? event.description.substring(0, 50) + '...' : ''}
                    </div>
                `;
                
                item.addEventListener('click', () => {
                    if (index !== currentEventIndex) {
                        jumpToEvent(index);
                        // 自動關閉時間軸導覽介面
                        closeTimelinePanel();
                    }
                });
                
                addTouchFeedback(item);
                fragment.appendChild(item);
            });
            
            elements.timeline.appendChild(fragment);
        }

        // 跳轉到特定事件（非阻塞）
        function jumpToEvent(eventIndex) {
            if (eventIndex === currentEventIndex) return;

            const direction = eventIndex > currentEventIndex ? 'right' : 'left';

            // 清除舊事件的快取（可選，節省記憶體）
            // clearEventCache(currentEventIndex);

            currentEventIndex = eventIndex;
            currentMediaIndex = 0; // 重設媒體索引
            
            // 更新時間軸選中狀態
            const timelineItems = elements.timeline.querySelectorAll('.timeline-item');
            timelineItems.forEach((item, index) => {
                item.classList.toggle('active', index === currentEventIndex);
            });
            
            // 立即更新縮圖列，避免索引錯置
            renderThumbnails();

            // 使用滑動轉場效果（非阻塞）
            slideTransition(elements.descriptionContainer, direction, () => {
                loadEvent();
            });
        }

        // 時間軸面板功能
        function toggleTimelinePanel() {
            if (elements.timelinePanel) {
                elements.timelinePanel.classList.toggle('open');
            }
        }

        function closeTimelinePanel() {
            if (elements.timelinePanel) {
                elements.timelinePanel.classList.remove('open');
            }
        }

        // 進階觸控手勢處理（優化版）
        function setupTouchGestures() {
            let touchStartX = 0;
            let touchStartY = 0;
            let touchStartTime = 0;
            let isSwiping = false;
            
            // 阻止整個文檔的滾動行為
            document.addEventListener('touchstart', (e) => {
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
                touchStartTime = Date.now();
                isSwiping = false;
            }, { passive: false });
            
            document.addEventListener('touchmove', (e) => {
                // 防止預設的滾動行為
                if (!e.target.closest('.menu-dropdown') && 
                    !e.target.closest('.timeline-panel') &&
                    !e.target.closest('input[type="range"]')) {
                    e.preventDefault();
                }
                
                const touchX = e.touches[0].clientX;
                const touchY = e.touches[0].clientY;
                const deltaX = Math.abs(touchX - touchStartX);
                const deltaY = Math.abs(touchY - touchStartY);
                
                // 如果移動距離超過閾值，標記為滑動
                if (deltaX > 10 || deltaY > 10) {
                    isSwiping = true;
                }
            }, { passive: false });
            
            document.addEventListener('touchend', (e) => {
                if (!isSwiping) return;
                
                const touchEndX = e.changedTouches[0].clientX;
                const touchEndY = e.changedTouches[0].clientY;
                const touchEndTime = Date.now();
                
                const deltaX = touchEndX - touchStartX;
                const deltaY = touchEndY - touchStartY;
                const deltaTime = touchEndTime - touchStartTime;
                
                // 確保是快速滑動手勢
                if (deltaTime > 800) return;
                
                const minSwipeDistance = 50;
                const absX = Math.abs(deltaX);
                const absY = Math.abs(deltaY);
                
                // 如果不在選單或時間軸區域內
                if (!e.target.closest('.menu-dropdown') && 
                    !e.target.closest('.timeline-panel')) {
                    
                    // 水平滑動切換媒體
                    if (absX > minSwipeDistance && absX > absY) {
                        e.preventDefault();
                        if (deltaX > 0) {
                            // 向右滑動 - 上一個媒體
                            if (elements.prevMediaBtn && !elements.prevMediaBtn.disabled) {
                                elements.prevMediaBtn.click();
                            }
                        } else {
                            // 向左滑動 - 下一個媒體
                            if (elements.nextMediaBtn && !elements.nextMediaBtn.disabled) {
                                elements.nextMediaBtn.click();
                            }
                        }
                    }
                    // 垂直滑動切換事件
                    else if (absY > minSwipeDistance && absY > absX) {
                        e.preventDefault();
                        if (deltaY > 0) {
                            // 向下滑動 - 上一個事件
                            if (elements.prevEventBtn && !elements.prevEventBtn.disabled) {
                                elements.prevEventBtn.click();
                            }
                        } else {
                            // 向上滑動 - 下一個事件
                            if (elements.nextEventBtn && !elements.nextEventBtn.disabled) {
                                elements.nextEventBtn.click();
                            }
                        }
                    }
                }
                
                // 重置滑動狀態
                isSwiping = false;
            }, { passive: false });
        }

        // 清理無效的 data-original-src 屬性
        function cleanupInvalidDataOriginalSrc() {
            const allImages = document.querySelectorAll('img[data-original-src]');
            let cleanedCount = 0;

            allImages.forEach(img => {
                const originalSrc = img.getAttribute('data-original-src');
                if (!originalSrc || originalSrc.includes('null') || originalSrc === 'null') {
                    console.log('🧹 清理無效的 data-original-src:', originalSrc);
                    img.removeAttribute('data-original-src');
                    img.removeAttribute('data-needs-mse-decrypt');
                    cleanedCount++;
                }
            });

            if (cleanedCount > 0) {
                console.log(`✅ 已清理 ${cleanedCount} 個無效的 data-original-src 屬性`);
            }
        }

        // 快速媒體解密（移除複雜調度）
        function quickDecryptMedia() {
            if (!window.forceDecryptMedia || isDecrypting) return;

            // 先清理無效屬性
            cleanupInvalidDataOriginalSrc();

            // 檢查是否有待解密的圖片，避免不必要的調用
            const needsDecryptImages = document.querySelectorAll('img[data-needs-mse-decrypt="true"]:not(.mse-decrypted):not(.fast-loaded)');
            if (needsDecryptImages.length === 0) {
                console.log('🎯 沒有需要解密的圖片，跳過解密調用');
                return;
            }

            isDecrypting = true;
            console.log(`🔓 開始解密 ${needsDecryptImages.length} 張圖片`);

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

        // 快速顯示媒體（優化版本，利用已解密的縮圖）
        function displayMedia(fastSwitch = false) {
            const currentEvent = getCurrentEvent();
            if (!currentEvent?.media || currentEvent.media.length === 0) {
                if (elements.mediaDisplay) {
                    elements.mediaDisplay.innerHTML = '<div>此事件沒有媒體檔案</div>';
                }
                return;
            }

            const media = currentEvent.media[currentMediaIndex];
            if (!media || !elements.mediaDisplay) return;

            // 清空顯示區
            elements.mediaDisplay.innerHTML = '';

            // 創建媒體元素
            let mediaElement;
            if (media.type === 'image' || media.media_type === 'image') {
                mediaElement = document.createElement('img');
                mediaElement.alt = '回憶錄圖片';

                // 設置媒體源
                const mediaSrc = media.src || media.url || (media.filename ? `./media/${media.filename}` : null);

                // 如果無法構建有效路徑，跳過
                if (!mediaSrc || mediaSrc.includes('null')) {
                    console.warn('⚠️ 跳過無效媒體路徑:', media);
                    elements.mediaDisplay.innerHTML = '<div>媒體檔案路徑無效</div>';
                    return;
                }

                // 如果需要解密
                if (mediaSrc.includes('media/')) {
                    // *** 優化：多層快取檢查，避免重複解密 ***
                    let fastLoadSuccess = false;

                    // 最高優先：檢查事件級別快取（根據索引直接獲取）
                    const eventCachedUrl = getEventMediaCache(currentEventIndex, currentMediaIndex);
                    if (eventCachedUrl) {
                        console.log(`🚀 使用事件快取: 事件${currentEventIndex} 媒體${currentMediaIndex}`);
                        mediaElement.src = eventCachedUrl;
                        mediaElement.classList.add('fast-loaded');
                        fastLoadSuccess = true;
                    }
                    // 第一優先：檢查全域快取
                    else {
                        const cachedBlobUrl = getCachedImage(mediaSrc);
                        if (cachedBlobUrl) {
                            console.log(`⚡ 使用全域快取圖片: ${currentMediaIndex + 1}`);
                            mediaElement.src = cachedBlobUrl;
                            mediaElement.classList.add('fast-loaded');
                            fastLoadSuccess = true;
                        }
                    }

                    // 第一點五優先：檢查頁面中已解密的圖片
                    if (!fastLoadSuccess) {
                        const existingDecryptedImgs = document.querySelectorAll('img.mse-decrypted');
                        for (let img of existingDecryptedImgs) {
                            const imgOriginalSrc = img.getAttribute('data-original-src') || img.getAttribute('src');
                            if (imgOriginalSrc === mediaSrc && img.src.startsWith('blob:')) {
                                console.log(`⚡ 使用已解密圖片: ${currentMediaIndex + 1}`);
                                mediaElement.src = img.src;
                                mediaElement.classList.add('fast-loaded');
                                // 同時加入快取以供後續使用
                                cacheImage(mediaSrc, img.src);
                                fastLoadSuccess = true;
                                break;
                            }
                        }
                    }
                    // 第二優先：檢查縮圖快取（無論縮圖列是否可見都檢查）
                    if (!fastLoadSuccess && elements.thumbnails) {
                        // 使用 DOM 遍歷避免 CSS 選擇器語法問題
                        const thumbnails = elements.thumbnails.querySelectorAll('.thumbnail');
                        const currentEvent = getCurrentEvent();

                        // 驗證縮圖數量是否匹配當前事件的媒體數量
                        if (thumbnails.length === currentEvent?.media?.length && currentMediaIndex < thumbnails.length) {
                            const targetThumbnail = thumbnails[currentMediaIndex];
                            const thumbnailImg = targetThumbnail?.querySelector('img');

                            if (thumbnailImg && thumbnailImg.classList.contains('mse-decrypted')) {
                                // 驗證縮圖對應的媒體源是否匹配
                                const expectedMediaSrc = currentEvent.media[currentMediaIndex]?.src;
                                if (expectedMediaSrc && thumbnailImg.getAttribute('data-original-src') === expectedMediaSrc) {
                                    // 直接設置已解密的圖片，並添加到全域快取
                                    console.log(`📸 使用縮圖快取圖片: ${currentMediaIndex + 1} (縮圖列${isThumbnailsVisible ? '可見' : '隱藏'})`);
                                    mediaElement.src = thumbnailImg.src;
                                    mediaElement.classList.add('fast-loaded');
                                    cacheImage(mediaSrc, thumbnailImg.src);
                                    // 同時加入事件級別快取
                                    cacheEventMedia(currentEventIndex, currentMediaIndex, thumbnailImg.src);
                                    fastLoadSuccess = true;
                                }
                            }
                        }
                    }

                    // 只有在快速載入失敗時才設置MSE標記
                    if (!fastLoadSuccess) {
                        mediaElement.setAttribute('data-needs-mse-decrypt', 'true');
                        // 額外驗證：確保不設置無效路徑
                        if (mediaSrc && !mediaSrc.includes('null') && mediaSrc !== 'null') {
                            mediaElement.setAttribute('data-original-src', mediaSrc);
                        } else {
                            console.error('🚫 阻止設置無效的 data-original-src:', mediaSrc);
                            return; // 阻止進一步處理
                        }
                        // 設置載入中圖片
                        mediaElement.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSI4IiBmaWxsPSJub25lIiBzdHJva2U9IiMzYjgyZjYiIHN0cm9rZS13aWR0aD0iMiI+PGFuaW1hdGVUcmFuc2Zvcm0gYXR0cmlidXRlTmFtZT0idHJhbnNmb3JtIiB0eXBlPSJyb3RhdGUiIHZhbHVlcz0iMCAyMCAyMDszNjAgMjAgMjAiIGR1cj0iMXMiIHJlcGVhdENvdW50PSJpbmRlZmluaXRlIi8+PC9jaXJjbGU+PC9zdmc+';

                        // 觸發MSE解密
                        setTimeout(() => {
                            if (mediaElement && mediaElement.parentNode && !mediaElement.classList.contains('fast-loaded')) {
                                quickDecryptMedia();
                            }
                        }, fastSwitch ? 0 : 10);
                    }
                } else {
                    mediaElement.src = mediaSrc;
                }
            } else if (media.type === 'video' || media.media_type === 'video') {
                mediaElement = document.createElement('video');
                mediaElement.controls = true;
                mediaElement.src = media.src || media.url || (media.filename ? `./media/${media.filename}` : '');
            }

            if (mediaElement) {
                // 添加燈箱點擊事件
                mediaElement.style.cursor = 'pointer';
                mediaElement.addEventListener('click', () => {
                    openLightbox(mediaElement);
                });

                // 額外保護：確保快速載入的圖片不會被MSE檢測器處理
                if (mediaElement.classList.contains('fast-loaded')) {
                    mediaElement.setAttribute('data-mse-fixed', 'true');
                    mediaElement.setAttribute('data-fast-loaded', 'true');
                }

                elements.mediaDisplay.appendChild(mediaElement);
            }
        }

        // 動態調整縮圖容器寬度
        function adjustThumbnailContainerWidth() {
            if (!elements.thumbnails || !isThumbnailsVisible) return;

            const thumbnails = elements.thumbnails.querySelectorAll('.thumbnail');
            if (thumbnails.length === 0) return;

            // 計算所需的寬度
            const thumbnailWidth = 60; // 每個縮圖寬度
            const gap = 8; // gap: 0.5rem = 8px
            const padding = 32; // padding: 0.75rem * 2 = 24px，加上一些緩衝
            const neededWidth = thumbnails.length * thumbnailWidth + (thumbnails.length - 1) * gap + padding;

            // 計算可用寬度（扣除選單按鈕空間）
            const screenWidth = window.innerWidth;
            const menuSpacing = 160; // 統一使用 160px，對應 CSS 的 calc(100vw - 160px)
            const maxAllowedWidth = screenWidth - menuSpacing;

            // 設定實際寬度
            const finalWidth = Math.min(neededWidth, maxAllowedWidth);
            elements.thumbnails.style.width = finalWidth + 'px';

            console.debug('adjustThumbnailContainerWidth: thumbnails =', thumbnails.length, 'needed =', neededWidth, 'max =', maxAllowedWidth, 'final =', finalWidth);
        }

        // 更新縮圖選中狀態（不重新渲染）+ 中央置中顯示
        function updateThumbnailSelection() {
            if (!elements.thumbnails) return;

            const thumbnails = elements.thumbnails.querySelectorAll('.thumbnail');
            let activeThumbnail = null;

            // 更新選中狀態
            thumbnails.forEach((thumbnail, index) => {
                const isActive = index === currentMediaIndex;
                thumbnail.classList.toggle('active', isActive);
                if (isActive) {
                    activeThumbnail = thumbnail;
                }
            });

            // 調整容器寬度
            adjustThumbnailContainerWidth();

            // 中央置中滾動到選中的縮圖
            if (activeThumbnail && elements.thumbnails && isThumbnailsVisible && !isThumbnailsCollapsed) {
                try {
                    const container = elements.thumbnails;
                    const containerRect = container.getBoundingClientRect();
                    const thumbnailRect = activeThumbnail.getBoundingClientRect();

                    // 檢查是否需要滾動
                    if (container.scrollWidth <= container.clientWidth) {
                        // 如果內容不超出容器，不需要滾動
                        return;
                    }

                    // 計算中央置中的滾動位置
                    const containerCenter = container.clientWidth / 2;
                    const thumbnailRelativePosition = activeThumbnail.offsetLeft + (activeThumbnail.offsetWidth / 2);
                    const targetScrollLeft = thumbnailRelativePosition - containerCenter;

                    // 確保滾動位置在有效範圍內
                    const maxScrollLeft = container.scrollWidth - container.clientWidth;
                    const finalScrollLeft = Math.max(0, Math.min(targetScrollLeft, maxScrollLeft));

                    console.debug('updateThumbnailSelection: centering thumbnail', currentMediaIndex, 'scrollTo:', finalScrollLeft);

                    container.scrollTo({
                        left: finalScrollLeft,
                        behavior: 'smooth'
                    });
                } catch (error) {
                    console.debug('updateThumbnailSelection: scroll error:', error);
                }
            }
        }

        // 綁定縮圖點擊事件
        function bindThumbnailClickEvents() {
            if (!elements.thumbnails) return;

            const thumbnails = elements.thumbnails.querySelectorAll('.thumbnail');
            thumbnails.forEach((thumbnail, index) => {
                thumbnail.addEventListener('click', () => {
                    const previousIndex = currentMediaIndex;
                    const newIndex = index;

                    // 如果點擊的是當前媒體，不執行任何操作
                    if (previousIndex === newIndex) return;

                    // 根據索引變化決定動畫方向
                    const direction = newIndex > previousIndex ? 'right' : 'left';

                    // 更新索引
                    currentMediaIndex = newIndex;
                    currentLightboxMediaIndex = currentMediaIndex;

                    // 使用快速滑動動畫切換媒體
                    slideTransition(elements.mediaDisplay, direction, () => {
                        displayMedia(true); // 啟用快速切換模式
                        updateThumbnailSelection();
                        updateNavigationButtons();

                        // 如果燈箱開啟，也使用動畫更新燈箱
                        if (elements.lightbox?.classList.contains('active')) {
                            slideTransition(elements.lightboxMedia, direction, () => {
                                displayLightboxMedia();
                                updateLightboxNavigation();
                            }, true); // 燈箱也使用快速模式
                        }
                    }, true); // 使用快速動畫模式

                });
            });
        }

        // 快速渲染縮圖（優化版本，避免重複觸發）
        function renderThumbnails(force = false) {
            // 防抖機制：避免短時間內多次調用
            if (!force && renderThumbnails._isRendering) {
                return;
            }

            if (!force && renderThumbnails._lastRenderTime && Date.now() - renderThumbnails._lastRenderTime < 100) {
                clearTimeout(renderThumbnails._debounceTimer);
                renderThumbnails._debounceTimer = setTimeout(() => renderThumbnails(true), 50);
                return;
            }

            renderThumbnails._isRendering = true;
            renderThumbnails._lastRenderTime = Date.now();


            // 檢查是否已經存在多個 thumbnails 元素
            const allThumbnailElements = document.querySelectorAll('#thumbnails');
            if (allThumbnailElements.length > 1) {
            }

            const currentEvent = getCurrentEvent();

            // *** 修正雙重容器問題：清除可能損壞的快取 ***
            // 檢查是否有舊版本的快取（包含完整DOM節點）
            for (let [key, value] of thumbnailCache.entries()) {
                if (typeof value !== 'string') {
                    thumbnailCache.delete(key);
                }
            }

            // 根據縮圖列開關狀態決定是否顯示（但始終渲染DOM以保持快取）
            if (!isThumbnailsVisible) {
                if (elements.thumbnailsContainer) {
                    elements.thumbnailsContainer.classList.remove('visible');
                }
                // *** 不要在這裡直接返回，繼續渲染以維持快取功能 ***
                console.log('🔧 縮圖列隱藏中，但繼續渲染以維持快取');
            }

            if (!elements.thumbnails) {
                renderThumbnails._isRendering = false;
                return; // 防止 null 錯誤
            }

            // 生成更精確的快取鍵（包含媒體檔案名和類型，強化唯一性）
            const mediaSignature = currentEvent?.media?.map(m =>
                `${m.filename || 'unknown'}-${m.type || m.media_type || 'unknown'}`
            ).join('|') || 'empty';
            const eventDatePart = currentEvent?.date ? `-date-${currentEvent.date.replace(/[-:]/g, '')}` : '';
            const eventDescPart = currentEvent?.description ? `-desc-${currentEvent.description.substring(0, 10).replace(/\s/g, '')}` : '';
            const cacheKey = `event-${currentEventIndex}-media-${currentEvent?.media?.length || 0}${eventDatePart}${eventDescPart}-sig-${mediaSignature.substring(0, 30)}`;

            // 如果快取中有相同的縮圖，直接使用
            if (thumbnailCache.has(cacheKey)) {
                console.log('🚀 使用縮圖快取，跳過重新渲染:', cacheKey);
                const cachedContent = thumbnailCache.get(cacheKey);
                elements.thumbnails.innerHTML = '';
                // 將快取的內容添加到容器中，而不是添加整個容器
                elements.thumbnails.innerHTML = cachedContent;

                // *** 安全地恢復已解密圖片的狀態，驗證圖片路徑匹配 ***
                if (thumbnailDecryptedState.has(cacheKey)) {
                    const decryptedStates = thumbnailDecryptedState.get(cacheKey);
                    const thumbnails = elements.thumbnails.querySelectorAll('.thumbnail');

                    decryptedStates.forEach((stateInfo, index) => {
                        if (thumbnails[index]) {
                            const img = thumbnails[index].querySelector('img');
                            if (img && stateInfo && stateInfo.blobUrl && stateInfo.originalSrc) {
                                // 驗證原始路徑是否匹配，防止跨事件污染
                                const expectedSrc = img.getAttribute('data-original-src') || img.getAttribute('src');
                                if (expectedSrc === stateInfo.originalSrc) {
                                    img.src = stateInfo.blobUrl;
                                    img.classList.add('mse-decrypted');
                                    img.classList.remove('loading');
                                    console.log(`✅ 恢復縮圖 ${index}: ${stateInfo.originalSrc}`);
                                } else {
                                    console.log(`⚠️ 跳過縮圖 ${index}: 路徑不匹配 ${expectedSrc} !== ${stateInfo.originalSrc}`);
                                }
                            }
                        }
                    });
                    console.log(`📦 恢復了 ${decryptedStates.size} 個已解密縮圖狀態中的有效項目`);
                }

                updateThumbnailSelection(); // 更新選中狀態

                // 重新綁定縮圖點擊事件
                bindThumbnailClickEvents();

                if (elements.thumbnailsContainer && isThumbnailsVisible) {
                    elements.thumbnailsContainer.classList.add('visible');
                }
                renderThumbnails._isRendering = false;
                return;
            }

            // 清空現有內容
            elements.thumbnails.innerHTML = '';
            
            // 如果沒有媒體，顯示提示訊息
            if (!currentEvent?.media || currentEvent.media.length === 0) {
                const noMediaDiv = document.createElement('div');
                noMediaDiv.className = 'no-media-message';
                noMediaDiv.textContent = '此事件沒有媒體檔案';
                noMediaDiv.style.cssText = 'color: #9ca3af; font-size: 0.8rem; padding: 1rem; text-align: center;';
                elements.thumbnails.appendChild(noMediaDiv);

                // 將無媒體狀態也加入快取 - 只儲存內容
                thumbnailCache.set(cacheKey, elements.thumbnails.innerHTML);

                // 根據狀態決定是否顯示縮圖列
                if (elements.thumbnailsContainer && isThumbnailsVisible) {
                    elements.thumbnailsContainer.classList.add('visible');
                }
                renderThumbnails._isRendering = false;
                return;
            }

            const fragment = document.createDocumentFragment();
            
            currentEvent.media.forEach((media, index) => {
                const thumbnail = document.createElement('div');
                thumbnail.className = `thumbnail ${index === currentMediaIndex ? 'active' : ''}`;
                
                if (media.type === 'image' || media.media_type === 'image') {
                    const img = document.createElement('img');
                    const mediaSrc = media.src || media.url || (media.filename ? `./media/${media.filename}` : null);

                    // 如果無法構建有效路徑，跳過此縮圖
                    if (!mediaSrc || mediaSrc.includes('null')) {
                        console.warn('⚠️ 跳過縮圖無效媒體路徑:', media);
                        return; // 跳過此迭代
                    }

                    if (mediaSrc.includes('media/')) {
                        img.setAttribute('data-needs-mse-decrypt', 'true');
                        // 額外驗證：確保不設置無效路徑
                        if (mediaSrc && !mediaSrc.includes('null') && mediaSrc !== 'null') {
                            img.setAttribute('data-original-src', mediaSrc);
                        } else {
                            console.error('🚫 阻止設置縮圖無效的 data-original-src:', mediaSrc);
                            return; // 跳過此縮圖
                        }
                        img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiNmOWZhZmIiLz48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSI4IiBmaWxsPSJub25lIiBzdHJva2U9IiNkMWQ1ZGIiIHN0cm9rZS13aWR0aD0iMiI+PGFuaW1hdGVUcmFuc2Zvcm0gYXR0cmlidXRlTmFtZT0idHJhbnNmb3JtIiB0eXBlPSJyb3RhdGUiIHZhbHVlcz0iMCAzMCAzMDszNjAgMzAgMzAiIGR1cj0iMXMiIHJlcGVhdENvdW50PSJpbmRlZmluaXRlIi8+PC9jaXJjbGU+PC9zdmc+';
                    } else {
                        img.src = mediaSrc;
                    }
                    
                    thumbnail.appendChild(img);
                } else if (media.type === 'video' || media.media_type === 'video') {
                    // 對於影片，也可以顯示縮圖
                    const videoIcon = document.createElement('div');
                    videoIcon.innerHTML = '🎥';
                    videoIcon.style.cssText = 'display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; font-size: 20px;';
                    thumbnail.appendChild(videoIcon);
                }
                
                fragment.appendChild(thumbnail);
            });
            
            elements.thumbnails.appendChild(fragment);

            // 將新生成的縮圖內容加入快取 - 只儲存內容，但要確保沒有嵌套的 thumbnails 容器
            const contentToCache = elements.thumbnails.innerHTML;

            // 檢查是否包含嵌套的 thumbnails 容器
            if (contentToCache.includes('<div id="thumbnails"')) {
                console.error('❌ 檢測到嵌套的 thumbnails 容器，快取被汙染！');
                // 不快取有問題的內容
            } else {
                thumbnailCache.set(cacheKey, contentToCache);
            }

            // 限制快取大小，避免記憶體過量使用
            if (thumbnailCache.size > 20) {
                const firstKey = thumbnailCache.keys().next().value;
                thumbnailCache.delete(firstKey);
                // 同時清理對應的解密狀態快取
                thumbnailDecryptedState.delete(firstKey);
            }

            // 綁定縮圖點擊事件
            bindThumbnailClickEvents();

            // 根據狀態顯示或隱藏縮圖列
            if (elements.thumbnailsContainer) {
                if (isThumbnailsVisible) {
                    elements.thumbnailsContainer.classList.add('visible');
                } else {
                    // 確保隱藏狀態正確設置
                    elements.thumbnailsContainer.classList.remove('visible');
                    console.log('📦 縮圖已渲染但保持隱藏狀態，可用作快取');
                }
            }

            // 調整容器寬度並更新選中狀態
            adjustThumbnailContainerWidth();
            updateThumbnailSelection();

            // 智能觸發解密 - 只有存在需要解密的圖片時才觸發
            setTimeout(() => {
                const needsDecryptImages = document.querySelectorAll('img[data-needs-mse-decrypt="true"]:not(.fast-loaded)');
                if (needsDecryptImages.length > 0) {
                    quickDecryptMedia();
                } else {
                }

                // 設置監聽器來保存解密完成的狀態
                setupDecryptionStateListener(cacheKey);
            }, 100);

            // 重置渲染標誌
            renderThumbnails._isRendering = false;
        }

        // 設置解密狀態監聽器
        function setupDecryptionStateListener(cacheKey) {
            if (!cacheKey) return;

            // 定期檢查並保存已解密的縮圖狀態
            const checkInterval = setInterval(() => {
                const thumbnails = elements.thumbnails?.querySelectorAll('.thumbnail img');
                if (!thumbnails || thumbnails.length === 0) {
                    clearInterval(checkInterval);
                    return;
                }

                const decryptedStates = new Map();
                let allDecrypted = true;
                let hasDecrypted = false;

                thumbnails.forEach((img, index) => {
                    if (img.classList.contains('mse-decrypted') && img.src.startsWith('blob:')) {
                        // 保存更完整的狀態資訊，包含原始路徑用於驗證
                        const originalSrc = img.getAttribute('data-original-src') || img.getAttribute('data-src') || '';
                        decryptedStates.set(index, {
                            blobUrl: img.src,
                            originalSrc: originalSrc
                        });
                        hasDecrypted = true;
                    } else if (img.hasAttribute('data-needs-mse-decrypt')) {
                        allDecrypted = false;
                    }
                });

                // 如果有解密完成的圖片，保存狀態
                if (hasDecrypted) {
                    thumbnailDecryptedState.set(cacheKey, decryptedStates);
                    console.log(`💾 保存解密狀態: ${decryptedStates.size}/${thumbnails.length} 張縮圖`);
                }

                // 如果所有圖片都解密完成，停止檢查
                if (allDecrypted) {
                    clearInterval(checkInterval);
                    console.log(`✅ 縮圖解密完成，停止監聽: ${cacheKey}`);
                }
            }, 500); // 每500ms檢查一次

            // 5秒後停止檢查，避免無限循環
            setTimeout(() => {
                clearInterval(checkInterval);
            }, 5000);
        }

        // 快速載入事件（優化性能，異步執行）
        function loadEvent() {
            const currentEvent = getCurrentEvent();
            if (!currentEvent) return;

            // 更新導航按鈕
            updateNavigationButtons();

            // 更新回憶錄名稱顯示
            if (elements.currentMemoirTitle && MEMOIR_DATA) {
                elements.currentMemoirTitle.textContent = MEMOIR_DATA.chinese_name || MEMOIR_DATA.name || MEMOIR_DATA.title || '未命名回憶錄';
            }

            // 更新日期顯示
            if (elements.currentEventDate) {
                if (currentEvent.date) {
                    const date = new Date(currentEvent.date);
                    const formattedDate = date.toLocaleDateString('zh-TW', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });
                    elements.currentEventDate.textContent = formattedDate;
                } else {
                    elements.currentEventDate.textContent = '日期未設定';
                }
            } else {
            }

            // *** 修正：載入事件後維持顯示狀態 ***
            updateInfoDisplay();

            // 立即載入媒體（不等待文字動畫）
            fadeTransition(elements.mediaDisplay, () => {
                displayMedia();
            });
            
            // 確保縮圖列總是根據當前事件更新
            renderThumbnails();
            renderTimeline();

            // 預載入當前事件的所有圖片（與其他操作並行）
            setTimeout(() => {
                preloadEventMedia();
            }, 500); // 延遲500ms開始預載，避免影響初始顯示

            // 智能開始解密（與文字動畫並行）
            setTimeout(() => {
                // 首先清理可能存在的無效屬性
                cleanupInvalidDataOriginalSrc();

                const needsDecryptImages = document.querySelectorAll('img[data-needs-mse-decrypt="true"]:not(.fast-loaded)');
                if (needsDecryptImages.length > 0) {
                    quickDecryptMedia();
                }
            }, 10);

            // 更新當前事件ID
            currentEventId = `${currentEventIndex}-${Date.now()}`;

            // 立即清空描述區域，防止舊文字殘留
            if (elements.eventDescription) {
                elements.eventDescription.textContent = '';
                elements.eventDescription.classList.remove('typewriter-cursor');
            }

            // 透過更新 currentEventId 來自動清除之前的打字機效果

            // 文字動畫與媒體載入並行執行
            const description = currentEvent.description || '';
            if (description && elements.eventDescription) {
                // 根據設置決定是否使用打字機效果
                if (isTypewriterEnabled) {
                    typewriterEffect(elements.eventDescription, description, typingSpeed, currentEventId);
                } else {
                    elements.eventDescription.textContent = description;
                }
            }
            
            // 強制重新觸發縮圖列渲染
            setTimeout(() => {
                if (isThumbnailsVisible) {
                    renderThumbnails();
                }
            }, 100);
        }

        // 更新導航按鈕狀態
        function updateNavigationButtons() {
            const currentEvent = getCurrentEvent();
            
            if (elements.prevEventBtn) {
                elements.prevEventBtn.disabled = currentEventIndex === 0;
            }
            if (elements.nextEventBtn) {
                elements.nextEventBtn.disabled = currentEventIndex === MEMOIR_DATA.timeline_events.length - 1;
            }
            if (elements.prevMediaBtn) {
                elements.prevMediaBtn.disabled = currentMediaIndex === 0;
            }
            if (elements.nextMediaBtn) {
                elements.nextMediaBtn.disabled = !currentEvent?.media || currentMediaIndex === currentEvent.media.length - 1;
            }
            
            // 為按鈕添加觸控回饋
            [elements.prevEventBtn, elements.nextEventBtn, elements.prevMediaBtn, elements.nextMediaBtn].forEach(btn => {
                if (btn && !btn.classList.contains('touch-feedback')) {
                    addTouchFeedback(btn);
                }
            });

            // 為浮動控制按鈕添加觸控回饋
            document.querySelectorAll('.floating-btn').forEach(btn => {
                if (!btn.classList.contains('touch-feedback')) {
                    addTouchFeedback(btn);
                }
            });
        }

        // 事件處理器（優化性能）
        if (elements.prevEventBtn) {
            elements.prevEventBtn.addEventListener('click', () => {
                if (currentEventIndex > 0) {
                    jumpToEvent(currentEventIndex - 1);
                    // 自動關閉時間軸導覽介面
                    closeTimelinePanel();
                }
            });
        }

        if (elements.nextEventBtn) {
            elements.nextEventBtn.addEventListener('click', () => {
                if (currentEventIndex < MEMOIR_DATA.timeline_events.length - 1) {
                    jumpToEvent(currentEventIndex + 1);
                    // 自動關閉時間軸導覽介面
                    closeTimelinePanel();
                }
            });
        }

        if (elements.prevMediaBtn) {
            elements.prevMediaBtn.addEventListener('click', () => {
                const currentEvent = getCurrentEvent();
                if (currentEvent?.media && currentMediaIndex > 0) {
                    currentMediaIndex--;
                    // 同步燈箱索引
                    currentLightboxMediaIndex = currentMediaIndex;

                    slideTransition(elements.mediaDisplay, 'left', () => {
                        displayMedia(true); // 使用快速模式
                        updateThumbnailSelection();
                        updateNavigationButtons();
                        // 如果燈箱開啟，也更新燈箱
                        if (elements.lightbox?.classList.contains('active')) {
                            displayLightboxMedia();
                            updateLightboxNavigation();
                        }
                    }, true); // 使用快速動畫
                }
            });
        }

        if (elements.nextMediaBtn) {
            elements.nextMediaBtn.addEventListener('click', () => {
                const currentEvent = getCurrentEvent();
                if (currentEvent?.media && currentMediaIndex < currentEvent.media.length - 1) {
                    currentMediaIndex++;
                    // 同步燈箱索引
                    currentLightboxMediaIndex = currentMediaIndex;

                    slideTransition(elements.mediaDisplay, 'right', () => {
                        displayMedia(true); // 使用快速模式
                        updateThumbnailSelection();
                        updateNavigationButtons();
                        // 如果燈箱開啟，也更新燈箱
                        if (elements.lightbox?.classList.contains('active')) {
                            displayLightboxMedia();
                            updateLightboxNavigation();
                        }
                    }, true); // 使用快速動畫
                }
            });
        }

        // 選單系統功能
        function toggleMenu() {
            isMenuOpen = !isMenuOpen;
            if (elements.menuDropdown) {
                elements.menuDropdown.classList.toggle('open', isMenuOpen);
            }
            if (elements.menuBtnIcon) {
                elements.menuBtnIcon.classList.toggle('open', isMenuOpen);
            }
            // 如果關閉主選單，同時關閉子選單
            if (!isMenuOpen && isFontSizeMenuOpen) {
                closeFontSizeMenu();
            }
        }
        
        function closeMenu() {
            isMenuOpen = false;
            if (elements.menuDropdown) {
                elements.menuDropdown.classList.remove('open');
            }
            if (elements.menuBtnIcon) {
                elements.menuBtnIcon.classList.remove('open');
            }
            closeFontSizeMenu();
            closeTypewriterMenu();
        }
        
        function toggleThumbnails() {
            isThumbnailsVisible = !isThumbnailsVisible;
            if (elements.thumbnailsContainer) {
                elements.thumbnailsContainer.classList.toggle('visible', isThumbnailsVisible);
            }

            // 更新按鈕外觀以顯示開關狀態
            if (elements.thumbnailBtn) {
                elements.thumbnailBtn.style.background = isThumbnailsVisible
                    ? 'var(--primary)'
                    : 'var(--surface)';
            }

            // 根據縮圖列狀態更新日期顯示位置
            updateInfoPosition();

            // 如果開啟縮圖列，立即重新渲染
            if (isThumbnailsVisible) {
                renderThumbnails();
            }

            // 不關閉選單，讓用戶可以繼續調整
        }

        // 新增：縮圖列收合/展開功能
        function toggleThumbnailsCollapse() {
            isThumbnailsCollapsed = !isThumbnailsCollapsed;

            if (elements.thumbnailsContainer) {
                elements.thumbnailsContainer.classList.toggle('collapsed', isThumbnailsCollapsed);
            }

            // 更新箭頭工具提示和圖標方向
            if (elements.thumbnailToggleArrow) {
                elements.thumbnailToggleArrow.title = isThumbnailsCollapsed ? '展開縮圖列' : '收合縮圖列';

                // 強制更新圖標類型：收合時向下，展開時向上
                const icon = elements.thumbnailToggleArrow.querySelector('i[data-lucide], svg[data-lucide]');
                if (icon) {
                    // 移除舊圖標
                    icon.remove();

                    // 創建新圖標
                    const newIcon = document.createElement('i');
                    if (isThumbnailsCollapsed) {
                        // 收合狀態：箭頭向下
                        newIcon.setAttribute('data-lucide', 'chevron-down');
                    } else {
                        // 展開狀態：箭頭向上
                        newIcon.setAttribute('data-lucide', 'chevron-up');
                    }
                    newIcon.style.width = '32px';
                    newIcon.style.height = '20px';

                    // 添加新圖標到按鈕
                    elements.thumbnailToggleArrow.appendChild(newIcon);

                    // 重新創建圖標
                    if (window.lucide) {
                        window.lucide.createIcons();
                    }
                }

                // 添加CSS類來標示狀態
                if (isThumbnailsCollapsed) {
                    elements.thumbnailToggleArrow.classList.add('collapsed');
                } else {
                    elements.thumbnailToggleArrow.classList.remove('collapsed');
                }

                // 如果在燈箱模式下，確保按鈕保持顯示
                if (isLightboxOpen) {
                    elements.thumbnailToggleArrow.style.display = 'flex';
                    elements.thumbnailToggleArrow.style.visibility = 'visible';
                    elements.thumbnailToggleArrow.style.opacity = '1';
                }
            }

        }

        function toggleTypewriterSpeedMenu() {
            isTypewriterMenuOpen = !isTypewriterMenuOpen;
            if (elements.typewriterSpeedDropdown) {
                elements.typewriterSpeedDropdown.classList.toggle('open', isTypewriterMenuOpen);
            }

            // 如果打開打字速度選單，關閉其他選單
            if (isTypewriterMenuOpen) {
                closeOtherMenus('typewriter');
            }
        }

        function closeTypewriterSpeedMenu() {
            isTypewriterMenuOpen = false;
            if (elements.typewriterSpeedDropdown) {
                elements.typewriterSpeedDropdown.classList.remove('open');
            }
        }

        function closeTypewriterMenu() {
            closeTypewriterSpeedMenu();
        }

        function closeOtherMenus(exceptMenu = '') {
            // 關閉其他所有選單
            if (exceptMenu !== 'typewriter') {
                isTypewriterMenuOpen = false;
                if (elements.typewriterSpeedDropdown) {
                    elements.typewriterSpeedDropdown.classList.remove('open');
                }
            }

            if (exceptMenu !== 'fontsize') {
                isFontSizeMenuOpen = false;
                if (elements.fontSizeDropdown) {
                    elements.fontSizeDropdown.classList.remove('open');
                }
            }

            if (exceptMenu !== 'theme') {
                isThemeMenuOpen = false;
                if (elements.themeDropdown) {
                    elements.themeDropdown.classList.remove('open');
                }
                if (elements.themeOverlay) {
                    elements.themeOverlay.classList.remove('show');
                }
            }
        }

        function toggleTypewriter() {
            isTypewriterEnabled = !isTypewriterEnabled;

            // 更新主按鈕外觀
            if (elements.typewriterToggleBtn) {
                elements.typewriterToggleBtn.style.background = isTypewriterEnabled
                    ? 'var(--primary)'
                    : 'var(--surface)';
            }
        }

        // 主題選擇功能
        function toggleThemeMenu() {
            isThemeMenuOpen = !isThemeMenuOpen;

            if (elements.themeDropdown) {
                elements.themeDropdown.classList.toggle('open', isThemeMenuOpen);
            }

            if (elements.themeOverlay) {
                elements.themeOverlay.classList.toggle('show', isThemeMenuOpen);
            }

            // 如果打開主題選單，關閉其他選單
            if (isThemeMenuOpen) {
                closeOtherMenus('theme');
            }
        }

        function applyTheme(themeName) {

            // 確保主題名稱有效
            if (!themeName || themeName === 'undefined') {
                themeName = 'default';
                console.warn('⚠️ 主題名稱無效，使用預設主題: default');
            }

            // 移除所有主題類別
            document.body.classList.remove('theme-default', 'theme-forest', 'theme-ocean',
                'theme-sunset', 'theme-lavender', 'theme-crimson');

            // 同時設定 data-theme 屬性和 class，確保相容性
            document.body.setAttribute('data-theme', themeName);

            // 應用新主題 class
            if (themeName !== 'default') {
                document.body.classList.add(`theme-${themeName}`);
            }

            // 更新當前主題變數
            currentTheme = themeName;

            // 保存到 localStorage（只在用戶主動選擇主題時，不在初始化時）
            if (!arguments.callee.isInitializing) {
                localStorage.setItem('memoir-theme', themeName);
            }

            // 更新主題選項的活動狀態
            updateThemeOptions(themeName);

        }

        function updateThemeOptions(activeTheme) {
            const themeOptions = document.querySelectorAll('.theme-option');
            themeOptions.forEach(option => {
                const isActive = option.dataset.theme === activeTheme;
                option.classList.toggle('active', isActive);
            });
        }

        function initializeThemeSystem() {

            // 應用部署時設定的主題（初始化時不保存到 localStorage）
            applyTheme.isInitializing = true;
            applyTheme(currentTheme);
            applyTheme.isInitializing = false;

            // 為主題選項添加點擊事件
            const themeOptions = document.querySelectorAll('.theme-option');

            themeOptions.forEach(option => {
                option.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const themeName = option.dataset.theme;
                    applyTheme(themeName);
                    toggleThemeMenu(); // 關閉選單
                });
            });

            // 背景遮罩點擊事件
            if (elements.themeOverlay) {
                elements.themeOverlay.addEventListener('click', () => {
                    toggleThemeMenu();
                });
            }
        }

        function setTypingSpeed(speed) {
            typingSpeed = parseInt(speed);

            // 儲存到localStorage，實現全域速度設定
            localStorage.setItem('memoirflow:typing-speed', typingSpeed);

            // 更新滑桿與顯示值
            const speedSlider = document.getElementById('typingSpeedSlider');
            const currentSpeedValue = document.getElementById('currentSpeedValue');
            if (speedSlider) speedSlider.value = speed;
            if (currentSpeedValue) currentSpeedValue.textContent = speed;

            // 立即應用新速度到當前打字機效果
            if (isTypewriterEnabled) {
                const currentEvent = getCurrentEvent();
                const description = currentEvent?.description || '';
                if (description && elements.eventDescription) {
                    // 立即清空描述區域
                    elements.eventDescription.textContent = '';
                    elements.eventDescription.classList.remove('typewriter-cursor');

                    // 更新當前事件ID，這會自動停止舊的打字機效果
                    currentEventId = `${currentEventIndex}-${Date.now()}`;
                    typewriterEffect(elements.eventDescription, description, typingSpeed, currentEventId);
                }
            }
        }

        function initializeTypingSpeedSlider() {
            // *** 修正：確保使用localStorage中的值，避免部署環境差異 ***
            const savedSpeed = parseInt(localStorage.getItem('memoirflow:typing-speed'));
            if (savedSpeed) {
                typingSpeed = savedSpeed;
                console.log(`🔧 使用localStorage中的打字速度: ${typingSpeed}`);
            } else {
                console.log(`🔧 使用部署配置的打字速度: ${typingSpeed}`);
            }

            // 初始化打字速度滑桿
            const speedSlider = document.getElementById('typingSpeedSlider');
            const currentSpeedValue = document.getElementById('currentSpeedValue');

            if (speedSlider) {
                speedSlider.value = typingSpeed;

                speedSlider.addEventListener('input', (e) => {
                    setTypingSpeed(e.target.value);
                });
            }

            if (currentSpeedValue) {
                currentSpeedValue.textContent = typingSpeed;
            }
        }

        function initializeToggleButtons() {
            // 初始化打字機按鈕外觀
            if (elements.typewriterToggleBtn) {
                elements.typewriterToggleBtn.style.background = isTypewriterEnabled
                    ? 'var(--primary)'
                    : 'var(--surface)';
            }

            // 初始化縮圖列按鈕外觀
            if (elements.thumbnailBtn) {
                elements.thumbnailBtn.style.background = isThumbnailsVisible
                    ? 'var(--primary)'
                    : 'var(--surface)';
            }
        }

        function initializeHideButtons() {
// 初始化隱藏畫面按鈕外觀
            if (elements.hideControlsBtn) {
                // 當控件可見時，按鈕應該顯示激活狀態（藍色）
                elements.hideControlsBtn.style.background = !areControlsHidden
                    ? 'var(--primary)'
                    : 'var(--surface)';

                const icon = elements.hideControlsBtn.querySelector('i[data-lucide]');
                if (icon) {
                    icon.setAttribute('data-lucide', areControlsHidden ? 'move-diagonal' : 'move');
                }
                elements.hideControlsBtn.title = areControlsHidden ? '顯示導航箭頭' : '隱藏導航箭頭';
            }

            // 初始化隱藏日期按鈕外觀
            if (elements.hideDateBtn) {
                // 當日期可見時，按鈕應該顯示激活狀態（藍色）
                elements.hideDateBtn.style.background = !isDateHidden
                    ? 'var(--primary)'
                    : 'var(--surface)';

                const icon = elements.hideDateBtn.querySelector('i[data-lucide]');
                if (icon) {
                    icon.setAttribute('data-lucide', isDateHidden ? 'calendar-x' : 'calendar-plus');
                }
                elements.hideDateBtn.title = isDateHidden ? '顯示日期標籤' : '隱藏日期標籤';
            }

            // 初始化隱藏回憶錄名稱按鈕外觀
            if (elements.hideTitleBtn) {
                // 當名稱可見時，按鈕應該顯示激活狀態（藍色）
                elements.hideTitleBtn.style.background = !isTitleHidden
                    ? 'var(--primary)'
                    : 'var(--surface)';

                const icon = elements.hideTitleBtn.querySelector('i[data-lucide]');
                if (icon) {
                    icon.setAttribute('data-lucide', isTitleHidden ? 'file-x' : 'file-text');
                }
                elements.hideTitleBtn.title = isTitleHidden ? '顯示回憶錄名稱' : '隱藏回憶錄名稱';
            }

            // *** 重要：初始化資訊顯示狀態 - 不可刪除 ***
            updateInfoDisplay();
            // *** 確保初始化後正確設定顯示狀態 ***

            // 重新創建圖標
            if (window.lucide) {
                lucide.createIcons();
            }
}

        function applyDefaultSettings() {
// 應用縮圖列設定
            if (isThumbnailsVisible) {
                showThumbnails();
            } else {
                hideThumbnails();
            }

            // 應用打字機效果設定
            if (isTypewriterEnabled) {
                // 打字機效果會在 renderDescription 時自動應用
}

            // 應用字體大小設定
            setFontSize(fontSize);

            // 應用控制按鈕顯示設定 - 依據部署時的設定決定初始狀態
// 直接設置初始狀態，而不是切換
            const floatingControls = document.querySelectorAll('.floating-controls:not(.nav-top)');
            floatingControls.forEach(control => {
                if (areControlsHidden) {
                    control.classList.add('controls-hidden');
                } else {
                    control.classList.remove('controls-hidden');
                }
            });

            // 字幕按鈕始終顯示，不受控制按鈕隱藏影響
            if (elements.subtitleToggleBtn) {
                elements.subtitleToggleBtn.style.opacity = '1';
                elements.subtitleToggleBtn.style.pointerEvents = 'auto';
            }

            // 應用日期顯示設定
            if (isDateHidden) {
                hideDateDisplay();
            } else {
                showDateDisplay();
            }
}

        function showThumbnails() {
            if (elements.thumbnailContainer) {
                elements.thumbnailContainer.classList.remove('hidden');
                isThumbnailsVisible = true;
                renderThumbnails();

                // 更新按鈕外觀
                if (elements.thumbnailBtn) {
                    elements.thumbnailBtn.style.background = 'var(--primary)';
                }
            }
        }

        function hideThumbnails() {
            if (elements.thumbnailContainer) {
                elements.thumbnailContainer.classList.add('hidden');
                isThumbnailsVisible = false;

                // 更新按鈕外觀
                if (elements.thumbnailBtn) {
                    elements.thumbnailBtn.style.background = 'rgba(107, 114, 128, 0.8)';
                }

                // *** 重要：保持縮圖DOM結構，確保已解密的圖片仍可被使用 ***
                // 縮圖即使隱藏也要保持渲染狀態，作為快取來源
                console.log('💡 縮圖列已隱藏，但保持DOM結構以供快取使用');
            }
        }

        function showControlsTemporarily() {
            if (elements.controlsContainer) {
                elements.controlsContainer.classList.remove('hidden');
                areControlsHidden = false;
            }
        }

        function hideControlsTemporarily() {
            if (elements.controlsContainer) {
                elements.controlsContainer.classList.add('hidden');
                areControlsHidden = true;
            }
        }

        function showDateDisplay() {
            const dateDisplay = document.getElementById('currentDateDisplay');
            if (dateDisplay) {
                dateDisplay.classList.remove('date-hidden');
                isDateHidden = false;
            }
        }

        function hideDateDisplay() {
            const dateDisplay = document.getElementById('currentDateDisplay');
            if (dateDisplay) {
                dateDisplay.classList.add('date-hidden');
                isDateHidden = true;
            }
        }

        function updateSpeedLabel(speed) {
            const speedLabel = document.querySelector('.speed-label');
            if (!speedLabel) return;
            
            if (speed <= 30) {
                speedLabel.textContent = '快速';
            } else if (speed <= 60) {
                speedLabel.textContent = '中等';
            } else {
                speedLabel.textContent = '慢速';
            }
        }
        
        function toggleSubtitle() {
            isSubtitleVisible = !isSubtitleVisible;
            
            // 更新按鈕外觀和圖標（不隱藏按鈕，保持始終可見）
            if (elements.subtitleToggleBtn) {
                // 更新Lucide圖示
                const icon = elements.subtitleToggleBtn.querySelector('i[data-lucide]');
                if (icon) {
                    icon.setAttribute('data-lucide', isSubtitleVisible ? 'eye' : 'eye-off');
                    lucide.createIcons(); // 重新創建圖示
                }
                
                elements.subtitleToggleBtn.title = isSubtitleVisible ? '隱藏字幕' : '顯示字幕';
                // 根據狀態更新按鈕樣式，但不隱藏
                elements.subtitleToggleBtn.classList.toggle('hidden', false); // 確保永不隱藏
            }
            
            // 更新字幕容器狀態
            if (elements.descriptionContainer) {
                elements.descriptionContainer.classList.toggle('subtitle-hidden', !isSubtitleVisible);

                // 調試信息
}
            
            // 更新整體布局模式
            document.body.classList.toggle('subtitle-hidden-mode', !isSubtitleVisible);
            
            // 如果重新開啟字幕，重新啟動打字機效果
            if (isSubtitleVisible && isTypewriterEnabled) {
                const currentEvent = getCurrentEvent();
                const description = currentEvent?.description || '';
                if (description && elements.eventDescription) {
                    // 立即清空描述區域
                    elements.eventDescription.textContent = '';
                    elements.eventDescription.classList.remove('typewriter-cursor');

                    // 更新當前事件ID並重新啟動打字機效果，舊的效果會自動停止
                    currentEventId = `${currentEventIndex}-${Date.now()}`;
                    typewriterEffect(elements.eventDescription, description, typingSpeed, currentEventId);
                }
            } else if (isSubtitleVisible && !isTypewriterEnabled) {
                // 如果沒有打字機效果，直接顯示文字
                const currentEvent = getCurrentEvent();
                const description = currentEvent?.description || '';
                if (description && elements.eventDescription) {
                    elements.eventDescription.textContent = description;
                }
            }
        }
        
        function toggleFontSizeMenu() {
            isFontSizeMenuOpen = !isFontSizeMenuOpen;
            if (elements.fontSizeDropdown) {
                elements.fontSizeDropdown.classList.toggle('open', isFontSizeMenuOpen);
            }

            // 如果打開字體大小選單，關閉其他選單
            if (isFontSizeMenuOpen) {
                closeOtherMenus('fontsize');
            }
        }
        
        function closeFontSizeMenu() {
            isFontSizeMenuOpen = false;
            if (elements.fontSizeDropdown) {
                elements.fontSizeDropdown.classList.remove('open');
            }
        }

        function toggleControls() {
            areControlsHidden = !areControlsHidden;

            // 隱藏除了選單系統以外的所有浮動控制元素
            const floatingControls = document.querySelectorAll('.floating-controls:not(.nav-top)');
            floatingControls.forEach(control => {
                control.classList.toggle('controls-hidden', areControlsHidden);
            });

            // 字幕開關按鈕始終保持可見和可操作
            if (elements.subtitleToggleBtn) {
                elements.subtitleToggleBtn.style.opacity = '1';
                elements.subtitleToggleBtn.style.visibility = 'visible';
                elements.subtitleToggleBtn.style.pointerEvents = 'auto';
            }

            // 更新按鈕外觀和圖標
            if (elements.hideControlsBtn) {
                // 當控件可見時，按鈕應該顯示激活狀態（藍色）
                elements.hideControlsBtn.style.background = !areControlsHidden
                    ? 'var(--primary)'
                    : 'var(--surface)';

                const icon = elements.hideControlsBtn.querySelector('i[data-lucide]');
                if (icon) {
                    icon.setAttribute('data-lucide', areControlsHidden ? 'move-diagonal' : 'move');
                    lucide.createIcons();
                }
                elements.hideControlsBtn.title = areControlsHidden ? '顯示導航箭頭' : '隱藏導航箭頭';
            }
        }

        function toggleDateDisplay() {
            isDateHidden = !isDateHidden;
            updateInfoDisplay();

            // 更新按鈕外觀和圖標
            if (elements.hideDateBtn) {
                // 當日期可見時，按鈕應該顯示激活狀態（藍色）
                elements.hideDateBtn.style.background = !isDateHidden
                    ? 'var(--primary)'
                    : 'var(--surface)';

                const icon = elements.hideDateBtn.querySelector('i[data-lucide]');
                if (icon) {
                    icon.setAttribute('data-lucide', isDateHidden ? 'calendar-x' : 'calendar-plus');
                    lucide.createIcons();
                }
                elements.hideDateBtn.title = isDateHidden ? '顯示日期標籤' : '隱藏日期標籤';
            }
        }

        function toggleTitleDisplay() {
            isTitleHidden = !isTitleHidden;
            updateInfoDisplay();

            // 更新按鈕外觀和圖標
            if (elements.hideTitleBtn) {
                // 當名稱可見時，按鈕應該顯示激活狀態（藍色）
                elements.hideTitleBtn.style.background = !isTitleHidden
                    ? 'var(--primary)'
                    : 'var(--surface)';

                const icon = elements.hideTitleBtn.querySelector('i[data-lucide]');
                if (icon) {
                    icon.setAttribute('data-lucide', isTitleHidden ? 'file-x' : 'file-text');
                    lucide.createIcons();
                }
                elements.hideTitleBtn.title = isTitleHidden ? '顯示回憶錄名稱' : '隱藏回憶錄名稱';
            }
        }

        function updateInfoDisplay() {
            const currentInfoDisplay = document.getElementById('currentInfoDisplay');
            if (!currentInfoDisplay) return;

            // 根據兩個開關的狀態決定顯示方式
            if (isDateHidden && isTitleHidden) {
                // 兩個都隱藏
                currentInfoDisplay.style.display = 'none';
            } else {
                // 至少一個要顯示
                currentInfoDisplay.style.display = 'flex';

                // 控制個別元素的顯示
                if (elements.currentMemoirTitle) {
                    elements.currentMemoirTitle.style.display = isTitleHidden ? 'none' : 'block';
                }
                if (elements.currentEventDate) {
                    elements.currentEventDate.style.display = isDateHidden ? 'none' : 'block';
                }
            }
        }

        function updateInfoPosition() {
            // 根據縮圖列狀態調整資訊顯示位置
            const currentInfoDisplay = document.getElementById('currentInfoDisplay');
            if (currentInfoDisplay) {
                currentInfoDisplay.classList.toggle('below-thumbnails', isThumbnailsVisible);
            }
        }

        function setFontSize(size) {
            fontSize = parseFloat(size);
            if (elements.descriptionContainer) {
                elements.descriptionContainer.style.fontSize = fontSize + 'rem';
            }

            // *** 修正：保存字體大小到 localStorage ***
            localStorage.setItem('memoir-font-size', String(fontSize));

            // 更新滑桿與顯示值
            const fontSlider = document.getElementById('fontSizeSlider');
            const currentFontValue = document.getElementById('currentFontValue');
            if (fontSlider) fontSlider.value = size;
            if (currentFontValue) currentFontValue.textContent = size + 'x';
        }

        // 選單系統按鈕事件
        if (elements.menuBtn) {
            elements.menuBtn.addEventListener('click', toggleMenu);
            addTouchFeedback(elements.menuBtn);
        }
        
        if (elements.timelineBtn) {
            elements.timelineBtn.addEventListener('click', () => {
                debounceButtonClick('timeline', () => {
                    toggleTimelinePanel();
                    // 時間軸點擊後關閉選單
                    closeMenu();
                }, 200);
            });
            addTouchFeedback(elements.timelineBtn);
        }
        
        // 打字機開關按鈕事件
        if (elements.typewriterToggleBtn) {
            elements.typewriterToggleBtn.addEventListener('click', () => {
                debounceButtonClick('typewriter-toggle', toggleTypewriter, 200);
                // 移除 closeMenu()，讓使用者可以繼續在選單中進行其他設定
            });
            addTouchFeedback(elements.typewriterToggleBtn);
        }

        // 打字機速度設定按鈕事件
        if (elements.typewriterSpeedBtn) {
            elements.typewriterSpeedBtn.addEventListener('click', () => {
                debounceButtonClick('typewriter-speed', toggleTypewriterSpeedMenu, 200);
            });
            addTouchFeedback(elements.typewriterSpeedBtn);
        }

        
        if (elements.thumbnailBtn) {
            elements.thumbnailBtn.addEventListener('click', toggleThumbnails);
            addTouchFeedback(elements.thumbnailBtn);
        }

        // 縮圖列收合/展開按鈕事件監聽器
        if (elements.thumbnailToggleArrow) {
            elements.thumbnailToggleArrow.addEventListener('click', toggleThumbnailsCollapse);
            addTouchFeedback(elements.thumbnailToggleArrow);
        }
        
        if (elements.fontSizeBtn) {
            elements.fontSizeBtn.addEventListener('click', () => {
                debounceButtonClick('fontsize', toggleFontSizeMenu, 200);
            });
            addTouchFeedback(elements.fontSizeBtn);
        }

        // 隱藏畫面按鈕事件
        if (elements.hideControlsBtn) {
            elements.hideControlsBtn.addEventListener('click', () => {
                debounceButtonClick('hide-controls', toggleControls, 200);
            });
            addTouchFeedback(elements.hideControlsBtn);
        }

        // 隱藏日期標籤按鈕事件
        if (elements.hideDateBtn) {
            elements.hideDateBtn.addEventListener('click', () => {
                debounceButtonClick('hide-date', toggleDateDisplay, 200);
            });
            addTouchFeedback(elements.hideDateBtn);
        }

        // 隱藏回憶錄名稱按鈕事件
        if (elements.hideTitleBtn) {
            elements.hideTitleBtn.addEventListener('click', () => {
                debounceButtonClick('hide-title', toggleTitleDisplay, 200);
            });
            addTouchFeedback(elements.hideTitleBtn);
        }

        // 主題選擇按鈕事件
        if (elements.themeBtn) {
            elements.themeBtn.addEventListener('click', () => {
                debounceButtonClick('theme', toggleThemeMenu, 200);
            });
            addTouchFeedback(elements.themeBtn);
        }

        // 字幕開關按鈕事件
        if (elements.subtitleToggleBtn) {
            elements.subtitleToggleBtn.addEventListener('click', toggleSubtitle);
            addTouchFeedback(elements.subtitleToggleBtn);
        }
        
        // 字體大小按鈕事件初始化函數
        function initializeFontSizeSlider() {
            // *** 修正：使用localStorage中的值或部署配置的預設值 ***
            const savedFontSize = parseFloat(localStorage.getItem('memoir-font-size')) || fontSize;
            fontSize = savedFontSize;

            // 初始化字體大小滑桿
            const fontSlider = document.getElementById('fontSizeSlider');
            const currentFontValue = document.getElementById('currentFontValue');

            if (fontSlider) {
                fontSlider.value = fontSize;

                fontSlider.addEventListener('input', (e) => {
                    setFontSize(e.target.value);
                });
            }

            if (currentFontValue) {
                currentFontValue.textContent = fontSize + 'x';
            }

            // *** 修正：立即應用字體大小 ***
            if (elements.descriptionContainer) {
                elements.descriptionContainer.style.fontSize = fontSize + 'rem';
            }
        }
        

        if (elements.closeTimelineBtn) {
            elements.closeTimelineBtn.addEventListener('click', closeTimelinePanel);
        }

        // 點擊面板外部關閉時間軸和選單
        document.addEventListener('click', (e) => {
            // 關閉時間軸面板
            if (elements.timelinePanel && 
                elements.timelinePanel.classList.contains('open') && 
                !elements.timelinePanel.contains(e.target) && 
                e.target !== elements.timelineBtn) {
                closeTimelinePanel();
            }
            
            // 關閉字體大小子選單
            if (isFontSizeMenuOpen && 
                elements.fontSizeDropdown &&
                !elements.fontSizeDropdown.contains(e.target) &&
                e.target !== elements.fontSizeBtn) {
                closeFontSizeMenu();
            }
            
            // 關閉打字機速度子選單
            if (isTypewriterMenuOpen &&
                elements.typewriterSpeedDropdown &&
                !elements.typewriterSpeedDropdown.contains(e.target) &&
                e.target !== elements.typewriterSpeedBtn) {
                closeTypewriterSpeedMenu();
            }
            
            // 關閉主選單（但保留時間軸按鈕例外）
            if (isMenuOpen && 
                elements.menuDropdown &&
                !elements.menuDropdown.contains(e.target) &&
                !elements.menuBtn.contains(e.target) &&
                e.target !== elements.timelineBtn) {
                closeMenu();
            }
        });

        // 鍵盤導航
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT') return;
            
            switch(e.key) {
                case 'ArrowLeft':
                    if (elements.prevMediaBtn) elements.prevMediaBtn.click();
                    break;
                case 'ArrowRight':
                    if (elements.nextMediaBtn) elements.nextMediaBtn.click();
                    break;
                case 'ArrowUp':
                    if (elements.prevEventBtn) elements.prevEventBtn.click();
                    break;
                case 'ArrowDown':
                    if (elements.nextEventBtn) elements.nextEventBtn.click();
                    break;
                case 'Escape':
                    closeTimelinePanel();
                    closeMenu();
                    break;
                case 't':
                case 'T':
                    toggleTimelinePanel();
                    break;
                case 'm':
                case 'M':
                    toggleMenu();
                    break;
            }
        });

        // 燈箱功能
        function openLightbox(mediaElement) {
            if (!elements.lightbox || !elements.lightboxMedia) return;

            const currentEvent = getCurrentEvent();
            if (!currentEvent?.media) return;

            // 設置燈箱開啟狀態
            isLightboxOpen = true;

            // 記錄燈箱開啟前的縮圖列狀態
            thumbnailsStateBeforeLightbox = isThumbnailsVisible;

            // 設置當前媒體
            currentLightboxMediaIndex = currentMediaIndex;

            // 確保縮圖列在燈箱模式下可見
            if (!isThumbnailsVisible) {
                toggleThumbnails();
            } else {
                // 如果縮圖列已經可見，確保容器有visible類別並重新渲染
                if (elements.thumbnailsContainer) {
                    elements.thumbnailsContainer.classList.add('visible');
                }
                renderThumbnails();
            }

            // 顯示燈箱
            displayLightboxMedia();
            updateLightboxNavigation();
            elements.lightbox.classList.add('active');

            // 確保收合按鈕在燈箱模式下的初始狀態正確
            if (elements.thumbnailToggleArrow) {
                // 強制顯示按鈕 - 直接修改style屬性覆蓋CSS
                elements.thumbnailToggleArrow.style.display = 'flex';
                elements.thumbnailToggleArrow.style.visibility = 'visible';
                elements.thumbnailToggleArrow.style.opacity = '1';

                // 添加燈箱模式的CSS類別
                elements.thumbnailToggleArrow.classList.add('lightbox-mode');

                // 強制更新按鈕狀態和圖標
                const icon = elements.thumbnailToggleArrow.querySelector('i[data-lucide], svg[data-lucide]');
                if (icon) {
                    icon.remove();
                    const newIcon = document.createElement('i');
                    newIcon.setAttribute('data-lucide', isThumbnailsCollapsed ? 'chevron-down' : 'chevron-up');
                    newIcon.style.width = '32px';
                    newIcon.style.height = '20px';
                    elements.thumbnailToggleArrow.appendChild(newIcon);

                    if (window.lucide) {
                        window.lucide.createIcons();
                    }
                }

                // 更新CSS類和標題
                elements.thumbnailToggleArrow.title = isThumbnailsCollapsed ? '展開縮圖列' : '收合縮圖列';
                if (isThumbnailsCollapsed) {
                    elements.thumbnailToggleArrow.classList.add('collapsed');
                } else {
                    elements.thumbnailToggleArrow.classList.remove('collapsed');
                }
}

            // 阻止背景滾動
            document.body.style.overflow = 'hidden';
        }
        
        function closeLightbox() {
            if (!elements.lightbox) return;

            // 設置燈箱關閉狀態
            isLightboxOpen = false;

            // 恢復縮圖列原始狀態
            if (!thumbnailsStateBeforeLightbox && isThumbnailsVisible) {
                // 如果燈箱開啟前縮圖列是關閉的，現在恢復關閉狀態
                toggleThumbnails();
            }

            // 檢查並恢復縮圖列的收合狀態
            // 如果縮圖列開關為開啟狀態，且目前是收合狀態，則自動展開
            if (isThumbnailsVisible && isThumbnailsCollapsed) {
// 重置收合狀態
                isThumbnailsCollapsed = false;

                // 更新縮圖列容器的CSS類別
                if (elements.thumbnailsContainer) {
                    elements.thumbnailsContainer.classList.remove('collapsed');
                }

                // 清除可能的收合動畫狀態
                setTimeout(() => {
                    if (elements.thumbnailsContainer) {
                        elements.thumbnailsContainer.style.transform = '';
                    }
                }, 100);
}

            elements.lightbox.classList.remove('active');
            document.body.style.overflow = '';

            // 隱藏收合按鈕 - 恢復為只在燈箱模式下顯示
            if (elements.thumbnailToggleArrow) {
                elements.thumbnailToggleArrow.style.display = 'none';
                elements.thumbnailToggleArrow.style.visibility = 'hidden';
                elements.thumbnailToggleArrow.style.opacity = '0';

                // 移除燈箱模式的CSS類別
                elements.thumbnailToggleArrow.classList.remove('lightbox-mode');
}

            // 清空燈箱內容
            if (elements.lightboxMedia) {
                elements.lightboxMedia.innerHTML = '';
            }
        }
        
        function displayLightboxMedia() {
            const currentEvent = getCurrentEvent();
            if (!currentEvent?.media || !elements.lightboxMedia) return;
            
            const media = currentEvent.media[currentLightboxMediaIndex];
            if (!media) return;
            
            // 清空燈箱內容
            elements.lightboxMedia.innerHTML = '';
            
            // 創建媒體元素
            let mediaElement;
            if (media.type === 'image' || media.media_type === 'image') {
                mediaElement = document.createElement('img');
                mediaElement.alt = '回憶錄圖片';
                
                const mediaSrc = media.src || media.url || (media.filename ? `./media/${media.filename}` : null);

                // 如果無法構建有效路徑，跳過
                if (!mediaSrc || mediaSrc.includes('null')) {
                    console.warn('⚠️ 跳過燈箱無效媒體路徑:', media);
                    elements.lightboxMedia.innerHTML = '<div style="color: white; text-align: center;">媒體檔案路徑無效</div>';
                    return;
                }

                if (mediaSrc.includes('media/')) {
                    mediaElement.setAttribute('data-needs-mse-decrypt', 'true');
                    // 額外驗證：確保不設置無效路徑
                    if (mediaSrc && !mediaSrc.includes('null') && mediaSrc !== 'null') {
                        mediaElement.setAttribute('data-original-src', mediaSrc);
                    } else {
                        console.error('🚫 阻止設置燈箱無效的 data-original-src:', mediaSrc);
                        return; // 阻止進一步處理
                    }
                    mediaElement.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSI4IiBmaWxsPSJub25lIiBzdHJva2U9IiMzYjgyZjYiIHN0cm9rZS13aWR0aD0iMiI+PGFuaW1hdGVUcmFuc2Zvcm0gYXR0cmlidXRlTmFtZT0idHJhbnNmb3JtIiB0eXBlPSJyb3RhdGUiIHZhbHVlcz0iMCAyMCAyMDszNjAgMjAgMjAiIGR1cj0iMXMiIHJlcGVhdENvdW50PSJpbmRlZmluaXRlIi8+PC9jaXJjbGU+PC9zdmc+';
                    setTimeout(quickDecryptMedia, 10);
                } else {
                    mediaElement.src = mediaSrc;
                }
            } else if (media.type === 'video' || media.media_type === 'video') {
                mediaElement = document.createElement('video');
                mediaElement.controls = true;
                mediaElement.src = media.src || media.url || (media.filename ? `./media/${media.filename}` : '');
            }

            if (mediaElement) {
                elements.lightboxMedia.appendChild(mediaElement);
            }
            
            // 更新導航按鈕狀態
            updateLightboxNavigation();
        }
        
        function updateLightboxNavigation() {
            const currentEvent = getCurrentEvent();
            if (!currentEvent?.media) return;
            
            if (elements.lightboxPrev) {
                elements.lightboxPrev.style.display = currentLightboxMediaIndex > 0 ? 'block' : 'none';
            }
            if (elements.lightboxNext) {
                elements.lightboxNext.style.display = currentLightboxMediaIndex < currentEvent.media.length - 1 ? 'block' : 'none';
            }
        }
        
        function lightboxPrevMedia() {
            const currentEvent = getCurrentEvent();
            if (!currentEvent?.media || currentLightboxMediaIndex <= 0) return;

            currentLightboxMediaIndex--;
            // 同步主媒體索引
            currentMediaIndex = currentLightboxMediaIndex;

            // 更新所有相關顯示
            displayLightboxMedia();
            displayMedia();
            updateThumbnailSelection();
        }
        
        function lightboxNextMedia() {
            const currentEvent = getCurrentEvent();
            if (!currentEvent?.media || currentLightboxMediaIndex >= currentEvent.media.length - 1) return;

            currentLightboxMediaIndex++;
            // 同步主媒體索引
            currentMediaIndex = currentLightboxMediaIndex;

            // 更新所有相關顯示
            displayLightboxMedia();
            displayMedia();
            updateThumbnailSelection();
        }
        
        // 燈箱事件監聽器
        if (elements.lightboxClose) {
            elements.lightboxClose.addEventListener('click', closeLightbox);
        }
        
        if (elements.lightboxPrev) {
            elements.lightboxPrev.addEventListener('click', lightboxPrevMedia);
        }
        
        if (elements.lightboxNext) {
            elements.lightboxNext.addEventListener('click', lightboxNextMedia);
        }
        
        // 點擊燈箱背景關閉
        if (elements.lightbox) {
            elements.lightbox.addEventListener('click', (e) => {
                if (e.target === elements.lightbox) {
                    closeLightbox();
                }
            });
        }
        
        // 燈箱鍵盤導航
        document.addEventListener('keydown', (e) => {
            if (!elements.lightbox?.classList.contains('active')) return;
            
            switch(e.key) {
                case 'Escape':
                    closeLightbox();
                    break;
                case 'ArrowLeft':
                    lightboxPrevMedia();
                    break;
                case 'ArrowRight':
                    lightboxNextMedia();
                    break;
            }
        });

        // 數據結構轉換函數
        function normalizeDataStructure(data) {
            if (!data) return null;
            
            // 如果已經有 timeline_events，直接返回
            if (data.timeline_events) {
return data;
            }
            
            // 如果有 events，轉換為 timeline_events 格式
            if (data.events && Array.isArray(data.events)) {
const converted = {
                    ...data,
                    timeline_events: data.events
                };
return converted;
            }
            
            console.warn('⚠️ 無法識別的數據結構:', data);
            return data;
        }

        // 版本檢查和配置同步函數
        function checkVersionAndSyncConfig() {
const currentVersionId = window.MEMOIR_VERSION_ID;
            const defaultDisplayConfig = window.MEMOIR_DISPLAY_CONFIG;
if (!currentVersionId) {
                console.warn('⚠️ 未找到版本號，跳過版本檢查');
return;
            }

            const VERSION_KEY = 'memoirflow:last-version';
            const savedVersionId = localStorage.getItem(VERSION_KEY);
// *** 修正：只在首次訪問時應用預設配置，避免覆蓋用戶設定 ***
            const isFirstVisit = !savedVersionId;
            if (isFirstVisit && defaultDisplayConfig) {
                console.log('🔧 首次訪問，應用作者的預設配置');
// 記錄同步前的狀態
if (defaultDisplayConfig) {
// 主題配置已在初始化時處理，這裡只做記錄
                    if (typeof defaultDisplayConfig.theme === 'string') {
// 如果配置不一致，以部署配置為準（但這通常不應該發生）
                        if (currentTheme !== defaultDisplayConfig.theme) {
                            console.warn(`⚠️ 主題配置不一致，以部署配置為準: ${defaultDisplayConfig.theme}`);
                            currentTheme = defaultDisplayConfig.theme;
                            applyTheme(currentTheme);
                        }
                    }

                    // 同步字體大小配置
                    if (typeof defaultDisplayConfig.fontSize === 'number') {
                        const fontValue = defaultDisplayConfig.fontSize;
                        const oldFontSize = actualFontSize;
                        actualFontSize = fontValue;
                        fontSize = fontValue; // 同時更新全域變數
                        localStorage.setItem('memoir-font-size', String(actualFontSize));
// 立即應用字體大小
                        setFontSize(actualFontSize);
                    }

                    // 同步打字速度配置
                    if (typeof defaultDisplayConfig.typingSpeed === 'number') {
                        const oldTypingSpeed = actualTypingSpeed;
                        actualTypingSpeed = defaultDisplayConfig.typingSpeed;
                        typingSpeed = defaultDisplayConfig.typingSpeed; // 同時更新全域變數
                        localStorage.setItem('memoirflow:typing-speed', String(actualTypingSpeed));
}

                    // 同步縮圖顯示配置
                    if (typeof defaultDisplayConfig.thumbnailsVisible === 'boolean') {
                        const oldThumbnailsVisible = actualThumbnailsVisible;
                        actualThumbnailsVisible = defaultDisplayConfig.thumbnailsVisible;
                        isThumbnailsVisible = defaultDisplayConfig.thumbnailsVisible; // 同時更新全域變數
                        localStorage.setItem('memoir-thumbnails-visible', String(actualThumbnailsVisible));
// 立即應用縮圖顯示設定
                        if (elements.thumbnailsContainer) {
                            elements.thumbnailsContainer.classList.toggle('visible', actualThumbnailsVisible);
                        }
                    }
} else {
                    console.warn('❌ 作者的顯示配置為空，無法同步');
                }

                // 更新版本號記錄
                localStorage.setItem(VERSION_KEY, currentVersionId);
            } else {
}
}

        // 主題應用函數已整合到上方，移除重複定義

        // 初始化函數
        function initializeApp() {
// 版本檢查和配置同步
            checkVersionAndSyncConfig();
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
return;
            }
// 隱藏載入畫面
            elements.loadingScreen.classList.add('hidden');
            elements.app.classList.remove('hidden');

            // 載入第一個事件
            if (MEMOIR_DATA.timeline_events.length > 0) {
                renderTimeline(); // 首先渲染時間軸
                loadEvent();
            } else {
                console.warn('⚠️ 沒有回憶錄事件可顯示');
                elements.mediaDisplay.innerHTML = '<div>此回憶錄沒有事件內容</div>';
            }

            // 初始化按鈕狀態
            initializeToggleButtons();
            // 初始化打字速度滑桿
            initializeTypingSpeedSlider();
            // 初始化隱藏功能按鈕狀態
            initializeHideButtons();
            // 初始化主題系統
            initializeThemeSystem();
            // 應用預設參數到實際顯示
            applyDefaultSettings();
            // 初始化日期顯示位置
            updateInfoPosition();
}

        // 解密成功回調
        window.onDecryptionSuccess = function(decryptedData) {
MEMOIR_DATA = decryptedData;
            initializeApp();
        };

        // 監聽解密成功事件
        document.addEventListener('decryptionSuccess', function(event) {
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
} else if (window.MEMOIR_DATA) {
                            finalData = window.MEMOIR_DATA;
}
                        
                        if (finalData) {
                            // 設置到全域和本地變數
                            window.MEMOIR_DATA = finalData;
                            MEMOIR_DATA = finalData;
// 調用解密成功回調
                            if (typeof window.onDecryptionSuccess === 'function') {
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
            // 檢查初始 DOM 狀態，確認是否有重複的 thumbnails 元素
            const initialThumbnailElements = document.querySelectorAll('#thumbnails');
if (initialThumbnailElements.length > 1) {
                console.error('❌ 嚴重錯誤：DOM中已存在多個 #thumbnails 元素！');
                initialThumbnailElements.forEach((el, index) => {
});
            }

            // 初始化Lucide圖示
            if (window.lucide) {
                lucide.createIcons();
            }

            // 設置密碼模態框
            setupPasswordModal();

            // 設置觸控手勢
            setupTouchGestures();
            
            // 初始化字體大小滑桿
            initializeFontSizeSlider();

            // 初始化按鈕狀態顯示
            initializeToggleButtons();
// 檢查是否需要密碼驗證
            if (typeof window.REQUIRE_PW !== 'undefined' && window.REQUIRE_PW && !sessionStorage.getItem('mf_pw_unlocked')) {
window.showPasswordPrompt();
            } else if (window.MEMOIR_DATA) {
                // 如果數據已經載入，直接初始化
MEMOIR_DATA = window.MEMOIR_DATA;
                initializeApp();
            } else {
}
            
            // 添加頁面載入動畫
            setTimeout(() => {
                document.body.classList.add('fade-in');
            }, 100);
        });

        // 視窗大小調整事件監聽器（使用防抖機制）
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                // 只有在縮圖列可見時才調整寬度
                if (isThumbnailsVisible && elements.thumbnails) {
                    adjustThumbnailContainerWidth();
                    console.debug('Window resized: adjusting thumbnail container width');
                }
            }, 150); // 150ms 防抖延遲
        });

        // 性能優化：積極預載當前事件的所有圖片（改善版）
        function preloadEventMedia() {
            const currentEvent = getCurrentEvent();
            if (!currentEvent?.media) return;

            // 重置預載完成標誌
            window.currentEventPreloadComplete = false;

            console.log('🚀 開始積極預載當前事件的圖片，總數:', currentEvent.media.length);

            // 更積極的預載策略：直接模擬縮圖的解密過程
            let preloadedCount = 0;
            const totalImages = currentEvent.media.filter(media => media && (media.type === 'image' || media.media_type === 'image')).length;

            currentEvent.media.forEach((media, index) => {
                if (media && (media.type === 'image' || media.media_type === 'image')) {
                    setTimeout(() => {
                        const originalSrc = media.src || media.url || (media.filename ? `./media/${media.filename}` : null);

                        // 如果無法構建有效路徑，跳過此媒體
                        if (!originalSrc || originalSrc.includes('null')) {
                            console.warn(`⚠️ 跳過無效媒體路徑: ${index + 1}/${currentEvent.media.length}`, media);
                            return;
                        }

                        // 方法1: 創建隱藏圖片觸發解密
                        const hiddenImg = document.createElement('img');
                        hiddenImg.style.display = 'none';
                        hiddenImg.style.position = 'absolute';
                        hiddenImg.style.left = '-9999px';
                        hiddenImg.setAttribute('data-needs-mse-decrypt', 'true');
                        hiddenImg.setAttribute('data-preload-index', index.toString());
                        hiddenImg.setAttribute('data-event-index', currentEventIndex.toString());

                        let decryptComplete = false;

                        const handleSuccess = (blobUrl) => {
                            if (!decryptComplete) {
                                decryptComplete = true;
                                preloadedCount++;
                                console.log(`✅ 圖片預載完成: ${index + 1}/${currentEvent.media.length} (${preloadedCount}/${totalImages})`);

                                cacheImage(originalSrc, blobUrl);
                                cacheEventMedia(currentEventIndex, index, blobUrl);

                                // 清理隱藏元素
                                setTimeout(() => {
                                    if (hiddenImg.parentNode) {
                                        hiddenImg.parentNode.removeChild(hiddenImg);
                                    }
                                }, 500);

                                // 檢查是否全部完成
                                if (preloadedCount >= totalImages) {
                                    console.log('🎉 當前事件所有圖片預載完成！停止進一步的解密請求');
                                    // 設置全域標誌，避免後續無效請求
                                    window.currentEventPreloadComplete = true;
                                }
                            }
                        };

                        hiddenImg.onload = () => handleSuccess(hiddenImg.src);

                        hiddenImg.onerror = () => {
                            console.log(`🔄 圖片需要解密處理: ${index + 1}/${currentEvent.media.length}`);
                        };

                        // MSE 解密完成監聽
                        hiddenImg.addEventListener('mse-decrypt-complete', (event) => {
                            if (event.detail && event.detail.decryptedSrc) {
                                handleSuccess(event.detail.decryptedSrc);
                            }
                        });

                        // 添加到 DOM
                        document.body.appendChild(hiddenImg);
                        hiddenImg.src = originalSrc;

                        // 單次解密檢查，避免重複請求
                        setTimeout(() => {
                            if (!decryptComplete && !window.currentEventPreloadComplete && typeof window.quickDecryptMedia === 'function') {
                                console.log(`🔄 觸發單次解密檢查: ${index + 1}/${currentEvent.media.length}`);
                                window.quickDecryptMedia();
                            }
                        }, 500); // 只執行一次，延遲500ms

                    }, index * 50); // 減少間隔到50ms
                }
            });
        }

        // 性能優化：預載入下一個媒體（保持向後兼容）
        function preloadNextMedia() {
            const currentEvent = getCurrentEvent();
            if (!currentEvent?.media) return;

            const nextIndex = currentMediaIndex + 1;
            if (nextIndex < currentEvent.media.length) {
                const nextMedia = currentEvent.media[nextIndex];
                if (nextMedia && (nextMedia.type === 'image' || nextMedia.media_type === 'image')) {
                    const img = new Image();
                    img.src = nextMedia.src || nextMedia.url || (nextMedia.filename ? `./media/${nextMedia.filename}` : '');
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

            (function() {
                'use strict';
                
                console.log('🔑 伺服器端金鑰模式載入');
                
                window.autoDecrypt = async function() {
                    try {
                        // 獲取加密數據
                        const encEl = document.getElementById('enc-payload');
                        if (!encEl) throw new Error('找不到加密數據容器');
                        
                        const encData = JSON.parse(encEl.textContent || '{}');
                        const { ciphertext_b64, iv_b64, salt_b64, aad } = encData;
                        
                        if (!ciphertext_b64 || !iv_b64 || !salt_b64) {
                            throw new Error('加密數據不完整');
                        }
                        
                        console.log('✅ 加密數據驗證通過');
                        console.log('🔍 調試信息:', {
                            ciphertext_length: ciphertext_b64.length,
                            iv_length: iv_b64.length,
                            salt_length: salt_b64.length,
                            aad: aad
                        });
                        
                        // 從伺服器獲取解密金鑰
                        const response = await fetch('https://mastermaso.com/memoirflow/api/keys/retrieve', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Accept': 'application/json'
                            },
                            body: JSON.stringify({
                                memoir_id: '4548b929-5c16-4ee7-a189-60679e2165be',
                                session_id: 'direct',
                                timestamp: new Date().toISOString()
                            })
                        });
                        
                        if (!response.ok) {
                            const errorText = await response.text();
                            throw new Error('無法獲取解密金鑰: HTTP ' + response.status + ' - ' + errorText);
                        }
                        
                        const result = await response.json();
                        console.log(`result=${JSON.stringify(result)}`)
                        if (!result.decryption_key) {
                            throw new Error('伺服器回應中缺少解密金鑰');
                        }
                        
                        console.log('✅ 金鑰獲取成功');
                        
                        // 解碼金鑰
                        const keyB64 = result.decryption_key;
                        console.log('🔍 原始金鑰長度:', keyB64.length);
                        
                        const b64 = keyB64.replace(/-/g, '+').replace(/_/g, '/');
                        const padLength = (4 - (b64.length % 4)) % 4;
                        const paddedB64 = b64 + '='.repeat(padLength);
                        console.log('🔍 處理後的 base64:', paddedB64.length);
                        
                        const raw = atob(paddedB64);
                        const secretBytes = new Uint8Array([...raw].map(c => c.charCodeAt(0)));
                        console.log('✅ 解密金鑰處理完成，長度:', secretBytes.length);
                        
                        // PBKDF2 金鑰推導
                        const salt = Uint8Array.from(atob(salt_b64), c => c.charCodeAt(0));
                        console.log('🔍 Salt 長度:', salt.length);
                        
                        const keyMat = await crypto.subtle.importKey('raw', secretBytes, 'PBKDF2', false, ['deriveKey']);
                        const aesKey = await crypto.subtle.deriveKey(
                            { name: 'PBKDF2', salt, iterations: 200000, hash: 'SHA-256' },
                            keyMat, 
                            { name: 'AES-GCM', length: 256 }, 
                            false, 
                            ['decrypt']
                        );
                        
                        console.log('✅ AES 密鑰推導完成');
                        
                        // AES-GCM 解密
                        const iv = Uint8Array.from(atob(iv_b64), c => c.charCodeAt(0));
                        const ct = Uint8Array.from(atob(ciphertext_b64), c => c.charCodeAt(0));
                        
                        console.log('🔍 解密參數:', {
                            iv_length: iv.length,
                            ciphertext_length: ct.length,
                            has_aad: !!aad
                        });
                        
                        const decryptAlgo = aad ? 
                            { name: 'AES-GCM', iv, additionalData: new TextEncoder().encode(aad) } : 
                            { name: 'AES-GCM', iv };
                        
                        let decryptedBuffer;
                        try {
                            decryptedBuffer = await crypto.subtle.decrypt(decryptAlgo, aesKey, ct);
                            console.log('✅ AES-GCM 解密完成');
                        } catch (decryptError) {
                            console.error('❌ AES-GCM 解密失敗:', decryptError);
                            
                            // 嘗試不使用 AAD 解密
                            if (aad) {
                                console.log('🔄 嘗試不使用 AAD 解密...');
                                try {
                                    decryptedBuffer = await crypto.subtle.decrypt(
                                        { name: 'AES-GCM', iv }, 
                                        aesKey, 
                                        ct
                                    );
                                    console.log('✅ 無 AAD 解密成功');
                                } catch (noAadError) {
                                    throw new Error('解密失敗：金鑰不匹配或數據已損壞');
                                }
                            } else {
                                throw new Error('解密失敗：金鑰不匹配或數據已損壞');
                            }
                        }
                        
                        const decryptedText = new TextDecoder().decode(new Uint8Array(decryptedBuffer));
                        let memoirData;
                        
                        try {
                            memoirData = JSON.parse(decryptedText);
                        } catch (parseError) {
                            throw new Error('解密後的數據格式無效');
                        }
                        
                        if (!memoirData || typeof memoirData !== 'object') {
                            throw new Error('解密後的回憶錄數據無效');
                        }
                        
                        console.log('✅ 回憶錄數據解析成功:', {
                            id: memoirData.id,
                            name: memoirData.chinese_name,
                            eventsCount: memoirData.events?.length || 0
                        });
                        
                        // 設置全域數據並觸發事件
                        window.MEMOIR_DATA = memoirData;
                        window.dispatchEvent(new CustomEvent('memoir:decrypted', {
                            detail: memoirData
                        }));
                        
                        console.log('🎉 伺服器端金鑰解密完成');
                        return true;
                        
                    } catch (error) {
                        console.error('❌ 解密失敗:', error);
                        
                        // 修正錯誤處理：確保 error.message 是字符串
                        let errorMessage = 'unknown error';
                        if (error && typeof error === 'object') {
                            if (typeof error.message === 'string') {
                                errorMessage = error.message;
                            } else if (typeof error.toString === 'function') {
                                errorMessage = error.toString();
                            }
                        } else if (typeof error === 'string') {
                            errorMessage = error;
                        }
                        
                        // 根據錯誤類型提供具體指導
                        if (errorMessage.includes('金鑰') || errorMessage.includes('key')) {
                            errorMessage = '解密金鑰獲取失敗，請檢查網路連接或聯繫管理員';
                        } else if (errorMessage.includes('decrypt') || errorMessage.includes('解密')) {
                            errorMessage = '內容解密失敗，可能是金鑰不匹配或數據已損壞';
                        } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
                            errorMessage = '網路連接失敗，請檢查網路狀態後重試';
                        }
                        
                        if (typeof window.showError === 'function') {
                            window.showError('解密失敗: ' + errorMessage);
                        } else {
                            alert('解密失敗: ' + errorMessage);
                        }
                        return false;
                    }
                };
                
                console.log('✅ 伺服器端金鑰解密腳本準備完成');

                // 🚨 新增：自動調用解密函數
                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', function() {
                        console.log('🚀 DOM 載入完成，自動開始解密');
                        setTimeout(() => {
                            if (typeof window.autoDecrypt === 'function') {
                                window.autoDecrypt().catch(console.error);
                            }
                        }, 100);
                    });
                } else {
                    console.log('🚀 DOM 已載入，立即開始解密');
                    setTimeout(() => {
                        if (typeof window.autoDecrypt === 'function') {
                            window.autoDecrypt().catch(console.error);
                        }
                    }, 100);
                }

            })();
        

// ========== 提取的腳本區塊 ==========

        // 🚀 超高效能 MSE 解密系統 - 無感載入版本
        (function() {
            'use strict';


            const MSE_OFFSET = 37;
            const GITHUB_BASE_URL = 'https://maso0310.github.io/memoir-developer-log/media/';

            // === 核心配置：針對無感體驗優化 ===
            const CONFIG = {
                MAX_CONCURRENT_DECRYPT: 8,        // 最大並行解密數
                CACHE_SIZE: 50,                   // 解密快取大小
                PRELOAD_RANGE: 3,                 // 預載入範圍
                CHUNK_SIZE: 64 * 1024,            // 分塊處理大小 (64KB)
                PRIORITY_BOOST_MS: 100,           // 優先級提升時間
                MEMORY_CLEANUP_INTERVAL: 30000,   // 記憶體清理間隔
                INSTANT_LOAD_THRESHOLD: 500,      // 即時載入閾值 (500ms)
            };

            // === 高效能解密引擎 (支援 Worker + 主線程備用) ===
            class HybridDecryptionEngine {
                constructor() {
                    this.workers = [];
                    this.workerCount = Math.min(4, navigator.hardwareConcurrency || 2);
                    this.taskQueue = [];
                    this.busyWorkers = new Set();
                    this.workersAvailable = false;
                    this.fallbackMode = false;
                    this.initWorkers();
                }

                initWorkers() {
                    const workerCode = `
                        self.onmessage = function(e) {
                            const { data, offset, taskId } = e.data;

                            try {
                                // 高度優化的位元組解密
                                const result = new Uint8Array(data.length);
                                const offsetComplement = 256 - offset;

                                // 使用 32-bit 批次處理來提高效能
                                let i = 0;
                                const len = data.length;

                                // 4 字節批次處理
                                for (; i < len - 3; i += 4) {
                                    result[i] = (data[i] + offsetComplement) & 255;
                                    result[i + 1] = (data[i + 1] + offsetComplement) & 255;
                                    result[i + 2] = (data[i + 2] + offsetComplement) & 255;
                                    result[i + 3] = (data[i + 3] + offsetComplement) & 255;
                                }

                                // 處理剩餘字節
                                for (; i < len; i++) {
                                    result[i] = (data[i] + offsetComplement) & 255;
                                }

                                self.postMessage({ taskId, result, success: true });
                            } catch (error) {
                                self.postMessage({ taskId, error: error.message, success: false });
                            }
                        };
                    `;

                    // 嘗試創建 Web Workers
                    try {
                        for (let i = 0; i < this.workerCount; i++) {
                            const blob = new Blob([workerCode], { type: 'application/javascript' });
                            const worker = new Worker(URL.createObjectURL(blob));

                            worker.onmessage = (e) => this.handleWorkerMessage(e, worker);
                            worker.onerror = (error) => {
                                    this.enableFallbackMode();
                            };

                            this.workers.push(worker);
                        }

                        if (this.workers.length > 0) {
                            this.workersAvailable = true;
                        }
                    } catch (error) {
                        this.enableFallbackMode();
                    }
                }

                enableFallbackMode() {
                    this.fallbackMode = true;
                    this.workersAvailable = false;
                    this.workers.forEach(worker => {
                        try {
                            worker.terminate();
                        } catch (e) {
                            // 忽略終止錯誤
                        }
                    });
                    this.workers = [];
                }

                // 主線程高效能解密函數
                decryptOnMainThread(data) {
                    const result = new Uint8Array(data.length);
                    const offsetComplement = 256 - MSE_OFFSET;

                    // 使用相同的32-bit批次處理優化
                    let i = 0;
                    const len = data.length;

                    // 4 字節批次處理
                    for (; i < len - 3; i += 4) {
                        result[i] = (data[i] + offsetComplement) & 255;
                        result[i + 1] = (data[i + 1] + offsetComplement) & 255;
                        result[i + 2] = (data[i + 2] + offsetComplement) & 255;
                        result[i + 3] = (data[i + 3] + offsetComplement) & 255;
                    }

                    // 處理剩餘字節
                    for (; i < len; i++) {
                        result[i] = (data[i] + offsetComplement) & 255;
                    }

                    return result;
                }

                async decrypt(data, taskId) {
                    // 如果在備用模式，直接使用主線程解密
                    if (this.fallbackMode || !this.workersAvailable) {
                        try {
                            const result = this.decryptOnMainThread(data);
                            return result;
                        } catch (error) {
                            throw error;
                        }
                    }

                    // 使用 Worker 解密
                    return new Promise((resolve, reject) => {
                        this.taskQueue.push({ data, taskId, resolve, reject });
                        this.processQueue();
                    });
                }

                processQueue() {
                    if (this.fallbackMode || !this.workersAvailable) {
                        // 在備用模式下，處理所有待處理任務
                        while (this.taskQueue.length > 0) {
                            const task = this.taskQueue.shift();
                            try {
                                const result = this.decryptOnMainThread(task.data);
                                task.resolve(result);
                            } catch (error) {
                                task.reject(error);
                            }
                        }
                        return;
                    }

                    while (this.taskQueue.length > 0 && this.busyWorkers.size < this.workerCount) {
                        const task = this.taskQueue.shift();
                        const worker = this.workers.find(w => !this.busyWorkers.has(w));

                        if (worker) {
                            this.busyWorkers.add(worker);
                            worker.currentTask = task;
                            worker.postMessage({
                                data: task.data,
                                offset: MSE_OFFSET,
                                taskId: task.taskId
                            });
                        } else {
                            this.taskQueue.unshift(task);
                            break;
                        }
                    }
                }

                handleWorkerMessage(e, worker) {
                    const { taskId, result, success, error } = e.data;
                    const task = worker.currentTask;

                    this.busyWorkers.delete(worker);
                    worker.currentTask = null;

                    if (success) {
                        task.resolve(result);
                    } else {
                        // Worker 失敗時切換到備用模式
                        this.enableFallbackMode();

                        // 重新處理失敗的任務
                        try {
                            const result = this.decryptOnMainThread(task.data);
                            task.resolve(result);
                        } catch (fallbackError) {
                            task.reject(new Error(`Worker 和主線程解密都失敗: ${error}, ${fallbackError.message}`));
                        }
                    }

                    this.processQueue();
                }

                destroy() {
                    this.workers.forEach(worker => {
                        try {
                            worker.terminate();
                        } catch (e) {
                            // 忽略終止錯誤
                        }
                    });
                    this.workers = [];
                    this.taskQueue = [];
                    this.busyWorkers.clear();
                    this.workersAvailable = false;
                    this.fallbackMode = false;
                }

                getStatus() {
                    return {
                        workersAvailable: this.workersAvailable,
                        fallbackMode: this.fallbackMode,
                        workerCount: this.workers.length,
                        queueLength: this.taskQueue.length,
                        busyWorkers: this.busyWorkers.size
                    };
                }
            }

            // === 智能快取系統 ===
            class SmartDecryptCache {
                constructor() {
                    this.cache = new Map();
                    this.priorities = new Map();
                    this.accessTimes = new Map();
                    this.blobUrls = new Map();
                    this.maxSize = CONFIG.CACHE_SIZE;
                    this.memoryUsage = 0;
                    this.maxMemory = 200 * 1024 * 1024; // 200MB
                }

                set(key, data, priority = 1) {
                    if (this.cache.has(key)) {
                        this.evict(key);
                    }

                    while (this.cache.size >= this.maxSize || this.memoryUsage >= this.maxMemory) {
                        this.evictLRU();
                    }

                    const blob = new Blob([data]);
                    const blobUrl = URL.createObjectURL(blob);

                    this.cache.set(key, data);
                    this.blobUrls.set(key, blobUrl);
                    this.priorities.set(key, priority);
                    this.accessTimes.set(key, Date.now());
                    this.memoryUsage += data.byteLength;

                    return blobUrl;
                }

                get(key) {
                    if (this.cache.has(key)) {
                        this.accessTimes.set(key, Date.now());
                        return this.blobUrls.get(key);
                    }
                    return null;
                }

                evict(key) {
                    if (this.cache.has(key)) {
                        const data = this.cache.get(key);
                        const blobUrl = this.blobUrls.get(key);

                        if (blobUrl) {
                            URL.revokeObjectURL(blobUrl);
                        }

                        this.cache.delete(key);
                        this.blobUrls.delete(key);
                        this.priorities.delete(key);
                        this.accessTimes.delete(key);
                        this.memoryUsage -= data.byteLength;
                    }
                }

                evictLRU() {
                    let oldestKey = null;
                    let oldestTime = Date.now();
                    let lowestPriority = Infinity;

                    for (const [key, time] of this.accessTimes.entries()) {
                        const priority = this.priorities.get(key) || 1;

                        if (priority < lowestPriority || (priority === lowestPriority && time < oldestTime)) {
                            oldestTime = time;
                            oldestKey = key;
                            lowestPriority = priority;
                        }
                    }

                    if (oldestKey) {
                        this.evict(oldestKey);
                    }
                }

                getStats() {
                    return {
                        size: this.cache.size,
                        maxSize: this.maxSize,
                        memoryUsage: this.memoryUsage,
                        maxMemory: this.maxMemory,
                        hitRate: this.hitRate || 0
                    };
                }
            }

            // === 預測性載入管理器 ===
            class PredictiveLoader {
                constructor() {
                    this.viewportTracker = new Map();
                    this.scrollVelocity = 0;
                    this.lastScrollTime = 0;
                    this.lastScrollPosition = 0;
                    this.loadQueue = [];
                    this.isProcessing = false;
                    this.setupScrollTracking();
                }

                setupScrollTracking() {
                    let scrollTimeout;

                    window.addEventListener('scroll', () => {
                        const now = Date.now();
                        const currentPosition = window.scrollY;

                        if (this.lastScrollTime > 0) {
                            const timeDelta = now - this.lastScrollTime;
                            const positionDelta = currentPosition - this.lastScrollPosition;
                            this.scrollVelocity = Math.abs(positionDelta / timeDelta);
                        }

                        this.lastScrollTime = now;
                        this.lastScrollPosition = currentPosition;

                        clearTimeout(scrollTimeout);
                        scrollTimeout = setTimeout(() => {
                            this.scrollVelocity = 0;
                            this.predictAndLoad();
                        }, 150);
                    }, { passive: true });
                }

                predictAndLoad() {
                    const images = document.querySelectorAll('img[data-needs-mse-decrypt]:not(.mse-decrypted)');
                    const predictions = [];

                    images.forEach(img => {
                        const rect = img.getBoundingClientRect();
                        const distanceFromViewport = Math.max(0, rect.top - window.innerHeight);

                        // 根據滾動速度調整預載入範圍
                        const adjustedRange = CONFIG.PRELOAD_RANGE * (1 + this.scrollVelocity * 0.1);
                        const predictedViewTime = distanceFromViewport / (this.scrollVelocity * 16 + 50);

                        if (predictedViewTime < adjustedRange * 1000) {
                            const priority = Math.max(1, 5 - Math.floor(predictedViewTime / 200));
                            predictions.push({ img, priority, predictedTime: predictedViewTime });
                        }
                    });

                    // 按預測時間排序並加入載入佇列
                    predictions
                        .sort((a, b) => a.predictedTime - b.predictedTime)
                        .forEach(prediction => {
                            this.queueLoad(prediction.img, prediction.priority);
                        });
                }

                queueLoad(img, priority) {
                    const src = img.getAttribute('data-original-src') || img.src;
                    if (!src || this.loadQueue.some(item => item.src === src)) {
                        return;
                    }

                    this.loadQueue.push({ img, src, priority, timestamp: Date.now() });
                    this.loadQueue.sort((a, b) => b.priority - a.priority);

                    if (!this.isProcessing) {
                        this.processQueue();
                    }
                }

                async processQueue() {
                    this.isProcessing = true;

                    while (this.loadQueue.length > 0) {
                        const concurrentTasks = [];
                        const maxConcurrent = Math.min(CONFIG.MAX_CONCURRENT_DECRYPT, this.loadQueue.length);

                        for (let i = 0; i < maxConcurrent; i++) {
                            const task = this.loadQueue.shift();
                            if (task) {
                                concurrentTasks.push(this.processTask(task));
                            }
                        }

                        if (concurrentTasks.length > 0) {
                            await Promise.allSettled(concurrentTasks);
                        }

                        // 避免阻塞主線程
                        await new Promise(resolve => setTimeout(resolve, 1));
                    }

                    this.isProcessing = false;
                }

                async processTask(task) {
                    const { img, src, priority } = task;

                    try {
                        const blobUrl = await decryptImageUltraFast(src, priority);

                        if (blobUrl && img.parentNode) {
                            img.src = blobUrl;
                            img.classList.add('mse-decrypted');
                            img.classList.remove('loading', 'decrypting');

                            const thumbnail = img.closest('.thumbnail');
                            if (thumbnail) {
                                thumbnail.classList.add('loaded');
                                thumbnail.classList.remove('loading');
                            }

                        }
                    } catch (error) {
                        img.classList.add('decrypt-error');
                    }
                }
            }

            // === 全域實例 ===
            const hybridEngine = new HybridDecryptionEngine();
            const smartCache = new SmartDecryptCache();
            const predictiveLoader = new PredictiveLoader();

            // === 超高效能解密函數 ===
            async function decryptImageUltraFast(src, priority = 1) {
                const startTime = Date.now();

                // 🔥 CRITICAL: 驗證src路徑，防止null請求
                if (!src || src.includes('null') || src === 'null') {
                    console.warn('🚫 阻止解密無效src路徑:', src);
                    throw new Error('Invalid src path: ' + src);
                }

                // 檢查快取
                const cached = smartCache.get(src);
                if (cached) {
                    return cached;
                }

                try {
                    // 高優先級請求使用 fetch 優化
                    const fetchOptions = {
                        method: 'GET',
                        cache: priority > 3 ? 'force-cache' : 'default',
                        priority: priority > 3 ? 'high' : 'auto'
                    };

                    const response = await fetch(src, fetchOptions);
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }

                    const encryptedData = new Uint8Array(await response.arrayBuffer());

                    // 使用混合解密引擎 (自動選擇 Worker 或主線程)
                    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                    const decryptedData = await hybridEngine.decrypt(encryptedData, taskId);

                    // 存入快取並返回 Blob URL
                    const blobUrl = smartCache.set(src, decryptedData, priority);

                    const totalTime = Date.now() - startTime;

                    return blobUrl;

                } catch (error) {
                    throw error;
                }
            }

            // === 智能圖片觀察器 ===
            function setupIntelligentImageObserver() {
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const img = entry.target;
                            const src = img.getAttribute('data-original-src') || img.src;

                            if (src && !img.classList.contains('mse-decrypted')) {
                                // 高優先級立即解密
                                img.classList.add('decrypting');

                                decryptImageUltraFast(src, 5).then(blobUrl => {
                                    if (blobUrl) {
                                        img.src = blobUrl;
                                        img.classList.remove('decrypting');
                                        img.classList.add('mse-decrypted');

                                        const thumbnail = img.closest('.thumbnail');
                                        if (thumbnail) {
                                            thumbnail.classList.add('loaded');
                                        }
                                    }
                                }).catch(error => {
                                    img.classList.remove('decrypting');
                                    img.classList.add('decrypt-error');
                                });
                            }

                            observer.unobserve(img);
                        }
                    });
                }, {
                    root: null,
                    rootMargin: '100px',
                    threshold: 0.1
                });

                // 觀察所有需要解密的圖片
                document.querySelectorAll('img[data-needs-mse-decrypt]').forEach(img => {
                    observer.observe(img);
                });

                return observer;
            }

            // === 記憶體管理 ===
            function setupMemoryManagement() {
                setInterval(() => {
                    const stats = smartCache.getStats();
                    const memoryUsagePercent = (stats.memoryUsage / stats.maxMemory) * 100;

                    if (memoryUsagePercent > 80) {
                        // 強制清理一些快取
                        for (let i = 0; i < 5; i++) {
                            smartCache.evictLRU();
                        }
                    }

                    if (performance.memory) {
                        const jsHeapUsed = performance.memory.usedJSHeapSize / (1024 * 1024);
                        if (jsHeapUsed > 100) {
                        }
                    }
                }, CONFIG.MEMORY_CLEANUP_INTERVAL);
            }

            // === 效能監控 ===
            function setupPerformanceMonitoring() {
                let totalDecryptions = 0;
                let totalDecryptionTime = 0;
                let cacheHits = 0;

                const originalDecrypt = decryptImageUltraFast;
                window.decryptImageUltraFast = async function(src, priority) {
                    const startTime = Date.now();
                    const wasCached = smartCache.get(src) !== null;

                    const result = await originalDecrypt(src, priority);

                    if (wasCached) {
                        cacheHits++;
                    } else {
                        totalDecryptions++;
                        totalDecryptionTime += Date.now() - startTime;
                    }

                    return result;
                };

                window.getMSEStats = function() {
                    const engineStatus = hybridEngine.getStatus();
                    return {
                        totalDecryptions,
                        averageDecryptionTime: totalDecryptions > 0 ? totalDecryptionTime / totalDecryptions : 0,
                        cacheHitRate: (cacheHits / (cacheHits + totalDecryptions)) * 100,
                        cacheStats: smartCache.getStats(),
                        engineStatus: engineStatus,
                        workersAvailable: engineStatus.workersAvailable,
                        fallbackMode: engineStatus.fallbackMode
                    };
                };
            }

            // === 簡化圖片處理系統 ===
            function setupImageProcessing() {
                // 簡化圖片檢查，只處理核心功能
                const checkExistingImages = () => {
                    const needsDecrypt = document.querySelectorAll('img[data-needs-mse-decrypt="true"]:not([data-mse-fixed])');

                    needsDecrypt.forEach(async (img) => {
                        if (img.getAttribute('data-mse-fixed') === 'true' || img.classList.contains('mse-decrypted')) {
                            return;
                        }

                        const originalSrc = img.getAttribute('data-original-src');
                        await forceDecryptImage(img, originalSrc);
                    });
                };

                // 簡化解密函數，移除所有診斷和日誌
                const forceDecryptImage = async (img, path) => {
                    if (img.getAttribute('data-mse-fixed') === 'true' || img.classList.contains('mse-decrypted')) {
                        return;
                    }

                    // 🔥 CRITICAL: 驗證路徑，防止null請求
                    if (!path || path.includes('null') || path === 'null') {
                        console.warn('🚫 阻止fetch無效路徑:', path);
                        img.removeAttribute('data-needs-mse-decrypt');
                        img.removeAttribute('data-original-src');
                        img.setAttribute('data-mse-fixed', 'true');
                        return;
                    }

                    img.setAttribute('data-mse-processing', 'true');

                    try {
                        const response = await fetch(path);
                        if (!response.ok) {
                            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                        }

                        const arrayBuffer = await response.arrayBuffer();
                        const data = new Uint8Array(arrayBuffer);

                        // 快速MSE解密
                        const decrypted = new Uint8Array(data.length);
                        const offsetComplement = 256 - MSE_OFFSET;
                        for (let i = 0; i < data.length; i++) {
                            decrypted[i] = (data[i] + offsetComplement) & 255;
                        }

                        // 創建blob並設置
                        const blob = new Blob([decrypted], { type: 'image/jpeg' });
                        const blobUrl = URL.createObjectURL(blob);

                        img.src = blobUrl;
                        img.removeAttribute('data-needs-mse-decrypt');
                        img.removeAttribute('data-mse-processing');
                        img.setAttribute('data-mse-fixed', 'true');
                        img.classList.add('mse-decrypted');

                        // 添加到全域快取
                        if (typeof cacheImage === 'function') {
                            cacheImage(path, blobUrl);
                        }

                    } catch (error) {
                        img.removeAttribute('data-mse-processing');
                        img.src = path; // 回退
                    }
                };

                // 簡化定期檢查
                const checkInterval = setInterval(() => {
                    const hasUnprocessedImages = document.querySelectorAll('img[data-needs-mse-decrypt="true"]:not([data-mse-fixed]):not([data-mse-processing])').length > 0;
                    if (hasUnprocessedImages) {
                        checkExistingImages();
                    }
                }, 2000);

                window.forceMSEFix = checkExistingImages;
                setTimeout(checkExistingImages, 1000);
            }

            // === 初始化系統 ===
            function initializeUltraFastMSE() {

                setupIntelligentImageObserver();
                setupMemoryManagement();
                setupPerformanceMonitoring();
                setupImageProcessing();

                // 全域函數
                window.decryptImageUltraFast = decryptImageUltraFast;
                window.clearMSECache = () => {
                    smartCache.cache.clear();
                    smartCache.blobUrls.clear();
                    smartCache.priorities.clear();
                    smartCache.accessTimes.clear();
                    smartCache.memoryUsage = 0;
                };

                window.forcePredictiveLoad = () => {
                    predictiveLoader.predictAndLoad();
                };

                // 頁面卸載時清理
                window.addEventListener('beforeunload', () => {
                    hybridEngine.destroy();
                    smartCache.cache.clear();
                });


                // 立即開始預測性載入
                setTimeout(() => {
                    predictiveLoader.predictAndLoad();
                }, 500);
            }

            // === 啟動系統 ===
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', initializeUltraFastMSE);
            } else {
                initializeUltraFastMSE();
            }

        })();
    

// ========== 提取的腳本區塊 ==========

        // 🚀 超高效能 MSE 解密系統 - 無感載入版本
        (function() {
            'use strict';


            const MSE_OFFSET = 37;
            const GITHUB_BASE_URL = 'https://maso0310.github.io/memoir-developer-log/media/';

            // === 核心配置：針對無感體驗優化 ===
            const CONFIG = {
                MAX_CONCURRENT_DECRYPT: 8,        // 最大並行解密數
                CACHE_SIZE: 50,                   // 解密快取大小
                PRELOAD_RANGE: 3,                 // 預載入範圍
                CHUNK_SIZE: 64 * 1024,            // 分塊處理大小 (64KB)
                PRIORITY_BOOST_MS: 100,           // 優先級提升時間
                MEMORY_CLEANUP_INTERVAL: 30000,   // 記憶體清理間隔
                INSTANT_LOAD_THRESHOLD: 500,      // 即時載入閾值 (500ms)
            };

            // === 高效能解密引擎 (支援 Worker + 主線程備用) ===
            class HybridDecryptionEngine {
                constructor() {
                    this.workers = [];
                    this.workerCount = Math.min(4, navigator.hardwareConcurrency || 2);
                    this.taskQueue = [];
                    this.busyWorkers = new Set();
                    this.workersAvailable = false;
                    this.fallbackMode = false;
                    this.initWorkers();
                }

                initWorkers() {
                    const workerCode = `
                        self.onmessage = function(e) {
                            const { data, offset, taskId } = e.data;

                            try {
                                // 高度優化的位元組解密
                                const result = new Uint8Array(data.length);
                                const offsetComplement = 256 - offset;

                                // 使用 32-bit 批次處理來提高效能
                                let i = 0;
                                const len = data.length;

                                // 4 字節批次處理
                                for (; i < len - 3; i += 4) {
                                    result[i] = (data[i] + offsetComplement) & 255;
                                    result[i + 1] = (data[i + 1] + offsetComplement) & 255;
                                    result[i + 2] = (data[i + 2] + offsetComplement) & 255;
                                    result[i + 3] = (data[i + 3] + offsetComplement) & 255;
                                }

                                // 處理剩餘字節
                                for (; i < len; i++) {
                                    result[i] = (data[i] + offsetComplement) & 255;
                                }

                                self.postMessage({ taskId, result, success: true });
                            } catch (error) {
                                self.postMessage({ taskId, error: error.message, success: false });
                            }
                        };
                    `;

                    // 嘗試創建 Web Workers
                    try {
                        for (let i = 0; i < this.workerCount; i++) {
                            const blob = new Blob([workerCode], { type: 'application/javascript' });
                            const worker = new Worker(URL.createObjectURL(blob));

                            worker.onmessage = (e) => this.handleWorkerMessage(e, worker);
                            worker.onerror = (error) => {
                                    this.enableFallbackMode();
                            };

                            this.workers.push(worker);
                        }

                        if (this.workers.length > 0) {
                            this.workersAvailable = true;
                        }
                    } catch (error) {
                        this.enableFallbackMode();
                    }
                }

                enableFallbackMode() {
                    this.fallbackMode = true;
                    this.workersAvailable = false;
                    this.workers.forEach(worker => {
                        try {
                            worker.terminate();
                        } catch (e) {
                            // 忽略終止錯誤
                        }
                    });
                    this.workers = [];
                }

                // 主線程高效能解密函數
                decryptOnMainThread(data) {
                    const result = new Uint8Array(data.length);
                    const offsetComplement = 256 - MSE_OFFSET;

                    // 使用相同的32-bit批次處理優化
                    let i = 0;
                    const len = data.length;

                    // 4 字節批次處理
                    for (; i < len - 3; i += 4) {
                        result[i] = (data[i] + offsetComplement) & 255;
                        result[i + 1] = (data[i + 1] + offsetComplement) & 255;
                        result[i + 2] = (data[i + 2] + offsetComplement) & 255;
                        result[i + 3] = (data[i + 3] + offsetComplement) & 255;
                    }

                    // 處理剩餘字節
                    for (; i < len; i++) {
                        result[i] = (data[i] + offsetComplement) & 255;
                    }

                    return result;
                }

                async decrypt(data, taskId) {
                    // 如果在備用模式，直接使用主線程解密
                    if (this.fallbackMode || !this.workersAvailable) {
                        try {
                            const result = this.decryptOnMainThread(data);
                            return result;
                        } catch (error) {
                            throw error;
                        }
                    }

                    // 使用 Worker 解密
                    return new Promise((resolve, reject) => {
                        this.taskQueue.push({ data, taskId, resolve, reject });
                        this.processQueue();
                    });
                }

                processQueue() {
                    if (this.fallbackMode || !this.workersAvailable) {
                        // 在備用模式下，處理所有待處理任務
                        while (this.taskQueue.length > 0) {
                            const task = this.taskQueue.shift();
                            try {
                                const result = this.decryptOnMainThread(task.data);
                                task.resolve(result);
                            } catch (error) {
                                task.reject(error);
                            }
                        }
                        return;
                    }

                    while (this.taskQueue.length > 0 && this.busyWorkers.size < this.workerCount) {
                        const task = this.taskQueue.shift();
                        const worker = this.workers.find(w => !this.busyWorkers.has(w));

                        if (worker) {
                            this.busyWorkers.add(worker);
                            worker.currentTask = task;
                            worker.postMessage({
                                data: task.data,
                                offset: MSE_OFFSET,
                                taskId: task.taskId
                            });
                        } else {
                            this.taskQueue.unshift(task);
                            break;
                        }
                    }
                }

                handleWorkerMessage(e, worker) {
                    const { taskId, result, success, error } = e.data;
                    const task = worker.currentTask;

                    this.busyWorkers.delete(worker);
                    worker.currentTask = null;

                    if (success) {
                        task.resolve(result);
                    } else {
                        // Worker 失敗時切換到備用模式
                        this.enableFallbackMode();

                        // 重新處理失敗的任務
                        try {
                            const result = this.decryptOnMainThread(task.data);
                            task.resolve(result);
                        } catch (fallbackError) {
                            task.reject(new Error(`Worker 和主線程解密都失敗: ${error}, ${fallbackError.message}`));
                        }
                    }

                    this.processQueue();
                }

                destroy() {
                    this.workers.forEach(worker => {
                        try {
                            worker.terminate();
                        } catch (e) {
                            // 忽略終止錯誤
                        }
                    });
                    this.workers = [];
                    this.taskQueue = [];
                    this.busyWorkers.clear();
                    this.workersAvailable = false;
                    this.fallbackMode = false;
                }

                getStatus() {
                    return {
                        workersAvailable: this.workersAvailable,
                        fallbackMode: this.fallbackMode,
                        workerCount: this.workers.length,
                        queueLength: this.taskQueue.length,
                        busyWorkers: this.busyWorkers.size
                    };
                }
            }

            // === 智能快取系統 ===
            class SmartDecryptCache {
                constructor() {
                    this.cache = new Map();
                    this.priorities = new Map();
                    this.accessTimes = new Map();
                    this.blobUrls = new Map();
                    this.maxSize = CONFIG.CACHE_SIZE;
                    this.memoryUsage = 0;
                    this.maxMemory = 200 * 1024 * 1024; // 200MB
                }

                set(key, data, priority = 1) {
                    if (this.cache.has(key)) {
                        this.evict(key);
                    }

                    while (this.cache.size >= this.maxSize || this.memoryUsage >= this.maxMemory) {
                        this.evictLRU();
                    }

                    const blob = new Blob([data]);
                    const blobUrl = URL.createObjectURL(blob);

                    this.cache.set(key, data);
                    this.blobUrls.set(key, blobUrl);
                    this.priorities.set(key, priority);
                    this.accessTimes.set(key, Date.now());
                    this.memoryUsage += data.byteLength;

                    return blobUrl;
                }

                get(key) {
                    if (this.cache.has(key)) {
                        this.accessTimes.set(key, Date.now());
                        return this.blobUrls.get(key);
                    }
                    return null;
                }

                evict(key) {
                    if (this.cache.has(key)) {
                        const data = this.cache.get(key);
                        const blobUrl = this.blobUrls.get(key);

                        if (blobUrl) {
                            URL.revokeObjectURL(blobUrl);
                        }

                        this.cache.delete(key);
                        this.blobUrls.delete(key);
                        this.priorities.delete(key);
                        this.accessTimes.delete(key);
                        this.memoryUsage -= data.byteLength;
                    }
                }

                evictLRU() {
                    let oldestKey = null;
                    let oldestTime = Date.now();
                    let lowestPriority = Infinity;

                    for (const [key, time] of this.accessTimes.entries()) {
                        const priority = this.priorities.get(key) || 1;

                        if (priority < lowestPriority || (priority === lowestPriority && time < oldestTime)) {
                            oldestTime = time;
                            oldestKey = key;
                            lowestPriority = priority;
                        }
                    }

                    if (oldestKey) {
                        this.evict(oldestKey);
                    }
                }

                getStats() {
                    return {
                        size: this.cache.size,
                        maxSize: this.maxSize,
                        memoryUsage: this.memoryUsage,
                        maxMemory: this.maxMemory,
                        hitRate: this.hitRate || 0
                    };
                }
            }

            // === 預測性載入管理器 ===
            class PredictiveLoader {
                constructor() {
                    this.viewportTracker = new Map();
                    this.scrollVelocity = 0;
                    this.lastScrollTime = 0;
                    this.lastScrollPosition = 0;
                    this.loadQueue = [];
                    this.isProcessing = false;
                    this.setupScrollTracking();
                }

                setupScrollTracking() {
                    let scrollTimeout;

                    window.addEventListener('scroll', () => {
                        const now = Date.now();
                        const currentPosition = window.scrollY;

                        if (this.lastScrollTime > 0) {
                            const timeDelta = now - this.lastScrollTime;
                            const positionDelta = currentPosition - this.lastScrollPosition;
                            this.scrollVelocity = Math.abs(positionDelta / timeDelta);
                        }

                        this.lastScrollTime = now;
                        this.lastScrollPosition = currentPosition;

                        clearTimeout(scrollTimeout);
                        scrollTimeout = setTimeout(() => {
                            this.scrollVelocity = 0;
                            this.predictAndLoad();
                        }, 150);
                    }, { passive: true });
                }

                predictAndLoad() {
                    const images = document.querySelectorAll('img[data-needs-mse-decrypt]:not(.mse-decrypted)');
                    const predictions = [];

                    images.forEach(img => {
                        const rect = img.getBoundingClientRect();
                        const distanceFromViewport = Math.max(0, rect.top - window.innerHeight);

                        // 根據滾動速度調整預載入範圍
                        const adjustedRange = CONFIG.PRELOAD_RANGE * (1 + this.scrollVelocity * 0.1);
                        const predictedViewTime = distanceFromViewport / (this.scrollVelocity * 16 + 50);

                        if (predictedViewTime < adjustedRange * 1000) {
                            const priority = Math.max(1, 5 - Math.floor(predictedViewTime / 200));
                            predictions.push({ img, priority, predictedTime: predictedViewTime });
                        }
                    });

                    // 按預測時間排序並加入載入佇列
                    predictions
                        .sort((a, b) => a.predictedTime - b.predictedTime)
                        .forEach(prediction => {
                            this.queueLoad(prediction.img, prediction.priority);
                        });
                }

                queueLoad(img, priority) {
                    const src = img.getAttribute('data-original-src') || img.src;
                    if (!src || this.loadQueue.some(item => item.src === src)) {
                        return;
                    }

                    this.loadQueue.push({ img, src, priority, timestamp: Date.now() });
                    this.loadQueue.sort((a, b) => b.priority - a.priority);

                    if (!this.isProcessing) {
                        this.processQueue();
                    }
                }

                async processQueue() {
                    this.isProcessing = true;

                    while (this.loadQueue.length > 0) {
                        const concurrentTasks = [];
                        const maxConcurrent = Math.min(CONFIG.MAX_CONCURRENT_DECRYPT, this.loadQueue.length);

                        for (let i = 0; i < maxConcurrent; i++) {
                            const task = this.loadQueue.shift();
                            if (task) {
                                concurrentTasks.push(this.processTask(task));
                            }
                        }

                        if (concurrentTasks.length > 0) {
                            await Promise.allSettled(concurrentTasks);
                        }

                        // 避免阻塞主線程
                        await new Promise(resolve => setTimeout(resolve, 1));
                    }

                    this.isProcessing = false;
                }

                async processTask(task) {
                    const { img, src, priority } = task;

                    try {
                        const blobUrl = await decryptImageUltraFast(src, priority);

                        if (blobUrl && img.parentNode) {
                            img.src = blobUrl;
                            img.classList.add('mse-decrypted');
                            img.classList.remove('loading', 'decrypting');

                            const thumbnail = img.closest('.thumbnail');
                            if (thumbnail) {
                                thumbnail.classList.add('loaded');
                                thumbnail.classList.remove('loading');
                            }

                        }
                    } catch (error) {
                        img.classList.add('decrypt-error');
                    }
                }
            }

            // === 全域實例 ===
            const hybridEngine = new HybridDecryptionEngine();
            const smartCache = new SmartDecryptCache();
            const predictiveLoader = new PredictiveLoader();

            // === 超高效能解密函數 ===
            async function decryptImageUltraFast(src, priority = 1) {
                const startTime = Date.now();

                // 🔥 CRITICAL: 驗證src路徑，防止null請求
                if (!src || src.includes('null') || src === 'null') {
                    console.warn('🚫 阻止解密無效src路徑:', src);
                    throw new Error('Invalid src path: ' + src);
                }

                // 檢查快取
                const cached = smartCache.get(src);
                if (cached) {
                    return cached;
                }

                try {
                    // 高優先級請求使用 fetch 優化
                    const fetchOptions = {
                        method: 'GET',
                        cache: priority > 3 ? 'force-cache' : 'default',
                        priority: priority > 3 ? 'high' : 'auto'
                    };

                    const response = await fetch(src, fetchOptions);
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }

                    const encryptedData = new Uint8Array(await response.arrayBuffer());

                    // 使用混合解密引擎 (自動選擇 Worker 或主線程)
                    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                    const decryptedData = await hybridEngine.decrypt(encryptedData, taskId);

                    // 存入快取並返回 Blob URL
                    const blobUrl = smartCache.set(src, decryptedData, priority);

                    const totalTime = Date.now() - startTime;

                    return blobUrl;

                } catch (error) {
                    throw error;
                }
            }

            // === 智能圖片觀察器 ===
            function setupIntelligentImageObserver() {
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const img = entry.target;
                            const src = img.getAttribute('data-original-src') || img.src;

                            if (src && !img.classList.contains('mse-decrypted')) {
                                // 高優先級立即解密
                                img.classList.add('decrypting');

                                decryptImageUltraFast(src, 5).then(blobUrl => {
                                    if (blobUrl) {
                                        img.src = blobUrl;
                                        img.classList.remove('decrypting');
                                        img.classList.add('mse-decrypted');

                                        const thumbnail = img.closest('.thumbnail');
                                        if (thumbnail) {
                                            thumbnail.classList.add('loaded');
                                        }
                                    }
                                }).catch(error => {
                                    img.classList.remove('decrypting');
                                    img.classList.add('decrypt-error');
                                });
                            }

                            observer.unobserve(img);
                        }
                    });
                }, {
                    root: null,
                    rootMargin: '100px',
                    threshold: 0.1
                });

                // 觀察所有需要解密的圖片
                document.querySelectorAll('img[data-needs-mse-decrypt]').forEach(img => {
                    observer.observe(img);
                });

                return observer;
            }

            // === 記憶體管理 ===
            function setupMemoryManagement() {
                setInterval(() => {
                    const stats = smartCache.getStats();
                    const memoryUsagePercent = (stats.memoryUsage / stats.maxMemory) * 100;

                    if (memoryUsagePercent > 80) {
                        // 強制清理一些快取
                        for (let i = 0; i < 5; i++) {
                            smartCache.evictLRU();
                        }
                    }

                    if (performance.memory) {
                        const jsHeapUsed = performance.memory.usedJSHeapSize / (1024 * 1024);
                        if (jsHeapUsed > 100) {
                        }
                    }
                }, CONFIG.MEMORY_CLEANUP_INTERVAL);
            }

            // === 效能監控 ===
            function setupPerformanceMonitoring() {
                let totalDecryptions = 0;
                let totalDecryptionTime = 0;
                let cacheHits = 0;

                const originalDecrypt = decryptImageUltraFast;
                window.decryptImageUltraFast = async function(src, priority) {
                    const startTime = Date.now();
                    const wasCached = smartCache.get(src) !== null;

                    const result = await originalDecrypt(src, priority);

                    if (wasCached) {
                        cacheHits++;
                    } else {
                        totalDecryptions++;
                        totalDecryptionTime += Date.now() - startTime;
                    }

                    return result;
                };

                window.getMSEStats = function() {
                    const engineStatus = hybridEngine.getStatus();
                    return {
                        totalDecryptions,
                        averageDecryptionTime: totalDecryptions > 0 ? totalDecryptionTime / totalDecryptions : 0,
                        cacheHitRate: (cacheHits / (cacheHits + totalDecryptions)) * 100,
                        cacheStats: smartCache.getStats(),
                        engineStatus: engineStatus,
                        workersAvailable: engineStatus.workersAvailable,
                        fallbackMode: engineStatus.fallbackMode
                    };
                };
            }

            // === 簡化圖片處理系統 ===
            function setupImageProcessing() {
                // 簡化圖片檢查，只處理核心功能
                const checkExistingImages = () => {
                    const needsDecrypt = document.querySelectorAll('img[data-needs-mse-decrypt="true"]:not([data-mse-fixed])');

                    needsDecrypt.forEach(async (img) => {
                        if (img.getAttribute('data-mse-fixed') === 'true' || img.classList.contains('mse-decrypted')) {
                            return;
                        }

                        const originalSrc = img.getAttribute('data-original-src');
                        await forceDecryptImage(img, originalSrc);
                    });
                };

                // 簡化解密函數，移除所有診斷和日誌
                const forceDecryptImage = async (img, path) => {
                    if (img.getAttribute('data-mse-fixed') === 'true' || img.classList.contains('mse-decrypted')) {
                        return;
                    }

                    // 🔥 CRITICAL: 驗證路徑，防止null請求
                    if (!path || path.includes('null') || path === 'null') {
                        console.warn('🚫 阻止fetch無效路徑:', path);
                        img.removeAttribute('data-needs-mse-decrypt');
                        img.removeAttribute('data-original-src');
                        img.setAttribute('data-mse-fixed', 'true');
                        return;
                    }

                    img.setAttribute('data-mse-processing', 'true');

                    try {
                        const response = await fetch(path);
                        if (!response.ok) {
                            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                        }

                        const arrayBuffer = await response.arrayBuffer();
                        const data = new Uint8Array(arrayBuffer);

                        // 快速MSE解密
                        const decrypted = new Uint8Array(data.length);
                        const offsetComplement = 256 - MSE_OFFSET;
                        for (let i = 0; i < data.length; i++) {
                            decrypted[i] = (data[i] + offsetComplement) & 255;
                        }

                        // 創建blob並設置
                        const blob = new Blob([decrypted], { type: 'image/jpeg' });
                        const blobUrl = URL.createObjectURL(blob);

                        img.src = blobUrl;
                        img.removeAttribute('data-needs-mse-decrypt');
                        img.removeAttribute('data-mse-processing');
                        img.setAttribute('data-mse-fixed', 'true');
                        img.classList.add('mse-decrypted');

                        // 添加到全域快取
                        if (typeof cacheImage === 'function') {
                            cacheImage(path, blobUrl);
                        }

                    } catch (error) {
                        img.removeAttribute('data-mse-processing');
                        img.src = path; // 回退
                    }
                };

                // 簡化定期檢查
                const checkInterval = setInterval(() => {
                    const hasUnprocessedImages = document.querySelectorAll('img[data-needs-mse-decrypt="true"]:not([data-mse-fixed]):not([data-mse-processing])').length > 0;
                    if (hasUnprocessedImages) {
                        checkExistingImages();
                    }
                }, 2000);

                window.forceMSEFix = checkExistingImages;
                setTimeout(checkExistingImages, 1000);
            }

            // === 初始化系統 ===
            function initializeUltraFastMSE() {

                setupIntelligentImageObserver();
                setupMemoryManagement();
                setupPerformanceMonitoring();
                setupImageProcessing();

                // 全域函數
                window.decryptImageUltraFast = decryptImageUltraFast;
                window.clearMSECache = () => {
                    smartCache.cache.clear();
                    smartCache.blobUrls.clear();
                    smartCache.priorities.clear();
                    smartCache.accessTimes.clear();
                    smartCache.memoryUsage = 0;
                };

                window.forcePredictiveLoad = () => {
                    predictiveLoader.predictAndLoad();
                };

                // 頁面卸載時清理
                window.addEventListener('beforeunload', () => {
                    hybridEngine.destroy();
                    smartCache.cache.clear();
                });


                // 立即開始預測性載入
                setTimeout(() => {
                    predictiveLoader.predictAndLoad();
                }, 500);
            }

            // === 啟動系統 ===
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', initializeUltraFastMSE);
            } else {
                initializeUltraFastMSE();
            }

        })();
    


// MemoirFlow 加密回憶錄主腳本
// 回憶錄ID: 4548b929-5c16-4ee7-a189-60679e2165be
// 生成時間: 2025-09-14T06:55:47.796892900+00:00

// ========== 提取的腳本區塊 ==========

        // 全局變數
        let MEMOIR_DATA = null;
        let currentEventIndex = 0;
        let currentMediaIndex = 0;
        let currentLightboxMediaIndex = 0;
        let isDecrypting = false;
        let isTypewriterEnabled = true;
        // 從localStorage載入打字速度設定，預設為25
        let typingSpeed = parseInt(localStorage.getItem('memoirflow:typing-speed')) || 25;
        let fontSize = 1.1;
        let isMenuOpen = false;
        let isThumbnailsVisible = false;
        let isFontSizeMenuOpen = false;
        let isTypewriterMenuOpen = false;
        let isLightboxOpen = false;
        let isSubtitleVisible = true;
        let areControlsHidden = false;
        let isDateHidden = false;

        // DOM 元素緩存
        const elements = {
            loadingScreen: document.getElementById('loadingScreen'),
            app: document.getElementById('app'),
            mediaDisplay: document.getElementById('mediaDisplay'),
            eventDescription: document.getElementById('eventDescription'),
            timeline: document.getElementById('timeline'),
            currentEventDate: document.getElementById('currentEventDate'),
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
            hideControlsBtn: document.getElementById('hideControlsBtn'),
            hideDateBtn: document.getElementById('hideDateBtn'),
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
        let typewriterTimeout;
        let isTimelineCollapsed = false;
        let touchStartX = 0;
        let touchStartY = 0;

        // 打字機動畫效果 - 支援速度調整
        function typewriterEffect(element, text, speed = typingSpeed) {
            if (!element || !text) return Promise.resolve();
            
            return new Promise(resolve => {
                element.textContent = '';
                element.classList.add('typewriter', 'typewriter-cursor');
                
                let index = 0;
                const timer = setInterval(() => {
                    if (index < text.length) {
                        element.textContent += text.charAt(index);
                        index++;
                    } else {
                        clearInterval(timer);
                        element.classList.remove('typewriter-cursor');
                        resolve();
                    }
                }, speed);
                
                // 點擊跳過打字機效果
                const skipTyping = () => {
                    clearInterval(timer);
                    element.textContent = text;
                    element.classList.remove('typewriter-cursor');
                    element.removeEventListener('click', skipTyping);
                    resolve();
                };
                
                element.addEventListener('click', skipTyping, { once: true });
                typewriterTimeout = timer;
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

        // 滑動轉場效果
        function slideTransition(element, direction = 'right', callback) {
            if (!element) return Promise.resolve();
            
            return new Promise(resolve => {
                const slideClass = direction === 'right' ? 'slide-in-right' : 'slide-in-left';
                
                if (callback) callback();
                
                element.classList.add(slideClass);
                
                setTimeout(() => {
                    element.classList.remove(slideClass);
                    resolve();
                }, 600);
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
                    <div style="font-size: 0.9rem; font-weight: 600; color: #e5e7eb; margin-bottom: 0.25rem;">
                        ${title}
                    </div>
                    ${date ? `<div style="font-size: 0.75rem; color: #60a5fa; margin-bottom: 0.25rem;">${date}</div>` : ''}
                    <div style="font-size: 0.7rem; color: #9ca3af; line-height: 1.2;">
                        ${event.description ? event.description.substring(0, 50) + '...' : ''}
                    </div>
                `;
                
                item.addEventListener('click', () => {
                    if (index !== currentEventIndex) {
                        jumpToEvent(index);
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
            currentEventIndex = eventIndex;
            currentMediaIndex = 0; // 重設媒體索引
            
            // 更新時間軸選中狀態
            const timelineItems = elements.timeline.querySelectorAll('.timeline-item');
            timelineItems.forEach((item, index) => {
                item.classList.toggle('active', index === currentEventIndex);
            });
            
            // 使用滑動轉場效果（非阻塞）
            slideTransition(elements.descriptionContainer, direction, () => {
                loadEvent();
                // 確保縮圖列也更新
                setTimeout(() => {
                    renderThumbnails();
                }, 100);
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
                // 添加燈箱點擊事件
                mediaElement.style.cursor = 'pointer';
                mediaElement.addEventListener('click', () => {
                    openLightbox(mediaElement);
                });
                
                elements.mediaDisplay.appendChild(mediaElement);
            }
        }

        // 快速渲染縮圖
        function renderThumbnails() {
            const currentEvent = getCurrentEvent();
            
            // 根據縮圖列開關狀態決定是否顯示
            if (!isThumbnailsVisible) {
                if (elements.thumbnailsContainer) {
                    elements.thumbnailsContainer.classList.remove('visible');
                }
                return;
            }
            
            if (!elements.thumbnails) return; // 防止 null 錯誤

            // 清空現有內容
            elements.thumbnails.innerHTML = '';
            
            // 如果沒有媒體，顯示提示訊息
            if (!currentEvent?.media || currentEvent.media.length === 0) {
                const noMediaDiv = document.createElement('div');
                noMediaDiv.className = 'no-media-message';
                noMediaDiv.textContent = '此事件沒有媒體檔案';
                noMediaDiv.style.cssText = 'color: #9ca3af; font-size: 0.8rem; padding: 1rem; text-align: center;';
                elements.thumbnails.appendChild(noMediaDiv);
                
                // 仍然顯示縮圖列
                if (elements.thumbnailsContainer) {
                    elements.thumbnailsContainer.classList.add('visible');
                }
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
                } else if (media.type === 'video' || media.media_type === 'video') {
                    // 對於影片，也可以顯示縮圖
                    const videoIcon = document.createElement('div');
                    videoIcon.innerHTML = '🎥';
                    videoIcon.style.cssText = 'display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; font-size: 20px;';
                    thumbnail.appendChild(videoIcon);
                }
                
                // 點擊事件
                thumbnail.addEventListener('click', () => {
                    currentMediaIndex = index;
                    displayMedia(); // 直接更新媒體顯示
                    renderThumbnails(); // 重新渲染縮圖以更新活動狀態
                    updateNavigationButtons();
                });
                
                fragment.appendChild(thumbnail);
            });
            
            elements.thumbnails.appendChild(fragment);
            
            // 顯示縮圖列
            if (elements.thumbnailsContainer) {
                elements.thumbnailsContainer.classList.add('visible');
            }
            
            // 觸發重新解密
            setTimeout(quickDecryptMedia, 100);
        }

        // 快速載入事件（優化性能，異步執行）
        function loadEvent() {
            const currentEvent = getCurrentEvent();
            if (!currentEvent) return;

            // 更新導航按鈕
            updateNavigationButtons();

            // 更新日期顯示
            if (elements.currentEventDate) {
                if (currentEvent.date) {
                    console.log('🗓️ 更新日期顯示:', currentEvent.date);
                    const date = new Date(currentEvent.date);
                    const formattedDate = date.toLocaleDateString('zh-TW', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });
                    elements.currentEventDate.textContent = formattedDate;
                } else {
                    console.log('⚠️ currentEvent.date 不存在:', currentEvent);
                    elements.currentEventDate.textContent = '日期未設定';
                }
            } else {
                console.log('⚠️ elements.currentEventDate 元素不存在');
            }

            // 立即載入媒體（不等待文字動畫）
            fadeTransition(elements.mediaDisplay, () => {
                displayMedia();
            });
            
            // 確保縮圖列總是根據當前事件更新
            renderThumbnails();
            renderTimeline();
            
            // 立即開始解密（與文字動畫並行）
            setTimeout(quickDecryptMedia, 10);

            // 文字動畫與媒體載入並行執行
            const description = currentEvent.description || '';
            if (description && elements.eventDescription) {
                // 清除之前的打字機效果
                if (typewriterTimeout) {
                    clearInterval(typewriterTimeout);
                }
                // 根據設置決定是否使用打字機效果
                if (isTypewriterEnabled) {
                    typewriterEffect(elements.eventDescription, description, typingSpeed);
                } else {
                    elements.eventDescription.textContent = description;
                }
            } else if (elements.eventDescription) {
                elements.eventDescription.textContent = '';
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
                }
            });
        }

        if (elements.nextEventBtn) {
            elements.nextEventBtn.addEventListener('click', () => {
                if (currentEventIndex < MEMOIR_DATA.timeline_events.length - 1) {
                    jumpToEvent(currentEventIndex + 1);
                }
            });
        }

        if (elements.prevMediaBtn) {
            elements.prevMediaBtn.addEventListener('click', () => {
                const currentEvent = getCurrentEvent();
                if (currentEvent?.media && currentMediaIndex > 0) {
                    currentMediaIndex--;
                    slideTransition(elements.mediaDisplay, 'left', () => {
                        displayMedia();
                        renderThumbnails();
                        updateNavigationButtons();
                    });
                }
            });
        }

        if (elements.nextMediaBtn) {
            elements.nextMediaBtn.addEventListener('click', () => {
                const currentEvent = getCurrentEvent();
                if (currentEvent?.media && currentMediaIndex < currentEvent.media.length - 1) {
                    currentMediaIndex++;
                    slideTransition(elements.mediaDisplay, 'right', () => {
                        displayMedia();
                        renderThumbnails();
                        updateNavigationButtons();
                    });
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
                    ? 'rgba(59, 130, 246, 0.8)'
                    : 'rgba(107, 114, 128, 0.8)';
            }

            // 根據縮圖列狀態更新日期顯示位置
            updateDatePosition();

            // 如果開啟縮圖列，立即重新渲染
            if (isThumbnailsVisible) {
                renderThumbnails();
            }

            // 不關閉選單，讓用戶可以繼續調整
        }
        
        function toggleTypewriterSpeedMenu() {
            isTypewriterMenuOpen = !isTypewriterMenuOpen;
            if (elements.typewriterSpeedDropdown) {
                elements.typewriterSpeedDropdown.classList.toggle('open', isTypewriterMenuOpen);
            }
        }

        function closeTypewriterSpeedMenu() {
            isTypewriterMenuOpen = false;
            if (elements.typewriterSpeedDropdown) {
                elements.typewriterSpeedDropdown.classList.remove('open');
            }
        }

        function toggleTypewriter() {
            isTypewriterEnabled = !isTypewriterEnabled;

            // 更新主按鈕外觀
            if (elements.typewriterToggleBtn) {
                elements.typewriterToggleBtn.style.background = isTypewriterEnabled
                    ? 'rgba(59, 130, 246, 0.8)'
                    : 'rgba(107, 114, 128, 0.8)';
            }
        }

        function setTypingSpeed(speed) {
            typingSpeed = parseInt(speed);

            // 儲存到localStorage，實現全域速度設定
            localStorage.setItem('memoirflow:typing-speed', typingSpeed);

            // 更新速度按鈕活動狀態
            document.querySelectorAll('.speed-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            document.querySelector(`[data-speed="${speed}"]`).classList.add('active');

            // 立即應用新速度到當前打字機效果
            if (isTypewriterEnabled && typewriterTimeout) {
                const currentEvent = getCurrentEvent();
                if (currentEvent?.description && elements.eventDescription) {
                    clearInterval(typewriterTimeout);
                    typewriterEffect(elements.eventDescription, currentEvent.description, typingSpeed);
                }
            }
        }

        function initializeTypingSpeedButtons() {
            // 根據當前typingSpeed設定對應的按鈕為活動狀態
            document.querySelectorAll('.speed-btn').forEach(btn => {
                btn.classList.remove('active');
                const btnSpeed = parseInt(btn.getAttribute('data-speed'));
                if (btnSpeed === typingSpeed) {
                    btn.classList.add('active');
                }
            });
        }

        function initializeHideButtons() {
            // 初始化隱藏畫面按鈕外觀
            if (elements.hideControlsBtn) {
                // 當控件可見時，按鈕應該顯示激活狀態（藍色）
                elements.hideControlsBtn.style.background = !areControlsHidden
                    ? 'rgba(59, 130, 246, 0.8)'
                    : 'rgba(107, 114, 128, 0.8)';

                const icon = elements.hideControlsBtn.querySelector('i[data-lucide]');
                if (icon) {
                    icon.setAttribute('data-lucide', areControlsHidden ? 'move-diagonal' : 'move');
                }
                elements.hideControlsBtn.title = areControlsHidden ? '顯示畫面按鈕' : '隱藏畫面按鈕';
            }

            // 初始化隱藏日期按鈕外觀
            if (elements.hideDateBtn) {
                // 當日期可見時，按鈕應該顯示激活狀態（藍色）
                elements.hideDateBtn.style.background = !isDateHidden
                    ? 'rgba(59, 130, 246, 0.8)'
                    : 'rgba(107, 114, 128, 0.8)';

                const icon = elements.hideDateBtn.querySelector('i[data-lucide]');
                if (icon) {
                    icon.setAttribute('data-lucide', isDateHidden ? 'calendar-x' : 'calendar-plus');
                }
                elements.hideDateBtn.title = isDateHidden ? '顯示日期標籤' : '隱藏日期標籤';
            }

            // 重新創建圖標
            if (window.lucide) {
                lucide.createIcons();
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
            }
            
            // 更新整體布局模式
            document.body.classList.toggle('subtitle-hidden-mode', !isSubtitleVisible);
            
            // 如果重新開啟字幕，重新啟動打字機效果
            if (isSubtitleVisible && isTypewriterEnabled) {
                const currentEvent = getCurrentEvent();
                if (currentEvent?.description && elements.eventDescription) {
                    // 清除之前的打字機效果
                    if (typewriterTimeout) {
                        clearInterval(typewriterTimeout);
                    }
                    // 重新啟動打字機效果
                    typewriterEffect(elements.eventDescription, currentEvent.description, typingSpeed);
                }
            } else if (isSubtitleVisible && !isTypewriterEnabled) {
                // 如果沒有打字機效果，直接顯示文字
                const currentEvent = getCurrentEvent();
                if (currentEvent?.description && elements.eventDescription) {
                    elements.eventDescription.textContent = currentEvent.description;
                }
            }
        }
        
        function toggleFontSizeMenu() {
            isFontSizeMenuOpen = !isFontSizeMenuOpen;
            if (elements.fontSizeDropdown) {
                elements.fontSizeDropdown.classList.toggle('open', isFontSizeMenuOpen);
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

            // 也隱藏字幕開關按鈕
            if (elements.subtitleToggleBtn) {
                elements.subtitleToggleBtn.style.opacity = areControlsHidden ? '0' : '';
                elements.subtitleToggleBtn.style.visibility = areControlsHidden ? 'hidden' : '';
                elements.subtitleToggleBtn.style.pointerEvents = areControlsHidden ? 'none' : '';
            }

            // 更新按鈕外觀和圖標
            if (elements.hideControlsBtn) {
                // 當控件可見時，按鈕應該顯示激活狀態（藍色）
                elements.hideControlsBtn.style.background = !areControlsHidden
                    ? 'rgba(59, 130, 246, 0.8)'
                    : 'rgba(107, 114, 128, 0.8)';

                const icon = elements.hideControlsBtn.querySelector('i[data-lucide]');
                if (icon) {
                    icon.setAttribute('data-lucide', areControlsHidden ? 'move-diagonal' : 'move');
                    lucide.createIcons();
                }
                elements.hideControlsBtn.title = areControlsHidden ? '顯示畫面按鈕' : '隱藏畫面按鈕';
            }
        }

        function toggleDateDisplay() {
            isDateHidden = !isDateHidden;

            // 切換日期顯示
            const currentDateDisplay = document.getElementById('currentDateDisplay');
            if (currentDateDisplay) {
                currentDateDisplay.classList.toggle('date-hidden', isDateHidden);
            }

            // 更新按鈕外觀和圖標
            if (elements.hideDateBtn) {
                // 當日期可見時，按鈕應該顯示激活狀態（藍色）
                elements.hideDateBtn.style.background = !isDateHidden
                    ? 'rgba(59, 130, 246, 0.8)'
                    : 'rgba(107, 114, 128, 0.8)';

                const icon = elements.hideDateBtn.querySelector('i[data-lucide]');
                if (icon) {
                    icon.setAttribute('data-lucide', isDateHidden ? 'calendar-x' : 'calendar-plus');
                    lucide.createIcons();
                }
                elements.hideDateBtn.title = isDateHidden ? '顯示日期標籤' : '隱藏日期標籤';
            }
        }

        function updateDatePosition() {
            // 根據縮圖列狀態調整日期顯示位置
            const currentDateDisplay = document.getElementById('currentDateDisplay');
            if (currentDateDisplay) {
                currentDateDisplay.classList.toggle('below-thumbnails', isThumbnailsVisible);
            }
        }

        function setFontSize(size) {
            fontSize = parseFloat(size);
            if (elements.descriptionContainer) {
                elements.descriptionContainer.style.fontSize = fontSize + 'rem';
            }
            
            // 更新活動按鈕
            const fontSizeBtns = document.querySelectorAll('.font-size-btn');
            fontSizeBtns.forEach(btn => {
                btn.classList.remove('active');
                if (parseFloat(btn.dataset.size) === fontSize) {
                    btn.classList.add('active');
                }
            });
            
            closeFontSizeMenu();
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

        // 速度按鈕事件監聽器
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('speed-btn')) {
                e.stopPropagation();
                const speed = e.target.getAttribute('data-speed');
                setTypingSpeed(speed);
            }
        });
        
        if (elements.thumbnailBtn) {
            elements.thumbnailBtn.addEventListener('click', toggleThumbnails);
            addTouchFeedback(elements.thumbnailBtn);
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
        
        // 字幕開關按鈕事件
        if (elements.subtitleToggleBtn) {
            elements.subtitleToggleBtn.addEventListener('click', toggleSubtitle);
            addTouchFeedback(elements.subtitleToggleBtn);
        }
        
        // 字體大小按鈕事件初始化函數
        function initializeFontSizeButtons() {
            const fontSizeBtns = document.querySelectorAll('.font-size-btn');
            fontSizeBtns.forEach(btn => {
                // 移除可能存在的舊事件監聽器，避免重複綁定
                btn.removeEventListener('click', handleFontSizeButtonClick);
                btn.addEventListener('click', handleFontSizeButtonClick);
            });
        }
        
        // 字體大小按鈕點擊處理函數
        function handleFontSizeButtonClick(e) {
            e.stopPropagation();
            setFontSize(this.dataset.size);
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
            
            // 設置當前媒體
            currentLightboxMediaIndex = currentMediaIndex;
            
            // 顯示燈箱
            displayLightboxMedia();
            elements.lightbox.classList.add('active');
            
            // 阻止背景滾動
            document.body.style.overflow = 'hidden';
        }
        
        function closeLightbox() {
            if (!elements.lightbox) return;
            
            elements.lightbox.classList.remove('active');
            document.body.style.overflow = '';
            
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
                
                const mediaSrc = media.src || media.url || `./media/${media.filename}`;
                if (mediaSrc.includes('media/')) {
                    mediaElement.setAttribute('data-needs-mse-decrypt', 'true');
                    mediaElement.setAttribute('data-original-src', mediaSrc);
                    mediaElement.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSI4IiBmaWxsPSJub25lIiBzdHJva2U9IiMzYjgyZjYiIHN0cm9rZS13aWR0aD0iMiI+PGFuaW1hdGVUcmFuc2Zvcm0gYXR0cmlidXRlTmFtZT0idHJhbnNmb3JtIiB0eXBlPSJyb3RhdGUiIHZhbHVlcz0iMCAyMCAyMDszNjAgMjAgMjAiIGR1cj0iMXMiIHJlcGVhdENvdW50PSJpbmRlZmluaXRlIi8+PC9jaXJjbGU+PC9zdmc+';
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
            displayLightboxMedia();
        }
        
        function lightboxNextMedia() {
            const currentEvent = getCurrentEvent();
            if (!currentEvent?.media || currentLightboxMediaIndex >= currentEvent.media.length - 1) return;
            
            currentLightboxMediaIndex++;
            displayLightboxMedia();
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
                renderTimeline(); // 首先渲染時間軸
                loadEvent();
            } else {
                console.warn('⚠️ 沒有回憶錄事件可顯示');
                elements.mediaDisplay.innerHTML = '<div>此回憶錄沒有事件內容</div>';
            }

            // 初始化打字速度按鈕狀態
            initializeTypingSpeedButtons();
            // 初始化隱藏功能按鈕狀態
            initializeHideButtons();
            // 初始化日期顯示位置
            updateDatePosition();

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
            // 初始化Lucide圖示
            if (window.lucide) {
                lucide.createIcons();
            }
            
            // 設置密碼模態框
            setupPasswordModal();
            
            // 設置觸控手勢
            setupTouchGestures();
            
            // 初始化字體大小按鈕事件
            initializeFontSizeButtons();
            
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
            
            // 添加頁面載入動畫
            setTimeout(() => {
                document.body.classList.add('fade-in');
            }, 100);
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
        


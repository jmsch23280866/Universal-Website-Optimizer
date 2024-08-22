// ==UserScript==
// @name         Universal Website Optimizer (WIP Beta Ver) / 通用網站優化工具 (實驗性)
// @name:zh-TW   通用網站優化工具 (實驗性)
// @namespace    https://github.com/jmsch23280866
// @version      2.2
// @description  Optimizes website loading speed, reduces CPU and RAM usage, disables telemetry. (Script assisted by ChatGPT)
// @description:zh-TW 加速網站載入速度、減少CPU和RAM使用、禁用遙測。（此腳本由ChatGPT協助撰寫）
// @author       特務E04
// @supportURL   https://github.com/jmsch23280866/Universal-Website-Optimizer/issues/
// @license      MIT
// @match        *://*/*
// @grant        none
// ==/UserScript==


(() => {
    'use strict';

    // 錯誤日誌函數，只在發生錯誤時輸出到控制台
    const logError = (message, error) => {
        console.error(`[Universal Website Optimizer] ${message}`, error);
    };

    // 需要阻擋的資源列表
    const blockList = [
        'google\\.analytics\\.com', 'analytics\\.js', 'gtag\\/js',
        'doubleclick\\.net', 'adsbygoogle\\.js', 'googlesyndication\\.com',
        'googletagmanager\\.com', 'facebook\\.net', 'fbevents\\.js',
        'scorecardresearch\\.com', 'quantserve\\.com', 'amazon-adsystem\\.com',
        'adnxs\\.com', 'criteo\\.net', 'outbrain\\.com', 'taboola\\.com'
    ].map(pattern => new RegExp(pattern));

    // 防抖函數
    const debounce = (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };

    // 攔截請求函數
    const interceptRequests = () => {
        // 攔截 XMLHttpRequest
        const originalOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(method, url, ...args) {
            if (blockList.some(regex => regex.test(url))) {
                return;
            }
            originalOpen.call(this, method, url, ...args);
        };

        // 攔截 Fetch API
        const originalFetch = window.fetch;
        window.fetch = function(input, init) {
            if (typeof input === 'string' && blockList.some(regex => regex.test(input))) {
                return Promise.reject(new Error('Request blocked by Userscript'));
            }
            return originalFetch.call(this, input, init);
        };

        // 使用防抖處理 DOM 變化
        const handleMutations = debounce((mutations) => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType !== Node.ELEMENT_NODE) continue;
                    if ((node.tagName === 'SCRIPT' && node.src && blockList.some(regex => regex.test(node.src))) ||
                        (node.tagName === 'LINK' && node.rel === 'stylesheet' && node.href && blockList.some(regex => regex.test(node.href)))) {
                        node.remove();
                    }
                }
            }
        }, 100); // 100毫秒的防抖延遲

        // 觀察 DOM 變化
        new MutationObserver(handleMutations).observe(document, { childList: true, subtree: true });
    };

    // 增強的延遲加載函數
    const enhancedLazyLoad = () => {
        const lazyLoadAttributes = ['data-src', 'data-lazy', 'data-original'];
        const options = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };

        const loadImage = (image) => {
            for (const attr of lazyLoadAttributes) {
                const dataSrc = image.getAttribute(attr);
                if (dataSrc) {
                    image.src = dataSrc;
                    image.removeAttribute(attr);
                    break;
                }
            }

            const dataSrcset = image.getAttribute('data-srcset');
            if (dataSrcset) {
                image.srcset = dataSrcset;
                image.removeAttribute('data-srcset');
            }
        };

        const handleIntersection = (entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    loadImage(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        };

        const observer = new IntersectionObserver(handleIntersection, options);

        document.querySelectorAll('img').forEach(img => {
            if (lazyLoadAttributes.some(attr => img.hasAttribute(attr)) || img.hasAttribute('data-srcset')) {
                observer.observe(img);
            }
        });
    };

    // 預加載關鍵資源
    const preloadCriticalResources = () => {
        const preloadLinks = new Set();

        // 預加載關鍵圖片
        document.querySelectorAll('img[data-critical]').forEach(img => {
            const preloadLink = document.createElement('link');
            preloadLink.rel = 'preload';
            preloadLink.as = 'image';
            preloadLink.href = img.src;
            preloadLinks.add(preloadLink);
        });

        // 預加載關鍵 CSS
        document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
            if (link.getAttribute('data-critical') === 'true') {
                const preloadLink = document.createElement('link');
                preloadLink.rel = 'preload';
                preloadLink.as = 'style';
                preloadLink.href = link.href;
                preloadLinks.add(preloadLink);
            }
        });

        preloadLinks.forEach(link => document.head.appendChild(link));
    };

    // 替換 document.write
    const replaceDocumentWrite = () => {
        const handleContentInsertion = (content) => {
            try {
                const range = document.createRange();
                const fragment = range.createContextualFragment(content);
                document.body.appendChild(fragment);
            } catch (err) {
                logError('內容插入失敗:', err);
            }
        };

        document.write = document.writeln = (content) => {
            if (typeof content === 'string') {
                handleContentInsertion(content);
            } else {
                logError('內容必須是字符串');
            }
        };
    };

    // 移除無障礙屬性
    const removeAccessibilityAttributes = () => {
        const attributes = ['aria-label', 'aria-describedby', 'aria-details', 'alt'];
        const selector = attributes.map(attr => `[${attr}]`).join(',');
        document.querySelectorAll(selector).forEach(el => {
            attributes.forEach(attr => el.removeAttribute(attr));
        });
    };

    // 啟用 YouTube 隱私模式
    const enableYouTubePrivacyMode = () => {
        document.querySelectorAll('iframe').forEach(iframe => {
            if (iframe.src.includes('youtube.com/embed/')) {
                iframe.src = iframe.src.replace('youtube.com/embed/', 'youtube-nocookie.com/embed/');
            }
        });
    };

    // 立即執行的優化
    const immediateOptimizations = () => {
        try {
            interceptRequests();
            replaceDocumentWrite();
            preloadCriticalResources();
        } catch (error) {
            logError('立即優化過程中發生錯誤:', error);
        }
    };

    // DOM 內容加載完成後執行的優化
    const domContentLoadedOptimizations = () => {
        try {
            enhancedLazyLoad();
            removeAccessibilityAttributes();
            enableYouTubePrivacyMode();
        } catch (error) {
            logError('DOM 內容加載優化過程中發生錯誤:', error);
        }
    };

    // 執行立即優化
    immediateOptimizations();

    // 在 DOM 內容加載完成後執行優化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', domContentLoadedOptimizations);
    } else {
        domContentLoadedOptimizations();
    }
})();
// ==UserScript==
// @name         Universal Website Optimizer (WIP Beta Ver) / 通用網站優化工具 (實驗性)
// @name:zh-TW   通用網站優化工具 (實驗性)
// @namespace    https://github.com/jmsch23280866
// @version      2.7
// @description  Optimizes website loading speed, reduces CPU and RAM usage, disables telemetry. (Script assisted by ChatGPT)
// @description:zh-TW 加速網站載入速度、減少CPU和RAM使用、禁用遙測。（此腳本由ChatGPT協助撰寫）
// @author       特務E04
// @supportURL   https://github.com/jmsch23280866/Universal-Website-Optimizer/issues/
// @license      MIT
// @noframes
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
        'doubleclick\\.net', 'adsbygoogle\\.js', 'googlesyndication\\.com', 'googletagmanager\\.com',
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

    // 本地快取
    const localCache = new Map();

    // 請求佇列
    const requestQueue = [];
    let activeRequests = 0;
    const MAX_CONCURRENT_REQUESTS = 5; // 調整此數值以改變同時請求數量，較高的數值可能會提高網路速度測試的準確性，但也可能增加記憶體占用。

    const processQueue = () => {
        if (requestQueue.length === 0 || activeRequests >= MAX_CONCURRENT_REQUESTS) {
            return;
        }

        const { url, resolve, reject } = requestQueue.shift();
        activeRequests++;

        fetch(url)
            .then(response => response.text())
            .then(data => {
                localCache.set(url, data);
                resolve(data);
            })
            .catch(reject)
            .finally(() => {
                activeRequests--;
                processQueue();
            });
    };

    const cachedFetch = (url) => {
        if (localCache.has(url)) {
            // 如果本地快取中已有該 URL 的內容，直接返回快取的內容
            return Promise.resolve(localCache.get(url));
        }

        // 如果本地快取中沒有該 URL 的內容，將請求加入佇列並處理
        return new Promise((resolve, reject) => {
            requestQueue.push({ url, resolve, reject });
            processQueue();
        });
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

        // 攔截 Fetch API 並使用快取
        const originalFetch = window.fetch;
        window.fetch = function(input, init) {
            if (typeof input === 'string' && blockList.some(regex => regex.test(input))) {
                return Promise.reject(new Error('Request blocked by Userscript'));
            }

            if (typeof input === 'string') {
                return cachedFetch(input);
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
        const lazyLoadElements = (selector, loadingAttribute = 'src') => {
            const elements = document.querySelectorAll(selector);
            if ('loading' in HTMLImageElement.prototype) {
                elements.forEach(el => {
                    if (!el.hasAttribute('loading')) {
                        el.setAttribute('loading', 'lazy');
                    }
                    // 如果有data-src，則將其設置為src
                    if (el.dataset.src) {
                        el[loadingAttribute] = el.dataset.src;
                    }
                });
            } else {
                // 使用 IntersectionObserver 作為後備方案
                const observer = new IntersectionObserver((entries, observer) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const el = entry.target;
                            if (el.dataset.src) {
                                el[loadingAttribute] = el.dataset.src;
                            }
                            observer.unobserve(el);
                        }
                    });
                });

                elements.forEach(el => observer.observe(el));
            }
        };

        // 延遲加載圖片
        lazyLoadElements('img');

        // 延遲加載 iframe
        lazyLoadElements('iframe', 'src');
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
        const originalWrite = document.write;

        document.write = document.writeln = (content) => {
            if (typeof content !== 'string') return logError('內容必須是字符串');
            try {
                if (document.body) {
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = content;
                    document.body.appendChild(tempDiv);
                } else {
                    // 如果body不存在，使用原始方法
                    originalWrite.call(document, content);
                }
            } catch (err) {
                logError('內容插入失敗:', err);
                // 回退到原始的document.write
                originalWrite.call(document, content);
            }
        };
    };

    // 清理 HTML 元素
    const cleanupHTMLElements = () => {
        // 移除無障礙屬性
		const accessibilityAttributes = ['aria-label', 'aria-describedby', 'aria-details', 'alt'];
		const selector = accessibilityAttributes.map(attr => `[${attr}]`).join(',');
		document.querySelectorAll(selector).forEach(el => {
			accessibilityAttributes.forEach(attr => el.removeAttribute(attr));
		});
	
        // 定義需要移除的 <meta> 標籤黑名單
        const metaTagBlacklist = [
            'keywords', 'description', 'author', 'generator',
            'robots', 'googlebot', 'revisit-after',
            'apple-itunes-app', 'apple-mobile-web-app',  //Apple 應用程式
            'og:',  //Open Graph 協議相關標籤
            'twitter:', //Twitter 卡片相關標籤
            'fb:', //Facebook 相關標籤
			'juicyads-site-verification', 'exoclick-site-verification', 'trafficjunky-site-verification', //垃圾廣告
			'ero_verify', 'linkbuxverifycode', //垃圾廣告
        ];

		// 定義需要移除的 <script> 標籤黑名單
		const scriptBlacklist = [
			'google-analytics', 'googletagmanager', 'adsbygoogle', 'doubleclick.net'
		];
		
	    // 移除黑名單中的 <meta> 標籤
		document.querySelectorAll('meta').forEach(meta => {
			const name = meta.getAttribute('name');
			const property = meta.getAttribute('property');
			const httpEquiv = meta.getAttribute('http-equiv');

			if (name && metaTagBlacklist.some(blacklisted => name.toLowerCase().startsWith(blacklisted))) {
				meta.remove();
			} else if (property && metaTagBlacklist.some(blacklisted => property.toLowerCase().startsWith(blacklisted))) {
				meta.remove();
			} else if (httpEquiv && metaTagBlacklist.some(blacklisted => httpEquiv.toLowerCase().startsWith(blacklisted))) {
				meta.remove();
			}
		});

		// 移除黑名單中的 <script> 標籤
		document.querySelectorAll('script').forEach(script => {
			const src = script.getAttribute('src');
			if (src && scriptBlacklist.some(blacklisted => src.includes(blacklisted))) {
				script.remove();
			}
		});

		// 移除 <noscript> 標籤
		document.querySelectorAll('noscript').forEach(noscript => noscript.remove());
	
		// 移除 <p>&nbsp; 標籤
		document.querySelectorAll('p').forEach(p => p.innerHTML.trim() === '&nbsp;' && p.remove());
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
            cleanupHTMLElements();
            enableYouTubePrivacyMode();
        } catch (error) {
            logError('DOM 內容加載優化過程中發生錯誤:', error);
        }
    };

    // 立即執行優化
    immediateOptimizations();

    // 在 DOM 內容加載完成後執行其他優化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', domContentLoadedOptimizations);
    } else {
        domContentLoadedOptimizations();
    }
})();
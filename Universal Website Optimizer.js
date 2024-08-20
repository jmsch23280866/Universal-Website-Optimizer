// ==UserScript==
// @name         Universal Website Optimizer (WIP Beta Ver) / 通用網站優化工具 (實驗性)
// @name:zh-TW   通用網站優化工具 (實驗性)
// @namespace    https://github.com/jmsch23280866
// @version      2.0
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

    // 擴展阻擋列表，包含更多常見的廣告和分析服務
    const blockList = [
        'google\\.analytics\\.com', 'analytics\\.js', 'gtag\\/js',
        'doubleclick\\.net', 'adsbygoogle\\.js', 'googlesyndication\\.com',
        'googletagmanager\\.com', 'facebook\\.net', 'fbevents\\.js',
        'scorecardresearch\\.com', 'quantserve\\.com', 'amazon-adsystem\\.com',
        'adnxs\\.com', 'criteo\\.net', 'outbrain\\.com', 'taboola\\.com'
    ].map(pattern => new RegExp(pattern));

    // 優化的請求攔截功能
    const interceptRequests = () => {
        const originalOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(method, url, ...args) {
            if (blockList.some(regex => regex.test(url))) {
                console.log(`Blocked request to: ${url}`);
                return;
            }
            originalOpen.call(this, method, url, ...args);
        };

        const originalFetch = window.fetch;
        window.fetch = function(input, init) {
            if (typeof input === 'string' && blockList.some(regex => regex.test(input))) {
                console.log(`Blocked fetch to: ${input}`);
                return Promise.reject(new Error('Request blocked by Userscript'));
            }
            return originalFetch.call(this, input, init);
        };

        // 攔截script和link元素
        new MutationObserver(mutations => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType !== Node.ELEMENT_NODE) continue;
                    if ((node.tagName === 'SCRIPT' && node.src && blockList.some(regex => regex.test(node.src))) ||
                        (node.tagName === 'LINK' && node.rel === 'stylesheet' && node.href && blockList.some(regex => regex.test(node.href)))) {
                        node.remove();
                        console.log(`Removed ${node.tagName} element with source: ${node.src || node.href}`);
                    }
                }
            }
        }).observe(document, { childList: true, subtree: true });
    };

    // 優化的延遲加載功能
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

    
    // 預加載關鍵圖片
    const preloadCriticalImages = () => {
        const criticalImages = document.querySelectorAll('img[data-critical]');
        criticalImages.forEach(img => {
            const preloadLink = document.createElement('link');
            preloadLink.rel = 'preload';
            preloadLink.as = 'image';
            preloadLink.href = img.src;
            document.head.appendChild(preloadLink);
        });
    };

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

    // 優化的 document.write 替換功能
    const replaceDocumentWrite = () => {
        const handleContentInsertion = (content) => {
        try {
            const range = document.createRange();
            range.selectNode(document.body);
            const fragment = range.createContextualFragment(content);
            document.body.appendChild(fragment);
        } catch (err) {
            console.error('Content insertion failed:', err);
        }
    };

		document.write = document.writeln = (content) => {
			if (typeof content === 'string') {
				handleContentInsertion(content);
			} else {
				console.warn('Content must be a string');
			}
		};
	};

    // 優化的移除無障礙屬性功能
    const removeAccessibilityAttributes = () => {
        const attributes = ['aria-label', 'aria-describedby', 'aria-details', 'alt'];
        const selector = attributes.map(attr => `[${attr}]`).join(',');
        document.querySelectorAll(selector).forEach(el => {
            attributes.forEach(attr => el.removeAttribute(attr));
        });
    };

    // 優化的 YouTube 播放器隱私模式功能
	const enableYouTubePrivacyMode = () => {
		document.querySelectorAll('iframe').forEach(iframe => {
			const src = iframe.src;
			if (src.includes('youtube.com/embed/')) {
				// 確保 URL 中僅有一個 'youtube.com/embed/' 部分被替換
				iframe.src = src.replace('youtube.com/embed/', 'youtube-nocookie.com/embed/');
			}
		});
	};

    // 立即執行的優化
    const immediateOptimizations = () => {
        interceptRequests();
        replaceDocumentWrite();
        preloadCriticalImages();
    };

    // DOM 內容加載完成後執行的優化
    const domContentLoadedOptimizations = () => {
        enhancedLazyLoad();
        removeAccessibilityAttributes();
        enableYouTubePrivacyMode();
    };

    // 頁面完全加載後執行的優化
    const windowLoadOptimizations = () => {
    };

    // 執行立即優化
    immediateOptimizations();

    // 在 DOM 內容加載完成後執行優化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', domContentLoadedOptimizations);
    } else {
        domContentLoadedOptimizations();
    }

    // 在頁面完全加載後執行優化
    window.addEventListener('load', windowLoadOptimizations);

})();
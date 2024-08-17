// ==UserScript==
// @name         Universal Website Optimizer (WIP Beta Ver) / 通用網站優化工具 (實驗性)
// @name:zh-TW   通用網站優化工具 (實驗性)
// @namespace    https://github.com/jmsch23280866
// @version      1.2
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

    // 定義需要阻擋的最常見廣告和分析器資源列表，並將其轉換為正則表達式
    const blockList = [
        'google\\.analytics\\.com', 'analytics\\.js', 'gtag\\/js',
        'doubleclick\\.net', 'adsbygoogle\\.js', 'googlesyndication\\.com'
    ].map(pattern => new RegExp(pattern));

    // 攔截和阻擋不必要的網絡請求
    const interceptRequests = () => {
        const { open } = XMLHttpRequest.prototype;
        XMLHttpRequest.prototype.open = function(method, url, ...args) {
            if (blockList.some(regex => regex.test(url))) return;
            open.call(this, method, url, ...args);
        };

        new MutationObserver(mutations => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType !== Node.ELEMENT_NODE) continue;
                    if ((node.tagName === 'SCRIPT' && node.src && blockList.some(regex => regex.test(node.src))) ||
                        (node.tagName === 'LINK' && node.rel === 'stylesheet' && node.href && blockList.some(regex => regex.test(node.href)))) {
                        node.remove();
                    }
                }
            }
        }).observe(document.head, { childList: true, subtree: true });
    };

    // 更通用化的延遲加載功能
    const enhancedLazyLoad = () => {
        const images = document.querySelectorAll('img');
        const options = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };

        const loadImage = (image) => {
            const dataSrc = image.getAttribute('data-src') || image.getAttribute('data-lazy') || image.getAttribute('data-original') || image.src;
            if (dataSrc) {
                image.src = dataSrc;
                image.removeAttribute('data-src');
                image.removeAttribute('data-lazy');
                image.removeAttribute('data-original');
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

        images.forEach(img => {
            observer.observe(img);
        });
    };

    // 圖片格式轉換（如果瀏覽器支持 WebP）
    const convertToWebP = () => {
        if (!self.createImageBitmap) return; // 檢查瀏覽器是否支持 createImageBitmap

        const images = document.querySelectorAll('img');
        images.forEach(img => {
            if (img.src.match(/\.(png|jpg|jpeg)$/i)) {
                fetch(img.src)
                    .then(response => response.blob())
                    .then(blob => createImageBitmap(blob))
                    .then(bitmap => {
                        const canvas = document.createElement('canvas');
                        canvas.width = bitmap.width;
                        canvas.height = bitmap.height;
                        canvas.getContext('2d').drawImage(bitmap, 0, 0);
                        img.src = canvas.toDataURL('image/webp');
                    })
                    .catch(err => console.error('Image conversion failed:', err));
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

    // 替換 document.write 方法以改善性能
    const replaceDocumentWrite = () => {
        document.write = content => document.body.insertAdjacentHTML('beforeend', content);
    };

    // 移除無障礙屬性
    const removeAccessibilityAttributes = () => {
        const elements = document.querySelectorAll('[aria-label], [aria-describedby], [aria-details]');
        elements.forEach(el => {
            el.removeAttribute('aria-label');
            el.removeAttribute('aria-describedby');
            el.removeAttribute('aria-details');
        });

        // 移除圖片的 alt 屬性
        const images = document.querySelectorAll('img[alt]');
        images.forEach(img => {
            img.removeAttribute('alt');
        });
    };

    // YouTube 播放器隱私模式
    const enableYouTubePrivacyMode = () => {
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach(iframe => {
            if (iframe.src.includes('youtube.com/embed/')) {
                iframe.src = iframe.src.replace('youtube.com/embed/', 'youtube-nocookie.com/embed/');
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
        convertToWebP();
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

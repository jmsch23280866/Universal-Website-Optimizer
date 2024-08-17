// ==UserScript==
// @name         Universal Website Optimizer (WIP Beta Ver) / 通用網站優化工具 (實驗性)
// @name:zh-TW   通用網站優化工具 (實驗性)
// @namespace    https://github.com/jmsch23280866
// @version      1.0
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

    // 檢查瀏覽器是否支持原生的懶加載
    const supportsNativeLazyLoad = 'loading' in HTMLImageElement.prototype;

    // 為圖片和 iframe 啟用懶加載
    const enableLazyLoad = (selector, attribute = 'src') => {
        const elements = document.querySelectorAll(selector);
        if (elements.length === 0) return; // 如果沒有找到元素，直接返回

        elements.forEach(el => {
            if (supportsNativeLazyLoad) {
                el.loading = 'lazy';
            } else {
                el.classList.add('lazyload');
            }
            if (el.tagName === 'IFRAME' && el[attribute]?.includes('youtube.com/embed/')) {
                el[attribute] = el[attribute].replace('youtube.com/embed/', 'youtube-nocookie.com/embed/');
            }
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

    // 立即執行的優化
    const immediateOptimizations = () => {
        interceptRequests();
        replaceDocumentWrite();
    };

    // DOM 內容加載完成後執行的優化
    const domContentLoadedOptimizations = () => {
        enableLazyLoad('img');
        enableLazyLoad('iframe', 'src');
        removeAccessibilityAttributes(); // 在這裡移除圖片的 alt 屬性
    };

    // 頁面完全加載後執行的優化
    const windowLoadOptimizations = () => {
        // 沒有其他延遲優化的功能
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
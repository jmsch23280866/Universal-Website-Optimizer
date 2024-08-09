// ==UserScript==
// @name         Universal Website Optimizer (WIP Beta Ver) / 通用網站優化工具 (實驗性)
// @name:zh-TW   通用網站優化工具 (實驗性)
// @namespace    https://github.com/jmsch23280866
// @version      0.10
// @description  Optimizes website loading speed, reduces CPU and RAM usage, disables telemetry. (Script assisted by ChatGPT)
// @description:zh-TW 加速網站載入速度、減少CPU和RAM使用、禁用遙測。（此腳本由ChatGPT協助撰寫）
// @author       特務E04
// @license      MIT
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 初始化 Lazy Load，但排除預載的內容
    function initLazyLoad() {
        const preloadSources = new Set();

        // 收集所有 preload 標籤的 href 或 src
        document.querySelectorAll('link[rel="preload"], script[rel="preload"], img[rel="preload"], iframe[rel="preload"]').forEach(preloadElement => {
            if (preloadElement.href) {
                preloadSources.add(preloadElement.href);
            } else if (preloadElement.src) {
                preloadSources.add(preloadElement.src);
            }
        });

        const lazyLoadObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const target = entry.target;
                    if (target.dataset.src && !preloadSources.has(target.dataset.src)) {
                        target.src = target.dataset.src;
                        if (target.tagName === 'IFRAME' && target.src.includes('youtube.com/embed/')) {
                            target.src = target.src.replace('youtube.com/embed/', 'youtube-nocookie.com/embed/');
                        }
                    }
                    observer.unobserve(target);
                }
            });
        });

        document.querySelectorAll('img[data-src], iframe[data-src]').forEach(element => {
            if (!preloadSources.has(element.dataset.src)) {
                lazyLoadObserver.observe(element);
            }
        });
    }

    // 等待所有資源加載完成後再執行其他優化邏輯
    function deferExecution(callback) {
        if (document.readyState === 'complete') {
            callback();
        } else {
            window.addEventListener('load', callback);
        }
    }

    // 移除不必要的 script 和 stylesheet
    function removeUnnecessaryScriptsAndStyles() {
        const blockList = [
            /google-analytics\.com/, /analytics\.js/, /gtag\/js/, /doubleclick\.net/,
            /connect\.facebook\.net/, /adsbygoogle\.js/, /googlesyndication\.com/,
            /chartbeat\.com/, /scorecardresearch\.com/, /cloudflareinsights\.com/,
            /adbottw\.net/, /googletagservices\.com/, /googletagmanager\.com/,
            /pubads\.g\.doubleclick\.net/, /securepubads\.g\.doubleclick\.net/
        ];

        // 移除不必要的 script 和 stylesheet
        document.querySelectorAll('script[src], link[rel="stylesheet"]').forEach(element => {
            const srcOrHref = element.src || element.href;
            if (blockList.some(regex => regex.test(srcOrHref))) {
                element.remove();
            }
        });
    }

    // 避免使用 document.write()
    function avoidDocumentWrite() {
        const originalDocumentWrite = document.write;
        document.write = function(content) {
            console.error('document.write() was called, content: ', content); // 只記錄錯誤
            originalDocumentWrite.apply(document, arguments);
        };
    }

    // 刪除無用元素的綜合函數
    function removeUnnecessaryElements() {
        // 刪除無用的meta和link標籤
        document.querySelectorAll('meta[name], meta[property], link[rel="apple-touch-icon"], meta[name="apple-itunes-app"], link[rel="canonical"]').forEach(element => {
            element.remove();
        });

        // 刪除所有無障礙描述的alt屬性
        document.querySelectorAll('img[alt], area[alt]').forEach(element => {
            element.removeAttribute('alt');
        });

        // 刪除SEO相關標籤
        const seoMetaNames = [
            'description', 'keywords', 'robots', 'googlebot', 'bingbot', 'yandex-verification',
            'google-site-verification', 'msvalidate.01', 'viewport', 'format-detection'
        ];

        document.querySelectorAll('meta').forEach(meta => {
            if (seoMetaNames.includes(meta.getAttribute('name'))) {
                meta.remove();
            }
        });

        // 移除 <noscript> 標籤內容
        document.querySelectorAll('noscript').forEach(noscript => {
            noscript.remove();
        });
    }

    // 綜合執行優化邏輯
    function optimizedExecution() {
        removeUnnecessaryScriptsAndStyles();
        avoidDocumentWrite();
        removeUnnecessaryElements();
    }

    // 在 DOMContentLoaded 後初始化 Lazy Load
    document.addEventListener('DOMContentLoaded', initLazyLoad);

    // 在所有資源加載後執行優化邏輯
    deferExecution(optimizedExecution);
})();
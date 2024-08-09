// ==UserScript==
// @name         Universal Website Optimizer (WIP Beta Ver) / 通用網站優化工具 (實驗性)
// @name:zh-TW   通用網站優化工具 (實驗性)
// @namespace    https://github.com/jmsch23280866
// @version      0.9
// @description  Optimizes website loading speed, reduces CPU and RAM usage, disables telemetry. (Script assisted by ChatGPT)
// @description:zh-TW 加速網站載入速度、減少CPU和RAM使用、禁用遙測。（此腳本由ChatGPT協助撰寫）
// @author       特務E04
// @license      MIT
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 在 DOMContentLoaded 事件後執行 Lazy Load
    function initLazyLoad() {
        const lazyLoadObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const target = entry.target;
                    if (target.dataset.src) {
                        target.src = target.dataset.src;
                        if (target.tagName === 'IFRAME' && target.src.includes('youtube.com/embed/')) {
                            target.src = target.src.replace('youtube.com/embed/', 'youtube-nocookie.com/embed/');
                        }
                        console.log(`Lazy loaded: ${target.src}`);
                    }
                    observer.unobserve(target);
                }
            });
        });

        document.querySelectorAll('img[data-src], iframe[data-src]').forEach(element => {
            lazyLoadObserver.observe(element);
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

    // 通用優化邏輯
    function optimizedExecution() {
        // 定義需要攔截的資源列表
        const blockList = [
            /google-analytics\.com/, /analytics\.js/, /gtag\/js/, /doubleclick\.net/,
            /connect\.facebook\.net/, /adsbygoogle\.js/, /googlesyndication\.com/,
            /chartbeat\.com/, /scorecardresearch\.com/, /cloudflareinsights\.com/,
            /adbottw\.net/, /googletagservices\.com/, /googletagmanager\.com/,
            /pubads\.g\.doubleclick\.net/, /securepubads\.g\.doubleclick\.net/
        ];

        // 攔截不必要的資源請求
        function interceptRequests() {
            const originalOpen = XMLHttpRequest.prototype.open;
            XMLHttpRequest.prototype.open = function(method, url) {
                if (blockList.some(regex => regex.test(url))) {
                    console.log(`Blocked request to: ${url}`);
                    return;
                }
                originalOpen.apply(this, arguments);
            };

            const observer = new MutationObserver((mutations) => {
                mutations.forEach(mutation => {
                    mutation.addedNodes.forEach(node => {
                        if (node.tagName === 'SCRIPT' && node.src && blockList.some(regex => regex.test(node.src))) {
                            console.log(`Removed script: ${node.src}`);
                            node.remove();
                        } else if (node.tagName === 'LINK' && node.rel === 'stylesheet' && blockList.some(regex => regex.test(node.href))) {
                            console.log(`Removed stylesheet: ${node.href}`);
                            node.remove();
                        }
                    });
                });
            });

            observer.observe(document.head, {
                childList: true,
                subtree: true
            });
        }

        // 避免使用 document.write()
        function avoidDocumentWrite() {
            const originalDocumentWrite = document.write;
            document.write = function(content) {
                console.log('document.write() was called, content: ', content);
                originalDocumentWrite.apply(document, arguments);
            };
        }

        // 刪除無用元素的綜合函數
        function removeUnnecessaryElements() {
            // 刪除無用的meta和link標籤
            document.querySelectorAll('meta[name], meta[property], link[rel="apple-touch-icon"], meta[name="apple-itunes-app"], link[rel="canonical"]').forEach(element => {
                console.log(`Removed tag: ${element.outerHTML}`);
                element.remove();
            });

            // 刪除所有無障礙描述的alt屬性
            document.querySelectorAll('img[alt], area[alt]').forEach(element => {
                console.log(`Removed alt text: ${element.alt}`);
                element.removeAttribute('alt');
            });

            // 刪除SEO相關標籤
            const seoMetaNames = [
                'description', 'keywords', 'robots', 'googlebot', 'bingbot', 'yandex-verification',
                'google-site-verification', 'msvalidate.01', 'viewport', 'format-detection'
            ];

            document.querySelectorAll('meta').forEach(meta => {
                if (seoMetaNames.includes(meta.getAttribute('name'))) {
                    console.log(`Removed SEO meta tag: ${meta.outerHTML}`);
                    meta.remove();
                }
            });

            // 移除 <noscript> 標籤內容
            document.querySelectorAll('noscript').forEach(noscript => {
                console.log('Removed <noscript> content');
                noscript.remove();
            });
        }

        // 綜合執行優化邏輯
        interceptRequests();
        avoidDocumentWrite();
        removeUnnecessaryElements();
    }

    // 在 DOMContentLoaded 後初始化 Lazy Load
    document.addEventListener('DOMContentLoaded', initLazyLoad);

    // 在所有資源加載後執行優化邏輯
    deferExecution(optimizedExecution);
})();
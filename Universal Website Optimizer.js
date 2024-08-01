// ==UserScript==
// @name         Universal Website Optimizer (WIP Beta Ver) / 通用網站優化工具 (實驗性)
// @name:zh-TW   通用網站優化工具 (實驗性)
// @namespace    https://github.com/jmsch23280866
// @version      0.8
// @description  Optimizes website loading speed, reduces CPU and RAM usage, disables telemetry and ads, and defers non-critical JavaScript. (Script assisted by ChatGPT)
// @description:zh-TW 加速網站載入速度、減少CPU和RAM使用、禁用遙測和廣告、延遲非關鍵JavaScript載入。（此腳本由ChatGPT協助撰寫）
// @author       特務E04
// @license      MIT
// @match        *://*/*
// @exclude      *://*.googlevideo.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

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
            // 攔截在攔截列表中的請求
            if (blockList.some(regex => regex.test(url))) {
                console.log(`Blocked request to: ${url}`);
                return;
            }
            originalOpen.apply(this, arguments);
        };

        // 使用 MutationObserver 攔截動態添加的資源
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

    // Lazy load 圖片和 iframe
    function enableLazyLoad() {
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

        // 觀察帶有 data-src 屬性的圖片和 iframe
        document.querySelectorAll('img[data-src], iframe[data-src]').forEach(element => {
            lazyLoadObserver.observe(element);
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

    // 延遲載入非關鍵 JavaScript
    function deferNonCriticalJS() {
        document.querySelectorAll('script[src]:not([defer]):not([async])').forEach(script => {
            if (!/local\.adguard\.org/.test(script.src) && !/localhost\.com/.test(script.src) && !script.src.startsWith('chrome-extension://')) {
                script.setAttribute('defer', 'defer');
                console.log(`Deferred script: ${script.src}`);
            }
        });
    }

    // 移除 <noscript> 標籤內容
    function removeNoscriptContent() {
        document.querySelectorAll('noscript').forEach(noscript => {
            console.log('Removed <noscript> content');
            noscript.remove();
        });
    }

    // 將所有優化邏輯封裝在一個函數中
    function optimizeWebPage() {
        interceptRequests();
        enableLazyLoad();
        avoidDocumentWrite();
        deferNonCriticalJS();
        removeNoscriptContent();
    }

    // IIFE 中直接執行優化邏輯
    try {
        optimizeWebPage();
    } catch (e) {
        console.error('Optimization failed:', e);
    }
})();

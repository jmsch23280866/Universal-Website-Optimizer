// ==UserScript==
// @name         Universal Website Optimizer (WIP Beta Ver) / 通用網站優化工具 (實驗性)
// @name:zh-TW   通用網站優化工具 (實驗性)
// @namespace    https://github.com/jmsch23280866
// @version      0.6
// @description  Optimizes website loading speed, reduces CPU and RAM usage, disables telemetry and ads, and defers non-critical JavaScript. (Script assisted by ChatGPT)
// @description:zh-TW 加速網站載入速度、減少CPU和RAM使用、禁用遙測和廣告、延遲非關鍵JavaScript載入。（此腳本由ChatGPT協助撰寫）
// @author       特務E04
// @license      MIT
// @match        *://*/*
// @grant        none
// ==/UserScript==
(function() {
    'use strict';

    // 禁用遙測和廣告資源
    const blockList = [
        /google-analytics\.com/, /analytics\.js/, /gtag\/js/, /doubleclick\.net/,
        /connect\.facebook\.net/, /adsbygoogle\.js/, /googlesyndication\.com/,
        /chartbeat\.com/, /scorecardresearch\.com/, /cloudflareinsights\.com/,
        /adbottw\.net/, /googletagservices\.com/, /googletagmanager\.com/,
        /pubads\.g\.doubleclick\.net/, /securepubads\.g\.doubleclick\.net/
    ];

    // 攔截不必要的資源
    function interceptRequests() {
        const originalOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(method, url) {
            if (blockList.some(regex => regex.test(url))) {
                console.log('Blocked request to:', url);
                return;
            }
            originalOpen.apply(this, arguments);
        };
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.tagName === 'SCRIPT' && node.src) {
                        if (blockList.some(regex => regex.test(node.src))) {
                            console.log('Blocked script:', node.src);
                            node.remove();
                        }
                    } else if (node.tagName === 'LINK' && node.rel === 'stylesheet') {
                        if (blockList.some(regex => regex.test(node.href))) {
                            console.log('Blocked stylesheet:', node.href);
                            node.remove();
                        }
                    }
                });
            });
        });
        observer.observe(document.head, {
            childList: true,
            subtree: true
        });
    }

    // Lazy load 圖片
    function enableLazyLoad() {
        const lazyLoadObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                    }
                    observer.unobserve(img);
                }
            });
        });
        document.querySelectorAll('img').forEach(img => {
            if (img.dataset.src) {
                lazyLoadObserver.observe(img);
            }
        });
    }

    // Lazy load iframe
    function enableIframeLazyLoad() {
        const lazyLoadObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const iframe = entry.target;
                    if (iframe.dataset.src) {
                        iframe.src = iframe.dataset.src;
                        if (iframe.src.includes('youtube.com/embed/')) {
                            iframe.src = iframe.src.replace('youtube.com/embed/', 'youtube-nocookie.com/embed/');
                        }
                    }
                    observer.unobserve(iframe);
                }
            });
        });
        document.querySelectorAll('iframe').forEach(iframe => {
            if (iframe.src) {
                iframe.dataset.src = iframe.src;
                iframe.src = '';
                lazyLoadObserver.observe(iframe);
            }
        });
    }

    // 避免使用 document.write()
    function avoidDocumentWrite() {
        const originalWrite = document.write;
        document.write = function(content) {
            console.log('Blocked document.write():', content);
        };
    }

    // 延遲載入非關鍵 JavaScript
    function deferNonCriticalJS() {
        document.querySelectorAll('script').forEach(script => {
            if (!script.hasAttribute('defer') && !script.hasAttribute('async') && 
                !/local\.adguard\.org/.test(script.src) && !/localhost\.com/.test(script.src) &&
                !script.src.startsWith('chrome-extension://')) {
                script.setAttribute('defer', 'defer');
            }
        });
    }

    // 清除 <noscript> 內容
    function removeNoscriptContent() {
        document.querySelectorAll('noscript').forEach(noscript => {
            noscript.parentElement.removeChild(noscript);
        });
    }

    // 主程序
    function optimizeWebPage() {
        interceptRequests();
        enableLazyLoad();
        enableIframeLazyLoad();
        avoidDocumentWrite();
        deferNonCriticalJS();
        removeNoscriptContent();
    }

    document.addEventListener('DOMContentLoaded', optimizeWebPage);
})();

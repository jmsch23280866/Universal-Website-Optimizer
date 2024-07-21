// ==UserScript==
// @name         Universal Website Optimizer (WIP Beta Ver) / 通用網站優化工具 (實驗性)
// @name:zh-TW   通用網站優化工具 (實驗性)
// @namespace    https://github.com/jmsch23280866
// @version      0.2
// @description  Optimizes website loading speed, reduces CPU and RAM usage, disables telemetry and ads, and defers non-critical JavaScript. (Script assisted by ChatGPT)
// @description:zh-TW 加速網站載入速度，減少CPU和RAM使用，禁用遙測和廣告，延遲非關鍵JavaScript載入。（此腳本由ChatGPT協助撰寫）
// @author       特務E04
// @license      MIT
// @match        *://*/*
// @grant        none
// ==/UserScript==
(function() {
    'use strict';

    // 禁用遙測和廣告資源
    const blockList = [/google-analytics\.com/, /analytics\.js/, /gtag\/js/, /doubleclick\.net/, /connect\.facebook\.net/, /adsbygoogle\.js/, /googlesyndication\.com/, /chartbeat\.com/, /scorecardresearch\.com/, /cloudflareinsights\.com/, /adbottw\.net/, /googletagservices\.com/, /googletagmanager\.com/, /pubads\.g\.doubleclick\.net/, /securepubads\.g\.doubleclick\.net/];

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

        observer.observe(document.head, { childList: true, subtree: true });
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

    // 避免使用 document.write()
    function avoidDocumentWrite() {
        const originalWrite = document.write;
        document.write = function(content) {
            console.log('Blocked document.write():', content);
        };
    }

    // 使用門面元件延遲載入 YouTube 影片
    function replaceYouTubeEmbeds() {
        document.querySelectorAll('iframe[src*="youtube.com/embed/"]').forEach(iframe => {
            const videoId = new URL(iframe.src).pathname.split('/').pop();
            const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

            const facade = document.createElement('div');
            facade.style.position = 'relative';
            facade.style.width = iframe.style.width || iframe.width || '100%';
            facade.style.height = iframe.style.height || iframe.height || '0';
            facade.style.paddingBottom = '56.25%';
            facade.style.background = `url(${thumbnailUrl}) center center / cover no-repeat`;
            facade.style.cursor = 'pointer';
            facade.dataset.videoId = videoId;

            const playButton = document.createElement('div');
            playButton.style.position = 'absolute';
            playButton.style.top = '50%';
            playButton.style.left = '50%';
            playButton.style.transform = 'translate(-50%, -50%)';
            playButton.style.width = '50px';
            playButton.style.height = '50px';
            playButton.style.display = 'flex';
            playButton.style.alignItems = 'center';
            playButton.style.justifyContent = 'center';
            playButton.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" fill="white"><path d="M8 5v14l11-7z"></path></svg>';
            facade.appendChild(playButton);

            facade.addEventListener('click', () => {
                const iframe = document.createElement('iframe');
                iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
                iframe.style.width = '100%';
                iframe.style.height = '100%';
                iframe.style.border = 'none';
                iframe.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture';
                facade.replaceWith(iframe);
            });

            iframe.replaceWith(facade);
        });
    }

    // 延遲載入非關鍵 JavaScript
    function deferNonCriticalJS() {
        document.querySelectorAll('script').forEach(script => {
            if (!script.hasAttribute('defer') && !script.hasAttribute('async')) {
                script.setAttribute('defer', 'defer');
            }
        });
    }

    // DOMContentLoaded事件觸發後執行優化腳本
    document.addEventListener('DOMContentLoaded', function() {
        interceptRequests();
        enableLazyLoad();
        avoidDocumentWrite();
        replaceYouTubeEmbeds();
        deferNonCriticalJS();
    });

    // 監控動態加載的廣告和遙測腳本
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

    observer.observe(document.body, { childList: true, subtree: true });
})();
        childList: true,
        subtree: true
    });
})();

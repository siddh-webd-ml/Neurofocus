const NeuroDom = (() => {
  'use strict';

  const CONFIG = { MUTATION_DEBOUNCE_MS: 40, BATCH_SIZE: 20 };

  let _siteConfig = null;
  let _observer = null;
  let _debounceTimer = null;
  let _scrollDebounceTimer = null;
  let _onNewElements = null;
  let _isActive = false;

  function loadSiteConfig(config) { _siteConfig = config; }
  function getSiteConfig() { return _siteConfig; }

  function detectFeedItems(root = document.body) {
    const items = new Set();
    if (_siteConfig && _siteConfig.feedItems) {
      for (const sel of _siteConfig.feedItems) {
        try { for (const el of root.querySelectorAll(sel)) items.add(el); } catch (e) { }
      }
    }
    return Array.from(items);
  }

  function findDistractions() {
    if (!_siteConfig || !_siteConfig.distractions) return [];
    const result = new Set();
    for (const sel of _siteConfig.distractions) {
      try { for (const el of document.querySelectorAll(sel)) result.add(el); } catch (e) { }
    }
    if (_siteConfig.id === 'youtube') {
      try {
        for (const link of document.querySelectorAll('a[href^="/shorts/"], a[href*="/shorts/"]')) {
          const container = link.closest('ytd-rich-item-renderer, ytd-rich-section-renderer, ytd-reel-item-renderer, yt-lockup-view-model, ytd-video-renderer, ytd-grid-video-renderer, ytd-rich-shelf-renderer, ytd-reel-shelf-renderer');
          if (container) result.add(container);
        }
        for (const reel of document.querySelectorAll('ytd-reel-shelf-renderer, ytd-reel-item-renderer')) {
          result.add(reel);
        }
        for (const section of document.querySelectorAll('ytd-rich-section-renderer')) {
          if (section.innerText && section.innerText.includes('Shorts')) result.add(section);
        }
      } catch (e) { }
    }
    return Array.from(result);
  }

  function batchApplyClasses(operations) {
    let idx = 0;
    function batch() {
      const end = Math.min(idx + CONFIG.BATCH_SIZE, operations.length);
      for (; idx < end; idx++) {
        const op = operations[idx];
        if (op.add) for (const c of op.add) op.el.classList.add(c);
        if (op.remove) for (const c of op.remove) op.el.classList.remove(c);
      }
      if (idx < operations.length) requestAnimationFrame(batch);
    }
    requestAnimationFrame(batch);
  }

  function cleanAll() {
    const cls = ['nf-blurred','nf-semi-relevant','nf-relevant','nf-hidden','nf-overlay-active'];
    const ops = [];
    for (const el of document.querySelectorAll('.nf-blurred,.nf-semi-relevant,.nf-relevant,.nf-hidden,.nf-overlay-active'))
      ops.push({ el, remove: cls });
    batchApplyClasses(ops);
  }

  function startObserving(callback) {
    _onNewElements = callback;
    if (_observer) _observer.disconnect();
    _observer = new MutationObserver((mutations) => {
      if (_debounceTimer) clearTimeout(_debounceTimer);
      _debounceTimer = setTimeout(() => {
        if (!_isActive || !_siteConfig) return;
        const newEls = [];
        const sels = _siteConfig.feedItems || [];
        for (const mut of mutations) {
          for (const node of mut.addedNodes) {
            if (node.nodeType !== Node.ELEMENT_NODE) continue;
            for (const sel of sels) {
              try {
                if (node.matches && node.matches(sel)) newEls.push(node);
                for (const child of node.querySelectorAll(sel)) newEls.push(child);
              } catch (e) {}
            }
          }
        }
        if (newEls.length > 0 && _onNewElements) _onNewElements([...new Set(newEls)]);
      }, CONFIG.MUTATION_DEBOUNCE_MS);
    });

    _observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
  }

  function stopObserving() {
    if (_observer) { _observer.disconnect(); _observer = null; }
    if (_debounceTimer) { clearTimeout(_debounceTimer); _debounceTimer = null; }
    if (_scrollDebounceTimer) { clearTimeout(_scrollDebounceTimer); _scrollDebounceTimer = null; }
    window.removeEventListener('scroll', handleScroll);
    _onNewElements = null;
  }

  function handleScroll() {
    if (!_isActive) return;
    if (_scrollDebounceTimer) clearTimeout(_scrollDebounceTimer);
    _scrollDebounceTimer = setTimeout(() => {
      if (_isActive && _onNewElements) {
        const items = detectFeedItems();
        if (items.length > 0) _onNewElements(items);
      }
    }, 300);
  }

  function setActive(active) { _isActive = active; }
  function isActive() { return _isActive; }

  function hideYouTubeShorts() {
    const shortsSelectors = [
      'ytd-reel-shelf-renderer',
      'ytd-reel-item-renderer',
      'ytd-shorts',
      '[title="Shorts"]',
      '[aria-label="Shorts"]',
      'ytd-horizontal-card-list-renderer',
      '[data-content-type="shorts"]',
    ];
    
    for (const sel of shortsSelectors) {
      try {
        for (const el of document.querySelectorAll(sel)) {
          el.style.display = 'none';
          el.classList.add('nf-hidden');
        }
      } catch (e) { }
    }
    
    try {
      for (const section of document.querySelectorAll('ytd-rich-section-renderer, ytd-shelf-renderer')) {
        if (section.innerText && section.innerText.includes('Shorts')) {
          section.style.display = 'none';
          section.classList.add('nf-hidden');
        }
      }
    } catch (e) { }
  }

  function hideYouTubePlaylists() {
    const playlistSelectors = [
      'ytd-playlist-video-renderer',
      'ytd-playlist-panel-renderer',
      '[title*="Playlist"]',
      '[aria-label*="Playlist"]',
      '[data-video-type="playlist"]',
    ];
    
    for (const sel of playlistSelectors) {
      try {
        for (const el of document.querySelectorAll(sel)) {
          el.style.display = 'none';
          el.classList.add('nf-hidden');
        }
      } catch (e) { }
    }
    
    try {
      for (const item of document.querySelectorAll('ytd-rich-item-renderer, yt-lockup-view-model')) {
        const link = item.querySelector('a[href*="/playlist"]');
        if (link) {
          item.style.display = 'none';
          item.classList.add('nf-hidden');
        }
      }
    } catch (e) { }
    
    try {
      for (const section of document.querySelectorAll('ytd-rich-section-renderer, ytd-shelf-renderer')) {
        if (section.innerText && section.innerText.includes('Playlist')) {
          section.style.display = 'none';
          section.classList.add('nf-hidden');
        }
      }
    } catch (e) { }
  }

  return { loadSiteConfig, getSiteConfig, detectFeedItems, findDistractions, batchApplyClasses, cleanAll, startObserving, stopObserving, setActive, isActive, hideYouTubeShorts, hideYouTubePlaylists, CONFIG };
})();

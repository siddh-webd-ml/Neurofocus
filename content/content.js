(() => {
  'use strict';

  const THRESHOLDS = { HIGH: 0.50, SEMI: 0.18 };

  let focusActive = false;
  let currentIntent = '';
  let currentIntents = [];
  let _periodicalScanTimer = null;

  function initSiteConfig() {
    const hostname = location.hostname;
    const config = SiteConfigs.detectSite(hostname);

    if (config) {
      NeuroDom.loadSiteConfig(config);
    }

    NeuroContext.setThresholds(THRESHOLDS.SEMI, THRESHOLDS.HIGH);
  }

  const TIER_CLASSES = {
    'relevant':      { add: 'nf-relevant',      remove: ['nf-blurred', 'nf-semi-relevant'] },
    'semi-relevant': { add: 'nf-semi-relevant',  remove: ['nf-blurred', 'nf-relevant'] },
    'irrelevant':    { add: 'nf-blurred',        remove: ['nf-relevant', 'nf-semi-relevant'] },
  };

  async function runFullScan() {
    if (!focusActive) return;

    const feedItems = NeuroDom.detectFeedItems();

    const distractions = NeuroDom.findDistractions();
    const distractionOps = distractions.map(el => ({
      el,
      add: ['nf-hidden'],
    }));
    NeuroDom.batchApplyClasses(distractionOps);

    if (NeuroContext.hasIntent()) {
      if (NeuroContext.hasApiKey() && feedItems.length > 0) {
        const preOps = feedItems
          .filter(el => !el.classList.contains('nf-relevant') && !el.classList.contains('nf-blurred') && !el.classList.contains('nf-semi-relevant'))
          .map(el => ({ el, add: ['nf-semi-relevant'] }));
        NeuroDom.batchApplyClasses(preOps);
      }

      const scores = await NeuroContext.batchScoreAPI(feedItems);
      const ops = [];

      scores.forEach(({ score, tier }, el) => {
        const mapping = TIER_CLASSES[tier];
        ops.push({
          el,
          add: [mapping.add],
          remove: mapping.remove,
        });
      });

      NeuroDom.batchApplyClasses(ops);
    } else {
      const ops = feedItems.map(el => ({
        el,
        remove: ['nf-blurred', 'nf-relevant', 'nf-semi-relevant'],
      }));
      NeuroDom.batchApplyClasses(ops);
    }
  }

  async function handleNewElements(newElements) {
    if (!focusActive) return;

    const distractions = NeuroDom.findDistractions();
    const unhiddenDistractions = distractions.filter(el => !el.classList.contains('nf-hidden'));
    if (unhiddenDistractions.length > 0) {
      const ops = unhiddenDistractions.map(el => ({ el, add: ['nf-hidden'] }));
      NeuroDom.batchApplyClasses(ops);
    }

    const unclassified = newElements.filter(el => {
      return !el.classList.contains('nf-blurred') &&
             !el.classList.contains('nf-semi-relevant') &&
             !el.classList.contains('nf-relevant');
    });

    if (unclassified.length === 0) return;

    if (NeuroContext.hasIntent()) {
      if (NeuroContext.hasApiKey()) {
        const preOps = unclassified.map(el => ({ el, add: ['nf-semi-relevant'] }));
        NeuroDom.batchApplyClasses(preOps);
      }

      const scores = await NeuroContext.batchScoreAPI(unclassified);
      const ops = [];

      scores.forEach(({ score, tier }, el) => {
        const mapping = TIER_CLASSES[tier];
        ops.push({
          el,
          add: [mapping.add],
          remove: mapping.remove,
        });
      });

      NeuroDom.batchApplyClasses(ops);
    } else {
      const ops = unclassified.map(el => ({
        el,
        remove: ['nf-blurred', 'nf-relevant', 'nf-semi-relevant'],
      }));
      NeuroDom.batchApplyClasses(ops);
    }
  }

  function activateFocus(intents) {
    focusActive = true;

    if (typeof intents === 'string') {
      currentIntents = intents.trim().length > 0 ? [intents] : [];
    } else if (Array.isArray(intents)) {
      currentIntents = intents;
    } else {
      currentIntents = [];
    }

    currentIntent = currentIntents.join(', ');

    if (currentIntents.length > 0) {
      NeuroContext.setIntent(currentIntents);
    }

    NeuroDom.setActive(true);
    NeuroDom.startObserving(handleNewElements);

    NeuroUI.activate(currentIntent);

    runFullScan();

    if (typeof NeuroDom.hideYouTubeShorts === 'function') {
      NeuroDom.hideYouTubeShorts();
    }

    _periodicalScanTimer = setInterval(() => {
      if (focusActive) {
        if (typeof NeuroDom.hideYouTubeShorts === 'function') {
          NeuroDom.hideYouTubeShorts();
        }
        const feedItems = NeuroDom.detectFeedItems();
        if (feedItems.length > 0) {
          handleNewElements(feedItems);
        }
      }
    }, 1500);

    document.body.classList.add('neurofocus-active');
  }

  function deactivateFocus() {
    focusActive = false;
    currentIntent = '';
    currentIntents = [];

    if (_periodicalScanTimer) {
      clearInterval(_periodicalScanTimer);
      _periodicalScanTimer = null;
    }

    NeuroDom.setActive(false);
    NeuroDom.stopObserving();
    NeuroDom.cleanAll();

    NeuroUI.deactivate();

    document.body.classList.remove('neurofocus-active');
  }

  function updateIntent(intents) {
    if (typeof intents === 'string') {
      currentIntents = intents.trim().length > 0 ? [intents] : [];
    } else if (Array.isArray(intents)) {
      currentIntents = intents;
    } else {
      currentIntents = [];
    }

    currentIntent = currentIntents.join(', ');

    NeuroContext.setIntent(currentIntents);

    NeuroUI.updateIntent(currentIntent);

    if (focusActive) {
      runFullScan();
    }
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
      case 'FOCUS_ON':
        activateFocus(message.intents || message.intent);
        sendResponse({ status: 'ok', active: true });
        break;

      case 'FOCUS_OFF':
        deactivateFocus();
        sendResponse({ status: 'ok', active: false });
        break;

      case 'UPDATE_INTENT':
        updateIntent(message.intents || message.intent);
        sendResponse({ status: 'ok', intents: currentIntents, intent: currentIntent });
        break;

      case 'UPDATE_API_KEY':
        NeuroContext.setApiKey(message.apiKey);
        sendResponse({ status: 'ok' });
        break;

      case 'GET_STATUS':
        sendResponse({
          status: 'ok',
          active: focusActive,
          intents: currentIntents,
          intent: currentIntent,
        });
        break;

      case 'RESCAN':
        if (focusActive) {
          runFullScan();
        }
        sendResponse({ status: 'ok' });
        break;

      default:
        sendResponse({ status: 'unknown_message' });
    }

    return true;
  });

  function initialize() {
    initSiteConfig();

    chrome.storage.local.get(['focusActive', 'userIntent', 'userIntents', 'apiKey'], (data) => {
      if (data.apiKey) {
        NeuroContext.setApiKey(data.apiKey);
      }

      if (data.focusActive) {
        const intents = data.userIntents || (data.userIntent ? [data.userIntent] : []);
        activateFocus(intents);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    setTimeout(initialize, 500);
  }

  let lastUrl = location.href;
  const urlObserver = new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      if (focusActive) {
        setTimeout(runFullScan, 800);
      }
    }
  });
  urlObserver.observe(document.body, { childList: true, subtree: true });

})();

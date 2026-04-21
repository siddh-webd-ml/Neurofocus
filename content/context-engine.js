const NeuroContext = (() => {
  'use strict';

  const porterStem = (() => {
    const step2list = {
      ational:'ate', tional:'tion', enci:'ence', anci:'ance', izer:'ize',
      bli:'ble', alli:'al', entli:'ent', eli:'e', ousli:'ous', ization:'ize',
      ation:'ate', ator:'ate', alism:'al', iveness:'ive', fulness:'ful',
      ousness:'ous', aliti:'al', iviti:'ive', biliti:'ble', logi:'log'
    };
    const step3list = {
      icate:'ic', ative:'', alize:'al', iciti:'ic', ical:'ic', ful:'', ness:''
    };
    const c = '[^aeiou]', v = '[aeiouy]';
    const C = c + '[^aeiouy]*', V = v + '[aeiou]*';
    const mgr0 = new RegExp('^(' + C + ')?' + V + C);
    const meq1 = new RegExp('^(' + C + ')?' + V + C + '(' + V + ')?$');
    const mgr1 = new RegExp('^(' + C + ')?' + V + C + V + C);
    const s_v = new RegExp('^(' + C + ')?' + v);

    return function stem(w) {
      if (w.length < 3) return w;
      let stem, suffix, re, re2, re3, re4;
      const firstch = w.charAt(0);
      if (firstch === 'y') w = firstch.toUpperCase() + w.substr(1);

      re = /^(.+?)(ss|i)es$/; re2 = /^(.+?)([^s])s$/;
      if (re.test(w)) w = w.replace(re, '$1$2');
      else if (re2.test(w)) w = w.replace(re2, '$1$2');

      re = /^(.+?)eed$/; re2 = /^(.+?)(ed|ing)$/;
      if (re.test(w)) {
        const fp = re.exec(w);
        if (mgr0.test(fp[1])) w = w.slice(0, -1);
      } else if (re2.test(w)) {
        const fp = re2.exec(w);
        stem = fp[1];
        if (s_v.test(stem)) {
          w = stem;
          re2 = /(at|bl|iz)$/; re3 = /([^aeiouylsz])\1$/; re4 = new RegExp('^' + C + v + '[^aeiouwxy]$');
          if (re2.test(w)) w += 'e';
          else if (re3.test(w)) w = w.slice(0, -1);
          else if (re4.test(w)) w += 'e';
        }
      }

      re = /^(.+?)y$/;
      if (re.test(w)) { const fp = re.exec(w); stem = fp[1]; if (s_v.test(stem)) w = stem + 'i'; }

      re = /^(.+?)(ational|tional|enci|anci|izer|bli|alli|entli|eli|ousli|ization|ation|ator|alism|iveness|fulness|ousness|aliti|iviti|biliti|logi)$/;
      if (re.test(w)) { const fp = re.exec(w); stem = fp[1]; suffix = fp[2]; if (mgr0.test(stem)) w = stem + step2list[suffix]; }

      re = /^(.+?)(icate|ative|alize|iciti|ical|ful|ness)$/;
      if (re.test(w)) { const fp = re.exec(w); stem = fp[1]; suffix = fp[2]; if (mgr0.test(stem)) w = stem + step3list[suffix]; }

      re = /^(.+?)(al|ance|ence|er|ic|able|ible|ant|ement|ment|ent|ou|ism|ate|iti|ous|ive|ize)$/;
      re2 = /^(.+?)(s|t)(ion)$/;
      if (re.test(w)) { const fp = re.exec(w); stem = fp[1]; if (mgr1.test(stem)) w = stem; }
      else if (re2.test(w)) { const fp = re2.exec(w); stem = fp[1] + fp[2]; if (mgr1.test(stem)) w = stem; }

      re = /^(.+?)e$/;
      if (re.test(w)) {
        const fp = re.exec(w); stem = fp[1];
        const a = mgr1.test(stem);
        const b = meq1.test(stem);
        const c2 = new RegExp('^' + C + v + '[^aeiouwxy]$').test(stem);
        if (a || (b && !c2)) w = stem;
      }
      re = /ll$/; if (re.test(w) && mgr1.test(w)) w = w.slice(0, -1);
      if (firstch === 'y') w = firstch.toLowerCase() + w.substr(1);
      return w;
    };
  })();

  const STOP_WORDS = new Set([
    'a','an','the','and','or','but','in','on','at','to','for','of','is',
    'it','this','that','with','as','was','are','be','has','had','have',
    'do','does','did','will','would','could','should','may','might',
    'can','not','no','so','if','then','than','too','very','just','about',
    'after','all','also','am','any','because','been','before','being',
    'between','both','by','each','few','from','further','get','got',
    'he','her','here','him','his','how','i','into','its','let','me',
    'more','most','my','myself','now','off','once','only','other',
    'our','out','own','same','she','some','such','them','there',
    'they','those','through','under','until','up','us','we','what',
    'when','where','which','while','who','whom','why','you','your',
    'video','watch','new','like','one','make','way','best','top',
    'youtube','subscribe','channel'
  ]);

  const ANTI_KEYWORDS = {
    study: ['comedy','funny','laugh','joke','prank','meme','vlog','gameplay','gaming','music','entertainment','movie','film','trailer','streaming','watch','reaction'],
    education: ['entertainment','comedy','gaming','movie','vlog','music','sports','reaction'],
    programming: ['comedy','gaming','entertainment','music','vlog','movie'],
  };

  const SYNONYMS = {
    python: ['programming','coding','django','flask','pytorch','numpy','pandas'],
    javascript: ['js','typescript','react','nodejs','frontend','npm','vue','angular','webpack'],
    react: ['jsx','hooks','redux','nextjs','component','frontend'],
    css: ['styling','sass','tailwind','flexbox','grid','animation'],
    html: ['markup','dom','web','frontend'],
    rust: ['systems','cargo','memory','performance','wasm'],
    java: ['spring','maven','gradle','android','jvm','kotlin'],
    cpp: ['cplusplus','stl','pointer','compiler','systems'],
    machine: ['ml','ai','neural','model','training','deep'],
    ai: ['artificial','intelligence','genai','chatgpt','openai','gemini','llm','gpt','neural','ml','deep','machine','learning','model','training','generative','language','model','transformer'],
    learning: ['tutorial','course','lesson','study','guide','education','lecture','explained','beginner','advanced','masterclass','bootcamp','ai','generative','neural','network'],
    study: ['education','academic','lecture','exam','revision','notes','learn','tutorial','course','lesson','explained','guide','theory','concept','fundamentals','basics','introduction','intro','ai','artificial','intelligence','machine','learning','neural','model','training','research'],
    education: ['school','university','college','academic','lecture','classroom','professor','teacher','student','curriculum'],
    dsa: ['leetcode','algorithm','data','structures','coding','structure','sorting','graph','tree','array','linked','stack','queue','heap','dynamic','recursion','competitive'],
    algorithm: ['sorting','searching','graph','dynamic','greedy','recursion','complexity','leetcode','codeforces','competitive'],
    math: ['algebra','calculus','geometry','statistics','trigonometry','probability','linear','equation','theorem','proof','arithmetic','number'],
    science: ['physics','chemistry','biology','experiment','research','scientific','hypothesis','theory','lab'],
    physics: ['mechanics','quantum','relativity','thermodynamics','optics','electromagnetism','kinematics','force','energy','wave'],
    chemistry: ['organic','inorganic','reaction','molecule','atom','periodic','bond','element','compound'],
    biology: ['cell','genetics','evolution','anatomy','ecology','organism','dna','protein','species'],
    history: ['ancient','civilization','war','empire','century','revolution','colonial','medieval'],
    english: ['grammar','literature','essay','writing','vocabulary','comprehension','poetry','novel'],
    music: ['song','audio','beat','melody','producer','cover','instrumental','singer','album','playlist','rap','hiphop','pop','rock'],
    gaming: ['game','gameplay','esports','stream','twitch','playthrough','gamer','ps5','xbox','minecraft','fortnite','valorant','gta'],
    fitness: ['workout','exercise','gym','health','cardio','muscle','weight','diet','yoga','training'],
    comedy: ['funny','laugh','joke','standup','prank','meme','hilarious','sketch','bloopers','roast'],
    entertainment: ['movie','film','cinema','trailer','show','clip','vlog','netflix','series','drama','reality'],
    cooking: ['recipe','food','chef','kitchen','baking','meal','cuisine','ingredient'],
    travel: ['destination','trip','tourism','adventure','explore','flight','hotel','country'],
  };

  const META_INTENTS = {
    study: ['learning','study','education','math','science','physics','chemistry','biology','history','english','dsa','algorithm'],
    education: ['learning','study','education','math','science','history','english'],
    academic: ['learning','study','education','math','science','physics','chemistry','biology','history','english'],
    programming: ['python','javascript','react','css','html','rust','java','cpp','dsa','algorithm'],
    coding: ['python','javascript','react','css','html','rust','java','cpp','dsa','algorithm'],
    tech: ['python','javascript','react','ai','machine','dsa'],
    creative: ['music','cooking','travel'],
  };

  function tokenize(text) {
    if (!text) return [];
    return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 1 && !STOP_WORDS.has(w));
  }

  let _intents = [];
  let _intentData = [];
  let _threshold = 0.5;
  let _highThreshold = 1.0;
  let _apiKey = CONFIG.GEMINI_API_KEY || '';
  let _geminiExpanded = new Set();
  const _scoreCache = new Map();

  function setApiKey(key) { _apiKey = key || CONFIG.GEMINI_API_KEY || ''; }
  function hasApiKey() { return _apiKey.length > 5; }

  async function expandIntentsViaGemini(intentsArray) {
    if (!hasApiKey() || intentsArray.length === 0) return;
    try {
      const res = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          target: 'background', type: 'EXPAND_INTENT',
          apiKey: _apiKey, intents: intentsArray.join(', ')
        }, r => chrome.runtime.lastError ? reject(chrome.runtime.lastError) : resolve(r));
      });
      if (res && res.status === 'ok' && Array.isArray(res.keywords)) {
        _geminiExpanded = new Set(res.keywords.map(k => k.toLowerCase().trim()).filter(k => k.length > 1));
        rebuildIntentData();
      }
    } catch (e) { }
  }

  function setIntent(input) {
    const arr = Array.isArray(input) ? input : [input];
    _intents = arr.map(i => String(i).trim()).filter(i => i.length > 0);
    _scoreCache.clear();
    _geminiExpanded.clear();
    rebuildIntentData();
    expandIntentsViaGemini(_intents);
  }

  function rebuildIntentData() {
    _intentData = _intents.map(intentText => {
      const intentRaw = intentText.toLowerCase();
      const intentTokens = tokenize(intentText);
      const intentStemmed = intentTokens.map(w => porterStem(w));
      const syns = new Set();

      for (const token of intentTokens) {
        if (META_INTENTS[token]) {
          for (const cat of META_INTENTS[token]) {
            syns.add(cat);
            if (SYNONYMS[cat]) SYNONYMS[cat].forEach(s => syns.add(s));
          }
        }
        if (SYNONYMS[token]) SYNONYMS[token].forEach(s => syns.add(s));
        for (const [key, values] of Object.entries(SYNONYMS)) {
          if (key === token || values.includes(token)) {
            syns.add(key);
            values.forEach(v => syns.add(v));
          }
        }
      }

      for (const kw of _geminiExpanded) syns.add(kw);

      const synonymsArr = Array.from(syns);
      const stemmedSyns = [...new Set(synonymsArr.map(s => porterStem(s)))];

      let antiKeywords = [];
      for (const token of intentTokens) {
        if (ANTI_KEYWORDS[token]) {
          antiKeywords = [...new Set([...antiKeywords, ...ANTI_KEYWORDS[token]])];
        }
      }
      for (const [key, values] of Object.entries(ANTI_KEYWORDS)) {
        if (intentTokens.includes(key)) {
          antiKeywords = [...new Set([...antiKeywords, ...values])];
        }
      }

      return { 
        raw: intentRaw, 
        tokens: intentTokens, 
        stemmedTokens: intentStemmed, 
        synonyms: synonymsArr, 
        stemmedSynonyms: stemmedSyns,
        antiKeywords: antiKeywords,
        antiKeywordsStemmed: [...new Set(antiKeywords.map(k => porterStem(k)))]
      };
    });
    _scoreCache.clear();
  }

  function setThresholds(semi, high) { _threshold = semi; _highThreshold = high; }

  function extractText(el) {
    const parts = [];
    const cfg = typeof NeuroDom !== 'undefined' ? NeuroDom.getSiteConfig() : null;
    const titleSels = cfg ? cfg.titleSelectors : ['h3', '#video-title'];
    for (const sel of titleSels) {
      try {
        for (const t of el.querySelectorAll(sel)) {
          const txt = t.textContent || t.getAttribute('aria-label') || '';
          if (txt.trim()) parts.push(txt.trim());
        }
      } catch (e) { }
    }
    const aria = el.getAttribute('aria-label');
    if (aria) parts.push(aria);
    const metaSels = cfg ? cfg.metadataSelectors : ['#channel-name'];
    for (const sel of metaSels) {
      try {
        for (const m of el.querySelectorAll(sel)) {
          if (m.textContent.trim()) parts.push(m.textContent.trim());
        }
      } catch (e) { }
    }
    return parts.join(' ').toLowerCase();
  }

  function scoreIntentAgainstElement(intentData, textRaw, docTokens) {
    let score = 0;
    const docStemmed = docTokens.map(w => porterStem(w));

    if (textRaw.includes(intentData.raw)) return 2.0;

    let antiPenalty = 0;
    for (const aw of intentData.antiKeywords) {
      if (docTokens.includes(aw)) antiPenalty += 0.15;
      else if (docStemmed.includes(porterStem(aw))) antiPenalty += 0.12;
      else {
        for (const dw of docTokens) {
          if (dw.includes(aw) || aw.includes(dw)) { antiPenalty += 0.1; break; }
        }
      }
    }

    let directMatches = 0;
    for (const iw of intentData.tokens) {
      if (docTokens.includes(iw)) {
        directMatches++;
      } else if (docStemmed.includes(porterStem(iw))) {
        directMatches += 0.9;
      } else {
        for (const dw of docTokens) {
          if (dw.includes(iw) || iw.includes(dw)) { directMatches += 0.8; break; }
        }
      }
    }

    let synScore = 0, synHits = 0;
    for (let i = 0; i < intentData.synonyms.length; i++) {
      const syn = intentData.synonyms[i];
      const synStem = intentData.stemmedSynonyms[i] || porterStem(syn);
      if (docTokens.includes(syn)) { synScore += 0.5; synHits++; }
      else if (docStemmed.includes(synStem)) { synScore += 0.45; synHits++; }
      else {
        for (const dw of docTokens) {
          if (dw.length > 3 && (dw.includes(syn) || syn.includes(dw))) { synScore += 0.35; synHits++; break; }
        }
      }
    }

    if (intentData.tokens.length > 0) score = (directMatches + synScore) / Math.max(1, intentData.tokens.length);
    if (directMatches === 0 && synHits <= 1) score *= 0.2;
    else if (directMatches === 0 && synHits === 2) score *= 0.5;
    else if (directMatches === 0 && synHits >= 3) score *= 0.6;
    
    score = Math.max(0, score - antiPenalty);
    return score;
  }

  function scoreElement(el) {
    if (_intentData.length === 0) return { score: 0, matchedIntent: null };
    const textRaw = extractText(el);
    if (!textRaw) return { score: 0, matchedIntent: null };
    const docTokens = tokenize(textRaw);
    let bestScore = 0, bestIdx = -1;
    for (let i = 0; i < _intentData.length; i++) {
      const s = scoreIntentAgainstElement(_intentData[i], textRaw, docTokens);
      if (s > bestScore) { bestScore = s; bestIdx = i; }
    }
    return { score: bestScore, matchedIntent: bestIdx >= 0 ? _intents[bestIdx] : null };
  }

  function classifyScore(score) {
    if (score >= _highThreshold) return 'relevant';
    if (score >= _threshold) return 'semi-relevant';
    return 'irrelevant';
  }

  function batchScore(elements) {
    const results = new Map();
    if (_intentData.length === 0) {
      for (const el of elements) results.set(el, { score: 0, tier: 'irrelevant', matchedIntent: null });
      return results;
    }
    for (const el of elements) {
      const { score, matchedIntent } = scoreElement(el);
      results.set(el, { score, tier: classifyScore(score), matchedIntent });
    }
    return results;
  }

  function generatePrompt(elementsData, intent) {
    const list = elementsData.map((d, i) => `${i + 1}. "${d.text}"`).join('\n');
    return `You are a strict AI focus assistant. The user is in Focus Mode and their ONLY goal is: "${intent}".
Your job is to protect the user's attention. Score each video/post below as "relevant", "semi-relevant", or "irrelevant".
- "relevant": Highly educational or directly related to the user's goal.
- "semi-relevant": Tangentially related, but might be useful.
- "irrelevant": Entertainment, gaming, comedy, drama, vlogs, politics, or any blatant distraction. Be RUTHLESS.

Return ONLY a flat JSON array of lowercase strings matching the exact labels above. Length must be EXACTLY ${elementsData.length}. No markdown, no numbering.
Data:\n${list}`;
  }

  async function batchScoreAPI(elements) {
    if (!hasApiKey() || _intentData.length === 0) return batchScore(elements);
    const intentStr = _intents.join(', ');
    const results = new Map();
    const toScore = [];

    for (const el of elements) {
      const text = extractText(el);
      if (!text.trim()) { results.set(el, { score: 0, tier: 'irrelevant', matchedIntent: null }); continue; }
      const ck = intentStr + '|' + text;
      if (_scoreCache.has(ck)) { results.set(el, _scoreCache.get(ck)); continue; }
      const lr = scoreElement(el);
      if (lr.score >= _highThreshold) { lr.tier = 'relevant'; results.set(el, lr); _scoreCache.set(ck, lr); continue; }
      toScore.push({ el, text, cacheKey: ck });
    }

    if (toScore.length === 0) return results;

    try {
      const response = await new Promise(resolve => {
        chrome.runtime.sendMessage({ target: 'background', type: 'API_SCORE_BATCH', apiKey: _apiKey, prompt: generatePrompt(toScore, intentStr) }, resolve);
      });
      if (response && response.status === 'ok' && Array.isArray(response.results)) {
        response.results.forEach((tierStr, idx) => {
          if (idx < toScore.length) {
            const item = toScore[idx];
            const tier = ['relevant','semi-relevant','irrelevant'].includes(tierStr) ? tierStr : 'irrelevant';
            const r = { score: 1.0, tier, matchedIntent: intentStr };
            results.set(item.el, r);
            _scoreCache.set(item.cacheKey, r);
          }
        });
      } else throw new Error('bad response');
    } catch (e) {
      for (const item of toScore) {
        const lr = scoreElement(item.el);
        results.set(item.el, { ...lr, tier: classifyScore(lr.score) });
      }
    }
    return results;
  }

  function hasIntent() { return _intents.length > 0; }

  return { setIntent, setApiKey, hasApiKey, setThresholds, scoreElement, classifyScore, batchScore, batchScoreAPI, hasIntent, extractText, tokenize, porterStem };
})();

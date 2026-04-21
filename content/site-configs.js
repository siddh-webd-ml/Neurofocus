const SiteConfigs = (() => {
  'use strict';

  const configs = {
    youtube: {
      id: 'youtube',
      name: 'YouTube',
      hostPattern: /youtube\.com/i,
      feedItems: [
        'ytd-rich-item-renderer','ytd-video-renderer','ytd-compact-video-renderer',
        'ytd-grid-video-renderer','ytd-shelf-renderer','yt-lockup-view-model',
        'ytd-playlist-video-renderer','ytd-movie-renderer','ytd-channel-link-renderer',
        'ytd-video-preview','yt-simple-endpoint',
      ],
      distractions: [
        '#secondary','#comments','ytd-watch-next-secondary-results-renderer','#related',
        'ytd-mini-guide-renderer','ytd-reel-shelf-renderer','ytd-rich-shelf-renderer[is-shorts]',
        'ytd-reel-item-renderer','ytd-shorts','ytd-rich-section-renderer','[is-shorts]',
        '[title="Shorts"]','[aria-label="Shorts"]',
        'ytd-rich-item-renderer:has(ytd-shortsLockupViewModel)',
        'ytd-rich-item-renderer:has([overlay-style="SHORTS"])',
        'ytd-rich-item-renderer:has(a[href*="/shorts/"])',
        'yt-lockup-view-model:has(a[href*="/shorts/"])',
        'ytd-shelf-renderer:has(ytd-reel-item-renderer)',
        'div[role="region"]:has(ytd-reel-shelf-renderer)',
        'ytd-horizontal-card-list-renderer',
        '[data-content-type="shorts"]',
        'yt-formatted-string:has-text(Shorts)',
      ],
      feedContainers: ['ytd-rich-grid-renderer','ytd-section-list-renderer','#contents'],
      titleSelectors: ['#video-title','h3','.title','[aria-label]','yt-formatted-string#video-title','.yt-core-attributed-string'],
      metadataSelectors: ['#channel-name','#metadata-line','.ytd-channel-name'],
    },
    reddit: {
      id: 'reddit',
      name: 'Reddit',
      hostPattern: /reddit\.com/i,
      feedItems: ['shreddit-post','[data-testid="post-container"]','.Post','article'],
      distractions: ['[data-testid="sidebar"]','.sidebar','#right-sidebar-container'],
      feedContainers: ['shreddit-feed','[data-testid="posts-list"]','.rpBJOHq2PR60pnwJlUyP0'],
      titleSelectors: ['[data-testid="post-title"]','h3','.title a','[slot="title"]'],
      metadataSelectors: ['[data-testid="subreddit-name"]','[data-testid="post-author"]','.subreddit'],
    },
    twitter: {
      id: 'twitter',
      name: 'Twitter / X',
      hostPattern: /twitter\.com|x\.com/i,
      feedItems: ['[data-testid="tweet"]','[data-testid="tweetText"]','article[role="article"]'],
      distractions: ['[data-testid="sidebarColumn"]','[aria-label="Trending"]','[aria-label="Who to follow"]'],
      feedContainers: ['[data-testid="primaryColumn"]','section[role="region"]'],
      titleSelectors: ['[data-testid="tweetText"]','[lang]'],
      metadataSelectors: ['[data-testid="User-Name"]','time'],
    },
  };

  function detectSite(hostname) {
    for (const key in configs) {
      if (configs[key].hostPattern.test(hostname)) return configs[key];
    }
    return null;
  }

  function getConfig(id) { return configs[id] || null; }
  function supportedSites() { return Object.keys(configs); }

  return { detectSite, getConfig, supportedSites };
})();

// Function to collect links from anchors
function collectLinksFromAnchors(doc) {
  const anchors = doc.querySelectorAll('a[href]');
  const links = [];
  
  anchors.forEach(anchor => {
    const href = anchor.href;
    const text = anchor.textContent.trim();
    const isAjax = anchor.hasAttribute('data-ajax') || anchor.onclick;
    
    if (href && !href.startsWith('javascript:')) {
      links.push({
        href: href,
        text: text || href,
        isAjax: isAjax,
        timestamp: Date.now()
      });
    }
  });
  
  return links;
}

// Watch for new anchors using MutationObserver
function watchForNewAnchors(doc) {
  const observer = new MutationObserver(async (mutations) => {
    let shouldUpdate = false;
    
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        const hasNewAnchors = [...mutation.addedNodes].some(node => 
          node.nodeType === 1 && (node.tagName === 'A' || node.querySelector?.('a'))
        );
        if (hasNewAnchors) {
          shouldUpdate = true;
          break;
        }
      }
    }
    
    if (shouldUpdate) {
      await updateCollectedLinks();
    }
  });
  
  observer.observe(doc.body || doc, {
    childList: true,
    subtree: true
  });
}

// Update collected links in storage
async function updateCollectedLinks() {
  const links = collectLinksFromAnchors(document);
  
  // Get existing links
  const stored = await chrome.storage.local.get('allCollectedLinks');
  const existing = stored.allCollectedLinks || [];
  
  // Merge with existing (avoid duplicates)
  const existingUrls = new Set(existing.map(link => link.href));
  const newLinks = links.filter(link => !existingUrls.has(link.href));
  
  if (newLinks.length > 0) {
    const allLinks = [...existing, ...newLinks];
    await chrome.storage.local.set({ allCollectedLinks: allLinks });
  }
}

// Initialize
async function init() {
  // Check if we're in RecScr iframe
  const isRecScrFrame = window.frameElement?.id === 'RecScr';
  
  console.log('[LinkCollector] Initializing in', isRecScrFrame ? 'RecScr frame' : 'main frame');
  
  // Initial collection
  await updateCollectedLinks();
  
  // Watch for changes
  watchForNewAnchors(document);
  
  // Also watch iframes
  if (window.top === window) {
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(iframe => {
      try {
        if (iframe.contentDocument) {
          watchForNewAnchors(iframe.contentDocument);
        }
      } catch (e) {
        console.log('[LinkCollector] Cannot access iframe:', e);
      }
    });
  }
}

// Run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
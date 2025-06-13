// Render links in the panel
function renderLinks(links) {
  const linkList = document.getElementById('linkList');
  const linkCount = document.getElementById('linkCount');
  
  // Update count
  linkCount.textContent = `${links.length} links collected`;
  
  // Clear existing content
  linkList.innerHTML = '';
  
  if (links.length === 0) {
    linkList.innerHTML = '<div class="empty-state">No links collected yet. Browse pages to collect links.</div>';
    return;
  }
  
  // Sort links by timestamp (newest first)
  links.sort((a, b) => b.timestamp - a.timestamp);
  
  // Create link elements
  links.forEach(link => {
    const linkItem = document.createElement('div');
    linkItem.className = 'link-item' + (link.isAjax ? ' ajax' : '');
    
    const anchor = document.createElement('a');
    anchor.href = link.href;
    anchor.target = '_blank';
    anchor.textContent = link.href;
    
    const linkText = document.createElement('div');
    linkText.className = 'link-text';
    linkText.textContent = link.text || 'No text';
    
    const linkMeta = document.createElement('div');
    linkMeta.className = 'link-meta';
    const date = new Date(link.timestamp);
    linkMeta.textContent = `Collected at ${date.toLocaleTimeString()}`;
    
    linkItem.appendChild(anchor);
    linkItem.appendChild(linkText);
    linkItem.appendChild(linkMeta);
    linkList.appendChild(linkItem);
  });
}

// Clear button handler
document.getElementById('clearBtn').addEventListener('click', async () => {
  if (confirm('Clear all collected links?')) {
    await chrome.storage.local.set({ allCollectedLinks: [] });
    renderLinks([]);
  }
});

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.allCollectedLinks) {
    const newLinks = changes.allCollectedLinks.newValue || [];
    renderLinks(newLinks);
  }
});

// Initial load
chrome.storage.local.get('allCollectedLinks').then(stored => {
  const links = stored.allCollectedLinks || [];
  renderLinks(links);
});
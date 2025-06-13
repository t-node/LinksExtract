// ----------------------------------------------------------------
// 1) Normal panel in TOP FRAME with SelectorHub-style shifting
// ----------------------------------------------------------------
async function initTopFrameOverlay() {
  console.log('[LinkCollector:DEBUG] initTopFrameOverlay() in top frame.');

  // Remove old overlay if any
  let oldOverlay = document.getElementById('incremental-link-overlay');
  if (oldOverlay) {
    console.warn('[LinkCollector:DEBUG] Found existing overlay in top frame => removing it...');
    // Restore body margin when removing
    document.body.style.marginRight = '0px';
    oldOverlay.remove();
  }

  // Create overlay container
  const overlay = document.createElement('div');
  overlay.id = 'incremental-link-overlay';

  console.log('[LinkCollector:DEBUG] Created overlay DIV with id="incremental-link-overlay" in top frame.');

  // Build header
  const header = document.createElement('div');
  header.id = 'incremental-link-header';

  const title = document.createElement('span');
  title.id = 'linkCollectorTitle';
  title.textContent = 'All Collected Links';

  const clearBtn = document.createElement('button');
  clearBtn.id = 'clearBtn';
  clearBtn.textContent = 'Clear';

  const toggleBtn = document.createElement('button');
  toggleBtn.id = 'toggleBtn';
  toggleBtn.textContent = 'Open';

  // Assemble header
  header.appendChild(title);
  header.appendChild(clearBtn);
  header.appendChild(toggleBtn);

  // Link list container
  const linkList = document.createElement('div');
  linkList.id = 'incremental-link-list';

  // Put them all in the overlay
  overlay.appendChild(header);
  overlay.appendChild(linkList);

  try {
    document.body.appendChild(overlay);
    console.log('[LinkCollector:DEBUG] Appended overlay to document.body (TOP FRAME).');
  } catch (err) {
    console.error('[LinkCollector:DEBUG] Error appending overlay in top frame:', err);
    return;
  }

  // Panel state management
  let isPanelOpen = false;
  let isMinimized = false;

  // Store original margin to restore later
  const originalMargin = document.body.style.marginRight || '0px';

  // Show panel function - SelectorHub style
  const showPanel = () => {
    const panelWidth = overlay.offsetWidth || 300;
    
    // Create space by adding margin to body (SelectorHub approach)
    document.body.style.marginRight = panelWidth + 'px';
    
    // Show the panel by sliding it in
    overlay.classList.add('active');
    
    isPanelOpen = true;
    toggleBtn.textContent = isMinimized ? 'Expand' : 'Close';
    
    console.log('[LinkCollector:DEBUG] Panel shown, body margin set to:', panelWidth + 'px');
  };

  // Hide panel function
  const hidePanel = () => {
    // Remove body margin (restore original)
    document.body.style.marginRight = originalMargin;
    
    // Hide the panel by sliding it out
    overlay.classList.remove('active');
    
    isPanelOpen = false;
    isMinimized = false;
    overlay.classList.remove('minimized');
    toggleBtn.textContent = 'Open';
    
    console.log('[LinkCollector:DEBUG] Panel hidden, body margin restored');
  };

  // Toggle minimize (only when panel is open)
  const toggleMinimize = () => {
    if (!isPanelOpen) return;
    
    if (!isMinimized) {
      console.log('[LinkCollector:DEBUG] Minimizing panel');
      overlay.classList.add('minimized');
      document.body.style.marginRight = '40px'; // Narrow margin for minimized state
      toggleBtn.textContent = 'Expand';
      isMinimized = true;
    } else {
      console.log('[LinkCollector:DEBUG] Expanding panel');
      overlay.classList.remove('minimized');
      const panelWidth = 300; // Reset to default width
      document.body.style.marginRight = panelWidth + 'px';
      toggleBtn.textContent = 'Close';
      isMinimized = false;
    }
  };

  // Toggle button logic
  toggleBtn.addEventListener('click', () => {
    if (!isPanelOpen) {
      showPanel();
    } else if (!isMinimized) {
      toggleMinimize();
    } else {
      hidePanel();
    }
  });

  // Handle dynamic resizing - update body margin when panel is resized
  const resizeObserver = new ResizeObserver(entries => {
    for (let entry of entries) {
      if (isPanelOpen && !isMinimized) {
        const newWidth = entry.contentRect.width;
        document.body.style.marginRight = newWidth + 'px';
        console.log('[LinkCollector:DEBUG] Panel resized, body margin updated to:', newWidth + 'px');
      }
    }
  });
  resizeObserver.observe(overlay);

  // Clear => remove all links
  clearBtn.addEventListener('click', async () => {
    console.log('[LinkCollector:DEBUG] Clear in top frame => set allCollectedLinks = [].');
    await chrome.storage.local.set({ allCollectedLinks: [] });
  });

  // Listen for storage changes => re-render
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes.allCollectedLinks) {
      const newVal = changes.allCollectedLinks.newValue || [];
      console.log('[LinkCollector:DEBUG] storage.onChanged =>', newVal.length,
        'links => calling renderLinks() in top frame.'
      );
      renderLinks(linkList, newVal);
    }
  });

  // Watch anchors in top frame
  watchForNewAnchors(document);

  // Initial load => render stored
  const stored = await chrome.storage.local.get('allCollectedLinks');
  const existing = stored.allCollectedLinks || [];
  console.log('[LinkCollector:DEBUG] On load (top frame) => found', existing.length, 'links => render now.');
  renderLinks(linkList, existing);

  // Auto-show panel if there are links
  if (existing.length > 0) {
    showPanel();
  }
}

// ----------------------------------------------------------------
// 2) Panel in child iframe with id="RecScr" - same approach
// ----------------------------------------------------------------
async function initOverlayInRecScrFrame() {
  console.log('[LinkCollector:DEBUG] initOverlayInRecScrFrame() => building panel in RecScr child frame.');

  // Remove old overlay if any
  let oldOverlay = document.getElementById('incremental-link-overlay');
  if (oldOverlay) {
    console.warn('[LinkCollector:DEBUG] Found existing overlay in RecScr => removing it...');
    document.body.style.marginRight = '0px';
    oldOverlay.remove();
  }

  // Create overlay container
  const overlay = document.createElement('div');
  overlay.id = 'incremental-link-overlay';

  // Build header (same as above but with RecScr label)
  const header = document.createElement('div');
  header.id = 'incremental-link-header';

  const title = document.createElement('span');
  title.id = 'linkCollectorTitle';
  title.textContent = 'All Collected Links (RecScr)';

  const clearBtn = document.createElement('button');
  clearBtn.id = 'clearBtn';
  clearBtn.textContent = 'Clear';

  const toggleBtn = document.createElement('button');
  toggleBtn.id = 'toggleBtn';
  toggleBtn.textContent = 'Open';

  // Assemble header
  header.appendChild(title);
  header.appendChild(clearBtn);
  header.appendChild(toggleBtn);

  // Link list
  const linkList = document.createElement('div');
  linkList.id = 'incremental-link-list';

  // Put them all together
  overlay.appendChild(header);
  overlay.appendChild(linkList);

  try {
    document.body.appendChild(overlay);
    console.log('[LinkCollector:DEBUG] Appended overlay to document.body (RecScr frame).');
  } catch (err) {
    console.error('[LinkCollector:DEBUG] Error appending overlay in RecScr child frame:', err);
    return;
  }

  // Same panel management logic as top frame
  let isPanelOpen = false;
  let isMinimized = false;
  const originalMargin = document.body.style.marginRight || '0px';

  const showPanel = () => {
    const panelWidth = overlay.offsetWidth || 300;
    document.body.style.marginRight = panelWidth + 'px';
    overlay.classList.add('active');
    isPanelOpen = true;
    toggleBtn.textContent = isMinimized ? 'Expand' : 'Close';
  };

  const hidePanel = () => {
    document.body.style.marginRight = originalMargin;
    overlay.classList.remove('active');
    isPanelOpen = false;
    isMinimized = false;
    overlay.classList.remove('minimized');
    toggleBtn.textContent = 'Open';
  };

  const toggleMinimize = () => {
    if (!isPanelOpen) return;
    
    if (!isMinimized) {
      overlay.classList.add('minimized');
      document.body.style.marginRight = '40px';
      toggleBtn.textContent = 'Expand';
      isMinimized = true;
    } else {
      overlay.classList.remove('minimized');
      document.body.style.marginRight = '300px';
      toggleBtn.textContent = 'Close';
      isMinimized = false;
    }
  };

  toggleBtn.addEventListener('click', () => {
    if (!isPanelOpen) {
      showPanel();
    } else if (!isMinimized) {
      toggleMinimize();
    } else {
      hidePanel();
    }
  });

  const resizeObserver = new ResizeObserver(entries => {
    for (let entry of entries) {
      if (isPanelOpen && !isMinimized) {
        const newWidth = entry.contentRect.width;
        document.body.style.marginRight = newWidth + 'px';
      }
    }
  });
  resizeObserver.observe(overlay);

  // Clear => remove all links
  clearBtn.addEventListener('click', async () => {
    console.log('[LinkCollector:DEBUG] Clear in RecScr => set allCollectedLinks = [].');
    await chrome.storage.local.set({ allCollectedLinks: [] });
  });

  // Listen for storage changes => re-render
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes.allCollectedLinks) {
      const newVal = changes.allCollectedLinks.newValue || [];
      console.log('[LinkCollector:DEBUG] storage.onChanged =>', newVal.length,
        'links => calling renderLinks() in RecScr frame.'
      );
      renderLinks(linkList, newVal);
    }
  });

  // Watch anchors in *this* doc
  watchForNewAnchors(document);

  // Initial load => render
  const stored = await chrome.storage.local.get('allCollectedLinks');
  const existing = stored.allCollectedLinks || [];
  console.log('[LinkCollector:DEBUG] On load (RecScr frame) => found', existing.length, 'links => render now.');
  renderLinks(linkList, existing);
}
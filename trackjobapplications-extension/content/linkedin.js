// --- DOM Extraction ---

function extractLinkedInJob() {
  const position =
    document.querySelector('.job-details-jobs-unified-top-card__job-title')?.textContent?.trim() ||
    document.querySelector('h1.t-24')?.textContent?.trim() ||
    document.querySelector('.jobs-unified-top-card h1')?.textContent?.trim() ||
    '';

  const company =
    document.querySelector('.job-details-jobs-unified-top-card__company-name a')?.textContent?.trim() ||
    document.querySelector('.jobs-unified-top-card__company-name a')?.textContent?.trim() ||
    document.querySelector('.job-details-jobs-unified-top-card__company-name')?.textContent?.trim() ||
    '';

  const url = window.location.href.split('?')[0];

  return { company, position, url, source: 'linkedin' };
}

// --- Message Listener (for popup) ---

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_JOB_DATA') {
    sendResponse(extractLinkedInJob());
  }
});

// --- Inject Save Button ---

const BUTTON_ID = 'tja-save-btn';

function createSaveButton() {
  const btn = document.createElement('button');
  btn.id = BUTTON_ID;
  btn.textContent = 'Save Application';
  btn.style.cssText = `
    background: #10b981;
    color: #fff;
    border: none;
    border-radius: 6px;
    padding: 6px 14px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    margin-left: 10px;
    transition: background 0.15s;
    vertical-align: middle;
  `;

  btn.addEventListener('mouseenter', () => {
    if (!btn.disabled) btn.style.background = '#059669';
  });
  btn.addEventListener('mouseleave', () => {
    if (!btn.disabled) btn.style.background = '#10b981';
  });

  btn.addEventListener('click', async () => {
    const data = extractLinkedInJob();
    if (!data.company || !data.position) {
      btn.textContent = 'Could not extract job info';
      btn.style.background = '#ef4444';
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Saving...';
    btn.style.background = '#6ee7b7';

    const today = new Date().toISOString().split('T')[0];
    const result = await chrome.runtime.sendMessage({
      type: 'ADD_APPLICATION',
      company: data.company,
      position: data.position,
      url: data.url,
      source: data.source,
      applied_date: today,
    });

    if (result.success) {
      btn.textContent = 'Saved!';
      btn.style.background = '#10b981';
    } else {
      btn.textContent = result.error || 'Error';
      btn.style.background = '#ef4444';
      btn.style.color = '#fff';
      setTimeout(() => {
        btn.disabled = false;
        btn.textContent = 'Save Application';
        btn.style.background = '#10b981';
      }, 3000);
    }
  });

  return btn;
}

function injectButton() {
  if (document.getElementById(BUTTON_ID)) return;

  const titleEl =
    document.querySelector('.job-details-jobs-unified-top-card__job-title') ||
    document.querySelector('h1.t-24') ||
    document.querySelector('.jobs-unified-top-card h1');

  if (titleEl) {
    const btn = createSaveButton();
    titleEl.parentElement.appendChild(btn);
  }
}

// Initial inject
injectButton();

// Re-inject on SPA navigation (LinkedIn is a SPA)
const observer = new MutationObserver(() => {
  injectButton();
});

observer.observe(document.body, { childList: true, subtree: true });

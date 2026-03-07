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

  // Try to get the specific job URL from the page
  // LinkedIn uses currentJobId param or /jobs/view/ID/ paths
  let url = window.location.href;
  const jobIdMatch = url.match(/currentJobId=(\d+)/) || url.match(/\/jobs\/view\/(\d+)/);
  if (jobIdMatch) {
    url = `https://www.linkedin.com/jobs/view/${jobIdMatch[1]}/`;
  } else {
    // Fallback: try to find job link in the detail panel
    const jobLink = document.querySelector('a[href*="/jobs/view/"]');
    if (jobLink) {
      const href = jobLink.getAttribute('href');
      const idMatch = href.match(/\/jobs\/view\/(\d+)/);
      if (idMatch) {
        url = `https://www.linkedin.com/jobs/view/${idMatch[1]}/`;
      }
    }
  }

  return { company, position, url, source: 'linkedin' };
}

// --- Message Listener (for popup) ---

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_JOB_DATA') {
    sendResponse(extractLinkedInJob());
  }
});

// --- Inject Two Buttons (To Apply + Applied) ---

const CONTAINER_ID = 'tja-btn-container';

function createActionButton(label, color, hoverColor, status) {
  const btn = document.createElement('button');
  btn.textContent = label;
  btn.dataset.status = status;
  btn.style.cssText = `
    background: ${color};
    color: #fff;
    border: none;
    border-radius: 6px;
    padding: 6px 14px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s;
    vertical-align: middle;
  `;

  btn.addEventListener('mouseenter', () => { if (!btn.disabled) btn.style.background = hoverColor; });
  btn.addEventListener('mouseleave', () => { if (!btn.disabled) btn.style.background = color; });

  btn.addEventListener('click', async () => {
    const data = extractLinkedInJob();
    if (!data.company || !data.position) {
      btn.textContent = 'Could not extract job info';
      btn.style.background = '#ef4444';
      return;
    }

    const container = document.getElementById(CONTAINER_ID);
    container.querySelectorAll('button').forEach(b => { b.disabled = true; });
    btn.textContent = 'Saving...';

    const today = new Date().toISOString().split('T')[0];
    const result = await chrome.runtime.sendMessage({
      type: 'ADD_APPLICATION',
      company: data.company,
      position: data.position,
      url: data.url,
      source: data.source,
      applied_date: today,
      status: status,
    });

    if (result.success) {
      btn.textContent = status === 'to_apply' ? 'Saved!' : 'Applied!';
      btn.style.background = color;
    } else {
      btn.textContent = result.error || 'Error';
      btn.style.background = '#ef4444';
      setTimeout(() => {
        container.querySelectorAll('button').forEach(b => { b.disabled = false; });
        btn.textContent = label;
        btn.style.background = color;
      }, 3000);
    }
  });

  return btn;
}

function injectButton() {
  if (document.getElementById(CONTAINER_ID)) return;

  const titleEl =
    document.querySelector('.job-details-jobs-unified-top-card__job-title') ||
    document.querySelector('h1.t-24') ||
    document.querySelector('.jobs-unified-top-card h1');

  if (titleEl) {
    const container = document.createElement('span');
    container.id = CONTAINER_ID;
    container.style.cssText = 'display: inline-flex; gap: 6px; margin-left: 10px; vertical-align: middle;';
    container.appendChild(createActionButton('To Apply', '#6366f1', '#4f46e5', 'to_apply'));
    container.appendChild(createActionButton('Applied', '#3b82f6', '#2563eb', 'applied'));
    titleEl.parentElement.appendChild(container);
  }
}

// Track current URL to detect SPA navigation
let lastUrl = window.location.href;

function resetButtonIfNavigated() {
  const currentUrl = window.location.href;
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    const existing = document.getElementById(CONTAINER_ID);
    if (existing) existing.remove();
  }
  injectButton();
}

// Initial inject
injectButton();

// Re-inject on SPA navigation (LinkedIn is a SPA)
const observer = new MutationObserver(() => {
  resetButtonIfNavigated();
});

observer.observe(document.body, { childList: true, subtree: true });

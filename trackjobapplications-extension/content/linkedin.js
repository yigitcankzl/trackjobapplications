// --- DOM Extraction ---

function extractLinkedInJob() {
  // Scope searches to the job detail panel to avoid picking up nav/sidebar elements
  const detailPanel =
    document.querySelector('.scaffold-layout__detail') ||
    document.querySelector('.jobs-search__job-details') ||
    document.querySelector('.job-details-jobs-unified-top-card') ||
    document;

  const position =
    detailPanel.querySelector('.job-details-jobs-unified-top-card__job-title a')?.textContent?.trim() ||
    detailPanel.querySelector('.job-details-jobs-unified-top-card__job-title h1')?.textContent?.trim() ||
    detailPanel.querySelector('.job-details-jobs-unified-top-card__job-title')?.textContent?.trim() ||
    detailPanel.querySelector('.t-24.t-bold.inline')?.textContent?.trim() ||
    detailPanel.querySelector('.jobs-unified-top-card__job-title a')?.textContent?.trim() ||
    detailPanel.querySelector('.jobs-unified-top-card__job-title')?.textContent?.trim() ||
    detailPanel.querySelector('h1.t-24.t-bold')?.textContent?.trim() ||
    detailPanel.querySelector('.artdeco-entity-lockup__title')?.textContent?.trim() ||
    '';

  const company =
    detailPanel.querySelector('.job-details-jobs-unified-top-card__company-name a')?.textContent?.trim() ||
    detailPanel.querySelector('.job-details-jobs-unified-top-card__company-name')?.textContent?.trim() ||
    detailPanel.querySelector('.jobs-unified-top-card__company-name a')?.textContent?.trim() ||
    detailPanel.querySelector('.jobs-unified-top-card__company-name')?.textContent?.trim() ||
    detailPanel.querySelector('.artdeco-entity-lockup__subtitle a')?.textContent?.trim() ||
    detailPanel.querySelector('.artdeco-entity-lockup__subtitle')?.textContent?.trim() ||
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

  // Extract the full job description text so it survives if the listing is removed
  const jobPostingContent =
    document.querySelector('.jobs-description__content .jobs-box__html-content')?.innerText?.trim() ||
    document.querySelector('.jobs-description-content__text')?.innerText?.trim() ||
    document.querySelector('#job-details')?.innerText?.trim() ||
    '';

  return {
    company:  sanitizeText(company, 200),
    position: sanitizeText(position, 200),
    url:      sanitizeUrl(url, ['linkedin.com']),
    source:   'linkedin',
    job_posting_content: sanitizeText(jobPostingContent, 50000),
  };
}

// --- Message Listener (for popup) ---

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (sender.id !== chrome.runtime.id) { sendResponse(null); return; }
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
      job_posting_content: data.job_posting_content,
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

  const detailPanel =
    document.querySelector('.scaffold-layout__detail') ||
    document.querySelector('.jobs-search__job-details') ||
    document;

  const titleEl =
    detailPanel.querySelector('.job-details-jobs-unified-top-card__job-title') ||
    detailPanel.querySelector('.jobs-unified-top-card__job-title') ||
    detailPanel.querySelector('.t-24.t-bold.inline') ||
    detailPanel.querySelector('h1.t-24.t-bold') ||
    detailPanel.querySelector('.artdeco-entity-lockup__title');

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
window.addEventListener('beforeunload', () => observer.disconnect());

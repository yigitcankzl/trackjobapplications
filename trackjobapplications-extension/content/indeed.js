// --- DOM Extraction ---

function extractIndeedJob() {
  const position =
    document.querySelector('.jobsearch-JobInfoHeader-title')?.textContent?.trim() ||
    document.querySelector('[data-testid="jobsearch-JobInfoHeader-title"]')?.textContent?.trim() ||
    document.querySelector('h1')?.textContent?.trim() ||
    '';

  const company =
    document.querySelector('[data-testid="inlineHeader-companyName"]')?.textContent?.trim() ||
    document.querySelector('.jobsearch-InlineCompanyRating-companyHeader a')?.textContent?.trim() ||
    document.querySelector('[data-company-name]')?.textContent?.trim() ||
    '';

  const rawUrl = window.location.href.split('#')[0];

  // Extract the full job description text so it survives if the listing is removed
  const jobPostingContent =
    document.querySelector('#jobDescriptionText')?.innerText?.trim() ||
    document.querySelector('.jobsearch-JobComponent-description')?.innerText?.trim() ||
    document.querySelector('[data-testid="jobDescriptionText"]')?.innerText?.trim() ||
    '';

  return {
    company:  sanitizeText(company, 200),
    position: sanitizeText(position, 200),
    url:      sanitizeUrl(rawUrl, ['indeed.com']),
    source:   'indeed',
    job_posting_content: sanitizeText(jobPostingContent, 50000),
  };
}

// --- Message Listener (for popup) ---

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (sender.id !== chrome.runtime.id) { sendResponse(null); return; }
  if (message.type === 'GET_JOB_DATA') {
    sendResponse(extractIndeedJob());
  }
});

// --- Inject Two Buttons (To Apply + Applied) ---

const CONTAINER_ID = 'tja-btn-container';

function createActionButton(label, color, hoverColor, status) {
  const btn = document.createElement('button');
  btn.textContent = label;
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
    const data = extractIndeedJob();
    if (!data.company || !data.position) {
      btn.textContent = chrome.i18n.getMessage('contentExtractError');
      btn.style.background = '#ef4444';
      return;
    }

    const container = document.getElementById(CONTAINER_ID);
    container.querySelectorAll('button').forEach(b => { b.disabled = true; });
    btn.textContent = chrome.i18n.getMessage('contentSaving');

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
      btn.textContent = status === 'to_apply' ? chrome.i18n.getMessage('contentSaved') : chrome.i18n.getMessage('contentAppliedSuccess');
      btn.style.background = color;
    } else {
      btn.textContent = result.error || chrome.i18n.getMessage('contentError');
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
    document.querySelector('.jobsearch-JobInfoHeader-title') ||
    document.querySelector('[data-testid="jobsearch-JobInfoHeader-title"]') ||
    document.querySelector('h1');

  if (titleEl) {
    const container = document.createElement('span');
    container.id = CONTAINER_ID;
    container.style.cssText = 'display: inline-flex; gap: 6px; margin-left: 10px; vertical-align: middle;';
    container.appendChild(createActionButton(chrome.i18n.getMessage('contentToApply'), '#6366f1', '#4f46e5', 'to_apply'));
    container.appendChild(createActionButton(chrome.i18n.getMessage('contentApplied'), '#3b82f6', '#2563eb', 'applied'));
    titleEl.parentElement.appendChild(container);
  }
}

// Initial inject
injectButton();

// Re-inject when Indeed loads new job content
const observer = new MutationObserver(() => {
  injectButton();
});

observer.observe(document.body, { childList: true, subtree: true });
window.addEventListener('beforeunload', () => observer.disconnect());

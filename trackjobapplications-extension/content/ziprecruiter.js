// --- DOM Extraction ---

function extractZipRecruiterJob() {
  const position =
    document.querySelector('.job_title')?.textContent?.trim() ||
    document.querySelector('[data-testid="job-title"]')?.textContent?.trim() ||
    document.querySelector('h1.job_title')?.textContent?.trim() ||
    document.querySelector('h1')?.textContent?.trim() ||
    '';

  const company =
    document.querySelector('.hiring_company .company_name')?.textContent?.trim() ||
    document.querySelector('[data-testid="job-company-name"]')?.textContent?.trim() ||
    document.querySelector('.JobDetails_companyName a')?.textContent?.trim() ||
    document.querySelector('.company_name')?.textContent?.trim() ||
    '';

  const rawUrl = window.location.href.split('#')[0];

  // Extract the full job description text
  const jobPostingContent =
    document.querySelector('.job_description')?.innerText?.trim() ||
    document.querySelector('[data-testid="job-description"]')?.innerText?.trim() ||
    document.querySelector('.jobDescriptionSection')?.innerText?.trim() ||
    '';

  return {
    company:  sanitizeText(company, 200),
    position: sanitizeText(position, 200),
    url:      sanitizeUrl(rawUrl, ['ziprecruiter.com']),
    source:   'ziprecruiter',
    job_posting_content: sanitizeText(jobPostingContent, 50000),
  };
}

// --- Message Listener (for popup) ---

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (sender.id !== chrome.runtime.id) { sendResponse(null); return; }
  if (message.type === 'GET_JOB_DATA') {
    sendResponse(extractZipRecruiterJob());
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
    const data = extractZipRecruiterJob();
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

  const titleEl =
    document.querySelector('.job_title') ||
    document.querySelector('[data-testid="job-title"]') ||
    document.querySelector('h1');

  if (titleEl) {
    const container = document.createElement('span');
    container.id = CONTAINER_ID;
    container.style.cssText = 'display: inline-flex; gap: 6px; margin-left: 10px; vertical-align: middle;';
    container.appendChild(createActionButton('To Apply', '#6366f1', '#4f46e5', 'to_apply'));
    container.appendChild(createActionButton('Applied', '#3b82f6', '#2563eb', 'applied'));
    titleEl.parentElement.appendChild(container);
  }
}

// Initial inject
injectButton();

// Re-inject on SPA navigation
const observer = new MutationObserver(() => {
  injectButton();
});

observer.observe(document.body, { childList: true, subtree: true });
window.addEventListener('beforeunload', () => observer.disconnect());

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

  const url = window.location.href.split('#')[0];

  return { company, position, url, source: 'indeed' };
}

// --- Message Listener (for popup) ---

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
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
    document.querySelector('.jobsearch-JobInfoHeader-title') ||
    document.querySelector('[data-testid="jobsearch-JobInfoHeader-title"]') ||
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

// Re-inject when Indeed loads new job content
const observer = new MutationObserver(() => {
  injectButton();
});

observer.observe(document.body, { childList: true, subtree: true });

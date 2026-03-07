// --- Gmail Content Script ---
// Adds a "Track Job" button to email view when job-related keywords are detected

const BUTTON_ID = 'tja-gmail-track-btn';

// Common job-related keywords to detect in email subject/body
const JOB_KEYWORDS = [
  'application', 'applied', 'interview', 'offer', 'position',
  'candidate', 'hiring', 'recruiter', 'job', 'role', 'opportunity',
  'rejection', 'unfortunately', 'moved forward', 'next steps',
  'thank you for applying', 'resume', 'cover letter', 'onsite',
  'phone screen', 'technical interview', 'take-home', 'assessment'
];

function isJobRelatedEmail(subject, body) {
  const text = (subject + ' ' + body).toLowerCase();
  return JOB_KEYWORDS.some(kw => text.includes(kw));
}

function extractEmailData() {
  // Gmail subject line
  const subjectEl = document.querySelector('h2[data-thread-perm-id]') ||
    document.querySelector('h2.hP');
  const subject = subjectEl?.textContent?.trim() || '';

  // Sender name (often the company or recruiter)
  const senderEl = document.querySelector('.gD') ||
    document.querySelector('[email]');
  const senderName = senderEl?.getAttribute('name') || senderEl?.textContent?.trim() || '';
  const senderEmail = senderEl?.getAttribute('email') || '';

  // Email body snippet
  const bodyEl = document.querySelector('.a3s.aiL') ||
    document.querySelector('.ii.gt div');
  const body = bodyEl?.textContent?.trim().substring(0, 500) || '';

  // Try to extract company name from sender
  // Common patterns: "Name from Company", "Company Recruiting", sender email domain
  let company = '';
  if (senderName) {
    const fromMatch = senderName.match(/(?:from|at|@)\s+(.+)/i);
    if (fromMatch) {
      company = fromMatch[1].trim();
    } else if (!senderName.includes(' ') || senderName.match(/recruiting|talent|hr|careers/i)) {
      company = senderName;
    } else {
      // Use email domain as fallback
      const domain = senderEmail.split('@')[1];
      if (domain && !domain.match(/gmail|yahoo|hotmail|outlook/)) {
        company = domain.split('.')[0];
        company = company.charAt(0).toUpperCase() + company.slice(1);
      } else {
        company = senderName;
      }
    }
  }

  // Try to extract position from subject
  let position = '';
  const posPatterns = [
    /(?:for|re:?\s*)?(?:the\s+)?(.+?)\s+(?:position|role|opening)/i,
    /(?:application|interview|offer)\s+(?:for|:)\s*(.+)/i,
    /(.+?)\s*[-–—]\s*(?:application|interview|update)/i,
  ];
  for (const pattern of posPatterns) {
    const match = subject.match(pattern);
    if (match) {
      position = match[1].trim().replace(/^re:\s*/i, '');
      break;
    }
  }
  if (!position) {
    position = subject.replace(/^(?:re|fwd|fw):\s*/i, '').trim();
  }

  return { company, position, subject, senderName, senderEmail, body };
}

const CONTAINER_ID = 'tja-gmail-btn-container';

function createGmailActionButton(label, color, hoverColor, status, data) {
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
    const container = document.getElementById(CONTAINER_ID);
    container.querySelectorAll('button').forEach(b => { b.disabled = true; });
    btn.textContent = 'Saving...';

    const today = new Date().toISOString().split('T')[0];
    const notes = `From email: ${data.subject}\nSender: ${data.senderName} <${data.senderEmail}>`;

    const result = await chrome.runtime.sendMessage({
      type: 'ADD_APPLICATION',
      company: data.company,
      position: data.position,
      url: window.location.href,
      source: 'other',
      applied_date: today,
      notes: notes,
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

  const subjectEl = document.querySelector('h2[data-thread-perm-id]') ||
    document.querySelector('h2.hP');
  if (!subjectEl) return;

  const data = extractEmailData();
  if (!data.subject) return;

  const container = document.createElement('span');
  container.id = CONTAINER_ID;
  container.style.cssText = 'display: inline-flex; gap: 6px; margin-left: 10px; vertical-align: middle;';
  container.appendChild(createGmailActionButton('To Apply', '#6366f1', '#4f46e5', 'to_apply', data));
  container.appendChild(createGmailActionButton('Applied', '#3b82f6', '#2563eb', 'applied', data));
  subjectEl.parentElement.appendChild(container);
}

// Track URL changes for Gmail SPA navigation
let lastUrl = window.location.href;

function checkAndInject() {
  const currentUrl = window.location.href;
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    const existing = document.getElementById(CONTAINER_ID);
    if (existing) existing.remove();
  }
  injectButton();
}

// Initial inject - try multiple times as Gmail loads content dynamically
injectButton();
setTimeout(injectButton, 500);
setTimeout(injectButton, 1000);
setTimeout(injectButton, 2000);
setTimeout(injectButton, 4000);

// Re-inject on SPA navigation (debounced to avoid excessive calls)
let debounceTimer = null;
const observer = new MutationObserver(() => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(checkAndInject, 200);
});

observer.observe(document.body, { childList: true, subtree: true });

// Respond to popup requests
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_JOB_DATA') {
    const data = extractEmailData();
    if (data.company && data.position) {
      sendResponse({
        company: data.company,
        position: data.position,
        url: window.location.href,
        source: 'other',
      });
    } else {
      sendResponse(null);
    }
  }
});

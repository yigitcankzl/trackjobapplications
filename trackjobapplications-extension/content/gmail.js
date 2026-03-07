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

function createTrackButton(data) {
  const btn = document.createElement('button');
  btn.id = BUTTON_ID;
  btn.textContent = 'Track Job';
  btn.style.cssText = `
    background: #3b82f6;
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
    if (!btn.disabled) btn.style.background = '#2563eb';
  });
  btn.addEventListener('mouseleave', () => {
    if (!btn.disabled) btn.style.background = '#3b82f6';
  });

  btn.addEventListener('click', async () => {
    btn.disabled = true;
    btn.textContent = 'Saving...';
    btn.style.background = '#93c5fd';

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
    });

    if (result.success) {
      btn.textContent = 'Tracked!';
      btn.style.background = '#10b981';
    } else {
      btn.textContent = result.error || 'Error';
      btn.style.background = '#ef4444';
      setTimeout(() => {
        btn.disabled = false;
        btn.textContent = 'Track Job';
        btn.style.background = '#3b82f6';
      }, 3000);
    }
  });

  return btn;
}

function injectButton() {
  if (document.getElementById(BUTTON_ID)) return;

  const subjectEl = document.querySelector('h2[data-thread-perm-id]') ||
    document.querySelector('h2.hP');
  if (!subjectEl) return;

  const data = extractEmailData();
  if (!data.subject) return;

  // Only show button for job-related emails
  if (!isJobRelatedEmail(data.subject, data.body)) return;

  const btn = createTrackButton(data);
  subjectEl.parentElement.appendChild(btn);
}

// Track URL changes for Gmail SPA navigation
let lastUrl = window.location.href;

function checkAndInject() {
  const currentUrl = window.location.href;
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    const existing = document.getElementById(BUTTON_ID);
    if (existing) existing.remove();
  }
  injectButton();
}

// Initial inject
setTimeout(injectButton, 1500);

// Re-inject on SPA navigation
const observer = new MutationObserver(() => {
  checkAndInject();
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

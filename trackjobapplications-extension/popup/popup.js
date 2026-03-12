// --- Theme ---

const SUN_PATH = 'M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42M12 7a5 5 0 100 10 5 5 0 000-10z';
const MOON_PATH = 'M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z';

function applyTheme(theme) {
  document.body.classList.toggle('dark', theme === 'dark');
  const icon = document.querySelector('#theme-icon path');
  if (icon) icon.setAttribute('d', theme === 'dark' ? SUN_PATH : MOON_PATH);
}

(function initTheme() {
  const saved = localStorage.getItem('theme');
  const theme = saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  applyTheme(theme);
})();

document.getElementById('theme-toggle').addEventListener('click', () => {
  const isDark = document.body.classList.contains('dark');
  const next = isDark ? 'light' : 'dark';
  localStorage.setItem('theme', next);
  applyTheme(next);
});

// --- Review link (Chrome vs Firefox) ---
(function initReviewLink() {
  const link = document.getElementById('review-link');
  if (!link) return;
  const isFirefox = typeof browser !== 'undefined';
  if (isFirefox) {
    link.href = 'https://addons.mozilla.org/en-US/firefox/addon/trackjobapplications/reviews/';
  } else {
    link.href = 'https://chromewebstore.google.com/detail/trackjobapplications/EXTENSION_ID/reviews';
  }
})();

document.addEventListener('DOMContentLoaded', async () => {
  const authStatus = await chrome.runtime.sendMessage({ type: 'CHECK_AUTH' });

  document.getElementById('loading').hidden = true;

  if (authStatus.authenticated) {
    showMainSection(authStatus.email);
    await Promise.all([loadJobData(), loadDashboard()]);
  } else {
    showLoginSection();
  }
});

// --- Login ---

function showLoginSection() {
  document.getElementById('login-section').hidden = false;
  document.getElementById('main-section').hidden = true;
}

document.getElementById('web-login-btn').addEventListener('click', async () => {
  const btn = document.getElementById('web-login-btn');
  const errorEl = document.getElementById('login-error');
  errorEl.hidden = true;
  btn.disabled = true;
  btn.textContent = 'Opening...';

  const result = await chrome.runtime.sendMessage({ type: 'WEB_LOGIN' });

  if (result && result.success) {
    btn.textContent = 'Waiting for login...';
    // The service worker will watch for the tab to complete login.
    // Listen for storage changes to know when tokens are saved.
    chrome.storage.onChanged.addListener(function onTokenSaved(changes) {
      if (changes.access_token) {
        chrome.storage.onChanged.removeListener(onTokenSaved);
        // Tokens saved — refresh the popup state
        (async () => {
          const auth = await chrome.runtime.sendMessage({ type: 'CHECK_AUTH' });
          if (auth.authenticated) {
            document.getElementById('login-section').hidden = true;
            showMainSection(auth.email);
            await Promise.all([loadJobData(), loadDashboard()]);
          }
        })();
      }
    });
  } else {
    const err = result?.error;
    errorEl.textContent = (typeof err === 'string') ? err : JSON.stringify(err || 'Failed to open login');
    errorEl.hidden = false;
    btn.disabled = false;
    btn.textContent = 'Sign in with TrackJobs';
  }
});

// --- Main Section ---

function showMainSection(email) {
  document.getElementById('main-section').hidden = false;
  document.getElementById('user-email').textContent = email;
}

document.getElementById('go-to-website-btn').addEventListener('click', async (e) => {
  e.preventDefault();
  const result = await chrome.runtime.sendMessage({ type: 'GET_FRONTEND_URL' });
  if (result && result.url) {
    chrome.tabs.create({ url: result.url + '/dashboard' });
  }
});

document.getElementById('logout-btn').addEventListener('click', async (e) => {
  e.preventDefault();
  await chrome.runtime.sendMessage({ type: 'LOGOUT' });
  document.getElementById('main-section').hidden = true;
  document.getElementById('login-error').hidden = true;
  const btn = document.getElementById('web-login-btn');
  btn.disabled = false;
  btn.textContent = 'Sign in with TrackJobs';
  showLoginSection();
});

// --- Job Data ---

let formSource = 'company_website';
let formUrl = '';
let formJobPostingContent = '';
const selectedTagIds = new Set();

const SOURCE_LABELS = {
  linkedin: 'LinkedIn', indeed: 'Indeed', glassdoor: 'Glassdoor',
  ziprecruiter: 'ZipRecruiter', company_website: 'Website', other: 'Email',
};

async function loadJobData() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = tab?.url || '';

  // Try content script on supported sites
  const isSupported = url.includes('linkedin.com/jobs') || url.includes('indeed.com') || url.includes('glassdoor.com') || url.includes('ziprecruiter.com') || url.includes('mail.google.com');

  let jobData = null;
  if (isSupported && tab) {
    try {
      jobData = await chrome.tabs.sendMessage(tab.id, { type: 'GET_JOB_DATA' });
      if (!jobData?.company || !jobData?.position) jobData = null;
    } catch { /* content script not ready */ }
  }

  // Show unified form
  document.getElementById('job-form').hidden = false;

  if (jobData) {
    // Pre-fill from content script
    document.getElementById('form-company').value = jobData.company;
    document.getElementById('form-position').value = jobData.position;
    formSource = jobData.source || 'other';
    formUrl = jobData.url || url;
    formJobPostingContent = jobData.job_posting_content || '';
  } else {
    // Pre-fill from URL/title parsing
    formUrl = url;
    if (tab) prefillFromTab(tab);
  }

  // Show source badge
  const badge = document.getElementById('form-source-badge');
  badge.textContent = SOURCE_LABELS[formSource] || formSource;
  badge.className = 'source-badge source-' + formSource;
  badge.hidden = false;

  // Show URL
  if (formUrl && formUrl.startsWith('http')) {
    document.getElementById('form-url-display').textContent = formUrl.length > 50 ? formUrl.slice(0, 50) + '...' : formUrl;
    document.getElementById('form-url-field').hidden = false;
  }

  // Load tags
  loadTags();
}

function prefillFromTab(tab) {
  const title = tab.title || '';

  try {
    const parsed = new URL(formUrl);
    const hostname = parsed.hostname.replace('www.', '');
    const pathParts = parsed.pathname.split('/').filter(Boolean);

    // ATS platforms: company name is in the URL path
    const atsPatterns = {
      'jobs.lever.co': 0,
      'lever.co': 0,
      'boards.greenhouse.io': 0,
      'job-boards.greenhouse.io': 0,
      'jobs.ashbyhq.com': 0,
      'jobs.smartrecruiters.com': 0,
      'apply.workable.com': 0,
    };

    let companyName = '';

    if (hostname in atsPatterns && pathParts.length > 0) {
      companyName = pathParts[atsPatterns[hostname]];
    } else if (hostname.endsWith('.myworkdayjobs.com')) {
      companyName = hostname.split('.')[0];
    } else if (hostname.endsWith('.bamboohr.com')) {
      companyName = hostname.split('.')[0];
    } else {
      const domainParts = hostname.split('.');
      const skip = ['careers', 'jobs', 'apply', 'hire', 'recruiting', 'talent'];
      companyName = domainParts[0];
      if (skip.includes(domainParts[0]) && domainParts.length > 1) {
        companyName = domainParts[1];
      }
    }

    if (companyName && companyName.length > 1) {
      companyName = companyName.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      document.getElementById('form-company').value = companyName;
    }
  } catch { /* ignore */ }

  // Extract position from page title
  if (title) {
    const separators = [' - ', ' | ', ' — ', ' · ', ' :: '];
    for (const sep of separators) {
      if (title.includes(sep)) {
        const titleParts = title.split(sep);
        let candidate = titleParts[0].trim();
        const companyInput = document.getElementById('form-company').value.toLowerCase();
        if (companyInput && candidate.toLowerCase().includes(companyInput.toLowerCase()) && titleParts.length > 1) {
          candidate = titleParts[1].trim();
        }
        if (candidate.length > 3 && candidate.length < 150) {
          document.getElementById('form-position').value = candidate;
        }
        break;
      }
    }
  }
}

// --- Tags ---

async function loadTags() {
  const res = await chrome.runtime.sendMessage({ type: 'GET_TAGS' });
  const picker = document.getElementById('tag-picker');
  if (!res.success || !res.data.length) {
    picker.hidden = true;
    return;
  }
  picker.innerHTML = '';
  selectedTagIds.clear();
  for (const tag of res.data) {
    const chip = document.createElement('span');
    chip.className = 'tag-chip';
    chip.textContent = tag.name;
    const safeColor = /^#[0-9a-fA-F]{3,8}$/.test(tag.color) ? tag.color : '#888888';
    chip.style.backgroundColor = safeColor + '33';
    chip.style.color = safeColor;
    chip.dataset.tagId = tag.id;
    chip.addEventListener('click', () => {
      const id = Number(chip.dataset.tagId);
      if (selectedTagIds.has(id)) {
        selectedTagIds.delete(id);
        chip.classList.remove('selected');
      } else {
        selectedTagIds.add(id);
        chip.classList.add('selected');
      }
    });
    picker.appendChild(chip);
  }
  picker.hidden = false;
}

// --- Extras Toggles ---

document.getElementById('notes-toggle-btn').addEventListener('click', (e) => {
  e.preventDefault();
  const textarea = document.getElementById('job-notes');
  const link = e.currentTarget;
  textarea.hidden = !textarea.hidden;
  link.textContent = textarea.hidden ? '+ Note' : '- Note';
  if (!textarea.hidden) textarea.focus();
});

document.getElementById('contact-toggle-btn').addEventListener('click', (e) => {
  e.preventDefault();
  const fields = document.getElementById('contact-fields');
  const link = e.currentTarget;
  fields.hidden = !fields.hidden;
  link.textContent = fields.hidden ? '+ Recruiter' : '- Recruiter';
  if (!fields.hidden) document.getElementById('contact-name').focus();
});

// --- Interview Toggle ---

const interviewBtn = document.getElementById('interview-btn');
const interviewFields = document.getElementById('interview-fields');

interviewBtn.addEventListener('click', () => {
  if (interviewFields.hidden) {
    interviewFields.hidden = false;
    const dateInput = document.getElementById('interview-date');
    if (!dateInput.value) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      dateInput.value = tomorrow.toISOString().slice(0, 16);
    }
    interviewBtn.textContent = 'Save Interview';
    return;
  }
  const dateVal = document.getElementById('interview-date').value;
  if (!dateVal) {
    showFeedback('Please select interview date/time', 'error');
    return;
  }
  addApplication('interview');
});

// --- Offer Toggle ---

const offerBtn = document.getElementById('offer-btn');
const offerFields = document.getElementById('offer-fields');

offerBtn.addEventListener('click', () => {
  if (offerFields.hidden) {
    offerFields.hidden = false;
    offerBtn.textContent = 'Save Offer';
    document.getElementById('offer-salary').focus();
    return;
  }
  addApplication('offer');
});

// --- Add Application (unified) ---

const allActionBtns = ['save-btn', 'apply-btn', 'interview-btn', 'offer-btn'];

async function addApplication(status) {
  const company = document.getElementById('form-company').value.trim();
  const position = document.getElementById('form-position').value.trim();

  if (!company || !position) {
    showFeedback('Company and position are required', 'error');
    return;
  }

  const btnMap = { to_apply: 'save-btn', applied: 'apply-btn', interview: 'interview-btn', offer: 'offer-btn' };
  const activeBtn = document.getElementById(btnMap[status]);
  allActionBtns.forEach(id => { document.getElementById(id).disabled = true; });
  const originalText = activeBtn.textContent;
  activeBtn.textContent = 'Saving...';

  const today = new Date().toISOString().split('T')[0];
  const notes = document.getElementById('job-notes').value.trim();

  const msg = {
    type: 'ADD_APPLICATION',
    company,
    position,
    url: formUrl.startsWith('http') ? formUrl : '',
    source: formSource,
    applied_date: today,
    status,
  };
  if (formJobPostingContent) msg.job_posting_content = formJobPostingContent;
  if (notes) msg.notes = notes;
  if (selectedTagIds.size > 0) msg.tag_ids = [...selectedTagIds];

  const result = await chrome.runtime.sendMessage(msg);

  if (result.success) {
    const appId = result.data?.id;

    // Add recruiter contact if provided
    const contactName = document.getElementById('contact-name').value.trim();
    if (contactName && appId) {
      await chrome.runtime.sendMessage({
        type: 'ADD_CONTACT',
        application_id: appId,
        name: contactName,
        email: document.getElementById('contact-email').value.trim(),
      });
    }

    // Add interview if status is interview
    if (status === 'interview' && appId) {
      const scheduledAt = new Date(document.getElementById('interview-date').value).toISOString();
      const interviewRes = await chrome.runtime.sendMessage({
        type: 'ADD_INTERVIEW',
        application_id: appId,
        stage_type: document.getElementById('interview-type').value,
        scheduled_at: scheduledAt,
      });
      if (!interviewRes.success) {
        showFeedback(interviewRes.error || 'App saved, but interview failed', 'error');
        loadDashboard();
        return;
      }
    }

    // Add offer if status is offer
    if (status === 'offer' && appId) {
      const salary = parseFloat(document.getElementById('offer-salary').value);
      const offerMsg = {
        type: 'ADD_OFFER',
        application_id: appId,
        currency: document.getElementById('offer-currency').value,
        salary_period: document.getElementById('offer-period').value,
      };
      if (!isNaN(salary) && salary > 0) offerMsg.salary = salary;
      const benefits = document.getElementById('offer-benefits').value.trim();
      if (benefits) offerMsg.benefits = benefits;
      const offerRes = await chrome.runtime.sendMessage(offerMsg);
      if (!offerRes.success) {
        showFeedback(offerRes.error || 'App saved, but offer failed', 'error');
        loadDashboard();
        return;
      }
    }

    const labels = { to_apply: 'Saved!', applied: 'Applied!', interview: 'Interview saved!', offer: 'Offer saved!' };
    showFeedback(labels[status], 'success');
    activeBtn.textContent = labels[status];
    loadDashboard();
  } else {
    const err = result?.error;
    showFeedback((typeof err === 'string') ? err : JSON.stringify(err || 'Error'), 'error');
    allActionBtns.forEach(id => { document.getElementById(id).disabled = false; });
    activeBtn.textContent = originalText;
  }
}

document.getElementById('save-btn').addEventListener('click', () => addApplication('to_apply'));
document.getElementById('apply-btn').addEventListener('click', () => addApplication('applied'));

// --- Dashboard (Stats + Recent) ---

async function loadDashboard() {
  const [statsRes, recentRes] = await Promise.all([
    chrome.runtime.sendMessage({ type: 'GET_STATS' }),
    chrome.runtime.sendMessage({ type: 'GET_RECENT' }),
  ]);

  if (statsRes.success) {
    const s = statsRes.data;
    document.getElementById('stat-total').textContent = s.total;
    document.getElementById('stat-to-apply').textContent = s.to_apply;
    document.getElementById('stat-applied').textContent = s.applied;
    document.getElementById('stat-interview').textContent = s.interview;
    document.getElementById('stat-offer').textContent = s.offer;
    document.getElementById('stat-rejected').textContent = s.rejected;
    document.getElementById('stats-section').hidden = false;
  }

  if (recentRes.success && recentRes.data.length > 0) {
    const list = document.getElementById('recent-list');
    list.innerHTML = '';
    const statusLabels = {
      to_apply: 'To Apply', applied: 'Applied', interview: 'Interview',
      offer: 'Offer', rejected: 'Rejected', withdrawn: 'Withdrawn',
    };
    for (const app of recentRes.data) {
      const li = document.createElement('li');

      const pinBtn = document.createElement('button');
      pinBtn.className = `pin-btn${app.is_pinned ? ' pinned' : ''}`;
      pinBtn.textContent = '\u{1F4CC}';
      pinBtn.title = app.is_pinned ? 'Unpin' : 'Pin';
      pinBtn.addEventListener('click', async () => {
        pinBtn.disabled = true;
        const res = await chrome.runtime.sendMessage({
          type: 'TOGGLE_PIN', application_id: app.id,
        });
        if (res.success) {
          pinBtn.classList.toggle('pinned', res.data.is_pinned);
          pinBtn.title = res.data.is_pinned ? 'Unpin' : 'Pin';
        }
        pinBtn.disabled = false;
      });

      const info = document.createElement('div');
      info.className = 'recent-info';
      const companyDiv = document.createElement('div');
      companyDiv.className = 'recent-company';
      companyDiv.textContent = app.company;
      const posDiv = document.createElement('div');
      posDiv.className = 'recent-position';
      posDiv.textContent = app.position;
      info.appendChild(companyDiv);
      info.appendChild(posDiv);

      const badge = document.createElement('span');
      badge.className = `status-badge status-${app.status}`;
      badge.textContent = statusLabels[app.status] || app.status;

      li.appendChild(pinBtn);
      li.appendChild(info);
      li.appendChild(badge);
      list.appendChild(li);
    }
    document.getElementById('recent-section').hidden = false;
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function showFeedback(message, type) {
  const el = document.getElementById('feedback');
  el.textContent = message;
  el.className = type;
  el.hidden = false;
}

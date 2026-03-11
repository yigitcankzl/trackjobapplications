let currentJobData = null;

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

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const btn = document.getElementById('login-btn');
  const errorEl = document.getElementById('login-error');

  errorEl.hidden = true;
  btn.disabled = true;
  btn.textContent = 'Logging in...';

  const result = await chrome.runtime.sendMessage({ type: 'LOGIN', email, password });

  if (result.success) {
    const auth = await chrome.runtime.sendMessage({ type: 'CHECK_AUTH' });
    document.getElementById('login-section').hidden = true;
    showMainSection(auth.email);
    await Promise.all([loadJobData(), loadDashboard()]);
  } else {
    errorEl.textContent = result.error;
    errorEl.hidden = false;
    btn.disabled = false;
    btn.textContent = 'Log In';
    document.getElementById('password').value = '';
  }
});

// --- Main Section ---

function showMainSection(email) {
  document.getElementById('main-section').hidden = false;
  document.getElementById('user-email').textContent = email;
}

document.getElementById('logout-btn').addEventListener('click', async (e) => {
  e.preventDefault();
  await chrome.runtime.sendMessage({ type: 'LOGOUT' });
  document.getElementById('main-section').hidden = true;
  document.getElementById('login-error').hidden = true;
  document.getElementById('email').value = '';
  document.getElementById('password').value = '';
  showLoginSection();
});

// --- Job Data ---

async function loadJobData() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return showNoJob();

  const url = tab.url || '';
  const isSupported = url.includes('linkedin.com/jobs') || url.includes('indeed.com') || url.includes('mail.google.com');

  if (!isSupported) return showNoJob();

  try {
    const jobData = await chrome.tabs.sendMessage(tab.id, { type: 'GET_JOB_DATA' });
    if (jobData && jobData.company && jobData.position) {
      showJobInfo(jobData);
    } else {
      showNoJob();
    }
  } catch {
    showNoJob();
  }
}

function showJobInfo(data) {
  currentJobData = data;
  document.getElementById('job-info').hidden = false;
  document.getElementById('no-job').hidden = true;
  document.getElementById('job-company').textContent = data.company;
  document.getElementById('job-position').textContent = data.position;
  const sourceNames = { linkedin: 'LinkedIn', indeed: 'Indeed', other: 'Email' };
  document.getElementById('job-source').textContent = sourceNames[data.source] || data.source;
}

function showNoJob() {
  document.getElementById('job-info').hidden = true;
  document.getElementById('no-job').hidden = false;
}

// --- Add Application (two buttons) ---

async function addApplication(status) {
  if (!currentJobData) return;

  const saveBtn = document.getElementById('save-btn');
  const applyBtn = document.getElementById('apply-btn');
  saveBtn.disabled = true;
  applyBtn.disabled = true;

  const activeBtn = status === 'to_apply' ? saveBtn : applyBtn;
  const originalText = activeBtn.textContent;
  activeBtn.textContent = 'Saving...';

  const today = new Date().toISOString().split('T')[0];

  const result = await chrome.runtime.sendMessage({
    type: 'ADD_APPLICATION',
    company: currentJobData.company,
    position: currentJobData.position,
    url: currentJobData.url,
    source: currentJobData.source,
    applied_date: today,
    status: status,
    job_posting_content: currentJobData.job_posting_content,
  });

  if (result.success) {
    const label = status === 'to_apply' ? 'Saved!' : 'Applied!';
    showFeedback(label, 'success');
    activeBtn.textContent = label;
    loadDashboard();
  } else {
    showFeedback(result.error, 'error');
    saveBtn.disabled = false;
    applyBtn.disabled = false;
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
      li.innerHTML =
        `<div class="recent-info">` +
          `<div class="recent-company">${escapeHtml(app.company)}</div>` +
          `<div class="recent-position">${escapeHtml(app.position)}</div>` +
        `</div>` +
        `<span class="status-badge status-${app.status}">${statusLabels[app.status] || app.status}</span>`;
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

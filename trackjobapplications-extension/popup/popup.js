let currentJobData = null;

document.addEventListener('DOMContentLoaded', async () => {
  const authStatus = await chrome.runtime.sendMessage({ type: 'CHECK_AUTH' });

  document.getElementById('loading').hidden = true;

  if (authStatus.authenticated) {
    showMainSection(authStatus.email);
    await loadJobData();
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
    await loadJobData();
  } else {
    errorEl.textContent = result.error;
    errorEl.hidden = false;
    btn.disabled = false;
    btn.textContent = 'Log In';
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
  const isSupported = url.includes('linkedin.com/jobs') || url.includes('indeed.com');

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
  document.getElementById('job-source').textContent = data.source === 'linkedin' ? 'LinkedIn' : 'Indeed';
}

function showNoJob() {
  document.getElementById('job-info').hidden = true;
  document.getElementById('no-job').hidden = false;
}

// --- Add Application ---

document.getElementById('add-btn').addEventListener('click', async () => {
  if (!currentJobData) return;

  const btn = document.getElementById('add-btn');
  btn.disabled = true;
  btn.textContent = 'Adding...';

  const today = new Date().toISOString().split('T')[0];

  const result = await chrome.runtime.sendMessage({
    type: 'ADD_APPLICATION',
    company: currentJobData.company,
    position: currentJobData.position,
    url: currentJobData.url,
    source: currentJobData.source,
    applied_date: today,
  });

  if (result.success) {
    showFeedback('Application added!', 'success');
    btn.textContent = 'Added';
  } else {
    showFeedback(result.error, 'error');
    btn.disabled = false;
    btn.textContent = 'Add Application';
  }
});

function showFeedback(message, type) {
  const el = document.getElementById('feedback');
  el.textContent = message;
  el.className = type;
  el.hidden = false;
}

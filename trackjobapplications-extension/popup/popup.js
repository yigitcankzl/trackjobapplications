let currentJobData = null;

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

  if (result && result.success) {
    const auth = await chrome.runtime.sendMessage({ type: 'CHECK_AUTH' });
    document.getElementById('login-section').hidden = true;
    showMainSection(auth.email);
    await Promise.all([loadJobData(), loadDashboard()]);
  } else {
    const err = result?.error;
    errorEl.textContent = (typeof err === 'string') ? err : JSON.stringify(err || result || 'Login failed');
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
  const isSupported = url.includes('linkedin.com/jobs') || url.includes('indeed.com') || url.includes('glassdoor.com') || url.includes('ziprecruiter.com') || url.includes('mail.google.com');

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
  const sourceNames = { linkedin: 'LinkedIn', indeed: 'Indeed', glassdoor: 'Glassdoor', ziprecruiter: 'ZipRecruiter', other: 'Email' };
  document.getElementById('job-source').textContent = sourceNames[data.source] || data.source;
  loadTags();
}

// --- Tags ---

const selectedTagIds = new Set();

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
    chip.style.backgroundColor = tag.color + '33'; // 20% opacity bg
    chip.style.color = tag.color;
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

function showNoJob() {
  document.getElementById('job-info').hidden = true;
  document.getElementById('no-job').hidden = false;
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
    // First click: show interview fields, pre-fill date to tomorrow
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
  // Second click: validate and save
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

// --- Add Application ---

const allActionBtns = ['save-btn', 'apply-btn', 'interview-btn', 'offer-btn'];

async function addApplication(status) {
  if (!currentJobData) return;

  const btnMap = { to_apply: 'save-btn', applied: 'apply-btn', interview: 'interview-btn', offer: 'offer-btn' };
  const activeBtn = document.getElementById(btnMap[status]);
  allActionBtns.forEach(id => { document.getElementById(id).disabled = true; });
  const originalText = activeBtn.textContent;
  activeBtn.textContent = 'Saving...';

  const today = new Date().toISOString().split('T')[0];
  const notes = document.getElementById('job-notes').value.trim();

  const msg = {
    type: 'ADD_APPLICATION',
    company: currentJobData.company,
    position: currentJobData.position,
    url: currentJobData.url,
    source: currentJobData.source,
    applied_date: today,
    status: status,
    job_posting_content: currentJobData.job_posting_content,
  };
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
      info.innerHTML =
        `<div class="recent-company">${escapeHtml(app.company)}</div>` +
        `<div class="recent-position">${escapeHtml(app.position)}</div>`;

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

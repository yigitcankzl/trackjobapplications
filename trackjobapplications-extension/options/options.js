'use strict';

const PROFILE_FIELDS = [
  'firstName', 'lastName', 'email', 'phone', 'location', 'currentCompany',
  'linkedin', 'github', 'portfolio',
  'university', 'degree', 'gpa', 'graduationYear',
  'workAuthorization', 'sponsorship',
  'gender', 'veteranStatus', 'ethnicity', 'disabilityStatus'
];

/* ── Theme ── */
function applyTheme(dark) {
  document.body.classList.toggle('dark', dark);
  document.getElementById('theme-icon-light').style.display = dark ? 'none' : '';
  document.getElementById('theme-icon-dark').style.display = dark ? '' : 'none';
}

document.getElementById('theme-toggle').addEventListener('click', () => {
  const dark = !document.body.classList.contains('dark');
  chrome.storage.local.set({ theme: dark ? 'dark' : 'light' });
  applyTheme(dark);
});

chrome.storage.local.get('theme', (r) => {
  applyTheme(r.theme === 'dark');
});

/* ── Load profile ── */
chrome.storage.local.get('autofillProfile', (result) => {
  const profile = result.autofillProfile || {};
  for (const key of PROFILE_FIELDS) {
    const el = document.getElementById(key);
    if (el && profile[key]) {
      el.value = profile[key];
    }
  }
});

/* ── Save profile ── */
document.getElementById('profile-form').addEventListener('submit', (e) => {
  e.preventDefault();

  const profile = {};
  for (const key of PROFILE_FIELDS) {
    const el = document.getElementById(key);
    if (el) {
      const val = el.value.trim();
      if (val) profile[key] = val;
    }
  }

  chrome.storage.local.set({ autofillProfile: profile }, () => {
    showFeedback('Profile saved!', 'success');
  });
});

/* ── Feedback ── */
function showFeedback(msg, type) {
  const fb = document.getElementById('feedback');
  fb.textContent = msg;
  fb.className = type;
  fb.hidden = false;
  setTimeout(() => { fb.hidden = true; }, 2500);
}

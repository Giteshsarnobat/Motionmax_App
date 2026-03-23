// ─── Element References ───────────────────────────────────────────────────────
const loginForm  = document.getElementById('loginForm');
const emailInput = document.getElementById('loginEmail');
const passInput  = document.getElementById('loginPass');
const toggle     = document.getElementById('toggleCheck');
const loginBtn   = document.getElementById('loginBtn');

const API_URL = 'http://localhost:5000';

// ── Password toggle ───────────────────────────────────────────────────────────
toggle.addEventListener('change', () => {
  passInput.type = toggle.checked ? 'text' : 'password';
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function showFieldError(inputEl, message) {
  clearFieldError(inputEl);
  inputEl.style.borderColor = '#ef4444';
  inputEl.classList.add('shake-error');
  setTimeout(() => inputEl.classList.remove('shake-error'), 600);
  const err = document.createElement('span');
  err.className = 'field-error';
  err.style.cssText = 'color:#ef4444;font-size:12px;margin-top:5px;display:block;font-weight:500;';
  err.innerText = '⚠ ' + message;
  const wrapper = inputEl.closest('.input-box');
  if (wrapper) wrapper.insertAdjacentElement('afterend', err);
}

function clearFieldError(inputEl) {
  inputEl.style.borderColor = '';
  const group = inputEl.closest('.form-group');
  if (!group) return;
  const e = group.querySelector('.field-error');
  if (e) e.remove();
}

function clearAllErrors() { [emailInput, passInput].forEach(clearFieldError); }

function showBanner(message, type = 'error') {
  removeBanner();
  const banner = document.createElement('div');
  banner.id = 'loginBanner';
  const isError = type === 'error';
  banner.style.cssText = `background:${isError?'#fee2e2':'#d1fae5'};color:${isError?'#991b1b':'#065f46'};border:1px solid ${isError?'#fca5a5':'#6ee7b7'};border-radius:10px;padding:11px 15px;margin-bottom:16px;font-size:13px;font-weight:600;text-align:center;`;
  banner.innerHTML = (isError ? '❌ ' : '✅ ') + message;
  loginForm.insertAdjacentElement('beforebegin', banner);
}

function removeBanner() { const old = document.getElementById('loginBanner'); if (old) old.remove(); }

function validateForm() {
  let isValid = true;
  clearAllErrors();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value.trim())) { showFieldError(emailInput, 'Enter a valid email address.'); isValid = false; }
  if (!passInput.value) { showFieldError(passInput, 'Password is required.'); isValid = false; }
  return isValid;
}

function setLoadingState() { loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Authenticating...'; loginBtn.disabled = true; }
function resetButtonState() { loginBtn.innerHTML = '<i class="fas fa-right-to-bracket"></i> Login to Account'; loginBtn.disabled = false; }

function redirectByRole(role) {
  window.location.href = role === 'admin' ? 'AdminDashboard.html' : 'Dashboard.html';
}

// ── Login Submit ──────────────────────────────────────────────────────────────
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!validateForm()) return;

  setLoadingState();
  removeBanner();

  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method:      'POST',
      headers:     { 'Content-Type': 'application/json' },
      credentials: 'include', // ✅ Allows HttpOnly cookie to be received and stored
      body:        JSON.stringify({
        email:    emailInput.value.trim().toLowerCase(),
        password: passInput.value,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      // ✅ Only store accessToken + user — NO refreshToken in localStorage
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('user',        JSON.stringify(data.user));

      showBanner(`Welcome back, ${data.user.name}! Redirecting...`, 'success');
      loginBtn.innerHTML = '<i class="fas fa-check"></i> Login Successful!';

      setTimeout(() => redirectByRole(data.user.role), 1500);

    } else {
      resetButtonState();
      passInput.value = '';

      if      (response.status === 401) { showBanner('Invalid email or password. Please try again.'); showFieldError(passInput, 'Incorrect password.'); }
      else if (response.status === 403) { showBanner('Your account has been deactivated. Contact support.'); }
      else if (response.status === 429) { showBanner('Too many login attempts. Please wait 15 minutes and try again.'); }
      else                              { showBanner(data.message || 'Something went wrong. Please try again.'); }
    }

  } catch (err) {
    resetButtonState();
    showBanner('Cannot connect to server.');
    console.error('Network error:', err);
  }
});

// ── Auto-refresh token on page load if accessToken expired ───────────────────
(async function initLogin() {
  const token = localStorage.getItem('accessToken');
  const user  = localStorage.getItem('user');

  if (token && user) {
    try {
      // Try to silently refresh — if cookie is still valid, skip login page
      const res = await fetch(`${API_URL}/api/auth/refresh-token`, {
        method:      'POST',
        credentials: 'include', // ✅ Cookie sent automatically
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('user', JSON.stringify(data.user));
        redirectByRole(data.user.role);
      } else {
        // Refresh failed — clear stale data and show login
        localStorage.clear();
      }
    } catch {
      localStorage.clear();
    }
  }
})();
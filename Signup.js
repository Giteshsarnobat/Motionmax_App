// ─── Element References ───────────────────────────────────────────────────────
const form = document.getElementById("signupForm");
const nameInput = document.getElementById("userName");
const mobileInput = document.getElementById("userMobile");
const emailInput = document.getElementById("userEmail");
const roleSelect = document.getElementById("userRole");
const roleBadge = document.getElementById("roleBadge");
const passInput = document.getElementById("userPass");
const confirmInput = document.getElementById("confirmPass");
const toggle = document.getElementById("toggleCheck");
const bar = document.getElementById("bar");
const meterBox = document.getElementById("meterBox");
const strengthLabel = document.getElementById("strengthLabel");
const btn = document.getElementById("mainBtn");

const API_URL = "https://motionmaxbackend-production-ec0d.up.railway.app";

// ── Role badge preview ────────────────────────────────────────────────────────
roleSelect.addEventListener("change", () => {
  const v = roleSelect.value;
  roleBadge.classList.remove("hidden", "admin", "user");
  if (v === "admin") {
    roleBadge.classList.add("admin");
    roleBadge.innerHTML =
      '<i class="fas fa-shield-halved"></i> Admin Access Selected';
  } else if (v === "user") {
    roleBadge.classList.add("user");
    roleBadge.innerHTML = '<i class="fas fa-user"></i> User Access Selected';
  } else {
    roleBadge.classList.add("hidden");
  }
});

// ── Show/hide password ────────────────────────────────────────────────────────
toggle.addEventListener("change", () => {
  const type = toggle.checked ? "text" : "password";
  passInput.type = confirmInput.type = type;
});

// ── Password strength meter ───────────────────────────────────────────────────
passInput.addEventListener("input", () => {
  const val = passInput.value;
  if (!val) {
    meterBox.style.display = "none";
    strengthLabel.innerText = "";
    return;
  }
  meterBox.style.display = "block";
  let score = 0;
  if (val.length >= 8) score++;
  if (/[A-Z]/.test(val)) score++;
  if (/[0-9]/.test(val)) score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;
  const w = ["25%", "50%", "75%", "100%"];
  const c = ["#ef4444", "#f59e0b", "#3b82f6", "#22c55e"];
  const t = ["Weak", "Fair", "Good", "Strong!"];
  bar.style.width = w[score - 1] || "10%";
  bar.style.backgroundColor = c[score - 1] || "#ef4444";
  strengthLabel.innerText = t[score - 1] || "Very Weak";
  strengthLabel.style.color = c[score - 1] || "#ef4444";
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function showError(inputEl, message) {
  clearError(inputEl);
  inputEl.style.borderColor = "#ef4444";
  const err = document.createElement("span");
  err.className = "field-error";
  err.style.cssText =
    "color:#ef4444;font-size:12px;margin-top:5px;display:block;font-weight:500;";
  err.innerText = "⚠ " + message;
  const wrapper =
    inputEl.closest(".input-box") || inputEl.closest(".select-box");
  if (wrapper) wrapper.insertAdjacentElement("afterend", err);
}

function clearError(inputEl) {
  inputEl.style.borderColor = "";
  const wrapper =
    inputEl.closest(".input-box") || inputEl.closest(".select-box");
  if (wrapper) wrapper.style.borderColor = "";
  const group = inputEl.closest(".form-group");
  if (group) {
    const e = group.querySelector(".field-error");
    if (e) e.remove();
  }
}

function clearAllErrors() {
  [
    nameInput,
    mobileInput,
    emailInput,
    roleSelect,
    passInput,
    confirmInput,
  ].forEach(clearError);
}

function showSuccessBanner(message) {
  removeOldBanner();
  const banner = document.createElement("div");
  banner.id = "apiBanner";
  banner.style.cssText =
    "background:#d1fae5;color:#065f46;border:1px solid #6ee7b7;border-radius:10px;padding:12px 16px;margin-bottom:16px;font-size:14px;font-weight:600;text-align:center;";
  banner.innerHTML = "✅ " + message;
  form.insertAdjacentElement("beforebegin", banner);
}

function showErrorBanner(message) {
  removeOldBanner();
  const banner = document.createElement("div");
  banner.id = "apiBanner";
  banner.style.cssText =
    "background:#fee2e2;color:#991b1b;border:1px solid #fca5a5;border-radius:10px;padding:12px 16px;margin-bottom:16px;font-size:14px;font-weight:600;text-align:center;";
  banner.innerHTML = "❌ " + message;
  form.insertAdjacentElement("beforebegin", banner);
}

function removeOldBanner() {
  const old = document.getElementById("apiBanner");
  if (old) old.remove();
}

// ── Validation ────────────────────────────────────────────────────────────────
function validateForm() {
  let isValid = true;
  clearAllErrors();
  if (nameInput.value.trim().length < 2) {
    showError(nameInput, "Full name must be at least 2 characters.");
    isValid = false;
  }
  if (!/^[6-9]\d{9}$/.test(mobileInput.value.trim())) {
    showError(mobileInput, "Enter a valid 10-digit Indian mobile number.");
    isValid = false;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value.trim())) {
    showError(emailInput, "Enter a valid email address.");
    isValid = false;
  }
  if (!roleSelect.value) {
    showError(roleSelect, "Please select a role.");
    isValid = false;
  }
  const pass = passInput.value;
  const isStrong =
    pass.length >= 8 &&
    /[A-Z]/.test(pass) &&
    /[0-9]/.test(pass) &&
    /[^A-Za-z0-9]/.test(pass);
  if (!isStrong) {
    showError(passInput, "Needs 8+ chars, uppercase, number & special symbol.");
    passInput.classList.add("shake-error");
    setTimeout(() => passInput.classList.remove("shake-error"), 600);
    isValid = false;
  }
  if (pass !== confirmInput.value) {
    showError(confirmInput, "Passwords do not match.");
    confirmInput.classList.add("shake-error");
    setTimeout(() => confirmInput.classList.remove("shake-error"), 600);
    isValid = false;
  }
  return isValid;
}

// ── Form Submit ───────────────────────────────────────────────────────────────
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!validateForm()) return;

  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
  btn.disabled = true;

  const payload = {
    name: nameInput.value.trim(),
    mobile: mobileInput.value.trim(),
    email: emailInput.value.trim().toLowerCase(),
    role: roleSelect.value,
    password: passInput.value,
  };

  try {
    const response = await fetch(`${API_URL}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // ✅ Allows HttpOnly cookie to be set
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (response.ok) {
      // ✅ Only store accessToken and user — NO refreshToken in localStorage
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("user", JSON.stringify(data.user));

      const roleLabel = data.user.role === "admin" ? "Admin" : "User";
      showSuccessBanner(
        `Welcome, ${data.user.name}! Account created as ${roleLabel}. Redirecting...`,
      );

      form.reset();
      meterBox.style.display = "none";
      strengthLabel.innerText = "";
      roleBadge.classList.add("hidden");

      setTimeout(() => {
        window.location.href =
          data.user.role === "admin" ? "AdminDashboard.html" : "Login.html";
      }, 2000);
    } else {
      if (response.status === 409) {
        const msg = (data.message || "").toLowerCase();
        if (msg.includes("email"))
          showError(emailInput, "This email is already registered.");
        else if (msg.includes("mobile"))
          showError(mobileInput, "This mobile number is already registered.");
        else showErrorBanner("Email or mobile already registered.");
      } else if (response.status === 422 && data.errors) {
        const fm = {
          name: nameInput,
          mobile: mobileInput,
          email: emailInput,
          role: roleSelect,
          password: passInput,
        };
        data.errors.forEach((err) => {
          const el = fm[err.path] || fm[err.param];
          if (el) showError(el, err.msg);
        });
      } else {
        showErrorBanner(
          data.message || "Something went wrong. Please try again.",
        );
      }
    }
  } catch (err) {
    showErrorBanner(
      "Cannot connect to server. Make sure Node.js is running on port 5000.",
    );
    console.error(err);
  } finally {
    btn.innerHTML = "Create Secure Account";
    btn.disabled = false;
  }
});

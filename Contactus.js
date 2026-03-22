// ═══════════════════════════════════════════════════
//  NAVIGATION — matches your toggleMenu() onclick
// ═══════════════════════════════════════════════════

// toggleMenu is called from onclick="toggleMenu()" in HTML
function toggleMenu() {
  const nav = document.getElementById("navLinks");
  if (nav) nav.classList.toggle("active");
}

// Dropdown — mobile tap to open
document.querySelectorAll(".dropdown > a").forEach((link) => {
  link.addEventListener("click", function (e) {
    if (window.innerWidth <= 768) {
      const parent = this.parentElement;
      if (!parent.classList.contains("active-mobile")) {
        e.preventDefault();
        document.querySelectorAll(".dropdown").forEach((item) => {
          item.classList.remove("active-mobile");
        });
        parent.classList.add("active-mobile");
      }
      // second click navigates normally
    }
  });
});

document.querySelectorAll(".dropdown-menu li > a").forEach((item) => {
  item.addEventListener("click", () => {
    if (window.innerWidth <= 768) {
      item.parentElement.classList.toggle("active-mobile");
    }
  });
});

//  CONFIG
const API_URL = "http://localhost:5000";

//  HELPER — get field safely
function getField(id) {
  return document.getElementById(id) || null;
}

//  INLINE ERROR HELPERS
function showFieldError(inputEl, message) {
  if (!inputEl) return;
  clearFieldError(inputEl);

  inputEl.style.border = "1.5px solid #ef4444";
  inputEl.style.background = "#fff5f5";

  const err = document.createElement("span");
  err.className = "field-error";
  err.style.cssText = `
    color: #ef4444; font-size: 12px; margin-top: 4px;
    display: block; font-weight: 500;
  `;
  err.innerText = "⚠ " + message;
  inputEl.insertAdjacentElement("afterend", err);
}

function clearFieldError(inputEl) {
  if (!inputEl) return;
  inputEl.style.border = "";
  inputEl.style.background = "";
  const next = inputEl.nextElementSibling;
  if (next && next.classList.contains("field-error")) next.remove();
}

function clearAllErrors() {
  [
    "firstName",
    "middleName",
    "lastName",
    "email",
    "phone",
    "subject",
    "message",
  ].forEach((id) => clearFieldError(getField(id)));
}

//  BANNER HELPERS
function showBanner(message, type = "error") {
  removeBanner();
  const form = document.getElementById("contactForm");
  if (!form) return;

  const isSuccess = type === "success";
  const banner = document.createElement("div");
  banner.id = "contactBanner";
  banner.style.cssText = `
    background:    ${isSuccess ? "#d1fae5" : "#fee2e2"};
    color:         ${isSuccess ? "#065f46" : "#991b1b"};
    border:        1px solid ${isSuccess ? "#6ee7b7" : "#fca5a5"};
    border-radius: 10px;
    padding:       14px 18px;
    margin-bottom: 20px;
    font-size:     14px;
    font-weight:   600;
    text-align:    center;
    animation:     fadeIn 0.3s ease;
  `;
  banner.innerText = (isSuccess ? "✅ " : "❌ ") + message;
  form.insertAdjacentElement("beforebegin", banner);

  // Scroll to banner so user sees it
  banner.scrollIntoView({ behavior: "smooth", block: "center" });

  // Auto-remove success after 6 seconds
  if (isSuccess) setTimeout(removeBanner, 6000);
}

function removeBanner() {
  const old = document.getElementById("contactBanner");
  if (old) old.remove();
}

//  BUTTON STATE HELPERS
function setLoading(btn) {
  if (!btn) return;
  btn.dataset.original = btn.innerText;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
  btn.style.opacity = "0.75";
  btn.disabled = true;
}

function resetBtn(btn) {
  if (!btn) return;
  btn.innerHTML = btn.dataset.original || "Send Message";
  btn.style.opacity = "1";
  btn.disabled = false;
}

// ═══════════════════════════════════════════════════
//  CLIENT-SIDE VALIDATION
//  Matches your exact field IDs:
//  firstName, middleName, lastName, email, phone, subject, message
// ═══════════════════════════════════════════════════
function validateForm() {
  clearAllErrors();
  let isValid = true;

  const firstName = getField("firstName");
  const lastName = getField("lastName");
  const email = getField("email");
  const phone = getField("phone");
  const subject = getField("subject");
  const message = getField("message");

  // First Name — required, min 2 chars
  if (!firstName || firstName.value.trim().length < 2) {
    showFieldError(firstName, "First name must be at least 2 characters.");
    isValid = false;
  }

  // Last Name — required, min 2 chars
  if (!lastName || lastName.value.trim().length < 2) {
    showFieldError(lastName, "Last name must be at least 2 characters.");
    isValid = false;
  }

  // Email — valid format
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
    showFieldError(email, "Enter a valid email address.");
    isValid = false;
  }

  // Phone — 10 digits (your HTML already strips non-numeric via oninput)
  if (!phone || phone.value.trim().length < 10) {
    showFieldError(phone, "Please enter a valid 10-digit phone number.");
    isValid = false;
  }

  // Subject — must select one
  if (!subject || !subject.value || subject.value === "") {
    showFieldError(subject, "Please select a subject.");
    isValid = false;
  }

  // Message — min 10 chars
  if (!message || message.value.trim().length < 10) {
    showFieldError(message, "Message must be at least 10 characters.");
    isValid = false;
  }

  return isValid;
}

//  CONTACT FORM SUBMIT → API CALL
const contactForm = document.getElementById("contactForm");

if (contactForm) {
  contactForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    // 1. Validate first
    if (!validateForm()) return;

    const btn =
      contactForm.querySelector("button[type='submit']") ||
      contactForm.querySelector("button");

    // 2. Read exact field values from your HTML ids
    const firstName = getField("firstName").value.trim();
    const middleName = getField("middleName")
      ? getField("middleName").value.trim()
      : "";
    const lastName = getField("lastName").value.trim();
    const email = getField("email").value.trim();
    const phone = getField("phone").value.trim();
    const subjectEl = getField("subject");
    // Use the visible text of the selected option as subject (not "admission")
    const subject = subjectEl
      ? subjectEl.options[subjectEl.selectedIndex].text
      : "General Enquiry";
    const message = getField("message").value.trim();

    // 3. Build full name
    const fullName = [firstName, middleName, lastName]
      .filter(Boolean)
      .join(" ");

    // 4. Payload matching your API: name, email, mobile, subject, message
    const payload = {
      name: fullName,
      email: email.toLowerCase(),
      mobile: phone,
      subject: subject,
      message: message,
    };

    // 5. Set loading state
    setLoading(btn);
    removeBanner();

    try {
      // 6. POST to /api/contact
      const response = await fetch(`${API_URL}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        // ✅ SUCCESS
        showBanner(
          `Thank you, ${firstName}! Your message has been sent. We'll get back to you soon.`,
          "success",
        );
        contactForm.reset();
        clearAllErrors();
      } else {
        // ❌ Server-side errors
        if (
          response.status === 422 &&
          data.errors &&
          Array.isArray(data.errors)
        ) {
          // Map server validation errors back to fields
          const serverFieldMap = {
            name: getField("firstName"),
            email: getField("email"),
            mobile: getField("phone"),
            subject: getField("subject"),
            message: getField("message"),
          };
          data.errors.forEach((err) => {
            const fieldKey = err.path || err.param;
            const el = serverFieldMap[fieldKey];
            if (el) showFieldError(el, err.msg);
          });
          showBanner("Please fix the highlighted errors and try again.");
        } else if (response.status === 429) {
          showBanner(
            "You've sent too many messages. Please wait an hour before trying again.",
          );
        } else {
          showBanner(data.message || "Something went wrong. Please try again.");
        }
      }
    } catch (networkErr) {
      // Network / server down
      showBanner(
        "Cannot connect to server. Please make sure the Node.js server is running on port 5000.",
      );
      console.error("Contact API Error:", networkErr);
    } finally {
      resetBtn(btn);
    }
  }); // end submit
} else {
  console.warn(
    "contactForm not found on this page — Contactus.js skipped form logic.",
  );
}

//  FADE-IN ANIMATION (for banner)
const style = document.createElement("style");
style.innerText = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`;
document.head.appendChild(style);

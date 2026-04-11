// ═══════════════════════════════════════════════════
//  CONFIG
// ═══════════════════════════════════════════════════
const API_URL = "http://localhost:5000";
const PER_PAGE = 10;

let allContacts = []; // full data from API
let filtered = []; // after search filter
let currentPage = 1;

// ═══════════════════════════════════════════════════
//  AUTH GUARD — redirect if not logged in
// ═══════════════════════════════════════════════════
const storedUser = localStorage.getItem("user");
const accessToken = localStorage.getItem("accessToken");

if (!accessToken || !storedUser) {
  window.location.href = "Login.html";
}

// Populate sidebar user info
try {
  const u = JSON.parse(storedUser);
  document.getElementById("sidebarName").textContent = u.name || "User";
  document.getElementById("sidebarRole").textContent = u.role || "user";
  document.getElementById("sidebarAvatar").textContent = (u.name ||
    "U")[0].toUpperCase();
} catch {}

// ═══════════════════════════════════════════════════
//  LOGOUT
// ═══════════════════════════════════════════════════
async function logout() {
  try {
    const rt = localStorage.getItem("refreshToken");
    await fetch(`${API_URL}/api/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: rt }),
    });
  } catch {}
  localStorage.clear();
  window.location.href = "Login.html";
}

// ═══════════════════════════════════════════════════
//  TOAST
// ═══════════════════════════════════════════════════
let toastTimer;
function showToast(message, type = "info") {
  const toast = document.getElementById("toast");
  const icon = document.getElementById("toastIcon");
  document.getElementById("toastMsg").textContent = message;
  const icons = {
    success: "fa-check-circle",
    error: "fa-times-circle",
    info: "fa-info-circle",
  };
  icon.className = `fas ${icons[type] || icons.info}`;
  icon.style.color =
    type === "success"
      ? "var(--success)"
      : type === "error"
        ? "var(--danger)"
        : "var(--accent)";
  toast.className = `toast ${type} show`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3500);
}

// ═══════════════════════════════════════════════════
//  AVATAR COLOUR — based on name initial
// ═══════════════════════════════════════════════════
const AVATAR_COLORS = [
  "#6366f1",
  "#22d3ee",
  "#f59e0b",
  "#10b981",
  "#ec4899",
  "#8b5cf6",
  "#ef4444",
  "#14b8a6",
];
function avatarColor(name) {
  let h = 0;
  for (let i = 0; i < (name || "").length; i++) h += name.charCodeAt(i);
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

// ═══════════════════════════════════════════════════
//  FORMAT DATE
// ═══════════════════════════════════════════════════
function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function isToday(iso) {
  const d = new Date(iso),
    n = new Date();
  return (
    d.getDate() === n.getDate() &&
    d.getMonth() === n.getMonth() &&
    d.getFullYear() === n.getFullYear()
  );
}

function isThisWeek(iso) {
  const d = new Date(iso),
    n = new Date();
  const weekAgo = new Date(n);
  weekAgo.setDate(n.getDate() - 7);
  return d >= weekAgo;
}

// ═══════════════════════════════════════════════════
//  STATS
// ═══════════════════════════════════════════════════
function updateStats(contacts) {
  const total = contacts.length;
  const today = contacts.filter((c) => isToday(c.created_at)).length;
  const week = contacts.filter((c) => isThisWeek(c.created_at)).length;
  const subjects = new Set(contacts.map((c) => c.subject)).size;

  animateCount("statTotal", total);
  animateCount("statToday", today);
  animateCount("statWeek", week);
  animateCount("statSubjects", subjects);
}

function animateCount(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  let current = 0;
  const step = Math.max(1, Math.floor(target / 30));
  const timer = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = current;
    if (current >= target) clearInterval(timer);
  }, 30);
}

// ═══════════════════════════════════════════════════
//  RENDER TABLE
// ═══════════════════════════════════════════════════
function renderTable(data, page) {
  const tbody = document.getElementById("tableBody");
  const start = (page - 1) * PER_PAGE;
  const slice = data.slice(start, start + PER_PAGE);

  if (data.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="7">
        <div class="state-box">
          <i class="fas fa-inbox"></i>
          <p>No contact submissions found.</p>
        </div>
      </td></tr>`;
    document.getElementById("pagination").style.display = "none";
    document.getElementById("tableCount").textContent = "0 records";
    return;
  }

  tbody.innerHTML = slice
    .map((c, i) => {
      const idx = start + i + 1;
      const initials = (c.name || "?")[0].toUpperCase();
      const color = avatarColor(c.name);
      return `
    <tr style="animation-delay:${i * 0.04}s">
      <td style="color:var(--muted);font-size:12px;">${idx}</td>
      <td>
        <div class="td-name">
          <div class="avatar" style="background:${color}">${initials}</div>
          <div>
            <div class="name-text">${escHtml(c.name)}</div>
            <div class="name-id">#${c.id}</div>
          </div>
        </div>
      </td>
      <td>
        <a href="mailto:${escHtml(c.email)}" style="color:var(--accent2);text-decoration:none;font-size:13px;">
          ${escHtml(c.email)}
        </a>
      </td>
      <td>
        <a href="tel:${escHtml(c.mobile)}" style="color:var(--text);text-decoration:none;">
          ${escHtml(c.mobile)}
        </a>
      </td>
      <td><span class="subject-pill" title="${escHtml(c.subject)}">${escHtml(c.subject)}</span></td>
      <td><div class="msg-preview" title="${escHtml(c.message)}">${escHtml(c.message)}</div></td>
      <td><div class="date-text">${fmtDate(c.created_at)}</div></td>
    </tr>`;
    })
    .join("");

  // Pagination
  const totalPages = Math.ceil(data.length / PER_PAGE);
  const pag = document.getElementById("pagination");
  pag.style.display = totalPages > 1 ? "flex" : "none";

  document.getElementById("paginationInfo").textContent =
    `Showing ${start + 1}–${Math.min(start + PER_PAGE, data.length)} of ${data.length}`;

  // Page buttons
  const btns = document.getElementById("pageBtns");
  btns.innerHTML = "";

  // Prev
  const prev = makePageBtn("‹", page > 1, () => goPage(page - 1));
  btns.appendChild(prev);

  // Number buttons (show max 5)
  let startP = Math.max(1, page - 2);
  let endP = Math.min(totalPages, startP + 4);
  if (endP - startP < 4) startP = Math.max(1, endP - 4);

  for (let p = startP; p <= endP; p++) {
    const btn = makePageBtn(p, true, () => goPage(p));
    if (p === page) btn.classList.add("active");
    btns.appendChild(btn);
  }

  // Next
  const next = makePageBtn("›", page < totalPages, () => goPage(page + 1));
  btns.appendChild(next);

  // Table count
  document.getElementById("tableCount").textContent =
    `${data.length} record${data.length !== 1 ? "s" : ""}`;
}

function makePageBtn(label, enabled, onClick) {
  const btn = document.createElement("button");
  btn.className = "page-btn";
  btn.textContent = label;
  btn.disabled = !enabled;
  if (enabled) btn.addEventListener("click", onClick);
  return btn;
}

function goPage(p) {
  currentPage = p;
  renderTable(filtered, currentPage);
  document
    .querySelector(".table-wrap")
    .scrollIntoView({ behavior: "smooth", block: "start" });
}

// ═══════════════════════════════════════════════════
//  SEARCH FILTER
// ═══════════════════════════════════════════════════
function filterTable() {
  const q = document.getElementById("searchInput").value.trim().toLowerCase();
  filtered = q
    ? allContacts.filter(
        (c) =>
          (c.name || "").toLowerCase().includes(q) ||
          (c.email || "").toLowerCase().includes(q) ||
          (c.mobile || "").toLowerCase().includes(q) ||
          (c.subject || "").toLowerCase().includes(q) ||
          (c.message || "").toLowerCase().includes(q),
      )
    : [...allContacts];
  currentPage = 1;
  renderTable(filtered, currentPage);
}

// ═══════════════════════════════════════════════════
//  XSS ESCAPE
// ═══════════════════════════════════════════════════
function escHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ═══════════════════════════════════════════════════
//  LOAD DASHBOARD — GET /api/contact
// ═══════════════════════════════════════════════════
async function loadDashboard() {
  const refreshBtn = document.getElementById("refreshBtn");
  refreshBtn.classList.add("spinning");

  // Show skeleton while loading
  document.getElementById("tableBody").innerHTML = `
    ${[...Array(5)]
      .map(
        () => `
    <tr class="skeleton-row">
      <td><div class="skeleton" style="width:20px"></div></td>
      <td><div class="skeleton" style="width:130px"></div></td>
      <td><div class="skeleton" style="width:170px"></div></td>
      <td><div class="skeleton" style="width:100px"></div></td>
      <td><div class="skeleton" style="width:110px"></div></td>
      <td><div class="skeleton" style="width:180px"></div></td>
      <td><div class="skeleton" style="width:80px"></div></td>
    </tr>`,
      )
      .join("")}
  `;

  try {
    const response = await fetch(`${API_URL}/api/contact`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.status === 401) {
      showToast("Session expired. Please login again.", "error");
      setTimeout(() => {
        localStorage.clear();
        window.location.href = "Login.html";
      }, 2000);
      return;
    }

    if (response.status === 403) {
      document.getElementById("tableBody").innerHTML = `
        <tr><td colspan="7">
          <div class="state-box">
            <i class="fas fa-lock"></i>
            <p>Access denied. Admin role required to view contacts.</p>
          </div>
        </td></tr>`;
      showToast("Access denied — admin only.", "error");
      return;
    }

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();

    allContacts = data.contacts || [];
    filtered = [...allContacts];
    currentPage = 1;

    updateStats(allContacts);
    renderTable(filtered, currentPage);
    showToast(
      `Loaded ${allContacts.length} contact${allContacts.length !== 1 ? "s" : ""}`,
      "success",
    );
  } catch (err) {
    document.getElementById("tableBody").innerHTML = `
      <tr><td colspan="7">
        <div class="state-box">
          <i class="fas fa-exclamation-triangle"></i>
          <p>Cannot load contacts. Make sure your Node.js server is running on port 5000.</p>
        </div>
      </td></tr>`;
    showToast("Failed to load data. Check server connection.", "error");
    console.error("Dashboard load error:", err);
  } finally {
    refreshBtn.classList.remove("spinning");
  }
}

// ═══════════════════════════════════════════════════
//  EXPORT EXCEL — GET /api/contact/export/excel
// ═══════════════════════════════════════════════════
async function exportExcel(e) {
  e.preventDefault();
  const btn = document.getElementById("exportBtn");
  btn.innerHTML =
    '<i class="fas fa-spinner fa-spin"></i> <span>Generating...</span>';

  try {
    const response = await fetch(`${API_URL}/api/contact/export/excel`, {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) throw new Error("Export failed");

    // Download the file
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contacts_${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast("Excel file downloaded successfully!", "success");
  } catch (err) {
    showToast("Excel export failed. Try again.", "error");
    console.error("Export error:", err);
  } finally {
    btn.innerHTML =
      '<i class="fas fa-file-excel"></i> <span>Export Excel</span>';
  }
}

// ═══════════════════════════════════════════════════
//  MOBILE SIDEBAR
// ═══════════════════════════════════════════════════
function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("open");
  document.getElementById("overlay").classList.toggle("show");
}

// ═══════════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════════
loadDashboard();

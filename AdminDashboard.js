// ═══════════════════════════════════════════════════
//  CONFIG
// ═══════════════════════════════════════════════════
const API_URL = "https://motionmaxbackend-production-ec0d.up.railway.app";
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
    // ✅ No need to send refreshToken in body — it's in HttpOnly cookie
    // Browser sends cookie automatically with credentials: 'include'
    await fetch(`${API_URL}/api/auth/logout`, {
      method: "POST",
      credentials: "include", // ✅ Sends HttpOnly cookie to server for deletion
      headers: { "Content-Type": "application/json" },
    });
  } catch {}
  // ✅ Only clear accessToken and user — no refreshToken was ever here
  localStorage.removeItem("accessToken");
  localStorage.removeItem("user");
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
      const safeName = escHtml(c.name).replace(/'/g, "\'");
      return `
    <tr id="contact-row-${c.id}" style="animation-delay:${i * 0.04}s">
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
       <td>
        <button class="btn-delete-row" onclick="confirmDeleteOne('contacts', ${c.id}, '${safeName}')">
          <i class="fas fa-trash-alt"></i> Delete
        </button>
      </td>
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
//  TAB SWITCHING
// ═══════════════════════════════════════════════════
function switchTab(tab) {
  document.getElementById("contactsTab").style.display =
    tab === "contacts" ? "block" : "none";
  document.getElementById("usersTab").style.display =
    tab === "users" ? "block" : "none";
  document.querySelectorAll(".tab-btn").forEach((b, i) => {
    b.classList.toggle(
      "active",
      (i === 0 && tab === "contacts") || (i === 1 && tab === "users"),
    );
  });
  if (tab === "users" && allUsers.length === 0) loadUsers();
}

// ═══════════════════════════════════════════════════
//  CONFIRM MODAL
// ═══════════════════════════════════════════════════
function showModal({ title, message, onConfirm }) {
  // Remove existing modal
  const existing = document.getElementById("confirmModal");
  if (existing) existing.remove();

  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";
  backdrop.id = "confirmModal";
  backdrop.innerHTML = `
    <div class="modal-box">
      <div class="modal-icon"><i class="fas fa-trash-alt"></i></div>
      <div class="modal-title">${title}</div>
      <div class="modal-msg">${message}</div>
      <div class="modal-btns">
        <button class="modal-btn-cancel" onclick="closeModal()">Cancel</button>
        <button class="modal-btn-confirm" id="modalConfirmBtn">Yes, Delete</button>
      </div>
    </div>`;
  document.body.appendChild(backdrop);

  document
    .getElementById("modalConfirmBtn")
    .addEventListener("click", async () => {
      const btn = document.getElementById("modalConfirmBtn");
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';
      await onConfirm();
      closeModal();
    });

  // Click outside to cancel
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) closeModal();
  });
}

function closeModal() {
  const m = document.getElementById("confirmModal");
  if (m) m.remove();
}

// ═══════════════════════════════════════════════════
//  DELETE ONE CONTACT
// ═══════════════════════════════════════════════════
function confirmDeleteOne(type, id, name) {
  const isContact = type === "contacts";
  showModal({
    title: `Delete ${isContact ? "Contact" : "User"}`,
    message: `Are you sure you want to delete <strong>${name}</strong>?<br>This action cannot be undone.`,
    onConfirm: () => (isContact ? deleteContact(id) : deleteUser(id)),
  });
}

async function deleteContact(id) {
  try {
    const res = await fetch(`${API_URL}/api/contact/${id}`, {
      method: "DELETE",
      credentials: "include",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();

    if (res.ok) {
      // Remove from local arrays
      const numId = parseInt(id);
      allContacts = allContacts.filter((c) => parseInt(c.id) !== numId);
      //allContacts = allContacts.filter((c) => c.id !== id);
      filtered = filtered.filter((c) => parseInt(c.id) !== numId);

      // Adjust page if last item on current page was deleted
      const totalPages = Math.ceil(filtered.length / PER_PAGE);
      if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;

      // Fade out the row before removing
      const row = document.getElementById(`contact-row-${id}`);
      if (row) {
        row.style.opacity = "0";
        row.style.transition = "opacity 0.3s";
        setTimeout(() => {
          renderTable(filtered, currentPage);
          updateStats(allContacts);
        }, 300);
      } else {
        renderTable(filtered, currentPage);
        updateStats(allContacts);
      }

      showToast(data.message || "Contact deleted.", "success");
    } else {
      showToast(data.message || "Delete failed.", "error");
    }
  } catch (err) {
    showToast("Cannot connect to server.", "error");
    console.error(err);
  }
}

// ═══════════════════════════════════════════════════
//  DELETE ALL CONTACTS
// ═══════════════════════════════════════════════════
function confirmDeleteAll(type) {
  const isContact = type === "contacts";
  const count = isContact ? allContacts.length : allUsers.length;
  if (count === 0) {
    showToast(`No ${type} to delete.`, "info");
    return;
  }

  showModal({
    title: `Delete All ${isContact ? "Contacts" : "Users"}`,
    message: `This will permanently delete <strong>all ${count} ${type}</strong>.<br>This action <strong>cannot be undone</strong>.`,
    onConfirm: () => (isContact ? deleteAllContacts() : deleteAllUsers()),
  });
}

async function deleteAllContacts() {
  try {
    const res = await fetch(`${API_URL}/api/contact`, {
      method: "DELETE",
      credentials: "include",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();

    if (res.ok) {
      allContacts = [];
      filtered = [];
      renderTable(filtered, 1);
      updateStats([]);
      showToast(data.message || "All contacts deleted.", "success");
    } else {
      showToast(data.message || "Delete failed.", "error");
    }
  } catch (err) {
    showToast("Cannot connect to server.", "error");
  }
}

// ═══════════════════════════════════════════════════
//  USERS TABLE
// ═══════════════════════════════════════════════════
let allUsers = [];
let filteredUsers = [];
let userPage = 1;

async function loadUsers() {
  document.getElementById("userTableBody").innerHTML = `
    ${[...Array(4)]
      .map(
        () => `<tr class="skeleton-row">
      ${[20, 130, 170, 100, 60, 60, 80, 60].map((w) => `<td><div class="skeleton" style="width:${w}px"></div></td>`).join("")}
    </tr>`,
      )
      .join("")}`;

  try {
    const res = await fetch(`${API_URL}/api/users`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const data = await res.json();

    if (res.ok) {
      allUsers = data.users || [];
      filteredUsers = [...allUsers];
      userPage = 1;
      renderUsers(filteredUsers, userPage);
      document.getElementById("userTableCount").textContent =
        `${allUsers.length} record${allUsers.length !== 1 ? "s" : ""}`;
    } else {
      document.getElementById("userTableBody").innerHTML =
        `<tr><td colspan="8"><div class="state-box"><i class="fas fa-lock"></i><p>${data.message || "Failed to load users."}</p></div></td></tr>`;
    }
  } catch (err) {
    document.getElementById("userTableBody").innerHTML =
      `<tr><td colspan="8"><div class="state-box"><i class="fas fa-exclamation-triangle"></i><p>Cannot connect to server.</p></div></td></tr>`;
  }
}

function renderUsers(data, page) {
  const tbody = document.getElementById("userTableBody");
  const start = (page - 1) * PER_PAGE;
  const slice = data.slice(start, start + PER_PAGE);

  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8"><div class="state-box"><i class="fas fa-users"></i><p>No users found.</p></div></td></tr>`;
    document.getElementById("userPagination").style.display = "none";
    document.getElementById("userTableCount").textContent = "0 records";
    return;
  }

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  tbody.innerHTML = slice
    .map((u, i) => {
      const idx = start + i + 1;
      const initials = (u.name || "?")[0].toUpperCase();
      const color = avatarColor(u.name);
      const isMe = u.id === currentUser.id;
      const rolePill =
        u.role === "admin"
          ? `<span style="background:rgba(245,158,11,0.15);color:#f59e0b;padding:2px 9px;border-radius:20px;font-size:11px;font-weight:600;">🛡 Admin</span>`
          : `<span style="background:rgba(99,102,241,0.12);color:#818cf8;padding:2px 9px;border-radius:20px;font-size:11px;font-weight:600;">👤 User</span>`;
      const statusPill = u.is_active
        ? `<span style="background:rgba(16,185,129,0.12);color:#10b981;padding:2px 9px;border-radius:20px;font-size:11px;font-weight:600;">Active</span>`
        : `<span style="background:rgba(239,68,68,0.12);color:#ef4444;padding:2px 9px;border-radius:20px;font-size:11px;font-weight:600;">Inactive</span>`;

      const deleteBtn = isMe
        ? `<span style="font-size:11px;color:var(--muted);">You</span>`
        : `<button class="btn-delete-row" onclick="confirmDeleteOne('users', ${u.id}, '${escHtml(u.name).replace(/'/g, "\'")}')"><i class="fas fa-trash-alt"></i> Delete</button>`;

      return `
    <tr id="user-row-${u.id}" style="animation-delay:${i * 0.04}s">
      <td style="color:var(--muted);font-size:12px;">${idx}</td>
      <td>
        <div class="td-name">
          <div class="avatar" style="background:${color}">${initials}</div>
          <div>
            <div class="name-text">${escHtml(u.name)} ${isMe ? '<span style="font-size:10px;color:var(--accent);">(You)</span>' : ""}</div>
            <div class="name-id">#${u.id}</div>
          </div>
        </div>
      </td>
      <td><a href="mailto:${escHtml(u.email)}" style="color:var(--accent2);text-decoration:none;font-size:13px;">${escHtml(u.email)}</a></td>
      <td style="font-size:13px;">${escHtml(u.mobile || "—")}</td>
      <td>${rolePill}</td>
      <td>${statusPill}</td>
      <td><div class="date-text">${fmtDate(u.created_at)}</div></td>
      <td>${deleteBtn}</td>
    </tr>`;
    })
    .join("");

  // Pagination
  const totalPages = Math.ceil(data.length / PER_PAGE);
  const pag = document.getElementById("userPagination");
  pag.style.display = totalPages > 1 ? "flex" : "none";
  document.getElementById("userPaginationInfo").textContent =
    `Showing ${start + 1}–${Math.min(start + PER_PAGE, data.length)} of ${data.length}`;

  const btns = document.getElementById("userPageBtns");
  btns.innerHTML = "";
  btns.appendChild(
    makePageBtn("‹", page > 1, () => {
      userPage = page - 1;
      renderUsers(filteredUsers, userPage);
    }),
  );
  for (
    let p = Math.max(1, page - 2);
    p <= Math.min(totalPages, Math.max(1, page - 2) + 4);
    p++
  ) {
    const btn = makePageBtn(p, true, () => {
      userPage = p;
      renderUsers(filteredUsers, userPage);
    });
    if (p === page) btn.classList.add("active");
    btns.appendChild(btn);
  }
  btns.appendChild(
    makePageBtn("›", page < totalPages, () => {
      userPage = page + 1;
      renderUsers(filteredUsers, userPage);
    }),
  );

  document.getElementById("userTableCount").textContent =
    `${data.length} record${data.length !== 1 ? "s" : ""}`;
}

function filterUsers() {
  const q = document
    .getElementById("userSearchInput")
    .value.trim()
    .toLowerCase();
  filteredUsers = q
    ? allUsers.filter(
        (u) =>
          (u.name || "").toLowerCase().includes(q) ||
          (u.email || "").toLowerCase().includes(q) ||
          (u.role || "").toLowerCase().includes(q) ||
          (u.mobile || "").toLowerCase().includes(q),
      )
    : [...allUsers];
  userPage = 1;
  renderUsers(filteredUsers, userPage);
}

async function deleteUser(id) {
  try {
    const res = await fetch(`${API_URL}/api/users/${id}`, {
      method: "DELETE",
      credentials: "include",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();

    if (res.ok) {
      allUsers = allUsers.filter((u) => u.id !== id);
      filteredUsers = filteredUsers.filter((u) => u.id !== id);
      const row = document.getElementById(`user-row-${id}`);
      if (row) {
        row.style.opacity = "0";
        row.style.transition = "opacity 0.3s";
        setTimeout(() => renderUsers(filteredUsers, userPage), 300);
      } else renderUsers(filteredUsers, userPage);
      showToast(data.message || "User deleted.", "success");
    } else {
      showToast(data.message || "Delete failed.", "error");
    }
  } catch (err) {
    showToast("Cannot connect to server.", "error");
  }
}

async function deleteAllUsers() {
  try {
    const res = await fetch(`${API_URL}/api/users`, {
      method: "DELETE",
      credentials: "include",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();

    if (res.ok) {
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      allUsers = allUsers.filter((u) => u.id === currentUser.id);
      filteredUsers = [...allUsers];
      renderUsers(filteredUsers, 1);
      showToast(data.message || "All users deleted.", "success");
    } else {
      showToast(data.message || "Delete failed.", "error");
    }
  } catch (err) {
    showToast("Cannot connect to server.", "error");
  }
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
      credentials: "include", // ✅ Sends HttpOnly cookie
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
      credentials: "include", // ✅ Sends HttpOnly cookie
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

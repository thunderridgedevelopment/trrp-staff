// ============================================
// THUNDER RIDGE RP - Staff Portal App
// ============================================

document.addEventListener("DOMContentLoaded", function () {
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    // ---- Firebase Init ----
    firebase.initializeApp(FIREBASE_CONFIG);
    const auth = firebase.auth();
    const db = firebase.firestore();
    const googleProvider = new firebase.auth.GoogleAuthProvider();

    // ---- DOM Elements ----
    const loginScreen = $("#login-screen");
    const bannedScreen = $("#banned-screen");
    const pendingScreen = $("#pending-screen");
    const app = $("#app");
    const loginError = $("#login-error");
    const loginLoading = $("#login-loading");

    let currentUser = null;
    let currentUserData = null;

    // ---- Auth State ----
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = user;
            await handleUserLogin(user);
        } else {
            currentUser = null;
            currentUserData = null;
            showScreen("login");
        }
    });

    // ---- Google Login ----
    $("#google-login-btn").addEventListener("click", async () => {
        loginError.classList.add("hidden");
        loginLoading.classList.remove("hidden");
        try {
            await auth.signInWithPopup(googleProvider);
        } catch (err) {
            loginLoading.classList.add("hidden");
            loginError.textContent = err.message;
            loginError.classList.remove("hidden");
        }
    });

    // ---- Handle Login ----
    async function handleUserLogin(user) {
        const userRef = db.collection("users").doc(user.uid);
        const doc = await userRef.get();

        if (doc.exists) {
            const data = doc.data();

            // Update last login and photo
            await userRef.update({
                lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                photoURL: user.photoURL || "",
                displayName: user.displayName || "",
            });

            if (data.banned) {
                showScreen("banned");
                return;
            }

            if (data.status === "pending") {
                showScreen("pending");
                return;
            }

            currentUserData = { ...data, uid: user.uid };
            showApp();
        } else {
            // New user — check if admin
            const isAdmin = ADMIN_EMAILS.includes(user.email.toLowerCase());
            const newUser = {
                email: user.email,
                displayName: user.displayName || "",
                photoURL: user.photoURL || "",
                role: isAdmin ? "admin" : "staff",
                status: isAdmin ? "approved" : "pending",
                banned: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
            };
            await userRef.set(newUser);

            if (!isAdmin) {
                showScreen("pending");
                return;
            }

            currentUserData = { ...newUser, uid: user.uid };
            showApp();
        }
    }

    // ---- Screen Management ----
    function showScreen(screen) {
        loginScreen.classList.add("hidden");
        bannedScreen.classList.add("hidden");
        pendingScreen.classList.add("hidden");
        app.classList.add("hidden");
        loginLoading.classList.add("hidden");

        if (screen === "login") loginScreen.classList.remove("hidden");
        else if (screen === "banned") bannedScreen.classList.remove("hidden");
        else if (screen === "pending") pendingScreen.classList.remove("hidden");
    }

    function showApp() {
        loginScreen.classList.add("hidden");
        bannedScreen.classList.add("hidden");
        pendingScreen.classList.add("hidden");
        app.classList.remove("hidden");

        // Set user info in sidebar
        $("#user-name").textContent = currentUser.displayName || currentUser.email;
        $("#user-role").textContent = currentUserData.role.toUpperCase();
        $("#user-avatar").src = currentUser.photoURL || "";
        $("#welcome-name").textContent = (currentUser.displayName || "partner").split(" ")[0];

        // Show admin nav if admin
        if (currentUserData.role === "admin") {
            $("#admin-nav").classList.remove("hidden");
        }

        renderAll();
    }

    // ---- Logout ----
    function logout() {
        auth.signOut();
    }

    $("#logout-btn").addEventListener("click", logout);
    $("#banned-logout-btn").addEventListener("click", logout);
    $("#pending-logout-btn").addEventListener("click", logout);

    // ---- Navigation ----
    const navLinks = $$(".nav-link");
    const pages = $$(".page");

    navLinks.forEach((link) => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            navLinks.forEach((l) => l.classList.remove("active"));
            link.classList.add("active");
            pages.forEach((p) => p.classList.remove("active"));
            $(`#page-${page}`).classList.add("active");
            closeMobileSidebar();

            if (page === "admin" && currentUserData.role === "admin") {
                loadAdminUsers();
            }
        });
    });

    // ---- Mobile Sidebar ----
    const sidebar = $("#sidebar");
    const menuToggle = $("#menu-toggle");
    let overlay = document.createElement("div");
    overlay.id = "sidebar-overlay";
    document.body.appendChild(overlay);

    menuToggle.addEventListener("click", () => {
        sidebar.classList.toggle("open");
        overlay.classList.toggle("show");
    });

    overlay.addEventListener("click", closeMobileSidebar);

    function closeMobileSidebar() {
        sidebar.classList.remove("open");
        overlay.classList.remove("show");
    }

    // ---- Render All Content ----
    function renderAll() {
        renderDashboard();
        renderFAQs(FAQS);
        renderSOPs(SOPS);
        renderProjects(PROJECTS, "all");
        renderRules(RULES);
        renderChangelog(CHANGELOG);
        setupSearch();
        setupFilters();
    }

    // ---- Dashboard ----
    function renderDashboard() {
        $("#stat-projects").textContent = PROJECTS.filter((p) => p.status === "in-progress").length;
        $("#stat-sops").textContent = SOPS.length;
        $("#stat-faqs").textContent = FAQS.length;
        $("#stat-rules").textContent = RULES.length;

        const updates = [];
        CHANGELOG.forEach((entry) => {
            entry.changes.forEach((change) => {
                updates.push({ text: change, date: entry.date });
            });
        });

        const recentUpdates = updates.slice(0, 8);
        const container = $("#recent-updates");
        container.innerHTML = recentUpdates
            .map(
                (u) => `
            <div class="update-item">
                <div class="update-dot"></div>
                <span class="update-text">${u.text}</span>
                <span class="update-date">${formatDate(u.date)}</span>
            </div>
        `
            )
            .join("");
    }

    // ---- FAQs ----
    function renderFAQs(faqs) {
        const container = $("#faq-list");
        container.innerHTML = faqs
            .map(
                (faq, i) => `
            <div class="accordion-item" data-index="${i}">
                <div class="accordion-header">
                    <h3>${faq.question}<span class="accordion-tag">${faq.category}</span></h3>
                    <span class="accordion-arrow">&#9660;</span>
                </div>
                <div class="accordion-body">
                    <div class="accordion-body-inner">${faq.answer}</div>
                </div>
            </div>
        `
            )
            .join("");

        container.querySelectorAll(".accordion-header").forEach((header) => {
            header.addEventListener("click", () => {
                header.parentElement.classList.toggle("open");
            });
        });
    }

    // ---- SOPs ----
    function renderSOPs(sops) {
        const container = $("#sop-list");
        container.innerHTML = sops
            .map(
                (sop, i) => `
            <div class="document-card" data-index="${i}">
                <h3>${sop.title}</h3>
                <p>${sop.summary}</p>
                <div class="document-meta">
                    <span>By ${sop.author}</span>
                    <span>Updated ${formatDate(sop.lastUpdated)}</span>
                </div>
                <div class="document-content">
                    <div class="document-content-inner">${sop.content}</div>
                </div>
            </div>
        `
            )
            .join("");

        container.querySelectorAll(".document-card").forEach((card) => {
            card.addEventListener("click", () => {
                card.classList.toggle("expanded");
            });
        });
    }

    // ---- Projects ----
    function renderProjects(projects, filter) {
        const filtered =
            filter === "all" ? projects : projects.filter((p) => p.status === filter);
        const container = $("#project-list");
        container.innerHTML = filtered
            .map(
                (proj) => `
            <div class="project-card">
                <h3>${proj.title}</h3>
                <p>${proj.description}</p>
                <div>
                    <span class="project-status status-${proj.status}">${proj.status.replace("-", " ")}</span>
                </div>
                <div class="project-meta">
                    <span>${proj.lead}</span>
                    <span>Due ${formatDate(proj.deadline)}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${proj.progress}%"></div>
                </div>
            </div>
        `
            )
            .join("");
    }

    // ---- Rules ----
    function renderRules(rules) {
        const container = $("#rules-list");
        container.innerHTML = rules
            .map(
                (rule, i) => `
            <div class="rule-item">
                <div class="rule-number">${i + 1}</div>
                <div class="rule-content">
                    <h3>${rule.title}</h3>
                    <p>${rule.description}</p>
                </div>
            </div>
        `
            )
            .join("");
    }

    // ---- Changelog ----
    function renderChangelog(entries) {
        const container = $("#changelog-list");
        container.innerHTML = entries
            .map(
                (entry) => `
            <div class="changelog-entry">
                <div class="changelog-date">${formatDate(entry.date)}</div>
                <div class="changelog-title">
                    ${entry.tags.map((t) => `<span class="changelog-tag tag-${t}">${t}</span>`).join("")}
                    ${entry.title}
                </div>
                <div class="changelog-body">
                    <ul>
                        ${entry.changes.map((c) => `<li>${c}</li>`).join("")}
                    </ul>
                </div>
            </div>
        `
            )
            .join("");
    }

    // ---- Search ----
    function setupSearch() {
        const faqSearch = $("#faq-search");
        faqSearch.addEventListener("input", () => {
            const q = faqSearch.value.toLowerCase();
            const filtered = FAQS.filter(
                (f) =>
                    f.question.toLowerCase().includes(q) ||
                    f.answer.toLowerCase().includes(q) ||
                    f.category.toLowerCase().includes(q)
            );
            renderFAQs(filtered);
        });

        const sopSearch = $("#sop-search");
        sopSearch.addEventListener("input", () => {
            const q = sopSearch.value.toLowerCase();
            const filtered = SOPS.filter(
                (s) =>
                    s.title.toLowerCase().includes(q) ||
                    s.summary.toLowerCase().includes(q) ||
                    s.content.toLowerCase().includes(q)
            );
            renderSOPs(filtered);
        });
    }

    // ---- Filters ----
    function setupFilters() {
        $$(".filter-btn").forEach((btn) => {
            btn.addEventListener("click", () => {
                $$(".filter-btn").forEach((b) => b.classList.remove("active"));
                btn.classList.add("active");
                renderProjects(PROJECTS, btn.dataset.filter);
            });
        });
    }

    // ---- Admin Panel ----
    async function loadAdminUsers() {
        const snapshot = await db.collection("users").orderBy("createdAt", "desc").get();
        const users = [];
        snapshot.forEach((doc) => {
            users.push({ uid: doc.id, ...doc.data() });
        });

        $("#admin-total-users").textContent = `${users.length} users`;
        $("#admin-banned-users").textContent = `${users.filter((u) => u.banned).length} banned`;
        $("#admin-pending-users").textContent = `${users.filter((u) => u.status === "pending").length} pending`;

        const container = $("#admin-user-list");
        container.innerHTML = users
            .map(
                (user) => `
            <div class="admin-user-card ${user.banned ? "user-banned" : ""} ${user.status === "pending" ? "user-pending" : ""}">
                <div class="admin-user-info">
                    <img src="${user.photoURL || ""}" alt="" class="admin-user-avatar">
                    <div>
                        <div class="admin-user-name">${user.displayName || "No Name"}</div>
                        <div class="admin-user-email">${user.email}</div>
                        <div class="admin-user-meta">
                            <span class="admin-role-badge role-${user.role}">${user.role}</span>
                            ${user.banned ? '<span class="admin-role-badge role-banned">BANNED</span>' : ""}
                            ${user.status === "pending" ? '<span class="admin-role-badge role-pending">PENDING</span>' : ""}
                        </div>
                    </div>
                </div>
                <div class="admin-user-actions">
                    ${user.status === "pending" ? `<button class="admin-btn btn-approve" onclick="approveUser('${user.uid}')">Approve</button>` : ""}
                    ${user.uid !== currentUser.uid ? `
                        ${user.role !== "admin" ? `<button class="admin-btn btn-promote" onclick="toggleRole('${user.uid}', '${user.role}')">Make ${user.role === "admin" ? "Staff" : "Admin"}</button>` : ""}
                        <button class="admin-btn ${user.banned ? "btn-unban" : "btn-ban"}" onclick="toggleBan('${user.uid}', ${user.banned})">${user.banned ? "Unban" : "Ban"}</button>
                        ${user.banned || user.status === "pending" ? `<button class="admin-btn btn-delete" onclick="deleteUser('${user.uid}')">Delete</button>` : ""}
                    ` : '<span class="admin-you">YOU</span>'}
                </div>
            </div>
        `
            )
            .join("");
    }

    // ---- Admin Actions (global) ----
    window.approveUser = async function (uid) {
        await db.collection("users").doc(uid).update({ status: "approved" });
        loadAdminUsers();
    };

    window.toggleBan = async function (uid, isBanned) {
        await db.collection("users").doc(uid).update({ banned: !isBanned });
        loadAdminUsers();
    };

    window.toggleRole = async function (uid, currentRole) {
        const newRole = currentRole === "admin" ? "staff" : "admin";
        await db.collection("users").doc(uid).update({ role: newRole });
        loadAdminUsers();
    };

    window.deleteUser = async function (uid) {
        if (confirm("Are you sure you want to delete this user? They can sign up again.")) {
            await db.collection("users").doc(uid).delete();
            loadAdminUsers();
        }
    };

    // ---- Helpers ----
    function formatDate(dateStr) {
        const date = new Date(dateStr + "T00:00:00");
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    }
});

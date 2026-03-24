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

    // Dynamic data from Firestore
    let dynamicFAQs = [];
    let dynamicSOPs = [];

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

        // Show admin controls
        if (currentUserData.role === "admin") {
            $("#admin-nav").classList.remove("hidden");
            $("#create-faq-btn").classList.remove("hidden");
            $("#create-sop-btn").classList.remove("hidden");
        }

        loadDynamicData().then(() => {
            renderAll();
        });
        startPresence();
    }

    // ---- Presence System ----
    let currentPage = "dashboard";
    let presenceInterval = null;
    let presenceUnsubscribe = null;

    function startPresence() {
        const presenceRef = db.collection("presence").doc(currentUser.uid);

        // Set initial presence
        updatePresence();

        // Update presence every 30 seconds (heartbeat)
        presenceInterval = setInterval(updatePresence, 30000);

        // Listen for all online users
        presenceUnsubscribe = db.collection("presence")
            .where("online", "==", true)
            .onSnapshot((snapshot) => {
                const onlineUsers = [];
                snapshot.forEach((doc) => {
                    const data = doc.data();
                    // Only show users with a recent heartbeat (within 60 seconds)
                    if (data.lastSeen && data.lastSeen.toDate) {
                        const lastSeen = data.lastSeen.toDate();
                        const now = new Date();
                        if (now - lastSeen < 60000) {
                            onlineUsers.push({ uid: doc.id, ...data });
                        }
                    } else {
                        onlineUsers.push({ uid: doc.id, ...data });
                    }
                });
                renderOnlineUsers(onlineUsers);
            });

        // Clean up on page close
        window.addEventListener("beforeunload", () => {
            navigator.sendBeacon || presenceRef.update({ online: false });
            // Use sendBeacon-compatible approach
            const data = JSON.stringify({ online: false });
            presenceRef.update({ online: false }).catch(() => {});
        });

        document.addEventListener("visibilitychange", () => {
            if (document.hidden) {
                presenceRef.update({ online: false }).catch(() => {});
            } else {
                updatePresence();
            }
        });
    }

    function updatePresence() {
        if (!currentUser) return;
        db.collection("presence").doc(currentUser.uid).set({
            displayName: currentUser.displayName || currentUser.email,
            photoURL: currentUser.photoURL || "",
            page: currentPage,
            online: true,
            lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
    }

    function renderOnlineUsers(users) {
        const countEl = $("#online-count");
        const avatarsEl = $("#online-avatars");
        if (!countEl || !avatarsEl) return;

        const pageLabels = {
            dashboard: "Dashboard",
            faqs: "FAQs",
            sops: "SOPs",
            projects: "Projects",
            rules: "Rules",
            changelog: "Changelog",
            admin: "Admin Panel",
        };

        countEl.textContent = `${users.length} online`;
        avatarsEl.innerHTML = users
            .map((u) => `<img src="${u.photoURL}" alt="${u.displayName}" class="online-avatar-pip" data-tooltip="${u.displayName} — ${pageLabels[u.page] || u.page}">`)
            .join("");
    }

    // ---- Logout ----
    function logout() {
        // Set offline before signing out
        if (currentUser) {
            db.collection("presence").doc(currentUser.uid).update({ online: false }).catch(() => {});
        }
        if (presenceInterval) clearInterval(presenceInterval);
        if (presenceUnsubscribe) presenceUnsubscribe();
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

            // Update presence with current page
            currentPage = page;
            updatePresence();

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
        renderFAQs(getAllFAQs());
        renderSOPs(getAllSOPs());
        renderProjects(PROJECTS, "all");
        renderRules(RULES);
        renderChangelog(CHANGELOG);
        setupSearch();
        setupFilters();
    }

    // ---- Dashboard ----
    function renderDashboard() {
        $("#stat-projects").textContent = PROJECTS.filter((p) => p.status === "in-progress").length;
        $("#stat-sops").textContent = getAllSOPs().length;
        $("#stat-faqs").textContent = getAllFAQs().length;
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
        const isAdmin = currentUserData && currentUserData.role === "admin";
        const container = $("#faq-list");
        container.innerHTML = faqs
            .map(
                (faq, i) => `
            <div class="accordion-item" data-index="${i}">
                <div class="accordion-header">
                    <h3>${faq.question}<span class="accordion-tag">${faq.category}</span>
                    ${faq.dynamic && isAdmin ? `<button class="delete-entry-btn" onclick="event.stopPropagation();deleteFAQ('${faq.id}')">Delete</button>` : ""}</h3>
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
        const isAdmin = currentUserData && currentUserData.role === "admin";
        const container = $("#sop-list");
        container.innerHTML = sops
            .map(
                (sop, i) => `
            <div class="document-card" data-index="${i}">
                <h3>${sop.title}${sop.pdfData ? '<span class="sop-pdf-badge">PDF</span>' : ""}
                ${sop.dynamic && isAdmin ? `<button class="delete-entry-btn" onclick="event.stopPropagation();deleteSOP('${sop.id}')">Delete</button>` : ""}</h3>
                <p>${sop.summary}</p>
                <div class="document-meta">
                    <span>By ${sop.author}</span>
                    <span>Updated ${formatDate(sop.lastUpdated)}</span>
                </div>
                <div class="document-content">
                    <div class="document-content-inner">
                        ${sop.content ? sop.content : ""}
                        ${sop.pdfData ? `<a href="${sop.pdfData}" download="${sop.pdfName || 'document.pdf'}" class="sop-pdf-link" onclick="event.stopPropagation();">Download PDF: ${sop.pdfName || "document.pdf"}</a>` : ""}
                    </div>
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
            const filtered = getAllFAQs().filter(
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
            const filtered = getAllSOPs().filter(
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

    // ---- Dynamic Data Loading ----
    async function loadDynamicData() {
        try {
            const faqSnap = await db.collection("faqs").orderBy("createdAt", "desc").get();
            dynamicFAQs = [];
            faqSnap.forEach((doc) => {
                dynamicFAQs.push({ id: doc.id, ...doc.data() });
            });

            const sopSnap = await db.collection("sops").orderBy("createdAt", "desc").get();
            dynamicSOPs = [];
            sopSnap.forEach((doc) => {
                dynamicSOPs.push({ id: doc.id, ...doc.data() });
            });
        } catch (e) {
            console.log("No dynamic data yet:", e);
        }
    }

    function getAllFAQs() {
        return [...dynamicFAQs.map((f) => ({
            question: f.question,
            answer: f.answer,
            category: f.category,
            id: f.id,
            dynamic: true,
        })), ...FAQS];
    }

    function getAllSOPs() {
        return [...dynamicSOPs.map((s) => ({
            title: s.title,
            summary: s.summary,
            author: s.author || "Staff",
            lastUpdated: s.lastUpdated || "",
            content: s.content || "",
            pdfData: s.pdfData || null,
            pdfName: s.pdfName || null,
            id: s.id,
            dynamic: true,
        })), ...SOPS];
    }

    // ---- Modal Handling ----
    $$(".modal-close, .btn-cancel").forEach((btn) => {
        btn.addEventListener("click", () => {
            const modalId = btn.dataset.modal;
            if (modalId) $(`#${modalId}`).classList.add("hidden");
        });
    });

    // ---- Create FAQ ----
    $("#create-faq-btn").addEventListener("click", () => {
        $("#faq-form-modal").classList.remove("hidden");
    });

    $("#faq-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const category = $("#faq-form-category").value.trim();
        const question = $("#faq-form-question").value.trim();
        const answer = $("#faq-form-answer").value.trim();

        if (!question || !answer) return;

        await db.collection("faqs").add({
            category,
            question,
            answer,
            createdBy: currentUser.email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });

        $("#faq-form").reset();
        $("#faq-form-modal").classList.add("hidden");
        await loadDynamicData();
        renderFAQs(getAllFAQs());
        renderDashboard();
    });

    // ---- Create SOP ----
    $("#create-sop-btn").addEventListener("click", () => {
        $("#sop-form-modal").classList.remove("hidden");
    });

    // Tab switching
    $$(".form-tab").forEach((tab) => {
        tab.addEventListener("click", () => {
            $$(".form-tab").forEach((t) => t.classList.remove("active"));
            tab.classList.add("active");
            $$(".form-tab-content").forEach((c) => c.classList.remove("active"));
            $(`#sop-tab-${tab.dataset.tab}`).classList.add("active");
        });
    });

    // PDF file handling
    let selectedPdfData = null;
    let selectedPdfName = null;

    const pdfInput = $("#sop-form-pdf");
    const pdfPreview = $("#pdf-preview");
    const pdfFileName = $("#pdf-file-name");
    const pdfDropArea = $("#pdf-drop-area");

    pdfInput.addEventListener("change", handlePdfSelect);

    pdfDropArea.addEventListener("dragover", (e) => {
        e.preventDefault();
        pdfDropArea.classList.add("dragover");
    });

    pdfDropArea.addEventListener("dragleave", () => {
        pdfDropArea.classList.remove("dragover");
    });

    pdfDropArea.addEventListener("drop", (e) => {
        e.preventDefault();
        pdfDropArea.classList.remove("dragover");
        if (e.dataTransfer.files.length) {
            pdfInput.files = e.dataTransfer.files;
            handlePdfSelect();
        }
    });

    function handlePdfSelect() {
        const file = pdfInput.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            alert("PDF must be under 5MB");
            pdfInput.value = "";
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            selectedPdfData = e.target.result;
            selectedPdfName = file.name;
            pdfFileName.textContent = file.name;
            pdfPreview.classList.remove("hidden");
            pdfDropArea.classList.add("hidden");
        };
        reader.readAsDataURL(file);
    }

    $("#pdf-remove").addEventListener("click", () => {
        selectedPdfData = null;
        selectedPdfName = null;
        pdfInput.value = "";
        pdfPreview.classList.add("hidden");
        pdfDropArea.classList.remove("hidden");
    });

    $("#sop-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const submitBtn = $("#sop-submit-btn");
        submitBtn.disabled = true;
        submitBtn.textContent = "Creating...";

        const title = $("#sop-form-title").value.trim();
        const summary = $("#sop-form-summary").value.trim();
        const content = $("#sop-form-content").value.trim();

        if (!title || !summary) {
            submitBtn.disabled = false;
            submitBtn.textContent = "Create SOP";
            return;
        }

        const today = new Date().toISOString().split("T")[0];
        const sopData = {
            title,
            summary,
            content: content || "",
            author: currentUser.displayName || currentUser.email,
            lastUpdated: today,
            createdBy: currentUser.email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        };

        if (selectedPdfData) {
            sopData.pdfData = selectedPdfData;
            sopData.pdfName = selectedPdfName;
        }

        await db.collection("sops").add(sopData);

        // Reset
        $("#sop-form").reset();
        selectedPdfData = null;
        selectedPdfName = null;
        pdfPreview.classList.add("hidden");
        pdfDropArea.classList.remove("hidden");
        $("#sop-form-modal").classList.add("hidden");
        submitBtn.disabled = false;
        submitBtn.textContent = "Create SOP";

        await loadDynamicData();
        renderSOPs(getAllSOPs());
        renderDashboard();
    });

    // ---- Delete FAQ/SOP ----
    window.deleteFAQ = async function (id) {
        if (confirm("Delete this FAQ?")) {
            await db.collection("faqs").doc(id).delete();
            await loadDynamicData();
            renderFAQs(getAllFAQs());
            renderDashboard();
        }
    };

    window.deleteSOP = async function (id) {
        if (confirm("Delete this SOP?")) {
            await db.collection("sops").doc(id).delete();
            await loadDynamicData();
            renderSOPs(getAllSOPs());
            renderDashboard();
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

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

        // Show admin nav
        if (currentUserData.role === "admin") {
            $("#admin-nav").classList.remove("hidden");
        }

        // All approved users can create
        $("#create-faq-btn").classList.remove("hidden");
        $("#create-sop-btn").classList.remove("hidden");

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
            financials: "Financials",
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
            if (page === "financials") {
                loadTransactions().then(renderFinancials);
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
            <div class="accordion-item ${faq.status === "pending" ? "entry-pending" : ""}" data-index="${i}">
                <div class="accordion-header">
                    <h3>${faq.question}<span class="accordion-tag">${faq.category}</span>
                    ${faq.status === "pending" ? '<span class="pending-badge">PENDING</span>' : ""}
                    ${faq.dynamic && isAdmin && faq.status === "pending" ? `<button class="approve-entry-btn" onclick="event.stopPropagation();approveFAQ('${faq.id}')">Approve</button>` : ""}
                    ${faq.dynamic && isAdmin ? `<button class="delete-entry-btn" onclick="event.stopPropagation();deleteFAQ('${faq.id}')">Delete</button>` : ""}</h3>
                    <span class="accordion-arrow">&#9660;</span>
                </div>
                <div class="accordion-body">
                    <div class="accordion-body-inner">
                        ${faq.status === "pending" ? `<p class="submitted-by">Submitted by ${faq.createdBy}</p>` : ""}
                        ${faq.answer}
                    </div>
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
            <div class="document-card ${sop.status === "pending" ? "entry-pending" : ""}" data-index="${i}">
                <h3>${sop.title}${sop.pdfData ? '<span class="sop-pdf-badge">PDF</span>' : ""}
                ${sop.status === "pending" ? '<span class="pending-badge">PENDING</span>' : ""}
                ${sop.dynamic && isAdmin && sop.status === "pending" ? `<button class="approve-entry-btn" onclick="event.stopPropagation();approveSOP('${sop.id}')">Approve</button>` : ""}
                ${sop.dynamic && isAdmin ? `<button class="delete-entry-btn" onclick="event.stopPropagation();deleteSOP('${sop.id}')">Delete</button>` : ""}</h3>
                <p>${sop.summary}</p>
                <div class="document-meta">
                    <span>By ${sop.author}</span>
                    <span>Updated ${formatDate(sop.lastUpdated)}</span>
                </div>
                <div class="document-content">
                    <div class="document-content-inner">
                        ${sop.status === "pending" ? `<p class="submitted-by">Submitted by ${sop.createdBy} — awaiting admin approval</p>` : ""}
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
        const isAdmin = currentUserData && currentUserData.role === "admin";
        const mapped = dynamicFAQs
            .filter((f) => isAdmin || f.status === "approved")
            .map((f) => ({
                question: f.question,
                answer: f.answer,
                category: f.category,
                id: f.id,
                dynamic: true,
                status: f.status || "approved",
                createdBy: f.createdBy || "",
            }));
        return [...mapped, ...FAQS];
    }

    function getAllSOPs() {
        const isAdmin = currentUserData && currentUserData.role === "admin";
        const mapped = dynamicSOPs
            .filter((s) => isAdmin || s.status === "approved")
            .map((s) => ({
                title: s.title,
                summary: s.summary,
                author: s.author || "Staff",
                lastUpdated: s.lastUpdated || "",
                content: s.content || "",
                pdfData: s.pdfData || null,
                pdfName: s.pdfName || null,
                id: s.id,
                dynamic: true,
                status: s.status || "approved",
                createdBy: s.createdBy || "",
            }));
        return [...mapped, ...SOPS];
    }

    function getPendingCount() {
        return dynamicFAQs.filter((f) => f.status === "pending").length +
               dynamicSOPs.filter((s) => s.status === "pending").length;
    }

    // ---- Modal Handling ----
    document.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-modal]");
        if (btn) {
            const modalId = btn.dataset.modal;
            if (modalId) $(`#${modalId}`).classList.add("hidden");
        }
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

        const isAdmin = currentUserData.role === "admin";
        await db.collection("faqs").add({
            category,
            question,
            answer,
            status: isAdmin ? "approved" : "pending",
            createdBy: currentUser.displayName || currentUser.email,
            createdByEmail: currentUser.email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });

        $("#faq-form").reset();
        $("#faq-form-modal").classList.add("hidden");
        if (!isAdmin) alert("FAQ submitted! It will appear once an admin approves it.");
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

        const isAdmin = currentUserData.role === "admin";
        const today = new Date().toISOString().split("T")[0];
        const sopData = {
            title,
            summary,
            content: content || "",
            author: currentUser.displayName || currentUser.email,
            lastUpdated: today,
            status: isAdmin ? "approved" : "pending",
            createdBy: currentUser.displayName || currentUser.email,
            createdByEmail: currentUser.email,
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
        if (!isAdmin) alert("SOP submitted! It will appear once an admin approves it.");

        await loadDynamicData();
        renderSOPs(getAllSOPs());
        renderDashboard();
    });

    // ---- Financials ----
    let transactions = [];

    async function loadTransactions() {
        try {
            const snap = await db.collection("transactions").orderBy("date", "desc").get();
            transactions = [];
            snap.forEach((doc) => {
                transactions.push({ id: doc.id, ...doc.data() });
            });
        } catch (e) {
            console.log("No transactions yet:", e);
        }
    }

    function renderFinancials() {
        const isAdmin = currentUserData && currentUserData.role === "admin";
        const monthFilter = $("#fin-month-filter").value;
        const typeFilter = $("#fin-type-filter").value;

        // Build month options
        const months = new Set();
        transactions.forEach((t) => {
            if (t.date) {
                const d = t.date.substring(0, 7);
                months.add(d);
            }
        });
        const monthSelect = $("#fin-month-filter");
        const currentVal = monthSelect.value;
        monthSelect.innerHTML = '<option value="all">All Time</option>';
        [...months].sort().reverse().forEach((m) => {
            const [y, mo] = m.split("-");
            const label = new Date(y, mo - 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
            monthSelect.innerHTML += `<option value="${m}">${label}</option>`;
        });
        monthSelect.value = currentVal || "all";

        // Filter transactions
        let filtered = transactions.filter((t) => {
            if (!isAdmin && t.status === "pending") return false;
            if (monthFilter !== "all" && !t.date.startsWith(monthFilter)) return false;
            if (typeFilter !== "all" && t.type !== typeFilter) return false;
            return true;
        });

        // Calculate totals (only approved)
        const approved = transactions.filter((t) => t.status === "approved");
        const filteredApproved = approved.filter((t) => {
            if (monthFilter !== "all" && !t.date.startsWith(monthFilter)) return false;
            if (typeFilter !== "all" && t.type !== typeFilter) return false;
            return true;
        });

        const totalIncome = filteredApproved.filter((t) => t.type === "income").reduce((sum, t) => sum + (t.amount || 0), 0);
        const totalExpenses = filteredApproved.filter((t) => t.type === "expense").reduce((sum, t) => sum + (t.amount || 0), 0);
        const netProfit = totalIncome - totalExpenses;

        const margin = totalIncome > 0 ? ((netProfit / totalIncome) * 100) : 0;
        const expenseRatio = totalIncome > 0 ? ((totalExpenses / totalIncome) * 100) : 0;

        $("#fin-total-income").textContent = `$${totalIncome.toFixed(2)}`;
        $("#fin-total-expenses").textContent = `$${totalExpenses.toFixed(2)}`;
        $("#fin-total-profit").textContent = `${netProfit >= 0 ? "" : "-"}$${Math.abs(netProfit).toFixed(2)}`;
        $("#fin-margin").textContent = `${margin.toFixed(1)}%`;
        $("#fin-margin").className = `kpi-value ${margin >= 0 ? "kpi-cyan" : "kpi-red"}`;
        $("#fin-expense-ratio").textContent = `${expenseRatio.toFixed(1)}%`;
        $("#fin-txn-count").textContent = filteredApproved.length;

        renderCharts(approved);

        // Render list
        const container = $("#fin-transactions");
        if (filtered.length === 0) {
            container.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:40px;">No transactions yet.</p>';
            return;
        }

        container.innerHTML = filtered.map((t) => `
            <div class="fin-txn ${t.status === "pending" ? "txn-pending" : ""}">
                <div class="fin-txn-icon type-${t.type}">
                    ${t.type === "income" ? "&#8593;" : "&#8595;"}
                </div>
                <div class="fin-txn-info">
                    <div class="fin-txn-desc">
                        ${t.description}
                        <span class="fin-txn-cat">${t.category}</span>
                        ${t.status === "pending" ? '<span class="pending-badge">PENDING</span>' : ""}
                    </div>
                    <div class="fin-txn-meta">
                        ${formatDate(t.date)} &bull; ${t.submittedBy || "Unknown"}
                        ${t.subtotal ? ` &bull; Subtotal: $${t.subtotal.toFixed(2)}` : ""}
                        ${t.tax ? ` + Tax: $${t.tax.toFixed(2)}` : ""}
                        ${t.notes ? ` &bull; ${t.notes}` : ""}
                    </div>
                </div>
                <div class="fin-txn-amount amount-${t.type}">
                    ${t.type === "income" ? "+" : "-"}$${(t.amount || 0).toFixed(2)}
                </div>
                <div class="fin-txn-actions">
                    ${isAdmin && t.status === "pending" ? `<button class="approve-entry-btn" onclick="approveTransaction('${t.id}')">Approve</button>` : ""}
                    ${isAdmin ? `<button class="delete-entry-btn" onclick="deleteTransaction('${t.id}')">Delete</button>` : ""}
                </div>
            </div>
        `).join("");
    }

    // ---- Charts ----
    let chartMonthly = null;
    let chartExpenseCat = null;
    let chartIncomeCat = null;
    let chartProfitTrend = null;

    const chartColors = {
        cyan: "#00d4ff",
        red: "#e84057",
        green: "#4ade80",
        yellow: "#fbbf24",
        purple: "#a78bfa",
        orange: "#fb923c",
        pink: "#f472b6",
        teal: "#2dd4bf",
        blue: "#60a5fa",
        lime: "#a3e635",
    };
    const catColorList = Object.values(chartColors);

    const chartDefaults = {
        color: "#8b99b0",
        borderColor: "#2a3242",
        responsive: true,
        maintainAspectRatio: false,
    };

    function renderCharts(approved) {
        renderMonthlyChart(approved);
        renderExpenseCatChart(approved);
        renderIncomeCatChart(approved);
        renderProfitTrendChart(approved);
    }

    function getMonthlyData(data) {
        const months = {};
        data.forEach((t) => {
            const m = t.date.substring(0, 7);
            if (!months[m]) months[m] = { income: 0, expenses: 0 };
            if (t.type === "income") months[m].income += t.amount;
            else months[m].expenses += t.amount;
        });
        const sorted = Object.keys(months).sort();
        return {
            labels: sorted.map((m) => {
                const [y, mo] = m.split("-");
                return new Date(y, mo - 1).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
            }),
            income: sorted.map((m) => months[m].income),
            expenses: sorted.map((m) => months[m].expenses),
            profit: sorted.map((m) => months[m].income - months[m].expenses),
        };
    }

    function renderMonthlyChart(data) {
        const ctx = document.getElementById("chart-monthly");
        if (!ctx) return;
        if (chartMonthly) chartMonthly.destroy();

        const monthly = getMonthlyData(data);

        chartMonthly = new Chart(ctx, {
            type: "bar",
            data: {
                labels: monthly.labels,
                datasets: [
                    {
                        label: "Revenue",
                        data: monthly.income,
                        backgroundColor: "rgba(74, 222, 128, 0.7)",
                        borderColor: chartColors.green,
                        borderWidth: 1,
                        borderRadius: 4,
                    },
                    {
                        label: "Expenses",
                        data: monthly.expenses,
                        backgroundColor: "rgba(232, 64, 87, 0.7)",
                        borderColor: chartColors.red,
                        borderWidth: 1,
                        borderRadius: 4,
                    },
                    {
                        label: "Profit",
                        data: monthly.profit,
                        backgroundColor: "rgba(0, 212, 255, 0.5)",
                        borderColor: chartColors.cyan,
                        borderWidth: 1,
                        borderRadius: 4,
                    },
                ],
            },
            options: {
                ...chartDefaults,
                plugins: {
                    legend: { labels: { color: "#8b99b0", boxWidth: 12 } },
                },
                scales: {
                    x: { ticks: { color: "#556178" }, grid: { color: "#1e2430" } },
                    y: {
                        ticks: { color: "#556178", callback: (v) => "$" + v },
                        grid: { color: "#1e2430" },
                    },
                },
            },
        });
    }

    function renderExpenseCatChart(data) {
        const ctx = document.getElementById("chart-expense-cat");
        if (!ctx) return;
        if (chartExpenseCat) chartExpenseCat.destroy();

        const cats = {};
        data.filter((t) => t.type === "expense").forEach((t) => {
            cats[t.category] = (cats[t.category] || 0) + t.amount;
        });

        const labels = Object.keys(cats);
        const values = Object.values(cats);

        chartExpenseCat = new Chart(ctx, {
            type: "doughnut",
            data: {
                labels,
                datasets: [{
                    data: values,
                    backgroundColor: labels.map((_, i) => catColorList[i % catColorList.length]),
                    borderColor: "#141820",
                    borderWidth: 2,
                }],
            },
            options: {
                ...chartDefaults,
                cutout: "65%",
                plugins: {
                    legend: {
                        position: "bottom",
                        labels: { color: "#8b99b0", boxWidth: 10, padding: 12, font: { size: 11 } },
                    },
                },
            },
        });
    }

    function renderIncomeCatChart(data) {
        const ctx = document.getElementById("chart-income-cat");
        if (!ctx) return;
        if (chartIncomeCat) chartIncomeCat.destroy();

        const cats = {};
        data.filter((t) => t.type === "income").forEach((t) => {
            cats[t.category] = (cats[t.category] || 0) + t.amount;
        });

        const labels = Object.keys(cats);
        const values = Object.values(cats);

        chartIncomeCat = new Chart(ctx, {
            type: "doughnut",
            data: {
                labels,
                datasets: [{
                    data: values,
                    backgroundColor: labels.map((_, i) => catColorList[(i + 3) % catColorList.length]),
                    borderColor: "#141820",
                    borderWidth: 2,
                }],
            },
            options: {
                ...chartDefaults,
                cutout: "65%",
                plugins: {
                    legend: {
                        position: "bottom",
                        labels: { color: "#8b99b0", boxWidth: 10, padding: 12, font: { size: 11 } },
                    },
                },
            },
        });
    }

    function renderProfitTrendChart(data) {
        const ctx = document.getElementById("chart-profit-trend");
        if (!ctx) return;
        if (chartProfitTrend) chartProfitTrend.destroy();

        const monthly = getMonthlyData(data);
        let cumulative = 0;
        const cumulativeData = monthly.profit.map((p) => {
            cumulative += p;
            return cumulative;
        });

        chartProfitTrend = new Chart(ctx, {
            type: "line",
            data: {
                labels: monthly.labels,
                datasets: [{
                    label: "Cumulative Profit",
                    data: cumulativeData,
                    borderColor: chartColors.cyan,
                    backgroundColor: "rgba(0, 212, 255, 0.08)",
                    fill: true,
                    tension: 0.3,
                    pointBackgroundColor: chartColors.cyan,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    borderWidth: 2,
                }],
            },
            options: {
                ...chartDefaults,
                plugins: {
                    legend: { labels: { color: "#8b99b0", boxWidth: 12 } },
                },
                scales: {
                    x: { ticks: { color: "#556178" }, grid: { color: "#1e2430" } },
                    y: {
                        ticks: { color: "#556178", callback: (v) => "$" + v },
                        grid: { color: "#1e2430" },
                    },
                },
            },
        });
    }

    // Transaction form
    $("#add-transaction-btn").addEventListener("click", () => {
        $("#txn-date").value = new Date().toISOString().split("T")[0];
        $("#transaction-modal").classList.remove("hidden");
    });

    // Type tabs
    $$(".txn-tab").forEach((tab) => {
        tab.addEventListener("click", () => {
            $$(".txn-tab").forEach((t) => t.classList.remove("active"));
            tab.classList.add("active");
            $("#txn-type").value = tab.dataset.txnType;
        });
    });

    // Submit transaction
    $("#transaction-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const submitBtn = $("#txn-submit-btn");
        submitBtn.disabled = true;
        submitBtn.textContent = "Submitting...";

        const isAdmin = currentUserData.role === "admin";
        const subtotal = parseFloat($("#txn-subtotal").value) || 0;
        const tax = parseFloat($("#txn-tax").value) || 0;

        const txnData = {
            type: $("#txn-type").value,
            description: $("#txn-description").value.trim(),
            amount: parseFloat($("#txn-amount").value),
            subtotal,
            tax,
            category: $("#txn-category").value,
            date: $("#txn-date").value,
            notes: $("#txn-notes").value.trim(),
            status: isAdmin ? "approved" : "pending",
            submittedBy: currentUser.displayName || currentUser.email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        };

        await db.collection("transactions").add(txnData);

        // Reset
        $("#transaction-form").reset();
        $$(".txn-tab").forEach((t) => t.classList.remove("active"));
        $$(".txn-tab")[0].classList.add("active");
        $("#txn-type").value = "expense";
        $("#transaction-modal").classList.add("hidden");
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit";

        if (!isAdmin) alert("Transaction submitted! It will appear once an admin approves it.");

        await loadTransactions();
        renderFinancials();
    });

    // Filter listeners
    $("#fin-month-filter").addEventListener("change", renderFinancials);
    $("#fin-type-filter").addEventListener("change", renderFinancials);

    // Approve/delete transactions
    window.approveTransaction = async function (id) {
        await db.collection("transactions").doc(id).update({ status: "approved" });
        await loadTransactions();
        renderFinancials();
    };

    window.deleteTransaction = async function (id) {
        if (confirm("Delete this transaction?")) {
            await db.collection("transactions").doc(id).delete();
            await loadTransactions();
            renderFinancials();
        }
    };

    // ---- Approve FAQ/SOP ----
    window.approveFAQ = async function (id) {
        await db.collection("faqs").doc(id).update({ status: "approved" });
        await loadDynamicData();
        renderFAQs(getAllFAQs());
        renderDashboard();
    };

    window.approveSOP = async function (id) {
        await db.collection("sops").doc(id).update({ status: "approved" });
        await loadDynamicData();
        renderSOPs(getAllSOPs());
        renderDashboard();
    };

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

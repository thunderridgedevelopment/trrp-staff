// ============================================
// STAFF PORTAL - Application Logic
// ============================================

(function () {
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    // ---- Auth ----
    const loginScreen = $("#login-screen");
    const app = $("#app");
    const loginForm = $("#login-form");
    const passwordInput = $("#password-input");
    const loginError = $("#login-error");
    const logoutBtn = $("#logout-btn");

    function checkAuth() {
        if (sessionStorage.getItem("staff_auth") === "true") {
            showApp();
        }
    }

    loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        if (passwordInput.value === SITE_CONFIG.password) {
            sessionStorage.setItem("staff_auth", "true");
            showApp();
        } else {
            loginError.classList.remove("hidden");
            passwordInput.value = "";
            passwordInput.focus();
        }
    });

    logoutBtn.addEventListener("click", () => {
        sessionStorage.removeItem("staff_auth");
        location.reload();
    });

    function showApp() {
        loginScreen.classList.add("hidden");
        app.classList.remove("hidden");
        renderAll();
    }

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

    // ---- Render All ----
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

    // ---- Helpers ----
    function formatDate(dateStr) {
        const date = new Date(dateStr + "T00:00:00");
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    }

    // ---- Init ----
    checkAuth();
})();

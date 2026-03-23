// ============================================
// STAFF PORTAL - ALL CONTENT DATA
// ============================================
// Edit this file to update all site content.
// No coding knowledge needed — just follow the patterns below.
// ============================================

const SITE_CONFIG = {
    // Change this to set the staff password
    password: "staff2026",

    // Site title (shown in sidebar and login)
    title: "THUNDER RIDGE RP",
};

// ============================================
// FAQs
// ============================================
const FAQS = [
    {
        question: "How do I get staff permissions in-game?",
        answer: "Contact a Senior Admin or the server owner in the #staff-requests Discord channel. You'll need to provide your in-game character name and Discord ID. Permissions are granted after your trial period.",
        category: "Getting Started",
    },
    {
        question: "What do I do if a player reports a bug?",
        answer: "Log the bug in the #bug-reports Discord channel with: player name, description of the bug, steps to reproduce, and any screenshots. Do NOT attempt to fix bugs in-game unless you have developer permissions.",
        category: "Support",
    },
    {
        question: "How do I handle a player dispute?",
        answer: "Stay neutral. Hear both sides separately if possible. Refer to the relevant SOP for the type of dispute. If the situation escalates, pull in a Senior Admin. Always document the outcome in the #staff-logs channel.",
        category: "Moderation",
    },
    {
        question: "When should I escalate to a Senior Admin?",
        answer: "Escalate when: the issue involves real money, a player is threatening legal action, there's a potential exploit being abused, you're unsure of the correct ruling, or the situation involves another staff member.",
        category: "Moderation",
    },
    {
        question: "How do I submit a suggestion for the server?",
        answer: "Use the #staff-suggestions channel in Discord. Format your suggestion with: Title, Description, Why it would benefit the server, and any implementation ideas. Suggestions are reviewed weekly.",
        category: "General",
    },
];

// ============================================
// SOPs (Standard Operating Procedures)
// ============================================
const SOPS = [
    {
        title: "Player Ban Procedure",
        summary: "Standard process for issuing temporary and permanent bans.",
        author: "Admin Team",
        lastUpdated: "2026-03-20",
        content: `
            <h4>Temporary Bans</h4>
            <ol>
                <li>Document the offense with screenshots/evidence</li>
                <li>Issue a warning first (unless the offense is severe)</li>
                <li>If the behavior continues, issue a temp ban (1-7 days based on severity)</li>
                <li>Log the ban in #staff-logs with: player name, reason, duration, evidence</li>
                <li>Notify the player via Discord DM with the reason and duration</li>
            </ol>
            <h4>Permanent Bans</h4>
            <ol>
                <li>Permanent bans require approval from a Senior Admin or above</li>
                <li>Submit a ban request in #ban-requests with full evidence</li>
                <li>Wait for approval before executing the ban</li>
                <li>Once approved, execute the ban and log it</li>
            </ol>
            <h4>Ban Appeals</h4>
            <p>All ban appeals go through the #ban-appeals channel. The original banning staff member should provide their perspective but should NOT be the sole decision-maker on the appeal.</p>
        `,
    },
    {
        title: "New Player Onboarding",
        summary: "How to welcome and assist new players joining the server.",
        author: "Community Team",
        lastUpdated: "2026-03-15",
        content: `
            <h4>When a New Player Joins</h4>
            <ol>
                <li>Greet them in a welcoming manner</li>
                <li>Ask if they've read the server rules</li>
                <li>Offer to answer any questions about the server</li>
                <li>Point them to the #new-players channel in Discord</li>
                <li>If they need help with character creation, walk them through it</li>
            </ol>
            <h4>Common New Player Issues</h4>
            <ul>
                <li>Can't find NPCs — direct them to the map markers</li>
                <li>Controls confusion — share the controls guide link</li>
                <li>Connection issues — refer to #tech-support</li>
            </ul>
        `,
    },
    {
        title: "Event Hosting Guidelines",
        summary: "Procedures for planning and running in-game events.",
        author: "Events Team",
        lastUpdated: "2026-03-10",
        content: `
            <h4>Before the Event</h4>
            <ol>
                <li>Submit event proposal in #event-planning at least 3 days in advance</li>
                <li>Get approval from an Admin</li>
                <li>Announce the event in #announcements with date, time, and details</li>
                <li>Test any scripts or mechanics needed for the event</li>
            </ol>
            <h4>During the Event</h4>
            <ul>
                <li>Have at least 2 staff members present</li>
                <li>Monitor for rule-breakers and handle them per SOP</li>
                <li>Take screenshots/clips for social media</li>
            </ul>
            <h4>After the Event</h4>
            <ul>
                <li>Post a summary in #event-logs</li>
                <li>Gather feedback from participants</li>
                <li>Note any issues for future improvement</li>
            </ul>
        `,
    },
];

// ============================================
// PROJECTS
// ============================================
const PROJECTS = [
    {
        title: "New Player Tutorial System",
        description: "Interactive tutorial that guides new players through server mechanics, controls, and rules.",
        status: "in-progress",
        progress: 65,
        lead: "Dev Team",
        deadline: "2026-04-15",
    },
    {
        title: "Staff Dashboard Overhaul",
        description: "Redesigning the staff tools and admin panel for better usability and more features.",
        status: "in-progress",
        progress: 30,
        lead: "Admin Team",
        deadline: "2026-05-01",
    },
    {
        title: "Anti-Cheat Improvements",
        description: "Upgrading the anti-cheat system to catch new exploits and reduce false positives.",
        status: "planned",
        progress: 0,
        lead: "Dev Team",
        deadline: "2026-05-15",
    },
    {
        title: "Community Event Calendar",
        description: "A shared calendar system for scheduling and promoting server events.",
        status: "completed",
        progress: 100,
        lead: "Events Team",
        deadline: "2026-03-01",
    },
];

// ============================================
// RULES
// ============================================
const RULES = [
    {
        title: "Professionalism",
        description: "Maintain a professional demeanor at all times when interacting with players. You represent the server. Keep personal opinions separate from staff duties.",
    },
    {
        title: "Confidentiality",
        description: "Staff discussions, internal tools, player reports, and ban details are confidential. Do not share staff-only information with non-staff members.",
    },
    {
        title: "Impartiality",
        description: "Treat all players equally regardless of personal relationships. Do not give friends or community members preferential treatment. If you have a conflict of interest, recuse yourself.",
    },
    {
        title: "Activity Requirements",
        description: "Staff members must be active a minimum of 10 hours per week in-game and check Discord daily. If you need time off, notify an Admin in advance.",
    },
    {
        title: "Chain of Command",
        description: "Follow the established hierarchy. Escalate issues you cannot resolve to the next level. Do not override decisions made by higher-ranking staff without permission.",
    },
    {
        title: "No Abuse of Power",
        description: "Staff tools and permissions are for server management only. Using them for personal gain, trolling, or harassing players will result in immediate removal from the team.",
    },
    {
        title: "Documentation",
        description: "Log all significant actions (bans, warnings, disputes, events) in the appropriate Discord channels. If it isn't logged, it didn't happen.",
    },
];

// ============================================
// CHANGELOG
// ============================================
const CHANGELOG = [
    {
        date: "2026-03-22",
        title: "Staff Portal Launch",
        tags: ["added"],
        changes: [
            "Launched the new staff portal website",
            "Added FAQs, SOPs, Projects, and Rules sections",
            "Implemented password-protected access",
            "Mobile-responsive design",
        ],
    },
    {
        date: "2026-03-20",
        title: "Ban Procedure Update",
        tags: ["changed"],
        changes: [
            "Updated ban appeal process to require secondary reviewer",
            "Added 24-hour cooling period before permanent bans",
            "Clarified evidence requirements for temp bans",
        ],
    },
    {
        date: "2026-03-15",
        title: "New Onboarding SOP",
        tags: ["added"],
        changes: [
            "Created comprehensive new player onboarding procedure",
            "Added common issues troubleshooting guide",
            "Assigned Community Team as SOP owners",
        ],
    },
    {
        date: "2026-03-10",
        title: "Event System Fix",
        tags: ["fixed"],
        changes: [
            "Fixed event notifications not being sent to all staff",
            "Resolved calendar sync issues",
            "Fixed event log formatting",
        ],
    },
];

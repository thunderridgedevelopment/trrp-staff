// ============================================
// THUNDER RIDGE RP - STAFF PORTAL CONFIG
// ============================================
// Edit this file to update all site content.
// ============================================

// ---- Firebase Config ----
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyBiuQ-4Ji_FmLLATH4Zh55bqfF2o1T9q-8",
    authDomain: "trrp-staff.firebaseapp.com",
    projectId: "trrp-staff",
    storageBucket: "trrp-staff.firebasestorage.app",
    messagingSenderId: "986582004945",
    appId: "1:986582004945:web:5c00509341e592bbb0c1f0",
    measurementId: "G-717DKHVTW8",
};

// ---- Admin Emails ----
// These emails automatically get admin access on first sign-in.
// Everyone else goes to "pending" until an admin approves them.
const ADMIN_EMAILS = [
    "thunderridgedevelopment@gmail.com",
];

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
        title: "Business Restock Guide",
        summary: "Admin inventory management — how to give items and stock businesses.",
        author: "Admin Team",
        lastUpdated: "2026-03-23",
        content: `
            <h4>Quick Start — 3 Easy Steps</h4>
            <ol>
                <li><strong>Give yourself the items:</strong> <code>/giveitem [your-server-id] [item_name] [amount]</code><br>Example: <code>/giveitem 1 bread 20</code></li>
                <li><strong>Walk to the business</strong> crafting station or shop counter — the "Job Menu" prompt will appear</li>
                <li><strong>Add items to the shop shelf:</strong> Open Job Menu → "Manage Stock" or "Add Stock" → Choose item → Set quantity &amp; price → Confirm</li>
            </ol>
            <p><strong>TIP:</strong> Your server ID is the number next to your name in the player list (usually <strong>1</strong> if you're the only one online).</p>
            <p><strong>IMPORTANT:</strong> You must have items in your personal inventory before adding them to a shop. <code>/giveitem</code> puts them in your inventory first, then you transfer via the Job Menu.</p>

            <h4>Admin Roles &amp; Permissions</h4>
            <ul>
                <li><strong>Owner / Management</strong> — Access to ALL businesses</li>
                <li><strong>Head of Food</strong> — Bakery, Brewer, Butcher, Candy, Coffee, Cooking, Fishmonger, Saloon</li>
                <li><strong>Head of Crafting</strong> — Blacksmith, Carpentry, Furniture, Jewelry, Machinist, Tailor, Woodshop</li>
                <li><strong>Head of Weapons</strong> — Gunsmith, Weaponsmith</li>
                <li><strong>Head of Medical</strong> — Pharmacy</li>
            </ul>

            <h4>Food &amp; Drink Businesses</h4>
            <ul>
                <li><strong>Bakery:</strong> flour_wheat, sugar, bread, cornbread, biscuits, banana_bread, cinnamon_roll, cookie, blueberry_muffin, fruit_tart, apple_pie, cake, pumpkin_bread</li>
                <li><strong>Brewer:</strong> malt, sugar, yeast, beer, ale, lager, porter, mead, mash, moonshine, corn_whiskey, whiskey, aged_whiskey, rum, brandy, apple_brandy, fruit_wine, hard_cider</li>
                <li><strong>Butcher:</strong> meat_cuts, chicken_meat, raw_meat, jerky, salted_meat, smoked_meat, smoked_fish, bacon, cured_ham, sausage, pemmican, mutton, lard, animal_feed</li>
                <li><strong>Candy:</strong> cocoa_powder, sugar, peppermint_candy, honey_drops, rock_candy, fruit_drops, chocolate_bar, chocolate_truffle, chocolate_bonbon, taffy, caramel, fudge, pralines, candy_box</li>
                <li><strong>Coffee:</strong> coffee_beans, sugar, black_coffee, coffee_with_milk, sweet_coffee, espresso, caffe_lungo, caffe_macchiato, black_tea, herbal_tea, sweet_tea, chai_tea, cornetto, biscotti, tramezzini, panini, pasticceria, cappuccino, latte_macchiato, honey_latte, caffe_freddo, almond_milk_coffee, hot_chocolate, marocchino, spiced_coffee, caffe_corretto, crema_caffe, bicerin, caffe_parrinu, irish_coffee</li>
                <li><strong>Cooking:</strong> cooked_fish, cooked_meat, cooked_beef, cooked_mutton, cooked_goat, bread_sour, cheese, goat_cheese, gourmet_meal</li>
                <li><strong>Fishmonger:</strong> <em>Static shop — no manual restocking needed</em></li>
                <li><strong>Saloon:</strong> sugar, sandwich, baked_potato, eggs_breakfast, stew, fried_chicken, meat_pie, roast_dinner, chili, potato_soup, fish_stew, coffee, coffee_pot, apple_cider, beef_stew, mutton_stew, shepherds_pie, goat_stew, pork_roast, grilled_cheese, cheese_omelette</li>
            </ul>

            <h4>Crafting Businesses</h4>
            <ul>
                <li><strong>Blacksmith:</strong> iron_bar, steel_bar, copper_bar, tin_bar, brass_bar, zinc_bar, lead_bar, gold_bar, silver_bar, glass_jar, nails, pickaxe, axe, shovel, goldpan, weapon_melee_knife, weapon_melee_hatchet, weapon_melee_machete, weapon_melee_cleaver, revolverbarrel, revolvercylinder, pistolbarrel, pistolreceiver, repeaterbarrel, repeaterreceiver, riflebarrel, riflereceiver, shotgunbarrel, pistolparts, revolverparts, repeaterparts, rifleparts, shotgunparts, ammoparts, water_bucket_empty, wateringcan, bottle, horse_lantern, bee_jar, weapon_melee_lantern, weapon_melee_davy_lantern, weapon_melee_torch, weapon_fishingrod, pipe, horseshoe, wedding_ring</li>
                <li><strong>Carpentry:</strong> wood_plank, sawdust, woodhandle, wood_glue, paper, cardboard_box, wooden_chair, wooden_table, wooden_crate, wooden_barrel, carpenter_tools, weapon_melee_torch, weapon_fishingrod, pipe, matches, horse_brush, wagon_wheel, wagonrepair_kit, bee_honey_apiary, bee_carpe_apiary, bee_horne_apiary, bee_advan_apiary, feed_trough, water_trough, chicken_coop, milk_processor, fertilizer_barrel, processing_table, meat_smoker, weaving_loom, drying_rack, revolverhandle, repeaterstock, riflestock, shotgunstock</li>
                <li><strong>Furniture:</strong> curtains, woven_rug, quilt, tablecloth, wall_mirror, candle_holder, picture_frame, mantle_clock, wall_shelf, bed_frame, wardrobe, rocking_chair</li>
                <li><strong>Jewelry:</strong> silver_ring, gold_ring, wedding_ring, gemstone_ring, silver_necklace, gold_pendant, locket, pearl_necklace, silver_bracelet, gold_bracelet, cameo_brooch, bolo_tie</li>
                <li><strong>Machinist:</strong> spring, gear, chain, mechanical_parts, trigger_mechanism, compass, scope_mount, spur, pocket_watch, music_box, weapon_kit_metal_detector, weapon_kit_binoculars, weapon_kit_camera, oilwell</li>
                <li><strong>Tailor:</strong> thread, dye, rope, leather, fine_leather, belt, gloves, satchel, holster, moccasins, fur_hat, fur_coat</li>
                <li><strong>Woodshop:</strong> <em>Static shop — no manual restocking needed</em></li>
            </ul>

            <h4>Weapons Businesses</h4>
            <ul>
                <li><strong>Gunsmith:</strong> weapon_pistol_volcanic, weapon_pistol_semiauto, weapon_pistol_mauser, weapon_pistol_m1899, weapon_revolver_cattleman, weapon_revolver_doubleaction, weapon_revolver_schofield, weapon_revolver_lemat, weapon_revolver_navy, weapon_revolver_cattleman_mexican, weapon_revolver_doubleaction_gambler, weapon_revolver_navy_crossover, weapon_rifle_varmint, weapon_rifle_springfield, weapon_rifle_boltaction, weapon_sniperrifle_carcano, weapon_sniperrifle_rollingblock, weapon_rifle_elephant, weapon_sniperrifle_rollingblock_exotic, weapon_shotgun_sawedoff, weapon_shotgun_doublebarrel, weapon_shotgun_pump, weapon_shotgun_semiauto</li>
                <li><strong>Weaponsmith:</strong> weapon_revolver_cattleman, weapon_pistol_volcanic, weapon_repeater_carbine, weapon_rifle_varmint, weapon_shotgun_doublebarrel</li>
            </ul>

            <h4>Medical</h4>
            <ul>
                <li><strong>Pharmacy:</strong> bandage, fieldbandage, splint, suture_kit, healing_salve, herbal_tea, cough_syrup, tonic, poultice, painkillers, antibiotics, antivenom, smelling_salts, fever_remedy, firstaid, advanced_bandage, advanced_splint, advanced_painkillers, advanced_antibiotics, syringe, horse_stimulant, horse_reviver</li>
            </ul>

            <h4>General Businesses</h4>
            <ul>
                <li><strong>General Store:</strong> <em>Static shop — no manual restocking needed</em></li>
                <li><strong>Pawnshop:</strong> <em>Static shop — no manual restocking needed</em></li>
                <li><strong>Saddler:</strong> horseshoe, stirrups, chain, spur, reins, bridle, riding_crop, horse_blanket, saddle, saddle_bag, saddle_blanket, harness, horse_brush, horse_stimulant, horse_reviver, horse_carrot, horse_apple, sugar, sugarcube, haysnack, horsemeal</li>
                <li><strong>Seedshop:</strong> pineappleseed, bananaseed, melonseed, appleseed, pearseed, mangoseed, tomatoseed, wheatseed, barleyseed, sugarcaneseed, coffeeseed, onionseed, garlicseed</li>
                <li><strong>Tobacco:</strong> cigarette, cigarette_pack, rolling_tobacco, chewing_tobacco, pipe_tobacco, aromatic_tobacco, snuff, cigarillo, cigar, premium_cigar</li>
            </ul>

            <h4>Common Restock Examples</h4>
            <ul>
                <li><strong>Stock a Bakery:</strong> <code>/giveitem 1 bread 50</code> → <code>/giveitem 1 apple_pie 20</code> → <code>/giveitem 1 cinnamon_roll 30</code> → Walk to bakery → Job Menu → Add Stock</li>
                <li><strong>Stock a Pharmacy:</strong> <code>/giveitem 1 bandage 100</code> → <code>/giveitem 1 healing_salve 50</code> → <code>/giveitem 1 tonic 50</code> → <code>/giveitem 1 horse_reviver 30</code></li>
                <li><strong>Stock a Gunsmith:</strong> <code>/giveitem 1 weapon_revolver_cattleman 10</code> → <code>/giveitem 1 weapon_rifle_springfield 10</code> → <code>/giveitem 1 weapon_shotgun_doublebarrel 10</code></li>
            </ul>
            <p><strong>REMEMBER:</strong> Revenue from customer purchases goes into the business boss fund. Check the balance via the <strong>Boss Menu</strong> in the Job Menu.</p>
        `,
    },
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
        date: "2026-03-23",
        title: "Staff Portal v2 Launch",
        tags: ["added"],
        changes: [
            "Google sign-in authentication",
            "Admin panel with user management",
            "Ban/unban and approval system",
            "Role-based access control",
        ],
    },
    {
        date: "2026-03-22",
        title: "Staff Portal Launch",
        tags: ["added"],
        changes: [
            "Launched the new staff portal website",
            "Added FAQs, SOPs, Projects, and Rules sections",
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

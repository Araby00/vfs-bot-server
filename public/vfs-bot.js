// ═══════════════════════════════════════════════════════════
// VFS APPOINTMENT BOT - Main Script (vfs-bot.js)
// ═══════════════════════════════════════════════════════════

(function () {
    'use strict';

    console.log('🚀 VFS Bot Starting...');

    // Country configurations
    const COUNTRIES = {
        NLD: {
            name: "Netherlands",
            missionCode: "nld",
            centerCode: "NLD-NCNC",
            route: "egy/en/nld",
            ipAddress: "156.201.38.191",
            fees: 1270,
            categories: [
                { code: "BUS", name: "Business" },
                { code: "TOUR", name: "Tourism" }
            ]
        },
        PRT: {
            name: "Portugal",
            missionCode: "prt",
            centerCode: "POCA",
            route: "egy/en/prt",
            ipAddress: "156.201.103.142",
            fees: 2150,
            categories: [
                { code: "Apel", name: "Appeal" },
                { code: "JB", name: "National (Job Seeker)" },
                { code: "LT", name: "National (Long Term)" },
                { code: "BUS", name: "Short Term (Business)" },
                { code: "CSE", name: "Short Term (Sports Events)" },
                { code: "FFV", name: "Short Term (Family Visit)" },
                { code: "MED", name: "Short Term (Medical)" },
                { code: "TOU", name: "Short Term (Tourism)" }
            ]
        }
    };

    // Storage helper
    const Storage = {
        get: (key, defaultValue) => {
            const value = localStorage.getItem(`vfs_bot_${key}`);
            return value ? JSON.parse(value) : defaultValue;
        },
        set: (key, value) => {
            localStorage.setItem(`vfs_bot_${key}`, JSON.stringify(value));
        }
    };

    // Captured tokens
    let capturedData = {
        authorize: Storage.get("authorize", ""),
        clientsource: Storage.get("clientsource", "")
    };

    // Simple styles
    const styles = `
        #vfs-panel {
            position: fixed !important;
            top: 60px !important;
            left: 20px !important;
            width: 320px !important;
            background: #2c3e50 !important;
            color: #ecf0f1 !important;
            border-radius: 8px !important;
            padding: 15px !important;
            font-family: Arial, sans-serif !important;
            font-size: 12px !important;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
            z-index: 2147483647 !important;
            max-height: 85vh !important;
            overflow-y: auto !important;
        }
        #vfs-toggle {
            position: fixed !important;
            top: 10px !important;
            left: 20px !important;
            background: #3498db !important;
            color: white !important;
            border: none !important;
            border-radius: 5px !important;
            padding: 8px 15px !important;
            cursor: pointer !important;
            z-index: 2147483647 !important;
            font-weight: bold !important;
        }
        .vfs-input {
            width: 100%;
            padding: 8px;
            margin: 5px 0;
            border: 1px solid #34495e;
            border-radius: 4px;
            background: #34495e;
            color: #ecf0f1;
            font-size: 12px;
            box-sizing: border-box;
        }
        .vfs-btn {
            width: 100%;
            padding: 10px;
            margin: 8px 0;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-weight: bold;
            font-size: 13px;
        }
        .btn-primary { background: #27ae60; color: white; }
        .btn-secondary { background: #3498db; color: white; }
        .btn-danger { background: #e74c3c; color: white; }
        .vfs-log {
            background: #1a1a1a;
            border-radius: 4px;
            padding: 10px;
            height: 200px;
            overflow-y: auto;
            font-family: monospace;
            font-size: 10px;
            margin-top: 10px;
            color: #0f0;
        }
    `;

    const styleEl = document.createElement('style');
    styleEl.textContent = styles;
    document.head.appendChild(styleEl);

    // Toggle button
    const toggleBtn = document.createElement("button");
    toggleBtn.id = "vfs-toggle";
    toggleBtn.innerHTML = 'VFS BOT';
    toggleBtn.onclick = () => {
        const panel = document.getElementById('vfs-panel');
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    };
    document.body.appendChild(toggleBtn);

    // Main panel
    const panel = document.createElement("div");
    panel.id = "vfs-panel";
    panel.style.display = "block";
    panel.innerHTML = `
        <div style="font-size: 14px; font-weight: bold; margin-bottom: 10px; color: #3498db;">
            VFS APPOINTMENT BOT
            <button id="minimizeBtn" style="float: right; background: #e74c3c; border: none; color: white; padding: 2px 8px; border-radius: 3px; cursor: pointer; font-size: 10px;">MIN</button>
        </div>

        <div style="margin: 15px 0; padding-bottom: 10px; border-bottom: 1px solid #34495e;">
            <div style="font-size: 12px; font-weight: bold; margin-bottom: 10px; color: #3498db;">🌍 Select Country</div>
            <select id="countrySelect" class="vfs-input">
                <option value="NLD">🇳🇱 Netherlands</option>
                <option value="PRT">🇵🇹 Portugal</option>
            </select>
            <div id="countryInfo" style="padding: 8px; background: #34495e; border-radius: 4px; margin-top: 8px; font-size: 11px;">
                <div>📍 Center: <span id="centerInfo">-</span></div>
                <div>💰 Fees: <span id="feesInfo">-</span> EGP</div>
            </div>
        </div>

        <div style="margin: 15px 0; padding-bottom: 10px; border-bottom: 1px solid #34495e;">
            <select id="profileSelect" class="vfs-input">
                <option value="">-- Select Profile --</option>
            </select>
            <input type="text" id="profileName" class="vfs-input" placeholder="Profile Name">
            <input type="text" id="firstName" class="vfs-input" placeholder="First Name">
            <input type="text" id="lastName" class="vfs-input" placeholder="Last Name">
            <input type="email" id="email" class="vfs-input" placeholder="Email">
            <input type="text" id="contactNumber" class="vfs-input" placeholder="Phone (without 0)">
            <input type="text" id="passportNumber" class="vfs-input" placeholder="Passport Number">
            <input type="date" id="dateOfBirth" class="vfs-input">
            <input type="date" id="passportExpiry" class="vfs-input">
            <select id="gender" class="vfs-input">
                <option value="">Gender</option>
                <option value="0">Male</option>
                <option value="1">Female</option>
            </select>
            <select id="visaCategory" class="vfs-input"></select>
            <button id="saveProfile" class="vfs-btn btn-secondary">💾 Save Profile</button>
        </div>

        <div style="margin: 15px 0; padding-bottom: 10px; border-bottom: 1px solid #34495e;">
            <div style="font-size: 12px; font-weight: bold; margin-bottom: 10px; color: #3498db;">📅 Booking Preferences</div>
            <select id="dateStrategy" class="vfs-input">
                <option value="first">📅 First Available Date</option>
                <option value="latest">📅 Latest Date</option>
                <option value="random">🎲 Random Date</option>
            </select>
            <select id="slotStrategy" class="vfs-input">
                <option value="first">⏰ First Available Slot</option>
                <option value="latest">⏰ Latest Slot</option>
                <option value="random">🎲 Random Slot</option>
            </select>
        </div>

        <div style="padding: 8px; background: #34495e; border-radius: 4px; margin: 10px 0; font-size: 11px;">
            <div>Auth: <span id="authStatus">❌</span></div>
            <div>Client: <span id="clientStatus">❌</span></div>
            <div>Status: <span id="mainStatus">Ready</span></div>
        </div>

        <button id="startBtn" class="vfs-btn btn-primary">🚀 Start Booking</button>
        <button id="clearBtn" class="vfs-btn btn-danger">🗑️ Clear Data</button>

        <div class="vfs-log" id="logArea">Bot ready...</div>
    `;
    document.body.appendChild(panel);

    // Elements
    const logArea = document.getElementById("logArea");
    const authStatus = document.getElementById("authStatus");
    const clientStatus = document.getElementById("clientStatus");
    const mainStatus = document.getElementById("mainStatus");
    const profileSelect = document.getElementById("profileSelect");
    const visaCategorySelect = document.getElementById("visaCategory");
    const countrySelect = document.getElementById("countrySelect");
    const centerInfo = document.getElementById("centerInfo");
    const feesInfo = document.getElementById("feesInfo");

    // Load saved settings
    countrySelect.value = Storage.get("selectedCountry", "NLD");

    // Update country info
    function updateCountryInfo() {
        const country = COUNTRIES[countrySelect.value];
        centerInfo.textContent = country.centerCode;
        feesInfo.textContent = country.fees;

        visaCategorySelect.innerHTML = '';
        country.categories.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat.code;
            opt.textContent = cat.name;
            visaCategorySelect.appendChild(opt);
        });

        log(`🌍 Country: ${country.name}`);
    }

    // Logging
    function log(msg) {
        const time = new Date().toLocaleTimeString();
        logArea.innerHTML += `<div>[${time}] ${msg}</div>`;
        logArea.scrollTop = logArea.scrollHeight;
    }

    // Update UI
    function updateUI() {
        authStatus.textContent = capturedData.authorize ? "✅" : "❌";
        clientStatus.textContent = capturedData.clientsource ? "✅" : "❌";
    }

    // Capture tokens
    function setCaptured(key, value) {
        if (value && value !== capturedData[key]) {
            capturedData[key] = value;
            Storage.set(key, value);
            log(`${key} captured`);
            updateUI();
        }
    }

    // Intercept headers
    const origSetHeader = XMLHttpRequest.prototype.setRequestHeader;
    XMLHttpRequest.prototype.setRequestHeader = function (header, value) {
        if (header.toLowerCase() === "authorize" || header.toLowerCase() === "authorization") {
            setCaptured("authorize", value);
        }
        if (header.toLowerCase() === "clientsource") {
            setCaptured("clientsource", value);
        }
        return origSetHeader.apply(this, arguments);
    };

    // Profile management
    function loadProfiles() {
        const profiles = JSON.parse(Storage.get('profiles', '{}'));
        profileSelect.innerHTML = '<option value="">-- Select Profile --</option>';
        Object.keys(profiles).forEach(name => {
            const opt = document.createElement('option');
            opt.value = name;
            opt.textContent = name;
            profileSelect.appendChild(opt);
        });
    }

    function saveProfile() {
        const name = document.getElementById('profileName').value.trim();
        if (!name) {
            log("❌ Profile name required");
            return;
        }

        const data = {
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            email: document.getElementById('email').value,
            contactNumber: document.getElementById('contactNumber').value,
            passportNumber: document.getElementById('passportNumber').value,
            dateOfBirth: document.getElementById('dateOfBirth').value,
            passportExpiry: document.getElementById('passportExpiry').value,
            gender: document.getElementById('gender').value,
            visaCategory: document.getElementById('visaCategory').value,
            country: countrySelect.value
        };

        const profiles = JSON.parse(Storage.get('profiles', '{}'));
        profiles[name] = data;
        Storage.set('profiles', JSON.stringify(profiles));
        log(`✅ Profile "${name}" saved`);
        loadProfiles();
    }

    function loadProfile() {
        const name = profileSelect.value;
        if (!name) return;

        const profiles = JSON.parse(Storage.get('profiles', '{}'));
        const data = profiles[name];
        if (data) {
            Object.keys(data).forEach(key => {
                const el = document.getElementById(key);
                if (el) el.value = data[key] || '';
            });
            if (data.country) {
                countrySelect.value = data.country;
                updateCountryInfo();
            }
            log(`✅ Profile "${name}" loaded`);
        }
    }

    // Date formatting
    function formatDate(d) {
        if (!d) return null;
        if (d.includes("-")) {
            let [yyyy, mm, dd] = d.split("-");
            return `${dd}/${mm}/${yyyy}`;
        }
        return d;
    }

    // Get current country config
    function getCountryConfig() {
        return COUNTRIES[countrySelect.value];
    }

    // API Functions
    function sendApplicant(profile) {
        const config = getCountryConfig();
        log(`📤 Sending applicant to ${config.name}...`);

        let contact = profile.contactNumber;
        if (contact.startsWith('0')) contact = contact.substring(1);

        const payload = {
            countryCode: "egy",
            missionCode: config.missionCode,
            centerCode: config.centerCode,
            loginUser: profile.email,
            visaCategoryCode: profile.visaCategory,
            isEdit: false,
            applicantList: [{
                loginUser: profile.email,
                firstName: profile.firstName.toUpperCase(),
                lastName: profile.lastName.toUpperCase(),
                gender: parseInt(profile.gender) || 1,
                contactNumber: contact,
                dialCode: "02",
                passportNumber: profile.passportNumber.toUpperCase(),
                passportExpirtyDate: formatDate(profile.passportExpiry),
                dateOfBirth: formatDate(profile.dateOfBirth),
                emailId: profile.email,
                nationalityCode: "EGY",
                ipAddress: config.ipAddress,
                isAutoRefresh: true
            }]
        };

        return fetch("https://lift-api.vfsglobal.com/appointment/applicants", {
            method: "POST",
            headers: {
                "accept": "application/json",
                "content-type": "application/json",
                "authorize": capturedData.authorize,
                "clientsource": capturedData.clientsource,
                "route": config.route
            },
            body: JSON.stringify(payload)
        })
        .then(r => r.json())
        .then(d => {
            const urn = d.urn || (d.data && d.data.urn) || (d.applicantList && d.applicantList[0] && d.applicantList[0].urn);
            if (urn) {
                log(`✅ URN: ${urn}`);
                return { success: true, urn };
            }
            throw new Error("No URN");
        });
    }

    function getCalendar(urn, email, visaCategory) {
        const config = getCountryConfig();
        log("📅 Getting calendar...");

        return fetch("https://lift-api.vfsglobal.com/appointment/calendar", {
            method: "POST",
            headers: {
                "content-type": "application/json",
                "authorize": capturedData.authorize,
                "clientsource": capturedData.clientsource,
                "route": config.route
            },
            body: JSON.stringify({
                countryCode: "egy",
                missionCode: config.missionCode,
                centerCode: config.centerCode,
                loginUser: email,
                fromDate: "20/11/2025",
                urn: urn,
                visaCategoryCode: visaCategory
            })
        })
        .then(r => r.json())
        .then(d => {
            const dates = d.calendars.filter(c => !c.isWeekend).map(c => c.date).sort();
            if (dates.length) {
                log(`✅ Found ${dates.length} dates`);
                return { dates, visaCategory };
            }
            throw new Error("NO_DATES");
        });
    }

    function getSlot(urn, date, email, visaCategory) {
        const config = getCountryConfig();
        log(`⏰ Getting slots for ${date}...`);

        return fetch("https://lift-api.vfsglobal.com/appointment/timeslot", {
            method: "POST",
            headers: {
                "content-type": "application/json",
                "authorize": capturedData.authorize,
                "clientsource": capturedData.clientsource,
                "route": config.route
            },
            body: JSON.stringify({
                countryCode: "egy",
                missionCode: config.missionCode,
                centerCode: config.centerCode,
                loginUser: email,
                slotDate: date,
                urn: urn,
                visaCategoryCode: visaCategory
            })
        })
        .then(r => r.json())
        .then(d => {
            if (d.slots && d.slots.length > 0) {
                const slot = d.slots[0];
                log(`✅ Slot: ${slot.slot}`);
                return { slot, id: slot.allocationId, date };
            }
            throw new Error("NO_SLOTS");
        });
    }

    function schedule(urn, allocId, email) {
        const config = getCountryConfig();
        log("📅 Scheduling...");

        return fetch("https://lift-api.vfsglobal.com/appointment/schedule", {
            method: "POST",
            headers: {
                "content-type": "application/json",
                "authorize": capturedData.authorize,
                "clientsource": capturedData.clientsource,
                "route": config.route
            },
            body: JSON.stringify({
                missionCode: config.missionCode,
                countryCode: "egy",
                centerCode: config.centerCode,
                loginUser: email,
                urn: urn,
                paymentdetails: {
                    paymentmode: "Online",
                    amount: config.fees,
                    currency: "EGP"
                },
                allocationId: allocId,
                CanVFSReachoutToApplicant: true,
                TnCConsentAndAcceptance: true
            })
        })
        .then(r => r.json())
        .then(d => {
            log(`🎉 BOOKING SUCCESS!`);
            if (d.URL) {
                window.location.href = d.URL;
            }
        });
    }

    // Main booking
    function startBooking() {
        if (!profileSelect.value) {
            log("❌ Select a profile first");
            return;
        }
        if (!capturedData.authorize || !capturedData.clientsource) {
            log("❌ Tokens missing");
            return;
        }

        mainStatus.textContent = "🔄 Running...";
        log(`🚀 Starting booking...`);

        const profile = {
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            email: document.getElementById('email').value,
            contactNumber: document.getElementById('contactNumber').value,
            passportNumber: document.getElementById('passportNumber').value,
            dateOfBirth: document.getElementById('dateOfBirth').value,
            passportExpiry: document.getElementById('passportExpiry').value,
            gender: document.getElementById('gender').value,
            visaCategory: document.getElementById('visaCategory').value
        };

        let urn, allocId;

        sendApplicant(profile)
        .then(r => {
            urn = r.urn;
            return getCalendar(urn, profile.email, profile.visaCategory);
        })
        .then(cal => {
            const date = cal.dates[0];
            return getSlot(urn, date, profile.email, cal.visaCategory);
        })
        .then(slot => {
            allocId = slot.id;
            return schedule(urn, allocId, profile.email);
        })
        .then(() => {
            mainStatus.textContent = "✅ Complete!";
        })
        .catch(err => {
            mainStatus.textContent = "❌ Error";
            log(`❌ ${err.message}`);
        });
    }

    // Event listeners
    document.getElementById('minimizeBtn').onclick = () => {
        panel.style.display = 'none';
    };

    countrySelect.addEventListener('change', function() {
        Storage.set("selectedCountry", this.value);
        updateCountryInfo();
    });

    profileSelect.onchange = loadProfile;
    document.getElementById('saveProfile').onclick = saveProfile;
    document.getElementById('startBtn').onclick = startBooking;
    document.getElementById('clearBtn').onclick = () => {
        Storage.set('profiles', '{}');
        loadProfiles();
        logArea.innerHTML = '';
        log("🗑️ Data cleared");
    };

    // Init
    updateUI();
    loadProfiles();
    updateCountryInfo();
    log("✅ VFS Bot loaded!");

})();

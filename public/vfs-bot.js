// Execute immediately without IIFE wrapper
console.log('🚀 VFS Bot Starting...');

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
            box-shadow: 0 2px 8px rgba(0,0,0,0.2) !important;
        }
        #vfs-toggle:hover { background: #2980b9 !important; }
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
        .btn-primary:hover { background: #229954; }
        .btn-secondary { background: #3498db; color: white; }
        .btn-secondary:hover { background: #2980b9; }
        .btn-danger { background: #e74c3c; color: white; }
        .btn-danger:hover { background: #c0392b; }
        .vfs-status {
            padding: 8px;
            background: #34495e;
            border-radius: 4px;
            margin: 10px 0;
            font-size: 11px;
        }
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
        .vfs-section {
            margin: 15px 0;
            padding-bottom: 10px;
            border-bottom: 1px solid #34495e;
        }
        .vfs-title {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #3498db;
        }
        select.vfs-input {
            cursor: pointer;
        }
    `;
const styleEl = document.createElement('style');
styleEl.textContent = styles;
document.head.appendChild(styleEl);

console.log('✅ Styles injected');

    // Toggle button
    const toggleBtn = document.createElement("button");
    toggleBtn.id = "vfs-toggle";
    toggleBtn.innerHTML = 'ARABY';
    document.body.appendChild(toggleBtn);

    // Main panel
    const panel = document.createElement("div");
    panel.id = "vfs-panel";
    panel.style.display = "none";
    panel.innerHTML = `
        <div class="vfs-title">ARABY MULTI-COUNTRY<button id="minimizeBtn" style="float: right; background: #e74c3c; border: none; color: white; padding: 2px 8px; border-radius: 3px; cursor: pointer; font-size: 10px;">➖ MIN</button></div>

        <div class="vfs-section">
            <div class="vfs-title" style="font-size: 12px;">🌍 Select Country</div>
            <select id="countrySelect" class="vfs-input">
                <option value="NLD">🇳🇱 Netherlands</option>
                <option value="PRT">🇵🇹 Portugal</option>
            </select>
            <div id="countryInfo" style="padding: 8px; background: #34495e; border-radius: 4px; margin-top: 8px; font-size: 11px;">
                <div>📍 Center: <span id="centerInfo">-</span></div>
                <div>💰 Fees: <span id="feesInfo">-</span> EGP</div>
            </div>
        </div>

        <div class="vfs-section">
            <select id="profileSelect" class="vfs-input">
                <option value="">-- Select Profile --</option>
            </select>
            <input type="text" id="profileName" class="vfs-input" placeholder="Profile Name">
            <input type="text" id="firstName" class="vfs-input" placeholder="First Name">
            <input type="text" id="lastName" class="vfs-input" placeholder="Last Name">
            <input type="email" id="email" class="vfs-input" placeholder="Email">
            <input type="text" id="contactNumber" class="vfs-input" placeholder="Phone (without 0)">
            <input type="text" id="passportNumber" class="vfs-input" placeholder="Passport Number">
            <input type="date" id="dateOfBirth" class="vfs-input" placeholder="Date of Birth">
            <input type="date" id="passportExpiry" class="vfs-input" placeholder="Passport Expiry">
            <select id="gender" class="vfs-input">
                <option value="">Gender</option>
                <option value="0">Male</option>
                <option value="1">Female</option>
            </select>
            <select id="visaCategory" class="vfs-input">
                <!-- Populated dynamically -->
            </select>
            <button id="saveProfile" class="vfs-btn btn-secondary">💾 Save Profile</button>
        </div>

        <div class="vfs-section">
            <div class="vfs-title" style="font-size: 12px;">📅 Booking Preferences</div>
            <select id="dateStrategy" class="vfs-input">
                <option value="first">📅 First Available Date</option>
                <option value="middle">📅 Middle Date</option>
                <option value="latest">📅 Latest Date</option>
                <option value="random">🎲 Random Date</option>
            </select>
            <select id="slotStrategy" class="vfs-input">
                <option value="first">⏰ First Available Slot</option>
                <option value="middle">⏰ Middle Slot</option>
                <option value="latest">⏰ Latest Slot</option>
                <option value="random">🎲 Random Slot</option>
            </select>
        </div>

        <div class="vfs-status">
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
    const minimizeBtn = document.getElementById('minimizeBtn');
    const logArea = document.getElementById("logArea");
    const authStatus = document.getElementById("authStatus");
    const clientStatus = document.getElementById("clientStatus");
    const mainStatus = document.getElementById("mainStatus");
    const profileSelect = document.getElementById("profileSelect");
    const visaCategorySelect = document.getElementById("visaCategory");
    const dateStrategySelect = document.getElementById("dateStrategy");
    const slotStrategySelect = document.getElementById("slotStrategy");
    const countrySelect = document.getElementById("countrySelect");
    const centerInfo = document.getElementById("centerInfo");
    const feesInfo = document.getElementById("feesInfo");

    dateStrategySelect.value = Storage.get("dateStrategy", "first");
slotStrategySelect.value = Storage.get("slotStrategy", "first");
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

        const savedCategory = Storage.get(`visaCategory_${countrySelect.value}`, country.categories[0].code);
        visaCategorySelect.value = savedCategory;

        log(`🌍 Country: ${country.name} | Center: ${country.centerCode} | Fees: ${country.fees} EGP`);
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

    // Payment capture
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        const url = args[0];
        if (typeof url === 'string') {
            if (url.includes('payfort.com') || url.includes('payment') || url.includes('checkout')) {
                log(`💳 Payment URL detected: ${url}`);
                Storage.set('lastPaymentUrl', url);
                try {
                    const urlObj = new URL(url);
                    const params = {};
                    urlObj.searchParams.forEach((value, key) => {
                        params[key] = value;
                    });
                    if (Object.keys(params).length > 0) {
                        log(`💳 Payment params: ${JSON.stringify(params)}`);
                        Storage.set('lastPaymentParams', JSON.stringify(params));
                    }
                } catch (e) {
                    log(`⚠️ Could not parse payment URL: ${e.message}`);
                }
            }
        }
        return originalFetch.apply(this, args);
    };

    let lastHref = window.location.href;
    setInterval(() => {
        if (window.location.href !== lastHref) {
            const newUrl = window.location.href;
            if (newUrl.includes('payfort') || newUrl.includes('payment') || newUrl.includes('checkout')) {
                log(`💳 Navigation to payment: ${newUrl}`);
                Storage.set('lastPaymentRedirect', newUrl);
            }
            lastHref = newUrl;
        }
    }, 500);

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
        profileSelect.value = name;
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
            feeEntryTypeCode: null,
            feeExemptionTypeCode: null,
            feeExemptionDetailsCode: null,
            applicantList: [{
                urn: "",
                arn: "",
                loginUser: profile.email,
                firstName: profile.firstName.toUpperCase(),
                employerFirstName: "",
                middleName: "",
                lastName: profile.lastName.toUpperCase(),
                employerLastName: "",
                salutation: "",
                gender: parseInt(profile.gender) || 1,
                nationalId: null,
                VisaToken: null,
                employerContactNumber: "",
                contactNumber: contact,
                dialCode: "02",
                employerDialCode: "",
                passportNumber: profile.passportNumber.toUpperCase(),
                confirmPassportNumber: null,
                passportExpirtyDate: formatDate(profile.passportExpiry),
                dateOfBirth: formatDate(profile.dateOfBirth),
                emailId: profile.email,
                employerEmailId: "",
                nationalityCode: "EGY",
                state: null,
                city: null,
                isEndorsedChild: false,
                applicantType: 0,
                addressline1: null,
                addressline2: null,
                pincode: null,
                referenceNumber: null,
                vlnNumber: null,
                applicantGroupId: 0,
                parentPassportNumber: "",
                parentPassportExpiry: "",
                dateOfDeparture: null,
                entryType: "",
                eoiVisaType: "",
                passportType: "",
                vfsReferenceNumber: "",
                familyReunificationCerificateNumber: "",
                PVRequestRefNumber: "",
                PVStatus: "",
                PVStatusDescription: "",
                PVCanAllowRetry: true,
                PVisVerified: false,
                eefRegistrationNumber: "",
                helloVerifyNumber: "",
                OfflineCClink: "",
                idenfystatuscheck: false,
                vafStatus: null,
                SpecialAssistance: "",
                AdditionalRefNo: null,
                juridictionCode: "",
                canInitiateVAF: false,
                canEditVAF: false,
                canDeleteVAF: false,
                canDownloadVAF: false,
                Retryleft: "",
                ipAddress: config.ipAddress,
                isAutoRefresh: true
            }],
            languageCode: "en-US",
            isWaitlist: false,
            juridictionCode: null,
            regionCode: null
        };

        return fetch("https://lift-api.vfsglobal.com/appointment/applicants", {
            method: "POST",
            headers: {
                "accept": "application/json, text/plain, */*",
                "content-type": "application/json;charset=UTF-8",
                "authorize": capturedData.authorize,
                "clientsource": capturedData.clientsource,
                "origin": "https://visa.vfsglobal.com",
                "referer": "https://visa.vfsglobal.com/",
                "route": config.route,
                "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            },
            credentials: "include",
            body: JSON.stringify(payload)
        })
        .then(r => {
            log(`📥 Response status: ${r.status}`);
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            return r.json();
        })
        .then(d => {
            const urn = d.urn || (d.data && d.data.urn) || (d.applicantList && d.applicantList[0] && d.applicantList[0].urn);
            if (urn) {
                log(`✅ URN: ${urn}`);
                return { success: true, urn };
            }
            throw new Error("No URN in response");
        });
    }

    function checkFees(urn, email) {
        const config = getCountryConfig();
        log("💰 Checking fees...");
        return fetch("https://lift-api.vfsglobal.com/appointment/fees", {
            method: "POST",
            headers: {
                "accept": "application/json, text/plain, */*",
                "content-type": "application/json;charset=UTF-8",
                "authorize": capturedData.authorize,
                "clientsource": capturedData.clientsource,
                "route": config.route
            },
            credentials: "include",
            body: JSON.stringify({
                missionCode: config.missionCode,
                countryCode: "egy",
                centerCode: config.centerCode,
                loginUser: email,
                urn: urn,
                languageCode: "en-US"
            })
        }).then(r => r.json()).then(() => log("✅ Fees OK"));
    }

    function getCalendar(urn, email, visaCategory) {
        const config = getCountryConfig();
        log("📅 Getting calendar...");

        return fetch("https://lift-api.vfsglobal.com/appointment/calendar", {
            method: "POST",
            headers: {
                "accept": "application/json, text/plain, */*",
                "content-type": "application/json;charset=UTF-8",
                "authorize": capturedData.authorize,
                "clientsource": capturedData.clientsource,
                "route": config.route
            },
            credentials: "include",
            body: JSON.stringify({
                countryCode: "egy",
                missionCode: config.missionCode,
                centerCode: config.centerCode,
                loginUser: email,
                fromDate: "20/11/2025",
                payCode: "",
                urn: urn,
                visaCategoryCode: visaCategory
            })
        })
        .then(r => r.json())
        .then(d => {
            const dates = d.calendars
                .filter(c => !c.isWeekend)
                .map(c => {
                    const dateStr = c.date;
                    const parts = dateStr.split('/');
                    if (parts.length !== 3) return dateStr;
                    const [first, second, third] = parts;
                    if (parseInt(first) > 12) return dateStr;
                    if (parseInt(second) > 12) return `${second}/${first}/${third}`;
                    return `${second}/${first}/${third}`;
                })
                .sort();

            if (dates.length) {
                log(`✅ Found ${dates.length} available dates`);
                return { dates, visaCategory };
            }
            throw new Error("NO_DATES_FOUND");
        });
    }

    function getSlot(urn, date, email, visaCategory, slotStrategy) {
        const config = getCountryConfig();
        log(`⏰ Getting slots for ${date}...`);

        return fetch("https://lift-api.vfsglobal.com/appointment/timeslot", {
            method: "POST",
            headers: {
                "accept": "application/json, text/plain, */*",
                "content-type": "application/json;charset=UTF-8",
                "authorize": capturedData.authorize,
                "clientsource": capturedData.clientsource,
                "route": config.route
            },
            credentials: "include",
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
        .then(r => {
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            return r.json();
        })
        .then(d => {
            if (!d || !d.slots || d.slots.length === 0) {
                throw new Error("NO_SLOTS_FOUND");
            }
            const selectedSlot = selectSlot(d.slots, slotStrategy);
            log(`✅ Selected slot: ${selectedSlot.slot}`);
            return { slot: selectedSlot, id: selectedSlot.allocationId, date };
        });
    }

    function mapVas(urn, email) {
        const config = getCountryConfig();
        log("🔧 Mapping VAS...");
        return fetch("https://lift-api.vfsglobal.com/vas/mapvas", {
            method: "POST",
            headers: {
                "accept": "application/json, text/plain, */*",
                "content-type": "application/json;charset=UTF-8",
                "authorize": capturedData.authorize,
                "clientsource": capturedData.clientsource,
                "route": config.route
            },
            credentials: "include",
            body: JSON.stringify({
                loginuser: email,
                missioncode: config.missionCode,
                countrycode: "egy",
                urn: urn,
                applicants: []
            })
        }).then(r => r.json()).then(() => log("✅ VAS OK"));
    }

    function schedule(urn, allocId, email) {
        const config = getCountryConfig();
        log("📅 Scheduling appointment...");

        return fetch("https://lift-api.vfsglobal.com/appointment/schedule", {
            method: "POST",
            headers: {
                "accept": "application/json, text/plain, */*",
                "content-type": "application/json;charset=UTF-8",
                "authorize": capturedData.authorize,
                "clientsource": capturedData.clientsource,
                "route": config.route
            },
            credentials: "include",
            body: JSON.stringify({
                missionCode: config.missionCode,
                countryCode: "egy",
                centerCode: config.centerCode,
                loginUser: email,
                urn: urn,
                aurn: null,
                notificationType: "none",
                paymentdetails: {
                    paymentmode: "Online",
                    RequestRefNo: "",
                    clientId: "",
                    merchantId: "",
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
            log(`📥 Schedule response received`);
            Storage.set('lastPaymentUrl', d.URL || 'None');
            Storage.set('lastPaymentPayload', d.payLoad || 'None');

            if (d.URL && d.payLoad) {
                const paymentUrl = d.URL.includes("payLoad") ? d.URL : d.URL + "?payLoad=" + encodeURIComponent(d.payLoad);
                log(`🚀 Redirecting to payment...`);
                window.location.href = paymentUrl;
            } else if (d.URL) {
                window.location.href = d.URL;
            } else {
                const paymentUrl = `https://payments.vfsglobal.eg/PG-Component/Payment/PayRequest`;
                log(`🚀 Redirecting to Egypt payment...`);
                window.location.href = paymentUrl;
            }
        });
    }

    // Date selection
    function selectDate(dates, strategy) {
        if (dates.length === 0) throw new Error("NO_DATES_FOUND");

        switch(strategy) {
            case "first":
                log(`📅 Selected FIRST date: ${dates[0]}`);
                return dates[0];
            case "middle":
                const midIndex = Math.floor(dates.length / 2);
                log(`📅 Selected MIDDLE date: ${dates[midIndex]}`);
                return dates[midIndex];
            case "latest":
                log(`📅 Selected LATEST date: ${dates[dates.length - 1]}`);
                return dates[dates.length - 1];
            case "random":
            default:
                const randomDate = dates[Math.floor(Math.random() * dates.length)];
                log(`🎲 Selected RANDOM date: ${randomDate}`);
                return randomDate;
        }
    }

    // Slot selection
    function selectSlot(slots, strategy) {
        if (slots.length === 0) throw new Error("NO_SLOTS_FOUND");

        switch(strategy) {
            case "first":
                return slots[0];
            case "middle":
                return slots[Math.floor(slots.length / 2)];
            case "latest":
                return slots[slots.length - 1];
            case "random":
            default:
                return slots[Math.floor(Math.random() * slots.length)];
        }
    }

    // Main booking with retry
    function startBooking() {
        if (!profileSelect.value) {
            log("❌ Select a profile first");
            return;
        }
        if (!capturedData.authorize || !capturedData.clientsource) {
            log("❌ Tokens missing - browse site first");
            return;
        }

        const config = getCountryConfig();
        mainStatus.textContent = "🔄 Running...";
        log(`🚀 Starting booking for ${config.name}...`);

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

        const dateStrategy = dateStrategySelect.value;
        const slotStrategy = slotStrategySelect.value;

        let urn, allocId;

        // Step 1: Create applicant and get URN
        sendApplicant(profile)
        .then(r => {
            urn = r.urn;
            return checkFees(urn, profile.email);
        })
        .then(() => {
            // Step 2: Start retry loop
            return attemptBooking();
        })
        .then(() => {
            mainStatus.textContent = "✅ Complete!";
            log("🎉 BOOKING COMPLETE!");
        })
        .catch(err => {
            mainStatus.textContent = "❌ Stopped";
            if (err.message === "NO_DATES_FOUND") {
                log("❌ NO DATES AVAILABLE - Stopped");
            } else {
                log(`❌ Error: ${err.message}`);
            }
        });

        // Retry function - loops until dates run out
        function attemptBooking() {
            return getCalendar(urn, profile.email, profile.visaCategory)
            .then(cal => {
                const selectedDate = selectDate(cal.dates, dateStrategy);
                return getSlot(urn, selectedDate, profile.email, cal.visaCategory, slotStrategy);
            })
            .then(slot => {
                allocId = slot.id;
                return mapVas(urn, profile.email);
            })
            .then(() => checkFees(urn, profile.email))
            .then(() => schedule(urn, allocId, profile.email))
            .catch(err => {
                // If schedule fails (slot taken), retry with new date
                if (err.message.includes("NO_SLOTS") || err.message.includes("slot")) {
                    log("⚠️ Slot taken - Retrying with new date...");
                    return attemptBooking(); // Recursive retry
                }
                // If no dates found, stop
                if (err.message === "NO_DATES_FOUND") {
                    throw new Error("NO_DATES_FOUND");
                }
                // Other errors - retry
                log(`⚠️ ${err.message} - Retrying...`);
                return attemptBooking();
            });
        }
    }

    // Event listeners
    minimizeBtn.onclick = () => {
        panel.style.display = 'none';
    };

    toggleBtn.onclick = () => {
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    };

    countrySelect.addEventListener('change', function() {
        Storage.set("selectedCountry", this.value);
        updateCountryInfo();
    });

    visaCategorySelect.addEventListener('change', function() {
        Storage.set(`visaCategory_${countrySelect.value}`, this.value);
        log(`✅ Visa category set to: ${this.value}`);
    });

    dateStrategySelect.addEventListener('change', function() {
        Storage.set("dateStrategy", this.value);
        log(`✅ Date strategy set to: ${this.value}`);
    });

    slotStrategySelect.addEventListener('change', function() {
        Storage.set("slotStrategy", this.value);
        log(`✅ Slot strategy set to: ${this.value}`);
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
log("✅ VFS Multi-Country Bot loaded!");
    log("🇳🇱 Netherlands & 🇵🇹 Portugal ready!");
    log("💡 Auto-retry enabled - will loop until dates run out!");

console.log('✅ VFS Bot fully initialized!');

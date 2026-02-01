const API_BASE = 'https://trustbit-backend.onrender.com';

document.addEventListener("DOMContentLoaded", () => {
    console.log("TrustBit Active");

    // --- SIGNUP ---
    const signupBtn = document.getElementById('signupBtn');
    if (signupBtn) {
        signupBtn.onclick = async () => {
            const email = document.getElementById('signupEmail').value;
            const password = document.getElementById('signupPass').value;

            if (!email || !password) return alert("Please fill all fields");

            try {
                const response = await fetch(`${API_BASE}/api/signup`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (response.ok) {
                    alert("Account created! Please login.");
                    window.location.href = "index.html";
                } else {
                    alert(data.error || "Signup failed");
                }
            } catch (err) {
                alert("Server is offline. Try again in 1 minute.");
            }
        };
    }

    // --- LOGIN (Fixed to check Backend) ---
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.onclick = async () => {
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPass').value;

            try {
                const response = await fetch(`${API_BASE}/api/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (response.ok) {
                    // Save user data from DB to local storage for the dashboard
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
                    alert(data.error || "Invalid Credentials");
                }
            } catch (err) {
                alert("Connection error. Is the backend running?");
            }
        };
    }

    // --- LOGOUT ---
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.onclick = () => {
            localStorage.clear();
            window.location.href = "index.html";
        };
    }

    // --- DASHBOARD CHECK ---
    if (window.location.pathname.includes("dashboard.html")) {
        if (localStorage.getItem('isLoggedIn') !== 'true') {
            window.location.href = "index.html";
        } else {
            loadDashboard();
        }
    }
});

// Keep your existing loadDashboard, makePayment, confirmOTP, and quickDeposit functions below...
// (Paste them exactly as they were in your previous code)

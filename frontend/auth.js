const TOKEN_KEY = "owner_token";


// ===============================
// Login
// ===============================

async function loginOwner(businessId, password) {
    const res = await fetch(
        `${API_URL}/businesses/${businessId}/login`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                password
            })
        }
    );

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.error || "Login failed.");
    }

    localStorage.setItem(TOKEN_KEY, data.token);

    return data;
}


// ===============================
// Logout
// ===============================

async function logoutOwner() {

    const token = getToken();

    if (!token) {

        localStorage.removeItem(
            TOKEN_KEY
        );

        return;

    }

    try {

        await fetch(`${API_URL}/auth/logout`, {

            method: "POST",

            headers: {

                Authorization:
                    `Bearer ${token}`

            }

        });

    }
    catch {

        // Ignore network errors.
    }

    localStorage.removeItem(
        TOKEN_KEY
    );

}


// ===============================
// Helpers
// ===============================

function getToken() {

    return localStorage.getItem(
        TOKEN_KEY
    );

}


function isLoggedIn() {

    return !!getToken();

}


function authHeaders() {

    const token = getToken();

    return token
        ? {
            Authorization:
                `Bearer ${token}`
        }
        : {};

}


// ===============================
// Validate Existing Session
// ===============================

async function validateSession() {

    const token = getToken();

    if (!token)
        return false;

    try {

        const res = await fetch(
            `${API_URL}/auth/me`,
            {
                headers: authHeaders()
            }
        );

        if (!res.ok) {

            localStorage.removeItem(
                TOKEN_KEY
            );

            return false;

        }

        return true;

    }
    catch {

        return false;

    }

}
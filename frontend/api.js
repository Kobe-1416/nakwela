// ===============================
// Generic Request
// ===============================

async function api(path, options = {}) {

    const headers = {
        ...(options.headers || {})
    };

    if (!(options.body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
    }

    Object.assign(headers, authHeaders());

    const res = await fetch(
        API_URL + path,
        {
            ...options,
            headers
        }
    );

    // Some endpoints (e.g. logout-style 204s) may return no body.
    const data = await res
        .json()
        .catch(() => ({}));

    if (!res.ok) {
        throw new Error(
            data.error || "Request failed."
        );
    }

    return data;

}


// ===============================
// Businesses
// ===============================

function getBusinesses() {

    return api("/businesses");

}

function getBusinessById(id) {

    return api(`/businesses/${id}`);

}

function registerBusiness(business) {

    return api("/businesses", {

        method: "POST",

        body: JSON.stringify(business)

    });

}


// ===============================
// Bookings
// ===============================

function getBookings(
    businessId,
    dayKey
) {

    return api(
        `/businesses/${businessId}/slots?day=${dayKey}`
    );

}

function createBooking(data) {

    return api(`/businesses/${data.businessId}/bookings`, {

        method: "POST",

        body: JSON.stringify({

            dayKey: data.dayKey,

            slotStart: data.slotStart,

            slotEnd: data.slotEnd,

            reminderMins: data.reminderMins

        })

    });

}

function updateSlot(data) {

    return api(
        `/businesses/${data.businessId}/slots/${data.slotStart}`,
        {

            method: "PATCH",

            body: JSON.stringify({

                dayKey: data.dayKey,

                slotEnd: data.slotEnd,

                action: data.action

            })

        }
    );

}


// ===============================
// Push — Raw Save Calls
// ===============================

function getPublicKey() {

    return api("/push/public-key");

}

function saveCustomerSubscription(
    bookingCode,
    subscription
) {

    return api("/push/customer", {

        method: "POST",

        body: JSON.stringify({

            bookingCode,

            subscription

        })

    });

}

function saveOwnerSubscription(
    businessId,
    subscription
) {

    return api("/push/owner", {

        method: "POST",

        body: JSON.stringify({

            businessId,

            subscription

        })

    });

}


// ===============================
// Push — Subscription Helpers
// ===============================
// These are what business.js actually calls
// (enableNotifications / registerOwnerPush).
// They handle the full browser subscribe flow
// and then persist the result via the save*
// functions above.

function urlBase64ToUint8Array(base64String) {

    const padding =
        "=".repeat(
            (4 - (base64String.length % 4)) % 4
        );

    const base64 =
        (base64String + padding)
            .replace(/-/g, "+")
            .replace(/_/g, "/");

    const rawData = atob(base64);

    const outputArray =
        new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; i++) {
        outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;

}

async function getOrCreatePushSubscription() {

    const registration =
        await navigator.serviceWorker.ready;

    let subscription =
        await registration.pushManager.getSubscription();

    if (!subscription) {

        const { publicKey } =
            await getPublicKey();

        subscription =
            await registration.pushManager.subscribe({

                userVisibleOnly: true,

                applicationServerKey:
                    urlBase64ToUint8Array(publicKey)

            });

    }

    return subscription;

}

async function subscribeCustomerPush(bookingCode) {

    const subscription =
        await getOrCreatePushSubscription();

    return saveCustomerSubscription(
        bookingCode,
        subscription
    );

}

async function subscribeOwnerPush(businessId) {

    const subscription =
        await getOrCreatePushSubscription();

    return saveOwnerSubscription(
        businessId,
        subscription
    );

}
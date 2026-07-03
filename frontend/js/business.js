// ===============================
// Business Page
// ===============================

const businessId = qs("id");

let business = null;

let bookings = {};

let slots = [];

let role = "customer";

let currentDay = "today";

let selectedSlot = null;

let selectedReminder = 20;

let ownerActiveSlot = null;

let ownerChoice = null;


// ===============================
// Initialisation
// ===============================

document.addEventListener("DOMContentLoaded", init);

async function init() {

    if (!businessId) {

        showToast("Business not found.");

        return;

    }

    // Bind handlers first — these don't depend on
    // business/booking data, so a failed fetch below
    // must not prevent the UI from being interactive.
    bindEvents();

    try {

        business = await getBusinessById(
            businessId
        );

        document.getElementById("bizName").textContent =
            business.name;

        document.getElementById("bizMeta").textContent =
            `${business.category} · ${business.area}`;

        document.getElementById("hoursText").textContent =
            `${business.openTime} – ${business.closeTime}`;

        slots = buildSlots(
            business.openTime,
            business.closeTime
        );

        updateHoursBubble();

        await loadBookings();

        if (await isLoggedIn()) {

            role = "owner";

        }

        updateRoleUI();

    }
    catch (err) {

        console.error(err);

        showToast(
            "Unable to load business."
        );

    }

}


// ===============================
// API
// ===============================

async function loadBookings() {

    bookings =
        await getBookings(
            business.id,
            currentDay
        );

    renderSlots();

}


// ===============================
// Hours Bubble
// ===============================

function updateHoursBubble() {

    const bubble =
        document.getElementById("hoursBubble");

    const open =
        isBusinessOpenNow(business);

    bubble.classList.toggle(
        "is-open",
        open
    );

    bubble.classList.toggle(
        "is-closed",
        !open
    );

}


// ===============================
// Role
// ===============================

function updateRoleUI() {

    document.getElementById("rolePill").textContent =
        role === "owner"
            ? "Owner view"
            : "Customer view";

    document.getElementById("ownerHint").style.display =
        role === "owner"
            ? "flex"
            : "none";

    document.getElementById("customerNotice").style.display =
        role === "owner"
            ? "none"
            : "flex";

    document.getElementById("bottomBar").style.display =
        role === "customer"
            ? "flex"
            : "none";

    document.getElementById("reminderBlock").style.display =
        "none";

    document.getElementById("summaryCard").style.display =
        "none";

    selectedSlot = null;

    renderLegend();

    renderSlots();

}


async function toggleRole() {

    if (role === "customer") {

        const password =
            prompt(
                "Enter your owner password"
            );

        if (!password)
            return;

        try {

            await loginOwner(
                business.id,
                password
            );

            role = "owner";

            registerOwnerPush();

        }
        catch {

            showToast(
                "Incorrect password."
            );

            return;

        }

    }
    else {

        await logoutOwner();

        role = "customer";

    }

    updateRoleUI();

}


// ===============================
// Day Tabs
// ===============================

async function selectDay(day) {

    currentDay = day;

    document
        .getElementById("tabToday")
        .classList.toggle(
            "active",
            day === "today"
        );

    document
        .getElementById("tabTomorrow")
        .classList.toggle(
            "active",
            day === "tomorrow"
        );

    selectedSlot = null;

    document.getElementById(
        "reminderBlock"
    ).style.display = "none";

    document.getElementById(
        "summaryCard"
    ).style.display = "none";

    updatePrimaryButton();

    try {

        await loadBookings();

    }
    catch (err) {

        console.error(err);

        showToast(
            "Unable to load bookings for this day."
        );

    }

}


// ===============================
// Helpers
// ===============================

function getNowMinsIfToday() {

    if (currentDay !== "today")
        return -1;

    const now = new Date();

    return (
        now.getHours() * 60 +
        now.getMinutes()
    );

}


// ===============================
// Event Binding
// ===============================

function bindEvents() {

    // Close overlay when clicking its backdrop.
    document
        .querySelectorAll(".overlay")
        .forEach(overlay => {

            overlay.addEventListener(
                "click",
                e => {

                    if (e.target === overlay)
                        closeOverlay(
                            overlay.id
                        );

                }
            );

        });

    // Topbar
    document
        .getElementById("backBtn")
        .addEventListener("click", () => {

            window.location.href =
                "index.html";

        });

    document
        .getElementById("rolePill")
        .addEventListener(
            "click",
            toggleRole
        );

    // Day tabs
    document
        .getElementById("tabToday")
        .addEventListener(
            "click",
            () => selectDay("today")
        );

    document
        .getElementById("tabTomorrow")
        .addEventListener(
            "click",
            () => selectDay("tomorrow")
        );

    // Reminder chips
    document
        .querySelectorAll(
            "#reminderChips .chip"
        )
        .forEach(chip => {

            chip.addEventListener(
                "click",
                () => selectReminder(
                    Number(chip.dataset.mins)
                )
            );

        });

    // Bottom bar
    document
        .getElementById("primaryBtn")
        .addEventListener(
            "click",
            handlePrimaryAction
        );

    // Confirmation sheet
    document
        .getElementById("confirmDoneBtn")
        .addEventListener(
            "click",
            () => closeOverlay("confirmOverlay")
        );

    // Notification permission sheet
    document
        .getElementById("notifDeclineBtn")
        .addEventListener(
            "click",
            () => respondNotif(false)
        );

    document
        .getElementById("notifAllowBtn")
        .addEventListener(
            "click",
            () => respondNotif(true)
        );

    // Owner sheet
    document
        .getElementById("blockToggle")
        .addEventListener(
            "click",
            () => toggleOwnerChoice("block")
        );

    document
        .getElementById("lateToggle")
        .addEventListener(
            "click",
            () => toggleOwnerChoice("late")
        );

    document
        .getElementById("ownerConfirmBtn")
        .addEventListener(
            "click",
            confirmOwnerAction
        );

    document
        .getElementById("ownerCloseBtn")
        .addEventListener(
            "click",
            () => closeOverlay("ownerOverlay")
        );

    document
        .getElementById("markLateBtn")
        .addEventListener(
            "click",
            markBookingLate
        );

    document
        .getElementById("unblockBtn")
        .addEventListener(
            "click",
            unblockSlot
        );

    // Slot grid — delegated, since slots
    // are re-rendered on every update.
    document
        .getElementById("slotGrid")
        .addEventListener(
            "click",
            e => {

                const slotEl =
                    e.target.closest(
                        "[data-start]"
                    );

                if (!slotEl)
                    return;

                onSlotClick(
                    slotEl.dataset.start,
                    slotEl.dataset.end
                );

            }
        );

}

// ===============================
// Render Slots
// ===============================

function renderSlots() {

    if (!business)
        return;

    const grid =
        document.getElementById("slotGrid");

    const nowMins =
        getNowMinsIfToday();

    grid.innerHTML = slots.map(slot => {

        const rec =
            bookings[slot.start];

        const [hour, minute] =
            slot.start
                .split(":")
                .map(Number);

        const slotMins =
            hour * 60 + minute;

        const isPast =
            nowMins >= 0 &&
            slotMins < nowMins;

        let classes = "slot ";

        let label = "";

        if (role === "customer") {

            if (rec?.status === "blocked") {

                classes += "blocked";
                label = "Unavailable";

            }
            else if (
                rec?.status === "booked"
            ) {

                classes += "taken";
                label = "Booked";

            }
            else if (
                rec?.status === "late"
            ) {

                classes += "taken";
                label = "Booked";

            }
            else if (isPast) {

                classes += "past";
                label = "Past";

            }
            else if (
                selectedSlot === slot.start
            ) {

                classes += "selected";
                label = "Selected";

            }
            else {

                classes += "available";
                label = "Open";

            }

        }
        else {

            if (rec?.status === "blocked") {

                classes +=
                    "blocked owner-marked";

                label = "Blocked";

            }
            else if (
                rec?.status === "booked"
            ) {

                classes +=
                    "owner-booked";

                label =
                    `Booked · ${rec.code}`;

            }
            else if (
                rec?.status === "late"
            ) {

                classes += "late";

                label =
                    `Late · ${rec.code}`;

            }
            else {

                classes +=
                    "owner-open";

                label =
                    isPast
                        ? "Past"
                        : "Open";

            }

        }

        const clickable =
            role === "owner"
                ? (
                    !isPast ||
                    rec?.status === "booked" ||
                    rec?.status === "late" ||
                    rec?.status === "blocked"
                )
                : (
                    !rec &&
                    !isPast
                );

        return `
            <div
                class="${classes}"
                ${clickable
                    ? `data-start="${slot.start}" data-end="${slot.end}"`
                    : ""}
            >

                <div class="slot-time">
                    ${slot.start}
                </div>

                <div class="slot-label">
                    ${label}
                </div>

            </div>
        `;

    }).join("");

    renderLegend();

}


// ===============================
// Legend
// ===============================

function renderLegend() {

    const legend =
        document.getElementById("legend");

    if (role === "customer") {

        legend.innerHTML = `

            <div class="legend-item">
                <span class="legend-swatch lg-open"></span>
                Open
            </div>

            <div class="legend-item">
                <span class="legend-swatch lg-selected"></span>
                Selected
            </div>

            <div class="legend-item">
                <span class="legend-swatch lg-taken"></span>
                Booked
            </div>

            <div class="legend-item">
                <span class="legend-swatch lg-blocked"></span>
                Unavailable
            </div>

        `;

    }
    else {

        legend.innerHTML = `

            <div class="legend-item">
                <span class="legend-swatch lg-open"></span>
                Open
            </div>

            <div class="legend-item">
                <span class="legend-swatch lg-booked"></span>
                Booked
            </div>

            <div class="legend-item">
                <span class="legend-swatch lg-late"></span>
                Marked late
            </div>

            <div class="legend-item">
                <span class="legend-swatch lg-blocked"></span>
                Blocked
            </div>

        `;

    }

}

// ===============================
// Customer Flow
// ===============================

function onSlotClick(start, end) {

    if (role === "owner") {

        openOwnerSheet(start, end);
        return;

    }

    selectedSlot =
        selectedSlot === start
            ? null
            : start;

    renderSlots();

    document.getElementById(
        "reminderBlock"
    ).style.display =
        selectedSlot
            ? "block"
            : "none";

    updateSummary();

    updatePrimaryButton();

}


function selectReminder(mins) {

    selectedReminder = mins;

    document
        .querySelectorAll("#reminderChips .chip")
        .forEach(chip => {

            chip.classList.toggle(
                "active",
                Number(chip.dataset.mins) === mins
            );

        });

    updateSummary();

}


function updateSummary() {

    const card =
        document.getElementById(
            "summaryCard"
        );

    if (!selectedSlot) {

        card.style.display = "none";
        return;

    }

    const slot =
        slots.find(
            s => s.start === selectedSlot
        );

    card.style.display = "block";

    card.innerHTML = `

        <div class="summary-row">
            <span>Day</span>
            <span>
                ${
                    currentDay === "today"
                        ? "Today"
                        : "Tomorrow"
                }
            </span>
        </div>

        <div class="summary-row">
            <span>Time</span>
            <span>${slot.start} – ${slot.end}</span>
        </div>

        <div class="summary-row">
            <span>Reminder</span>
            <span>${selectedReminder} min before</span>
        </div>

    `;

}


function updatePrimaryButton() {

    if (role !== "customer")
        return;

    const btn =
        document.getElementById(
            "primaryBtn"
        );

    if (selectedSlot) {

        btn.disabled = false;
        btn.textContent =
            "Confirm booking";

    }
    else {

        btn.disabled = true;
        btn.textContent =
            "Select a slot to continue";

    }

}


function handlePrimaryAction() {

    if (!selectedSlot)
        return;

    openOverlay("notifOverlay");

}


// ===============================
// Create Booking
// ===============================

async function respondNotif(allowed) {

    closeOverlay("notifOverlay");

    try {

        const slot =
            slots.find(
                s => s.start === selectedSlot
            );

        const booking =
            await createBooking({

                businessId: business.id,

                dayKey: currentDay,

                slotStart: slot.start,

                slotEnd: slot.end,

                reminderMins: selectedReminder

            });

        if (allowed) {

            await enableNotifications(
                booking.code
            );

        }

        document.getElementById(
            "bookingCode"
        ).textContent =
            booking.code;

        openOverlay(
            "confirmOverlay"
        );

        selectedSlot = null;

        document.getElementById(
            "reminderBlock"
        ).style.display = "none";

        document.getElementById(
            "summaryCard"
        ).style.display = "none";

        await loadBookings();

        updatePrimaryButton();

        showToast(

            allowed
                ? "Notifications enabled."
                : "Booking confirmed."

        );

    }
    catch (err) {

        console.error(err);

        showToast(

            err.message ||
            "Booking failed."

        );

    }

}
// ===============================
// Owner Flow
// ===============================

function openOwnerSheet(start, end) {

    ownerActiveSlot = {
        start,
        end
    };

    ownerChoice = null;

    const rec = bookings[start];

    document.getElementById(
        "ownerSheetTitle"
    ).textContent =
        `Manage ${start} – ${end}`;

    document.getElementById(
        "ownerOpenActions"
    ).style.display = "none";

    document.getElementById(
        "ownerBookedActions"
    ).style.display = "none";

    document.getElementById(
        "ownerBlockedActions"
    ).style.display = "none";


    if (!rec) {

        document.getElementById(
            "ownerSheetText"
        ).textContent =
            "This slot is currently open.";

        document.getElementById(
            "ownerOpenActions"
        ).style.display = "block";

        document.getElementById(
            "blockToggle"
        ).classList.add("active");

        document.getElementById(
            "ownerConfirmBtn"
        ).disabled = false;

        ownerChoice = "block";

    }

    else if (rec.status === "blocked") {

        document.getElementById(
            "ownerSheetText"
        ).textContent =
            "This slot is currently blocked.";

        document.getElementById(
            "ownerBlockedActions"
        ).style.display = "block";

    }

    else {

        document.getElementById(
            "ownerSheetText"
        ).textContent =
            rec.status === "late"
                ? "Customer has been marked late."
                : "A customer has booked this slot.";

        document.getElementById(
            "ownerBookedActions"
        ).style.display = "block";

        document.getElementById(
            "ownerBookingInfo"
        ).innerHTML = `

            <div class="summary-row">
                <span>Booking code</span>
                <span>${rec.code}</span>
            </div>

            <div class="summary-row">
                <span>Status</span>
                <span>${
                    rec.status === "late"
                        ? "Late"
                        : "Confirmed"
                }</span>
            </div>

        `;

        const lateBtn =
            document.getElementById(
                "markLateBtn"
            );

        if (rec.status === "late") {

            lateBtn.disabled = true;
            lateBtn.textContent =
                "Already marked late";

        } else {

            lateBtn.disabled = false;
            lateBtn.textContent =
                "Mark as late";

        }

    }

    openOverlay("ownerOverlay");

}

function toggleOwnerChoice(choice) {

    ownerChoice = choice;

    document.getElementById(
        "blockToggle"
    ).classList.toggle(
        "active",
        choice === "block"
    );

}

async function confirmOwnerAction() {

    if (!ownerActiveSlot)
        return;

    try {

        await updateSlot({

            businessId: business.id,

            dayKey: currentDay,

            slotStart: ownerActiveSlot.start,

            slotEnd: ownerActiveSlot.end,

            action: "block"

        });

        closeOverlay("ownerOverlay");

        await loadBookings();

        showToast(
            "Slot blocked."
        );

    }
    catch (err) {

        console.error(err);

        showToast(
            "Couldn't block slot."
        );

    }

}

async function unblockSlot() {

    try {

        await updateSlot({

            businessId: business.id,

            dayKey: currentDay,

            slotStart: ownerActiveSlot.start,

            slotEnd: ownerActiveSlot.end,

            action: "unblock"

        });

        closeOverlay(
            "ownerOverlay"
        );

        await loadBookings();

        showToast(
            "Slot reopened."
        );

    }
    catch (err) {

        console.error(err);

        showToast(
            "Couldn't reopen slot."
        );

    }

}

async function markBookingLate() {

    try {

        await updateSlot({

            businessId: business.id,

            dayKey: currentDay,

            slotStart: ownerActiveSlot.start,

            slotEnd: ownerActiveSlot.end,

            action: "late"

        });

        closeOverlay(
            "ownerOverlay"
        );

        await loadBookings();

        showToast(
            "Customer marked late."
        );

    }
    catch (err) {

        console.error(err);

        showToast(
            "Couldn't mark booking late."
        );

    }

}

// ===============================
// Overlay Helpers
// ===============================

function openOverlay(id) {

    document
        .getElementById(id)
        .classList.add("show");

}

function closeOverlay(id) {

    document
        .getElementById(id)
        .classList.remove("show");

}


// Escape closes any open overlay

document.addEventListener("keydown", e => {

    if (e.key !== "Escape")
        return;

    document
        .querySelectorAll(".overlay.show")
        .forEach(o => o.classList.remove("show"));

});

// ===============================
// Push Notifications
// ===============================

async function enableNotifications(bookingCode) {

    if (!("serviceWorker" in navigator))
        return;

    if (!("PushManager" in window))
        return;

    const permission =
        await Notification.requestPermission();

    if (permission !== "granted")
        return;

    try {

        await subscribeCustomerPush(
            bookingCode
        );

    }
    catch (err) {

        console.error(err);

    }

}


async function registerOwnerPush() {

    if (!("serviceWorker" in navigator))
        return;

    try {

        await subscribeOwnerPush(
            business.id
        );

    }
    catch (err) {

        console.error(err);

    }

}
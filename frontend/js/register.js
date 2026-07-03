const ICONS = [
    "🏪",
    "🛠️",
    "✂️",
    "🍽️",
    "🚐",
    "📦",
    "🧴",
    "🧰"
];

function randomIcon() {
    return ICONS[
        Math.floor(Math.random() * ICONS.length)
    ];
}

async function submitBusiness() {

    const name =
        document.getElementById("fName").value.trim();

    const category =
        document.getElementById("fCategory").value.trim();

    const area =
        document.getElementById("fArea").value.trim();

    const openTime =
        document.getElementById("fOpen").value;

    const closeTime =
        document.getElementById("fClose").value;

    const phone =
        document.getElementById("fPhone").value.trim();

    const password =
        document.getElementById("fPassword").value;

    if (
        !name ||
        !category ||
        !area ||
        !openTime ||
        !closeTime ||
        !phone ||
        !password
    ) {
        showToast("Please fill in every field.");
        return;
    }

    if (openTime >= closeTime) {
        showToast(
            "Closing time must be after opening time."
        );
        return;
    }

    try {

        const business =
            await registerBusiness({

                name,
                category,
                area,
                openTime,
                closeTime,
                phone,
                password,
                icon: randomIcon()

            });

        document
            .getElementById("successOverlay")
            .classList.add("show");

        document
            .getElementById("goToBizBtn")
            .onclick = () => {

                window.location.href =
                    `business.html?id=${business.id}`;

            };

    }
    catch (err) {

        console.error(err);

        showToast(
            err.message ||
            "Couldn't register business."
        );

    }

}

document
    .getElementById("submitBtn")
    .addEventListener("click", submitBusiness);

document
    .getElementById("backBtn")
    .addEventListener("click", () => {
        window.location.href = "index.html";
    });
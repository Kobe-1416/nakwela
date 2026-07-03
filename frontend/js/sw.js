self.addEventListener("push", event => {

    if (!event.data)
        return;

    const data = event.data.json();

    event.waitUntil(

        self.registration.showNotification(

            data.title || "Township Slots",

            {

                body: data.body,

                icon: "/icon-192.png",

                badge: "/badge-72.png",

                data: data.url || "/"

            }

        )

    );

});


self.addEventListener("notificationclick", event => {

    event.notification.close();

    event.waitUntil(

        clients.openWindow(

            event.notification.data || "/"

        )

    );

});
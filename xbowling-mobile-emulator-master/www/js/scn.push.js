(function (push) {
    push.setupPushNotifications = function() {
        if (scn.chromeEmulator) {
            return;
        }
        
        pushNotification = window.pushNotification;
        
        pushNotification.enablePush();
        pushNotification.setSoundEnabled(true);
        pushNotification.setVibrateEnabled(true);
        pushNotification.enableLocation();
        
        // Reset Badge on resume
        document.addEventListener("resume", function() {
            pushNotification.resetBadge();
        });
        
        pushNotification.registerEvent('push', function (pushMsg) {
           navigator.notification.vibrate(2000);
           navigator.notification.beep(1);
           navigator.notification.alert(pushMsg.message, null, "Notification", "OK");
        });

        
        pushNotification.registerForNotificationTypes(
            pushNotification.notificationType.badge
          | pushNotification.notificationType.sound
          | pushNotification.notificationType.alert);
    }
}(window.scn.push = window.scn.push || {}));
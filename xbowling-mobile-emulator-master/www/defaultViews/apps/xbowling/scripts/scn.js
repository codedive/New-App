(function (scn) {
    scn.sessionTimeoutDays = 120,
    scn.facebookAppId = "532712990083039",
    scn.paused = false,
    scn.loadDate = Date.now(),

    scn.onAjaxFailed = function (jqXHR, textStatus, errorThrown) {
        scn.logError("AJAX Failed with error: " + textStatus + ", " + errorThrown);
        alert("getJSON Failed: " + textStatus + " " + errorThrown);
    },

    scn.checkFlag = function (bitToCheck, flags) {
        return (flags & bitToCheck) == bitToCheck;
    }

    scn.padLeft = function (number, targetLength) {
        var strNumber = number.toString();
        while (strNumber.length < targetLength) {
            strNumber = '0' + strNumber;
        }
        return parseInt(strNumber);
    },

    scn.addCommas = function (number) {
        number += '';
        var x = number.split('.');
        var x1 = x[0];
        var x2 = x.length > 1 ? '.' + x[1] : '';
        var rgx = /(\d+)(\d{3})/;
        while (rgx.test(x1)) {
            x1 = x1.replace(rgx, '$1' + ',' + '$2');
        }
        return x1 + x2;
    },

    scn.formatDateTimeForRequest = function (toFormat) {
        return toFormat.getUTCFullYear() + "/" + (toFormat.getUTCMonth() + 1) + "/" + toFormat.getUTCDate() + " "
            + toFormat.getUTCHours() + ":" + toFormat.getUTCMinutes() + ":" + toFormat.getUTCSeconds();
    },

    _loadingCount = 0,

    scn.clearLoading = function () {
        _loadingCount = 0;
    },

    spinner = null,
    scn.showLoading = function () {
        _loadingCount++;

        if (!spinner) {
            var opts = {
                lines: 10, // The number of lines to draw
                length: 5, // The length of each line
                width: 2, // The line thickness
                radius: 6, // The radius of the inner circle
                color: '#FFFFFF', // #rgb or #rrggbb or array of colors
                hwaccel: true, // Whether to use hardware acceleration
                className: 'scn-spinner', // The CSS class to assign to the spinner
            };

            spinner = new Spinner(opts);
        }

        spinner.spin(document.body);
    },

    scn.hideLoading = function () {
        _loadingCount--;
        if (_loadingCount < 1) {
            _loadingCount = 0;

            if (spinner) {
                spinner.stop();
            }
        }
    },

    scn.ajax = function (options) {
        if (!options.data) {
            options.data = {};
        }
        if (!options.data.token) {
            //var token = scn.getCookie("token");
            var token = scn.getSession();
            if (token) {
                options.data.token = token;
            }
        }
        if (!options.data.apiKey) {
            options.data.apiKey = scn.apiKey;
        }

        /*
        options.beforeSend = function (jqXhr, settings) {
            if (typeof (window.sessionContext) == "function") {
                jqXhr.setRequestHeader("sessiontoken", window.sessionContext());
            }
        };
       */
        jQuery.ajax(options);
    },

    scn.errorFromAjaxResponse = function (response) {
        if (response && response.responseText) {
            var serverResponse = JSON.parse(response.responseText);
            if (typeof serverResponse == "object" && serverResponse.exceptionMessage) {
                serverResponse = serverResponse.exceptionMessage;
            } else {
                if (serverResponse[0] === "\"" && serverResponse.length > 2) {
                    serverResponse = serverResponse.substring(1, serverResponse.length - 2);
                }
            }

            alert(serverResponse);
        }
    },

    scn.persistSession = function (token) {
        //scn.setCookie("token", token, scn.sessionTimeoutDays);
        localStorage.setItem("token", token);

        var expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + scn.sessionTimeoutDays);
        localStorage.setItem("token-expiration", expirationDate);

        scn.hasSession(true);
    },

    scn.getSession = function () {
        return localStorage.getItem("token");
    },

    scn.clearSession = function () {
        //scn.removeCookie("token");
        localStorage.removeItem("token");
        localStorage.removeItem("token-expiration");
        scn.clearLastGameInfo();
        scn.hasSession(false);
    }

    scn._hasSession = function () {
        var now = new Date();
        var token = localStorage.getItem("token");
        var expiration = new Date(localStorage.getItem("token-expiration"));

        return token && (expiration > now);

        //return scn.getCookie("token") != false && scn.getCookie("token") != null;
    },

    scn.hasSession = ko.observable(false),

    //=function () {
    //    return scn.getCookie("token") != false && scn.getCookie("token") != null;
    //},

    scn.setCookie = function (name, value, expirationDays) {
        var expirationDate;
        if (expirationDays != null) {
            expirationDate = new Date();
            expirationDate.setDate(expirationDate.getDate() + expirationDays);
        } else {
            expirationDate = null;
        }
        scn._setCookieHardDate(name, value, expirationDate);
    },

    scn._setCookieHardDate = function (name, value, expirationDate) {
        var cookieString = escape(value) + ((expirationDate == null) ? "" : "; expires=" + expirationDate.toUTCString());
        document.cookie = name + "=" + cookieString;
    },

    scn.getCookie = function (name) {
        var cookieSheet = document.cookie.split(";");
        for (var i = 0; i < cookieSheet.length; i++) {
            var cookie = cookieSheet[i];
            var cookieName = cookie
                .substr(0, cookie.indexOf("="))
                .replace(/^\s+|\s+$/g, "");
            if (cookieName === name) {
                var cookieValue = cookie.substr(cookie.indexOf("=") + 1);
                var unescapedCookieValue = unescape(cookieValue);
                if (unescapedCookieValue != "null") {
                    return unescapedCookieValue;
                }
            }
        }

        return false;
    },

    scn.removeCookie = function (name) {
        if (scn.getCookie(name)) {
            var date = new Date(1970, 0, 01, 0, 0, 0, 0);
            scn._setCookieHardDate(name, "null", date);
        }
    },

    scn.getUrlParameter = function (name) {
        name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
        var regexS = "[\\?&]" + name + "=([^&#]*)";
        var regex = new RegExp(regexS);
        var results = regex.exec(window.location.search);
        if (results == null)
            return "";
        else
            return decodeURIComponent(results[1].replace(/\+/g, " "));
    },

    scn.logError = function (message, url, lineNumber) {
        alert("Error: " + message + " " + url + " " + lineNumber);
        var rawErrors = localStorage.getItem("errors");
        if (!rawErrors || rawErrors === "") {
            rawErrors = "[]";
        }

        var errors = JSON.parse(rawErrors);
        if (errors.length > 9) {
            errors.pop();
        }

        errors.push({ message: message, url: url, lineNumber: lineNumber });
        localStorage.setItem("errors", JSON.stringify(errors));
    },

    scn.reportErrors = function () {
        var rawErrors = localStorage.getItem("errors");
        alert(rawErrors);
        if (!rawErrors || rawErrors === "") {
            return;
        }

        var errors = JSON.parse(rawErrors);

        jQuery.ajax({
            url: scn.apiAddress + "error",
            type: "POST",
            data: { errors: rawErrors },
            dataType: "json",
            global: false,
            success: function () {
                localStorage.removeItem("errors");
            }
        });
    },

    scn.registerErrorHandler = function () {
        window.onerror = function (message, url, lineNumber) {
            try {
                scn.logError(message, url, lineNumber);
            } catch (e) { }

            return false;
        }
    },

    scn.wireAjax = function () {
        //jQuery.support.cors = true;
        jQuery(document.body)
            .bind("beforeSend", function () { scn.showLoading(); })
            .bind("complete", function () { scn.hideLoading(); })
            .bind("ajaxError", function (event, jqXHR, ajaxSettings, thrownError) {
                scn.logError("Ajax Request Failed: " + event + "\n" + thrownError + "\n" + jqXHR.responseText, ajaxSettings.url, "");
            });
    },

    scn.limitCharacters = function (text, maxCharacters) {
        if (!text)
            return text;

        if (text.length > maxCharacters) {
            text = text.substr(0, maxCharacters - 3) + "...";
        }

        return text;
    },

    scn.clearLastGameInfo = function () {
        localStorage.setItem("last-game-info", "");
    },

    scn.storeLastGameInfo = function (bowlingGameId, laneCheckoutId, scoringType) {
        var toStore = {
            bowlingGameId: bowlingGameId,
            laneCheckoutId: laneCheckoutId,
            scoringType: scoringType,
            timestamp: new Date()
        };

        // put it in local storage
        localStorage.setItem("last-game-info", JSON.stringify(toStore));
    },

    scn.retrieveLastGameInfo = function () {
        var lastGameInfo = localStorage.getItem("last-game-info");
        if (!lastGameInfo || lastGameInfo === "") {
            return null;
        }

        return JSON.parse(lastGameInfo);
    },

    scn.autoUpdateNumbers = function (autoUpdateId, newNumber, callback) {
        var elms = jQuery("[data-autoupdate='" + autoUpdateId + "']");
        var elmsToUpdate = elms.length;
        if (elmsToUpdate == 0) {
            if (callback && typeof callback == "function") {
                callback.call(null);
            }
        }

        for (var i = 0; i < elms.length; i++) {
            scn.animateNumbers(jQuery(elms[i]), newNumber, function () {
                elmsToUpdate--;
                if (elmsToUpdate <= 0) {
                    if (callback && typeof callback == "function") {
                        callback.call(null);
                    }
                }
            });
        }
    },

    _counts = {},
    _animating = {},
    _animatingId = 0,
    scn.animateNumbers = function (elm, newNumber, callback) {
        elm.text(scn.addCommas(newNumber));
        return;

        var elmId = elm.attr("id");

        if (_animating[elmId])
            return;

        _animating[elmId] = true;

        var existingNumber = _counts[elmId] || parseInt(elm.text().replace(/,/g, ""));

        var diff = Math.abs(existingNumber - newNumber);
        var diffSegments = Math.max(diff / 50, 1);

        var tickUntil = newNumber + (newNumber > existingNumber ? 1 : 0);

        jQuery({ count: existingNumber }).animate({ count: tickUntil }, {
            duration: 750 * diffSegments, // 750ms for every 50 ticks
            step: function () {
                elm.text(scn.addCommas(parseInt(this.count)));
            },
            always: function () {
                delete _animating[elmId];

                if (callback) {
                    callback.call();
                }
            }
        });

        _counts[elmId] = tickUntil;
    },

    scn.calculateLivePayout = function (entryFeeCredits) {
        var r;
        switch (entryFeeCredits) {
            case 10:
                r = 700;
                break;

            case 25:
                r = 1800;
                break;

            case 50:
                r = 3700;
                break;

            case 100:
                r = 7600;
                break;

            case 500:
                r = 40000;
                break;

            case 1000:
                r = 90000;
                break;

            default:
                r = 0;
                break;
        }
        return r;
    },

    scn.location = ko.observable({
        countryCode: "US",
        countryName: "United States",
        regionCode: "",
        regionName: ""
    });
    scn.recordLocation = function () {
        scn.ajax({
            url: scn.apiAddress + "geolocation",
            type: "GET",
            success: function (data) {
                if (data == null) {
                    scn.location({
                        countryCode: "US",
                        countryName: "United States",
                        regionCode: "",
                        regionName: ""
                    });
                } else {
                    scn.location(data);
                }
            },
            error: function () {
            }
        });
    },

    scn.isAppleDevice = function() {
        var device = scn.device.toLowerCase();
        return device.indexOf("iphone") > -1
            || device.indexOf("ipad") > -1 
            || device.indexOf("ipod") > -1 
            || device.indexOf("ios") > -1;
    },

    scn.injectWindowLoadingMessage = function (win, bodyText, headerText) {
        if (!headerText)
            headerText = "Loading...";

        // android crashing on script injection..only use it for apple devices
        if (scn.isAppleDevice()) {
            win.executeScript({
                code: "var headerNode = document.createElement('h1');"
                    + "headerNode.innerHTML = '" + headerText + "';"
                    + "headerNode.setAttribute('style', 'width:100%; margin-top: 50px; text-align: center; font-family: sans-serif;');"
                    + "document.body.appendChild(headerNode);"
                    + "var loadingNode = document.createElement('div');"
                    + "loadingNode.innerHTML = '" + bodyText + "';"
                    + "loadingNode.setAttribute('style', 'width:100%; text-align: center; font-family: sans-serif; font-size: 16px;');"
                    + "document.body.appendChild(loadingNode);"
            },
                function (r) { }
            );
        }
    },

    scn.urlDecode = function (value) {
        if (value) {
            if (typeof (value) === 'function') {
                value = value();
            }

            return decodeURIComponent(value).replace(/\+/g, ' ');
        }

        return value;
    },

    // open handlers are set when a custom open handler is passed in from the
    // underlying OS, in other words, when the app is opened externally from
    // a url or other mechanism. 
    scn.checkForOpenHandlers = function () {
        if (scn.openHandler) {
            var toHandle = scn.openHandler.pop();
            if (toHandle) {
                // switch and implement custom open handler logic here

                // clear pending (in case more than one was registered)
                scn.openHandler.clear();
            }
        }
    },

    _resumeListeners = [];
    scn.registerResumeListener = function (listenerFunction) {
        _resumeListeners.push(listenerFunction);
    },

    scn.onResume = function () {
        if (_resumeListeners && _resumeListeners.length > 0) {
            for (var i = 0; i < _resumeListeners.length; i++) {
                var func = _resumeListeners[i];
                if (func && typeof(func) == "function") {
                    func.apply();
                }
            }
        }
    }

    scn.clearResumeListeners = function () {
        _resumeListeners = [];
    }
}(window.scn = window.scn || {}));

scn.recordLocation();

scn.checkForOpenHandlers();

function cancelEvent(event) {
    event.returnValue = false;
    if (event.preventDefault) {
        event.preventDefault();
    }
    if (event.stopPropagation) {
        event.stopPropagation();
    }
};

scn.hasSession(scn._hasSession());


// notification
var NOTIFICATION_BUTTONS = {
    NONE: 0,
    OK: 1,
    CANCEL: 2
};

var _originalAlert = window.alert;
window.alert = function (message, options) {
    options = options || {};
    options.title = options.title || " ";
    if (window.navigator.notification) {
        window.navigator.notification.alert(message, options.callback, options.title, options.buttonName);
    } else {
        _originalAlert(message);
        if (options.callback && typeof(options.callback) == "function") {
            options.callback.call(null);
        }
    }
};

var _originalConfirm = window.confirm;
window.confirm = function (message, options) {
    options = options || {};
    if (window.navigator.notification) {
        window.navigator.notification.confirm(message, function (e) {
            if (options.callback && typeof (options.callback) == "function")
                options.callback.call(null, e);
        }, options.title, options.buttonLabels);
    } else {
        var result = _originalConfirm(message);
        if (options.callback && typeof (options.callback) == "function") {
            options.callback.call(null, result ? NOTIFICATION_BUTTONS.OK : NOTIFICATION_BUTTONS.NONE);
        }
    }
}

var _originalPrompt = window.prompt;
window.prompt = function (message, options) {
    options = options || {};

    if (!options.defaultText)
        options.defaultText = " ";

    if (window.navigator.notification) {
        window.navigator.notification.prompt(message, function (e) {
            if (options.callback && typeof (options.callback) == "function")
                options.callback.call(null, e.input1, e.buttonIndex);
        }, options.title, options.buttonLabels, options.defaultText);
    } else {
        var result = _originalPrompt(message, options.defaultText);
        if (options.callback && typeof (options.callback) == "function") {
            options.callback.call(null, result, result ? NOTIFICATION_BUTTONS.OK : NOTIFICATION_BUTTONS.NONE);
        }
    }
}


document.addEventListener("pause", function () {
    console.log("paused");
    scn.paused = true;
}, false);

document.addEventListener("resume", function () {
    console.log("resumed");
    scn.paused = false;

    // check for open handlers
    scn.checkForOpenHandlers();

    // call any resume listeners
    scn.onResume();

    // UNCOMMENT FOR AUTO REFRESH...
    /*if (Date.now() - scn.loadDate > REFRESH_MILLISECONDS) {
        // reload
        window.navigator.splashscreen.show();
        window.location.reload();
    } else {
        scn.loadDate = Date.now();
    }*/
}, false);

//var REFRESH_MILLISECONDS = 6 * 3600000; // 6 hours

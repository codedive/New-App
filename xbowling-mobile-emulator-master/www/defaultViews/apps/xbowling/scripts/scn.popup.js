(function (popup) {
    defaultOptions = function () {
        this.hideCloseButton = false;
        this.showCurtain = true;
        this.callback = null;
        this.viewModel = null;
        this.height = 240;
        this.additionalClass = null;
        this.closeButtonAdditionalClass = null;
    },

    popupId = 0,

    popup.show = function (view, options) {
        options = jQuery.extend(new defaultOptions(), options);

        if (options.height === "auto") {
            options.height = scn.viewEngine.windowHeight * 0.85;
        }

        //var hashData = scn.viewEngine.getViewIdFromHash();

        scn.viewEngine.pauseAnimatedBackground();

        var id = popupId++;

        var curtain = jQuery("<div />");
        if (options.showCurtain) {
            curtain.width(scn.viewEngine.windowWidth)
                   .height(scn.viewEngine.windowHeight)
                   .addClass("popup-curtain");
        }

        var elm = jQuery("<div />");
        elm.addClass("hwaccel popup animated bounceIn");
        elm.css("height", options.height + "px"); // initial height
        elm.attr("id", "scn-popup-" + id);
        elm.attr("data-popup-id", id);
        elm.data("options", options);
        elm.data("destructors", []);
        elm.data("curtain", curtain);

        if (options.additionalClass) {
            elm.addClass(options.additionalClass);
        }

        var wrapper = jQuery("#wrapper");

        var newWidth = scn.viewEngine.windowWidth * .95;
        elm.width(newWidth);
        elm.css("left", ((scn.viewEngine.windowWidth - newWidth) / 2));
        elm.css("top", Math.max(25, ((scn.viewEngine.windowHeight - options.height) / 4)));

        wrapper.append(curtain);
        wrapper.append(elm);

        scn.viewEngine.getViewContent(
            "xbowling",
            view,
            function (result, annonymous) {
                //if (!annonymous & !scn.hasSession()) {
                //    popup.show("Login?return=" + view + "&returnPopup=true", options);
                //    return;
                //}

                //elm.html(result);
                scn.viewEngine.html(elm.get(0), result);

                scn.viewEngine.replaceSubViews(elm, function () {
                    scn.viewEngine.replaceImages(elm);

                    if (!options.hideCloseButton) {
                        var closeButton = jQuery("<span />");
                        closeButton.addClass("close-btn-20");

                        if (options.closeButtonAdditionalClass) {
                            closeButton.addClass(options.closeButtonAdditionalClass);
                        }

                        closeButton.attr("data-for-popup", elm.attr("id"));
                        elm.append(closeButton);
                        scn.viewEngine.wireTap(closeButton.get(0), function () {
                            popup.hide(elm, null);
                        });
                    }

                    scn.viewEngine.replaceTemplates(elm);

                    scn.viewEngine.wireEvents(elm);

                    scn.viewEngine.wireInputBlur(elm);
                });

            });

        // Google Analyics
        // Register Popup Hit
        if (!scn.chromeEmulator) {
            ga_storage._trackPageview('/popup/' + view);
        }

    },

    getPopupElement = function (fromElm) {
        var popupElm;

        if (!fromElm.jQuery) {
            fromElm = jQuery(fromElm);
        }

        if (fromElm.hasClass("popup")) {
            popupElm = fromElm;
        } else {
            popupElm = fromElm.parents(".popup:first");
        }

        return popupElm;
    },

    popup.hide = function (popupElm, callbackViewModel) {
        popupElm = getPopupElement(popupElm);

        if (!popupElm || popupElm.length == 0)
            throw "Not a valid popup.";

        popupElm.detach();

        popupElm.data("curtain").detach();

        if (jQuery("[data-popup-id]").length == 0) {
            scn.viewEngine.resumeAnimatedBackground();
        }

        var id = popupElm.data("popup");

        var callback = popupElm.data("options").callback;
        if (callback) {
            callback.call(popupElm, callbackViewModel);
        }

        invokePopupDestructors(popupElm);

        scn.hideLoading();
    },

    popup.getViewModel = function (popupElm) {
        return getPopupElement(popupElm).data("options").viewModel;
    },

    popup.getHeight = function (popupElm) {
        return getPopupElement(popupElm).data("options").height;
    }

    popup.registerPopupDestructor = function (elm, destructor) {
        var popupElm = getPopupElement(elm);
        if (!popupElm || popupElm.length == 0)
            throw "Can not register popup destructor with an element not in a popup.";

        var destructors = popupElm.data("destructors");
        destructors.push(destructor);
    },

    invokePopupDestructors = function (popupElm) {
        var dtors = popupElm.data("destructors");
        if (dtors) {
            for (var i = 0; i < dtors.length; i++) {
                if (dtors[i] && typeof dtors[i] == "function") {
                    try {
                        dtors[i].call(null);
                    } catch (e) {
                        var popupId;
                        if (popupElm) {
                            popupId = wrapper.attr("data-popup-id");
                        }

                        if (!popupId) {
                            popupId = "UNDEFINED-POPUP";
                        }

                        var errorMessage = (e ? e : "no error message");
                        console.log("DESTRUCTOR ERROR in " + viewId + ": " + errorMessage);
                    }
                }
            }
        }
        dtors = null;
    }
}(window.scn.popup = window.scn.popup || {}));

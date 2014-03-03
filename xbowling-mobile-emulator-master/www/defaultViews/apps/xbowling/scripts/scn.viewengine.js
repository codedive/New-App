(function (viewEngine) {
    viewEngine.menu = null,
    _currentViewModel = null,
    _currentReferer = null,

    RESOURCE_TYPE = { Image: 1, Asset: 2 },

    viewEngine.NOT_LOGGED_IN_VIEW = "new-0-SignIn",

    viewEngine.hideSplashScreen = function (handler) {
        // old interface for this method, was to call it with a handler, then call it again
        // to execute that handler.  we were passing in window.navigator.splashscreen, but
        // cordova Android has some sort of problem with this, where it will not execute it
        // (race condition, possibly?).
        // we will just call it directly now, but we have to support the old interface b/c
        // the code that executes this has been shipped on a device. if we receive a handler
        // just ignore it.
        if (handler)
            return;

        if (window.navigator.splashscreen) {
            window.navigator.splashscreen.hide();
        }
    },

    viewEngine.getViewIdFromHash = function () {
        var viewId, appId;
        var params = {};

        if (window.location.hash) {
            viewId = location.hash.substring(1, location.hash.length);

            var appIdSeperator = viewId.indexOf("\\", 1);

            appId = viewId.substring(0, appIdSeperator);
            viewId = viewId.substring(appIdSeperator + 1, viewId.length);

            var queryStringSeperator = viewId.indexOf("?");
            if (queryStringSeperator > -1) {
                var queryString = viewId.substring(queryStringSeperator + 1, viewId.length);

                viewId = viewId.substring(0, queryStringSeperator);

                var pairs = queryString.split("&");
                for (var i = 0; i < pairs.length; i++) {
                    var pairParts = pairs[i].split("=");
                    if (pairParts.length == 2) {
                        params[pairParts[0]] = pairParts[1];
                    }
                }
            }
        }

        return { appId: appId, viewId: viewId, params: params };
    },

    viewEngine.getViewIdStringFromHash = function (filter) {
        if (!filter) {
            filter = function () {
                return true;
            }
        }

        var params = viewEngine.getViewIdFromHash();

        var paramString = "";

        for (var param in params.params) {
            if (filter(param)) {
                if (paramString.length > 0) {
                    paramString += "&";
                }
                paramString += param + "=" + params.params[param];
            }
        }

        return paramString;
    },

    viewEngine.onHashChange = function () {

        var ids = viewEngine.getViewIdFromHash();
        if (ids.viewId) {
            viewEngine.renderViewById(ids.appId, ids.viewId);
        }
    },

    viewEngine.render = function () {
        //var appId = "xbowling"; // TODO - change to guid or some other constant value

        window.views = window.views || {};
        window.templates = window.templates || {};

        // if a viewid is specified in the hash, we will want to load that specific view
        var ids = viewEngine.getViewIdFromHash();
        var appId = ids.appId;
        var viewId = ids.viewId;
        var viewParams = ids.params;

        if (!appId) {
            appId = "xbowling";
        }

        viewEngine.appId = appId;

        jQuery("#layoutWrapper").height(viewEngine.windowHeight);

        jQuery("#slideWrapper").height(viewEngine.windowHeight)
                               .width(viewEngine.windowWidth * 2);

        jQuery("#slide-menu").height(viewEngine.windowHeight);

        jQuery("#wrapper").height(viewEngine.windowHeight)
                          .width(viewEngine.windowWidth);

        if (scn.isAppleDevice()) {
            jQuery(document.body).addClass("ios");
        } else {
            jQuery(document.body).addClass("android");
        }

        var animationStyle = jQuery("<style type=\"text/css\" />");
        animationStyle.text(".slide-left {" +
                            "   transform: translateX(-" + viewEngine.windowWidth + "px);" +
                            "   -ms-transform: translateX(-" + viewEngine.windowWidth + "px);" +
                            "   -webkit-transform: translateX(-" + viewEngine.windowWidth + "px);" +
                            "}" +
                            ".slide-right {" +
                            "   transform: translateX(" + viewEngine.windowWidth + "px);" +
                            "   -ms-transform: translateX(" + viewEngine.windowWidth + "px);" +
                            "   -webkit-transform: translateX(" + viewEngine.windowWidth + "px);" +
                            "}");
        jQuery(document.head).append(animationStyle);

        // wire up background
        jQuery("#background").width(viewEngine.windowWidth).height(viewEngine.windowHeight);

        // wire up curtain
        //jQuery("#curtain").width(viewEngine.windowWidth).height(viewEngine.windowHeight);

        // TODO -- needs cross browser support for older browsers
        window.onhashchange = viewEngine.onHashChange;

        viewEngine.renderAppById(appId, viewId, viewParams);

        viewEngine.viewProperties = [];

        // var user = scn.userRepository.loadUser(1, viewEngine.userLoaded);

        // Initialize Google Analyics
        if (!scn.chromeEmulator) {
            ga_storage._setAccount('UA-45393489-3');
        }

    },

    // viewId is optional
    viewEngine.currentVersion = 0,
    viewEngine.viewAppId = 0,

    viewEngine.renderAppById = function (appId, viewId, viewParams) {
        if (window.device && window.device.model && window.device.version) {
            var deviceModel = window.device.model.toLowerCase();

            // ipad with iOS 7+
            if (deviceModel.indexOf("ipad") > -1 && window.device.version >= "7.0") {
                var width = 480;
                var height = 320;

                // update viewport metatag to prevent scrolling in webview
                jQuery("meta[name='viewport']")
                    .attr("content", "width=" + width + ", height=" + height + ", initial-scale=1, maximum-scale=1, user-scalable=no");

                // set viewengine width and height
                viewEngine.windowWidth = width;
                viewEngine.windowHeight = height;

                // override style properties
                var styleTag = document.createElement("style");
                styleTag.innerHTML = "html, body { width: " + width + "px; height: " + height + "px; }";
                document.body.appendChild(styleTag);

                // just for good measure, prevent scrolling on the body
                // need to do this because was seeing some horizontal srolling even with all above
                document.body.ontouchmove = function (event) {
                    event.preventDefault();
                }
            }
        }

        viewEngine.appId = appId;

        scn.showLoading();

        if (!scn.hasSession()) {
            viewId = viewEngine.NOT_LOGGED_IN_VIEW;
        } else {
            if (!viewId || viewId == "undefined") {
                //viewId = app.defaultView;
                // TODO
                //viewId = "Landing";
                viewId = "new-1-MainDashboard";
            }
        }
        
        /*if (app.menuTemplate && window.templates[app.menuTemplate]) {
            var slideMenu = jQuery("#slide-menu");
            slideMenu.html(window.templates[app.menuTemplate].content);
            viewEngine.wireEvents(slideMenu);
        }*/

        /*var menuContent = window.templates["Menu"];
        if (!menuContent)
            menuContent = "";
           
        var slideMenu = jQuery("#slide-menu");
        slideMenu.html(menuContent);
        viewEngine.wireEvents(slideMenu);*/
     
        var newHash = "#" + appId + "\\" + viewId;
        if (viewParams) {
            var paramString = "";
            for (var param in viewParams) {
                if (paramString.length > 0) {
                    paramString += "&";
                }
                paramString += param + "=" + viewParams[param];
            }

            newHash += "?" + paramString;
        }

        if (window.location.hash == newHash) {
            viewEngine.renderViewById(appId, viewId);
        } else {
            window.location.hash = newHash;
        }

        // hide splash screen after some time (gives everything time to render)
        console.log("setting timeout for hidesplashscreen");
        setTimeout(function () {
            viewEngine.hideSplashScreen();
        }, 2500);

        scn.hideLoading();
    },

    viewEngine.renderViewById = function (appId, viewId) {
        viewEngine.getViewContent(appId, viewId, function (result, anonymous) {
            var loadedView = {
                anonymous: anonymous,
                content: result
            };
            viewEngine.renderView(loadedView, viewId);
        });
    },

    viewEngine.getViewContent = function (appId, viewId, callback, callbackContext) {
        var anonymous = false;
        var useDefault = false;
        for (var i = 0; i < scn.manifest.views.length; i++) {
            if (scn.manifest.views[i].id == viewId) {
                anonymous = scn.manifest.views[i].anonymous;
                useDefault = scn.manifest.views[i].useDefault;
                break;
            }
        }

        if (useDefault) {
            jQuery.get("defaultViews/apps/" + appId + "/" + viewId, function (content) {
                callback.call(callbackContext, content, anonymous);
            });
        } else {
            _getFileContent("apps/" + appId + "/" + viewId, function (content) {
                callback.call(callbackContext, content, anonymous);
            });
        }
    },

    _getFileUrl = function (path, callback) {
        scn.fileSystem.root.getFile(
            path,
            { create: false },
            function (viewFileEntry) {
                callback(viewFileEntry.toURL());
            },
            function () {
                callback(null);
            });
    },

    _getFileContent = function (path, callback) {
        scn.fileSystem.root.getFile(
                   path,
                   { create: false },
                   function (viewFileEntry) {
                       viewFileEntry.file(function (viewFile) {
                           var reader = new FileReader();
                           reader.onerror = function (e) {
                               console.log("Error reading view file");
                           };

                           reader.onloadend = function (e) {
                               callback(this.result);
                           };

                           reader.onabort = function (e) {
                               console.log("Aborted view file read");
                           };

                           // read the manifest file
                           reader.readAsText(viewFile);
                       });
                   },
                   function () {
                       callback(null);
                   });
    },

    html = function (domElm, htmlContent) {
        viewEngine.html(domElm, htmlContent);
    },

    viewEngine.html = function (domElm, htmlContent) {
        domElm.innerHTML = htmlContent;

        var children = domElm.children;
        var childrenLength = children.length;
        for (var j = 0; j < childrenLength; j++) {
            if (children[j].tagName.toUpperCase() === "SCRIPT") {
                eval(children[j].innerHTML);
            }
        }
    },

    viewEngine.replaceTemplates = function (inElm) {
        var newViewTemplates = jQuery("[data-template]", inElm);
        var newViewTemplatesLength = newViewTemplates.length;
        for (var i = 0; i < newViewTemplatesLength; i++) {
            var elm = jQuery(newViewTemplates[i]);
            var templateName = elm.attr("data-template");

            var templateContent = window.templates[templateName];
            if (templateContent) {
                // add template content to the element
                //elm.html(templateContent);
                html(newViewTemplates[i], templateContent);

                viewEngine.replaceTemplates(elm);

                //viewEngine.wireEvents(elm);
            }
        }
    },

    viewEngine.replaceSubViews = function (inElm, success) {
        if (!inElm.jquery) {
            inElm = jQuery(inElm);
        }
        
        var hashData = viewEngine.getViewIdFromHash();

        var subViews = jQuery("[data-subview]", inElm);
        var subViewsLength = subViews.length;

        var subViewsToLoad = subViewsLength;
        var onSubViewLoaded = function () {
            subViewsToLoad--;
            if (subViewsToLoad === 0) {
                if (success && typeof (success) == 'function') {
                    success.call(null);
                }
            }
        }

        if (subViewsLength == 0) {
            if (success && typeof (success) == 'function') {
                success.call(null);
            }

            return;
        }

        for (var i = 0; i < subViewsLength; i++) {
            var elm = jQuery(subViews[i]);
            var viewId = elm.attr("data-subview");

            viewEngine.getViewContent(hashData.appId, viewId, function (result, anonymous) {
                html(this, result);
                //this.html(result);

                onSubViewLoaded();
            }, subViews[i]);
        }

        // timeout the wait after 5 seconds
        setTimeout(function () {
            if (subViewsToLoad > 0) {
                console.log("SUB VIEWS NOT LOADED AFTER 5000MS...MOVING ON ANYWAY");
                if (success && typeof (success) == 'function') {
                    success.call(null);
                }
            }
        }, 5000);
    },

    viewEngine.wireInputBlur = function (wrapper) {
        // needed for ios7 ipads...when keyboar is hidden need to make sure screen is scrolled
        // back up or the screen will get stuck.
        if (scn.isAppleDevice()) {
            jQuery("input, select", wrapper).on("blur", function () {
                jQuery(window).scrollTop(0);
                jQuery(document.body).scrollTop(0);
            });
        }
    },

    viewEngine.renderView = function (view, viewId) {

        if (view == null)
            return;

        console.log("render view");
        scn.clearLoading();

        var viewParams = viewEngine.getViewIdFromHash();
        if (!scn.hasSession() && (view.id && view.id != "new-0-SignIn")) {
            scn.viewEngine.changeView("new-0-SignIn");
        }

        scn.showLoading();

        var direction = viewParams.params.slide;
        if (!direction) {
            direction = "left";
        }

        // pause animated background
        viewEngine.pauseAnimatedBackground();

        var oldWrapper = jQuery("#wrapper");
        oldWrapper.attr("id", "oldwrapper");

        var oldWrapperParent = oldWrapper.parent();

        var wrapper = jQuery("<div id=\"wrapper\" />");
        wrapper.height(viewEngine.windowHeight);
        wrapper.width(viewEngine.windowWidth);
        wrapper.attr("data-appid", viewParams.appId);
        wrapper.attr("data-viewid", viewParams.viewId);

        var domWrapper = wrapper.get(0);
        domWrapper.innerHTML = view.content;

        if (direction == "right") {
            oldWrapperParent.css("left", "").css("right", "0");
            wrapper.insertBefore(oldWrapper);
        } else {
            oldWrapperParent.css("right", "").css("left", "0");
            wrapper.insertAfter(oldWrapper);
        }

        // clear timeouts from the wrapper and invoke view destructors before transitioning
        viewEngine.clearTimeouts(oldWrapper);
        viewEngine.clearIntervals(oldWrapper);
        viewEngine.invokeViewDestructors(oldWrapper);
        scn.clearResumeListeners();

        // scroll to the top
        //jQuery(window).scrollTop(0);
        //jQuery(document.body).scrollTop(0);

        var children = domWrapper.children;
        var childrenLength = children.length;
        for (var i = 0; i < childrenLength; i++) {
            if (children[i].tagName.toUpperCase() == "SCRIPT") {
                eval(children[i].innerHTML);
            }
        }

        //wrapper.html(view.content);

        // replace subviews
        viewEngine.replaceSubViews(wrapper);

        // populate all data-template tags with the template content
        viewEngine.replaceTemplates(wrapper);

        // replace images
        viewEngine.replaceImages(wrapper);

        viewEngine.wireEvents(wrapper);

        viewEngine.wireInputBlur(wrapper);

        //if (oldWrapper.children().length > 0) {
        //    oldWrapperParent.addClass("slide-" + direction);
        //setTimeout(function () {
            console.log("detach view");
            oldWrapperParent
                .css("right", "")
                .css("left", "")
                .removeClass("slide-" + direction);
            oldWrapper.remove();
            scn.hideLoading();
        //}, 1);//550);
       // }

        // wire up menu
        // have to listen for the dragStart and dragStop events and hide/show the
        // shadow on the menu because mobile safari has rendering issues with the
        // shadow while it is being dragged
        /*var handle = jQuery("#slide-menu-handle", wrapper);
        if (handle) {
            viewEngine.menu = jQuery("#slide-menu").dragMenu(handle, "#layoutWrapper", {
                dragStart: function (dragElm, event) {
                    jQuery(dragElm).removeClass("left-shadow");
                },
                dragStop: function (dragElm, event) {
                    jQuery(dragElm).addClass("left-shadow");
                }
            });
        }*/



        //wrapper.focus();

        // Google Analyics
        // Register Page Hit
        if (!scn.chromeEmulator) {
            ga_storage._trackPageview('/page/' + viewId);
        }

        console.log("exit render view");
    },

    viewEngine.replaceImages = function (wrapper) {
        if (!wrapper.jQuery) {
            wrapper = jQuery(wrapper);
        }

        if (wrapper.is("img")) {
            replaceSingleImage(wrapper);
        } else {
            var images = jQuery("img", wrapper);
            for (var i = 0; i < images.length; i++) {
                var jqImage = jQuery(images[i]);
                replaceSingleImage(jqImage);
            }
        }
    },

    replaceSingleImage = function (jqImage) {
        var src = jqImage.attr("src");
        viewEngine.getResourceUrl(RESOURCE_TYPE.Image, src, jqImage,
            function (image, imageUrl) {
                image.attr("src", imageUrl);
            });
    }

    viewEngine.wireTap = function (elm, fn) {
        var tapLt = new lt.LightningTouch(
            elm.jquery ? elm.get(0) : elm,
            fn,
            "tap");
    },

    viewEngine.wireEvents = function (elm) {
        var taps = jQuery("[data-tap]", elm);
        var tapsLength = taps.length;
        for (var i = 0; i < tapsLength; i++) {
            viewEngine.wireTap(
                taps[i],
                function () {
                    var action = jQuery(this.element).attr("data-tap");
                    if (action) {
                        viewEngine.callFunction(this.element, action);
                    }
                });
        }

        var loads = jQuery("[data-load]", elm);
        var loadsLength = loads.length;
        for (var i = 0; i < loadsLength; i++) {
            var loadElm = jQuery(loads[i]);

            if (loadElm.attr("data-load")) {
                viewEngine.callFunction(loadElm, loadElm.attr("data-load"));
            }
        }

        var changeViews = jQuery("[data-changeview]", elm);
        var changeViewsLength = changeViews.length;
        for (var i = 0; i < changeViewsLength; i++) {
            viewEngine.wireTap(
                changeViews[i],
                function () {
                    var changeViewElm = jQuery(this.element);
                    var view = changeViewElm.attr("data-changeview");
                    var direction = changeViewElm.attr("data-changeview-slidedirection");
                    if (view) {
                        viewEngine.changeView(view, { slideDirection: direction });
                    }
                });
        }

        // wire up lightning touch for input elements
        if (scn.isAppleDevice()) {
            var inputs = jQuery("input, select", elm);
            var inputsLength = inputs.length;
            for (var i = 0; i < inputsLength; i++) {
                viewEngine.wireTap(
                    inputs[i],
                    function (e) {
                        cancelEvent(e);
                        this.element.focus();
                    });
            }
        }

        var popups = jQuery("[data-popup]", elm);
        var popupsLength = popups.length;
        for (var i = 0; i < popupsLength; i++) {
            viewEngine.wireTap(
                popups[i],
                function (e) {
                    var invokingElm = jQuery(this.element);

                    var popupOptions = {
                        height: invokingElm.attr("data-popup-height")
                    };
                    var popupId = invokingElm.attr("data-popup");
                    scn.popup.show(popupId, popupOptions);
                });
        }
    },

    viewEngine.callFunction = function (thisCtx, functionName) {
        var namespaces = functionName.split(".");
        var func = namespaces.pop();
        var context = window;
        for (var j = 0; j < namespaces.length; j++) {
            context = context[namespaces[j]];
        }
        return context[func].call(thisCtx);
    },

    viewEngine.back = function (number) {
        if (number == 0 || number === undefined)
            number = -1;
        else if (number > 0)
            number = -number;

        window.history.go(number);
    },

    viewEngine.windowHeight = jQuery(window).height(),
    viewEngine.windowWidth = jQuery(window).width(),



    viewEngine.registerTimeout = function (timeoutName, timeout) {
        var wrapper = jQuery("#wrapper");

        if (!wrapper.data("timeouts"))
            wrapper.data("timeouts", new Object());

        if (wrapper.data("timeouts")[timeoutName]) {
            window.clearTimeout(wrapper.data("timeouts")[timeoutName]);
        }
        wrapper.data("timeouts")[timeoutName] = timeout;
    },

    viewEngine.clearTimeouts = function (container) {
        var timeouts = container.data("timeouts");
        if (timeouts) {
            for (var timeout in timeouts) {
                window.clearTimeout(timeouts[timeout]);
            }
        }
    },

    viewEngine.registerInterval = function (intervalName, interval) {
        var wrapper = jQuery("#wrapper");
        if (!wrapper.data("intervals"))
            wrapper.data("intervals", new Object());

        if (wrapper.data("intervals")[intervalName]) {
            window.clearTimeout(wrapper.data("intervals")[intervalName]);
        }
        wrapper.data("intervals")[intervalName] = interval;
    },

    viewEngine.clearIntervals = function (container) {
        var intervals = container.data("intervals");
        if (intervals) {
            for (var interval in intervals) {
                window.clearInterval(intervals[interval]);
            }
        }
    },

    viewEngine.registerViewDestructor = function (destructor) {
        var wrapper = jQuery("#wrapper");

        if (!wrapper.data("destructors"))
            wrapper.data("destructors", []);

        wrapper.data("destructors").push(destructor);
    },

    viewEngine.invokeViewDestructors = function (wrapper) {
        var destructors = wrapper.data("destructors");
        if (destructors) {
            for (var i = 0; i < destructors.length; i++) {
                try {
                    destructors[i]();
                } catch (e) {
                    var viewId;
                    if (wrapper) {
                        viewId = wrapper.attr("data-viewid");
                    }

                    if (!viewId) {
                        viewId = "UNDEFINED-VIEW";
                    }

                    var errorMessage = (e ? e : "no error message");
                    console.log("DESTRUCTOR ERROR in " + viewId + ": " + errorMessage);
                }
            }
        }
        destructors = null;
        wrapper.data("destructors", []);
    },

    viewEngine.defaultChangeViewOptions = function () {
        this.viewModel = null,
        this.slideDirection = "left";
    },

    viewEngine.changeView = function (viewId, options) {
        options = jQuery.extend(new viewEngine.defaultChangeViewOptions(), options);

        // check for reload needed
        /*var redirected = false;
        if (window.needsReload) {
            if (!scn.viewEngine.viewProperties[viewId]) {
                window.needsReload = false;
                var vParam = parseInt(scn.getUrlParameter("v"));
                if (!vParam) {
                    vParam = 1;
                }

                vParam++;

                window.location.href = window.location.protocol + "//" + window.location.host + "?v=" + vParam + "#" + viewId;
                redirected = true;
            }
        }*/

        var ids = viewEngine.getViewIdFromHash();

        _currentViewModel = options.viewModel;
        _currentReferer = window.location.hash.substring(1, window.location.hash.length);

        var newHash;
        var seperatorIndex = viewId.indexOf("\\");
        var hasQueryString = viewId.indexOf("?") > -1;
        if (seperatorIndex > 0) {
            newHash = "#" + viewId;    
        } else {
            // add appId based on current appId
            newHash = "#" + ids.appId + "\\" + viewId;
        }

        if (!hasQueryString) {
            newHash += "?";
        } else if (viewId.indexOf("=") > 0) {
            newHash += "&";
        }
        
        newHash += "slide=" + options.slideDirection;

        window.location.hash = newHash;

    },

    viewEngine.getCurrentViewModel = function () {
        return _currentViewModel;
    },

    viewEngine.getCurrentReferer = function () {
        return _currentReferer;
    },

        viewEngine.getResourceUrl = function (resourceType, resourceId, callbackPassback, callback) {
            if (resourceType == RESOURCE_TYPE.Image) {
                var image = null;
                for (var i = 0; i < scn.manifest.images.length; i++) {
                    if (scn.manifest.images[i].id == resourceId) {
                        image = scn.manifest.images[i];
                        break;
                    }
                }

                if (image != null) {
                    if (image.useDefault) {
                        callback(callbackPassback, "defaultViews/apps/xbowling/images/" + image.id);
                        /*jQuery.ajax({
                            url: "defaultViews/apps/xbowling/images/" + image.id,
                            type: "GET",
                            success: function (data) {
                                callback(callbackPassback, data);
                            }
                        });*/
                    } else {
                        var suffix = scn.useImgSuffix ? ".img" : "";
                        _getFileUrl("apps/xbowling/images/" + image.id + suffix, function (data) {
                            callback(callbackPassback, data);
                        });
                    }
                }
            } else if (resourceType == RESOURCE_TYPE.Asset) {
                var asset = null;
                for (var i = 0; i < scn.manifest.assets.length; i++) {
                    if (scn.manifest.assets[i].id == resourceId) {
                        asset = scn.manifest.assets[i];
                        break;
                    }
                }

                if (asset != null) {
                    if (asset.useDefault) {
                        callback(callbackPassback, "defaultViews/apps/xbowling/assets/" + asset.id);
                    } else {
                        _getFileUrl("apps/xbowling/assets/" + asset.id, function (data) {
                            callback(callbackPassback, data);
                        });
                    }
                }
            }
        },

    viewEngine.getResource = function (resourceType, resourceId, callbackPassback, callback) {
        if (resourceType == RESOURCE_TYPE.Image) {
            var image = null;
            for (var i = 0; i < scn.manifest.images.length; i++) {
                if (scn.manifest.images[i].id == resourceId) {
                    image = scn.manifest.images[i];
                    break;
                }
            }

            if (image != null) {
                if (image.useDefault) {
                    jQuery.ajax({
                        url: "defaultViews/apps/xbowling/images/" + image.id,
                        type: "GET",
                        success: function (data) {
                            callback(callbackPassback, data);
                        }
                    });
                } else {
                    var suffix = scn.useImgSuffix ? ".img" : "";
                    _getFileContent("apps/xbowling/images/" + image.id + suffix, function (data) {
                        callback(callbackPassback, data);
                    });
                }
            }
        }
    },

    viewEngine.registerOffline = function (viewId) {
        window.addEventListener("x-offline", function () {
            // HACK - There is a bug in PhoneGap for Android that is causing the offline
            // event to fire when focusing on an input field.  This conditional should
            // be removed after that bug has been resolved.
            var tagName = document.activeElement.tagName.toLowerCase();
            if (tagName !== "input" && tagName !== "button") {
                var offline = jQuery("#offline");
                offline.show();
            } else {
                var activeElement = jQuery(document.activeElement);
                var activeElementBlur = function () {
                    if (!navigator.onLine) {
                        var offline = jQuery("#offline:hidden");
                        if (offline.length > 0)
                            offline.show();
                    }

                    activeElement.unbind("blur", activeElementBlur);
                }

                activeElement.blur(activeElementBlur);
            }
        });
        window.addEventListener("x-online", function () {
            var offline = jQuery("#offline:visible");
            if (offline.length > 0) {
                offline.hide();
                //if (offline.data("pendingview") > 0) {
                //    viewEngine.renderThemedViewById(offline.data("pendingview"));
                //}
            }
        });

        var checkReloadFunction = function () {
            var themedViewsVersion = localStorage.getItem("themedViews-" + viewEngine.viewAppId + "-version");
            jQuery.getJSON(
                scn.apiAddress + "viewapp/" + viewEngine.viewAppId + "/version",
                {},
                function (data, textStatus, jqXhr) {
                    scn.hideLoading();

                    if (data != viewEngine.currentVersion) {
                        // reload
                        window.needsReload = true;
                        return;
                    } else {
                        window.setTimeout(checkReloadFunction, scn.versionPollPeriod);
                    }
                });
        };
        if (scn.versionPollPeriod > 0) {
            window.setTimeout(checkReloadFunction, scn.versionPollPeriod);
        }
    },

    viewEngine.pauseAnimatedBackground = function () {
        jQuery("#animated-bg").addClass("paused");
    },

    viewEngine.resumeAnimatedBackground = function () {
        jQuery("#animated-bg").removeClass("paused");
    }
}(window.scn.viewEngine = window.scn.viewEngine || {}));

window.scn.views = window.scn.views || {};

jQuery(document).ready(function (e) {
    jQuery.support.cors = true;

    //scn.wireAjax();

    /*var apiKey = scn.getUrlParameter("apikey");
    if (apiKey && apiKey !== "undefined") {
        scn.apiKey = apiKey;
    } else {
        // TODO - TEMPORARY TO SUPPORT IPAD
        scn.apiKey = "C08F804993394ACB93E2F86EF2E17557";
    }*/

    //scn.registerErrorHandler();
    //scn.reportErrors();
//    scn.viewEngine.render();
 //   scn.viewEngine.registerOffline();
});



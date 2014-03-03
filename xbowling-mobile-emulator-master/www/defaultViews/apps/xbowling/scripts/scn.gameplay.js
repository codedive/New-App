(function (gameplay) {
    gameplay.getGameDateTimeWindow = function (minutes) {
        var from = new Date();
        var to = new Date();

        var milliseconds = minutes * 60 * 1000;
        var fromTicks = to.getTime() - milliseconds;

        from.setTime(fromTicks);

        var fromString = scn.formatDateTimeForRequest(from);
        var toString = scn.formatDateTimeForRequest(to);

        return { from: fromString, to: toString };
    },

    gameplay.getThrowClass = function (pinArray, position) {
        var twoRaisedPosition = Math.pow(2, position);

        if ((pinArray & twoRaisedPosition) == twoRaisedPosition) {
            return 'ball';
        } else {
            return 'ball downed';
        }
    },

    gameplay.isStrike = function (pinArray) {
        return pinArray == 0;
    }

    gameplay.frameTap = function () {
        var elm = jQuery(this.element);

        var templateParent = elm.parents("[data-template='Scores']:first");
        if (templateParent && templateParent.attr("data-scores-manual-input") === "true") {
            var elmParent = elm.parent();
            var frame = parseInt(elmParent.attr("data-frame"));

            var game = ko.dataFor(elmParent.get(0));

            scn.popup.show("ManualInputPopup", {
                viewModel: {
                    frameNumber: frame,
                    game: game
                }
            });
        }
        else {
            var tapOrder = parseInt(elm.attr("data-taporder"));

            var nextElm = elm.siblings("[data-taporder='" + (tapOrder + 1) + "']");
            if (nextElm.length == 0) {
                var nextElm = elm.siblings("[data-taporder='1']");
                if (nextElm.length == 0) {
                    return;
                }
            }

            elm.addClass("hidden");
            nextElm.removeClass("hidden");
        }
    },

    gameplay.oldwireFrameTaps = function (elm) {
        var taps = jQuery("[data-taporder]", elm);
        for (var i = 0; i < taps.length; i++) {
            var jqTap = jQuery(taps[i]);
            if (jqTap.is(":visible")) {
                jqTap.attr("data-tapcurrent", true);
            }

            new lt.LightningTouch(taps[i],
                function (e) {
                    var target = jQuery(e.currentTarget);
                    var targetTapOrder = target.data("taporder");

                    var next;
                    var first;

                    var siblingTaps = target.siblings("[data-tapenabled]");
                    for (var i = 0; i < siblingTaps.length; i++) {
                        var siblingTap = jQuery(siblingTaps[i]);
                        var siblingTapOrder = siblingTap.attr("data-taporder");
                        if (siblingTapOrder > targetTapOrder && (!next || siblingTapOrder < next.attr("data-taporder"))) {
                            next = siblingTap;
                        } else if (siblingTapOrder == 1) {
                            first = siblingTap;
                        }
                    }

                    if (!next) {
                        next = first;
                    }

                    if (next) {
                        if (!next.attr("data-moving") && !target.attr("data-moving")) {
                            next.attr("data-moving", true);
                            target.attr("data-moving", true);

                            next.attr("data-tapcurrent", true);
                            target.removeAttr("data-tapcurrent");

                            next.show();
                            target.data("linked", next);
                            next.removeAttr("data-moving");

                            target.slideUp({
                                complete: function () {
                                    jQuery(this).removeAttr("data-moving");
                                }
                            });
                        }
                    }
                },
                "tap");
        }
    },

    gameplay.formatAddress = function (address) {
        var str = "";
        if (address.addressLine1) {
            str += address.addressLine1;
        }
        if (address.addressLine2) {
            str += "<br />" + address.addressLine2;
        }
        if (address.city) {
            str += "<br />" + address.city;
        }

        return str;
    },

    showFacebookError = function (jqXhr) {
        if (jqXhr.status === 409) {
            // user has already posted the message, can't post a dupe
            alert("You cannot post the same message twice in a row to Facebook. Please try again after you have posted a different message at least once!", { title: "Sorry!" });
        } else {
            alert("An error occurred posting to Facebook.  Please try again later!", { title: "Sorry!" });
        }
    },

    gameplay.postScoresToFacebook = function (bowlingGameId) {
        var elm = jQuery(this);

        if (!window.CDV || !window.CDV.FB) {
            alert("Facebook is not currently available on this device.", { title: "Uh oh!" });
            return;
        }

        var facebook = CDV.FB;

        confirm("Are you sure you are want to post your score on your Facebook timeline?", {
            title: "Post to Facebook",
            callback: function (response) {
                if (response === NOTIFICATION_BUTTONS.OK) {
                    scn.showLoading();

                    var endpoint = scn.apiAddress + "social/facebook/bowlinggame/" + bowlingGameId;

                    scn.ajax({
                        url: endpoint,
                        type: "POST",
                        data: { },
                        success: function (data) {
                            scn.hideLoading();
                            alert("Your score was posted to Facebook and you received 5 credits!", { title: "Congratulations!" });
                            scn.views.footer.increaseCredits(5);
                        },
                        error: function (jqXhr, txtStatus) {
                            scn.hideLoading();
                            if (jqXhr.status == 406) {
                                // user needs to authorize the app to post to their wall
                                facebook.login(
                                    { scope: "email, publish_actions" },
                                    function (response) {
                                        console.log("In success method from FB");
                                        if (!response || !response.authResponse) {
                                            console.log("No response from Facebook");
                                            return;
                                        }

                                        // good to go, try it again
                                        scn.showLoading();
                                        scn.ajax({
                                            url: endpoint,
                                            type: "POST",
                                            data: { accessToken: response.authResponse.accessToken },
                                            success: function (data) {
                                                scn.hideLoading();
                                                alert("Your score was posted to Facebook and you received 5 credits!", { title: "Congratulations!" });
                                                scn.views.footer.increaseCredits(5);
                                            },
                                            error: function (jqXhr, txtStatus) {
                                                scn.hideLoading();
                                                showFacebookError(jqXhr);
                                            }
                                        });
                                    },
                                    function () {
                                        console.log("Facebook login cancelled");
                                    });
                            } else {
                                showFacebookError(jqXhr);
                            }
                        }
                    });
                }
            }
        });
    },

    showTwitterError = function (jqXhr) {
        if (jqXhr.status === 409) {
            // user has already posted the message, can't post a dupe
            alert("You cannot post the same message twice in a row to Twitter. Please try again after you have posted a different tweet at least once!", { title: "Sorry!" });
        } else {
            alert("An error occurred posting to Twitter.  Please try again later!", { title: "Sorry!" });
        }
    },

    gameplay.postScoresToTwitter = function (bowlingGameId) {
        var elm = jQuery(this);

        if (!window.twitterWeb) {
            alert("Your device does not support tweeting!");
            return;
        }

        twitterWeb.init(function () {
            var oauthData = twitterWeb.getOAuthData();
            if (oauthData == null  || oauthData.accessTokenKey == "" || oauthData.accessTokenSecret == "") {
                alert("Could not post your Tweet.  Please try again later.");
                twitterWeb.clear();
                return;
            }

            confirm("Are you sure you are want to tweet your score?", {
                title: "Post to Twitter",
                callback: function (response) {
                    if (response === NOTIFICATION_BUTTONS.OK) {
                        scn.showLoading();
                        scn.ajax({
                            url: scn.apiAddress + "social/twitter/bowlinggame/" + bowlingGameId,
                            type: "POST",
                            data: {
                                accessTokenKey: oauthData.accessTokenKey,
                                accessTokenSecret: oauthData.accessTokenSecret
                            },
                            success: function (data) {
                                scn.hideLoading();
                                alert("Your score was posted to Twitter and you received 5 credits!", { title: "Congratulations!" });
                                scn.views.footer.increaseCredits(5);
                            },
                            error: function (jqXhr, txtStatus) {
                                scn.hideLoading();
                                showTwitterError(jqXhr);
                            }
                        });
                    }
                }
            });
        },
        function () {
            alert("Could not post your Tweet.  Please try again later.");
        });
    }
}(window.scn.gameplay = window.scn.gameplay || {}));


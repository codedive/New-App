(function (legal) {
    scn.legal.privacyPolicyUrl = "http://www.xbowling.com/PrivacyPolicy.html",
    scn.legal.termsOfServiceUrl = "http://www.xbowling.com/TermsOfService.html",
    scn.legal.copyrightPolicyUrl = "http://www.xbowling.com/CopyrightPolicy.html",
    scn.legal.challengeRulesUrl = "http://www.xbowling.com/CombinedGameRules.html",
    scn.legal.redemptionRulesUrl = "http://www.xbowling.com/RedemptionRules.html",

    legal.checkChallengeEntry = function (entryCredits) {
        if (entryCredits > 20 && scn.location().regionCode == "LA") {
            alert("In accordance with certain restrictions in Louisiana state law, XBowlers from the great State of Louisiana "
                + "are not able to participate in Challenges requiring more than 20 Credits to enter.  Please choose another " +
                "Challenge. Good luck!",
                { title: "Who would have guessed?" });
            return false;
        }

        return true;
    },

    legal.checkH2HLiveEntry = function (entryCredits) {
        if (entryCredits > 20 && scn.location().regionCode == "LA") {
            alert("In accordance with certain restrictions in Louisiana state law, XBowlers from the great State of Louisiana " 
                + "are not able to participate in Challenges requiring more than 20 Credits to enter.  Please choose another " + 
                "Challenge. Good luck!",
                { title: "Who would have guessed?" });
            return false;
        } else if (entryCredits >= 500 && scn.location().regionCode == "AZ") {
            alert("In accordance with certain restrictions in Arizona state law, XBowlers from the great State of Arizona " 
                + "are not able to enter Challenge Levels 4-6 in H2H Live. Sorry!",
                { title: "Who would have guessed?" });
            return false;
        }

        return true;
    },

    legal.checkH2HPostedEntry = function (entryCredits) {
        if (entryCredits > 20 && scn.location().regionCode == "LA") {
            alert("In accordance with certain restrictions in Louisiana state law, XBowlers from the great State of "
                + "Louisiana are not able to participate in Challenges requiring more than 20 Credits to enter.  Please "
                + "choose another Challenge. Good luck!",
                { title: "Who would have guessed?" });
            return false;
        } else if (entryCredits >= 500 && scn.location().regionCode == "AZ") {
            alert("In accordance with certain restrictions in Arizona state law, XBowlers from the great State of Arizona "
                + "are not able to enter Challenge Levels 5-6 in H2H Posted. Please select a lower Level for your H2H Challenge "
                + "and good luck!",
                { title: "Who would have guessed?" });
            return false;
        }

        return true;
    },

    legal.checkRedemption = function (redemptionPoints) {
        if (scn.location().countryCode == "US") {
            if (redemptionPoints > 110000 && scn.location().regionCode == "AZ") {
                alert("In accordance with certain restrictions in Arizona state law, XBowlers from the great State of Arizona "
                    + "are not allowed to redeem SCN Reward Points for any single prize with a value in excess of 110,000 Points.  "
                    + "Please adjust your seletions accordingly.  Happy shopping!",
                    { title: "Who would have guessed?" });
                return false;
            } else if (["AK", "HI", "VT"].indexOf(scn.location().regionCode) > -1) {
                alert("For regulatory reasons, we are currently not able to allow the redemption of SCN Reward Points for prizes in "
                            + scn.location().regionName + " to XBowlers accessing our service from within that State.  "
                            + "We have noted your request and will contact you if/when XBowling begins offering the "
                            + "redemption opportunity within the State of " + scn.location().regionName + ".",
                            { title: "We apologize!" });
                return false;
            } else if (["MT", "SC", "NJ", "TN", "WA", "SD", "NH"].indexOf(scn.location().regionCode) > -1) {
                alert("For regulatory reasons, we are currently not able to allow the "
                    + "redemption of SCN Reward Points for prizes in your state.  We are working with regulatory authorities "
                    + "so we can provide you with this feature, although there is no guarantee that we will be able to do so.  "
                    + "We will notify you as soon as this option is available in your state.  In the meantime, please enjoy XBowling!",
                    { title: "We apologize!" });
                return false;
            }
        } else {
            alert("We currently offer our prize redemption capability only in the United States.  An expanded international redemption program is coming soon!  Keep playing and winning!",
                { title: "We apologize!" });
            return false;
        }

        var device = scn.device.toLowerCase();
        if (device.indexOf("iphone") == -1 && device.indexOf("ipad") == -1 && device.indexOf("ipod") == -1 && device.indexOf("ios") == -1) {
            alert("Due to Android regulations, XBowling does not provide the capability to redeem points for prizes to XBowlers "
                  + "accessing our service on an Android device.  Please visit www.xbowling.com to redeem your points for prizes.",
                { title: "Uh oh!" });
            return false;
        }

        return true;
    },

    legal.checkBeforeShowingChallenges = function () {
        if (scn.location().countryCode === "US") {
            if (["AK", "HI", "VT"].indexOf(scn.location().regionCode) > -1) {
                alert("In accordance with certain restrictions in " + scn.location().regionName + " state law,  XBowling is not able "
                    + "to offer redemption of SCN Reward Points for prizes in your State at this time.  Please consider this when "
                    + "selecting your Challenges.  Even without prizes, XBowling is so much fun! Scroll through the \"Select Challenge\" "
                    + "screen to see your Challenge options or XBowl for free and earn points towards leaderboard status!",
                    { title: "Who would have guessed?" });
            } else if (["MT", "SC", "NJ", "TN", "WA", "SD", "NH"].indexOf(scn.location().regionCode) > -1) {
                alert("For regulatory reasons, we are currently not able to allow the "
                    + "redemption of SCN Reward Points for prizes in your state.  We are working with regulatory authorities "
                    + "so we can provide you with this feature, although there is no guarantee that we will be able to do so.  "
                    + "We will notify you as soon as this option is available in your state.",
                    { title: "We apologize for the inconvenience!" });
            }
        } else {
            alert("We currently offer our prize redemption capability only in the United States.  An expanded international redemption program is coming soon!  Keep playing and winning!");
        }

        return true;
    },

    legal.canEnterTurkeyChallenge = function () {
        // only available to players in the US not in 11 restricted states
        if (scn.location().countryCode == "US"
            && scn.location().regionCode != ""
            && ["AK", "HI", "VT", "MT", "SC", "NJ", "TN", "WA", "SD", "NH"].indexOf(scn.location().regionCode) == -1) {
            return true;
        }

        return false;
    }
}(window.scn.legal= window.scn.legal || {}));
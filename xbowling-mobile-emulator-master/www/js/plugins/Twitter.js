// Modified from: http://oodlestechnologies.com/blogs/Twitter-integration-on-PhoneGap-using-ChildBrowser-and-OAuth-for-iOS-and-Android-Platforms

(function (twitter) {
    oauth = null, // It Holds the oAuth data request
    requestParams = null, // Specific param related to request
    options = {
        consumerKey: 'RaFBvISkU97o0Bhke3RA', // YOUR Twitter CONSUMER_KEY
        consumerSecret: 'Cp2oH24xzHZTfKHDLZZtKwcAsKw0D4iX4cs2Dm1pGE', // YOUR Twitter CONSUMER_SECRET
        callbackUrl: scn.mobileAddress + "oauth-app-return.html" 
    },
    twitterKey = "twtrKey", // This key is used for storing Information related
    childBrowser = null, // child browser plugin instance
    successCb = null,
    failureCb = null,

    twitter.init = function(successCallback, failureCallback){
        successCb = successCallback;
        failureCb = failureCallback;
 
        //childBrowser = window.plugins.childBrowser;
        
        // Apps storedAccessData , Apps Data in Raw format
        var storedAccessData, rawData = localStorage.getItem(twitterKey);
        // here we are going to check whether the data about user is already with us.
        if(rawData !== null) {
            // when App already knows data
            storedAccessData = JSON.parse(rawData); //JSON parsing
            
            options.accessTokenKey = storedAccessData.accessTokenKey; // data will be saved when user first time signin
            //options.accessTokenSecret = storedAccessData.accessTokenSecret; // data will be saved when user first first signin
            
            // javascript OAuth take care of everything for app we need to provide just the options
            oauth = OAuth(options);
            oauth.get(
                'https://api.twitter.com/1.1/account/verify_credentials.json?skip_status=true',
                function(data) {
                    var entry = JSON.parse(data.text);
                    console.log("USERNAME: " + entry.screen_name);
                  
                    if (successCallback) {
                        successCallback(entry);
                    }
                },
                function(data) {
                    alert("An error occurred connecting to Twitter.  Please try again later.");
                    console.log("ERROR: "+ data.text);
                });
        } else {
            // we have no data for save user
            oauth = OAuth(options);
            oauth.get(
                'https://api.twitter.com/oauth/request_token',
                function(data) {
                    requestParams = data.text;
                    childBrowser = window.open("https://api.twitter.com/oauth/authorize?"+data.text, "_blank", "location=no");
                    childBrowser.addEventListener("loadstart", success);
                    //childBrowser.showWebPage('https://api.twitter.com/oauth/authorize?'+data.text); // This opens the Twitter authorization / sign in page
                    //childBrowser.onLocationChange = success; // Here will will track the change in URL of ChildBrowser
                },
                function(data) {
                    alert("An error occurred connecting to Twitter.  Please try again later.");
                    console.log("ERROR: "+ data.text);
                });
        }
    },

    /*
     When ChildBrowser's URL changes we will track it here.
     We will also be acknowledged was the request is a successful or unsuccessful
     */
    success = function(e){
         
        // Here the URL of supplied callback will Load
        /*
         Here Plugin will check whether the callback Url matches with the given Url
         */
        if (e.url.indexOf(options.callbackUrl) >= 0) {
             
            // Parse the returned URL
            var index, verifier = '';
            var denied = false;
            var params = e.url.substr(e.url.indexOf('?') + 1);
             
            params = params.split('&');
            for (var i = 0; i < params.length; i++) {
                var y = params[i].split('=');
                if(y[0] === 'oauth_verifier') {
                    verifier = y[1];
                } else if (y[0] === 'denied') {
                    denied = true;
                    break;
                }
            }
 
            // user cancelled twitter login process
            if (denied) {
                //window.plugins.childBrowser.close();
                childBrowser.close();
                childBrowser = null;
                return;
            }
 
            // Here we are going to change token for request with token for access
             
            /*
             Once user has authorised us then we have to change the token for request with token of access
            here we will give data to localStorage.
             */
            oauth.get('https://api.twitter.com/oauth/access_token?oauth_verifier='+verifier+'&'+requestParams,
                      function(data) {
                        var accessParams = {};
                        var qvars_tmp = data.text.split('&');
                        for (var i = 0; i < qvars_tmp.length; i++) {
                            var y = qvars_tmp[i].split('=');
                            accessParams[y[0]] = decodeURIComponent(y[1]);
                        }
                       
                        oauth.setAccessToken([accessParams.oauth_token, accessParams.oauth_token_secret]);
                      
                        // Saving token of access in Local_Storage
                        var accessData = {};
                        accessData.accessTokenKey = accessParams.oauth_token;
                        accessData.accessTokenSecret = accessParams.oauth_token_secret;
                      
                        // Configuring Apps LOCAL_STORAGE
                        console.log("TWITTER: Storing token key/secret in localStorage");
                        localStorage.setItem(twitterKey, JSON.stringify(accessData));
                      
                        if (successCb) {
                            successCb(accessParams);
                        }
                      
                        /*oauth.get('https://api.twitter.com/1.1/account/verify_credentials.json?skip_status=true',
                                function(data) {
                                    var entry = JSON.parse(data.text);
                                    console.log("TWITTER USER: "+entry.screen_name);
                                  
                                    if (successCb) {
                                        successCb(entry, accessParams);
                                    }
                                  
                                    // Just for eg.
                                    //app.init();
                                },
                                function(data) {
                                    console.log("ERROR: " + data);
                                  
                                    if (failureCb) {
                                        failureCb(data);
                                    }
                                }
                        );*/
                       
                        // Now we have to close the child browser because everthing goes on track.
                      
                        window.plugins.childBrowser.close();
                      },
                      function(data) {
                        console.log(data);
                      
                        if (failureCb) {
                            failureCb(data);
                        }
                      }
                );
        }
    },

    twitter.tweet = function(tweetText){
        var storedAccessData, rawData = localStorage.getItem(twitterKey);
         
        storedAccessData = JSON.parse(rawData); // Paring Json
        options.accessTokenKey = storedAccessData.accessTokenKey; // it will be saved on first signin
        options.accessTokenSecret = storedAccessData.accessTokenSecret; // it will be save on first login
         
        // javascript OAuth will care of else for app we need to send only the options
        oauth = OAuth(options);
        oauth.get('https://api.twitter.com/1.1/account/verify_credentials.json?skip_status=true',
                  function(data) {
                      var entry = JSON.parse(data.text);
                      Twitter.post(tweetText);
                  }
            );
    },

    /*
     We now have the data to tweet
     */
    post = function(theTweet){
        oauth.post('https://api.twitter.com/1.1/statuses/update.json',
                   { 'status' : theTweet,  // javascript OAuth encodes this
                   'trim_user' : 'true' },
                   function(data) {
                       var entry = JSON.parse(data.text);
                       console.log(entry);
                   
                       // just for eg.
                       done();
                   },
                   function(data) {
                        console.log(data);
                   }
        );
    }

}(window.twitter = window.twitter || {}));
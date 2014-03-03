    (function (bootstrapper) {
        bootstrapper.fileSystem = null,
        bootstrapper.appDirectoryPath = null,
        bootstrapper.displayedCommError = false,
		bootstrapper.chromeEmulator = false,
		
        bootstrapper.onDeviceReady = function() {
            bootstrapper.displayedCommError = false;
     
            window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
            window.PERSISTENT = window.PERSISTENT || LocalFileSystem.PERSISTENT;
     
            var quota = bootstrapper.chromeEmulator ? (50 * 1024 * 1024) : 0; // 50 MB for emulator, not needed with cordova

            if (window.webkitStorageInfo && window.webkitStorageInfo.requestQuota) {
                window.webkitStorageInfo.requestQuota(PERSISTENT, quota, bootstrapper.gotQuota, bootstrapper.fail);
            } else {
                bootstrapper.gotQuota(quota);
            }
        },

        bootstrapper.gotQuota = function (grantedQuota) {
            window.requestFileSystem(PERSISTENT, grantedQuota, bootstrapper.gotFS, bootstrapper.fail);
        },

        bootstrapper.gotFS = function (fileSystem) {
            bootstrapper.fileSystem = fileSystem;

            // ensure apps directory exists
            fileSystem.root.getDirectory("apps", { create: true },
                function (appsDir) {
					// HACK: chrome does not support setMetadata on folders..add it to the object
					// to fake it for the emulator
					if (bootstrapper.chromeEmulator) {
							appsDir.setMetadata = function (success) {
							success.apply(this);
						}
					}
					
                    appsDir.setMetadata(
                        function () {
                            // ensure apps/xbowling directory exists
                            appsDir.getDirectory("xbowling", { create: true },
                                bootstrapper.xbowlingDirectoryCreated,
                                function (error) {
                                    alert("Error creating xbowling directory");
                                }
                            );
                        },
                        function (error) {
                            alert("Error seting metadata for apps directory.");
                        },
                        { "com.apple.MobileBackup": 1});
                },
                function (error) {
                    alert("Error creating apps directory");
                });
            
        },

        bootstrapper.xbowlingDirectoryCreated = function (directory) {
            _loadedSectionCount = 0;
            bootstrapper.appDirectoryPath = directory.toURL();

            // create templates directory
            directory.getDirectory("templates", { create: true },
                function (scripts) { },
                function (error) { console.log("Could not create Templates directory."); });

            // create scripts directory
            directory.getDirectory("scripts", { create: true },
                function (scripts) { },
                function (error) { console.log("Could not create Scripts directory."); });

            // create images directory
            directory.getDirectory("images", { create: true },
                function (images) { },
                function (error) { console.log("Could not create Images directory."); });

            // create styles directory
            directory.getDirectory("styles", { create: true },
                function (styles) { },
                function (error) { console.log("Could not create Styles directory."); });

            // create styles directory
            directory.getDirectory("assets", { create: true },
                function (assets) { },
                function (error) { console.log("Could not create Assets directory."); });

            // open the manifest file
            directory.getFile("manifest", { create: true },
                function (manifestEntry) {
                    manifestEntry.file(function (manifest) {
                        var reader = new FileReader();
                        reader.onerror = function (e) {
                            console.log("onerror");
                        };

                        reader.onloadend = function (e) {
                            console.log("onloadend");
                            
                            var fsManifest = this.result;
                            
                            // need to load the shipped manifest in the app bundle
                            jQuery.ajax({
                                url: "defaultViews/apps/xbowling/manifest",
                                type: "GET",
                                success: function (data) {
                                    var defaultManifestJson = JSON.parse(data);
                      
                                    if (!fsManifest || fsManifest == "") {
                                        // start the process--no local manifest exists
                                        bootstrapper.loadUpdates(directory, defaultManifestJson);
                                    } else {
                                        var existingManifestJson = JSON.parse(fsManifest);
                                        if (existingManifestJson.version < defaultManifestJson.version) {
                                            // app has been updated -- use default manifest
                                            bootstrapper.loadUpdates(directory, defaultManifestJson);
                                        } else {
                                            bootstrapper.loadUpdates(directory, existingManifestJson);
                                        }
                                    }
                                },
                                error: function (jqXhr) {
                                    console.log("error getting default manifest " + jqXhr.status)
                                }
                            });
                            
                        };

                        reader.onabort = function (e) {
                            console.log("onabort");
                        };

                        // read the manifest file
                        reader.readAsText(manifest);
                    }, bootstrapper.fail);
                },
                function (error) { console.log("Could not open manifest file."); });
        },

        bootstrapper.replacePaths = function (toSearch, manifestJson, callback) {
            var imageDirectoryURL = bootstrapper.appDirectoryPath + "/images/";
            
            var imagesCountRegex = /image\([^\)]+\)/g;
            var toReplaceCount = 0;
            while (imagesCountRegex.exec(toSearch)) {
                toReplaceCount++;
            }
   
            if (toReplaceCount == 0) {
                callback(toSearch);
                return;
            }
     
            var imagesRegex = /image\(([^\)]+)\)/g;
            var match;
            var matches = {};
            while (match = imagesRegex.exec(toSearch)) {
                var imageTag = match[0];
                var imageId = match[1];
     
                matches[imageId] = match;
     
                if (imageId) {
                    var image;
                    for (var i = 0; i < manifestJson.images.length; i++) {
                        if (manifestJson.images[i].id == imageId) {
                            image = manifestJson.images[i];
                            break;
                        }
                    }

                    if (image) {
                        if (image.useDefault) {     
                            toSearch = toSearch.replace(matches[imageId][0], "defaultViews/apps/xbowling/images/" + imageId);
     
                            toReplaceCount--;
                            if (toReplaceCount == 0) {
                                callback(toSearch);
                            }
                        } else {
                            toSearch = toSearch.replace(matches[imageId][0], imageDirectoryURL + imageId);
                            
                            toReplaceCount--;
                            if (toReplaceCount == 0) {
                                callback(toSearch);
                            }
                        }
                    } else {
                        console.log("image not found");
                        toReplaceCount--;
                        if (toReplaceCount == 0) {
                            callback(toSearch);
                        }
                    }
                }
            }
     
         
                 
            //toSearch = toSearch.replace(/%ASSETS_PATH%/g, bootstrapper.appDirectoryPath + "/assets/");
            //toSearch = toSearch.replace(/%IMAGES_PATH%/g, bootstrapper.appDirectoryPath + "/images/");
            //return toSearch;
        },

        bootstrapper.loadUpdates = function (directory, manifestJson) {
            directory.getFile(
                "updates.zip",
                { create: true },
                function (fileEntry) {
                    window.navigator.plugins.fileHelper.postAndDownloadResponse(
                        scn.mobileAddress + "app/update",
                        JSON.stringify(manifestJson),
                        fileEntry.fullPath,
                        directory.fullPath,
                        function () {
                            // merge manifest-update file and manifest file
                            directory.getFile("manifest-update",
                                { create: true },
                                function (manifestEntry) {
                                    manifestEntry.file(
                                        function (manifest) {
											var reader = new FileReader();
											reader.onerror = function (e) {
												console.log("onerror");
											};
											
											reader.onloadend = function (e) {
												var updateManifestJson = JSON.parse(this.result);  
												bootstrapper.mergeManifests(updateManifestJson, manifestJson, function (mergedManifestJson) {
                                                    // all updates complete
                                                    bootstrapper.updatesComplete(mergedManifestJson);
												});
											};
											
											reader.readAsText(manifest);
                                        
                                        },
                                        function (error) {
                                            console.log("Error reading updates.");
                                        });
                                },
                                function (error) {
                                    console.log("Could not open update manifest file.");
                                }
                            );
                        },
                        function () {
                            console.log("Error processing updates.");
                            
                            // continue anyway
                            bootstrapper.updatesComplete(manifestJson);
                        }
                    );

                },
                function () {
                    alert("Error creating file");
                });
     
            
        },
     
     bootstrapper.updatesComplete = function (manifestJson) {
        // make the filesystem available to other modules
        window.scn.fileSystem = bootstrapper.fileSystem;
        window.scn.manifest = manifestJson;
        
        console.log("Manifest Set");
        
        bootstrapper.loadTemplatesIntoMemory(manifestJson, function () {
            // bootstrap the scripts
            bootstrapper.bootstrapScripts();
        });
     },
     
     bootstrapper.mergeManifests = function (updateManifestJson, manifestJson, success) {
        console.log("Merging Manifest");
     
        _mergeManifestArray(updateManifestJson.views, manifestJson.views);
        _mergeManifestArray(updateManifestJson.images, manifestJson.images);
        _mergeManifestArray(updateManifestJson.assets, manifestJson.assets);
        _mergeManifestArray(updateManifestJson.scripts, manifestJson.scripts);
        _mergeManifestArray(updateManifestJson.styles, manifestJson.styles);
        _mergeManifestArray(updateManifestJson.templates, manifestJson.templates);
     
        console.log("Manifest Merge Done");


        // re-write the manifest json after all sections have been merged
        bootstrapper.writeFile(
            "apps/xbowling/manifest",
            JSON.stringify(manifestJson),
            function () {
                success.call(null, manifestJson);
            },
            function () {
                alert("An error occurred writing the manifest.");
            }
        );
     },
     
     _mergeManifestArray = function(updateManifestArray, manifestArray) {
        for (var i = 0; i < updateManifestArray.length; i++) {
            var found = false;
            for (var j = 0; j < manifestArray.length; j++) {
                if (manifestArray[j].id == updateManifestArray[i].id) {
                    manifestArray[j].version = updateManifestArray[i].version;
                    manifestArray[j].useDefault = false; // if in update manifest, it has been updated, so don't use default
                    found = true;
                    break;
                }
            }

            if (!found) {
                // new
                var newObj = {
                    id: updateManifestArray[i].id,
                    version: updateManifestArray[i].version,
                    useDefault: false
                };
                manifestArray.push(newObj);
            }
        }

        return manifestArray;
     },
     
     _templateCount = 0,
     _templateLoadComplete = null,
     _onTemplateLoad = function () {
        _templateCount--;
        if (_templateCount <= 0) {
            console.log("Template load complete");
            _templateLoadComplete();
        }
     },
     
     bootstrapper.loadTemplatesIntoMemory = function (manifestJson, complete) {
        _templateCount = manifestJson.templates.length;
        _templateLoadComplete = complete;
     
        for (var i = 0; i < manifestJson.templates.length; i++) {
            if (manifestJson.templates[i].useDefault) {
                var templateId = manifestJson.templates[i].id;
                jQuery.ajax({
					async: false,
                    url: "defaultViews/apps/xbowling/templates/" + templateId,
                    type: "GET",
                    success: function (data) {
                        //console.log("loaded default template " + templateId);
                        window.templates[templateId] = data;
                        _onTemplateLoad();
                    }
                });
            } else {
                bootstrapper.fileSystem.root.getFile(
                    "apps/xbowling/templates/" + manifestJson.templates[i].id,
                    { create: false },
                    function (templateFileEntry) {
                        templateFileEntry.file(function (templateFile) {
                            var templateFileReader = new FileReader();
                            var templateFileName = templateFile.name;

                            templateFileReader.onloadend = function (e) {
                                //console.log("loaded template " + templateFileName);
                                window.templates[templateFileName] = this.result;
                                _onTemplateLoad();
                            };

                            templateFileReader.onerror = function (e) {
                                console.log("Error reading template file");
                                _onTemplateLoad();
                            };

                            templateFileReader.readAsText(templateFile);
                        });

                    });
            }
        }
     },
     
    _writeFile = function (path, contents, fileType, callback) {
            bootstrapper.fileSystem.root.getFile(path,
                { create: true },
                function (fileEntry) {	
                    fileEntry.createWriter(function (writer) {
                        writer.onerror = function (e) {
                            //debugger;
                            console.log("Error writing file: " + e.toString());
                        };

                        writer.onwriteend = function (e) {
                            console.log("Write end " + path);
                            if (!this.truncated) {
                                //debugger;
                                this.truncate(this.position);
                                this.truncated = true;

                                if (callback) {
                                    //debugger;
                                    callback();
                                }
                            }
                            //debugger;
                        };
                                           
                        writer.truncated = false;
                        
						if (bootstrapper.chromeEmulator) {
							var blob = new Blob([contents], { type: fileType });
							writer.write(blob);
						} else {
							writer.write(contents);
						}
						
                    }, bootstrapper.fail);
                }, bootstrapper.fail);
        },

        bootstrapper.writeFile = function (path, contents, callback) {
            _writeFile(path, contents, "text/plain", callback);
        },

        bootstrapper.writeFileFromBase64String = function (path, base64String, fileType, callback) {
            var raw = window.atob(base64String);
            var rawLength = raw.length;
            var array = new ArrayBuffer(rawLength);
            var uint8Array = new Uint8Array(array);
            for (i = 0; i < rawLength; i++) {
                uint8Array[i] = raw.charCodeAt(i);
            }
     
            _writeFile(path, array, fileType, callback);

     
            // TODO
            //_writeFile(path, base64String, fileType, callback);
        },

        bootstrapper.bootstrapScripts = function () {
            var useDefault = false;
            for (var i = 0; i < scn.manifest.views.length; i++) {
                if (scn.manifest.views[i].id == "Layout") {
                    useDefault = scn.manifest.views[i].useDefault;
                    break;
                }
            }

            if (useDefault) {
                jQuery.ajax({
                    url: "defaultViews/apps/xbowling/Layout",
                    type: "GET",
                    success: function (data) {
                        bootstrapper.loadLayout(data);
                    },
                    error: function (jqXhr) {
                        console.log("Error with Layout GET " + jqXhr.status);
                        alert("An error occurred loading the app Layout.  Please try again.");
                    }
                });
            } else {
                // load the Layout file
                bootstrapper.fileSystem.root.getFile(
                    "apps/xbowling/Layout",
                    { create: false },
                    function (fileEntry) {
                        fileEntry.file(function (file) {
                            var reader = new FileReader();
                
                            reader.onerror = function (e) {
                                console.log("Error reading Layout from File System API");
                                alert("An error occurred reading the app Layout.  Please try again.");
                            };

                            reader.onloadend = function (e) {
                                //debugger;
                                bootstrapper.loadLayout(this.result);
                            };
                            //debugger;

                            reader.readAsText(file);
                        });
                    },
                    function (error) {
                        console.log("Error loading Layout entry from File System API");
                        alert("An error occurred loading the app Layout.  Please try again.");
                    });
            }
        },

        _scriptsAndStylesToRender = 0,
        _onScriptOrStyleLoad = function () {
            _scriptsAndStylesToRender--;
            if (_scriptsAndStylesToRender == 0) {
                // bootstrap scripts complete
                bootstrapper.bootstrapScriptsComplete();
            }
        },
     
        bootstrapper.loadLayout = function (layout) {
            console.log("Loading layout...");
     
            var jqBody = jQuery(document.body);
            jqBody.append(jQuery(layout));

            //debugger;

            var styleHash = {};
            for (var i = 0; i < scn.manifest.styles.length; i++) {
                styleHash[scn.manifest.styles[i].id] = scn.manifest.styles[i].useDefault;
            }
     
            var styles = jQuery("body > link");
            var scripts = jQuery("body > script");
            _scriptsAndStylesToRender = styles.length + scripts.length;
     
            if (_scriptsAndStylesToRender == 0) {
                _onScriptOrStyleLoad();
                return;
            }
     
            var head = jQuery(document.head);
            for (var i = 0; i < styles.length; i++) {
                var styleTag = jQuery(styles[i]);
                var href = styleTag.attr("data-href");
                if (href) {
                    var newStyleTag = jQuery("<style />")
                            .attr("type", "text/css")
                            .attr("data-id", href);
                    head.append(newStyleTag);
     
                    if (!styleHash[href]) {
                        // load the Style file
                        bootstrapper.fileSystem.root.getFile(
                            "apps/xbowling/styles/" + href,
                            { create: false },
                            function (fileEntry) {
                                fileEntry.file(function (file) {
                                    jQuery.ajax({
                                        type: "GET",
                                        async: false,
                                        url: fileEntry.toURL(),
                                        data: {},
                                        success: function (rawStyleData) {
                                            
                                            bootstrapper.replacePaths(
                                                rawStyleData,
                                                scn.manifest,
                                                function (styleResult) {
                                                    jQuery("style[data-id='" + file.name + "']").html(styleResult);
                                                    _onScriptOrStyleLoad();
                                                });
                                        },
                                        error: function () {
                                            console.log("Error loading default style.");
                                            _onScriptOrStyleLoad();
                                        }
                                    });
                                });
                            },
                            function (error) {
                                console.log("Error loading style " + href + " from File System API");
                                _onScriptOrStyleLoad();
                            });
                    } else {
                        jQuery.ajax({
                            url: "defaultViews/apps/xbowling/styles/" + href,
                            type: "GET",
                            async: false,
                            success: function (data) {
                                
                                bootstrapper.replacePaths(
                                    data,
                                    scn.manifest,
                                    function (styleResult) {
                                        jQuery("style[data-id='" + href + "']").html(styleResult);
                                        _onScriptOrStyleLoad();
                                    });
                            },
                            error: function (jqXhr) {
                                console.log("Load default style from bundle failed");
                                _onScriptOrStyleLoad();
                            }
                        });
                    }
                } else {
                    // no data-href
                    _onScriptOrStyleLoad();
                }
            }
    
     
     
           var scriptHash = {};
           for (var i = 0; i < scn.manifest.scripts.length; i++) {
                scriptHash[scn.manifest.scripts[i].id] = scn.manifest.scripts[i].useDefault;
           }
     
           for (var i = 0; i < scripts.length; i++) {
               var scriptTag = jQuery(scripts[i]);
               var src = scriptTag.attr("data-src");
               if (src) {
                    var scriptPath = scriptHash[src]
                        ? "defaultViews/apps/xbowling/scripts/"
                        : bootstrapper.appDirectoryPath + "/scripts/";

                   var newScriptTag = jQuery("<script />")
                        .attr("src", scriptPath + src);
               
                       //console.log(newScriptTag.attr("src"));
                       //newScriptTag.insertBefore(scriptTag);
                   head.append(newScriptTag);
     
                    _onScriptOrStyleLoad();
               } else {
                    _onScriptOrStyleLoad();
               }
           }
            
        },
     
        bootstrapper.bootstrapScriptsComplete = function () {
            if (!bootstrapper.chromeEmulator)
                scn.viewEngine.hideSplashScreen(navigator.splashscreen.hide);
     
            // call render in viewengine
            scn.viewEngine.render();
        },

        bootstrapper.fail = function(error) {
            alert("An error occurred.  Please try again.");
        }
    }(window.scn.bootstrapper = window.scn.bootstrapper || {}));

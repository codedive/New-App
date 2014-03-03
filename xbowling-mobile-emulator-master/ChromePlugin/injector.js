
var i = document.createElement("script");
i.src = chrome.extension.getURL("zip/inflate.js");
document.body.appendChild(i);

var d = document.createElement("script");
d.src = chrome.extension.getURL("zip/deflate.js");
document.body.appendChild(d);

var paths = document.createElement("script");
paths.innerHTML = "INFLATE_JS_PATH='" + i.src + "'; DEFLATE_JS_PATH='" + d.src + "';";
document.body.appendChild(paths);

var z = document.createElement("script");
z.src = chrome.extension.getURL("zip/zip.js");
document.body.appendChild(z);

var s = document.createElement("script");
s.src = chrome.extension.getURL("plugin.js");
document.body.appendChild(s);
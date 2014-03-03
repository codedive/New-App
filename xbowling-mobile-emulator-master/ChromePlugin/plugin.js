

var FileHelperPlugin = function () {
}

FileHelperPlugin.prototype.postAndDownloadResponse = function (url, postData, destination, unzipDestination, success, error) {


	var initialized = function(fileSystem) {
	  var xhr = new XMLHttpRequest();
	  xhr.open('POST', url, true);
	  xhr.overrideMimeType('text/plain; charset=x-user-defined'); 
	  xhr.responseType = "arraybuffer"; // Part of XHR 2
	  //Send the proper header information along with the request
	  xhr.setRequestHeader("Content-type", "application/json");
	  //xhr.setRequestHeader("Content-length", postData.length);
	  //xhr.setRequestHeader("Connection", "close");
	  xhr.onreadystatechange = function () {
		if (xhr.readyState == 4) {
		  fileSystem.root.getFile(
			"update.zip", 
			{create: true},
			function(fileEntry) {
				fileEntry.createWriter(function(writer) {  // FileWriter
				  //writer.onprogress = updateStatus; // Again, this is optional
				  writer.onwrite = function(e) { };  // Success callback function
				  writer.onerror = function(e) { };  // Error callback function
				  
				  var blob = new Blob([xhr.response], { type: "application/zip" });
				  //writer.write(blob);
				
				zip.createReader(new zip.BlobReader(blob), function(zipReader) {
					// get entries from the zip file
					zipReader.getEntries(function(entries) {
						_toWrite = entries.length;
					  for (var i = 0; i < entries.length; i++) {
							var entry = entries[i];
							doWrite(fileSystem, entry, success);
					  }
					  
					  zipReader.close();
					});
				  }, onerror);
				//  var bb = new BlobBuilder();
				//  bb.append(xhr.response);
				//  writer.write(bb.getBlob(mimetype)); // The actual writing
				}, 
				function (e) {
					alert(e);
				});
			}); 
		}
	  };
	  xhr.send(postData);
	};

	window.requestFileSystem(
		PERSISTENT,       // persistent vs. temporary storage
		30 * 1024 * 1024,   // size (bytes) of needed space
		initialized,             // success callback
		function () {}          // opt. error callback, denial of access
	  );
}

var _toWrite = 0;
function doWrite(fileSystem, entry, success) {
	entry.getData(new zip.BlobWriter("text/plain"), function(data) {
			// close the reader and calls callback function with uncompressed data as parameter
			//zipReader.close();
			//callback(data);
			//writer.write(data);
			
			fileSystem.root.getFile(
				"apps/xbowling/" + entry.filename, 
				{create: true},
				function(fileEntryToWrite) {
					fileEntryToWrite.createWriter(function (fileWriter) {
						fileWriter.onwrite = function () {
							if (!this.truncated) {
								this.truncated = true;
								this.truncate(this.position);
								
								_toWrite--;
								if (_toWrite <= 0) success();
							}
						
						};
						
						fileWriter.truncated = false;
						fileWriter.write(data);
					});
				});
		  });
}
window.navigator.plugins.fileHelper = new FileHelperPlugin();


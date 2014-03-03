chrome.extension.onMessage.addListener(function(request, sender) { 
  if (request.command == "selected-tab") { 
    chrome.tabs.getSelected(null, function(){
      // your code here
      // var page_url = tab.url etc, etc
	  chrome.tabs.executeScript(
		null,
		{file: 'injector.js'}
	  );
    }
  )} 
});
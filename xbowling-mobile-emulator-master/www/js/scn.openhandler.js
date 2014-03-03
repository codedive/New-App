(function (openHandler) {
	_stack = [],
	
    openHandler.push = function(args) {
    	_stack.push(args);    
    },
    
    openHandler.pop = function() {
    	if (_stack.length == 0) {
    		return false;
    	}
    	
    	var toReturn = _stack.splice(_stack.length - 1, 1)[0];
    	if (toReturn === undefined) {
    		// if argument is undefined, return next non-undefined item
    		return openHandler.pop();
    	} else {
    		return toReturn;
    	}
    },
    
    openHandler.clear = function () {
    	_stack = [];
    }
}(window.scn.openHandler = window.scn.openHandler || {}));

window.handleOpenURL = function (args) {
	scn.openHandler.push(args);
}
class RCGUtils{
    constructor(bMakeGlobals,basePath,customRequireFunction) {
    	var self=this;
		if (!isInNodeJS()){
			window.global=window;
		}
    	self.basePath="./";
		if (isDefined(basePath)){
			self.basePath=basePath;
		}
    	self.arrLibs=[
    		"RCGStringUtils.js",
    		"RCGMathUtils.js",
    		"RCGDateUtils.js",
    		"RCGLogUtils.js",
    		"RCGListUtils.js",
    		"RCGAsyncUtils.js",
    		"RCGChronoUtils.js",
    		"RCGHashMapUtils.js",
//    		"ExcelUtils.js",
    		"RCGDynamicObjectUtils.js"
    	//	,"MongoUtils.js"
    		];
    	if (isInNodeJS()){
    		self.require=require;
    	} else {
	    	if (isDefined(customRequireFunction)){
	    		self.require=customRequireFunction;
	    	} else {
	    		self.require=function(sLibName){
	    			log("Require is no used for "+sLibName);
	    		}
	    	}
/*    		window.require=function(sLibName){
    			self.require(self.basePath+sLibName);
    		}*/
    	}
	}

    loadUtils(bMakeGlobals){
    	var self=this;
    	self.requireLibs(bMakeGlobals,self.arrLibs);
    }
    makeGlobals(bMakeGlobals,obj){
    	if (isUndefined(bMakeGlobals)) return;
    	if (!bMakeGlobals) return;
    	if (isUndefined(obj)) return;
    	makeGlobals(obj);
    }
	requireLib(bMakeGlobals,sNameLib){
    	var self=this;
		console.log(sNameLib);
		var vLib=self.require(sNameLib);
		var obj=new vLib();
		self.makeGlobals(bMakeGlobals,obj);
	}
	
	requireLibs(bMakeGlobals,arrLibs){
    	var self=this;
	    for (var i=0;i<arrLibs.length;i++){
	    	var sNameLib=arrLibs[i];
	    	self.requireLib(bMakeGlobals,sNameLib);
	    }
	}
}

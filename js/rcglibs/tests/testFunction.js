loggerFactory.getLogger().enabled=false;
System.webapp.addStep("Refreshing ...", function(){
    System.webapp.addStep("Refresh de Commit Id for update de report class", function(){
        var antCommitId=System.webapp.github.commitId;
        System.webapp.pushCallback(function(){
           log("commit updated");
           System.webapp.continueTask();
        });
        System.webapp.github.updateLastCommit();
    });
    
    System.webapp.addStep("Dynamic load test class", function(){
    	window["baseDynamicObjectFactory"]=undefined;
    	var arrFiles=[  
					"js/rcglibs/RCGDynamicObjectStorageUtils.js",
        			"js/rcglibs/RCGDynamicObjectUtils.js",
		    		"js/rcglibs/RCGStringArray.js",
				    "js/rcglibs/RCGObjectStorageUtils.js",
				    "js/rcglibs/tests/RCGTest.js"
                     ]; //test
        System.webapp.loadRemoteFiles(arrFiles);
    });
    System.webapp.continueTask();
});

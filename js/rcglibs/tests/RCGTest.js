log("Testing");
debugger;
var storer=new RCGObjectStorageManager("Testing",System.webapp.getTaskManager());
console.log("=====================================");
storer.addStep("Normal Step",function(){
	log("running Normal Step");
	storer.addStep("Global Test",function(){
		storer.addStep("Testing getLabels",function(){
	/*		var jira=System.webapp.getJira();
			storer.addStep("Getting All Project and issuetypes .... ",function(){
				jira.getProjectsAndMetaInfo();
			},0,1,undefined,undefined,undefined,"INNER",undefined
	//		}
			);
			storer.addStep("Getting All field info.... ",function(){
				jira.getFieldsAndSchema();
			},0,1,undefined,undefined,undefined,"INNER",undefined
	//		}
			);
	
			storer.addStep("Getting All Epics  to do a list.... ",function(){
				jira.getAllEpics();
			},0,1,undefined,undefined,undefined,"INNER",undefined
	//		}
			);
			
	
			
			storer.addStep("Getting All Users to do a list.... ",function(){
				jira.getAllUsers();
			},0,1,undefined,undefined,undefined,"INNER",undefined
	//		}
			);
	
			storer.addStep("Getting All Labels.... ",function(){
				jira.getAllLabels()
			},0,1,undefined,undefined,undefined,"INNER",undefined
	//		}
			);
	*/		storer.addStep("Launching all inner threads",function(){
				log("Launching all inner threads");
				storer.continueTask();
			});
			storer.continueTask();
		});
		storer.addStep("Finish getLabels tests",function(){
			log("test ends");
			storer.continueTask();
		});
		storer.continueTask();
	},0,1,undefined,undefined,undefined,"GLOBAL_RUN",undefined);
});
if (false){



storer.addStep("Testing in Global Thread", function(){

/*
var stepper=System.webapp;
stepper.addStep("Parallelizing test",function(result){
	//walkAsync(sName,callNode,callEnd,callBlockPercent,callBlockTime,secsLoop,hsOtherParams,barrier){
	var fncCall=function(theKey){
		log("Calling "+theKey);
		stepper.addStep("Call"+theKey,function(){
			log("Step of call "+theKey);
			var fncAsyncCall=stepper.createManagedCallback(function(){
				log("Calling async "+theKey);
				stepper.continueTask();
			});
			setTimeout(fncAsyncCall,Math.random()*2000);
		})
		stepper.continueTask();
	};
	var fncProcess=function(theKey){
		log("Processing... "+theKey);
		stepper.addStep("Processing",function(){
			var fncAsync=stepper.createManagedCallback(function(){
				log("Processing async "+theKey);
				stepper.continueTask();
			});
			setTimeout(fncAsync,Math.random()*2000);
		});
	};
	var arrTest=[];
	for (var i=0;i<20;i++){
		arrTest.push("Key"+i);
	}
	stepper.parallelizeCalls(arrTest,fncCall,fncProcess,5);
});
*/
/*System.webapp.addStep("String",function(){
	storer.save("testString","String to save");
});
System.webapp.addStep("String",function(){
	storer.load("testString",function(result){
		log(result);
	});
});

System.webapp.addStep("Float",function(){
	storer.save("testFloat",3.5);
});
System.webapp.addStep("Float",function(){
	storer.load("testFloat",function(result){
		log(result);
	});
});
System.webapp.addStep("Array",function(){
	storer.save("testArray",["a","b",5,32]);
});
System.webapp.addStep("Array",function(){
	storer.load("testArray",function(result){
		log(result);
	});
});

System.webapp.addStep("Object",function(){
	var auxObj={attString:"String to save",attFloat:6.2,attArray:["a","b",9,8,"z"]}
	storer.save("testObject",auxObj);
});
System.webapp.addStep("Object",function(){
	storer.load("testObject",function(result){
		log("End Load Obj:"+result);
	});
});

System.webapp.addStep("Dynamic Object",function(){
	var dynObj=newDynamicObjectFactory(
			[{name:"TestStringList",description:"One String List",type:"String"},
			]
			,
			["TestOneString"
			]
			,
			[]
			,
			//undefined 
			"DynamicObjectTest"
			,true
			);
	var auxObj=dynObj.new("Test DynObj");
	auxObj.setTestOneString("Tested String Values");
	auxObj.addTestStringList("One Value for String List");
	auxObj.addTestStringList("Second Value for String List");
	storer.addStep("Save to Storage",function(){
		storer.save("testObject",auxObj);
	});
	storer.addStep("Unlock and store by factory",function(){
		auxObj.unlock();
		auxObj.getFactory().storeManager.saveAllUnlocked();
	});
	storer.continueTask();
});
System.webapp.addStep("Dynamic Object",function(){
	storer.addStep("Loading object testObject",function(){
		storer.load("testObject",function(result){
			log("End Load Dynamic Object:"+result);
			result.fullLoad();
		});
	})
	storer.addStep("Full loaded",function(dynObj){
		log("Full loaded:"+ dynObj.getId());
		storer.continueTask();
	});
	storer.continueTask();
});
*/

System.webapp.addStep("Dynamic Object With Childs",function(){
	var dynObj=newDynamicObjectFactory(
			[{name:"TestStringList",description:"One String List",type:"String"},
			 {name:"Child",description:"List of DynObjs",type:"object"},
			]
			,
			["TestOneString"
			]
			,
			[]
			,
			//undefined 
			"DynamicObjectWithChildsTest",
			true
			);
	dynObj.storeManager.cacheItemsMax=1000;
	dynObj.storeManager.enableAutoSave();
	var auxObj=dynObj.new("Test DynObj");
	auxObj.setTestOneString("Tested String Values");
	auxObj.addTestStringList("One Value for String List");
	auxObj.addTestStringList("Second Value for String List");
	var nTotalChilds=15000;
	console.log("Start the creation process ("+nTotalChilds+") "+getMemStatus());
	debugger;
	storer.addStep("Filling a lot ( "+nTotalChilds+" ) of childs",function(){
		var nChilds=0;
		var fncSave=function(childNum){
			if (dynObj.storeManager.isFlushInactivesNeeded()){
				storer.addStep("Save All in "+childNum,function(){
//					console.log("Saving All ("+childNum+"/"+nTotalChilds+") "+getMemStatus());
					auxObj.getFactory().storeManager.saveAllUnlocked();
				});
			}
		};
		var fncCreateChild=function(childNum){
			storer.addStep("Creating child "+childNum,function(){
				var childObj=dynObj.new("ChildDynObj_"+childNum,"Child_"+childNum);
				childObj.setTestOneString(childNum+"Tested String Values");
				for (var i=0;i<1000;i++){
					childObj.addTestStringList(childNum+"_"+i+" Value for String List ");
				}
				childObj.unlock();
				auxObj.addChild(childObj,childObj.getId());
				nChilds++;
				storer.continueTask();
			});
			storer.addStep("Wait if storer is saving",function(){
				dynObj.storeManager.waitFinishSave();
			});
			storer.continueTask();
		};
		storer.parallelizeCalls(nTotalChilds,fncCreateChild,undefined /*fncSave*/,5);
	});
	storer.addStep("Saving the rest of childs",function(){
		dynObj.storeManager.disableAutoSave();
		if (dynObj.storeManager.isFlushInactivesNeeded()){
			console.log("Saving All the rest of "+nTotalChilds+ " "+getMemStatus());							  
			auxObj.getFactory().storeManager.saveAllUnlocked();
		} else {
			console.log("NOT Saving All the rest of "+nTotalChilds+ " "+getMemStatus());							 
			storer.continueTask();
		}
	});
	storer.addStep("Saving the Object",function(){
		console.log("End of creationg process "+getMemStatus());				  
		storer.save("testObjectWithChilds",auxObj);
	});
	storer.continueTask();
});
System.webapp.addStep("Dynamic Object With Childs",function(){
	console.log("Init of load process "+getMemStatus());				  
	storer.addStep("Load the root object",function(){
		storer.load("testObjectWithChilds");
	});
	storer.addStep("Unlock and store by factory",function(auxObj){
		storer.addStep("Saving all dynobjs",function(){
			auxObj.unlock();
			if (auxObj.getFactory().storeManager.isFlushInactivesNeeded()){
				console.log("Saving all inactive dynobjs "+getMemStatus());				  
				auxObj.getFactory().storeManager.saveAllUnlocked();
			} else {
				console.log("NOT Saving all inactive dynobjs "+getMemStatus());				  
				storer.continueTask();
			}
		});
		storer.addStep("Continuing the test",function(){
			log("All unlocked saved... now full load " + auxObj.getId());
			auxObj.fullLoad();
			storer.continueTask([auxObj]);
		});
		storer.continueTask();
	});
	storer.addStep("Parallelize the full load test",function(result){
		debugger;
		var fncLoaded=function(oneChild){
			log("Full loaded "+oneChild.getId()
					+" value test:"+oneChild.getTestOneString()
					+" active Objects:"+oneChild.getFactory().storeManager.countActiveObjects()
					+" inactive Objects:"+oneChild.getFactory().storeManager.countInactiveObjects()
					);
			oneChild.change(); // to force save
			oneChild.unlock();
			log("Full loaded "+oneChild.getId() + " Unlocked!"
					+" value test:"+oneChild.getTestOneString()
					+" active Objects:"+oneChild.getFactory().storeManager.countActiveObjects()
					+" inactive Objects:"+oneChild.getFactory().storeManager.countInactiveObjects()
					);
			//storer.continueTask();
		};
		var fncLoad=function(oneChild){
			log("Trying to Full loaded "+oneChild.getId()+" value test:"+oneChild.getTestOneString());
			oneChild.fullLoad();
			storer.continueTask();
		};
		storer.parallelizeCalls(result.getChilds(),fncLoad,fncLoaded,5);
	});
	storer.addStep("Finished the child list tests",function(){
		console.log("Finished the child list tests "+getMemStatus());				  
		log("Finished the child list tests");
		storer.continueTask();
	});
	storer.continueTask();
});

/*
System.webapp.addStep("Dynamic Object List",function(){
	var dynObj=newDynamicObjectFactory(
			[{name:"TestStringList",description:"One String List",type:"String"},
			]
			,
			["TestOneString"
			]
			,
			[]
			,
			//undefined 
			"DynamicObjectListTest"
			, true
			);
	var hsAux=newHashMap();
	storer.addStep("Creating a lot of objects",function(){
		var fncUnlock=function(oneChild){
			oneChild.unlock();
			//storer.continueTask();
		};
		var fncCreate=function(nIndex){
			var auxObj=dynObj.new(nIndex+"Test DynObj"+dynObj.list.length());
			var key=auxObj.getId();
			auxObj.setTestOneString(nIndex+ " - " +key+" - Tested String Values");
			auxObj.addTestStringList(nIndex+ " - " +key + " - One Value for String List");
			auxObj.addTestStringList(nIndex+ " - " +key + " - Second Value for String List");
			hsAux.push(auxObj);
		};
		storer.parallelizeCalls(20,fncCreate,fncUnlock,5);
	});
	storer.save("testDynObjectList",hsAux);
});
System.webapp.addStep("Dynamic Object List",function(){
	storer.load("testDynObjectList",function(result){
		log("End Load Dynamic Object List:"+result);
	});
});




System.webapp.addStep("hashMap",function(){
	var fncCreateHashMap=function(iDeepMax){
		var hsAux=newHashMap();
		hsAux.autoSwing=false;
		if (iDeepMax<0) return hsAux;
		for (var i=0;i<10;i++){
			var vRnd=(Math.random()*100);
			var vKey=Math.round(vRnd/10);
			if (vRnd<10){
				hsAux.add("Key"+vKey,"aa"+vRnd);
			} else if (vRnd<40){
				hsAux.add("Key"+vKey,vRnd.toFixed(5));			
			} else if (vRnd<80){
				var auxObj={attString:"String to save "+vRnd,
								attFloat:vRnd
								,attArray:["a"+vRnd,"b"+vRnd,1000+vRnd,8000+vRnd,"z"+vRnd]
								,attHashMap:fncCreateHashMap(iDeepMax-1)
							}
				hsAux.add("Key"+vKey,auxObj);			
			} else {
				hsAux.add("Key"+vKey,fncCreateHashMap(iDeepMax-1));			
			}
		}
		hsAux.autoSwing=true;
		hsAux.swing();
		return hsAux;
	}
	var hsAux=fncCreateHashMap(3);
	System.webapp.addStep("Saving hashMap",function(){
		storer.save("testHashMap",hsAux);
	});
	System.webapp.continueTask();
});

System.webapp.addStep("HashMap",function(){
	storer.load("testHashMap",function(result){
		log("End Load HashMap:"+result);
	});
});
*/
System.webapp.addStep("End Save and Load tests",function(){
	log("End Save and Load tests");
	console.log("End all tests "+getMemStatus());				  
	System.webapp.continueTask();
});

storer.continueTask(); 
},0,1,undefined,undefined,undefined,"GLOBAL_RUN",undefined);
}
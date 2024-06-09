var RCGDynamicObjectStorage=class RCGDynamicObjectStorage{
	constructor(theFactory){
		var self=this;
		self.timeReading=0;
		self.timeWritting=0;
		self.isSavingInactives=false;
		self.savingSemaphore=new RCGSemaphore(function(){return (!self.isSavingInactives);});
		self.concurrentSaveActionsMax=5;
		self.cacheItemsMax=0;
		self.peakMax=0.10;
		self.factory=theFactory;
		self.storer=new RCGObjectStorageManager(self.factory.name,System.webapp.getTaskManager());
		self.storerJson=new RCGObjectStorageManager(self.factory.name+"_json",System.webapp.getTaskManager());
		self.activeObjects=newHashMap();
		self.inactiveObjects=newHashMap();
		self.inactiveUnchangedObjects=newHashMap();
		self.withAutoSave=false;
//		self.lastAutoSavePeriod=1000;
		self.autoSaveSemaphore=new RCGSemaphore(function(){return (self.needsAutoSave());});
	}
	freeMemory(){
		var self=this;
		log("Freeing Dynamic Storage Object "+
				" Active:"+self.activeObjects.length()+
				" Inactive Changed:"+self.inactiveObjects.length()+
				" Inactive Unchanged:"+self.inactiveUnchangedObjects.length()+
				" Semaphored Tasks:"+self.savingSemaphore.taskWaiting.length
				);
		self.activeObjects.clear();
		self.inactiveObjects.clear();
		self.inactiveUnchangedObjects.clear();
		self.savingSemaphore.taskWaiting.length=0;
	}
	enableAutoSave(){
		var self=this;
		self.withAutoSave=true;
	}
	disableAutoSave(){
		this.withAutoSave=false;
	}
	needsAutoSave(){
		var self=this;
		return ((!self.isSavingInactives)&&(self.isFlushInactivesNeeded()));
	}
	countActiveObjects(){
		return this.activeObjects.length();
	}
	countInactiveObjects(){
		return this.inactiveObjects.length()+this.inactiveUnchangedObjects.length();
	}
	countInactiveUnchangedObjects(){
		return this.inactiveUnchangedObjects.length();
	}
	reserve(dynObj){
		var self=this;
		var key=dynObj.getId();
		if (self.inactiveObjects.exists(key)){
			self.inactiveObjects.remove(key);
		}
		if (self.inactiveUnchangedObjects.exists(key)){
			self.inactiveUnchangedObjects.remove(key);
		}
		if (!self.activeObjects.exists(key)){
			self.activeObjects.add(key,dynObj);
		}
	}
	release(dynObj){
		var self=this;
		var storer=self.storer;
		var key=dynObj.getId();
		if (self.activeObjects.exists(key)){
			self.activeObjects.remove(key);
		}
		if (dynObj.isChanged()){
			if (!self.inactiveObjects.exists(key)){
				self.inactiveObjects.add(key,dynObj);
			}
		} else {
			if (!self.inactiveUnchangedObjects.exists(key)){
				self.inactiveUnchangedObjects.add(key,dynObj);
			}
		}
		if (self.needsAutoSave()){
			log("key:"+key+" launch autosaving");
			self.isSavingInactives=true;
			var timeWritting=(new Date()).getTime();

			storer.addStep("Dynamic "+self.factory.name+" AutoSave", function(){
				storer.addStep("Autosaving",function(){
					//debugger;
					if (self.isFlushInactivesNeeded()){
						console.log("Saving "+self.countInactiveObjects()
										+" of "+self.countActiveObjects()
										+ "/"+self.factory.list.length()
										+ ". "+getMemStatus());							  
						storer.addStep("Saving....",function(){
							return self.saveAllUnlocked();
						});
					} else {
						console.log("Saving....Some objects are changed and now is not necesary to save all");
					}
					storer.addStep("Saved....",function(){
						var tNow=(new Date()).getTime();
						var tDiff=(tNow-timeWritting)/1000;
						self.timeWritting+=tDiff;
						console.log("Saved... freeing the semaphore.. actual situation "+self.countInactiveObjects()
								+" of "+self.countActiveObjects()
								+ "/"+self.factory.list.length()
								+ ". "
								+ "T. Reading:"+self.timeReading.toFixed(2)+" s"+" T. Writting:"+self.timeWritting.toFixed(2)+" s. "
								+getMemStatus());							  
						self.savingSemaphore.open();
						self.isSavingInactives=false;

					});
				});
	        },0,1,undefined,undefined,undefined,"GLOBAL_RUN",undefined);
		}
	}
	getStorageObject(dynObj){
		var self=this; //self is an individual object
		var objResult={};
		objResult.key=dynObj.id;
		objResult.name=dynObj.name;
		self.factory.attrTypes.walk(function(value,deep,key){
			var attrName=key;
			var attrType=value.type;
			if (attrType=="Value"){
				if (isDefined(dynObj["get"+attrName])){
					objResult[attrName]=dynObj["get"+attrName]();
				}
			} else if(attrType=="List") {
				var compObj={};
				var bWithCompObj=false;
				if (isDefined(dynObj["get"+attrName+"s"])){
					compObj["list"]=dynObj["get"+attrName+"s"]();
					bWithCompObj=true;
				}
				if (isDefined(dynObj["getListParents"+attrName])){
					compObj["parents"]=dynObj["getListParents"+attrName]();
					bWithCompObj=true;
				}
				if (bWithCompObj){
					objResult[attrName]=compObj;
				}
			} 
/*			var attrName=key;
			var attrType=value.type;
			if (attrType=="Value"){
				objResult[attrName]=self.storer.getStorageObject(dynObj["get"+attrName]());
			} else if(attrType=="List") {
				objResult[attrName]=self.storer.getStorageObject(dynObj["get"+attrName+"s"]());
			}
*/		});
		return objResult;
	}
	
	saveToStorage(dynObj){
		var self=this;
		var storer=self.storer;
		if ((!dynObj.isLocked())&&dynObj.isChanged()&&dynObj.isFullyLoaded()){
//			log("Preparing to save:"+dynObj.getId());
			storer.addStep("Saving to storage "+self.factory.name +"/"+dynObj.getId(),function(){
//				log("Saving to storage:"+dynObj.getId());
				dynObj.clearChanges();
				return storer.save(dynObj.getId(),self.getStorageObject(dynObj));
			});
			storer.addStep("Item Saved "+self.factory.name +"/"+dynObj.getId(),function(key){
//				log("Item Saved:"+dynObj.getId()+" vs "+key);
				dynObj.setStored(true);
				/*if (isUndefined(key)){
					//debugger;
				}*/
			});
/*		} else {
			log("The object "+dynObj.getId() 
					+" not is locked:"+(!dynObj.isLocked())
					+" and is changed:"+dynObj.isChanged()
					+" and is Fully Loaded:"+dynObj.isFullyLoaded());
			*/
		}
	}
	waitFinishSave(){
		var self=this;
		var storer=self.storer;
		return self.savingSemaphore.taskArrived(storer.getRunningTask());
	}
	saveAllNotStored(){
		var self=this;
		var storer=self.storer;
		var fncSaveAction=function(dynObj){
			if (dynObj.isFullyLoaded()&&(!dynObj.stored)){
				storer.addStep("Saving not stored object:"+dynObj.id,function(){
					return storer.save(dynObj.getId(),self.getStorageObject(dynObj));
				});
				storer.addStep("Setting stored:"+dynObj.id,function(){
					return dynObj.setStored(true);
				});
			}
		}
		return storer.parallelizeProcess(self.factory.list,fncSaveAction,self.concurrentSaveActionsMax);
	}
	saveAllUnlocked(){
		var self=this;
		//debugger;
		var storer=self.storer;
		var countInactives=self.countInactiveObjects();
		var countActives=self.countActiveObjects();
		var countSaved=0;
		var countNotNeedSave=0;
		var countRemoved=0;
		var countUnloaded=0;
		storer.addStep("Saving All in a Global pseudothread",function(){
			storer.addStep("Save Inactive objects is Started",function(){
				console.log("Save all inactive objects Started ("
								+"Initial:"+countInactives +"+"+countActives
								+",Total Issues:"+self.factory.list.length()
								+")"+getMemStatus()
								+ " Prev Task:"+storer.getRunningTask().forkId);
			});
			storer.addStep("Remove all inactive Objects ("+countInactives+")",function(){
				console.log("Save and removing inactive objects ("
						+"Initial:"+countInactives +"+"+countActives
						+",Total Issues:"+self.factory.list.length()
						+")"+getMemStatus()
						+ " Prev Task:"+storer.getRunningTask().forkId);
				var fncSaveCall=function(inactiveObject){
					//log("Saving All to Storage:"+inactiveObject.getId());
					if (inactiveObject.isChanged()){
						countSaved++;
						return self.saveToStorage(inactiveObject);
					} else {
						countNotNeedSave++;
					}
				}
				var fncUnloadAndRemove=function(inactiveObject){
					//log("Unload and Remove from inactive objects:"+inactiveObject.getId());
					if (!inactiveObject.isLocked()){
						if (inactiveObject.isFullyLoaded()){
							//log("Unloading :"+inactiveObject.getId());
							inactiveObject.fullUnload();
							countUnloaded++;
						}
						//log("Removing :"+inactiveObject.getId());
						if (self.inactiveObjects.exists(inactiveObject.getId())){
							self.inactiveObjects.remove(inactiveObject.getId());
							countRemoved++;
						}
					} else {
						//log("It´s not in inactive objects:"+inactiveObject.getId());
					}
				}
				return storer.parallelizeCalls(self.inactiveObjects,fncSaveCall,fncUnloadAndRemove,self.concurrentSaveActionsMax);
			});
			storer.addStep("Save Inactive objects is Finished",function(){
				console.log("Saved all inactive objects ("
								+"Initial:"+countInactives
								+",Saved:"+countSaved
								+",Not Saved:"+countNotNeedSave
								+",Removed:"+countRemoved
								+",Unloaded:"+countUnloaded
								+",Total Issues:"+self.factory.list.length()
								+")"+getMemStatus()
								+ " Prev Task:"+storer.getRunningTask().forkId);
			});
        });
	}
	isFlushInactivesNeeded(){
		var self=this;
		var nTotalItems=self.countInactiveObjects()
						+self.countActiveObjects();
		var nTotalPeak=(self.cacheItemsMax*self.peakMax);
		if ((self.cacheItemsMax<nTotalItems)&&(self.countInactiveObjects()>nTotalPeak)){
			var i=0;
			if (self.inactiveUnchangedObjects.length()>0){
				self.inactiveUnchangedObjects.walk(function(dynObj){
					if (dynObj.isFullyLoaded()){
						dynObj.fullUnload();
					}
				})
				self.inactiveUnchangedObjects.clear();
			}
			var nTotalItemsAnt=nTotalItems;
			nTotalItems=self.countInactiveObjects()+self.countActiveObjects();
			var bNeedsSave=((self.cacheItemsMax<nTotalItems)&&(self.countInactiveObjects()>nTotalPeak));
			log("removed "+ (nTotalItemsAnt-nTotalItems)+" now needs to save:"+bNeedsSave);
			return bNeedsSave;
		}
		return false;
	}
	loadFromStorage(dynObj){
		dynObj.lock(); // lock the object to avoid unload before the step executions   
		var self=this;
		var storer=self.storer;
		var objId=dynObj.getId();

/*		if (self.isFlushInactivesNeeded()){
			storer.addStep("Save all unlocked objects",function(){
				self.saveAllUnlocked();
			});
		}
*/		if (dynObj.isFullyLoaded()){
			return dynObj;
		} else {
			var tInitLoading=(new Date()).getTime();
			storer.addStep("Loading from storage "+self.factory.name +"/"+objId,function(){
				//log("Loading from storage:"+objId);
				if (dynObj.isFullyLoaded()){ // prevent a previous load of the object....  
					return dynObj;
				} else {
					return storer.load(objId);
				}
			});
			storer.addStep("Item Loaded"+self.factory.name +"/"+objId,function(storedObj){
				if ((!dynObj.isFullyLoaded())&&(dynObj.isLoading())){ // prevent a previous load of the object....
					storer.addStep("Waiting to load ends",function(){
						if (dynObj.loadingSemaphore===""){
							dynObj.loadingSemaphore=new RCGSemaphore(function(){return (!dynObj.isLoading());});
						}
						return dynObj.loadingSemaphore.taskArrived(storer.getRunningTask());
					});
					storer.addStep("Return the loaded object",function(){
						return dynObj;
					});
				} else if (!dynObj.isFullyLoaded()){ // prevent a previous load of the object....
					dynObj.loading=true;
					var theFactory=self.factory;
					//log("Loaded from storage:"+theFactory.name +"/"+objId);
					storer.addStep("Setting Functions and attributes",function(){
						theFactory.functions.walk(function(value,deep,key){
							dynObj[key]=value;
						});
						theFactory.attrTypes.walk(function(value,deep,key){
								var attrName=key;
								var attrType=value.type;
								var auxValue;
								if (isDefined(storedObj[attrName])){
//									auxValue=storer.processFileObj(storedObj[attrName]);
									auxValue=storedObj[attrName];
								} else {
									auxValue="";
								}
								if (attrType=="Value"){
									dynObj["set"+attrName](auxValue);
								} else if(attrType=="List") {
									var compObj=auxValue;
									if (isDefined(compObj.list)){
										dynObj["set"+attrName+"s"](auxValue.list);
									} else {
										dynObj["set"+attrName+"s"](newHashMap());
									}
									if (isDefined(compObj.parents)){
										dynObj["setListParents"+attrName](auxValue.parents);
									} else {
										dynObj["setListParents"+attrName](newHashMap());
									}
									
								}
						});
					});
					storer.addStep("Setting object attributes and return",function(){
						dynObj.setStored(true);
						dynObj.setFullyLoaded();
						dynObj.clearChanges();
						if (dynObj.loadingSemaphore!==""){
							if (dynObj.loadingSemaphore.countWaitingTasks()>0){
								dynObj.loadingSemaphore.open();
							}
						}
						var tNow=(new Date()).getTime();
						var tDiff=(tNow-tInitLoading)/1000;
						self.timeReading+=tDiff;
						dynObj.loading=false; // this set the semaphore open
						return dynObj;
					})
				}
				return dynObj;
			});
		}
	}
}

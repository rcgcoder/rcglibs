'use strict';
log("Loading object storage utils");
var RCGObjectStorageManager=class RCGObjectStorageManager{
	constructor(basePath,taskManager,fncSave,fncLoad){
		var self=this;
		taskManager.extendObject(self);
		self.basePath=basePath;
		self.onSave=fncSave;
		self.onLoad=fncLoad;
		self.onError=function(error){
			alert("Error writing the object:"+error);
		}
		self.functions=newHashMap();
	}
	setOnSave(fncOnSave){
		this.onSave=fncOnSave;
	}
	setOnLoad(fncOnLoad){
		this.onLoad=fncOnLoad;
	}
	isBaseType(itemType){
		return (itemType=="s")||(itemType=="n")||(itemType=="b");
	}
	jsonReplacer(key,value){
		var self=this;
		if (isMethod(value)) { 
			var objToSave={rcg_type:"m"};
			var sFncFormula=""+value.toString();
			var hash = sha256.create();
			hash.update(sFncFormula);
			var theHash=hash.hex();
			if (!self.functions.exists(theHash)){
				self.functions.add(theHash,value);
			};
			objToSave.value=theHash;
			return objToSave;
		} else if (isHashMap(value)) { 
			var objToSave={rcg_type:"h"};
			if (value.length()>0){
				objToSave.value=[];
				value.walk(function(elem,deep,key){
					objToSave.value.push({key:key,value:elem});
				});
			}
			return objToSave;
		} else if (isDate(value,true)) { 
			var objToSave={rcg_type:"d"};
			objToSave.value=value.getTime();
			//item.saveToStorage(self);
			return objToSave;
		} else if (isObject(value)){
			if (isDefined(value.getStorageObject)){
				if (isDefined(value.getFactory)){
					var objToSave={rcg_type:"fo"};
					objToSave.className=value.constructor.name;
					objToSave.factoryName=value.getFactory().name;
					objToSave.value={key:value.getId()};
					//item.saveToStorage(self);
					return objToSave;
				} else {
					var objToSave={rcg_type:"co"};
					objToSave.className=value.constructor.name;
					objToSave.value=value.getStorageObject(self);
					return objToSave;
				}
			}
		}
		return value;
	}
	jsonReviver(key,value){
		//debugger;
		var self=this;
		if (isNull(value)||(isUndefined(value))) return value;
		var objContent=value;
		var saveType=objContent.rcg_type;
		if (isUndefined(saveType)){
			return value;
		}
		if (saveType=="h"/*"hashmap"*/){
			var objResult=newHashMap();
			if (isDefined(objContent.value)){
				var fncAssignerFunction=function(){
					objResult.autoSwing=false;
					self.sequentialProcess(objContent.value,function(hsElem){
						var key=hsElem.key;
						var hsValue=hsElem.value;
						objResult.add(key,hsValue);
					});
					objResult.autoSwing=true;
					objResult.swing();
				}
				if (objContent.value>100){ // if there are a lot of items in the array..... run the assignment in a step after 
					self.addStep("PostProcessing the assignment of array items to a hashmap",function(){
						fncAssignerFunction();
					});
				} else { // if there are not too much items.... assign them on the fly
					fncAssignerFunction();
				}
			}
			return objResult;
		} else if (saveType=="d" /* date */){
			return new Date(objContent.value);
		} else if (saveType=="co" /* custom object */){
			var objResult=new window[objContent.className]();
			objResult.loadFromStorageObject(objContent.value);
			return objResult;
		} else if (saveType=="fo" /* object with factory */){
			//debugger;
			var factoryName=objContent.factoryName;
			var theFactory=baseDynamicObjectFactory.getFactoryGlobal(factoryName);
			var storedObj=objContent.value;
			var objId=storedObj.key;
			var dynObj=theFactory.getById(objId);
			if (dynObj===""){ // if object not exists in factory.... creates one
				dynObj=theFactory.new(storedObj.name,objId); // the new object is marked as changed and locked
				dynObj.setFullyUnloaded();
				dynObj.clearChanges(); // mark as unchanged
				dynObj.setStored(true);
				dynObj.unlock(); // unlock!
			}
			return dynObj;
		} else if (saveType=="m" /* method */){
			var theHash=objContent.value;
			var theMethod=self.functions.getValue(theHash);
			return theMethod;
		} else if (saveType=="p" /* object part */){
			if (objContent.partNumber==0){
				//debugger;
				var arrContents=new Array(objContent.totalParts);
				arrContents[0]=objContent.content;
				self.addStep("Retrieving other "+(objContent.totalParts-1)+" parts",function(){
					var arrPets=[];
					for (var i=1;i<objContent.totalParts;i++){
						arrPets.push(fsKey+"_part_"+i);
					}
					var fncLoadPart=function(part){
						self.load(part);
					};
					var fncProcessed=function(partId,part){
						arrContents[part.partNumber]=part.content;
					};
					return self.parallelizeCalls(arrPets,fncLoadPart,fncProcessed,5);
				});
				self.addStep("Creating and parsing JSON of "+objContent.totalParts,function(){
					var sJSON=arrContents.saToString();
					var objJson=JSON.parse(sJSON);
					return self.processFileObj(objJson);
				});
				self.addStep("Setting values to Returning Result of "+objContent.totalParts,function(objProcessed){
					return objProcessed;
				});
				return undefined;
			} else {
				return objContent;
			}
		}
	}
	internal_saveFile(key,baseName,contentToSave,onSave,onError){
		var self=this;
		var tm=self.getTaskManager();
		var runningTask=tm.getRunningTask();
		log("Task for "+baseName+" ->"+runningTask.forkId);
		var innerOnSave=self.createManagedCallback(function(e){
			log(baseName+" saved."+contentToSave.length+" bytes."+e.loaded+"/"+e.total);
//			alert("Test:"+baseName);
//			debugger;
			if (isDefined(onSave)){
				return onSave(key);
			} else {
				log(baseName + " Continue Task");
				return key;
			}
		});
		var innerOnError=self.createManagedCallback(function(e){
			logError("Error saving "+baseName+" saved."+contentToSave.length+" bytes."+e);
			debugger;
			if (isDefined(onError)){
				onError(key,e);
			} else {
				return "Error "+e;
			}
	    });
		filesystem.SaveFile(baseName,contentToSave,innerOnSave,innerOnError);
		return self.waitForEvent();
	}
	generateJson(objToSave,fncProgressCallback){
		var self=this;
		var fncReplacer=function(key,value){
			return self.jsonReplacer(key,value);
		};
		var jsonToSave=JSON.stringify(objToSave,fncReplacer);
		return jsonToSave;
	}
	parseJson(sContent){
		var self=this;
		var objContent;
		self.addStep("Parse Json. First Step",function(){
			var fncReviver=self.createManagedFunction(function(key,value){
				return self.jsonReviver(key,value);
			});
			objContent=JSON.parse(sContent,fncReviver);
			return objContent;
		});
		self.addStep("Parse Json. Returning result object.",function(){
			return objContent; 
		});
	}

	save(key,item){
		var self=this;
		var fileToSave="";
		var baseName=self.basePath+"/"+key;
		self.addStep("Saving the object "+key,function(){
			var objToSave=item;
			log("Convert to jason and save item");
			var jsonToSave=self.generateJson(objToSave);
			var totalLength=jsonToSave.length;
			log("Storer save:"+baseName);
			if (totalLength<(7*1024*1024)){
	//			log("Internal saveFile called for:"+baseName);
				return self.internal_saveFile(key,baseName,jsonToSave,self.onSave,self.onError);
			} else {
	//			debugger;
				var arrParts=[];
				var iniPos=0;
				var blockLength=7*1024*1024;
				var endPos=iniPos+blockLength;
				var iCount=0;
				while (iniPos<totalLength){
					arrParts.push({
							    partNumber:arrParts.length,
							    partName:(arrParts.length==0?baseName:baseName+"_part_"+arrParts.length),
							    totalParts:0,
							    iniPos:iniPos,
							    endPos:endPos
								});
					iniPos=endPos;
					endPos+=blockLength;
				}
				arrParts[0].totalParts=arrParts.length;
				self.addStep("Saving Parallelized "+totalLength+" bytes in "+ arrParts.length+" parts",function(){
					var fncSavePart=function(part){
	//					debugger;
	//					log("Parrallel Saving step:"+part.partNumber);
						self.addStep("Save Part:"+part.partNumber,function(){
	//						debugger;
							var contentToSave=jsonToSave.substring(part.iniPos,part.endPos);
							var objPartToSave={type:"p",
												partNumber:part.partNumber,
												totalParts:part.totalParts,
												content:contentToSave};
							var jsonPartToSave=JSON.stringify(objPartToSave);
	//						log("Part:"+part.partNumber+" Key:"+key+" part:"+part.partName+" length:"+jsonPartToSave.length+" ini:"+part.iniPos+" end:"+part.endPos);
							return self.internal_saveFile(key,part.partName,jsonPartToSave,undefined,self.onError);
						});
					}
					var fncProcessed=function(part){
						log("Saved Part:"+part.partNumber+" Key:"+key+" part:"+part.partName+" ini:"+part.iniPos+" end:"+part.endPos);
					}
	//				debugger;
					return self.parallelizeCalls(arrParts,fncSavePart,fncProcessed,5);
				});
				self.addStep("Everithing Saved",function(){
					log("Every Thing is Saved for:"+baseName);
				});
			}
		});
	}
	exists(key){
		var self=this;
		var fileName=(self.basePath+"/"+key);
		filesystem.ReadFile(fileName,
							self.createManagedCallback(function(){return true;}),
							self.createManagedCallback(function(){return false;})
							);
		return self.waitForEvent();
	}
	load(key,fncProcess){
		var self=this;
		var fileName=(self.basePath+"/"+key);
		var innerOnLoad=self.createManagedCallback(function(sContent){
			log("Key:"+key+" loaded."+sContent.length+" bytes");
			self.addStep("Parsing JSON",function(){
//				debugger;
				return self.parseJson(sContent);
			})
/*			self.addStep("Processing content",function(){
				var objProcessed=self.processFileObj(objContent,key);
				return objProcessed;
			});
*/			self.addStep("Returning result",function(objContent){
				var objProcessed=objContent;
				if (isDefined(self.onLoad)){
					self.addStep("Default Defined process result",function(objProcessed){
						return self.onLoad(key,objProcessed);
					});
				} else if (isDefined(fncProcess)){
					self.addStep("User Defined process result",function(objProcessed){
						return fncProcess(objProcessed,key,fileName);
					});
				}
				return objProcessed;
			});
	    });
		var innerOnError=self.createManagedCallback(function(e){
			debugger;
			logError("Error Loading Key:"+key+"."+e);
			if (isDefined(self.onError)){
				self.onError(key,e);
			} else {
				return "Error "+e;
			}
	    });
		filesystem.ReadFile(fileName,innerOnLoad,innerOnError);
		return self.waitForEvent();
	}
}
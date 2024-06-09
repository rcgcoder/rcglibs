'use strict';
var process;
if (isInNodeJS()){
	process = require('process');
}

function getProcessPid(){
	if (typeof process!=="undefined"){
		return process.pid;
	} else {
		return 0;
	}
}

class LoggerFactory{
	constructor(){
		var self=this;
		self.loggers={};
	}
	getLogger(){
	   var self=this;
	   var sPID=getProcessPid();
	   if (isUndefined(self.loggers[sPID])){
		   var newLogger=new RCGLogUtils();
		   newLogger.pid=sPID;
		   self.loggers[sPID]=newLogger;
	   }
	   return self.loggers[sPID];
	}
	removeLogger(){
		var logger=getLogger();
		self.loggers[logger.pid]=vUndefined;
	}
}

class RCGLogUtils{
    constructor() {
    	var self=this;
    	self.logToBuffer=false;
    	self.logBuffers=[];
    	self.logText="";
    	self.bAutoTrace=false;
    	self.fncAutoTrace="";
    	self.enabled=true;
		self.bAlertOnError=false;
    }
	logClear(){
		var self=loggerFactory.getLogger();
		self.logText="";
	}
/*	logUpdate(sCad){
		this.logClear();
		this.log(sCad);	
		var areaLog=$("#log");
		areaLog.val(logText);
		if(areaLog.length){
	       areaLog.scrollTop(areaLog[0].scrollHeight - areaLog.height());
		}
	}
	function fncAutoTrace(){
		var areaLog=$("#log");
		areaLog.val(logText);
		if(areaLog.length){
	       areaLog.scrollTop(areaLog[0].scrollHeight - areaLog.height());
		}
		if (bAutoTrace){
			setTimeout(fncAutoTrace,3000);
		}
	}
	*/
	setAlertOnError(vValue){
		var self=loggerFactory.getLogger();
		self.bAlertOnError=vValue;
	}
	setLogToBuffer(bVal){
		var self=loggerFactory.getLogger();
		self.logToBuffer=bVal;
		if (bVal){
			if (!self.bAutoTrace){
				self.bAutoTrace=true;
				if (self.fncAutoTrace!=""){
					self.fncAutoTrace();
				}
			}
		} else {
			self.bAutoTrace=false;
		}
	}
	logError(sText){
		var self=loggerFactory.getLogger();
		var antEnabled=self.enabled;
		self.enabled=true;
		log(sText);
		if (self.bAlertOnError){
			alert(sText);
			debugger;
		}
		self.enabled=antEnabled;
	}
	log(sText){
		var self=loggerFactory.getLogger();
		if (self.enabled){
			var sFormated=sText;
			if (typeof formatLog!=="undefined"){
				sFormated=formatLog(sText);
			}
			if (self.logToBuffer){
				self.logText+="\n"+sFormated;
			} else {
				console.log(sFormated);
			}
		}
	}
	logPush(){
		var self=loggerFactory.getLogger();
		self.logBuffers.push(self.logText);
		self.logText="";
		self.setLogToBuffer(true);
		self.logToBuffer=true;
	}
	logPop(bNextToBuffer){
		var self=loggerFactory.getLogger();
		var sResult=self.logText;
		self.logText=self.logBuffers.pop();
		if (typeof bNextToBuffer!=="undefined"){
			self.setLogToBuffer(bNextToBuffer);
			if (bNextToBuffer){
				console.log(sResult);
			}
		}
		return sResult;
	}
}
var loggerFactory=new LoggerFactory(); 	
if (isInNodeJS()){
	global.loggerFactory=new LoggerFactory(); 	
}
registerClass(RCGLogUtils);

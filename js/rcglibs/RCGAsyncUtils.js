'use strict';
if (isInNodeJS()){
	var BaseUtils=require("./BaseUtils.js");
	var LogUtils=require("./LogUtils.js");
}
class RCGAsyncUtils_inner_Barrier{
	constructor(callback){
		var self=this;
		self.arrObjects=[];
		self.fncFinishCallback=callback;
	}
	setCallback(newCallback){
		this.fncFinishCallback=newCallback;
	}
	finish(theObject){
		var iInd=0;
		log("Process end " + (isDefined(theObject.name)?":"+theObject.name:"."));
		for (var i=0;i<this.arrObjects.length;i++){
			if (this.arrObjects[i]==theObject){
				if (i > -1) {
					this.arrObjects.splice(i, 1);
					if (this.arrObjects.length==0){
						log("End of processing all objects of the async_inner_barrier.");
						if (isDefined(this.fncFinishCallback)){
							setTimeout(this.fncFinishCallback);
						}
					}
					return;
				}
			}
		}
	}
	start(theObject){
		this.arrObjects.push(theObject);
	}
};

class offlineStepInfo{
	constructor(iIndAct,nPerformance,nDuration,iIndMax,
				sUnits,sPerfTotal,nDurationTotal,nPerc,tEstimated){
		var self=this;
		self.iIndAct=iIndAct;
		self.nPerformance=nPerformance;
		self.nDuration=nDuration;
		self.iIndMax=iIndMax;
		self.sUnits=sUnits;
		self.sPerfTotal=sPerfTotal;
		self.nDurationTotal=nDurationTotal;
		self.nPerc=nPerc;
		self.tEstimated=tEstimated;
	}
	getTrace(){
		var self=this;
		var sCad;
		if (self.iOps>=self.iIndMax){
			sCad="Processing end " + self.sUnits;
		} else {
			sCad="Processing " + self.sUnits;
		}
		sCad+="  "+self.iIndAct + "/"+self.iIndMax +" "+inPercent(self.nPerc)+
			  "  Block:"+ " " +self.nDuration+ " s (" + Math.round(self.nPerformance) + " "+self.sUnits+" /s)"+
			  "  Total:" +self.nDurationTotal+ " s (" + Math.round(self.sPerfTotal) + " "+self.sUnits+" /s)" +
			  "  Time to end:" + self.tEstimated;
		return sCad;
	}
	log(){
		var self=this;
		log(self.getTrace());
	}
}
class offlineProcesor{
	constructor(iIndMin,iIndMax,theFunction,sUnits,callback,callBlock,nSecs,RCGAsyncUtils_inner_Barrier){
		var self=this;
		self.RCGAsyncUtils_inner_Barrier=RCGAsyncUtils_inner_Barrier;
		self.sUnits="ops";
		if (isDefined(sUnits)){
			self.sUnits=sUnits;
		}
		self.callBlock=processOfflineDefaultLog;
		if (isDefined(callBlock)){
			self.callBlock=callBlock;
		}
		self.nSecsLog=3000;
		if (isDefined(nSecs)){
			self.nSecsLog=Math.round(nSecs*1000);
		}
		self.iIndAct=iIndMin;
		self.iIndMin=iIndMin;
		self.iIndMax=iIndMax;
		if (isUndefined(iIndMax)){
			self.iIndMax=iIndMin-1;
		}
		self.theCallBlock=callBlock;
		self.theCallback=callback;
		self.theOperation=theFunction;
		self.nTotalOperations=0;
		self.initTimestamp=new Date().getTime();
		self.lastTimestamp=new Date().getTime();
	}
	nextCycle(){
		var self=this;
		if ((self.iIndAct==self.iIndMin)&&(isDefined(self.RCGAsyncUtils_inner_Barrier))){
			self.RCGAsyncUtils_inner_Barrier.start(this);
		}
		var actNow=new Date().getTime();
		var nOpsRound=0;
		var tInicioRound=actNow;
		var opResult;
		var bFinish=false;
		while ((!bFinish)
				&&((self.iIndAct<self.iIndMax)||(self.iIndMax<self.iIndMin))
				&&(actNow<=(self.lastTimestamp+self.nSecsLog))) {
			if (isDefined(self.theOperation)){
				opResult=self.theOperation(self.iIndAct);
				if (isDefined(opResult)){
					if (opResult){ //opResult==true..... finish!
						bFinish=opResult;
					}
				}
			}
			self.nTotalOperations++;
			nOpsRound++;
			self.iIndAct++;
			actNow=new Date().getTime();
		}
		self.lastTimestamp=new Date().getTime();
		var nDurationTotal=((self.lastTimestamp-self.initTimestamp)/1000);
		var sPerfTotal=self.nTotalOperations/nDurationTotal;
		var nDuration=((self.lastTimestamp-tInicioRound)/1000);
		var nPerformance=0;
		if (nDuration>0){
			nPerformance=nOpsRound/nDuration;
		}
		var nPerc=1;
		if ((self.iIndMax>self.iIndMin)&&((self.iIndMax-self.iIndMin)>0)){
			nPerc=(self.iIndAct-self.iIndMin)/(self.iIndMax-self.iIndMin);
		}
		var tEstimated=0;
		if (nPerc>0){
			tEstimated=((1-nPerc)*nDurationTotal)/nPerc;
		}
		var theStepInfo=new offlineStepInfo(
				self.iIndAct,nPerformance,nDuration,self.iIndMax,self.sUnits,
				sPerfTotal,nDurationTotal,nPerc,tEstimated
				);

		self.callBlock(theStepInfo);
		if (((self.iIndAct>=self.iIndMax)&&(self.iIndMax>self.iIndMin))||(bFinish)) {
			if (isDefined(self.theCallback)){
				self.theCallback(theStepInfo);
			}
			if (isDefined(self.RCGAsyncUtils_inner_Barrier)){
				setTimeout(function(){
							self.RCGAsyncUtils_inner_Barrier.finish(self);
						});
			}
		} else {
			setTimeout(function(){
				self.nextCycle();
			});
		}
		self.lastTimestamp=new Date().getTime();
	}
}


class RCGAsyncUtils{
	processOfflineDefaultLog(stepInfo){
		stepInfo.log();
	}
	processOffline(iIndMin,iIndMax,theFunction,sUnits,callback,callBlock,nSecs,RCGAsyncUtils_inner_Barrier){
		var offProcesor=new offlineProcesor(iIndMin,iIndMax,theFunction,sUnits,callback,callBlock,nSecs,RCGAsyncUtils_inner_Barrier);
		setZeroTimeout(function(){
			offProcesor.nextCycle();
		});
	}
	newRCGAsyncUtils_inner_Barrier(callback){
		return new RCGAsyncUtils_inner_Barrier(callback);
	}
}
registerClass(RCGAsyncUtils);

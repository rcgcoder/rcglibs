'use strict';
var process;
if (isInNodeJS()){
	process = require('process');
} else {
	process={pid:0,enabled:false};
}

//var BaseUtils=require("./BaseUtils.js");
//var StringUtils=require("./StringUtils.js");
//var LogUtils=require("./LogUtils.js");

class ChronoInfo{
	constructor(process){
		var self=this;
		self.process=process;
		self.start=0;
		self.wasted=0;
		self.cycle=0;
		self.startCycle=0;
	}
	run(tInitWasted){
		if (!this.process.enabled) return;
		var auxWasted=tInitWasted;
		var tNow=new Date().getTime();
		if (isUndefined(tInitWasted)){
			this.start=tNow;
			auxWasted=this.start;
		} else {
			this.start=tInitWasted;
			auxWasted=tInitWasted;
		}
		this.startCycle=this.start;
		tNow=new Date().getTime();
		this.wasted=(tNow-auxWasted);
	}
    newCycle(){
	   if (!this.process.enabled) return;
	   this.cycle++;
	   this.startCycle=new Date().getTime();
    }
    getHowMuch(){
		if (!this.process.enabled) return;
		var tNow=new Date().getTime();
		var tAux=tNow-this.start;
		return tAux;
    }
    getHowMuchCycle(){
		if (!this.process.enabled) return;
		var tNow=new Date().getTime();
		var tAux=tNow-this.startCycle;
		return tAux;
    }
}

class Chrono{
	constructor(sFullName,sName,nestingLevel,parent){
		var self=this;
		self.name=sFullName;
		self.shortName=sName;
		self.accumulated=0;
		self.chronos=[];
		self.deep=0;
		self.times=0;
		self.nesting=nestingLevel+0;
		self.parent=parent;
		self.childs=[];
		self.wasted=0;
	}
	getTotalWasted(){
		var iAcum=this.wasted;
		for (var i=0;i<this.childs.length;i++){
			iAcum+=this.childs[i].getTotalWasted();
		}
		return iAcum;
	}
}

class processChronos{
	constructor(enabled,withAuxiliarInfo,withFullName,listMaxDeep){
		var self=this;
		self.enabled=enabled;
		self.withFullName=withFullName;
		self.withAuxiliarInfo=withAuxiliarInfo;
		self.listMaxDeep;
		self.prependChronoNumber=false;
		self.totalChronos=0;
		self.tTotal=0;
		self.chronosOpen=[];
		self.pathChrono="";
		self.allChronos=[];
		self.lastChrono=[];
		self.mapChronos={};
		self.nestingLevel=0;
	}
	prepareNames(name,sAuxiliarInfo){
		var sFullName="";
		var sName=name;
		if (this.prependChronoNumber) {
			sName=fillCharsLeft(5,this.totalChronos)+"_"+sName;
		}
		if ((this.withAuxiliarInfo)&&(isDefined(sAuxiliarInfo))){
			sName+="_"+sAuxiliarInfo;
		}
		this.nestingLevel++;
		if (this.withFullName){
			this.totalChronos++;
			this.chronosOpen.push(this.pathChrono);
			sFullName=this.pathChrono;
			sFullName+="_"+sName;
			this.pathChrono=sFullName;
		} else {
			sFullName=sName;
		}
		return [sName,sFullName];
	}
	chronoStartFunction(sAuxiliarInfo,nIndex){
		var newIndex=1
		if (isDefined(nIndex)){
			newIndex+=nIndex;
		}
		return this.chronoStart("",sAuxiliarInfo,newIndex);
	}
	chronoStopFunction(){
		var newIndex=1
		if (isDefined(nIndex)){
			newIndex+=nIndex;
		}
		return this.chronoStop("",newIndex);
	}
	chronoStart(theName,sAuxiliarInfo,iFuncName){
		if (!this.enabled) return;
		var tInit=new Date().getTime();
		var name=theName;
		if (isDefined(iFuncName)){
			name=getFunctionName(iFuncName+1);
		} 
		var arrNames=this.prepareNames(name,sAuxiliarInfo);
		var sName=arrNames[0];
		var sFullName=arrNames[1];
		if (isDefined(this.mapChronos[sFullName])){
			var parent="";
			if (this.chronosOpen.length>0){
				parent=this.chronosOpen[this.chronosOpen.length-1];
				if (parent!=""){
					parent=this.mapChronos[parent];
				}
			}
			this.mapChronos[sFullName]=new Chrono(sFullName,
														sName,
														this.nestingLevel,
														parent);
			if (parent!=""){
				parent.childs.push(this.mapChronos[sFullName]);
			}
			
			this.allChronos.push(this.mapChronos[sFullName]);
		}
		var accumChronos=this.mapChronos[sFullName];
		this.lastChrono.push(accumChronos);
		var chronos=accumChronos.chronos;
		var chrono=new ChronoInfo(this);
		chronos.push(chrono);
		if (chronos.length>accumChronos.deep){
			accumChronos.deep=chronos.length;
		}
		chrono.run(tInit);
		return chrono;
	}
	chronoStop(theName,iFuncName){
		if (!this.enabled) return;
		var tInit=new Date().getTime();
		var name=theName;
		if (isDefined(iFuncName)){
			name=getFunctionName(iFuncName+1);
		} 
		var lastChrono=this.lastChrono.pop();
		var sName=lastChrono.shortName;
		if (isDefined(name)){
			if (name!=sName){
				log("Error haciendo Stop. name:"+name+" lastChrono name Corto:"+sName);
			}
			sName=lastChrono.name;
		}
		var sFullName="";
		this.nestingLevel--;
		if (this.withFullName){
			sFullName=this.pathChrono;
			this.pathChrono=this.chronosOpen.pop();
		} else {
			sFullName=sName;
		}
		
		var accumChronos=this.mapChronos[sFullName];
		accumChronos.times++;
		
		var chronos=accumChronos.chronos;
		var chrono=chronos.pop();
		var timeAct=new Date().getTime();
		var tResult=timeAct-chrono.start;
		accumChronos.accumulated+=tResult;
		accumChronos.wasted+=((timeAct-tInit)+chrono.wasted);
		if (accumChronos.accumulated<accumChronos.wasted){
			log("No coinciden");
		}
		return tResult;
	}
}

class ChronoFactory{
	constructor(){
		var self=this;
		self.chronos=[];
		self.enabled=false;
		self.listRootsOnly=true;
		self.withFullName=true;
		self.withAuxiliarInfo=false;
		self.listMaxDeep=100;
	}
	getChronos(){
		var self=this;
		var sPID=process.pid;
		var pChronos;
		if (isUndefined(self.chronos[sPID])){
			pChronos=new processChronos(self.enabled,self.withAuxiliarInfo,self.withFullName);
			self.chronos[sPID]=pChronos;
		} else {
			pChronos=self.chronos[sPID];
		}
		return pChronos;
	}
	clearChronos(){
		var sPID=process.pid;
		this.chronos[sPID]=undefinedValue;
	}
	chronoStartFunction(sAuxiliarInfo,nIndex){
		var self=this;
		if (!self.enabled) return "";
		var newIndex=1
		if (isDefined(nIndex)){
			newIndex+=nIndex;
		}
		return this.getChronos().chronoStart("",sAuxiliarInfo,newIndex);
	}
	chronoStopFunction(nIndex){
		var newIndex=1
		if (!self.enabled) return "";
		if (isDefined(nIndex)){
			newIndex+=nIndex;
		}
		return this.getChronos().chronoStop("",newIndex);
	}
	chronoStart(name,sAuxiliarInfo){
		if (!self.enabled) return "";
		return this.getChronos().chronoStart(name,sAuxiliarInfo);
	}
	chronoStop(name){
		if (!self.enabled) return "";
		return this.getChronos().chronoStop(name);
	}
	traceBlock(sLabel,sValue,sMeasure){
		if (!self.enabled) return "";
		var sRowSeparator=", ";
		var sFieldSeparator="";
		return sRowSeparator
				+sFieldSeparator+(isDefined(sLabel)?sLabel+":":"")
				+sFieldSeparator+(isDefined(sValue)?sValue:"")
				+sFieldSeparator+(isDefined(sMeasure)?sMeasure:"");
	}
	listChrono(accumChronos){
		if (!this.enabled) return;
		var pChronos=this.getChronos();
		var nMultip=0;
		var percParent=0;
		var percTotal=0;
		var sTabs=" ";
		var parent=accumChronos.parent;
		var iDeep=1;
		if (parent!=""){		
			percParent=(accumChronos.accumulated/parent.accumulated);
			nMultip=accumChronos.times/parent.times;
			var chronoParent=parent;
			while (chronoParent!=""){
				iDeep++;				
				sTabs+="   ";
				chronoParent=chronoParent.parent;
			}
		} 
		var tTotalWasted=accumChronos.getTotalWasted();
		var tChildsWasted=tTotalWasted-accumChronos.wasted;
		
		percTotal=accumChronos.accumulated/pChronos.tTotal;
				
		var tReal=accumChronos.accumulated-tTotalWasted;
		var porcDesp=tTotalWasted/accumChronos.accumulated;
		
		var sLog=sTabs+ accumChronos.shortName+" ("+accumChronos.times+"),";
		sLog+=this.traceBlock("Ops",accumChronos.times);
		sLog+=this.traceBlock("T Real",inSeconds(tReal,false));
		sLog+=this.traceBlock("T Accum",inSeconds(accumChronos.accumulated,false));
		sLog+=this.traceBlock("% Accum",inPercent(percTotal));
		sLog+=this.traceBlock("T Wasted",inSeconds(tTotalWasted,false));
		if (accumChronos.childs.length>0){
			sLog+=this.traceBlock("T Wasted by childs",inSeconds(tChildsWasted,false));
		} else {
			sLog+=this.traceBlock();
		}
		sLog+=this.traceBlock("% Wasted",inPercent(porcDesp));
		if (parent!=""){
			sLog+=this.traceBlock("% parent",inPercent(percParent));
			sLog+=this.traceBlock("Multip",nMultip.toFixed(2));
		} else {
			sLog+=this.traceBlock();
			sLog+=this.traceBlock();
		}
		sLog+=this.traceBlock("Perf Real(op/s)",(accumChronos.times*1000/tReal).toFixed(2),"op/s");
		sLog+=this.traceBlock("Perf Real(ms/op)",(tReal/accumChronos.times).toFixed(5),"ms/op");
		sLog+=this.traceBlock("Perf (op/s)",(accumChronos.times*1000/accumChronos.accumulated).toFixed(2),"op/s");
		sLog+=this.traceBlock("Perf (ms/op)",(accumChronos.accumulated/accumChronos.times).toFixed(5),"ms/op");
		sLog+=this.traceBlock("Deep Max",accumChronos.deep);
		sLog+=this.traceBlock("Act",accumChronos.chronos.length);
		sLog+=this.traceBlock("Nesting",accumChronos.nesting);
		sLog=replaceAll(sLog, "\\.", ","); 
		log(sLog);
		if (iDeep<=this.listMaxDeep) {
			for (var i=0;i<accumChronos.childs.length;i++){
				this.listChrono(accumChronos.childs[i]);
			}
		}
	}
	list(){
		if (!this.enabled) return;
		var tTotal=0;
		var pChronos=this.getChronos();
		for (var i=0;i<pChronos.allChronos.length;i++){
			var accumChronos=pChronos.allChronos[i];
			if (accumChronos.parent==""){
				tTotal+=accumChronos.accumulated;
			}
		}
		pChronos.tTotal=tTotal;
		log("Listing "+pChronos.allChronos.length +" chronos ("+inSeconds(tTotal)+")");
/*		this.allChronos.sort(function(a,b){
			if (this.withFullName) {
				if (a.name<b.name){
					return -1;
				} else if (a.name>b.name){
					return +1;
				} 
				return 0;
			} else {
				if (a.accumulated<b.accumulated){
					return 1;
				} else if (a.accumulated>b.accumulated){
					return -1;
				} 
				return 0;
			}
		});
	*/		

		for (var i=0;i<pChronos.allChronos.length;i++){
			var accumChronos=pChronos.allChronos[i];
			var parent=accumChronos.parent;
			if (parent==""){
				this.listChrono(accumChronos);
			}
		}
	}
}
var chronoFactory=new ChronoFactory();
var enabledChronos=false;
class RCGChronoUtils{
	constructor(){
		log("Creating ChronoUtils");
	}
	chronoStartFunction(sAuxiliarInfo){
		return chronoFactory.chronoStartFunction(sAuxiliarInfo,1);
	}
	chronoStopFunction(){
		return chronoFactory.chronoStopFunction(1);
	}
	chronoStart(sName,sExtraInfo){
//		log("Start Chrono:"+sName);
		chronoFactory.chronoStart(sName,sExtraInfo);
	}
	chronoStop(sName){
//		log("Stop Chrono:"+sName);
		chronoFactory.chronoStop(sName);
	}
	chronoList(accumChronos){
//		log("List Chronos");
		if (isDefined(accumChronos)){
			chronoFactory.listChrono(accumChronos);
		} else {
			chronoFactory.list();
		}
	}
	chronoEnable(){
		chronoFactory.enabled=true;
	}
	chronoDisable(){
		chronoFactory.enabled=false;
	}
}
if (isInNodeJS()){
	if (isUndefined(global.chronoFactory)){
		global.chronoFactory=chronoFactory;
	}
}
registerClass(RCGChronoUtils);

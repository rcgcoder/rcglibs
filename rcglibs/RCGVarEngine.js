var RCGHistoryVar=class RCGHistoryVar{
	constructor(sVarName,varValue,theDate){
		var self=this;
		self.name=sVarName;
		self.history=newHashMap();
		self.add(varValue,theDate);
	}
	add(varValue,theDate){
		var self=this;
		var vValue=varValue;
		var vDate=theDate;
		var sDateTime="undefined";
		var iDateTime=0;
		if (isUndefined(varValue)) vValue="";
		if (isUndefined(theDate)) {
			vDate="";
		} else {
			iDateTime=theDate.getTime();
			sDateTime=iDateTime+"";
		}
		if (self.history.exists(sDateTime)){
			var antVal=self.history.getValue(sDateTime);
			antVal.value=vValue;
		} else {
			self.history.add(sDateTime,{datetime:iDateTime,value:vValue,date:vDate});
		}
	}
	getLife(){
		var self=this;
		var arrChanges=self.history.toArray();
		arrChanges.sort(function(a,b){
			if (a.datetime>b.datetime) return -1;
			if (a.datetime<b.datetime) return 1;
			return 0;
		});
		return arrChanges;
	}
	getValue(atDateTime){
		var self=this;
		var arrLife=self.getLife();
		var historyLength=arrLife.length;
		if (historyLength<=0) return "";
		if ((historyLength==1)||(isUndefined(atDateTime))) return arrLife[0].value;
		var atTimestamp=atDateTime.getTime();
		var vAux=arrLife.shift();
		var vAnt=vAux;
		while ((vAux.datetime>atTimestamp)&&(arrLife.length>0)){
			vAnt=vAux;
			vAux=arrLife.shift();
		}
		if (vAux.datetime==0) { //if the life is finished and the element has not date
			return vAnt.value; // returns the first history change
		}
/*		if (vAux.datetime>atTimestamp){ // the life is finished... get the first value setted
			return vAux.value;
		}*/
		return vAux.value
	}
}
var RCGVarEngine=class RCGVarEngine{ //this kind of definition allows to hot-reload
	constructor(){
		var self=this;
		self.localVars=newHashMap();
		self.historyVars=newHashMap();
	}

	pushVarEnv(){
		this.localVars.push(newHashMap());
	}
	popVarEnv(){
		return this.localVars.pop();
	}
	topVarEnv(){
		if (this.localVars.length==0) return "";
		return this.localVars.top();
	}
	pushVar(varName,value,levelFromTop){
		var self=this;
		var hsVars=self.getVars(varName);
		if (hsVars==""){
			hsVars=newHashMap();
			var nEnvs=self.localVars.length();
			if (isDefined(levelFromTop)&&(levelFromTop!=0)){
				var nEnv=(nEnvs-1);// last env
				var auxVarEnv;
				nEnv-=Math.abs(levelFromTop);
				if (nEnv<=0){
					nEnv=0;
				}
				auxVarEnv=self.localVars.findByInd(nEnv);
			} else {
				auxVarEnv=self.topVarEnv();
				
			} 
			auxVarEnv.add(varName,hsVars);
		}
		hsVars.push(value);
	}
	
	popVar(varName,value){
		var self=this;
		var hsVars=self.getVars(varName);
		if (hsVars=="") return "";
		return hsVars.pop();
	}
	getVar(varName,atDatetime){
		var self=this;
		var hVar;
		if (isDefined(atDatetime)){
			hVar=self.historyVars.getValue(varName);
			if (hVar!=""){
				return hVar.getValue(atDatetime);
			}
		}
		var hsVars=self.getVars(varName);
		if (hsVars!="") return hsVars.top();
		hVar=self.historyVars.getValue(varName);
		if (hVar!=""){
			return hVar.getValue(atDatetime);
		}
		return "";
	}
	setVar(varName,value,atDatetime){
		var self=this;
		if (isDefined(atDatetime)){
			if (!self.historyVars.exists(varName)){
				var hVar=new RCGHistoryVar(varName,value,atDatetime);
				self.historyVars.add(varName,hVar);
			} else {
				var hVar=self.historyVars.getValue(varName);
				hVar.add(value,atDatetime);
			}
			return;
		}
		var hsVars=self.getVars(varName);
		if (hsVars!=""){
			if (hsVars.length()>0){
				hsVars.pop();
			} 
			hsVars.push(value);
		} else { // if not exists is a new local var
			self.pushVar(varName,value); 
		}
	}

	getVars(varName){ // get the hashmap contained in the variable name... all variables are array of values
		var self=this;
		// localVars is a Stack (hashmap without key) of Var Environments (hashmaps where the key is the var name)
		// take the top environment
		if (self.historyVars.exists(varName)){
			return self.historyVars.getValue(varName);
		}
		var nodEnv=self.localVars.getLast();
		var nodAux;
		var nodInd;
		var hsEnv;
		nodInd=nodEnv.brothers.length-1;
		while (nodInd>=0){
			nodAux=nodEnv.brothers[nodInd];
			hsEnv=nodAux.value;
			if (hsEnv.exists(varName)){
				return hsEnv.getValue(varName);
			}
			nodInd--;
		}
		hsEnv=nodEnv.value;
		if (hsEnv.exists(varName)){
			return hsEnv.getValue(varName);
		}
		return "";
	}
	flushVar(varName){
		var hsVars=getVars(varName);
		hsVars.clear();
	}
	initVar(varName,varsLevel){
		var self=this;
		var hsEnv;
		if (isUndefined(varsLevel)){
			hsEnv=self.topVarEnv();
		} else if ((varsLevel>=0)&&(varsLevel<self.localVars.length())){
			hsEnv=self.localVars.findByInd(varsLevel);
		} else if ((varsLevel<0)&&(Math.abs(varsLevel)<self.localVars.length())){
			hsEnv=self.localVars.findByInd((self.localVars.length()-1)+varsLevel);
		} else { 
			log("Vars level "+ varsLevel + " is out of bounds -"+(self.localVars.length()-1)+" .. "+(self.localVars.length()-1)+".\n Using top vars");
			hsEnv=self.topVarEnv();
		} 
		if (hsEnv==""){
			self.pushVarEnv()
			hsEnv=self.topVarEnv();
		}
		if (hsEnv.exists(varName)){
			log("ERROR ... you can init a existin local variable");
			return;
		}
		hsEnv.add(varName,newHashMap());
	}
}
'use strict';
if (isInNodeJS()){
	var BaseUtils = require('./BaseUtils.js');
}
class RCGListUtils{
	newID(arrObjects){
		var iID=0;
		while (getFromListById(arrObjects,iID)!=""){
			iID++;
		}
		return iID;
	}
	getFromListById(list,id){
		if (!isUndefined(list)){
			for (var i=0;i<list.length;i++){
				var idAux=list[i].id;
				if (idAux==id){
					return list[i];
				}
			}
		}
		return "";
	}
	getFromMapById(map,id){
		if (!isUndefined(map)){
			var vVal=map[id];
			if (isUndefined(vVal)){
				vVal="";
			}
			return vVal;
		}
		return "";
	}
	
	getFromList(list,ind){
		if (!isUndefined(list)){
			if ((ind>=0)&&(ind<list.length)){
				return list[ind];
			}
		}
		return "";
	}
}
registerClass(RCGListUtils);

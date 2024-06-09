var newRCGFilterManagerFactory=function(){
	var dynObj=newDynamicObjectFactory(
					[{name:"Filter",description:"Filters",type:"string"},
					 {name:"FilterCache",description:"Filters",type:"string"}
						],
					[],
					[],"Filter");
	dynObj.functions.add("newFilter",function(filterName,filterBody){
		var self=this;
		if (self.existsFilterCache(filterName)){
			var hsCache=self.getFilterCaches();
			hsCache.remove(filterName);
		}
		self.setFilter(filterName,filterBody);
	});
	dynObj.functions.add("useFilter",function(filterString,iDeep){
		var self=this;
//		debugger;
		var sLeftChars="";
		var iDeepAux=0;
		if (isDefined(iDeep)){
			iDeepAux=iDeep;
			sLeftChars=fillCharsLeft(iDeepAux,"","\t");
		}
		var sResult=self.getFilterCacheById(filterString);
		if (sResult!="") return sResult;
		var sPartialResult="";
		if (self.existsFilter(filterString)){
			sPartialResult=self.getFilterById(filterString);
		} else {
			sPartialResult=filterString;
		}
		sResult=sPartialResult;
		var arrFilterParts;
		var arrFilterNameParts;
		var iFilterRow=0;
		var sSubFilterName="";
		var sFilterRow;
		var sRestRow="";
		var sResultAux="";
		var iPos=sPartialResult.indexOf("useFilter");
		while (iPos>=0){
			arrFilterParts=sPartialResult.split("useFilter(");
			sResult="";
			if (iPos==0){
				iFilterRow=0;
			} else {
				sResult+=arrFilterParts[0];
				iFilterRow=1;
			}
			while (iFilterRow<arrFilterParts.length){
				sFilterRow=arrFilterParts[iFilterRow];
				if (sFilterRow.substring(sFilterRow.length-1,sFilterRow.length)==")"){
					sFilterRow+="  ";
				}
				arrFilterNameParts=sFilterRow.split(")");
				sSubFilterName=arrFilterNameParts[0];// "filtername" or 'filtername' or `filtername`
				sSubFilterName=replaceAll(sSubFilterName,"'","");
				sSubFilterName=replaceAll(sSubFilterName,"\"","");
				sSubFilterName=replaceAll(sSubFilterName,"\n","");
				sSubFilterName=replaceAll(sSubFilterName,"\r","");
				sSubFilterName=replaceAll(sSubFilterName,"\t","");
				sSubFilterName=replaceAll(sSubFilterName," ","");
//				sSubFilterName=sSubFilterName.saRemoveInnerHtmlTags();
				sSubFilterName=sSubFilterName.saToString();
				sResultAux=self.useFilter(sSubFilterName,iDeepAux+1);
				sResultAux=replaceAll(sResultAux,"\n","\n"+sLeftChars);
				sResultAux=sResultAux.saToString();
				sResult+=sResultAux;
				for (var j=1;j<arrFilterNameParts.length;j++){
					if (j>1){
						sResult+=")";
					}
					sResult+=arrFilterNameParts[j];
				}
				iFilterRow++;
			}
			sPartialResult=sResult;
			iPos=sPartialResult.indexOf("useFilter");
		}
		self.setFilterCache(filterString,sResult);
		return sResult;
	});
	return dynObj;
}
var RCGFilterManagerFactory=newRCGFilterManagerFactory();
var newRCGFilterManager=function(){
	return RCGFilterManagerFactory.new();
} 

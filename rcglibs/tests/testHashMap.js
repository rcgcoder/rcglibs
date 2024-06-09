debugger;
var hsTest=newHashMap();
var nMaxItems=1000000;
var fncGetRandomKey=function(){
	return "key"+Math.floor(Math.random()*nMaxItems);
}
var lastPercent=Math.floor(100*hsTest.length()/nMaxItems);
var actPercent=Math.floor(100*hsTest.length()/nMaxItems);
var key;
loggerFactory.getLogger().enabled=true;
while (hsTest.length()<nMaxItems){
	key=fncGetRandomKey();
	if (!hsTest.exists(key)){
		hsTest.add(key,key);
		actPercent=Math.floor(100*hsTest.length()/nMaxItems);
		if (actPercent!=lastPercent){
			log(actPercent+"%");
			lastPercent=actPercent;
		}
	}
}
while (hsTest.length()>0){
	key=fncGetRandomKey();
	if (hsTest.exists(key)){
	    var iLength=hsTest.length();
	    var iNodes=hsTest.nNodes;
	    hsTest.remove(key);
	    if ((iLength-1)!=hsTest.length()){
	        logError("Error removing length");
	    }
	    if ((iNodes-1)!=hsTest.nNodes){
	        logError("Error removing nNodes");
	    }
		actPercent=Math.floor(100*hsTest.length()/nMaxItems);
		if (actPercent!=lastPercent){
			log(actPercent+"%");
			lastPercent=actPercent;
		}
	}
}
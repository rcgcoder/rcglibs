var bInNodeJS=false;
if (typeof require!=="undefined"){
	bInNodeJS=true;
	'use strict';
	var shell = require('shelljs' );
	var StackUtils=require("./StackUtils.js");
}
function isInNodeJS(){
	return bInNodeJS;
}
function doDebugger(){
	debugger;
	return true;
}
function doDebuggerWhen(fncFunction,valueToReturn){
    if (fncFunction()) debugger;
    return valueToReturn;
}

//Only add setZeroTimeout to the window object, and hide everything
//else in a closure.
(function() {
 var timeouts = [];
 var messageName = "zero-timeout-message";

 // Like setTimeout, but only takes a function argument.  There's
 // no time argument (always zero) and no arguments (you have to
 // use a closure).
 function setZeroTimeout(fn) {
     timeouts.push(fn);
     window.postMessage(messageName, "*");
 }

 function handleMessage(event) {
     if ((event.source == window) && (event.data == messageName)) {
         event.stopPropagation();
         if (timeouts.length > 0) {
             var fn = timeouts.shift();
             fn();
         }
     }
 }

 window.addEventListener("message", handleMessage, true);

 // Add the one thing we want added to the window object.
 window.setZeroTimeout = setZeroTimeout;
})();


function getMemStatus(){
	var giga=(1024*1024);
	return " totalJSHeapSize:"+ (performance.memory.totalJSHeapSize/giga).toFixed(3) + ',' +
			"usedJSHeapSize:"  + (performance.memory.usedJSHeapSize/giga).toFixed(3)  + ',' +
			"jsHeapSizeLimit:" + (performance.memory.jsHeapSizeLimit/giga).toFixed(3);
}
function memorySizeOfObject( object ) {
    var objectList = [];
    var stack = [ object ];
    var bytes = 0;

    while ( stack.length ) {
        var value = stack.pop();

        if ( typeof value === 'boolean' ) {
            bytes += 4;
        }
        else if ( typeof value === 'string' ) {
            bytes += value.length * 2;
        }
        else if ( typeof value === 'number' ) {
            bytes += 8;
        }
        else if
        (
            typeof value === 'object'
            && objectList.indexOf( value ) === -1
        )
        {
            objectList.push( value );

            for( var i in value ) {
                stack.push( value[ i ] );
            }
        }
    }
    return bytes;
}
function clone(srcObj){
	var result={};
	var arrProperties=Object.getOwnPropertyNames(srcObj);
	for (var i=0;i<arrProperties.length;i++){
		var vPropName=arrProperties[i];
		//if (vPropName!=="constructor"){
			var vPropValue=srcObj[vPropName];
			//if (isMethod(vPropValue)){
				if (isUndefined(result[vPropName])){
					result[vPropName]=vPropValue;
				}
			//}
		//}
	}
	return result;
}

function objEquals(aObj,bObj){
	var arrAProperties=Object.getOwnPropertyNames(aObj);
	var arrBProperties=Object.getOwnPropertyNames(bObj);
	if (arrAProperties.length!=arrBProperties.length){
		return false;
	}
	var bEquals=true;
	for (var i=0;(i<arrAProperties.length)&&bEquals;i++){
		var vPropName=arrAProperties[i];
		var vAPropValue=aObj[vPropName];
		if (!isMethod(vAPropValue)){
			var vBPropValue=bObj[vPropName];
			if (isObject(vAPropValue)){
				bEquals=bEquals && objEquals(vAPropValue,vBPropValue);
			} else if (isArray(vAPropValue)){
				bEquals=bEquals && (vAPropValue.length==vBPropValue.length);
				for (var j=0;(j<vAPropValue.length)&&bEquals;j++){
					bEquals=bEquals && objEquals(vAPropValue[j],vBPropValue[j]);
				}
			} else {
				bEquals=bEquals && (vAPropValue==vBPropValue);
			}
		}
	}
	return bEquals;
}
function getAllProperties(obj){
	var arrProperties;
	var arrResult=[];
	var baseObj;
	if (typeof obj==="function"){ // a class is a function... "constructor"
		baseObj=obj.prototype;
	} else {
		baseObj=obj;
	}
	arrProperties=Object.getOwnPropertyNames(baseObj);
	for (var i=0;i<arrProperties.length;i++){
		var vPropName=arrProperties[i];
		if (vPropName!=="constructor"){
			var vPropValue=baseObj[vPropName];
			if (!isMethod(vPropValue)){
				arrResult.push(vPropName);
			}
		}
	}
	return arrResult;
}

function makeGlobals(obj){
	var arrProperties;
	var baseObj;
	if (typeof obj==="function"){ // a class is a function... "constructor"
		baseObj=obj.prototype;
	} else {
		baseObj=obj;
	}
	arrProperties=Object.getOwnPropertyNames(baseObj);
	for (var i=0;i<arrProperties.length;i++){
		var vPropName=arrProperties[i];
		if (vPropName!=="constructor"){
			var vPropValue=baseObj[vPropName];
			if (isMethod(vPropValue)){
				if (isInNodeJS()){
					global[vPropName]=vPropValue;
				} else {
					window[vPropName]=vPropValue;
				}
			}
		}
	}
}

function registerClass(clsObj){
	if (isInNodeJS()){
		module.exports=clsObj;
	} else {
		global[clsObj.name]=clsObj;
	}
	log("Registered class:"+clsObj.name);
}


function getCallStackSize() {
	try {
	    forceExcepcionToAnalizeStackSize("run exception!");
	}
	catch(err) {
		var theStack=err.stack;
		var nOcurs=occurrences(theStack,"\n",false);
		return nOcurs;
	}
    return 0;
}
function executeSystemCommand(sCommand,callback){
	var objResult=shell.exec(sCommand);
	var result=objResult.stdout;
	if (isArray(result)){
		for (var i=0;i<result.length;i++){
			log("stdout Line "+i+":"+result[i]);
		}
	} else {
		log("stdout:"+result);
	}
	return objResult;
}  

function getUrlParameter(sParam) {
    var sPageURL = decodeURIComponent(window.location.search.substring(1)),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : sParameterName[1];
        }
    }
};

function isMethod(variable){
	return (typeof variable === 'function');
}
function isUndefined(variable){
	return (typeof variable==="undefined");
}
function isDefined(variable){
	return (typeof variable!=="undefined");
}
function isDynamicObject(variable){
	if (isUndefined(variable)) return false;
	return (isDynamicFactory(variable.factory));
}
function isDynamicFactory(variable){
	if (isUndefined(variable)) return false;
	return (isDefined(variable.isDynamicFactory)&&variable.isDynamicFactory);
}
function isNull(variable){
	return (variable===null);
}
function isNotNull(variable){
	return (variable!==null);
}
function isString(variable){
	if (typeof variable==="string") return true;
	if (isObject(variable)){
		if (variable.constructor.name=="String") return true;
	}
	return false;
}
function isHashMap(obj){
	return (isObject(obj) && (obj.constructor.name=="RCGHashMap"));
}
function isArray(variable){
	return Array.isArray(variable);
}
function isObjectOf(obj,className){
	if (isObject(obj)&& (obj.constructor.name==className)){
		return true;
	}
	return false;
}
function isObject(obj){
	return ( (typeof obj === "object") && (obj !== null) && isDefined(obj) );
}
function isBoolean(obj){
	return ( (typeof obj === "boolean") && (obj !== null) && isDefined(obj) );
}
function isNumber(obj){
	return ( (typeof obj === "number") && (obj !== null) && isDefined(obj) );
}


function isInArray(theArray,theKey,theFieldOrFunctionName){
	var bExists=false;
	for (var k=0;(!bExists)&&(k<theArray.length);k++){
		var it=theArray[k];
		if (isDefined(theFieldOrFunctionName)){
			if (it[theFieldOrFunctionName])
			if (isString(it[theFieldOrFunctionName]) && (it[theFieldOrFunctionName]==theKey)){
				return true;
			} else if (isMethod(it[theFieldOrFunctionName]) && (it[theFieldOrFunctionName]()==theKey)){ 
				return true;
			}
		} else {
			if (it==theKey){
				return true;
			}
		}
	}
	return false;
}


function createFunction(sFunctionBody,functionCache,arrValues){
	var sFncFormula=`var result=
		`+sFunctionBody+`
		;
	 return result;`;
	log("Execute Formula-----");
	if (isDefined(arrValues)){
		for (var i=0;i<arrValues.length;i++){
			var vValue=arrValues[i];
			if (!isObject(vValue)){
				log("_arrRefs_['"+i+"']:["+JSON.stringify(vValue)+"]");
			} else {
				log("_arrRefs_['"+i+"']:["+vValue.constructor.name+"]");
			}
		}
	}
	log(sFncFormula);
	var theHash;
	var fncFormula
	if (isDefined(functionCache)){
		var hash = sha256.create();
		hash.update(sFncFormula);
		theHash=hash.hex();
		if (functionCache.exists(theHash)){
			fncFormula=functionCache.getValue(theHash);
		} else {
			try{
				fncFormula=Function("_arrRefs_",sFncFormula);
			} catch(err) {
				var withLogsPrev=loggerFactory.getLogger().enabled;
				loggerFactory.getLogger().enabled=true;
				log("Error building function");
				log(sFncFormula);
				log("Retry... to generate a exception");
				loggerFactory.getLogger().enabled=withLogsPrev;
				fncFormula=Function("_arrRefs_",sFncFormula);
			}
			functionCache.add(theHash,fncFormula);
		}
	} else {
		fncFormula=Function("_arrRefs_",sFncFormula);
	}
	return fncFormula;
}

function executeFunction(arrValues,itemFunction,functionCache){
	var fncFormula="";
	var sFncBody
	if ((!(isString(itemFunction)||isArray(itemFunction)))&&(itemFunction.method!="")){
		fncFormula=itemFunction.method;
		itemFunction.lastCall=(new Date).getTime();
	} else {
		if (isString(itemFunction)||isArray(itemFunction)){
			sFncBody=itemFunction;
		} else {
			sFncBody=itemFunction.body;
		}
		if (isArray(sFncBody)){
			sFncBody=sFncBody.saToString();
		} 
	}
	if (fncFormula==""){
		fncFormula=createFunction(sFncBody,functionCache,arrValues);
		itemFunction.method=fncFormula;
	}
	var vValue=fncFormula(arrValues);
	return vValue;
}

var undefinedValue;
function fncEmpty(){
}

if (isUndefined(window.setZeroTimeout)){
	//Only add setZeroTimeout to the window object, and hide everything
	//else in a closure.
	(function() {
	 var timeouts = [];
	 var messageName = "zero-timeout-message";
	
	 // Like setTimeout, but only takes a function argument.  There's
	 // no time argument (always zero) and no arguments (you have to
	 // use a closure).
	 function setZeroTimeout(fn) {
	     timeouts.push(fn);
	     window.postMessage(messageName, "*");
	 }
	
	 function handleMessage(event) {
	     if ((event.source == window) && (event.data == messageName)) {
	         event.stopPropagation();
	         if (timeouts.length > 0) {
	             var fn = timeouts.shift();
	             fn();
	         }
	     }
	 }
	
	 window.addEventListener("message", handleMessage, true);
	
	 // Add the one thing we want added to the window object.
	 window.setZeroTimeout = setZeroTimeout;
	})();
}


class RCGBaseUtils{
}

if (isInNodeJS()) { // the global parameters has to be created explicity
	if (isUndefined(global.getUrlParameter)){
		global.getUrlParameter=getUrlParameter;
	}
	if (isUndefined(global.objEquals)){
		global.objEquals=objEquals;
	}
	
	if (isUndefined(global.clone)){
		global.clone=clone;
	}
	if (isUndefined(global.isUndefined)){
		global.isUndefined=isUndefined;
	}
	if (isUndefined(global.isDefined)){
		global.isDefined=isDefined;
	}
	if (isUndefined(global.isMethod)){
		global.isMethod=isMethod;
	}
	if (isUndefined(global.isObject)){
		global.isObject=isObject;
	}
	if (isUndefined(global.isString)){
		global.isString=isString;
		
	}
	if (isUndefined(global.isArray)){
		global.isArray=isArray;
	}
	
	if (isUndefined(global.undefinedValue)){
		global.undefinedValue=undefinedValue;
	}
	if (isUndefined(global.fncEmpty)){
		global.fncEmpty=fncEmpty;
	}
	if (isUndefined(global.fncVacia)){
		global.fncVacia=fncVacia;
	}
	if (isUndefined(global.getFunctionName)){
		var stackUtils=new StackUtils();
		global.getFunctionName=stackUtils.getStackFunctionName;
	}
	if (isUndefined(global.executeSystemCommand)){
		global.executeSystemCommand=executeSystemCommand;
	}
	if (isUndefined(global.isInNodeJS)){
		global.isInNodeJS=isInNodeJS;
	}
	module.exports=RCGBaseUtils;
}

function getDataUri(url, callback) {
    var image = new Image();
    image.crossOrigin = "Anonymous";
    image.onload = function () {
        var canvas = document.createElement('canvas');
        canvas.width = this.naturalWidth; // or 'width' if you want a special/scaled size
        canvas.height = this.naturalHeight; // or 'height' if you want a special/scaled size

        canvas.getContext('2d').drawImage(this, 0, 0);

        // Get raw image data
//        callback(canvas.toDataURL('image/png').replace(/^data:image\/(png|jpg);base64,/, ''));

        // ... or get as Data URI
        callback(canvas.toDataURL('image/png'));
    };
    image.src = url;
}


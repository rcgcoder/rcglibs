'use strict';
// creates a list of global functions for habitual use of strings

String.prototype.trimLeft = String.prototype.trimLeft || function () {
    var start = -1;
    while( this.charCodeAt(++start) < 33 );
    return this.slice( start, this.length);
};

String.prototype.trimRight = String.prototype.trimRight || function () {
    var start = this.length;
    while( this.charCodeAt(--start) < 33 );
    return this.slice( 0,start);
};

var RCGStringUtils= class RCGStringUtils{ // allow dynamically load
	number_format(number,ndecimals,decPoint,milesPoint){
		var nAux=parseFloat(number).toFixed(ndecimals);
		var nStr = ''+nAux;
		var x = nStr.split('.');
		var x1 = x[0];
		var x2 = x.length > 1 ? decPoint + x[1] : '';
		var rgx = /(\d+)(\d{3})/;
		while (rgx.test(x1)) {
			x1 = x1.replace(rgx, '$1' + milesPoint + '$2');
		}
		return x1 + x2;
	};
    normalFormatNumber(number,bClearZero){
		var numAux=number+""; // por si es un string
		if (numAux==""){
			numAux=0;
		}
		numAux=parseFloat(numAux).toFixed(2);
		if (numAux==0) {
			if (typeof bClearZero!=="undefined"){
				if (bClearZero){
					return "";
				}
			} else {
				return "0,00";
			}
		}
		numAux=number_format(numAux,2,",",".");
		return numAux;
    }
	
    inSeconds(number,bClearZero){
    	var sAux=normalFormatNumber((number/1000.0),bClearZero);
    	if (bClearZero){
    		if ((sAux=="")||(sAux=="0,00")) {
    			return "";
    		}
    	}
    	sAux+="s";
    	return sAux;
    }	
    inPercent(number,bClearZero){
    	var sAux=normalFormatNumber((number*100.0),bClearZero);
    	if (bClearZero){
    		if ((sAux=="")||(sAux=="0,00")) {
    			return "";
    		}
    	}
    	sAux+="%";
    	return sAux;
    }	
	inEuros(number,bWithMoneySign,bClearZero,sMoneyChars){
		var sAux=normalFormatNumber(number,bClearZero); // por si es un string
    	if (bClearZero){
    		if ((sAux=="")||(sAux=="0,00")) {
    			return "";
    		}
    	}
		if (typeof bWithMoneySign!=="undefined"){
			if (bWithMoneySign){
				if (typeof sMoneyChars!=="undefined"){
					sAux+=" "+sMoneyChars;
				} else {
					sAux+=" €";
				}
			}
		}
		return sAux;
	};
	
	fillCharsLeft(iNumChars,sString,sCharFill){
		var sChar="0";
		if (typeof sCharFill!=="undefined"){
			sChar=sCharFill;
		}
		var sResult=sString+"";
		while (sResult.length<iNumChars){
			sResult=sChar+sResult;
		}
		return sResult;
	};
	replaceAllWithBrackets(sText,find,replace){
		return sText.replace(find, replace);
	}
	replaceAllWithoutBrackets(sText,find,replace,bModulator){
		return sText.replace(new RegExp(find, bModulator), replace);
	}
	replaceAll(str, find, replace, bInsensitive) {
		  if (isUndefined(str)||(str==null)) return "";
		  var bModulator='g';
		  if (isDefined(bInsensitive)&&(bInsensitive)){
			  bModulator="i"+bModulator;
		  }
		  var replaceFnc;
		  if ((find.indexOf("[")>=0)||(find.indexOf("]")>=0)){
			  /*
			   * [ ] are special cases in find.... 
			   */
			  replaceFnc=replaceAllWithBrackets;
		  } else {
			  replaceFnc=replaceAllWithoutBrackets;
		  }
		  if ((!isArray(str))&&(!isString(str))) str=str+"";
		  if (isString(str)){
			  return replaceFnc(str,find,replace,bModulator);
		  }
		  if (str.length==0) return "";
		  var sResult=[];
		  var sAux="";
		  var sSubstr;
		  var fLength=find.length;
		  var strLength=(str.length-1);
		  var bNext=true;
		  var iRow=-1;
		  while (iRow<strLength){
			  if (bNext){
				  iRow++;
				  sAux=sAux+str[iRow];
			  }
			  if ((sAux=="")||(sAux.length<fLength)){
				  bNext=true;
			  } else {
				  sAux=replaceFnc(sAux,find,replace,bModulator);
				  if (sAux.length>fLength){// there is more letter... cut
					  sSubstr=sAux.substring(0,sAux.length-fLength);
					  sResult.push(sSubstr);
					  sAux=sAux.substring(sAux.length-fLength,sAux.length);
					  bNext=true;
				  }
			  }
		  }
		  if (sAux!=""){
			  if (sAux.length>fLength){
				  sAux=replaceFnc(sAux,find,replace,bModulator);
			  }
			  sResult.push(sAux);
		  }
		  if (sResult.length==1){
			  return sResult[0];
		  } else if (sResult.length==0){
			  return "";
		  } else return sResult;
	};

	
	
	decodeEntities(encodedString) {
	    var textArea = document.createElement('textarea');
	    textArea.innerHTML = encodedString;
	    return textArea.value;
	}
	removeInnerTags(sHtml,bClear){
		var sTagText=sHtml;
		var indCloseTag;
		var sInnerChar=" ";
		if (isDefined(bClear)&&bClear){
			sInnerChar="";
		}
/*		if (isArray(sHtml)){
			return sHtml.saReplaceInnerText("<",">",sInnerChar,true);
		}
*/
		var indFirstCloseTag=sTagText.indexOf(">");
		var indOpenTag=sTagText.substring(0,indFirstCloseTag).lastIndexOf("<");

		while((indOpenTag>=0)&&(indOpenTag<indFirstCloseTag)){
			indCloseTag=sTagText.indexOf(">",indOpenTag+1);
			sTagText=sTagText.substring(0,indOpenTag)+ sInnerChar +sTagText.substring(indCloseTag+1,sTagText.length);
			indFirstCloseTag=sTagText.indexOf(">");
			indOpenTag=sTagText.substring(0,indFirstCloseTag).lastIndexOf("<");
		}
		return sTagText;
	}
	occurrences(string, subString, allowOverlapping) {

	    string += "";
	    subString += "";
	    if (subString.length <= 0) return (string.length + 1);

	    var n = 0,
	        pos = 0,
	        step = allowOverlapping ? 1 : subString.length;

	    while (true) {
	        pos = string.indexOf(subString, pos);
	        if (pos >= 0) {
	            ++n;
	            pos += step;
	        } else break;
	    }
	    return n;
	}
	prepareComparation(str,bCaseInsensitive,bRemoveSpecials){
			var sValue=str;
			if (typeof bCaseInsensitive !=="undefined"){
				if (bCaseInsensitive){
					sValue=sValue.toUpperCase();
				}
			}
			if (typeof bRemoveSpecials!=="undefined"){
				if (bRemoveSpecials){
					sValue=replaceAll(sValue,'Á','A');
					sValue=replaceAll(sValue,'É','E');
					sValue=replaceAll(sValue,'Í','I');
					sValue=replaceAll(sValue,'Ó','O');
					sValue=replaceAll(sValue,'Ú','U');
					sValue=replaceAll(sValue,'á','a');
					sValue=replaceAll(sValue,'é','e');
					sValue=replaceAll(sValue,'í','i');
					sValue=replaceAll(sValue,'ó','o');
					sValue=replaceAll(sValue,'ú','u');
				}
			}
					
			return sValue;
	};
}
registerClass(RCGStringUtils);

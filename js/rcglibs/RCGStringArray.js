Array.prototype.saTrim = function () {
	var arrStrings=this;
	if (isUndefined(arrStrings)) return [];
	if (arrStrings.length==0) return arrStrings;
	if (isString(arrStrings)){
		arrStrings=[arrStrings];
	}
	while ((arrStrings.length>0)&&(arrStrings[0].trimLeft()=="")){
		arrStrings.shift();
	}
	if (arrStrings.length>0) arrStrings[0]=arrStrings[0].trimLeft();

	while ((arrStrings.length>0)&&(arrStrings[arrStrings.length-1].trimRight()=="")){
		arrStrings.pop();
	}
	if (arrStrings.length>0) arrStrings[arrStrings.length-1]=arrStrings[arrStrings.length-1].trimRight();
	
	return arrStrings;
};
Array.prototype.saAppend= function (sText){
	var self=this;
	self.push(sText);
}
Array.prototype.saLength= function (){
	var self=this;
	var iCounter=0;
	self.forEach(function(sText){
		iCounter+=sText.length;
	});
	return iCounter;
}

Array.prototype.saExists= function (sTag){
	var self=this;
	if (isString(self))return (self.indexOf(sTag)>=0);
	if (self.length==0) return false;
	for (var i=0;i<self.length;i++) {
		if (self[i].indexOf(sTag)>=0) return true;
	}
	var sRow;
	var i=0;
	sRow=self[i];
	var sLength=self.length;
	var stLength=sTag.length;
	while (i<sLength){
		while ((sRow.length<stLength)&&(i<sLength)){
			i++;
			sRow+=self[i];
		}
		if (sRow.indexOf(sTag)>=0) return true;
		i++;
		if (i>=sLength) return false;
		sRow=sRow.substring(sRow.length-stLength,sRow.length)+self[i];
	}
	return false;
}

Array.prototype.saIndexOf= function (sTag,bFindLast,bDivide,startPos,startSubArrayPos){
		var arrStrings=this;
		var objResult={bLocated:false,
				arrPrevious:[],
				arrPosterior:[]};
		var bLast=(isDefined(bFindLast)&&(bFindLast));
		var iPos=0;
		var iPosLocated=-1;
		var bLocated=false;
		var vSubArray;
		var vProcessArray;
		var bWithSubArrays=false;
		var auxStartPos;
		var auxSubArrayStartPos;
		var bDefinedSubStartPos=isDefined(startSubArrayPos);
		var bDefinedStartPos=isDefined(startPos);
		var nSelectedBlocks=0;
		
		if (isString(arrStrings)){
			bDefinedSubStartPos=false;
			bDefinedStartPos=false;
			vProcessArray=[arrStrings];
		} else {
			var vSubArray=arrStrings[0];
			if (isArray(vSubArray) ){
//				debugger;
				bWithSubArrays=true;
				vProcessArray=[];
				var iAux=0;
				var arrAux;
				for (var i=0;i<arrStrings.length;i++){
					arrAux=arrStrings[i];
					if (bDefinedSubStartPos){
						if (i<auxSubArrayStartPos){
							iAux+=arrAux.length;
						} else if(i==auxSubArrayStartPos) {
							if (bDefinedStartPos){
								iAux+=startPos;
							} else {
								iAux+=arrAux.length-1;
							}
							auxStartPos=iAux;
						}
					}
					vProcessArray=vProcessArray.concat(arrAux);
				}
			} else {
				bDefinedSubStartPos=false;
				vProcessArray=arrStrings;
			}
		}
		if (!bDefinedSubStartPos){
			if (bDefinedStartPos){
				auxStartPos=startPos;
			} else {
				auxStartPos=(bLast?vProcessArray.length-1:0);
			}
		}
		var iPos=auxStartPos;
		var indOf;
		var sRow;
		var iSubArray=auxSubArrayStartPos;
		bLocated=false;
		var bHigherPart=false;
		if (bLast){
			while ((!bLocated) && (
					((!bHigherPart)&&(iPos>=0)) 
					|| 
					((bHigherPart)&&(iPos>auxStartPos))
					)
				   ){
				sRow=vProcessArray[iPos];
				nSelectedBlocks=1;
				if (iPos>0){
					nSelectedBlocks=2;
					sRow=vProcessArray[iPos-1]+sRow;
				}
				indOf=sRow.lastIndexOf(sTag);
				if (indOf>=0){
					bLocated=true;
					if (iPos>0) {
						iPos--;
					}
				} else {
					iPos--;
					if ((iPos<0)&&(!bHigherPart)){
						bHigherPart=true;
						iPos=vProcessArray.length-1;
					} 
				}
			}
		} else {
			var vLength=vProcessArray.length;
			bHigherPart=true;
			while ((!bLocated) && (
					((bHigherPart)&&(iPos<vLength)) 
					|| 
					((!bHigherPart)&&(iPos<auxStartPos))
					)
				   ){
				bInterStrings=false;
				sRow=vProcessArray[iPos];
				nSelectedBlocks=1;
				if (iPos<(vLength-1)){
					nSelectedBlocks=2;
					sRow+=vProcessArray[iPos+1];
				}
				indOf=sRow.indexOf(sTag);
				if (indOf>=0){
					bLocated=true;
					// do not change the iPos
				} else {
					iPos++;
					if ((iPos>=vLength)&&(bHigherPart)){
						bHigherPart=false;
						iPos=0;
					}
				}
			}
		}
		
		var arrPrevious=[];
		var arrPosterior=[];
		var strPos=-1;
		var sTrgString="";
		if (bLocated) {
			if (iPos<=0){
				arrPrevious=[];
			} else {
				arrPrevious=vProcessArray.slice(0,iPos);
			}
			arrPosterior=vProcessArray.slice(iPos+nSelectedBlocks);
			sTrgString=sRow;
			strPos=indOf;
			if (isDefined(bDivide)&&bDivide){
				var sAux=sTrgString.substring(0,strPos);
				if (sAux!="") arrPrevious.push(sAux);
				sAux=sTrgString.substring(strPos+sTag.length,sTrgString.length);
				if (sAux!="") arrPosterior.unshift(sAux);
				sTrgString=sTag;
				strPos=0;
			}
		} else {
			arrPrevious = vProcessArray;
		}
		var objResult={bLocated:bLocated,
						arrPrevious:arrPrevious,
						arrPosterior:arrPosterior,
						sString:sTrgString,
						iPos:strPos
						};
		return objResult;
	};
Array.prototype.saFindPos=function(sTargetText,bFromEnd,initPos){
	var self=this;
	var bReverse=bFromEnd;
	if (self.length==0) return -1;
	if (isUndefined(bReverse)){
		bReverse=false;
	}
	var tgtLength=sTargetText.length;
	var selfLength=self.length;
	var iBlock;
	fncGotoInitPos=function(){
		var result={located:false,iBlockResult:0,sTextPart:""};
		if (isUndefined(initPos)) return result;
		var accumLetters=0;
		var sAux;
		var iBlockAnt=iBlock;
		iBlock=0;
		while (iBlock<selfLength){
			sAux=self[iBlock];
			accumLetters+=sAux.length;
			if (accumLetters<initPos){
				iBlock++;
			} else {
				if (accumLetters>initPos){
					accumLetters-=sAux.length;
				}
				var nStart=initPos-accumLetters;
				result.located=true;
				result.iBlockResult=iBlock;
				if (bReverse){
					result.sTextPart=sAux.substring(0,nStart);					
				} else {
					result.sTextPart=sAux.substring(nStart,sAux.length);					
				}
				return result;
			}
		}
		return result;
	}
	var iPos=-1;
	var auxCad="";
	var gotoResult;
	var bCustomStart=false;
	if (bReverse){
		iBlock=selfLength-1;
		gotoResult=fncGotoInitPos();
		if (gotoResult.located){
			iBlock=gotoResult.iBlockResult-1;
			auxCad=gotoResult.sTextPart;
			bCustomStart=true;
		}
		while (bCustomStart||((iBlock>=0)&&(iPos<0))){
			bCustomStart=false;
			while ((auxCad.length<tgtLength)&&(iBlock>=0)){
				auxCad=self[iBlock]+auxCad;
				iBlock--;
			}
			if (auxCad.length<tgtLength) return -1;
			iPos=auxCad.indexOf(sTargetText);
			if (iPos<0){
				auxCad=auxCad.substring(0,tgtLength-1);
			} else {
				var iPosAux=iPos;
				iBlock++;
				while (self[iBlock].length<iPosAux){
					iPosAux-=self[iBlock].length;
					iBlock++;
				}
				iPos=iPosAux;
			}
		}
		if (iPos<0) return -1;
	} else {
		iBlock=0;
		gotoResult=fncGotoInitPos();
		if (gotoResult.located){
			iBlock=gotoResult.iBlockResult+1;
			auxCad=gotoResult.sTextPart;
			bCustomStart=true;
		}
		while ((iBlock>=0)&&(bCustomStart||((iBlock<selfLength)&&(iPos<0)))){
			bCustomStart=false;
			while ((auxCad.length<tgtLength)&&(iBlock<selfLength)){
				auxCad=auxCad+self[iBlock];
				iBlock++;
			}
			if (auxCad.length<tgtLength) return -1;
			iPos=auxCad.indexOf(sTargetText);
			if (iPos<0){
				auxCad=auxCad.substring(auxCad.length-(tgtLength-1),auxCad.length);
			} else {
//				debugger;
				var sBlockStr="";
				var iLengthAux=auxCad.length;
				var iPosAux=iPos;
				iBlock--;
				if (iBlock>=0){
					sBlockStr=self[iBlock];
					while ((iBlock>=0)&&((iLengthAux-self[iBlock].length)>iPosAux)){
						sBlockStr=self[iBlock];
						iLengthAux-=sBlockStr.length;
						iBlock--;
					}
					if (iBlock>=0){
						iPos=iPos+self[iBlock].length-iLengthAux;
					} else {
						iPos=-1;
					}
				}
			}
		}
		if (iPos<0) return -1;
	}
	// iBlock is the string element that contains the target text .... or a first part of it
	iBlock--;
	var nLetters=0;
	while (iBlock>=0){
		nLetters+=self[iBlock].length;
		iBlock--;
	}
	iPos+=nLetters;
	return iPos;
}
Array.prototype.saSubstring=function(iPosStart,iPosEnd){
	var self=this;
	var iPos=0;
	var nLetters=-1;
	if (isDefined(iPosEnd)){
		nLetters=iPosEnd-iPosStart;
	} else {
		nLetters=self.saLength();
	}
	var iBlock=0;
	var sAux="";
	var accumLetters=0;
	var selfLength=self.length;
	var iPosAux=iPosStart;
	var sResult=[];
	var iResultLength=0;
	while (iBlock<selfLength){
		sAux=self[iBlock];
		if (iPosAux-sAux.length>0){
			iPosAux-=sAux.length;
		} else {
			sAux=sAux.substring(iPosAux,sAux.length);
			sResult.push(sAux);
			iResultLength+=sAux.length;
			nLetters-=sAux.length;
			iBlock++;
			while ((iBlock<selfLength) &&(
					//(iResultLength<nLetters)||
					(nLetters>0))){
				sAux=self[iBlock];
				sResult.push(sAux);
				iResultLength+=sAux.length;
				nLetters-=sAux.length;
				iBlock++;
			}
			if (nLetters==0){
				return sResult;
			} else { // nletters is < 0
				sAux=sResult.pop();
				var nTotalAct=iResultLength-sAux.length;
				nLetters+=sAux.length;
				sAux=sAux.substring(0,nLetters);
				iResultLength+=sAux.length;
				sResult.push(sAux);
				return sResult;
			}
		}
		iBlock++;
	}
	return sResult;
}
Array.prototype.saReplaceAll=function(strTgt,sReplace,repeat){
	var iPos=0;
	var saAux=this;
	var bAllReplaced=false;
	var bReplaced=false;
/*	var sControl="";
	var sControl1="";
	var sControl2="";
	var sControl3="";
	var sControl4="";
	var iPosControl=0;
*/	while (!bAllReplaced){
//		sControl=saAux.saToString();
//		iPosControl=sControl.indexOf(strTgt);
		iPos=saAux.saFindPos(strTgt,false,0);
		bReplaced=false;
		while (iPos>=0){
/*			if (iPosControl!=iPos){
				logError("The target position are different");
				//debugger;
			}
			sControl1=sControl.substring(iPosControl-3,iPosControl+strTgt.length+6);
			sControl=sControl.substring(0,iPosControl)+sReplace+sControl.substring(iPosControl+strTgt.length,sControl.length);
			sControl2=sControl.substring(iPosControl-3,iPosControl+sReplace.length+6);
			sControl3=saAux.saSubstring(iPos-3,iPos+strTgt.length+6);
*/			saAux=saAux.saReplace(iPos,strTgt.length,sReplace);
/*			sControl4=saAux.saSubstring(iPos-3,iPos+sReplace.length+6);
			if (sControl1!=sControl3.saToString()){
				logError("The control of initial are differents");
				//debugger;
			}
			if (sControl2!=sControl4.saToString()){
				logError("The control of results are differents");
				//debugger;
			}
*/			bReplaced=true;
			var iPosAnt=iPos;
			iPos=saAux.saFindPos(strTgt,false,iPos);
/*			iPosControl=sControl.indexOf(strTgt,iPosControl);
			while (iPosControl!=iPos){
				logError("The target position are different");
				iPos=iPosAnt;
				iPosControl=sControl.indexOf(strTgt,iPos);
				iPos=saAux.saFindPos(strTgt,false,iPos);
				//debugger;
			}
		*/
		}		
		if (!bReplaced){
			bAllReplaced=true;
		} else if (isDefined(repeat)&&repeat){
			bAllReplaced=false;
		} else {
			bAllReplaced=true;
		}
	}
	return saAux;
}

Array.prototype.saReplace=function(iPosStart,nLetters,sTextToSet){
	// first goto to the block....
	var self=this;
	var iPos=0;
	var sReplace="";
	if (isDefined(sTextToSet)){
		sReplace=sTextToSet;
	}
	var iBlock=0;
	var sAux="";
	var accumLetters=0;
	var selfLength=self.length;
	var iPosAux=iPosStart;
	while (iBlock<selfLength){
		sAux=self[iBlock];
		if (iPosAux-sAux.length>0){
			iPosAux-=sAux.length;
			iBlock++;
		} else {
			var sResult=sAux.substring(0,iPosAux);
			sResult+=sReplace;
			if ((iPosAux+nLetters)<=sAux.length){ //if iPosAux+nLetters<sAuxLength or == sAuxLength... its not got to another block
				sResult+=sAux.substring(iPosAux+nLetters,sAux.length);
				self[iBlock]=sResult;
				return self;
			}
			self[iBlock]=sResult;
			accumLetters=(sAux.length-iPosAux);
			iBlock++;
			while ((iBlock<selfLength)&&(accumLetters<nLetters)){
				sAux=self[iBlock];
				accumLetters+=sAux.length;
				self[iBlock]="";
				iBlock++;
			}
			if (accumLetters>nLetters){
				iBlock--;
				accumLetters-=sAux.length;
				var iDiff=nLetters-accumLetters;
				sAux=sAux.substring(iDiff,sAux.length);
				self[iBlock]=sAux;
			}
			return self;
		}
	}
}
Array.prototype.saRemoveInnerHtmlTags= function (sReplaceText){
	var arrStrings=this;
	var replaceBy="";
	if (isDefined(sReplaceText)) replaceBy=sReplaceText;
	var objResult=this.saReplaceInnerText("<",">",replaceBy,true);
	var saResult=objResult.arrPrevious;
	if (isDefined(objResult.arrInner)&&(objResult.arrInner.length>0)){
		saResult=saResult.concat(objResult.arrInner);
	}
	if (isDefined(objResult.arrPosterior)&&(objResult.arrPosterior.length>0)){
		saResult=saResult.concat(objResult.arrPosterior);
	}
	return saResult;
};


String.prototype.saRemoveInnerHtmlTags= function (sReplaceText){
	return [this].saRemoveInnerHtmlTags(sReplaceText);
};

String.prototype.saSubstring= function (iPosStart,iPosEnd){
	return [this].saSubstring(iPosStart,iPosEnd);
};
String.prototype.saToString= function (){
	return this;
};
String.prototype.saTrim= function (){
	return this.trim();
};
String.prototype.saLength= function (){
	return this.length;
};

String.prototype.saReplaceAll=function(strTgt,sReplace,repeat){
	return [this].saReplaceAll(strTgt,sReplace,repeat);
}
String.prototype.saAppend= function (sText){
	return this+sText;
};
String.prototype.saFindPos= function (sText,bFromEnd){
	return [this].saFindPos(sText,bFromEnd);
};
String.prototype.saReplace= function (iPos,nLetters,sReplacement){
	return [this].saReplace(iPos,nLetters,sReplacement);
};

String.prototype.saIndexOf= function (sTag,bFindLast,bDivide,startPos,startSubArrayPos){
	return [this].saIndexOf(sTag,bFindLast,bDivide,startPos,startSubArrayPos);
}
String.prototype.saExists= function (sTag){
	return (this.indexOf(sTag)>=0);
}

	
Array.prototype.saToString= function (){
		var saInput=this;
		var sAux="";
		var sString;
		for (var i=0;i<saInput.length;i++){
			sString=saInput[i];
			if (sString!="") sAux+=sString;
		}
		return sAux;
	};
	
Array.prototype.saReplaceInnerText=function(openTag,closeTag,replaceBy,bReplaceAll,otherParams,fromStart){
		var saInput=this;
		var saAux=saInput;
		var bRetry=true;
		var openInd;
		var closeInd;
		var objResult={bLocated:false,
				       nReplaced:0,
				       arrPosterior:[],
					   arrPrevious:saAux};
		var bLocated;
		var bReplace=false;
		if (isDefined(replaceBy)){
			bReplace=true;
		}
		var findStartPos=saAux.length-1;
		var replaceCount=0;
		var bFromLast=true;
		if (isDefined(fromStart)&&fromStart)bFromLast=false;
		while (bRetry){
			bLocated=false;
			openInd=saAux.saIndexOf(openTag,bFromLast,true,findStartPos);
			if (openInd.bLocated){
				closeInd=openInd.arrPosterior.saIndexOf(closeTag,false,true);
				if (closeInd.bLocated){
					objResult={bLocated:true,
							nReplaced:0,
							arrPrevious:openInd.arrPrevious,
							arrPosterior:closeInd.arrPosterior,
							arrInner:closeInd.arrPrevious,
							};
					bLocated=true;
				}
			}
			if ((!bReplace)||(!bLocated)){
				objResult.bLocated=bLocated;
				bRetry=false;
				return objResult;
			} else if (bLocated) {
				var vReplaceAux=replaceBy;
				if (isMethod(replaceBy)){
					vReplaceAux=replaceBy(objResult.arrInner,otherParams);
				}
				if (isString(vReplaceAux)){
					objResult.arrPrevious.push(vReplaceAux);
					objResult.arrInner=[];
				} else if (isArray(vReplaceAux)){
					objResult.arrPrevious.concat(vReplaceAux);
					objResult.arrInner=[];
				} else if (isObject(vReplaceAux)) {
					log ("error");
 				} else { // is primitive
					objResult.arrPrevious.push(vReplaceAux+"");
					objResult.arrInner=[]; 					
 				}
				replaceCount++;
				if (bReplaceAll){
					findStartPos=objResult.arrPrevious.length-1;
					saAux=[objResult.arrPrevious,objResult.arrPosterior];
					bRetry=true;
				} else {
					objResult.bLocated=true;
					objResult.nReplaced=replaceCount;
					return objResult;
				}
			}
		}
	};

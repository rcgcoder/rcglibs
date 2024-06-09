'use strict';

class RCGHashMapFactory{
		constructor(){
			this.nHashCreated=0;
			this.stackAsyncCalls="";
			
		}
		newHashMap(){
			this.nHashCreated++;
			var obj={
				    root:"",
					nodeCache:"",
					nNodes:0}
			obj.name="";
			obj.getFirst=this.getFirst;
			obj.getLast=this.getLast;
			obj.resetNode=this.resetNode;
			obj.intern_node_getChildNumber=this.intern_node_getChildNumber;
			obj.intern_node_getFirst=this.intern_node_getFirst;
			obj.intern_node_getLast=this.intern_node_getLast;
			obj.newEmptyNode=this.newEmptyNode;
			obj.newNode=this.newNode;
			obj.logicDelete=this.logicDelete;
			obj.findMaxKey=this.findMaxKey;
			obj.findMinKey=this.findMinKey;
			obj.findPos=this.findPos;
			obj.getValue=this.getValue;
			obj.setValue=this.setValue;
			obj.getValueByAttr=this.getValueByAttr;
			obj.exists=this.exists;
			obj.find=this.find;
			obj.findByInd=this.findByInd;
			obj.internal_updateFirstLast=this.internal_updateFirstLast;
			obj.updateFirstLast=this.updateFirstLast;
			obj.refreshChildNumber=this.refreshChildNumber;
			obj.updateChildNumber=this.updateChildNumber;
			obj.trace=this.trace;
			obj.traceAll=this.traceAll;
			obj.walk=this.walk;
			obj.walkAsync=this.walkAsync;
			obj.check=this.check;
			obj.clear=this.clear;
			obj.swing_acumulators=this.swing_acumulators;
			obj.swing=this.swing;
			obj.push=this.push;
			obj.pop=this.pop;
			obj.top=this.top;
			obj.add=this.add;
			obj.addOrReplace=this.addOrReplace;
			obj.addNode=this.addNode;
			obj.changeParent=this.changeParent;
			obj.remove=this.remove;
			obj.length=this.length;
			obj.toArray=this.toArray;
			
			return obj;
		}
		resetNode(node){
				node.key="";
				node.value="";
				node.right="";
				node.left="";
				node.previous="";
				node.next="";
				node.first="";
				node.last="";
				node.parent="";
				node.brothers=[];
		//		node.keyInd=0;
				node.nChilds=0;
				node.getNumSubnodes=this.intern_node_getChildNumber;
				node.getFirst=this.intern_node_getFirst;
				node.getLast=this.intern_node_getLast;
				node.factory=this;

		//		node.deleted=true;
			}
		intern_node_getFirst(){
			if (this.first!=""){
				return this.first;
			} else {
				return this;
			}
		}
		intern_node_getLast(){
			var vLast="";
			if (this.last!=""){
				vLast=this.last;
			} else {
				vLast=this;
			}
			if (vLast.brothers.length>0){
				vLast=vLast.brothers[vLast.brothers.length-1];
			}
			return vLast;
		}
		getFirst(){
			if (this.nNodes==0){
				return "";
			} else if (this.nNodes==1){
				return this.root;
			} else if (this.root.first==""){
				return this.root;
			} else {
				return this.root.first;
			}
		}
		getLast(){
			if (this.nNodes==0){
				return "";
			} else if (this.nNodes==1){
				return this.root;
			} else if (this.root.last==""){
				return this.root;
			} else {
				return this.root.last;
			}
		}

		intern_node_getChildNumber(){
				var numChilds=(this.nChilds+this.brothers.length);
		/*		chronoStart(arguments.callee.name,this.key+"["+numChilds+"]");
				chronoStopFunction();
		*/		return numChilds;
			}
		length(){
			if (this.root==""){
				return 0;
			} else {
				return this.root.getNumSubnodes()+1;
			}
		}
		newEmptyNode(){
				var node={};
				this.resetNode(node);
		/*		node.resetNode=this.resetNode;
				node.findMaxKey=this.findMaxKey;
				node.findMinKey=this.findMinKey;
				node.findPos=this.findPos;
				node.find=this.find;
				node.updateLast=this.updateLast;
				node.updatePrimero=this.updatePrimero;
		*/
				return node;
			}
		newNode(key,value){
				var auxNode;
		/*		if (this.indVacios.length>0){
					var indElem=this.indVacios.pop();
					auxNode=this.elements[indElem];
					auxNode.resetNode();
					auxNode.keyInd=indElem;
				} else {
		*/			auxNode=this.newEmptyNode();
		//			this.elements.push(auxNode);
		//			auxNode.keyInd=this.nNodes;
					this.nNodes++;
		//		}
				auxNode.key=key;
				auxNode.value=value;
				auxNode.deleted=false;
				return auxNode;
			}
		logicDelete(node){
		//		chronoStart(arguments.callee.name,node.key);
				//this.indVacios.push(node.keyInd);  // marca el elemento como deleted
				//node.deleted=true;
				
				this.updateChildNumber(node.parent,-(1+node.brothers.length));
				this.nNodes-=(1+node.brothers.length);
		//		chronoStopFunction();
			}
		findMaxKey(){
				var auxNode=this;
				while (true){
					if (auxNode.last!=""){
						return auxNode.last.key;
					} else if (auxNode.right!=""){
						auxNode=auxNode.right;
					} else {
						return auxNode.key;
					}
				}
			}
		findMinKey(){
				var auxNode=this;
				while (true){
					if (auxNode.first!=""){
						return auxNode.first.key;
					} else if (auxNode.left!=""){
						auxNode=auxNode.left;
					} else {
						return auxNode.key;
					}
				}
			}
		findPos(key,initNode){
				if (this.nNodes==0) return "";
				chronoStartFunction();
				if (this.nodeCache!=""){
					if (this.nodeCache.key==key){
						chronoStopFunction();
						return this.nodeCache;
					}
				}
				var auxNode=this.root;
				if (typeof initNode!=="undefined"){
					auxNode=initNode;
				}
				var prevLast="";
				var prevFirst="";
				while (true) { 
					if (auxNode.key==key){
						this.nodeCache=auxNode;
						chronoStopFunction();
						return auxNode;
					}
					if ((auxNode.last!="")&& (auxNode.last!=prevLast)) {
						if ((auxNode.last.key==key)||(auxNode.last.key<key)){
							chronoStopFunction();
							this.nodeCache=auxNode.last;
							return auxNode.last;
						}
						prevLast=auxNode.last;
					} 
					if ((auxNode.first!="")&& (auxNode.first!=prevFirst)) {
						if ((auxNode.first.key==key)||(auxNode.first.key>key)){
							chronoStopFunction();
							this.nodeCache=auxNode.first;
							return auxNode.first;
						}
						prevFirst=auxNode.first;
					} 
					if (auxNode.key<key){
						if (auxNode.right!=""){
							auxNode=auxNode.right;
						} else {
							chronoStopFunction();
							this.nodeCache=auxNode;
							return auxNode;
						}
					} else {
						if (auxNode.left!=""){
							auxNode=auxNode.left;
						} else {
							chronoStopFunction();
							this.nodeCache=auxNode;
							return auxNode;
						}
					}
				}
			}
		find(key){
				var pos=this.findPos(key);
				if (pos.key==key){
					return pos;
				} else {
					return "";
				}
			}
		exists(key){
				var pos=this.findPos(key);
				if (pos.key==key){
					return true;
				} else {
					return false;
				}
			}
		getValue(key){
				var pos=this.findPos(key);
				if (pos.key==key){
					return pos.value;
				} else {
					return "";
				}
			}
		setValue(key,newValue){
			var pos=this.findPos(key);
			if (pos.key==key){
				pos.value=newValue;
			} else {
				add(key,newValue);
			}
		}
		getValueByAttr(nameFunctionAttribute,findValue){
			var arrResults=[];
			var nodAux=this.getFirst();
			var valAux;
			while (nodAux!=""){
				valAux=nodAux.value;
				if (typeof valAux[nameFunctionAttribute]!=="undefined"){
					var vAux=valAux[nameFunctionAttribute]();
					if (vAux.id==findValue){
						arrResults.push(valAux);
					}
				}
				nodAux=nodAux.next;
			}
			return arrResults;
		}
		findByInd(ind,node){
				chronoStartFunction();
				var nodAux=this.root;
				if (typeof node!=="undefined"){
					nodAux=node;
				}
				var indAux=ind;
				var bFound=false;
				var nodeResult;
				var vResult="";
				while (!bFound) {
					var nNodesTotal=nodAux.getNumSubnodes();
					if (indAux>nNodesTotal){  // si se pasa de la lista se devuelve true.
						bFound=true;
					} else if (indAux==0){
						bFound=true;
						nodAux=nodAux.getFirst();
						vResult=nodAux.value;
					} else if (indAux==(nNodesTotal)){ // is es el último
						bFound=true;
						nodeResult=nodAux.last;
						if (nodeResult==""){
							nodeResult=nodAux;
						}
						if (nodeResult.brothers.length>0){
							vResult=nodeResult.brothers[nodeResult.brothers.length-1].value;
						} else {
							vResult=nodeResult.value;
						}
					} else if (nodAux.left!=""){
						nNodesTotal=nodAux.left.getNumSubnodes();
						if (indAux<=nNodesTotal){ // si el indice es menor que todos los nodes a la left
							nodAux=nodAux.left;
						} else { // si el indice es mayor que todos los nodes a la left
								 // se los restamos
							indAux-=(nNodesTotal+1);
							if (indAux<=nodAux.brothers.length){ // si el nuevo indice es menor que el numero de brothers
																// se devuelve el hermano
								if (indAux==0){
									vResult=nodAux.value;
								} else {
									vResult=nodAux.brothers[indAux-1].value;
								}
								bFound=true; // lo ha encontrado
							} else if (nodAux.right!=""){ // ahora se va a ir por la right
								indAux-=(nodAux.brothers.length+1);
								nodAux=nodAux.right;
							} else {
								bFound=true;
							}
						}
					} else if (nodAux.left==""){
						if (indAux<=nodAux.brothers.length){ // si el nuevo indice es menor que el numero de brothers
															// se devuelve el hermano
							if (indAux==0){
								vResult=nodAux.value;
							} else {
								vResult=nodAux.brothers[indAux-1].value;
							}
							bFound=true; // lo ha encontrado
						} else if (nodAux.right!=""){ // ahora se va a ir por la right
							indAux-=(nodAux.brothers.length+1);
							nodAux=nodAux.right;
						} else {
							bFound=true;
						}
					}
				}
				chronoStopFunction();
				return vResult;
			}
		internal_updateFirstLast(node,sFieldName,sSubnodeName){
				if (node=="") return;
				chronoStartFunction(node.key+"["+node.nChilds+"]");
				var antValue=node[sFieldName];
				var auxSubnode=node[sSubnodeName];
				var subnodeFieldName=auxSubnode[sFieldName];
				var bIsDifferent=false;
				if (auxSubnode==""){ // no tiene izda/decha
					node[sFieldName]="";
					bIsDifferent=(antValue!="");
				} else if (subnodeFieldName==""){ // izda/decha.prim/ult ==""
					node[sFieldName]=auxSubnode;
					bIsDifferent=(antValue!=auxSubnode);
				} else {
					node[sFieldName]=subnodeFieldName;
					bIsDifferent=(antValue!=subnodeFieldName);
				}
				chronoStopFunction();
				return bIsDifferent;
			}
		updateFirstLast(node){
				if (node=="") return;
				chronoStartFunction(node.key+"["+node.nChilds+"]");
				var root=node.factory.root;
				var bUpdateParent=true;
				var auxNode=node;
				var bIsDifferent=false;
				bIsDifferent=this.internal_updateFirstLast(auxNode,"first","left");
				bIsDifferent=this.internal_updateFirstLast(auxNode,"last","right") || bIsDifferent;
				var antNode=auxNode;
				auxNode=auxNode.parent;
				var iProf=0;
				while (bUpdateParent){
					iProf++;
					if (auxNode=="") {
						bUpdateParent=false;
					} else {
						bIsDifferent=false;
						
						if (antNode==auxNode.left){
							bIsDifferent=this.internal_updateFirstLast(auxNode,"first","left");
						} else if (antNode==auxNode.right){
							bIsDifferent=this.internal_updateFirstLast(auxNode,"last","right");
						}
						
						if (bIsDifferent){
							antNode=auxNode;
							auxNode=auxNode.parent;
						} else {
							bUpdateParent=false;
						}
					}
				}
				if (iProf>4){
					var nChilds=root.factory.nNodes;
					var iProfMax=Math.log2(nChilds);
					if ((iProf/iProfMax)>1.5){
						root.factory.swing();
					}
				}
				chronoStopFunction();
			}
		refreshChildNumber(node){
				if (node=="") return;
				chronoStartFunction(node.key+"_["+node.nChilds+"] H:"+node.brothers.length+1);
				var prevChilds=node.nChilds;
				node.nChilds=0;
				if (node.left!=""){
					node.nChilds+=(node.left.getNumSubnodes()+1);
				}
				if (node.right!=""){
					node.nChilds+=(node.right.getNumSubnodes()+1);
				}	
				chronoStopFunction();
		//		chronoStart(arguments.callee.name,"FINAL_"+node.key+"_["+node.nChilds+"] H:"+node.brothers.length+1);
		//		chronoStopFunction();
			}
		updateChildNumber(node,differential){
				var nodeAux=node;
				while (nodeAux!=""){
		//			chronoStart(arguments.callee.name,nodeAux.key+
		//						"("+differential+") ["+nodeAux.nChilds+"-->"+(nodeAux.nChilds+differential)+"]");
					nodeAux.nChilds+=differential;
					nodeAux=nodeAux.parent;
		//			chronoStopFunction();
				}
			}
		trace(node,iProf,sIoD,callValue){
				if (node=="") return;
				var iDeep=0;
				if (typeof iProf!=="undefined"){
					iDeep=iProf;
				}
				var sLeft="";
		/*		if (sIoD=="I"){
					sLeft+="|-- ";
				} else {
					sLeft+="--- ";
				}*/
				var pNodeAux=node.parent;
				var hNodeAux=node;
				var pathNode=[];
				for (var i=0;((i<iDeep)&&(pNodeAux!=""));i++){
					pathNode.push([pNodeAux,hNodeAux]);
					if (pNodeAux==""){
						
					}
					hNodeAux=pNodeAux;
					pNodeAux=pNodeAux.parent;
				}
				var auxPath;
				var hasRight=false;
				var isLeft=true;
				while (pathNode.length>0){
					auxPath=pathNode.pop();
					pNodeAux=auxPath[0];
					hNodeAux=auxPath[1];
					isLeft=(pNodeAux.left==hNodeAux);
					hasRight=(pNodeAux.right!="");
					if (pathNode.length>0){
						if (isLeft){
							if (hasRight){
								sLeft+="|  ";
							} else {
								sLeft+="   ";
							}
						} else {
							sLeft+="   ";
						}
					} else {
						if (isLeft){
							if (hasRight){
								sLeft+="|--";
							} else {
								sLeft+="L--";
							}
						} else {
							sLeft+="L--";
						}
					}
				}

				var sLeftRight=" ";
				if (typeof sIoD!=="undefined"){
					sLeftRight=sIoD;
				}
				var nLefts=0;
				var nRights=0;
				if (node.right!=""){
					nRights=node.right.getNumSubnodes()+1;
				}
				if (node.left!=""){
					nLefts=node.left.getNumSubnodes()+1;
				}
				var fncTraceNode=function(sTexto,nNode){
					return " "+sTexto+":"+((nNode!="")?nNode.key+" ["+node.nChilds+"] ":"No childs");
				}
				var sTrace="("+sLeftRight+")"+sLeft+node.key+" ["+node.nChilds+"] I:"+nLefts+" D:"+nRights + " H:"+node.brothers.length;
				sTrace+=fncTraceNode("parent",node.parent);
				sTrace+=fncTraceNode("first",node.first);
				sTrace+=fncTraceNode("last",node.last);
				log(sTrace);
				if (typeof callValue!=="undefined"){
					callValue(node.value,iDeep,"   "+sLeft);
				}
				this.trace(node.left,iDeep+1,"I",callValue);
				this.trace(node.right,iDeep+1,"D",callValue);
			}
		traceAll(callValue){
				var auxCallValue=callValue;
				if (typeof callValue==="undefined"){
					auxCallValue=function(nodeValue,iDeep,sPrefix){
						
					}
				}
				var vUndef;
				log("============ Hash Map ==========");
				log("==                            ==");
				log("==                            ==");
				this.trace(this.root,vUndef,vUndef,auxCallValue);
				log("==                            ==");
				log("==                            ==");
				log("================================");
				
			}
		walk(callNode,iProf){
			var nodAux=this.getFirst();
			var bContinue=true;
			var iLoopItem=0;
			while ((nodAux!="")&&bContinue){
				bContinue=(callNode(nodAux.value,iProf,nodAux.key,iLoopItem++)==false?false:true);
				
				for (var i=0;(i<nodAux.brothers.length)&&bContinue;i++){
					bContinue=(callNode(nodAux.brothers[i].value,iProf,nodAux.key,iLoopItem++)==false?false:true);
				}
				nodAux=nodAux.next;
			}
		}
		stepAsync(){
			var nLevels=hashmapFactory.stackAsyncCalls.length();
			if (nLevels>0) { 
				var bStop=false;
				var initTimestamp=new Date().getTime();
				var nElements=0;
				var objStep="";
				var callEnd;
				var callBlock;
				var callItem;
				var secsLoop;
				var bFirst=true;
				var bFinish=false;
				var vResult;
				var type=0; // por defecto se recorre (0), bucle (1)
				var nodAux; // para tipos recorre
				var indAct=0,indMin,indMax; // para tipos bucle 
				while ((!bStop)&&(!bFinish)){
					objStep=hashmapFactory.stackAsyncCalls.top();
					if (bFirst){
						callEnd=objStep.callEnd;
						secsLoop=objStep.secsLoop;
						callItem=objStep.callItem;
						type=objStep.type;
						indAct=objStep.index;
						if (type=="Walk"){
							type=0;
						} else if (type=="Loop"){
							type=1;
							indMin=objStep.indMin;
							indMax=objStep.indMax;
						}
						bFirst=false;
					}
					if (type==0) {
						nodAux=objStep.nextNode;
						bFinish=(nodAux=="");
					} else {
						bFinish=(indAct>=indMax);
					}
					bStop=true;
					if (!bFinish) {
						objStep.index++;
						indAct++;
						nElements++;
						//factoriaHashMaps.stackAsyncCalls.push(objStep);
						// tiene que devolver true o false (true:continua, false:finaliza)
						// si no devuelve nada entonces se entiende que continua
						if (type==0) {
							objStep.actualNode=nodAux;
							objStep.nextNode=nodAux.next;
							objStep.value=nodAux.value;
						} else if (type==1){
							objStep.value=objStep.index-1;
						}
						vResult=!callItem(objStep);
						bFinish=false;
						if (typeof vResult!=="undefined"){
							bFinish=!vResult;
						}
						bStop=(nLevels!=hashmapFactory.stackAsyncCalls.length());
						if (!bStop){
							bStop=((new Date().getTime()-initTimestamp)>secsLoop);
						}
					}
				}
//				if (objStep!=""){
				hashmapFactory.stackAsyncCalls.walk(
							function (auxObjStep){
								hashmapFactory.asyncCallBlocks(auxObjStep);
							});
//				}
				if (bFinish) { // final del walk
					var theParent=this;
					setTimeout(function(){
						var objStepAux=hashmapFactory.stackAsyncCalls.top();
						if (objStepAux==objStep){
							hashmapFactory.stackAsyncCalls.pop();
							// last bloque
							if (typeof callEnd!=="undefined"){
								callEnd(objStep);
							}
							if (isDefined(objStep.barrier)){
								objStep.barrier.finish(objStep.hashmap);
							}
							if (hashmapFactory.stackAsyncCalls.length()>0){
								setTimeout(function(){
									hashmapFactory.stepAsync();	
								});
							}
						} else {
							log("Se salta este paso porque el TOP no coincide con el que se esta procesando");
						}
					});
				} else {
					if (nLevels==hashmapFactory.stackAsyncCalls.length()){ // hay bloques porque el proceso hijo no tiene actividad asincrona
						setTimeout(function(){ // next bloque
							hashmapFactory.stepAsync();	
						});
					}
				}
			}
		}
		asyncWait(){
			hashmapFactory.stackAsyncCalls.push("WAIT");
		}
		asyncResume(){
			var lastElem=hashmapFactory.stackAsyncCalls.pop();
			if (lastElem!="WAIT"){
				log("Error al continuar un proceso asinchrono");
			} else {
				setTimeout(function(){
					hashmapFactory.stepAsync();
				});
			}
		}
		asyncDefaultCallBlockPercent(objStep){
			hashmapFactory.asyncLogBlock(objStep);
		}
		asyncDefaultCallBlockTime(objStep){
			hashmapFactory.asyncLogBlock(objStep);
		}
		asyncLogBlock(objStep){
			var sCad=objStep.type+" "+objStep.name+" ind. Actual:"+objStep.index+ " ["+objStep.indMin+","+objStep.indMax+"] "
					+ "\n Operaciones Procesadas:"+objStep.opsProcessed
					+ "\n Avance:"+objStep.lastBlockPercent.toFixed(2)+" % "
					+ "\n Rendimiento:"+objStep.opsPerSec.toFixed(2) + " Ops/s "
					+ "\n Tiempo/op:"+objStep.secsPerOp.toFixed(2) + " Secs/Ops"
					+ "\n Inicio:"+formatDate(new Date(objStep.initTimestamp),4)
					+ "\n Duracion:"+inSeconds(((new Date().getTime()-objStep.initTimestamp)/1000))
					+ "\n T. Restante:"+inSeconds(objStep.estimatedTime)
					+ "\n Bloques Tiempo:"+objStep.nBlockTime+ (objStep.nBlockTime>0?" ("+(objStep.opsProcessed/objStep.nBlockTime).toFixed(2)+" ops/blq)":"")
					+ "\n Bloques Porcentaje:"+objStep.nBlockPercent+ (objStep.nBlockPercent>0?" ("+(objStep.opsProcessed/objStep.nBlockPercent).toFixed(2)+" ops/%)":"")
					+ "\n Anidamiento:"+objStep.deep;
			var sDeep="";
			hashmapFactory.stackAsyncCalls.walk(function(stepAux){
				if (stepAux.deep<objStep.deep){
					sDeep+="["+stepAux.type+" "+stepAux.name+"("+stepAux.index+")]";
				}
			});
			sCad=sDeep+sCad;
			log(sCad);
		}
		asyncCallBlocks(objStep,force){
			/* que datos interesan 
				index actual
				index 
			*/
			objStep.bLaunchBlockPercent=false;
			objStep.bLaunchBlockTime=false;
			var nOps=(objStep.index-objStep.indMin);
			objStep.opsProcessed=nOps;
			var total=(objStep.indMax-objStep.indMin);
			var nOpsRemain=0;
			if (total>0) {
				nOpsRemain=total-nOps;
				objStep.percProcessed=Math.round(100*nOps/total);
				if ((objStep.percProcessed-objStep.lastBlockPercent)>1){
					objStep.nBlockPercent++;
					objStep.bLaunchBlockPercent=true;
					objStep.lastBlockPercent=objStep.percProcessed;
				} else {
					objStep.bLaunchBlockPercent=false;
				}
			} else {
				objStep.bLaunchBlockPercent=false;
			}
			
			if (objStep.lastBlockTime==0){
				objStep.lastBlockTime=new Date().getTime();
			} 
			var totalTime=(new Date().getTime()-objStep.initTimestamp)/1000;
	/*		var totalLastBlock=(new Date().getTime()-objStep.lastBlockTime)/1000;
		*/	var timeBlock=(new Date().getTime()-objStep.lastBlockTime)/1000;
			if (timeBlock>objStep.secsLoop){
				objStep.nBlockTime++;
				objStep.bLaunchBlockTime=true;
				objStep.lastBlockTime=new Date().getTime();
			} else {
				objStep.bLaunchBlockTime=false;
			}
			if ((typeof force!=="undefined")&&(force)){
				objStep.bLaunchBlockTime=true;
				objStep.bLaunchBlockPercent=true;
				objStep.nBlockPercent++;
				objStep.lastBlockPercent=100;
				objStep.nBlockTime++;
				objStep.lastBlockTime=new Date().getTime();
			}
			
			if (objStep.bLaunchBlockTime||objStep.bLaunchBlockPercent){
				if (totalTime>0){
					objStep.opsPerSec=nOps/totalTime;
				}
				if (nOps>0){
					objStep.secsPerOp=totalTime/(nOps);
				}
				objStep.estimatedTime=(nOpsRemain*objStep.secsPerOp);
				if (objStep.bLaunchBlockTime){
					objStep.callBlockTime(objStep);
					objStep.bLaunchBlockTime=false;
					
				}
				if (objStep.bLaunchBlockPercent){
					objStep.callBlockPercent(objStep);
					objStep.bLaunchBlockPercent=false;
				}
			}
		}
		walkAsync(sName,callNode,callEnd,callBlockPercent,callBlockTime,secsLoop,hsOtherParams,barrier){
			if (isDefined(barrier)){
				barrier.start(this);
			}
			if (hashmapFactory.stackAsyncCalls==""){
				hashmapFactory.stackAsyncCalls=newHashMap();
			}
			var nodAux=this.getFirst();
			var sBloq=3;
			if (typeof secsLoop!=="undefined"){
				sBloq=secsLoop;
			}
			var auxCallBlockPercent=hashmapFactory.asyncDefaultCallBlockPercent;
			var auxCallBlockTime=hashmapFactory.asyncDefaultCallBlockTime;
			
			if (typeof callBlockPercent!=="undefined"){
				if (callBlockPercent==false){
					auxCallBlockPercent=fncEmpty;
				} else {
					auxCallBlockPercent=callBlockPercent;
				}
				/*auxCallBloque=function(nBloque,nElements,lastIndex,deep,hashmap,procesosPendientes){
					log("Bloque:"+nBloque+" Elementos en Bloque:"+nElements+ " last Indice:"+lastIndex+" Prof:"+deep+" Procesos Pendientes:"+procesosPendientes);
				};*/
			}
			if (typeof callBlockTime!=="undefined"){
				if (auxCallBlockTime==false){
					auxCallBlockTime=fncEmpty;
				} else {
					auxCallBlockTime=callBlockTime;
				}
			}
			var objStep={name:sName,type:"Walk",value:""
							,actualNode:""
							,nextNode:nodAux,hashmap:this,index:0,indMin:0,indMax:this.length()
							,deep:hashmapFactory.stackAsyncCalls.length()
							,callItem:callNode,callEnd:callEnd
							,initTimestamp:new Date().getTime()
							,lastBlockTime:0
							,callBlockPercent:auxCallBlockPercent
							,callBlockTime:auxCallBlockTime
							,secsLoop:sBloq
							,percProcessed:0.0
							,lastBlockPercent:0.0						
							,opsPerSec:0
							,secsPerOp:0
							,estimatedTime:0
							,bLaunchBlockPercent:false
							,bLaunchBlockTime:false
							,opsProcessed:0
							,nBlockPercent:0
							,nBlockTime:0
							,hsOtherParams:hsOtherParams
							,barrier:barrier
							,deepLevel:hashmapFactory.stackAsyncCalls.length()+1
							};
			hashmapFactory.stackAsyncCalls.push(objStep);
//			setTimeout(function(){
			hashmapFactory.stepAsync();
//			});
		}
		loopAsync(sName,initIndex,lastIndex,callItem,callEnd
										,callBlockPercent,callBlockTime,secsLoop,hsOtherParams,barrier){
			if (isDefined(barrier)){
				barrier.start(this);
			}
			if (hashmapFactory.stackAsyncCalls==""){
				hashmapFactory.stackAsyncCalls=newHashMap();
			}
			var sBlk=3;
			if (typeof secsLoop!=="undefined"){
				sBlk=secsLoop;
			}
			var auxCallBlockPercent=hashmapFactory.asyncDefaultCallBlockPercent;
			var auxCallBlockTime=hashmapFactory.asyncDefaultCallBlockTime;

			if (typeof callBlockPercent!=="undefined"){
				if (callBlockPercent==false){
					auxCallBlockPercent=fncEmpty;
				} else {
					auxCallBlockPercent=callBlockPercent;
				}
			}
			if (typeof callBlockTime!=="undefined"){
				if (auxCallBlockTime==false){
					auxCallBlockPercent=fncEmpty;
				} else {
					auxCallBlockTime=callBlockTime;
				}
			}
			var objStep={name:sName,type:"Loop",value:initIndex,index:initIndex,indMin:initIndex,indMax:lastIndex
							,deep:hashmapFactory.stackAsyncCalls.length()
							,callItem:callItem
							,callEnd:callEnd
							,initTimestamp:new Date().getTime()
							,lastBlockTime:0
							,callBlockPercent:auxCallBlockPercent
							,callBlockTime:auxCallBlockTime
							,secsLoop:sBlk
							,percProcessed:0.0
							,lastBlockPercent:0.0						
							,opsPerSec:0
							,secsPerOp:0
							,estimatedTime:0
							,bLaunchBlockPercent:false
							,bLaunchBlockTime:false
							,opsProcessed:0
							,nBlockPercent:0
							,nBlockTime:0
							,hsOtherParams:hsOtherParams
							,barrier:barrier
							,deepLevel:hashmapFactory.stackAsyncCalls.length()+1
							};
			hashmapFactory.stackAsyncCalls.push(objStep);
//			setTimeout(function(){
			hashmapFactory.stepAsync();
//			});
		}

		check(initNode){
				if (initNode=="") return;
				chronoStartFunction();
				var node=this.root;
				if (typeof initNode!=="undefined"){
					node=initNode;
				}
				var arrNodes=[node];
				var bResult=false;
				var bError=false;
				while ((arrNodes.length>0)&&(!bError)){
					node=arrNodes.pop();
					if (node!=""){
						if (node.parent==""){
							if ((node.getNumSubnodes())!=(this.nNodes-1)){
								bError=true;
								log("ERROR El node:" + node.key + " es Raiz y debería tener "+ (this.nNodes-1) +" hijos pero tiene:"+(node.getNumSubnodes()));
							}
								
						} else {
							var isGoodParent=false;
							if (node.parent.left!=""){
								if (node.parent.left==node){
									isGoodParent=true;
								}
								if ((node.parent.first==node)&&(node.first!="")){
									bError=true;
									log("ERROR el first del parent " +node.parent.key + " apuntan al node:" + node.key + " y debería apuntar a "+ node.first.key);
								}
								if (node.parent.first==""){
									bError=true;
									log("ERROR el first del parent " +node.parent.key + " no esta bien establecido debería apuntar a " + node.key + " y debería apuntar al node o a node.first");
								}

							} 
							if (node.parent.right!=""){
								if (node.parent.right==node){
									if (isGoodParent){
										bError=true;
										log("ERROR los dos hijos del parent " +node.parent.key + " apuntan al node:" + node.key);
									}
									isGoodParent=true;
								}
								if ((node.parent.last==node)&&(node.last!="")){
									bError=true;
									log("ERROR el last del parent " +node.parent.key + " apuntan al node:" + node.key + " y debería apuntar a "+ node.last.key);
								}
								if (node.parent.last==""){
									bError=true;
									log("ERROR el last del parent " +node.parent.key + " no esta bien establecido debería apuntar a " + node.key + " y debería apuntar al node o a node.first");
								}
							} 
							if (!isGoodParent){
								bError=true;
								log("ERROR Ningún hijo del parent " +node.parent.key + " apunta al node:" + node.key);
							}
						}
						var nChilds=0;
						if ((node.first!="")&&(node.left!="")){
							if (node.left.first!=""){
								if (node.first.key!=node.left.first.key){
									bError=true;
									log("ERROR el first del node " +node.key + " no esta bien establecido debería apuntar a " + node.left.first.key);
								}
							} else {
								if (node.first.key!=node.left.key){
									bError=true;
									log("ERROR el first del node " +node.key + " no esta bien establecido debería apuntar a " + node.left.key);
								}
							}
							nChilds+=(node.left.getNumSubnodes()+1);
						} else if ((node.first=="")&&(node.left!="")){
							nChilds+=(node.left.getNumSubnodes()+1);
							bError=true;
							log("ERROR el first del node " +node.key + " no esta bien establecido debería apuntar a " + node.left.key);
						} else if ((node.first!="")&&(node.left=="")){
							bError=true;
							log("ERROR el first del node " +node.key + " no esta bien establecido. debería apuntar ser '' ");
						}
						if ((node.last!="")&&(node.right!="")){
							if (node.right.last!=""){
								if (node.last.key!=node.right.last.key){
									bError=true;
									log("ERROR el last del node " +node.key + " no esta bien establecido debería apuntar a " + node.right.last.key);
								}
							} else {
								if (node.last.key!=node.right.key){
									bError=true;
									log("ERROR el last del node " +node.key + " no esta bien establecido debería apuntar a " + node.right.key);
								}
							}
							nChilds+=(node.right.getNumSubnodes()+1);
						} else if ((node.last=="")&&(node.right!="")){
							nChilds+=(node.right.getNumSubnodes()+1);
							bError=true;
							log("ERROR el last del node " +node.key + " no esta bien establecido debería apuntar a " + node.right.key);
						} else if ((node.last!="")&&(node.right=="")){
							bError=true;
							log("ERROR el last del node " +node.key + " no esta bien establecido. debería apuntar ser '' ");
						}
						if (node.nChilds!=nChilds){
							bError=true;
							log("ERROR no coincide el número de hijos del node:"+ node.key+" I+D+(IH+DH):"+nChilds+ " en node:"+node.nChilds);
						}
						
						if (bError){
							log("ERROR detectado en el node:" + node.key);
						}
						arrNodes.push(node.left);
						arrNodes.push(node.right);
						bResult=bResult || bError;
						bError=false;
					}
				}
				chronoStopFunction();
				return bResult;
			}
		swing_acumulators(arrNodes,parentNode){
				chronoStartFunction(parentNode.key);
				for (var i=0;i<arrNodes.length;i++){
					var nodAux=arrNodes[i];
					if (nodAux!=""){
						if (nodAux.key>parentNode.key){
							if (parentNode.right!=""){
								log("error intentando asignar a la right... y parece que ya esta ocupada");
							}
							parentNode.right=nodAux; // right del superior es el segundo de los que aparecen
							parentNode.right.parent=parentNode;
							if (parentNode.right.last!=""){
								parentNode.last=parentNode.right.last;
							} else {
								parentNode.last="";
							}
							// tambien se actualiza el numero de hijos
							parentNode.nChilds+=parentNode.right.getNumSubnodes()+1;
						} else {
							if (parentNode.left!=""){
								log("error intentando asignar a la left... y parece que ya esta ocupada");
							}
							parentNode.left=nodAux; // left del superior es el first de los que aparecen
							parentNode.left.parent=parentNode; // se actualizan los padres de ambos nodes
							if (parentNode.left.first!=""){
								parentNode.first=parentNode.left.first;
							} else {
								parentNode.first="";
							}
							// tambien se actualiza el numero de hijos
							parentNode.nChilds+=parentNode.left.getNumSubnodes()+1;
						}
					}
				}
				this.updateFirstLast(parentNode);
				chronoStopFunction();
			}
		clear(){
			this.nNodes=0;
			this.root="";
		}
		swing(node){
				log("Swinging");
				if (this.root=="") return;
				chronoStartFunction();
		//		this.check(this.root);
		//		this.traceAll();
				var nodAux=this.root;
				if ((typeof node!=="undefined") && (node!="")){
					nodAux=node;
				}
				// first buscamos el node mas alto que presenta balanceo
				var unSwing="";
				var nLefts=0;
				var nRights=0;
				var nTotalNodes=0;
		/*		while (nodAux!=""){
					nLefts=0;
					nRights=0;
					if (nodAux.right!=""){
						nRights=nodAux.right.getNumSubnodes()+1;
					}
					if (nodAux.left!=""){
						nLefts=nodAux.left.getNumSubnodes()+1;
					}
					var nTotalNodes=nodAux.getNumSubnodes()+1;
					//(75-25)=50/100=0.5
					//(10-9)=1/100=0.01
					var swingLevel=Math.abs(nLefts-nRights);
					if (swingLevel>3){
						swingLevel=(swingLevel/nTotalNodes);
					} else {
						swingLevel=0;
					}
					if (swingLevel>0.05) {
						unSwing=nodAux;
					}
					nodAux=nodAux.parent;
				}
				if (unSwing=="") {
					chronoStopFunction();
					return;
				}
				*/
		//		log("Va a swing...");
				unSwing=this.root;
		//		log("Balancea desde la Raiz");
				var initNode=unSwing;
				var initParent=unSwing.parent;

				var theParent=unSwing;
				var nBits=0;
				var iInd=1;
				var nodeCounter=0;
				var nodePool=[];
				var nodeAct;
				if (theParent.first!=""){
					nodeAct=theParent.first;
				} else {
					nodeAct=theParent;
				}
				var arrNodesLevel;
				var arrNodesUpperLevel;
				var parentNod;
				var levelId=1;
				var levelMask=1;
		/*		var me=this;
				var fncTracePool=function(){
					log("tracendo Pool");
					for (var i=(nodePool.length-1);i>=0;i--){
						log("Nivel:"+i);
						for (var j=0;j<nodePool[i].length;j++){
							me.trace(nodePool[i][j]);
						}
					}
				}*/
				/*
				if (typeof nodePool[levelId]==="undefined"){ //si nunca se habia alcanzado ese nivel.
					//creamos los arrais que corresponden en el pool de nodes
					while (nodePool.length<=levelId){
						nodePool.push([]);
					}
					// ahora ya existe y se añade el node.
				}*/
				for (var i=0;i<32;i++){
					nodePool.push(["",""]);
				}

				chronoStart("procesandolista");
				while (nodeAct!=""){
					// hay que encontrar el nivel del node
					// ejemplo 1 ->    1 // nivel 1
					// ejemplo 5 ->  101 // nivel 1
					// ejemplo 8 -> 1000 // nivel 4
					// ejemplo 9 -> 1001 // nivel 1
					// ejemplo 14 ->1110 // nivel 2
					
					/*
					Para balanceo completo en dos niveles
					
					*/
					//fncTracePool();
					levelId=1;
					levelMask=1;
					while((levelMask&iInd)==0){
						levelMask=levelMask<<1;
						levelId++;
					}
					levelId--;
					//se limpia el node
					nodeAct.parent="";
					nodeAct.left="";
					nodeAct.right="";
					nodeAct.nChilds=0;
					nodeAct.first="";
					nodeAct.last="";

					if (nodePool[levelId][1]==""){ // si había 0 o 1 node en ese nivel.
						if (nodePool[levelId][0]==""){
							nodePool[levelId][0]=nodeAct; // añadimos otro node al nivel
						} else {
							nodePool[levelId][1]=nodeAct; // añadimos otro node al nivel
						}
					} else { // si había 2 nodes en el nivel
						// se van a quitar ambos añadiendoselos al node en el nivel superior
						arrNodesLevel=nodePool[levelId];  // se sacan ambos nodes.
						arrNodesUpperLevel=nodePool[levelId+1];
						parentNod=arrNodesUpperLevel[1];// se obtiene el last de los nodes en el nivel superior
						if (parentNod==""){
							parentNod=arrNodesUpperLevel[0];
						}
						//fncTracePool();
						this.swing_acumulators(arrNodesLevel,parentNod);
						//fncTracePool();
						nodePool[levelId][0]=nodeAct; // se quitan los dos nodes existentes y se mete el actual.
						nodePool[levelId][1]=""; // se quitan los dos nodes existentes y se mete el actual.
						//fncTracePool();
					}
					nodeCounter+=nodeAct.brothers.length+1;
					nodeAct=nodeAct.next;
					iInd++;
				}
				chronoStop();
				// ha terminado con el listado... ahora esta todo en el pool de nodes.... hay que ir de 0 a length

				chronoStart("finalizandoLista");
				//fncTracePool();
				arrNodesLevel=nodePool.pop();
				while (arrNodesLevel[0]==""){
					arrNodesLevel=nodePool.pop(); //el único elemento del nivel mas alto
				}

		/*		if (arrNodesLevel.length>0){
					log("Varios Elementos a nivel RAIZ");
				}
		*/		var newTree=arrNodesLevel[0]; //el único elemento del nivel mas alto
				var nodAux=newTree;
				var prevChilds=0;
				var diffChilds=0;
				var nodAux2;
				while(nodePool.length>0){
					//fncTracePool();
					arrNodesLevel=nodePool.pop();  // se sacan ambos nodes.
					prevChilds=nodAux.nChilds;
					/*if ((nodAux.left!="")||(nodAux.right!="")){
						log("Ya tiene left o right");
					}*/
					this.swing_acumulators(arrNodesLevel,nodAux);
					nodAux2=nodAux.parent;
					while (nodAux2!=""){
						this.refreshChildNumber(nodAux2);
						nodAux2=nodAux2.parent;
					}
					if (nodAux.right!=""){
						nodAux=nodAux.right;
					} else if (nodAux.left!=""){
						nodAux=nodAux.left;
					}
					while((nodAux.right!="")&&(nodAux.left!="")&&(nodAux!="")){
						//log("Buscando un parent donde quepa el next node");
						nodAux=nodAux.parent;
					}

					//fncTracePool();
				}
				this.refreshChildNumber(newTree);
				chronoStop();
				
				chronoStart("AsignandoPadreyComprobaciones");

				var nTotalNodesTree=newTree.getNumSubnodes()+1;
				if (nodeCounter!=nTotalNodesTree){
					log("Difiere el numero de hijos "+nodeCounter+"!="+nTotalNodesTree);
				}
				
				//fncTracePool();
				//this.trace(newTree);
				if (initParent==""){
					this.root=newTree;
					if (nTotalNodesTree!=this.nNodes){
						log("Difiere el numero de hijos con el Numero de nodes creados");
					}
				} else {
					var nChilds=0;
					var nPreviousChilds=initParent.nChilds;
					if (initParent.key<newTree.key){
						nChilds+=(initParent.left.getNumSubnodes()+1);
					} 
					if (initParent.right!=""){
						if (initParent.right.key==initNode.key){
							initParent.right=newTree;
						}
						nChilds+=(initParent.right.getNumSubnodes()+1);
					}
					if (nPreviousChilds!=nChilds){
						log("Difiere el numero de Hijos del parent Inicial"+ nPreviousChilds+"!="+nChilds);
					}
					initParent.nChilds=nChilds;
				}
				//this.traceAll();
				chronoStop();
				chronoStopFunction();
			}
		push(value,key){
				if (typeof key!=="undefined"){
					this.add(key,value);
				} else {
					this.add("",value);
				}
			}
		top(){
			var vNode=this.findPos("",this.root);
			if (vNode==""){
				return vNode;
			}
			var vResult;
			if (vNode.brothers.length>0){
				vResult=vNode.brothers[vNode.brothers.length-1].value;
			} else {
				vResult=vNode.value;
			}
			return vResult;
		}
		pop(){
				var vNode=this.findPos("",this.root);
				if (vNode==""){
					return vNode;
				}
				var vResult;
				if (vNode.brothers.length>0){
					this.updateChildNumber(vNode.parent,-1);
					this.nNodes--;
					vResult=vNode.brothers.pop().value;
				} else {
					vResult=vNode.value;
					this.remove("");
				}
				return vResult;
			}
		addOrReplace(key,value){
			var nodAux=this.find(key);
			if (nodAux==""){
				this.add(key,value);
			} else {
				nodAux.value=value;
			}
		}
		add(key,value){
				var vUndef;
				if (this.nNodes==0){ // el primer node del arbol... 
					this.root=this.newNode(key,value);
					return this.root;
				}
				var args=arguments;
				chronoStartFunction();
			//	this.check(this.root);
				var newNode=this.newNode(key,value);
			//	this.check(this.root);
				newNode=this.addNode(this.root,newNode);
				chronoStopFunction();
				return newNode;
			}
		addNode(parentNode,newNode){
				if (this.nNodes==0){
					this.root=newNode;
					return newNode;
				}
				var key=newNode.key;
				var pos=this.findPos(key,parentNode);
				if (pos.key==key){
					pos.brothers.push(newNode);
					this.updateChildNumber(pos.parent,1);
					return newNode;
				}
				chronoStartFunction();
				//pos=parentNode;
				if (pos.key<newNode.key){ //El nuevo node se coloca a la right de POS
					if (pos.right=="") { // si no hay nadie a su right... que no debería haber nadie a la right
						pos.right=newNode;
						if (pos.next!=""){
							newNode.next=pos.next;
							newNode.next.previous=newNode;
						}
						newNode.previous=pos;
						newNode.previous.next=newNode;
					} else {
						log("Pos right debería estar VACIO");
						alert("Error al añadir node.. La posicion right deberia estar VACIA:"+key);
						vUndef.peta("MegaError");
						return "ERROR";
					}
				} else { //El nuevo node se coloca a la left de POS
					if (pos.left=="") { // si no hay nadie a su left... que no debería haber nadie a la left
						pos.left=newNode;
						if (pos.previous!=""){
							newNode.previous=pos.previous;
							newNode.previous.next=newNode;
						}
						newNode.next=pos;
						newNode.next.previous=newNode;
					} else {
						log("Pos left debería estar VACIO");
						alert("Error al añadir node.. La posicion left deberia estar VACIA:"+key);
						vUndef.peta("MegaError");
						return "ERROR";
					}
				}
				newNode.parent=pos;
				this.updateChildNumber(pos,1);
				this.updateFirstLast(newNode);
		/*		if (newNode.parent!=""){
					this.swing(newNode.parent.parent);
				} else {
					this.swing(newNode.parent);
				}*/
				chronoStopFunction();
				return newNode;
			}

		changeParent(parentNode,prevChild,newChild){
				chronoStartFunction(parentNode.key+"["+parentNode.nChilds+"]");
				var theParent=parentNode;
				if (theParent!=""){
					if (theParent.left!=""){
						if (theParent.left.key==prevChild.key){
							theParent.left=newChild;
							if (newChild!=""){
								newChild.parent=theParent;
							}
							this.updateFirstLast(theParent);
						}
					} 
					if (theParent.right!=""){
						if (theParent.right.key==prevChild.key){
							theParent.right=newChild;
							if (newChild!=""){
								newChild.parent=theParent;
							}
							this.updateFirstLast(theParent);
						}
					}
				}
				chronoStopFunction();
			}
		remove(key){
				chronoStartFunction(key);
				var vUndef;
				var prevAux;
				chronoStart("Buscar",key);
				var pos=this.findPos(key);
				chronoStop();
				if (pos.key!=key){
					chronoStopFunction();
					return "";
				} else {
					//logPush();
					//this.traceAll();
					//var sTraceArbol=logPop(false);
					if (pos.parent==""){
						chronoStart("Borrando_Raiz",pos.key);
					}
					this.logicDelete(pos); // sacamos el node del arbol.
					//// quitamos el numero de hijos del parent y ancestros 
					//this.updateChildNumber(theParent,-(1+pos.brothers.length)); (lo hace logicDelete)

					var theParent=pos.parent; //cogemos el antiguo parent del que dependera el hijo sustituto
					
					// antes de tocar el arbol tenemos que sustituir los next previous que son independientes
					if ((pos.next!="")&&(pos.previous!="")){
						pos.next.previous=pos.previous;
						pos.previous.next=pos.next;
					} else if (pos.next!=""){
						pos.next.previous="";
					} else if (pos.previous!=""){
						pos.previous.next="";
					}
					
					
					// Ahora el arbol
					if (pos.right!=""){ // si el node a borrar tiene mayores
						chronoStart("TieneMayores");
						prevAux=pos.right; // el node sustituto será uno de los de la right
						if (prevAux.first!=""){ // Si hay un menor identificado entre los mayores (será el que sustituirá al node deleted)
							prevAux=prevAux.first;
							chronoStart("Sustituye_por_primero",prevAux.key);
							var prevParent=prevAux.parent;
							//if (prevParent!=""){ //siempre tiene que tener first porque la root no tiene last.
									
								//todos los elements derechos del sustituo son menores que su parent
								//los colgamos de su antiguo parent parent (changeParent controla que prevAux.right sea "")
								this.changeParent(prevParent,prevAux,prevAux.right);
								// quitamos los hijos del parent y los ancestros.
								this.updateChildNumber(prevParent,-(1+prevAux.brothers.length));
								prevAux.right=""; // como ya estan movidos al antiguo parent el prevAux ahora no tiene derechos
								prevAux.last="";
							//}
							chronoStart("Asignamos_izda",prevAux.key);
							if (prevAux.left==""){
								prevAux.left=pos.left; // colgamos todos los izquierdos del antiguo en el izquierdo del sustituto
								if (prevAux.left!=""){ // si el nuevo izquierdo es node
		//							chronoStart("node Asignado",prevAux.left.key);
									prevAux.left.parent=prevAux; // asignamos el sustituto como parent
		//							chronoStop();
								}
							} else {
								alert("Error al eliminar node.. el Menor de los Mayores no debería tener IZQUIERDO:"+key);
								vUndef.peta("MegaError");
							}
							chronoStop();
							chronoStart("Asignamos_dcha",prevAux.key);
							// si el node a sustitutir tenia nodes a la right hay que ponerlos a la right del sustituto
							// if (pos.right!=""){ // el node a sustituir en esta rama siempre tiene nodes a la right
								prevAux.right=pos.right;
								if (prevAux.right!=""){
									prevAux.right.parent=prevAux;
								}
							//}
							chronoStop();
							this.updateChildNumber(theParent,1+prevAux.brothers.length);
							chronoStop();
						} else {
							chronoStart("Sustituye_por_hijoderecho",prevAux.key);
							// si el node derecho no tiene hijos izquierdos. ponemos el hijo derecho como sustituto del node a eliminar
							prevAux.left=pos.left;
							if (prevAux.left!=""){
								chronoStart("node Asignado",prevAux.left.key);
								prevAux.left.parent=prevAux;
								chronoStop();
							}
							chronoStop();
						}
						chronoStart("updatenodes",prevAux.key+"_Padre_"+prevAux.parent.key);
						prevAux.parent=theParent;
						this.updateFirstLast(prevAux);
						// se establece la relacion parent/hijo
						this.changeParent(theParent,pos,prevAux);
						this.updateFirstLast(theParent);
						//this.updateChildNumber(theParent,1);
						this.refreshChildNumber(prevAux);
						//this.refreshChildNumber(theParent);
						chronoStop();
						chronoStop();
					} else { // si no tiene mayores simplemente subiremos el node izquierdo
						prevAux=pos.left;
						chronoStart("Sustituye_por_hijoizquierdo",prevAux.key);
						this.changeParent(theParent,pos,prevAux);
						//this.updateChildNumber(theParent,-(1+pos.brothers.length));
						this.refreshChildNumber(prevAux);
						chronoStop();
					}
					if (pos.parent==""){ //si el deleted es el root la nueva root será prevAux;
						this.root=prevAux;
						chronoStop();
					} 
		//			chronoStopFunction();
		//			chronoStopFunction();
		/*			if (this.check()){
						log("ERROR BORRANDO node:"+key);
						log("ARBOL-SITUACION INICIAL");
						log(sTraceArbol);
						log("ARBOL-SITUACION FINAL");
						this.traceAll();
						chronometros.listar();
					}*/
					chronoStopFunction();
					pos.previous="";
					pos.next="";
					pos.first="";
					pos.last="";
					pos.nChilds=0;
					if (this.nodeCache.key==pos.key){
						this.nodeCache="";
					}
					return pos;
				}
			}
		toArray(arrFields){ //[{doFieldName:,resultFieldName},{}.{}]
			// convert the list of objects to an array []
			var arrResult=[]
			var fncToItem=function(elem){
				var auxElem=elem;
				if (isDefined(arrFields)){
					auxElem={};
					var auxField;
					var doFieldName;
					var doFieldValue;
					var resultFieldName;
					for (var i=0;i<arrFields.length;i++){
						auxField=arrFields[i];
						resultFieldName=auxField.resultFieldName;

						doFieldName=auxField.doFieldName;
						if (doFieldName.toUpperCase()=="SELF"){
							doFieldValue=elem;
						} else {
							doFieldValue=elem[doFieldName];
						}
						auxElem[resultFieldName]=doFieldValue;
					}
				}
				arrResult.push(auxElem);
			}
			this.walk(fncToItem);
			return arrResult;
		}
}
var hashmapFactory;
var newHashMap;
if (isInNodeJS()){
	global.hashmapFactory=new RCGHashMapFactory(); 	
} else {
	hashmapFactory=new RCGHashMapFactory();
	newHashMap=function(){return hashmapFactory.newHashMap();};

}
class RCGHashMapUtils{
	constructor(){
		log("Creating HashMapUtils");
	}
	newHashMap(){
//		log("Start Chrono:"+sName);
		return hashmapFactory.newHashMap();
	}
}
registerClass(RCGHashMapUtils);

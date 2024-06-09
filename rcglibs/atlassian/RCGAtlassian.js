class RCGAtlassian{
	constructor(app){
		var self=this;
		self.proxyPath="";
		self.instance="";
		self.JiraAPConnection=AP;
		self.userId="";
		self.userName="";
		self.app=app;
		self.confluence="";//new RCGConfluence();
		self.jira="";
		self.initialized=true;
		taskManager.extendObject(self);
	}
	getJira(){
		var self=this;
		if (self.jira==""){
			self.jira=new RCGJira(self);
		}
		return self.jira;
	}
	getConfluence(){
		var self=this;
		if (self.confluence==""){
			self.confluence=new RCGConfluence(self);
		}
		return self.confluence;
	}
	loadError(oError){
	    throw new URIError("The URL " + oError.target.src + " is not accessible.");
	}
	getUser(){
		var self=this;
		self.addStep("Calling the API for get Current User",function(){
			self.JiraAPConnection.getUser(self.createManagedCallback(function(user){
				  log("user id", user.id);
				  log("user key", user.key);
				  log("user name", user.fullName);
				  self.userId=user.key;
				  self.userName=user.fullName;
			}));
			return self.waitForEvent();
		});
	}
	apiCallOauth(sTargetUrl,data,sPage,sType,callback,arrHeaders){
		var self=this;
		var sUrl=self.proxyPath+"/oauth"+sTargetUrl;
		var xhr = new XMLHttpRequest();
		xhr.open('GET', sUrl, true);
		xhr.responseType = 'json';
		xhr.onerror=self.loadError;
		xhr.onload = self.createManagedCallback(function(e) {
		  if (xhr.status == 200) {
			  return self.taskResultMultiple(xhr.response,xhr,sTargetUrl,arrHeaders);
		  } else {
			  self.loadError({target:{src:sUrl}});			  
		  }
		});
		xhr.send();	
		return self.waitForEvent();
	}
	apiOauthSecondStep(response,xhr,sUrl,headers){
        var self=this;
        var baseToken="";
		if (response!=null){
            var arrUrlParts=response.url.split("oauth_token=");
            baseToken=arrUrlParts[1];
			log("Second Step Oauth Jira URL:"+response.url);
		} else {
			log("Second Step Oauth Jira ... waiting");
		}
		var win=window.open(response.url, '_blank');
		log("Tab Opened");
		
		var checkIfToken=function(fncManagedCheckIfTokenCallback){
			log("Checking if token exists");
			self.addStep("Authorization call",function(){
				log("Call for session token");
				return self.apiCallOauth("/sessionToken?baseToken="+baseToken);
			});
			self.addStep("Checking for session access token",function(response,xhr,sUrl,headers) {
				//debugger;
				if  ((response==null)||
					(typeof response==="undefined")||
					(response.isToken==false)){
					log("Session Token does not exists... wait 1 seg");
					fncManagedCheckIfTokenCallback(fncManagedCheckIfTokenCallback);
					setTimeout(self.createManagedCallback(function(){return;}),1000);
					return self.waitForEvent();
				} else {
					log("Oauth Access token Exists:"+response.access);
					return self.taskResultMultiple(response.access,response.secret,baseToken);
				}
			});
		};
		return checkIfToken(self.createManagedFunction(checkIfToken));
	}

	oauthConnect(appInfo){
		var self=this;
		var appName="Jira";
		if (appInfo.subPath!=""){
			appName=appInfo.subPath;
		}
		log("AppName ouath connecting:"+appName + " instance:"+self.instance);
		self.addStep("Querying a OAuth Access Token for "+appName,function(){
			log("Oauth first step.... calling for a session token");	
			return self.apiCallOauth("/sessions/connect?jiraInstance="+
						self.instance+
						(appInfo.subPath!=""?"/":"")+appInfo.subPath+
						"&callbackServer="+self.proxyPath);
		});
		self.addStep("Waiting for grant in "+appName,self.apiOauthSecondStep);
		self.addStep("Setting Access Token for "+appName,function(accessToken,secret,baseToken){
			//debugger;
			log("Setting Access Token:"+accessToken+" and Secret:"+secret+" with base Token:"+baseToken);
			appInfo.tokenNeeded=true;
            appInfo.tokenAccess=accessToken;
            appInfo.tokenBase=baseToken;
			appInfo.tokenTime=secret;
		});
	}
	apiGetFullList(appInfo,sTarget,resultName,callType,data,callback,arrHeaders,bNotReturnAll){
		var self=this;
		var arrResults=[];
		var nLast=0;
		self.addStep("Calling for "+sTarget,function(){
			self.addStep("Calling to api "+sTarget,function(){
				log("Calling API "+sTarget);
				return self.apiCallApp(appInfo,sTarget,callType,data,nLast,1000,"application/json",undefined,arrHeaders);
			},0,1,undefined,60,0);	
			if (isDefined(callback)){
				var vResult=[];
				self.addStep("Calling the user callback",function(response,xhr,sUrl,headers){
					log("Called API "+sTarget+" processing response");
					vResult=[response,xhr,sUrl,headers];
					var fncManagedCallback=self.createManagedFunction(callback);
					return fncManagedCallback(response,xhr,sUrl,headers);
				},0,1,undefined,10,5);
				self.addStep("Returning Result",function(){
					log("Returning API "+sTarget+" result");
					return self.taskResultMultiple(vResult[0],vResult[1],vResult[2],vResult[3]);
				},0,1,undefined,1,5);
			}
			var processResultStep=self.addStep("Processing result of call "+sTarget,function(response,xhr,sUrl,headers){
				log("continue processing API "+sTarget+" result");
				var objResp;
				if (typeof response==="string"){
					if (response=="") return [];
					try {
						objResp=JSON.parse(response);
					} catch (e) {
						debugger;
						alert("Error Parsing response");
					}
				} else {
					objResp=response;
				}
				var nTotal=objResp.total;
				var nResults=objResp.maxResults;
				var nInit=objResp.startAt;
				nLast=nInit+nResults;
				if (isUndefined(bNotReturnAll)||(!bNotReturnAll)){
					if (isDefined(resultName)){
						arrResults=arrResults.concat(objResp[resultName]);
					} else if (isArray(objResp)){
						arrResults=arrResults.concat(objResp);
					} else {
						arrResults.push(objResp);
					}
				}
				if (nLast>=nTotal){
					return arrResults;					
				} else if (nLast<nTotal){
					//debugger;
					var hsListItemsToProcess=newHashMap();
					while (nLast<nTotal){
						var nBlockItems=nResults;
						if (nLast+nBlockItems>nTotal){
							nBlockItems=nTotal-nLast;
						}
						hsListItemsToProcess.push({first:nLast,total:nTotal,nBlockItems:nBlockItems});
						//fncAddIteration(nLast,nTotal,nBlockItems);
						nLast+=nResults;
					}
					var fncCall=function(callInfo){
						self.addStep("Doing ["+callInfo.first+","+(callInfo.first+callInfo.nBlockItems)+"]",function(){
							return self.apiCallApp(appInfo,sTarget,callType,data,callInfo.first,callInfo.nBlockItems,undefined,undefined,arrHeaders);
						});
						if (isDefined(callback)){
							var vResult=[];
							self.addStep("Calling the user callback",function(response,xhr,sUrl,headers){
								vResult=[response,xhr,sUrl,headers];
								var fncManagedCallback=self.createManagedFunction(callback);
								return fncManagedCallback(response,xhr,sUrl,headers);
							});
							self.addStep("Return values",function(){
								return vResult;
							});
						}
					}
					var fncProcess=function(item,response){
						if (isUndefined(bNotReturnAll)||(!bNotReturnAll)){
							var objResp;
							if (typeof response=="string"){
								objResp=JSON.parse(response);
							} else {
								objResp=response;
							}
							arrResults=arrResults.concat(objResp[resultName]);
							log("Retrieved "+resultName+":"+arrResults.length);
						}
					}
					//debugger;
					log("Parallelize");
					processResultStep.weight=100*hsListItemsToProcess.length();
					return self.parallelizeCalls(hsListItemsToProcess,fncCall,fncProcess,10);
				}
			},0,1,undefined,20,1);
		},0,1,undefined,100,5);
		
		if (isUndefined(bNotReturnAll)||(!bNotReturnAll)){
			self.addStep("Returnig results for "+sTarget,function(){
				return arrResults;
			});
		}
	}
	authenticate(appInfo,sTarget,callType,data,startItem,maxResults,sResponseType,callback,arrHeaders){
		var self=this;
		self.addStep("Authenticating....",function(){
			self.addStep("Discarding Oauth Access Token",function(){
				return self.apiCallOauth("/discardToken");
			});
			self.addStep("Getting Oauth Access Token",function(){
				return self.oauthConnect(appInfo);
			});
			self.addStep("Retrying api call",function(){
				return self.apiCallApp(appInfo,sTarget,callType,data,startItem,maxResults,sResponseType,callback,arrHeaders);					
			});
		});
	}
	apiCallApp(appInfo,sTarget,callType,data,startItem,maxResults,sResponseType,callback,arrHeaders,oCallSecurity,aditionalOptions){
		var self=this;
		var sTokenParam="";
		var bHasParams=true;
		if (sTarget.indexOf("?")<0){
			bHasParams=false;
		}
		var oSecurity={proxy:false,token:false,indirect:false};
		if (isDefined(oCallSecurity)){
			oSecurity=oCallSecurity;
			if (isUndefined(oSecurity.token))oSecurity.token=false;
			if (isUndefined(oSecurity.proxy))oSecurity.proxy=false;
			if (isUndefined(oSecurity.indirect))oSecurity.indirect=false;
		} 
		if ((oSecurity.token)&&(appInfo.tokenAccess=="")){
			//needs to get a Token
			self.pushCallback(function(){
				return self.oauthConnect(appInfo);
			})
		}
		//"Doing de API call..."
		var fncAddParam=function(name,value){
			if (typeof value!=="undefined"){
				if (!bHasParams){
					sTokenParam+="?";
					bHasParams=true;
				} else {
					sTokenParam+="&";
				}
				sTokenParam+=name+"="+value;
			}
		}
		self.addStep("Doing the API call..."+sTarget,function(){
	/*		if (appInfo.tokenNeeded){
				fncAddParam("access_token",appInfo.tokenAccess);
			}
	*/		fncAddParam("startAt",startItem);
			fncAddParam("maxResults",maxResults);
			var newSubPath=appInfo.subPath;
			if (newSubPath!=""){
				newSubPath="/"+newSubPath;
			}
			var sTargetUrl=newSubPath+sTarget+sTokenParam;
			log("Calling api of "+(newSubPath==""?"Jira":appInfo.subPath) + " final url:"+sTargetUrl);
			var auxHeaders=arrHeaders;
			var auxCallType="GET";
			if (isDefined(callType)) auxCallType=callType;
			if (oSecurity.token){
				auxHeaders={};
				var oAuthString= ' OAuth oauth_consumer_key="'+"OauthKey"+'",'+
								'oauth_token="' +appInfo.tokenAccess+'",'+
								'oauth_version="'+"1.0"+'"';
				auxHeaders["Authorization"]=oAuthString;
			}
			self.addStep("Base API Call "+sTargetUrl,function(){
				return self.apiCallBase(sTargetUrl,auxCallType,data,sResponseType,auxHeaders,appInfo.tokenAccess,oSecurity,aditionalOptions);
			});
			self.addStep("Processing result and retry if necesary of "+sTargetUrl,function(response,xhr,sUrl,headers){
				//debugger;
				log("Api Call Response of "+(newSubPath==""?"Jira":appInfo.subPath) 
						+ " final url:"+sTargetUrl);
				if (typeof xhr==="undefined"){
					log("=========");
					log("ERROR: xhr is undefined.... " );
					log("=========");
					return self.taskResultMultiple("",xhr,sUrl,headers);
				} else {
					log(" --> Bytes:"+response.length);
					if ((xhr.status == 429)){
						var millis=Math.round(((Math.random()*10)+5)*1000);
						log("too many request.... have to wait "+(Math.round(millis/10)/100)+" secs");
						setTimeout(self.createManagedCallback(function(){
							log("retrying api call");
							return self.apiCallApp(appInfo,sTarget,callType,data,startItem,maxResults,sResponseType,callback,arrHeaders);					
						}),millis);
						return self.waitForEvent();
					} else if (xhr.status == 400){
						alert(headers);
						return self.taskResultMultiple(response,xhr,sUrl,headers);
					} else if (xhr.status == 403) { // forbidden
						if (appInfo.tokenAccess==""){
							return self.authenticate(appInfo,sTarget,callType,data,startItem,maxResults,sResponseType,callback,arrHeaders);
						} else {
							if (isDefined(oSecurity)&&(oSecurity.indirect)){
								logError(xhr.responseText);
								return self.taskResultMultiple("",xhr,sUrl,headers);
							} else {
								oSecurity.indirect=true;
								var newTarget=self.instance+sTarget;
								return self.apiCallApp(appInfo,newTarget,callType,data,startItem,maxResults,sResponseType,callback,arrHeaders,oSecurity,aditionalOptions);
							}
						}
					} else if (xhr.status==500){
						logError("Error 500 in atlassian server calling to "+sTarget);
					} else {
						return self.taskResultMultiple(response,xhr,sUrl,headers);
					}
				}
			});
			if (isDefined(callback)){
				self.addStep("Calling callback to "+sTargetUrl,function([response,xhr,sUrl,headers]){
					return callback(response,xhr,sUrl,headers);
				});
			}
		});
	}
	getAppOfUrl(fullUrl){
		var self=this;
		var auxUrl=self.getConfluence().getBaseUrl();
		if (fullUrl.substring(0,auxUrl.length)==auxUrl){
			return self.getConfluence();
		}
		
//		var auxUrl=self.getJira().getBaseUrl();
//		if (fullUrl.substring(0,auxUrl.length)==auxUrl){
			return self.getJira();
//		}
	}
	indirectCall(callInfo){
		var self=this;
		//var jfrCall="https://cantabrana.no-ip.org/jfreports/atlassian/";
		var jfrCall=self.proxyPath+"/atlassian/";
		//var atlUrl="https://paega2.atlassian.net/secure/attachment/43269/form1.PNG";
		//var atlContentType="image/png";
//		var atlUrl="https://paega2.atlassian.net/rest/api/3/search?jql=updated%20>%3D%20-52w%20order%20by%20lastViewed%20DESC";
//		var atlContentType="application/json";
		//var atlUrl="https://paega2.atlassian.net/wiki/download/attachments/471400450/under-construction-2408066_960_720.png";
		//var atlContentType="image/png";

/*		var options = {
				  url: sTargetUrl,
				  type:newType,
				  data:newData,
				  contentType: sResponseType,
				  headers: arrHeaders,
				  success: newCallback,
				  error: newErrorCallback,
				  security:oSecurity
		}*/
		
		log("Url to call:"+callInfo.url);
		var atlUrl=callInfo.url;
		var atlContentType=callInfo.contentType;
	    var atlApp=self.getAppOfUrl(atlUrl);
		var atlToken=atlApp.tokenBase;

		var atlCallMethod=callInfo.type;
		        
		self.addStep("Retrieving data from proxy",function(){
			var oReq = new XMLHttpRequest();		
			var proxyCallUrl=jfrCall+"?"
	        +"oauth_token="+atlToken
//	        +"&callMethod="+atlCallMethod
//	        +"&CallContentType="+ atlContentType
//	        +"&callUrl="+atlUrl
	        ;

			oReq.open(atlCallMethod, proxyCallUrl, true);
			oReq.setRequestHeader("tgtUrl",atlUrl);
			oReq.setRequestHeader("tgtContentType",atlContentType);
			oReq.setRequestHeader("tgtMethod",atlCallMethod);
			
			oReq.responseType = "arraybuffer";
			oReq.onerror = function (e){
				callInfo.error(oReq, oReq.statusText, e);
			};
			oReq.onload = function (oEvent) {
			  debugger;
			  var isBinary=oReq.getResponseHeader("isBinary");
			  var responseData;
			  if (
			       (isString(isBinary)&&(isBinary=="true"))
			      ||
			       (isBoolean(isBinary)&&isBinary)
			       ){
				  var arrayBuffer = oReq.response; // Note: not oReq.responseText
				  var byteArray = new Uint8Array(arrayBuffer);
				  responseData=byteArray;
			  } else {
				  var sResponse = oReq.responseText;
				  responseData=sResponse;
			  }
			  callInfo.success(responseData,oReq);
			};
			oReq.send(null);
			return self.waitForEvent();
		});
	}
	prepareCall(sTargetUrl,callType,data,sResponseType,arrHeaders,tokenAccess,oCallSecurity,aditionalOptions){
		var self=this;
		var newType="GET";
		if (typeof callType!=="undefined"){
			newType=callType;
		}
		var oSecurity={proxy:false,token:false,indirect:false};
		if (isDefined(oCallSecurity)){
			oSecurity=oCallSecurity;
			if (isUndefined(oSecurity.token))oSecurity.token=false;
			if (isUndefined(oSecurity.proxy))oSecurity.proxy=false;
			if (isUndefined(oSecurity.indirect))oSecurity.indirect=false;
		}
		var newData;
		if (typeof data!=="undefined"){
			newData=JSON.stringify(data);
			//newData=data;
		}
		var newResponseType='application/json';
		if (typeof sResponseType!=="undefined"){
			newResponseType=sResponseType;
		}
		var newCallback;//=callback;
		var newErrorCallback;//=callback;
		newCallback=self.createManagedCallback(function(responseObj,xhr){
			var theXhr;
			if (isUndefined(xhr)){
				theXhr=self.JiraAPConnection;
			} else {
				theXhr=xhr;
			}
		    return self.taskResultMultiple(responseObj,theXhr);
		  });
		newErrorCallback=self.createManagedCallback(function(xhr, statusText, errorThrown){
		    return self.taskResultMultiple("",xhr, statusText, errorThrown);
		  })
		var fncAddAditionalOptions=function(options){
			if (isDefined(aditionalOptions)){
				var arrProps=getAllProperties(aditionalOptions);
				arrProps.forEach(function(property){
					options[property]=aditionalOptions[property];
				});
			}
		}
		var options = {
				  url: sTargetUrl,
				  type:newType,
				  data:newData,
				  contentType: sResponseType,
				  headers: arrHeaders,
				  success: newCallback,
				  error: newErrorCallback,
				  security:oSecurity
		}
		fncAddAditionalOptions(options);
		return options;
	}
	apiCallBase(sTargetUrl,callType,data,sResponseType,arrHeaders,tokenAccess,oCallSecurity,aditionalOptions){
		var self=this;
		var options=self.prepareCall(sTargetUrl,callType,data,sResponseType,arrHeaders,tokenAccess,oCallSecurity,aditionalOptions);
		if (options.security.indirect){
			return self.indirectCall(options);
		} else if (!options.security.proxy){
			self.JiraAPConnection.request(options);
			return self.waitForEvent();
		} else {
			var jqElem=$;
			
			log("Cookie:"+document.cookie);
			document.cookie = "atlassian.xsrf.token" + '=;expires=Thu, 01 Jan 1970 00:00:01 GMT;';
			log("Cookie:"+document.cookie);
			var oAuthString= ' OAuth oauth_consumer_key="'+"OauthKey"+'",'+
					'oauth_token="' +tokenAccess+'",'+
					'oauth_version="'+"1.0"+'"';
			log("OAUT STRING:"+oAuthString);
//			sTargetUrl="/jfreports/ANTproxy/"+"paega2.atlassian.net"+"/endproxy"+sTargetUrl+"?_r=1544484317890";
//			sTargetUrl="/jfreports/proxy/"+"paega2.atlassian.net"+"/endproxy"+sTargetUrl;
            var arrParts=sTargetUrl.split("://");
            if (arrParts.length>1){
                sTargetUrl=arrParts[1];
            } else {
                sTargetUrl=arrParts[0];
            }
			sTargetUrl="/jfreports/NEWproxy/"+sTargetUrl;
	        var options = {
				url: sTargetUrl,
				method: newType,
				headers: {
//					'Content-Type': newResponseType,
					'Authorization':oAuthString
					//'Authorization':"Bearer "+oauthAccessToken+"",
					/*						'access_token': oauthAccessToken
					'oauth_consumer_key':"OauthKey",
					'oauth_token':oauthAccessToken,
					*/					  
					},
				data: newData,
//				dataType: newResponseType,
			    success: newCallback,
			    error: newErrorCallback
			};
			fncAddAditionalOptions(options);
			$.ajax(options);/*.done(function(){
				alert("end Call");
				log("Cookie:"+document.cookie);
				document.cookie = "atlassian.xsrf.token" + '=;expires=Thu, 01 Jan 1970 00:00:01 GMT;';
				log("Cookie:"+document.cookie);
			});*/
			
			
/*			$.ajax({
			    type: 'POST',
			    url: sTargetUrl,
			    headers: arrHeaders,
			    data:newData
//			    dataType:"json"
			    //OR
			    //beforeSend: function(xhr) { 
			    //  xhr.setRequestHeader("My-First-Header", "first value"); 
			    //  xhr.setRequestHeader("My-Second-Header", "second value"); 
			    //}
			}).done(function(data) { 
			    alert(data);
			});
			*/
			return self.waitForEvent();
		}
	}
	renderContent(appInfo,contentToRender){
		var self=this;
		self.pushCallback(function(objResponse,xhr, statusText, errorThrown){
			log("Rendered Content:"+objResponse);
		});
		
//		apiCallApp(appInfo,sTarget,callType,data,startItem,maxResults,sResponseType,callback,arrHeaders){

		return self.apiCallApp(appInfo,
					//"https://rcgcoder.atlassian.net/rest/api/1.0/render",
				        "https://cantabrana.no-ip.org/jfreports/proxy/rcgcoder.atlassian.net/endproxy/rest/api/1.0/render",
						"POST",
						{"rendererType":"atlassian-wiki-renderer","unrenderedMarkup":contentToRender},
						undefined,
						undefined,
						"text",
						undefined,
						undefined,
						true);
	}
}
/*
Class for download a Zip File with a lot of js files.
.... extract files to persistent 
.... load all files to memory
*/

/*
 * First it´s load the other javascript libs.....
 * 
 */

function formatLog(sText){
	var sLogFormatted="";
	var tm=taskManager;
	if ((typeof tm!=="undefined")&&(tm!=null)&&(tm!="")){
		sLogFormatted=(tm.getRunningForkId()+" - "+sText);
	} else {
		sLogFormatted=("Error in getrootforkid");
	}
	return sLogFormatted;
}


function log(sText){
		console.log(formatLog(sText));
}
function isChrome() {
  var isChromium = window.chrome,
    winNav = window.navigator,
    vendorName = winNav.vendor,
    isOpera = winNav.userAgent.indexOf("OPR") > -1,
    isIEedge = winNav.userAgent.indexOf("Edge") > -1,
    isIOSChrome = winNav.userAgent.match("CriOS");

  if (isIOSChrome) {
    return true;
  } else if (
    isChromium !== null &&
    typeof isChromium !== "undefined" &&
    vendorName === "Google Inc." &&
    isOpera === false &&
    isIEedge === false
  ) {
    return true;
  } else { 
    return false;
  }
}

class ZipDeploy{
	constructor(relativePath,zipUrl){
		var self=this;
		self.relativePath=relativePath;
		self.url=zipUrl;
		self.imports=[];
		self.commitId="";
		self.commitDate="";
		self.deployedCommitId="";
		self.deployedDate="";
	}
}


class GitHub{
	constructor(app){
		var self=this;
		self.repository="";
		self.branch="";
		self.app=app;
		self.arrCommits="";
		self.lastCommit="";
		self.lastCommitDate="";
		self.commitId="";
		self.ghCode="";
		self.headerAuth="";
		self.ghStateString="_ungues";
		taskManager.extendObject(self);
	}
	loadError(oError){
	    throw new URIError("The file " + oError.target.src + " is not accessible.");
	}
	apiCall(sTargetUrl,sPage,sType,callback,arrHeaders){
		var self=this;
		var sUrl=sTargetUrl;
		if ((sPage!="")&&(typeof sPage!=="undefined")){
			if (sUrl.indexOf("?")>0){
				sUrl+="&page="+sPage
			} else {
				sUrl+="?page="+sPage
			}
		}
		var xhr = new XMLHttpRequest();
		xhr.open('GET', sUrl, true);
		xhr.responseType = 'json';
		if (typeof sType!=="undefined"){
			xhr.responseType=sType;
		}
		if (typeof arrHeaders!=="undefined"){
			for (var i=0;i<arrHeaders.length;i++){
				xhr.setRequestHeader(arrHeaders[i].key, arrHeaders[i].value);
			}
		}
		xhr.onerror=self.loadError;
		xhr.onload = self.createManagedCallback(function(e) {
		  var nRemaining=xhr.getResponseHeader("X-RateLimit-Remaining");
		  log("Remaining GitHub Pets:"+nRemaining);
		  if (xhr.status == 302) {
			  var ghLink=xhr.getResponseHeader("Location");
			  return self.apiCall(ghLink);
		  } else if (xhr.status == 200) {
			  return self.taskResultMultiple(xhr.response,xhr,sTargetUrl,arrHeaders);
		  } else {
			  return self.loadError({target:{src:sUrl}});			  
		  }
		});
		xhr.send();	
		return self.waitForEvent();
	}
	processCommitsPage(response,xhr,url,arrHeaders){
	   var self=this;
	   var sUrl=url;
	   if (typeof sUrl==="undefined"){
		   sUrl="https://api.github.com/repos/"+self.repository+"/commits";
	   }
	   self.arrCommits = self.arrCommits.concat(response.items);
	   var ghLink=xhr.getResponseHeader("Links");
	   if ((ghLink!="")&&(ghLink!=null)){
		  var arrLinks=ghLink.split(",");
		  var nextLink=arrLinks[0];
		  arrLinks=nextLink.split(";");
		  if (arrLinks[1]==' rel="next"'){
			  arrLinks=arrLinks[0].split('>');
			  arrLinks=arrLinks[0].split('=');
			  var nextPage=arrLinks[1];
			  self.pushCallback(self.processCommitsPage);
			  return self.apiCall(sUrl,nextPage,undefined,undefined,arrHeaders);
		  }
	   }
	   return self.taskResultJump(1,self.arrCommits);
	}
	getCommits(fromDate){
		var self=this;
		var iPage=0;
		self.arrCommits=[];
		if (typeof fromDate==="undefined"){
			self.pushCallback(self.processCommitsPage);
			return self.apiCall("https://api.github.com/repos/"+self.repository+"/commits");
		} else {
			self.pushCallback(self.processCommitsPage);
			var arrHeaders=[
				{key:"Accept",value:"application/vnd.github.cloak-preview"}
				];
			var sDate = new Date(fromDate).toISOString();
			sDate=sDate.substring(0,sDate.length-5);
			return self.apiCall("https://api.github.com/search/commits?q=repo:rcgcoder/jiraformalreports+committer-date:>"+sDate,undefined,undefined,undefined,arrHeaders);
		}
	}
	processLastCommit(response){
		var self=this; 
		self.lastCommit=response;
		var sCommitLongId=self.lastCommit.sha;
		var sCommitShortId=sCommitLongId.substring(0,8);
		self.commitId=sCommitShortId;
		self.commitDate=(new Date(self.lastCommit.commit.author.date)).getTime();
		return self.taskResultMultiple(self.commitId,self.commitDate);
	}
	updateLastCommit(){
		var self=this;
		self.pushCallback(self.processLastCommit);
		return self.apiCall("../getCommitId?refreshCommitId=1");
	}
	updateAllCommits(deployZips){
		var self=this;
		if (typeof relativePaths!="undefined"){
			self.pushCallback(function(arrCommits){
				return self.taskResultJump(1,self.commitId,arrCommits);
			});
			self.pushCallback(function(){
				return self.getLastCommitOfFiles(relativePaths);
			});
		}
		return self.updateLastCommit();
	}
	processLastCommitOfFile(response){
		var self=this;
		var arrCommits=response;
		var lastCommit=arrCommits[0];
		var sCommitLongId=lastCommit.sha;
		var sCommitShortId=sCommitLongId.substring(0,8);
		var sCommitDate=(new Date(lastCommit.commit.author.date)).getTime();
		return self.taskResultMultiple(sCommitShortId,sCommitDate);
	}
	getLastCommitOfFile(sRelativePath){
		var self=this;
		self.pushCallback(self.processLastCommitOfFile);
		return self.apiCall("https://api.github.com/repos/"+self.repository+"/commits?path="+sRelativePath);
	}
	updateDeployZipCommits(deployZips,iFile){
		var self=this;
		if (iFile>=deployZips.length){
			return;
		} else {
			self.pushCallback(function(sCommitId,sCommitDate){
				deployZips[iFile].commitId=sCommitId;
				deployZips[iFile].commitDate=sCommitDate;
				return self.updateDeployZipCommits(deployZips,iFile+1);
			});
			return self.getLastCommitOfFile(deployZips[iFile].relativePath);
		}
	}
	getLastCommitOfDeploys(deployZips){
		return this.updateDeployZipCommits(deployZips,0);
	}
}

class RCGZippedApp{
	constructor(){
		//debugger;
		var self=this;
		self.proxyPath=""; // url of the callback/connect proxy
		self.rootPath="";
		self.prependPath="";
		self.github="";
		self.htmlContainerId="";
		self.isCloud=false;
		self.urlBase="";
		self.urlFull="";
		self.DeployZips=[];
		self.lastDeployInfo="";
		self.mainJs="";
		self.mainClass="";
		self.tsCompiler="";
		self.bWithPersistentStorage=isChrome();
		self.localStorageMaxSize=4*1024*1024*1024; // 200 MBytes by default
		taskManager.extendObject(self);
		log("ZippedApp Created");
		self.requestFileSystem = window.webkitRequestFileSystem 
								|| window.mozRequestFileSystem 
								|| window.requestFileSystem;
		self.storage="";
		self.loadedFiles={"rcglibs/RCGZippedWebApp.js":true};
		var fncShowStatus=function(){

			var status=self.getTaskManagerStatus();
			log("Total Advance:"+status.desc+":"+Math.round(status.perc*100)+"%");
			var child=status.child;
			while (typeof child!=="undefined"){
				log("   child Advance:"+child.desc+":"+Math.round(child.perc*100)+"%" + "["+child.min+"--> "+child.adv +" -->"+child.max+"]");
				child=child.child;
			}
			if (status.perc<1){
				setTimeout(fncShowStatus,500);
			}
		}
		fncShowStatus();
	}
	useGitHub(sRepository,branch,code){
		var self=this;
		self.github=new GitHub(self);
		self.github.repository=sRepository;
		if (typeof branch!=="undefined"){
			self.github.branch=branch;
		}
		if (typeof code!=="undefined"){
			self.github.ghCode=code;
		}
	}
	addDeployZip(relativePath,arrImportPaths){
		var objDeploy=new ZipDeploy(relativePath,"");
		if (typeof arrImportPaths!=="undefined"){
			if (!Array.isArray(arrImportPaths)){
				objDeploy.imports.push(arrImportPaths);
			} else {
				objDeploy.imports=arrImportPaths;
			}
		}
		this.DeployZips.push(objDeploy);
	}
	setHtmlContainerID(sHtmlElementId){
		this.htmlContainerId=sHtmlElementId;
	}
	getHtmlContainerID(){
		return this.htmlContainerId;
	}
	
	
	composeUrl(sRelativePath){
		var self=this;
//		if (typeof sRelativePath==="undefined") return sRelativePath;
		if (sRelativePath.substr(0,4).toLowerCase()=="http"){
			return sRelativePath;
		}
		if (sRelativePath.substr(0,"proxy:".length).toLowerCase()=="proxy:"){
			var sRelPathAux=sRelativePath.substr("proxy:".length,sRelativePath.length);
			//debugger;
			var sAbsolutePath=self.proxyPath;
			sAbsolutePath+="/proxy";
			var arrValues=self.rootPath.split("//");
			if (arrValues.length>0){
				var sAux=arrValues[1];
				sAbsolutePath+="/"+sAux;
			} else {
				sAbsolutePath+="/"+arrValues[0];
				
			}
			sAbsolutePath+="/endproxy";
			if (self.github!=""){
				sAbsolutePath+="/"+self.github.repository;
				sAbsolutePath+="/"+self.github.commitId;
			}
			if (self.prependPath!=""){
				sAbsolutePath+="/"+self.prependPath;
			}
			sAbsolutePath+="/"+sRelPathAux;
			log(sAbsolutePath);
//			https://cantabrana.no-ip.org/jfreports/proxy/cdn.rawgit.com/endproxy/rcgcoder/jiraformalreports/fde50453/common/
			return sAbsolutePath;
		}
		var sUrl=self.rootPath; 
		if (self.github!=""){
			if (self.github!=""){
				sUrl+="/"+self.github.repository;
			}
			if (self.commitId!=""){
				sUrl+="/"+self.github.commitId;
			}
		}
		if (self.prependPath!=""){
			sUrl+="/"+self.prependPath;
		}
		if (sRelativePath!=""){
			sUrl+="/"+sRelativePath;
		}
		return sUrl;
	}

	getContentTypeFromExtension(fileName){
		var result={
			isText:false,
			isJS:false,
			isTS:false,
			isCSS:false,
			isHTML:false,
			isJSON:false,
			isSVG:false,
			isIMG:false,
			isDOCX:false,
			isCacheable:true,
			commitId:"",
			isUndefined:false
		}
		var nPos=fileName.lastIndexOf(".");
		var sExt=fileName.substring(nPos+1,fileName.length).toLowerCase();
		if (sExt=="js"){
			result.isText=true;
			result.isJS=true;
			return result;
		} else if (sExt=="ts"){
				result.isText=true;
				result.isTS=true;
				return result;
		} else if (sExt=="html"){
			result.isText=true;
			result.isHTML=true;
			return result;
		} else if (sExt=="css"){
			result.isText=true;
			result.isCSS=true;
			return result;
		} else if (sExt=="json"){
			result.isText=true;
			result.isJSON=true;
			result.isCacheable=false;
			return result;
		} else if (sExt=="svg"){
			result.isText=false;
			result.isSVG=true;
			return result;
		} else if (sExt=="jpg"){
			result.isText=false;
			result.isIMG=true;
			return result;
		} else if (sExt=="docx"){
			result.isText=false;
			result.isIMG=false;
			result.isDOCX=true;
			return result;
		} else {
			return result;
		}
		result.isUndefined=true;
		return result;
	}
	getContentType(xhr){
		var result={
			isText:false,
			isJS:false,
			isTS:false,
			isCSS:false,
			isHTML:false,
			isJSON:false,
			isSVG:false,
			isCacheable:true,
			isUndefined:false,
			commitId:""
		}
		var arrContentTypes=xhr.getResponseHeader("content-type").split(";");
		for (var i=0;i<arrContentTypes.length;i++){
			if (arrContentTypes[i]=="application/javascript"){
				result.isText=true;
				result.isJS=true;
				return result;
			} else if (arrContentTypes[i]=="application/typescript"){
					result.isText=true;
					result.isTS=true;
					return result;
			} else if (arrContentTypes[i]=="text/html"){
				result.isText=true;
				result.isHTML=true;
				return result;
			} else if (arrContentTypes[i]=="text/css"){
				result.isText=true;
				result.isCSS=true;
				return result;
			} else if (arrContentTypes[i]=="application/json"){
				result.isText=true;
				result.isJSON=true;
				result.isCacheable=false;
				return result;
			} else if (arrContentTypes[i]=="image/svg+xml"){
				result.isText=false;
				result.isSVG=true;
				return result;
			} else if (arrContentTypes[i]=="image/jpeg"){
				result.isText=false;
				result.isIMG=true;
				return result;
			} else if (arrContentTypes[i]=="application/vnd.openxmlformats-officedocument.wordprocessingml.document"){
				result.isText=false;
				result.isDOCX=true;
				return result;
			} else if (arrContentTypes[i]=="application/octet-stream"){
				return result;
			}
		}
		result.isUndefined=true;
		return result;
	}
	saveFileToStorage(sRelativePath,content,contentType){
		var self=this;
		var sStringContent="";
		if (contentType.isText){
			sStringContent=content;
		} else {
			var u8Arr = new Uint8Array(content);
			/*for (var xi=0;xi<16;xi++){
				log("u8a["+xi+"]:"+arr[xi]);
			}*/
			var sB64=fromByteArray(u8Arr);
			/*for (var xi=0;xi<16;xi++){
				log("b64["+xi+"]:"+sB64[xi]);
			}*/
			//log("B64: " + sB64.length);
			sStringContent=sB64;
		}
		if ((self.storage!="")
			&&(self.github!="")
			&&(contentType.isCacheable)
			){ // only saves if github is configured and storage engine is working and content is cacheable
			/*contentType.commitId=self.github.commitId;
			contentType.commitDate=
			*/
			contentType.saveDate=(new Date()).getTime();
			self.storage.set('#FILEINFO#'+sRelativePath,JSON.stringify(contentType));
			//self.storage.set(sRelativePath,sStringContent);
			self.storage.save();
			filesystem.SaveFile(sRelativePath,sStringContent,
				self.createManagedCallback(
						function(e){
							return sStringContent;
						}),
				self.createManagedCallback(
						function(e){
							return "";
						})
				);
			return self.waitForEvent();
		}
		return sStringContent;
	}
	downloadFile(sUrl,sRelativePath){
		var self=this;
		var xhr = new XMLHttpRequest();
		xhr.open('GET', sUrl, true);
		xhr.onerror=self.loadError;
		xhr.responseType = 'arraybuffer';
		xhr.onload = self.createManagedCallback(function(e) {
		  if (xhr.status == 200) {
			  log("Downloaded "+sRelativePath);
			  var ct=self.getContentType(xhr);
			  if (ct.isUndefined){
				  ct=self.getContentTypeFromExtension(sRelativePath);
			  }
			  var response="";
			  var toSave="";
			  self.pushCallback(function(sContent){
				  return self.taskResultMultiple(sContent,xhr,ct,sRelativePath);
			  });
			  self.pushCallback(function(sContent){
				  ct.commitId=self.github.commitId;
				  ct.commitDate=self.github.commitDate;
				  ct.saveDate=(new Date()).getTime();
				  if (self.bWithPersistentStorage){
					  return self.saveFileToStorage(sRelativePath,sContent,ct);
				  } else {
					  if (!ct.isText) {
					      var u8Arr = new Uint8Array(toSave);
						  toSave=fromByteArray(u8Arr);
					  }
					  return sContent;
				  }
			  });
			  if (ct.isText){
				  var uint8arr=new Uint8Array(xhr.response);
				  //toSave = String.fromCharCode.apply(null,arr);
				  var bb = new Blob([uint8arr]);
				  var f = new FileReader();
				  f.onload = self.createManagedCallback(function(e) {
				     return e.target.result;
				  });
				  f.readAsText(bb);
				  return self.waitForEvent();
			  } else {
				  toSave = xhr.response;
				  return toSave;
			  }
		  } else {
			  log("Error downloading "+sRelativePath);
			  self.loadError({target:{src:sUrl}});			  
		  }
		});
 		xhr.send();	
 		return self.waitForEvent();
	}
	addStyleString(cssContent,theWindow) {
		var doc=document;
		if (typeof theWindow!=="undefined"){
			doc=theWindow.document;
		}
	    var node = doc.createElement('style');
	    node.innerHTML = cssContent;
	    doc.body.appendChild(node);
	}
	addJavascriptString(jsContent,theWindow){
		var self=this;
		var doc=document;
		if (typeof theWindow!=="undefined"){
			doc=theWindow.document;
		}
		var oHead=(doc.head || doc.getElementsByTagName("head")[0]);
	    var oScript = doc.createElement("script");
	    oScript.type = "text\/javascript";
	    oScript.onerror = self.loadError;
	    oHead.appendChild(oScript);
	    oScript.innerHTML = jsContent;
	}
/*	addTypescriptString(tsContent){
		var self=this;
		if (self.tsCompiler==""){
			log("TypeScript Engine is not running... loading");
			self.tsCompiler=new tsCompiler();
		}
		var jsCompiled=self.tsCompiler.compile(tsContent);
		self.addJavascriptString(jsCompiled);
	}*/
	processFile(sRelativePath,content,contentType,theWindow){
		log("Processing file:"+sRelativePath);
		var self=this;
		var auxContent=content;
	    if (contentType.isJS){ //if filename is a external JavaScript file
	    	self.addJavascriptString(content,theWindow);
/*	    } else if (contentType.isTS){ //if filename is a external TypeScript file
		    	self.addTypescriptString(content);
*/	    } else if (contentType.isCSS){ //if filename is an external CSS file
	    	self.addStyleString(content,theWindow);
	    } else if (contentType.isIMG){
	    	auxContent='data:image/bmp;base64,'+auxContent;
	    } else if (contentType.isDOCX){
	    	auxContent='data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,'+auxContent;
	    }
	    return self.taskResultMultiple(sRelativePath,auxContent);
	}
	loadFileFromNetwork(sRelativePath,fileContent,contentType,theWindow){
		var self=this;
		if ((fileContent!="")&&(typeof fileContent!=="undefined")) {
			log(sRelativePath+" loaded from persistent storage");
			return self.taskResultMultiple(sRelativePath,fileContent,contentType,theWindow);
		}
		log(sRelativePath+" loading from network");
		var sUrl=self.composeUrl(sRelativePath);
		self.pushCallback(function(content,xhr,contentType,sRelativePath){
			log(sRelativePath+" loaded from network");
			return self.taskResultMultiple(sRelativePath,content,contentType,theWindow);
		});
    	return self.downloadFile(sUrl,sRelativePath);
	}
	loadFileFromStorage(sRelativePath,theWindow){
		log("Loading "+ sRelativePath + " from storage");
		var self=this;
		if ((!self.bWithPersistentStorage)||(self.storage=="")||(self.github=="")){ // if there is not storage initialized or github is not used
			log("There is not storage engine loaded");
			return self.taskResultMultiple(sRelativePath,"",undefined,theWindow);
		}
		// now there is storage and github
		
		// get the last commit id
		var sCommitId=self.github.commitId;
		if (sCommitId==""){ // imposible case.... all the repositories has one or more commits
			return self.taskResultMultiple(sRelativePath,"",undefined,theWindow);
		}
		
		var sContentType=self.storage.get('#FILEINFO#'+sRelativePath);
		//var sVersion=self.storage.get('#GITCOMMIT#'+sRelativePath);
/*		if (sContentType==null){ // there is not a file on storage (¿download independent or download whole zip?
			self.popCallback([false]);
			return;
		}*/

		
		if (sContentType!=null) {
			var jsonContentType=JSON.parse(sContentType);
			var sVersion=jsonContentType.commitId;
			if ((sCommitId==sVersion)||(sVersion=="")){ // if stored file version == github version are the same.... use the storage version
				log("Loading from storage the File:"+sRelativePath);
				filesystem.ReadFile(sRelativePath,
						self.createManagedCallback(function(sStringContent){
							log("file "+sRelativePath +" readed from storage");
							return self.taskResultMultiple(sRelativePath,sStringContent,jsonContentType,theWindow);
						}),
						self.createManagedCallback(function(e){
							log("file "+sRelativePath +" Error reading from storage");
							return self.taskResultMultiple(sRelativePath,"",undefined,theWindow);
						})
						);
				return self.waitForEvent();
			}
		}
		return self.taskResultMultiple(sRelativePath,"",undefined,theWindow);
	}
	
	loadRemoteFile(sRelativePath,theWindow){
		var self=this;
		self.pushCallback(self.processFile);
		self.pushCallback(self.loadFileFromNetwork);
		if (self.bWithPersistentStorage){
			return self.loadFileFromStorage(sRelativePath,theWindow);
		} else {
			return self.taskResultMultiple(sRelativePath,"",undefined,theWindow);
		}
	}
	loadRemoteFiles(arrRelativePaths,fncPostProcessFile,theWindow){
		//debugger;
		var self=this;
		var arrStatus=[];
		self.addStep("Getting files",function(){
			return self.parallelizeProcess(arrRelativePaths.length,function(iFile){
				var iIntFile=iFile;
				var sFile=arrRelativePaths[iIntFile];
				log("Downloading file:"+ sFile+ " pos:"+iIntFile);
				self.addStep("Reading File:"+sFile,function(){
					return self.loadFileFromStorage(sFile,theWindow);
				});
				self.addStep("File:"+sFile+" ¿need to load from network?",function(sRelativePath,fileContent,contentType){
					if (fileContent!=""){
	//						log("File "+iIntFile+" "+sRelativePath+ " is in Storage");
						return self.taskResultMultiple(sRelativePath,fileContent,contentType);
					}
	//					log("File "+iIntFile+" "+sRelativePath+ " is not in Storage... loading from network");
					return self.loadFileFromNetwork(sRelativePath,fileContent,contentType,theWindow);
				});
				self.addStep("File:"+sFile+" fully loaded!",function(sRelativePath,fileContent,contentType){
	//					log("File "+iIntFile+" "+sRelativePath+ " is loaded... updating status");
					arrStatus[iIntFile]={path:sRelativePath,content:fileContent,type:contentType};
					return arrStatus[iIntFile];
				});
			});
		});
		self.addStep("Processing files",function(){
			return self.sequentialProcess(arrRelativePaths.length,function(iFile){
				var fileStatus=arrStatus[iFile];
				self.addStep("Processing "+iFile+" file:"+fileStatus.path,function(){
					return self.processFile(fileStatus.path,
									 fileStatus.content,
									 fileStatus.type
									 ,theWindow
									);
				});
				if (typeof fncPostProcessFile!=="undefined"){
					self.addStep("Processed "+iFile+" file:"+fileStatus.path,function(){
						return fncPostProcessFile(iFile,theWindow);
					});
				}
			});
		});
	}

	checkForDeploys(iFile){
		var self=this;
		var tLastDeploy=0;
		if (self.lastDeployInfo!=""){
			tLastDeploy=self.lastDeployInfo.date;
		}
		var iZip=0;
		if (typeof iFile!=="undefined"){
			iZip=iFile;
		}
		if (iZip>=self.DeployZips.length){
			return;
		}
		var bNotUpdate=true;
		var theDeploy=self.DeployZips[iZip];
		if ((theDeploy.deployedDate=="")  // never deployed
			||
		   (theDeploy.commitDate>theDeploy.deployedDate)
		   ){ // new release
			// needs to be deployed
			bNotUpdate=false;
			self.addStep("Deploying Zip:"+ theDeploy.relativePath,function(){
				return self.deploy(theDeploy);
			});
			self.addStep("Checking for other Deploying Zip:"+ iZip,function(){
				return self.checkForDeploys(iZip+1);
			});
		} else {
			log("the deploy: "+ theDeploy.relativePath+ " is up to date");
			return self.checkForDeploys(iZip+1);
		}
	}
	loadJSBaseEngine(){
		var self=this;
		if (typeof zip==="undefined"){
			log("Zip engine is not running.... loading all utils");
			var arrFiles=["css/RCGTaskManager.css",
				          "js/libs/zip/zip.js",
				          "https://cdnjs.cloudflare.com/ajax/libs/mathjs/4.0.1/math.min.js",
//						  "js/rcglibs/RCGBaseUtils.js",
						  "js/rcglibs/RCGUtils.js"
		//	, 
					//	  "js/libs/angular.min.js",
					//	  "js/libs/typescript.min.js",
					//	  "js/libs/typescript.compile.js"
	//			  ,"js/libs/zip/zip-ext.js"
				  ];
			self.addStep("Loading js base engine javascripts",function(){
				return self.loadRemoteFiles(arrFiles);
			});
			self.addStep("Initializing jsbaseengine",function(){
				var rcgUtilsManager=new RCGUtils();
				rcgUtilsManager.requireLibs=function(bMakeGlobals,arrLibs){
					var sRelativePaths=[];
					arrLibs.forEach(function(sPath){
						var sRelativePath=rcgUtilsManager.basePath+sPath;
						sRelativePaths.push(sRelativePath);
					})
					self.addStep("Download and process parallelized",function(){
						return self.loadRemoteFiles(sRelativePaths,function(iFile){
							var sFile=arrLibs[iFile];
			    			var className=sFile.split(".")[0];
							log("Post-Processing "+ iFile+" "+sFile+" className:"+className);
			    			var auxObj = window[className]; 
			    			return rcgUtilsManager.makeGlobals(bMakeGlobals,auxObj);
						});
					});
				};
				rcgUtilsManager.basePath="js/rcglibs/";
				return rcgUtilsManager.loadUtils(true);
			});
		} 
	}
	addDeployFork(theDeploy){
		var self=this;
		var fncDeploy=function(){
			var runningTask=self.getRunningTask();
			log("Deploying Zip:"+ theDeploy.relativePath + "(Task "+runningTask.forkId+"name:"+runningTask.description+")");
			return self.deploy(theDeploy);
		}
		self.addStep("Fork Deploy zip:"+theDeploy.relativePath
					,fncDeploy,undefined,undefined,"",undefined,undefined,"inner",undefined);
	}
	checkForDeploysForked(){
		var self=this;
		
		var tLastDeploy=0;
		if (self.lastDeployInfo!=""){
			tLastDeploy=self.lastDeployInfo.date;
		}
		var runningTask=self.getRunningTask();
		var arrDeploysToUpdate=[];
		for (var i=0;i<self.DeployZips.length;i++){
			var theDeploy=self.DeployZips[i];
			if ((theDeploy.deployedDate=="")  // never deployed
				||
			   (theDeploy.commitDate>theDeploy.deployedDate)){ // new release
				// needs to be deployed
				arrDeploysToUpdate.push(theDeploy);
				//self.addDeployFork(theDeploy);				
			} else {
				log("the deploy: "+ theDeploy.relativePath+ " is up to date");
			}
		}
		return self.parallelizeProcess(arrDeploysToUpdate,function(theDeploy){
			var runningTask=self.getRunningTask();
			log("Deploying Zip:"+ theDeploy.relativePath + "(Task "+runningTask.forkId+"name:"+runningTask.description+")");
			return self.deploy(theDeploy);
		});
	}


	updateFilesFromCommits(){
		var self=this;
		var minZipCommitDate;
		for (var i=0;i<self.DeployZips.length;i++){
			var theDeploy=self.DeployZips[i];
			if (i==0){
				minZipCommitDate=theDeploy.commitDate;
			} else if (minZipCommitDate>theDeploy.commitDate){
				minZipCommitDate=theDeploy.commitDate;
			}
		}
		self.pushCallback(function(arrCommits){
			log("Test");
		});
		log("GetCommits");
		return self.github.getCommits(minZipCommitDate);
	}
	updateDeployZips(){
		var self=this;
		if (!self.bWithPersistentStorage){
			return;
		}
		var sTotalDeployInfo=self.storage.get('#FILEINFO#'+"LastDeployInfo");
		var oTotalDeployInfo="";
		if ((sTotalDeployInfo!=null)&&(sTotalDeployInfo!="")&&(typeof sTotalDeployInfo!=="undefined")){
			oTotalDeployInfo=JSON.parse(sTotalDeployInfo);
		} 
		self.lastDeployInfo=oTotalDeployInfo;
		for (var i=0;i<self.DeployZips.length;i++){
			var theDeploy=self.DeployZips[i];
			var zipUrl=self.composeUrl(theDeploy.relativePath);
			theDeploy.url=zipUrl;
			var sDeployInfo=self.storage.get('#FILEINFO#'+theDeploy.relativePath);
			if (sDeployInfo!=null) {
				var deployInfo=JSON.parse(sDeployInfo);
				theDeploy.deployedCommitId=deployInfo.deployedCommitId;
				theDeploy.deployedDate=deployInfo.deployedDate;
			}
		}
//		self.pushCallback(self.updateFilesFromCommits);
		self.pushCallback(self.checkForDeploysForked);
		return self.github.getLastCommitOfDeploys(self.DeployZips);
	}
	loadPersistentStorage() {
		var self=this;
		// load persistent store after the DOM has loaded
		Persist.remove('cookie');
		Persist.remove('gears');
		Persist.remove('flash');
		Persist.remove('globalstorage');
		Persist.remove('ie');
		self.storage = new Persist.Store('JiraFormalReports',
							{
							defer:true,
							size:self.localStorageMaxSize
							});
		InitializeFileSystem(self.createManagedCallback(function(){
								return;
							 }),
							 self.localStorageMaxSize);
		return self.waitForEvent();
	}
	startPersistence(){
		var self=this;
		var arrFiles=["js/libs/persist-all-min.js",
					  "js/rcglibs/RCGPersist.js",
	  		  		  "js/libs/b64.js",
			  		  ];
		self.addStep("Loading remote files",function(){
			return self.loadRemoteFiles(arrFiles);
		});
		if (self.bWithPersistentStorage){
			self.addStep("Launch persistence engine",function(){
				return self.loadPersistentStorage();
			});
		}
	}
	loadMemoryMonitor(){
		var self=this;
		var arrFiles=["js/libs/memory-stats.js"];
		self.addStep("Load files",function(){
			return self.loadRemoteFiles(arrFiles);
		});
		self.addStep("Start Memory monitor",function(){
			return self.startMemoryMonitor();
		});
	}
	startMemoryMonitor(){
		// add the monitor into our page and update it on a rAF loop
		var stats = new MemoryStats();
		stats.domElement.style.position	= 'fixed';
		stats.domElement.style.right		= '0px';
		stats.domElement.style.bottom		= '0px';
		document.body.appendChild( stats.domElement );
		requestAnimationFrame(function rAFloop(){
			stats.update();
			requestAnimationFrame(rAFloop);
		});
		// generate plenty of objects
		// from in generational GC demo from firefox
		// https://people.mozilla.org/~wmccloskey/incremental-blog/example-pause.html
		var garbage 	= [];
		var garbageSize	= 1024 * 1024 * 6;
		var garbageIdx	= 0;
		// call GC() from console to test a GC
		function GC(){
			garbage 	= [];
			garbageIdx	= 0;
		}
		function makeGarbage(amount){
			for(var i = 0; i < amount; i++){
				garbage[garbageIdx]	= {};
				garbageIdx	= (garbageIdx+1) % garbageSize;
			}
		}
		requestAnimationFrame(function rAFloop(){
			makeGarbage(1024);
			requestAnimationFrame(rAFloop);
		});
		//# sourceURL=generateGarbage.js
	}
	extendFromObject(srcObj){
		var result=this;
		var arrProperties=Object.getOwnPropertyNames(srcObj.__proto__).concat(Object.getOwnPropertyNames(srcObj));
		for (var i=0;i<arrProperties.length;i++){
			var vPropName=arrProperties[i];
			if (vPropName!=="constructor"){
				var vPropValue=srcObj[vPropName];
				result[vPropName]=vPropValue;
			}
		}
	}
	startApplication(){
		//debugger;
		var self=this; 
		self.pushCallback(function(){
			var webapp=new ZipWebApp(); 
			self.extendFromObject(webapp);
			self.run();
		});
		return self.loadRemoteFile(self.mainJs);
	}
	updateStatus(){
		var self=this;
		if (window.jQuery){
			var showStatusInitTime=(new Date()).getTime();

			var tm=self.getTaskManager();
			var progressDiv=$("#JFR_Progress_DIV");
			var pDiv; 
			if (progressDiv.length==0){
				log("minimice img");
				$("#jrfSplash").width(100);
				$("#jrfSplash").height(100);
				log("adding progress div");
				pDiv= $("<div id='JFR_Progress_DIV' class='tm-progresDiv'></div>").appendTo('body');
			} else {
				pDiv=progressDiv;
			}
			pDiv.empty();
			var allTasksInfo=self.getTaskManagerStatus();
			var maxDeep=5;
			var fncAddProgressItem=function(item,currentDeep){
				if (item.done) return "";
				if (!item.running) return "";
				var perc100=item.perc*100;
				perc100=(Math.round(perc100*1000))/1000;
				var nChildsDone=0;
				var nChildsTotal=item.detail.length;
				var nInnerMin=0;
				var nInnerMax=0;
				var nInnerAdv=0;
				for (var i=0;i<nChildsTotal;i++){
					var child=item.detail[i];
					if (child.done){
						nChildsDone++;
					}
					nInnerMax+=child.max;
					nInnerMin+=child.min;
					nInnerAdv+=child.adv;
				}
				var sChildsInfo="";
				if (nChildsTotal>0){
					sChildsInfo=" ("+nChildsDone+"/"+nChildsTotal+")";
				}
				if ((nInnerAdv>0)&&(nInnerMax!=nChildsTotal)){
					sChildsInfo+=" ["+nInnerMin+" => "+ nInnerAdv +" => "+nInnerMax+"]";
					
				}
				sChildsInfo+=" ["+item.nSubTasksRunning+"/"+item.nSubTasks+"]";				
				sChildsInfo+=" ["+item.nSubDeep+"]";				
				var tTotal=0;
				var tETA=0;
				if (item.perc>0){
					tTotal=(1/item.perc)*item.timeSpent;
					tETA=tTotal-item.timeSpent;
					tETA=Math.round((tETA/1000)*100)/100;
				}
				if (item.detail.length>0) { 
					for (var i=0;i<item.detail.length;i++){
						var detail=item.detail[i];
					}
				}
				

				var sItem='<div id="statusBox" class="tm-inline">'+
				  '	  <span id="sbTitle"> ' + (item.desc==""?"Running...":item.desc) + sChildsInfo + ' '+perc100+'% '+
				  '   </span>'+
				  '   <progress class="tm-progress" id="sbProgress" value="'+(Math.round(perc100))+'" max="100">Progress Text</progress>'+
				  '   '+((item.timeSpent/1000).toFixed(2))+' segs '+
						    (currentDeep==0?
						    		 " Tasks Created:"+ tm.countNews+" Task Frees:"+tm.countFrees
						    		+" Timeout Wasted: "+(tm.asyncTimeWasted/1000).toFixed(2)+" "+((100*tm.asyncTimeWasted/item.timeSpent).toFixed(2))+"% "
						    		+" tOuts:"+tm.timeoutsCalled+" vs "+tm.timeoutsAvoided+" "
						    		+" Deep: "+tm.asyncTaskCallActDeep+"/"+tm.asyncTaskCallsMaxDeep
						    		+" stackSize Wasted: "+(tm.getStackTraceLinesTime/1000).toFixed(2):"")
						    		+(tTotal>0?(' (ETA: '+tETA+' segs)')
						    		:'')+
				  '</div>';
				var sSubItems="";
				if (item.detail.length>0) { 
					for (var i=0;i<item.detail.length;i++){
						var sSubItem=fncAddProgressItem(item.detail[i],currentDeep+1);
						sSubItems+=sSubItem;
					}
					sSubItems="<ul class='tm-ulSubItems'>"+sSubItems+"</ul>";
				}
				if (currentDeep<=maxDeep){
					sItem='<li class="tm-progress">'+sItem+' '+sSubItems+'</li>';
				} else {
					sItem='';
				}
				return sItem;
			}
			var sHtml="";
			for (var i=0;i<allTasksInfo.length;i++){
				sHtml+=fncAddProgressItem(allTasksInfo[i],0);
			}
			var updateHtmlInitTime=(new Date()).getTime();
			if (sHtml!=""){
				var list= $("<ul id='ProgressList' class='tm-ProgressList'>"+
							sHtml+
							"</ul>"
							).appendTo(pDiv);
				$(pDiv).show();
			} else {
				$(pDiv).hide();
			}
			var showStatusEndTime=(new Date()).getTime();
			console.log("Show Status wasted time:"+(showStatusEndTime-showStatusInitTime) +" --- "
					+ (updateHtmlInitTime-showStatusInitTime)
						);
		}
	}
	run(){
		var self=this;
		self.getTaskManager().setOnChangeStatus(self.createManagedFunction(function(){
				self.updateStatus();}));
		if ((self.github!="")&&((self.github.commitId=="")||(self.github.commitDate==""))){
			self.addStep(self.github.updateLastCommit,undefined,self.github);
		}
		if (typeof window.gc!=="undefined"){
			self.addStep("Starting Memory Monitor...",self.loadMemoryMonitor);
		}		
		self.addStep("Starting Persistence...",self.startPersistence);
		self.addStep("Loading Base Files...",self.loadJSBaseEngine);
		self.addStep("Updating Deploy Zips...",self.updateDeployZips);
		self.addStep("Starting Application...",self.startApplication);

		self.addStep("Check Finish",function(){
			log("Ends the run");
			//debugger;
		});
	}
	onerror(message) {
		alert(message);
	}
	createTempFile(callback) {
		var self=this;
		var tmpFilename = "tmp.dat";
		self.requestFileSystem(TEMPORARY, 4 * 1024 * 1024 * 1024, 
			function(filesystem) {
				function create() {
					filesystem.root.getFile(tmpFilename, {
						create : true
					}, function(zipFile) {
						callback(zipFile);
					});
				}
				filesystem.root.getFile(tmpFilename, null, function(entry) {
					entry.remove(create, create);
				}, create);
			});
	}
	saveZipEntries(arrEntries,iEntry){
		var self=this;
		self.setTaskProgressMinMax(0,arrEntries.length);
		var fncProgress=function(current, total) {
//			log(current + "/" + total + "   " + Math.round((current/total)*100)+"%");
		}
		var fncSaveBlobEntry=function (blob){
//			log("save blob");
			var reader = new FileReader();
			reader.onload = self.createManagedCallback(function(e) {
				  var content = reader.result;
				  return self.saveFileToStorage(params.relativePath,content,params.type);
			});
			if (params.type.isText){
				reader.readAsText(blob);
			} else {
				reader.readAsArrayBuffer(blob);
			}
			return self.waitForEvent();
		};
		return self.parallelizeProcess(arrEntries,function(entry){
			var params=entry;
			var model=params.model;
			var entry=params.entry;
			var fncSaveBlob=self.createManagedCallback(fncSaveBlobEntry);
			self.addStep("Saving file "+ params.relativePath+" from deploy zip ...",function(){
				model.getEntryFile(entry
						, "Blob"
						, fncSaveBlob
						, fncProgress);
				return self.waitForEvent();
			});
		});
	}
	deploy(deployInfo){ 
		var self=this;
		log("Deploying Zip:"+deployInfo.relativePath);
		var runningTask=self.getRunningTask();
		zip.useWebWorkers=true;
		zip.workerScriptsPath = 'js/libs/zip/';
		/*zip.workerScripts = {
				  deflater: [workerScriptsPath+'/z-worker.js', workerScriptsPath+'/deflate.js'],
				  inflater: [workerScriptsPath+'/z-worker.js', workerScriptsPath+'/inflate.js']
				};
		*/
		self.addStep("Saving Zip Entries...",self.saveZipEntries);
		self.addStep("Updating Deploy Info...",function(){
					deployInfo.deployedCommitId=deployInfo.commitId;
					deployInfo.deployedDate=deployInfo.commitDate;
					self.storage.set('#FILEINFO#'+deployInfo.relativePath,JSON.stringify(deployInfo));
			});
		var sZipUrl=deployInfo.url;
		// prepare arrays
		var model=new ZipModel();
		var runningTask=self.getRunningTask();
		var fncDownOnProgress=function (evt) {
			log("Download Progress");
	        if(evt.lengthComputable){
	            var percentComplete = evt.loaded / evt.total;
	            console.log("Download progress:"+percentComplete);
	        }
			runningTask.progressMin=0;
			runningTask.progressMax=evt.total;
			runningTask.progress=evt.loaded;
	    };
	    var fncOnDone=function(entries) {
			log("Processing Zip File:"+sZipUrl);
			var arrFilesToSave=[];
			entries.forEach(function(entry) {
				var sFile=entry.filename;
				var sImportPath;
				var bWillNotSave=true;
				var bContinue=true;
				var sRelativePath="";
				for (var i=0;(bContinue)&&(bWillNotSave) && 
							 ((deployInfo.imports.length==0)||(i<deployInfo.imports.length))
							 ;i++){
					var sPrefix="";
					var sLastChar=sFile.substring(sFile.length-1);
					if (sLastChar=="/") {
						bContinue=false;
					} else if (deployInfo.imports.length==0){
						sRelativePath=entry.filename;
//						log("Entry "+entry.filename + " will be saved as "+sRelativePath);
						bWillNotSave=false;
					} else {
						sImportPath=deployInfo.imports[i];
						var sPrefix=sFile.substring(0,sImportPath.length);
						sRelativePath=sFile.substring(sPrefix.length);
						if ((sPrefix.length!=sFile.length)
							  &&(sPrefix==sImportPath)){
//							log("Entry "+entry.filename + " will be saved as "+sRelativePath);
							bWillNotSave=false;
						}
					}
				}
				if (!bWillNotSave){
					var jsonContent=self.getContentTypeFromExtension(sFile);
					var sContentSaved=self.storage.get('#FILEINFO#'+sRelativePath);
					var oContentSaved="";
					if (sContentSaved!=null){
						oContentSaved=JSON.parse(sContentSaved);
					}
					if ((oContentSaved=="") || 
						(oContentSaved.saveDate<deployInfo.commitDate)){
//						log("Entry "+entry.filename + " will be saved as "+sRelativePath);
						jsonContent.commitId=deployInfo.commitId;
						jsonContent.commitDate=deployInfo.commitDate;
						arrFilesToSave.push({
											model:model,
											entry:entry,
											type:jsonContent,
											relativePath:sRelativePath
											});
					} else {
//							log(sRelativePath+" saved is newer");
					}
				}
			});
			return arrFilesToSave;
		};

		log("Download Zip File:"+sZipUrl);
		model.downloadAndGetEntries(sZipUrl,self.createManagedCallback(fncOnDone),fncDownOnProgress);
		return self.waitForEvent();
	}
}

class ZipModel{
	//zip.useWebWorkers=false;
	constructor(){
		this.URL = window.webkitURL || window.mozURL || window.URL;
		this.md5="";
		this.ZipFile="";
		this.ZipData="";
	}
	
	downloadAndGetEntries(urlZipFile,onend,down_onprogress){
		var self=this;
		self.ZipFile=urlZipFile;
		var xhr = new XMLHttpRequest();
		xhr.open('GET', urlZipFile, true);
		xhr.responseType = 'blob';
		if (typeof down_onprogress!=="undefined"){
		    xhr.addEventListener("progress", down_onprogress, false);
		}
		xhr.onload = function(e) {
		  if (this.status == 200) {
		    var myBlob = this.response;
		    self.ZipData=myBlob;
		    // myBlob is now the blob that the object URL pointed to.
		    self.getEntries(myBlob,onend);
		  }
		};
		xhr.send();	
	}
		
	getEntries(file, onend) {
		zip.createReader(new zip.BlobReader(file), function(zipReader) {
			zipReader.getEntries(onend);
		}, onerror);
	}
	getEntryFile(entry, creationMethod, onend) {
		var writer, zipFileEntry;

		function getData() {
			entry.getData(writer, function(blob) {
					var result;
					if (creationMethod == "BlobUrl") {
						result=URL.createObjectURL(blob);
					} else if (creationMethod == "Blob") {
							result=blob;
					} else {
						result=zipFileEntry.toURL();
					}
					onend(result);
				});
		}

		if (creationMethod == "Blob") {
			writer = new zip.BlobWriter();
			getData();
		} else {
			createTempFile(function(fileEntry) {
				zipFileEntry = fileEntry;
				writer = new zip.FileWriter(zipFileEntry);
				getData();
			});
		}
	}
}
class RCGJira{
	constructor(atlassian){
		var self=this;
		self.manager=atlassian;
		self.subPath="";
		self.tokenAccess="";
		self.tokenTime=0;
/*		self.withCache=false;
		self.issuesCache=newHashMap();
		self.jqlCache=newHashMap();
*/		taskManager.extendObject(self);
		self.renderContent=function(sContent){
			return atlassian.renderContent(self,sContent);
			};
		self.oauthConnect=function(){
			return atlassian.oauthConnect(self);
			};
		self.apiCall=function(sTarget,callType,data,sPage,sResponseType,callback,arrHeaders,callSecurity,aditionalOptions){
			return atlassian.apiCallApp(self, sTarget, callType, data, sPage,undefined, sResponseType,callback,arrHeaders,callSecurity,aditionalOptions);
			};
		self.getFullList=function(sTarget,resultName,callType,data,callback,arrHeaders,bNotReturnAll){
			return atlassian.apiGetFullList(self, sTarget, resultName,callType, data, callback,arrHeaders,bNotReturnAll);
			};

		self.projects=newDynamicObjectFactory([],["InnerId"],[],"Project");
		self.fields=newDynamicObjectFactory([],["Type"],[],"Field");
		self.issueTypes=newDynamicObjectFactory([],["Description","SubTask","IconUrl"],[],"IssueType");

		self.epics=newDynamicObjectFactory([],[],[],"Epic");
		self.labels=newDynamicObjectFactory([],[],[],"Label");
        self.boards=newDynamicObjectFactory([],[],[],"Board");
		self.sprints=newDynamicObjectFactory([],[],[],"Sprint");

		self.users=[];
		self.filters=[];
		self.issueLinkTypes=[];
		self.issueOtherFields=[];
    }
    getAllBoards(){
        var self=this;
        self.addStep("Getting all boards",function(){
            return self.getFullList("/rest/agile/1.0/board","values");
        });
    }
    getBoardIssues(idBoard){
        var self=this;
        self.addStep("Getting all Issues of Board "+ idBoard,function(){
            return self.getFullList("/rest/agile/1.0/board/"+idBoard+"/issue","issues");
        });
    }
    getBoardSprints(idBoard){
        var self=this;
        self.addStep("Getting all Sprints of Board "+idBoard,function(){
            return self.getFullList("/rest/agile/1.0/board/"+idBoard+"/sprint","values");
        });
    }
    getSprintIssues(idSprint,idBoard){
        var self=this;
        self.addStep("Getting all Issues of Sprint "+idSprint+" (Board "+idBoard+")",function(){
            return self.getFullList("/rest/agile/1.0/board/"+idBoard+"/sprint/"+idSprint+"/issue","issues");
        });
    }
    getProjectVersions(idProject){
        var self=this;
        self.addStep("Getting all versions of project "+idProject,function(){
            return self.getFullList("/rest/api/3/project/"+idProject+"/versions");
        });
    }
    
	getFields(){
		log("Getting fields");
		return this.fields;
	}
	processJsonField(itm){
		// interest info
		// 		key
		//		name
		//		schema.type
		var self=this;
		var doItem;
		var doFactory=self.fields;
		if (!doFactory.exists(itm.key)){
			doItem=doFactory.new(itm.name,itm.key);
			doItem.setType(itm.schema.type);
		}
	}
	processJsonProject(itm){
		// interest info
		// 		key
		//		name
		//		id --> InnerId
		
		var self=this;
		var doItem;
		var doFactory=self.projects;
		if (!doFactory.exists(itm.key)){
			doItem=doFactory.new(itm.name,itm.key);
			doItem.setInnerId(itm.id);
		}
	}
	processJsonIssueType(itm){
		// interest info
		// 		id --> key
		//		name
		//		description --> Description
		//		iconUrl		--> IconUrl
		//		subtask		--> SubTask
		
		var self=this;
		var doItem;
		var doFactory=self.issueTypes;
		if (!doFactory.exists(itm.id)){
			doItem=doFactory.new(itm.name,itm.id);
			doItem.setDescription(itm.description);
			doItem.setIconUrl(itm.iconUrl);
			doItem.setSubTask(itm.subtask);
		}
	}
	processArrayIssues(arrIssues,fncProcessIssue,fncEndCallback){
		var self=this;
		self.addStep("Processing array of issues",function(){
			return self.parallelizeProcess(arrIssues,fncProcessIssue,1);
		});
		self.addStep("End of process array",function(){
			return fncEndCallback();
		});
	}
	getIssueLinkFullList(scopeJQL){
		var self=this;
		var hsTypes=newHashMap();
		var issueLink;
		var type;
		var inward;
		var outward;
		var fncProcessIssue=function(issue){
			for (var j=0;j<issue.fields.issuelinks.length;j++){
				issueLink=issue.fields.issuelinks[j];
				type=issueLink.type;
				inward=type.inward;
				outward=type.outward;
				if (!hsTypes.exists(inward)){
					hsTypes.add(inward,inward);
				}
				if (!hsTypes.exists(outward)){
					hsTypes.add(outward,outward);
				}
			}
		};
		return self.processJQLIssues(scopeJQL,fncProcessIssue,hsTypes);
	}
	getFieldFullList(scopeJQL){
		var self=this;
		var hsFields=newHashMap();
		var hsTypes=newHashMap();
		var issType;
		var fncProcessIssue=function(issue){
			issType=issue.fields.issuetype.name;
			if (!hsTypes.exists(issType)){
				hsTypes.add(issType,issue.fields.issuetype);
				var arrProperties=getAllProperties(issue.fields);
				for (var j=0;j<arrProperties.length;j++){
					var vPropName=arrProperties[j];
					if (!hsFields.exists(vPropName)){
						var vPropType=typeof issue[vPropName];
						hsFields.add(vPropName,{name:vPropName,type:vPropType});
					}
				}
				hsFields.swing();
				hsTypes.swing();
			}
		}
		return self.processJQLIssues(scopeJQL,fncProcessIssue,hsFields);
	}
	getProjectsAndMetaInfo(){
		var self=this;
		self.addStep("Calling to API to get Project and Meta Info",function(){
			return self.apiCall("/rest/api/latest/issue/createmeta?expand=projects.issuetypes.fields");
		})
		self.addStep("Process Project and Meta Info",function(sResponse,xhr,sUrl,headers){
			//log("getAllProjects:"+response);
			if (sResponse!=""){
				var response=JSON.parse(sResponse);
				for (var i=0;i<response.projects.length;i++){
					var project=response.projects[i];
					self.processJsonProject(project);
					for (var j=0;j<project.issuetypes.length;j++){
						var issuetype=project.issuetypes[j];
						self.processJsonIssueType(issuetype);
					}
				}
			}
		});
	}
	getFieldsAndSchema(){
		var self=this;
		self.addStep("Doing a api call to get fields and schema",function(){
			return self.apiCall("/rest/api/2/search?jql=&expand=names,schema");
		});
		self.addStep("Processing results of get fields and schema",function(sResponse,xhr,sUrl,headers){
			//log("getAllProjects:"+response);
			if (sResponse!=""){
				var response=JSON.parse(sResponse);
				var arrProperties=Object.getOwnPropertyNames(
									response.names.__proto__
									).concat(Object.getOwnPropertyNames(
									response.names
									));
				for (var k=0;k<arrProperties.length;k++){
					var vFieldId=arrProperties[k];
					if ((vFieldId!=="__proto__")&&(vFieldId!=="constructor")){
						var sDesc=response.names[vFieldId];
						if (typeof response.schema[vFieldId]!=="undefined"){
							var sType=response.schema[vFieldId].type;
							if (typeof sType!=="undefined"){
								var objField={name:sDesc,key:vFieldId,schema:response.schema[vFieldId]};
								self.processJsonField(objField);
							}
						} 
					}
				}
			}
		});
	}
	getIssueLinkTypes(){
		var self=this;
		return self.issueLinkTypes;		
	}
	setIssueLinkTypes(issueLinkTypes){
		var self=this;
		self.issueLinkTypes=issueLinkTypes;		
	}
	setIssueOtherFields(issueOtherTypes){
		var self=this; 
		self.issueOtherFields=issueOtherTypes;		
		
	}
	getIssueOtherFields(){
		return this.issueOtherFields;
	}
	
	getAllIssueLinkTypes(){
		
	}
	getBaseUrl(){
		var self=this;
		var url=self.manager.instance+"/"+self.subPath;
		return url;
	}

	getUser(){
		return this.manager.userId;
	}
	getUsers(){
		var self=this;
		var arrResult=[];
		if (self.users!=""){
			self.users.forEach(function(user){
				arrResult.push({key:user.key,name:user.displayName});
			});
		}
		arrResult.sort(function(a,b){
			if (a.name<b.name) return -1;
			if (a.name>b.name) return 1;
			return 0;
			
		});
		return arrResult;
	}
	getAllUsers(){
		var self=this;
		self.addStep("Calling to API to get Users", function(){
			return self.apiCall(   "/rest/api/2/user/search?startAt=0&maxResults=1000&username=_");
		});
		self.addStep("Procesing users info",function(response,xhr,sUrl,headers){
			log("getAllUsers:"+response);
			if (response!=""){
				self.users=JSON.parse(response);
			}
		});
	}
	getAllProjects(){
		var self=this;
		self.addStep("Getting all projects",function(){
			return self.apiCall("/rest/api/2/project?expand=issueTypes");
		});
		self.addStep(function(response,xhr,sUrl,headers){
			log("getAllProjects:"+response);
		});
	}
	getAllLabels(){
		var self=this;
		var doItem;
		var doFactory=self.labels;
		var fncProcessIssue=function(issue){
			for (var j=0;j<issue.fields.labels.length;j++){
				var issLbl=issue.fields.labels[j];
				if (!doFactory.exists(issLbl)){
					doItem=doFactory.new(issLbl,issLbl);
				}
			}
		}
		//debugger;
		self.addStep("Getting all Labels",function(){
			return self.processJQLIssues("labels is not empty",fncProcessIssue,doFactory);
		});
		self.addStep("Waiting for lables",function(){
			//debugger;
			log("Labels correctly finished?");
		});
	}
	getAllEpics(){
		var self=this;
		var doItem;
		var doFactory=self.epics; 
		var fncProcessIssue=function(itm){
			if (!doFactory.exists(itm.key)){
				doItem=doFactory.new(itm.fields.summary,itm.key);
			}
		}
		return self.processJQLIssues("issueType=epic",fncProcessIssue,doFactory);
	}
	getAllFilters(){
		var self=this;
		self.addStep("Getting all filters",function(){
			return self.apiCall("/rest/api/2/filter");//,"GET",data);
		});
		self.addStep("Processing all filters info",function(sResponse,xhr,sUrl,headers){
			log("getAllFilters:"+response);
			if (sResponse!=""){
				var response=JSON.parse(sResponse);
				self.filters=response;
			}
			return self.filters;
		});
	}
	getAllIssues(cbBlock){
		var self=this;
		self.addStep("Getting All Issues", function(){
			return self.getFullList("/rest/api/2/search?expand=changelog","issues",undefined,undefined,cbBlock,undefined,true);
		});
		/*
		self.addStep("Processing all Issues", function(response,xhr,sUrl,headers){
			self.popCallback([response]);
		});
		*/
//		self.apiCall("/plugins/servlet/applinks/proxy?appId=d1015b5f-d448-3745-a3d3-3dff12863286&path=https://rcgcoder.atlassian.net/rest/api/2/search");
		//expand=changelog&jql=updateddate>'2018/03/01'
	}
	getFromCache(sCacheKey){
		if (self.withCache){
			if (self.jqlCache.exists(sCacheKey)){
				return self.jqlCache.getValue(sCacheKey);
			}
		}
		return "";
	}
	addToCache(sCacheKey,value){
		if (self.withCache){
			if (!self.jqlCache.exists(sCacheKey)){
				return self.jqlCache.add(sCacheKey,value);
			}
		}
	}
	getComments(arrIssues,cbBlock,postJQL){
		var self=this;
		var sJQL="";
		arrIssues.forEach(function(issueKey){
			sJQL+=((sJQL!=""?",":"")+issueKey);
		});
		sJQL="issue in ("+sJQL+")";
		if (isDefined(postJQL))sJQL+=" "+postJQL;
/*		var sCacheKey="Comments_"+sJQL;
		var vCache=self.getFromCache(sCacheKey);
		if (vCache!="") return vCache;
*/
		self.addStep("Getting All Issues from JQL:["+sJQL+"]", function(){
			return self.getFullList("/rest/api/2/search?fields=comment&expand=renderedFields&jql="+sJQL,"issues",undefined,undefined,cbBlock);
		},0,1,undefined,1000,1);

/*		self.addStep("Returning all Issues from JQL:["+sJQL+"]", function(response,xhr,sUrl,headers){
			//self.addToCache(sCacheKey,response);
			log("Comments getted");
		});
*/	}
	getJQLIssues(jql,cbBlock,bNotReturnAll){
		var self=this;
/*		var sCacheKey="issues_"+jql;
		var vCache=self.getFromCache(sCacheKey);
		if (vCache!="") return vCache;
*/		self.addStep("Getting All Issues from JQL", function(){
			//debugger;
			return self.getFullList("/rest/api/2/search?jql="+jql+"&expand=renderedFields,changelog"
							,"issues",undefined,undefined,cbBlock
							,undefined,bNotReturnAll);
		},0,1,undefined,1000,1);
/*		if (isUndefined(bNotReturnAll)||(!bNotReturnAll)){
			self.addStep("Returning all Issues from JQL", function(response,xhr,sUrl,headers){
				//debugger;
				//self.addToCache(sCacheKey,response);
				return response;
			});
		}
*/	}
	processJQLIssues(jql,fncProcessIssue,returnVariable,cbEndProcess,cbDownloadBlock,cbProcessBlock,bNotReturnAll){
		//debugger;
		var self=this;
		var jqlAux="";
		if (isDefined(jql)){
			jqlAux=jql;
		}
		
		var fncProcessDownloadedBlock=function(jsonBlkIssues){
			if (isDefined(cbDownloadBlock)){
				self.addStep("Processing Download Issues block as string: "
								+jsonBlkIssues.length +" of JQL ["+jqlAux+"]",function(){
					//debugger;
					return cbDownloadBlock(jsonBlkIssues);
				});
			}
			if (isDefined(cbProcessBlock)||isDefined(fncProcessIssue)){
				var blkIssues=[];
				if (typeof jsonBlkIssues==="string"){
					var objJson=JSON.parse(jsonBlkIssues);
					blkIssues=objJson.issues;
				} else {
					blkIssues=jsonBlkIssues;
				}
				log("Process downloaded block of JQL ["+jqlAux+"]");
				if (isDefined(cbProcessBlock)){
					self.addStep("Processing Issues block: "+blkIssues.length +" of JQL ["+jqlAux+"]",function(){
						//debugger;
						return cbProcessBlock(blkIssues);
					});
				}
				if (isDefined(fncProcessIssue)){
					//debugger;
					var fncProcessIndex=function(issueIndex){
						fncProcessIssue(blkIssues[issueIndex]);
					};
					self.addStep("Custom Processing the issues",function(){
						log("Calling parallelizeCalls to process each "+blkIssues.length+" issues");
						return self.parallelizeCalls(blkIssues.length,undefined,fncProcessIndex,1);
					});
				}
			}
		};

		self.addStep("Fetching And Process Issues"+" of JQL ["+jqlAux+"]",function(){
			return self.getJQLIssues(jqlAux,fncProcessDownloadedBlock,bNotReturnAll);
/*			self.addStep("Fetching Issues"+" of JQL ["+jqlAux+"]",function(){
				//debugger;  
			});
			*/
		},0,1,undefined,1000,1);
		self.addStep("Returning Variable"+" of JQL ["+jqlAux+"]",function(){
			var fncEnd;
			if (isDefined(cbEndProcess)){
				fncEnd=cbEndProcess;
			} else {
				fncEnd=function(vReturn){
					return vReturn;
				};
			}
			return fncEnd(returnVariable);
		},0,1,undefined,10,1);
	}
	getIssueDetails(issueId){
		var self=this;
		self.addStep("Getting Issue Details",function(){
			return self.apiCall(   "/rest/api/2/issue/"+issueId,
					"GET",
					undefined,
					undefined,
					"application/json");
		});
		self.addStep("Processing issue Details",function(objResponse,xhr, statusText, errorThrown){
			log("Issue Detail for issue:"+issueId);
			var oResult;
			if (isDefined(objResponse)){
				oResult=JSON.parse(objResponse);
			};
			return oResult;
		});
	}
	setProperty(issueId,propertyName,propertyValue){
		var self=this;
		self.addStep("Setting property",function(){
			return self.apiCall(   "/rest/api/2/issue/"+issueId+"/properties/"+propertyName,
					"PUT",
					propertyValue,
					undefined,
					"application/json");
		});
		self.addStep("Processing setting property result",function(objResponse,xhr, statusText, errorThrown){
			log("Property:"+propertyName+" = "+propertyValue+" setted in issue:"+issueId);
		});
	}
	
	getProperty(issueId,propertyName){
		var self=this;
		self.addStep("Getting property of issue",function(){
			return self.apiCall(   "/rest/api/2/issue/"+issueId+"/properties/"+propertyName,
					"GET",
					undefined,
					undefined,
					"application/json");
		});
		self.addStep("Processing property of issue",function(sResponse,xhr, statusText, errorThrown){
			log("Property:"+propertyName+" = "+sResponse+" getted for issue:"+issueId);
			if (sResponse!=""){
				return JSON.parse(sResponse);
			} else {
				return self.taskResultMultiple(sResponse,xhr, statusText, errorThrown);
			}
		});
	}
	
	addComment(issueId,theComment){
		var self=this;
		self.addStep("Adding comment to issue",function(){
			return self.apiCall("/rest/api/2/issue/"+issueId+"/comment",
					"POST",
					{"body":theComment},
					undefined,
					"application/json");
		});
		self.addStep("Processing result of adding comment",function(objResponse,xhr, statusText, errorThrown){
			log("Comment:"+theComment+" setted in issue:"+issueId);
		});
	}
	addAttachmentObject(issueId,jsObject,sFileName,sComment){
		var self=this;
        var theBlob = new Blob([JSON.stringify(jsObject)], { 
            type: 'text/plain'
        });
        var auxComment=sComment;
        if (isUndefined(sComment)){
        	auxComment="Attached file:"+sFileName;
        }
        var fileOfBlob = new File([theBlob], sFileName);
        var data={comment: auxComment, file: fileOfBlob  };
        var aditionalOptions={
        		data:data,
        		contentType: 'multipart/form-data'
        }
//		self.apiCall=function(sTarget,callType,data,sPage,sResponseType,callback,arrHeaders,useProxy,aditionalOptions){
        self.addStep("Adding attachment to issue",function(){
    		return self.apiCall("/rest/api/2/issue/"+issueId+"/attachments",
    				"POST",
    				data,
    				undefined,
    				'multipart/form-data',
    				undefined,
    				undefined,
    				undefined,
    				aditionalOptions
    				);
        });
		self.addStep("Processing result of adding attachment",function(objResponse,xhr, statusText, errorThrown){
			log("attachement setted in issue:"+issueId);
		});
	}
	getAttachments(issueId,fileFilterFunction,contentFilterFunction,contentProcessFunction){
		var self=this;
		var reportIssue;
		var arrFiles=[];
        self.addStep("Processing jql to get report issue detail:"+issueId,function(){
            return self.getIssueDetails(issueId);
        });
        self.addStep("setting issue detail:"+issueId+" and oauth connect",function(issueDetail){
            reportIssue=issueDetail;
        	return self.oauthConnect();
        });
        self.addStep("Getting all the attachments of the report issue:"+issueId,function(){
            log("Adding... process attachment steps");
            var inspectAttachment=function(contentUrl){
                log("Adding steps for inspect:"+contentUrl);
                self.addStep("Getting Content of Attachment:"+contentUrl,function(){
                   return self.apiCall(contentUrl,"GET",undefined,undefined,
                                   "application/json",undefined,undefined,{token:true});
                });
                self.addStep("Evaluating the loaded content for :"+contentUrl,function(response){
                   log(response.substring(0,50));
                   var bAddAttachment=true;
                   if (isDefined(contentFilterFunction)){
                	   bAddAttachment=contentFilterFunction(response);
                   }
                   if (bAddAttachment){
                	   var vResult=response;
                	   if (isDefined(contentProcessFunction)){
                		   vResult=contentProcessFunction(vResult);
                	   }
                	   arrFiles.push(vResult);
                   }
                });
            }
            self.parallelizeProcess(reportIssue.fields.attachment,function(elem){
                log(elem.content+" --> mimeType:"+elem.mimeType);
                var bDoInspect=true;
                if (isDefined(fileFilterFunction)){
                	bDoInspect=fileFilterFunction(elem);
                }
                if (bDoInspect){
                    var contentUrl=elem.content;
                    var arrElem=contentUrl.split("secure");
                    var relativeUrl="/secure"+arrElem[1];
                    inspectAttachment(relativeUrl);
                }
            });
        });
        self.addStep("Returning selected attachments",function(){
        	return self.taskResultMultiple({issue:reportIssue,attachments:arrFiles});
        });
	}
	proxyCallTest(){
	}

}

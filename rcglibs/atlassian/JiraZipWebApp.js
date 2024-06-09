class JiraZipWebApp{
	constructor(){
		var self=this;
		self.jira="";
	}
	getJira(){
		var self=this;
		if (self.jira==""){
			self.jira=new RCGJira(self);
		}
		return self.jira;
	}
	run(){
		log("starting ZipWebApp");
		var self=this;
		self.addStep("Download Image...",function(){
			log("Requesting Image");
			self.loadRemoteFile("img/reports2.jpg");
			return self.waitForEvent();
		});
		self.addStep("changing image...",function(sPath,content){
			log("Image Loaded:"+sPath);
			var image=document.getElementById("jrfSplash");
			image.src = content;
			log("Image changed");
//			$('body').attr('ng-app', 'mySuperAwesomeApp');
			$("#"+self.htmlContainerId).html("<heros></heros>");
//			self.popCallback(); // finishing the process.
		});
		
		self.addStep("Loading angularjs and typescript inline compiler and Jira REST Client.... ",function(){
			var arrFiles=[	//"ts/demo.ts",
							"js/libs/angular.min.js",
							"js/angular/angScript.ts",
							"js/libs/typescript.min.js",
							"js/libs/typescript.compile.min.js",
							"js/rcglibs/Jira/RCGJira.js"
						 ]; //test
			self.loadRemoteFiles(arrFiles);
			return self.waitForEvent();
		});
		self.addStep("Getting Confluence Oauth Token", function(){
			var jira=self.getJira();
			jira.proxyPath=self.proxyPath;
			jira.instance=self.urlBase;
			jira.oauthConfluenceConnect();
		});
		
		self.addStep("Testing DIRECT Api Integrations.... ",function(){
			var jira=self.getJira();
			jira.getAllIssues();
		});
		self.addStep("Testing Api Integrations.... ",function(){
			var jira=self.getJira();
			jira.getConfluence();
		});
	}
}

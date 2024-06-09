var RCGDocxSaver=class RCGDocxSaver{ //this kind of definition allows to hot-reload
	constructor(taskManager,htmlElementId,urlBase,nameBase){
		var self=this;
		taskManager.extendObject(self);
		self.sourceHtmlId=htmlElementId;
		self.urlBase=urlBase;
		self.fileNameBase=nameBase;
	}
	process(){
		var self=this;
		self.addStep("Processing content to save Docx",function(){
			var html="<html><body>"+$("#"+self.sourceHtmlId).find("iframe")[0].contentDocument.body.innerHTML+"</body></html>";
			var sInformeFileName="pandoc/"+self.fileNameBase+"-"+formatDate(new Date(),2);
			var sHtmlFileName=sInformeFileName+".html";
			var sDocxFileName=sInformeFileName+".docx";
			uploaderBaseUrl=self.urlBase;
			var uploader=newBlobUploader(sHtmlFileName,"text",50*1024*1024,
					function(){
						log("Block Send");
					},
					function(){
						var sinfName=sInformeFileName.replace(".html",".docx");
						downloader.initialize(1*1024*1024,"https://cantabrana.no-ip.org/seguimiento/php/getPandoc.php");
						downloader.getFile(sDocxFileName,
											function(data){
												debugger;
												saveDataToFile (data,sDocxFileName);
												log("Docx file saved");
												});
					});
			uploader.sendText(html);
			//return self.waitForEvent(); // not wait.... this will save the file in not stepper thread 
		    });
	}

}
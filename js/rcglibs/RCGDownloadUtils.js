function createSaver() {
	var objSaver={
		saveURL_internal: ( // lanza una descarga normal gestionada por el propio navegador.
						function () {
							var a = document.createElement("a");
							document.body.appendChild(a);
							a.style = "display: none";
							return function (url, fileName) {
								a.href = url;
								a.download = Date.now()+"-"+fileName;
								a.click();
								window.URL.revokeObjectURL(url);
							};
						}()),
		saveArrayBuffer:function(partsArray,fileName) { // para salvar un array de "buffers" (array de array de byte)
			var blob=new Blob(partsArray,{ type: 'ArrayBuffer',endings: 'native' });
			saveAs(
					blob
					,Date.now()+"-"+fileName 
					);
		},
		saveXML:function(sXML,fileName) { // para salvar un Strings (en este caso un XML)
			var arrStrings=[sXML];
			var blob=new Blob(arrStrings, {type : 'text/xml'}); // the blob
			saveAs(
					blob
					,Date.now()+"-"+fileName 
					);
		},
	}

	return objSaver;
}
var downloader={
	downloading:false,
	chunksize:256*1024,
	offset:0,
	filename:"",
	response:"",
	responsePart:"",
	responseType:"text", // para ficheros binarios seria 'arraybuffer'; 
	finalCallBack:"",
	urlGetFile:"",
	eventFinished:function(){
		var objMe=this;
		var newFilename=this.filename.split('/');
		newFilename=newFilename[newFilename.length-1];
		filesystem.SaveFile(newFilename,
							this.response,
							function(){
								log("Almacenado");
								setTimeout(function(){
									objMe.finalCallBack(objMe.response);
									});
								},
							function(){
								log("Error Almacenando");
								setTimeout(function(){
									objMe.finalCallBack(objMe.response);
									});
								}
							);
	},
	processPart:function(response){
		this.offset+=(response.length-1);
		this.response+=response;
		if (this.chunksize>response.length){
			//log("=============");
			//log(this.response);
			//log("=============");
			this.downloading=false;
			this.eventFinished();
		} else {
			this.getFilePart();
		}
	},
	getFile:function(filename,callback){
		var objMe=this;
		filesystem.ReadFile(filename,
							function(contenido){
								log("Fichero "+filename+" leido del almacenamiento persistente");
								setTimeout(function(){callback(contenido);});
							},function(){
								objMe.getFileInet(filename,callback);
							});
	},
	getFileInet:function(filename,callback){
		this.downloading=true;
		this.offset=0;
		this.finalCallBack=callback;
		this.response="";
		this.filename=filename;
		log(filename);
		var tipo="arraybuffer";
		var ext=filename.split(".");
		ext=ext[ext.length-1];
		if ((ext=="txt") ||
			(ext=="xml") ||
			(ext=="json") ||
			(ext=="log")) {
			tipo="text";
		}
		this.responseType=tipo;
		if (tipo!="arraybuffer"){
			this.response="";
		} else {
			this.response=new Array();
		}
		this.getFilePart();
	},
	getFilePart:function(){
		var resType=this.responseType;
		var objMe=this;
		var xhr = new XMLHttpRequest();
		xhr.open('GET', this.urlGetFile+"?file="+this.filename, true);
		xhr.setRequestHeader("Range", "bytes="+this.offset+"-"+(this.offset+this.chunksize-1));
		xhr.responseType = resType; // para ficheros binarios seria 'arraybuffer'; 
		xhr.onload = function(e) {
			var responseData;
			objMe.offset+=(e.total);
			if (resType=="text"){
			  responseData=this.response;
			  objMe.response+=responseData;
			} else if (resType=="arraybuffer"){
			  responseData=new Uint8Array(this.response); //para ficheros binarios response is unsigned 8 bit integer
			  objMe.response.push(responseData);
			}
			log(objMe.chunksize + " --  "+ objMe.offset+ " e.Total:"+e.total);
			if (objMe.chunksize>e.total){
				objMe.downloading=false;
				objMe.eventFinished();
			} else {
				objMe.getFilePart();
			}
			  //objMe.processPart(responseData);
		};
		xhr.send();
	},
	initialize:function(chunksize,urlGetFile){
		this.downloading=false;
		this.chunksize=chunksize;
		this.offset=0;
		this.filename="";
		this.response="";
		this.responsePart="";
		this.finalCallBack="";
		if (typeof urlGetFile==="undefined"){
			this.urlGetFile="php/uploaddownload/getFile.php";
		} else {
			this.urlGetFile=urlGetFile;
		}
	}
	
}

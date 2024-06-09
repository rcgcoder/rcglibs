var uploaderBaseUrl="";
function newUploader(file,serverFileName,type,chunkSize,readAllToMemory,cbBlockRead,cbFileRead,cbBlockSend,cbFileSend){
	var uploader={
		callbackFileRead:null,
		callbackBlockRead:null,
		callbackFileUpload:null,
		callbackBlockUpload:null,
		fileSize:0,
		chunkSize://2*8*
					64*
					1024, // bytes por bloque leido
		offset:0,
		block:null,
		bReadAllToMemory:false, //si queremos que ademas de llamar a los callbacks lea todo a memoria
		partsArray:null,
		file:null,
		fileName:null,
		serverFileName:null,
		fileType:"text", // 
		sending:false,
		sendWaiting:[],
		fileManager:null, //para gestionar listados y threads.
		filePool:[],
		maxThreadsActive:5,
		bActive:false,
		bFinished:false,
		initialize:function(file,serverFileName,type,chunkSize,readAllToMemory,cbBlockRead,cbFileRead,cbBlockSend,cbFileSend){
			this.file=file;
			if (typeof file!=="undefined") {
				this.fileSize=file.size;
				this.fileName=file.name;
			} else {
				this.fileSize= -1;
				this.fileName="";
			}
			this.serverFileName=serverFileName;
			this.fileType=type;
			this.chunkSize=chunkSize;
			this.callbackFileRead=cbFileRead;
			this.callbackBlockRead=cbBlockRead;
			this.bReadAllToMemory=readAllToMemory;
			this.callbackFileUpload=cbFileSend;
			this.callbackBlockUpload=cbBlockSend;
			this.offset=0;
			this.sending=false;
			this.bFinished=false;
			this.bActive=false;
		},
		parseFile:function () {
			this.offset = 0;
			this.bActive=true;
			this.block = null;
			this.partsArray  = new Array();
			this.readblock();
		},				
		readblock:function() {
			if (this.offset<this.fileSize){
				var objMe = this; // we need a reference to the current object
				var r = new FileReader();
				var blob = this.file.slice(this.offset, this.chunkSize+ this.offset);
				r.onload = function(e) {
						log("block onload");
						objMe.fncControl(e);
						};
				if (this.fileType=="text") {
					r.readAsText(blob);
				} else {
					r.readAsArrayBuffer(blob);
				}
			}
		},
		nextFile:function(){
			if (this.filePool.length>0){
				var nActives=0;
				var nextElementActivable;
				for (var i=0;i<this.filePool.length;i++){
					if (this.filePool[i].bActive){
						nActives++;
						if (nActives>=this.maxThreadsActive){
							return;
						}
					}
				}
				for (var i=0;i<this.filePool.length;i++){
					if (!this.filePool[i].bActive) {
						if (!this.filePool[i].bFinished) {
							nActives++;
							if (nActives>this.maxThreadsActive){
								return;
							} else {
								nextElementActivable=this.filePool[i];
								nextElementActivable.parseFile();
							}
						}
					}
				}
			}
		},
		fncControl:function(evt) {
			if (evt.target.error == null) {
				this.offset += evt.loaded;
				if (this.bReadAllToMemory) {
					this.partsArray.push(evt.target.result);
				}
				if (typeof this.callbackBlockRead!=="undefined"){
					this.callbackBlockRead(this,evt.target.result);
				}
			} else {
				log("Read error: " + evt.target.error);
				return;
			}
			if (this.offset>=this.fileSize) {
				if (typeof this.callbackFileRead!=="undefined"){ 
					this.callbackFileRead(this); // callback for handling end of file read
				}
				this.bFinished=true;
				this.bActive=false;
				if (!(
					 (this.fileManager==null) || (typeof this.fileManager==="undefined")
					 )){
					this.fileManager.nextFile();
				}
				return;
			}
			//this.readblock();
		},
		fncReadFiles:function(evt){  // evt es la lista de ficheros elegidos con un boton de html
			var files=evt.target.files;
			if (!files) {
				alert("Failed to load files");
			} else {
				for (var i=0, f; f=files[i] ; i++) {
					var tipo="bin";
					var ext=f.name.split(".");
					ext=ext[ext.length-1];
					if ((ext=="txt") ||
						(ext=="xml") ||
						(ext=="csv") ||
						(ext=="json") ||
						(ext=="log")) {
						tipo="text";
					}
					var uploaderAux=newUploader(f
												,this.serverFileName + " - " + f.name
												,tipo
												,this.chunkSize
												,this.bReadAllToMemory
												,this.callbackBlockRead
												,this.callbackFileRead
												,this.callbackBlockUpload
												,this.callbackFileUpload);
					uploaderAux.fileManager=this;
					this.filePool.push(uploaderAux);
					this.nextFile();
				}
			}			
		},
		sendDirect:function(formData,callback){
			objMe=this;
			$.ajax({
				type: 'POST',
				url: uploaderBaseUrl+"php/uploaddownload/upload.php",
				data: formData,
				processData: false,
				contentType: false
			}).done(function(data) {
					log(data);
					if (typeof callback!=="undefined"){
						callback(objMe);
					}
			});
		},
		sendOrdered:function(formData){// se utiliza sendordered para mantener en memoria un buffer 
								  // con los datos leidos que se van a enviar y enviarlos en el mismo orden que se leyeron
								  // En un caso real de 500MB debería lanzarse la lectura (readblock) cuando acabara el envío (en el callback de sendDirect)
								  // con el fin de no saturar la memoria (se lee de disco mas rápido de lo que se envia por la red)
			this.sendWaiting.push(formData);
			log("Partes a enviar:"+this.sendWaiting.length);
			if (this.sending){
				log("ya esta enviando.. hay que esperar");
				// no hacer nada
			} else {
				this.sending=true;
				if (this.sendWaiting.length>0){
					var objMe=this;
					var enviar=function(){
						if (objMe.sendWaiting.length>0){
							var frmData=objMe.sendWaiting.shift();
							log("Envia....");
							objMe.sendDirect(frmData,function(){
								if (typeof objMe.callbackBlockUpload!=="undefined"){
									objMe.callbackBlockUpload(objMe);
								}
								enviar();
								});
						} else {
							objMe.sending=false;
						}
					};
					enviar();
				} else {
					this.sendWaiting=false;
				}
			}
		},
		sendTextPart:function(data){
			var arrStrings=[data];
			var textBlob=new Blob(arrStrings, {type : 'text/xml'}); // the blob
			var fd = new FormData();
			fd.append('filename', this.serverFileName);
			fd.append('data', textBlob);
			fd.append('append', "si");
			fd.append('text', "si");
			log("Preparando la parte"+this.serverFileName+" "+data.length);
			this.sendOrdered(fd); // se utiliza sendordered para mantener en memoria un buffer 
								  // con los datos leidos que se van a enviar y enviarlos en el mismo orden que se leyeron
								  // En un caso real de 500MB debería lanzarse la lectura (readblock) cuando acabara el envío
								  // con el fin de no saturar la memoria (se lee de disco mas rápido de lo que se envia por la red)
		},
		sendText:function(data){
			log("Tamaño del fichero a enviar:"+data.length +" en partes de:" + this.chunkSize);
			if (data.length<=this.chunkSize) {
				var arrStrings=[data];
				var textBlob=new Blob(arrStrings, {type : 'text/xml'}); // the blob
				var fd = new FormData();
				fd.append('filename', this.serverFileName);
				log("Enviando el Texto: ServerName:"+this.serverFileName + " FileName:" + this.fileName + " tam:"+data.length);
				fd.append('data', textBlob);
				fd.append('text', "si");
				this.sendDirect(fd,this.callbackFileUpload);
			} else {
				var iSize=data.length;
				var iProgress=0.0;
				var sAux;
				var iParte=0;
				while (iProgress<iSize){
					log("Preparando fichero a enviar:"+data.length +" en partes de:" + this.chunkSize);
					sAux=data.substr(iProgress,this.chunkSize);
					log(iParte + " - "+sAux.length);
					this.sendTextPart(sAux);
					iProgress+=sAux.length;
				}
			}
		},
		sendPartsArray:function(partsArray){
			var dataBlob=new Blob(partsArray, {type : 'text/xml'}); // the blob
			var fd = new FormData();
			fd.append('filename', this.serverFileName);
			log("Enviando el Binario: ServerName:"+this.serverFileName + " FileName:" + this.fileName);
			fd.append('data', dataBlob);
			fd.append('text', "no");
			this.sendDirect(fd,this.callbackFileUpload);
		}
	}
	uploader.initialize(file,serverFileName,type,chunkSize,readAllToMemory,cbBlockRead,cbFileRead,cbBlockSend,cbFileSend);
	return uploader;
}					
function newBlobUploader(serverFileName,type,chunkSize,cbBlockSend,cbFileSend){
	var undefVar;
	return newUploader(undefVar,serverFileName,type,chunkSize,true,undefVar,undefVar,cbBlockSend,cbFileSend);
}

function newEmptyUploader(serverFileName,type,chunkSize,readAllToMemory,cbBlockRead,cbFileRead,cbBlockSend,cbFileSend){
	var undefVar;
	var newcbFileRead=function(uploader,result){
		uploader.sendPartsArray(uploader.partsArray);
		if (typeof cbFileRead!=="undefined"){
			cbFileRead(uploader,result);
		}
   }
	return newUploader(undefVar,serverFileName,type,chunkSize,readAllToMemory,cbBlockRead,newcbFileRead,cbBlockSend,cbFileSend);
}


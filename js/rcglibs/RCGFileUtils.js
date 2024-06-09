var saveDataToFile = (data, fileName, mimeType) => {
	  var auxData=data;
	  if (isString(auxData)) auxData=[auxData];
	  const blob = new Blob(auxData, { type: mimeType });
	  const url = window.URL.createObjectURL(blob);
	  downloadURL(url, fileName, mimeType);
	  setTimeout(() => {
	    window.URL.revokeObjectURL(url);
	  }, 1000);
	};

var downloadURL = (data, fileName) => {
	  const a = document.createElement('a');
	  a.href = data;
	  a.download = fileName;
	  document.body.appendChild(a);
	  a.style = 'display: none';
	  a.click();
	  a.remove();
};
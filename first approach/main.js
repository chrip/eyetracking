$(document).ready(function(){
	if(isAPIAvailable()){
		$('#imageFile').bind('change', handleImageSelect);
		$('#gazeDataFile').bind('change', handleGazeDataSelect);
	}
	
	receiveSelection();
});

function isAPIAvailable() {
    // Check for the various File API support.
    if (window.File && window.FileReader && window.FileList && window.Blob) {
      // Great success! All the File APIs are supported.
      return true;
    } else {
      // source: File API availability - http://caniuse.com/#feat=fileapi
      // source: <output> availability - http://html5doctor.com/the-output-element/
      document.writeln('The HTML5 APIs used in this form are only available in the following browsers:<br />');
      // 6.0 File API & 13.0 <output>
      document.writeln(' - Google Chrome: 13.0 or later<br />');
      // 3.6 File API & 6.0 <output>
      document.writeln(' - Mozilla Firefox: 6.0 or later<br />');
      // 10.0 File API & 10.0 <output>
      document.writeln(' - Internet Explorer: Not supported (partial support expected in 10.0)<br />');
      // ? File API & 5.1 <output>
      document.writeln(' - Safari: Not supported<br />');
      // ? File API & 9.2 <output>
      document.writeln(' - Opera: Not supported');
      return false;
    }
};

function handleImageSelect(evt){
	
	var file = evt.target.files[0];
	
	console.log(file.name);
	
	openImage(file.name);  
};

// open image from local file system
function openImage(file){

	$("#imageDiv").append('<img src=\'' + file + '\' id=\'resultImage\'>');
};

function handleGazeDataSelect(evt){
	
	var file = evt.target.files[0];
	
	readCSV(file);  
};
  
function readCSV(file){

	var reader = new FileReader();
	reader.readAsText(file);
	reader.onload = function(evt){
	
		var csv = evt.target.result;
		// delimiter '\t' does nor work somehow
		var data = $.csv.toArrays(csv);
		
		var delimiter = '\t';
		
		for(var row in data){
			for(var item in data[row]){
				
				console.log(data[row][item]);
				
				// columns of .csv file
				//var output = data[row][item].split(delimiter);
				
				//console.log(output);
				
				//for(var i in output){
					//console.log(output[i]);
				//}
			}
		}	
	}
};

// receive potential files for visualization 
function receiveSelection(){
	
	$.ajax({
		type: 'GET',
		url: 'selectiondata.html',
		datatype: 'application/json',
		success: function(data){
			
			var content = eval("("+data+")");
			
			// add options to dropdown menu
			for(var i = 0; i < content.selectiondata.length; i++){
				n = content.selectiondata[i].name;
				$('#fileSelection').append($('<option></option>').val(n).html(n).attr("type", content.selectiondata[i].type));
			}	
			
		},
		error: function(jqXHR, textStatus, errorThrown) {
			console.log("jq: " + JSON.stringify(jqXHR));
			console.log("textStatus: " + textStatus);
			console.log("errorThrown:" + errorThrown);
			console.log('failed to load gaze data');			
		}
	});		
};

// load gaze data from server
function receiveGazeData(file){
	
	$.ajax({
		type: 'GET',
		url: 'data/'+ file + '_gazedata.html',
		datatype: 'application/json',
		success: function(data){
			
			// gaze data, saved as object structure
			var gazedata = eval("("+data+")");
			
			console.log(gazedata);
		},
		error: function(jqXHR, textStatus, errorThrown) {
			console.log("jq: " + JSON.stringify(jqXHR));
			console.log("textStatus: " + textStatus);
			console.log("errorThrown:" + errorThrown);
			console.log('failed to load gaze data');			
		}
	});		
};

// load image from server 
function receiveImage(data){
	
	$.ajax({
		type: 'GET',
		url: 'data/' + data + '_imagedata.html',
		datatype: 'application/json',
		success: function(img){
		
			var filetype = $('#fileSelection').find('option:selected').attr('type');	
			var file = "data:image/" + filetype + ";base64," + JSON.parse(img);

			$('#resultImage').attr('src', file);

		},	
		error: function(jqXHR, textStatus, errorThrown) {
			console.log("jq: " + JSON.stringify(jqXHR));
			console.log("textStatus: " + textStatus);
			console.log("errorThrown:" + errorThrown);
			console.log('failed to load image data');			
		}
	});

};	
		
// TODO			
// call draw function etc.	
function fileChanged(){

	var value = $('#fileSelection').val();
	
	if(value != "donothing"){
	
		receiveImage(value);
		receiveGazeData(value);

	}	
}		
$(document).ready(function(){
	/*
	if(isAPIAvailable()){
		$('#imageFile').bind('change', handleImageSelect);
		$('#gazeDataFile').bind('change', handleGazeDataSelect);
	}
	*/
	
	// get available size for scailing of result image to fit it to screen
	windowwidth  = $(window).width();
	windowheight = $(window).height();
	
	headerheight = $('#header').height();
	borderwidth = 0;	// stub for settings space
	
	receiveSelection();
});


/*
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
	
	// remove width and height to force new scaling when changing the image
	$('#resultImage').removeAttr('style');
	
	$.when(
	$.ajax({
		type: 'GET',
		url: 'data/' + data + '_imagedata.html',
		datatype: 'application/json',
		success: function(img){
		
			var filetype = $('#fileSelection').find('option:selected').attr('type');	
			var file = "data:image/" + filetype + ";base64," + JSON.parse(img);

			$('#resultImage').attr('src', file);	
			
			console.log("receive success: " + $('#resultImage').attr('src'));
		
		},	
		error: function(jqXHR, textStatus, errorThrown) {
			console.log("jq: " + JSON.stringify(jqXHR));
			console.log("textStatus: " + textStatus);
			console.log("errorThrown:" + errorThrown);
			console.log('failed to load image data');			
		},
		complete: function(jqXHR, textStatus){
			
			var image = $('#resultImage');
			var w = $('#fileSelection').find('option:selected').attr('imgwidth');
			var h = $('#fileSelection').find('option:selected').attr('imgheight');
			
			console.log("W " + w + " H " + h);
			var arr = scaleDimensions(w, h);
			image.width(arr[0]).height(arr[1]);
			
			console.log("receive complete: " + $('#resultImage').attr('src'));
			
		}
	})).done(function(x){
		console.log(" receive iamge complete")
	});
};	
*/


// receive potential files for visualization 
function receiveSelection(){
	
	$.ajax({
		type: 'GET',
		url: 'selectiondata.html',
		datatype: 'application/json',
		success: function(data){
			
			var content = eval("("+data+")");
			
			console.log(content);
			
			// add options to dropdown menu
			for(var i = 0; i < content.selectiondata.length; i++){
				n = content.selectiondata[i].name;
				$('#fileSelection').append($('<option></option>').val(n).html(n).attr("type", content.selectiondata[i].type).attr("imgWidth", content.selectiondata[i].width).attr("imgHeight", content.selectiondata[i].height));
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


// scale data to available screen space
function scaleDimensions(width, height){

	//console.log("old dimensions: " + width + " x " + height);
		
	// scale image
	var ratio = 1.0;
	var maxWidth = windowwidth - borderwidth - 30;
	var maxHeight = windowheight - headerheight - 30;

	if (width > maxWidth){
		ratio = maxWidth / width;
		width = maxWidth;
		height *= ratio;
	}
			
	if(height > maxHeight){
		ratio = maxHeight / height;
		width *= ratio;
		height = maxHeight;
	}	
	
	var scaledWidth = width;
	var scaledHeight = height;
	
	//console.log("new dimensions: " + scaledWidth + " x " + scaledHeight);
	
	return [scaledWidth, scaledHeight];
}
		
// receive image and gaze data, execute drawCanvas() when ajax is completed
function receiveCanvasContent(value){

	// pass image source to canvas
	var imgSrc = "";
	// pass gaze data to draw function
	var gazeContent;
	
	$.when(
		// receive image
		$.ajax({
			type: 'GET',
			url: 'data/' + value + '_imagedata.html',
			datatype: 'application/json',
			success: function(img){
				
				var filetype = $('#fileSelection').find('option:selected').attr('type');	
				var file = "data:image/" + filetype + ";base64," + JSON.parse(img);

				//$('#resultImage').removeAttr('style');
				//$('#resultImage').attr('src', file);
				g_imagesrc = file;
				imgSrc = file;
				
			},	
			error: function(jqXHR, textStatus, errorThrown) {
				console.log("jq: " + JSON.stringify(jqXHR));
				console.log("textStatus: " + textStatus);
				console.log("errorThrown:" + errorThrown);
				console.log('failed to load image data');			
			},
			complete: function(jqXHR, textStatus){

				var w = $('#fileSelection').find('option:selected').attr('imgwidth');
				var h = $('#fileSelection').find('option:selected').attr('imgheight');

				var arr = scaleDimensions(w, h);
				//$('#resultImage').width(arr[0]).height(arr[1]);		
			}
		}),
		// receive gaze data
		$.ajax({
			type: 'GET',
			url: 'data/'+ value + '_gazedata.html',
			datatype: 'application/json',
			success: function(data){
					
				// gaze data, saved as object structure
				gazeContent = eval("("+data+")");
				
				console.log(gazeContent);
			},
			error: function(jqXHR, textStatus, errorThrown) {
				console.log("jq: " + JSON.stringify(jqXHR));
				console.log("textStatus: " + textStatus);
				console.log("errorThrown:" + errorThrown);
				console.log('failed to load gaze data');			
			}
		}))
	.done(function(x){
		// call draw function when image data is loaded completely
		drawCanvas(imgSrc, gazeContent);
	});	
}		

// TODO	
// call draw function etc.	
function fileChanged(){

	var value = $('#fileSelection').val();
		
	if(value != "donothing"){
		
		receiveCanvasContent(value);
		$('#visTag').show();
		$('#visSelect').show();
	}
}	

// visualize gaze plot
/* TODO: 
 * - add options for colors, order, borders, connecting lines, scaling of radius...
 */
function drawGazeplot(data){
	
	$('#imageDiv').append('<canvas id=\'layer2\' width=\'' + $('#layer1').width() + '\' height=\'' + $('#layer1').height() + '\' style="border:3px solid #000000; z-index:2"></canvas>');
	
	var layer2 = document.getElementById("layer2");
	var ctx2 = layer2.getContext("2d");
	
	ctx2.clearRect(0,0, $('#layer1').width(), $('#layer1').height());
	
	for(var i = 0; i < data.gazedata.length; i++){
		var index = data.gazedata[i].fi;
		var x = data.gazedata[i].fx;
		var y = data.gazedata[i].fy;
		var duration = data.gazedata[i].gd;
		
		// scale gaze data coordinates
		var scaleX = $('#layer1').width()  / $('#fileSelection').find('option:selected').attr('imgwidth');
		var scaleY = $('#layer1').height() / $('#fileSelection').find('option:selected').attr('imgheight');

		// draw connecting lines
		if(i < data.gazedata.length-1){
			line(ctx2, x*scaleX, y*scaleY, data.gazedata[i+1].fx*scaleX, data.gazedata[i+1].fy*scaleY);
		}
		
		// draw fixation circles
		circle(ctx2, x*scaleX, y*scaleY, (50 / 800 * duration) );
		
		// print fixation index
		ctx2.fillStyle = "black";
		ctx2.font = "16px Arial";
		ctx2.fillText(index, x*scaleX-5, y*scaleY+5);
	}	
	
	// place canvases over each other
	$('#layer1').css({position: 'absolute'});
	$('#layer2').css({position: 'absolute'});
}

function line(ctx, sx, sy, ex, ey){

	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.moveTo(sx, sy);
	ctx.lineTo(ex, ey);
	ctx.stroke();
}

function circle(ctx, x, y, r){

	ctx.beginPath();
	ctx.arc(x, y, r, 0, 2 * Math.PI);
	ctx.fillStyle="blue";
	ctx.fill();
}	


function drawCanvas(src, content){
	
	var w = $('#fileSelection').find('option:selected').attr('imgwidth');
	var h = $('#fileSelection').find('option:selected').attr('imgheight');

	// get correct canvas size
	var arr = scaleDimensions(w, h);	
	
	// check whether canvas already exists
	if($('#layer1').length > 0){
		$('#layer1').remove();
	}
	// create canvas with correct dimensions
	$('#imageDiv').append('<canvas id=\'layer1\' width=\'' + arr[0] + '\' height=\'' + arr[1] + '\' style="border:3px solid #000000; z-index:1"></canvas>');
	
	
	var layer1 = document.getElementById("layer1");
	var ctx1 = layer1.getContext("2d");
	ctx1.clearRect(0,0, arr[0], arr[1]);
	
	// draw input image as background to canvas
	var imageObj = new Image();
	imageObj.onload = function(){
		ctx1.drawImage(imageObj, 0, 0, arr[0], arr[1]);
	}
	imageObj.src = src;
	
	
	// specific draw functions
	var value = $('#visSelect').val();
	
	// draw gazeplot on startup
	if(value == "gazePlot"){
		drawGazeplot(content);
	}
	
}
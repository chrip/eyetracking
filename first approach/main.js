$(document).ready(function(){
	
	// get available size for scailing of result image to fit it to screen
	windowwidth  = $(window).width();
	windowheight = $(window).height();
	
	headerheight = $('#header').height();
	borderwidth = $('#settingsDiv').width();
	
	receiveSelection();
	
	// save gaze data globally
	var g_content;
	
	// register color picker for fixation circles
	registerColorpicker($('#fixColorpicker'), $('#fixationColor'));
});


/*

// NOT NEEDED IN CURRENT VERSION
 
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

// register color picker
// elem1: inner div element
// elem2: constantly visible element
function registerColorpicker(elem1, elem2){

	elem1.ColorPicker({
		flat:true, 
		color: '#00ff00',
		onChange: function(hsb, hex, rgb){
			elem2.css('background', '#' + hex);
		},
		onSubmit: function(hsb, hex, rgb){
			drawGazeplot();
		}
	});
	elem1.removeAttr("style");
	elem1.css({'z-index':'6', position:'absolute'});
	elem1.hide();
}

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
				
				g_content = gazeContent;
				
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
		drawCanvas(imgSrc);
	});	
}		

// show gaze plot fixation indices
function showEnumeration(){
	
	if($('#showEnum').attr('checked'))
		$('#enumlayer').show();
	else
		$('#enumlayer').hide();
}

// show gaze plot fixation indices
function showGazePath(){
	
	if($('#showPath').attr('checked'))
		$('#connectionlayer').show();
	else
		$('#connectionlayer').hide();
}

var cp_visible = false;

// display color picker
function showColorpicker(elem){
	if(cp_visible){
		$(elem).fadeOut(500);
	}	
	else{	
		$(elem).fadeIn(500);
	}	
	cp_visible = !cp_visible;
}

function fileChanged(){

	var value = $('#fileSelection').val();
		
	if(value != "donothing"){
		
		receiveCanvasContent(value);
		$('#visTag').show();
		$('#visSelect').show();
		$('#settingsDiv').show();
	}
}	

// visualize gaze plot
function drawGazeplot(){

	// remove layers
	if($('#connectionlayer').length > 0){
		$('#connectionlayer').remove();
	}
	if($('#fixationlayer').length > 0){
		$('#fixationlayer').remove();
	}
	if($('#enumlayer').length > 0){
		$('#enumlayer').remove();
	}
	
	// draw gaze plot components to seperate canvas layers
	// connecting lines
	$('#imageDiv').append('<canvas id=\'connectionlayer\' width=\'' + $('#backgroundlayer').width() + '\' height=\'' + $('#backgroundlayer').height() + '\' style="border:3px solid #000000; z-index:2"></canvas>');
	var connectionlayer = document.getElementById("connectionlayer");
	var connectionctx = connectionlayer.getContext("2d");
	connectionctx.lineWidth = 4;
	connectionctx.clearRect(0,0, $('#backgroundlayer').width(), $('#backgroundlayer').height());
	
	// fixation circles
	$('#imageDiv').append('<canvas id=\'fixationlayer\' width=\'' + $('#backgroundlayer').width() + '\' height=\'' + $('#backgroundlayer').height() + '\' style="border:3px solid #000000; z-index:2"></canvas>');
	var fixationlayer = document.getElementById("fixationlayer");
	var fixationctx = fixationlayer.getContext("2d");
	// get color from color picker
	fixationctx.fillStyle= $('#fixationColor').css("background-color");
	fixationctx.lineWidth = 2;
	fixationctx.strokeStyle="black";
	fixationctx.clearRect(0,0, $('#backgroundlayer').width(), $('#backgroundlayer').height());
	
	// enumeration
	$('#imageDiv').append('<canvas id=\'enumlayer\' width=\'' + $('#backgroundlayer').width() + '\' height=\'' + $('#backgroundlayer').height() + '\' style="border:3px solid #000000; z-index:2"></canvas>');
	var enumlayer = document.getElementById("enumlayer");
	var enumctx = enumlayer.getContext("2d");
	enumctx.fillStyle = "black";
	enumctx.font = "bold 16px Arial";
	enumctx.textBaseline = "middle"; 
	enumctx.clearRect(0,0, $('#backgroundlayer').width(), $('#backgroundlayer').height());
	
	// scale gaze data coordinates
	var scaleX = $('#backgroundlayer').width()  / $('#fileSelection').find('option:selected').attr('imgwidth');
	var scaleY = $('#backgroundlayer').height() / $('#fileSelection').find('option:selected').attr('imgheight');
	
	for(var i = 0; i < g_content.gazedata.length; i++){
		var index = g_content.gazedata[i].fi;
		var x = g_content.gazedata[i].fx;
		var y = g_content.gazedata[i].fy;
		var duration = g_content.gazedata[i].gd;
		
		// draw connecting lines
		if(i < g_content.gazedata.length-1){
			line(connectionctx, x*scaleX, y*scaleY, g_content.gazedata[i+1].fx*scaleX, g_content.gazedata[i+1].fy*scaleY);
		}
		
		// draw fixation circles
		var radius = $('#radiusRange').val();
		if($('#radiusSelect').find('option:selected').val() == "duration"){
			radius = radius / 1000 * duration;
		}
		circle(fixationctx, x*scaleX, y*scaleY, radius);
		
		// print fixation index in the middle of the fixation circle
		var txtwidth = enumctx.measureText(index).width;
		enumctx.fillText(index, x*scaleX-(txtwidth/2), y*scaleY);
	}	
	
	// place canvases over each other
	$('#backgroundlayer').css({position: 'absolute'});
	$('#fixationlayer').css({position: 'absolute'});
	$('#connectionlayer').css({position: 'absolute'});
	$('#enumlayer').css({position: 'absolute'});
}

// draw line from (sx,sy) to (ex, ey)
function line(ctx, sx, sy, ex, ey){

	ctx.beginPath();
	ctx.moveTo(sx, sy);
	ctx.lineTo(ex, ey);
	ctx.stroke();
}

//draw circle with center at (x,y) and radius r
function circle(ctx, x, y, r){

	ctx.beginPath();
	ctx.arc(x, y, r, 0, 2 * Math.PI);
	ctx.fill();
	// draw border around circle
	ctx.stroke();
}	

function drawCanvas(src){
	
	var w = $('#fileSelection').find('option:selected').attr('imgwidth');
	var h = $('#fileSelection').find('option:selected').attr('imgheight');

	// get correct canvas size
	var arr = scaleDimensions(w, h);	
	
	// check whether canvas already exists
	if($('#backgroundlayer').length > 0){
		$('#backgroundlayer').remove();
	}
	// create canvas with correct dimensions
	$('#imageDiv').append('<canvas id=\'backgroundlayer\' width=\'' + arr[0] + '\' height=\'' + arr[1] + '\' style="border:3px solid #000000; z-index:1"></canvas>');
	
	
	var backgroundlayer = document.getElementById("backgroundlayer");
	var ctx1 = backgroundlayer.getContext("2d");
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
		drawGazeplot();
	}
	
}
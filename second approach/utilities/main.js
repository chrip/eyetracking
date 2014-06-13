$(document).ready(function(){
	
	// get available size for scailing of result image to fit it to screen
	windowwidth  = $(window).width();
	windowheight = $(window).height();
	
	headerheight = $('#header').height();
	borderwidth = $('#settingsDiv').width();
	
	receiveSelection();
	
	// save gaze data globally
	var g_content;
	var unsorted_content;
	var g_imgSrc;
	
	// register color picker for fixation circles
	registerColorpicker($('#fixColorpicker'), $('#fixationColor'));
	// register color picker for connecting lines
	registerColorpicker($('#lineColorpicker'), $('#lineColor'));
	
});

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

				g_imgSrc = file;
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
				unsorted_content = JSON.parse(JSON.stringify(g_content));
				
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

// open save dialog to save result on local hard disk
function saveResult(){
	
	// combine filename of visualization method and chosen file
	var filename = $('#visSelect').val() +  "_" + $('#fileSelection').val() + ".png";
	
	var canvas = document.getElementById('resultlayer');
	canvas.toBlob(function(blob){
		saveAs(blob, filename);
	});
}

function fileChanged(){

	var value = $('#fileSelection').val();
		
	if(value != "donothing"){
		
		receiveCanvasContent(value);
		$('#visTag').show();
		$('#visSelect').show();
		$('#settingsDiv').show();
		$('#saveButton').show();
	}
}	

// visualize gaze plot
function drawGazeplot(){

	// remove layer
	if($('#resultlayer').length > 0){
		$('#resultlayer').remove();
	}
	
	// draw gaze plot components to seperate canvas layers
	// connecting lines
	$('#imageDiv').append('<canvas id=\'connectionlayer\' width=\'' + $('#backgroundlayer').width() + '\' height=\'' + $('#backgroundlayer').height() + '\' style="border:3px solid #000000; z-index:2"></canvas>');
	var connectionlayer = document.getElementById("connectionlayer");
	var connectionctx = connectionlayer.getContext("2d");
	// get color from color picker
	connectionctx.strokeStyle= $('#lineColor').css("background-color");
	connectionctx.lineWidth = 4;
	connectionctx.globalAlpha = $('#opacityRange').val() / 100.0;
	connectionctx.clearRect(0,0, $('#backgroundlayer').width(), $('#backgroundlayer').height());
	
	// fixation circles
	$('#imageDiv').append('<canvas id=\'fixationlayer\' width=\'' + $('#backgroundlayer').width() + '\' height=\'' + $('#backgroundlayer').height() + '\' style="border:3px solid #000000; z-index:2"></canvas>');
	var fixationlayer = document.getElementById("fixationlayer");
	var fixationctx = fixationlayer.getContext("2d");
	// get color from color picker
	fixationctx.fillStyle= $('#fixationColor').css("background-color");
	fixationctx.lineWidth = 2;
	fixationctx.strokeStyle="black";
	fixationctx.globalAlpha = $('#opacityRange').val() / 100.0;
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
	
	// sort gaze data based on duration from long to short
	g_content.gazedata.sort(function(a,b){
		return (b.gd > a.gd) ? 1 : ((b.gd < a.gd) ? -1 : 0);
	});

	
	for(var i = 0; i < g_content.gazedata.length; i++){
		var index = g_content.gazedata[i].fi;
		var x = g_content.gazedata[i].fx;
		var y = g_content.gazedata[i].fy;
		var duration = g_content.gazedata[i].gd;
		
		// draw connecting lines
		if(i < unsorted_content.gazedata.length-1){
			line(connectionctx, unsorted_content.gazedata[i].fx*scaleX, unsorted_content.gazedata[i].fy*scaleY, unsorted_content.gazedata[i+1].fx*scaleX, unsorted_content.gazedata[i+1].fy*scaleY);
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
	
	// merged canvas
	$('#imageDiv').append('<canvas id=\'resultlayer\' width=\'' + $('#backgroundlayer').width() + '\' height=\'' + $('#backgroundlayer').height() + '\' style="border:3px solid #000000; z-index:2"></canvas>');
	var resultlayer = document.getElementById("resultlayer");
	var resultctx = resultlayer.getContext("2d");
	resultctx.clearRect(0,0, $('#backgroundlayer').width(), $('#backgroundlayer').height());

	var backgroundlayer = document.getElementById("backgroundlayer");
	
	resultctx.drawImage(backgroundlayer,0,0);
	if($('#showPath').attr('checked'))
		resultctx.drawImage(connectionlayer,0,0);
	resultctx.drawImage(fixationlayer,0,0);
	if($('#showEnum').attr('checked'))
		resultctx.drawImage(enumlayer,0,0);	
	
	$('#resultlayer').css({position: 'absolute'});
	$('#fixationlayer').remove();
	$('#connectionlayer').remove();
	$('#enumlayer').remove();

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

	$('#backgroundlayer').css({position: 'absolute'});
	$('#backgroundlayer').hide();
	
	// draw input image as background to canvas
	imageObj = new Image();
	imageObj.onload = function(){
		ctx1.drawImage(imageObj, 0, 0, arr[0], arr[1]);
		
		// specific draw functions
		var value = $('#visSelect').val();
		
		// draw gazeplot on startup
		if(value == "gazePlot"){
			drawGazeplot();
		}
	}
	imageObj.src = src;
	
}
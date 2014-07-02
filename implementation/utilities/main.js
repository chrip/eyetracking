$(document).ready(function(){
	
	// get available size for scailing of result image to fit it to screen
	windowwidth  = $(window).width();
	windowheight = $(window).height();
	
	headerheight = $('#header').height();
	borderwidth = $('#gazeplotSettingsDiv').width();
	
	receiveSelection();
	
	// save gaze data globally
	var g_content;
	var unsorted_content;
	var g_imgSrc;

  // default: uncheck fit-to-screen checkbox 
  $('input[name=fitToScreen]').attr('checked', false);
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
		
			if($('#visSelect').val() == "gazeplot")
				drawGazeplot();
			else if($('#visSelect').val() == "heatmap")
				drawHeatmap();
			else if($('#visSelect').val() == "attentionmap")
				drawAttentionmap();
				
			showColorpicker(elem1);	
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
		url: 'selectiondata.json',
		datatype: 'application/json',
		success: function(content){
			
			//console.log("receive selection: " + content);
			
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
		//$("#imageDiv").append('<img id="foobar" src="data/'+value +'.jpg" >'),
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

			}
		}),
   
		// receive gaze data
		$.ajax({
			type: 'GET',
			url: 'data/' + value + '_gazedata.json',
			datatype: 'application/json',
			success: function(data){
				
				//console.log("receive gazedata: " + data);
				
        g_content = data;

        // create backup json object which won't be sorted
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

  $('input[name=fitToScreen]').attr('checked', false);
  fitted = false;
  
	var value = $('#fileSelection').val();
		
	if(value != "donothing"){
		
		receiveCanvasContent(value);
		$('#visTag').show();
		$('#visSelect').show();
		$('#saveButton').show();
    $('#fitToScreen').show();
    $('#ftsTag').show();
		
		var visualization = $('#visSelect').val();
		if(visualization == "gazeplot"){
			$('#gazeplotSettingsDiv').show();
			$('#heatmapSettingsDiv').hide();
			$('#attentionmapSettingsDiv').hide();
		}	
		else if(visualization == "heatmap"){
			$('#heatmapSettingsDiv').show();
			$('#gazeplotSettingsDiv').hide();
			$('#attentionmapSettingsDiv').hide();
		}
		else if(visualization == "attentionmap"){
			$('#attentionmapSettingsDiv').show();
			$('#gazeplotSettingsDiv').hide();
			$('#heatmapSettingsDiv').hide();
		}
	}
}	

function visualizationChanged(){
	
	var visualization = $('#visSelect').val();
	
	if(visualization == "gazeplot"){
		$('#gazeplotSettingsDiv').show();
		$('#heatmapSettingsDiv').hide();
		$('#attentionmapSettingsDiv').hide();
	}	
	else if(visualization == "heatmap"){
		$('#heatmapSettingsDiv').show();
		$('#gazeplotSettingsDiv').hide();
		$('#attentionmapSettingsDiv').hide();
	}
	else if(visualization == "attentionmap"){
		$('#attentionmapSettingsDiv').show();
		$('#gazeplotSettingsDiv').hide();
		$('#heatmapSettingsDiv').hide();
	}
	
	drawCanvas(g_imgSrc);
}

// visualize attentionmap
function drawAttentionmap(){

  $('#attentionmapSettingsDiv').height($('#backgroundlayer').height());

	// remove gaze plot layer if present
	if($('#resultlayer').length > 0){
		$('#resultlayer').remove();
	}

	$('#imageDiv').append('<div id=\'attentionmapArea\' />');
	$('#attentionmapArea').width($('#backgroundlayer').width()).height($('#backgroundlayer').height());
	$('#attentionmapArea').css("border", "3px solid #000000");
		
	// color does not really matter, just chose anyone
	var color = "rgb(0, 0, 0)";	
	
	var radius = $('#attentionmapRadius').val();
	var countdefault;
	if($('#attentionCountSelect').find('option:selected').val() == "default")
		countdefault = true;
	else	
		countdefault = false;
		
	var config = {
		"element": document.getElementById("attentionmapArea"),
		"radius":  radius,
		"opacity": 90,
		"gradient": { 0.45: color, 0.55: color, 0.65: color, 0.95: color, 1.0: color}
	};
	
	// use heatmap to create the fixations, subtract it from the cover layer
	// heatmap creation
	var attentionmap = h337.create(config);
	
  var scaleX = 1;
  var scaleY = 1;
  
  if(fitted){
    // scale gaze data coordinates
    scaleX = $('#backgroundlayer').width()  / $('#fileSelection').find('option:selected').attr('imgwidth');
    scaleY = $('#backgroundlayer').height() / $('#fileSelection').find('option:selected').attr('imgheight');
	}
  
	// pass data to heatmap
	for(var i = 0; i < unsorted_content.gazedata.length; i++){
		
		var x  = g_content.gazedata[i].fx;
		var y  = g_content.gazedata[i].fy;	
		var count;
		if(!countdefault){
			count = Math.round(g_content.gazedata[i].gd / 100);
		}
		else if(countdefault){
			count = 1;
		}
		
		// add point to heatmap
		attentionmap.store.addDataPoint(Math.round(x*scaleX), Math.round(y*scaleY), count);
	}
	
	// give attentionmap canvas an id
	$('#attentionmapArea').children('canvas').eq(0).attr('id', 'attentionmaplayer');

	// cover layer
	$('#imageDiv').append('<canvas id="coverlayer" width=\'' + $('#backgroundlayer').width() + '\' height=\'' + $('#backgroundlayer').height() + '\' style="border:3px solid #000000; z-index:2"></canvas>');
	var coverlayer = document.getElementById("coverlayer");
	var coverctx = coverlayer.getContext("2d");
	coverctx.clearRect(0,0, $('#backgroundlayer').width(), $('#backgroundlayer').height());
	coverctx.fillStyle= $('#attColor').css("background-color");
	coverctx.fillRect(0, 0, $('#backgroundlayer').width(), $('#backgroundlayer').height());
	
	var backgroundlayer = document.getElementById("backgroundlayer");
	var attentionmaplayer = document.getElementById("attentionmaplayer");
	
	// subtracting canvas - subtract heatmap from cover layer
	$('#imageDiv').append('<canvas id=\'subtractionlayer\' width=\'' + $('#backgroundlayer').width() + '\' height=\'' + $('#backgroundlayer').height() + '\' style="border:3px solid #000000; z-index:2"></canvas>');
	var subtractionlayer = document.getElementById("subtractionlayer");
	var subtractionctx = subtractionlayer.getContext("2d");
	subtractionctx.clearRect(0,0, $('#backgroundlayer').width(), $('#backgroundlayer').height());
	subtractionctx.globalAlpha = $('#attentionmapOpacity').val() / 100.0;
	subtractionctx.drawImage(coverlayer, 0, 0);
	subtractionctx.globalCompositeOperation = 'destination-out';
	subtractionctx.drawImage(attentionmaplayer, 0, 0);
	
	// merged canvas
	$('#imageDiv').append('<canvas id=\'resultlayer\' width=\'' + $('#backgroundlayer').width() + '\' height=\'' + $('#backgroundlayer').height() + '\' style="border:3px solid #000000; z-index:2"></canvas>');
	var resultlayer = document.getElementById("resultlayer");
	var resultctx = resultlayer.getContext("2d");
	resultctx.clearRect(0,0, $('#backgroundlayer').width(), $('#backgroundlayer').height());
	
	// compose layers
	resultctx.drawImage(backgroundlayer,0,0);
	resultctx.drawImage(subtractionlayer, 0, 0);
	
	$('#resultlayer').css({position: 'absolute'});
	$('#attentionmapArea').remove();
	$('#coverlayer').remove();
	$('#subtractionlayer').remove();
}

// visualize heatmap
function drawHeatmap(){

  $('#heatmapSettingsDiv').height($('#backgroundlayer').height());
	
  // remove gaze plot layer if present
	if($('#resultlayer').length > 0){
		$('#resultlayer').remove();
	}

	$('#imageDiv').append('<div id=\'heatmapArea\' />');
	
	$('#heatmapArea').width($('#backgroundlayer').width()).height($('#backgroundlayer').height());
	$('#heatmapArea').css("border", "3px solid #000000");
	
	// heatmap settings
	var radius = $('#heatmapRadius').val();
	var opacity = $('#heatmapOpacity').val();
	var countdefault;
	if($('#countSelect').find('option:selected').val() == "default")
		countdefault = true;
	else	
		countdefault = false;
	var c1 = $('#c1Color').css("background-color");
	var c2 = $('#c2Color').css("background-color");
	var c3 = $('#c3Color').css("background-color");
	
	var c1rgb = c1.match(/\d+/g);
	var c2rgb = c2.match(/\d+/g);
	var c3rgb = c3.match(/\d+/g);
	
	var c15 = "rgb(" + Math.min(c1rgb[0]+c2rgb[0], 255) + ", " + Math.min(c1rgb[1]+c2rgb[1], 255) + ", " + Math.min(c1rgb[2]+c2rgb[2], 255) + ")";
	var c25 = "rgb(" + Math.min(c2rgb[0]+c3rgb[0], 255) + ", " + Math.min(c2rgb[1]+c3rgb[1], 255) + ", " + Math.min(c2rgb[2]+c3rgb[2], 255) + ")";
		
	var config = {
		element: document.getElementById("heatmapArea"),
		radius:  radius,
		opacity: opacity,
		gradient: { 0.45: c1, 0.55: c15, 0.65: c2, 0.95: c25, 1.0: c3}
	};
	
	// heatmap creation
	var heatmap = h337.create(config);
	
  var scaleX = 1;
  var scaleY = 1;
  
  if(fitted){
    // scale gaze data coordinates
    scaleX = $('#backgroundlayer').width()  / $('#fileSelection').find('option:selected').attr('imgwidth');
    scaleY = $('#backgroundlayer').height() / $('#fileSelection').find('option:selected').attr('imgheight');
	}
  
	// pass data to heatmap
	for(var i = 0; i < unsorted_content.gazedata.length; i++){
		
		var x  = unsorted_content.gazedata[i].fx;
		var y  = unsorted_content.gazedata[i].fy;	
		var count;
		if(!countdefault){
			count = Math.round(unsorted_content.gazedata[i].gd / 100);
		}
		else if(countdefault){
			count = 1;
		}
    
		// add point to heatmap
		heatmap.store.addDataPoint(Math.round(x*scaleX), Math.round(y*scaleY), count);
	}
	
	// give heat map canvas an id
	$('#heatmapArea').children('canvas').eq(0).attr('id', 'heatmaplayer');
	
	// merged canvas
	$('#imageDiv').append('<canvas id=\'resultlayer\' width=\'' + $('#backgroundlayer').width() + '\' height=\'' + $('#backgroundlayer').height() + '\' style="border:3px solid #000000; z-index:2"></canvas>');
	var resultlayer = document.getElementById("resultlayer");
	var resultctx = resultlayer.getContext("2d");
	resultctx.clearRect(0,0, $('#backgroundlayer').width(), $('#backgroundlayer').height());

	var backgroundlayer = document.getElementById("backgroundlayer");
	var heatmaplayer = document.getElementById("heatmaplayer");
	
	resultctx.drawImage(backgroundlayer,0,0);
	resultctx.drawImage(heatmaplayer, 0, 0);
	
	$('#resultlayer').css({position: 'absolute'});
	$('#heatmapArea').remove();
}

// visualize gaze plot
function drawGazeplot(){
      
  $('#gazeplotSettingsDiv').height($('#backgroundlayer').height());

	// remove heatmap layer if present
	if($('#heatmapArea').length > 0){
		$('#heatmapArea').remove();
	}

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
	
  var scaleX = 1;
  var scaleY = 1;
  
  if(fitted){
    // scale gaze data coordinates
    scaleX = $('#backgroundlayer').width()  / $('#fileSelection').find('option:selected').attr('imgwidth');
    scaleY = $('#backgroundlayer').height() / $('#fileSelection').find('option:selected').attr('imgheight');
	}
  
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

// fit image to screen
var fitted = false;

function fitImageToScreen(){
  
  fitted = !(fitted);
  
  drawCanvas(g_imgSrc);
}

function drawCanvas(src){
	
	var w = $('#fileSelection').find('option:selected').attr('imgwidth');
	var h = $('#fileSelection').find('option:selected').attr('imgheight');

  var imgW = w;
  var imgH = h;
  
  // if fit to screen is selected
  if(fitted){
    // get correct canvas size
    var arr = scaleDimensions(w, h);	
    imgW = Math.floor(arr[0]);
    imgH = Math.floor(arr[1]);
  }
  
	// check whether canvas already exists
	if($('#backgroundlayer').length > 0){
		$('#backgroundlayer').remove();
	}
	// create canvas with correct dimensions
	$('#imageDiv').append('<canvas id=\'backgroundlayer\' width=\'' + imgW + '\' height=\'' + imgH + '\' style="border:3px solid #000000; z-index:1"></canvas>');
	var backgroundlayer = document.getElementById("backgroundlayer");
	var ctx1 = backgroundlayer.getContext("2d");
	ctx1.clearRect(0,0, imgW, imgH);

	$('#backgroundlayer').css({position: 'absolute'});
	$('#backgroundlayer').hide();
	
	// draw input image as background to canvas
	imageObj = new Image();
	imageObj.onload = function(){
  ctx1.drawImage(imageObj, 0, 0, imgW, imgH);
		
		// specific draw functions
		var value = $('#visSelect').val();
		
		// draw gazeplot on startup
		if(value == "gazeplot"){
		
			// register color picker for fixation circles
			registerColorpicker($('#fixColorpicker'), $('#fixationColor'));
			// register color picker for connecting lines
			registerColorpicker($('#lineColorpicker'), $('#lineColor'));
		
			drawGazeplot();
		}
    
		if(value == "heatmap"){
		
			// register color picker
			registerColorpicker($('#c1Colorpicker'), $('#c1Color'));
			registerColorpicker($('#c2Colorpicker'), $('#c2Color'));
			registerColorpicker($('#c3Colorpicker'), $('#c3Color'));
			
			// place color pickers
			$('#c1Colorpicker').css('margin-top', '30px').css('margin-left', '10px');
			$('#c2Colorpicker').css('margin-top', '30px').css('margin-left', '73px');
			$('#c3Colorpicker').css('margin-top', '30px').css('margin-left', '136px');
			
			drawHeatmap();
		}	
		
		if(value == "attentionmap"){

			// register color picker
			registerColorpicker($('#attColorpicker'), $('#attColor'));
			
			// place color picker
			$('#attColorpicker').css('margin-top', '30px').css('margin-left', '10px');
		
			drawAttentionmap();
		}
	}
	imageObj.src = src;
	
}

// predefined fixation colors
var color = [ '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#00ffff', '##ff8000', '#ff00ff', '#ffffff', '#ff0080', '#80ff00' ];
// save image source globally
var g_imgSrc;
// previous visualization to monitor changed visualization option
var oldvisualization;
// save content of gazedatafile, keep unsorted copy
var ctnt = [];
var unsorted_ctnt = [];
// default: colorpicker is not visible
var cp_visible = false;
// fit image to screen, default: false
var fitted = true;

$(document).ready(function(){
	
	// get available size for scailing of result image to fit it to screen
	windowwidth  = $(window).width();
	windowheight = $(window).height();
	
	headerheight = $('#header').height();
	borderwidth = $('#gazeplotSettingsDiv').width();
	
	receiveSelection();

  // default: check fit-to-screen checkbox 
  $('input[name=fitToScreen]').attr('checked', true);
});

// register color picker
// elem1: inner div element
// elem2: constantly visible element
function registerColorpicker(elem1, elem2, clr){
  
	elem1.ColorPicker({
		flat:true, 
		color: clr,
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

// scale data to available screen space
function scaleDimensions(width, height){

	//console.log("old dimensions: " + width + " x " + height);
		
	// scale image
	var ratio = 1.0;
	var maxWidth = windowwidth - borderwidth - 30;
	var maxHeight = windowheight - headerheight - 70;

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

// receive potential filecombinations for visualization 
function receiveSelection(){
	
	$.ajax({
		type: 'GET',
		url: 'temp/selectiondata.json',
		datatype: 'application/json',
		success: function(content){
					
			// add options to dropdown menu
			for(var i = 0; i < content.selectiondata.length; i++){
				n = content.selectiondata[i].name;
				$('#fileSelection').append($('<option></option>').val(n).html(n).attr("type", content.selectiondata[i].type).attr("count", content.selectiondata[i].count));
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
		
// get image and gaze data, execute drawCanvas() when data is completely loaded
function receiveCanvasContent(value){
  
  // compose filepath, save it globally
  var filepath = value + '.' + $('#fileSelection').find('option:selected').attr('type');
  g_imgSrc = filepath;
  
  // get gazedata via ajax call
  receiveGD(value);

  // draw result
  drawCanvas(filepath); 
}		

// get gaze data files from server which fit to the chosen image
function receiveGD(value){
  
  // number of suitable gazedatafiles 
  var idx = $('#fileSelection').find('option:selected').attr('count');

  for(var i = 0; i < idx; i++){
  
    var j = (i < 10 ? '0' : '');
    var s = value + "_" + j + parseInt(i+1);
    
    // get respective gazedatafile
    $.ajax({
      type: 'GET',
      url: 'temp/' + s + '_gazedata.json',
      datatype: 'application/json',
      // make async call to save data in the right array slot
      async: false,
      success: function(data){
        
        // save filecontent
        ctnt[i] = data; 
        unsorted_ctnt[i] = JSON.parse(JSON.stringify(data));
      
      },
      error: function(jqXHR, textStatus, errorThrown) {
        console.log("jq: " + JSON.stringify(jqXHR));
        console.log("textStatus: " + textStatus);
        console.log("errorThrown:" + errorThrown);
        console.log('failed to load gaze data');			
      }
    });
  }
}    

// open save dialog to save result on local hard drive
function saveResult(){
	
	// combine filename of visualization method and chosen file
	var filename = $('#visSelect').val() +  "_" + $('#fileSelection').val() + ".png";
	
	var canvas = document.getElementById('resultlayer');
	canvas.toBlob(function(blob){
    // save .png
		saveAs(blob, filename);
	});
}

// manage settings according to chosen visualization
function manageSettings(visualization){

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

// execute when other image is chosen
function fileChanged(){
  
  // default: fit result to screen
  $('input[name=fitToScreen]').attr('checked', true);
  fitted = true;
  
  // get filename
	var value = $('#fileSelection').val();
		
  // manage settings  
	if(value != "donothing"){
		
		receiveCanvasContent(value);
		$('#visTag').show();
		$('#visSelect').show();
		$('#saveButton').show();
    $('#fitToScreen').show();
    $('#ftsTag').show();
		
    // manage settings dialog
    manageSettings($('#visSelect').val());
	}
  
  // display choose dialog for available probands
  manageProbands($('#fileSelection').find('option:selected').attr('count'), true);
}

// execute when visualization method is changed
function visualizationChanged(){
  
  // get visualization style
	var visualization = $('#visSelect').val();
	
  // manage settings
	manageSettings(visualization);
    
  // on first execution or when visualization changes execute proband management 
  if((visualization != oldvisualization && typeof oldvisualization !== 'undefined')){
    manageProbands($('#fileSelection').find('option:selected').attr('count'), false);
  }
  
  oldvisualization = visualization;
  
	drawCanvas(g_imgSrc);
}

// visualize attentionmap
function drawAttentionmap(){

	// remove gaze plot layer if present
	if($('#resultlayer').length > 0){
		$('#resultlayer').remove();
	}
   
  var bglWidth  = $('#backgroundlayer').width();
  var bglHeight = $('#backgroundlayer').height(); 
   
  // append attentionmap 
  $('#imageDiv').append('<div id="attentionmapArea" />');
  $('#attentionmapArea').width(bglWidth).height(bglHeight);
  $('#attentionmapArea').css("border", "3px solid #000000"); 
  
  // color does not really matter, just chose anyone
  var color = "rgb(0, 0, 0)";	
      
  // get settings    
  var radius = $('#attentionmapRadius').val();
  var countdefault;
  if($('#attentionCountSelect').find('option:selected').val() == "default")
    countdefault = true;
  else	
    countdefault = false;
        
  // use heatmap to create the fixations, subtract it from a cover layer      
  // configure heatmap      
  var config = {
    "element": document.getElementById("attentionmapArea"),
    "radius":  radius,
    "opacity": 90,
    "gradient": { 0.45: color, 0.55: color, 0.65: color, 0.95: color, 1.0: color}
  };
      
  // heatmap creation
  var attentionmap = h337.create(config);
      
  var scaleX = 1;
  var scaleY = 1;
      
  if(fitted){
    // scale gaze data coordinates
    scaleX = bglWidth  / imageObj.width;
    scaleY = bglHeight / imageObj.height;
  }
  
  var idx = $('#fileSelection').find('option:selected').attr('count');
  
  // iterate over available probands, if selected by user add its gazedata to heatmap (accumulated attentionmap)
  for(var i = 0; i < idx; i++){
    if($('input[id=user' + parseInt(i+1) + ']').attr('checked')){
    
      // iterate over fixations of gazedatafile
      for(var j = 0; j < unsorted_ctnt[i].gazedata.length; j++){
      
        // get coordinates
        var x = unsorted_ctnt[i].gazedata[j].fx;
        var y = unsorted_ctnt[i].gazedata[j].fy;	
        // compute value
        var count;
        if(!countdefault){
          count = Math.round(unsorted_ctnt[i].gazedata[j].gd / 100);
        }
        else if(countdefault){
          count = 1;
        }
        
        // add fixationpoint to heatmap
        attentionmap.store.addDataPoint(Math.round(x*scaleX), Math.round(y*scaleY), count);
      }
    }  
  }

  // give attentionmap canvas an id
  $('#attentionmapArea').children('canvas').eq(0).attr('id', 'attentionmaplayer');
  
  var backgroundlayer = document.getElementById("backgroundlayer");
	var attentionmaplayer = document.getElementById("attentionmaplayer");
  
  // cover layer
  $('#imageDiv').append('<canvas id="coverlayer" width="' + bglWidth + '" height="' + bglHeight + '" style="border:3px solid #000000; z-index:2"></canvas>');
  var coverlayer = document.getElementById("coverlayer");
  var coverctx = coverlayer.getContext("2d");
  coverctx.clearRect(0,0, bglWidth, bglHeight);
  coverctx.fillStyle= $('#attColor').css("background-color");
  coverctx.fillRect(0, 0, bglWidth, bglHeight);
  
  // subtracting canvas: subtract heatmap from cover layer
  $('#imageDiv').append('<canvas id="subtractionlayer" width="' + bglWidth + '" height="' + bglHeight + '" style="border:3px solid #000000; z-index:2"></canvas>');
  var subtractionlayer = document.getElementById("subtractionlayer");
  var subtractionctx = subtractionlayer.getContext("2d");
  subtractionctx.clearRect(0,0, bglWidth, bglHeight);
  subtractionctx.globalAlpha = $('#attentionmapOpacity').val() / 100.0;
  subtractionctx.drawImage(coverlayer, 0, 0);
	subtractionctx.globalCompositeOperation = 'destination-out';
	subtractionctx.drawImage(attentionmaplayer, 0, 0);
  
  // merged canvas
	$('#imageDiv').append('<canvas id=\'resultlayer\' width=\'' + bglWidth + '\' height=\'' + bglHeight + '\' style="border:3px solid #000000; z-index:2"></canvas>');
	var resultlayer = document.getElementById("resultlayer");
	var resultctx = resultlayer.getContext("2d");
	resultctx.clearRect(0,0, bglWidth, bglHeight);
  
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
	
  // remove gaze plot layer if present
	if($('#resultlayer').length > 0){
		$('#resultlayer').remove();
	}

  var bglWidth  = $('#backgroundlayer').width();
  var bglHeight = $('#backgroundlayer').height();   

  // append heatmap
	$('#imageDiv').append('<div id=\'heatmapArea\' />');
	$('#heatmapArea').width(bglWidth).height(bglHeight);
	$('#heatmapArea').css("border", "3px solid #000000");
	
	// heatmap settings
	var radius = $('#heatmapRadius').val();
	var opacity = $('#heatmapOpacity').val();
	var countdefault;
	if($('#countSelect').find('option:selected').val() == "default")
		countdefault = true;
	else	
		countdefault = false;
    
  // compute color gradient  
  // 3 main colors selectable by user
	var c1 = $('#c1Color').css("background-color");
	var c2 = $('#c2Color').css("background-color");
	var c3 = $('#c3Color').css("background-color");
	
	var c1rgb = c1.match(/\d+/g);
	var c2rgb = c2.match(/\d+/g);
	var c3rgb = c3.match(/\d+/g);
	
  // compute shades
	var c15 = "rgb(" + Math.min(c1rgb[0]+c2rgb[0], 255) + ", " + Math.min(c1rgb[1]+c2rgb[1], 255) + ", " + Math.min(c1rgb[2]+c2rgb[2], 255) + ")";
	var c25 = "rgb(" + Math.min(c2rgb[0]+c3rgb[0], 255) + ", " + Math.min(c2rgb[1]+c3rgb[1], 255) + ", " + Math.min(c2rgb[2]+c3rgb[2], 255) + ")";
		
  // configure heatmap  
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
    scaleX = bglWidth  / imageObj.width;
    scaleY = bglHeight / imageObj.height;
	}
  
  var idx = $('#fileSelection').find('option:selected').attr('count');
  
	// iterate over available probands, if selected by user add its gazedata to heatmap (accumulated heatmap)
  for(var i = 0; i < idx; i++){
    if($('input[id=user' + parseInt(i+1) + ']').attr('checked')){
      
      // iterate over fixations of gazedatafile
      for(var j = 0; j < unsorted_ctnt[i].gazedata.length; j++){
      
        // get coordinates
        var x = unsorted_ctnt[i].gazedata[j].fx;
        var y = unsorted_ctnt[i].gazedata[j].fy;	
        // compute value
        var count;
        if(!countdefault){
          count = Math.round(unsorted_ctnt[i].gazedata[j].gd / 100);
        }
        else if(countdefault){
          count = 1;
        }
        
        // add fixationpoint to heatmap
        heatmap.store.addDataPoint(Math.round(x*scaleX), Math.round(y*scaleY), count);
      }
    }
  }  
	
	// give heat map canvas an id
	$('#heatmapArea').children('canvas').eq(0).attr('id', 'heatmaplayer');
	
	// merged canvas
	$('#imageDiv').append('<canvas id=\'resultlayer\' width=\'' + bglWidth + '\' height=\'' + bglHeight + '\' style="border:3px solid #000000; z-index:2"></canvas>');
	var resultlayer = document.getElementById("resultlayer");
	var resultctx = resultlayer.getContext("2d");
	resultctx.clearRect(0,0, bglWidth, bglHeight);

	var backgroundlayer = document.getElementById("backgroundlayer");
	var heatmaplayer = document.getElementById("heatmaplayer");
	
  // merge background and heatmap
	resultctx.drawImage(backgroundlayer,0,0);
	resultctx.drawImage(heatmaplayer, 0, 0);
	
	$('#resultlayer').css({position: 'absolute'});
	$('#heatmapArea').remove();
}

// visualize gaze plot
function drawGazeplot(){

	// remove heatmap layer if present
	if($('#heatmapArea').length > 0){
		$('#heatmapArea').remove();
	}

	// remove resultlayer
	if($('#resultlayer').length > 0){
		$('#resultlayer').remove();
	}
	
  var bglWidth  = $('#backgroundlayer').width();
  var bglHeight = $('#backgroundlayer').height();   
  
  var idx = $('#fileSelection').find('option:selected').attr('count');
  
  // draw seperate layers for each proband
  var connectionlayer = new Array(idx);
  var fixationlayer = new Array(idx);
  var enumlayer = new Array(idx);
  
  // iterate over probands if selected by user
  for(var i = 0; i < idx; i++){
    if($('input[id=user' + parseInt(i+1) + ']').attr('checked')){
  
      // init seperate canvas layers
      // connecting lines
      $('#imageDiv').append('<canvas id="connectionlayer' + parseInt(i+1) + '" width="' + bglWidth + '" height="' + bglHeight + '" style="border:3px solid #000000; z-index:' + parseInt(2+ i+1) + '"></canvas>');
      connectionlayer[i] = document.getElementById("connectionlayer" + parseInt(i+1));
      var connectionctx = connectionlayer[i].getContext("2d");      
      
      // get color for connecting lines between fixations from color picker - equal for all probands
      connectionctx.strokeStyle= $('#lineColor').css("background-color");
      connectionctx.lineWidth = 4;
      // get opacity - global
      connectionctx.globalAlpha = $('#opacityRange').val() / 100.0;
      connectionctx.clearRect(0,0, bglWidth, bglHeight);
      
      // fixation circles
      $('#imageDiv').append('<canvas id="fixationlayer' + parseInt(i+1) + '" width="' + bglWidth + '" height="' + bglHeight + '" style="border:3px solid #000000; z-index:' + parseInt(2+ i+1) + '"></canvas>');
      fixationlayer[i] = document.getElementById("fixationlayer" + parseInt(i+1));
      var fixationctx = fixationlayer[i].getContext("2d");
      
      // get fixationcolor from color picker - individual color for each proband
      fixationctx.fillStyle= $('#fixationColor'+parseInt(i+1)).css("background-color");
      fixationctx.lineWidth = 2;
      fixationctx.strokeStyle="black";
      // get opacity - equal for all probands
      fixationctx.globalAlpha = $('#opacityRange').val() / 100.0;
      fixationctx.clearRect(0,0, bglWidth, bglHeight);
      
      // enumeration of fixations
      $('#imageDiv').append('<canvas id="enumlayer' + parseInt(i+1) + '" width="' + bglWidth + '" height="' + bglHeight + '" style="border:3px solid #000000; z-index:' + parseInt(2+ i+1) + '"></canvas>');
      enumlayer[i] = document.getElementById("enumlayer" + parseInt(i+1));
      var enumctx = enumlayer[i].getContext("2d");
      enumctx.fillStyle = "black";
      enumctx.font = "bold 16px Arial";
      enumctx.textBaseline = "middle"; 
      enumctx.clearRect(0,0, bglWidth, bglHeight);
      
      var scaleX = 1;
      var scaleY = 1;
      
      if(fitted){
        // scale gaze data coordinates
        scaleX = bglWidth  / imageObj.width;
        scaleY = bglHeight / imageObj.height;
      }
      
      // sort gaze data based on duration from long to short
      ctnt[i].gazedata.sort(function(a,b){
        return (b.gd > a.gd) ? 1 : ((b.gd < a.gd) ? -1 : 0);
      });

      // iterate over sorted gazedata
      for(var j = 0; j < ctnt[i].gazedata.length; j++){
      
        // get index
        var index = ctnt[i].gazedata[j].fi;
        // get coordinates
        var x = ctnt[i].gazedata[j].fx;
        var y = ctnt[i].gazedata[j].fy;
        // get fixationduration
        var duration = ctnt[i].gazedata[j].gd;
        
        // draw connecting lines
        if(j > 0){
          line(connectionctx, unsorted_ctnt[i].gazedata[j-1].fx*scaleX, unsorted_ctnt[i].gazedata[j-1].fy*scaleY, unsorted_ctnt[i].gazedata[j].fx*scaleX, unsorted_ctnt[i].gazedata[j].fy*scaleY);
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
    }
  }  

	// merged canvas
	$('#imageDiv').append('<canvas id="resultlayer" width="' + bglWidth + '" height="' + bglHeight + '" style="border:3px solid #000000; z-index:2"></canvas>');
	var resultlayer = document.getElementById("resultlayer");
	var resultctx = resultlayer.getContext("2d");
	resultctx.clearRect(0,0, bglWidth, bglHeight);

	var backgroundlayer = document.getElementById("backgroundlayer");
	
  // draw background image to result
	resultctx.drawImage(backgroundlayer,0,0);
  
  // merge layers to result if selected
  for(var k = 0; k < idx; k++){
    if($('input[id=user' + parseInt(k+1) + ']').attr('checked')){
      if($('#showPath').attr('checked'))
        resultctx.drawImage(connectionlayer[k],0,0);  
      resultctx.drawImage(fixationlayer[k],0,0);
      if($('#showEnum').attr('checked'))
        resultctx.drawImage(enumlayer[k],0,0);	
      
      // remove layers since they are not necessary anymore
      $('#fixationlayer'+parseInt(k+1)).remove();
      $('#connectionlayer'+parseInt(k+1)).remove();
      $('#enumlayer'+parseInt(k+1)).remove();
    }
  }  
  
  $('#resultlayer').css({position: 'absolute'});
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

// add checkbox for every available gazedatafile
function manageProbands(count, first){

  // get checked probands if its not the first draw of an image - in this case select only proband 1
  if(!first){
    //var checkedProbands = new Array(count);
    var checkedProbands = [];
    for(var i = 0; i < count; i++){
      if($('input[id=user' + parseInt(i+1) + ']').attr('checked')){
        checkedProbands[i] = true;
      }  
      else
        checkedProbands[i] = false;
    }
  }

  var div = $('#multipleUserDiv');
  // clear div
  div.empty();

  // form div
  div.append('<strong>Blickdaten:</strong><br>');

  if(count < 1){
  
    alert('No gaze data available!');
    
  }
  else{
  
    var visualization = $('#visSelect').val();
          
    for(var i=0; i < count; i++){
    
      var id = "user" + (parseInt(i)+1);
      div.append('<input type="checkbox" id="' + id + '" onchange="visualizationChanged()"> Proband ' + parseInt(i+1));
      
      // append fixation color pickers
      if(visualization == "gazeplot"){
      
        $('#'+id).css('float', 'left').css('overflow', 'hidden');
        
        var fp = 'fixColorpicker'+parseInt(i+1);
        var fc = 'fixationColor'+parseInt(i+1);
          
        div.append('<div id="' + fc + '" style="background:' + color[i] + '; width:25px; height:25px; float:right; margin-right: 20px; z-index:5; border:2px solid #000000;" onclick="showColorpicker(' + fp + ')">');
        div.append('<div id="' + fp + '"/><br><br>');
      }	
      // no seperate colorpickers needed
      else if(visualization == "heatmap" || visualization == "attentionmap"){
        div.append('<br>');
      }
    } 
  }
  
  // preselect probands
  if(first)
    $('input[id=user1]').attr('checked', true);
  else{
    for(var i=0; i < count; i++){
      if(checkedProbands[i] && checkedProbands[i] != "2"){
        $('input[id=user' + parseInt(i+1) + ']').attr('checked', true);
      }  
    }
  }
  
  div.show();
}

// fit image to screen dimensions
function fitImageToScreen(){
  
  fitted = !(fitted);
  
  drawCanvas(g_imgSrc);
}

// prepare drawing of result
function drawCanvas(src){
  
	// check whether backgroundcanvas already exists
	if($('#backgroundlayer').length > 0){
		$('#backgroundlayer').remove();
	}
	
	// draw input image as background to canvas
	imageObj = new Image();
	imageObj.onload = function(){
    
    // get image dimensions
    var imgW = imageObj.width;
    var imgH = imageObj.height;
  
    // if fit to screen is selected
    if(fitted){
      // get scaled canvas size
      var arr = scaleDimensions(imgW, imgH);	
      imgW = Math.floor(arr[0]);
      imgH = Math.floor(arr[1]);
    }
  
    // create canvas with correct dimensions
    $('#imageDiv').append('<canvas id="backgroundlayer" width="' + imgW + '" height="' + imgH + '" style="border:3px solid #000000; z-index:1"></canvas>');
    var backgroundlayer = document.getElementById("backgroundlayer");
    var ctx1 = backgroundlayer.getContext("2d");
    ctx1.clearRect(0,0, imgW, imgH);
    
    $('#backgroundlayer').css({position: 'absolute'});
    $('#backgroundlayer').hide();
  
    // draw image to canvas
    ctx1.drawImage(imageObj, 0, 0, imgW, imgH);
    
    // configure animation
    prepareAnimation();
      
    // call specific draw functions
    var value = $('#visSelect').val();
      
    // handle different visualizations
    if(value == "gazeplot"){
      
      var idx = $('#fileSelection').find('option:selected').attr('count');
      
      // register color pickers for all probands
      for(i = 0; i < idx; i++){
      
        var fp = '#fixColorpicker'+parseInt(i+1);
        var fc = '#fixationColor'+parseInt(i+1);
        
        // register color picker for fixation circles
        registerColorpicker($(fp), $(fc), color[i]);
         
      }   
      
      // register color picker for connecting lines
      registerColorpicker($('#lineColorpicker'), $('#lineColor'), '#000000');
      
      drawGazeplot();
    }
      
    if(value == "heatmap"){
      
      // register color picker
      registerColorpicker($('#c1Colorpicker'), $('#c1Color'), '#0000ff');
      registerColorpicker($('#c2Colorpicker'), $('#c2Color'), '#00ff00');
      registerColorpicker($('#c3Colorpicker'), $('#c3Color'), '#ff0000');
        
      // place color pickers
      $('#c1Colorpicker').css('margin-top', '30px').css('margin-left', '10px');
      $('#c2Colorpicker').css('margin-top', '30px').css('margin-left', '73px');
      $('#c3Colorpicker').css('margin-top', '30px').css('margin-left', '136px');
        
      drawHeatmap();
    }	
      
    if(value == "attentionmap"){

      // register color picker
      registerColorpicker($('#attColorpicker'), $('#attColor'), '#000000');
        
      // place color picker
      $('#attColorpicker').css('margin-top', '30px').css('margin-left', '10px');
      
      drawAttentionmap();
    }
  }
  
  // set image source
	imageObj.src = 'data/' + src;
}

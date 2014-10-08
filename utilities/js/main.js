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
// fit image to screen, default: true
var fitted = true;
// draw backgroundimage new only if image changed
var filechanged = false;
var vischanged = false;
// no need to compute heatmap colors every frame
var colorchanged = true;
var gradients;

$(document).ready(function(){
	
	// get available size for scailing of result image to fit it to screen
	windowwidth  = $(window).width();
	windowheight = $(window).height();
	
	headerheight = $('#header').height();
	borderwidth = $('#gazeplotSettingsDiv').width();
  animationheight = 63;
	
  // get available files
	receiveSelection();
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
		
      colorchanged = true;
      
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
	elem1.css({'z-index':'99', position:'absolute'});
	elem1.hide();
}

// display color picker
function showColorpicker(elem){
  // prevent colorpicker from pop up while animation is running
  if(!runAnimation){
    if(cp_visible){
      $(elem).fadeOut(500);
    }	
    else{	
      $(elem).fadeIn(500);
    }	
    cp_visible = !cp_visible;
  }
}

// scale data to available screen space
function scaleDimensions(width, height){
		
	// scale image
	var ratio = 1.0;
	var maxWidth = windowwidth - borderwidth - 30;
	var maxHeight = windowheight - headerheight - animationheight - 32;

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
	
	return [width, height];
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
  
  // get gazedata via ajax call
  receiveGD(value);
  
  // compose filepath, save it globally
  var filepath = value + '.' + $('#fileSelection').find('option:selected').attr('type');
  g_imgSrc = filepath;

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
        // save copy
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

// open save dialog to save result image on local hard drive
function saveResult(){
	
	// combine filename of visualization method and chosen file
	var filename = $('#visSelect').val() +  "_" + $('#fileSelection').val() + ".png";
	
  var bglWidth  = $('#backgroundlayer').width();
  var bglHeight = $('#backgroundlayer').height();
  
  $('#imageDiv').append('<canvas id=\'savelayer\' width=\'' + bglWidth + '\' height=\'' + bglHeight + '\' style="border:3px solid #000000; z-index:2; display:none;"></canvas>');
	var canvas = document.getElementById('savelayer');
  var ctx = canvas.getContext("2d");
  
  // merge background and resultlayer
	ctx.drawImage(document.getElementById('backgroundlayer'), 0, 0);
	ctx.drawImage(document.getElementById("resultlayer"), 0, 0);
  
	canvas.toBlob(function(blob){
    // save .png
		saveAs(blob, filename);
	});
  
  $('#savelayer').remove();
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
  
  filechanged = true;
  
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
  
  vischanged = true;

	drawCanvas(g_imgSrc);
}

// compute color gradients
function computeColors(){
  
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
  
  return [c1, c15, c2, c25, c3];
}  

// visualize attentionmap
function drawAttentionmap(){

	// remove gaze plot layer if present
	if($('#resultlayer').length > 0){
		$('#resultlayer').remove();
	}
   
  // backgroundlayer dimensions 
  var bglWidth  = $('#backgroundlayer').width();
  var bglHeight = $('#backgroundlayer').height(); 
   
  // append attentionmap 
  $('#imageDiv').append('<div id="attentionmapArea" />');
  $('#attentionmapArea').width(bglWidth).height(bglHeight);
  $('#attentionmapArea').css("border", "3px solid #000000"); 
  
  // color does not really matter, just chose any
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
    "opacity": 100,
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
          // scale fixation with gaze duration
          count = Math.round(unsorted_ctnt[i].gazedata[j].gd / 100);
        }
        else if(countdefault){
          // uniform scale
          count = 1;
        }
        
        // add fixationpoint to heatmap
        attentionmap.store.addDataPoint(Math.round(x*scaleX), Math.round(y*scaleY), count);
      }
    }  
  }

  // give attentionmap canvas an id
  $('#attentionmapArea').children('canvas').eq(0).attr('id', 'attentionmaplayer');
  
	var attentionmaplayer = document.getElementById("attentionmaplayer");
  
  // cover layer
  $('#imageDiv').append('<canvas id="coverlayer" width="' + bglWidth + '" height="' + bglHeight + '" style="border:3px solid #000000; z-index:2"></canvas>');
  var coverlayer = document.getElementById("coverlayer");
  var coverctx = coverlayer.getContext("2d");
  coverctx.clearRect(0,0, bglWidth, bglHeight);
  coverctx.fillStyle= $('#attColor').css("background-color");
  coverctx.fillRect(0, 0, bglWidth, bglHeight);
  
  // subtracting canvas: subtract heatmap from cover layer
  $('#imageDiv').append('<canvas id="resultlayer" width="' + bglWidth + '" height="' + bglHeight + '" style="border:3px solid #000000; z-index:2"></canvas>');
  var resultlayer = document.getElementById("resultlayer");
  var resultctx = resultlayer.getContext("2d");
  resultctx.clearRect(0,0, bglWidth, bglHeight);
  resultctx.globalAlpha = $('#attentionmapOpacity').val() / 100.0;
  resultctx.drawImage(coverlayer, 0, 0);
	resultctx.globalCompositeOperation = 'destination-out';
	resultctx.drawImage(attentionmaplayer, 0, 0);
   
  $('#resultlayer').css({position: 'absolute'});
	$('#attentionmapArea').remove();
	$('#coverlayer').remove(); 
 
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
     
  if(colorchanged){
    gradients = computeColors();
    colorchanged = false;
  }  
		
  // configure heatmap  
	var config = {
		element: document.getElementById("heatmapArea"),
		radius:  radius,
		opacity: opacity,
		gradient: { 0.45: gradients[0], 0.55: gradients[1], 0.65: gradients[2], 0.95: gradients[3], 1.0: gradients[4]}
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
          // scale fixation with gaze duration
          count = Math.round(unsorted_ctnt[i].gazedata[j].gd / 100);
        }
        else if(countdefault){
          // uniform scale
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

	var heatmaplayer = document.getElementById("heatmaplayer");
	
  // merge background and heatmap
	resultctx.drawImage(heatmaplayer, 0, 0);
	
	$('#resultlayer').css({position: 'absolute'});
	$('#heatmapArea').remove();
}

// visualize gaze plot
function drawGazeplot(){
  
  var idx = $('#fileSelection').find('option:selected').attr('count');
  
  for(var i = 0; i < idx; i++){
    $('#fixationlayer'+parseInt(i+1)).remove();
    $('#connectionlayer'+parseInt(i+1)).remove();
    $('#enumlayer'+parseInt(i+1)).remove();
  }

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
  
  // draw seperate layers for each proband
  var connectionlayer = new Array(idx);
  var fixationlayer = new Array(idx);
  var enumlayer = new Array(idx);
  
  // get radius
  var radius = $('#radiusRange').val();
  
  // iterate over probands if selected by user
  for(var i = 0; i < idx; i++){
    if($('input[id=user' + parseInt(i+1) + ']').attr('checked')){
  
      var i_n = parseInt(i+1);
      
      // init seperate canvas layers
      // connecting lines
      $('#imageDiv').append('<canvas id="connectionlayer' + i_n + '" width="' + bglWidth + '" height="' + bglHeight + '" style="border:3px solid #000000; z-index:' + i + '"></canvas>');
      connectionlayer[i] = document.getElementById("connectionlayer" + i_n);
      var connectionctx = connectionlayer[i].getContext("2d");      
      // get color for connecting lines between fixations from color picker - equal for all probands
      connectionctx.strokeStyle= $('#lineColor').css("background-color");
      connectionctx.lineWidth = 4;
      connectionctx.clearRect(0,0, bglWidth, bglHeight);
      
      // fixation circles
      $('#imageDiv').append('<canvas id="fixationlayer' + i_n + '" width="' + bglWidth + '" height="' + bglHeight + '" style="border:3px solid #000000; z-index:' + i + '"></canvas>');
      fixationlayer[i] = document.getElementById("fixationlayer" + i_n);
      var fixationctx = fixationlayer[i].getContext("2d");
      // get fixationcolor from color picker - individual color for each proband
      fixationctx.fillStyle= $('#fixationColor'+ i_n).css("background-color");
      fixationctx.lineWidth = 2;
      fixationctx.strokeStyle="black";
      fixationctx.clearRect(0,0, bglWidth, bglHeight);
      
      // enumeration of fixations
      $('#imageDiv').append('<canvas id="enumlayer' + i_n + '" width="' + bglWidth + '" height="' + bglHeight + '" style="border:3px solid #000000; z-index:' + i + '"></canvas>');
      enumlayer[i] = document.getElementById("enumlayer" + i_n);
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
      
      // begin drawing lines
      connectionctx.beginPath();

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
          line(connectionctx, Math.round(unsorted_ctnt[i].gazedata[j-1].fx*scaleX), Math.round(unsorted_ctnt[i].gazedata[j-1].fy*scaleY), Math.round(unsorted_ctnt[i].gazedata[j].fx*scaleX), Math.round(unsorted_ctnt[i].gazedata[j].fy*scaleY)); 
        }
        
        // draw fixation circles
        if($('#radiusSelect').find('option:selected').val() == "duration"){
          var rad = radius / 1000 * duration;
        }
        else if($('#radiusSelect').find('option:selected').val() == "samesize"){
          var rad = radius;
        }
        
        circle(fixationctx, Math.round(x*scaleX), Math.round(y*scaleY), Math.round(rad));
        
        // print fixation index in the middle of the fixation circle
        var txtwidth = enumctx.measureText(index).width;
        enumctx.fillText(index, x*scaleX-(txtwidth/2), y*scaleY);
      }

      // finish line drawing
      connectionctx.stroke();
    }
  }  

	// merged canvas
	$('#imageDiv').append('<canvas id="resultlayer" width="' + bglWidth + '" height="' + bglHeight + '" style="border:3px solid #000000; z-index:2"></canvas>');
	var resultlayer = document.getElementById("resultlayer");
	var resultctx = resultlayer.getContext("2d");
	resultctx.clearRect(0,0, bglWidth, bglHeight);
  resultctx.globalAlpha = $('#opacityRange').val() / 100.0;;
  
  // merge layers to result if selected
  for(var k = 0; k < idx; k++){
    if($('input[id=user' + parseInt(k+1) + ']').attr('checked')){
    
      var k_n = parseInt(k+1);
      
      if($('#showPath').attr('checked'))
        resultctx.drawImage(connectionlayer[k],0,0);  
      resultctx.drawImage(fixationlayer[k],0,0);
      if($('#showEnum').attr('checked'))
        resultctx.drawImage(enumlayer[k],0,0);	
      
      // remove layers since they are not necessary anymore
      $('#fixationlayer' + k_n).remove();
      $('#connectionlayer' + k_n).remove();
      $('#enumlayer' + k_n).remove();
    }
  }  
  
  $('#resultlayer').css({position: 'absolute'});
}

// draw line from (sx,sy) to (ex, ey)
function line(ctx, sx, sy, ex, ey){

	ctx.moveTo(sx, sy);
	ctx.lineTo(ex, ey);
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
    var checkedProbands = [];
    for(var i = 0; i < count; i++){
      if($('input[id=user' + parseInt(i+1) + ']').attr('checked'))
        checkedProbands[i] = true;
      else
        checkedProbands[i] = false;
    }
  }

  var div = $('#multipleUserDiv');
  // clear div
  div.empty();

  // form div
  div.append('<h4>Blickdaten:</h4><br>');

  if(count < 1)
    alert('No gaze data available!');
  else{
    var visualization = $('#visSelect').val();
          
    for(var i=0; i < count; i++){
    
      var i_n = parseInt(i+1);
      
      // add checkboxes for probands
      var id = "user" + (parseInt(i)+1);
      div.append('<input type="checkbox" id="' + id + '" onchange="visualizationChanged()"> Proband ' + i_n);
      
      // append fixation color pickers
      if(visualization == "gazeplot"){
      
        $('#'+id).css('float', 'left').css('overflow', 'hidden');
        
        var fp = 'fixColorpicker'+i_n;
        var fc = 'fixationColor'+i_n;
          
        div.append('<div id="' + fc + '" style="background:' + color[i] + '; width:25px; height:25px; float:right; margin-right: 20px; z-index:5; border:2px solid #000000;" onclick="showColorpicker(' + fp + ')">');
        div.append('<div id="' + fp + '"/><br><br>');
        
        fp = '#fixColorpicker'+i_n;
        fc = '#fixationColor'+i_n;
        
        // register color picker for fixation circles
        registerColorpicker($(fp), $(fc), color[i]);
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
  $('#backgroundlayer').remove();
  
  // redraw
  drawCanvas(g_imgSrc);
}

// prepare drawing of result
function drawCanvas(src){
  
  // redraw animation
  var redraw = false;
  if(filechanged)
    redraw = true;
  
	// check whether backgroundcanvas needs to be redrawn
  if(filechanged || vischanged){
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
    
    $('#demo').height(imgH + 400);
    
    if($('#backgroundlayer').length == 0){
      // create canvas with correct dimensions
      $('#imageDiv').append('<canvas id="backgroundlayer" width="' + imgW + '" height="' + imgH + '" style="border:3px solid #000000; z-index:1"></canvas>');
      var backgroundlayer = document.getElementById("backgroundlayer");
      var ctx1 = backgroundlayer.getContext("2d");
      ctx1.clearRect(0,0, imgW, imgH);
      
      $('#backgroundlayer').css({position: 'absolute'});
    
      // draw image to canvas
      ctx1.drawImage(imageObj, 0, 0, imgW, imgH);
    }  
    
    // configure animation
    prepareAnimation(redraw);
      
    // call specific draw functions
    var value = $('#visSelect').val();
      
    // handle different visualizations
    if(value == "gazeplot"){
      
      // register color picker for connecting lines
      registerColorpicker($('#lineColorpicker'), $('#lineColor'), '#000000');
      
      // draw selected interval
      if(vischanged){
        var s = $('#slider-range').slider("values", 0);
        var e = $('#slider-range').slider("values", 1);
        drawGazeplotAnimation(e, s, e, true);
      }
      // draw complete gazepath
      else{      
        drawGazeplot();
      }  
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
        
      // draw selected interval
      if(vischanged){
        var s = $('#slider-range').slider("values", 0);
        var e = $('#slider-range').slider("values", 1);
        drawHeatmapAnimation(e, s, e, true);
      }
      // draw complete heatmap
      else{      
        drawHeatmap();
      }
    }	
      
    if(value == "attentionmap"){

      // register cover color picker
      registerColorpicker($('#attColorpicker'), $('#attColor'), '#000000');
        
      // place color picker
      $('#attColorpicker').css('margin-top', '30px').css('margin-left', '10px');
      
      // draw selected interval
      if(vischanged){
        var s = $('#slider-range').slider("values", 0);
        var e = $('#slider-range').slider("values", 1);
        drawAttentionmapAnimation(e, s, e, true);
      }
      // draw complete gazepath
      else{      
        drawAttentionmap();
      }
    }
    
    if(filechanged || vischanged){
      filechanged = false;
      vischanged = false;
    }
  }
  
  // set image source
	imageObj.src = 'data/' + src; 
}

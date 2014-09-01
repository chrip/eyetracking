// animation parameter
var startTime = 0;
var pauseTime = 0;
var continueTime = 0;
var slidertime = 0;
var timeDiff = 0;
var slidervalue = 0;
var start = true;
var slid = false;
// GIF encoder
var encoder;
var shots = [];
var grabLimit = 10;
var grabRate = 500;
var count = 0;

// animation is running
var runAnimation = false;
// animation is paused
var pauseAnimation = false;

// create canvas, buttons, slider, init animation
function prepareAnimation(){

  $('#animationDiv').empty();

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
  
  $('#animationDiv').append('<strong>Animation:\t</strong>');
  
  // create animation buttons
  $('#animationDiv').append('<input type="button" id="playButton" value="Play" onclick="play()">');
  $('#animationDiv').append('<input type="button" id="playButton" value="Pause" onclick="pause()">');
  $('#animationDiv').show();
  
  // create animation slider
  var lastElem = 0;
  for(i = 0; i < 2/*$('#fileSelection').find('option:selected').attr('count')*/; i++){
    var elem = unsorted_ctnt[i].gazedata[unsorted_ctnt[i].gazedata.length - 1].ft;
    if(elem > lastElem)
      lastElem = elem + 1;
  }
  
  var rangewidth = $('#backgroundlayer').width() * 0.66;
  $('#animationDiv').append('<input type="range" id="animationRange" min="0" max="' + lastElem + '" value="0" style="width:' + rangewidth + 'px" oninput="slideAnimation()" onchange="slideAnimation()" />');
  $('#animationDiv').width($('#backgroundlayer').width()+7);
 
  // show time
  $('#animationDiv').append('<strong id="time"></strong>');
  
  // set animation
  window.requestAnimFrame = (function(callback) {    
    return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
      function(callback) {
        window.setTimeout(callback, 1000 / 60);
      };
  })();
}

// prepare saving of animation
function prepareGIF(){

  encoder = new GIFEncoder();
  // loop forever
  encoder.setRepeat(0);
  encoder.setDelay(500);
  console.log(encoder.start());
}



// play button
function play(){
  runAnimation = true;
  animate();
}

// pause button
function pause(){
  if(runAnimation)
    pauseTime = (new Date).getTime() - startTime;
    
  runAnimation = false;
  pauseAnimation = true;
      
  // save slidervalue to start from right position
  slidervalue = $('#animationRange').val();
  
  slidertime = 0;
}

// silder functionality
function slideAnimation(){

  var time = $('#animationRange').val();
  
  slid = true;
  slidervalue = time;
  
  // display time
  $('#time').empty();
  $('#time').append(parseFloat(time/1000));
  
  var value = $('#visSelect').val();
  
  if(value == "gazeplot")
    drawGazeplotAnimation(time);
  if(value == "heatmap")
    drawHeatmapAnimation(time);
  if(value == "attentionmap")
    drawAttentionmapAnimation(time);
}

// do animation
function animate(){

  if(runAnimation){
   
    if(start){
      prepareGIF();
      startTime = (new Date()).getTime();
      start = false;
    }
    
    var time = (new Date()).getTime();
    
    if(pauseAnimation){    
      continueTime = time - startTime;
      pauseAnimation = false;
    }

    timeDiff = time - continueTime + pauseTime - startTime; 
    
    if(slid){
      slidertime = slidervalue - timeDiff;
      slid = false;
    } 
    
    timeDiff+= slidertime;
    
    // display time
    $('#time').empty();
    $('#time').append(parseFloat($('#animationRange').val()/1000));
    
    requestAnimFrame(
      function(){
        animate();
    });
    
    // timestamp debugging
    // console.log("pausetime " + pauseTime);
    // console.log("continuetime " + continueTime);
    // console.log("time " + (time-startTime));
    // console.log("timediff " + timeDiff);
    
    // move slider automatically
    $('#animationRange').val(timeDiff);
    
    // call animation
    var value = $('#visSelect').val();
    if(value == "gazeplot")
      drawGazeplotAnimation(timeDiff);
    if(value == "heatmap")
      drawHeatmapAnimation(timeDiff);
    if(value == "attentionmap")
      drawAttentionmapAnimation(timeDiff);
  }
}  

function drawGazeplotAnimation(time){
  
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

      // iterate over unsorted gazedata
      for(var j = 0; j < unsorted_ctnt[i].gazedata.length; j++){
        
        // get fixation timestamp
        var timestamp = unsorted_ctnt[i].gazedata[j].ft;
        if(timestamp < time){
        
          // get index
          var index = unsorted_ctnt[i].gazedata[j].fi;
          // get coordinates
          var x = unsorted_ctnt[i].gazedata[j].fx;
          var y = unsorted_ctnt[i].gazedata[j].fy;
          // get fixationduration
          var duration = unsorted_ctnt[i].gazedata[j].gd;
          
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
  
  encoder.addFrame(resultctx);
  console.log("draw frame");
  
  // stop animation at the end
  var max = $('#animationRange').prop("max");
  if(max <= time){
    runAnimation = false;
    start = true; 
    continueTime = 0;
    pauseTime = 0;
    slidertime = 0;
    
    // stop GIF creation
    console.log(encoder.finish());
    var binary_gif = encoder.stream().getData();
    data_url = 'data:image/gif;base64,'+encode64(binary_gif);
    console.log(data_url);

    
    //$('#animationDiv').append(data_url);
  }
}

// visualize heatmap
function drawHeatmapAnimation(time){
	
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
      
        // get fixation timestamp
        var timestamp = unsorted_ctnt[i].gazedata[j].ft;
        if(timestamp < time){
        
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
  
  // stop animation at the end
  var max = $('#animationRange').prop("max");
  if(max <= time){
    runAnimation = false;
    start = true; 
    continueTime = 0;
    pauseTime = 0;
    slidertime = 0;
  }
}

// visualize attentionmap
function drawAttentionmapAnimation(time){

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
      
        // get fixation timestamp
        var timestamp = unsorted_ctnt[i].gazedata[j].ft;
        if(timestamp < time){
       
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
 
  // stop animation at the end
  var max = $('#animationRange').prop("max");
  if(max <= time){
    runAnimation = false;
    start = true; 
    continueTime = 0;
    pauseTime = 0;
    slidertime = 0;
  } 
}
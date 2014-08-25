  // animation parameter
var startTime = 0;
var pauseTime = 0;
var continueTime = 0;
var slidertime = 0;
var timeDiff = 0;
var slidervalue = 0;
var start = true;
var slid = false;

// animation is running
var runAnimation = false;
// animation is paused
var pauseAnimation = false;

// create canvas, buttons, slider, init animation
function prepareAnimation(){

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
  
  $('#multipleUserDiv').append('<strong>Animation:</strong><br>');
  
  // create animation buttons
  $('#multipleUserDiv').append('<input type="button" id="playButton" value="Play" onclick="play()">');
  $('#multipleUserDiv').append('<input type="button" id="playButton" value="Pause" onclick="pause()">');
  
  // create animation slider
  var lastElem = 0;
  for(i = 0; i < 2/*$('#fileSelection').find('option:selected').attr('count')*/; i++){
    var elem = unsorted_ctnt[i].gazedata[unsorted_ctnt[i].gazedata.length - 1].ft;
    if(elem > lastElem)
      lastElem = elem + 1;
  }
  $('#multipleUserDiv').append('<input type="range" id="animationRange" min="0" max="' + lastElem + '" value="0" oninput="slideAnimation()" onchange="slideAnimation()" />');
  
  // set animation
  window.requestAnimFrame = (function(callback) {    
    return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
      function(callback) {
        window.setTimeout(callback, 1000 / 60);
      };
  })();
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
  
  var value = $('#visSelect').val();
  
  if(value == "gazeplot")
    drawGazeplotAnimation(time);
  if(value == "heatmap"){
    // TODO
    console.log("animate heatmap");
    runAnimation = false;
  }
  if(value == "attentionmap"){
    // TODO
    console.log("animate attentionmap");
    runAnimation = false;
  }
}

// do animation
function animate(){

  if(runAnimation){
   
    if(start){
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
    
    var value = $('#visSelect').val();
    
    if(value == "gazeplot")
      drawGazeplotAnimation(timeDiff);
    if(value == "heatmap"){
      // TODO
      console.log("animate heatmap");
      runAnimation = false;
    }
    if(value == "attentionmap"){
      // TODO
      console.log("animate attentionmap");
      runAnimation = false;
    }
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

      // iterate over sorted gazedata
      for(var j = 0; j < ctnt[i].gazedata.length; j++){
        
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
﻿// animation parameter
var startTime = 0;
var pauseTime = 0;
var continueTime = 0;
var slidertime = 0;
var timeDiff = 0;
var slidervalue = 0;
var start = true;
var slid = false;
var startvalue = 0;
var startAnimation = [];
var idx = 0;
var lastTime = 0;
var paused = false;
var clicks = [];

// animation is running
var runAnimation = false;
// animation is paused
var pauseAnimation = false;

var connectionlayer = [];
var fixationlayer = [];
var enumlayer = [];

// keep horizontal slider position
$(window).scroll(function(){
  $('#animationDiv').css('left',-$(window).scrollLeft()+$('#imageDiv').position().left+25);
  $('#timehandle').css('left',-$(window).scrollLeft()+$('#imageDiv').position().left+25);

});

// create canvas, buttons, slider, init animation
function prepareAnimation(redraw){

  // draw slider only once to keep intervalls
  var min = $('#slider-range').slider("option", "min");
  var max = $('#slider-range').slider("option", "max");
  if(min.length == 0 || max.length == 0 || redraw){
  
    $('#animationDiv').empty();
    
    $('#animationDiv').append('<strong>Animation:\t</strong>');
    
    // create animation buttons
    $('#animationDiv').append('<input type="button" id="playButton" value="Play" onclick="buttonFunc();">');
    $('#animationDiv').show();
    
    // create animation slider
    var lastElem = 0;
    for(i = 0; i < $('#fileSelection').find('option:selected').attr('count'); i++){
      var elem = unsorted_ctnt[i].gazedata[unsorted_ctnt[i].gazedata.length - 1].ft + unsorted_ctnt[i].gazedata[unsorted_ctnt[i].gazedata.length - 1].gd;
      if(elem > lastElem)
        lastElem = elem + 1;
    }
 
    $('#animationDiv').append('<div id="slider-range"/>');
    
    addSlider($('#slider-range'), 0, lastElem, 0, lastElem);
  
    $('#animationDiv').width(600);
 
    // show time
    $('#animationDiv').append('<strong id="time">Zeit: </strong>');
    
    $('#animationDiv').append('<div id="timehandle"/>');
    
    // set animation
    window.requestAnimFrame = (function(callback) {    
      return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
        function(callback) {
          window.setTimeout(callback, 1000 / 60);
        };
    })();
  }
  
  idx = $('#fileSelection').find('option:selected').attr('count');
  for(var i = 0; i < idx; i++){
    startAnimation[i] = true;
  }  
  
  
  $('#slider-range').children('span').eq(0).attr('id', 'firsthandle');
  $('#timehandle').css("left", parseInt($('#firsthandle').css("left")) + parseInt($('#animationDiv').css("left")));
}

// init jquery ui slider
function addSlider(element, min, max, v1, v2){
    $(element).slider({
    range: true,
      min: min,
      max: max,
      values: [v1, v2],
      slide: function(event, ui){
        slideAnimation();
      }  
    });

}  

// play button
function play(){
     
  $('#playButton').prop('value', "Pause"); 

  runAnimation = true;
  for(var i = 0; i < idx; i++){
    startAnimation[i] = true;
  }  
  startvalue = $('#slider-range').slider("values", 0);
  if(startvalue != 0)
    slid = true;
    startchanged = true;
  
  animate();
}

// pause button
function pause(){

  $('#playButton').prop('value', "Play");
      
  if(runAnimation)
    pauseTime = (new Date).getTime() - startTime;
    
  runAnimation = false;
  pauseAnimation = true;
  paused = true;
      
  // save slidervalue to start from right position
  slidervalue = $('#slider-range').slider("values", 0);
  slidervalue = timeDiff;
  
  slidertime = 0;
}

// wrap button functionality
function buttonFunc(){

  if($('#playButton').val() == "Play"){
    play();
  }
  else if($('#playButton').val() == "Pause"){ 
    pause();
  }
}

// silder functionality
function slideAnimation(){

  var time = $('#slider-range').slider("values", 0);
  
  slid = true;
  slidervalue = time;
  
  for(var i = 0; i < idx; i++){
    startAnimation[i] = true;
  }
  
  var startT = $('#slider-range').slider("values", 0);
  var endT   = $('#slider-range').slider("values", 1);
  
  // display time
  $('#time').empty();
  $('#time').append("Zeit : " + parseFloat(time/1000));
  
  // reposition time element
  $('#timehandle').css("left", parseInt($('#firsthandle').css("left")) + parseInt($('#animationDiv').css("left")));
  
  var value = $('#visSelect').val();
  
  if(value == "gazeplot")
    drawGazeplotAnimation(time, startT, endT, true);
  if(value == "heatmap")
    drawHeatmapAnimation(time, startT, endT, true);
  if(value == "attentionmap")
    drawAttentionmapAnimation(time, startT, endT, true);
}

// do animation
function animate(){

  if(runAnimation){
   
    if(start){
      startTime = (new Date()).getTime();
      start = false;
      prepareClick();
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
      prepareClick();
    }  
    
    timeDiff+= slidertime;
    
    // display time
    $('#time').empty();
    $('#time').append("Zeit: " + parseFloat(timeDiff/1000));
        
    // move time element
    var pos = timeDiff / $('#slider-range').slider("option", "max") * $('#animationDiv').width();
    if(pos >= $('#animationDiv').width())
      pos = $('#animationDiv').width();
    pos+= parseInt($('#animationDiv').css("left"));
    $('#timehandle').css("left", pos);
    
    requestAnimFrame(
      function(){
        animate();
    });
    
    // timestamp debugging
    // console.log("pausetime " + pauseTime);
    // console.log("continuetime " + continueTime);
    // console.log("time " + (time-startTime));
    // console.log("timediff " + timeDiff);
       
    var startT = $('#slider-range').slider("values", 0);
    var endT   = $('#slider-range').slider("values", 1);
    
    // call animation
    drawClick(timeDiff);  
    
    var value = $('#visSelect').val();
    if(value == "gazeplot")
      drawGazeplotAnimation(timeDiff, startT, endT, false);
    if(value == "heatmap")
      drawHeatmapAnimation(timeDiff, startT, endT, false);
    if(value == "attentionmap")
      drawAttentionmapAnimation(timeDiff, startT, endT, false);
      
    // disable options while playing animation
    $(".settingsDiv :input").attr('disabled', true);
    $("#multipleUserDiv :input").attr('disabled', true);
    $('#slider-range').slider({disabled: true});
  }
  if(!runAnimation){
    // enable options while not playing animation
    $(".settingsDiv :input").attr('disabled', false);
    $("#multipleUserDiv :input").attr('disabled', false);
    $('#slider-range').slider({disabled: false});
  }  
}  

// stop animation
function stopAnimation(time){
  var max = $('#slider-range').slider("option", "max");
  var slidermax = $('#slider-range').slider("values", 1);
  max = Math.min(max, slidermax);
  if(max <= time){
    runAnimation = false;
    start = true; 
    continueTime = 0;
    pauseTime = 0;
    slidertime = 0;
    $('#playButton').prop("value", "Play");
    lastTime = 0;
    slidervalue = $('#slider-range').slider("values", 0);
  }
}

function prepareClick(){

  var bglWidth  = Math.round($('#backgroundlayer').width());
  var bglHeight = Math.round($('#backgroundlayer').height());
  var clicklayer = new Array(idx);
  
  for(var i = 0; i < idx; i++){
    if($('input[id=user' + parseInt(i+1) + ']').attr('checked')){
    
        var i_n = parseInt(i+1);
        
        $('#clicklayer'+i_n).remove();
        
        $('#imageDiv').append('<canvas id="clicklayer' + i_n + '" width="' + bglWidth + '" height="' + bglHeight + '" style="border:3px solid #000000; z-index:1; position:absolute"></canvas>');
        clicklayer[i] = document.getElementById("clicklayer" + i_n);
        var clickctx = clicklayer[i].getContext("2d");      
        clickctx.clearRect(0,0, bglWidth, bglHeight);
        
    }    
  }    
}      

function drawClick(time){

  var clicklayer = new Array(idx);
  var bglWidth  = Math.round($('#backgroundlayer').width());
  
  for(var i = 0; i < idx; i++){
    if($('input[id=user' + parseInt(i+1) + ']').attr('checked')){
    
        var i_n = parseInt(i+1);
            
        // iterate over clicks
        for(var j = 0; j < clicks[i].timestamps.length; j++){
          
          // get timestamp
          var lt = clicks[i].timestamps[j].lt;
          // get coordinates
          var lx = clicks[i].timestamps[j].lx;
          var ly = clicks[i].timestamps[j].ly;

          //scaling
          if(bglWidth != imageObj.width){
            var factor = parseFloat(bglWidth / imageObj.width);
            lx *= factor;
            ly *= factor;
          }
            
          //var i_n = parseInt(i+1);
          clicklayer[i] = document.getElementById("clicklayer" + i_n);
          var clickctx = clicklayer[i].getContext("2d"); 
          clickctx.fillStyle= "yellow";
          clickctx.lineWidth = 2;
          clickctx.strokeStyle="black";
          
          if(lt <= time)
            circle(clickctx, lx, ly, 20);
        }
       
    }
  }
}

function canvasClick(event){
  var layer = document.getElementById("resultlayer");
    var bglWidth  = Math.round($('#backgroundlayer').width());
    var r =20;
  // iterate over clicks
  for(var i = 0; i < idx; i++){
    if($('input[id=user' + parseInt(i+1) + ']').attr('checked')){
      for(var j = 0; j < clicks[i].timestamps.length; j++){

        var x = event.pageX - $('#imageDiv').position().left - 200;
        var y = event.pageY - $('#imageDiv').position().top;
              
        // get timestamp
        var lt = clicks[i].timestamps[j].lt;
        // get coordinates
        var lx = clicks[i].timestamps[j].lx;
        var ly = clicks[i].timestamps[j].ly;

        //scaling
        if(bglWidth != imageObj.width){
          var factor = parseFloat(bglWidth / imageObj.width);
          lx *= factor;
          ly *= factor;
        }
                        
        if(y > ly - r && y < ly + r && x > lx - r && x < lx + r)
          changeImage();
      }
    }
  }
}    

function changeImage(){
  console.log("link clicked");
  
  filechanged = true;
  drawCanvas('WEST-staff2.jpg');

}

function drawGazeplotAnimation(time, startT, endT, display){
  
	// remove heatmap layer if present
	if($('#heatmapArea').length > 0){
		$('#heatmapArea').remove();
	}

	// remove resultlayer
	if($('#resultlayer').length > 0){
		$('#resultlayer').remove();
	}
	
  var bglWidth  = Math.round($('#backgroundlayer').width());
  var bglHeight = Math.round($('#backgroundlayer').height());
  
  // get radius
  var radius = $('#radiusRange').val();
  
  // iterate over probands if selected by user
  for(var i = 0; i < idx; i++){
    if($('input[id=user' + parseInt(i+1) + ']').attr('checked')){
    
      if(startAnimation[i]){
        
        var i_n = parseInt(i+1);
        
        $('#fixationlayer'+i_n).remove();
        $('#connectionlayer'+i_n).remove();
        $('#enumlayer'+i_n).remove();
      
        // init seperate canvas layers
        // connecting lines
        $('#imageDiv').append('<canvas id="connectionlayer' + i_n + '" width="' + bglWidth + '" height="' + bglHeight + '" style="border:3px solid #000000; z-index:' + i + '; display:none"></canvas>');
        connectionlayer[i] = document.getElementById("connectionlayer" + i_n);
        var connectionctx = connectionlayer[i].getContext("2d");      
        // get color for connecting lines between fixations from color picker - equal for all probands
        connectionctx.strokeStyle= $('#lineColor').css("background-color");
        connectionctx.lineWidth = 4;
        connectionctx.clearRect(0,0, bglWidth, bglHeight);
        
        // fixation circles
        $('#imageDiv').append('<canvas id="fixationlayer' + i_n + '" width="' + bglWidth + '" height="' + bglHeight + '" style="border:3px solid #000000; z-index:' + i + '; display:none"></canvas>');
        fixationlayer[i] = document.getElementById("fixationlayer" + i_n);
        var fixationctx = fixationlayer[i].getContext("2d");
        // get fixationcolor from color picker - individual color for each proband
        fixationctx.fillStyle= $('#fixationColor'+parseInt(i+1)).css("background-color");
        fixationctx.lineWidth = 2;
        fixationctx.strokeStyle="black";
        fixationctx.clearRect(0,0, bglWidth, bglHeight);
        
        // enumeration of fixations
        $('#imageDiv').append('<canvas id="enumlayer' + i_n + '" width="' + bglWidth + '" height="' + bglHeight + '" style="border:3px solid #000000; z-index:' + i + '; display:none"></canvas>');
        enumlayer[i] = document.getElementById("enumlayer" + i_n);
        var enumctx = enumlayer[i].getContext("2d");
        enumctx.fillStyle = "black";
        enumctx.font = "bold 16px Arial";
        enumctx.textBaseline = "middle"; 
        enumctx.clearRect(0,0, bglWidth, bglHeight);
        
        startAnimation[i] = false;
        
      }
      
      var scaleX = 1;
      var scaleY = 1;
      
      if(fitted){
        // scale gaze data coordinates
        scaleX = bglWidth  / imageObj.width;
        scaleY = bglHeight / imageObj.height;
      }

      // display fixations while moving sliders
      if(display)
        time = endT;
        
      // organize line drawing  
      var t = true;  
      var startIndex = 1;
      var firstIndex = unsorted_ctnt[i].gazedata[0].fi;
      
      // begin drawing lines
      connectionlayer[i] = document.getElementById("connectionlayer" + parseInt(i+1));
      connectionctx = connectionlayer[i].getContext("2d");
      connectionctx.beginPath();
      
      fixationlayer[i] = document.getElementById("fixationlayer" + parseInt(i+1));
      fixationctx = fixationlayer[i].getContext("2d");
      
      enumlayer[i] = document.getElementById("enumlayer" + parseInt(i+1));
      enumctx = enumlayer[i].getContext("2d");
        
      // iterate over unsorted gazedata
      for(var j = 0; j < unsorted_ctnt[i].gazedata.length; j++){
        
        // get fixation timestamp
        var timestamp = unsorted_ctnt[i].gazedata[j].ft;
        
        if(timestamp <= time && startT <= timestamp){ 
          
          // get index
          var index = unsorted_ctnt[i].gazedata[j].fi;
          // get coordinates
          var x = unsorted_ctnt[i].gazedata[j].fx;
          var y = unsorted_ctnt[i].gazedata[j].fy;
          // get fixationduration
          var duration = unsorted_ctnt[i].gazedata[j].gd; 
          
         if(t){
            startIndex = index;
            t = false;
          }
          
          // draw only diff
          if(timestamp+duration < lastTime && !display && !paused)
            continue;          
          
          // draw connecting lines
          if(j > startIndex-firstIndex){
            line(connectionctx, Math.round(unsorted_ctnt[i].gazedata[j-1].fx*scaleX), Math.round(unsorted_ctnt[i].gazedata[j-1].fy*scaleY), Math.round(x*scaleX), Math.round(y*scaleY)); 
          }
                   
          // draw fixation circles
          if($('#radiusSelect').find('option:selected').val() == "duration"){
            var rad = radius / 1000 * duration;
            var factor = (time - timestamp) / duration;
            if(factor > 1)
              factor = 1;
            rad *=factor;
          }
          else if($('#radiusSelect').find('option:selected').val() == "samesize"){
            var rad = radius;
            var factor = (time - timestamp) / duration;
            if(factor > 1)
              factor = 1;
            rad *=factor;
          }
          
          circle(fixationctx, Math.round(x*scaleX), Math.round(y*scaleY), Math.round(rad));
          
          // print fixation index in the middle of the fixation circle
          var txtwidth = enumctx.measureText(index).width;
          enumctx.fillText(index, x*scaleX-(txtwidth/2), y*scaleY);
          
          lastTime = time;
        }  
      }

      // finish lines
      connectionctx.stroke();
    }
  }  

	// merged canvas
	$('#imageDiv').append('<canvas id="resultlayer" width="' + bglWidth + '" height="' + bglHeight + '" style="border:3px solid #000000; z-index:2"></canvas>');
	var resultlayer = document.getElementById("resultlayer");
	var resultctx = resultlayer.getContext("2d");
	resultctx.clearRect(0,0, bglWidth, bglHeight);
  
  // merge layers to result if selected
  for(var k = 0; k < idx; k++){
    if($('input[id=user' + parseInt(k+1) + ']').attr('checked')){
      
      if($('#showPath').attr('checked'))
        resultctx.drawImage(connectionlayer[k],0,0);  
      resultctx.drawImage(fixationlayer[k],0,0);
      if($('#showEnum').attr('checked'))
        resultctx.drawImage(enumlayer[k],0,0);	
    }
  }  
  
  $('#resultlayer').css({position: 'absolute'});  
      
  $('#resultlayer').bind('click', canvasClick);
  
  
  // stop animation
  stopAnimation(time);
      
}
  
// visualize heatmap
function drawHeatmapAnimation(time, startT, endT, display){
	
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
  
  // display fixations while moving silder
  if(display)
    time = endT;
  
	// iterate over available probands, if selected by user add its gazedata to heatmap (accumulated heatmap)
  for(var i = 0; i < idx; i++){
    if($('input[id=user' + parseInt(i+1) + ']').attr('checked')){
      
      // iterate over fixations of gazedatafile
      for(var j = 0; j < unsorted_ctnt[i].gazedata.length; j++){
      
        // get fixation timestamp
        var timestamp = unsorted_ctnt[i].gazedata[j].ft;
        if(timestamp <= time && startT <= timestamp){
        
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

	var heatmaplayer = document.getElementById("heatmaplayer");
	
	resultctx.drawImage(heatmaplayer, 0, 0);
	
	$('#resultlayer').css({position: 'absolute'});
	$('#heatmapArea').remove();
  
  // stop animation
  stopAnimation(time);
}

// visualize attentionmap
function drawAttentionmapAnimation(time, startT, endT, display){

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
  
  // display fixations while moving sliders
  if(display)
    time = endT;
  
  // iterate over available probands, if selected by user add its gazedata to heatmap (accumulated attentionmap)
  for(var i = 0; i < idx; i++){
    if($('input[id=user' + parseInt(i+1) + ']').attr('checked')){
    
      // iterate over fixations of gazedatafile
      for(var j = 0; j < unsorted_ctnt[i].gazedata.length; j++){
      
        // get fixation timestamp
        var timestamp = unsorted_ctnt[i].gazedata[j].ft;
        if(timestamp < time && startT <= timestamp){
       
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
 
  // stop animation
  stopAnimation(time);
}
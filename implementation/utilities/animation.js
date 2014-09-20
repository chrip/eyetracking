// animation parameter
var startTime = 0;
var pauseTime = 0;
var continueTime = 0;
var slidertime = 0;
var timeDiff = 0;
var slidervalue = 0;
var start = true;
var slid = false;
var startvalue = 0;

// animation is running
var runAnimation = false;
// animation is paused
var pauseAnimation = false;

// keep horizontal slider position
$(window).scroll(function(){
  $('#animationDiv').css('left',-$(window).scrollLeft()+208);
  $('#timehandle').css('left',-$(window).scrollLeft()+208);
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
    
    $('#animationDiv').append('<div id="timehandle" style="width:3px; height:18px; background-color:black; z-index:10; position:fixed; bottom:20px; left:208px" />');
    
    // set animation
    window.requestAnimFrame = (function(callback) {    
      return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
        function(callback) {
          window.setTimeout(callback, 1000 / 60);
        };
    })();
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
      
  // save slidervalue to start from right position
  slidervalue = $('#slider-range').slider("values", 0);
  
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
    var value = $('#visSelect').val();
    if(value == "gazeplot")
      drawGazeplotAnimation(timeDiff, startT, endT, false);
    if(value == "heatmap")
      drawHeatmapAnimation(timeDiff, startT, endT, false);
    if(value == "attentionmap")
      drawAttentionmapAnimation(timeDiff, startT, endT, false);
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
  }
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
	
  var bglWidth  = $('#backgroundlayer').width();
  var bglHeight = $('#backgroundlayer').height();   
  
  var idx = $('#fileSelection').find('option:selected').attr('count');
  
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
      fixationctx.fillStyle= $('#fixationColor'+parseInt(i+1)).css("background-color");
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

      // display fixations while moving sliders
      if(display)
        time = endT;
        
      // organize line drawing  
      var t = true;  
      var startIndex = 1;
      var firstIndex = unsorted_ctnt[i].gazedata[0].fi;
        
      // iterate over unsorted gazedata
      for(var j = 0; j < unsorted_ctnt[i].gazedata.length; j++){
        
        // get fixation timestamp
        var timestamp = unsorted_ctnt[i].gazedata[j].ft;
        if(timestamp <= time && startT <= timestamp){
        
          if(t){
            startIndex = unsorted_ctnt[i].gazedata[j].fi;
            t = false;
          }            
        
          // get index
          var index = unsorted_ctnt[i].gazedata[j].fi;
          // get coordinates
          var x = unsorted_ctnt[i].gazedata[j].fx;
          var y = unsorted_ctnt[i].gazedata[j].fy;
          // get fixationduration
          var duration = unsorted_ctnt[i].gazedata[j].gd;
  
          // draw connecting lines
          if(j > startIndex-firstIndex){
            line(connectionctx, unsorted_ctnt[i].gazedata[j-1].fx*scaleX, unsorted_ctnt[i].gazedata[j-1].fy*scaleY, unsorted_ctnt[i].gazedata[j].fx*scaleX, unsorted_ctnt[i].gazedata[j].fy*scaleY);
          }
          
          // draw fixation circles
          if($('#radiusSelect').find('option:selected').val() == "duration"){
            var rad = radius / 1000 * duration;
            var factor = (time - timestamp) / duration;
            if(factor > 1)
              factor = 1;
            rad *=factor;
          }
          circle(fixationctx, x*scaleX, y*scaleY, rad);
          
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
      $('#fixationlayer'+k_n).remove();
      $('#connectionlayer'+k_n).remove();
      $('#enumlayer'+k_n).remove();
    }
  }  
  
  $('#resultlayer').css({position: 'absolute'});  
  
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
  
  var idx = $('#fileSelection').find('option:selected').attr('count');
  
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
        
  var idx = $('#fileSelection').find('option:selected').attr('count');
  
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
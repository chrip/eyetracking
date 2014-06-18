
var categories = {"11": "Idea, wish<br/>Bring ideas and wishes", "10": "pests<br/>Rats, mice, other pests", "13": "Clogged drains<br/>Clogged or sagging sewer stench, etc", "12": "Nuisance trees<br/>Overhanging branches, leaves on the road", "15": "fireworks Vandalism<br/>Damage caused by fireworks", "14": "remaining<br/>Reporting other problems", "17": "Bicycle and car wrecks<br/>Annoying placed vehicles", "16": "Unsafe traffic situation<br/>Traffic signs, traffic lights, etc.", "19": "full container<br/>Solid waste containers and bins", "18": "oil leakage<br/>Discharge of undesirable substances", "22": "Nuisance parking<br/>Annoying placed vehicles", "1": "Litter on the street<br/>Loose debris and rubbish on the street", "3": "loose paving stone<br/>Sagging or loose paving stone, subsidence, etc", "2": "dogshit<br/>Dog shit on the street", "5": "weed<br/>Weeds on pavement, in grass, etc.", "4": "bad roads<br/>Holes, cracks, lines, etc", "7": "Graffiti & coverings shall<br/>Illegally painted graffiti, poorly removed Stick", "6": "broken streetlights<br/>Broken lampposts", "9": "broken playset<br/>Defective or unsafe playground equipment", "20": "Oak Processionary<br/>Nuisance by hairy caterpillars", "21": "smoothness<br/>Unsafe situations by smoothness"};

var markers;
var map;

function getImgTag(row) {
  if(row['bijlage_id']){
    src = row['melding_datumtijd'].substring(6,7);
    src += "/" + row['melding_id'] + "/" + row['melding_id'] + "_" + row['bijlage_id'] + '.jpg';
    return '<div style="display:block;width:250"><img src="pics/' + src + '" width="250" /></div>';
  }
  else {
    return "No photo attached";
  }
}


function updateMap() {

  markers.clearLayers();

  $.ajax({
    url: "http://localhost:8080/",
    type: 'POST',
    dataType: 'json',
    data: {box: map.getBounds().toBBoxString(), cats: getCheckedCats()},
    success: function(data, status){
      for(var row in data.meldings){
        
        pos = data.meldings[row].melding_position.substring(1,data.meldings[row].melding_position.length-1).split(',');
        var m = L.marker([+pos[1],+pos[0]]).bindPopup("<b>"
                          + categories[data.meldings[row].hoofdcategorie_code] 
                          + "</b><br>" + data.meldings[row].melding_created 
                          + "<br>" + data.meldings[row].melding_omschrijving 
                          + "<br>" + getImgTag(data.meldings[row]),
                          {minWidth:250} );
        markers.addLayer(m);
      }
      for(var row in data.stats){
        $("#sum" + data.stats[row].hoofdcategorie_code).text(data.stats[row].count);
      }

    },
    error: function(a,c) { alert("ajax: " + c);}
  });
}

function getCheckedCats(){
  var result = [];
  $("input.cat").each(function( i ) {
    if($(this).prop("checked")) {
      result.push(this.id.substring(3)); 
    }
  });
  return result;
}

function clusteringOnOff() {
  map.removeLayer(markers);
  delete markers;
  if($("#cOnOff").prop("checked")) {
    markers = new L.MarkerClusterGroup();
  }
  else {
    markers = new L.layerGroup();
  }
  updateMap();
  markers.addTo(map);
}


function initilize(){
	map = L.map('map').setView([52.0376732, 5.1837924], 15);

  // var markers = L.layerGroup();
  markers = new L.MarkerClusterGroup();


	L.tileLayer('http://{s}.tile.cloudmade.com/BC9A493B41014CAABB98F0471D759707/997/256/{z}/{x}/{y}.png', {
		maxZoom: 18,
		attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>'
	}).addTo(map);

  // add a viewreset event listener for updating popups
  map.on('dragend', this.updateMap, this);
  // map.on('zoomend', this.updateMap, this);
  markers.addTo(map);


  //****************** categories ****************************
  $("#cat").html('<table id="catTable"><tr><th><input type="checkbox" id="checkall"/></th><th>Description</th><th>Sum</th></tr></table>');

  $("#checkall").click(function(){ $("input.cat").prop("checked", $("#checkall").prop('checked')); });

  for(var cat in categories) {
    $("#catTable tr:last").after('<tr><td><input class="cat" type="checkbox" id="cat' + cat +'"/></td><td title="'+categories[cat].split('<br/>')[1]+'">' + categories[cat].split('<br/>')[0] + '</td><td style="text-align:right;" id="sum'+cat+'">0</td></tr>');
  }
  $("#cat input").prop("checked", true);

  //****************** clustering ****************************
  $("#clusteringOnOff").html('<input id="cOnOff"  type="checkbox" />&nbsp;Clustering ON');

  $("#cOnOff").prop("checked", true).click(function() { clusteringOnOff(); });

  updateMap();
}


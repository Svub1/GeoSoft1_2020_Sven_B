
/**
 * @author Sven Busemann <s_buse01@uni-muenster.de>
 */

getserverdata();

//Karte wird erstellt
var mymap = L.map('mapid').setView([51.9606649, 7.6261347], 11);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors",
    id: "osm"
}).addTo(mymap);


var featureGroup = L.featureGroup().addTo(mymap);

//fügt die drawControl hinzu
var drawControl = new L.Control.Draw({
    edit: {
        featureGroup: featureGroup
    }
}).addTo(mymap);

mymap.on('draw:created', function(e) {

    // speichert das gezeichnete
    featureGroup.addLayer(e.layer);
});
document.getElementById('export').onclick = function(e) {
    // Kopiert GeoJson von der featureGroup
    var data = featureGroup.toGeoJSON();
    document.getElementById("out").innerHTML = JSON.stringify(data);
};


function geocoding() {
    var adress = document.getElementById("adress").value;
    var accessToken = "access_token="; //Todo: hinter dem "access_token=" den MapBox Token einfügen
    var resource = "https://api.mapbox.com/geocoding/v5/mapbox.places/" + adress + ".json?" + accessToken;
    var req = new XMLHttpRequest();
    req.onload = function () {
        if (req.status == "200" && req.readyState == 4) {
            sendAdressToServer(JSON.parse(req.responseText));
        }
    }
    req.onerror = function () {
        document.getElementById("notifications").innerHTML = "errorcallback: check web-console";
    }
    req.onreadystatechange = function () {
        console.log(req.status);
    }
    req.open("GET", resource, false);
    req.send()
}

function sendAdressToServer(input) {
    $.ajax({
        url: "/savegeocoding",
        type: 'POST',
        contentType:'application/json',
        data: JSON.stringify(input.features[0].geometry),
        dataType:'json'
    });
}

function locate() {
    if (navigator.geolocation) { //Überprüft ob geolocation supportet wird
        navigator.geolocation.getCurrentPosition(function (x) { //Wenn erfolgreich koordinaten ermittelt
            var json = { //Erstellen eines JSON Objektes
                "type" : "Point",
                "coordinates" : [x.coords.longitude, x.coords.latitude]
            }
            $.ajax({
                url: "/savegeocoding",
                type: 'POST',
                contentType:'application/json',
                data: JSON.stringify(json),
                dataType:'json'
            });
        },function () { //Bei fehler Tabelle ausblenden und Fehlermeldung einblenden
            console.log("error")   
        });
    } else {
        //Falls geolocation nicht supportet, Fehlermeldung einblenden
        console.log("error")
    }
}

document.getElementById("speichern").onclick = function(){
    var data = featureGroup.toGeoJSON();
    document.getElementById("out").innerHTML = JSON.stringify(data);



    //Sendet datein

    // Sending and receiving data in JSON format using POST method
//
    $.ajax({
        url: "/getdatabase",
        type: 'POST',
        contentType:'application/json',
        data: JSON.stringify(data),
        dataType:'json'
    });
}


var serverdata;

function getserverdata() {
    var resource = "/getfile"
    var req = new XMLHttpRequest();
    req.onload = function () {
        if (req.status == "200" && req.readyState == 4) {
            serverdata = JSON.parse(req.responseText)
            selectoption()
        }
    }
    req.onerror = function () {
        document.getElementById("notifications").innerHTML = "errorcallback: check web-console";
    }
    req.onreadystatechange = function () {
        console.log(req.status);
    }
    req.open("GET", resource, true);
    req.send();
}

function selectoption (){
    var selection = document.getElementById("point");
    for(var i = 0; i < serverdata.length; i++){
        var opt = document.createElement("option");
        opt.appendChild(document.createTextNode("point: "+ i))
        opt.value = i;
        selection.appendChild(opt);
    }
}

function loeschen() {
    $.ajax({
        url: "/delete",
        type: 'POST',
        contentType:'application/json',
        data: JSON.stringify({
            "id" :  serverdata[document.getElementById("point").value]._id
        }),
        dataType:'json'
    });

}
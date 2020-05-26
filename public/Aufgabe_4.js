"use strict";

/**
 * @author Sven Busemann <s_buse01@uni-muenster.de>
 */

/**
 * JSON Objekt welche benötigte Daten Speichert. Hier mit Null initialisiert.
 * @type {{Pointcloud: null, Point: null, BackupPoints: null}}
 */
var MetaJSON = {
    "Point": null,
    "Pointcloud": null,
    "Abfahrten" : null,
    "geoCoded" : null
}


// Variablen deklarieren
var MyMap = null;
var Marker = null;
getHaltestellen();
getserverdata();


/**
 * Karte wird erstellt, Marker gesetzt
 * @param arr Datenarray
 */

function MyMapSetup(arr) {
    MyMap = L.map('mapid').setView([MetaJSON.Point.coordinates[1], MetaJSON.Point.coordinates[0]], 13);
    //Das ist aus meinem Studienprojekt Kopiert
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: "map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetmap</a> contributors",
        id: "osm"
    }).addTo(MyMap);
    for(var i =  0; i<arr.length;i++){
        var marker = L.marker([arr[i][4], arr[i][3]]).addTo(MyMap);

        marker.bindPopup("Haltestellennummer: " + arr[i][5]);
    }
    Marker = L.marker([MetaJSON.Point.coordinates[1], MetaJSON.Point.coordinates[0]]).addTo(MyMap);
    
    Marker.bindPopup("Meine Position");



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

function calculate() {
    var selection = document.getElementById("point");

    var json = { //Erstellen eines JSON Objektes
        "type" : "Point",
        "coordinates" : [serverdata[parseInt(selection.value)].coordinates[0], serverdata[parseInt(selection.value)].coordinates[1]]
    }
    MetaJSON.Point = json;
    calculateRes()
}










/**
 * Lokalisiert die Adresse
 */
function LocateAdress() {
   geocoding($("#geocoding").val());
   console.log(MetaJSON);
   try{
       $("#output").html("<p> " + MetaJSON.geoCoded.features[0].place_name + " <br> " + MetaJSON.geoCoded.features[0].geometry.coordinates[0] + " " + MetaJSON.geoCoded.features[0].geometry.coordinates[1]);
       Marker.remove();
       MyMap.setView([MetaJSON.geoCoded.features[0].geometry.coordinates[1],MetaJSON.geoCoded.features[0].geometry.coordinates[0]]);
       Marker = L.marker([MetaJSON.geoCoded.features[0].geometry.coordinates[1], MetaJSON.geoCoded.features[0].geometry.coordinates[0]]).addTo(MyMap);
       Marker.bindPopup("Meine Position");
   }catch (e) {
       console.log("Unbekannter Fehler")
   }



}

/**
 * Nutzer gibt die gewünschte Adresse ein
 * @param adress Straße oder ähnliches
 */

function geocoding(adress) {
    var accessToken = "access_token="; //Todo: hinter dem "access_token=" den MapBox Token einfügen
    var resource = "https://api.mapbox.com/geocoding/v5/mapbox.places/" + adress + ".json?" + accessToken;
    var req = new XMLHttpRequest();
    req.onload = function () {
        if (req.status == "200" && req.readyState == 4) {
            MetaJSON.geoCoded = JSON.parse(req.responseText);
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

/**
 * Kalkuliert die Distanz zwischen zwei punkten.
 * @param lon1 Longitude für Punkt 1
 * @param lat1 Latitude für Punkt 1
 * @param lon2 Longitude für Punkt 2
 * @param lat2 Latitude für Punkt 2
 * @returns {number}  Returnt die Distanz
 */
function distance(lon1, lat1, lon2, lat2) {
    var R = 6371; //Kilometres
    var φ1 = toRadians(lat1);
    var φ2 = toRadians(lat2);
    var Δφ = toRadians(lat2 - lat1);
    var Δλ = toRadians(lon2 - lon1);
    var a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;
    return d;
}

/**
 * Kalkuliert den Winkel zwischen zwei punkten.
 * @param lon1 Longitude für Punkt 1
 * @param lat1 Latitude für Punkt 1
 * @param lon2 Longitude für Punkt 2
 * @param lat2 Latitude für Punkt 2
 * @returns {*} Return  das Bearing für  die Eingegebenen Koordinaten Paare
 */
function bearing(lon1, lat1, lon2, lat2) {
    var λ1 = toRadians(lon1);
    var λ2 = toRadians(lon2);
    var φ1 = toRadians(lat1);
    var φ2 = toRadians(lat2);
    var y = Math.sin(λ2 - λ1) * Math.cos(φ2);
    var x = Math.cos(φ1) * Math.sin(φ2) -
        Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1);
    var brng = (toDegree(Math.atan2(y, x)) + 360) % 360; //Bringe Ergebnis in ein 360 Grad Format statt -180 bis  180
    return brng;
}

/**
 * Evaluiert die Himmelsrichtung anhand des Winkels (Bearings).
 * @param dir Winkel für Richtung zwischen Punkten
 * @returns {string}  Return den  String  mit der  Assoziierten himmelsrichtung
 */
function cardinaldirection(dir) {
    //Überprüft im Switch statement und Returnt Himmelsrichtung
    switch (true) {
        case (dir < 22.5):
            return 'N'
        case (dir < 67.5):
            return 'NE';
        case (dir < 112.5):
            return 'E'
        case (dir < 157.5):
            return 'SE'
        case (dir < 202.5):
            return 'S'
        case (dir < 247.5):
            return 'SW'
        case (dir < 292.5):
            return 'W'
        case (dir < 337.5):
            return 'NW'
        case (dir > 337.5):
            return 'N'

    }
}

/**
 * Wandelt gegebene Radiant zahl zu Grad um
 * @param rad Radiant Zahl
 * @returns {number} Returnt Nummer in Degree
 */
function toDegree(rad) {
    return rad * (180 / Math.PI);
}

/**
 * Wandelt gegebene Grad Zahl in Radiants um.
 * @param deg Grad Zahl
 * @returns {number}  Returnt nummer als  Radian
 */
function toRadians(deg) {
    return deg * (Math.PI / 180);
}

/**
 * Lokalisiert den/die Nutzer*in.
 */
function locate() {
    if (navigator.geolocation) { //Überprüft ob geolocation supportet wird
        navigator.geolocation.getCurrentPosition(function (x) { //Wenn erfolgreich koordinaten ermittelt
            var json = { //Erstellen eines JSON Objektes
                "type" : "Point",
                "coordinates" : [x.coords.longitude, x.coords.latitude]
            }
            //Verfügbar machen und Visualisierung starte
            MetaJSON.Point = json;
            var rem = document.getElementById("loc") //Deaktivieren des Buttons der dies Aktiviert hat
            rem.parentNode.removeChild(rem);
            calculateRes()
        },function () { //Bei fehler Tabelle ausblenden und Fehlermeldung einblenden
            document.getElementById('notifications').innerHTML = "<h3>Fehler bei der Standort Lokalisierung</h3>"
        });
    } else {
        //Falls geolocation nicht supportet, Fehlermeldung einblenden
        document.getElementById('tab').innerHTML = "<h3>Geolocation nicht Supportet</h3>"
    }
}

/**
 * Stellt Arrays zusammen mit  Zieldaten. Diese Arrays werden an die Visualisierungs Funktion geleitet die diese Visualisiert
 */
function calculateRes() {
    if(MetaJSON.Pointcloud != null){ //Überprüft ob die daten überhaupt existieren
        var res = []; //Erstes Ergebnis Array
        for (var i = 0; i < MetaJSON.Pointcloud.features.length; i++) { //Iteriert durch alle Features des Datensatz
            res[i] = [distance(MetaJSON.Point.coordinates[0], MetaJSON.Point.coordinates[1], MetaJSON.Pointcloud.features[i].geometry.coordinates[0], MetaJSON.Pointcloud.features[i].geometry.coordinates[1]),
                bearing(MetaJSON.Point.coordinates[0], MetaJSON.Point.coordinates[1], MetaJSON.Pointcloud.features[i].geometry.coordinates[0], MetaJSON.Pointcloud.features[i].geometry.coordinates[1]),
                cardinaldirection(
                    bearing(MetaJSON.Point.coordinates[0], MetaJSON.Point.coordinates[1], MetaJSON.Pointcloud.features[i].geometry.coordinates[0], MetaJSON.Pointcloud.features[i].geometry.coordinates[1])),
                MetaJSON.Pointcloud.features[i].geometry.coordinates[0], MetaJSON.Pointcloud.features[i].geometry.coordinates[1],MetaJSON.Pointcloud.features[i].properties.nr];
        }
        //Compare Function dient dazu das Werte verglichen werden und nicht die Strings
        res.sort(function (a,b) { //Sortiert den Datensatz
            return a[0]-b[0];
        });
        getAbfahrten(res[0][5]) //Fragt die Abfahrten von der Nächsten haltestelle ab
        createTable(res,'tab',["Distanz", "Bearing", "Richtung", "Lon", "Lat", "Haltestellennummer"]); //Stößt die Visualisierung an
        document.getElementById('notifications').innerHTML = ""; //Leert die Notifications div
        MyMapSetup(res);
    }else{
        document.getElementById('tab').innerHTML = "<h1> Fehler ist aufgetreten </h1>" // Zeigt fehlermeldung an falls daten nicht existieren
    }


}

/**
 * Kalkuliert die abfahrtszeit
 */
function calculateAbfahrtszeit(nr){
    var resAbf = []; //Array Deklaration
    var date; //date Deklaration
    if(MetaJSON.Abfahrten.length != 0){ //Überprüfen ob Abfahrten überhaupt existieren
        for(var j = 0; j<MetaJSON.Abfahrten.length; j++){
            date = new Date(MetaJSON.Abfahrten[j].tatsaechliche_abfahrtszeit * 1000); //Umrechnen des Unix Timestamps
            resAbf[j] = [date.toTimeString(),date.toDateString(), MetaJSON.Abfahrten[j].linienid] //Stelle array zusammen
        }
        document.getElementById('headabf').innerHTML = "<h1> Abfahrten f+r Haltestellen Nummer: "+ nr + " </h1>"
        createTable(resAbf,'abf',['Zeit',"Datum",'Linie'])
    }else{
        document.getElementById('abf').innerHTML = "<h1> Keine Abfahrten in Naher Zukunft an Haltestelle: "+ nr + " </h1>"
    }



}

/**
 * Visualisierungsfunktion für Array Daten
 * @param res - Array das Fertigen datensatz enthält
 * @param div - Zieldiv an dem die Tabelle platziert werden soll
 * @param TableElem - Array mit den Tabellen Überschriften
 */
function createTable(res, div, TableElem) {
    document.getElementById(div).innerHTML = ""; //Um zu verhindern das die Tabellen anfangen doppelt zu erscheinen bei mehrfachem drücken des Buttons
    var table = document.createElement('table'); //Erschaft Tabellen Element
    var tableBody = document.createElement('tbody'); //Erschafft Tabellen body
    //Erschaffen der Kopfzeilen mit Distanz und Richtung
    var row = document.createElement('tr'); //Erschaffen einer neuen zeile
    for (var i in TableElem) {
        var cell = document.createElement('td') //Erschaffen einer neuen zelle
        cell.appendChild(document.createTextNode(TableElem[i])) //Zelle befüllen
        row.appendChild(cell) //Zelle "Anhängen"
    }
    row.appendChild(cell)
    tableBody.appendChild(row);
    for (var i in res) {
        var row = document.createElement('tr');
        for (var j in res[i]) {
            var cell = document.createElement('td')
            cell.appendChild(document.createTextNode(res[i][j]))
            row.appendChild(cell)
        }
        tableBody.appendChild(row);
    }
    table.appendChild(tableBody); //Tabellen Body anhängen
    document.getElementById(div).appendChild(table); //Hängt tabelle an das dafür erstellte Div

}

/**
 * Ruft die Haltestellen ab
 */
function getHaltestellen() {
    var resource = "https://rest.busradar.conterra.de/prod/haltestellen";
    var request = new XMLHttpRequest();
    request.onload = function () {
        if (request.status == "200" && request.readyState == 4) {
            MetaJSON.Pointcloud = JSON.parse(request.responseText);
            locate();
        }
    }
    request.onerror = function () {
        document.getElementById("tab").innerHTML = "API nicht Verfügbar";
    }
    request.onreadystatechange = function () {
        console.log(request.status);
    }
    request.open("GET", resource, true);
    request.send();
}

/**
 * Ruft Abfahrten einer Haltestelle ab und stößt direkt die Kaluklation und damit auch die Visualisierung an
 * @param nr - Haltestellen Nummer
 */
function getAbfahrten(nr) {
    var resource = "https://rest.busradar.conterra.de/prod/haltestellen/" + nr + "/abfahrten?sekunden=300"
    var req = new XMLHttpRequest();
    req.onload = function () {
        if (req.status == "200" && req.readyState == 4) {
            MetaJSON.Abfahrten = JSON.parse(req.responseText);
            calculateAbfahrtszeit(nr);
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

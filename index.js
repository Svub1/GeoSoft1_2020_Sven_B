const bodyParser = require('body-parser')
const express = require('express');
const mongodb = require('mongodb');
const port=3000;

const app = express();

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

//Einbindung der Bibliotheken in denServer
app.use('/jquery', express.static(__dirname + '/node_modules/jquery/dist'));

app.use('/leaflet', express.static(__dirname + '/node_modules/leaflet/dist'));

app.use('/leaflet-draw', express.static(__dirname + '/node_modules/leaflet-draw/dist'));

/**
 * function erstellt Verbindung zu MongoDB. Versucht alle 3 Sekunden eine Verbindung herzustellen falls es failed.
 */
async function connectMongoDB() {
    try {
        //connect to database server
        app.locals.dbConnection = await mongodb.MongoClient.connect("mongodb://localhost:27017", { useNewUrlParser: true });
        //connect do database "itemdn"
        app.locals.db = await app.locals.dbConnection.db("data");
        console.log("Using db: " + app.locals.db.databaseName);

    }
    catch (error) {
        console.dir(error)
        setTimeout(connectMongoDb, 3000)
    }
}

// liegt an  port 3000
app.listen(port,
    () => console.log(`Example app listening at http://localhost:${port}`)
)

//Startet Verbindung
connectMongoDB()

//Speichert alle Files ind dem Ordner public
app.use('/public', express.static(__dirname + '/public'))

//Sendet index.html auf Nachfrage zu "/"
app.get('/', (req,res) => {
    res.sendFile(__dirname + '/Aufgabe_4.html')
})

app.get('/draw', (req,res) => {
    res.sendFile(__dirname + '/Aufgabe_4_draw.html')
})


app.get('/getfile', (req,res) => {
    app.locals.db.collection("usercollection").find({}).toArray(((mongoError, result) => {
        if (mongoError) throw mongoError;
        res.json(result)

    }))
});

app.post('/savegeocoding', function (req, res) {
    res.send({ status: 'SUCCESS' });
    app.locals.db.collection("usercollection").insertOne({
        "type" : "Point",
        "coordinates": [req.body.coordinates[0], req.body.coordinates[1]]
    })
});

app.post('/getdatabase', function (req, res) {
    console.dir(req.body)
    res.send({ status: 'SUCCESS' });
    for(var i = 0; i<req.body.features.length; i++){
        app.locals.db.collection("usercollection").insertOne({
            "type" : "Point",
            "coordinates": [req.body.features[i].geometry.coordinates[0],req.body.features[i].geometry.coordinates[1]]
        })
    }
});


app.post('/delete', (req,res) => {
    res.send({ status: 'SUCCESS' });
    var id = req.body. id;
    app.locals.db.collection("usercollection").deleteOne({
        "_id" : new mongodb.ObjectID(id)
    }, (error,  result) => {
        if (error) throw  error

    })
});





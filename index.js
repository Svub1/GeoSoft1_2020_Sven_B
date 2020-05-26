const bodyParser = require('body-parser')
const express = require('express');
const mongodb = require('mongodb');
const port=3000;

const app = express();

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

/**
 * function which creates a Connection to MongoDB. Retries every 3 seconds if noc connection could be established.
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

// listen on port 3000
app.listen(port,
    () => console.log(`Example app listening at http://localhost:${port}`)
)

//Start connecting
connectMongoDB()

//Make all Files stored in Folder "public" accessible over localhost:3000/public
app.use('/public', express.static(__dirname + '/public'))

//Send index.html on request to "/"
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





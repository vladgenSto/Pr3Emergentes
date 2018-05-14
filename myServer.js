const application_root=__dirname,
    express = require("express"),
    path = require("path"),
    bodyparser=require("body-parser");

const ctrl = require('./controllers');

var app = express();
app.use(express.static(path.join(application_root,"public")));
app.use(bodyparser.urlencoded({extended:true}));
app.use(bodyparser.json());

//Cross-domain headers
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/',ctrl.sendStatic);

app.get('/streams',ctrl.sendDatasets);

app.get('/stream/graph', ctrl.getGraph);

app.get('/stream/graphMongo', ctrl.getGraphMongo);

app.get('/stream/:name/polarity',ctrl.sendPolaridad);

app.get('/stream/:name/histograma',ctrl.getHistograma);

app.get('/stream/:name/geo',ctrl.getListaGeoLocalizados);

app.get('/stream/:name',ctrl.getListaIdStr);

ctrl.warmup.once("warmup", _ => {
   console.log("Web server running on port 8080");
   app.listen(8080, function() {
   	console.log("the server is running!");
   });
});

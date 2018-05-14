const Twitter = require('twitter');
const myCreds = require('./credentials/my-credential.json');
const db = require('./myStorage');
const util = require('util');
const ctrl = require('./controllers');

// MongoDB
const mongoDB = require('mongoose');
mongoDB.connect('mongodb://vladgen:patata@ds159509.mlab.com:59509/mydb_vladi');

let schema = new mongoDB.Schema({
	agent: { 
		name: { 
			type: String, 
			required: true, 
			max: 100 
		}, 
	},
	startTime: { 
		type: Date, 
		default: Date.now 
	},
	query: { 
		type: String, 
		required: true, 
		max: 100 
	},
	"@id": { 
		type: String, 
		required: true, 
		max: 200 
	},
})

let itemModel = mongoDB.model('Item', schema);
let JSON_LD = ctrl.generarJSON_LD(name, track);

let metaData = new itemModel(JSON_LD);
metaData.save(function(err) {
	if (err) throw err;
	console.log("Guardado");
});

const client = new Twitter(myCreds);
const sentiment = require('sentiment-spanish');


class StreamManager {
	constructor() {
		this.streams = {}; //clave es el nombre y el valor del objeto stream
		this.DB = new db.myDB('./data');
	}

	createStream(name, track) {
		let stream = client.stream('statuses/filter', {track: track});
		
		// Obtener la fecha y darle el formato deseado dd/mm/yyyy
		// let hoy = new Date();
		// let dd = hoy.getDate();
		// let mm = hoy.getMonth() + 1;
		// let yyyy = hoy.getFullYear();

		// if(dd<10) {
		//     dd='0'+dd
		// } 

		// if(mm<10) {
		//     mm='0'+mm
		// } 

		// hoy = dd+'/'+mm+'/'+yyyy;

		this.streams[name] = stream;

		this.DB.createDataset(name, {'creator': 'yo', track:track});

		stream.on('data', tweet => {
			if (tweet.lang == "es" || tweet.user.lang == "es" ) {
				console.log(tweet.id_str, tweet.created_at, tweet.text);
				console.log("-----------------------");
				this.DB.insertObject(name,{"id":tweet.id_str,"created": tweet.created_at, "texto":tweet.text});
			}
		});

		stream.on('error', err => console.log(err));

	} //create

	destroyStream(name) {
		this.streams[name].destroy();
		delete this.streams[name];
	}

}	

let SM = new StreamManager();

SM.DB.events.once("warmup", _ => {
	SM.createStream("coches", "coches, opel, mercedes, bmw, seat, ford, citroen, peugeot");
	setTimeout(_=> SM.destroyStream("coches"), 80000);
	SM.createStream("motos", "motos, yamaha, kawasaki, suzuku, bmw, ducati, vespa, harley, peugeot, aprila, honda");
	setTimeout(_=> SM.destroyStream("motos"), 80000);
	SM.createStream("camiones", "camiones, man, mercedes, scania, iveco, ford, daf, volvo");
	setTimeout(_=> SM.destroyStream("camiones"), 80000);
});
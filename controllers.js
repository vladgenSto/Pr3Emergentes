const db=require('./myStorage');
const _ = require('underscore');
const https = require('https');
let DB = new db.myDB('./data');

// MongoDB:
const mongoDB = require('mongoose');
// Multiples conexiones:
const conect_mnogoDB = mongoDB.createConnection('mongodb://vladgen:patata@ds159509.mlab.com:59509/mydb_vladi');
mongoDB.connect(conect_mnogoDB);


exports.sendStatic    = (req,res) => res.sendFile("public/index.html",{root:application_root});

exports.sendDatasets  = (req,res) => res.send({result: DB.getDatasets()}); 

exports.sendCounts    = (req,res) => res.send({error:"No operativo!"});

exports.sendLastPosts = (req,res) => {
    let n = (req.query.n == null) ? 10 : parseInt(req.query.n);
    DB.getLastObjects(req.params.name,n,data => res.send(data));
};

//Devuelve la polaridad de los tweets (positivos, neutros, negativos)
exports.sendPolaridad = (req,res) => {
	DB.getLastObjects(req.params.name, 100, respuesta => {

		let positivo = 0
		let negativo = 0
		let neutral = 0

		respuesta = respuesta.result;

		for(let i = 0; i < respuesta.length; i++){
			if (respuesta[i].polaridad > 0)
				positivo++
			else if (respuesta[i].polaridad == 0)
				neutral++
			else
				negativo++
			
		}

		let json = {
			'positive': positivo,
			'negative': negativo,
			'neutral': neutral,
		}

		res.send({'result':json});
	});

};

exports.getHistograma = (req, res) => {
	DB.getLastObjects(req.params.name, 100, respuesta => {
		let cont = req.params.limit;
		let lista = respuesta.result;
		let vector = [];

		for (let i = 0; i < lista.length; i++) {
			vector = vector.concat(lista[i].texto.split(' '));
		}
		let final = _.sortBy(_.pairs(_.countBy(vector))).slice(-1);
		res.send({'result':final});
		//console.log(lista);
	})
}

//Devuelve la localización de los tweets
exports.getListaGeoLocalizados = (req, res) => {
	DB.getLastObjects(req.params.name, 100, lista =>{
		let localizacion = {};

		for (let tweet of lista.result){
			if (tweet.coordenadas != null && tweet.coordenadas != " "){
				localizacion[tweet.id] = tweet.coordenadas;
			}
		}

		let pares = _.pairs(localizacion);
		res.send({result:pares});
	})	
};

//Devuelve el ID de los "n" tweets
exports.getListaIdStr = (req, res) => {
	DB.getLastObjects(req.params.name, 100, respuesta => {
		respuesta = respuesta.result;
		let n = (req.query.limit == null) ? 10 : parseInt(req.query.limit);
		res.send({'result':respuesta.slice(0,n).map(x=>x.id)});
	});

}

function generarJSON_LD(name, track) {
	return {
		"@context": "http://schema.org/",
		"@type": "SearchAction",
		"@id": track,
		"@author": {
			"@type": "Person",
			"name": "Vladimir Stoyanov",
		},
		"startTime": Date(),
		"@query": "http://localhost:8080/stream/" + name,
	}
}

// exports.getGraph = (req, res) => {
// 	let id = req.params.name;
// 	DB.getMetaData(id, track => {
// 		res.send({
// 			"@context": "http://schema.org/",
// 			"@type": "SearchAction",
// 			"@identifier": id,
// 			"@id": track,
// 			"@author": {
// 				"@type": "Person",
// 				"name": "Vladimir Stoyanov",
// 			},
// 			"startTime": Date(),
// 			"url": "http://localhost:8080/stream/" + id,
// 		});
// 	});
// }

exports.getGraph = (req, res) => {
    let list = DB.getDatasets();
    let promis = list.map(name => new Promise(resolve => {
    	DB.getMetaData(track => {
            resolve(generarJSON_LD(name, track))  
    	});
    }));
    Promise.all(promis).then(values => {
		res.send({ 
			"@graph": values,
		});
	});
}

exports.getGraphMongo = (req, res) => {
    https.get('https://api.mlab.com/api/1/databases?apiKey=QsSTSJEzJYkVdi3SA-mvf-LHtYIfTzZk', function(next){
		next.on('data', function(json){
     		var values = JSON.parse(json);
     		res.send({
     			"@context":"http://mlab.com/",
     			"@graph": values
     		});
 		}).on('error', (e) => {
  			console.error(e);
  		})
    });
}

exports.warmup = DB.events;

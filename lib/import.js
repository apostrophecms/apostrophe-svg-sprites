var request = require('request');
var fs = require('fs');
var xml2js = require('xml2js');
var async = require('async');
var _ = require('lodash');

module.exports = function (apos, argv, callback) {

  var self = apos.modules['apostrophe-svg-sprites'];
	var maps = self.options.maps;
	var req = apos.tasks.getReq();

	evaluateForUpsert = function (svg) {
		self.find(req, { id: svg.symbol.id, file: svg.file }, {}).toArray(function (err, docs) {
			if (err) {
				return callback(err);
			}

			if (docs.length) {
				// i have a doc, update it
				return updatePiece(docs[0], svg);
			} else {
				// i don't have a doc, insert it
				return insertPiece(svg);
			}
		});

		return;
	};

	insertPiece = function (svg) {
		var piece = self.newInstance();

		if (svg.symbol.title) {
			piece.title = apos.launder.string(svg.symbol.title);
		} else {
			piece.title = apos.launder.string(svg.symbol.id);
		}

		piece.id = svg.symbol.id;
		piece.file = svg.file;

		console.log('inserting ' + piece.id);
		self.insert(req, piece, { permissions: false }, callback);

	};

  removePiece = function () {};

	updatePiece = function (doc, svg) {
		console.log('update ' + doc.id);
		var updateFields = {};

		if (svg.symbol.title) {
			updateFields.title = apos.launder.string(svg.symbol.title);
		} else {
			updateFields.title = apos.launder.string(svg.symbol.id);
		}

		self.update({_id: doc._id}, updateFields, { permissions: false }, callback);
	}
	

	loadMap = function(map, callback) {
		var pattern = /(http(s)?)/gi;
		var xml;

		if (pattern.test(map.file)) {
			// file is a full url, load it via `request` module
			request(map.file, function (err, res, body) {
				
				if (err) {
					console.log(err);
				}

				return callback(body, map)
			});
		} else {
			// try to load it from the system
			fs.readFile(apos.rootDir + '/public/' + map.file, function(err, data) {
				if (err) {
					console.log('local file ' + apos.rootDir + '/public/'  + map.file + ' could not be loaded');
					console.log(err);
				}
				return callback(data, map)
			});
		}
	};

	findInObj = function(obj, key) {
		
		if (_.has(obj, key)) // or just (key in obj)
			return [obj];
		return _.flatten(_.map(obj, function (v) {
			return typeof v == "object" ? findInObj(v, key) : [];
		}), true);

	};

	parseMap = function(xml, map, callback) {

		var svgs = [];
		xml2js.parseString(xml, function (err, result) {

			var symbols = findInObj(result, 'symbol');
			
			if (!symbols.length) {
				console.log('Could not find an array of <symbol> elements in map ' + map.label);	
				return false;
			}

			if (symbols[0] && symbols[0].symbol) {
				symbols = symbols[0].symbol;
			} else {
				console.log('Error occured parsing array of symbols in map ' + map.label);
				return false;	
			}

			symbols.forEach(function (symbol) {
				if (symbol.$.id) {
					svgs.push({
						symbol: symbol.$,
						file: map.file
					});
				} else {
					console.log('SVG is malformed or has no ID property');
				}
			});

			return callback(svgs);

		});	
	}

	async.eachSeries(maps, function(map, callback) {
		loadMap(map, function(xml) {
			parseMap(xml, map, function(svgs) {
				svgs.forEach(function(svg) {
					evaluateForUpsert(svg);
				});
			});
			callback(null);
		});
	}, function(err) {
	});
}
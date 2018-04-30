var request = require('request');
var fs = require('fs');
var xml2js = require('xml2js');
var async = require('async');
var _ = require('lodash');
var glob = require('glob');

module.exports = function (apos, argv, callback) {

  var self = apos.modules['apostrophe-svg-sprites'];
	var maps = self.options.maps;
	var req = apos.tasks.getReq();

	// console.log(self.options);

	evaluateForUpsert = function (svgs) {
		svgs.forEach(function (svg) {
			self.find(req, {
				id: svg.symbol.id
			}, {}).toArray(function (err, docs) {
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
		});
		// return;
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

		updateFields.file = svg.file

		self.update({_id: doc._id}, updateFields, { permissions: false }, callback);
	}

	fileExists = function (path) {
		console.log('tryna see if ' + path + ' exists');

		if (fs.existsSync(path)) {
			return true
		} else {
			return false;
		}
	};

	fileRead = function (path, map) {
		console.log('tryna READ ' + path + ' exists');
		fs.readFile(path, function (err, data) {
			if (err) {
				console.log('local file ' + path + ' could not be loaded');
				console.log(err);
				return false;
			}
			map.url = apos.assets.assetUrl('/modules/my-apostrophe-svg-sprites/public/' + map.file);
			callback(data, map)
		});
	};


	loadMap = function(map, callback) {
		// console.log('LOAD MAP');
		// console.log();
		var pattern = /(http(s)?)/gi;
		var xml;


		if (pattern.test(map.file)) {
			console.log('passed https test');
			// file is a full url, load it via `request` module
			console.log(map.file);
			request(map.file, function (err, res, body) {

				if (err) {
					console.log(err);
					return false;
				}

				return callback(body, map);
			});
		} else {
			// try to load it from the system
			var possiblePaths = [];
			possiblePaths.push(apos.rootDir + '/lib/modules/apostrophe-svg-sprites/public/' + map.file);

			// possiblePaths.push(apos.rootDir + apos.assets.assetUrl('/modules/apostrophe-svg-sprites/public/' + map.file));

			possiblePaths.forEach(function (path) {
				if (path.includes('*')) {
					glob(path, function (err, files) {
						if (files.length) {

							console.log('found a glob winner in ' + files[0]);

							var temp = map.file.split('/');
							temp[temp.length - 1] = files[0].split('/')[files[0].split('/').length - 1];
							map.file = temp.join('/');

							callback(files[0], map);
						}
					});
				} else {
					if (fileExists(path)) {
						console.log('found a winner in ' + path);
						return callback(path, map);
					}
				}
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
		console.log('HI');
		console.log(xml);
		console.log('===');
		// console.log(data.map);
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

	async.eachSeries(maps, function(map) {
		async.waterfall([
			async.apply(loadMap, map),
			fileRead,
			parseMap,
			evaluateForUpsert
		], function (err, result) {
			console.log('done waterfall');
		});
	}, function (err, result) {
		console.log('done mapping');
	})

};

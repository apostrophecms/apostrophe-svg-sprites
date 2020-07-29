var request = require('request');
var fs = require('fs');
var xml2js = require('xml2js');
var async = require('async');
var _ = require('lodash');
var glob = require('glob');

module.exports = function (self, options) {
  self.import = function(apos, argv, callback) {
    var maps = self.options.maps;
    var req = apos.tasks.getReq();

    return async.eachSeries(maps, function (map, callback) {
      return async.waterfall([
        async.apply(loadMap, map),
        parseMap,
        evaluateForUpsert
      ], callback);
    }, callback);

    function loadMap(map, callback) {
      var pattern = /(http(s)?)/gi;

      if (pattern.test(map.file)) {
        // file is a full url, load it via `request` module
        return request(map.file, function (err, res, body) {
          if (err) {
            return callback(err);
          }
          if (res.statusCode >= 400) {
            return callback(res.statusCode);
          }
          return callback(null, body, map);
        });

      } else {
        var base = apos.rootDir + '/lib/modules/apostrophe-svg-sprites/public/';
        var path = base + map.file;
        if (path.includes('*')) {
          return glob(path, function (err, files) {
            if (err) {
              return callback(err);
            }
            if (files.length) {

              return fs.readFile(files[0], function (err, data) {
                if (err) {
                  return callback(err);
                }

                // Get the path relative to the module's public folder
                var file = files[0].substring(base.length);
                // Correct map.file to point to the current actual file,
                map.file = file;

                map.finalFile = apos.assets.assetUrl('/modules/my-apostrophe-svg-sprites/' + file);
                return callback(null, data, map);
              });
            } else {
              return callback(path + ' does not match anything, cannot continue');
            }
          });
        } else {
          if (fileExists(path)) {
            map.finalFile = apos.assets.assetUrl('/modules/my-apostrophe-svg-sprites/' + map.file);
            return fs.readFile(path, function (err, data) {
              if (err) {
                return callback(err);
              }
              return callback(null, data, map);
            });
          } else {
            return callback(path + ': no path provided, cannot continue');
          }
        }
      }
    }

    function parseMap(xml, map, callback) {

      var svgs = [];
      return xml2js.parseString(xml, function (err, result) {

        if (err) {
          return callback(err);
        }

        var symbols = findInObj(result, 'symbol');

        if (!symbols.length) {
          return callback('Could not find an array of <symbol> elements in map ' + map.label);
        }

        if (symbols[0] && symbols[0].symbol) {
          symbols = symbols[0].symbol;
        } else {
          return callback('Error occured parsing array of symbols in map ' + map.label);
        }

        symbols.forEach(function (symbol) {
          if (symbol.$.id) {
            svgs.push({
              symbol: symbol.$,
              file: map.finalFile,
              map: map.name
            });
          } else {
            return callback('SVG is malformed or has no ID property');
          }
        });

        return callback(null, svgs);

      });
    }

    function evaluateForUpsert(svgs, callback) {
      return async.eachSeries(svgs, function (svg, callback) {
        return self.find(req, {
          id: svg.symbol.id
        }, {}).toArray(function (err, docs) {
          if (err) {
            return callback(err);
          }

          if (docs.length) {
            // i have a doc, update it
            return updatePiece(docs[0], svg, callback);
          } else {
            // i don't have a doc, insert it
            return insertPiece(svg, callback);
          }
        });
      }, callback);
    }

    function insertPiece(svg, callback) {
      var piece = self.newInstance();

      console.log('<', svg.map);
      if (svg.symbol.title) {
        piece.title = apos.launder.string(svg.symbol.title);
      } else {
        piece.title = apos.launder.string(svg.symbol.id);
      }

      piece.id = svg.symbol.id;
      piece.file = svg.file;
      piece.map = svg.map;

      return self.insert(req, piece, {
        permissions: false
      }, callback);

    }

    function updatePiece(doc, svg, callback) {
      var updateFields = {};

      console.log('>', svg.map);
      if (svg.symbol.title) {
        updateFields.title = apos.launder.string(svg.symbol.title);
      } else {
        updateFields.title = apos.launder.string(svg.symbol.id);
      }

      updateFields.file = svg.file;
      updateFields.map = svg.map;

      return apos.docs.db.update({
        _id: doc._id
      }, {
        $set: updateFields
      }, callback);
    }

    function fileExists(path) {
      if (fs.existsSync(path)) {
        return true;
      } else {
        return false;
      }
    }

    function findInObj(obj, key) {

      if (_.has(obj, key)) { return [obj]; }
      return _.flatten(_.map(obj, function (v) {
        return typeof v === "object" ? findInObj(v, key) : [];
      }), true);
    }
  };
};

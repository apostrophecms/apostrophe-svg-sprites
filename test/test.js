var assert = require('assert');

describe('apostrophe-svg-sprites', function() {

  var apos;

  this.timeout(5000);

  after(function(done) {
    require('apostrophe/test-lib/util').destroy(apos, done);
  });

  /// ///
  // EXISTENCE
  /// ///

  it('1. Module should be a property of the apos object', function(done) {
    apos = require('apostrophe')({
      testModule: true,
      modules: {
        'apostrophe-svg-sprites': {
          maps: [
            {
              label: 'Places Icons',
              name: 'places',
              file: 'svg/places.svg'
            }
          ]
        },
        'apostrophe-svg-sprites-widgets': {}
      },
      afterInit: function(callback) {
        assert(apos.modules['apostrophe-svg-sprites']);
        return callback(null);
      },
      afterListen: function(err) {
        assert(!err);
        done();
      }
    });
  });

  it('2. Test import task', function() {
    return apos.tasks.invoke('apostrophe-svg-sprites:import');
  });

  var howMany;

  it('3. Pieces should now exist', function() {
    return apos.modules['apostrophe-svg-sprites'].find(apos.tasks.getReq(), {}).toArray().then(function(pieces) {
      assert(pieces);
      assert(pieces.length);
      howMany = pieces.length;
    });
  });

  it('4. Modify so we can distinguish inserts from updates', function() {
    apos.docs.db.update({ type: 'apostrophe-svg-sprites' }, {
      $set: {
        existing: true
      }
    }, {
      multi: true
    });
  });

  it('4. Re-import', function() {
    return apos.tasks.invoke('apostrophe-svg-sprites:import');
  });

  it('5. Same # of pieces, and they are the same pieces', function() {
    return apos.modules['apostrophe-svg-sprites'].find(apos.tasks.getReq(), {}).toArray().then(function(pieces) {
      assert(pieces);
      assert(pieces.length);
      assert(pieces.length === howMany);
      assert(pieces[0].existing);
    });
  });

});

var _ = require('lodash');

module.exports = {
  moogBundle: {
    modules: ['apostrophe-svg-sprites-widgets'],
    directory: 'lib/modules'
  },

  name: 'apostrophe-svg-sprites',
  extend: 'apostrophe-images',
  alias: 'svg-sprites',
  label: 'SVG',
  pluralLabel: 'SVGs',
  perPage: 20,
  manageViews: ['grid', 'list'],
  searchable: false,
  insertViaUpload: false,

  beforeConstruct: function (self, options) {

    options.removeFields = ['credit', 'creditUrl', 'attachment'];

    var mapChoices = _.map(options.maps, function (map) {
      return { label: map.label, value: map.file }
    });
  
    var mainFieldNames = _.map(addFields, function (field) {
      return field.name
    });

    mainFieldNames.push('title', 'description');

    options.addFields = [
      {
        name: 'id',
        label: 'ID',
        type: 'string',
        help: 'ID of the <symbol> element in the map',
        required: true
      },
      {
        name: 'map',
        label: 'Map',
        type: 'select',
        choices: mapChoices,
        required: true
      }
    ].concat(options.addFields || []);

    options.arrangeFields = [
      {
        name: 'main',
        label: 'Main Fields',
        fields: mainFieldNames
      },
      {
        name: 'admin',
        label: 'Admin',
        fields: ['slug', 'published', 'tags']
      }
    ].concat(options.arrangeFields || []);
  },

  construct: function (self, options) {

  },

  afterConstruct: function (self) {
    self.pushAsset('stylesheet', 'apos-sprites', { when: 'user' });
  }
};
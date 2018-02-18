apos.define('apostrophe-images-editor-modal', {
  extend: 'apostrophe-pieces-editor-modal',
  transition: 'slide',
  construct: function (self, options) {
    self.afterPopulate = function (piece, callback) {
      self.$el.find('[data-apos-svg-sprite-preview-container]').append('<svg><use xlink:href="' + piece.map + '#' + piece.id + '"></use></svg>');
      return setImmediate(callback);
    }
  }
});

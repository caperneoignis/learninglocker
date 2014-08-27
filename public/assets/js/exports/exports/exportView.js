define([
  'jquery',
  'underscore',
  'marionette',
  'text!./exportTemplate.html'
], function ($, _, Marionette, template) {
  return Marionette.ItemView.extend({
    template: _.template(template),
    events: {
      'click #save': 'save',
      'click #json': 'downloadJSON',
      'click #csv': 'downloadCSV',
      'change #name': 'changeName',
      'change #description': 'changeDescription'
    },

    initialize: function (options) {
      this.options = options || {};
    },

    save: function () {
      var self = this;
      var opts = {
        success: function (model, response, options) {
          alert('Export has been saved.');
          self.options.created = true;
        },
        error: function (model, response, options) {
          alert(response);
          if (!self.options.created) {
            self.options.collection.remove(self.model);
          }
        }
      }

      this.model.set({'report': this.options.reports.selected.id});

      if (!this.model.isValid()) {
        alert(this.model.validationError);
      } else if (this.options.collection) {
        this.options.collection.create(this.model.toJSON(), opts);
      } else {
        this.model.save({}, opts);
      }
    },

    downloadJSON: function () {
      if (!this.options.created) {
        alert('You must save this new export before you can download it\'s result.');
      } else {
        this.model.runJSON().done(function (data) {
          console.info(data);
        }).fail(function (jqXHR, status, error) {
          alert(jqXHR.responseJSON.message || error);
        });
      }
    },

    downloadCSV: function () {
      if (!this.options.created) {
        alert('You must save this new export before you can download it\'s result.');
      } else {
        this.model.runCSV().done(function (data) {
          console.info(data);
        }).fail(function (jqXHR, status, error) {
          alert(jqXHR.responseJSON.message || error);
        });
      }
    },

    changeName: function (e) {
      this.model.set('name', e.currentTarget.value);
    },

    changeDescription: function (e) {
      this.model.set('description', e.currentTarget.value);
    }
  });
});
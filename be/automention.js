/*global jQuery */
(function(factory) {
  'use strict';
  if (typeof define === 'function' && define.amd) {
    define(['jquery', 'jquery/be/autosuggest'], function() {
      var module = factory.apply(this, arguments);
      return module;
    });
  }
  else {
    return jQuery && factory.call(this, jQuery);
  }
}(function($) {
  'use strict';

  var _usernameMatch = /(?:^|[^\w])@(\w+)/;

  return $.widget("be.automention", $.be.autosuggest, {
    _create: function() {
      this._super();

      this._on(this.element, {
        mouseup: this.check,
        keyup: this.check
      });
    },

    _mention: {
      value: "",
      start: 0,
      end: 0
    },

    _last: null,

    _value: function(term) {
      if (!term) { return this._mention.value; }

      var orig = this._super(),
      // Starting at the character after the @
      start = orig.indexOf('@', this._mention.start) + 1;

      // Set the full value, which swaps out the substring
      this._super(orig.substring(0, start) + term + ' ' +
                  orig.substring(this._mention.end));
    },

    check: function check(event) {
      if (!this.element.is(document.activeElement)) { return; }

      var value = document.activeElement.value,
      cursor = document.activeElement.selectionStart,
      word, start, end;

      if (!(cursor && value)) { return; }

      start = value.lastIndexOf(' ', cursor - 1);
      end = value.indexOf(' ', cursor);
      end = ~end ? end : Infinity;

      word = value.substring(start, end);
      word = _usernameMatch.exec(word);

      // Get the first capture group
      word = word && word[1];

      // When the value has changed
      if (this._last !== word) {
        this._mention.value = word || "";
        this._mention.start = start;
        this._mention.end = end;
        this._searchTimeout(event);
        this._trigger("mention", null, word);
      }
      this._last = word;
    }
  });
}));
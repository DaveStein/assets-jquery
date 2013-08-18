(function($) {

  $.widget("ui.textboxlist", $.extend({}, $.ui.coreext, $.ui.bubblelist, {

    options : {

        allow_numbers        : false,
        word_limit           : 3,
        char_buffer          : 5,
        min_length           : 2,
        adtl_close_classes   : ['pointer','sprite-site-elements'],
        adtl_display_classes : [],
        create_keys          : [ $.ui.keyCode.ENTER, $.ui.keyCode.NUMPAD_ENTER, $.ui.keyCode.TAB, $.ui.keyCode.COMMA, $.ui.keyCode.COLON, $.ui.keyCode.SEMICOLON ],
        add_from_input       : true,
        blacklist            : [],
        list_classes         : [],
        ignore_blur_override : false,
        limit                : 0

    },

    keycodes : {},

    _id            : '',
    $_hidden_width : false,
    $_list         : false,

    _init : function() {

      var textboxlist  = this,
          ignore_blur  = false;

       this.keycodes[ $.ui.keyCode.COMMA ]     = ',';
       this.keycodes[ $.ui.keyCode.COLON ]     = ':';
       this.keycodes[ $.ui.keyCode.SEMICOLON ] = ';';

      this._id            = this.element.attr('id');
      this.$_hidden_width = $('<div id="' + this._id + '-hidden" class="ui-textboxlist-hidden-width" />');
      this.$_list         = $('<div id="' + this._id + '-list" class="ui-textboxlist" />');

      this.$_list.addClass( this.options.list_classes.join(' ') )
      .on( 'focus blur', 'input', function( e ) {
        textboxlist.$_list.toggleClass( 'focus', e.type === 'focusin' );
      });

      this.element.addClass('ui-textboxlist-hidden-text');

      this.element.after( this.$_list );

      this.options.display_classes = this.options.adtl_display_classes.concat('ui-textboxlist-selection-display', this.options.display_classes);

      this.options.close_classes = this.options.adtl_close_classes.concat('ui-textboxlist-deletebutton', this.options.close_classes);


      if ( this.element.val() !== '' ) {

        // TODO: account for all delimiters such as colons and semicolons
        $.each( this.element.val().split(','), function( index, value ) {
          textboxlist.addValue( value );
        });

      }

      this._update_hidden_text();

      this.$_list.addClass('ui-textboxlist');
      this.element.after( this.$_hidden_width );

      if ( this.options.ignore_blur_override !== true ) {

        this.$_list.delegate( 'input', 'blur', function( e ) {

          if ( ignore_blur === true ) {
            ignore_blur = false;
            return;

          }

          // If value is good on blur, create
          if ( textboxlist._good_value( this.value ) ) {
            textboxlist._create_bubble_from_input( this, false );
          }
          // Otherwise blank out field
          else {
            this.value = '';
          }

        }); // listdelegate blur

      } // if ignore_blur_override

      // if comma will make new bubbles
      if ( $.inArray( $.ui.keyCode.COMMA, this.options.create_keys ) !== -1 ) {

        // make bubbles based on paste
        this.$_list.delegate( 'input', 'paste', function( e ) {


          var input = this;
          setTimeout( function() {

            if ( textboxlist.options.add_from_input !== true ) {
              textboxlist.element.trigger( 'textboxlist.change', [ input.value ] );
              return;
            }

            var values, $input,
                value        = input.value,
                value_array  = value.split( ' ' ),
                count        = 0,  // track when to split string
                new_term     = '', // string to build up proper comma placement
                val_index;

            // if pasting something that will break the word limit
            if ( textboxlist.options.word_limit > 0 && value_array.length > textboxlist.options.word_limit ) {


              // Loop through terms to fake comma insertion so next block can handle
              for( val_index in value_array ) {

                new_term += ' ' + value_array[ val_index ];

                ++count;

                // trim first space of first word
                new_term = $.trim( new_term );

                // set this chunk of words as an actual new term
                if ( count === textboxlist.options.word_limit ) {

                  // set for creation later
                  new_term +=',';

                  // reset numbers for next block
                  count    = 0;

                } // if count = limit


              } // for val_index

              // Remove trailing comma
              if ( new_term.substr( -1 ) === ',' ) {
                new_term = new_term.substr( 0, ( new_term.length-1 ) );
              }

              // finally set new value of input to handle proper splits
              input.value = new_term;


            } // if word_limit > 0

            // TODO: account for all delimiters such as colons and semicolons
            // found at least one comma
            if ( input.value.indexOf( ',' ) !== -1 ) {

              values = input.value.split( ',' );

              $.each( values, function( i, value ) {

                textboxlist.addValue( $.trim( value ) );

              }); // each values

              // make sure the $input is always there since new ones are created through looping
              $input = textboxlist.$_list.find( 'input' );

              $input.val('');

            } // input.value indexOf

          }, 5 ); // setTimeout

        }); // delegate paste

      } // inArray COMMA

      this.$_list.delegate( 'input', 'keydown', function( e ) {

        // if key is going to create bubble, no need to pay attention on blur
        if ( $.inArray( e.keyCode, textboxlist.options.create_keys ) ) {
          ignore_blur = true;
        }


        var input            = this,
            last_input_value = this.value;

        // input.value is not set yet
        setTimeout( function() {

          ignore_blur = false;

          var words        = [],
              word_count   = 0,
              auto_focus   = true,
              $last_delete = false;

          textboxlist._update_hidden( input );

          if ( last_input_value === '' && input.value === '' && e.keyCode === $.ui.keyCode.BACKSPACE ) {

            $last_delete = textboxlist.$_list.find('.ui-textboxlist-deletebutton').last();

            if ( $last_delete.length ) {
              $last_delete.trigger( 'click' );
            }
            else {
              textboxlist.element.trigger( 'textboxlist.change', [ input.value ] );
            }

            return;
          }

          // change is fired within _create_bubble_from_input normally
          if ( textboxlist.options.add_from_input !== true ) {
            textboxlist.element.trigger( 'textboxlist.change', [ input.value ] );
            return;
          }

          if ( $.inArray( e.keyCode, textboxlist.options.create_keys ) !== -1 ) {

            auto_focus = ( e.keyCode !== $.ui.keyCode.TAB );

            switch( e.keyCode ) {

              case $.ui.keyCode.TAB :
              case $.ui.keyCode.ENTER :
              case $.ui.keyCode.NUMPAD_ENTER :
                break;

              default :
                input.value = input.value.substr(0, input.value.length-1 ); // remove trailing character
                break;


            }

            textboxlist._create_bubble_from_input( input, auto_focus );
            return;

          } // if keyCode in create_keys

          // create bubble if there is a word limit that's hit
          if ( e.keyCode === $.ui.keyCode.SPACE && textboxlist.options.word_limit > 0 ) {

            words = input.value.split(' ');

            // there will always be one additional for empty character after last space
            word_count = words.length - 1;

            if ( word_count >= textboxlist.options.word_limit ) {

              input.value = input.value.substr(0, input.value.length-1 ); // remove trailing character
              textboxlist._create_bubble_from_input( input );
            }

          } // if keycode = space & word_limit > 0

        }, 1 );

        if ( e.keyCode === $.ui.keyCode.ENTER || e.keyCode === $.ui.keyCode.NUMPAD_ENTER ) {
          e.stopPropagation();
          e.preventDefault();
        }

      });

      // make sure clicking dead space goes to input
      this.$_list.bind( 'click', function() {
        $(this).find('input').focus();
      });

      this.$_list.delegate( 'input', 'focus', function() {
        textboxlist._update_hidden( this );
      });

      this._add_input( false );

      return this.$_list;

    }, // _init

    _create_bubble : function( $li, value ) {

      var class_count = 0,
          codes       = this.keycodes,
          ptn         = '';

      // Loop through keys that are meant for separation
      $.each( this.options.create_keys, function( i, code ) {

        // If the keycode is visible, add it to pattern for removal
        if ( codes[ code ] ) {
          ptn += codes[code];
        }

      }); // each create_keys

      // in case anything skips a beat, remove any delimiters
      ptn   = new RegExp( "[" + ptn + "]+", 'gi' );
      value = value.replace( ptn, '' );

      // Redefine $li since _make_bubble will make one for you, if $li did not get passed in
      $li = this._make_bubble( $li, value );

      $li.addClass( 'ui-textboxlist-bit-done' );

      this._update_hidden_text();

      // TODO: refactor so this returns $li and another function can take the $li and send back the remove bit
      return $li.find( '.ui-textboxlist-deletebutton' );

    }, // _create_bubble

    _good_value : function( value ) {

      value = value.toString();

      var lower_value = value.toLowerCase();

      if ( $.inArray( lower_value, this.options.blacklist ) !== -1 ) {
        this.element.trigger( 'textboxlist.blacklisted', [ value ] );
        return false;
      }

      if ( value === '' || value.match( /^\s+$/ ) ) {

        this.element.trigger( 'textboxlist.empty', [ value ] );
        return false;

      }

      if ( !this.options.allow_numbers && value.match( /^\d+$/ ) ) {
        this.element.trigger( 'textboxlist.numbersonly', [ value ] );
        return false;
      }

      if ( value.length < this.options.min_length ) {

        this.element.trigger( 'textboxlist.min_length', [ value ] );
        return false;

      }

      // This should be last always or it may try to say limit is hit on a bad value
      if ( this.options.limit && this.dataArray().length >= this.options.limit ) {
        this.element.trigger( 'textboxlist.limitHit', [ value ] );
        return false;
      }

      return true;

    }, // _good_value

    _create_bubble_from_input : function( input, auto_focus ) {

      auto_focus = ( auto_focus === false ) ? false : true;

      var value       = input.value,
          $input      = $(input),
          $li         = $input.parent();

      if( !this._good_value( value ) ) {
        return;
      }


      $li.html( value );

      this._create_bubble( $li, value );

      return this._add_input( auto_focus );

    }, // _create_bubble_from_input

    _remove_bubble : function( e ) {

      var $parent     = e.data.parent,
          textboxlist = e.data.that;

      $parent.remove();

      textboxlist._update_hidden_text();

      e.stopPropagation();

      textboxlist.element.trigger( 'textboxlist.removedBit', [$parent] );

      if ( textboxlist.options.limit && textboxlist.dataArray().length < textboxlist.options.limit ) {
        textboxlist.element.trigger( 'textboxlist.limitNotHit' );
      }

    }, // _remove_bubble

    _update_hidden : function( input ) {

      this.$_hidden_width[0].innerHTML = input.value;

      var hidden_width = this.$_hidden_width.width() + this.options.char_buffer;

      input.style.width = ( hidden_width < 50 ) ? '50px' : hidden_width + 'px';

    }, // _update_hidden

    _add_item : function( $before ) {

      var $li         = $('<li />');

      if ( $before && $before.length ) {
        $before.before( $li );
      }
      else {
        this.$_list.append( $li );
      }

      $li.addClass('ui-textboxlist-bit');

      return $li;

    },

    _add_input : function( auto_focus ) {

      auto_focus = ( auto_focus === false ) ? false : true;

      var $input        = this.$_list.find( '.ui-textboxlist-bit-input' ),
          textboxlist   = this,
          $li           = this._add_item(),
          $input_parent = $input.parent();

      if ( !$input.length ) {
        $input = $('<input type="text" />');
      }
      else {
        $input_parent.remove();
      }

      $li.append( $input );

      $input.addClass('ui-textboxlist-bit-input');

      if ( auto_focus === true ) {

        // for some reason IE8 won't autofocus withotu a timeout
        if ( $.browser.msie && $.browser.version <= 8 ) {
          setTimeout( function() { $input.focus(); });
        }
        else {
          $input.focus();
        }

      } // if aut_focus === true

      return $input;

    }, // _add_input

    _update_hidden_text : function() {

      var vals = [];

      this.$_list.find( '.ui-textboxlist-bit-done').each( function() {
        vals[vals.length] = $(this).text();
      });

      this.element.val( vals.join(',') );

      this.element.trigger('textboxlist.change');

    }, // _update_hidden_text

    list : function() {
      return this.$_list;
    },

    addValue : function( value ) {

      if( !this._good_value( value ) ) {
        return;
      }

      var $li = this._add_item( this.$_list.find('.ui-textboxlist-bit-input').closest('li') );

      return this._create_bubble( $li, value );

    }, // addValue
    fieldValue : function() {
      return this.$_list.find( 'input' ).last().val();
    }, // fieldValue

    dataArray : function() {

      var vals = [],
          textboxlist = this;

      this.$_list.find( '.ui-textboxlist-bit-done').each( function() {

        var value       = $(this).text(),
            lower_value = value.toLowerCase();

        if ( $.inArray( lower_value, textboxlist.options.blacklist ) === -1 ) {
          vals[vals.length] = value;
        }

      }); // done each

      return vals;

    } // dataArray

  })); // widget

})(jQuery);

/* =========================================================
 * HappyR Dialog is based on bootstrap modal by Twitter Inc.
 *
 * Documentation and examples is found at http://developer.happyr.se
 * @license MIT
 * =========================================================
 * The MIT License (MIT)
 *
 * Copyright (c) 2013 <HappyRecruiting, Twitter Inc>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
 * documentation files (the "Software"), to deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of
 * the Software.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
 *  THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 *  TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 *  SOFTWARE.
 *
 * ========================================================= */


!function ($) {

    "use strict"; // jshint ;_;


    /**
     * Constructor for happyr-dialogs
     * @param element
     * @param options
     * @constructor
     */
    var HappyrDialog = function (element, options) {
	    var that=this;
        this.options = options;
        this.$element = $(element);

        this.$element.delegate('[data-dismiss="happyr-dialog"]', 'click.dismiss.happyr-dialog', $.proxy(this.hide, this));

        this.$element.hide();


        //add stuff to the dialog
        happyrDialog_addWrapper(this.$element, options);


        if(this.options.remote){
            var $dialogBody=this.$element.find('.happyr-dialog-body');

            //add loader image
            if(options.loaderImage !== undefined){
                $dialogBody.html('<img class="happyr-dialog-loader" src="'+options.loaderImage+'" />');
            }

			/**
			* What to do when ajax content is loaded
			*/
			var ajaxContentLoaded=function(){
				if( options.submitFormOnConfirm ){
					that.$element.trigger('ajax-loaded');

                    //run callback
                    if(that.options.ajaxCallback != undefined){
                        happyrDialog_runCallback(that.options.ajaxCallback, $(element));
                    }
					
                    var $form=$('form', that.$element);
                    if($form.length > 0){
                        //remove previous listeners
                        $(document).off('happyr-dialog-confirm.submit-dialog');

                        //add new listener
                        $(document).one('happyr-dialog-confirm.submit-dialog', function(){
                            if(options.getFormResultInDialog){
                                $.ajax({
                                    type: $form.attr('method') ? $form.attr('method'): 'POST',
                                    url: $form.attr('action'),
                                    data: $form.serialize(),
                                    success: function (data) {
                                        if(options.hideAfterFormSubmit && options.validateFormResponse(data)){
                                            $("#happyr-dialog").happyrDialog('hide');
                                            //we dont need to run any more code..
                                            return;
                                        }

                                        $dialogBody.html(data);
										ajaxContentLoaded();
                                    }
                                });
                            }
                            else if(options.hideAfterFormSubmit){
                                $form.submit();
                                $("#happyr-dialog").happyrDialog('hide');
                            }
                        });
                    }
                }
			}
			
			//there is a bug i jQuery that strips form tags when you do load..
			//$dialogBody.load(this.options.remote, ajaxContentLoaded);
			$.get(this.options.remote,function(response){
				//clear the body
				$dialogBody.html("");
				$dialogBody.append(response);
								
				ajaxContentLoaded();
			});
        }
    };


    HappyrDialog.prototype = {

        constructor: HappyrDialog,

        /**
         * Toggle show/hide
         * @returns {*}
         */
        toggle: function () {
            return this[!this.isShown ? 'show' : 'hide']();
        },

        /**
         * Show dialog
         */
        show: function () {
            var that = this;
            var e = $.Event('show');

            this.$element.trigger(e);

            if (this.isShown || e.isDefaultPrevented()) {
                return;
            }

            this.isShown = true;
            this._enableEscape();


            if (!that.$element.parent().length) {
                that.$element.appendTo(document.body); //don't move dialogs dom position
            }

            var triggerShowEvents=function () {
                that.$element.focus().trigger('shown');
                $(document).trigger('happyr-dialog-shown');
            };

            var showDialog=function(){
                that.$element.show();
                that.$element.attr('aria-hidden', false);
                that.enforceFocus();
            }

            this._showBackdrop();
            if(that.options.animate){
                that.$element
                    .css('opacity',0)
                    .css('top','-25%');

                showDialog();
                that.$element.animate({ top: '10%', opacity: '1' },
                    that.options.animation.timeDialogShow, 'swing', triggerShowEvents);

            }
            else{
                showDialog();
                triggerShowEvents();
            }


        },

        /**
         * Hide dialog
         * @param e
         */
        hide: function (e) {
            if(e){
                e.preventDefault();
            }

            var that = this;
            e = $.Event('hide');
            this.$element.trigger(e);

            if (!this.isShown || e.isDefaultPrevented()) {
                return;
            }

            this.isShown = false;
            this._enableEscape();
            $(document).off('focusin.happyr-dialog');

            var hideDialog=function(){
                that.$element.attr('aria-hidden', true);
                that.$element.hide();
                that.$element.trigger('hidden');
                $(document).trigger('happyr-dialog-close');
            };

            this._hideBackdrop();
            if(that.options.animate){
                that.$element.animate({ top: '-25%', opacity: '0' }, that.options.animation.timeDialogHide, 'swing',hideDialog);
            }
            else{
                hideDialog();
            }

        },

        /**
         * Focus on dialog
         */
        enforceFocus: function () {
            var that = this;
            $(document).on('focusin.happyr-dialog', function (e) {
                if(that.options.enforceFocus){
                    if (that.$element[0] !== e.target && !that.$element.has(e.target).length) {
                        that.$element.focus()
                    }
                }
            });
        },

        /**
         * Enable to hide the dialog when escape key is pressed
         * @private
         */
        _enableEscape: function () {
            var that = this
            if (this.isShown && this.options.keyboard) {
                this.$element.on('keyup.dismiss.happyr-dialog', function ( e ) {
                    e.which == 27 && that.hide()
                })
            } else if (!this.isShown) {
                this.$element.off('keyup.dismiss.happyr-dialog')
            }
        },


        /**
         * Crete the backdrop and show it
         * @private
         */
        _showBackdrop: function () {
            var that = this;

            if (this.options.backdrop) {

                this.$backdrop = $('<div class="happyr-dialog-backdrop" style="display:none" />')
                    .appendTo(document.body);


                this.$backdrop.click(
                    this.options.backdrop == 'static' ?
                        $.proxy(this.$element[0].focus, this.$element[0])
                        : $.proxy(this.hide, this)
                );


                if(this.options.animate){
                    //set opacity = 0
                    this.$backdrop.css('opacity',0);
                    this.$backdrop.show();

                    //fade to 0.8
                    this.$backdrop.fadeTo(
                        that.options.animation.timeBackdropShow,
                        that.options.animation.opacityBackdrop
                    );
                }
                else{
                    this.$backdrop.show();
                }
            }
        },

        /**
         * Hide and remove backdrop
         * @private
         */
        _hideBackdrop: function(){
            if (!this.$backdrop) {
                return;
            }

            var that = this;

            var removeBackdrop=function(){
                that.$backdrop && that.$backdrop.remove();
                that.$backdrop = null;
            }

            //should we animate it away?
            if(this.options.animate){
                //fade to 0
                this.$backdrop.fadeTo(that.options.animation.timeDialogHide,0,removeBackdrop);
            }
            else{
                removeBackdrop();
            }

        }
    };



    $.extend({
        /**
         * Add function to easy extend the settings
         * @param settings
         */
        happyrDialogSetDefaults: function(settings){
            $.fn.happyrDialog.defaults=$.extend(
                true,
                $.fn.happyrDialog.defaults,
                settings
            );
        }
    });

    // save current dialog impl
    var old = $.fn.happyrDialog;

    /**
     * Register the plugin with jQuery and make sure it works as expected
     * @param option
     * @returns {*}
     */
    $.fn.happyrDialog = function (option) {

        return this.each(function () {
            var $this = $(this);
            var data = $this.data('happyrDialog');
            var options = $.extend(true,  {}, $.fn.happyrDialog.defaults, $this.data(), typeof option === 'object' && option);

            //if no dialog or not dialog visible
            if(!data || !data.isShown){
                //create dialog
                $this.data('happyrDialog', (data = new HappyrDialog(this, options)));
            }

            if (typeof option === 'string') {
                data[option]();
            }
            else if(option !== undefined && option.action !== undefined){
               data[option.action]();
            }
            else if (options.show) {
                data.show();
            }

        });
    };

    /**
     * Default options
     */
    $.fn.happyrDialog.defaults = {
        animate: true,
        animation: {
            timeBackdropShow: 200,
            timeBackdropHide: 200,
            timeDialogShow: 300,
            timeDialogHide: 300,
            opacityBackdrop: 0.8
        },
        backdrop: true,
        enforceFocus: true,
        hideAfterFormSubmit: false,
        keyboard: true,
        show: true,
        showHeader: true,
        showFooter: true,
        showButtonClose: true,
        showButtonConfirm: true,
        showButtonHeaderClose: true,
        showTitle: true,
        submitFormOnConfirm: true,
        texts: {
            close: 'Close',
            confirm: 'Confirm'
        },
        getFormResultInDialog: true,
        validateFormResponse: function(){
            return false;
        }
    };

    $.fn.happyrDialog.Constructor = HappyrDialog;



    /**
     * Just ignore if the object is initialized again
     *
     * @returns this
     */
    $.fn.happyrDialog.noConflict = function () {
        $.fn.happyrDialog = old;
        return this;
    };


    /**
     * Auto add dialog if clickable element data-toggle="happyr-dialog" is defined
     */
    $(document).on('click.happyr-dialog.data-api', '[data-toggle="happyr-dialog"]', function (e) {
        var $this = $(this);
        var href = $this.attr('href');
        var $target = $($this.attr('data-target') || (href && !href.match(/[?=\/&]/) && href.replace(/.*(?=#[^\s]+$)/, ''))); //strip for ie7
        var elementSettings=happyrDialog_convertStringToObject($this.attr('data-happyr-dialog-settings'));

        if($this.attr('data-happyr-dialog-title')){
            elementSettings.texts=$.extend(true, elementSettings.texts,
                {title: $this.attr('data-happyr-dialog-title')});
        }

        elementSettings=$.extend(true,
            {
                remote:!/#/.test(href) && href,
                action: 'toggle'
            },
            $target.data(),
            $this.data(),
            elementSettings
        );


        //make sure the button/link does not behave as normal
        e.preventDefault();

        //if no target found
        if($target.length === 0){
            //try to get autogenerated
            $target=$("#happyr-dialog");

            //if target still not found
            if($target.length === 0){
                //Create a target
                $target=$('<div id="happyr-dialog" style="display:none" tabindex="-1" role="dialog" aria-hidden="true" />')
                    .appendTo(document.body);
            }
        }


        $target
            .happyrDialog(elementSettings)
            .one('hide', function () {
                $this.focus();
            });
    });


    /**
     * Take a string like "{ hello: 'world', places: ['Africa', 'America', 'Asia', 'Australia'] }" and
     * convert it to an object
     *
     * @param string
     * @returns Object
     */
    function happyrDialog_convertStringToObject(string){
        if(string === undefined || string === ""){
            return {};
        }
        return JSON.parse(JSON.stringify(eval("("+string+")")));
    }


    /**
     * Add header, footer and content to the dialog
     * @param $element
     * @param options
     */
    function happyrDialog_addWrapper($element,options){
        //save the current content
        var body;
        if($('.happyr-dialog-body',$element).length > 0){
            body=$element.find('.happyr-dialog-body').html();
        }
        else{
            body=$element.html();
        }

        //Clear the contents
        $element.html("");

        //add wrapper
        $element.addClass("happyr-dialog");

        if(options.showHeader){
            happyrDialog_addHeader($element,options);
        }

        //add the body
        var $bodyWrapper=$("<div></div>").addClass('happyr-dialog-body').append(body);

        $element.append($bodyWrapper);

        if(options.showFooter){
            happyrDialog_addFooter($element,options);
        }
    }

    /**
     * Add a header on the dialog
     *
     * @param $element
     * @param options
     */
    function happyrDialog_addHeader($element,options){
        //start header
        var $header=$("<div></div>").addClass('happyr-dialog-header');

        if(options.showTitle && options.texts.title !== undefined){
            //add heading
            var $title=$("<h3>"+options.texts.title+"</h3>");
            $header.append($title);
        }

        if(options.showButtonHeaderClose){
            //add close button
            var $closeButton=$("<button type='button' class='close' title='"+options.texts.close+"' data-dismiss='happyr-dialog' aria-hidden='true'>x</button>");
            $header.append($closeButton);
        }

        //add clear fix
        $header.append($("<div></div>").addClass("happyr-dialog-clearfix"));

        //end header
        $element.append($header);
    }

    /**
     * Add the footer
     *
     * @param $element
     * @param options
     */
    function happyrDialog_addFooter($element, options){

        var $wrapper=$("<div></div>").addClass('happyr-dialog-footer');
        var $footer=$("<div></div>").addClass("padder");

        if(options.showButtonClose){
            //add buttons
            var $closeButton=$("<button class='btn' data-dismiss='happyr-dialog' aria-hidden='true'>"+options.texts.close+"</button>");
            $closeButton.click(function(){
                happyrDialog_runCallback(options.closeCallback, $element);
            });
            $footer.append($closeButton);
        }

        if(options.showButtonConfirm){
            var $confirmButton=$("<button class='btn btn-primary'>"+options.texts.confirm+"</button>");
            $confirmButton.click(function(){
                $(document).trigger('happyr-dialog-confirm');
                happyrDialog_runCallback(options.confirmCallback, $element);
            });
            $footer.append($confirmButton);
        }


        $wrapper.append($footer);
        $element.append($wrapper);
    }

    /**
     * Run a callback function with parameter..
     *
     * @param callback
     * @param param
     */
    function happyrDialog_runCallback(callback, param){

        if(typeof callback === 'function'){
            return callback(param);
        }

        var fn = window[callback];
        if(typeof fn === 'function') {
            return fn(param);
        }
    }


}(window.jQuery);

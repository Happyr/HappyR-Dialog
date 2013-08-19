/* =========================================================
 * HappyR Dialog is based on bootstrap modal by Twitter Inc.
 *
 * Documentation and examples is found at http://developer.happyr.se
 *
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

            $dialogBody.load(this.options.remote, function(){
                if( options.submitFormOnConfirm ){

                    var $form=$('form', $(this));
                    if($form.length>0){
                        $(document).on('happyr-dialog-confirm', function(e){

                            if(options.getFormResultInDialog){
                                $.ajax({
                                    type: $form.attr('method'),
                                    url: $form.attr('action'),
                                    data: $form.serialize(),
                                    success: function (data) {
                                        $dialogBody.html(data);
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

            this.escape();

            this.backdrop(function () {

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

            });
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
            this.escape();
            $(document).off('focusin.happyr-dialog');

            var hideDialog=function(){
                that.$element.attr('aria-hidden', true);
                that.hideDialog();
            };

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
                if (that.$element[0] !== e.target && !that.$element.has(e.target).length) {
                    that.$element.focus()
                }
            });
        },

        /**
         * Enable to hide the dialog when escape key is pressed
         */
        escape: function () {
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
         * Hide the dialog
         */
        hideDialog: function () {
            var that = this;
            this.$element.hide();
            this.backdrop(function () {
                that.removeBackdrop()
                that.$element.trigger('hidden')
            })
        },

        /**
         * Remove the backdrop
         */
        removeBackdrop: function () {
            this.$backdrop && this.$backdrop.remove();
            this.$backdrop = null;
        },

        /**
         * Crete the backdrop and run a callback
         * @param callback
         */
        backdrop: function (callback) {
            var that = this;

            if (this.isShown && this.options.backdrop) {

                this.$backdrop = $('<div class="happyr-dialog-backdrop" style="display:none" />')
                    .appendTo(document.body);


                this.$backdrop.click(
                    this.options.backdrop == 'static' ?
                        $.proxy(this.$element[0].focus, this.$element[0])
                        : $.proxy(this.hide, this)
                );


                if(this.options.animation){
                    //set opacity = 0
                    this.$backdrop.css('opacity',0);
                    this.$backdrop.show();

                    //fade to 0.8
                    this.$backdrop.fadeTo(
                        that.options.animation.timeBackdropShow,
                        that.options.animation.opacityBackdrop,
                        callback
                    );
                }
                else{
                    this.$backdrop.show();
                    callback();
                }
            } else if (!this.isShown && this.$backdrop) {
                if(this.options.animation){
                    //fade to 0
                    this.$backdrop.fadeTo(that.options.animation.timeDialogHide,0,callback);
                }
                else{
                    callback();
                }

            } else if (callback) {
                callback();
            }
        }
    };


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
            var options = $.extend({}, $.fn.happyrDialog.defaults, $this.data(), typeof option === 'object' && option);

            //if no dialog or not dialog visible
            if(!data || !data.isShown){
                //create dialog
                $this.data('happyrDialog', (data = new HappyrDialog(this, options)));
            }

            if (typeof option === 'string') {
                data[option]();
            }
            else if(option.action !== undefined){
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
        keyboard: true,
        show: true,
        showHeader: true,
        showFooter: true,
        showCloseButton: true,
        showConfirmButton: true,
        showHeaderCloseButton: true,
        showHeaderTitle: true,
        submitFormOnConfirm: true,
        texts: {
            close: 'Close',
            confirm: 'Confirm'
        },
        getFormResultInDialog: true,
        hideAfterFormSubmit: false
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
        elementSettings=$.extend(
            {
                remote:!/#/.test(href) && href,
                action: 'toggle'
            },
            $target.data(),
            $this.data(),
            elementSettings
        );
        console.log(elementSettings);


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

        if(options.animation){
            $element.addClass("happyr-dialog-animation");
        }


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

        if(options.showHeaderTitle && options.texts.title !== undefined){
            //add heading
            var $title=$("<h3>"+options.texts.title+"</h3>");
            $header.append($title);
        }

        if(options.showConfirmButton){
            //add close button
            var $closeButton=$("<button type='button' class='close' data-dismiss='happyr-dialog' aria-hidden='true'>x</button>");
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
    function happyrDialog_addFooter($element,options){

        var $footer=$("<div></div>").addClass('happyr-dialog-footer');

        if(options.showCloseButton){
            //add buttons
            var $closeButton=$("<button class='btn' data-dismiss='happyr-dialog' aria-hidden='true'>"+options.texts.close+"</button>");
            $footer.append($closeButton);
        }

        if(options.showConfirmButton){
            var $confirmButton=$("<button class='btn btn-primary'>"+options.texts.confirm+"</button>");
            $confirmButton.click(function(e){
                $(document).trigger('happyr-dialog-confirm');
            });
            $footer.append($confirmButton);
        }


        $element.append($footer);
    }


}(window.jQuery);

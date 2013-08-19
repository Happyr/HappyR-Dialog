/* =========================================================
 * bootstrap-modal.js v2.3.2
 * http://getbootstrap.com/2.3.2/javascript.html#modals
 * =========================================================
 * Copyright 2013 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================= */


!function ($) {

    "use strict"; // jshint ;_;

    $(function () {

        $.support.transition = (function () {

            var transitionEnd = (function () {

                var el = document.createElement('bootstrap');
                var  transEndEventNames = {
                        'WebkitTransition' : 'webkitTransitionEnd',
                        'MozTransition'    : 'transitionend',
                        'OTransition'      : 'oTransitionEnd otransitionend',
                        'transition'       : 'transitionend'
                    };
                var name;

                for (name in transEndEventNames){
                    if (el.style[name] !== undefined) {
                        return transEndEventNames[name]
                    }
                }

            }())

            return transitionEnd && {
                end: transitionEnd
            }

        })()

    })

}(window.jQuery);

!function ($) {

    "use strict"; // jshint ;_;


    /**
     * Constructor for happyr-dialogs
     * @param element
     * @param options
     * @constructor
     */
    var HappyrDialog = function (element, options) {
        this.options = options
        this.$element = $(element);

        this.$element.delegate('[data-dismiss="happyr-dialog"]', 'click.dismiss.happyr-dialog', $.proxy(this.hide, this));

        this.$element.hide();


        //add stuff to the dialog
        happyrDialog_addWrapper(this.$element, options);


        if(this.options.remote){
            var $dialogBody=this.$element.find('.happyr-dialog-body');

            //add loader image
            $dialogBody.html('<img class="happyr-dialog-loader" src="'+options.loaderImage+'" />')

            $dialogBody.load(this.options.remote, function(){
                if( options.submitFormOnConfirm ){

                    var $form=$('form', $(this));
                    if($form.length>0){
                        $(document).on('happyr-dialog-confirm', function(e){
                            console.log("Submit the form");

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
    }


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
                var transition = $.support.transition && that.$element.hasClass('happyr-dialog-animation')

                if (!that.$element.parent().length) {
                    that.$element.appendTo(document.body) //don't move dialogs dom position
                }

                that.$element.show()

                if (transition) {
                    that.$element[0].offsetWidth; // force reflow
                }

                that.$element
                    .addClass('happyr-dialog-in')
                    .attr('aria-hidden', false)

                that.enforceFocus()

                transition ?
                    that.$element.one($.support.transition.end, function () { that.$element.focus().trigger('shown') }) :
                    that.$element.focus().trigger('shown')

            });
        },

        /**
         * Hide dialog
         * @param e
         */
        hide: function (e) {
            e && e.preventDefault()

            var that = this

            e = $.Event('hide')

            this.$element.trigger(e)

            if (!this.isShown || e.isDefaultPrevented()) return

            this.isShown = false

            this.escape()

            $(document).off('focusin.happyr-dialog');

            this.$element
                .removeClass('happyr-dialog-in')
                .attr('aria-hidden', true)

            $.support.transition && this.$element.hasClass('happyr-dialog-animation') ?
                this.hideWithTransition() :
                this.hideDialog()
        },

        /**
         * Focus on dialog
         */
        enforceFocus: function () {
            var that = this
            $(document).on('focusin.happyr-dialog', function (e) {
                if (that.$element[0] !== e.target && !that.$element.has(e.target).length) {
                    that.$element.focus()
                }
            })
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
         * Hide the dialog with animation
         */
        hideWithTransition: function () {
            var that = this;
            var timeout = setTimeout(function () {
                    that.$element.off($.support.transition.end)
                    that.hideDialog()
                }, 500);

            this.$element.one($.support.transition.end, function () {
                clearTimeout(timeout)
                that.hideDialog()
            })
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
            var animate = this.$element.hasClass('happyr-dialog-animation') ? 'happyr-dialog-animation' : '';

            if (this.isShown && this.options.backdrop) {
                var doAnimate = $.support.transition && animate

                this.$backdrop = $('<div class="happyr-dialog-backdrop ' + animate + '" />')
                    .appendTo(document.body)

                this.$backdrop.click(
                    this.options.backdrop == 'static' ?
                        $.proxy(this.$element[0].focus, this.$element[0])
                        : $.proxy(this.hide, this)
                )

                if (doAnimate) {
                    // force reflow
                    this.$backdrop[0].offsetWidth;
                }

                this.$backdrop.addClass('happyr-dialog-in')

                if (!callback){
                    return;
                }

                if(doAnimate){
                    this.$backdrop.one($.support.transition.end, callback);
                }
                else{
                    callback();
                }


            } else if (!this.isShown && this.$backdrop) {
                this.$backdrop.removeClass('happyr-dialog-in')

                if($.support.transition && this.$element.hasClass('happyr-dialog-animation')){
                    this.$backdrop.one($.support.transition.end, callback);
                }
                else{
                    callback();
                }


            } else if (callback) {
                callback()
            }
        }
    }


    // save current dialog impl
    var old = $.fn.happyrDialog

    /**
     * Register the plugin with jQuery and make sure it works as expected
     * @param option
     * @returns {*}
     */
    $.fn.happyrDialog = function (option) {

        return this.each(function () {
            var $this = $(this);
            var data = $this.data('happyrDialog');
            var options = $.extend({}, $.fn.happyrDialog.defaults, $this.data(), typeof option == 'object' && option);

            //if no dialog or not dialog visible
            if(!data || !data.isShown){
                //create dialog
                $this.data('happyrDialog', (data = new HappyrDialog(this, options)))
            }

            if (typeof option == 'string') {
                data[option]();
            }
            else if(option.action != undefined){
                data[option.action]();
            }
            else if (options.show) {
                data.show();
            }
        })
    }

    /**
     * Default options
     */
    $.fn.happyrDialog.defaults = {
        backdrop: true,
        loaderImage: '/src/images/loader.gif',
        keyboard: true,
        show: true,
        showHeader: true,
        showFooter: true,
        showCloseButton: 'Close',
        showConfirmButton: 'Confirm',
        showHeaderCloseButton: true,
        showHeaderTitle: true,
        submitFormOnConfirm: true,
        getFormResultInDialog: true,
        hideAfterFormSubmit: false
    }

    $.fn.happyrDialog.Constructor = HappyrDialog



    /**
     * Just ignore if the object is initialized again
     *
     * @returns this
     */
    $.fn.happyrDialog.noConflict = function () {
        $.fn.happyrDialog = old;
        return this;
    }



    /**
     * Auto add dialog if clickable element data-toggle="happyr-dialog" is defined
     */
    $(document).on('click.happyr-dialog.data-api', '[data-toggle="happyr-dialog"]', function (e) {
        var $this = $(this);
        var href = $this.attr('href');
        var $target = $($this.attr('data-target') || (href && !href.match(/[?=]/) && href.replace(/.*(?=#[^\s]+$)/, ''))); //strip for ie7
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


        //make sure the button/link does not behave as normal
        e.preventDefault();

        //if no target found
        if($target.length == 0){
            //try to get autogenerated
            $target=$("#happyr-dialog");

            //if target still not found
            if($target.length == 0){
                //Create a target
                $target=$('<div id="happyr-dialog" style="display:none" tabindex="-1" role="dialog" aria-hidden="true" />')
                    .appendTo(document.body);
            }
        }


        $target
            .happyrDialog(elementSettings)
            .one('hide', function () {
                $this.focus()
            });
    })


    /**
     * Take a string like "{ hello: 'world', places: ['Africa', 'America', 'Asia', 'Australia'] }" and
     * convert it to an object
     *
     * @param string
     * @returns Object
     */
    function happyrDialog_convertStringToObject(string){
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
        $element.append($bodyWrapper)

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

        if(options.showHeaderTitle && options.title != undefined){
            //add heading
            var $title=$("<h3>"+options.title+"</h3>");
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
            var $closeButton=$("<button class='btn' data-dismiss='happyr-dialog' aria-hidden='true'>"+options.showCloseButton+"</button>");
            $footer.append($closeButton)
        }

        if(options.showConfirmButton){
            var $confirmButton=$("<button class='btn btn-primary'>"+options.showConfirmButton+"</button>");
            $confirmButton.click(function(e){
                $(document).trigger('happyr-dialog-confirm');
            })
            $footer.append($confirmButton);
        }


        $element.append($footer);
    }


}(window.jQuery);

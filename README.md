HappyR Dialog
=============

This is a javascript dialog library. The HappyR Dialog depends on jQuery. It is built on Twitter Inc Bootstrap Modal.
Some features of the HappyR Dialog:

* responsive design
* built for Ajax
* highly configurable
* we don't force you to write tons of code of your own

Please browse some of our [examples](http://developer.happyr.se/libraries/jquery-happyr-dialog/examples) and when
you feel confident with the library you may want to have a look at the
[configuration](http://developer.happyr.se/libraries/jquery-happyr-dialog#configuration).

## Installation

The only thing you *need* to do is to import the jQuery library and then the HappyR Dialog library. It is highly
recommended that you import some CSS as well.

```html
<html>
<head>
    <meta charset="utf-8"/>
    <link rel="stylesheet" type="text/css" href="/css/happyr-dialog.min.css" />
</head>
<body>
    <a href="#myDialog" data-toggle="happyr-dialog">
        Open dialog
    </a>
    <div id="myDialog" style="display:none">
        <p>Dialog contents.</p>
    </div>

    <script src="http://code.jquery.com/jquery-latest.js"></script>
    <script src="/js/happyr-dialog.min.js"></script>

    <!-- My other js stuff -->
    <script src="/js/common.js"></script>
</body>
</html>

```

### Override default settings

The library has a quite a few settings and the defaults are not always suitable to you. There is two ways of to define
settings: Globally and per dialog.

To change settings globally use the jQuery.extend

```js
// js/common.js
$.extend($.fn.happyrDialog.defaults,{
    backdrop: 'static',
    title: 'Awesome dialog'
});

```

To change settings per dialog use the 'data-happyr-dialog-settings' attribute on a DOM.
```html
<a href="ajax.htm" data-toggle="happyr-dialog"
    data-happyr-dialog-settings="{backdrop: false, showFooter: false}" >
    Open dialog
</a>

```

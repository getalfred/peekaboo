"use strict";
var page = require('webpage').create(),
    system = require('system'),
    address, output, size, pageWidth, pageHeight, targetSelector;
if (system.args.length < 3 || system.args.length > 4) {
    console.log('Usage: screenshot.js URL filename [css selector|xpath:path]');
    console.log('example: phatomjs screenshot.js https://google.com image.png img');
    console.log('example: phatomjs screenshot.js https://google.com image.png xpath://img');
    phantom.exit(1);
} else {
    address = system.args[1];
    output = system.args[2];
    pageWidth = parseInt('1024px', 10);
    pageHeight = parseInt('768px', 10); // it's as good an assumption as any
    page.viewportSize = { width: pageWidth, height: pageHeight };


    if (system.args.length > 3) {
        targetSelector = system.args[3];
    }

    console.log('open: ' + address);
    console.log('selector: ' + targetSelector);
    page.open(address, function (status) {
        if (status !== 'success') {
            console.log('Unable to load the address!');
            phantom.exit(1);
        } else {
            var rect = page.evaluate(function (selector) {
                document.body.bgColor = "white";
                if (selector === undefined) {
                    return null;
                }
                console.log(selector)
                var elem
                if(selector.indexOf("xpath:") == 0){
                    elem = document.evaluate(selector.substr(6), document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                } else {
                    elem = document.querySelector(selector);
                }
                return (elem !== null) ? elem.getBoundingClientRect() : null;

            }, targetSelector)

            if (rect !== null) {
                page.clipRect=rect;
            }

            // Set a timeout to give the page a chance to render
            setTimeout(function () {
                console.log("write: "+output)
                page.render(output);
                phantom.exit(1);
            }, 250);
        }
    });
}

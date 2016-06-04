"use strict";
var page = require('webpage').create(),
    system = require('system'),
    fs = require('fs'),
    address, imagePath, size, pageWidth, pageHeight, targetSelector;

if (system.args.length < 3 || system.args.length > 4) {
    console.log('Usage: screenshot.js URL filename [css selector|xpath:path]');
    console.log('example: phatomjs screenshot.js https://google.com image.png img');
    console.log('example: phatomjs screenshot.js https://google.com image.png xpath://img');
    phantom.exit(1);
} else {
    address    = system.args[1];
    imagePath  = system.args[2];
    pageWidth  = 1024;
    pageHeight = 768;
    page.viewportSize = { width: pageWidth, height: pageHeight };

    if (system.args.length > 3) {
        targetSelector = system.args[3];
    }

    console.log('open: ' + address);
    console.log('selector: ' + targetSelector);

    page.settings.resourceTimeout = 5000; // 5 seconds
    page.onResourceTimeout = function(e) {
        console.log("resourceTimeout: ")
        console.log(e.errorCode);   // it'll probably be 408
        console.log(e.errorString); // it'll probably be 'Network timeout on resource'
        console.log(e.url);         // the url whose request timed out
        phantom.exit(1);
    };

    page.open(address, function (status) {
        if (status !== 'success') {
            console.log('Unable to load the address!');
            phantom.exit(1);
        } else {
            var getElementInfo = function (selector) {
                document.body.bgColor = "white";
                var elem
                if(selector.indexOf("xpath:") == 0){
                    elem = document.evaluate(selector.substr(6), document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                } else if( selector !== undefined) {
                    elem = document.querySelector(selector);
                }

                if(elem != null){
                    return {
                        "rect": elem.getBoundingClientRect(),
                        "text": elem.innerText,
                        "html": elem.innerHTML
                    }

                } else {
                    return {
                        "rect": null,
                        "text": document.body.innerText,
                        "html": document.body.innerHTML
                    }
                }
            }

            var result = page.evaluate(getElementInfo , targetSelector);
            if (result.rect !== null) {
                page.clipRect=result.rect;
            }

                // Set a timeout to give the page a chance to render
            setTimeout(function () {
                console.log("write: "+imagePath)
                page.render(imagePath);

                var outputBase = imagePath.match(/(.*)\..*/)[1]
                fs.write(outputBase+".txt",  result.text, 'w');
                phantom.exit(1);
            }, 500);
        }
    });
}

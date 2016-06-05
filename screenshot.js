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

    page.settings.resourceTimeout = 10000; // 10 seconds
    page.settings.userAgent = 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.101 Safari/537.36'

    page.onResourceTimeout = function(e) {
        console.log("resourceTimeout: ")
        console.log(e.errorCode);   // it'll probably be 408
        console.log(e.errorString); // it'll probably be 'Network timeout on resource'
        console.log(e.url);         // the url whose request timed out
        phantom.exit(1);
    };

    page.onError = function(msg, trace) {
        var msgStack = ['ERROR: ' + msg];
        if (trace && trace.length) {
            msgStack.push('TRACE:');
            trace.forEach(function(t) {
                msgStack.push(' -> ' + t.file + ': ' + t.line + (t.function ? ' (in function "' + t.function +'")' : ''));
            });
        }
        console.error(msgStack.join('\n'));
    };

    page.onResourceError = function(resourceError) {
        console.log('Unable to load resource (#' + resourceError.id + 'URL:' + resourceError.url + ')');
        console.log('Error code: ' + resourceError.errorCode + '. Description: ' + resourceError.errorString);
    };

    page.open(address, function (status) {
        if (status !== 'success') {
            console.log('Unable to load the address!');
            phantom.exit(1);
        } else {
            var getElementInfo = function (selector) {
                document.body.bgColor = "white";
                var elem
                if( selector !== undefined) {
                    if(selector.indexOf("xpath:") == 0){
                        elem = document.evaluate(selector.substr(6), document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                    } else if( selector !== '' ) {
                        elem = document.querySelector(selector);
                    }
                }

                if(elem != null){
                    return {
                        "rect": elem.getBoundingClientRect(),
                        "text": elem.innerText
                    }

                } else {
                    return {
                        "rect": null,
                        "text": document.body.innerText
                    }
                }
            }

        			var hitBottom = false;
            var scrollDown = function () {
				page.scrollPosition = { top: page.scrollPosition.top + pageHeight, left: 0 };

				return hitBottom = page.evaluate(function(currentY) {
					return document.body.scrollHeight <=  currentY
				}, page.scrollPosition.top );
			}

            // Set a timeout to give the page a chance to render
            var screenshot = function () {
				// reset scroll
                page.scrollPosition = {
                    top: 0,
                    left: 0
                };

				// clip selector element
				var result = page.evaluate(getElementInfo , targetSelector);
				if (result.rect !== null) {
					page.clipRect=result.rect;
				}


                console.log("write: "+imagePath)
                page.render(imagePath);

                var outputBase = imagePath.match(/(.*)\..*/)[1]
                fs.write(outputBase+".txt",  result.text, 'w');
                phantom.exit(1);
            }

           var scrollDownInterval = setInterval(function () {
				if(!hitBottom){
					scrollDown();
				}else{
					clearInterval(scrollDownInterval)
					setTimeout(screenshot, 3000);
				}
			}, 250);
        }
    });
}

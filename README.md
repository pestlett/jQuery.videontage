jQuery.videontage
=================

## TODO
1.  Ability to prerender and create image map for a given directory of files
2.  Ability to prerender entire video with high resolution and display, rather than doing it on the fly

videontage is an HTML5 montage generator for videos. You create an image map repository, see example provided on how to generate the image map for a given set of photographs.

## Example usage:

    $('canvas').videontage({
    	imagePath: 'cutts/',
    	imageMap: cuttsMap,
    	cols: $('input#cols').val(),
    	rows: $('input#rows').val(),
    	afterPreload: function (opt) {
    		$('button#play').prop('disabled', null);
    		$('div#loading-message').html("All images preloaded");
    	},
    	duringPreload: function (data) {
    		var max = parseInt( $('div#loader').css('max-width') );
    		var percentage = (data.count / data.total) * max;
    		$('div#loader').css('width', percentage+'px');
    		$('div#loading-message').html( Math.round( ((100 * data.count) / data.total), 2 ) + '% loaded');
    	}
    });

## What is the imagemap?

The image map is a JSON object that contains all the photos to use with the plugin and the dominant colour for each photo. I have used [color-thief-master](https://github.com/Dashboard-X/codropes-examples/tree/master/color-thief-master/color-thief-master) by [dineshkummarc](https://github.com/dineshkummarc) to generate this map. The object is layed out as below:

    {
        "fileIndex": {
            "filename": "file1.jpg",
            "dominantColor": {
                "r":201,
                "g":197,
                "b":201
            }
        },
        ...
    }

## Options
1.	width: integer, if not specified gets width from canvas element itself
2.	height: integer, if not specified gets width from canvas element itself
3.	fps: integer, our FPS, need to better implement this and perhaps add a backbuffer &c. if needed
4.	cols: integer, number of cols(images) to fit across the canvas
5.	rows: integer, Number of rows(images) to fit down the canvas
6.	distance: string, name of function to call when determining which image in the imageMap is closest (minimum value) to the colour vector (called from $.distance object)
7.	afterPreload: function(options), callback function for when the images in the imageMap have all been preloaded
8.	duringPreload: function({ count: n, total: n, currentImage: i }), callback function whilest the images in the imageMap are being preloaded
9.	imageMap: object, the imageMap that contains our images and their colour values, ideally want ~2000 images
10.	imagePath: string, the path to the images in the imageMap

## Methods
1.  update: function(options), will update the options for the next frame of the video

## Example
[Example 1](http://seo09.clickdev.co.uk/rnd/vtm/example/example.html)

## Licence
[WTFPL](http://www.wtfpl.net/about/)

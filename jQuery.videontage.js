/*
 * jQuery videontage 1.0
 *
 *             DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE
 *                   Version 2, December 2004
 *
 * Copyright (C) 2004 Sam Hocevar <sam@hocevar.net>
 *
 * Everyone is permitted to copy and distribute verbatim or modified
 * copies of this license document, and changing it is allowed as long
 * as the name is changed.
 *
 *          DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE
 * TERMS AND CONDITIONS FOR COPYING, DISTRIBUTION AND MODIFICATION
 *
 * 0. You just DO WHAT THE FUCK YOU WANT TO.
 *
 * Author: Martin Jewell
 * Date: 20130310
 */
(function( $, undefined ) {
	"use strict"; // What a load of Crockford :p

	var defaults,
		euclideanDistance, drawFrame, findClosestMatch, preloadResources,
		video, canvas, ctx, images, opts;

	video = ctx = canvas = null;
	images = {};	// Our images data

	defaults = {
		width: 640,
		height: 320,
		fps: 25,				// Our FPS, need to better implement this and perhaps add a backbuffer &c. if needed
		cols: 32,				// Number of cols(images) to fit across the canvas
		rows: 32,				// Number of rows(images) to fit down the canvas
		distance: 'euclidean',			// Function to call when determining which image in the imageMap is closest (minimum value) to the colour vector
		afterPreload: null,		// Function to call when the images in the imageMap have all been preloaded
		duringPreload: null,	// Function to call while the images in the imageMap are being preloaded
		imageMap: null,			// The imageMap that contains our images and their colour values, ideally want ~2000 images
		imagePath: ''			// The path to the images in the imageMap
	};

	// Create a publically accessible object so people can add their own distance functions as needed
	$.distance = {
		/**
		 * Calculate the euclidean distance between two colour vectors
		 * @param  {object} v1 The colourset vector to compare for
		 * @param  {object} v2 The colourset vector to compare against
		 * @return {double}    The euclidean distance of the two colour vectors
		 */
		'euclidean': function (v1, v2) {
			var internalSum = Math.pow(Math.abs(v1.r - v2.r),2) + Math.pow(Math.abs(v1.g - v2.g), 2) + Math.pow(Math.abs(v1.b - v2.b), 2);
			return Math.sqrt(internalSum);
		}
	};

	/**
	 * Preload all resources contained in the imageMap
	 * @return {void}
	 */
	preloadResources = function () {
		if (opts.imageMap === null) {
			$.error('You must have an image map, please see documentation for more details');
		}

		// http://stackoverflow.com/questions/5533192/how-to-get-object-length-in-jquery
		var len, imageCount;
		len = $.map(opts.imageMap, function(n, i) { return i; }).length;
		imageCount = 0;

		$.each(opts.imageMap, function(i,v){
			var image = new Image();
			$(image).bind("load", function(){
				imageCount++;
				images[i] = image;
				if(imageCount >= len){
					var fn = opts.afterPreload || function () { console.log('Resources Loaded'); };
					(function () {
						fn.call(this, opts);
						$(video).bind("play", drawFrame);
					}());
				}
				if (opts.duringPreload !== null) {
					opts.duringPreload.call(this, {"count": imageCount, "total": len, "currentImage": image});
				}
			});
			image.src = opts.imagePath+v.filename;
		});
	};

	/**
	 * Return the index of the closest match in the imageMap to the current colour
	 * @param  {object} color The colour vector for which we want to find a match
	 * @return {mixed}        The index of the matched image in the imageMap
	 */
	findClosestMatch = function (color) {
		var closest, closestData, images, fn;

		closest = closestData = null;
		images = opts.imageMap;
		fn = $.distance[opts.distance] || $.distance['euclidean'];

		// Check each image in the image map and find which one has the shortest distance according to the function we use
		$.each(images, function (i,v) {
			if (closest === null || fn.call(this, color, v.dominantColor) < fn.call(this, color, closestData)) {
				closest = i;
				closestData = v.dominantColor;
			}
		});

		return closest;
	};

	/**
	 * Draws the frame to the canvas
	 * @param  {event} ev Play event object
	 * @return {void}
	 */
	drawFrame = function (ev) {
		if (video === null || ctx === null) return false;
		if (video.get(0).paused || video[0].ended) return false;

		ctx.drawImage(video[0], 0, 0, opts.width, opts.height);

		var imageData, pixels, numTileRows, numTileCols, tileHeight, tileWidth;

		// Get our frame data
		imageData = ctx.getImageData(0, 0, opts.width, opts.height);
		pixels = imageData.data;

		ctx.clearRect(0, 0, opts.width, opts.height);
		numTileCols = opts.cols;
		numTileRows = opts.rows;
		tileWidth = imageData.width / numTileCols;
		tileHeight = imageData.height / numTileRows;

		for (var r = 0; r < numTileRows; r++) {
			for (var c = 0; c < numTileCols; c++) {
				var x, y, cx, cy, pos, red, green, blue, index;

				cx = c * tileWidth;
				cy = r * tileHeight;
				x = cx + (tileWidth >> 1);
				y = cy + (tileHeight >> 1);
				// http://jsperf.com/debunk-division-by-multiplication/5
				// Hi-jacked wrong pref, but ah well
				pos = ((y << 0) * (imageData.width << 2)) + ((x << 0) << 2);

				red = pixels[pos];
				green = pixels[pos+1];
				blue = pixels[pos+2];

				index = findClosestMatch ({r:red, b:blue, g:green});

				ctx.drawImage(images[index], cx, cy, tileWidth, tileHeight);
			}
		}
		setTimeout(drawFrame, opts.fps); // Can probably improve this to actually get the desired FPS
	};

	var methods = {
		init: function (options) {
			options = $.extend({}, options);
			opts = $.extend(defaults, options);
			// If no width has been specified and there is a width on the canvas element, use that rather than the default
			if (options.width === undefined) {
				if (this.prop('width') !== undefined) {
					opts.width = this.prop('width');
				}else if ($(this).width() !== undefined){
					opts.width = $(this).width();
				}
			}
			// If no height has been specified and there is a height on the canvas element, use that rather than the default
			if (options.height === undefined) {
				if (this.prop('height') !== undefined) {
					opts.height = this.prop('height');
				}else if ($(this).height() !== undefined){
					opts.height = $(this).height();
				}
			}

			return this.each(function () {
				var $this;
				$this = $(this);

				canvas = $this[0];
				ctx = canvas.getContext('2d');
				video = $(canvas).find('video');

				// Video element must be placed inside the canvas
				if (video === null || video[0] === undefined) {
					$.error('You must have a video element inside the canvas element');
				}

				preloadResources();
			});
		},

		/**
		 * Update the options with whatever is inserted
		 * @param  {object} updatedOpts An object contains values to alter
		 * @return {void}
		 */
		update: function (newOptions) {
			newOptions = $.extend({}, newOptions);
			opts = $.extend(opts, newOptions);
		}
	};

	// http://docs.jquery.com/Plugins/Authoring#Plugin_Methods
	$.fn.videontage = function (method) {
		if ( methods[method] ) {
            return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
        } else if ( typeof method === 'object' || ! method ) {
            // Default to "init"
            return methods.init.apply( this, arguments );
        } else {
            $.error( 'Method ' +  method + ' does not exist on jQuery.videontage' );
        }
	};
}( jQuery ));

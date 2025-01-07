---
title: "A Walk in the Woods"
layout: page
date: 2024-12-11
---

# The woods

We have some rural property outside Caledon East, Ontario. It was
purchased by Joan's grandfather after the Second World War. It was a
100 acre more-or-less square lot, but is now an 'L'-shaped 55 acres,
outlined in green in the image below. There are two cabins on the
property. The all-season 'Hill' cabin is to the west, the summer
'Pond' cabin to the south. The Pond cabin is adjacent to an artificial
pond Joan's grandfather built after [Hurricane Hazel][hazel] in 1954.

The property is mostly wooded now. Hardwoods appear as relatively open
areas in the 'Satellite' layer, in the north west near the Hill cabin
and in the north east corner of the property. Part of the land south
and east of the Pond cabin is a pine plantation. The topography layer
shows a fairly extensive cedar swamp surrounding small streams running
through the property.

There are a number of trails on the property. One trail goes from the
Hill cabin to the Pond cabin. A second trail loops from the Pond cabin
through the pine plantation and into the hardwoods. An old 'loggers
cabin' (now just a rusted bed) marks the turning point before heading
back. Just before reaching the Pond cabin, there's a small stream and
trail that heads upstream toward the Hill cabin.

The map and satellite imagery below show the property and trail. The
trail is extracted from GPS location information embedded in
photographs.

<div id="map"></div>
<link rel="stylesheet" href="/assets/leaflet/leaflet.css" />
<script type="module" src="./maps.js"></script>

[hazel]: https://en.wikipedia.org/wiki/Hurricane_Hazel

# Walking

The trees in the woods have all kinds of different bark. It was fun to
take a walk, and snap quick pictures as we came across different
textures and colors. The pictures were a bit spontaneous. They are not
particularly in focus or well-framed. I forgot to stamp the location
of each in the picture. There are 84 images taken over about 96
minutes.

The animations displays the images in the order they were encountered,
delayed in proportion to the time between pictures. So it is like we
are encountering them in a virtual forest. Each image starts small,
and grows in size as though one is walking toward it. Then we zoom in
to the center of the picture, because often the texture is really
fascinating. Sometimes the focus isn't so good :(. Images appear,
grow, and zoom at a more-or-less random cell on a fixed 4 x 2
grid. Choice of cells is adjusted to avoid overlap between successive
images. The sequence lasts about 20 minutes, I think...

<div id="sketch-walk-in-the-woods"></div>

I originally introduced images at random locations. They would often
grow over each other, making it difficult to focus on textures when
zoomed in close. But now that the images are so structured, the
display seems too rigid, something that my phone might do when
reviewing an album!

The next iteration introduces trees on the left-hand side. Trees move
to the right following random B&eacute;zier curves. They overlap a
bit, and a strategy might be to introduce a force-directed component
to keep them more separate.

<div id="sketch-walk-in-the-woods-again"></div>
<script type="module" src="./walk-in-the-woods.js"></script>

# Notes

Maps are displayed using [leafletjs][]; the track is extracted from
photos with [exiftool][]. Property boundaries were extracted 'by hand'
from the Assessment layer of the topographic maps available at
Ontario's [Ministry of Natural Resources][mnr].

[leafletjs]: https://leafletjs.com/
[exiftool]: https://exiftool.org/
[mnr]: https://www.ontario.ca/page/topographic-maps

I spent effort learning to work with `p5.loadImage()`. The challenge
is that this is an asynchronous call -- the return value is not the
image, but a promise to return it eventually. Usually `p5.loadImage()`
is called in the `p5.preload()` step, which internally ensures that
images are loaded before the sketch starts. But since I'm loading a
lot of images, I wanted to load them only for the time required in the
sketch. I did learn about JavaScript `async` / `await`, `then()`, and
`Promise`, but in the end it seemed sufficient to use the
`p5.loadImage()` callback to populate an array of 'active' images,
something like

```javascript
const sketch = (p5) => {
    let images = [];

    p5.draw(p5) {

        // Start loading any new images
        if (<condition to start image display>) {
            p5.loadImage(<image url>, (img) => {
                // Image pushed when loaded; not blocking
                images.push(img);
            });
        }

        // Draw loaded images, often several calls to `draw()` after
        // starting to load
        images.forEach(img => <update & draw image>);

        // Remove images that are no longer needed
        images = images.filter(img => <condition to remove image>);

    }

}
```

I'm not completely confident that the use of `images.push()` in the
callback is safe, e.g., because of race conditions.

I had significant problems loading larger images in my development
environment (jekyll page served via ruby's WEBrick server, using
Chrome). It seemed like image loads would not complete, and after
about 8 full-sized images all images remained as 'pending'. I worked
around this using smaller images; later I found that I could use large
images with Safari or with VSCode Live Server without problems. Oh well.

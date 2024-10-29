---
layout: post
title:  "Boogie Woogie Bubble"
date:   2024-10-29
categories: population-genetics javascript
---

The Buffalo AKG [Electric Op][] exhibit reminded me of an [old
folly][], and this is a second iteration. Briefly, I am using a simple
population genetics model of genetic drift with infinite alleles as an
excuse to learn a bit more javascript, including the [p5][] library.

The previous iteration used an individual-based simulation to follow a
population of individuals over time. The innovation here is to follow
classes of individuals, e.g., the half-dozen segregating alleles,
rather than the 1000's of individuals in the population. The
simulation is both smaller and faster, so more realistic population
sizes can be used. The simulation may still have some artistic merit...

<div class="p5-boogie-woogie-bubble-canvas"></div>
<script src="/assets/stdlib-js/random-base-binomial.js"></script>
<script src="/assets/p5/libraries/p5.min.js"></script>
<script src="/assets/p5/boogie-woogie-bubble.js"></script>

The population size N is 10 times larger, and the mutation rate
&mu; 10 times smaller, than in the individual-based simulation. The
number of generations per frame is increased four-fold to 200, and the
frame rate doubled to 24 (200 x 24 = 4800 generations) per second
(available CPU may limit the rate of display).  As before,
'Segregating' alleles are just the number of alleles in the population
at each generation. 'Replacements' summarize how many times a common
allele has been replaced by a new allele.

## Representation

Although the figure is 'mathematical' and in that sense contrasts with
Mondrian's carefully composed paintings, it is useful to reflect on
decisions made during development.

The bubble chart representation is much less frenetic than the grid
used in the individual-based simulation (I could have summarized the
individual-based simulations using bubble charts, but then the
connection to Mondrian would be even less clear). 

Originally I set the maximum bubble diameter to 1/2 the minimum width
or height of the canvas. This meant that new alleles were centered in
a two-dimensional square on the canvas. The simulation above sets the
maximum diameter to the minimum width or height, so when only a single
allele is present its bubble occupies the entire width or height of
the canvas. A corollary is that new alleles are constrained to a
vertical (if the width of the canvas is smaller than the height, as on
a mobile device) or horizontal (width larger than height, as in a
browser) line. This further simplifies the bubble chart dynamics, with
the eye needing to cope with fewer changes across frames.

The background color was originally white, but switching to black is
easier on the eyes and seems to better contrast, in general, with the
randomly chosen allele colors.

The alleles were originally drawn without an explicit stroke for the
circumference. Drawing the circumference provides a more defined shape
for the eye to perceive. This is particularly important with partially
transparent bubbles, and transparent bubbles are needed to visualize
overlapping alleles.

## Notes

In addition to [p5][], I use the [stdlib][] library (`binomial()`,
`sample()`).  Here's the Boogie Woogie bubble [javascript][].

[Electric Op]: https://buffaloakg.org/art/exhibitions/electric-op
[old folly]: /population-genetics/javascript/2024/10/28/boogie-woogie.html
[p5]: https://p5js.org/
[stdlib]: https://stdlib.io/
[javascript]: /assets/p5/boogie-woogie-bubble.js

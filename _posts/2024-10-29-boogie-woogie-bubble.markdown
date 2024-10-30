---
layout: post
title:  "Boogie Woogie Bubble"
date:   2024-10-29
categories: population-genetics javascript
---

(modified Oct 30, 2024)

The Buffalo AKG [Electric Op][] exhibit reminded me of an [old
folly][], and this is a second iteration. Briefly, I am using a simple
population genetics model of genetic drift with infinite alleles as an
excuse to learn a bit more JavaScript, including the [p5][] library.

## Bubbles

The previous iteration used an individual-based simulation to follow a
population of individuals over time. The innovation here is to follow
the small number of segregating alleles, rather than the 1000's of
individuals in the population. The simulation is both smaller and
faster, so more realistic population sizes can be used. The simulation
may still have some artistic merit...

<div id="sketch-boogie-bubble"></div>
<script src="/assets/p5/libraries/p5.min.js"></script>
<script type="module" src="/assets/p5/boogie-woogie-bubble.js"></script>

The population size N is 10 times larger, and the mutation rate &mu;
10 times smaller, than in the individual-based simulation. The number
of generations per frame is increased four-fold to 200, and the frame
rate doubled to 24 (200 x 24 = 4800 generations) per second (available
CPU may limit the rate of display; this animation is slow on mobile
devices).  As before, 'Segregating' alleles are just the number of
alleles in the population at each generation. 'Replacements' summarize
how many times a common allele has been replaced by a new allele.

## Notes on representation

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

## Implementation notes

In addition to [p5][], I use `binomial()` from [stdlib][].  Here's the
Boogie Woogie bubble [JavaScript][].

The script is written using p5's 'instance' mode, and as a JavaScript
module. Using instance mode and modules loads only p5 variables into
the global namespace, not stdlib symbols or symbols used in the Boogie
Woogie script. Instance mode involves writing a closure (function)
that is passed to the `p5()` constructor. Simulation parameters and
functions are defined (currently) in the closure rather than at the
level of the module, resulting in better encapsulation. The stdlib
symbol `binomial` is `import`ed into the module, more closely coupling
the import to its use. Modules also allow more careful validation,
flagging a couple of instances where variables were used without `let`
or `const` declarations. Using p5 instances also allows for more than
one canvas on a page.

[Electric Op]: https://buffaloakg.org/art/exhibitions/electric-op
[old folly]: /population-genetics/javascript/2024/10/28/boogie-woogie.html
[p5]: https://p5js.org/
[stdlib]: https://stdlib.io/
[JavaScript]: /assets/p5/boogie-woogie-bubble.js

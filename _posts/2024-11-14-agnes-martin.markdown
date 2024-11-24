---
layout: post
title:  "Horizon"
date:   2024-11-14
categories: javascript
---

This continues my exploration of JavaScript.

## Agnes Martin

I respond to the horizon and vertical structure in Martin's work. I
interpret the horizon as prarie, and the weft and warp starting with
Martin's relationship with [Lenore Tawney][]. Martin's work is subtle
and poorly captured on the internet. Here is '[The Tree][] (1965)'
from the Buffalo AKG.

[![image](https://buffaloakg.org/sites/default/files/styles/fixed_height_medium/public/artwork/K1976_002_o2.jpg)](https://buffaloakg.org/artworks/k19762-tree)

That gray canvas is penciled lines bouncing over a textured
background. Here's a close-up (trigger warning: please move away from
the art; also, do not lick the art).

![image](/assets/agnes-martin-the-tree-1965-close.jpeg)

I like how this is so structured, but not perfect or
mechanical. Textures bump the line away from straight. Lines end but
not at the canvas. Etc. It is very hard to reconcile the color of the
AKG and iPhone images, and my own direct experience (dirty [with age
or work] 'white').

[Lenore Tawney]: https://lenoretawney.org/
[The Tree]: https://buffaloakg.org/artworks/k19762-tree

## Horizon

This first iteration aims to reproduce the basic structure of the
art. I hope to explore texture and more subtle line drawing in a
subsequent post.

I imagine that the lines are drawn as warp and then weft. The practice
is contemplative, so the lines are drawn slowly.

<div id="sketch-agnes-martin"></div>
<script type="module"  src="/assets/p5/agnes-martin.js"></script>


## Notes

The implementation uses [p5][]. I explore JavaScript classes (`Line`
and subclasses `VerticalLine`, `HorizontalLine`; here's the
[JavaScript][]) as well as different ways to represent color. I'm using
'HSB' here, where the 'H' (hue) is easily interpreted as location on
a color wheel.

[p5]: https://p5js.org/
[JavaScript]: /assets/p5/agnes-martin.js

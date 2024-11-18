---
layout: post
title:  "Boogie Woogie"
date:   2024-10-28
categories: population-genetics javascript
---

(updated 2024-11-14; 2024-11-18)

The Buffalo AKG [Electric Op][] exhibit reminded me of an old folly
(see also MoMA's Rafa&euml;l Rozendaal [Light][]).

## Piet Mondrian

A [Piet Mondrian exhibit][] at MoMA or the National Gallery in
1994-1995 helped me to understand a little bit about modern art;
there's a [catalog][] available. The exhibit was arranged
chronologically, so one could see Mondrian start with pictorial
representations (e.g., *The Weavers' House, Winterswijk*, 1899; p. 96
of the catalog), through impressionist (*Mollen; Mill in Sunlight*,
1908, p. 106) and cubist (*Still Life with Gingerpot II*, 1912,
p. 130; *Tableau No. 2; Composition No. VII*, 1913, p. 146) renderings
before landing on the geometrical representations (*Composition A;
Composition with Black, Red, Gray, Yellow, and Blue*, 1920, p. 197)
that define most of the last 20 years of Mondrian's life. One of the
last works in the exhibit was *Broadway Boogie Woogie* (1942-1943,
p. 297) where Mondrian seems to relax his tight structure to introduce
an almost dynamic and playful component; apparently the image is
inspired by traffic and lights on Broadway in New York City, enlivened
by the music of the blues.


<figure>
<a title="Piet Mondrian, Public domain, via Wikimedia Commons" href="https://commons.wikimedia.org/wiki/File:Piet_Mondrian,_1942_-_Broadway_Boogie_Woogie.jpg"><img width="512" alt="Piet Mondrian, 1942 - Broadway Boogie Woogie" src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Piet_Mondrian%2C_1942_-_Broadway_Boogie_Woogie.jpg/512px-Piet_Mondrian%2C_1942_-_Broadway_Boogie_Woogie.jpg?20160102143308"></a>
<figcaption>
Piet Mondrian, Broadway Boogie Woogie, 1942-1943.<br/>
Retrieved from Wikimedia Commons, 28 October, 2024.
</figcaption>
</figure>

The main theme I took from the exhibit was Mondrian's desire to
identify universal values that transcend reality. Thus simplifying
representation to primary colors and geometric shapes, and then to
assemble these colors and shapes into aesthetic meaning.

## Population Genetics

Simplified representations are often used in mathematical models, and
in particular in the 'infinite alleles' model describing genetic drift
in population genetics. The infinite alleles model imagines a
population of individuals, represented by the alleles at a particular
genetic locus.  Alleles experience mutation to a novel form. The fate
of the allele (whether and how quickly it is lost from the population,
for instance) is determined by purely stochastic processes. 

There is a kind of dynamic equilibrium between mutation and drift.
Often a single allele dominates, with a small number of recently
introduced mutations at low frequency. Sometimes the dominant allele
is replaced by a new allele. I imagined representing a population by a
grid of squares, each square colored to indicate the allele. Genetic
drift is visualized by updating the grid to reflect new mutation and
sampling between generations. The dynamics of new alleles reminded me
of flickering lights, and of Mondrian's final paintings. 

I explored simulations of genetic drift while teaching in the 90's,
and eventually included the art history and simulation in a single
memorable (for me, anyway) lecture in a graduate Population Genetics
course at Washington State University.

## Boogie Woogie

It's easy to simulate the infinite alleles model (literally two lines
of *R* code, for instance), making it a fun use case for exploring new
programming languages.

Several of the [Electric Op][] works used the 'Processing' programming
language for computer-based visualization. A modern implementation is
in the [p5][] javascript library. A perfect way for me to learn a bit
more javascript (my use of p5 is very rudimentary)! Here is the
result:

<div class="p5-boogie-woogie-canvas"></div>
<script src="/assets/stdlib-js/random-base-binomial.js"></script>
<script src ="/assets/stdlib-js/random-sample.js"></script>
<script src="/assets/p5/libraries/p5.min.js"></script>
<script src="/assets/p5/boogie-woogie.js"></script>

The population is represented by a 71 x 71 grid of alleles, so 5041
haploid 'individuals' (I started with a rectangle of 5000 individuals,
but then adjusted to match the square format of Mondrian's
work). Initially all alleles are the same (random) color. Each
generation introduces new mutations (new colors) at rate &mu;, and
then sampling with replacement the entire population. The display is
updated every 50 generations, at a maximum rate of 12 frames (50 x 12
= 600 generations) per second. Progress is reported in number of
generations scaled by population size (e.g., t / N = 1 indicates 5000
generations). 'Segregating' alleles are just the number of alleles in
the population at each generation. 'Replacements' summarize how many
times a common allele has been replaced by a new allele.

There is a lot of activity in the display. New alleles flicker on and
off fairly rapidly, perhaps existing for only a few frames. The
display becomes quite animated when a couple of alleles become more
equally frequent. But replacements are pretty rare, maybe once every
10 time units, and with a lot of variability. It's tempting to feel
that a new mutation that has become frequent will 'win', but actually
the chance of winning is just the frequency of the allele in the
population, independent of whether the allele has recently increased
in frequency or is new, etc. Hopefully this provides some
entertainment and maybe a bit of education.

## Notes

See the companion [Boogie Woogie Bubble][] post.

In addition to [p5][], I use the [stdlib][] javascript library (for
binomial random deviates, and to sample the population).  I also
needed to learn how to integrate a p5 canvas into the jekyll static
site generator (adding an 'assets' folder to the root of
the site with javascript scripts and libraries, and inserting
`<script>` and `<div>` tags into the markdown for this page). Here's
the Boogie Woogie [javascript][]. 

Population genetics and WSU remind me of Richard Gomulkiewicz, to whom
I dedicate this post.

[Electric Op]: https://buffaloakg.org/art/exhibitions/electric-op
[Light]: https://www.moma.org/calendar/exhibitions/5774
[Piet Mondrian exhibit]: https://www.moma.org/calendar/exhibitions/470
[catalog]: https://assets.moma.org/documents/moma_catalogue_470_300063147.pdf
[p5]: https://p5js.org/
[stdlib]: https://stdlib.io/
[Boogie Woogie Bubble]: /population-genetics/javascript/2024/10/29/boogie-woogie-bubble.html
[javascript]: /assets/p5/boogie-woogie.js

---
layout: post
title: "The Movies"
date: 2025-08-24
categories: javascript
---

<https://mtmorgan.github.io/movies>

[The Movies][] started because I wanted to explore WASM (web assembly) to run
more typically server-side applications in the client's browser. An interesting
example is the [SQLite WASM][] database. The New York Times came out with a list
of [The 100 Best Movies of the 21st Century][100] as chosen by 'creators'
(producers, directors, actors, etc.). As we started to watch the movies, it
became hard to remember details and even our reaction, and actually the page
provided by the New York Times is relatively hard to navigate (e.g., no simple
way to find the 34th movie, the display jumping around as the page renders,
etc.).

So we start with a simple table, then add links to reviews and where-to-watch.
Then provide information on directors, writers, and actors of each movie from
[The Movie Database][TMDB] (TMDB), and finally write our own notes on the movies
that we've seen.

It turns out to be a relatively complicated project, and a good way to level up
my JavaScript skills. It has also been a great way to be amazed by the bold new
age of AI-assisted coding.

[The Movies]: /movies/

<!-- prettier-ignore -->
[100]: https://www.nytimes.com/interactive/2025/movies/best-movies-21st-century.html
[SQLite WASM]: https://sqlite.org/wasm/doc/trunk/index.md

[TMDB]: [TMDB]: https://www.themoviedb.org/

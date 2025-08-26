---
title: "The Movies"
layout: page
date: 2025-07-21
css:
  - https://cdn.datatables.net/1.13.3/css/jquery.dataTables.css
  - /movies/assets/movies.css
---

The New York Times offered [The 100 Best Movies of the 21st Century][100] as
chosen by 'creators' (producers, directors, actors, etc.).

The movies are listed below, with links to the synopsis in the list (&#128175;)
and the New York Times review of the original movie (&#128196;). If we haven't
seen the movie, there is a link to where to watch (&#128065;).

Movies we've watched after the list came out have a check mark (&#10003;). If
we've written our own notes after watching the movie, the check mark is green
(&#9989;).

Clicking on a row brings up our notes and information from [TMDB][] (The Movie
Database) below the table. Directors, writers, or actors appearing as links have
more than one movie in the top 100. Clicking on the link selects the other
movies the person participates in; clicking again reverts to the full list.

<table id="movies-table" class="display" style="width: 100%">
    <caption>New York Times Best Movies of the 21st Century</caption>
    <thead>
        <tr>
            <th>#</th>
            <th>Title</th>
            <th>&nbsp;</th>
        </tr>
    </thead>
    <tbody>
        <!-- Data will be populated here by DataTables -->
    </tbody>
    <tfoot>
        <tr>
            <td colspan="2" style="text-align:left;">
                <small>Titles and links are from the New York Times.
                <br />
                &#128175; Top 100
                &#128196; Review
                &#128065; Where to watch
                <br />
                &check; We've seen it
                &#9989; Our notes
                </small>
            </td>
        </tr>
    </tfoot>
</table>

<p></p>

_<span id="title"></span>_ (<span id = "release_date"></span>) --
<span id="overview"></span>
Genre: <span id="genre"></span>.
Popularity: <span id="popularity"></span>.

Directed by <span id="directors"></span>. Screenplay / writing by
<span id="screenwriters"></span>.

Starring <span id="actors"></span>.

Notes: <span id="notes"></span>

## Reflections on the top 100 list

Viewing these has helped to develop criteria for evaluating movies. The movies
at the top of the list combine pillars of compelling themes, excellent acting,
unique cinematography, and a strong directorial presence. Movies further down
the list seem generally to compromise one (or more) of these pillars, and then
further down still to develop individual components less fully.

## Themes

The future: _Mad Max: Fury Road_, _Children of Men_, _Her_, _Wall-E_.

Social commentary: _Parasite_, _The Departed_, _Bridesmaids_.

Relationship: _In The Mood for Love_, _Phantom Thread_, _Anatomy of a Fall_,
_Bridesmaids_.

Personal growth: _Amélie_, _Lady Bird_, _Frances Ha_, _Crouching Tiger, Hidden
Dragon_, _Spirited Away_, _The Royal Tenenbaums_, _Superbad_.

Groundhog day: _Mulholland Drive_, _Eternal Sunshine of the Spotless Mind_.

Animation: _Spirited Away_, _Wall-E_, _Up_.

<script src="https://cdn.datatables.net/1.13.3/js/importmap.js"></script>
<script type="module" src="movies.js"></script>

## Implementation notes

I used the [SQLite WASM][] to provide a database served from static GitHub
pages. This is not a particularly practical use case (because the database is
read-only), but still a good learning experience. It is also pretty neat, on
reflection, to have the client providing significant computing. A challenge was
to wait for the database to be loaded; the solution uses a JavaScript `Promise`
and `setInterval()`. The database is updated outside of the main app using an
_R_ / _Shiny_ script on my laptop, then pushing the database to GitHub.

The implementation also involved learning more about directly working with
[DataTables][] and the HTML Document Object Model (DOM), including introducing
interactivity via events. The Javascript is now about 300 lines long, so some
attention is paid to modular code organization.

Google Gemini helped orient me, especially on how to wait for the database to
load, and how to manipulate the DOM.

The top 100 list and links to reviews and 'where to watch' are from the [New
York Times][100]. The data were scraped from the web page using _R_ and the
[xml2][] and [dplyr][] packages.

Director, writer, actor and genre information is from [TMDB][] (The Movie
Database), with JSON responses transformed using [rjsoncons][]. This information
was obtained using the TMDB API but is not endorsed or certified by TMDB.

<!-- prettier-ignore -->
[100]: https://www.nytimes.com/interactive/2025/movies/best-movies-21st-century.html
[SQLite WASM]: https://sqlite.org/wasm/doc/trunk/index.md
[DataTables]: https://datatables.net/
[xml2]: https://xml2.r-lib.org/
[dplyr]: https://dplyr.tidyverse.org/
[rjsoncons]: https://mtmorgan.github.io/rjsoncons
[TMDB]: https://www.themoviedb.org/

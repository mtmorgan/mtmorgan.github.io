---
title: "The Movies"
layout: page
date: 2025-07-21
css:
  - https://cdn.datatables.net/1.13.3/css/jquery.dataTables.css
---

The New York Times offered [The 100 Best Movies of the 21st Century][100] as
chosen by 'creators' (producers, directors, actors, etc.).

The movies are listed below, with links to the synposis in the list (&#128175;)
and the New York Times review of the original movie (&#128196;). If we haven't
seen the movie, there is a link to where to watch (&#128065;).

Movies we've watched after the list came out have a check mark (&#10003;). If
we've written our own notes after watchnig the movie, the check mark is green
(&#9989;).

Clicking on a row brings up our notes and information from [TMDB][]
(The Movie Database) below the table.

<!-- prettier-ignore -->
[100]: https://www.nytimes.com/interactive/2025/movies/best-movies-21st-century.html

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

_<span id="watched-title"></span>_ (<span id = "release-date"></span>) --
<span id="overview"></span> Popularity: <span id="popularity"></span>.

Directed by <span id="directors"></span>. Starring <span id="actors"></span>.

Notes: <span id="watched-notes"></span>

## Reflections on the top 100 list

Viewing these has helped to develop criteria for evaluating movies. The movies
at the top of the list combine pillars of compeling themes, excellent acting,
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

<script src="https://cdn.datatables.net/1.13.3/js/importmap.js"></script>
<script type="module" src="movies.js"></script>

## Implementation notes

The main innovation here is use of the SQLite WASM to provide a database served
from static GitHub pages. This is not a particularly practical use case, but
still a good learning experience. A challenge was to wait for the database to be
loaded; the solution uses a JavaScript `Promise` and `setInterval()`. The
database is for practical purposes read-only (because the server is static, and
the browser doesn't provide long-term persistence). So the database is updated
outside of the main app using an _R_ / _shiny_ script on my laptop, then pushed
to GitHub.

The implementation also involved learning more about directly working with
Datatables and the HTML Document Object Model (DOM), including introducing
interactivity.

Google Gemini helped orient me, especially on how to wait for the database to be
loaded and to manipulate the DOM.

Director, writer, and actor information is from [TMDB][TMDB] (The
Movie Database). This information was obtained using the TMDB API but
is not endorsed or certified by TMDB.

[TMDB]: https://www.themoviedb.org/

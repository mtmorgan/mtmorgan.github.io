---
title: "Movies"
layout: page
date: 2025-07-21
css:
- https://cdn.datatables.net/1.13.3/css/jquery.dataTables.css
---

## The movies

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

*<span id="watched-title"></span>*

<span id="watched-notes"></span>

### General reflections

Viewing these has helped to develop criteria for evaluating movies. The movies
at the top of the list combine pillars of compeling themes, excellent acting,
unique cinematography, and a strong directorial presence. Movies further down
the list seem generally to compromise one (or more) of these pillars, and then further down still to develop individual components less fully.

### Themes

The future: *Mad Max: Fury Road*, *Children of Men*, *Her*, *Wall-E*.

Social commentary: *Parasite*, *The Departed*, *Bridesmaids*.

Relationship: *In The Mood for Love*, *Phantom Thread*, *Anatomy of a Fall*.

Personal growth: *Amélie*, *Lady Bird*, *Frances Ha*, *Crouching Tiger, Hidden
Dragon*, *Spirited Away*, *The Royal Tenenbaums*, *Superbad*.

Groundhog day: *Mulholland Drive*, *Eternal Sunshine of the Spotless Mind*.

<script src="https://cdn.datatables.net/1.13.3/js/importmap.js"></script>
<script type="module" src="movies.js"></script>

# Notes
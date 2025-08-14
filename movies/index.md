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
            <th>&#128196;</th>
        </tr>
    </thead>
    <tbody>
        <!-- Data will be populated here by DataTables -->
    </tbody>
    <tfoot>
        <tr>
            <td colspan="2" style="text-align:left;">
                <small>Titles and links are from the New York Times.</small>
            </td>
        </tr>
    </tfoot>
</table>

## Our queue

<table id="queue-table" class="display" style="width: 100%">
    <thead>
        <tr>
            <th>#</th>
            <th>Title</th>
            <th>Watch</th>
        </tr>
    </thead>
    <tbody>
        <!-- Data will be populated here by DataTables -->
    </tbody>
</table>

## What we've watched

<table id="watched-table" class="display" style="width: 100%">
    <thead>
        <tr>
            <th>#</th>
            <th>Title</th>
            <th>&#128196;</th>
            <th>>&#x2705</th>
        </tr>
    </thead>
    <tbody>
        <!-- Data will be populated here by DataTables -->
    </tbody>
    <tfoot>
        <tr>
            <td colspan="2" style="text-align:left;">
                <small>&#x2705; Movies have notes available; click on the row.</small>
            </td>
        </tr>
    </tfoot>
</table>
<p></p>

Title: *<span id="watched-title"></span>*
<br />
Links: *New York Times* <a id="watched-synopsis" target="_blank">synopsis</a>
and <a id="watched-review" target="_blank">review</a>.

Notes: <span id="watched-notes"></span>

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
Dragon*, *Spirited Away*, *The Royal Tenenbaums*.

Groundhog day: *Mulholland Drive*, *Eternal Sunshine of the Spotless Mind*.

<script src="https://cdn.datatables.net/1.13.3/js/importmap.js"></script>
<script type="module" src="movies.js"></script>

# Notes
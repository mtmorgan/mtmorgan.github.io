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

Title: *<span id="watched-title"></span>*

Links: *New York Times* <a id="watched-synopsis" target="_blank">synopsis</a>
and <a id="watched-review" target="_blank">review</a>.

Notes: <span id="watched-notes"></span>

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

<script src="https://cdn.datatables.net/1.13.3/js/importmap.js"></script>
<script type="module" src="movies.js"></script>

# Notes
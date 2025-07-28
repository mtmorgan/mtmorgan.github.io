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

<p id="watched-title"></p>

<p id="watched-synopsis"></p>

<p id="watched-notes"></p>

<script src="https://cdn.datatables.net/1.13.3/js/importmap.js"></script>
<script type="module" src="movies.js"></script>

# Notes
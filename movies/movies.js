import sqlite3InitModule from "./assets/node_modules/@sqlite.org/sqlite-wasm/index.mjs";
import DataTable from 'datatables.net';
import 'datatables.net-select';

const log = console.log;
const error = console.error;

// SQLite3 Database Initialization

let db = null;

const create_db = (sqlite3, arrayBuffer) => {
    // Created database from ArrayBuffer
    const p = sqlite3.wasm.allocFromTypedArray(arrayBuffer);
    db = new sqlite3.oo1.DB(); // Create at global scope
    const rc = sqlite3.capi.sqlite3_deserialize(
        db.pointer, 'main', p, arrayBuffer.byteLength, arrayBuffer.byteLength,
        sqlite3.capi.SQLITE_DESERIALIZE_FREEONCLOSE
        // Optionally:
        // | sqlite3.capi.SQLITE_DESERIALIZE_RESIZEABLE
    );
    db.checkRc(rc);
    log('Database created successfully:', typeof db);
}

const start = (sqlite3) => {
    log('Running SQLite3 version', sqlite3.version.libVersion);

    // Fetch the database file as arrayBuffer
    fetch('/movies/assets/movies.db')
        .then(res => res.arrayBuffer())
        .then(arrayBuffer => {
            log('Creating database from ArrayBuffer:', arrayBuffer.byteLength,
                'bytes'
            );
            create_db(sqlite3, arrayBuffer);
        });
};

const initializeSQLite = async () => {
    try {
        log('Loading and initializing SQLite3 module...');
        const sqlite3 = await sqlite3InitModule({
            print: log,
            printErr: error,
        });
        log('Done initializing. Running demo...');
        start(sqlite3);
    } catch (err) {
        error('Initialization error:', err.name, err.message);
    }
}

initializeSQLite();

// SQL statements

const select_all_movies = () => {
    return db.selectObjects(`
        SELECT *
        FROM movie
        ORDER BY rank`
    );
}

const select_queued_movies = () => {
    return db.selectObjects(`
        SELECT movie.*
        FROM notes
        INNER JOIN movie ON notes.rank = movie.rank
        WHERE notes.queued = 1`
    );
}

const select_watched_movies = () => {
    return db.selectObjects(`
        SELECT movie.*, notes.notes AS notes
        FROM notes
        INNER JOIN movie ON notes.rank = movie.rank
        WHERE notes.watched = 1`
    );
}

const select_title_and_notes = (rank) => {
    return db.selectObject(`
        SELECT movie.title_text, movie.share_url, movie.review_url, notes.notes
        FROM movie
        INNER JOIN notes ON movie.rank = notes.rank
        WHERE movie.rank = ?`, [rank]
    );
}

// DataTables

const shared_options = {
    scrollY: '200px',
    paging: false,
    scrollCollapse: true,
};

const init_movies_datatable = () => {
    log('Updating DataTable with movies data...');
    const table = document.getElementById('movies-table');
    const movie_data = select_all_movies().map((movie) => ({
        rank: movie.rank,
        title: `<a href="${movie.share_url}" target="_blank">${movie.title_text}</a>`,
        review: `<a href="${movie.review_url}" target="_blank">&#128196;</a>`
    }));

    // Populate the 'movies' DataTable
    let table_dt = new DataTable(table, {
        data: movie_data,
        columns: [
            { title: "#", data: "rank" },
            { title: "Title", data: "title" },
            { title: "&#128196;", data: "review", orderable: false }
        ],
        ...shared_options
    });
};

const init_queue_datatable = () => {
    log('Updating DataTable with queue data...');
    const table = document.getElementById('queue-table');
    const queue_data = select_queued_movies().map((movie) => ({
        rank: movie.rank,
        title: movie.title_text,
        watch: `<a href="${movie.watch_url}" target="_blank">&#128065;</a>`
    }));

    new DataTable(table, {
        data: queue_data,
        columns: [
            { title: "#", data: "rank" },
            { title: "Title", data: "title" },
            { title: "Watch", data: "watch", orderable: false }
        ],
        ...shared_options
    });
}

const init_watched_datatable = () => {
    log('Updating DataTable with watched data...');
    const table = document.getElementById('watched-table');
    const watched_data = select_watched_movies().map((movie) => ({
        rank: movie.rank,
        title: movie.title_text,
        review: `<a href="${movie.review_url}" target="_blank">&#128196;</a>`,
        notes: movie.notes ? "\u2705" : ""
    }));

    const datatable = new DataTable(table, {
        data: watched_data,
        columns: [
            { title: "#", data: "rank" },
            { title: "Title", data: "title", orderable: false },
            { title: "&#128196;", data: "review", orderable: false },
            { title: "&#x2705", data: "notes" }
        ],
        select: {
            style: 'single',
            info: false
        },
        ...shared_options
    });

    // Add click event listener to rows
    table.tBodies[0].addEventListener('click', (event) => {
        const target = event.target.closest('tr');
        if (target) {
            const rank = datatable.row(target).data().rank;
            const { title_text, share_url, review_url, notes } =
                select_title_and_notes(rank);

            document.getElementById('watched-title').innerHTML = title_text;
            document.getElementById('watched-synopsis').href = share_url;
            document.getElementById('watched-review').href = review_url;;
            document.getElementById('watched-notes').innerHTML =
                notes || "None";
        }
    })

    let row = datatable.row(':eq(0)', { page: 'current' });
    row.select(); // Select the first row
    row.node().click(); // Trigger click on first row to populate details
}

// Initialize DataTable on DOMContentLoaded

const wait_for_db = () => {
    // Wait for the database to be initialized
    return new Promise(resolve => {
        const checkInterval = setInterval(() => {
            log('Checking if database is ready...');
            if (db !== null) {
                clearInterval(checkInterval);
                resolve(db);
            }
        }, 100);
    });
}

const init_datatable = () => {
    wait_for_db().then(() => {
        log('Database is ready, updating DataTables...');
        init_movies_datatable();
        init_queue_datatable();
        init_watched_datatable();
    }).catch(err => {
        error('Error initializing database / datatable:', err);
    });
};

document.addEventListener("DOMContentLoaded", init_datatable);

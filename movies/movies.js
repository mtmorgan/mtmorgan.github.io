import DataTable from 'datatables.net';
import 'datatables.net-select';
import { sendCommand, awaitReady } from './db-manager.js';

const log = console.log;
const error = console.error;

// SQLite3 Database Initialization

let db = null;

// const create_db = (sqlite3, arrayBuffer) => {
//     // Created database from ArrayBuffer
//     const p = sqlite3.wasm.allocFromTypedArray(arrayBuffer);
//     db = new sqlite3.oo1.DB(); // Create at global scope
//     const rc = sqlite3.capi.sqlite3_deserialize(
//         db.pointer, 'main', p, arrayBuffer.byteLength, arrayBuffer.byteLength,
//         sqlite3.capi.SQLITE_DESERIALIZE_FREEONCLOSE
//         // Optionally:
//         //    | sqlite3.capi.SQLITE_DESERIALIZE_RESIZEABLE
//     );
//     db.checkRc(rc);
//     log('Database created successfully:', typeof db);
// }

// const start = (sqlite3) => {
//     log('Starting SQLite3 version', sqlite3.version.libVersion);

//     // Fetch the database file as arrayBuffer
//     fetch('/movies/assets/movies.db')
//         .then(res => res.arrayBuffer())
//         .then(arrayBuffer => {
//             log('Creating database from ArrayBuffer:', arrayBuffer.byteLength,
//                 'bytes'
//             );
//             create_db(sqlite3, arrayBuffer);
//         });
// };

// const initializeSQLite = async () => {
//     try {
//         log('Loading and initializing SQLite3 module...');
//         const sqlite3 = await sqlite3InitModule({
//             print: log,
//             printErr: error,
//         });
//         start(sqlite3);
//     } catch (err) {
//         error('Initialization error:', err.name, err.message);
//     }
// }

// initializeSQLite();

// SQL queries

const select_all_movies = async () => {
    return await sendCommand('exec', {
        sql: `
            SELECT
                movie.*,
                notes.watched AS watched,
                notes.notes AS notes
            FROM movie
            LEFT JOIN notes
                ON movie.rank = notes.rank
            ORDER BY movie.rank`,
        rowMode: 'object'
    });
}

const select_movie_info = async (rank) => {
    const result = await sendCommand('exec', {
        sql: `
            SELECT
                movie.title_text AS title,
                notes.notes AS notes,
                strftime('%Y', tmdb_movie.release_date) AS release_date,
                tmdb_movie.overview AS overview,
                printf('%.3g', tmdb_movie.popularity) AS popularity
            FROM movie
            LEFT JOIN notes
                ON movie.rank = notes.rank
            LEFT JOIN tmdb_movie
                ON movie.rank = tmdb_movie.rank
            WHERE movie.rank = ?;`,
        bind: [rank],
        rowMode: 'object'
    });
    return result[0];
}

const select_and_count = async (role, rank) => {
    const config = {
        genre: {
            table: "tmdb_genre",
            table_and: "1=1",
            alias_and: "(1=1)",
            select: "",
        },
        actor: {
            table: "tmdb_cast",
            table_and: '(tbl."order" < 6)',
            alias_and: '(alias."order" < 6)',
            select: "tbl.character AS character,",
        },
        director: {
            table: "tmdb_crew",
            table_and: "(tbl.job IN ('Director'))",
            alias_and: "(alias.job IN ('Director'))",
            select: "",
        },
        screenwriter: {
            table: "tmdb_crew",
            table_and: "(tbl.job IN ('Screenplay', 'Writer'))",
            alias_and: "(alias.job IN ('Screenplay', 'Writer'))",
            select: "",
        },
    }[role];

    const { table, select, table_and, alias_and } = config;

    return await sendCommand('exec', {
        sql: `
            SELECT
                tbl.name AS "name",
                ${select}
                (
                    SELECT COUNT(*)
                    FROM ${table} AS alias
                    WHERE (alias.name = tbl.name) AND ${alias_and}
                ) AS count
            FROM ${table} AS tbl
            WHERE (tbl.rank = ?) AND ${table_and};`,
        bind: [rank],
        rowMode: 'object',
    });
}

const select_movie_rank = async (role, name) => {
    const config = {
        'genre': {
            table: 'tmdb_genre',
            table_and: '1=1',
        },
        'actor': {
            table: 'tmdb_cast',
            table_and: '("order" < 6)',
        },
        'director': {
            table: 'tmdb_crew',
            table_and: "(job IN ('Director'))",
        },
        'screenwriter': {
            table: 'tmdb_crew',
            table_and: "(job IN ('Screenplay', 'Writer'))",
        }
    }[role];

    const { table, table_and } = config;

    const response = await sendCommand('exec', {
        sql: `
            SELECT DISTINCT(rank)
            FROM ${table} AS tbl
            WHERE (name = ?) AND ${table_and};`,
        bind: [name],
        rowMode: 'array'
    });
    return response.flat();
}

// DOM

const dom_create_label = (role, item) => {
    const name = document.createElement('span');
    name.className = role;
    name.textContent = item.name ;
    if (item.count > 1) {
        name.classList.add('multiple-movies');
    }
    return name.outerHTML;
};

const dom_create_actor = (actor) => {
    const name = document.createElement('span');
    name.className = 'actor';
    name.textContent = actor.name ;
    if (actor.count > 1) {
        name.classList.add('multiple-movies');
    }

    const span = document.createElement('span');
    span.appendChild(name);
    span.appendChild(document.createTextNode(` (${actor.character})`));
    return span.innerHTML;
};

const dom_datatable_click_event = async (event, datatable) => {
    const target = event.target.closest("tr");
    if (!target) {
        return; // Click was outside a row
    }
    const rank = datatable.row(target).data().rank;

    // Fetch movie details in parallel
    const [info, genre_data, actor_data, director_data, screenwriter_data] =
        await Promise.all([
            select_movie_info(rank),
            select_and_count('genre', rank),
            select_and_count('actor', rank),
            select_and_count('director', rank),
            select_and_count('screenwriter', rank)
        ]);

    // Process fetched data
    const genre = genre_data
        .map((genre) => dom_create_label('genre', genre))
        .join(", ");
    const actors = actor_data
        .map((actor) => dom_create_actor(actor))
        .join(", ");
    const directors = director_data
        .map((person) => dom_create_label('director', person))
        .join(", ");
    const screenwriters = screenwriter_data
        .map((person) => dom_create_label('screenwriter', person))
        .join(", ");

    // Update DOM elements
    for (const key in info) {
        document.getElementById(key).innerHTML = info[key] || "None yet.";
    }
    document.getElementById("genre").innerHTML = genre || "Unknown";
    document.getElementById("actors").innerHTML = actors;
    document.getElementById("directors").innerHTML = directors;
    document.getElementById("screenwriters").innerHTML = screenwriters

    // Add event listener to multiple-movies actors/directors
    document.querySelectorAll(".multiple-movies").forEach((elem) => {
        elem.addEventListener(
            "click",
            (e) => dom_multiple_movies_click_event(e, datatable)
        );
    });
}

const dom_multiple_movies_click_event = async (event, datatable) => {
    event.stopPropagation(); // Prevent triggering row click event

    const wasActive = event.target.classList.contains('active');
    // Clear all active classes
    document.querySelectorAll('.active').forEach((el) => {
        el.classList.remove('active');
    });

    let regex = '';
    if (!wasActive) {
        // Set active class on clicked element
        event.target.classList.toggle('active');
        // Update regex to match any of the ids of the active element
        const ranks = await select_movie_rank(
            event.target.classList[0],
            event.target.textContent
        );
        regex = '^(' + ranks.join('|') + ')$';
    }
    // update datatable rows with selected ranks, or clear selection
    datatable.column(0).search(regex, true).draw();
}

// Initialize DataTable on DOMContentLoaded

// const wait_for_db = () => {
//     // Wait for the database to be initialized
//     return new Promise(resolve => {
//         const checkInterval = setInterval(() => {
//             log('Checking if database is ready...');
//             if (db !== null) {
//                 clearInterval(checkInterval);
//                 resolve(db);
//             }
//         }, 100);
//     });
// }

const init_app = async () => {
    try {
        log("Waiting for worker to be ready...");
        await awaitReady();

        const exists = await sendCommand('db-exists');
        log(`Does database exist? ${exists}`);

        if (!exists) {
            const dbFile = 'movies.db';
            log(`Importing '${dbFile}'`);
            const arrayBuffer = await fetch(`/movies/assets/${dbFile}`)
                .then(response => response.arrayBuffer());

            log("Sending database file to worker...");
            await sendCommand('db-import', {
                arrayBuffer: arrayBuffer
            }, [arrayBuffer]);
        }

        log('Database is ready, updating DataTables...');
        await init_datatable_movies();
    } catch (err) {
        error('Error initializing database / datatable:', err);
    };
};

const init_datatable_movies = async () => {
    log('Updating DataTable with movies data...');
    const table = document.getElementById('movies-table');
    const all_movies = await select_all_movies();
    const movie_data = all_movies.map((movie) => {
        let links =
           `<a href="${movie.share_url}" target="_blank">&#128175;</a>&nbsp;` +
           `<a href="${movie.review_url}" target="_blank">&#128196;</a>&nbsp;`;
        if (movie.notes) {
            links += '&#9989;';
        } else if (movie.watched) {
            links += '&check;';
        } else {
            links +=
                `<a href="${movie.watch_url}" target="_blank">&#128065;</a>`;
        }
        return {
            rank: movie.rank,
            title: movie.title_text,
            links: links
        }}
    );

    // Populate the 'movies' DataTable
    const datatable = new DataTable(table, {
        data: movie_data,
        columns: [
            { title: "#", data: "rank" },
            { title: "Title", data: "title" },
            { title: "&nbsp;", data: "links", orderable: true }
        ],
        select: {
            style: 'single',
            info: false
        },
        scrollY: '200px',
        paging: false,
        scrollCollapse: true
    });

    // Add click event listener to rows
    table.tBodies[0].addEventListener(
        'click',
        (event) => dom_datatable_click_event(event, datatable)
    );

    const row = datatable.row(':eq(0)', { page: 'current' });
    row.select(); // Select the first row
    row.node().click(); // Trigger click on first row to populate details
};

document.addEventListener("DOMContentLoaded", init_app);

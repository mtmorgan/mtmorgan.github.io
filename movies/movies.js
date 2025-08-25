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
        //    | sqlite3.capi.SQLITE_DESERIALIZE_RESIZEABLE
    );
    db.checkRc(rc);
    log('Database created successfully:', typeof db);
}

const start = (sqlite3) => {
    log('Starting SQLite3 version', sqlite3.version.libVersion);

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
        start(sqlite3);
    } catch (err) {
        error('Initialization error:', err.name, err.message);
    }
}

initializeSQLite();

// SQL queries

const select_all_movies = () => {
    return db.selectObjects(`
        SELECT
            movie.*,
            notes.watched AS watched,
            notes.notes AS notes
        FROM movie
        LEFT JOIN notes
            ON movie.rank = notes.rank
        ORDER BY movie.rank`
    );
}

const select_movie_info = (rank) => {
    return db.selectObject(`
        SELECT
            movie.title_text AS title,
            notes.notes AS notes,
            strftime('%Y', tmdb_movie.release_date) AS release_date,
            tmdb_movie.overview AS overview,
            tmdb_movie.popularity AS popularity
        FROM movie
        LEFT JOIN notes
            ON movie.rank = notes.rank
        LEFT JOIN tmdb_movie
            ON movie.rank = tmdb_movie.rank
        WHERE movie.rank = ?;`, [rank]
    );
}

const select_tmdb_genre = (rank) => {
    return db.selectObjects(`
        SELECT
            genre.name AS name,
            (
                SELECT COUNT(*)
                FROM tmdb_genre AS alias
                WHERE alias.name = genre.name
            ) AS count
        FROM tmdb_genre AS genre
        WHERE genre.rank = ?;`,
        [rank]
    );
}

const select_tmdb_actors = (rank) => {
    return db.selectObjects(`
        SELECT
            -- All actors for this movie, with their movie counts
            actor.name AS "name",
            actor.character AS character,
            (
                -- Count number of movies with this actor in top 6 billed roles
                SELECT COUNT(*)
                FROM tmdb_cast AS alias
                WHERE
                    (alias.name = actor.name)
                    AND (alias."order" < 6)
            ) AS movie_count
        FROM tmdb_cast AS actor
        WHERE (actor.rank = ?) AND (actor."order" < 6);`,
        [rank]
    );
}

const select_tmdb_crew = (role, rank) => {
    const job = {
        director: "('Director')",
        screenwriter: "('Screenplay', 'Writer')"
    }[role];

    return db.selectObjects(`
        SELECT
            -- All people for this movie, with their movie counts
            crew.name AS name,
            (
                -- Count number of movies of each person
                SELECT COUNT(*)
                FROM tmdb_crew AS alias
                WHERE (alias.name = crew.name) AND (alias.job IN ${job})
            ) AS movie_count
        FROM tmdb_crew AS crew
        WHERE (crew.rank = ?) AND (crew.job IN ${job});`,
        [rank]
    );
};

const select_movie_rank = (role, name) => {
    const table = {
        'genre': 'tmdb_genre',
        'actor': 'tmdb_cast',
        'director': 'tmdb_crew',
        'screenwriter': 'tmdb_crew'
    }[role];
    const and = {
        'genre': '1=1',
        'actor': '("order" < 6)',
        'director': "(job IN ('Director'))",
        'screenwriter': "(job IN ('Screenplay', 'Writer'))"
    }[role];

    return db.selectValues(`
        SELECT DISTINCT(rank)
        FROM ${table}
        WHERE (name = ?) AND ${and};`,
        [name]
    );
}

// DOM

const dom_create_genre = (genre) => {
    const name = document.createElement('span');
    name.className = 'genre';
    name.textContent = genre.name ;
    if (genre.count > 1) {
        name.classList.add('multiple-movies');
    }
    return name.outerHTML;
};

const dom_create_actor = (actor) => {
    const name = document.createElement('span');
    name.className = 'actor';
    name.textContent = actor.name ;
    if (actor.movie_count > 1) {
        name.classList.add('multiple-movies');
    }

    const span = document.createElement('span');
    span.appendChild(name);
    span.appendChild(document.createTextNode(` (${actor.character})`));
    return span.innerHTML;
};

const dom_create_crew = (job, person) => {
    const name = document.createElement('span');
    name.className = job;
    name.textContent = person.name ;
    if (person.movie_count > 1) {
        name.classList.add('multiple-movies');
    }
    return name.outerHTML;
}

const dom_datatable_click_event = (event, datatable) => {
    const target = event.target.closest("tr");
    if (!target) {
        return; // Click was outside a row
    }
    const rank = datatable.row(target).data().rank;

    const info = select_movie_info(rank);
    for (const key in info) {
        document.getElementById(key).innerHTML = info[key] || "None yet.";
    }

    const genre = select_tmdb_genre(rank)
        .map((genre) => dom_create_genre(genre))
        .join(", ");
    const actors = select_tmdb_actors(rank)
        .map((actor) => dom_create_actor(actor))
        .join(", ");
    const directors = select_tmdb_crew('director', rank)
        .map((person) => dom_create_crew('director', person))
        .join(", ");
    const screenwriters = select_tmdb_crew('screenwriter', rank)
        .map((person) => dom_create_crew('screenwriter', person))
        .join(", ");
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

const dom_multiple_movies_click_event = (event, datatable) => {
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
        const ranks = select_movie_rank(
            event.target.classList[0],
            event.target.textContent
        );
        regex = '^(' + ranks.join('|') + ')$';
    }
    // update datatable rows with selected ranks, or clear selection
    datatable.column(0).search(regex, true).draw();
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
        init_datatable_movies ();
    }).catch(err => {
        error('Error initializing database / datatable:', err);
    });
};

const init_datatable_movies = () => {
    log('Updating DataTable with movies data...');
    const table = document.getElementById('movies-table');
    const movie_data = select_all_movies().map((movie) => {
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

document.addEventListener("DOMContentLoaded", init_datatable);

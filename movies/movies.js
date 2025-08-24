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
            | sqlite3.capi.SQLITE_DESERIALIZE_RESIZEABLE
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

// SQL statements

const select_all_movies = () => {
    return db.selectObjects(`
        SELECT movie.*, notes.watched AS watched, notes.notes AS notes
        FROM movie
        LEFT JOIN notes
        ON movie.rank = notes.rank
        ORDER BY movie.rank`
    );
}

const select_title_and_notes = (rank) => {
    return db.selectObject(`
        SELECT movie.title_text, notes.notes
        FROM movie
        LEFT JOIN notes ON movie.rank = notes.rank
        WHERE movie.rank = ?;`, [rank]
    );
}

const select_tmdb_info = (rank) => {
    return db.selectObject(`
        SELECT
            strftime('%Y', release_date) AS release_date,
            overview AS overview,
            popularity AS popularity
        FROM tmdb_movie
        WHERE rank = ?`, [rank]
    );
}

const select_tmdb_actors = (rank) => {
    return db.selectObjects(`
        SELECT
            -- All actors for this movie, with their movie counts
            actors.name AS "name",
            actors.character AS character,
            (
                -- Count number of movies with this actor in top 6 billed roles
                SELECT COUNT(*)
                FROM tmdb_cast AS actors_alias
                WHERE
                    (actors_alias.name = actors.name)
                    AND (actors_alias."order" < 6)
            ) AS movie_count
        FROM tmdb_cast AS actors
        WHERE (actors.rank = ?) AND (actors."order" < 6);`,
        [rank]
    );
}

const select_tmdb_directors = (rank) => {
    return db.selectObjects(`
        SELECT
            -- All directors for this movie, with their movie counts
            crew.name AS name,
            (
                -- Count number of movies directed by this director
                SELECT COUNT(*)
                FROM tmdb_crew AS crew_alias
                WHERE (crew_alias.name = crew.name)
                    AND (crew_alias.job = 'Director')
            ) AS movie_count
        FROM tmdb_crew AS crew
        WHERE (crew.rank = ?) AND (job = 'Director');`,
        [rank]
    );
};

const select_movie_rank = (class_name, name) => {
    const table = (class_name === 'actor') ? 'tmdb_cast' : 'tmdb_crew';
    const and = (class_name === 'actor') ?
        "AND (\"order\" < 6)" : "AND (job = 'Director')";
    return db.selectValues(`
        SELECT DISTINCT(rank)
        FROM ${table}
        WHERE name = ? ${and};`,
        [name]
    );
}

// DataTables

const datatable_click_event = (datatable, event) => {
    const target = event.target.closest("tr");
    if (!target) {
        return; // Click was outside a row
    }

    const rank = datatable.row(target).data().rank;
    const { title_text, notes } = select_title_and_notes(rank);
    const { release_date, overview, popularity } = select_tmdb_info(rank);
    const actors = select_tmdb_actors(rank)
        .map((actor) => dom_create_actor(actor))
        .join(", ");
    const directors = select_tmdb_directors(rank)
        .map((director) => dom_create_director(director))
        .join(", ");

    document.getElementById("watched-title").innerHTML = title_text;
    document.getElementById("watched-notes").innerHTML = notes || "No notes yet.";

    document.getElementById("release-date").innerHTML = release_date;
    document.getElementById("overview").innerHTML = overview;
    document.getElementById("popularity").innerHTML = popularity;
    document.getElementById("actors").innerHTML = actors;
    document.getElementById("directors").innerHTML = directors;

    // Add event listener to multiple-movies actors/directors
    document.querySelectorAll(".multiple-movies").forEach((elem) => {
        elem.addEventListener("click", (e) => {
            e.stopPropagation(); // Prevent triggering row click event

            const wasActive = e.target.classList.contains('active');
            // Clear all active classes
            document.querySelectorAll('.active').forEach((el) => {
                el.classList.remove('active');
            });

            let regex = '';
            if (!wasActive) {
                // Set active class on clicked element
                e.target.classList.toggle('active');
                // Update regex to match any of the ids of the active element
                const ranks = select_movie_rank(
                    e.target.classList[0],
                    e.target.textContent
                );
                regex = '^(' + ranks.join('|') + ')$';
            }
            // update datatable rows with selected ranks, or clear selection
            datatable.column(0).search(regex, true).draw();
        });
    });
}

const datatable_init_movies = () => {
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
    table.tBodies[0]
        .addEventListener('click', (event) => {
            // Add datatable instance to event handler
            datatable_click_event(datatable, event)
        });

    let row = datatable.row(':eq(0)', { page: 'current' });
    row.select(); // Select the first row
    row.node().click(); // Trigger click on first row to populate details
};

// DOM

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

const dom_create_director = (director) => {
    const name = document.createElement('span');
    name.className = 'director';
    name.textContent = director.name ;
    log(director);
    if (director.movie_count > 1) {
        name.classList.add('multiple-movies');
    }
    return name.outerHTML;
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
        datatable_init_movies ();
    }).catch(err => {
        error('Error initializing database / datatable:', err);
    });
};

document.addEventListener("DOMContentLoaded", init_datatable);

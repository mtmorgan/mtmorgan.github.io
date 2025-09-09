import sqlite3InitModule from "./assets/node_modules/@sqlite.org/sqlite-wasm/index.mjs";

const postMessage = (command, data, commandId, error) => {
    self.postMessage({ command, data, commandId, error });
};
const log = (...args) => postMessage('log', args);
const error = (...args) => postMessage('error', args);

const opfsFilename = 'movies.sqlite3';
let sqlite3;
let db; // Database singleton instance

// Initialize SQLite WASM and then signal readiness to the main thread
sqlite3InitModule().then(s => {
    sqlite3 = s;
    log("SQLite3 module initialized.");
    postMessage('ready');
});

self.onmessage = async (event) => {
    const { command, payload, commandId } = event.data;

    if (!sqlite3) {
        error("SQLite3 not yet initialized.");
        return;
    }

    try {
        let result;
        switch (command) {
            case 'db-exists':
                try {
                    const root = await navigator.storage.getDirectory();
                    await root.getFileHandle(opfsFilename, { create: false });
                    result = true;
                } catch (e) {
                    if (e.name === 'NotFoundError') {
                        result = false;
                    } else {
                        throw e; // Re-throw unexpected errors
                    }
                }
                break;

            case 'db-import':
                await sqlite3.oo1.OpfsDb.importDb(
                    opfsFilename,
                    payload.arrayBuffer
                );
                result = "Import successful";
                break;

            case 'exec':
                if (!db) {
                    db = await new sqlite3.oo1.OpfsDb(opfsFilename, 'c');
                    log(`Created db object at ${db.filename}`);
                }
                result = db.exec(payload);
                break;

            default:
                throw new Error(`Unknown command: ${command}`);
        }
        postMessage(command, result, commandId);

    } catch (e) {
        postMessage(command, null, commandId, e.message);
    }
};

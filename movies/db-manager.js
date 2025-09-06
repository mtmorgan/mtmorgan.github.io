// dbmanager.js

/**
 * A module to wrap a web worker for promise-based communication.
 * This file should be imported from the main thread.
 */
const worker = new Worker(
    new URL('./db-worker.js', import.meta.url),
    { type: 'module' }
);

let nextCommandId = 0;
const commandPromises = new Map();

// Listen for messages from the worker
worker.onmessage = (event) => {
    const { command, data, commandId, error } = event.data;

    // Handle generic log and error messages
    if (command === 'log') {
        console.log("db-worker log:", ...data);
        return;
    }
    if (command === 'error') {
        console.error("db-worker error:", ...data);
        return;
    }

    // Handle promise resolution for specific commands
    if (commandId !== undefined && commandPromises.has(commandId)) {
        const { resolve, reject } = commandPromises.get(commandId);
        commandPromises.delete(commandId);

        if (error) {
            reject(new Error(error));
        } else {
            resolve(data);
        }
    }
};

/**
 * Sends a command to the worker and returns a promise that resolves with the response.
 * @param {string} command - The command string.
 * @param {*} [payload] - The data to send with the command.
 * @param {Array<Transferable>} [transferable] - Optional array of transferable objects.
 * @returns {Promise<*>} A promise that resolves with the worker's response data.
 */
export function sendCommand(command, payload, transferable = []) {
    return new Promise((resolve, reject) => {
        const commandId = nextCommandId++;
        commandPromises.set(commandId, { resolve, reject });

        const message = {
            command,
            payload,
            commandId
        };

        if (Array.isArray(transferable) && transferable.length > 0) {
            worker.postMessage(message, transferable);
        } else {
            worker.postMessage(message);
        }
    });
}

/**
 * Provides a way to await worker initialization.
 * The worker should send a `{ command: 'ready' }` message after init.
 * @returns {Promise<void>}
 */
export function awaitReady() {
    return new Promise(resolve => {
        const handleMessage = (event) => {
            if (event.data.command === 'ready') {
                worker.removeEventListener('message', handleMessage);
                resolve();
            }
        };
        worker.addEventListener('message', handleMessage);
    });
}

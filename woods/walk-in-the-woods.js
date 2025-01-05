import "/assets/p5/libraries/p5.min.js";
import WOODS from "./woods.json" with { type: "json" };

const IMG_PREFIX = "./images/",
      SKETCH_WALK_IN_THE_WOODS_ID = "sketch-walk-in-the-woods",
      SKETCH_WALK_IN_THE_WOODS_AGAIN_ID = "sketch-walk-in-the-woods-again";

const get_width = (id, max_width) => {

    const id_width = document.getElementById(id).clientWidth;
    return typeof max_width === "undefined" ?
        id_width : Math.min(id_width, max_width);

}

// Memoize 'func', with help from Google Generative AI, 21 Dec 2024
const memoize = (func) => {

    const cache = {};

    return function(...args) {
        const key = JSON.stringify(args);
        if (cache[key]) {
            return cache[key];
        } else {
            const result = func(...args);
            cache[key] = result;
            return result;
        }
    };

}

class Woods {

    images = [];
    woods = [];
    wood_info = {};
    imgae_info = {};

    constructor(the_woods, image_info, wood_info) {

        this.wood_info = wood_info;
        this.image_info = image_info;
        this.woods = structuredClone(the_woods).map(wood => {
            wood.start_frame = this.wood_info.start * wood.StartTime;
            return wood;
        });

    }

    load_image(p5, wood, image = {}) {

        // Load image via callback; not quite immediate
        p5.loadImage(IMG_PREFIX + wood.FileName, (img) => {
            image.image = img;
            this.images.push(image)
        });

    }

    load_images(p5) {

        // Find and load images
        this.woods.
            filter(wood => wood.start_frame <= p5.frameCount).
            forEach(wood => { this.load_image(p5, wood); });
        this.woods =
            this.woods.
            filter(wood => wood.start_frame > p5.frameCount);

    }

    unload_image() {}

    unload_images() {

        this.images.
            filter(img => img.scale > this.image_info.end).
            forEach(img => this.unload_image(img));
        
        this.images =
            this.images.filter(img => img.scale <= this.image_info.end);

    }

    draw_image(p5, img, x_offset, y_offset) {

        // Constants for destination and source size & offset
        const dest_scale = Math.min(img.scale, 1),
            dest_height = this.image_size.height * dest_scale,
            dest_width = this.image_size.width * dest_scale,
            dest_x_offset = x_offset - dest_width / 2,
            dest_y_offset = y_offset - dest_height / 2,

            source_scale =
                Math.max(1, Math.min(img.scale, this.image_info.max)),
            source_height = img.image.height / source_scale,
            source_width = img.image.width / source_scale,
            source_x_offset = img.image.width / 2 - source_width / 2,
            source_y_offset = img.image.height / 2 - source_height / 2;

        // Limit tint() to this image
        p5.push();

        // Fade full-sized images
        if (img.scale > this.image_info.max) {
            const alpha = 1 -
                  (img.scale - this.image_info.max) /
                  (this.image_info.end - this.image_info.max);
            p5.tint(255, alpha);
        }

        // Box and draw the image
        p5.strokeWeight(1).fill("black").
            rect(dest_x_offset, dest_y_offset, dest_width, dest_height);
        p5.image(
            img.image,
            // Desination
            dest_x_offset, dest_y_offset, dest_width, dest_height,
            // Source
            source_x_offset, source_y_offset, source_width, source_height
        );

        p5.pop();

    }

    draw_images(p5) {

        this.images.forEach((img, idx, images) => {
            this.draw_image(p5, img);
            images[idx].scale *= this.image_info.step;
        });

    }

    done() {

        return (this.woods.length == 0) && (this.images.length == 0);

    }

}

class Walk extends Woods {

    constructor(the_woods, canvas_width, image_info, wood_info) {

        super(the_woods, image_info, wood_info);

        // Grid of images, indexed 0..n_row * n_col
        Object.assign(this.wood_info, { n_row: 2, n_col: 4 });

        const grid_aspect_ratio =
              (this.wood_info.n_row / this.wood_info.n_col) /
              image_info.aspect_ratio;
        this.offset_values =
            [...Array(this.wood_info.n_row * this.wood_info.n_col).keys()];

        // Canvas dimensions
        this.canvas = {
            width: canvas_width,
            height: grid_aspect_ratio * canvas_width
        }

        // Image dimensions
        const image_width = canvas_width / wood_info.n_col;
        this.image_size = {
            width: image_width,
            height: image_width / image_info.aspect_ratio
        };

    }

    offsets() {

        // '<number> | 0' implements Math.floor() for <number> < 2^31
        const index = this.offset_values.length * Math.random() | 0;
        const offset = this.offset_values.splice(index, 1),
              x_index = offset[0] / this.wood_info.n_row | 0,
              y_index = offset[0] % this.wood_info.n_row;

        return {
            offset: offset[0],
            x_offset: (x_index + 1 / 2) * this.image_size.width,
            y_offset: (y_index + 1 / 2) * this.image_size.height
        };

    }

    offsets_reset(offset) {

        this.offset_values.push(offset);

    }

    load_image(p5, wood) {

        let image_template = Object.assign(
            this.offsets(),
            { scale: this.image_info.begin }
        );
        super.load_image(p5, wood, image_template);

    }

    draw_image(p5, img) {

        super.draw_image(p5, img, img.x_offset, img.y_offset);

    }

    unload_image(img) {

        this.offsets_reset(img.offset);

    }

}

const sketch_walk_in_the_woods = (p5) => {

    const
        background_color = p5.color(0, 0, 0), // Black
        frame_rate = 24,
        golden_ratio = (1 + Math.sqrt(5)) / 2,
        image_info = {
            aspect_ratio: 3024 / 4032,
            // Rules for image growth
            begin: 1 / golden_ratio ** 3,
            end: golden_ratio ** 5,
            max: golden_ratio ** 3,
            step: golden_ratio ** (1 / (5 * frame_rate))
        },
        wood_info = {
            // Start display when start * wood.StartTime > p5.frameCount
            start: 5
        };

    // Set in p5.setup()
    let the_walk;

    // P5
    p5.setup = () => {

        const canvas_width = get_width(SKETCH_WALK_IN_THE_WOODS_ID);
        the_walk = new Walk(WOODS, canvas_width, image_info, wood_info);

        p5.createCanvas(the_walk.canvas.width, the_walk.canvas.height);
        p5.frameRate(frame_rate);
        p5.colorMode(p5.HSB);

        p5.describe("A Walk in the Woods");

    }

    p5.draw = () => {

        p5.background("black");

        the_walk.load_images(p5);
        the_walk.draw_images(p5);
        the_walk.unload_images();

        if (the_walk.done()) {
            p5.remove();
        }

    }

}

class Bezier {

    constructor(points, n_steps) {

        // Assert that points.length == 4; each element an array of length 2
        this.points = points;

        // Assert that times is an object with fields begin, end, step
        this.n_steps = n_steps;
        this.step = 0;
        
    }

    // Calculate points along a Bezier curve, with help from
    // https://javascript.info/bezier-curve and Google Generative AI
    // LLM, 21 Dec 2024
    factorial = memoize((n) => {
        return n <= 1 ? 1 : n * this.factorial(n - 1);
    });

    binomial(n, k) {
        return this.factorial(n) / (this.factorial(k) * this.factorial(n - k));
    }

    bezier(points, t) {
        const n = points.length - 1;
        let x = 0,
            y = 0;

        for (let i = 0; i <= n; i++) {
            const coefficient =
                  this.binomial(n, i) * Math.pow(t, i) * Math.pow(1 - t, n - i);
            x += coefficient * points[i][0];
            y += coefficient * points[i][1];
        }

        return [x, y];
    }        

    // This is the public entry point -- call next() until 'null'
    next() {

        const t = this.step / this.n_steps;
        if (this.step < this.n_steps) {
            this.step += 1;
        }
        return this.bezier(this.points, t);

    }

}

class WalkAgain extends Woods {

    constructor(the_woods, canvas_width, image_info, wood_info) {

        super(the_woods, image_info, wood_info);

        // Canvas size
        let golden_ratio = (1 + Math.sqrt(5)) / 2;
        this.canvas = {
            width: canvas_width,
            height: canvas_width
        };

        // Image final size
        const image_width = canvas_width / 4;
        this.image_size = {
            width: image_width,
            height: image_width / image_info.aspect_ratio
        };

        // Calculate Bezier curve steps to match the 'grow' phase
        const info = image_info
        this.n_step = 0;
        for (let i = info.begin; i <= info.max; i *= info.step) {
            this.n_step += 1;
        }

    }

    // Bezier curve anchor and control points
    start_point(img) {

        const height = this.image_size.height * img.scale,
              width = this.image_size.width * img.scale;
        return [
            this.canvas.width - width / 2 | 0,
            // Start outside canvas so some images come from the 'side'
            (this.canvas.height + 2 * height) * Math.random() - height | 0
        ];

    }

    control_point() {

        return[
            Math.random() * this.canvas.width | 0,
            Math.random() * this.canvas.height | 0
        ];

    }

    end_point(img) {

        const height = this.image_size.height,
              width = this.image_size.width,
              height_idx = (Math.random() * 4 | 0) / 4;

        return [
            width / 2 | 0,
            (this.canvas.height - height) * height_idx + height / 2
        ];

    }

    init_bezier(img) {

        let points = [
            this.start_point(img),
            this.control_point(), this.control_point(),
            this.end_point(img)
        ];
        
        return new Bezier(points, this.n_step);
    }

    // Define image-specific Bezier curve; load image
    load_image(p5, wood) {

        let image_template = {
            bezier: null,
            scale: this.image_info.begin
        };

        super.load_image(p5, wood, image_template);

    }

    draw_image(p5, img) {

        if (img.bezier === null) {
            img.bezier = this.init_bezier(img);
        }

        const point = img.bezier.next();
        super.draw_image(p5, img, point[0], point[1]);

    }

    unload_image(img) {

        img.bezier = null;

    }

}

const sketch_walk_in_the_woods_again = (p5) => {

    const
        background_color = p5.color(0, 0, 0), // Black
        frame_rate = 24,
        golden_ratio = (1 + Math.sqrt(5)) / 2,
        image_info = {
            aspect_ratio: 3024 / 4032,
            // Rules for image growth
            begin: 1 / golden_ratio ** 3,
            end: golden_ratio ** 5,
            max: golden_ratio ** 3,
            step: golden_ratio ** (1 / (6 * frame_rate))
        },
        wood_info = {
            // Start display when start * wood.StartTime > p5.frameCount
            start: 7,
            // Number of rows in final (leftmost) position
            n_row: 4
        };

    let the_walk;

    p5.setup = () => {

        const canvas_width = get_width(SKETCH_WALK_IN_THE_WOODS_ID);
        the_walk = new WalkAgain(WOODS, canvas_width, image_info, wood_info);

        p5.createCanvas(the_walk.canvas.width, the_walk.canvas.height);
        p5.frameRate(frame_rate);
        p5.colorMode(p5.HSB);


        p5.describe("Another Walk in the Woods");

    }

    p5.draw = () => {

        p5.background("black");

        the_walk.load_images(p5);
        the_walk.draw_images(p5);
        the_walk.unload_images();

        if (the_walk.done()) {
            p5.remove();
        }

    }

}

new p5(sketch_walk_in_the_woods, SKETCH_WALK_IN_THE_WOODS_ID);
new p5(sketch_walk_in_the_woods_again, SKETCH_WALK_IN_THE_WOODS_AGAIN_ID);

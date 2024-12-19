import "/assets/p5/libraries/p5.min.js";
import WOODS from "./woods.json" with { type: "json" };

const IMG_PREFIX = "./images/",
    SKETCH_WALK_IN_THE_WOODS_ID = "sketch-walk-in-the-woods";

const get_width = (id, max_width) => {

    const id_width = document.getElementById(id).clientWidth;
    return typeof max_width === "undefined" ?
        id_width : Math.min(id_width, max_width);

}

class Woods {

    constructor(the_woods, canvas_width, image_scale, wood_scale) {

        this.wood_scale = wood_scale;
        // Grid of images, indexed 0..n_row * n_col
        Object.assign(this.wood_scale, { n_row: 2, n_col: 4 });

        const grid_aspect_ratio =
              (this.wood_scale.n_row / this.wood_scale.n_col) /
              image_scale.aspect_ratio;
        this.canvas = {
            width: canvas_width,
            height: grid_aspect_ratio * canvas_width
        }
        this.offset_values =
            [...Array(this.wood_scale.n_row * this.wood_scale.n_col).keys()];

        this.image_scale = image_scale;
        const image_width = canvas_width / wood_scale.n_col;
        this.image_size = {
            width: image_width,
            height: image_width / image_scale.aspect_ratio
        };

        this.images = [];

        this.woods = structuredClone(the_woods).map(wood => {
            wood.start_frame = this.wood_scale.start * wood.StartTime;
            return wood;
        });

    }

    offsets() {

        // '<number> | 0' implements Math.floor() for <number> < 2^31
        const index = this.offset_values.length * Math.random() | 0;
        const offset = this.offset_values.splice(index, 1),
              x_index = offset[0] / this.wood_scale.n_row | 0,
              y_index = offset[0] % this.wood_scale.n_row;
        return [
            offset[0],
            (x_index + 1 / 2) * this.image_size.width,
            (y_index + 1 / 2) * this.image_size.height
        ];

    }

    offsets_reset(offset) {

        this.offset_values.push(offset);

    }

    load_image(p5, wood) {

        const [offset, x_offset, y_offset] = this.offsets();

        // Load image via callback; not quite immediate
        p5.loadImage(IMG_PREFIX + wood.FileName, (img) => {
            this.images.push({
                image: img,
                scale: this.image_scale.begin,
                offset: offset,
                x_offset: x_offset,
                y_offset: y_offset
            });
        });

    }

    load_new_images(p5) {
        const frame_count = p5.frameCount;

        // Find and load images
        this.woods.
            filter(wood => wood.start_frame <= frame_count).
            forEach(wood => { this.load_image(p5, wood); });
        this.woods = this.woods.filter(wood => wood.start_frame > frame_count);

    }

    unload_expired_images() {

        this.images.
            filter(img => img.scale > this.image_scale.end).
            forEach(img => this.offsets_reset(img.offset));
        this.images =
            this.images.filter(img => img.scale <= this.image_scale.end);

    }

    draw(p5) {

        this.load_new_images(p5.frameCount, p5.loadImage);
        this.draw_images(p5);
        this.unload_expired_images();

    }

    draw_image(p5, img) {
        const dest_scale = Math.min(img.scale, 1),
            dest_height = this.image_size.height * dest_scale,
            dest_width = this.image_size.width * dest_scale,
            dest_x_offset = img.x_offset - dest_width / 2,
            dest_y_offset = img.y_offset - dest_height / 2,

            source_scale =
                Math.max(1, Math.min(img.scale, this.image_scale.max)),
            source_height = img.image.height / source_scale,
            source_width = img.image.width / source_scale,
            source_x_offset = img.image.width / 2 - source_width / 2,
            source_y_offset = img.image.height / 2 - source_height / 2;

        // Limit tint() to this image
        p5.push();

        if (img.scale > this.image_scale.max) {
            // Fade full-sized images
            const alpha = 1 -
                  (img.scale - this.image_scale.max) /
                  (this.image_scale.end - this.image_scale.max);
            p5.tint(255, alpha);
        }

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
            images[idx].scale *= this.image_scale.step;
        });

    }

    done() {

        console.log(`${this.woods.length} ${this.images.length}`);
        return (this.woods.length == 0) && (this.images.length == 0);

    }

}

const sketch_walk_in_the_woods = (p5) => {

    const
        background_color = p5.color(0, 0, 0), // Black
        frame_rate = 24,
        golden_ratio = (1 + Math.sqrt(5)) / 2,
        image_scale = {
            aspect_ratio: 3024 / 4032,
            // Rules for image growth
            begin: 1 / golden_ratio ** 3,
            end: golden_ratio ** 5,
            max: golden_ratio ** 3,
            step: golden_ratio ** (1 / (5 * frame_rate))
        },
        wood_scale = {
            // Start display when start * wood.StartTime > p5.frameCount
            start: 5
        };

    // Set in p5.setup()
    let woods;

    // P5
    p5.setup = () => {

        const canvas_width = get_width(SKETCH_WALK_IN_THE_WOODS_ID);
        woods = new Woods(WOODS, canvas_width, image_scale, wood_scale);

        p5.createCanvas(woods.canvas.width, woods.canvas.height);
        p5.frameRate(frame_rate);
        p5.colorMode(p5.HSB);

        p5.describe("A Walk in the Woods");

    }

    p5.draw = () => {

        p5.background("black");

        woods.load_new_images(p5);
        woods.draw_images(p5);
        woods.unload_expired_images();

        if (woods.done()) {
            p5.remove();
        }

    }

}

new p5(sketch_walk_in_the_woods, SKETCH_WALK_IN_THE_WOODS_ID);

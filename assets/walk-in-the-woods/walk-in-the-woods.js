import '/assets/p5/libraries/p5.min.js';
import woods from "/assets/walk-in-the-woods/woods.json" with { type: "json" };

const SKETCH_WALK_IN_THE_WOODS_ID = "sketch-walk-in-the-woods";
const IMG_PREFIX = "/assets/walk-in-the-woods/small/"

function get_width(id, max_width) {
    const id_width = document.getElementById(id).clientWidth;
    return max_width === undefined ? id_width : Math.min(id_width, max_width);
}

const sketch_walk_in_the_woods = (p) => {
    let canvas_width;
    let canvas_height;
    const golden_ratio = (1 + Math.sqrt(5)) /2;
    const aspect_ratio = 3024 / 4032;
    const frame_rate = 24;

    let img_width;
    let img_height;
    const image_scale = {
        n_per_row: 5,
        min: 1 / (golden_ratio ** 3),
        max: golden_ratio ** 3,
        end: golden_ratio ** 5,
        step: (golden_ratio ** (1/(5 * frame_rate)))
    };
    let image_queue;

    p.colorMode(p.HSB);
    const background_color = p.color(0, 0, 0); // black

    // random x- and y-offsets
    function random_shuffle(array, start = 0, end = array.length - 1) {
        // https://stackoverflow.com/a/12646864/547331 +
        // Google AI for start /end
        for (let i = end; i >= start; i--) {
            const j = Math.floor(Math.random() * (i - start + 1)) + start;
            [array[i], array[j]] = [array[j], array[i]];
        }
    };

    const random_offset = (function(n_per_row) {
        // avoid horizontal overlap with offset columns;
        let row_offsets = [...Array(n_per_row).keys()].map((x) => x + 1/2);
        random_shuffle(row_offsets);

        return {
            x() {
                // avoid choosing from the same column twice in
                // succesion by inserting the offset into the
                // (re-shuffled) tail of the array
                const offset = row_offsets.shift();
                row_offsets.push(offset);
                random_shuffle(row_offsets, 1)
                return img_width * offset;
            },

            y() {
                const y_range = canvas_height - img_height;
                return Math.floor(p.random(y_range) + img_height / 2);
            }
        };
    })(image_scale.n_per_row);

    // image load & draw
    function image_load(json) {
        return {
            scale: image_scale.min,
            image: p.loadImage(IMG_PREFIX + json.FileName),
            x_offset: random_offset.x(),
            y_offset: random_offset.y(),
            start_at_frame: Math.floor(5 * json.StartTime)
        };
    }

    function image_draw(img) {
        const dest_scale =
              img.scale < 1 ? img.scale : 1;
        const dest_width = img_width * dest_scale;
        const dest_height = img_height * dest_scale;
        const dest_x_offset = img.x_offset - dest_width / 2;
        const dest_y_offset = img.y_offset - dest_height / 2;

        const source_scale =
              img.scale < 1 ? 1: Math.min(img.scale, image_scale.max);
        const source_width = img.image.width / source_scale;
        const source_height = img.image.height / source_scale
        const source_x_offset = img.image.width / 2 - source_width / 2;
        const source_y_offset = img.image.height / 2 - source_height / 2;

        p.push();               // limit tint() to this image

        if (img.scale > image_scale.max) {
            // fade full-sized images
            const alpha = 1 -
                  (img.scale - image_scale.max) /
                  (image_scale.end - image_scale.max);
            p.tint(255, alpha);
        }

        p.image(
            img.image,
            // desination
            dest_x_offset, dest_y_offset, dest_width, dest_height,
            // source
            source_x_offset, source_y_offset, source_width, source_height
        );

        p.pop();

        img.scale *= image_scale.step;
    }

    // p5
    p.preload = () => {
        canvas_width = get_width(SKETCH_WALK_IN_THE_WOODS_ID);
        canvas_height = canvas_width / golden_ratio;
        img_width = canvas_width / image_scale.n_per_row;
        img_height = img_width / aspect_ratio;
        image_queue = woods.map(image_load);
    }

    p.setup = () => {
        p.createCanvas(canvas_width, canvas_height);
        p.frameRate(frame_rate);
        p.describe("A Walk in the Woods");
    }

    p.draw = () => {
        p.background("black");

        // draw
        image_queue.
            filter((img) => img.start_at_frame <= p.frameCount).
            forEach(image_draw);

        // filter completed
        image_queue =
            image_queue.
            filter((img) => img.scale <= image_scale.end);

        // done?
        if (image_queue.length == 0)
            p.noLoop();
    }
}

new p5(sketch_walk_in_the_woods, SKETCH_WALK_IN_THE_WOODS_ID);

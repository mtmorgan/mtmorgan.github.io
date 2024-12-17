import "/assets/p5/libraries/p5.min.js";
import WOODS from "/assets/walk-in-the-woods/woods.json" with { type: "json" };

const IMG_PREFIX = "/assets/walk-in-the-woods/small/",
      SKETCH_WALK_IN_THE_WOODS_ID = "sketch-walk-in-the-woods";

const get_width = (id, max_width) => {

    const id_width = document.getElementById(id).clientWidth;
    return typeof max_width === "undefined" ?
        id_width : Math.min(id_width, max_width);

}

const sketch_walk_in_the_woods = (p5) => {

    const aspect_ratio = 3024 / 4032,
        background_color = p5.color(0, 0, 0), // Black
        frame_rate = 24,
        golden_ratio = (1 + Math.sqrt(5)) / 2,
        image_scale = {
            begin: 1 / golden_ratio ** 3,
            end: golden_ratio ** 5,
            max: golden_ratio ** 3,
            n_per_dimension: 3,
            step: golden_ratio ** (1 / (5 * frame_rate))
        },
        wood_at_frame_scale = 5;;

    let canvas_height = 0,
        canvas_width = 0,
        images = [],
        img_height = 0,
        img_width = 0,
        woods = structuredClone(WOODS); // Mutable

    // Add 'at_frame' to wood
    const wood_at_frame = (wood) => {
        wood.at_frame = Math.floor(wood_at_frame_scale * wood.StartTime);
        return wood;
    };


    // Random x- and y-offsets
    const random_shuffle = (array, start = 0, end = array.length - 1) => {

        // See https://stackoverflow.com/a/12646864/547331 + Google AI
        for (let i = end; i >= start; i -= 1) {
            const j = Math.floor(Math.random() * (i - start + 1)) + start;
            [array[i], array[j]] = [array[j], array[i]];
        }

    };

    const random_offset = ((n_per_dim) => {

        // Avoid horizontal overlap with offset columns;
        const col_offsets = [...Array(n_per_dim).keys()].map((x) => x + 1/2),
            row_offsets = [...Array(n_per_dim).keys()].map((x) => x + 1/2);
        random_shuffle(col_offsets);
        random_shuffle(row_offsets);

        return {
            x() {
                // Avoid choosing from the same column twice in succesion
                // by inserting the offset into the (re-shuffled) tail of
                // the array
                const offset = row_offsets.shift();
                row_offsets.push(offset);
                random_shuffle(row_offsets, 1)
                return img_width * offset;
            },

            y() {
                const offset = col_offsets.shift();
                col_offsets.push(offset);
                random_shuffle(col_offsets, 1)
                return img_height * offset;
            }
        };

    })(image_scale.n_per_dimension);

    // Image load & draw
    const image_load = (wood) => {

        // Push object onto 'images' array asynchronously; is this ok?
        p5.loadImage(IMG_PREFIX + wood.FileName, (img) => {
            images.push({
                image: img,
                scale: image_scale.begin,
                x_offset: random_offset.x(),
                y_offset: random_offset.y()
            });
        });

    };

    const image_draw = (img) => {

        const dest_scale = Math.min(img.scale, 1),
            source_scale = Math.max(1, Math.min(img.scale, image_scale.max)),

            dest_height = img_height * dest_scale,
            dest_width = img_width * dest_scale,
            dest_x_offset = img.x_offset - dest_width / 2,
            dest_y_offset = img.y_offset - dest_height / 2,

            source_height = img.image.height / source_scale,
            source_width = img.image.width / source_scale,
            source_x_offset = img.image.width / 2 - source_width / 2,
            source_y_offset = img.image.height / 2 - source_height / 2;

        // Limit tint() to this image
        p5.push();

        if (img.scale > image_scale.max) {
            // Fade full-sized images
            const alpha = 1 -
                  (img.scale - image_scale.max) /
                  (image_scale.end - image_scale.max);
            p5.tint(255, alpha);
        }

        p5.strokeWeight(1).fill(background_color).
            rect(dest_x_offset, dest_y_offset, dest_width, dest_height);
        p5.image(
            img.image,
            // Desination
            dest_x_offset, dest_y_offset, dest_width, dest_height,
            // Source
            source_x_offset, source_y_offset, source_width, source_height
        );

        p5.pop();

        img.scale *= image_scale.step;
        return img;

    }

    // P5
    p5.setup = () => {

        canvas_width = get_width(SKETCH_WALK_IN_THE_WOODS_ID);
        canvas_height = canvas_width / aspect_ratio;
        img_width = canvas_width / image_scale.n_per_dimension;
        img_height = img_width / aspect_ratio;
        woods = woods.map(wood_at_frame);

        p5.createCanvas(canvas_width, canvas_height);
        p5.frameRate(frame_rate);
        p5.colorMode(p5.HSB);

        p5.describe("A Walk in the Woods");

    }

    p5.draw = () => {

        p5.background("black");

        // Load wood into image queue
        woods.
            filter(wood => wood.at_frame <= p5.frameCount).
            forEach(image_load);

        // Remove dead wood
        woods = woods.
            filter(wood => wood.at_frame > p5.frameCount);

        // Display images, and remove dead images
        images =
            images.map(image_draw).
            filter(img => img.scale <= image_scale.end);

        // Done
        if ((woods.length == 0) && (images.length == 0)) {
            p5.noLoop();
        }

    }

}

new p5(sketch_walk_in_the_woods, SKETCH_WALK_IN_THE_WOODS_ID);

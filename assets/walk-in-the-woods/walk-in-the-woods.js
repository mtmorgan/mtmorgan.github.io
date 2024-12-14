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
    let ith_image = 0;
    const golden_ratio = (1 + Math.sqrt(5)) /2;
    const frame_rate = 24;
    const aspect_ratio = 3024 / 4032;
    let img_width;
    let img_height;
    const image_scale = {
        min: 1 / (golden_ratio ** 2),
        step: (golden_ratio ** (1/(5 * frame_rate))),
        max: golden_ratio ** 2
    };
    let image_queue;

    function image_load(json) {
        const y_range = canvas_height - img_height;
        const x_range = canvas_width - img_width;
        return {
            scale: image_scale.min,
            texture: p.loadImage(IMG_PREFIX + json.FileName),
            x_offset: Math.floor(p.random(x_range) - x_range / 2),
            y_offset: Math.floor(p.random(y_range) - y_range / 2),
            start_at_frame: Math.floor(4 * json.StartTime)
        };
    }

    function image_draw(img) {
        const img_scale = img.scale > 1 ? 1 : img.scale
        p.push();
        p.translate(img.x_offset, img.y_offset).scale(img_scale).
            texture(img.texture).
            rect(-img_width / 2, -img_height / 2, img_width, img_height);
        p.pop();
    }

    p.preload = () => {
        canvas_width = get_width(SKETCH_WALK_IN_THE_WOODS_ID);
        canvas_height = aspect_ratio * canvas_width;
        img_height = canvas_height / golden_ratio;
        img_width = aspect_ratio * img_height;
        image_queue = woods.map(image_load);
    }

    p.setup = () => {
        p.createCanvas(canvas_width, canvas_height, p.WEBGL);
        p.frameRate(frame_rate);
        p.describe("A Walk in the Woods");
    }

    p.draw = () => {
        p.background("black");
        for (let i = 0; i < image_queue.length; ++i) {
            const img = image_queue[i];
            if (img.start_at_frame <= p.frameCount) {
                image_draw(img);
                img.scale *= image_scale.step;
            }
            if (img.scale > image_scale.max)
                image_queue.shift();
        }
        if (image_queue.length == 0)          // done
            p.noLoop();
    }
}

new p5(sketch_walk_in_the_woods, SKETCH_WALK_IN_THE_WOODS_ID);

import '/assets/p5/libraries/p5.min.js';

class Line {
    constructor(x, y, length, delta, offset, n, color) {
        this.x = x;
        this.y = y;
        this.length = length;
        this.delta = delta;
        this.offset = offset;
        this.n = n;
        this.color = color;     // HSB color
    }

    done() {
        return this.n <= 0;
    }
}

class VerticalLine extends Line {
    constructor(offset, delta, width, height, color) {
        let n = Math.floor(width / offset - 1);
        super(offset - 1, 0, height, delta, offset, n, color);
    }

    step() {
        if (this.done())
            return;
        if (this.y < this.length) {
            this.y += this.delta;
        } else {
            this.y = 0;
            this.x += this.offset
            this.n -= 1;
        }
    }

    show(p) {
        p.stroke(this.color).line(this.x, this.y, this.x, this.y + this.delta);
        this.step();
    }
}

class HorizontalLine extends Line {
    constructor(offset, delta, width, height, color) {
        let n = Math.floor(height / offset - 1);
        super(0, height - offset, width, delta, offset, n, color);
    }

    step() {
        if (this.done())
            return;
        if (this.x < this.length) {
            this.x += this.delta;
        } else {
            this.x = 0;
            this.y -= this.offset;
            this.n -= 1;
        }
    }

    show(p) {
        p.stroke(this.color).line(this.x, this.y, this.x + this.delta, this.y);
        this.step();
    }
}

const sketch_am = (p) => {
    // Agnes Martin's canvases were usually square, 60" x 60"
    const am_width = 600;
    const am_height = 600;
    const am_framerate = 24;
    const x_offset = 20;
    const y_offset = 60;
    const delta = 8;

    p.colorMode(p.HSB);
    const background_color = p.color(32, 9, 80);
    const vertical_line_color = p.color(32, 9, 60);
    const horizontal_line_color = p.color(32, 9, 50);

    const h_line = new VerticalLine(
        x_offset, delta, am_width, am_height, vertical_line_color);
    const v_line = new HorizontalLine(
        y_offset, delta, am_width, am_height, horizontal_line_color);
    let line = h_line;
    let is_vertical = true;

    p.setup = () => {
        // canvas
        p.createCanvas(am_width, am_height);
        p.background(background_color);
        p.strokeWeight(1);
        p.stroke("LightGray").
            fill(background_color).
            rect(0, 0, am_width, am_height);

        p.frameRate(am_framerate);

        p.describe("Agnes Martin Sketches");
    }

    p.draw = () => {
        line.show(p);
        if (line.done()) {
            if (is_vertical) {
                line = v_line;
                is_vertical = false;
            } else {
                p.noLoop();     // all done!
            }
        }
    }
}

new p5(sketch_am, "sketch-agnes-martin");

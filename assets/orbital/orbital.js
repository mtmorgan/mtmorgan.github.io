import '/assets/p5/libraries/p5.min.js';

function radians(x) {
    return Math.PI * x / 180;
}

const EARTH = {
    radius: 6378,                         // km
    period: 2 * Math.PI / (23 * 60 + 56), // scaled minutes
    inclination: radians(23.5)            // radians
};

const ISS = {
    orbit: EARTH.radius + 400,  // km
    period: 2 * Math.PI / 92,   // scaled minutes
    inclination: radians(51.6)  // radians
};

const PARAM = {
    texture_file: "/assets/orbital/world.topo.bathy.200411.3x5400x2700.jpg",
    scale2d: 1 / 50,
    scale3d: 1 / 50,
    frame_rate: 6,
    dt: 2
};

class Orbit {
    constructor(period, inclination, t0, dt, n_points) {
        // satellite orbit
        this.period =  period;          // scaled
        this.inclination = inclination; // radians
        this.dt = dt;
        this.n_points = n_points;

        // starting time
        this.t = t0;

        // pre-calculated points
        this.ith_point = 0;
        this.points = Array(Math.floor(n_points - 1));
        for (let i = 0; i < n_points; ++i)
            this.update();
    }

    position() {
        // 3-dimensional position at current time t
        const x = Math.cos(this.period * this.t)
        const y = Math.sin(this.period * this.t) * Math.cos(this.inclination);
        const z = Math.sin(this.period * this.t) * Math.sin(this.inclination);
        return {time: this.t, x: x, y: y, z: z};
    }

    update() {
        // update one point
        this.points[this.ith_point] = this.position();
        this.t += this.dt;
        this.ith_point  = (this.ith_point + 1) % this.points.length;
    }
}

class Orbit2D extends Orbit {
    constructor(period, inclination, dt, n_points) {
        const t0 = -dt * n_points;
        super(period, inclination, t0, dt, n_points);
    }

    wrap_360(x) {
        // utility ensuring 'x' is always -180 - 180
        const range = 2 * Math.PI;
        return ((x + Math.PI) % range + range) % range - Math.PI;
    }

    position_2d() {
        const position = this.points[this.ith_point];
        const earth_offset = EARTH.period * position.time;
        const longitude =
              this.wrap_360(Math.atan2(position.y, position.x) - earth_offset);
        const latitude = Math.asin(position.z);
        return [longitude / Math.PI, latitude / Math.PI];
    }

    draw_points(p, width, height) {
        // draw each position
        for (let i = 0; i < this.points.length; ++i) {
            const alpha = p.map(i, 0, this.points.length, 0, 255);
            const [longitude, latitude] = this.position_2d();
            p.strokeWeight(1).stroke(255, 255, 255, alpha).
                fill(0, 0, 0, alpha).
                circle((width / 2) * longitude, -height * latitude, 4);
            this.ith_point = (this.ith_point + 1) % this.points.length;
        }
    }
}

class Orbit3D extends Orbit {
    constructor(period, inclination, dt, n_points) {
        // const t0 = -period / 2; // start orbit at equator, heading north
        const t0 = 0;
        super(period, inclination, t0, dt, n_points);
    }

    draw_points(p, radius, rotation, rotation_dt) {
        p.push();

        const offset =
              Math.PI / 2 - rotation + 
              rotation_dt * this.points.length; // at coordinate [0, 1, 0]
        p.rotateY(offset);
        p.strokeWeight(1);
        const t0 = this.points[this.ith_point].time;
        for (let i = 0; i < this.points.length; ++i) {
            const alpha = p.map(i, 0, this.points.length, 0, 255);
            const from = this.points[this.ith_point];
            this.ith_point = (this.ith_point + 1) % this.points.length;

            p.push()
            p.rotateY(-rotation_dt * i);
            p.translate(-radius * from.x, radius * from.y, radius * from.z);
            p.stroke(255, 255, 255, alpha).fill(0, 0, 0, alpha).sphere(2);
            p.pop();
        }

        p.pop();
    }

    draw_orbit(p, radius) {
        for (let i = 0; i < this.points.length; ++i) {
            const from = this.points[this.ith_point];
            this.ith_point = (this.ith_point + 1) % this.points.length;
            const to = this.points[this.ith_point];
            p.strokeWeight(1).stroke("red").line(
                -radius * from.x, radius * from.y, radius * from.z,
                -radius * to.x, radius * to.y, radius * to.z
            );
        }
    }
}

const sketch_orbital = (p) => {
    // canvas dimensions, scaled to radius units
    const radius = EARTH.radius * PARAM.scale2d;
    const width = 2 * Math.PI * radius;
    const height = Math.PI * radius;

    const dt = PARAM.dt;
    const n_points = 8 * Math.PI / ISS.period / dt;

    const iss = new Orbit2D(ISS.period, ISS.inclination, dt, n_points);

    let earth_texture;

    p.preload = () => {
        earth_texture = p.loadImage(PARAM.texture_file);
    }

    p.setup = () => {
        p.createCanvas(width, height, p.WEBGL);
        p.frameRate(PARAM.frame_rate);
        p.strokeWeight(1);
        p.rect(-width / 2, -height / 2, width, height);
        p.line(-width / 2, 0, width / 2, 0);
        p.describe("Orbital Sketch");
    }

    p.draw = () => {
        p.strokeWeight(1).stroke("black");
        // p.fill("white").rect(-width / 2, -height / 2, width, height);
        p.texture(earth_texture).rect(-width / 2, -height / 2, width, height);
        p.stroke("red").line(-width / 2, 0, width / 2, 0);
        iss.draw_points(p, width, height);
        iss.update();
    }
}

const sketch_orbital_sphere = (p) => {
    // canvas dimensions, scaled to radius units
    const radius = EARTH.radius * PARAM.scale3d;
    const width = 2.2 * ISS.orbit * PARAM.scale3d;
    const height = 2.2 * ISS.orbit * PARAM.scale3d;

    const dt = PARAM.dt;
    const n_points = 4 * Math.PI / ISS.period / dt;
    const iss =
          new Orbit3D(ISS.period, radians(90) + ISS.inclination, dt, n_points);

    let earth_texture;
    let earth_rotation = Math.PI; // radians
    const earth_n_points = 2 * Math.PI / EARTH.period / dt;
    const equator = new Orbit3D(EARTH.period, radians(90), dt, earth_n_points);
    const earth_rotation_dt = dt * EARTH.period;

    p.preload = () => {
        earth_texture = p.loadImage(PARAM.texture_file);
    }

    p.setup = () => {
        p.createCanvas(width, height, p.WEBGL);
        p.frameRate(PARAM.frame_rate);
        p.texture(earth_texture);
        p.describe("Orbital Earth Sketch");
    }

    p.draw = () => {
        earth_rotation += earth_rotation_dt;
        p.background(0);
        p.noStroke();
        p.directionalLight(255, 255, 255, -1, 0, -1);
        p.directionalLight(255, 255, 255, -1, 0, -1);
        p.rotateZ(EARTH.inclination);
        p.rotateY(earth_rotation);
        p.sphere(radius, 24, 24);
        equator.draw_orbit(p, radius);
        iss.draw_points(
            p, ISS.orbit * PARAM.scale3d,
            earth_rotation, earth_rotation_dt
        );
        iss.update();
    }
}

new p5(sketch_orbital, "sketch-orbital");

new p5(sketch_orbital_sphere, "sketch-orbital-sphere");

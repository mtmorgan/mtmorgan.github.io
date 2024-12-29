import '/assets/p5/libraries/p5.min.js';

const SKETCH_PROJECTION_ID = "sketch-projection";
const SKETCH_SPHERE_ID = "sketch-sphere";
const SKETCH_ORBITAL_ID = "sketch-orbital";

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

    draw_points = (
        p, radius, rotation, rotation_dt,
        sphere_scale = 1, sphere_fill = p.color("white")) =>
    {
        const offset =
              Math.PI / 2 - rotation +
              rotation_dt * this.points.length; // at coordinate [0, 1, 0]
        const alpha_max = sphere_fill.maxes[sphere_fill.mode][3];

        p.push();
        p.rotateY(offset);
        const t0 = this.points[this.ith_point].time;
        for (let i = 0; i < this.points.length; ++i) {
            const alpha = p.map(i, 0, this.points.length, 0, alpha_max);
            const from = this.points[this.ith_point];
            const size = i == this.points.length - 1 ? sphere_scale * 4 : 4;
            this.ith_point = (this.ith_point + 1) % this.points.length;

            p.push()
            p.rotateY(-rotation_dt * i);
            p.translate(-radius * from.x, radius * from.y, radius * from.z);
            sphere_fill.setAlpha(alpha);
            p.noStroke().fill(sphere_fill).sphere(size);
            p.pop();
        }
        p.pop();
    }

    draw_orbit(p, radius, stroke_color = p.color("red")) {
        for (let i = 0; i < this.points.length; ++i) {
            const from = this.points[this.ith_point];
            this.ith_point = (this.ith_point + 1) % this.points.length;
            const to = this.points[this.ith_point];
            p.strokeWeight(1).stroke(stroke_color).line(
                -radius * from.x, radius * from.y, radius * from.z,
                -radius * to.x, radius * to.y, radius * to.z
            );
        }
    }
}

const sketch_orbital_projection = (p) => {
    // canvas dimensions, scaled to radius units
    let width = 0; // defined in p.setup() 2 * Math.PI * radius;
    let height = 0; // Math.PI * radius;

    const dt = PARAM.dt;
    const n_points = 8 * Math.PI / ISS.period / dt;

    const iss = new Orbit2D(ISS.period, ISS.inclination, dt, n_points);

    let earth_texture;

    p.preload = () => {
        earth_texture = p.loadImage(PARAM.texture_file);
    }

    p.setup = () => {
        width = document.getElementById(SKETCH_PROJECTION_ID).
            clientWidth;
        height = width / 2;

        p.createCanvas(width, height, p.WEBGL);
        p.frameRate(PARAM.frame_rate);
        p.strokeWeight(1);
        p.rect(-width / 2, -height / 2, width, height);
        p.line(-width / 2, 0, width / 2, 0);
        p.describe("Orbital Sketch");
    }

    p.draw = () => {
        p.strokeWeight(1).stroke("black");
        p.texture(earth_texture).rect(-width / 2, -height / 2, width, height);
        p.stroke("red").line(-width / 2, 0, width / 2, 0);
        iss.draw_points(p, width, height);
        iss.update();
    }
}

const sketch_orbital_sphere = (p) => {
    // canvas dimensions, scaled to radius units
    let scale;

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
        const width = Math.min(
            document.getElementById(SKETCH_SPHERE_ID).clientWidth,
            500
        );
        const height = width;
        scale = height / 2.2 / ISS.orbit;

        p.createCanvas(width, height, p.WEBGL);
        p.frameRate(PARAM.frame_rate);
        p.texture(earth_texture);
        p.describe("Orbital Earth Sketch");
    }

    p.draw = () => {
        const radius = EARTH.radius * scale;
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
            p, ISS.orbit * scale,
            earth_rotation, earth_rotation_dt
        );
        iss.update();
    }
}

const sketch_orbital = (p) => {
    // canvas dimensions, scaled to radius units
    let scale = 0;

    const dt = 1;
    const n_points = 82;
    const frame_rate = 92 / 60;
    const iss =
          new Orbit3D(ISS.period, radians(90) - ISS.inclination, dt, n_points);
    const sphere_scale = 1.618;

    const equator_n_points = 2 * Math.PI / EARTH.period / dt;
    const equator =
          new Orbit3D(EARTH.period, radians(90), dt, equator_n_points);

    // Updated when get_location() eventually resolves; defaul Hill cabin
    let device_location = {
        x: -0.22181507267591796,
        y: -0.7471665585537772,
        z: 0.6265302924142472
    };
    const device_size = 8;
    const earth_rotation_dt = dt * EARTH.period;
    let earth_rotation = 0;
    // Orientation away from 'reality'
    const akimbo = -Math.PI / 64;

    // colors
    const x_axis = p.createVector(1, 0, 0);
    const z_axis = p.createVector(0, 0, 1);
    const ambient_light = p.color(40);
    let light_direction = p.createVector(0, 1, 0);
    light_direction = rotate_around(light_direction, x_axis, -Math.PI / 8);
    light_direction = rotate_around(light_direction, z_axis, Math.PI / 8);

    p.colorMode(p.HSB);
    const background_color = p.color(230, 100, 25);
    const earth_color = p.color(125, 75, 25);
    const sphere_color = p.color(125, 75, 70);
    const equator_color = p.color(125, 75, 40);
    const device_color = p.color(125, 75, 50);
    const light_color = p.color(0, 0, 100);

    // https://stackoverflow.com/a/67468546/547331
    // Rotate one vector (vect) around another (axis) by the specified angle.
    function rotate_around(vect, axis, angle) {
        // Make sure our axis is a unit vector
        axis = p5.Vector.normalize(axis);

        return p5.Vector.add(
            // v cos(theta)
            p5.Vector.mult(vect, Math.cos(angle)),
            p5.Vector.add(
                // (k x v) sin(theta)
                p5.Vector.mult(
                    p5.Vector.cross(axis, vect),
                    Math.sin(angle)
                ),
                // k (k . v) (1 - cos(theta))
                p5.Vector.mult(
                    p5.Vector.mult(axis, p5.Vector.dot(axis, vect)),
                    (1 - Math.cos(angle))
                )
            )
        );
    }

    // https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API
    function get_device_location() {
        if (navigator.onLine && navigator.geolocation) {
            device_location = null;
            navigator.geolocation.getCurrentPosition((position) => {
                // latitude and longitude in radians
                const lat = radians(position.coords.latitude);
                const lon = radians(position.coords.longitude);

                device_location = {
                    x: Math.cos(lat) * Math.cos(lon),
                    y: Math.cos(lat) * Math.sin(lon),
                    z: Math.sin(lat)
                };
            });
        }
    }

    p.setup = () => {
        const width = Math.min(
            document.getElementById(SKETCH_ORBITAL_ID).clientWidth,
            500
        );
        const height = width;
        scale = (height / 2.2) / ISS.orbit;
        p.createCanvas(width, height, p.WEBGL);
        p.frameRate(frame_rate);
        get_device_location();  // if allowed & available; lazy

        p.describe("Orbital Earth Sketch");
    }

    p.draw = () => {
        const radius = EARTH.radius * scale;
        p.background(background_color);
        p.rotateX(akimbo).rotateY(akimbo).rotateZ(EARTH.inclination);
        p.directionalLight(light_color, light_direction).
            directionalLight(light_color, light_direction);
        p.ambientLight(ambient_light);
        //  p.noStroke().fill(earth_color).sphere(radius, 24, 24);
        iss.draw_points(p, ISS.orbit * scale, 0, 0, sphere_scale, sphere_color);
        equator.draw_orbit(p, radius, equator_color);

        //add device location, if / when available
        if (device_location != null) {
            const from = device_location;
            earth_rotation += earth_rotation_dt;
            p.push()
            p.rotateY(earth_rotation);
            p.translate(-radius * from.x, radius * from.y, radius * from.z);
            p.noStroke().fill(device_color).sphere(device_size);
            p.pop();
        }

        iss.update();
    }
}

new p5(sketch_orbital_projection, SKETCH_PROJECTION_ID);

new p5(sketch_orbital_sphere, SKETCH_SPHERE_ID);

new p5(sketch_orbital, SKETCH_ORBITAL_ID);

import binomial from 'https://cdn.jsdelivr.net/gh/stdlib-js/random-base-binomial@esm/index.mjs';

const SKETCH_ID = 'sketch-boogie-bubble';

const sketch_boogie_bubble = (p) => {
    // simulation parameters
    const population_n = 50000;
    const mutation_rate = .100 / population_n;

    // data
    let population = [];
    let generations = 0;
    let allele_id = 0;
    const common_alleles = new Set();

    // display constants
    let width_n = 0;                // defined in setup()
    const height_n = 500;
    const summary_lines = 3 * 16;
    let max_radius;
    let max_area;
    const alpha = 200;
    const frame_rate = 24;
    const generations_per_frame = 200;

    function allele_new(n = 1) {
        return {
            id: allele_id++,
            x: max_radius + p.random(width_n - 2 * max_radius),
            y: max_radius + p.random(height_n - 2 * max_radius),
            color: p.color(p.random(256), p.random(256), p.random(256), alpha),
            n: n
        };
    }

    function allele_copy(allele, n) {
        return {
            id: allele.id,
            x: allele.x,
            y: allele.y,
            color: allele.color,
            n: n
        };
    }

    function mutate(population_n, mutation_rate, new_population) {
        const mutation_n = binomial(population_n, mutation_rate);
        for (let i = 0; i < mutation_n; ++i)
            new_population.push(allele_new());
        return mutation_n;
    }

    function replicate(population, n, new_population) {
        let population_size = population_n;
        for (let i = 0; i < population.length && n > 0; ++i) {
            const indiv = population[i];
            const new_n = binomial(n, indiv.n / population_size);
            if (Number.isNaN(new_n))
                console.log(new_n);
            if (new_n != 0)
                new_population.push(allele_copy(indiv, new_n));
            population_size -= indiv.n;
            n -= new_n;
        }
    }

    function generation() {
        let new_population = [];
        const mutation_n = mutate(population_n, mutation_rate, new_population);
        replicate(population, population_n - mutation_n, new_population);
        return new_population;
    }

    p.setup = () => {
        width_n = document.getElementById(SKETCH_ID).clientWidth;
        max_radius = Math.min(height_n, width_n) / 2.;
        max_area = Math.PI * max_radius ** 2.;

        p.createCanvas(width_n, height_n + summary_lines);
        p.frameRate(frame_rate);
        p.strokeWeight(1);
        population.push(allele_new(population_n));
    }

    p.draw = () => {
        for (let n_gen = 0; n_gen < generations_per_frame; ++n_gen) {
            population = generation();
            generations += 1;
        }

        // display
        p.fill("black").rect(0, 0, width_n, height_n);
        population.sort((a, b) => b.n - a.n);
        // 'common' allele at some point in simulation
        if (population.length == 1 || population[0].n > 2 * population[1].n)
            common_alleles.add(population[0].id);

        // display
        for (const indiv of population) {
            const area = max_area * indiv.n / population_n;
            const radius = Math.sqrt(area / Math.PI);
            p.fill(indiv.color).circle(indiv.x, indiv.y, 2 * radius);
        }

        // summary stats
        const Nu = Math.round(population_n * mutation_rate * 100) / 100.;
        const t = Math.round(generations / population_n * 100) / 100.;
        const stats_text = `Population (N): ${population_n}; Mutation rate (N \u00B5): ${Nu}
Time (t / N): ${t}
Alleles: Segregating: ${population.length}; Replacements: ${common_alleles.size}`;
        p.fill("white").rect(0, height_n, width_n, height_n + summary_lines);
        p.fill("black").text(stats_text, 0, height_n + 12);
    }
}

new p5(
    sketch_boogie_bubble,
    document.getElementById(SKETCH_ID)
);

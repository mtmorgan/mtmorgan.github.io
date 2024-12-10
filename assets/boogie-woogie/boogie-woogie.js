const SKETCH_CLASS = 'p5-boogie-woogie-canvas';

let size = 0;
const width_n = 71;
const height_n = 71;
const summary_lines = 3 * 16;
const population_n = width_n * height_n;
const mutation_rate = 0.1 / population_n;
const frame_n = 12;
const generatons_per_frame = 50;

let population = [];
let generations = 0;
let allele_id = 0;
const common_alleles = new Set();

function allele_new() {
    return {
        id: allele_id++,
        color: color(random(256), random(256), random(256), alpha)
    };
}

function generation() {
    // mutation
    mutation_n = binomial(population_n, mutation_rate);
    for (let i = 0; i < mutation_n; ++i)
        population[floor(random(population_n))] = allele_new();
    // replication
    population = sample(population);
    generations += 1;
}

function setup() {
    const wd = document.getElementsByClassName(SKETCH_CLASS)[0].clientWidth;
    size = max(1, floor(wd / width_n));
    const p5div = select("div." + SKETCH_CLASS);
    let canvas = createCanvas(width_n * size, height_n * size + summary_lines);
    p5div.child(canvas);

    frameRate(frame_n);
    strokeWeight(0);
    population[0] = allele_new();
    for (let i = 1; i < population_n; ++i)
        population[i] = population[0];
}

function draw() {
    for (let i = 0; i < generatons_per_frame; ++i)
        generation();

    // draw
    const alleles = new Map();
    for (let i = 0; i < population.length; ++i) {
        const indiv = population[i];
        const x = (i % width_n) * size;
        const y = floor(i / width_n) * size;
        fill(indiv.color).square(x, y, size);
        let n = 1;
        if (alleles.has(indiv.id))
            n = alleles.get(indiv.id) + 1;
        alleles.set(indiv.id, n)
    }

    for (const [key, value] of alleles) {
        if (value > 0.8 * population_n)
            common_alleles.add(key);
    }
        
    // summary stats
    const Nu = Math.round(population_n * mutation_rate * 100) / 100.;
    const t = Math.round(generations / population_n * 100) / 100.;
    const stats_text = `Population (N): ${population_n}; Mutation rate (N \u00B5): ${Nu}
Time (t / N): ${t}
Alleles: Segregating: ${alleles.size}; Replacements: ${common_alleles.size - 1}`;
    fill("white").rect(0, height_n * size, width_n * size, height_n * size + summary_lines);
    fill("black").text(stats_text, 0, height_n * size + 12);
}

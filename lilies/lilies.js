import LILIES from "./lilies.json" with { type: "json" };
import DataTable from 'datatables.net';
import "https://cdn.plot.ly/plotly-3.0.1.min.js";

// DataTable

const lilies_as_datatables_data = () => {
    const dataset = [];

    LILIES.map(lilies => {

        const start_date = new Date(lilies.start);

        for (let i = 0; i < lilies.count.length; ++i) {

            // sequential dates, mapped to a single year
            const date = new Date(start_date);
            date.setDate(start_date.getDate() + i);

            // row of data set
            dataset.push([ date, lilies.count[i] ]);
        }
    });

    return dataset;
}

const datatable_update_dom = () => {
    const table = document.getElementById('daily-table');
    const dataset = lilies_as_datatables_data();

    var dailies = new DataTable(table, {
        data: dataset,
        columns: [
            {
                title: "Date",
                render: (data, type, row) => {
                    if (data) {
                        const date = new Date(data); // Create a Date object
                        const year = date.getFullYear();
                        const month = (date.getMonth() + 1).toString().
                              padStart(2, '0'); // Months are 0-indexed
                        const day = date.getDate().toString().padStart(2, '0');
                        return `${year}-${month}-${day}`;
                    }
                    return data;
                }
            },
            { title: "Count" }
        ],
        scrollY: '200px',
        paging: false
    });
}

document.addEventListener("DOMContentLoaded", datatable_update_dom);

// Plotly

const lilies_as_plotly_data = () => {
    const plotly_data = [];     // array of objects

    LILIES.map(lilies => {

        // a new year
        const start_date = new Date(lilies.start);
        const year = start_date.getFullYear();
        let cumulative_count = 0;

        // initialize x, y data for each year
        let year_data = {
            x: [],
            y: [],
            name: year,
        };

        for (let i = 0; i < lilies.count.length; ++i) {

            // skip missing values
            if (lilies.count[i] === null)
                continue;

            // sequential dates, mapped to a single year
            const calendar_date = new Date(start_date);
            calendar_date.setDate(start_date.getDate() + i);
            calendar_date.setYear("2024");

            // cumulative counts
            cumulative_count += lilies.count[i];

            // row of data set
            year_data.x.push(calendar_date);
            year_data.y.push(cumulative_count);
        }

        // add year data set
        plotly_data.push(year_data);
    });

    return plotly_data;
}

const plotly_update_dom = () => {

    // lily data
    const lilies_data = lilies_as_plotly_data();

    // year info
    const year_info = {
        type: 'scatter',
        mode: 'lines+markers'
    };
    let l_color = 90;

    // merge year data, year info, and plot info
    const data = lilies_data.map(year_data => {

        const color = "hsl(32, 100, " + l_color +")";
        l_color -= 15;
        const plot_info = {
            marker: { color: color },
            legendgroup: year_data.name
        };

        return { ...year_data, ...year_info, ...plot_info };
    });

    // Plotly layout definition
    const layout = {
        title: 'Daily Lilies',
        xaxis: {
            title: { text: 'Calendar Date' },
            tickformat: '%B %e',
            ticks: 'outside',
            type: 'date'
        },
        yaxis: {
            title: { text: 'Cumulative Count' },
            ticks: 'outside',
            zeroline: false
        }
    };

    const config = {
        responsive: true
    };

    // Plotly plot
    Plotly.newPlot('daily-plotly', data, layout, config);

}

document.addEventListener("DOMContentLoaded", plotly_update_dom);

// window.addEventListener('resize', plotly_update_dom);

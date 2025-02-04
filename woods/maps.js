import * as L from '/assets/leaflet/leaflet-src.esm.js';

// Common map elements

const map_view = [43.89730, -79.8758];
const map_zoom = 16;
const gps_color = '#8da0cb';
const lot_color = '#fc8d62';

// Set map as square, filling column width; should be in CSS

const div_width = document.getElementById('map').clientWidth;
const div_style = `width:${div_width}px; height:${div_width}px`;
document.getElementById('map').setAttribute("style", div_style);

// Image and topo map

const image = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    }
)

const topo = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    {
        attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
    }
)

// GPS track

const as_LineString = (gps) => {
    let coordinates = gps.features
        .filter(feature => typeof feature.geometry != "undefined")
        .map(feature => feature.geometry.coordinates);
    return {
        type: "LineString",
        coordinates: coordinates
    };
}

const gps_track = await fetch('/woods/another.geojson')
    .then(response => response.json())
    .catch(error => console.error("reading GPS track: ", error));

const trail_start = new L.geoJSON(
    gps_track.features.find(feature => typeof feature.geometry != "undefined")
);

const trail_track = new L.geoJSON(as_LineString(gps_track), {
    color: gps_color
});

const trail = L.featureGroup([trail_start, trail_track]);

// Lot boundaries

const lot_boundaries = {
    type: "Feature",
    geometry: {
        type: "Polygon",
        coordinates: [[
            [-79.88031, 43.89948],
            [-79.88140, 43.89844],
            [-79.87843, 43.89613],
            [-79.87626, 43.89452],
            [-79.87114, 43.89904],
            [-79.87342, 43.90079],
            [-79.87692, 43.89754],
            [-79.88031, 43.89948]
        ]]
    }
};

const lot = L.geoJSON(lot_boundaries, {
    color: lot_color,
    weight: 1,
    fillOpacity: 0
});

// Map

const map = L.map('map', {
    center: map_view,
    zoom: map_zoom,
    layers: [topo, trail, lot]
});

// Layer control

const maps = {
    Map: topo,
    Satellite: image
};

const layer_control = L.control.layers(maps).addTo(map);

let map;
let trafficFlowLayer;
let trafficIncidentsLayer;
const tomtomKey = 'CUpygEvKtS0IWBc06QJawQldwhJE0PXw'; // Replace with your TomTom API key

// Initialize the map
function initMap() {
    // Default location
    const defaultLocation = { lat: 6.1517, lng: 6.7857 }; // Onitsha, Nigeria
    // Create a new TomTom map
    map = tt.map({
        key: tomtomKey,
        container: 'map',
        center: defaultLocation,
        zoom: 12,
    });
    // Add traffic flow and incident layers
    trafficFlowLayer = tt.TrafficFlowLayer({ key: tomtomKey });
    trafficIncidentsLayer = tt.TrafficIncidentsLayer({ key: tomtomKey });
    map.addLayer(trafficFlowLayer);
    map.addLayer(trafficIncidentsLayer);
}

// Function to set location based on user input
function setLocation() {
    const location = document.getElementById('location').value;
    geocodeLocation(location);
}

// Function to use user geolocation
function getUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const pos = [position.coords.longitude, position.coords.latitude];
                map.setCenter(pos);
            },
            () => {
                alert('Error: The Geolocation service failed.');
            }
        );
    } else {
        alert('Error: Your browser doesn\'t support geolocation.');
    }
}

// Geocode location (use TomTom's Search API)
function geocodeLocation(location) {
    const geocodeUrl = `https://api.tomtom.com/search/2/geocode/${encodeURIComponent(location)}.json?key=${tomtomKey}`;
    fetch(geocodeUrl)
        .then(response => response.json())
        .then(data => {
            if (data.results && data.results.length > 0) {
                const latLng = data.results[0].position;
                map.setCenter([latLng.lon, latLng.lat]);
                fetchTrafficIncidents();
                suggestAlternativeRoutes();
            } else {
                alert('Location not found.');
            }
        })
        .catch(err => console.error('Error in geocoding:', err));
}

// Refresh traffic data every 5 minutes
setInterval(() => {
    trafficFlowLayer.refresh();
    trafficIncidentsLayer.refresh();
}, 300000); // 5 minutes in milliseconds

// Initialize map when the page loads
window.onload = initMap;

// Function to calculate route
function calculateRoute(start, end) {
    const routeUrl = `https://api.tomtom.com/routing/1/calculateRoute/${start[1]},${start[0]}:${end[1]},${end[0]}/json?traffic=true&key=${tomtomKey}`;
    fetch(routeUrl)
        .then(response => response.json())
        .then(data => {
            const route = data.routes[0].legs[0];
            // Create a polyline on the map for the route
            const coordinates = route.points.map(point => [point.longitude, point.latitude]);
            const routeLine = new tt.Polyline({
                positions: coordinates,
                color: 'blue',
                width: 5
            });
            map.addLayer(routeLine);
            map.fitBounds(routeLine.getBounds());
        })
        .catch(err => console.error('Error calculating route:', err));
}

// Example usage with Onitsha to Awka (adjust for your locations)
const start = [6.7857, 6.1517]; // Onitsha
const end = [7.0717, 6.2103];   // Awka
calculateRoute(start, end);

// Function to fetch and display traffic incidents
function displayTrafficAlerts() {
    const incidentsUrl = `https://api.tomtom.com/traffic/services/4/incidents/s3/-90,-180,90,180/json?key=${tomtomKey}`;
    fetch(incidentsUrl)
        .then(response => response.json())
        .then(data => {
            data.incidents.forEach(incident => {
                // Add custom markers for incidents
                const incidentMarker = new tt.Marker()
                    .setLngLat([incident.longitude, incident.latitude])
                    .setPopup(new tt.Popup({ offset: 35 }).setText(incident.description))
                    .addTo(map);
            });
        })
        .catch(err => console.error('Error fetching incidents:', err));
}

// Call the function to display traffic alerts
displayTrafficAlerts();

// Add a custom marker
function addCustomMarker(lngLat, popupText) {
    const marker = new tt.Marker({ element: createCustomMarkerElement() })
        .setLngLat(lngLat)
        .setPopup(new tt.Popup({ offset: 35 }).setText(popupText))
        .addTo(map);
}

// Create a custom marker element (for example, a red circle)
function createCustomMarkerElement() {
    const markerElement = document.createElement('div');
    markerElement.style.width = '20px';
    markerElement.style.height = '20px';
    markerElement.style.backgroundColor = 'red';
    markerElement.style.borderRadius = '50%';
    return markerElement;
}

// Example usage
addCustomMarker([6.7857, 6.1517], 'Onitsha Traffic Camera');

// Function to toggle dark mode
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
}

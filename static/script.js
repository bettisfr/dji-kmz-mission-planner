// Global variables
let map; // Reference to the Google Map
let polyline; // Reference to the polyline connecting waypoints

// Dynamically load Google Maps API script without callback in URL
function loadGoogleMapsAPI() {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&v=weekly`; // Removed callback
    script.async = true;
    script.defer = true;
    script.onload = initMap; // Manually call initMap after the script loads
    document.head.appendChild(script);
}

// Call this function to load Google Maps API and initialize the map
loadGoogleMapsAPI();

// Map initialization function
function initMap() {
    console.log("Initializing Google Map...");
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 43.062715, lng: 12.551034 }, // Custom starting location
        zoom: 18,
        mapTypeId: google.maps.MapTypeId.SATELLITE, // Set map type to satellite
        styles: [
            {
                "elementType": "labels",
                "stylers": [{ "visibility": "off" }] // Hide labels on the map
            }
        ]
    });

    // Add click listener to the map
    map.addListener("click", function (event) {
        addWaypoint(event.latLng); // Call addWaypoint with the clicked location
    });

    // Load the current mission from the server
    loadMission();
}


// Function to load the mission data from the Flask server
function loadMission() {
    fetch('/load_mission')
        .then(response => response.json())
        .then(data => {
            // Visualize the mission on the map
            visualizeMission(data);
        })
        .catch(error => console.error('Error loading mission:', error));
}

// Function to handle adding a new waypoint when clicking on the map
function addWaypoint(latLng) {
    // Extract latitude and longitude from the clicked location
    const lat = latLng.lat();
    const lon = latLng.lng();

    // Send the new waypoint's coordinates to the server
    fetch('/add_waypoint', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ lat, lon })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to add waypoint on server.');
        }
        return response.json();
    })
    .then(data => {
        console.log(data.message); // Log success message from the server

        // After adding the waypoint on the server, reload the mission to visualize it
        loadMission(); // This function will update the map with the new waypoint
    })
    .catch(error => {
        console.error('Error adding waypoint:', error);
    });
}


// Function to initialize the mission visualization (called on page load or mission update)
function visualizeMission(data) {
    const waypointsList = document.getElementById('waypointsList');
    waypointsList.innerHTML = '<strong>Waypoints</strong>'; // Clear existing text

    const polylinePath = [];

    // Loop through each waypoint and add a marker to the map
    data.waypoints.forEach(waypoint => {
        addWaypointMarker(waypoint);
        polylinePath.push({ lat: waypoint.lat, lng: waypoint.lon });
        addWaypointToSidebar(waypoint);
    });

    // Remove the previous polyline if it exists
    if (polyline) {
        polyline.setMap(null);
    }

    // Draw a new polyline connecting the waypoints
    if (polylinePath.length > 1) {
        polyline = new google.maps.Polyline({
            path: polylinePath,
            geodesic: true,
            strokeColor: '#0000FF',  // Blue color
            strokeOpacity: 1.0,
            strokeWeight: 4  // Thick line
        });
        polyline.setMap(map);
    }
}

// Function to add a waypoint marker to the map
function addWaypointMarker(waypoint) {
    const marker = new google.maps.Marker({
        position: { lat: waypoint.lat, lng: waypoint.lon },
        map: map,
        title: `Waypoint ${waypoint.waypoint_id}`,
        label: `${waypoint.waypoint_id}`,
        labelOrigin: new google.maps.Point(0, 0), // Optional: Adjust label position
        draggable: true  // Make the marker draggable
    });

    // Add an info window for each marker
    const infoWindow = new google.maps.InfoWindow({
        content: `<h3>Waypoint ${waypoint.waypoint_id}</h3>
                  <p>Latitude: ${waypoint.lat}</p>
                  <p>Longitude: ${waypoint.lon}</p>`
    });

    marker.addListener('click', () => {
        infoWindow.open(map, marker);
    });

    // Listen for the marker being dragged and update the waypoint position
    marker.addListener('dragend', (event) => {
        const newLat = event.latLng.lat();
        const newLng = event.latLng.lng();

        // Update the waypoint object with the new coordinates
        waypoint.lat = newLat;
        waypoint.lon = newLng;

        // Update the waypoint details in the sidebar
        updateWaypointInSidebar(waypoint);

        // Send the updated coordinates to the server
        updateWaypoint(waypoint);

        // Update the polyline path dynamically
        updatePolylinePath();
    });
}

// Function to update the polyline path dynamically
function updatePolylinePath() {
    // Gather the latest waypoint positions
    const waypoints = [];
    document.querySelectorAll('[id^="waypoint-"]').forEach(element => {
        const id = parseInt(element.id.replace('waypoint-', ''), 10);
        const coordsText = element.querySelector('.waypoint-coordinates').textContent;
        const [lat, lon] = coordsText.split(',').map(coord => parseFloat(coord.trim()));
        waypoints.push({ waypoint_id: id, lat, lon });
    });

    // Update the polyline's path
    const newPath = waypoints.map(wp => ({ lat: wp.lat, lng: wp.lon }));
    if (polyline) {
        polyline.setPath(newPath);
    }
}

// Function to update the waypoint in the sidebar
function updateWaypointInSidebar(waypoint) {
    const waypointElement = document.getElementById(`waypoint-${waypoint.waypoint_id}`);
    waypointElement.querySelector('.waypoint-coordinates').textContent = `${waypoint.lat}, ${waypoint.lon}`;

    // Update the actions section with the updated details if needed
    const actionsList = waypointElement.querySelector('.actions-list');
    if (actionsList) {
        actionsList.innerHTML = ''; // Clear existing actions
        waypoint.actions.forEach(action => {
            const actionElement = document.createElement('div');
            actionElement.innerHTML = `Action ${action.action_id}: ${action.action_type}`;

            const parametersList = document.createElement('div');
            for (const [param, value] of Object.entries(action.parameters)) {
                const paramElement = document.createElement('div');
                paramElement.innerHTML = `${param}: ${value}`;
                parametersList.appendChild(paramElement);
            }

            actionElement.appendChild(parametersList);
            actionsList.appendChild(actionElement);
        });
    }
}

// Function to send the updated waypoint data to the server
function updateWaypoint(waypoint) {
    fetch('/update_waypoint', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            waypoint_id: waypoint.waypoint_id,
            lat: waypoint.lat,
            lon: waypoint.lon
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Waypoint updated on server:', data);
    })
    .catch(error => {
        console.error('Error updating waypoint on server:', error);
    });
}

// Function to add the waypoint to the sidebar
function addWaypointToSidebar(waypoint) {
    const waypointsList = document.getElementById('waypointsList');
    const waypointElement = document.createElement('div');
    waypointElement.id = `waypoint-${waypoint.waypoint_id}`; // Add an ID for this waypoint
    waypointElement.innerHTML = `<strong>Waypoint ${waypoint.waypoint_id}: <span class="waypoint-coordinates">${waypoint.lat}, ${waypoint.lon}</span></strong>`;

    // On-click event to open the info window for this waypoint
    waypointElement.onclick = () => {
        const infoWindow = new google.maps.InfoWindow({
            content: `<b>Waypoint ${waypoint.waypoint_id}</b>
                      <p>Latitude: ${waypoint.lat}</p>
                      <p>Longitude: ${waypoint.lon}</p>`
        });
        infoWindow.open(map);
    };

    // Create a section to list actions for the waypoint
    const actionsList = document.createElement('div');
    actionsList.classList.add('actions-list');
    actionsList.innerHTML = '<strong>Actions</strong>';

    waypoint.actions.forEach(action => {
        const actionElement = document.createElement('div');
        actionElement.innerHTML = `Action ${action.action_id}: ${action.action_type}`;

        const parametersList = document.createElement('div');
        for (const [param, value] of Object.entries(action.parameters)) {
            const paramElement = document.createElement('div');
            paramElement.innerHTML = `${param}: ${value}`;
            parametersList.appendChild(paramElement);
        }

        actionElement.appendChild(parametersList);
        actionsList.appendChild(actionElement);
    });

    waypointElement.appendChild(actionsList);
    waypointsList.appendChild(waypointElement);
}

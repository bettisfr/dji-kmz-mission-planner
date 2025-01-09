// Global variables
let map;
let polyline;
let markers = [];

// Dynamically load Google Maps API script without callback in URL
function loadGoogleMapsAPI() {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&v=weekly`;
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
        center: { lat: 43.062715, lng: 12.551034 },
        zoom: 18,
        mapTypeId: google.maps.MapTypeId.SATELLITE,
        styles: [
            {
                "elementType": "labels",
                "stylers": [{ "visibility": "off" }]
            }
        ]
    });

    // Add click listener to the map
    map.addListener("click", function (event) {
        addWaypoint(event.latLng);
    });

    // Load the current mission from the server
    getMission();
}

// Function to load the mission data from the Flask server
function getMission() {
    fetch('/load_mission')
        .then(response => response.json())
        .then(data => {
            renderMissionToMap(data);
        })
        .catch(error => console.error('Error loading mission:', error));
}

// Function to handle adding a new waypoint when clicking on the map
function addWaypoint(latLng) {
    const lat = latLng.lat();
    const lon = latLng.lng();

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
        console.log(data.message);
        getMission();
    })
    .catch(error => {
        console.error('Error adding waypoint:', error);
    });
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
        getMission();
    })
    .catch(error => {
        console.error('Error updating waypoint on server:', error);
    });
}

// Function to initialize the mission visualization
function renderMissionToMap(data) {
    const waypointsList = document.getElementById('waypointsList');
    waypointsList.innerHTML = '<strong>Waypoints</strong>'; // Clear existing text

    const polylinePath = [];

    for (var i = 0; i < markers.length; i++ ) {
        markers[i].setMap(null);
    }
    markers.length = 0;

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
        labelOrigin: new google.maps.Point(0, 0),
        draggable: true
    });

    markers.push(marker);

    // Listen for the marker being dragged and update the waypoint position
    marker.addListener('dragend', (event) => {
        const newLat = event.latLng.lat();
        const newLng = event.latLng.lng();

        // Update the waypoint object with the new coordinates
        waypoint.lat = newLat;
        waypoint.lon = newLng;

        updateWaypoint(waypoint);
    });
}

function addWaypointToSidebar(waypoint) {
    const waypointsList = document.getElementById('waypointsList');
    const waypointElement = document.createElement('div');
    waypointElement.id = `waypoint-${waypoint.waypoint_id}`;
    const lat_fixed = waypoint.lat.toFixed(6);
    const lon_fixed = waypoint.lon.toFixed(6);
    waypointElement.innerHTML = `<b>${waypoint.waypoint_id}: (${lat_fixed}, ${lon_fixed})</b> <b><a href="#" class="remove-waypoint">remove</a></b>`;

    // Add listener for showing a popup when removing a waypoint
    waypointElement.querySelector('.remove-waypoint').addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent triggering the waypoint onclick event
        alert(`You clicked to remove waypoint ${waypoint.waypoint_id}.`);
        // Logic to handle removal is up to you
    });

    // Create a section to list actions for the waypoint
    const actionsList = document.createElement('div');
    actionsList.classList.add('actions-list');
    actionsList.innerHTML = '<b>Actions</b> <b><a href="#" class="add-action">add</a></b>';

    // Listener for adding a new action
    actionsList.querySelector('.add-action').addEventListener('click', (e) => {
        e.stopPropagation();
        alert(`You clicked to add a new action for waypoint ${waypoint.waypoint_id}.`);
        // Logic to handle new action creation is up to you
    });

    // Populate the list of actions
    waypoint.actions.forEach(action => {
        const actionElement = document.createElement('div');
        actionElement.id = `action-${action.action_id}`;
        actionElement.innerHTML = `${action.action_id}: ${action.action_type} <b><a href="#" class="remove-action">remove</a></b>`;

        // Listener for removing an action
        actionElement.querySelector('.remove-action').addEventListener('click', (e) => {
            e.stopPropagation();
            alert(`You clicked to remove action ${action.action_id} for waypoint ${waypoint.waypoint_id}.`);
            // Logic to handle removal is up to you
        });

        const parametersList = document.createElement('div');
        for (const [param, value] of Object.entries(action.parameters)) {
            const paramElement = document.createElement('div');
            paramElement.style.display = 'flex'; // Use flexbox for layout

            const label = document.createElement('span');
            label.textContent = `${param}: `;
            label.style.flex = '1';

            const input = document.createElement('input');
            input.type = 'text';
            input.value = value;
            input.classList.add('parameter-input');

            paramElement.appendChild(label);
            paramElement.appendChild(input);

            parametersList.appendChild(paramElement);
        }

        actionElement.appendChild(parametersList);
        actionsList.appendChild(actionElement);
    });

    waypointElement.appendChild(actionsList);
    waypointsList.appendChild(waypointElement);
}



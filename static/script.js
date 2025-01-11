// Global variables
let map;
let polyline;
let markers = [];
let midlineMarkers = []
let availableActions = {};

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
        center: {lat: 43.062715, lng: 12.551034},
        zoom: 18,
        mapTypeId: google.maps.MapTypeId.SATELLITE,
        styles: [
            {
                "elementType": "labels",
                "stylers": [{"visibility": "off"}]
            }
        ]
    });

    // Add click listener to the map
    map.addListener("click", function (event) {
        addWaypoint(event.latLng);
    });

    // Load the current mission from the server
    getMission();

    addOptionsButtons();
}

function addOptionsButtons() {
    // Add "Save" and "Load" buttons dynamically
    const optionsDiv = document.getElementById("options");

    const saveButton = document.createElement("button");
    saveButton.innerText = "Save";
    saveButton.id = "saveButton";
    saveButton.classList.add("option-button"); // Optional, for styling
    optionsDiv.appendChild(saveButton);

    const loadButton = document.createElement("button");
    loadButton.innerText = "Load";
    loadButton.id = "loadButton";
    loadButton.classList.add("option-button"); // Optional, for styling
    optionsDiv.appendChild(loadButton);

    // Add event listeners for buttons
    saveButton.addEventListener("click", function () {
        window.location.href = "/save_mission";
    });

    loadButton.addEventListener("click", function () {
        // loadMission();
        alert("Not implemented yet");
    });
}



// Function to populate the select dropdown with action options
function populateActionSelect() {
    const actionSelect = document.getElementById('actionSelect');
    actionSelect.innerHTML = ''; // Clear any existing options

    // Add a default "Select an action" option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select an action';
    actionSelect.appendChild(defaultOption);

    // Add the action options dynamically
    for (const action in availableActions) {
        if (availableActions.hasOwnProperty(action)) {
            const option = document.createElement('option');
            option.value = action;
            option.textContent = action;
            actionSelect.appendChild(option);
        }
    }

    // Update parameters for the first action (if any)
    updateParameters();
}

// Function to update the parameters based on the selected action
function updateParameters() {
    const selectedAction = document.getElementById('actionSelect').value;
    if (!selectedAction) {
        return;
    }

    const parameters = availableActions[selectedAction]?.parameters || [];
    const container = document.getElementById('parametersContainer');

    // Clear existing parameters
    container.innerHTML = '';

    // Dynamically add input fields for each parameter
    parameters.forEach(param => {
        const inputGroup = document.createElement('div');
        inputGroup.classList.add('form-group');

        const label = document.createElement('label');
        label.textContent = param;

        const input = document.createElement('input');
        input.type = 'text';
        input.name = param;

        inputGroup.appendChild(label);
        inputGroup.appendChild(input);
        container.appendChild(inputGroup);
    });
}

// Function to initialize the mission visualization
function renderMissionToMap(data) {
    globalParameters.innerHTML = '<strong>Parameters</strong>';

    Object.entries(data).forEach(([key, value]) => {
        // Only process scalar values (numbers or strings)
        if (typeof value === 'number' || typeof value === 'string') {
            const paramElement = document.createElement('div');
            paramElement.classList.add('actions-list');
            paramElement.style.display = 'flex';
            paramElement.style.alignItems = 'center';
            paramElement.style.marginBottom = '5px';

            const label = document.createElement('span');
            label.textContent = `${key}: `;
            label.style.flex = '1';
            label.style.fontWeight = 'bold';
            label.style.marginRight = '10px';

            const input = document.createElement('input');
            input.type = 'text';
            input.value = value;
            input.classList.add('parameter-input');

            // Add an input event listener for changes
            input.addEventListener('input', () => {
                input.style.backgroundColor = 'lightcoral';
            });

            // Add a blur event listener to update and reset the background
            input.addEventListener('blur', () => {
                updateGlobalParameter(key, input.value);
                input.style.backgroundColor = '';
            });

            paramElement.appendChild(label);
            paramElement.appendChild(input);
            globalParameters.appendChild(paramElement);
        }
    });

    const waypointsList = document.getElementById('waypointsList');
    waypointsList.innerHTML = '<strong>Waypoints</strong>';

    const polylinePath = [];

    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    markers.length = 0;

    if (midlineMarkers) {
        midlineMarkers.forEach(marker => marker.setMap(null));
    }
    midlineMarkers = [];

    // Loop through each waypoint and add a marker to the map
    data.waypoints.forEach(waypoint => {
        addWaypointMarker(waypoint);
        polylinePath.push({lat: waypoint.lat, lng: waypoint.lon});
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

        // Add "+" markers at the midpoints of each polyline segment
        for (let i = 0; i < polylinePath.length - 1; i++) {
            const midpoint = {
                lat: (polylinePath[i].lat + polylinePath[i + 1].lat) / 2,
                lng: (polylinePath[i].lng + polylinePath[i + 1].lng) / 2
            };

            // Thanks, ChatGPT!
            const midMarker = new google.maps.Marker({
                position: midpoint,
                map: map,
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 10,
                    fillColor: 'green',
                    fillOpacity: 1,
                    strokeColor: 'green',
                    strokeWeight: 2
                },
                label: {
                    text: '+',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 'bold'
                },
                title: "Click to add a waypoint",
            });

            // Add a click event listener to the mid-marker
            midMarker.addListener('click', () => {
                const latLng = new google.maps.LatLng(midpoint.lat, midpoint.lng);
                addWaypointAt(latLng, i + 1);
            });

            midlineMarkers.push(midMarker); // Store the midline marker for future cleanup
        }
    }
}

// Function to add a waypoint marker to the map
function addWaypointMarker(waypoint) {
    const marker = new google.maps.Marker({
        position: {lat: waypoint.lat, lng: waypoint.lon},
        map: map,
        title: `WP ${waypoint.waypoint_id}: ${waypoint.actions.length} actions`,
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
    waypointElement.innerHTML = `<b>${waypoint.waypoint_id}: (${lat_fixed}, ${lon_fixed})</b> <b><a href="#" class="remove-waypoint">del</a></b>`;

    // Add listener for showing a popup when removing a waypoint
    waypointElement.querySelector('.remove-waypoint').addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent triggering the waypoint onclick event
        removeWaypoint(waypoint.waypoint_id);
    });

    // Create a section to list actions for the waypoint
    const actionsList = document.createElement('div');
    actionsList.classList.add('actions-list');
    actionsList.innerHTML = '<u><b>Actions</b></u> <b><a href="#" class="add-action">add</a></b>';

    // Listener for adding a new action
    actionsList.querySelector('.add-action').addEventListener('click', (e) => {
        e.stopPropagation();
        getAvailableActions(waypoint.waypoint_id);
    });

    // Populate the list of actions
    waypoint.actions.forEach(action => {
        const actionElement = document.createElement('div');
        actionElement.id = `action-${waypoint.waypoint_id}-${action.action_id}`;
        actionElement.innerHTML = `<b>${action.action_id} - ${action.action_type}</b> <b><a href="#" class="remove-action">del</a></b>`;

        // Listener for removing an action
        actionElement.querySelector('.remove-action').addEventListener('click', (e) => {
            e.stopPropagation();
            removeAction(waypoint.waypoint_id, action.action_id);
        });

        const parametersList = document.createElement('div');
        for (const [param, value] of Object.entries(action.parameters)) {
            const paramElement = document.createElement('div');
            paramElement.style.display = 'flex';

            const label = document.createElement('span');
            label.textContent = `${param}: `;
            label.style.flex = '1';
            label.style.fontStyle = 'italic';

            const input = document.createElement('input');
            input.type = 'text';
            input.value = value;
            input.classList.add('parameter-input');

            // Add an input event listener for changes
            input.addEventListener('input', () => {
                input.style.backgroundColor = 'lightcoral';
            });

            // Add a blur event listener to detect when the input loses focus
            input.addEventListener('blur', () => {
                const [_, waypointId, actionId] = actionElement.id.split('-');
                updateAction(waypointId, actionId, param, input.value);
                input.style.backgroundColor = '';
            });

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

function handleAddButtonClick(waypointId, availableActions) {
    const selectedAction = document.getElementById('actionSelect').value;
    const parameters = availableActions[selectedAction]?.parameters || [];
    const params = {};

    // Collect the values of the parameters
    parameters.forEach(param => {
        const input = document.querySelector(`[name=${param}]`);
        if (input) {
            params[param] = input.value;
        }
    });

    if (!selectedAction) {
        return;
    }

    addAction(waypointId, selectedAction, params);

    // Close the dialog after adding the action
    $("#popup").dialog("close");

    // TODO: hide
}

// Server side functions
function getMission() {
    fetch('/load_mission')
        .then(response => response.json())
        .then(data => {
            renderMissionToMap(data);
        })
        .catch(error => console.error('Error loading mission:', error));
}

function getAvailableActions(waypointId) {
    fetch('/available_actions')
        .then(response => response.json())
        .then(data => {
            availableActions = data;
            populateActionSelect(data);

            $("#popup").dialog({
                modal: true,
                width: "30%",
                height: "auto",
                buttons: {
                    "Add": function () {
                        handleAddButtonClick(waypointId, availableActions);
                    }
                }
            });
        })
        .catch(error => {
            console.error('Error retrieving available actions:', error);
        });
}

function addWaypoint(latLng) {
    const lat = latLng.lat();
    const lon = latLng.lng();

    fetch('/add_waypoint', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({lat, lon})
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

function addWaypointAt(latLng, index) {
    const lat = latLng.lat();
    const lon = latLng.lng();

    fetch('/add_waypoint_at', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({lat, lon, index})
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
            console.error('Error adding waypoint at:', error);
        });
}

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

function updateGlobalParameter(variable, value) {
    fetch('/update_global_parameter', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            variable: variable,
            value: value
        })
    })
        .then(response => response.json())
        .then(data => {
            console.log('Global parameter updated on server:', data);
            getMission();
        })
        .catch(error => {
            console.error('Error updating global parameter on server:', error);
        });
}

function updateAction(waypointId, actionId, param, value) {
    fetch('/update_action', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            waypoint_id: waypointId,
            action_id: actionId,
            action_type: param,
            parameter: value
        })
    })
        .then(response => response.json())
        .then(data => {
            console.log('Action updated on server:', data);
            getMission();
        })
        .catch(error => {
            console.error('Error updating action on server:', error);
        });
}

function removeWaypoint(waypointId) {
    fetch('/remove_waypoint', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            waypoint_id: waypointId
        })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to remove waypoint on server.');
            }
            return response.json();
        })
        .then(data => {
            console.log(data.message);
            getMission();
        })
        .catch(error => {
            console.error('Error removing waypoint:', error);
        });
}

function addAction(waypointId, actionType, parameters) {
    fetch('/add_action', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            waypoint_id: waypointId,
            action_type: actionType,
            parameters: parameters
        })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to add action on server.');
            }
            return response.json();
        })
        .then(data => {
            console.log(data.message);
            getMission();
        })
        .catch(error => {
            console.error('Error adding action:', error);
        });
}

function removeAction(waypointId, actionId) {
    fetch('/remove_action', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            waypoint_id: waypointId,
            action_id: actionId
        })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to remove action on server.');
            }
            return response.json();
        })
        .then(data => {
            console.log(data.message);
            getMission();
        })
        .catch(error => {
            console.error('Error removing action:', error);
        });
}
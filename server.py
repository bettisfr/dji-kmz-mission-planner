import os

from flask import Flask, render_template, jsonify, request, send_from_directory
from mission import create_mock_mission, print_mission, Waypoint, Action, ACTIONS
from parser_xml import mission_to_kmz

app = Flask(__name__)

mission = create_mock_mission()


# print_mission(mission)
# mission.waypoints[3].update_waypoint_action(7, "aircraftHeading", -999)
# print_mission(mission)
# mission.remove_waypoint(1)
# print_mission(mission)
# mission.remove_action(1, 2)
# print_mission(mission)

@app.route('/')
def index():
    return render_template('index.html')


@app.route('/get_mission')
def get_mission():
    print_mission(mission)
    return jsonify(mission.to_dict())


@app.route('/load_mission', methods=['POST'])
def load_mission():
    # Check if the request contains a file part
    if 'file' not in request.files:
        return "No file part", 400

    file = request.files['file']

    # If no file is selected, the browser may submit an empty part without a filename
    if file.filename == '':
        return "No selected file", 400

    out_folder = 'out'
    file_path = os.path.join(out_folder, file.filename)
    file.save(file_path)

    return f"File {file.filename} uploaded successfully", 200

@app.route('/save_mission')
def save_mission():
    mission_to_kmz(mission, "mission")
    output_directory = "out"
    filename = "mission.kmz"

    # Send the file to the client
    return send_from_directory(output_directory, filename, as_attachment=True)


@app.route('/available_actions')
def available_actions():
    return jsonify(ACTIONS)


@app.route('/add_waypoint', methods=['POST'])
def add_waypoint():
    data = request.get_json()
    lat = data.get('lat')
    lon = data.get('lon')

    wp_new = Waypoint(lat=lat, lon=lon)
    mission.add_waypoint(wp_new)
    print(f"Creating new waypoint {wp_new} with new coordinates: {lat}, {lon}")

    print_mission(mission)

    return jsonify({"status": "success", "message": f"Waypoint added successfully"}), 200


@app.route('/add_waypoint_at', methods=['POST'])
def add_waypoint_at():
    data = request.get_json()
    lat = data.get('lat')
    lon = data.get('lon')
    index = data.get('index')

    wp_new = Waypoint(lat=lat, lon=lon)
    mission.add_waypoint_at(wp_new, index)
    print(f"Creating new waypoint {wp_new} between with new coordinates: {lat}, {lon}")

    print_mission(mission)

    return jsonify({"status": "success", "message": f"Waypoint added successfully"}), 200


@app.route('/update_waypoint', methods=['POST'])
def update_waypoint():
    data = request.get_json()
    waypoint_id = data.get('waypoint_id')
    lat = data.get('lat')
    lon = data.get('lon')

    mission.waypoints[waypoint_id].update_waypoint_coordinates(lat, lon)
    print(f"Updating waypoint {waypoint_id} with new coordinates: {lat}, {lon}")

    print_mission(mission)

    return jsonify({"status": "success", "message": f"Waypoint updated successfully"}), 200


@app.route('/update_action', methods=['POST'])
def update_action():
    data = request.get_json()
    waypoint_id = int(data.get('waypoint_id'))
    action_id = int(data.get('action_id'))
    action_type = data.get('action_type')
    parameter = data.get('parameter')

    mission.waypoints[waypoint_id].update_waypoint_action(action_id, action_type, parameter)
    print(f"Updating action {action_type} on waypoint {waypoint_id} with new value: {parameter}")

    print_mission(mission)

    return jsonify({"status": "success", "message": f"Waypoint updated successfully"}), 200


@app.route('/update_global_parameter', methods=['POST'])
def update_global_parameter():
    data = request.get_json()
    variable = data.get('variable')
    value = int(data.get('value'))

    if variable == "height":
        mission.height = value
    elif variable == "speed":
        mission.speed = value
    elif variable == "payloadIndex":
        mission.payload_index = value
    else:
        return jsonify({"status": "error", "message": f"Invalid variable"}), 400

    print(f"Updating global parameter {variable} with new value: {value}")

    print_mission(mission)

    return jsonify({"status": "success", "message": f"Waypoint updated successfully"}), 200


@app.route('/remove_waypoint', methods=['POST'])
def remove_waypoint():
    data = request.get_json()
    waypoint_id = data.get('waypoint_id')

    mission.remove_waypoint(waypoint_id)
    print(f"Removing waypoint {waypoint_id}")

    print_mission(mission)

    return jsonify({"status": "success", "message": f"Waypoint removed successfully"}), 200


@app.route('/add_action', methods=['POST'])
def add_action():
    data = request.get_json()
    waypoint_id = data.get('waypoint_id')
    action_type = data.get('action_type')
    parameters = data.get('parameters', {})

    action = Action(action_type, **parameters)
    mission.add_action(waypoint_id, action)
    print(f"Adding action to waypoint {waypoint_id}")

    print_mission(mission)

    return jsonify({"status": "success", "message": f"Action added successfully"}), 200


@app.route('/remove_action', methods=['POST'])
def remove_action():
    data = request.get_json()
    waypoint_id = data.get('waypoint_id')
    action_id = data.get('action_id')

    mission.remove_action(waypoint_id, action_id)
    print(f"Removing action {waypoint_id} - {action_id}")

    print_mission(mission)

    return jsonify({"status": "success", "message": f"Waypoint removed successfully"}), 200


if __name__ == '__main__':
    app.run(debug=True)

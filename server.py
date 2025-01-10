from flask import Flask, render_template, jsonify, request
from mission import create_mock_mission, print_mission, Waypoint, Action, ACTIONS

app = Flask(__name__)

mission = create_mock_mission()


# print_mission(mission)
# mission.remove_waypoint(1)
# print_mission(mission)
# mission.remove_action(1, 2)
# print_mission(mission)

@app.route('/')
def index():
    return render_template('index.html')


@app.route('/load_mission')
def load_mission():
    print_mission(mission)
    return jsonify(mission.to_dict())


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

    mission.waypoints[waypoint_id].lat = lat
    mission.waypoints[waypoint_id].lon = lon
    print(f"Updating waypoint {waypoint_id} with new coordinates: {lat}, {lon}")

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

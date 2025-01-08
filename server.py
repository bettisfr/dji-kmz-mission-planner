from flask import Flask, render_template, jsonify, request
from mission import create_mock_mission, print_mission, Waypoint

app = Flask(__name__)

mission = create_mock_mission()


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/load_mission')
def load_mission():
    print_mission(mission)
    return jsonify(mission.to_dict())


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

    return jsonify({"status": "success", "message": f"Waypoint {waypoint_id} updated successfully"}), 200


@app.route('/add_waypoint', methods=['POST'])
def add_waypoint():
    data = request.get_json()
    lat = data.get('lat')
    lon = data.get('lon')

    next_id = len(mission.waypoints)
    wp_new = Waypoint(waypoint_id=next_id, lat=lat, lon=lon)
    mission.add_waypoint(wp_new)
    print(f"Creating new waypoint {wp_new} with new coordinates: {lat}, {lon}")

    print_mission(mission)

    return jsonify({"status": "success", "message": f"Waypoint {next_id} added successfully"}), 200


if __name__ == '__main__':
    app.run(debug=True)

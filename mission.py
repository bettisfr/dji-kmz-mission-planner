from typing import List
from geopy.distance import geodesic

ACTIONS = {
    "takePhoto": {
        "parameters": ["fileSuffix"]
    },
    "focus": {
        "parameters": ["focusX", "focusY"]
    },
    "zoom": {
        "parameters": ["focalLength"]
    },
    "gimbalRotate": {
        # "parameters": ["gimbalRotateMode", "gimbalPitchRotateEnable", "gimbalPitchRotateAngle",
        #                "gimbalYawRotateEnable", "gimbalYawRotateAngle"]
        "parameters": ["gimbalPitchRotateAngle", "gimbalYawRotateAngle"]
    },
    "rotateYaw": {
        "parameters": ["aircraftHeading"]
    },
    "hover": {
        "parameters": ["hoverTime"]
    },
}


class Action:
    def __init__(self, action_type: str, **kwargs):
        self.action_id = None
        self.action_type = action_type
        self.parameters = kwargs

    def to_dict(self):
        return {
            'action_id': self.action_id,
            'action_type': self.action_type,
            'parameters': self.parameters
        }


class Waypoint:
    def __init__(self, lat: float, lon: float):
        self.waypoint_id = None
        self.lat = lat
        self.lon = lon
        self.actions: List[Action] = []

    def update_waypoint_coordinates(self, lat, lon):
        self.lat = lat
        self.lon = lon

    def update_waypoint_action(self, action_id, action_type, parameter):
        self.actions[action_id].parameters[action_type] = parameter

    def add_action(self, action: Action):
        self.actions.append(action)

    def remove_action(self, action_id: int, mission):
        action = self.actions[action_id]
        self.actions.remove(action)

    def to_dict(self):
        return {
            'waypoint_id': self.waypoint_id,
            'lat': self.lat,
            'lon': self.lon,
            'actions': [action.to_dict() for action in self.actions]
        }


class Mission:
    def __init__(self, height: float, speed: float, payload_index: int):
        self.height = height
        self.speed = speed
        self.payload_index = payload_index
        self.waypoints: List[Waypoint] = []

    def total_distance(self) -> float:
        if len(self.waypoints) < 2:
            return 0.0

        total = 0.0
        for i in range(len(self.waypoints) - 1):
            wp1 = (self.waypoints[i].lat, self.waypoints[i].lon)
            wp2 = (self.waypoints[i + 1].lat, self.waypoints[i + 1].lon)
            total += geodesic(wp1, wp2).meters

        return round(total, 2)

    def total_time(self) -> float:
        return round(self.total_distance() / self.speed, 2)

    def add_waypoint_at(self, waypoint: Waypoint, index):
        self.waypoints.insert(index, waypoint)
        self.update_ids()

    def add_waypoint(self, waypoint: Waypoint):
        self.waypoints.append(waypoint)
        self.update_ids()

    def remove_waypoint(self, waypoint_id: int):
        waypoint = self.waypoints[waypoint_id]
        self.waypoints.remove(waypoint)
        self.update_ids()

    def add_action(self, waypoint_id: int, action: Action):
        waypoint = self.waypoints[waypoint_id]
        waypoint.actions.append(action)
        self.update_ids()

    def remove_action(self, waypoint_id: int, action_id: int):
        waypoint = self.waypoints[waypoint_id]
        action_del = None
        for i, action in enumerate(waypoint.actions):
            if action.action_id == action_id:
                action_del = action
                break
        waypoint.actions.remove(action_del)
        self.update_ids()

    def update_ids(self):
        waypoint_id = 0
        for i, wp in enumerate(self.waypoints):
            action_id = 0
            wp.waypoint_id = waypoint_id
            waypoint_id += 1
            for j, action in enumerate(wp.actions):
                action.action_id = action_id
                action_id += 1

    def to_dict(self):
        return {
            'height': self.height,
            'speed': self.speed,
            'payloadIndex': self.payload_index,
            'waypoints': [waypoint.to_dict() for waypoint in self.waypoints]
        }


def print_mission(mission: Mission):
    print(f"Mission Details:")
    print(f"  height: {mission.height}")
    print(f"  speed: {mission.speed}")
    print(f"  payload index: {mission.payload_index}")
    print(f"  waypoints:")
    for waypoint in mission.waypoints:
        print(f"    {waypoint.waypoint_id}: latitude: {waypoint.lat}, longitude: {waypoint.lon}")
        if waypoint.actions:
            print(f"    actions:")
            for action in waypoint.actions:
                print(f"      {action.action_id}: {action.action_type}")
                for param, value in action.parameters.items():
                    print(f"        {param}: {value}")


def create_empty_mission():
    return Mission(height=0, speed=0, payload_index=0)


def create_mock_mission():
    mission = Mission(height=10.0, speed=5.0, payload_index=0)

    wp0 = Waypoint(lat=43.06229630922861, lon=12.549784090599045)
    wp0.add_action(Action("focus", focusX=0.5, focusY=0.5))
    wp0.add_action(Action("rotateYaw", aircraftHeading=-90))

    mission.add_waypoint(wp0)

    wp1 = Waypoint(lat=43.063526959224724, lon=12.549784090599045)
    wp1.add_action(Action("hover", hoverTime=5))
    wp1.add_action(Action("rotateYaw", aircraftHeading=-90))
    mission.add_waypoint(wp1)

    wp2 = Waypoint(lat=43.063526959224724, lon=12.551495339950547)
    wp2.add_action(Action("hover", hoverTime=5))
    wp2.add_action(Action("rotateYaw", aircraftHeading=-90))
    mission.add_waypoint(wp2)

    wp3 = Waypoint(lat=43.062241438908295, lon=12.551495339950547)
    wp3.add_action(Action("hover", hoverTime=5))
    wp3.add_action(Action("rotateYaw", aircraftHeading=-90))
    mission.add_waypoint(wp3)

    return mission

from typing import List, Optional

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
        "parameters": ["gimbalRotateMode", "gimbalPitchRotateEnable", "gimbalPitchRotateAngle",
                       "gimbalYawRotateEnable", "gimbalYawRotateAngle"]
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

    def add_action(self, action: Action, mission):
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
    def __init__(self, height: float, speed: float, payload_position_index: int):
        self.height = height
        self.speed = speed
        self.payload_position_index = payload_position_index
        self.waypoints: List[Waypoint] = []

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
            'payload_position_index': self.payload_position_index,
            'waypoints': [waypoint.to_dict() for waypoint in self.waypoints]
        }


def print_mission(mission: Mission):
    print(f"Mission Details:")
    print(f"  height: {mission.height}")
    print(f"  speed: {mission.speed}")
    print(f"  payload index: {mission.payload_position_index}")
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
    return Mission(height=10.0, speed=10.0, payload_position_index=0)


def create_mock_mission():
    mission = Mission(height=10.0, speed=5.0, payload_position_index=0)

    wp0 = Waypoint(lat=43.06229630922861, lon=12.549784090599045)
    wp0.add_action(Action("hover", hoverTime=5), mission)
    wp0.add_action(Action("rotateYaw", aircraftHeading=-90), mission)
    wp0.add_action(Action("hover", hoverTime=5), mission)
    wp0.add_action(Action("rotateYaw", aircraftHeading=90), mission)
    wp0.add_action(Action("hover", hoverTime=5), mission)
    wp0.add_action(Action("rotateYaw", aircraftHeading=0), mission)
    wp0.add_action(Action("hover", hoverTime=5), mission)
    wp0.add_action(Action("rotateYaw", aircraftHeading=180), mission)
    mission.add_waypoint(wp0)

    wp1 = Waypoint(lat=43.063526959224724, lon=12.549784090599045)
    wp1.add_action(Action("hover", hoverTime=5), mission)
    wp1.add_action(Action("rotateYaw", aircraftHeading=-90), mission)
    wp1.add_action(Action("hover", hoverTime=5), mission)
    wp1.add_action(Action("rotateYaw", aircraftHeading=90), mission)
    wp1.add_action(Action("hover", hoverTime=5), mission)
    wp1.add_action(Action("rotateYaw", aircraftHeading=0), mission)
    wp1.add_action(Action("hover", hoverTime=5), mission)
    wp1.add_action(Action("rotateYaw", aircraftHeading=180), mission)
    mission.add_waypoint(wp1)

    wp2 = Waypoint(lat=43.063526959224724, lon=12.551495339950547)
    wp2.add_action(Action("hover", hoverTime=5), mission)
    wp2.add_action(Action("rotateYaw", aircraftHeading=-90), mission)
    wp2.add_action(Action("hover", hoverTime=5), mission)
    wp2.add_action(Action("rotateYaw", aircraftHeading=90), mission)
    wp2.add_action(Action("hover", hoverTime=5), mission)
    wp2.add_action(Action("rotateYaw", aircraftHeading=0), mission)
    wp2.add_action(Action("hover", hoverTime=5), mission)
    wp2.add_action(Action("rotateYaw", aircraftHeading=180), mission)
    mission.add_waypoint(wp2)

    wp3 = Waypoint(lat=43.062241438908295, lon=12.551495339950547)
    wp3.add_action(Action("hover", hoverTime=5), mission)
    wp3.add_action(Action("rotateYaw", aircraftHeading=-90), mission)
    wp3.add_action(Action("hover", hoverTime=5), mission)
    wp3.add_action(Action("rotateYaw", aircraftHeading=90), mission)
    wp3.add_action(Action("hover", hoverTime=5), mission)
    wp3.add_action(Action("rotateYaw", aircraftHeading=0), mission)
    wp3.add_action(Action("hover", hoverTime=5), mission)
    wp3.add_action(Action("rotateYaw", aircraftHeading=180), mission)
    mission.add_waypoint(wp3)

    return mission

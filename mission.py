from typing import List, Optional


class Action:
    """Represents an action performed at a waypoint."""

    def __init__(self, action_type: str, action_id: int, **kwargs):
        self.action_type = action_type  # e.g., 'takePhoto', 'focus', etc.
        self.action_id = action_id
        self.parameters = kwargs  # Sub-fields for the action

    def to_dict(self):
        return {
            'action_type': self.action_type,
            'action_id': self.action_id,
            'parameters': self.parameters
        }


class Waypoint:
    """Represents a waypoint in the mission."""

    def __init__(self, waypoint_id: int, lat: float, lon: float):
        self.waypoint_id = waypoint_id
        self.lat = lat
        self.lon = lon
        self.actions: List[Action] = []  # List of actions for this waypoint

    def add_action(self, action: Action):
        self.actions.append(action)

    def to_dict(self):
        return {
            'waypoint_id': self.waypoint_id,
            'lat': self.lat,
            'lon': self.lon,
            'actions': [action.to_dict() for action in self.actions]
        }


class Mission:
    """Represents a drone mission."""

    def __init__(self, height: float, speed: float, payload_position_index: int):
        self.height = height
        self.speed = speed
        self.payload_position_index = payload_position_index
        self.waypoints: List[Waypoint] = []  # List of waypoints in the mission


    def add_waypoint(self, waypoint: Waypoint):
        self.waypoints.append(waypoint)

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


def create_mock_mission():
    mission = Mission(height=10.0, speed=5.0, payload_position_index=0)

    wp0 = Waypoint(waypoint_id=0, lat=43.0624494374479, lon=12.54877703690598)
    wp0.add_action(Action("focus", action_id=0, focusX=0.5, focusY=0.5))
    wp0.add_action(Action("takePhoto", action_id=1, fileSuffix="_test1"))

    mission.add_waypoint(wp0)

    wp1 = Waypoint(waypoint_id=1, lat=43.06195774465403, lon=12.550710612753097)
    wp1.add_action(Action("rotateYaw", action_id=2, aircraftHeading=-90))
    wp1.add_action(Action("gimbalRotate", action_id=3, gimbalRotateMode="absoluteAngle",
                          gimbalPitchRotateEnable=1, gimbalPitchRotateAngle=30,
                          gimbalYawRotateEnable=1, gimbalYawRotateAngle=90))

    mission.add_waypoint(wp1)

    wp2 = Waypoint(waypoint_id=2, lat=43.06343192625819, lon=12.55143175502506)
    wp2.add_action(Action("zoom", action_id=4, focalLength=50))
    wp2.add_action(Action("takePhoto", action_id=5, fileSuffix="_test2"))

    mission.add_waypoint(wp2)

    return mission

if __name__ == "__main__":
    mission = create_mock_mission()

    print_mission(mission)

import sys, json
from pydantic.dataclasses import dataclass
from enum import Enum
from logging import getLogger, DEBUG, FileHandler
from window_controller import focus_windows, list_windows, minimize_window, shake_window

class IPCType(str, Enum):
    LIST_WINDOWS = "LIST_WINDOWS" # request to list all open windows
    MINIMIZE_WINDOW = "MINIMIZE_WINDOW" # request to minimize a window, picking the active window if no handle is provided
    SHAKE_WINDOW = "SHAKE_WINDOW" # request to shake the active window
    FOCUS_WINDOW = "FOCUS_WINDOW" # request to focus a specific window

@dataclass
class NodeIPC:
    type: IPCType
    payload: dict

# log to file, because stdout is used to communicate with the Electron app
logger = getLogger()
logger.setLevel(DEBUG)
fh = FileHandler("python_helper.log")
fh.setLevel(DEBUG)
logger.addHandler(fh)

# continuously read from stdin which is written to by the Electron app
for line in sys.stdin:
    ipc_req = NodeIPC(**json.loads(line))

    logger.debug(f"Received IPC request with type {ipc_req.type}: {ipc_req}")
    match ipc_req.type:
        case IPCType.LIST_WINDOWS:
            windows = list_windows()
            json_windows = [w.model_dump() for w in windows]
            print(json.dumps(dict(windows=json_windows)))

        case IPCType.MINIMIZE_WINDOW:
            success = minimize_window(ipc_req.payload.get("id", None))
            print(json.dumps(dict(success=success)))

        case IPCType.SHAKE_WINDOW:
            success = shake_window(ipc_req.payload.get("id", None))
            print(json.dumps(dict(success=success)))

        case IPCType.FOCUS_WINDOW:
            success = focus_windows(ipc_req.payload["id"])
            print(json.dumps(dict(success=success)))

        case _:
            logger.warning(f"Unknown IPC type: {ipc_req.type}")


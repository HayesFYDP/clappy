import sys, json
from dragonfly import Window
from dragonfly.windows.darwin_window import DarwinWindow
from dragonfly.windows.win32_window import Win32Window
from pydantic.dataclasses import dataclass
from enum import Enum
from logging import getLogger, DEBUG, FileHandler
from sys import stdout
from window_controller import list_windows

class IPCType(str, Enum):
    LIST_WINDOWS = "LIST_WINDOWS" # request to list all open windows
    MINIMIZE_ACTIVE_WINDOW = "MINIMIZE_ACTIVE_WINDOW" # request to minimize the active window
    SHAKE_ACTIVE_WINDOW = "SHAKE_ACTIVE_WINDOW" # request to shake the active window
    FOCUS_WINDOW = "FOCUS_WINDOW" # request to focus a specific window

@dataclass
class NodeIPC:
    type: IPCType
    payload: dict

# log to file, because stdout is used to communicate with the Electron app
logger = getLogger(__name__)
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
            print(json.dumps(json_windows))

        case IPCType.MINIMIZE_ACTIVE_WINDOW:
            pass

        case IPCType.SHAKE_ACTIVE_WINDOW:
            pass

        case IPCType.FOCUS_WINDOW:
            pass

        case _:
            # logger.warning(f"Unknown IPC type: {ipc_req.type}")
            pass


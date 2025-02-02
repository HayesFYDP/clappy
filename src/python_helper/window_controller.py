import sys, json
from dragonfly import Window
from dragonfly.windows.darwin_window import DarwinWindow
from dragonfly.windows.win32_window import Win32Window
from pydantic import BaseModel
from enum import Enum

from window_util import get_all_important_windows

class WindowInfo(BaseModel):
    title: str
    executablePath: str
    handle: int

def list_windows() -> list[WindowInfo]:
    windows = get_all_important_windows()
    window_info: list[WindowInfo] = []
    for window in windows:
        window_info.append(WindowInfo(title=window.title, executablePath=window.executable, handle=window.handle))

    return window_info

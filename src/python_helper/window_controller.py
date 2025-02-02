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
    isFocused: bool = False
    handle: int

def list_windows() -> list[WindowInfo]:
    windows = get_all_important_windows()
    active_window: DarwinWindow | Win32Window = Window.get_foreground()

    window_info: list[WindowInfo] = []
    for window in windows:
        is_focused = active_window is not None and active_window.handle == window.handle
        window_info.append(WindowInfo(title=window.title, executablePath=window.executable, isFocused=is_focused, handle=window.handle))

    return window_info

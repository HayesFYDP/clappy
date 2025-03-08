import random
import sys, json
import time
from dragonfly import Window
from dragonfly.windows.rectangle import Rectangle
from dragonfly.windows.darwin_window import DarwinWindow
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
    active_window: DarwinWindow = DarwinWindow.get_foreground()

    window_info: list[WindowInfo] = []
    for window in windows:
        is_focused = active_window is not None and active_window.handle == window.handle
        window_info.append(
            WindowInfo(
                title=window.title,
                executablePath=window.executable,
                isFocused=is_focused,
                handle=window.handle,
            )
        )

    return window_info


def focus_windows(handle: int) -> bool:
    for window in get_all_important_windows():
        if window.handle == handle:
            window.set_foreground()
            return True

    return False


def minimize_window(handle: int | None) -> bool:
    if handle is None:
        active_window = Window.get_foreground()
        if active_window is not None:
            active_window.minimize()
            return True
    else:
        for window in get_all_important_windows():
            if window.handle == handle:
                window.minimize()
                return True

    return False


def shake_window(handle: int | None) -> bool:
    window = None
    if handle is None:
        window = Window.get_foreground()
    else:
        for w in get_all_important_windows():
            if w.handle == handle:
                window = w
                break

    if window is None:
        return False

    was_maximized = False

    # using the starting position, execute a series of window movements that make the window appear like it is shaking for a second
    starting_position = window.get_position()
    start_l, start_t, start_w, start_h = starting_position.ltwh

    if window.is_maximized:
        was_maximized = True
        window.restore() # unmaximize the window so we can shake it
        # move the window to the top left corner and keep the same size to pretend it is still maximized
        window.set_position(Rectangle(0, 0, start_w, start_h))
        time.sleep(0.3)

    shake_iterations = 20
    intensity = 20
    duration = 0.5
    interval = duration / shake_iterations

    end_time = time.time() + duration

    # Repeatedly update the window's position.
    while time.time() < end_time:
        # Calculate a random offset (you can add damping if you want a decaying shake).
        dx = random.randint(-intensity, intensity)
        dy = random.randint(-intensity, intensity)

        # Update the window's position.
        window.set_position(Rectangle(start_l + dx, start_t + dy,
                            start_w + dx, start_h + dy))

        time.sleep(interval)

    window.set_position(starting_position)
    if was_maximized:
        window.maximize()

    return True

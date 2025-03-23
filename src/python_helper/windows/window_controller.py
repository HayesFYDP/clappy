import random
import time
from dragonfly.windows.rectangle import Rectangle
from dragonfly.windows.win32_window import Win32Window
from pydantic import BaseModel
from logging import getLogger

from window_util import get_all_important_windows

logger = getLogger()
class WindowInfo(BaseModel):
    title: str
    executablePath: str
    isFocused: bool = False
    id: int


def list_windows() -> list[WindowInfo]:
    windows = get_all_important_windows()
    active_window: Win32Window = Win32Window.get_foreground()

    window_info: list[WindowInfo] = []
    for window in windows:
        is_focused = active_window is not None and active_window.id == window.id
        window_info.append(
            WindowInfo(
                title=window.title,
                executablePath=window.executable,
                isFocused=is_focused,
                id=window.id,
            )
        )

    return window_info


def focus_windows(id: int) -> bool:
    for window in get_all_important_windows():
        if window.id == id:
            window.set_foreground()
            return True

    return False


def minimize_window(id: int | None) -> bool:
    if id is None:
        active_window = Win32Window.get_foreground()
        if active_window is not None and not (active_window.executable.endswith("electron.exe") and "clappy" in active_window.title):
            active_window.minimize()
            return True
        elif active_window is not None:
            logger.debug("could not minimize active window with title: %s and executable: %s", active_window.title, active_window.executable)
        else:
            logger.debug("could not minimize active window because it is None")
    else:
        for window in get_all_important_windows():
            if window.id == id:
                window.minimize()
                return True

    return False


def shake_window(id: int | None) -> bool:
    window = None
    if id is None:
        window = Win32Window.get_foreground()
    else:
        for w in get_all_important_windows():
            if w.id == id:
                window = w
                break

    if window is None:
        logger.debug("could not shake window because it is None")
        return False

    if (window.executable.endswith("electron.exe") and "clappy" in window.title):
        logger.debug("could not shake window with title: %s and executable: %s", window.title, window.executable)
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

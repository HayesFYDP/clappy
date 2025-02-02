from dragonfly import Window
from dragonfly.windows.darwin_window import DarwinWindow
from dragonfly.windows.win32_window import Win32Window

def is_window_important(window: Win32Window | DarwinWindow) -> bool:
    # ignore windows without a title or executable because these are usually system processes
    if not window.title or not window.executable:
        return False

    if isinstance(window, Win32Window):
        # ignore windows that are not enabled (cannot receive mouse/keyboard input)
        if not window.is_enabled:
            return False

        # ignore windows that are not visible because they are usually not user facing apps
        if not window.is_visible:
            return False

        # ignore windows that are part of the OS
        # user applications are usually in C:\Program Files\ or /Applications
        if window.executable.startswith("C:\\Windows\\"):
            return False

    elif isinstance(window, DarwinWindow):
        # TODO: write macOS filtering logic as needed
        pass # do nothing for now

    return True

def get_all_important_windows() -> list[Win32Window | DarwinWindow]:
    windows = []
    for window in Window.get_all_windows():
        if is_window_important(window):
            windows.append(window)

    return windows


from dragonfly.windows.win32_window import Win32Window

def is_window_important(window: Win32Window) -> bool:
    # ignore windows without a title or executable because these are usually system processes
    if not window.title or not window.executable:
        return False

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

    # ignore ourself
    if window.executable.endswith("electron.exe") and "clappy" in window.title:
        return False

    return True

def get_all_important_windows() -> list[Win32Window]:
    windows = []
    for window in Win32Window.get_all_windows():
        if is_window_important(window):
            windows.append(window)

    return windows


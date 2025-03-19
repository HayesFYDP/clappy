from dragonfly.windows.darwin_window import DarwinWindow

def is_window_important(window: DarwinWindow) -> bool:
    # ignore windows without a title or executable because these are usually system processes
    if not window.title or not window.executable:
        return False

    # TODO: ignore ourself (its probably has a title of clappy and Eletron as executable? need to confirm)
    return True

def get_all_important_windows() -> list[DarwinWindow]:
    windows = []
    for window in DarwinWindow.get_all_windows():
        if is_window_important(window):
            windows.append(window)

    return windows


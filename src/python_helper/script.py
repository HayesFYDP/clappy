import applescript
script = f'''
tell application "System Events"
    set targetProcess to (first process whose unix id is 1810)
    # set windowProperties to {{}}
    repeat with w in windows of targetProcess
        set end of windowProperties to {{name of w, position of w, size of w, id of w}}
    end repeat
end tell
return windowProperties
'''
properties = applescript.AppleScript(script).run()
print(properties)

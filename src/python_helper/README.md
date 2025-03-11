# Python Helper for Window Management

This folder contains the code for a python helper that can control a user's desktop windows (for example, minimizing windows or "shaking" them). This was designed this way because the [Dragonfly](https://dragonfly.readthedocs.io/en/latest/windows.html) package has seemingly good support to do what we want to do on both Mac and Windows.


## Setup

If you haven't already, install dependencies:
```
pip install -r requirements.txt

# or, from the repo root
pip install -r src/python_helper/requirements.txt
```

**IMPORTANT**: On MacOS, this utility needs to be granted accessibility access. You can enable this with the following steps:

1. Open System Settings -> Privacy & Security -> Accessibility

2. Add your IDE (for example, VS Code) as an enabled accessibility app, if you run Clappy using your IDE's built in terminal. If not, experiment with other options (I'm guessing adding your Terminal app should work).

During use, it may also request permissions to interact with other apps.

The notebook file `testing.ipynb` can be used to experiment with the Dragonfly API. Similarly, the file `windowManagerTesting.ts` can be used to test IPC between the Electron app and the Python helper.



## IPC
The Electron app and the Python helper communicate via stdin and stdout, so simply use `print()` statements on the Python side to return a response. Thus, any logs should be emitted to a file which can be done using a logger obtained by `logger = getLogger(__name__)`.

## MacOS/Windows Support

The python helper is split into two versions for the respective platforms under `/darwin` and `/windows`. This is due to flaws in the library that attempt to load modules for the wrong platform, causing errors if we leave it generic. A change to one should preferably be applied to the other.


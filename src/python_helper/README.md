# Python Helper for Window Management

This folder contains the code for a python helper that can control a user's desktop windows (for example, minimizing windows or "shaking" them). This was designed this way because the [Dragonfly](https://dragonfly.readthedocs.io/en/latest/windows.html) package has seemingly good support to do what we want to do on both Mac and Windows.


## Setup

If you haven't already, install dependencies:
```
pip install -r requirements.txt

# or, from the repo root
pip install -r src/python_helper/requirements.txt
```

The notebook file `testing.ipynb` can be used to experiment with the Dragonfly API. Similarly, the file `windowManagerTesting.ts` can be used to test IPC between the Electron app and the Python helper.

## IPC
The Electron app and the Python helper communicate via stdin and stdout, so simply use `print()` statements on the Python side to return a response. Thus, any logs should be emitted to a file which can be done using a logger obtained by `logger = getLogger(__name__)`.

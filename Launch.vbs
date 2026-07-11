Set WshShell = CreateObject("WScript.Shell")
' This runs the npm start command hidden (0)
WshShell.Run "npm start", 0, False
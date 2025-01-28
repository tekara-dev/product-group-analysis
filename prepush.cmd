@echo off
for %%f in (*.html.*) do (
    set "filename=%%f"
    setlocal enabledelayedexpansion
    for /f "tokens=1,2,3 delims=." %%a in ("!filename!") do (
        if "%%c" neq "" (
            ren "%%f" "%%a.%%c.html"
        )
    )
    endlocal
)
echo Pre push renamed.
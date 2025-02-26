@echo off
echo Renaming files back to original names
setlocal enabledelayedexpansion
for /r %%f in (*.*.html) do (
    set "filepath=%%f"
    for %%a in ("!filepath!") do (
        set "filename=%%~na"
        set "ext=%%~xa"
        for /f "tokens=1,2,3 delims=." %%b in ("!filename!!ext!") do (
            if "%%d" neq "" ren "%%f" "%%b.html.%%c"
        )
    )
)
color 0a
echo Done: %date% %time%
color 07
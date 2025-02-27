@echo off
echo Renaming files to Apps Script format
setlocal enabledelayedexpansion
for /f %%a in ('echo prompt $E^| cmd') do set "ESC=%%a"
for /r %%f in (*.html.*) do (
    set "filepath=%%f"
    for %%a in ("!filepath!") do (
        set "filename=%%~na"
        set "ext=%%~xa"
        for /f "tokens=1,2,3 delims=." %%b in ("!filename!!ext!") do (
            if "%%d" neq "" ren "%%f" "%%b.%%d.html"
        )
    )
)

echo %ESC%[0;32m Done: %date% %time% %ESC%[0m
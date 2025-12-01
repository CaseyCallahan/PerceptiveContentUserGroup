@ECHO OFF

D:
cd \inserver6\bin64

echo Executing Utility_RemoveCPsFromDocTypes.js via INTool...
echo.

intool --cmd run-iscript --file D:\inserver6\script\Utility_RemoveCPsFromDocTypes_PUBLIC.js

echo.
echo Press any key to exit...
pause > nul

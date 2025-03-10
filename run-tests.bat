
@echo off
set RUNNING_IN_WRAPPER=1
node e2e-runner.js %*
if errorlevel 1 exit /b %errorlevel%
  
# telnet "fake" bridge

To help with debugging, simulates a deako device telnet server and logs out what has been recieved.

merge requests or changes are welcome, this is still only somewhat complete. 

# setup

npm install

# running

in order to run on port 23 this must be run as sudo on linux devices:

sudo node ./index.js

# general 

Modify the profile.json to change what information the client may be expecting (serial number, ect)
#!/bin/bash

# Make sure the scripts are executable
chmod +x ./prepush.sh
chmod +x ./postpush.sh

# Run the scripts in sequence
./prepush.sh
clasp push
./postpush.sh 
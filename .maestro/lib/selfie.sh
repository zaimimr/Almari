#!/bin/sh
DEVICE="${DEVICE:-Closet Development}" sh "$(dirname "$0")/fixture.sh" 'selfie={"skin":[45,26,18],"hair":[22,3,4],"eyes":[32,6,12],"light":"ok","points":[],"gains":[1,1,1],"face":[0.22,0.16,0.52,0.5],"width":680,"height":850}'

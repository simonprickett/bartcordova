#!/bin/bash

echo "Adjusting plist for App Transport Security exception."
val=$(/usr/libexec/plistbuddy -c "add NSAppTransportSecurity:NSAllowsArbitraryLoads bool true" platforms/ios/BARTCordova/BARTCordova-Info.plist 2>/dev/null)
echo "Done"
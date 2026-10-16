#!/bin/sh
# Copies the first text field's text with Ctrl+A and Ctrl+C, then pastes it with Ctrl+V into each
# field given after it, and prints what every text field holds afterwards.
#
# usage: tools/keyboard-paste.sh <serial> <source-x> <source-y> <target-x> <target-y> [<target-x> <target-y> ...]
# needs: adb, Android 13 or later (input keycombination)
set -eu

if [ "$#" -lt 5 ]; then
  echo "usage: $0 <serial> <source-x> <source-y> <target-x> <target-y> [...]" >&2
  exit 2
fi

serial=$1
shift

fields() {
  adb -s "$serial" shell uiautomator dump /sdcard/keyboard-paste.xml >/dev/null 2>&1
  adb -s "$serial" exec-out cat /sdcard/keyboard-paste.xml |
    tr '>' '\n' |
    grep 'class="android.widget.EditText"' |
    grep -o 'text="[^"]*"' |
    paste -sd ' ' -
}

adb -s "$serial" shell input tap "$1" "$2"
sleep 1
adb -s "$serial" shell input keycombination KEYCODE_CTRL_LEFT KEYCODE_A
adb -s "$serial" shell input keycombination KEYCODE_CTRL_LEFT KEYCODE_C
shift 2
echo "fields before pasting: $(fields)"
while [ "$#" -ge 2 ]; do
  adb -s "$serial" shell input tap "$1" "$2"
  sleep 1
  adb -s "$serial" shell input keycombination KEYCODE_CTRL_LEFT KEYCODE_V
  sleep 1
  echo "after Ctrl+V at ($1, $2): $(fields)"
  shift 2
done

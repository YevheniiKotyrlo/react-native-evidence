#!/bin/sh
# Puts a text field's caret at the end of its text with a left click, right-clicks
# the start of the text, closes any menu that opened, and types Z: where the Z
# lands shows where the right-click left the caret.
#
# usage: tools/right-click-caret.sh <serial> <end-x> <start-x> <y>
# needs: adb, node, and tools/mouse-click.mjs beside this script
set -eu

if [ "$#" -lt 4 ]; then
  echo "usage: $0 <serial> <end-x> <start-x> <y>" >&2
  exit 2
fi

serial=$1
end_x=$2
start_x=$3
y=$4
tools=$(dirname "$0")

field_texts() {
  adb -s "$serial" shell uiautomator dump /sdcard/right-click-caret.xml >/dev/null 2>&1
  adb -s "$serial" exec-out cat /sdcard/right-click-caret.xml |
    tr '>' '\n' |
    grep 'class="android.widget.EditText"' |
    grep -o 'text="[^"]*"' |
    paste -sd ' ' -
}

node "$tools/mouse-click.mjs" "$serial" "$end_x" "$y" left
adb -s "$serial" shell input keyevent KEYCODE_MOVE_END
echo "fields before the right-click: $(field_texts)"
right_click=$(node "$tools/mouse-click.mjs" "$serial" "$start_x" "$y" right)
echo "$right_click"
if ! printf '%s\n' "$right_click" | grep -q '^popup windows: 0$'; then
  adb -s "$serial" shell input keyevent KEYCODE_BACK
  sleep 1
fi
adb -s "$serial" shell input text Z
sleep 1
echo "fields after typing Z: $(field_texts)"

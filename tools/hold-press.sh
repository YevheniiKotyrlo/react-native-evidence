#!/bin/sh
# Holds a finger on a point past the long-press delay, then lifts it, optionally
# after sliding to another point, and reports what the screen says while the
# finger is down and after it lifts: every text the screen shows, whether each
# text field is focused and long-clickable, and whether the keyboard is up.
#
# usage: [SCREENSHOT=held.png] tools/hold-press.sh <serial> <x> <y> [hold-seconds] [lift-x lift-y]
# needs: adb
set -eu

if [ "$#" -lt 3 ]; then
  echo "usage: $0 <serial> <x> <y> [hold-seconds] [lift-x lift-y]" >&2
  exit 2
fi

serial=$1
x=$2
y=$3
hold=${4:-1.5}
lift_x=${5:-$x}
lift_y=${6:-$y}

report() {
  adb -s "$serial" shell uiautomator dump /sdcard/hold-press.xml >/dev/null 2>&1
  adb -s "$serial" exec-out cat /sdcard/hold-press.xml |
    tr '>' '\n' |
    awk '/<node/ {
      text = ""
      if (match($0, /text="[^"]*"/)) text = substr($0, RSTART + 6, RLENGTH - 7)
      if ($0 ~ /class="android.widget.EditText"/) {
        focused = ""; if (match($0, /focused="[a-z]*"/)) focused = substr($0, RSTART, RLENGTH)
        long = ""; if (match($0, /long-clickable="[a-z]*"/)) long = substr($0, RSTART, RLENGTH)
        printf "field \"%s\" %s %s\n", text, focused, long
      } else if (text != "") {
        printf "text \"%s\"\n", text
      }
    }'
  echo "keyboard: $(adb -s "$serial" shell dumpsys input_method | grep -o 'mInputShown=[a-z]*' | head -n 1)"
}

adb -s "$serial" shell input motionevent DOWN "$x" "$y"
sleep "$hold"
echo "== while held at ($x, $y)"
report
if [ -n "${SCREENSHOT:-}" ]; then
  adb -s "$serial" exec-out screencap -p >"$SCREENSHOT"
fi
if [ "$lift_x" != "$x" ] || [ "$lift_y" != "$y" ]; then
  adb -s "$serial" shell input motionevent MOVE "$lift_x" "$lift_y"
fi
adb -s "$serial" shell input motionevent UP "$lift_x" "$lift_y"
sleep 1
echo "== after the lift at ($lift_x, $lift_y)"
report

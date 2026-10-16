#!/bin/sh
# Counts the different images a screen region shows across a run of screenshots:
# a blinking cursor shows 2, a region nothing changes shows 1.
#
# usage: tools/count-distinct-frames.sh <serial> <x> <y> <width> <height> [frames]
# needs: adb, ffmpeg
set -eu

if [ "$#" -lt 5 ]; then
  echo "usage: $0 <serial> <x> <y> <width> <height> [frames]" >&2
  exit 2
fi

serial=$1
crop="crop=$4:$5:$2:$3"
frames=${6:-10}

hashes=$(
  index=0
  while [ "$index" -lt "$frames" ]; do
    adb -s "$serial" exec-out screencap -p |
      ffmpeg -v error -f png_pipe -i pipe:0 -vf "$crop" -f md5 -
    index=$((index + 1))
  done
)

printf '%s\n' "$hashes"
distinct=$(printf '%s\n' "$hashes" | sort -u | wc -l | tr -d ' ')
echo "$distinct distinct of $frames frames"

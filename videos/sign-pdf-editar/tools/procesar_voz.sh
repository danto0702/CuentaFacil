#!/bin/bash
# Trims silence and normalizes each raw VoxCPM line into assets/audio/vo/. Usage: procesar_voz.sh <raw_dir>
RAW=$1; OUT=$(dirname "$0")/../assets/audio/vo; mkdir -p "$OUT"
CLN="silenceremove=start_periods=1:start_threshold=-60dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,adelay=30,apad=pad_dur=0.08,loudnorm=I=-18:TP=-2"
for f in "$RAW"/e*.wav; do
  n=$(basename "$f"); [ "$OUT/$n" -nt "$f" ] && continue
  ffmpeg -v error -y -i "$f" -af "$CLN" -ar 24000 -ac 1 "$OUT/$n"
done

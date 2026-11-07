#!/bin/bash
# Cuts every figure listed in cortes.txt (sheet x0 y0 x1 y1 out) one process at a time (birefnet is memory-heavy).
# Usage: cortar_todo.sh <python-with-rembg>
cd "$(dirname "$0")/.."
while read -r s x0 y0 x1 y1 out; do
  [ -f "$out.webp" ] && continue
  "$1" tools/cutout.py "originales/$s.jpg" $x0 $y0 $x1 $y1 "$out.webp" 0.15 || echo "FAIL $out"
done < tools/cortes.txt
echo ALL_DONE

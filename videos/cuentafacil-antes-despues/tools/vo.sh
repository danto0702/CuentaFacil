#!/bin/bash
# Pascal voice-over per scene (Kokoro em_alex, Spanish) — superseded by tools/vo_clone.py (cloned voice)
cd "$(dirname "$0")/.."
declare -a L=(
"01|Así era antes el fin de mes."
"02|Buscar soportes, unir PDF hasta la medianoche… y si algo no cuadraba, la cuenta volvía devuelta."
"03|Ahora es distinto. Soy Pascal, y trabajo contigo por WhatsApp."
"04|Me cuentas tu día con un texto, una foto o una nota de voz, y yo lo anoto en la obligación que corresponde."
"05|Leo tu contrato, organizo tus obligaciones y reviso tus soportes."
"06|Al cierre, ya no corres. Solo me dices: hazlo ya."
"07|Te entrego tus documentos listos. Tú revisas, apruebas y firmas."
"08|Escanea el código y empecemos."
)
for x in "${L[@]}"; do n="${x%%|*}"; t="${x#*|}"; npx -y hyperframes@0.8.173 tts "$t" -v em_alex -l es -o assets/audio/vo/vo-$n.wav >/dev/null 2>&1; done
for f in assets/audio/vo/*.wav; do echo "$(basename $f) $(ffprobe -v error -show_entries format=duration -of csv=p=0 $f)"; done

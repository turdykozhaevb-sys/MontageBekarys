#!/usr/bin/env bash
# Download the open-source (OFL) fonts of the style into ../fonts as static TTFs.
set -euo pipefail
d="$(cd "$(dirname "$0")/.." && pwd)/fonts"; mkdir -p "$d"; cd "$d"
base=https://cdn.jsdelivr.net/npm/@expo-google-fonts
for f in montserrat/900Black/Montserrat_900Black.ttf \
         montserrat/800ExtraBold/Montserrat_800ExtraBold.ttf \
         montserrat/800ExtraBold_Italic/Montserrat_800ExtraBold_Italic.ttf \
         montserrat/600SemiBold/Montserrat_600SemiBold.ttf \
         montserrat/600SemiBold_Italic/Montserrat_600SemiBold_Italic.ttf \
         unbounded/900Black/Unbounded_900Black.ttf \
         bebas-neue/400Regular/BebasNeue_400Regular.ttf; do
  [ -s "$(basename "$f")" ] || curl -fsSL -o "$(basename "$f")" "$base/$f"
done
ls -1 "$d"

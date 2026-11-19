# Проверка и экспорт

## Самопросмотр черновика
```bash
# контактный лист: 1 кадр в секунду, 6 в ряд
ffmpeg -i draft.mp4 -vf "fps=1,scale=480:-1,tile=6x5" -frames:v 1 sheet.jpg
# кадры на стыках сцен (подставить таймкоды)
ffmpeg -ss 2.95 -i draft.mp4 -frames:v 1 cut1.jpg
```
Смотреть: читаемость, обрезку у краёв, пустые кадры, скачки, дрожание текста, первый и последний кадр.

## Звук
```bash
ffmpeg -i final.mp4 -af ebur128=peak=true -f null - 2>&1 | tail -12   # LUFS и true peak
```

## Финальный экспорт
```bash
ffmpeg -i render.mp4 -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p -r 30 -c:a aac -b:a 192k -ar 48000 -movflags +faststart final.mp4
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,pix_fmt,sample_rate -show_entries format=duration final.mp4
```
Проверить: кодек h264 + aac, нужный размер и fps, длительность как в плане, звук реально слышен.

## Сдача
- Путь к MP4 + путь к исходникам HyperFrames.
- Список использованных ресурсов (шрифты, музыка, модели) и их условия.
- Честно: что проверено, что нет.

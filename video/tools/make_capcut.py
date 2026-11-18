#!/usr/bin/env python3
"""Builds a CapCut desktop draft + SRT from src/timeline.json.
Usage: python3 tools/make_capcut.py   (run from video/)"""
import json, uuid, shutil, os, time
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
tl = json.load(open(f"{R}/src/timeline.json"))
OUT = f"{R}/capcut/Dent-A_Protez"
RES = f"{OUT}/Resources"
os.makedirs(RES, exist_ok=True)
shutil.copy(f"{R}/out/dent-a-protez_no_subs.mp4", f"{RES}/video_no_subs.mp4")
shutil.copy(f"{R}/public/voice.mp3", f"{RES}/voice.mp3")
US = 1_000_000
u = lambda: str(uuid.uuid4()).upper()
PH = "##_draftpath_placeholder_0E685133-18CE-45ED-8CB8-2904A212EC80_##"
W, H, DUR = tl["width"], tl["height"], int(round(tl["duration"] * US))

# ---------- SRT ----------
def ts(s):
    ms = int(round(s * 1000)); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); sec, ms = divmod(ms, 1000)
    return f"{h:02}:{m:02}:{sec:02},{ms:03}"
with open(f"{R}/capcut/Dent-A_Protez.srt", "w", encoding="utf-8") as f:
    for i, c in enumerate(tl["captions"], 1):
        f.write(f"{i}\n{ts(c['t'][0])} --> {ts(c['t'][1])}\n{c['text']}\n\n")

# ---------- materials ----------
speeds, canvases, texts, anims, mappings = [], [], [], [], []
vid_id, aud_id = u(), u()
videos = [{"id": vid_id, "type": "video", "path": f"{PH}/Resources/video_no_subs.mp4", "material_name": "video_no_subs.mp4",
           "duration": DUR, "width": W, "height": H, "has_audio": False, "category_name": "local", "category_id": "",
           "check_flag": 63487, "crop_ratio": "free", "crop_scale": 1.0, "extra_type_option": 0, "local_material_id": "", "source_platform": 0, "origin_material_id": "",
           "crop": {"upper_left_x": 0.0, "upper_left_y": 0.0, "upper_right_x": 1.0, "upper_right_y": 0.0, "lower_left_x": 0.0, "lower_left_y": 1.0, "lower_right_x": 1.0, "lower_right_y": 1.0}}]
audios = [{"id": aud_id, "type": "extract_music", "path": f"{PH}/Resources/voice.mp3", "name": "voice.mp3", "duration": DUR,
           "category_name": "local", "category_id": "", "check_flag": 1, "source_platform": 0, "local_material_id": "", "music_id": u(), "wave_points": [], "text_id": "", "tone_type": "", "video_id": ""}]

def base_seg(mat, start, dur, src_start, refs, vol=1.0):
    return {"id": u(), "material_id": mat, "target_timerange": {"start": start, "duration": dur}, "source_timerange": {"start": src_start, "duration": dur},
            "speed": 1.0, "volume": vol, "last_nonzero_volume": 1.0, "visible": True, "reverse": False, "render_index": 0, "track_render_index": 0, "is_placeholder": False,
            "clip": {"alpha": 1.0, "flip": {"horizontal": False, "vertical": False}, "rotation": 0.0, "scale": {"x": 1.0, "y": 1.0}, "transform": {"x": 0.0, "y": 0.0}},
            "uniform_scale": {"on": True, "value": 1.0}, "extra_material_refs": refs, "common_keyframes": [], "keyframe_refs": [], "enable_adjust": True,
            "enable_color_correct_adjust": False, "enable_color_curves": True, "enable_color_match_adjust": False, "enable_color_wheels": True, "enable_lut": True,
            "enable_smart_color_adjust": False, "cartoon": False, "group_id": "", "intensifies_audio": False, "hdr_settings": {"intensity": 1.0, "mode": 1, "nits": 1000}}

def refs_for():
    s, c, m, a = u(), u(), u(), u()
    speeds.append({"id": s, "type": "speed", "mode": 0, "speed": 1.0, "curve_speed": None})
    canvases.append({"id": c, "type": "canvas_color", "color": "", "blur": 0.0, "image": "", "album_image": "", "image_id": "", "image_name": "", "source_platform": 0, "team_id": ""})
    mappings.append({"id": m, "type": "none", "audio_channel_mapping": 0, "is_config_open": False})
    anims.append({"id": a, "type": "sticker_animation", "animations": [], "multi_language_current": "none"})
    return [s, c, m, a]

# video track: one segment per scene (editable cuts), muted (voice is on its own track)
vsegs = []
for sc in tl["scenes"]:
    st, en = int(round(sc["start"] * US)), int(round(sc["end"] * US))
    seg = base_seg(vid_id, st, en - st, st, refs_for(), vol=0.0)
    vsegs.append(seg)
vsegs[-1]["target_timerange"]["duration"] = vsegs[-1]["source_timerange"]["duration"] = DUR - vsegs[-1]["target_timerange"]["start"]

# audio
asegs = [base_seg(aud_id, 0, DUR, 0, refs_for(), vol=1.0)]

# text track
tsegs = []
for c in tl["captions"]:
    st, en = int(round(c["t"][0] * US)), int(round(c["t"][1] * US))
    txt = c["text"]
    tid = u()
    style = {"fill": {"alpha": 1.0, "content": {"render_type": "solid", "solid": {"alpha": 1.0, "color": [1.0, 1.0, 1.0]}}}, "range": [0, len(txt)], "size": 17.0, "bold": True,
             "italic": False, "underline": False, "strokes": [{"content": {"render_type": "solid", "solid": {"alpha": 1.0, "color": [0.024, 0.094, 0.18]}}, "width": 0.14}],
             "font": {"id": "", "path": ""}, "useLetterColor": True}
    texts.append({"id": tid, "type": "text", "content": json.dumps({"text": txt, "styles": [style]}, ensure_ascii=False), "font_size": 17.0, "text_color": "#FFFFFF",
                  "alignment": 1, "typesetting": 0, "letter_spacing": 0.0, "line_spacing": 0.02, "line_max_width": 0.82, "bold_width": 0.0, "italic_degree": 0, "underline": False,
                  "global_alpha": 1.0, "has_shadow": True, "shadow_alpha": 0.6, "shadow_color": "#000000", "shadow_distance": 6.0, "shadow_angle": -45.0, "shadow_smoothing": 0.45,
                  "background_color": "", "background_alpha": 1.0, "border_color": "", "border_width": 0.08, "style_name": "", "text_alpha": 1.0, "words": {"start_time": [], "end_time": [], "text": []},
                  "add_type": 0, "check_flag": 7, "group_id": "", "fonts": [], "font_path": "", "font_id": "", "recognize_type": 0})
    seg = base_seg(tid, st, en - st, 0, refs_for())
    seg["source_timerange"] = None
    seg["clip"]["transform"]["y"] = -0.55
    seg["render_index"] = 14000
    tsegs.append(seg)

def track(t, segs, flag=0):
    return {"id": u(), "type": t, "segments": segs, "attribute": 0, "flag": flag, "is_default_mode": False}

draft = {
    "id": u(), "version": 360000, "new_version": "110.0.0", "name": "Dent-A_Protez", "fps": float(tl["fps"]), "duration": DUR,
    "canvas_config": {"width": W, "height": H, "ratio": "original"}, "color_space": 0, "platform": {"app_id": 359289, "app_source": "cc", "app_version": "6.0.0", "os": "windows"},
    "last_modified_platform": {"app_id": 359289, "app_source": "cc", "app_version": "6.0.0", "os": "windows"},
    "config": {"maintrack_adsorb": True, "video_mute": False, "record_audio_last_index": 1, "sticker_max_index": 1, "subtitle_recognition_id": "", "subtitle_sync": True, "subtitle_taskinfo": [], "system_font_list": [], "zoom_info_params": None},
    "keyframes": {"adjusts": [], "audios": [], "effects": [], "filters": [], "handwrites": [], "stickers": [], "texts": [], "videos": []},
    "keyframe_graph_list": [], "relationships": [], "free_render_index_mode_on": False, "retouch_cover": None, "cover": None, "extra_info": None, "group_container": None,
    "materials": {"videos": videos, "audios": audios, "texts": texts, "speeds": speeds, "canvases": canvases, "sound_channel_mappings": mappings, "material_animations": anims,
                  "beats": [], "vocal_separations": [], "effects": [], "stickers": [], "transitions": [], "audio_effects": [], "audio_fades": [], "video_effects": [], "placeholder_infos": []},
    "tracks": [track("video", vsegs), track("audio", asegs), track("text", tsegs, flag=1)],
}
json.dump(draft, open(f"{OUT}/draft_content.json", "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
now = int(time.time() * US)
meta = {"draft_id": u(), "draft_name": "Dent-A_Protez", "draft_root_path": "", "draft_fold_path": "", "tm_draft_create": now, "tm_draft_modified": now, "tm_duration": DUR,
        "draft_cover": "", "draft_type": "", "draft_is_ai_shorts": False, "draft_materials": [{"type": 0, "value": []}, {"type": 1, "value": []}, {"type": 2, "value": []}, {"type": 3, "value": []}, {"type": 6, "value": []}, {"type": 7, "value": []}, {"type": 8, "value": []}],
        "draft_removable_storage_device": "", "draft_timeline_materials_size_": 0}
json.dump(meta, open(f"{OUT}/draft_meta_info.json", "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
print("draft ok:", len(vsegs), "video segs,", len(tsegs), "text segs")

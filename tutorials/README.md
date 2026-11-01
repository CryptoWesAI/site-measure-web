# Tutorial films

One short clip (30 to 60 seconds, recorded in the real app, with a computer-made voice-over) per tool, per language.
The list, the titles and the steps are in `src/help/tutorials.ts`; the steps are the subtitles, in the language of the clip
(`src/i18n/<lang>/tutorials.ts` has them in the five other languages; Dutch is the source text).

Files, for every tutorial id in `TUTORIALS` and every language `nl en fr de it es`:

```
public/tutorials/<lang>/<id>.mp4          H.264 + AAC voice-over, 1280x720, about 2 MB or less, starts and ends cleanly
public/tutorials/<lang>/<id>.vtt          WebVTT subtitles: one cue per step, plus the note at the end when the tutorial has one
public/tutorials/<lang>/<id>-poster.jpg   the poster frame, 1280x720
```

The app plays them with a `<video controls playsinline>` (sound on once VOICE_OVER is true in TutorialPlayer.tsx) and a `<track kind="subtitles" default>` for the `.vtt`. Subtitles are
text (not burned in) so they can be switched off and are read by assistive technology.

Nothing here is deployed until the owner says so.

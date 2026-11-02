"use client";

import MuxPlayer from "@mux/mux-player-react";

/** Mux player with signed tokens. Captions come from the asset's text tracks (required before publish). */
export function VideoPlayer({ playbackId, title, tokens }: { playbackId: string; title: string; tokens: { playback: string; thumbnail: string; storyboard: string } }) {
  return (
    <MuxPlayer
      playbackId={playbackId}
      tokens={tokens}
      metadata={{ video_title: title }}
      accentColor="#65474F"
      defaultHiddenCaptions={false}
      style={{ aspectRatio: "16 / 9", width: "100%", borderRadius: 22, overflow: "hidden" }}
    />
  );
}

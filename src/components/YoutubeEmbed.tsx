import React from "react";

interface YoutubeEmbedProps {
  url: string;
}

export function getYoutubeId(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

export default function YoutubeEmbed({ url }: YoutubeEmbedProps) {
  const videoId = getYoutubeId(url);

  if (!videoId) {
    return (
      <div className="w-full aspect-video bg-gray-100 flex flex-col items-center justify-center rounded-2xl border border-gray-200">
        <span className="text-gray-400 text-sm">Insira um link válido do YouTube para transmitir.</span>
      </div>
    );
  }

  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&playlist=${videoId}&loop=1&controls=1&rel=0`;

  return (
    <div className="w-full aspect-video rounded-2xl overflow-hidden shadow-lg border border-gray-100 relative">
      <iframe
        className="absolute top-0 left-0 w-full h-full border-0"
        src={embedUrl}
        title="Live Stream"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      ></iframe>
    </div>
  );
}

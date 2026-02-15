

export function HeroVideo() {
  return (
    <div className="relative w-full overflow-hidden">
      <div className="relative aspect-video w-full bg-muted">
        <iframe
          src="https://www.youtube.com/embed/lCtpqDimcgA?autoplay=1&mute=1&loop=1&playlist=lCtpqDimcgA&controls=0&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1"
          title="Product Video"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          style={{ pointerEvents: "none" }}
        />
        {/* Transparent overlay to excessive blocking interactions if needed, but pointer-events-none on iframe handles it mostly */}
        <div className="absolute inset-0 bg-transparent" />
      </div>
    </div>
  )
}

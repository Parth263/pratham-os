/** Shared mark for the favicon, PWA icon and Apple touch icon: four tiles on near-black. */
export function AppIconMark({ size }: { size: number }) {
  const tile = size * 0.2
  const gap = size * 0.08
  const start = (size - tile * 2 - gap) / 2
  const tiles = [
    { x: start, y: start, r: tile * 0.24 },
    { x: start + tile + gap, y: start, r: tile / 2 },
    { x: start, y: start + tile + gap, r: tile / 2 },
    { x: start + tile + gap, y: start + tile + gap, r: tile * 0.24 },
  ]
  return (
    <div style={{ width: size, height: size, display: "flex", position: "relative", background: "#171717" }}>
      {tiles.map((t, i) => (
        <div key={i} style={{ position: "absolute", left: t.x, top: t.y, width: tile, height: tile, borderRadius: t.r, background: "#fafafa" }} />
      ))}
    </div>
  )
}

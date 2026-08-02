export default function EncabezadoPestana({ icono, titulo, subtitulo }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-1">
        <span className="text-2xl">{icono}</span>
        <h1 className="font-display text-3xl">{titulo}</h1>
      </div>
      {subtitulo && <p className="text-ink-soft">{subtitulo}</p>}
    </div>
  )
}

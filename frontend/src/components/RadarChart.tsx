import { TodayMoodResult } from '../domain/mood'

interface RadarChartProps {
  result: TodayMoodResult
}

export function RadarChart({ result }: RadarChartProps) {
  const center = 96
  const radius = 72
  const points = result.orderedRadar().map(({ value }, index) => {
    const angle = (-90 + index * 72) * (Math.PI / 180)
    const scaled = (value / 100) * radius
    const x = center + Math.cos(angle) * scaled
    const y = center + Math.sin(angle) * scaled
    return `${x},${y}`
  })

  return (
    <svg className="radar-chart" viewBox="0 0 192 192" role="img" aria-label="五行强度雷达图">
      {[0.25, 0.5, 0.75, 1].map((step) => {
        const ring = result.orderedRadar().map((_, index) => {
          const angle = (-90 + index * 72) * (Math.PI / 180)
          const scaled = step * radius
          const x = center + Math.cos(angle) * scaled
          const y = center + Math.sin(angle) * scaled
          return `${x},${y}`
        })

        return <polygon key={step} points={ring.join(' ')} className="radar-ring" />
      })}

      {result.orderedRadar().map(({ key }, index) => {
        const angle = (-90 + index * 72) * (Math.PI / 180)
        const x = center + Math.cos(angle) * radius
        const y = center + Math.sin(angle) * radius
        const labelX = center + Math.cos(angle) * (radius + 18)
        const labelY = center + Math.sin(angle) * (radius + 18)

        return (
          <g key={key}>
            <line x1={center} y1={center} x2={x} y2={y} className="radar-axis" />
            <text x={labelX} y={labelY} className="radar-label">
              {key}
            </text>
          </g>
        )
      })}

      <polygon points={points.join(' ')} className="radar-shape" />
    </svg>
  )
}

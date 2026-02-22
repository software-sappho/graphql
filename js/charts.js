// File: js/charts.js
// - Does: builds SVG line and donut charts for statistics.
// - Exports: shortXP(), renderXPLineChart(), renderAuditDonut().
// - Used from: js/ui.js.
// - Audit refs: Functional (statistics section), General (2 different SVG graphs).
const SVG_NS = 'http://www.w3.org/2000/svg'
const DEBUG = false

function createSvg(tag, attrs = {}) {
  const el = document.createElementNS(SVG_NS, tag)
  Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, String(value)))
  return el
}

export function shortXP(value) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(2)} MB`
  if (value >= 1000) return `${(value / 1000).toFixed(1)} kB`
  return String(value)
}

// [AUDIT] Graph 1: Line chart using SVG (<svg>).
// Data source: XP_BY_RANGE_QUERY -> transaction.amount, transaction.createdAt.
export function renderXPLineChart(container, points) {
  container.innerHTML = ''
  if (!points.length) {
    container.textContent = 'No XP in selected range.'
    return
  }

  const width = 700
  const height = 240
  const pad = { t: 14, r: 18, b: 28, l: 52 }
  const innerW = width - pad.l - pad.r
  const innerH = height - pad.t - pad.b
  const maxY = Math.max(...points.map((p) => p.amount), 1)

  // Real SVG element is appended to DOM (<svg>), not canvas.
  const svg = createSvg('svg', { viewBox: `0 0 ${width} ${height}`, role: 'img' })

  const axis = createSvg('path', {
    d: `M ${pad.l} ${pad.t} V ${height - pad.b} H ${width - pad.r}`,
    stroke: 'var(--border-color)',
    'stroke-width': 2,
    fill: 'none'
  })
  svg.appendChild(axis)

  for (let i = 0; i <= 4; i += 1) {
    const yValue = (maxY / 4) * i
    const y = pad.t + innerH - (yValue / maxY) * innerH
    const line = createSvg('line', {
      x1: pad.l,
      y1: y,
      x2: width - pad.r,
      y2: y,
      stroke: 'var(--border-accent)',
      'stroke-width': i === 0 ? 1.5 : 0.6,
      'stroke-opacity': i === 0 ? 0.8 : 0.3
    })
    svg.appendChild(line)

    const label = createSvg('text', {
      x: pad.l - 8,
      y: y + 4,
      'text-anchor': 'end',
      'font-size': 10,
      fill: 'var(--text-primary)'
    })
    label.textContent = shortXP(Math.round(yValue))
    svg.appendChild(label)
  }

  const coords = points.map((point, idx) => {
    const x = pad.l + (idx / Math.max(points.length - 1, 1)) * innerW
    const y = pad.t + innerH - (point.amount / maxY) * innerH
    return { ...point, x, y }
  })

  const polyline = createSvg('polyline', {
    fill: 'none',
    stroke: 'var(--accent)',
    'stroke-width': 3,
    points: coords.map((c) => `${c.x},${c.y}`).join(' ')
  })
  svg.appendChild(polyline)

  coords.forEach((c) => {
    const dot = createSvg('circle', {
      cx: c.x,
      cy: c.y,
      r: 3.6,
      fill: 'var(--gold)',
      stroke: 'var(--border-color)',
      'stroke-width': 1
    })
    const title = createSvg('title')
    title.textContent = `${c.date}: ${shortXP(c.amount)}`
    dot.appendChild(title)
    svg.appendChild(dot)
  })

  if (DEBUG) {
    const marker = createSvg('text', {
      x: 12,
      y: 16,
      'font-size': 10,
      fill: 'var(--text-primary)'
    })
    marker.textContent = `DEBUG maxXP=${shortXP(maxY)}`
    svg.appendChild(marker)
  }

  container.appendChild(svg)
}

// [AUDIT] Graph 2: Donut chart using SVG (<svg>).
// Data source: AUDIT_QUERY -> audit_up.aggregate.sum.amount, audit_down.aggregate.sum.amount.
export function renderAuditDonut(container, audit) {
  container.innerHTML = ''

  const up = Math.max(audit.up || 0, 0)
  const down = Math.max(audit.down || 0, 0)
  const total = Math.max(up + down, 1)
  const percent = up / total

  const size = 220
  const center = size / 2
  const radius = 78
  const stroke = 25
  const circumference = 2 * Math.PI * radius

  // Real SVG element is appended to DOM (<svg>), not canvas.
  const svg = createSvg('svg', { viewBox: `0 0 ${size} ${size}`, role: 'img' })

  const bg = createSvg('circle', {
    cx: center,
    cy: center,
    r: radius,
    fill: 'none',
    stroke: 'var(--divider)',
    'stroke-width': stroke
  })
  svg.appendChild(bg)

  const fg = createSvg('circle', {
    cx: center,
    cy: center,
    r: radius,
    fill: 'none',
    stroke: 'var(--accent)',
    'stroke-width': stroke,
    'stroke-linecap': 'round',
    transform: `rotate(-90 ${center} ${center})`,
    'stroke-dasharray': `${circumference * percent} ${circumference}`
  })
  const title = createSvg('title')
  title.textContent = `Done: ${up}, Received: ${down}`
  fg.appendChild(title)
  svg.appendChild(fg)

  const midText = createSvg('text', {
    x: center,
    y: center + 5,
    'text-anchor': 'middle',
    'font-size': 18,
    'font-family': 'Oswald, Impact, sans-serif',
    fill: 'var(--text-primary)'
  })
  midText.textContent = `${Math.round(percent * 100)}% done`
  svg.appendChild(midText)

  if (DEBUG) {
    const marker = createSvg('text', {
      x: 12,
      y: 18,
      'font-size': 10,
      fill: 'var(--text-primary)'
    })
    marker.textContent = `DEBUG up=${shortXP(up)} down=${shortXP(down)}`
    svg.appendChild(marker)
  }

  container.appendChild(svg)
}

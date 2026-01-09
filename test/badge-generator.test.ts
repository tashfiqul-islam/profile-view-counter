import { describe, expect, it } from 'vitest'
import { generateModernBadge } from '../src/badge/generator'

describe('Badge Generator', () => {
  it('generates valid SVG with view count', () => {
    const svg = generateModernBadge(42)

    expect(svg).toContain('<svg')
    expect(svg).toContain('PROFILE VISITORS')
    expect(svg).toContain('42')
    expect(svg).toContain('</svg>')
  })

  it('formats large numbers correctly', () => {
    const svg1 = generateModernBadge(1200)
    expect(svg1).toContain('1.2K')

    const svg2 = generateModernBadge(10300)
    expect(svg2).toContain('10.3K')

    const svg3 = generateModernBadge(115400)
    expect(svg3).toContain('115.4K')

    const svg4 = generateModernBadge(1200000)
    expect(svg4).toContain('1.2M')

    const svg5 = generateModernBadge(1500000000)
    expect(svg5).toContain('1.5B')
  })

  it('includes 3D design elements', () => {
    const svg = generateModernBadge(100)

    expect(svg).toContain('filter="url(#logo-shadow)"')
    expect(svg).toContain('filter="url(#text-3d)"')
    expect(svg).toContain('<circle')
    expect(svg).toContain('stroke="#fff"')
  })

  it('includes GitHub icon', () => {
    const svg = generateModernBadge(1)

    expect(svg).toContain('<path')
    expect(svg).toContain('fill="#fff"')
  })

  it('has accessible attributes', () => {
    const svg = generateModernBadge(999)

    expect(svg).toContain('role="img"')
    expect(svg).toContain('aria-label')
    expect(svg).toContain('<title>')
  })
})

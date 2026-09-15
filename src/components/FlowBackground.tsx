'use client'

import { useEffect, useState } from 'react'

const strands = Array.from({ length: 15 }, (_, index) => {
  const offset = index * 19
  return `M ${680 + offset} -100 C ${420 + offset} 180, ${1040 + offset} 290, ${750 + offset} 560 S ${510 + offset} 820, ${850 + offset} 1100`
})

export function FlowBackground() {
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    const updateVisibility = () => setHidden(document.hidden)
    updateVisibility()
    document.addEventListener('visibilitychange', updateVisibility)
    return () => document.removeEventListener('visibilitychange', updateVisibility)
  }, [])

  return (
    <>
      <div className="flow-background" data-paused={hidden} aria-hidden="true">
        <svg className="flow-background__field" viewBox="0 0 1200 1000" fill="none" preserveAspectRatio="xMidYMid slice" focusable="false">
          <g className="flow-background__ribbon">
            {strands.map((path, index) => (
              <path key={index} d={path} />
            ))}
            {strands.filter((_, index) => index % 4 === 0).map((path, index) => (
              <path className="flow-background__signal" key={`signal-${index}`} d={path} pathLength={100} style={{ animationDelay: `${index * -1.7}s` }} />
            ))}
          </g>
          <g className="flow-background__echo">
            {strands.filter((_, index) => index % 2 === 0).map((path, index) => (
              <path key={index} d={path} />
            ))}
          </g>
        </svg>
      </div>
    </>
  )
}

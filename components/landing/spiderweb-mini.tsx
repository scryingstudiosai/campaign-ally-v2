'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

interface Node {
  id: string
  label: string
  type: 'npc' | 'location' | 'faction' | 'quest'
  x: number
  y: number
  vx: number
  vy: number
}

interface Edge {
  from: string
  to: string
}

const nodeColors = {
  npc: { bg: 'rgba(59, 130, 246, 0.3)', border: 'rgba(59, 130, 246, 0.6)', text: '#93c5fd' },
  location: { bg: 'rgba(20, 184, 166, 0.3)', border: 'rgba(20, 184, 166, 0.6)', text: '#5eead4' },
  faction: { bg: 'rgba(168, 85, 247, 0.3)', border: 'rgba(168, 85, 247, 0.6)', text: '#c4b5fd' },
  quest: { bg: 'rgba(251, 191, 36, 0.3)', border: 'rgba(251, 191, 36, 0.6)', text: '#fde68a' },
}

const initialNodes: Node[] = [
  { id: '1', label: 'Kira', type: 'npc', x: 200, y: 100, vx: 0.3, vy: 0.2 },
  { id: '2', label: 'Thornhaven', type: 'location', x: 350, y: 150, vx: -0.2, vy: 0.3 },
  { id: '3', label: 'Silver Covenant', type: 'faction', x: 280, y: 250, vx: 0.25, vy: -0.2 },
  { id: '4', label: 'The Crown', type: 'quest', x: 150, y: 200, vx: -0.15, vy: -0.25 },
  { id: '5', label: 'Grimjaw', type: 'npc', x: 420, y: 220, vx: 0.2, vy: 0.15 },
]

const edges: Edge[] = [
  { from: '1', to: '2' },
  { from: '1', to: '3' },
  { from: '2', to: '5' },
  { from: '3', to: '4' },
  { from: '4', to: '1' },
  { from: '5', to: '3' },
]

export default function SpiderwebMini() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [nodes, setNodes] = useState(initialNodes)
  const animationRef = useRef<number>()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const bounds = { width: 500, height: 320 }
    const padding = 60

    const animate = () => {
      // Update node positions
      setNodes((prevNodes) => {
        return prevNodes.map((node) => {
          let { x, y, vx, vy } = node

          // Update position
          x += vx
          y += vy

          // Bounce off edges
          if (x < padding || x > bounds.width - padding) vx *= -1
          if (y < padding || y > bounds.height - padding) vy *= -1

          // Clamp position
          x = Math.max(padding, Math.min(bounds.width - padding, x))
          y = Math.max(padding, Math.min(bounds.height - padding, y))

          return { ...node, x, y, vx, vy }
        })
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  // Draw edges and nodes
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw edges
    edges.forEach((edge) => {
      const fromNode = nodes.find((n) => n.id === edge.from)
      const toNode = nodes.find((n) => n.id === edge.to)
      if (!fromNode || !toNode) return

      ctx.beginPath()
      ctx.moveTo(fromNode.x, fromNode.y)
      ctx.lineTo(toNode.x, toNode.y)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
      ctx.lineWidth = 1.5
      ctx.stroke()

      // Add glow effect
      ctx.beginPath()
      ctx.moveTo(fromNode.x, fromNode.y)
      ctx.lineTo(toNode.x, toNode.y)
      ctx.strokeStyle = 'rgba(20, 184, 166, 0.1)'
      ctx.lineWidth = 4
      ctx.stroke()
    })
  }, [nodes])

  return (
    <div className="relative w-full h-80 overflow-hidden rounded-xl bg-slate-900/50 border border-white/10">
      <canvas
        ref={canvasRef}
        width={500}
        height={320}
        className="absolute inset-0 w-full h-full"
      />

      {/* Render nodes as DOM elements for better styling */}
      {nodes.map((node) => {
        const colors = nodeColors[node.type]
        return (
          <motion.div
            key={node.id}
            className="absolute flex items-center justify-center"
            style={{
              left: node.x,
              top: node.y,
              transform: 'translate(-50%, -50%)',
            }}
            animate={{ x: 0, y: 0 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          >
            <div
              className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap"
              style={{
                backgroundColor: colors.bg,
                borderColor: colors.border,
                borderWidth: 1,
                borderStyle: 'solid',
                color: colors.text,
              }}
            >
              {node.label}
            </div>
          </motion.div>
        )
      })}

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 via-transparent to-transparent pointer-events-none" />
    </div>
  )
}

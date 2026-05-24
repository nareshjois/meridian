import { useEffect, useRef, useState } from "react"

import { cn } from "@/lib/utils"

type ShaderAuroraProps = {
  className?: string
  intensity?: "calm" | "vivid"
}

type NavigatorConnection = Navigator & {
  connection?: {
    saveData?: boolean
  }
}

function shouldUseStaticBackdrop() {
  if (typeof window === "undefined") {
    return true
  }

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches
  const savesData = (navigator as NavigatorConnection).connection?.saveData
  const lowerPowerDevice = navigator.hardwareConcurrency <= 4

  return prefersReducedMotion || savesData === true || lowerPowerDevice
}

function createShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)

  if (!shader) {
    return null
  }

  gl.shaderSource(shader, source)
  gl.compileShader(shader)

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader)
    return null
  }

  return shader
}

export function ShaderAurora({
  className,
  intensity = "calm",
}: ShaderAuroraProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hasShader, setHasShader] = useState(false)

  useEffect(() => {
    if (shouldUseStaticBackdrop()) {
      return
    }

    const canvas = canvasRef.current
    const gl =
      canvas?.getContext("webgl", {
        alpha: true,
        antialias: false,
        depth: false,
        powerPreference: "low-power",
        stencil: false,
      }) ?? null

    if (!canvas || !gl) {
      return
    }

    const vertexShader = createShader(
      gl,
      gl.VERTEX_SHADER,
      `
      attribute vec2 a_position;

      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `
    )
    const fragmentShader = createShader(
      gl,
      gl.FRAGMENT_SHADER,
      `
      precision mediump float;

      uniform vec2 u_resolution;
      uniform float u_time;

      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution.xy;
        vec2 center = uv - vec2(0.52, 0.48);
        float radius = length(center);
        float ribbon = sin((uv.x * 5.4) + (uv.y * 3.2) + u_time * 0.42);
        float tide = sin((uv.y * 7.0) - (u_time * 0.28));
        float glow = smoothstep(0.82, 0.02, radius);

        vec3 ink = vec3(0.018, 0.047, 0.051);
        vec3 emerald = vec3(0.04, 0.58, 0.43);
        vec3 cyan = vec3(0.26, 0.78, 0.88);
        vec3 pearl = vec3(0.82, 0.95, 0.88);

        vec3 color = mix(ink, emerald, glow * 0.78);
        color = mix(color, cyan, max(ribbon, 0.0) * 0.22);
        color = mix(color, pearl, max(tide, 0.0) * glow * 0.12);

        float vignette = smoothstep(0.92, 0.2, radius);
        gl_FragColor = vec4(color * vignette, 0.95);
      }
    `
    )

    if (!vertexShader || !fragmentShader) {
      return
    }

    const program = gl.createProgram()

    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      return
    }

    const positionBuffer = gl.createBuffer()
    const positionLocation = gl.getAttribLocation(program, "a_position")
    const resolutionLocation = gl.getUniformLocation(program, "u_resolution")
    const timeLocation = gl.getUniformLocation(program, "u_time")

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    )

    let animationFrame = 0
    const maxDevicePixelRatio = intensity === "vivid" ? 1.5 : 1.2

    const resize = () => {
      const pixelRatio = Math.min(
        window.devicePixelRatio || 1,
        maxDevicePixelRatio
      )
      const width = Math.min(canvas.clientWidth * pixelRatio, 1800)
      const height = Math.min(canvas.clientHeight * pixelRatio, 1200)

      canvas.width = Math.max(1, Math.floor(width))
      canvas.height = Math.max(1, Math.floor(height))
      gl.viewport(0, 0, canvas.width, canvas.height)
    }

    const render = (time: number) => {
      gl.useProgram(program)
      gl.enableVertexAttribArray(positionLocation)
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height)
      gl.uniform1f(timeLocation, time * 0.001)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      animationFrame = window.requestAnimationFrame(render)
    }

    resize()
    setHasShader(true)
    animationFrame = window.requestAnimationFrame(render)
    window.addEventListener("resize", resize)

    return () => {
      window.cancelAnimationFrame(animationFrame)
      window.removeEventListener("resize", resize)
      gl.deleteProgram(program)
      gl.deleteShader(vertexShader)
      gl.deleteShader(fragmentShader)
      gl.deleteBuffer(positionBuffer)
    }
  }, [intensity])

  return (
    <div aria-hidden="true" className={cn("pointer-events-none", className)}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(20,184,166,0.34),transparent_32%),radial-gradient(circle_at_82%_12%,rgba(45,212,191,0.2),transparent_30%),linear-gradient(135deg,#061314_0%,#07251f_45%,#041013_100%)]" />
      <div className="absolute inset-x-0 top-0 h-40 bg-white/10 blur-3xl" />
      <canvas
        ref={canvasRef}
        className={cn(
          "absolute inset-0 h-full w-full transition-opacity duration-700",
          hasShader ? "opacity-100" : "opacity-0"
        )}
      />
    </div>
  )
}

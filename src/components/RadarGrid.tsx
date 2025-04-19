import React, { useEffect, useRef, useState } from "react";

interface RadarGridProps {
  radius: number;
  steps: number;
  data: any;
  axisConfig: any;
  sweepSpeed?: number;
}

const RadarGrid = ({ radius, steps, data, axisConfig, sweepSpeed }: RadarGridProps) => {
  const angleStep = (2 * Math.PI) / axisConfig.length;
  const [scatterDots, setScatterDots] = useState<any[]>([]);
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const generateDots = () => {
      return axisConfig
        .map((axis: any, i: number) => {
          const angle = i * angleStep - Math.PI / 2;
          const segmentData = data.find((segment: any) => segment[axis.name]);
          if (!segmentData) return [];

          const dataPoints = Object.keys(segmentData[axis.name]);
          return dataPoints.map(() => {
            const distance = radius * (0.3 + Math.random() * 0.4);
            const randomAngle = angle + (Math.random() - 0.5) * (angleStep / 2);
            return {
              x: radius + distance * Math.cos(randomAngle),
              y: radius + distance * Math.sin(randomAngle),
              segmentIndex: i,
              isIntersected: false,
            };
          });
        })
        .flat();
    };

    setScatterDots(generateDots());
  }, [radius, axisConfig, data]);

  const createCirclePath = (r: number) => `
    M ${radius + r},${radius}
    A ${r},${r} 0 1,1 ${radius - r},${radius}
    A ${r},${r} 0 1,1 ${radius + r},${radius}
  `;

  const createSegmentPath = (r: number, index: number) => {
    const startAngle = index * angleStep;
    const endAngle = startAngle + angleStep;

    const x1 = radius + r * Math.cos(startAngle);
    const y1 = radius + r * Math.sin(startAngle);
    const x2 = radius + r * Math.cos(endAngle);
    const y2 = radius + r * Math.sin(endAngle);

    return `
      M ${radius},${radius}
      L ${x1},${y1}
      A ${r},${r} 0 0,1 ${x2},${y2}
      Z
    `;
  };

  useEffect(() => {
    if (!svgRef.current) return;
    const svgns = "http://www.w3.org/2000/svg";
    const styles = `
      .lagRadar {
        pointer-events: none;
      }
      .lagRadar-sweep > * {
        shape-rendering: crispEdges;
      }
      .lagRadar-face {
        fill: transparent;
      }
      .lagRadar-hand {
        stroke-width: 1px; 
        stroke-linecap: round;
      }
      .animated-dot {
        transition: transform 0.2s ease, r 0.2s ease;
      }
    `;

    const middle = radius;
    const handLength = radius * 0.8;
    const sectorAngle = Math.PI / 12;

    const $hand = document.createElementNS(svgns, "path");
    $hand.setAttribute("class", "lagRadar-hand");
    const $arcs = new Array(60)
      .fill(null)
      .map(() => document.createElementNS(svgns, "path"));
    const $style = document.createElement("style");
    $style.type = "text/css";
    $style.appendChild(document.createTextNode(styles));
    const $sweep = document.createElementNS(svgns, "g");
    $sweep.setAttribute("class", "lagRadar-sweep");
    $arcs.forEach(($arc) => $sweep.appendChild($arc));
    svgRef.current.appendChild($style);
    svgRef.current.appendChild($sweep);
    svgRef.current.appendChild($hand);

    let frame: number;
    let framePtr = 0;
    let last = {
      rotation: 0,
      now: Date.now(),
      tx: middle + handLength,
      ty: middle,
    };

    const PI2 = Math.PI * 2;
    const speed = sweepSpeed || 0.0017;

    const animate = () => {
      const now = Date.now();
      const rdelta = Math.min(PI2 - speed, speed * (now - last.now));
      const rotation = (last.rotation + rdelta) % PI2;
      const tx = middle + handLength * Math.cos(rotation);
      const ty = middle + handLength * Math.sin(rotation);
      const bigArc = rdelta < Math.PI ? "0" : "1";
      const path = `M${tx} ${ty}A${radius} ${radius} 0 ${bigArc} 0 ${last.tx} ${last.ty}L${middle} ${middle}`;
      const hue = 197;

      $arcs[framePtr % 60].setAttribute("d", path);
      $arcs[framePtr % 60].setAttribute("fill", `hsl(${hue}, 80%, 60%)`);
      $hand.setAttribute("d", `M${middle} ${middle}L${tx} ${ty}`);
      $hand.setAttribute("stroke", `hsl(${hue}, 80%, 70%)`);

      scatterDots.forEach((dot, i) => {
        const dotAngle = Math.atan2(dot.y - middle, dot.x - middle);
        const normalizedAngle = (dotAngle + PI2) % PI2;
        dot.isIntersected =
          normalizedAngle > rotation - sectorAngle &&
          normalizedAngle < rotation + sectorAngle;

        const circle = svgRef.current?.querySelector(`.scatter-dot-${i}`);
        if (circle instanceof SVGCircleElement) {
          circle.setAttribute("r", dot.isIntersected ? "6" : "2");
        }
      });

      for (let i = 0; i < 60; i++) {
        $arcs[(60 + framePtr - i) % 60].style.fillOpacity = `${1 - i / 60}`;
      }

      framePtr++;
      last = { now, rotation, tx, ty };
      frame = window.requestAnimationFrame(animate);
    };

    animate();
    return () => {
      window.cancelAnimationFrame(frame);
      svgRef.current?.removeChild($style);
      svgRef.current?.removeChild($sweep);
      svgRef.current?.removeChild($hand);
    };
  }, [radius, scatterDots]);

  return (
    <svg
      ref={svgRef}
      width={radius * 2}
      height={radius * 2}
      viewBox={`0 0 ${radius * 2} ${radius * 2}`}
    >
      <defs>
        <radialGradient id="skyBlueGradient">
          <stop offset="0%" style={{ stopColor: "#87CEEB", stopOpacity: 0.1 }} />
          <stop offset="100%" style={{ stopColor: "#00BFFF", stopOpacity: 0.3 }} />
        </radialGradient>
        <radialGradient id="blueGradient">
          <stop offset="0%" style={{ stopColor: "#87CEEB", stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: "#0BBFFF", stopOpacity: 1 }} />
        </radialGradient>
      </defs>

      {[...Array(steps)].map((_, i) => (
        <path
          key={i}
          d={createCirclePath(i * (radius / steps))}
          fill="url(#skyBlueGradient)"
          stroke="#87CEEB"
          strokeWidth={i === steps - 1 ? 1.5 : 0.5}
        />
      ))}

      {[...Array(steps)].map((_, i) =>
        axisConfig.map((_: any, j: number) => (
          <path
            key={`${i}-${j}`}
            d={createSegmentPath(i * (radius / steps), j)}
            fill="none"
            stroke="#87CEEB"
            strokeWidth="0.5"
            opacity={0.6}
          />
        ))
      )}

      {scatterDots.map((dot, i) => (
        <circle
          key={i}
          className={`scatter-dot-${i} animated-dot`}
          cx={dot.x}
          cy={dot.y}
          fill="url(#blueGradient)"
        />
      ))}

      {axisConfig.map((axis: any, i: number) => {
        const angle = i * angleStep - Math.PI / 2;
        const x = radius + (radius - 2) * Math.cos(angle);
        const y = radius + (radius - 20) * Math.sin(angle);
        return (
          <g key={i} transform={`translate(${x}, ${y})`} textAnchor="middle">
            <rect
              x={-35}
              y={-15}
              width={70}
              height={25}
              rx={5}
              fill="url(#skyBlueGradient)"
              stroke="#87CEEB"
              strokeWidth={1.5}
            />
            <text
              x={0}
              y={0}
              fontSize="15px"
              fill="black"
              alignmentBaseline="middle"
            >
              {axis.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

export default RadarGrid;
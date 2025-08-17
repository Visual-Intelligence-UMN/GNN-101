import React, { useEffect, useMemo, useRef } from "react";
import * as d3 from "d3";
import type { NodeDatum, LinkDatum, HoverState } from "./dualViewTypes";

interface MatrixViewProps {
  width?: number;
  height?: number;
  padding?: number;
  nodes: NodeDatum[]; // order matters
  links: LinkDatum[];
  onHover?: (h: HoverState) => void;
  hover?: HoverState;
}

const MatrixView: React.FC<MatrixViewProps> = ({
  width = 800,
  height = 700,
  padding = 60,
  nodes,
  links,
  onHover,
  hover,
}) => {
    const cellsRef = useRef<any>(null);
  const rootRef = useRef<SVGGElement | null>(null);

  const idToIndex = useMemo(() => {
    const m = new Map<number, number>();
    nodes.forEach((n, i) => m.set(n.id, i));
    return m;
  }, [nodes]);

  const matrix = useMemo(() => {
    const n = nodes.length;
    const M: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
    links.forEach((l) => {
      const si = idToIndex.get(l.source)!;
      const ti = idToIndex.get(l.target)!;
      if (si != null && ti != null) {
        M[si][ti] = 1;
        M[ti][si] = 1;
      }
    });
    return M;
  }, [nodes, links, idToIndex]);

  useEffect(() => {
    const g = d3.select(rootRef.current);
    g.selectAll("*").remove();

    const n = nodes.length;
    const innerW = width - 2 * padding;
    const innerH = height - 2 * padding;
    const cellSize = Math.min(innerW / n, innerH / n) * 0.9;

    const container = g
      .append("g")
      .attr("transform", `translate(${padding},${padding})`);

    const rows = container
      .append("g")
      .attr("class", "matrix-rows")
      .selectAll("g.row")
      .data(matrix)
      .enter()
      .append("g")
      .attr("class", "row")
      .attr("transform", (_d, i) => `translate(0,${i * cellSize})`);

    const cells = rows
      .selectAll("rect.cell")
      .data((row, i) => row.map((v, j) => ({ v, i, j })))
      .enter()
      .append("rect")
      .attr("class", "matrix-cell cell")
      .attr("x", (d) => d.j * cellSize)
      .attr("width", cellSize)
      .attr("height", cellSize)
      .style("fill", (d) => (d.v ? "#69b3a2" : "#eee"))
      .on("mouseover", (_e, d: any) => {
        if (!d.v) return;
        const a = nodes[d.i].id;
        const b = nodes[d.j].id;
        onHover?.({ kind: "edge", a, b });
      })
      .on("mouseout", () => onHover?.(null));

    // top labels
    container
      .append("g")
      .attr("class", "matrix-top-labels")
      .selectAll("text")
      .data(nodes)
      .enter()
      .append("text")
      .attr("class", "axis-label")
      .attr("x", (_d, i) => i * cellSize + cellSize / 2)
      .attr("y", -5)
      .attr("text-anchor", "middle")
      .text((d) => d.id)
      .on("mouseover", (_e, d: any) => onHover?.({ kind: "node", nodeId: d.id }))
      .on("mouseout", () => onHover?.(null));

    // left labels
    container
      .append("g")
      .attr("class", "matrix-left-labels")
      .selectAll("text")
      .data(nodes)
      .enter()
      .append("text")
      .attr("class", "axis-label")
      .attr("x", -5)
      .attr("y", (_d, i) => i * cellSize + cellSize / 2)
      .attr("text-anchor", "end")
      .attr("dominant-baseline", "middle")
      .text((d) => d.id)
      .on("mouseover", (_e, d: any) => onHover?.({ kind: "node", nodeId: d.id }))
      .on("mouseout", () => onHover?.(null));

    // expose for hover updates
    (g as any)._cells = cells;
  }, [nodes, matrix, onHover, width, height, padding]);

  // react to hover changes
  useEffect(() => {
    const g = d3.select(rootRef.current);
    const cells = (g as any)._cells as d3.Selection<SVGRectElement, any, any, any> | undefined;
    if (!cells) return;

    cells.classed("highlighted", false);

    if (!hover) return;

    if (hover.kind === "node") {
      const idx = nodes.findIndex((n) => n.id === hover.nodeId);
      if (idx >= 0) {
        cells.classed(
          "highlighted",
          (d: any) => d.i === idx || d.j === idx
        );
      }
    } else if (hover.kind === "edge") {
      const ai = nodes.findIndex((n) => n.id === hover.a);
      const bi = nodes.findIndex((n) => n.id === hover.b);
      cells.classed(
        "highlighted",
        (d: any) =>
          (d.i === ai && d.j === bi) || (d.i === bi && d.j === ai)
      );
    }
  }, [hover, nodes]);

  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      <g ref={rootRef} />
    </svg>
  );
};

export default MatrixView;
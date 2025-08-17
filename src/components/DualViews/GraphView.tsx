import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import type { NodeDatum, LinkDatum, HoverState } from "./dualViewTypes";

interface GraphViewProps {
  width?: number;
  height?: number;
  padding?: number;
  scaleFactor?: number;
  nodes: NodeDatum[];
  links: LinkDatum[];
  fixedPositions?: Record<number, { x: number; y: number }>; // if provided (and not link mode), use fixed
  linkPredictionMode?: boolean;
  onNodePositionChange?: (positions: { id: number; x: number; y: number }[]) => void;
  onHover?: (h: HoverState) => void;
  hover?: HoverState;
}

const GraphView: React.FC<GraphViewProps> = ({
  width = 800,
  height = 700,
  padding = 60,
  scaleFactor = 1.4,
  nodes,
  links,
  fixedPositions,
  linkPredictionMode = false,
  onNodePositionChange,
  onHover,
  hover,
}) => {
  const rootRef = useRef<SVGGElement | null>(null);
  const simRef = useRef<d3.Simulation<NodeDatum, LinkDatum> | null>(null);

  useEffect(() => {
    const gRoot = d3.select(rootRef.current);
    gRoot.selectAll("*").remove();

    // container g with scaling
    const inner = gRoot
      .append("g")
      .attr("class", "graph-root")
      .attr(
        "transform",
        `translate(${padding + ((width - 2 * padding) / 2) * (1 - scaleFactor)},${
          padding + ((height - 2 * padding) / 2) * (1 - scaleFactor)
        }) scale(${scaleFactor})`
      );

    // data copies to not mutate caller arrays
    const localNodes: NodeDatum[] = nodes.map((n) => ({ ...n }));
    const localLinks: any[] = links.map((l) => ({ ...l }));

    const useFixed = !!fixedPositions && !linkPredictionMode;

    if (useFixed) {
      localNodes.forEach((n) => {
        const fp = fixedPositions[n.id];
        if (fp) {
          n.x = fp.x;
          n.y = fp.y;
        } else {
          n.x = (width - 2 * padding) / 2;
          n.y = (height - 2 * padding) / 2;
        }
      });
    }

    // build visuals
    const linkSel = inner
      .append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(localLinks)
      .enter()
      .append("line")
      .attr("class", "link");

    const nodeG = inner
      .append("g")
      .attr("class", "nodes")
      .selectAll("g.nodeg")
      .data(localNodes, (d: any) => d.id)
      .enter()
      .append("g")
      .attr("class", "nodeg");

    const nodeSel = nodeG
      .append("circle")
      .attr("class", "node")
      .attr("r", 12);

    nodeG
      .append("text")
      .attr("class", "node-label")
      .attr("text-anchor", "middle")
      .attr("dy", 4)
      .text((d) => d.element);

    function applyHover(h: any) {
      if (!h) {
        nodeSel.classed("highlighted", false);
        linkSel.classed("highlighted", false);
        return;
      }
      if (h.kind === "node") {
        nodeSel.classed("highlighted", (n: any) => n.id === h.nodeId);
        linkSel.classed("highlighted", (l: any) => {
          const s = (l.source as any).id ?? l.source;
          const t = (l.target as any).id ?? l.target;
          return s === h.nodeId || t === h.nodeId;
        });
      } else if (h.kind === "edge") {
        linkSel.classed("highlighted", (l: any) => {
          const s = (l.source as any).id ?? l.source;
          const t = (l.target as any).id ?? l.target;
          return (s === h.a && t === h.b) || (s === h.b && t === h.a);
        });
        nodeSel.classed(
          "highlighted",
          (n: any) => n.id === h.a || n.id === h.b
        );
      }
    }

    // hover interactions
    nodeSel
      .on("mouseover", (_evt, d: any) => onHover?.({ kind: "node", nodeId: d.id }))
      .on("mouseout", () => onHover?.(null));

    linkSel
      .on("mouseover", (_evt, d: any) => {
        const s = (d.source as any).id ?? d.source;
        const t = (d.target as any).id ?? d.target;
        onHover?.({ kind: "edge", a: s, b: t });
      })
      .on("mouseout", () => onHover?.(null));

    const drag = d3
      .drag<SVGGElement, NodeDatum>()
      .on("start", (event, d) => {
        if (simRef.current && !event.active) simRef.current.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", (event, d) => {
        if (simRef.current && !event.active) simRef.current.alphaTarget(0);
        d.fx = null;
        d.fy = null;
        if (!linkPredictionMode && onNodePositionChange) {
          const out = localNodes.map((n) => ({ id: n.id, x: n.x ?? 0, y: n.y ?? 0 }));
          onNodePositionChange(out);
        }
      });

    nodeG.call(drag as any);

    // Simulation (only if not fixed or always in link mode)
    if (!useFixed) {
      const sim = d3
        .forceSimulation<NodeDatum>(localNodes)
        .force(
          "link",
          d3
            .forceLink<NodeDatum, any>(localLinks)
            .id((d: any) => d.id)
            .distance(80)
        )
        .force("charge", d3.forceManyBody().strength(-200))
        .force(
          "center",
          d3.forceCenter((width - 2 * padding) / 2, (height - 2 * padding) / 2)
        )
        .force("x", d3.forceX((width - 2 * padding) / 2).strength(0.1))
        .force("y", d3.forceY((height - 2 * padding) / 2).strength(0.1));

      sim.on("tick", () => {
        linkSel
          .attr("x1", (d: any) => ((d.source as any).x ?? 0))
          .attr("y1", (d: any) => ((d.source as any).y ?? 0))
          .attr("x2", (d: any) => ((d.target as any).x ?? 0))
          .attr("y2", (d: any) => ((d.target as any).y ?? 0))
          .style("stroke", (d: any) => (d.attr?.type === "aromatic" ? "purple" : "#aaa"));

        nodeG.attr(
          "transform",
          (d: any) => `translate(${d.x ?? 0},${d.y ?? 0})`
        );
      });

      simRef.current = sim as any;
    } else {
      // draw once with fixed
      linkSel
        .attr("x1", (d: any) => {
          const sId = (d.source as any).id ?? d.source;
          return fixedPositions?.[sId]?.x ?? 0;
        })
        .attr("y1", (d: any) => {
          const sId = (d.source as any).id ?? d.source;
          return fixedPositions?.[sId]?.y ?? 0;
        })
        .attr("x2", (d: any) => {
          const tId = (d.target as any).id ?? d.target;
          return fixedPositions?.[tId]?.x ?? 0;
        })
        .attr("y2", (d: any) => {
          const tId = (d.target as any).id ?? d.target;
          return fixedPositions?.[tId]?.y ?? 0;
        })
        .style("stroke", (d: any) => (d.attr?.type === "aromatic" ? "purple" : "#aaa"));

      nodeG.attr("transform", (d: any) => `translate(${d.x ?? 0},${d.y ?? 0})`);
    }

    applyHover(hover);

    return () => {
      simRef.current?.stop();
      simRef.current = null;
    };
  }, [
    nodes,
    links,
    fixedPositions,
    linkPredictionMode,
    width,
    height,
    padding,
    scaleFactor,
  ]);

  // respond to external hover changes without rebuilding scene
  useEffect(() => {
    const gRoot = d3.select(rootRef.current);
    const linkSel = gRoot.selectAll<SVGLineElement, any>("line.link");
    const nodeSel = gRoot.selectAll<SVGCircleElement, any>("circle.node");

    function clearAll() {
      nodeSel.classed("highlighted", false);
      linkSel.classed("highlighted", false);
    }

    clearAll();
    if (!hover) return;

    if (hover.kind === "node") {
      nodeSel.classed("highlighted", (n: any) => n.id === hover.nodeId);
      linkSel.classed("highlighted", (l: any) => {
        const s = (l.source as any).id ?? l.source;
        const t = (l.target as any).id ?? l.target;
        return s === hover.nodeId || t === hover.nodeId;
      });
    } else if (hover.kind === "edge") {
      linkSel.classed("highlighted", (l: any) => {
        const s = (l.source as any).id ?? l.source;
        const t = (l.target as any).id ?? l.target;
        return (s === hover.a && t === hover.b) || (s === hover.b && t === hover.a);
      });
      nodeSel.classed(
        "highlighted",
        (n: any) => n.id === hover.a || n.id === hover.b
      );
    }
  }, [hover]);

  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      <g ref={rootRef} />
    </svg>
  );
};

export default GraphView;
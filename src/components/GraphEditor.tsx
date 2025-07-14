import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import Draggable from "react-draggable";

type Position = { x: number; y: number };
interface GraphEditorProps {
  onClose: () => void;
}

export default function GraphEditor({ onClose }: GraphEditorProps): JSX.Element {
  const [defaultPos, setDefaultPos] = useState<Position>({ x: 200 / 2.2, y: 120 });
  const [size, setSize] = useState({ width: 680, height: 680 });

  const svgContainer = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<d3.Simulation<any, any> | null>(null);
  const isRunningRef = useRef(true);
  const [isRunning, setIsRunning] = useState(true);
  const isDraggingRef = useRef(false);
  const linksRef = useRef<any[]>([]); // 存储链接数据以便恢复

  useEffect(() => {
    setDefaultPos({ x: window.innerWidth / 2.2, y: 150 });
  }, []);

  useEffect(() => {
    if (!svgContainer.current) return;

    const width = 640;
    const height = 640;

    const color = d3.scaleOrdinal(d3.schemeTableau10);

    const data = {
      nodes: [
        { id: "A", group: 1 },
        { id: "B", group: 1 },
        { id: "C", group: 2 },
        { id: "D", group: 2 },
      ],
      links: [
        { source: "A", target: "B", value: 1 },
        { source: "A", target: "C", value: 2 },
        { source: "B", target: "D", value: 1 },
        { source: "C", target: "D", value: 3 },
      ],
    };

    const links = data.links.map(d => Object.create(d));
    const nodes = data.nodes.map(d => Object.create(d));
    linksRef.current = links;

    const simulation = d3
      .forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d: any) => d.id))
      .force("charge", d3.forceManyBody())
      .force("center", d3.forceCenter(width / 2, height / 2))
      .on("tick", ticked);

    simulationRef.current = simulation;

    const svg = d3
      .create("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "max-width: 100%; height: auto;");

    const link = svg
      .append("g")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", (d: any) => Math.sqrt(d.value));

    const node = svg
      .append("g")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", 5)
      .attr("fill", (d: any) => color(d.group.toString()))
      .call(drag(simulation) as any);

    node.append("title").text((d: any) => d.id);

    function ticked() {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node
        .attr("cx", (d: any) => d.x)
        .attr("cy", (d: any) => d.y);
    }

    function drag(simulation: any) {
      function dragstarted(event: any) {
        isDraggingRef.current = true;
        simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }

      function dragged(event: any) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }

      function dragended(event: any) {
        isDraggingRef.current = false;
        simulation.alphaTarget(0);
        if (isRunningRef.current) {
          event.subject.fx = null;
          event.subject.fy = null;
        }
        // 如果暂停，就保留 fx/fy，让节点停在拖拽后位置
      }

      return d3
        .drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    }

    svgContainer.current.innerHTML = "";
    svgContainer.current.appendChild(svg.node()!);
  }, []);

  const handleToggleSimulation = () => {
    const sim = simulationRef.current;
    if (!sim) return;

    if (isRunningRef.current) {
      sim.force("link", null);
      sim.force("charge", null);
    } else {
      sim
        .force("link", d3.forceLink(linksRef.current).id((d: any) => d.id))
        .force("charge", d3.forceManyBody());
    }

    isRunningRef.current = !isRunningRef.current;
    setIsRunning(isRunningRef.current);
    sim.alpha(0.5).restart(); // 立即重新开始以应用新力设置
  };

  return (
    <Draggable defaultPosition={defaultPos} handle=".header">
      <div
        style={{
          position: "fixed",
          zIndex: 9999,
          width: size.width,
          height: size.height,
          background: "white",
          border: "1px solid #ccc",
          boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          overflow: "hidden",
        }}
      >
        <div
          className="header"
          style={{
            position: "relative",
            padding: "4px 8px",
            backgroundColor: "black",
            color: "white",
            fontWeight: "bold",
            fontSize: "16px",
            cursor: "move",
            paddingLeft: "40px",
          }}
        >
          Graph Editor
          <span
            onClick={onClose}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              padding: "4px 8px",
              backgroundColor: "black",
              color: "white",
              cursor: "pointer",
              borderBottomRightRadius: "6px",
            }}
          >
            ×
          </span>
        </div>

        <div style={{ padding: "4px" }}>
          <button onClick={handleToggleSimulation} style={{ marginBottom: "10px" }}>
            {isRunning ? "Pause Physics" : "Resume Physics"}
          </button>
        </div>

        <div ref={svgContainer} style={{ width: "100%", height: "100%" }}></div>
      </div>
    </Draggable>
  );
}

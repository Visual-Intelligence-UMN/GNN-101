import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import Draggable from "react-draggable";
import styles from './GraphEditor.module.css';

type Position = { x: number; y: number };
interface GraphEditorProps {
  onClose: () => void;
}

export default function GraphEditor({ onClose }: GraphEditorProps): JSX.Element {
  const [defaultPos, setDefaultPos] = useState<Position>({ x: 200 / 2.2, y: 120 });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const [size, setSize] = useState({ width: 680, height: 680 });

  const svgContainer = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<d3.Simulation<any, any> | null>(null);
  const isRunningRef = useRef(true);
  const [isRunning, setIsRunning] = useState(true);
  const isDraggingRef = useRef(false);
  const linksRef = useRef<any[]>([]); 
  const nodesRef = useRef<any[]>([]);

  useEffect(() => {
    setDefaultPos({ x: window.innerWidth / 2.2, y: 150 });
  }, []);

  useEffect(() => {
  if (!svgContainer.current) return;

  const width = 640;
  const height = 640;
  const color = d3.scaleOrdinal(d3.schemeTableau10);

  const initialData = {
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

  const links = initialData.links.map(d => Object.create(d));
  const nodes = initialData.nodes.map(d => Object.create(d));
  nodesRef.current = nodes;
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
    .attr("style", "max-width: 100%; height: auto;")
    .on("click", (event: MouseEvent) => {
      if (!isRunningRef.current) {
        const point = d3.pointer(event);
        addNodeAt(point[0], point[1]);
      }
    });

  svgContainer.current.innerHTML = "";
  svgContainer.current.appendChild(svg.node()!);

  const linkGroup = svg
    .append("g")
    .attr("stroke", "#999")
    .attr("stroke-opacity", 0.6);

  const nodeGroup = svg
    .append("g")
    .attr("stroke", "#fff")
    .attr("stroke-width", 1.5);

  function ticked() {
    const links = linkGroup.selectAll("line").data(linksRef.current);
    links
      .join("line")
      .attr("stroke-width", (d: any) => Math.sqrt(d.value))
      .attr("x1", (d: any) => d.source.x)
      .attr("y1", (d: any) => d.source.y)
      .attr("x2", (d: any) => d.target.x)
      .attr("y2", (d: any) => d.target.y);

    const nodes = nodeGroup.selectAll("circle").data(nodesRef.current, (d: any) => d.id);
    nodes
      .join("circle")
      .attr("r", 5)
      .attr("fill", (d: any) => color(d.group?.toString() || "0"))
      .call(drag(simulation) as any)
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
    }

    return d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
  }

  function addNodeAt(x: number, y: number) {
    const newNodeId = `N${nodesRef.current.length + 1}`;
    const newNode = { id: newNodeId, group: 3, x, y, fx: x, fy: y };
    nodesRef.current.push(newNode);

    // 更新 simulation
    simulation.nodes(nodesRef.current);
    simulation.alpha(0.5).restart();
  }
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
    sim.alpha(0.5).restart(); 
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
            {isRunning ? "Switch to Editor Mode" : "Switch to Observer Mode"}
          </button>
        </div>

        <div ref={svgContainer} style={{ width: "100%", height: "100%" }}></div>
      </div>
    </Draggable>
  );
}

import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import Draggable from "react-draggable";
import {
    processDataFromEditorToVisualizer,
    processDataFromVisualizerToEditor,
} from "@/utils/graphEditorUtils";
type Position = { x: number; y: number };
interface GraphEditorProps {
    onClose: () => void;
    simGraphData: any;
    handleSimulatedGraphChange?: (value: any) => void;
    onNodePositionsChange?: (nodePositions: { id: string; x: number; y: number }[]) => void;
}

export default function GraphEditor({
    onClose,
    simGraphData, 
    handleSimulatedGraphChange,
    onNodePositionsChange,
}: GraphEditorProps): JSX.Element {
    const [defaultPos, setDefaultPos] = useState<Position>({
        x: 200 / 2.2,
        y: 120,
    });
    const [size, setSize] = useState({ width: 680, height: 680 });
    const [isRunning, setIsRunning] = useState(true);

    const svgContainer = useRef<HTMLDivElement>(null);
    const simulationRef = useRef<d3.Simulation<any, any> | null>(null);
    const isRunningRef = useRef(true);
    const isDraggingRef = useRef(false);
    const linksRef = useRef<any[]>([]);
    const nodesRef = useRef<any[]>([]);
    const selectionState = useRef(false);

    const datasetRef = useRef<any>({});
    const [mode, setMode] = useState("edge");

    // Sync state
    const selectedNodeRef = useRef<string | null>(null);
    const secondSelectedNodeRef = useRef<string | null>(null);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [secondSelectedNodeId, setSecondSelectedNodeId] = useState<
        string | null
    >(null);

    const selectedLinkRef = useRef<SVGLineElement | null>(null);

    const getCurrentDataset = () => ({
        nodes: nodesRef.current,
        links: linksRef.current,
    });

    useEffect(() => {
        setDefaultPos({ x: window.innerWidth / 2.2, y: 150 });
    }, []);

    useEffect(() => {
        if (!svgContainer.current) return;

        const width = 640;
        const height = 640;
        const color = d3.scaleOrdinal(d3.schemeTableau10);

        // const dataset = require("/json_data/graphs/testing_graph.json");
        let data = simGraphData;
                console.log("Loaded graph:", data);

                const initialData = processDataFromVisualizerToEditor(data);
                datasetRef.current = initialData;

                const links = initialData.links.map((d) => Object.create(d));
                const nodes = initialData.nodes.map((d) => Object.create(d));
                nodesRef.current = nodes;
                linksRef.current = links;

                const simulation = d3
                    .forceSimulation(nodes)
                    .force(
                        "link",
                        d3
                            .forceLink(links)
                            .id((d: any) => d.id)
                            .distance(100)
                    )
                    .force("charge", d3.forceManyBody().strength(-100))
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
                            if (selectedLinkRef.current) {
                                d3.select(selectedLinkRef.current).attr(
                                    "stroke",
                                    "#999"
                                );
                                selectedLinkRef.current = null;
                            }

                            if (!selectionState.current) {
                                const point = d3.pointer(event);
                                addNodeAt(point[0], point[1]);
                            } else {
                                d3.selectAll("circle").attr("stroke", "none");
                                selectedNodeRef.current = null;
                                secondSelectedNodeRef.current = null;
                                setSelectedNodeId(null);
                                setSecondSelectedNodeId(null);
                                selectionState.current = false;
                            }
                        }
                    });

                svgContainer.current.innerHTML = "";
                svgContainer.current.appendChild(svg.node()!);

                const linkGroup = svg
                    .append("g")
                    .attr("stroke", "#aaa")
                    .attr("stroke-opacity", 0.6);

                const nodeGroup = svg
                    .append("g")
                    .attr("stroke", "#fff")
                    .attr("stroke-width", 1.5);

                const labelGroup = svg
                    .append("g")
                    .attr("font-family", "sans-serif")
                    .attr("font-size", 12)
                    .attr("text-anchor", "middle")
                    .attr("pointer-events", "none");

                function getNodeNumber(d: any) {
                    if (typeof d.id === "string") {
                    const m = d.id.match(/\d+/);
                    if (m) return +m[0];
                    }
                    return (d.index ?? nodesRef.current.indexOf(d)) + 1;
                }

                function ticked() {
                    linkGroup
                        .selectAll("line")
                        .data(linksRef.current)
                        .join("line")
                        .attr("x1", (d: any) => d.source.x)
                        .attr("y1", (d: any) => d.source.y)
                        .attr("x2", (d: any) => d.target.x)
                        .attr("y2", (d: any) => d.target.y)
                        .on("click", function (event: MouseEvent) {
                            event.stopPropagation();

                            if (selectedLinkRef.current) {
                                d3.select(selectedLinkRef.current).attr(
                                    "stroke",
                                    "#aaa"
                                );
                            }

                            if (selectedLinkRef.current === this) {
                                selectedLinkRef.current = null;
                            } else {
                                d3.select(this).attr("stroke", "black");
                                selectedLinkRef.current =
                                    this as SVGLineElement;
                            }
                        });

                    nodeGroup
                        .selectAll("circle")
                        .data(nodesRef.current, (d: any) => d.id)
                        .join("circle")
                        .attr("r", 12)
                        .attr("stroke", "#aaa")
                        .attr("fill", "white")
                        .call(drag(simulation) as any)
                        .attr("cx", (d: any) => d.x)
                        .attr("cy", (d: any) => d.y)
                        .on("click", function (event: MouseEvent, d: any) {
                            event.stopPropagation();

                            const clickedId = d.id;

                            const isFirstSelected =
                                selectedNodeRef.current === clickedId;
                            const isSecondSelected =
                                secondSelectedNodeRef.current === clickedId;

                            if (
                                selectedNodeRef.current &&
                                secondSelectedNodeRef.current
                            ) {
                                d3.selectAll("circle").attr("stroke", "none");
                                selectedNodeRef.current = null;
                                secondSelectedNodeRef.current = null;
                                setSelectedNodeId(null);
                                setSecondSelectedNodeId(null);
                                selectionState.current = false;
                                return;
                            }

                            if (!selectionState.current) {
                                d3.select(this).attr("stroke", "black");
                                selectedNodeRef.current = clickedId;
                                setSelectedNodeId(clickedId);
                                selectionState.current = true;
                                return;
                            }

                            if (
                                selectionState.current &&
                                !secondSelectedNodeRef.current &&
                                isFirstSelected
                            ) {
                                d3.select(this).attr("stroke", "none");
                                selectedNodeRef.current = null;
                                setSelectedNodeId(null);
                                selectionState.current = false;
                                return;
                            }

                            if (
                                selectionState.current &&
                                !secondSelectedNodeRef.current &&
                                !isFirstSelected
                            ) {
                                d3.select(this).attr("stroke", "black");
                                secondSelectedNodeRef.current = clickedId;
                                setSecondSelectedNodeId(clickedId);

                                const sourceId = selectedNodeRef.current!;
                                const targetId = secondSelectedNodeRef.current!;

                                const alreadyLinked = linksRef.current.some(
                                    (link: any) =>
                                        (link.source.id === sourceId &&
                                            link.target.id === targetId) ||
                                        (link.source.id === targetId &&
                                            link.target.id === sourceId)
                                );

                                if (alreadyLinked) {
                                    d3.selectAll("circle").attr(
                                        "stroke",
                                        "none"
                                    );
                                    selectedNodeRef.current = null;
                                    secondSelectedNodeRef.current = null;
                                    setSelectedNodeId(null);
                                    setSecondSelectedNodeId(null);
                                    selectionState.current = false;
                                } else {
                                    linksRef.current.push({
                                        source: sourceId,
                                        target: targetId,
                                        value: 1,
                                    });
                                    const linkForce =
                                        simulationRef.current?.force(
                                            "link"
                                        ) as d3.ForceLink<any, any>;
                                    linkForce?.links(linksRef.current);
                                    simulationRef.current?.alpha(0.5).restart();
                                    d3.selectAll("circle").attr(
                                        "stroke",
                                        "none"
                                    );
                                    selectedNodeRef.current = null;
                                    secondSelectedNodeRef.current = null;
                                    setSelectedNodeId(null);
                                    setSecondSelectedNodeId(null);
                                    selectionState.current = false;
                                    handleTransmitToMainVisualizer();
                                }

                                return;
                            }
                        });
                    

                    labelGroup
                        .selectAll("text")
                        .data(nodesRef.current, (d: any) => d.id)
                        .join(
                        (enter) =>
                        enter
                        .append("text")
                        .text((d: any) => getNodeNumber(d))
                        .attr("dy", "0.35em")
                        .attr("stroke", "#fff")
                        .attr("stroke-width", 3)
                        .attr("paint-order", "stroke")
                        .attr("fill", "#111"),
                        (update) => update.text((d: any) => getNodeNumber(d))
                        )
                        .attr("x", (d: any) => d.x)
                        .attr("y", (d: any) => d.y);

                    if (onNodePositionsChange) {
                        onNodePositionsChange(nodesRef.current.map(node => ({ id: node.id, x: node.x, y: node.y })));
                    }
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
                        handleTransmitToMainVisualizer();
                    }

                    return d3
                        .drag()
                        .on("start", dragstarted)
                        .on("drag", dragged)
                        .on("end", dragended);
                }

                function addNodeAt(x: number, y: number) {
                    const newNodeId = `N${nodesRef.current.length}`;
                    const newNode = {
                        id: newNodeId,
                        group: 3,
                        x,
                        y,
                        fx: x,
                        fy: y,
                    };
                    console.log("Adding new node:", getCurrentDataset());
                    nodesRef.current.push(newNode);
                    simulation.nodes(nodesRef.current);
                    simulation.alpha(0.5).restart();
                    if (onNodePositionsChange) {
                        onNodePositionsChange(nodesRef.current.map(node => ({ id: node.id, x: node.x, y: node.y })));
                    }
                    handleTransmitToMainVisualizer();
                }

                const handleKeyDown = (e: KeyboardEvent) => {
                    if (e.key === "x" || e.key === "X") {
                        if (selectedLinkRef.current) {
                            const linkEl = selectedLinkRef.current;
                            const linkDatum = d3.select(linkEl).datum() as any;

                            linksRef.current = linksRef.current.filter(
                                (l) =>
                                    !(
                                        (l.source.id === linkDatum.source.id &&
                                            l.target.id ===
                                                linkDatum.target.id) ||
                                        (l.source.id === linkDatum.target.id &&
                                            l.target.id === linkDatum.source.id)
                                    )
                            );

                            selectedLinkRef.current = null;
                        }

                        if (selectedNodeRef.current) {
                            const nodeIdToDelete = selectedNodeRef.current;

                            nodesRef.current = nodesRef.current.filter(
                                (n) => n.id !== nodeIdToDelete
                            );

                            linksRef.current = linksRef.current.filter(
                                (l) =>
                                    l.source.id !== nodeIdToDelete &&
                                    l.target.id !== nodeIdToDelete
                            );

                            d3.selectAll("circle").attr("stroke", "none");
                            selectedNodeRef.current = null;
                            secondSelectedNodeRef.current = null;
                            setSelectedNodeId(null);
                            setSecondSelectedNodeId(null);
                            selectionState.current = false;
                        }

                        const linkForce = simulationRef.current?.force(
                            "link"
                        ) as d3.ForceLink<any, any>;
                        linkForce?.links(linksRef.current);
                        simulationRef.current?.nodes(nodesRef.current);
                        simulationRef.current?.alpha(0.5).restart();
                        if (onNodePositionsChange) {
                            onNodePositionsChange(nodesRef.current.map(node => ({ id: node.id, x: node.x, y: node.y })));
                        }
                    }
                    handleTransmitToMainVisualizer();
                };

                window.addEventListener("keydown", handleKeyDown);

                return () => {
                    window.removeEventListener("keydown", handleKeyDown);
                };
    }, []);

    const handleToggleSimulation = () => {
        const sim = simulationRef.current;
        if (!sim) return;

        if (isRunningRef.current) {
            sim.force("link", null);
            sim.force("charge", null);
        } else {
            sim.force(
                "link",
                d3.forceLink(linksRef.current).id((d: any) => d.id)
                   
                            .id((d: any) => d.id)
                            .distance(100)
                    
            ).force("charge", d3.forceManyBody().strength(-100));
        }

        isRunningRef.current = !isRunningRef.current;
        setIsRunning(isRunningRef.current);
        sim.alpha(0.5).restart();
    };

    const handleModeSwitch=()=>{
        handleToggleSimulation();
        setMode(mode === "edge" ? "node" : "edge");
    }

    const handleTransmitToMainVisualizer = () => {
        const currentDataset = getCurrentDataset();

        console.log("editor pipe", currentDataset);

        const dataReady = processDataFromEditorToVisualizer(currentDataset);
        if (handleSimulatedGraphChange) {
            handleSimulatedGraphChange(dataReady);
        }
        console.log("Transmitting data to main visualizer:", dataReady);
    };

    return (
            <div>
                <div style={{ padding: "4px" }}>
                    <button
                        onClick={handleModeSwitch}
                        style={{
                            padding: "10px 20px",
                            borderRadius: "30px",
                            border: "2px solid #aaa",
                            fontWeight: "bold",
                            backgroundColor: mode === "node" ? "yellow" : "white",
                            cursor: "pointer"
                            , color: "#aaa"
                            }}
                    >
                        Node Edit
                    </button>
                    <button
                        onClick={handleModeSwitch}
                        style={{
                            padding: "10px 20px",
                            borderRadius: "30px",
                            border: "2px solid #aaa",
                            fontWeight: "bold",
                            backgroundColor: mode === "edge" ? "yellow" : "white",
                            cursor: "pointer", color: "#aaa"
                            }}
                    >
                        Edge Edit
                    </button>
                </div>

                <div
                    ref={svgContainer}
                    style={{ width: "100%", height: "100%" }}
                ></div>
            </div>
    );
}


import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import {
    data_prep,
    prep_graphs,
    connectCrossGraphNodes,
    featureVisualizer,
    softmax,
    myColor,
    loadNodesLocation
} from "../utils/utils";

import { visualizeGraph } from "../components/WebUtils";
import { aggregationCalculator } from "@/utils/graphUtils";
import { sources } from "next/dist/compiled/webpack/webpack";
import { buildBinaryLegend, buildLegend } from "@/utils/matHelperUtils";
import { findAbsMax } from "@/utils/matNNVis";
import { injectSVG } from "@/utils/svgUtils";



interface GraphVisualizerProps {
    onLoadComplete: () => void; 
    graph_path: string;
    intmData: null | any;
    changed: boolean;
    predicted: boolean;
    selectedButtons: boolean[];
    simulationLoading: boolean;
    setSimulation: Function;
    innerComputationMode: string
    simGraphData: any,
    sandBoxMode: boolean,
    nodePositions?: { id: string; x: number; y: number }[];
}

const GraphVisualizer: React.FC<GraphVisualizerProps> = ({
    onLoadComplete,
    graph_path,
    intmData,
    changed,
    predicted,
    selectedButtons,
    simulationLoading,
    setSimulation,
    innerComputationMode,
    simGraphData,
    sandBoxMode,
    nodePositions,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const lastIntmData = useRef(intmData);
    const svgRef = useRef<SVGSVGElement | null>(null);
    const currentVisualizationId = useRef(0);
    const parse = typeof graph_path === 'string' ? graph_path.match(/(\d+)\.json$/) : null;
    const select = parse ? parse[1] : '';
    
    console.log("vis selector", select)
    const location = loadNodesLocation(0, select);
    console.log("original location", location)
    console.log("passed in location", nodePositions)
    console.log("Use sandnox",sandBoxMode)





    useEffect(() => {


        setSimulation(false)
        const visualizationId = ++currentVisualizationId.current;

        const init = async (graphs: any[]) => {


            if (intmData != null) {

            }

            let allNodes: any[] = [];
            const offset = 600;
            const margin = { top: 10, right: 30, bottom: 30, left: 40 };
            const width = 8 * offset - margin.left - margin.right;
            const height = 1000 - margin.top - margin.bottom;
            let initialCoords = {} as any;

            // Append the SVG object to the body of the page
            d3.select("#my_dataviz").selectAll("svg").remove();
            const svg = d3
                .select("#my_dataviz")
                .append("svg")
                .attr("width", width)
                .attr("height", height)
                .attr("class", "gvis");

            //TODO: put the hint label position into the injection function, using class attr for the interactions
            const gLabel = d3.select(".gvis").append("g").attr("class", "hintLabel");

            if (graph_path === "./json_data/graphs/input_graph0.json") {
                injectSVG(gLabel, location[3].x - 1650 - 64 + offset, location[3].y - 120 - 64, "./assets/SVGs/interactionHint.svg", "hintLabel");
            } else {
                console.log("location", location)
                injectSVG(gLabel, location[0].x - 1650 - 64 + offset, location[0].y - 120 - 64, "./assets/SVGs/interactionHint.svg", "hintLabel");
            }




            svgRef.current = svg.node();

          //  let colorSchemes: any = [];


            graphs.forEach((data, i) => {



                let xOffset = (i - 2.5) * offset;
                if (i >= 4) {
                    xOffset = (i - 2.5) * offset - 25 * (i * 1.5);
                }
                const g1 = svg
                    .append("g")
                    .attr("class", "layerVis")
                    .attr("transform", `translate(${xOffset},${margin.top})`)
                    .attr("layerNum", i)


                // Initialize the links
                const link = g1
                    .selectAll("line")
                    .data(data.links)
                    .join("line")
                    .style("stroke", "#aaa");

                // Initialize the nodes
                const node = g1
                    .selectAll("circle")
                    .data(data.nodes)
                    .join("circle")
                    .attr("r", 17)
                    .style("fill", "white")
                    .style("stroke", "#69b3a2")
                    .style("stroke-width", 1)
                    .style("stroke-opacity", 1)
                    .attr("opacity", 1)



                let maxXDistance = 0;
                let maxYDistance = 0;
                console.log("data_graphvis", data)
                let limitedNodes = data.nodes.slice(0, 17);

                limitedNodes.forEach((node1: any) => {
                    limitedNodes.forEach((node2: any) => {
                        if (node1 !== node2) {
                            const xDistance = Math.abs(node1.x - node2.x);
                            const yDistance = Math.abs(node1.y - node2.y);
                            if (xDistance > maxXDistance) {
                                maxXDistance = xDistance;
                            }

                            if (yDistance > maxYDistance) {
                                maxYDistance = yDistance;
                            }
                        }
                    });
                });

                let point1 = { x: 3.0 * offset, y: height / 8 };
                let point3 = { x: 2.9 * offset, y: height / 1.7 };


                let centerX = (point1.x + point3.x) / 2;
                let centerY = (point1.y + point3.y) / 2;
                if (i < 4) {
                    data.nodes.forEach((node: any, j: number) => {
                        if (sandBoxMode && nodePositions && nodePositions.length > 0) {
                            console.log("IN1")
                            const editorNode = nodePositions
                            if (editorNode.length != 0) {
                                console.log("IN2")
                                node.x = editorNode[node.id].x + 1500;
                                node.y = editorNode[node.id].y ;
                            } else {
                                console.log("IN3")
                                node.x = Math.random() * width;
                                node.y = Math.random() * height;
                            }
                        } else if (location[i.toString()]) {
                            console.log("IN4")
                            node.x = location[j.toString()].x;
                            node.y = location[j.toString()].y;
                        } else {
                            console.log("IN5")
                            node.x = Math.random() * width;
                            node.y = Math.random() * height;
                        }
                    });
                    data.nodes.forEach((node1: any) => {
                        console.log("IN6")
                        initialCoords[node1.id] = {
                            x: node1.x,
                            y: node1.y,
                        };
                    });
                } else {
                    data.nodes.forEach((node: any, j: number) => {
                        node.x = centerX + 10
                        node.y = centerY - 10
                    });

                    if (i === 5) {
                        console.log("VAWSD")
                        g1.append("text")
                            .attr("x", (i - 2) * offset - 17)
                            .attr("y", centerY - 20)
                            .text("Mutagenic")



                        g1.append("text")
                            .attr("x", (i - 2) * offset - 17)
                            .attr("y", centerY + 15)
                            .text("Non-Mutagenic")
                    }
                }



                // This is needed to connect links to the nodes within its own graph.
                d3.forceSimulation(data.nodes)
                    .force("link", d3.forceLink(data.links).id((d: any) => d.id).distance(20))
                    .stop()
                    .on("tick", ticked);


                function ticked() {
                    const weightExtent = d3.extent(data.links, (d: any) => d.weight);
                    const widthScale = d3.scaleLinear()
                        .domain(weightExtent as unknown as [number, number])
                        .range([1, 10]);

                    const opacityScale = d3.scaleLinear()
                        .domain(weightExtent as unknown as [number, number])
                        .range([0.1, 1]);
                    link
                        .attr("x1", (d: any) => d.source.x)
                        .attr("y1", (d: any) => d.source.y)
                        .attr("x2", (d: any) => d.target.x)
                        .attr("y2", (d: any) => d.target.y)
                        .attr("transform", function (d: any) {
                            if (d.type === "double") {
                                const dx = d.target.x - d.source.x;
                                const dy = d.target.y - d.source.y;
                                const dr = Math.sqrt(dx * dx + dy * dy);
                                const offsetX = 5 * (dy / dr);
                                const offsetY = 5 * (-dx / dr);
                                return `translate(${offsetX}, ${offsetY})`;
                            }
                            return null;
                        })
                        .style("stroke", function (d: any) {
                            return d.type === "aromatic" ? "purple" : "#aaa";
                        });

                    node
                        .attr("cx", (d: any) => d.x)
                        .attr("cy", (d: any) => d.y);



                }
                updatePositions();
                function updatePositions() {
                    link
                        .attr("x1", (d: any) => d.source.x)
                        .attr("y1", (d: any) => d.source.y)
                        .attr("x2", (d: any) => d.target.x)
                        .attr("y2", (d: any) => d.target.y)
                        .attr("transform", function (d: any) {
                            if (d.type === "double") {
                                const dx = d.target.x - d.source.x;
                                const dy = d.target.y - d.source.y;
                                const dr = Math.sqrt(dx * dx + dy * dy);
                                const offsetX = 5 * (dy / dr);
                                const offsetY = 5 * (-dx / dr);
                                return `translate(${offsetX}, ${offsetY})`;
                            }
                            return null;
                        })
                        .style("stroke", function (d: any) {
                            return d.type === "aromatic" ? "purple" : "#aaa";
                        });
                    node.attr("cx", (d: any) => d.x)
                        .attr("cy", (d: any) => d.y);




                    let value: number[] = [];
                    if (intmData != null) {
                        if (i === 1) {
                            value = intmData.conv1;
                        }
                        if (i === 2) {
                            value = intmData.conv2;
                        }
                        if (i === 3) {
                            value = intmData.conv3;
                        }
                        if (i === 4) {
                            value = intmData.pooling;
                        }
                        if (i === 5) {
                            let final: any = intmData.final;
                            value = softmax(final);

                        }
                    }
                    console.log("Value", i, value)
                    let feature_num: number = 64
                    if (sandBoxMode) {
                      feature_num =16
                    }
             
                    data.nodes.forEach((node: any) => {
                        node.graphIndex = i;
                        if (value != null && i <= 4 && value instanceof Float32Array) {
                            node.features = value.subarray(
                                feature_num * node.id,
                                feature_num * (node.id + 1)
                            );
                        }


                        if (value != null && i >= 5) {
                            node.features = value;
                        }
                        allNodes.push(node);
                    });



                    let maxXDistance = 0;
                    let maxYDistance = 0;
                    let limitedNodes = data.nodes.slice(0, 17);

                    limitedNodes.forEach((node1: any) => {
                        limitedNodes.forEach((node2: any) => {
                            if (node1 !== node2) {
                                const xDistance = Math.abs(node1.x - node2.x);
                                const yDistance = Math.abs(node1.y - node2.y);
                                if (xDistance > maxXDistance) {
                                    maxXDistance = xDistance;
                                }

                                if (yDistance > maxYDistance) {
                                    maxYDistance = yDistance;
                                }
                            }
                        });
                    });

                    let graphWidth = maxXDistance + 20
                    let graphHeight = maxYDistance + 20;

                    let point1 = { x: 3.0 * offset, y: height / 8 };
                    let point2 = { x: 2.9 * offset, y: height / 20 };
                    let point3 = { x: 2.9 * offset, y: height / 1.7 };
                    let point4 = { x: 3.0 * offset, y: height / 1.5 };

                    let x_dist = Math.abs(point1.x - point2.x);
                    let y_dist = Math.abs(point1.y - point4.y)
                    let centerX = (point1.x + point3.x) / 2;
                    let centerY = (point1.y + point3.y) / 2;

                    const tolerance = 140;

                    let scaleX = ((graphWidth + tolerance + 20) / x_dist);
                    let scaleY = ((graphHeight + tolerance + 20) / y_dist);
                    let transform = `translate(${centerX}, ${centerY}) scale(${scaleX}, ${scaleY}) translate(${-centerX}, ${-centerY})`;

                    if (graphWidth + tolerance < x_dist && graphHeight + tolerance < y_dist) {
                        transform = `scale(1, 1)`;
                    }
                    const text_x = point1.x
                    let text_y = point4.y;
                    if (i >= 4) {
                        point1.y -= 130;
                        point2.y -= 130;
                        point3.y += 70;
                        point4.y += 70;
                        point1.x += 15;
                        point4.x += 15;
                        point2.x -= 15;
                        point3.x -= 15;

                    }
                    const parallelogram = g1
                        .append("polygon")
                        .attr("points", `${point1.x},${point1.y} ${point2.x},${point2.y} ${point3.x},${point3.y} ${point4.x},${point4.y}`)
                        .attr("stroke", "black")
                        .attr("fill", "none")
                        .attr('transform', transform);
                    let featureCoords = [{ x: 0, y: 0 }, { x: 0, y: 0 }];
                    if (i == 4) {
                        featureCoords[0] = { x: centerX, y: centerY };
                    }
                    if (i == 5) {
                        featureCoords[1] = { x: centerX, y: centerY };
                    }

                    if (graph_path === "./json_data/graphs/input_graph0.json") {
                        text_y += 80;
                    }


                    let text = " ";
                    if (i == 0) {
                        text = "Input"
                    }
                    if (i <= 3 && i != 0) {
                        text = `GCNConv${i}`
                    }
                    if (i === 4) {
                        text = "Pooling"
                    }
                    if (i === 5) {
                        text = "Prediction Result"
                    }
                    const textElement = g1.append("text")
                        .attr("class", "layer-label")
                        .attr("x", text_x)
                        .attr("y", text_y)
                        .attr("text-anchor", "middle")
                        .attr("dominant-baseline", "central")
                        .attr("fill", "black")
                        .attr("font-size", "15px")
                        .text(text)
                        .attr("font-weight", "normal")
                        .attr('opacity', 0.5);
                    const absMax = findAbsMax(value);


                    // let cst: any = null;
                    // const cstOffset = 25;
                    // if (i == 0) {
                    //     //cst = buildBinaryLegend(myColor, 0, 1, text + " Color Scheme", text_x, text_y + cstOffset, g1)
                        
                    // }
                    // else if (i == 5) {
                    //     cst = buildBinaryLegend(myColor, value[0], value[1], text + " Color Scheme", text_x, text_y + cstOffset, g1)
                    // }
                    // else {
                    //     cst = buildLegend(myColor, absMax, text + " Color Scheme", text_x - 50, text_y + cstOffset, g1);
                    // }

                    // colorSchemes.push(cst);


                    // doesn't show the text, need to be fixed 
                    if (i === graphs.length - 1) { // 6 layers in total, call the connect when reaching the last layer of convolutional layer.
                        connectCrossGraphNodes( // in this function the connection of last two layers will be drwan
                            allNodes,
                            svg,
                            graphs,
                            offset,
                            [],
                            0,
                            0,
                            0,
                            0
                        );

                        // since in the featureVisualizer each node has its own svgElement, circles here are made 
                        svg.selectAll("circle")
                            .attr("opacity", 0);
            
          

                        if (intmData) {
                            let firstLayerMoveOffset = 700
                            let moveOffset = 900
                            let fcLayerMoveOffset = 600
                            let rectWidth = 15
                            let firstLayerRectHeight = 10
                            let rectHeight = 3
                            let outputLayerRectHeight = 20
                            if (sandBoxMode) {
                                rectHeight = 12
                            }


                            featureVisualizer(svg, allNodes, offset, height, graphs, firstLayerMoveOffset, moveOffset, fcLayerMoveOffset, rectWidth, firstLayerRectHeight, rectHeight, outputLayerRectHeight, 0, innerComputationMode, sandBoxMode); // pass in the finaldata because nodeByIndex doesn't include nodes from the last layer
                            //function featureVisualizer(svg: any, allNodes: any[], offset: number, height: number, graphs: any[], moveOffset: number, fcLayerMoveOffset: number, rectWidth: number, firstLayerRectHeight: number, rectHeight: number, outputLayerRectHeight: number)
                        }
       

                    }

                }
                setIsLoading(false);
            }

            )
        };

        const handleSimulationComplete = (completedVisualizationId: number) => {
            if (completedVisualizationId === currentVisualizationId.current) {
                setSimulation(true);
            }
        };

        const runVisualization = async () => {
            if ((intmData == null || changed) && !predicted) {
                console.log("Running visualization")
                await visualizeGraph(graph_path, () => {
                    handleSimulationComplete(visualizationId);
                    onLoadComplete();
                    nodePositions=nodePositions
                },
                    true, 0);
            } else {
                console.log("Running visualization 2")
                await visualizeGNN(4);
                handleSimulationComplete(visualizationId);
                onLoadComplete();
            }
        };


        const visualizeGNN = async (num: number) => {
            console.log("Running visualization 4")
        
            try {
                    setIsLoading(true);
                    let graphsData
                    if (!sandBoxMode) {
                        console.log("raw data", graph_path)
                        const processedData = await data_prep(graph_path);
                        graphsData = await prep_graphs(num, processedData);
            
                    } else {
                        console.log("raw data", simGraphData)
                        const processedData = await data_prep(simGraphData);
                        graphsData = await prep_graphs(num, processedData);
         
                    }
                    // Initialize and run D3 visualization with processe  d data
                    await init(graphsData);
                
            } catch (error) {
                console.error("Error in visualizeGNN:", error);
            } finally {
                setIsLoading(false);
            }
        };

        runVisualization();




    }, [graph_path, intmData]);
    const updateTextElements = (svg: SVGSVGElement, selectedButtons: boolean[]) => {
        d3.select(svg)
            .selectAll(".layerVis")
            .each(function (d, i) {
                const g1 = d3.select(this);

                g1.selectAll("text.layer-label")
                    .transition()
                    .duration(140)
                    .style("opacity", () => {
                        if ((i <= 1 && selectedButtons[i]) ||
                            (i === 2 && selectedButtons[2]) ||
                            (i === 4 && selectedButtons[4]) ||
                            (i === 3 && selectedButtons[3]) ||
                            (i === 5 && selectedButtons[5])) {
                            return 1;
                        }
                        return 0.5;
                    })
                    .attr("font-size", () => {
                        if ((i <= 1 && selectedButtons[i]) ||
                            (i === 2 && selectedButtons[2]) ||
                            (i === 3 && selectedButtons[3]) ||
                            (i === 4 && selectedButtons[4]) ||
                            (i === 5 && selectedButtons[5])) {
                            return "18px";
                        }
                        return "15px";
                    });
            });
    };
    useEffect(() => {
        if (svgRef.current && !isLoading) {
            updateTextElements(svgRef.current, selectedButtons);
        }

    }, [selectedButtons, isLoading]);

    return (
        <div
            id="my_dataviz"
            ref={containerRef}
            style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "start",
                height: "auto",
                overflow: "auto", // this enables scrollbars if content overflows
                overflowX: "scroll",
            }}
        ></div>
    );
};

export default GraphVisualizer;

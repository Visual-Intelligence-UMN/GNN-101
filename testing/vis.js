// Import D3 version 7 and custom utils
import * as d3 from "https://cdn.skypack.dev/d3@7";
import { load_json, data_prep, prep_graphs, process } from "./utils.js";

// Set the dimensions and margins of the graph
const margin = { top: 10, right: 30, bottom: 30, left: 40 };
const width = 3000 - margin.left - margin.right;
const height = 1000 - margin.top - margin.bottom;

//init the graphs visualization
async function init(graphs) {
    // Append the SVG object to the body of the page
    let allNodes = [];

    const svg = d3
        .select("#my_dataviz")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    graphs.forEach((data, i) => {
        const xOffset = i * 500;
        const g1 = svg
            .append("g")
            .attr("transform", `translate(${xOffset},${margin.top})`);

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
            .attr("r", 10)
            .style("fill", "#69b3a2");

        // Define the simulation

        const simulation = d3
            .forceSimulation(data.nodes)
            .force(
                "link",
                d3
                    .forceLink(data.links)
                    .id((d) => d.id)
                    .distance(10)
            )
            .force("charge", d3.forceManyBody().strength(-400))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .on("tick", ticked)
            .on("end", ended);

        // Update positions each tick
        function ticked() {
            link.attr("x1", (d) => d.source.x)
                .attr("y1", (d) => d.source.y)
                .attr("x2", (d) => d.target.x)
                .attr("y2", (d) => d.target.y);

            node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
        }

        function ended() {
            data.nodes.forEach((node) => {
                node.graphIndex = i;
                allNodes.push(node);
            });
            if (i === graphs.length - 1) {
                connectCrossGraphNodes(allNodes, svg, graphs);
            }
        }
    });
}

//cross connect graphs in the visualization system
function connectCrossGraphNodes(nodes, svg, graphs) {
    const nodesById = d3.group(nodes, (d) => d.id);

    nodesById.forEach((nodes, id) => {
        nodes.forEach((node, i) => {
            if (i < nodes.length - 1) {
                const nextNode = nodes[i + 1];
                const xOffset1 = node.graphIndex * 500;
                const xOffset2 = nextNode.graphIndex * 500;






                svg.append("line")
                    .attr("x1", nodes[i].x + xOffset1)
                    .attr("y1", nodes[i].y + 10)
                    .attr("x2", nextNode.x + xOffset2)
                    .attr("y2", nextNode.y + 10)
                    .style("stroke", "red")
                    .style("opacity", 0.2)
                    .style("stroke-width", 2);

                const nextGraphLinks = graphs[nextNode.graphIndex].links;
                nextGraphLinks.forEach((link) => {
                    if (
                        link.source.id === nextNode.id ||
                        link.target.id === nextNode.id
                    ) {
                        const neighborNode =
                            link.source.id === nextNode.id
                                ? link.target
                                : link.source;
                        svg.append("line")
                            .attr("x1", node.x + node.graphIndex * 500)
                            .attr("y1", node.y + 10)
                            .attr(
                                "x2",
                                neighborNode.x + neighborNode.graphIndex * 500
                            )
                            .attr("y2", neighborNode.y + 10)
                            .style("stroke", "blue")
                            .style("opacity", 0.2)
                            .style("stroke-width", 1);
                    }
                });
            }
        });
    });
}

// Run the data processing and D3 initialization
async function processDataAndRunD3() {
    try {
        // Process data
        var processedData = await data_prep("./input_graph.json");
        var graphs_data = await prep_graphs(3, processedData);

        // Initialize and run D3 visualization with processed data
        await init(graphs_data);
    } catch (error) {
        console.error("Error in processDataAndRunD3:", error);
    }
}

// Start the process
processDataAndRunD3();

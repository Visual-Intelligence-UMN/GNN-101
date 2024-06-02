import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import {
    printAxisTextCoordinates,
    splitIntoMatrices,
    get_features_origin,
    graph_to_matrix,
    prepMatrices,
    load_json,
    matrix_to_hmap,
    get_axis_gdata,
} from "../utils/utils";
import {
    crossConnectionMatrices,
    get_cood_locations,
    removeEffect,
    mouseover,
    mousemove,
    mouseleave,
    HeatmapData,
    mouseoverEvent,
    visualizeFeatures,
} from "@/utils/matUtils";
import { roundToTwo, visualizeMatrix } from "./WebUtils";

interface MatricesVisualizerProps {
    graph_path: string;
    intmData: any;
    changed: boolean;
}

const MatricesVisualizer: React.FC<MatricesVisualizerProps> = ({
    graph_path,
    intmData,
    changed,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    //const lastIntmData = useRef(intmData);

    // This is really messy but init will stay at the top to remain in the scope of all functions

    console.log("updated", intmData);
    if (intmData != null) {
        console.log("From Visualizer:", intmData);
    }

    useEffect(() => {
        const init = async (graph: any, features: any[][]) => {
            const offsetMat = 100;

            let conv1: number[][] = [],
                conv2: number[][] = [],
                conv3: number[][] = [],
                pooling: number[] = [],
                final = null;

            console.log("intmData", intmData);
            if (intmData != null) {
                console.log("From Visualizer:", intmData);
                conv1 = splitIntoMatrices(intmData.conv1);
                conv2 = splitIntoMatrices(intmData.conv2);
                conv3 = splitIntoMatrices(intmData.conv3);
                pooling = intmData.pooling;
                final = intmData.final;

                console.log("pooling", intmData.pooling);

                console.log(
                    "conv1",
                    conv1,
                    "conv2",
                    conv2,
                    "conv3",
                    conv3,
                    "final",
                    final
                );
            }

            console.log("from mat vis pooling", pooling);

            console.log("path ", graph_path);
            let allNodes: any[] = [];
            const gLen = graph.length;
            console.log("gLen", gLen);
            const gridSize = 300;
            const margin = { top: 10, right: 80, bottom: 30, left: 80 };
            const width = 20 * gLen + 50 + 6 * 102 + 1200;
            const height = (gridSize + margin.top + margin.bottom) * 2 - 200;

            let locations: number[][] = [];

            //prepare for path matrix
            let pathMatrix = Array.from({ length: graph.length }, () => []);
            console.log("pathMat", pathMatrix);

            // Append the SVG object to the body of the page
            console.log("GRAPH", graph);
            d3.select("#matvis").selectAll("svg").remove();
            const svg = d3
                .select("#matvis")
                .append("svg")
                .attr("class", "mats")
                .attr("width", width)
                .attr("height", height);

            const xOffset = 0 * gridSize + 50;
            const g = svg
                .append("g")
                .attr(
                    "transform",
                    `translate(${xOffset + 0 * offsetMat},${margin.top})`
                );
            //do the real thing: visualize the matrices
            // set the dimensions and margins of the graph
            // Labels of row and columns
            var myGroups = get_axis_gdata(graph);
            var myVars = get_axis_gdata(graph);

            // Build X scales and axis:
            var x = d3
                .scaleBand()
                .range([0, gridSize])
                .domain(myGroups)
                .padding(0.01);
            g.append("g")
                .attr("class", "x-axis")
                .attr("transform", `translate(0,${gridSize})`)
                .call(d3.axisBottom(x));

            // Build Y scales and axis:
            var y = d3
                .scaleBand()
                .range([0, gridSize])
                .domain(myVars)
                .padding(0.01);
            g.append("g").attr("class", "y-axis").call(d3.axisLeft(y));

            if (0 == 0) {
                d3.selectAll<SVGTextElement, any>(".x-axis text").classed(
                    "first",
                    true
                );
                d3.selectAll<SVGTextElement, any>(".y-axis text").classed(
                    "first",
                    true
                );
            }

            printAxisTextCoordinates();

            var myColor = d3
                .scaleLinear<string>()
                .domain([-0.25, 0, 0.25])
                .range(["orange", "white", "#69b3a2"]);

            const data = matrix_to_hmap(graph);
            console.log("accepted data:", data);

            //legend
            let dummies = [];
            for (let i = -1; i <= 1; i += 0.05) {
                dummies.push(i);
            }
            const g0 = d3
                .select("#matvis")
                .append("svg")
                .attr("class", "legend")
                .attr("width", 500)
                .attr("height", 100);

            console.log("Dummies", dummies);

            g0.selectAll(".rect")
                .data(dummies)
                .enter()
                .append("rect")
                .attr("width", 10)
                .attr("height", 10)
                .attr("x", (d: number, i: number) => {
                    return i * 10;
                })
                .attr("y", 0)
                .style("fill", (d: number) => myColor(d))
                .style("stroke-width", 1)
                .style("stroke", "grey")
                .style("opacity", 0.8)
                .raise();

            const offsetText = 10;
            const format = d3.format(".2f");
            

            g0.selectAll(".label")
                .data(dummies)
                .enter()
                .append("text")
                .attr("x", (d, i) => i * offsetText - 20) 
                .attr("y", 5) 
                .attr("text-anchor", "end") 
                .attr("transform", (d, i) => `rotate(-90, ${i * offsetText}, 0)`)
                .style("font-size", "5px")
                .text((d) => format(d));

            g0
                .append("text")
                .text("Color Scheme")
                .attr("x", 200)
                .attr("y", 50)
                .attr("text-anchor", "middle")
                .attr("font-size", 10);

            g.selectAll("rect")
                .data(data, (d: any) => d.group + ":" + d.variable)
                .enter()
                .append("rect")
                .attr("x", (d: HeatmapData) => x(d.group)!)
                .attr("y", (d: HeatmapData) => y(d.variable)!)
                .attr("width", x.bandwidth())
                .attr("height", y.bandwidth())
                .style("fill", (d: HeatmapData) => myColor(d.value / 250))
                .style("stroke-width", 1)
                .style("stroke", "grey")
                .style("opacity", 0.8)
                .on("mouseover", mouseover)
                .on("mousemove", mousemove)
                .on("mouseleave", mouseleave);

            console.log("x-bandwidth", x.bandwidth());
            console.log("y-bandwidth", y.bandwidth());

            g.selectAll(".x-axis text")
                .on("mouseover", function (event) {
                    console.log("EVENT", event);
                    const element = event.target as SVGGraphicsElement;
                    console.log("ELEMENT", element);
                    //   mouseoverEvent(element, this, i, conv1, conv2, conv3, final, features, myColor, 5, gridNum, sqSize, true);
                })
                .on("mouseout", function (event) {
                    const element = event.target as SVGGraphicsElement;
                    removeEffect(element);
                    d3.select("#tmp").remove();
                    d3.select(".ihmp").remove();
                });

            g.selectAll(".y-axis text")
                .on("mouseover", function (event, d) {
                    const element = event.target as SVGGraphicsElement;
                    console.log("ELEMENT", element);

                    //  mouseoverEvent(element, this, i, conv1, conv2, conv3, final, features, myColor, -5, gridNum, sqSize, false);
                    //interactWithHeatmap(element, x.bandwidth(), graphs[0].length);
                })
                .on("mouseout", function (event, d) {
                    const element = event.target as SVGGraphicsElement;
                    removeEffect(element);
                });
            //getting the coordinates
            locations = get_cood_locations(data, locations);
            //crossConnectionMatrices(graphs, locations, offsetMat, pathMatrix);
            visualizeFeatures(
                locations,
                features,
                myColor,
                conv1,
                conv2,
                conv3,
                pooling,
                final,
                graph
            );
        };

        //VIsualization Pipeline
        const visualizeGNN = async (num: number) => {
            try {
                setIsLoading(true);
                // Process data
                console.log("path matvis", graph_path);
                const data = await load_json(graph_path);
                console.log("data matvis", data);

                //accept the features from original json file
                const features = await get_features_origin(data);
                console.log("o features", features);

                const processedData = await graph_to_matrix(data);
                console.log("pData matvis", processedData);
                const graphsData = await prepMatrices(num, processedData);
                console.log("gData", graphsData);
                // Initialize and run D3 visualization with processe  d data
                await init(graphsData[0], features);
            } catch (error) {
                console.error("Error in visualizeGNN:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (intmData == null || changed) {
            visualizeMatrix(graph_path);
        } else {
            visualizeGNN(4);
        }
        console.log("i fire once");
    }, [graph_path, intmData, changed]);

    return (
        <div
            id="matvis"
            ref={containerRef}
            style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "start",
                height: "auto",
                overflow: "auto", // this enables scrollbars if content overflows
                overflowX: "auto",
            }}
        ></div>
    );
};

export default MatricesVisualizer;

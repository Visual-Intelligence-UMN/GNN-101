import * as d3 from "d3";
import {
    printAxisTextCoordinates,
    splitIntoMatrices,
    get_features_origin,
    graph_to_matrix,
    load_json,
    matrix_to_hmap,
    get_axis_gdata
} from "../utils/utils";
import {
    visualizeGraphClassifierFeatures
} from "@/utils/matUtils";
import {
    get_cood_locations,
    HeatmapData,
    drawNodeAttributes,
    getNodeAttributes
} from "../utils/matHelperUtils";

//find absolute max value in an 1d array
function findAbsMax(arr: number[]) {
    let max: number = Math.abs(Math.max(...arr));
    let min: number = Math.abs(Math.min(...arr));
    if (min > max) return min;
    return max;
}

async function initGraphClassifier(graph: any, features: any[][], nodeAttrs: string[], intmData:any, graph_path:string)  {
    let colorSchemeTable: any = null;
    //a data structure to record the link relationship
    //fill up the linkMap
    let adjList: number[][] = Array.from({ length: graph.length }, () => []);
    for (let i = 0; i < graph.length; i++) {
        //push itself to the linkMap
        adjList[i].push(i);
        for (let j = 0; j < graph[0].length; j++) {
            if (graph[i][j] == 1) {
                //push its neighbors to linkMap
                adjList[i].push(j);
            }
        }
    }

    const offsetMat = 100;

    let conv1: number[][] = [],
        conv2: number[][] = [],
        conv3: number[][] = [],
        pooling: number[] = [],
        final = null;

    console.log("intmData", intmData);
    if (intmData != null) {
        //max abs find
        let conv1Max = findAbsMax(intmData.conv1);
        console.log("conv1Max", conv1Max);
        let conv2Max = findAbsMax(intmData.conv2);
        console.log("conv2Max", conv2Max);
        let conv3Max = findAbsMax(intmData.conv3);
        console.log("conv3Max", conv3Max);
        let poolingMax = findAbsMax(intmData.pooling);
        console.log("poolingMax", poolingMax);
        let dropMax = findAbsMax(intmData.dropout);
        console.log("dropMax", dropMax);
        let finalMax = findAbsMax(intmData.final);
        console.log("finalMax", finalMax);

        colorSchemeTable = {
            conv1: conv1Max,
            conv2: conv2Max,
            conv3: conv3Max,
            pooling: poolingMax,
            dropout: dropMax,
            final: finalMax,
        };

        console.log("From Visualizer:", intmData);
        conv1 = splitIntoMatrices(intmData.conv1);
        conv2 = splitIntoMatrices(intmData.conv2);
        conv3 = splitIntoMatrices(intmData.conv3);
        pooling = intmData.pooling;
        final = intmData.final;
    }

    console.log("from mat vis pooling", pooling);

    console.log("path ", graph_path);
    let allNodes: any[] = [];
    const gLen = graph.length;
    console.log("gLen", gLen);
    const gridSize = 400;
    const margin = { top: 10, right: 80, bottom: 30, left: 80 };
    const width = 20 * gLen + 50 + 6 * 102 + 1200 * 2;
    const height = (gridSize + margin.top + margin.bottom) * 2;

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
    var x = d3.scaleBand().range([0, gridSize]).domain(myGroups).padding(0.01);
    g.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${gridSize + 50})`)
        .call(d3.axisBottom(x));

    // Build Y scales and axis:
    var y = d3.scaleBand().range([0, gridSize]).domain(myVars).padding(0.01);
    g.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(y))
        .attr("transform", `translate(0,50)`);

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
    g.selectAll("rect")
        .data(data, (d: any) => d.group + ":" + d.variable)
        .enter()
        .append("rect")
        .attr("x", (d: HeatmapData) => x(d.group)!)
        .attr("y", (d: HeatmapData) => y(d.variable)! + 50)
        .attr("width", x.bandwidth())
        .attr("height", y.bandwidth())
        .style("fill", (d: HeatmapData) => myColor(d.value / 250))
        .style("stroke-width", 1)
        .style("stroke", "grey")
        .style("opacity", 0.8);

    locations = get_cood_locations(data, locations);
    //crossConnectionMatrices(graphs, locations, offsetMat, pathMatrix);
    visualizeGraphClassifierFeatures(
        locations,
        features,
        myColor,
        conv1,
        conv2,
        conv3,
        pooling,
        final,
        graph,
        adjList,
        colorSchemeTable
    );
    drawNodeAttributes(nodeAttrs, graph, 50);
};

//VIsualization Pipeline
export async function visualizeGraphClassifier(setIsLoading:any, graph_path:string, intmData:any) {
    try {
        setIsLoading(true);
        // Process data
        console.log("path matvis", graph_path);
        const data = await load_json(graph_path);
        console.log("data matvis", data);

        //node attributes extraction
        console.log("data.x", data.x);
        const nodeAttrs = getNodeAttributes(data);

        console.log("node attr array", nodeAttrs);

        //accept the features from original json file
        const features = await get_features_origin(data);
        console.log("o features", features);

        const processedData = await graph_to_matrix(data);
        console.log("pData matvis", processedData);
        // Initialize and run D3 visualization with processe  d data
        await initGraphClassifier(processedData, features, nodeAttrs, intmData, graph_path);
    } catch (error) {
        console.error("Error in visualizeGNN:", error);
    } finally {
        setIsLoading(false);
    }
};

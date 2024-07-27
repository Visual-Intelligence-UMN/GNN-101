import * as d3 from "d3";
import {
    printAxisTextCoordinates,
    splitIntoMatrices,
    get_features_origin,
    graph_to_matrix,
    load_json,
    matrix_to_hmap,
    get_axis_gdata,
    graphToAdjList,
    drawPoints
} from "../utils/utils";
import {
    visualizeGraphClassifierFeatures,
    visualizeNodeClassifierFeatures
} from "@/utils/matUtils";
import {
    get_cood_locations,
    HeatmapData,
    drawNodeAttributes,
    getNodeAttributes
} from "../utils/matHelperUtils";
import { visualizeMatrixBody } from "../components/WebUtils";

import { myColor } from "../utils/utils";

//find absolute max value in an 1d array
export function findAbsMax(arr: number[]) {
    let max: number = Math.abs(Math.max(...arr));
    let min: number = Math.abs(Math.min(...arr));
    if (min > max) return min;
    return max;
}


//----------------------function for visualizing node classifier----------------------------
async function initNodeClassifier(graph: any, features: any[][], intmData:any, graph_path:string, trainingNodes: number[])  {
    console.log("start initNodeC");
    let colorSchemeTable: any = null;
    //a data structure to record the link relationship
    //fill up the linkMap
    let adjList = graphToAdjList(graph);

    let conv1: number[][] = [],
        conv2: number[][] = [],
        conv3: number[][] = [],
        result: number[][] = [],
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
        let finalMax = findAbsMax(intmData.final);
        console.log("finalMax", finalMax);
        let resultMax = findAbsMax(intmData.result.map((arr:any) => Array.from(arr)).flat());
        console.log("resultMax", resultMax, intmData.result.flat());

        colorSchemeTable = {
            conv1: conv1Max,
            conv2: conv2Max,
            conv3: conv3Max,
            final: finalMax,
            result: resultMax
        };

        console.log("From Visualizer:", intmData);
        conv1 = splitIntoMatrices(intmData.conv1, 4);
        conv2 = splitIntoMatrices(intmData.conv2, 4);
        conv3 = splitIntoMatrices(intmData.conv3, 2);
        result = intmData.result;
        final = splitIntoMatrices(intmData.final, 4);
    }

    console.log("path ", graph_path);

    const gLen = graph.length;
    console.log("gLen", gLen);
    const gridSize = 800;
    const margin = { top: 10, right: 80, bottom: 30, left: 80 };
    const width = 20 * gLen + 50 + 6 * 102 + 1200 * 2;
    const height = (gridSize + margin.top + margin.bottom) * 2;

    let locations: number[][] = [];
    d3.select("#matvis").selectAll("*").remove();
    visualizeMatrixBody(gridSize, graph, width, height, margin);

    // var myColor = d3
    // .scaleLinear<string>()
    // .domain([-3, -1, -0.1, 0, 0.1, 1, 3])
    // .range(["#304E30","#3DBA41","#B7EFB8", "white", "#BBB7EF", "#6E09CD","#4B0092"]);

    const data = matrix_to_hmap(graph);

    locations = get_cood_locations(data, locations);
    //crossConnectionMatrices(graphs, locations, offsetMat, pathMatrix);
    const featuresManager = visualizeNodeClassifierFeatures(
        locations,
        features,
        myColor,
        conv1,
        conv2,
        conv3,
        result,
        final,
        graph,
        adjList,
        colorSchemeTable,
        trainingNodes
    );
    // drawNodeAttributes(nodeAttrs, graph, 50);

    // const intervalID = featuresManager.getIntervalID();
    // console.log("get interval ID init G", intervalID);
    // clearInterval(intervalID);

    console.log("initNode", intmData, data, locations, adjList);
    console.log("conv", conv1, conv2, conv3, final, result);
    console.log("initNode CST", colorSchemeTable);
    console.log("initNode features", features);

    //drawPoints(".mats", "red", locations);
};



//----------------------function for visualizing graph classifier----------------------------
async function initGraphClassifier(graph: any, features: any[][], nodeAttrs: string[], intmData:any, graph_path:string)  {
    let colorSchemeTable: any = null;
    //a data structure to record the link relationship
    //fill up the linkMap
    let adjList = graphToAdjList(graph);

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
    d3.select("#matvis").selectAll("*").remove();
    visualizeMatrixBody(gridSize, graph, width, height, margin);

    // var myColor = d3
    // .scaleLinear<string>()
    // .domain([-3, -1, -0.1, 0, 0.1, 1, 3])
    // .range(["#304E30","#3DBA41","#B7EFB8", "white", "#BBB7EF", "#6E09CD","#4B0092"]);

    const data = matrix_to_hmap(graph);

    locations = get_cood_locations(data, locations);
    //crossConnectionMatrices(graphs, locations, offsetMat, pathMatrix);
    const featuresManager = visualizeGraphClassifierFeatures(
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
    drawNodeAttributes(nodeAttrs, graph, 150);

    const intervalID = featuresManager.getIntervalID();
    console.log("get interval ID init G", intervalID);
    clearInterval(intervalID);
};

//Visualization Pipeline for Graph Classifier
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

//Visualization Pipeline for Node Classifier
export async function visualizeNodeClassifier(setIsLoading:any, graph_path:string, intmData:any) {
    try {
        setIsLoading(true);
        // Process data
        console.log("path matvis", graph_path);
        const data = await load_json(graph_path);
        console.log("data matvis", data);

        //training nodes
        const trainingNodes = data.train_nodes;
        console.log("train nodes", trainingNodes)

        //accept the features from original json file
        const features = await get_features_origin(data);
        console.log("o features", features);

        const processedData = await graph_to_matrix(data);
        console.log("pData matvis", processedData);
        // Initialize and run D3 visualization with processe  d data
        await initNodeClassifier(processedData, features, intmData, graph_path, trainingNodes);
    } catch (error) {
        console.error("Error in visualizeGNN:", error);
    } finally {
        setIsLoading(false);
    }
};



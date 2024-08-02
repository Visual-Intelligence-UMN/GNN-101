import * as d3 from "d3";
import {
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
import { convertToAdjacencyMatrix, getNodeSet } from "./linkPredictionUtils";
import { extractSubgraph, removeDuplicatesFromSubarrays } from "./graphDataUtils";
import { decode } from "punycode";

//find absolute max value in an 1d array
export function findAbsMax(arr: number[]) {
    let max: number = Math.abs(Math.max(...arr));
    let min: number = Math.abs(Math.min(...arr));
    if (min > max) return min;
    return max;
}


//----------------------function for visualizing node classifier----------------------------
async function initNodeClassifier(graph: any, features: any[][], intmData:any, graph_path:string, trainingNodes: number[])  {

    let colorSchemeTable: any = null;
    //a data structure to record the link relationship
    //fill up the linkMap
    let adjList = graphToAdjList(graph);

    let conv1: number[][] = [],
        conv2: number[][] = [],
        conv3: number[][] = [],
        result: number[][] = [],
        final = null;


    if (intmData != null) {
        //max abs find
        let conv1Max = findAbsMax(intmData.conv1);

        let conv2Max = findAbsMax(intmData.conv2);

        let conv3Max = findAbsMax(intmData.conv3);

        let finalMax = findAbsMax(intmData.final);

        let resultMax = findAbsMax(intmData.result.map((arr:any) => Array.from(arr)).flat());


        colorSchemeTable = {
            conv1: conv1Max,
            conv2: conv2Max,
            conv3: conv3Max,
            final: finalMax,
            result: resultMax
        };


        conv1 = splitIntoMatrices(intmData.conv1, 4);
        conv2 = splitIntoMatrices(intmData.conv2, 4);
        conv3 = splitIntoMatrices(intmData.conv3, 2);
        result = intmData.result;
        final = splitIntoMatrices(intmData.final, 4);
    }



    const gLen = graph.length;

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

    // clearInterval(intervalID);






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


    if (intmData != null) {
        //max abs find
        let conv1Max = findAbsMax(intmData.conv1);

        let conv2Max = findAbsMax(intmData.conv2);

        let conv3Max = findAbsMax(intmData.conv3);

        let poolingMax = findAbsMax(intmData.pooling);

        let dropMax = findAbsMax(intmData.dropout);

        let finalMax = findAbsMax(intmData.final);


        colorSchemeTable = {
            conv1: conv1Max,
            conv2: conv2Max,
            conv3: conv3Max,
            pooling: poolingMax,
            dropout: dropMax,
            final: finalMax,
        };


        conv1 = splitIntoMatrices(intmData.conv1);
        conv2 = splitIntoMatrices(intmData.conv2);
        conv3 = splitIntoMatrices(intmData.conv3);
        pooling = intmData.pooling;
        final = intmData.final;
    }




    let allNodes: any[] = [];
    const gLen = graph.length;

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

    clearInterval(intervalID);
};

//Visualization Pipeline for Graph Classifier
export async function visualizeGraphClassifier(setIsLoading:any, graph_path:string, intmData:any) {
    try {
        setIsLoading(true);
        // Process data
        const data = await load_json(graph_path);
        //node attributes extraction
        const nodeAttrs = getNodeAttributes(data);
        //accept the features from original json file
        const features = await get_features_origin(data);
        const processedData = await graph_to_matrix(data);
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
        const data = await load_json(graph_path);
        //training nodes
        const trainingNodes = data.train_nodes;
        //accept the features from original json file
        const features = await get_features_origin(data);
        const processedData = await graph_to_matrix(data);
        // Initialize and run D3 visualization with processe  d data
        await initNodeClassifier(processedData, features, intmData, graph_path, trainingNodes);
    } catch (error) {
        console.error("Error in visualizeGNN:", error);
    } finally {
        setIsLoading(false);
    }
};

//Visualization Pipeline for Link Classifier
export async function visualizeLinkClassifier(setIsLoading:any, graph_path:string, intmData:any, hubNodeA:number, hubNodeB:number) {
    try {
        console.log("start visualizing...", graph_path, intmData, hubNodeA, hubNodeB);
        setIsLoading(true);
        // Process data
        const data = await load_json(graph_path);
        //training nodes
        //const trainingNodes = data.train_nodes;
        //accept the features from original json file
        const features = await get_features_origin(data);
        const graph = await graph_to_matrix(data);

        //get the nodes

        
        let nodesA:number[] = getNodeSet(graph, hubNodeA)[0];
        let nodesB:number[] = getNodeSet(graph, hubNodeB)[0];

        console.log("nodesA", nodesA);
        console.log("nodesB", nodesB);

        const mergedNodes = [...nodesA, ...nodesB];

        console.log("mergedNodes", mergedNodes);

        //compute the structure of the subgraph
        const subGraph = extractSubgraph(graph, mergedNodes);

        console.log("subGraph", subGraph);

        //get node attribute
        const keys = Object.keys(subGraph).map(Number);

        //transform the subgraph to adjacent matrix
        const subMatrix = convertToAdjacencyMatrix(subGraph);

        console.log("subMatrix", subMatrix);

        // Initialize and run D3 visualization with processe  d data
        await initLinkClassifier(subMatrix, features, intmData, graph_path, hubNodeA, hubNodeB, keys);
    } catch (error) {
        console.error("Error in visualizeGNN:", error);
    } finally {
        setIsLoading(false);
    }
};



//----------------------function for visualizing link classifier----------------------------
async function initLinkClassifier(
    graph: any, 
    features: any[][], 
    intmData:any, 
    graph_path:string,
    hubNodeA:number,
    hubNodeB:number,
    keys: number[]
)  {

    //process the origin data
    const oData = await load_json(graph_path);
    const LargeGraph = await graph_to_matrix(oData);

    let colorSchemeTable: any = null;
    //a data structure to record the link relationship
    //fill up the linkMap
    let adjList = graphToAdjList(graph);

    let conv1: number[][] = [],
        conv2: number[][] = [],
        prob_adj:number[][] = [];


    if (intmData != null) {
        //max abs find
        // let conv1Max = findAbsMax(intmData.conv1);

        // let conv2Max = findAbsMax(intmData.conv2);

        // let probAdjMax = findAbsMax(intmData.prob_adj);


        // colorSchemeTable = {
        //     conv1: conv1Max,
        //     conv2: conv2Max,
        //     probAdj: probAdjMax
        // };

        console.log("test len",intmData.prob_adj.length)
        conv1 = splitIntoMatrices(intmData.conv1, 64);
        conv2 = splitIntoMatrices(intmData.conv2, 64);
        prob_adj = splitIntoMatrices(intmData.prob_adj, Math.sqrt(intmData.prob_adj.length));
    }



    const gLen = graph.length;

    const gridSize = 600;
    const margin = { top: 10, right: 80, bottom: 30, left: 80 };
    const width = 20 * gLen + 50 + 6 * 102 + 1200 * 2;
    const height = (gridSize + margin.top + margin.bottom) * 2;

    let locations: number[][] = [];
    d3.select("#matvis").selectAll("*").remove();
    visualizeMatrixBody(gridSize, graph, width, height, margin);
    drawNodeAttributes(keys, graph, 150);

    const data = matrix_to_hmap(graph);

    locations = get_cood_locations(data, locations);

    //features fetching - select the right features to viaualize
    // get the set 
    console.log("graph", graph);
    const setA = getNodeSet(LargeGraph, hubNodeA);
    const setB = getNodeSet(LargeGraph, hubNodeB);

    //get the set of nodes
    const featuresIndicesLayerOne:number[] = removeDuplicatesFromSubarrays([[...setA[0], ...setB[0]]])[0];
    const featuresIndicesLayerTwo:number[] = removeDuplicatesFromSubarrays([[...setA[1], ...setB[1]]])[0];


    //indexing the node/intermediate features by set
    let featuresLayerOne = [];
    let featuresLayerTwo = [];
    for(let i = 0; i < featuresIndicesLayerOne.length; i++){
        featuresLayerOne.push({[featuresIndicesLayerOne[i]]:features[featuresIndicesLayerOne[i]]});
    }
    for(let i = 0; i < featuresIndicesLayerTwo.length; i++){
        featuresLayerTwo.push({[featuresIndicesLayerTwo[i]]:conv1[featuresIndicesLayerTwo[i]]});
    }

    //get the feature from decoding phase z @ z.t() where z is the matrix from the conv2
    let featuresLayerThree = [{[hubNodeA]:conv2[hubNodeA]}, {[hubNodeB]:conv2[hubNodeB]}];

    //get the final result from probability matrix
    let featuresLayerFour = 0//prob_adj[hubNodeA][hubNodeB];

    //summarize them as a table
    const featuresDataTable = [featuresLayerOne, featuresLayerTwo, featuresLayerThree, featuresLayerFour];
    console.log("featuresDataTable", featuresDataTable);
    // //crossConnectionMatrices(graphs, locations, offsetMat, pathMatrix);
    // const featuresManager = visualizeLinkClassifierFeatures(
    //     locations,
    //     features,
    //     myColor,
    //     conv1,
    //     conv2,
    //     conv3,
    //     result,
    //     final,
    //     graph,
    //     adjList,
    //     colorSchemeTable,
    //     trainingNodes
    // );
    

    // const intervalID = featuresManager.getIntervalID();

    // clearInterval(intervalID);
    // drawPoints(".mats", "red", locations);

   // console.log("finished visulizing link classifier", conv1, conv2, decode_mul, decode_sum, prob_adj, locations);
};

// Node 148: Sum 33 : Values (2, 7, 24)
// Node 407: Sum 32 : Values (2, 6, 24)
// Node 79: Sum 31 : Values (2, 7, 22)
// Node 116: Sum 28 : Values (3, 11, 14)
// Node 994: Sum 28 : Values (3, 11, 14)
// Node 632: Sum 27 : Values (2, 6, 19)
// Node 71: Sum 21 : Values (2, 5, 14)
// Node 110: Sum 21 : Values (2, 5, 14)
// Node 420: Sum 19 : Values (3, 8, 8)
// Node 772: Sum 19 : Values (2, 6, 11)
// Node 394: Sum 17 : Values (2, 6, 9)
// Node 109: Sum 16 : Values (2, 7, 7)
// Node 241: Sum 8 : Values (2, 5, 1)
// Node 471: Sum 8 : Values (2, 5, 1)
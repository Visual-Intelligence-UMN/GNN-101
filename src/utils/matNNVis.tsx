import * as d3 from "d3";
import {
    splitIntoMatrices,
    get_features_origin,
    graph_to_matrix,
    load_json,
    matrix_to_hmap,
    get_axis_gdata,
    graphToAdjList,
    drawPoints,
    get_cood_from_parent,
    splitAnyIntoMatrices
} from "../utils/utils";
import {
    visualizeGraphClassifierFeatures,
    visualizeLinkClassifierFeatures,
    visualizeNodeClassifierFeatures
} from "@/utils/matUtils";
import {
    get_cood_locations,
    HeatmapData,
    drawNodeAttributes,
    getNodeAttributes,
    loadSimulatedModelWeights,
    loadWeights,
    loadNodeWeights
} from "../utils/matHelperUtils";
import { visualizeMatrixBody } from "../components/WebUtils";

import { myColor } from "../utils/utils";
import { convertToAdjacencyMatrix, getNodeSet } from "./linkPredictionUtils";
import { extractSubgraph, removeDuplicatesFromSubarrays } from "./graphDataUtils";
import { decode } from "punycode";
import { prepSimulatedMatrixLayout } from "./matVisUtils";

//find absolute max value in an 1d array
export function findAbsMax(arr: number[]) {
    let max: number = Math.abs(Math.max(...arr));
    let min: number = Math.abs(Math.min(...arr));
    if (min > max) return min;
    return max;
}


//----------------------function for visualizing node classifier----------------------------
async function initNodeClassifier(
    graph: any, 
    features: any[][], 
    intmData:any, 
    graph_path:string, 
    trainingNodes: number[],
    dimensions: number[],
    sandBoxMode:boolean
)  {

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


        conv1 = splitIntoMatrices(intmData.conv1, dimensions[0]);
        conv2 = splitIntoMatrices(intmData.conv2, dimensions[1]);
        conv3 = splitIntoMatrices(intmData.conv3, dimensions[2]);
        result = intmData.result;
        final = splitIntoMatrices(intmData.final, dimensions[3]);

        console.log("intm data after check - node", conv1, conv2, conv3, result, final, dimensions);
    }



    const gLen = graph.length;

    let gridSize = 600;
    let margin = { top: 10, right: 80, bottom: 30, left: 80 };
    let width = 20 * gLen + 50 + 6 * 102 + 1200 * 2;
    let height = (gridSize + margin.top + margin.bottom) * 2;
    if(sandBoxMode){
        const layoutParameters = prepSimulatedMatrixLayout(graph);
        ({ gridSize, margin, width, height } = layoutParameters);
    }

    console.log("matrix layout", gridSize, margin, width, height, sandBoxMode);

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
        trainingNodes,
        sandBoxMode
    );
    // drawNodeAttributes(nodeAttrs, graph, 50);

    // const intervalID = featuresManager.getIntervalID();

    // clearInterval(intervalID);






    //drawPoints(".mats", "red", locations);
};



//----------------------function for visualizing graph classifier----------------------------
async function initGraphClassifier(
    graph: any, 
    features: any[][], 
    nodeAttrs: string[], 
    intmData:any, 
    graph_path:string,
    dim: number,
    sandBoxMode:boolean
)  {
    console.log("check intmdata", intmData);
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

        console.log("intm data before check", intmData.conv1, intmData.conv2, intmData.conv3, intmData.pooling, intmData.final, dim);


        conv1 = splitIntoMatrices(intmData.conv1, dim);
        conv2 = splitIntoMatrices(intmData.conv2, dim);
        conv3 = splitIntoMatrices(intmData.conv3, dim);
        pooling = intmData.pooling;
        final = intmData.final;

        console.log("intm data after check", conv1, conv2, conv3, pooling, final);
    }




    let allNodes: any[] = [];
    const layoutParameters = prepSimulatedMatrixLayout(graph);
    const { gridSize, margin, width, height } = layoutParameters;

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
        colorSchemeTable,
        sandBoxMode
    );
    drawNodeAttributes(nodeAttrs, graph, 150);
    

    const intervalID = featuresManager.getIntervalID();

    clearInterval(intervalID);
};

//Visualization Pipeline for Graph Classifier
export async function visualizeGraphClassifier(
    setIsLoading:any, 
    graph_path:string, 
    intmData:any,
    simGraphData:any,
    sandBoxMode:boolean
) {
    try {
        console.log("matvis pipe 0", simGraphData)
        setIsLoading(true);
        // Process data
        console.log("matvis pipe 1", graph_path, intmData, sandBoxMode);
        let data = simGraphData;
        let {weights, bias} = loadSimulatedModelWeights();
        if(!sandBoxMode) {
            ({weights, bias} = loadWeights());
            data = await load_json(graph_path);
            console.log("matvis pipe not sandbox", data);
        }
        console.log("matvis pipe 2", data);
        const dim = weights[1].length
        console.log("dim", dim);
        //node attributes extraction
        const nodeAttrs = getNodeAttributes(data);
        //accept the features from original json file
        const features = await get_features_origin(data);
        const processedData = await graph_to_matrix(data);
        console.log("matvis pipe 3", features, nodeAttrs, processedData);
        // Initialize and run D3 visualization with processe  d data
        await initGraphClassifier(
            processedData, 
            features, 
            nodeAttrs, 
            intmData, 
            graph_path, 
            dim,
            sandBoxMode
        );
    } catch (error) {
        console.error("Error in visualizeGNN:", error);
    } finally {
        setIsLoading(false);
    }
};

//Visualization Pipeline for Node Classifier
export async function visualizeNodeClassifier(
    setIsLoading:any, 
    graph_path:string, 
    intmData:any,
    simGraphData:any,
    sandBoxMode:boolean // no dim data
) {
    try {
        setIsLoading(true);
        // Process data
        let data = simGraphData;
        if(!sandBoxMode) data = await load_json(graph_path);
        let {weights, bias} = loadSimulatedModelWeights("node");
        if(!sandBoxMode) {
            ({weights, bias} = loadNodeWeights());
            data = await load_json(graph_path);
            console.log("matvis pipe not sandbox", data);
        }
        console.log("matvis pipe 2 node", data, sandBoxMode);
        //training nodes
        let dimensions = [];
        for(let i = 0; i<bias.length; i++){
            const dim = bias[i].length;
            dimensions.push(dim);
        }
        console.log("dimensions", dimensions);
        const trainingNodes = [1, 5, 3];
        //accept the features from original json file
        const features = await get_features_origin(data);
        const processedData = await graph_to_matrix(data);
        // Initialize and run D3 visualization with processe  d data
        await initNodeClassifier(processedData, features, intmData, graph_path, trainingNodes, dimensions, sandBoxMode);
    } catch (error) {
        console.error("Error in visualizeGNN:", error);
    } finally {
        setIsLoading(false);
    }
};

//Visualization Pipeline for Link Classifier
export async function visualizeLinkClassifier(setIsLoading:any, graph_path:string, intmData:any, hubNodeA:number, hubNodeB:number, innerComputationMode:string) {
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
        await initLinkClassifier(subMatrix, features, intmData, graph_path, hubNodeA, hubNodeB, keys, innerComputationMode, mergedNodes);
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
    keys: number[],
    innerComputationMode:string,
    mergedNodes:number[]
)  {

    //process the origin data
    const oData = await load_json(graph_path);
    const LargeGraph = await graph_to_matrix(oData);

    let colorSchemeTable: any = null;
    //a data structure to record the link relationship
    //fill up the linkMap
    let adjList = graphToAdjList(graph, false);

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

    let gridSize = 800;
    const margin = { top: 10, right: 80, bottom: 30, left: 80 };
    const width = 20 * gLen + 50 + 6 * 102 + 1200 * 2;
    const height = (gridSize + margin.top + margin.bottom) * 2;

    let locations: number[][] = [];
    d3.select("#matvis").selectAll("*").remove();
    visualizeMatrixBody(gridSize, graph, width, height, margin);
    const strKeys:string[] = keys.map(item => String(item));

    drawNodeAttributes(strKeys, graph, 150);

    //draw target edge - "?"
    
    //get the subgraph indexes for the target edge - hubNodeA and hubNodeB

    //indexing the location
    const rectLocations = get_cood_from_parent(".mats", "rect");

    //add a question mark to the target edge



    const data = matrix_to_hmap(graph);

    locations = get_cood_locations(data, locations);

    const locationMatrix = splitAnyIntoMatrices(locations, Math.sqrt(locations.length));

    //drawPoints(".mats", "red", locationMatrix);

    
    //shift the locations
    for(let i = 0; i < locations.length; i++){
        locations[i][0] += 25;
    }

    //features fetching - select the right features to viaualize
    // get the set 
    console.log("graph", graph);
    const setA = getNodeSet(LargeGraph, hubNodeA);
    const setB = getNodeSet(LargeGraph, hubNodeB);

    //get the set of nodes
    const featuresIndicesLayerOne:number[] = removeDuplicatesFromSubarrays([[...setA[0], ...setB[0]]])[0];
    const featuresIndicesLayerTwo:number[] = removeDuplicatesFromSubarrays([[...setA[1], ...setB[1]]])[0];


    const keysForEach = [
        featuresIndicesLayerOne.sort((a, b) => a - b), 
        featuresIndicesLayerTwo.sort((a, b) => a - b), 
        [hubNodeA, hubNodeB].sort((a, b) => a - b)
    ];

    //indexing the node/intermediate features by set
    let featuresLayerOne = [];
    let featuresLayerTwo = [];
    for(let i = 0; i < featuresIndicesLayerOne.length; i++){
        featuresLayerOne.push({[featuresIndicesLayerOne[i]]:features[featuresIndicesLayerOne[i]]});
    }
    for(let i = 0; i < featuresIndicesLayerTwo.length; i++){
        featuresLayerTwo.push({[featuresIndicesLayerTwo[i]]:conv1[featuresIndicesLayerTwo[i]]});
    }

    //sort two features data tables
    featuresLayerOne.sort((a, b) => {
        let keyA = Object.keys(a)[0]; 
        let keyB = Object.keys(b)[0]; 
        return Number(keyA) - Number(keyB); 
    });
    
    featuresLayerTwo.sort((a, b) => {
        let keyA = Object.keys(a)[0]; 
        let keyB = Object.keys(b)[0]; 
        return Number(keyA) - Number(keyB); 
    });

    //get the feature from decoding phase z @ z.t() where z is the matrix from the conv2
    let featuresLayerThree = [{[hubNodeA]:conv2[hubNodeA]}, {[hubNodeB]:conv2[hubNodeB]}];
    //sort the third data table
    if(hubNodeB<hubNodeA){
        featuresLayerThree = [{[hubNodeB]:conv2[hubNodeB]}, {[hubNodeA]:conv2[hubNodeA]}];
    }

    //get the final result from probability matrix
    let featuresLayerFour = prob_adj[hubNodeA][hubNodeB];

    //summarize them as a table
    const featuresDataTable = [featuresLayerOne, featuresLayerTwo, featuresLayerThree, featuresLayerFour];
    console.log("featuresDataTable", featuresDataTable);

    //feature value extractions
    let featuresArray:any = [];
    // let secondLayerFeaturesArray:number[][] = [];
    // let thirdLayerFeaturesArray:number[][] = [conv];

    featuresLayerOne.forEach(obj => {
        let key:number = Number(Object.keys(obj)[0]); 
        featuresArray.push(obj[key]);  
    });
    // featuresLayerTwo.forEach(obj => {
    //     let key:number = Number(Object.keys(obj)[0]); 
    //     secondLayerFeaturesArray.push(obj[key]);  
    // });
    //crossConnectionMatrices(graphs, locations, offsetMat, pathMatrix);

    const subGraphNodeA = featuresIndicesLayerOne.indexOf(hubNodeA);
    const subGraphNodeB = featuresIndicesLayerOne.indexOf(hubNodeB);

    // drawPoints(".mats", "red", locationMatrix[subGraphNodeA]);

    //const questionMark = d3.select(".mats").append("text").text("?").attr("x", locationMatrix[subGraphNodeA][subGraphNodeB][0]+10).attr("y", locationMatrix[subGraphNodeA][subGraphNodeB][1]+50).raise();


    // console.log(
    //     "grid cell", 
    //     `#gridCell-${subGraphNodeA}-${subGraphNodeB}`, `#gridCell-${subGraphNodeB}-${subGraphNodeA}`,
    //     d3.select("#matvis").selectAll("rect").select(`#gridCell-${subGraphNodeA}-${subGraphNodeB}`)
    //     ,locationMatrix[subGraphNodeA][subGraphNodeB][0], locationMatrix[subGraphNodeA][subGraphNodeB][1],questionMark
    // );

    d3.select(".mats").select(`#gridCell-${subGraphNodeA}-${subGraphNodeB}`).attr("fill", "red");
    d3.select(".mats").select(`#gridCell-${subGraphNodeB}-${subGraphNodeA}`).attr("fill", "red");

    const featuresManager = visualizeLinkClassifierFeatures(
        locations, featuresArray, myColor, 
        conv1, conv2, prob_adj[hubNodeA][hubNodeB], graph, adjList, [], keys, 
        keysForEach, mergedNodes, innerComputationMode);
    

    // const intervalID = featuresManager.getIntervalID();

    // clearInterval(intervalID);
    // drawPoints(".mats", "red", locations);

   // console.log("finished visulizing link classifier", conv1, conv2, decode_mul, decode_sum, prob_adj, locations);
};
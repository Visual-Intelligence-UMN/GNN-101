import { IntmDataLink } from "@/types";
import { chunkArray, graph_to_matrix, graphToAdjList, graphToMatrix, load_json, preprocessFloat32ArrayToNumber } from "./utils";
import { extractSubgraph, Graph, removeDuplicatesFromSubarrays } from "./graphDataUtils";

// format the intmData from link prediction result into correct format
export function dataPreparationLinkPred(intmData: IntmDataLink){
    const conv1:any = intmData["conv1"];
    const conv2:any = intmData["conv2"];

    const processedConv1 = preprocessFloat32ArrayToNumber(
        [chunkArray(conv1, 64)]
    );
    
    const processedConv2 = preprocessFloat32ArrayToNumber(
        [chunkArray(conv2, 64)]
    );

    //may need to use softmax again to get the probability
    const probAdj = preprocessFloat32ArrayToNumber(
        [chunkArray(intmData["prob_adj"], 7126)]
    );

    
    return {
        conv1Data: processedConv1,
        conv2Data: processedConv2,
        probAdj: probAdj
    };
}

export function constructComputationalGraph(
    graph: any, 
    features: number[][], 
    conv1: number[][], 
    conv2: number[][],
    hubNode: number
){

    //initialize the graph data structure, ensure we store the graph in adjacency list
    const computeGraph = new Graph();

    console.log("data mat", graph, features, conv1, conv2, hubNode);
    // Convert graph to adjacency matrix and adjacency list
    const mat = graphToMatrix(graph);
    let adjList:number[][] = graphToAdjList(mat);
    adjList = removeDuplicatesFromSubarrays(adjList);

    console.log("d", mat, adjList);

    // Initialize computeGraph arrays and sets for tracking added nodes
    let addedConv1Nodes: Set<number> = new Set();
    let addedFeatureNodes: Set<number> = new Set();

    //add the hubNode to the compuetGraph
    computeGraph.addNode(hubNode, 0, conv2[hubNode]);

    console.log("neighborNode", hubNode, adjList[hubNode]);

    // Compute second conv layer features and add to computeGraph
    for(let i = 0; i < adjList[hubNode].length; i++){
        const neighborNode = adjList[hubNode][i];
        
        computeGraph.addNode(neighborNode, 1, conv1[neighborNode]);
        computeGraph.addEdge(hubNode, 0, neighborNode, 1);
        console.log("add edge", hubNode, neighborNode);
        if (!addedConv1Nodes.has(neighborNode)) {
            addedConv1Nodes.add(neighborNode);
        }
    }

    console.log("neighborNode 1", adjList[hubNode]);

    // Compute features of nodes involved and add to computeGraph
    for(let i = 0; i < adjList[hubNode].length; i++){
        const node = adjList[hubNode][i];
        // console.log("neighborNode 2", adjList[node]);
        for(let j = 0; j < adjList[node].length; j++){
            const neighborNode = adjList[node][j];
            // console.log("neighborNode hop 2", neighborNode);
            computeGraph.addNode(neighborNode, 2, features[neighborNode]);
            computeGraph.addEdge(node, 1, neighborNode, 2);
            // console.log("add edge hop 2", node, neighborNode);
            if (!addedFeatureNodes.has(neighborNode)) {
                addedFeatureNodes.add(neighborNode);            
            }
        }
    }

    const sets = [addedFeatureNodes, addedConv1Nodes, hubNode];

    const nodesNeedConstruct:number[] = computeGraph.getNodesAtHopLevel(2);
    console.log("nodesNeedConstruct", nodesNeedConstruct);

    const subgraph = extractSubgraph(mat, nodesNeedConstruct);


    //basically, we generate a computational graph based on the input graph and the features - computeGraph
    //then we have a set of nodes that we have added to the computeGraph - sets
    //we also need to construct a subgraph based on the nodes that we have added to the computeGraph - subgraph
    return computeGraph;
}

export function getNodeSet(
    graph: any, 
    hubNode: number
){
    // Convert graph to adjacency matrix and adjacency list
    // const mat = graphToMatrix(graph);
    let adjList:number[][] = graphToAdjList(graph);
    adjList = removeDuplicatesFromSubarrays(adjList);

    let addedFeatureNodes: Set<number> = new Set();
    let addedConv1Nodes: Set<number> = new Set();
    for(let i = 0; i < adjList[hubNode].length; i++){
        const neighborNode = adjList[hubNode][i];
        console.log("add edge", hubNode, neighborNode);
        if (!addedConv1Nodes.has(neighborNode)) {
            addedConv1Nodes.add(neighborNode);
        }
    }

    // Compute features of nodes involved and add to computeGraph
    for(let i = 0; i < adjList[hubNode].length; i++){
        const node = adjList[hubNode][i];
        console.log("neighborNode 2", adjList[node]);
        for(let j = 0; j < adjList[node].length; j++){
            const neighborNode = adjList[node][j];
            console.log("neighborNode hop 2", neighborNode);
            console.log("add edge hop 2", node, neighborNode);
            if (!addedFeatureNodes.has(neighborNode)) {
                addedFeatureNodes.add(neighborNode);        
            }
        }
    }

    const nodesNeedConstruct:number[] = Array.from(addedFeatureNodes); //feature nodes
    const nodesNeedConstruct1:number[] = Array.from(addedConv1Nodes); //first conv
    const mergedNodes = [nodesNeedConstruct, nodesNeedConstruct1];
    //const subgraph = extractSubgraph(mat, nodesNeedConstruct);

    //basically, we generate a computational graph based on the input graph an-0d the features - computeGraph
    //then we have a set of nodes that we have added to the computeGraph - sets
    //we also need to construct a subgraph based on the nodes that we have added to the computeGraph - subgraph
    return mergedNodes;
}




type AdjacencyDict = { [key: string]: number[] };

export function convertToAdjacencyMatrix(adjDict: AdjacencyDict): number[][] {
    const keys = Object.keys(adjDict).map(Number);
    let adjMatrix: number[][] = Array(keys.length).fill(0).map(() => Array(keys.length).fill(0));
    for (const key in adjDict) {
        if (adjDict.hasOwnProperty(key)) {
            const values = adjDict[key];
            // console.log(`Key: ${key}, Values: ${values}`);
            for(let i = 0; i < values.length; i++){
                adjMatrix[keys.indexOf(Number(key))][keys.indexOf(values[i])] = 1;
            }
        }
    }

    return adjMatrix;
}

export function sigmoid(x: number) {
    return 1 / (1 + Math.exp(-x));
}

export function fetchSubGraphNodeLocation(index: number, innerComputationMode: string) {
    let path = "../public/json_data/node_location/subGraphList.json"
    if (innerComputationMode === "GraphSAGE") {
        path = "../public/json_data/node_location/subMidGraphList.json"
    }
    const location = require(path)
    return location;
}
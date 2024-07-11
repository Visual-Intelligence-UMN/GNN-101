import { IntmDataLink } from "@/types";
import { chunkArray, graph_to_matrix, graphToAdjList, graphToMatrix, preprocessFloat32ArrayToNumber } from "./utils";

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

    console.log("preproc pipeline", processedConv1, processedConv2, probAdj);
    
    return {
        conv1Data: processedConv1,
        conv2Data: processedConv2,
        probAdj: probAdj
    };
}

export function indexingFeatures(
    graph: any, 
    features: number[][], 
    conv1: number[][], 
    conv2: number[][],
    hubNode: number
){
    // Convert graph to adjacency matrix and adjacency list
    const mat = graphToMatrix(graph);
    console.log("indexed mat", mat);
    const adjList = graphToAdjList(mat);
    console.log("indexed adjlist", adjList);

    //add a self loop
    for(let i=0; i<adjList.length; i++){
        adjList[i].push(i);
    }

    // Initialize computeGraph arrays and sets for tracking added nodes
    let computeGraph: any = [[],[],[]];
    let addedConv2Nodes: Set<number> = new Set();
    let addedConv1Nodes: Set<number> = new Set();
    let addedFeatureNodes: Set<number> = new Set();

    // Compute second conv layer features and add to computeGraph
    for(let i = 0; i < adjList[hubNode].length; i++){
        const neighborNode = adjList[hubNode][i];
        if (!addedConv2Nodes.has(neighborNode)) {
            computeGraph[0].push(conv2[neighborNode]);
            addedConv2Nodes.add(neighborNode);
        }
    }

    // Compute first conv layer features and add to computeGraph
    for(let i = 0; i < adjList[hubNode].length; i++){
        const node = adjList[hubNode][i];
        for(let j = 0; j < adjList[node].length; j++){
            const neighborNode = adjList[node][j];
            if (!addedConv1Nodes.has(neighborNode)) {
                computeGraph[1].push(conv1[neighborNode]);
                addedConv1Nodes.add(neighborNode);
            }
        }
    }

    // Compute features of nodes involved and add to computeGraph
    for(let i = 0; i < adjList[hubNode].length; i++){
        const node = adjList[hubNode][i];
        for(let j = 0; j < adjList[node].length; j++){
            const neighborNode = adjList[node][j];
            for(let k = 0; k < adjList[neighborNode].length; k++){
                const targetNode = adjList[neighborNode][k];
                if (!addedFeatureNodes.has(targetNode)) {
                    computeGraph[2].push(features[targetNode]);
                    addedFeatureNodes.add(targetNode);
                }
            }
        }
    }

    //console.log("sets", addedConv1Nodes, addedConv2Nodes, addedFeatureNodes)
    const sets = [addedConv1Nodes, addedConv2Nodes, addedFeatureNodes]

    return {graph: computeGraph, sets: sets};
}

//given a hub node, compute the subgraph structure of it
export function extractSubgraph(
    graph: number[][],
    hubNode: number
){
    const adjMatrix:any = graph_to_matrix(graph);
    const n = adjMatrix.length;
    const visited = new Array(n).fill(false);
    const distance = new Array(n).fill(Infinity);
    const queue: number[] = [];
    const subgraphNodes: Set<number> = new Set();

    // BFS to find all nodes within distance 3 from hubNode
    queue.push(hubNode);
    distance[hubNode] = 0;
    visited[hubNode] = true;

    while (queue.length > 0) {
        const currentNode = queue.shift()!;
        const currentDistance = distance[currentNode];

        for (let neighbor = 0; neighbor < n; neighbor++) {
            if (adjMatrix[currentNode][neighbor] !== 0 && !visited[neighbor]) {
                distance[neighbor] = currentDistance + 1;
                if (distance[neighbor] <= 3) {
                    queue.push(neighbor);
                    visited[neighbor] = true;
                    subgraphNodes.add(neighbor);
                }
            }
        }
    }

    subgraphNodes.add(hubNode); // Include the start node in the subgraph

    // Create the adjacency matrix for the subgraph
    const subgraphNodeArray = Array.from(subgraphNodes);
    const subgraphSize = subgraphNodeArray.length;
    const subgraphAdjMatrix: number[][] = Array.from({ length: subgraphSize }, () => new Array(subgraphSize).fill(0));

    for (let i = 0; i < subgraphSize; i++) {
        for (let j = 0; j < subgraphSize; j++) {
            if (adjMatrix[subgraphNodeArray[i]][subgraphNodeArray[j]] !== 0) {
                subgraphAdjMatrix[i][j] = adjMatrix[subgraphNodeArray[i]][subgraphNodeArray[j]];
            }
        }
    }

    return subgraphAdjMatrix;
}



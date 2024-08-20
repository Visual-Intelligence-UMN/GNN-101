import { sigmoid } from "./linkPredictionUtils";
import { splitIntoMatrices } from "./utils";

type NodeID = number;
type HopLevel = number;
type GraphIndex = string;

interface NodeData {
    id: NodeID;
    hopLevel: HopLevel;
    data?: any; 
}

interface AdjacencyList {
    [key: string]: GraphIndex[];
}


export class Graph {
    nodes: Map<GraphIndex, NodeData>;
    adjacencyList: AdjacencyList;

    constructor() {
        this.nodes = new Map<GraphIndex, NodeData>();
        this.adjacencyList = {};
    }

    private generateIndex(id: NodeID, hopLevel: HopLevel): GraphIndex {
        return `${id}-${hopLevel}`;
    }

    addNode(id: NodeID, hopLevel: HopLevel, data?: any): void {
        const index = this.generateIndex(id, hopLevel);
        if (!this.nodes.has(index)) {
            const node: NodeData = { id, hopLevel, data };
            this.nodes.set(index, node);
            if (!this.adjacencyList[index]) {
                this.adjacencyList[index] = [];
            }
        }
    }

    hasNode(id: NodeID, hopLevel: HopLevel): boolean {
        const index = this.generateIndex(id, hopLevel);
        return this.nodes.has(index);
    }

    addEdge(node1: NodeID, hopLevel1: HopLevel, node2: NodeID, hopLevel2: HopLevel): void {
        const index1 = this.generateIndex(node1, hopLevel1);
        const index2 = this.generateIndex(node2, hopLevel2);

        if (!this.adjacencyList[index1]) {
            throw new Error(`Node ${node1} at hop level ${hopLevel1} does not exist`);
        }
        if (!this.adjacencyList[index2]) {
            throw new Error(`Node ${node2} at hop level ${hopLevel2} does not exist`);
        }
        this.adjacencyList[index1].push(index2);
    }

    getNode(id: NodeID, hopLevel: HopLevel): NodeData | undefined {
        const index = this.generateIndex(id, hopLevel);
        return this.nodes.get(index);
    }

    getNeighbors(id: NodeID, hopLevel: HopLevel): GraphIndex[] {
        const index = this.generateIndex(id, hopLevel);
        return this.adjacencyList[index];
    }

    getNodesAtHopLevel(hopLevel: HopLevel): number[] {
        const nodesAtLevel: number[] = [];
        this.nodes.forEach((node, index) => {
            if (node.hopLevel === hopLevel) {
                nodesAtLevel.push(node.id);
            }
        });
        return nodesAtLevel;
    }

}

export type AdjacencyListForSearch = {
    [x: string]: any; [key: number]: number[] 
};


//return a extracted subgraph from the larger graph
//adjMatrix: the adjacent matrix of the larger graph
//nodes: the nodes that we want to extract from the larger graph
export function extractSubgraph(adjMatrix: number[][], nodes: number[]): AdjacencyListForSearch {
    const subgraph: AdjacencyListForSearch = {};

    // Initialize subgraph adjacency list
    nodes.forEach(node => {
        subgraph[node] = [];
    });

    for(let i = 0; i < nodes.length; i++){
        for(let j=0; j < nodes.length; j++){
            if(adjMatrix[nodes[i]][nodes[j]] != 0){
                subgraph[nodes[i]].push(nodes[j]);
            }
        }
    }

    return subgraph;
}


export function removeDuplicatesFromSubarrays(arr: number[][]): number[][] {
    return arr.map(subarray => {
        const uniqueValues = new Set(subarray);
        return Array.from(uniqueValues);
    });
}

export function removeDuplicateSubarrays(arr: number[][]): number[][] {
    // 使用一个Set来存储已经见过的子数组
    const uniqueSubarrays = new Set();
    
    return arr.filter(subarray => {
        // 将子数组转换为字符串，以便在Set中存储和比较
        const subarrayKey = JSON.stringify(subarray);
        
        // 如果Set中没有这个子数组的键，则添加并保留该子数组
        if (!uniqueSubarrays.has(subarrayKey)) {
            uniqueSubarrays.add(subarrayKey);
            return true;
        }
        
        // 如果Set中已有这个子数组的键，则过滤掉该子数组
        return false;
    });
}


//get the probabilities result from the model, using in the prediction result visualizer
export function getProbabilities(prob: any, hubNodeA: number, hubNodeB: number): number[]{
    console.log("input prob check", prob);
    // split to matrix
    const probAdj = splitIntoMatrices(prob, Math.sqrt(prob.length));
    console.log("probAdj check", probAdj);
    //find the right prediction result
    const probResult = probAdj[hubNodeA][hubNodeB];
    //sigmoid 
    const trueResult = sigmoid(probResult);
    const falseResult = 1 - trueResult;
    //return the result
    return [falseResult, trueResult];
}


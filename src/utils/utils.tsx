// UTILS FILE BECAUSE WE HAVE SO MANY HELPER FUNCTIONS
import * as d3 from "d3";

import { loadNodeWeights, loadSimulatedModelWeights, loadWeights } from "./matHelperUtils";
import * as ort from "onnxruntime-web";
import { env } from "onnxruntime-web";
import { aggregationCalculator, fcLayerCalculationVisualizer, matrixMultiplication, showFeature, outputVisualizer, scaleFeatureGroup, nodeOutputVisualizer } from "@/utils/graphUtils";
import { features, off } from 'process';

import { IGraphData, IntmData, IntmDataLink, IntmDataNode } from "../types/";

import {
    hideAllLinks,
    showAllLinks,
    resetNodes,
    reduceNodeOpacity,
    calculationVisualizer,
    highlightNodes,
    moveNextLayer
} from "@/utils/graphUtils"
import { stat } from "fs";
import { Yomogi } from "@next/font/google";
import { dataPreparationLinkPred, constructComputationalGraph } from "./linkPredictionUtils";
import { extractSubgraph } from "./graphDataUtils";
import { isValidNode } from "./GraphvislinkPredUtil";
import { all, number } from "mathjs";
import { simulatedModelList } from "./const";

env.wasm.wasmPaths = {
    "ort-wasm-simd.wasm": "./ort-wasm-simd.wasm",
};


// Function to flip a matrix upside down
export function flipVertically(matrix: number[][]): number[][] {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const flippedMatrix: number[][] = new Array(rows).fill(0).map(() => new Array(cols).fill(0));

    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            flippedMatrix[i][j] = matrix[rows - 1 - i][j];
        }
    }

    return flippedMatrix;
}

// Function to flip a matrix left to right
export function flipHorizontally(matrix: number[][]): number[][] {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const flippedMatrix: number[][] = new Array(rows).fill(0).map(() => new Array(cols).fill(0));

    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            flippedMatrix[i][j] = matrix[i][cols - 1 - j];
        }
    }

    return flippedMatrix;
}





export interface FeatureGroupLocation {
    xPos: number;
    yPos: number;
}
export const linkStrength = d3.scaleLinear<string>()
    .domain([-0.25, 0, 0.25])
    .range(["gray", "darkgray", "black"]);



export function preprocessFloat32ArrayToNumber(matrix: any): number[][] {
    // why the matrix here is an array....? 
    let mat = [];
    for (let i = 0; i < matrix[0].length; i++) {
        let row = [];
        for (let j = 0; j < matrix[0][i].length; j++) {
            row.push(matrix[0][i][j]);

        }
        mat.push(row)

    }
    return mat;
}

export function transposeMat<T>(matrix: T[][]): T[][] {

    const rows = matrix.length;
    const cols = matrix[0].length;
    const transposed: T[][] = Array.from({ length: cols }, () => new Array<T>(rows));

    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            transposed[i][j] = matrix[j][i];
        }
    }

    return transposed;
}


//helper
//for debugging purpose, input an array with coordination, draw points based on those coordinations
export function drawPoints(cName: string, color: string, points: number[][]): void {
    const svg = d3.select(cName);
    svg.selectAll("circle")
        .data(points)
        .enter()
        .append("circle")
        .attr("cx", d => d[0])
        .attr("cy", d => d[1])
        .attr("r", 3) // the raidus of the point
        .attr("fill", color); // set color to color
}

//helper
//set implementation
export function uniqueArray<T>(array: T[]): T[] {
    return array.filter((value, index, self) => self.indexOf(value) === index);
}

//helper
//direct get coordinates - you can use this function to get the coordination of a specific element in the SVG
export function get_coordination(element: any) {
    const bbox = element.getBBox();
    const cx = bbox.x + bbox.width / 2;
    const cy = bbox.y + bbox.height / 2;

    const transformAttr = d3
        .select(element.parentNode as SVGElement)
        .attr("transform");
    let translate = [0, 0]; // 默认为无位移
    if (transformAttr) {
        const matches = transformAttr.match(/translate\(([^,]+),([^)]+)\)/);
        if (matches) {
            translate = matches.slice(1).map(Number);
        }
    }

    const adjustedX = cx + translate[0];
    const adjustedY = cy + translate[1] - 10;
    return [adjustedX, adjustedY];
}

//helper
//get coordinates for type child in the parent node parent
export function get_cood_from_parent(
    parent: string,
    child: string
): number[][] {
    let res: number[][] = [];
    const mainNode = d3.select(parent);
    mainNode.selectAll(child).each(function () {
        const children = d3.select(this as SVGGraphicsElement);
        const r = get_coordination(children.node());
        res.push(r);
    });

    return res;
}

//helper
//print text coordinates in MatricesVisualizer


export function findMaxIndex(arr: number[]): number {
    if (arr.length === 0) {
        throw new Error("Array is empty");
    }

    const maxValue = Math.max(...arr);
    return arr.indexOf(maxValue);
}

export function splitAnyIntoMatrices<T>(
    array: T[],
    matrixSize: number = 64
): T[][] {
    // 创建一个空的二维数组
    let result: T[][] = [];
    // 计算每个子数组的长度
    let n = Math.ceil(array.length / matrixSize);

    // 遍历 n 次来创建子数组
    for (let i = 0; i < n; i++) {
        // 截取从 i * matrixSize 开始的 matrixSize 长度的部分
        let subArray = array.slice(i * matrixSize, (i + 1) * matrixSize);
        // 将截取的子数组添加到结果数组中
        result.push(subArray);
    }

    // 返回生成的二维数组
    return result;
}

//Split a large 1d array into a 1d array with multiple 8*8 matrices


export function splitIntoMatrices(
    array: number[],
    matrixSize: number = 64
) {
    // 创建一个空的二维数组
    let result: number[][] = [];
    // 计算每个子数组的长度
    let n = array.length / matrixSize;
    let subArrayLength = matrixSize;

    // 遍历 n 次来创建子数组
    for (let i = 0; i < n; i++) {
        // 截取从 i * subArrayLength 开始的 subArrayLength 长度的部分
        let subArray = array.slice(i * subArrayLength, (i + 1) * subArrayLength);
        // 将截取的子数组添加到结果数组中
        result.push(subArray);
    }

    // 返回生成的二维数组
    return result;
}

//get the category of node features in the original input graph
export function get_category_node(data: number[]) {
    for (let i = 0; i < data.length; i++) {
        if (data[i] == 1) {
            return i;
        }
    }
    return 0;
}

//get the features from a JSON structure
export async function get_features_origin(data: any) {
    return data.x;
}

//get axis from gData
export function get_axis_gdata(data: number[][]) {
    let res: string[];
    res = [];
    for (let i = 0; i < data.length; i++) {
        res.push(i.toString());
    }
    return res;
}

//write a function to convert gData to heatmap data
export function matrix_to_hmap(data: number[][]) {
    let res: any[];
    res = [];
    for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < data[0].length; j++) {
            let d = {
                group: i.toString(),
                variable: j.toString(),
                value: data[i][j], // 将字符串转换为数字
            };
            if (data[i][j] === 1) {
                d.value = 56;
            }
            res.push(d);
        }
    }
    return res;
}


//input a JSON file and transform it into a matrix representation of graph
export async function graph_to_matrix(data: any) {
    console.log("graph_to_matrix", data);
    //get the number of nodes
    const nodeCount = data.x.length;
    //tranformation process
    let matrix: number[][];
    matrix = Array.from({ length: nodeCount }, () => Array(nodeCount).fill(0));
    for (let i = 0; i < data.edge_index[0].length; i++) {
        let source = data.edge_index[0][i];
        let target = data.edge_index[1][i];

        matrix[source][target] = 1;
    }
    console.log("graph_to_matrix matrix", matrix);

    return matrix;
}


//input a JSON file and transform it into a matrix representation of graph
export function graphToMatrix(data: any) {
    //get the number of nodes
    const nodeCount = data.x.length;
    //tranformation process
    let matrix: number[][];
    matrix = Array.from({ length: nodeCount }, () => Array(nodeCount).fill(0));
    for (let i = 0; i < data.edge_index[0].length; i++) {
        let source = data.edge_index[0][i];
        let target = data.edge_index[1][i];

        matrix[source][target] = 1;
    }

    return matrix;
}

export function chunkArray<T>(inputArray: T[], chunkSize: number): T[][] {
    const result: T[][] = [];
    for (let i = 0; i < inputArray.length; i += chunkSize) {
        const chunk = inputArray.slice(i, i + chunkSize);
        result.push(chunk);
    }
    return result;
}

//prepare for matrices data to visualize
export async function prepMatrices(n: number, mat: number[][]) {
    let matrices = [];
    for (let i = 0; i < n; i++) {
        matrices.push(mat);
    }
    //push a 8*8 matrix
    // if (matrices.length > 1) {
    //     const array1: number[][] = Array(8)
    //         .fill(null)
    //         .map(() => Array(8).fill(0));
    //   //  matrices.push(array1);
    // //}
    return matrices;
}

export const load_json = async (path: string) => {
    try {

        const response = await fetch(path);

        const data = await response.json();

        return data;
    } catch (error) {
        console.error('There has been a problem with your fetch operation:', error);
    }
}

export type NodeType = {
    id: number;
    name: string;
    features: number[];
    is_aromatic: boolean;
};

export type LinkType = {
    source: number;
    target: number;
    type: string;
};



export async function data_prep(o_data: any) {
    


    let final_data = {
        nodes: [] as NodeType[],
        links: [] as LinkType[],
    };

    const atom_map: { [key: string]: string } = {
        "1,0,0,0,0,0,0": "C",
        "0,1,0,0,0,0,0": "N",
        "0,0,1,0,0,0,0": "O",
        "0,0,0,1,0,0,0": "F",
        "0,0,0,0,1,0,0": "I",
        "0,0,0,0,0,1,0": "Cl",
        "0,0,0,0,0,0,1": "Br"
    };

    const edge_map: { [key: string]: string } = {
        "1,0,0,0": "aromatic",
        "0,1,0,0": "single",
        "0,0,1,0": "double",
        "0,0,0,1": "triple"
    }


    try {
        let data: any
        if (typeof o_data === "string") {
            console.log("load data from json file!", o_data)
            data = await load_json(o_data);
        } else {
            console.log("using original data!")
            data = o_data;
        }
        var nodes = data.x;
        var edges = data.edge_index;
        var edge_attr = data.edge_attr;
        let is_train = [];
        if (data.train_mask) {
            is_train = data.train_mask;
        }



        // identify if the node is aromatic
        // store all aromatic node id to a set
        let aromatic_node_index_set = new Set();
        if (edge_attr) {

            for (var i = 0; i < edge_attr.length; i++) {
                if (edge_attr[i][0] === 1) {
                    if (!aromatic_node_index_set.has(edges[0][i])) {
                        aromatic_node_index_set.add(edges[0][i]);
                    }
                    if (!aromatic_node_index_set.has(edges[1][i])) {
                        aromatic_node_index_set.add(edges[1][i]);
                    }
                }
            }
        }
        var is_aromatic;
        var edge_type;


        for (var i = 0; i < nodes.length; i++) {
            let node_name;
            var feature_str = nodes[i].join(',');
            var atom_name = atom_map[feature_str] || "Unknown";
            let node_train = "Unknown";
            if (is_train.length != 0) {

                if (is_train[i]) {
                    node_train = "T"
                } else {
                    node_train = "?"
                }



            }
            if (aromatic_node_index_set.has(i)) {
                is_aromatic = true;
            } else {
                is_aromatic = false;
            }



            if (is_train.length != 0) {
                node_name = node_train;
            } else {
                node_name = atom_name;
            }


            var new_node = {
                id: i,
                name: node_name,
                features: nodes[i],
                is_aromatic: is_aromatic
            }
            final_data.nodes.push(new_node);
        }

        for (var i = 0; i < edges[0].length; i++) {
            if (edge_attr) {
                var edge_attr_string = edge_attr[i].join(',');
            }
            edge_type = edge_map[edge_attr_string] || "Unknown"


            var new_relation = {
                source: edges[0][i],
                target: edges[1][i],
                type: edge_type
            }
            final_data.links.push(new_relation);

        }


        return final_data;
    } catch (error) {
        console.error('There has been an error in data_prep:', error);
    }
} // end of data_prep

export async function prep_graphs(g_num: number, data: any) {
    var graphs = [];

    if (data.nodes) {
        for (var i = 0; i < g_num; i++) {
            var graphData = {};
            graphData = {
                nodes: deepClone(data.nodes),
                links: deepClone(data.links),
            };
            graphs.push(graphData);
        }
    } 
    if (data.x) {
        for (var i = 0; i < g_num; i++) {
            var graphData = {};
            graphData = {
                nodes: deepClone(data.x),
                links: deepClone(data.edge_attr),
            };
            graphs.push(graphData);
        } 
    }
    for (var i = 0; i < 2; i++) {
        var node: NodeType = {
            id: 0,
            name: " ",
            features: [0],
            is_aromatic: false
        }

        var node_array = [];
        node_array.push(node);

        var links: LinkType = {
            source: 0,
            target: 0,
            type: "single"
        }
        var graphData = {};
        graphData = {
            nodes: node_array,
            links: links,
        }
        graphs.push(graphData);
    }

    return graphs;
}

export const myColor = d3
    .scaleLinear<string>()
    .domain([-3, -1, -0.1, 0, 0.1, 1, 3])
    .range(["#304E30", "#3DBA41", "#B7EFB8", "white", "#BBB7EF", "#6E09CD", "#4B0092"]);


export function transposeAnyMatrix(matrix: any) {

    let resultMat = [];
    for (let i = 0; i < matrix[0].length; i++) {
        let t = [];
        for (let j = 0; j < matrix.length; j++) {
            t.push(matrix[j][i]);
        }
        resultMat.push(t);
    }

    return resultMat;
}


export interface State {
    isClicked: boolean;
    isPlaying: boolean;
    isAnimating: boolean;
}

export const state: State = {
    isClicked: false, // if isClicked is true, all mouseover/out operation would be banned and some certain functions would be called
    isPlaying: false,
    isAnimating: false,
};


export function handleClickEvent(svg: any, movedNode: any, event: any, moveOffset: number, allNodes: any[], convNum: number, mode: number, state: State, fcLayerMoveOffset: number = 600) {

    if (!svg.selectAll) {
        svg = d3.selectAll(svg)
    }

    if (!movedNode || !state.isClicked) {
        return;
    }
    d3.selectAll(".hintLabel").attr("opacity", 1);
    d3.selectAll(".formula").remove()

    if (movedNode && (!event.target.classList.contains("vis-component"))) {
        svg.selectAll(".vis-component").style("opacity", 0);
        let currMoveOffset = moveOffset;

        if (mode === 0 && movedNode.graphIndex >= 4) {
            currMoveOffset = fcLayerMoveOffset;
        }

        moveNextLayer(svg, movedNode, currMoveOffset, -1);

        showAllLinks(allNodes);
        resetNodes(allNodes, convNum);

        state.isClicked = false;
        state.isAnimating = false;
        state.isPlaying = false;


        d3.selectAll(".exit-button").on("click", function (event: any) {
        })
        d3.selectAll("#my_dataviz").on("click", function(event: any) {
        })

    }
};


export function featureVisualizer(
    svg: any,
    allNodes: any[],
    offset: number,
    height: number,
    graphs: any[],
    firstLayerMoveOffset: number,
    moveOffset: number,
    fcLayerMoveOffset: number,
    rectWidth: number,
    firstLayerRectHeight: number,
    rectHeight: number,
    outputLayerRectHeight: number,
    mode: number,
    innerComputationMode: string,
    sandBoxMode: boolean = false
) {
    state.isClicked = false;
    console.log("featureVisualizer")
    console.log(graphs, allNodes)




    // 1. visualize feature
    // 2. handle interaction event
    // 3. do the calculation for animation
    let convNum = 4;
    let weights:any, bias:any;
    if (!sandBoxMode) {
        ({ weights, bias } = loadWeights());
        if (mode === 1) {
            ({ weights, bias } = loadNodeWeights());
            convNum = 5
        }
    } else {
        if (mode === 0) {
            ({ weights, bias } = loadSimulatedModelWeights());
        }
        else if (mode === 1) {
            ({ weights, bias } = loadSimulatedModelWeights("node"))
            convNum = 5
        }

        weights[0] = transposeAnyMatrix(weights[0])
    }
    
    

    const nodesByIndex = d3.group(allNodes, (d: any) => d.graphIndex); //somehow doesn't include the node in the last layer


    let normalizedAdjMatrix: any = []
    if (graphs.length != 0) {
        normalizedAdjMatrix = aggregationCalculator(graphs);
    }
    let movedNode: any = null; // to prevent the same node is clicked twice


    let allFeatureMap: number[][][] = [];
    nodesByIndex.forEach((nodes, index) => {
        let featureMap: number[][] = []
        if (index < convNum) {
            nodes.forEach((n) => {
                featureMap.push(n.features)
            })
            allFeatureMap.push(featureMap)
        }
    })


    nodesByIndex.forEach((nodes, graphIndex) => { // iterate through each graphs
        console.log(graphIndex)


        let aggregatedDataMap: any[] = [];
        let calculatedDataMap: any[] = [];
        let currentWeights: any[] = [];
        let currentBias: any[] = []



        // do some calculation that sill be used in the animation
        if (graphs.length != 0 && graphIndex > 0 && graphIndex < (convNum)) {
            currentWeights = weights[graphIndex - 1];
            currentBias = bias[graphIndex - 1]
            const nodesByIndex = d3.group(allNodes, (d: any) => d.graphIndex);

            let featureMap: number[][] = []
            console.log("nodesByIndex: ", nodesByIndex);
            nodesByIndex.forEach((nodes, index) => {
                if (index === graphIndex - 1) {
                    nodes.forEach((n) => {
                        featureMap.push(n.features);
                    })
                }
            })
            console.log("featureMap", featureMap)
            aggregatedDataMap = [];
            for (let i = 0; i < nodes.length; i++) {
                let aggFeatures: number[] = [];
                let aggSteps: string[] = [];
                
                let featureDim = featureMap[0].length;
                for (let d = 0; d < featureDim; d++) {
                    let sum = 0;
                    let stepStr = "";
                    let isFirstTerm = true;


                    // console.log(`tures for node ${i}, feature dimension ${d}`, normalizedAdjMatrix);
                    
                    for (let k = 0; k < featureMap.length; k++) {
                        // Only include terms for nodes that are connected (have non-zero weights)
                        // console.log(`Feature-value-${k}: `, featureMap[k])
                        if (normalizedAdjMatrix[i][k] !== 0) {
                            const fVal = featureMap[k][d];
                            const weightVal = normalizedAdjMatrix[i][k];
                           // console.log(`Feature-value-${i}-${k}: ${featureMap[k][d]}`)
                            sum += fVal * weightVal;
                            // console.log(`Node ${i}, Feature ${d}-${k}: ${fVal} * ${weightVal} = ${fVal * weightVal}`);


                    

                            const term = `(${fVal.toFixed(3)} × ${weightVal.toFixed(3)})`;
                            // Add newline and plus sign for all terms except the first
                            stepStr += (isFirstTerm ? "" : "\n+ ") + term;
                            isFirstTerm = false;
                        }
                    }
                    
                    aggFeatures.push(sum);
                    // Create the final step string
                    aggSteps.push(`X[${d}] = Σ [\n${stepStr} \n] = ${sum.toFixed(3)}`);
                }
                
                aggregatedDataMap.push(aggFeatures);
                
                if (nodes[i]) {
                    nodes[i].aggregationSteps = aggSteps;
                }
            }
            calculatedDataMap = matrixMultiplication(aggregatedDataMap, currentWeights);

        }
        for (let i = 0; i < nodes.length; i++) {
            nodes[i].matmulResults = calculatedDataMap[i]; 
            nodes[i].biases        = currentBias;
        }
    

        let xOffset = (graphIndex - 2.5) * offset;
        if (graphIndex >= 4 && mode === 0) {
            xOffset = (graphIndex - 2.5) * offset - 25 * (graphIndex * 1.5);
        }

        const g2 = svg.append("g")
            .attr("layerNum", graphIndex)
            .attr("class", "layerVis")
            .attr("transform", `translate(${xOffset},10)`);
            





        nodes.forEach((node: any, i: number) => { // iterate through each node in the current graph
            let currRectHeight = rectHeight;
            if (graphIndex === 0) {
                currRectHeight = firstLayerRectHeight;
            }



            const features = node.features;
            let xPos = node.x;
            let yPos = node.y + 25;


            // collision detection. if the locaion is occupied, add 20 to the x coordination



            if (graphIndex < convNum) {
                // featureGroup in the convolutional layers and the last three layers are different.

                // add svgElement to each node simplify the interaction process (maybe)

                const nodeGroup = g2.append("g")
                    .attr("class", "node-group")
                    .attr("transform", `translate(${node.x},${node.y})`);
                node.svgElement = nodeGroup.append("circle")
                    .attr("cx", 0)
                    .attr("cy", 0)
                    .attr("r", 17)
                    .attr("fill", "white")
                    .attr("stroke", "#69b3a2")
                    .attr("stroke-width", 1)
                    .attr("stroke-opacity", 1)
                    .attr("opacity", 1)
                    .node(); // make the svgElement a DOM element (the original on method somehow doesn't work)
                let name = "unknown";


                if (mode === 1 && graphIndex === 4) {

                    const classLabels = ["A", "B", "C", "D"];
                    const maxIdx = findMaxIndex(node.features.map(Number));
                    name = classLabels[maxIdx];
                    console.log("Node class name:", name, node.features);



                    node.text = nodeGroup.append("text")
                        .attr("x", 0)
                        .attr("y", 0)
                        .join("text")
                        .text(name)
                        .attr("text-anchor", "middle")
                        .attr("dominant-baseline", "central")
                        .attr("font-size", `17px`)
                        .attr("opacity", 1);

                }
         
                else if (graphIndex === 0) {
                    if (sandBoxMode) {
                        node.name = node.id
                    }
                    node.text = nodeGroup.append("text")
                        .attr("x", 0)
                        .attr("y", 0)
                        .join("text")
                        .attr("text-anchor", "middle")
                        .attr("dominant-baseline", "central")
                        .text(node.name)
                        .attr("font-size", `17px`)
                        .attr("opacity", 1);

                }
                else {
                    node.text = nodeGroup.append("text")
                        .attr("x", 0)
                        .attr("y", 0)
                        .join("text")
                        .attr("text-anchor", "middle")
                        .attr("dominant-baseline", "central")
                        .text(node.id)
                        .attr("font-size", `17px`)
                        .attr("opacity", 1);
                }

                const featureGroup = g2.append("g")
                    .attr("transform", `translate(${xPos - 7.5}, ${yPos})`);


                if (mode === 1 && graphIndex === 4) {
                    featureGroup.selectAll("rect")
                        .data(features)
                        .enter()
                        .append("rect")
                        .attr("x", 0)
                        .attr("y", (d: any, i: number) => i * currRectHeight)
                        .attr("width", rectWidth)
                        .attr("height", currRectHeight)
                        .attr("class", `node-features node-features-${node.graphIndex}-${node.id}`)
                        .attr("id", (d: any, i: number) => "output-layer-rect-" + i)
                        .style("fill", (d: number) => myColor(d))
                        // .style("fill", "coral")
                        .style("stroke-width", 0.1)
                        .style("stroke", "grey")
                        .style("opacity", 1);


                } else {
                    featureGroup.selectAll("rect")
                        .data(features)
                        .enter()
                        .append("rect")
                        .attr("x", 0)
                        .attr("y", (d: any, i: number) => i * currRectHeight)
                        .attr("width", rectWidth)
                        .attr("height", currRectHeight)
                        .attr("class", `node-features node-features-${node.graphIndex}-${node.id}`)
                        .attr("id", (d: any, i: number) => "conv" + graphIndex + "-layer-rect-" + i)
                        .style("fill", (d: number) => myColor(d))
                        // .style("fill", "coral")
                        .style("stroke-width", 0.1)
                        .style("stroke", "grey")
                        .style("opacity", 1);
                }

                const frame = featureGroup.append("rect")
                    .attr("class", `node-features-${node.graphIndex}-${node.id} nodeFeatureFrame node-features`)
                    .attr("x", 0)
                    .attr("y", 0)
                    .attr("width", rectWidth)
                    .attr("height", currRectHeight * (node.features.length))
                    .style("fill", "none")
                    .style("stroke", "black")
                    .style("stroke-width", 1);


                const featureId = featureGroup.append("text")
                    .attr("x", rectWidth / 2)
                    .attr("y", node.features.length * currRectHeight + 12)
                    .attr("class", `node-features-${node.graphIndex}-${node.id} feature-id`)
                    .attr("dy", ".35em")
                    .text(node.id)
                    .style("font-size", "12px")
                    .style("fill", "black")
                    .style("text-anchor", "middle");



                featureGroup.style('visibility', 'hidden');

                let prevRectHeight;

                let currMoveOffset = moveOffset;
                if (graphIndex === 1) {
                    prevRectHeight = firstLayerRectHeight;
                    currMoveOffset = firstLayerMoveOffset

                } else {
                    prevRectHeight = rectHeight;
                }

                if (mode === 1 && graphIndex === 4) {
                    currMoveOffset = fcLayerMoveOffset;

                }






                //the bottom of the featureGroup 
                let featureGroupLocation: FeatureGroupLocation = { xPos, yPos };

                node.featureGroup = featureGroup;
                node.featureId = featureId;
                node.featureGroupLocation = featureGroupLocation; // this will be used in calculationvisualizer
                scaleFeatureGroup(node, 0.5);

                // add interaction 
                nodeGroup.on("mouseenter", function (this: any) {
                    if (!state.isClicked) {
                        highlightNodes(node);
                        if (node.relatedNodes) {
                            reduceNodeOpacity(allNodes, node.relatedNodes, node);
                        }
                    }
                });

                nodeGroup.on("mouseleave", function () {
                    if (!state.isClicked) {
                        resetNodes(allNodes, convNum);
                    }
                });



                //click logic
                if (node.graphIndex != 0) {
                    nodeGroup.on("click", function (event: any) {
                        event.stopPropagation();
                        event.preventDefault();
                        if (state.isClicked) {
                            return;
                        }
                        // d3.selectAll(".node-features").style("visibility", "hidden")
                        // highlightNodes(node)

                        state.isClicked = true;


                        d3.selectAll(".hintLabel").attr("opacity", 0);

                        //  // prevent clicking on other nodes and move the layers to the right again
                        //  if (movedNode === node) {
                        //   return; 
                        // }


                        //color schemes interaction logic

                        hideAllLinks(allNodes);


                        if (mode === 1 && graphIndex === 4) {
                            console.log("into nodeoutputvis")
                            nodeOutputVisualizer(node, allNodes, weights, bias[3], g2, offset, convNum, currMoveOffset, height, prevRectHeight, currRectHeight, rectWidth, svg, mode, sandBoxMode)
                        } else {
           
                            calculationVisualizer(node, allNodes, weights, currentBias, normalizedAdjMatrix, aggregatedDataMap, calculatedDataMap, allFeatureMap, svg, offset, height, convNum, currMoveOffset, prevRectHeight, rectHeight, rectWidth, state, mode, innerComputationMode, sandBoxMode);
                        };



                        let relatedNodes: any = [];
                        if (node.relatedNodes) {
                            relatedNodes = node.relatedNodes;
                        }
                        reduceNodeOpacity(allNodes, relatedNodes, node);





                        // if (movedNode) {
                        //   moveNextLayer(svg, movedNode, currMoveOffset, -1)
                        //   state.isClicked = false; 
                        //   movedNode = null;
                        // }


                        moveNextLayer(svg, node, currMoveOffset, 1);
                        movedNode = node;

                    });

                }


            } else {
                if (mode === 0) {


                    let currMoveOffset = fcLayerMoveOffset;




                    let currRectHeight = rectHeight;
                    let rectName = "pooling"
                    if (node.graphIndex >= 5) {
                        currRectHeight = outputLayerRectHeight;
                        rectName = "output";
                    }
                    let prevRectHeight = rectHeight;
                    let groupCentralHeight = currRectHeight * features.length / 2;
                    let yOffset = groupCentralHeight - (height / 5);

                    const featureGroup = g2.append("g")
                        .attr("transform", `translate(${node.x - 7.5}, ${node.y - yOffset})`);

                    featureGroup.selectAll("rect")
                        .data(features)
                        .enter()
                        .append("rect")
                        .attr("x", -10) //adjust x and y coordination so it locates in the middle of the graph
                        .attr("y", (d: any, i: number) => i * currRectHeight - 190)
                        .attr("width", rectWidth)
                        .attr("id", (d: any, i: number) => rectName + "-layer-rect-" + i)
                        .attr("height", currRectHeight)
                        .attr("class", "node-features")
                        .style("fill", (d: number) => myColor(d))
                        // .style("fill", "coral")
                        .style("stroke-width", 0.1)
                        .style("stroke", "grey")
                        .style("visibility", "visible");


                    const frame = featureGroup.append("rect")
                        .attr("x", -10)
                        .attr("y", -190)
                        .attr("width", 15)
                        .attr("class", "node-features")
                        .attr("height", currRectHeight * (node.features.length))
                        .style("fill", "none")
                        .style("stroke", "black")
                        .style("stroke-width", 1)
                        .style("visibility", "visible")


                    const featureGroupCopy = g2.append("g")
                        .attr("transform", `translate(${node.x - 7.5}, ${node.y - yOffset})`);

                    featureGroupCopy.selectAll("rect")
                        .data(features)
                        .enter()
                        .append("rect")
                        .attr("x", -10) //adjust x and y coordination so it locates in the middle of the graph
                        .attr("y", (d: any, i: number) => i * currRectHeight - 190)
                        .attr("width", rectWidth)
                        .attr("height", currRectHeight)
                        .attr("class", "node-features-Copy")
                        .style("fill", (d: number) => myColor(d))
                        .style("stroke-width", 0.1)
                        .style("stroke", "grey")
                        .style("visibility", "hidden")
                        .lower();


                    const frameCopy = featureGroupCopy.append("rect")
                        .attr("x", -10)
                        .attr("y", -190)
                        .attr("width", 15)
                        .attr("class", "node-features-Copy")
                        .attr("height", currRectHeight * (node.features.length))
                        .style("fill", "none")
                        .style("stroke", "black")
                        .style("stroke-width", 1)
                        .style("visibility", "hidden")
                        .lower()





                    node.featureGroup = featureGroup;
                    xPos = node.x;
                    yPos = node.y + rectHeight * node.features.length + yOffset;
                    let featureGroupLocation: FeatureGroupLocation = { xPos, yPos };
                    node.featureGroupLocation = featureGroupLocation; // this will be used in calculationvisualizer


                    node.featureGroup.on("mouseover", function () {
                        if (!state.isClicked) {

                            if (node.links) {
                                node.links.forEach((link: any) => {
                                    link.style("opacity", 1)
                                });
                            }
                        }
                    });

                    node.featureGroup.on("mouseout", function () {
                        if (!state.isClicked) {
                            if (node.links) {
                                node.links.forEach((link: any) => {

                                    link.style("opacity", 0);
                                });
                            }

                        }
                    });
                    node.featureGroup.on("click", function (event: any) {
                        event.stopPropagation();
                        event.preventDefault();
                        if (state.isClicked) {
                            return;
                        }
                        state.isClicked = true;
                        d3.selectAll(".hintLabel").attr("opacity", 0);



                        highlightNodes(node);
                        hideAllLinks(allNodes);
                        // calculationVisualizer(node, currentWeights, bias, aggregatedDataMap, calculatedDataMap, svg, offset, isClicked);
                        let relatedNodes: any = [];
                        if (node.relatedNodes) {
                            relatedNodes = node.relatedNodes;
                        } // to make sure relatedNodes is not null
                        showFeature(node);
                        if (node.graphIndex === 4) {
                            fcLayerCalculationVisualizer(node, allNodes, relatedNodes, offset, height, currMoveOffset, node.graphIndex, g2, state, currRectHeight, convNum, svg, mode, sandBoxMode);
                        }
                        if (node.graphIndex === 5) {

                            outputVisualizer(node, allNodes, weights, bias[3], g2, offset, state.isClicked, currMoveOffset, height, prevRectHeight, currRectHeight, rectWidth, convNum, svg, mode, sandBoxMode)
                        }

                        reduceNodeOpacity(allNodes, relatedNodes, node);
                        event.stopPropagation(); // Prevent the click event from bubbling up


                        // if (movedNode === node) {
                        //   return; // Do nothing if the node is already moved
                        // }


                        // if (movedNode) {
                        //   // Move back the previously moved node and its layer
                        //   moveNextLayer(svg, movedNode, currMoveOffset, -1)
                        //   state.isClicked = false; 
                        //   movedNode = null;
                        // }


                        moveNextLayer(svg, node, currMoveOffset, 1);
                        movedNode = node; // Update the moved node


                    });
                }
            }
        });
    });

    // Add a global click event to the document to reset the moved node and isClicked flag




}



export function calculateAverage(arr: number[]): number {
    const sum = arr.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
    const average = sum / arr.length;
    return average * 10;
}

export function connectCrossGraphNodes(nodes: any, svg: any, graphs: any[], offset: number, subgraph: any, mode: number, hubNodeA: number, hubNodeB: number, centerY: number) {
    const nodesByIndex = d3.group(nodes, (d: any) => d.graphIndex);




    nodesByIndex.forEach((nodes, graphIndex) => {
        nodes.forEach((node: any, i) => {

            if (!node.links) {
                node.links = [];
            }
            if (!node.relatedNodes) {
                node.relatedNodes = []
            }

            let xOffset1 = (graphIndex - 2.5) * offset;
            let xOffset2 = (graphIndex - 1.5) * offset;


            let conv = 3;

            if (mode === 2) {
                xOffset1 = (graphIndex - 3.5) * offset;
                xOffset2 = (graphIndex - 2.5) * offset;
                conv = 2
            }
            if (graphIndex < conv) {

                let drawnLinks = new Set();

                const nextGraphLinks = graphs[graphIndex + 1].links;

                nextGraphLinks.forEach((link: any) => {
                    const sortedIds = [link.source.id, link.target.id].sort();
                    const linkId = sortedIds.join("-");
                    if (((link.source.id === node.id || link.target.id === node.id) && !drawnLinks.has(linkId))) {
                        drawnLinks.add(linkId);

                        const neighborNode = link.source.id === node.id ? link.target : link.source;
                        if (!neighborNode.links) {
                            neighborNode.links = [];
                        }
                        if (!neighborNode.relatedNodes) {
                            neighborNode.relatedNodes = [];
                        }


                        if (!(node.original_id === hubNodeA && neighborNode.original_id === hubNodeB) && !(node.original_id === hubNodeB && neighborNode.original_id === hubNodeA)) {

                            const controlX1 = node.x + xOffset1 + (neighborNode.x + xOffset2 - node.x - xOffset1) * 0.8;
                            const controlY1 = node.y + 10;
                            const controlX2 = node.x + xOffset1 + (neighborNode.x + xOffset2 - node.x - xOffset1) * 0.2;
                            const controlY2 = neighborNode.y + 10;
                            const avg = calculateAverage(node.features)
                            let neighborOffset = (neighborNode.graphIndex - 2.5) * offset
                            if (mode === 2) { neighborOffset -= offset }

                            const path = svg.append("path")
                                .attr("d",
                                    `M 
                    ${node.x + xOffset1 + 16}
                    ${node.y + 10}
                    Q 
                    ${controlX2} 
                    ${controlY2}, 
                    ${neighborNode.x + neighborOffset - 16} 
                    ${neighborNode.y + 10}
                  `)
                                .style("stroke", linkStrength(avg))

                                .style("stroke-width", 1)
                                .style("opacity", 0)
                                .style("fill", "none");



                            neighborNode.links.push(path);
                            neighborNode.relatedNodes.push(node);
                        }

                    }
                })

                const nextNode = nodesByIndex.get(graphIndex + 1);
                if (nextNode) {
                    nextNode.forEach((nextNode: any) => {
                        if (node.id === nextNode.id) {
                            let xOffsetNext = (graphIndex + 1 - 2.5) * offset;
                            if (mode === 2) { xOffsetNext -= offset }


                            const controlX1 = node.x + xOffset1 + (nextNode.x + xOffsetNext - node.x - xOffset1) * 0.3;
                            const controlY1 = node.y + 10;
                            const controlX2 = node.x + xOffset1 + (nextNode.x + xOffsetNext - node.x - xOffset1) * 0.7;
                            const controlY2 = nextNode.y + 10;

                            const avg = calculateAverage(node.features)

                            const path = svg.append("path")
                                .attr("d",
                                    `M ${node.x + xOffset1 + 16} ${node.y + 10} 
                     Q ${controlX2} ${controlY2}, 
                     ${nextNode.x + xOffsetNext - 16} ${nextNode.y + 10}`
                                )
                                .style("stroke-width", 1)
    
                                .style("opacity", 0)
                                .style("stroke", linkStrength(avg))
                                .style("fill", "none");


                            if (!nextNode.links) {
                                nextNode.links = [];
                            }
                            if (!nextNode.relatedNodes) {
                                nextNode.relatedNodes = [];
                            }
                            nextNode.links.push(path);

                            nextNode.relatedNodes.push(node);
                        }
                    })
                }



            } else {
                if (mode === 1) {
                    if (graphIndex === 3) {
                        const nextLayerNodes = nodesByIndex.get(graphIndex + 1);
                        if (nextLayerNodes) {
                            nextLayerNodes.forEach((nextNode: any) => {
                                if (node.id === nextNode.id) {
                                    const avg = calculateAverage(node.features);

                                    const path = svg.append("line")
                                        .attr("x1", node.x + xOffset1)
                                        .attr("y1", node.y + 10)
                                        .attr("x2", nextNode.x + (graphIndex - 1.5) * offset)
                                        .attr("y2", nextNode.y + 10)
                                        .style("stroke", linkStrength(avg))
                         
                                        .style("stroke-width", 1)
                                        .style("opacity", 0)
                                        .style("fill", "none");

                                    if (!nextNode.links) {
                                        nextNode.links = [];
                                    }
                                    if (!nextNode.relatedNodes) {
                                        nextNode.relatedNodes = [];
                                    }
                                    nextNode.links.push(path);
                                    nextNode.relatedNodes.push(node);
                                }
                            });
                        }


                    }
                    return;
                }
                else if (mode === 0) {
                    const avg = calculateAverage(node.features)

                    xOffset1 = (graphIndex - 2.5) * offset - 150;
                    xOffset2 = (graphIndex - 1.5) * offset - 30 * (graphIndex * 1.5);

                    if (graphIndex === 3) {
                        xOffset1 = (graphIndex - 2.5) * offset;

                    }



                    const nextLayer = graphs[graphIndex + 1];
                    if (nextLayer) {
                        let nextNode = nextLayer.nodes[0];

                        const controlX1 = node.x + xOffset1 + (nextNode.x + xOffset2 - node.x - xOffset1) * 0.3;
                        const controlY1 = node.y + 10;
                        const controlX2 = node.x + xOffset1 + (nextNode.x + xOffset2 - node.x - xOffset1) * 0.7;
                        const controlY2 = nextNode.y + 10;


                        const path = svg.append("path")
                            .attr("d", `M ${node.x + xOffset1} ${node.y + 10} Q ${controlX2} ${controlY2}, ${nextNode.x + xOffset2 - 20} ${nextNode.y + 10}`)
                            .style("stroke", linkStrength(avg))
                            .style("opacity", 0)
                            .style('stroke-width', 1)
                    
                            .style("fill", "none");


                        if (!nextNode.links) {
                            nextNode.links = [];
                        }
                        if (!nextNode.relatedNodes) {
                            nextNode.relatedNodes = [];
                        }
                        nextNode.links.push(path);
                        nextNode.relatedNodes.push(node);

                    }
                } else {
                    const avg = calculateAverage(node.features)



                    xOffset1 = (graphIndex - 3.5) * offset;
                    xOffset2 = (graphIndex - 2.5) * offset - 30 * (graphIndex * 1.5) + 100;



                    const nextLayer = graphs[graphIndex + 1];
                    if (nextLayer) {
                        let nextNode = nextLayer.nodes[0];

                        const controlX1 = node.x + xOffset1 + (nextNode.x + xOffset2 - node.x - xOffset1) * 0.3;
                        const controlY1 = node.y + 10;
                        const controlX2 = node.x + xOffset1 + (nextNode.x + xOffset2 - node.x - xOffset1) * 0.7;
                        const controlY2 = centerY + 20
                        if (isValidNode(subgraph, node)) {

                            const path = svg.append("path")
                                .attr("d", `M ${node.x + xOffset1} ${node.y + 10} Q ${controlX2} ${controlY2}, ${nextNode.x + xOffset2 - 20} ${centerY + 20}`)
                                .style("stroke", linkStrength(avg))
                
                                .style("opacity", 0)
                                .style('stroke-width', 1)
                                .style("fill", "none");


                            if (!nextNode.links) {
                                nextNode.links = [];
                            }
                            if (!nextNode.relatedNodes) {
                                nextNode.relatedNodes = [];
                            }
                            nextNode.links.push(path);
                            nextNode.relatedNodes.push(node);
                        }

                    }
                }
            }


        });

    });


}

export function generateRandomArray(n: number, min: number = 0, max: number = 100): number[] {
    let result: number[] = new Array(n);
    for (let i = 0; i < n; i++) {
        result[i] = (Math.random() * (max - min + 1)) + min;
    }
    return result;
}

export function deepClone(obj: any) {
    return JSON.parse(JSON.stringify(obj));
}

export async function process() {
    var data = await data_prep("./graphs/input_graph.json");

    return data;
}

export async function loadModel(modelPath: string) {
    let session: any;
    try {
        session = await ort.InferenceSession.create(modelPath, { executionProviders: ['wasm'] });

    } catch (error) {

    }
    return session;
}

export function softmax(logits: number[]) {
    // Find the maximum logit to improve numerical stability.
    const maxLogit = Math.max(...logits);

    // Compute the exponential of each logit, adjusted by the max logit for numerical stability.
    const expLogits = logits.map((logit) => Math.exp(logit - maxLogit));

    // Compute the sum of the exponentials.
    const sumExpLogits = expLogits.reduce((acc, val) => acc + val, 0);

    // Divide each exponential by the sum of exponentials to get the probabilities.
    const probabilities = expLogits.map((expLogit) => expLogit / sumExpLogits);

    return probabilities;
}

export function analyzeGraph(graphData: any) {
    const nodeCount = graphData.x.length;
    const edgePairs = graphData.edge_index;
    let edges = edgePairs[0].length;
    const degreeMap = new Array(nodeCount).fill(0);
    const hasLoop = new Set();
    let isDirected = false;

    for (let i = 0; i < edges; i++) {
        const source = edgePairs[0][i];
        const target = edgePairs[1][i];

        degreeMap[source]++;
        degreeMap[target]++;

        if (source === target) {
            hasLoop.add(source);
        }

        if (
            (!isDirected && !edgePairs[1].includes(source)) ||
            !edgePairs[0].includes(target)
        ) {
            isDirected = true;
        }
    }

    const totalDegree = degreeMap.reduce((acc, degree) => acc + degree, 0);
    const averageDegree = totalDegree / nodeCount;
    const hasIsolatedNode = degreeMap.some((degree) => degree === 0);




    if (isDirected) {
        edges *= 2;
    }



    return {
        node_count: nodeCount,
        edge_count: edges,
        avg_node_degree: averageDegree,
        has_isolated_node: hasIsolatedNode,
        has_loop: hasLoop.size > 0,
        is_directed: isDirected,
    };
}

export const graphPrediction = async (
    modelPath: string, 
    graphPath: string, 
    simGraphData:any, 
    sandBoxMode: boolean
) => {

    console.log("graph pred pipe modelPath", modelPath, graphPath);

    const session = await loadModel(modelPath);
    let graphData: IGraphData = simGraphData;
    if(!sandBoxMode)graphData = await load_json(graphPath);

    console.log("check graphData in pred engine", graphData, sandBoxMode);

    // Convert `graphData` to tensor-like object expected by your ONNX model
    const xTensor = new ort.Tensor(
        "float32",
        new Float32Array(graphData.x.flat()),
        [graphData.x.length, graphData.x[0].length]
    );

   console.log("graph pred pipe", graphData.edge_index.length, graphData.edge_index[0].length, session.inputNames);

    let edgeIndexTensor:any = new ort.Tensor(
        "int64",
        new BigInt64Array(graphData.edge_index.flat().map(BigInt)),
        [graphData.edge_index.length, graphData.edge_index[0].length]
    );

if(!sandBoxMode){
    edgeIndexTensor = new ort.Tensor(
        "int32",
        new Int32Array(graphData.edge_index.flat()),
        [graphData.edge_index.length, graphData.edge_index[0].length]
    );
}

    console.log("graph pred pipe edgeIndexTensor", edgeIndexTensor);

    let batchTensor:any = new ort.Tensor(
    "int64",
    new BigInt64Array(graphData.batch.map(BigInt)),
    [graphData.batch.length]
);
if(!sandBoxMode){
    batchTensor = new ort.Tensor(
        "int32",
        new Int32Array(graphData.batch),
        [graphData.batch.length]
    );
}

    const outputMap = await session.run({
        x: xTensor,
        edge_index: edgeIndexTensor,
        batch: batchTensor,
    });
    const outputTensor = outputMap.final;


    const prob = softmax(outputTensor.cpuData);
    const intmData: IntmData = {
        conv1: outputMap.conv1.cpuData,
        conv2: outputMap.conv2.cpuData,
        conv3: outputMap.conv3.cpuData,
        pooling: outputMap.pooling.cpuData,
        dropout: outputMap.dropout.cpuData,
        final: outputTensor.cpuData
    };

    return { prob, intmData };
}



export const linkPrediction = async (modelPath: string, graphPath: string) => {

    console.log("pred pipe modelPath", modelPath, graphPath);

    const session = await loadModel(modelPath);
    const graphData: IGraphData = await load_json(graphPath);

    console.log("pred pipe graphData", graphData, session);

    // Convert `graphData` to tensor-like object expected by your ONNX model
    const xTensor = new ort.Tensor(
        "float32",
        new Float32Array(graphData.x.flat()),
        [graphData.x.length, graphData.x[0].length]
    );
const batchTensor = new ort.Tensor(
    "int64",
    new BigInt64Array(graphData.batch.map(BigInt)),
    [graphData.batch.length] // 一维，形如 [14]
);

    let int32Array = new Int32Array(
        graphData["edge_index"].flat()
    );
    let bigInt64Array = new BigInt64Array(
        int32Array.length
    );
    for (let i = 0; i < int32Array.length; i++) {
        bigInt64Array[i] = BigInt(int32Array[i]);
    }

    console.log("pred pipe", graphData)

    const edgeIndexTensor = new ort.Tensor(
        "int64",
        bigInt64Array,
        [
            graphData.edge_index.length,
            graphData.edge_index[0].length,
        ]
    );

    console.log("edgeIndexTensor", edgeIndexTensor);

    const outputMap = await session.run({
        x: xTensor,
        edge_index: edgeIndexTensor,
        edge_label_index: edgeIndexTensor,
    //    batch: batchTensor
    });

    let conv1 = [];
    let conv2 = [];

    if (modelPath === "./gat_link_model.onnx") {
        conv1 = outputMap.gat1.cpuData;
        conv2 = outputMap.gat2.cpuData;
        console.log("gat model", conv1, conv2);
    } else if (modelPath === "./sage_link_model.onnx") {
        conv1 = outputMap.sage1.cpuData;
        conv2 = outputMap.sage2.cpuData;
        console.log("sage model", conv1, conv2);
    } else {
        conv1 = outputMap.conv1.cpuData;
        conv2 = outputMap.conv2.cpuData;
    }

    const intmData: IntmDataLink = {
        conv1: conv1,
        conv2: conv2,
        decode_mul: outputMap.decode_mul.cpuData,
        decode_sum: outputMap.decode_sum.cpuData,
        prob_adj: outputMap.prob_adj.cpuData,
        decode_all_final: outputMap.decode_all_final.cpuData,
    };

    const prob = outputMap.prob_adj.cpuData;

    console.log("predicted!", intmData, modelPath);

    const data = dataPreparationLinkPred(intmData);

    const features = graphData.x;


    console.log("data!", data);

    const mat = graphToMatrix(graphData);

    const computationalGraph = constructComputationalGraph(
        graphData, features, data.conv1Data, data.conv2Data, 0
    );
    const nodesNeedConstruct = computationalGraph.getNodesAtHopLevel(2);
    const subgraph = extractSubgraph(mat, nodesNeedConstruct)

    console.log("subgraph", subgraph);
    console.log("computationalGraph", computationalGraph);

    return { prob, intmData };

}

function splitArray(arr: number[], chunkSize: number): number[][] {
    const chunks: number[][] = [];
    for (let i = 0; i < arr.length; i += chunkSize) {
        chunks.push(arr.slice(i, i + chunkSize));
    }
    return chunks;
}

type PredictionResult = {
    prob: number[] | number[][],
    intmData: IntmData | IntmDataNode
};

export const nodePrediction = async (
    modelPath: string, 
    graphPath: string,
    simGraphData: any,
    sandBoxMode: boolean
): Promise<PredictionResult> => {

    console.log("node pred pipe modelPath", modelPath, graphPath, simGraphData);

    const session = await loadModel(modelPath);
    let graphData: IGraphData = simGraphData;
    if(!sandBoxMode)graphData = await load_json(graphPath);



    // Convert `graphData` to tensor-like object expected by your ONNX model
    const xTensor = new ort.Tensor(
        "float32",
        new Float32Array(graphData.x.flat()),
        [graphData.x.length, graphData.x[0].length]
    );

    let int32Array = new Int32Array(
        graphData["edge_index"].flat()
    );
    let bigInt64Array = new BigInt64Array(
        int32Array.length
    );
    for (let i = 0; i < int32Array.length; i++) {
        bigInt64Array[i] = BigInt(int32Array[i]);
    }
    let edgeIndexTensor = new ort.Tensor(
        "int64",
        new BigInt64Array(graphData.edge_index.flat().map(BigInt)),
        [graphData.edge_index.length, graphData.edge_index[0].length]
    );

    if(!sandBoxMode){
        
    }

    const batchTensor = new ort.Tensor(
        "int64",
        new BigInt64Array(graphData.batch.map(BigInt)),
        [graphData.batch.length]
    );

console.log("model-output", session);
    const outputMap = await session.run({
        x: xTensor,
        edge_index: edgeIndexTensor
    });
    console.log("model-input", session.inputNames); 
    const outputTensor = outputMap.final;

    const resultArray: number[][] = splitArray(outputTensor.cpuData, 4);

    let prob: number[][] = [];

    for (let i = 0; i < resultArray.length; i++) {
        prob.push(softmax(resultArray[i]));
    }

    const intmData: IntmDataNode = {
        conv1: outputMap.conv1.cpuData,
        conv2: outputMap.conv2.cpuData,
        conv3: outputMap.conv3.cpuData,
        final: outputTensor.cpuData,
        result: prob
    };



    return { prob, intmData };

}

export function graphToAdjList(graph: any, addingSelfLoop = true) {
    console.log("graphToAdjList", graph, addingSelfLoop);
    let adjList: number[][] = Array.from({ length: graph.length }, () => []);
    for (let i = 0; i < graph.length; i++) {
        //push itself to the linkMap
        if (addingSelfLoop) adjList[i].push(i);
        for (let j = 0; j < graph[0].length; j++) {
            if (graph[i][j] == 1) {
                //push its neighbors to linkMap
                adjList[i].push(j);
            }
        }
    }
    return adjList;
}


export function rotateMatrixCounterClockwise(matrix: number[][]): number[][] {
    const n = matrix.length;
    const rotatedMatrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            rotatedMatrix[n - 1 - j][i] = matrix[i][j];
        }
    }

    return rotatedMatrix;
}

export function loadNodesLocation(mode: number, path: string) {


    let data;
    if (mode === 0) {
        if (path === "0") data = require("../../public/json_data/node_location/nodes_data0.json");

        if (path === "1") data = require("../../public/json_data/node_location/nodes_data1.json");

        if (path === "2") data = require("../../public/json_data/node_location/nodes_data2.json");
    }
    if (mode === 1) {
        data = require("../../public/json_data/node_location/nodes_data_karate.json");

    }
// return require("../../public/json_data/node_location/nodes_data0.json");
   return data;
}

export function fetchSubGraphNodeLocation(index: number, innerComputationMode: string) {

    let data;
    if (innerComputationMode === "GAT" || innerComputationMode === "GCN") {
        data = require("../../public/json_data/node_location/subGraphList.json")
      } else {
        data = require("../../public/json_data/node_location/subMidGraphList.json")
      }
    data = require("../../public/json_data/node_location/subMidGraphList.json")

    return data[index]; //784
}





import {
    deepClone,
    drawPoints,
    get_cood_from_parent,
    get_coordination,
    myColor
} from "./utils";
import * as d3 from "d3";

export function drawHintLabel(
    g: any,
    x: number,
    y: number,
    text: string,
    classTag: string,
    textSize: string = "17px"
) {
    const label = g.append("text")
        .attr("x", x)
        .attr("y", y)
        .text(text)
        .style("fill", "gray")
        .style("font-size", textSize)
        .attr("class", classTag);
    return label;
}


export function drawScoreE(g: any, x: number, y: number, leftIndex: number, rightIndex: number) {
    const e = g.append("text")
        .attr("x", x)
        .attr("y", y)
        .text(`exp(e(${leftIndex},${rightIndex}))`)
        .style("fill", "black")
        .style("font-size", 10)
        .attr("class", "procVis attn-displayer");
    return e;
}

export function drawEqComponentLabel(
    eDisplayer: any,
    x: number,
    y: number,
    text: string
) {
    eDisplayer.append("text")
        .text(text)
        .attr("x", x)
        .attr("y", y)
        .attr("class", "temp")
        .style("fill", "gray")
        .style("font-size", 3);
}


//get node attributes from graph data
export function getNodeAttributes(data: any) {
    let nodeAttrs = [];
    for (let i = 0; i < data.x.length; i++) {
        const idx = data.x[i].findIndex((element: number) => element === 1);

        let attr = "C";
        switch (idx) {
            case 1:
                attr = "N";
                break;
            case 2:
                attr = "O";
                break;
            case 3:
                attr = "F";
                break;
            case 4:
                attr = "I";
                break;
            case 5:
                attr = "Cl";
                break;
            case 6:
                attr = "Br";
                break;
        }
        nodeAttrs.push(attr);
    }
    return nodeAttrs;
}

//draw node attributes on the matrix
export function drawNodeAttributes(nodeAttrs: string[], graph: any, offset: number) {
    //visualize node attributes
    const textCood = get_cood_from_parent(".y-axis", "text");

    //drawPoints(".mats", "red", textCood);
    //get the node attr as an array


    d3.select(".mats")
        .append("g")
        .attr("class", "node-attrs-x")
        .selectAll("text.node-attr-x")
        .data(nodeAttrs)
        .enter()
        .append("text")
        .attr("class", "node-attr-x")
        .attr("x", (_, i) => textCood[i][0] + 20)
        .attr("y", (_, i) => textCood[i][1] + 22.5 + offset)
        .attr("font-size", "10px")
        .text(d => d);

    //for x-axis
    const rectCood = get_cood_from_parent(".mats", "rect");

    // console.log("rectCoord", rectCood);

    const step = graph.length;
    let xTextCood = [];
    for (let i = step - 1; i < graph.length * graph.length; i += step) {
        xTextCood.push(rectCood[i]);
    }

    d3.select(".mats")
        .append("g")
        .attr("class", "node-attrs-y")
        .selectAll("text.node-attr-y")
        .data(nodeAttrs)
        .enter()
        .append("text")
        .attr("class", "node-attr-y")
        .attr("x", (_, i) => xTextCood[i][0] - 2.5)
        .attr("y", (_, i) => xTextCood[i][1] + 75)
        .attr("font-size", "10px")
        .attr('text-anchor', (d, i) => d.toString().length > 1 ? 'end' : 'middle')
        .attr("transform", (d, i) => d.toString().length > 1 ? `rotate(-40, ${xTextCood[i][0] - 20}, ${xTextCood[i][1] + 62})` : '')
        .text(d => d);
    //drawPoints(".mats", "red", rectCood);
    // console.log("rectCoord", rectCood);
}

export interface HeatmapData {
    group: string;
    variable: string;
    value: number;
}

export function get_cood_locations(data: any, locations: any) {
    const nCol = Math.sqrt(data.length);
    const cood = get_cood_from_parent(".y-axis", "text");
    //here's the data processing for getting locations
    const cood1 = get_cood_from_parent(".mats", "rect");
    const currMat = cood1.slice(-(nCol * nCol));
    const sliced = currMat.slice(-nCol);
    locations = locations.concat(sliced);
    return locations;
}

//add layer name to the SVG
export function addLayerName(
    locations: any,
    name: string,
    xOffset: number,
    yOffset: number,
    layer: any
) {
    const apt = deepClone(locations[locations.length - 1]);
    apt[0] += xOffset;
    apt[1] += yOffset;
    //drawPoints(".mats","red", [apt]);
    layer
        .append("text")
        .text(name)
        .attr("x", apt[0])
        .attr("y", apt[1] + 15).attr("class", "layerName")
        .attr("font-size", "15px")
        .attr("font-weight", "normal")
        .attr('opacity', 0.5);
}

//draw a legend for a binary output layer
export function buildBinaryLegend(
    myColor: any,
    val1: number,
    val2: number,
    label: string,
    x: number,
    y: number,
    layer: any
) {
    layer.selectAll(".binary-legend").remove();

    let dummies = [val1, val2];

    const g0 = layer
        .append("g")
        .attr("class", "binary-legend")
        .attr("transform", `translate(${x}, ${y}) scale(0.7)`);



    g0.selectAll(".rect")
        .data(dummies)
        .enter()
        .append("rect")
        .attr("width", 10)
        .attr("height", 10)
        .attr("x", (d: number, i: number) => i * 10)
        .attr("y", 0)
        .style("fill", (d: number) => myColor(d))
        .style("stroke-width", 1)
        .style("stroke", "grey")
        .style("opacity", 0.8);

    const offsetText = 10;
    const format = d3.format(".2f");

    g0.selectAll(".label")
        .data(dummies)
        .enter()
        .append("text")
        .attr("x", (d: number, i: number) => i * offsetText - 20)
        .attr("y", 5)
        .attr("text-anchor", "end")
        .attr(
            "transform",
            (d: number, i: number) => `rotate(-90, ${i * offsetText}, 0)`
        )
        .style("font-size", "7px").style("fill", "gray")
        .text((d: number, i: number) => {
            return format(d)
        });

    // g0.append("text")
    //     .text(label)
    //     .attr("x", 10)
    //     .attr("y", 50)
    //     .attr("text-anchor", "center")
    //     .attr("font-size", 7.5);

    // const hint:any = drawHintLabel(g0, -50, 65, label, "", "17px");
    // hint.attr("text-anchor", "center");
    return g0.node() as SVGElement;
}

//draw a legend for regular color scheme
export function buildLegend(
    myColor: any,
    absVal: number,
    label: string,
    x: number,
    y: number,
    layer: any
) {
    layer.selectAll(".legend").remove();
    let dummies = [];
    absVal = Math.ceil(absVal * 10) / 10;
    let step = absVal / 10;
    for (let i = -absVal; i <= absVal + 0.1; i += step) {
        dummies.push(i);
    }

    const g0 = layer
        .append("g")
        .attr("transform", `translate(${x}, ${y}) scale(0.7)`)
        .attr("class", "");



    g0.selectAll(".rect")
        .data(dummies)
        .enter()
        .append("rect")
        .attr("width", 10)
        .attr("height", 10)
        .attr("x", (d: number, i: number) => i * 10)
        .attr("y", 0)
        .style("fill", (d: number) => myColor(d))
        .style("stroke-width", 1)
        .style("stroke", "grey")
        .style("opacity", 0.8);

    const offsetText = 10;
    const format = d3.format(".2f");

    g0.selectAll(".label")
        .data(dummies)
        .enter()
        .append("text")
        .attr("x", (d: number, i: number) => i * offsetText - 20)
        .attr("y", 5)
        .attr("text-anchor", "end")
        .attr(
            "transform",
            (d: number, i: number) => `rotate(-90, ${i * offsetText}, 0)`
        )
        .style("font-size", "17px").style("fill", "gray")
        .text((d: number, i: number) => {
            if (i == 0 || i == dummies.length - 1 || format(d) == "0.00") return format(d)
        });

    // g0.append("text")
    //     .text(label)
    //     .attr("x", absVal * 10)
    //     .attr("y", 50)
    //     .attr("text-anchor", "center")
    //     .attr("font-size", 7.5);

    // const hint = drawHintLabel(g0, absVal * 10, 65, label, "", "17px");
    // hint.attr("text-anchor", "center");
    return g0.node() as SVGElement;
}

//the function that helps you to translate layers
export function translateLayers(layerID: number, gap: number) {
    for (let i = layerID + 1; i < 7; i++) {
        // select layer
        d3.select(`g#layerNum_${i}`).attr("transform", function () {
            // get current transformation
            let currentTransform = d3.select(this).attr("transform");

            if (!currentTransform) {
                currentTransform = "translate(0, 0)";
            }

            let translateMatch = currentTransform.match(/translate\(([^)]+)\)/);
            // do the translation
            if (translateMatch) {
                let translate = translateMatch[1].split(",");
                let x = parseFloat(translate[0]);
                let y = parseFloat(translate[1]);

                x += gap;

                return `translate(${x}, ${y})`;
            } else {
                return `translate(${gap}, 0)`;
            }
        });
    }
}

export function calculatePrevFeatureVisPos(
    featureVisTable: any,
    layerID: number,
    node: number,
    featureChannels: number,
    oFeatureChannels: number,
    rectW: number,
    oRectW: number
) {
    let coord = get_coordination(featureVisTable[layerID][node]);
    //minor position adjustment
    if (layerID == 0) {
        coord[0] += oFeatureChannels * (oRectW / 2);
    } else {
        coord[0] += (featureChannels * rectW / 2);
    }
    coord[1] += 10;

    return coord;
}

export function loadNodeWeights() {
    // weights data preparation
    let weights: any = []; // DS to manage weights for each layer
    let bias: any = []; // DS to manage bias for each layer

    const weightsJSON: any = require("../../public/node_weights.json");



   weights = [
        weightsJSON["onnx::MatMul_271"],
        weightsJSON["onnx::MatMul_274"],
        weightsJSON["onnx::MatMul_277"],
        weightsJSON["classifier.weight"],
    ];
    bias = [
        weightsJSON["conv1.bias"],
        weightsJSON["conv2.bias"],
        weightsJSON["conv3.bias"],
        weightsJSON["classifier.bias"],
    ];

    return { weights: weights, bias: bias };
}

export function loadSimulatedModelWeights(type: string = "graph") {
    // weights data preparation
    let weights: any = []; // DS to manage weights for each layer
    let bias: any = []; // DS to manage bias for each layer

    let weightsJSON: any = require("../../public/simulations/simulated_gcn_graph_model_weights.json");
    if(type == "node") {
        weightsJSON = require("../../public/simulations/simulated_gcn_node_model_weights.json");
    }

    weights = [
        weightsJSON["conv1.lin.weight"],
        weightsJSON["conv2.lin.weight"],
        weightsJSON["conv3.lin.weight"],
        weightsJSON["lin.weight"],
    ];
    bias = [
        weightsJSON["conv1.bias"],
        weightsJSON["conv2.bias"],
        weightsJSON["conv3.bias"],
        weightsJSON["lin.bias"],
    ];

    return { weights: weights, bias: bias };
}

export function loadLinkWeights() {
    // weights data preparation
    let weights: any = []; // DS to manage weights for each layer
    let bias: any = []; // DS to manage bias for each layer

    const weightsJSON: any = require("../../public/link_weights.json");



    weights = [
        weightsJSON["onnx::MatMul_196"],
        weightsJSON["onnx::MatMul_199"]
    ];
    bias = [
        weightsJSON["conv1.bias"],
        weightsJSON["conv2.bias"]
    ];

    return { weights: weights, bias: bias };
}


export function loadLinkGATWeights() {
    // weights data preparation
    let weights: any = []; // DS to manage weights for each layer
    let bias: any = []; // DS to manage bias for each layer

    const weightsJSON: any = require("../../public/gat_link_weights.json");

    weights = [
        weightsJSON["onnx::MatMul_196"],
        weightsJSON["onnx::MatMul_199"]
    ];
    bias = [
        weightsJSON["conv1.bias"],
        weightsJSON["conv2.bias"]
    ];

    return { weights: weights, bias: bias };
}

export function loadWeights() {
    // weights data preparation
    let weights: any = []; // DS to manage weights for each layer
    let bias: any = []; // DS to manage bias for each layer

    const weightsJSON: any = require("../../public/weights.json");

    weights = [
        weightsJSON["onnx::MatMul_311"],
        weightsJSON["onnx::MatMul_314"],
        weightsJSON["onnx::MatMul_317"],
        weightsJSON["lin.weight"],
    ];
    bias = [
        weightsJSON["conv1.bias"],
        weightsJSON["conv2.bias"],
        weightsJSON["conv3.bias"],
        weightsJSON["lin.bias"],
    ];

    return { weights: weights, bias: bias };
}

export function drawMatrixValid(matrix: number[][], x: number, y: number, w: number, h: number) {
    for (let i = 0; i < matrix.length; i++) {
        for (let j = 0; j < matrix[i].length; j++) {
            d3.select(".mats")
                .append("rect")
                .attr("x", x + j * w)
                .attr("y", y + i * h)
                .attr("width", w)
                .attr("height", h)
                .style("fill", myColor(matrix[i][j]))
                .attr("class", "procVis");
        }
    }
}

export function rotateMatrix(matrix: number[][]): number[][] {
    const n = matrix.length;
    const rotatedMatrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            rotatedMatrix[j][n - 1 - i] = matrix[i][j];
        }
    }

    return rotatedMatrix;
}

export function rotateAnyMatrix(matrix: number[][]): number[][] {
    const m = matrix.length;
    if (m === 0) return [];

    const n = matrix[0].length;

    if (!matrix.every(row => row.length === n)) {
        throw new Error("All rows must have the same number of columns");
    }

    const rotated: number[][] = Array.from({ length: n }, () => Array(m));

    for (let i = 0; i < m; i++) {
        for (let j = 0; j < n; j++) {
            rotated[j][m - 1 - i] = matrix[i][j];
        }
    }

    return rotated;
}



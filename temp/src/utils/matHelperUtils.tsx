import {
    deepClone,
    drawPoints,
    get_cood_from_parent,
    get_coordination
} from "./utils";
import * as d3 from "d3";

//get node attributes from graph data
export function getNodeAttributes(data: any) {
    let nodeAttrs = [];
    for (let i = 0; i < data.x.length; i++) {
        const idx = data.x[i].findIndex((element: number) => element === 1);
        console.log("attr", i, idx);
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
export function drawNodeAttributes(nodeAttrs: any, graph: any) {
    //visualize node attributes
    const textCood = get_cood_from_parent(".y-axis", "text");
    console.log("textCood", textCood);
    //drawPoints(".mats", "red", textCood);
    //get the node attr as an array

    //for y-axis
    for (let i = 0; i < textCood.length; i++) {
        d3.select(".mats")
            .append("text")
            .attr("x", textCood[i][0] + 20)
            .attr("y", textCood[i][1] + 22.5)
            .attr("font-size", "10px")
            .text(nodeAttrs[i]);
    }
    //for x-axis
    const rectCood = get_cood_from_parent(".mats", "rect");
    console.log("rectCood", rectCood);
    const step = graph.length;
    let xTextCood = [];
    for (let i = step - 1; i < graph.length * graph.length; i += step) {
        xTextCood.push(rectCood[i]);
    }
    console.log("xTextCood", xTextCood);
    //drawPoints(".mats", "red", xTextCood);
    for (let i = 0; i < xTextCood.length; i++) {
        d3.select(".mats")
            .append("text")
            .attr("x", xTextCood[i][0] - 2.5)
            .attr("y", xTextCood[i][1] + 60)
            .attr("font-size", "10px")
            .text(nodeAttrs[i]);
    }
}

export interface HeatmapData {
    group: string;
    variable: string;
    value: number;
}

export function get_cood_locations(data: any, locations: any) {
    console.log("DATA", Math.sqrt(data.length));
    const nCol = Math.sqrt(data.length);
    //here's the data processing for getting locations
    const cood1 = get_cood_from_parent(".mats", "rect");
    const currMat = cood1.slice(-(nCol * nCol));
    const sliced = currMat.slice(-nCol);
    locations = locations.concat(sliced);
    console.log("LOCATIONS", locations);
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
        .attr("y", apt[1])
        .style("font-size", 7);
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

    console.log("Dummies", dummies);

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
        .style("font-size", "5px")
        .text((d: number) => format(d));

    g0.append("text")
        .text(label)
        .attr("x", 10)
        .attr("y", 50)
        .attr("text-anchor", "center")
        .attr("font-size", 7.5);

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
        .attr("class", "legend");

    console.log("Dummies", dummies);

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
        .style("font-size", "5px")
        .text((d: number) => format(d));

    g0.append("text")
        .text(label)
        .attr("x", absVal * 10)
        .attr("y", 50)
        .attr("text-anchor", "center")
        .attr("font-size", 7.5);

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
    node: number
) {
    let coord = get_coordination(featureVisTable[layerID][node]);
    //minor position adjustment
    if (layerID == 0) {
        coord[0] += 35 / 2;
    } else {
        coord[0] += 64;
    }
    coord[1] += 10;
    console.log("coord", coord);
    return coord;
}

export function loadWeights() {
    // weights data preparation
    let weights: any = []; // DS to manage weights for each layer
    let bias: any = []; // DS to manage bias for each layer

    const weightsJSON: any = require("../../public/weights.json");
    console.log("weightsJSON", weightsJSON);
    console.log("weights", weightsJSON["onnx::MatMul_311"]);

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
    console.log("weights array", weights, bias);
    return { weights: weights, bias: bias };
}

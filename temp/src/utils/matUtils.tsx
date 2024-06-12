import { off } from "process";
import {
    deepClone,
    get_cood_from_parent,
    uniqueArray,
    get_category_node,
    drawPoints,
    softmax,
} from "./utils";
import * as d3 from "d3";
import { useEffect, useState } from "react";

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

// Three function that change the tooltip when user hover / move / leave a cell
export const mouseover = (event: MouseEvent, d: { value: number }) => {
    d3.select(event.currentTarget as HTMLElement)
        .style("stroke", "black")
        .style("opacity", 1);
};

export const mousemove = (event: MouseEvent, d: { value: number }) => {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
};

export const mouseleave = (event: MouseEvent, d: { value: number }) => {
    d3.select(event.currentTarget as HTMLElement)
        .style("stroke", "grey")
        .style("opacity", 0.8);
};

export function removeEffect(element: any) {
    d3.select(".matrix-tooltip").remove(); // 移除矩阵tooltip

    d3.select(element).style("fill", "black").style("font-weight", "normal");
}

export function get_cood_locations(data: any, locations: any) {
    console.log("DATA", Math.sqrt(data.length));
    const nCol = Math.sqrt(data.length);
    const cood = get_cood_from_parent(".y-axis", "text");
    //here's the data processing for getting locations
    const cood1 = get_cood_from_parent(".mats", "rect");
    const currMat = cood1.slice(-(nCol * nCol));
    const sliced = currMat.slice(-nCol);
    locations = locations.concat(sliced);
    console.log("LOCATIONS", locations);
    return locations;
}

function interactRowCol(
    xAxis: boolean,
    tooltipG: any,
    sqSize: number,
    gridNum: number
) {
    if (!xAxis) {
        tooltipG
            .append("rect")
            .attr("x", 0)
            .attr("y", -sqSize / 2)
            .attr("width", sqSize * gridNum + 2)
            .attr("height", sqSize)
            .attr("fill", "red")
            .attr("opacity", 1)
            .attr("stroke", "black")
            .attr("class", "tooltips")
            .attr("stroke-width", 0.1);
    } else {
        tooltipG
            .append("rect")
            .attr("x", -sqSize / 2)
            .attr("y", -sqSize * gridNum - 2)
            .attr("width", sqSize)
            .attr("height", sqSize * gridNum + 2)
            .attr("fill", "red")
            .attr("opacity", 1)
            .attr("stroke", "black")
            .attr("class", "tooltips")
            .attr("stroke-width", 0.1);
    }
}

export function tooltipBars64(
    target: any,
    i: number,
    conv1: any,
    conv2: any,
    conv3: any,
    final: any,
    matrixSize: number,
    tooltipG: any,
    cellSize: number,
    yOffset: number,
    myColor: any,
    gridNum: number,
    sqSize: number,
    xAxis: boolean
) {
    let t = d3.select(target).text();
    let num = Number(t);
    console.log("TEXT", t);

    //how to determine the layer?
    let layer = null;
    if (i == 1) {
        layer = conv1;
    } else if (i == 2) {
        layer = conv2;
    } else if (i == 3) {
        layer = conv3;
    } else if (i == 4) {
        layer = final;
    } else {
        layer = null;
    }
    if (layer != null) {
        let mat = layer[num];

        console.log("MAT", mat);

        let k = 0;

        for (let i = 0; i < matrixSize; i++) {
            for (let j = 0; j < matrixSize; j++) {
                let c: number = mat[i][j];
                tooltipG
                    .append("rect")
                    .attr("x", k * cellSize - 75 * cellSize)
                    .attr("y", yOffset * cellSize)
                    .attr("width", cellSize)
                    .attr("height", 20)
                    .attr("fill", myColor(c))
                    .attr("opacity", 1)
                    .attr("stroke", "black")
                    .attr("class", "tooltips")
                    .attr("stroke-width", 0.1);

                k++;
            }
        }
        interactRowCol(xAxis, tooltipG, sqSize, gridNum);
        d3.selectAll(".tooltips").raise();
    }
}

export function tooltipBars7(
    num: number,
    features: any,
    tooltipG: any,
    cellSize: number,
    yOffset: number,
    myColor: any,
    xAxis: boolean,
    sqSize: number,
    gridNum: number
) {
    let k = 0;
    for (let i = 0; i < 7; i++) {
        const cate = get_category_node(features[num]) * 100;
        console.log("CATE", cate);

        tooltipG
            .append("rect")
            .attr("x", k * cellSize - 5 * cellSize)
            .attr("y", yOffset * cellSize)
            .attr("width", cellSize)
            .attr("height", 20)
            .attr("class", "tooltips")
            .attr("fill", myColor(cate))
            .attr("opacity", 1)
            .attr("stroke", "black")
            .attr("stroke-width", 1);

        console.log("node feature", features[num]);
        k++;
    }
    interactRowCol(xAxis, tooltipG, sqSize, gridNum);
    d3.selectAll(".tooltips").raise();
}

export function featureTooltip(adjustedX: number, adjustedY: number) {
    const tooltipG = d3
        .select(".mats")
        .append("g")
        .attr("x", adjustedX)
        .attr("y", adjustedY)
        .raise();

    return tooltipG;
}

export function crossConnectionMatrices(
    graphs: any,
    locations: any,
    offsetMat: number
) {
    const cood1 = get_cood_from_parent(".mats", "rect");
    console.log("FINAL coord", cood1);
    if (graphs.length > 1) {
        //calculate the offset
        for (let i = 0; i < locations.length; i++) {
            locations[i][0] += 10;
            locations[i][1] += 10;
        }
        //drawPoints(".mats","red",locations);

        let olocations = deepClone(locations);

        //we also need to find another locations array
        for (let i = 0; i < locations.length; i++) {
            locations[i][0] += offsetMat - 15;
        }

        let plocation = deepClone(locations);

        //draw path one - one
        for (let i = 0; i < plocation.length - graphs[0].length; i++) {
            d3.select(".mats")
                .append("path")
                .attr("d", d3.line()([olocations[i], plocation[i]]))
                .attr("stroke", "black")
                .attr("opacity", 0.2)
                .attr("fill", "none");
        }

        //fdraw path one - multiple
        const drawGraph = graphs[0];
        for (let k = 0; k < 3; k++) {
            for (let i = 0; i < drawGraph.length; i++) {
                for (let j = 0; j < drawGraph[0].length; j++) {
                    if (drawGraph[i][j] == 1) {
                        d3.select(".mats")
                            .append("path")
                            .attr(
                                "d",
                                d3.line()([
                                    olocations[i + drawGraph.length * k],
                                    plocation[j + drawGraph.length * k],
                                ])
                            )
                            .attr("stroke", "black")
                            .attr("opacity", 0.2)
                            .attr("fill", "none");
                    }
                }
            }
        }
        d3.selectAll("path").lower();
    }
}

export function mouseoverEvent(
    element: any,
    target: any,
    i: number,
    conv1: any,
    conv2: any,
    conv3: any,
    final: any,
    features: any,
    myColor: any,
    offset: number,
    gridNum: number,
    sqSize: number,
    xAxis: boolean
) {
    console.log("ELEMENT", element);
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
    const adjustedY = cy + translate[1] - 10; // 上移10以放置于文本上方
    const cellSize = 5; // 每个格子的尺寸

    //-----------------interaction with text label and heatmap----------------------

    if (d3.select(target).attr("class") != "first") {
        // 创建一个8x8的矩阵tooltip
        const matrixSize = 8;

        const tooltipG = featureTooltip(adjustedX, adjustedY);
        // tooltipBars64(
        //     target,
        //     i,
        //     conv1,
        //     conv2,
        //     conv3,
        //     final,
        //     matrixSize,
        //     tooltipG,
        //     cellSize,
        //     offset,
        //     myColor,
        //     gridNum,
        //     sqSize,
        //     xAxis
        // );
    } else {
        const tooltipG = featureTooltip(adjustedX, adjustedY);
        // tooltipBars7(
        //     target,
        //     features,
        //     tooltipG,
        //     10,
        //     offset,
        //     myColor,
        //     xAxis,
        //     sqSize,
        //     gridNum
        // );
    }

    d3.select(element).style("fill", "red").style("font-weight", "bold");
}

function addLayerName(
    locations: any,
    name: string,
    xOffset: number,
    yOffset: number,
    layer:any
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

//find absolute max value in an 1d array
function findAbsMax(arr: number[]) {
    let max: number = Math.abs(Math.max(...arr));
    let min: number = Math.abs(Math.min(...arr));
    if (min > max) return min;
    return max;
}

function buildBinaryLegend(
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
        .attr("x", (d:number, i:number) => i * offsetText - 20)
        .attr("y", 5)
        .attr("text-anchor", "end")
        .attr("transform", (d:number, i:number) => `rotate(-90, ${i * offsetText}, 0)`)
        .style("font-size", "5px")
        .text((d:number) => format(d));

    g0.append("text")
        .text(label)
        .attr("x", 10)
        .attr("y", 50)
        .attr("text-anchor", "center")
        .attr("font-size", 7.5);

    return g0.node() as SVGElement;
}

function buildLegend(
    myColor: any,
    absVal: number,
    label: string,
    x: number,
    y: number,
    layer:any
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
        .attr("x", (d:number, i:number) => i * offsetText - 20)
        .attr("y", 5)
        .attr("text-anchor", "end")
        .attr("transform", (d:number, i:number) => `rotate(-90, ${i * offsetText}, 0)`)
        .style("font-size", "5px")
        .text((d:number) => format(d));

    g0.append("text")
        .text(label)
        .attr("x", absVal * 10)
        .attr("y", 50)
        .attr("text-anchor", "center")
        .attr("font-size", 7.5);

    return g0.node() as SVGElement;
}


function translateLayers(layerID:number, gap:number){
    for (let i = layerID + 1; i < 7; i++) {
        // 选择 layerNum 为 i 的组元素，并将其向右移动 500px
        d3.select(`g[layerNum="${i}"]`)
            .attr("transform", function() {
                // 获取当前的 transform 属性值
                let currentTransform = d3.select(this).attr("transform");
                
                // 如果 currentTransform 为 null 或 undefined，使用默认值
                if (!currentTransform) {
                    currentTransform = "translate(0, 0)";
                }
                
                // 解析出当前的 x, y 平移值
                let translateMatch = currentTransform.match(/translate\(([^)]+)\)/);
                if (translateMatch) {
                    let translate = translateMatch[1].split(",");
                    let x = parseFloat(translate[0]);
                    let y = parseFloat(translate[1]);
                    
                    // 将 x 值增加 500
                    x += gap;
                    
                    // 返回新的 transform 属性值
                    return `translate(${x}, ${y})`;
                } else {
                    // 如果解析失败，返回默认的 transform 属性值
                    return "translate(500, 0)";
                }
            });
    }
}


export function visualizeFeatures(
    locations: any,
    features: any,
    myColor: any,
    conv1: any,
    conv2: any,
    conv3: any,
    pooling: any,
    final: any,
    graph: any,
    adjList: any,
    maxVals: any,
    detailView:any,
    setDetailView:any
) {
    //table that manage color schemes
    let colorSchemesTable:SVGElement[] = [];
    //control detail view
    let dview = false;
    //control lock and unlock
    let lock = false;
    console.log("state", detailView);
    console.log("Received", maxVals);
    
    let colLocations = [];
    for(let i=0; i<graph.length; i++){
        const x = locations[0][0] - (300/graph.length) * i - (300/graph.length/2);
        const y = locations[0][1];
        colLocations.push([x, y]);
    }
    //drawPoints(".mats", "red", colLocations);
    let colFrames: SVGElement[] = []; //a
    for (let i = 0; i < colLocations.length; i++) {
        const r = d3
            .select(".mats")
            .append("rect")
            .attr("x", colLocations[i][0])
            .attr("y", colLocations[i][1]+3)
            .attr("height", 300)
            .attr("width", 300 / graph.length)
            .attr("fill", "none")
            .attr("opacity", 0)
            .attr("stroke", "black")
            .attr("stroke-width", 2)
            .attr("class", "colFrame");

        colFrames.push(r.node() as SVGElement);
    }
    colFrames.reverse();
    //draw frames on matrix
    let matFrames: SVGElement[] = []; //a
    for (let i = 0; i < locations.length; i++) {
        const r = d3
            .select(".mats")
            .append("rect")
            .attr("x", locations[i][0] - 300 + 300 / graph.length / 2)
            .attr("y", locations[i][1]+3)
            .attr("height", 300 / graph.length)
            .attr("width", 300)
            .attr("fill", "none")
            .attr("opacity", 0)
            .attr("stroke", "black")
            .attr("stroke-width", 2)
            .attr("class", "rowFrame");

        matFrames.push(r.node() as SVGElement);
    }
    console.log("matFrames", matFrames);
    //a data structure to store all feature vis information
    interface FrameDS {
        features: any[];
        GCNConv1: any[];
        GCNConv2: any[];
        GCNConv3: any[];
    }
    var frames: FrameDS = {
        features: [],
        GCNConv1: [],
        GCNConv2: [],
        GCNConv3: [],
    };
    var schemeLocations = [];
    //initial visualizer
    for (let i = 0; i < locations.length; i++) {
        locations[i][0] += 25;
        locations[i][1] += 2;
    }
    //draw cross connections for features layer and first GCNConv layer
    drawCrossConnection(graph, locations, 35, 102, 0);

    //using locations to find the positions for first feature visualizers
    const firstLayer = d3
    .select(".mats")
    .append("g")
    .attr("layerNum", 0);
    for (let i = 0; i < locations.length; i++) {
        const g = firstLayer.append("g")
            .attr("class", "oFeature")
            .attr("node", i)
            .attr("layerID", 0);

        for (let j = 0; j < 7; j++) {
            const fVis = g
                .append("rect")
                .attr("x", locations[i][0] + 5 * j)
                .attr("y", locations[i][1])
                .attr("width", 5)
                .attr("height", 10)
                .attr("fill", myColor(features[i][j]))
                .attr("opacity", 1)
                .attr("stroke", "gray")
                .attr("stroke-width", 0.1);
        }
        //draw frame
        const f = g
            .append("rect")
            .attr("x", locations[i][0])
            .attr("y", locations[i][1])
            .attr("width", 5 * 7)
            .attr("height", 10)
            .attr("fill", "none")
            .attr("opacity", 0)
            .attr("stroke", "black")
            .attr("stroke-width", 1)
            .attr("node", i)
            .attr("layerID", 0)
            .attr("class", "frame");
        frames["features"].push(f.node());

        //find last location
        if (i == locations.length - 1)
            schemeLocations.push([locations[i][0], 350]);

        //add mouse event
        g.on("mouseover", function (event, d) {
            //if not in the state of lock
            if(!lock){
                const layerID = d3.select(this).attr("layerID");
                const node = d3.select(this).attr("node");
                console.log("Current layerID and node", layerID, node);
                const fr = frames["features"][Number(node)];
                fr.style.opacity = "1";

                //matrix frame interaction
                const matf = matFrames[Number(node)];
                if (matf != null) {
                    matf.style.opacity = "1";
                }
            }
        });
        g.on("mouseout", function (event, d) {
            const layerID = d3.select(this).attr("layerID");
            const node = d3.select(this).attr("node");
            console.log("Current layerID and node", layerID, node);
            const fr = frames["features"][Number(node)];
            fr.style.opacity = "0";

            //matrix frame interaction
            const matf = matFrames[Number(node)];
            if (matf != null) {
                matf.style.opacity = "0";
            }
        });
    }
    //drawPoints(".mats", "red", schemeLocations);
    //add layer label for the first one
    
    addLayerName(locations, "Features Name", 0, 30, firstLayer);

    //GCNCov Visualizer
    let paths: any;
    const gcnFeatures = [conv1, conv2, conv3];
    console.log("gcnf", gcnFeatures);
    console.log("CONV1", conv1);
    for (let k = 0; k < 3; k++) {
        const layer = d3
        .select(".mats")
        .append("g")
        .attr("layerNum", k+1);
        for (let i = 0; i < locations.length; i++) {
            if (k != 0) {
                locations[i][0] += 2 * 64 + 100;
            } else {
                locations[i][0] += 7 * 2 + 100 + 25;
            }
        }
        let str = "[layerNum='"+(k+1)+"']";
        addLayerName(locations, "GCNConv" + (k + 1), 0, 30, d3.select(str));
        //drawPoints(".mats","red",locations);
        const gcnFeature = gcnFeatures[k];
        for (let i = 0; i < locations.length; i++) {
            //const cate = get_category_node(features[i]) * 100;
            const g = layer.append("g")
                .attr("class", "featureVis")
                .attr("node", i)
                .attr("layerID", k + 1);

            console.log("new", gcnFeature);

            //loop through each node
            let nodeMat = gcnFeature[i];
            console.log("nodeMat", i, nodeMat);
            for (let m = 0; m < nodeMat.length; m++) {
                g.append("rect")
                    .attr("x", locations[i][0] + 2 * m)
                    .attr("y", locations[i][1])
                    .attr("width", 2)
                    .attr("height", 10)
                    .attr("fill", myColor(nodeMat[m]))
                    .attr("opacity", 1)
                    .attr("stroke", "gray")
                    .attr("stroke-width", 0.1);
            }
            //draw frame
            const f = g
                .append("rect")
                .attr("x", locations[i][0])
                .attr("y", locations[i][1])
                .attr("width", 2 * 64)
                .attr("height", 10)
                .attr("fill", "none")
                .attr("opacity", 0)
                .attr("stroke", "black")
                .attr("stroke-width", 1)
                .attr("node", i)
                .attr("layerID", k + 1)
                .attr("class", "frame");
            //havent figure out how to optimize this code..
            if (k == 0) frames["GCNConv1"].push(f.node());
            if (k == 1) frames["GCNConv2"].push(f.node());
            if (k == 2) frames["GCNConv3"].push(f.node());
            //drawPoints(".mats", "red", locations);
            if (i == locations.length - 1) {
                schemeLocations.push([locations[i][0], 350]);
            }
        }

        if (k != 2) {
            // visualize cross connections btw 1st, 2nd, 3rd GCNConv
            paths = drawCrossConnection(graph, locations, 62 * 2, 102, k + 1);
            console.log("grouped grouped", paths);
        } else {
            //visualize pooling layer
            let one = drawPoolingVis(locations, pooling, myColor, frames);
            console.log("ONE", one);
            schemeLocations.push([one[0][0], 350]);
            //visualize last layer and softmax output
            let aOne = drawTwoLayers(one, final, myColor);
            console.log("AAA", aOne);
            if (aOne != undefined) {
                schemeLocations.push([aOne[0][0], 350]);
            }
            schemeLocations.push([aOne[1][0] - 20, 350]);
        }
        console.log("schemeLocations", schemeLocations);
        //drawPoints(".mats", "red", schemeLocations);
        //let max1 = findAbsMax(maxVals.conv1);
        let result = softmax(final);
        console.log("debug", schemeLocations);

        const l1 = d3.select("g[layerNum='1']");
        const l2 = d3.select("g[layerNum='2']");
        const l3 = d3.select("g[layerNum='3']");
        const l4 = d3.select("g[layerNum='4']");
        const l5 = d3.select("g[layerNum='5']");
        const l6 = d3.select("g[layerNum='6']");

        const scheme1  = buildBinaryLegend(
            myColor,
            0,
            1,
            "Features Color Scheme",
            schemeLocations[0][0],
            schemeLocations[0][1],
            firstLayer
        );
        const scheme2 = buildLegend(
            myColor,
            maxVals.conv1,
            "GCNConv1 Color Scheme",
            schemeLocations[1][0],
            schemeLocations[1][1],
            l1
        );
        const scheme3 = buildLegend(
            myColor,
            maxVals.conv2,
            "GCNConv2 Color Scheme",
            schemeLocations[1][0] + 230,
            schemeLocations[1][1],
            l2
        );
        const scheme4 = buildLegend(
            myColor,
            maxVals.conv3,
            "GCNConv3 Color Scheme",
            schemeLocations[1][0] + 230 * 2,
            schemeLocations[1][1],
            l3
        );
        const scheme5 = buildLegend(
            myColor,
            maxVals.pooling,
            "Pooling Color Scheme",
            schemeLocations[1][0] + 230 * 3,
            schemeLocations[1][1],
            l4
        );
        const scheme6 = buildBinaryLegend(
            myColor,
            final[0],
            final[1],
            "Model Output Color Scheme",
            schemeLocations[1][0] + 230 * 4,
            schemeLocations[1][1],
            l5
        );
        const scheme7 = buildBinaryLegend(
            myColor,
            result[0],
            result[1],
            "Result Color Scheme",
            schemeLocations[1][0] + 230 * 4.5,
            schemeLocations[1][1],
            l6
        );

        //test
        //scheme1.style.opacity = "0.2";

        colorSchemesTable = [scheme1, scheme2, scheme3, scheme4, scheme5, scheme6, scheme7];
        
        //colorSchemesTable[0].style.opacity = "0.1";
    }
    let recordLayerID:number = -1;
    d3.select(".mats").on("click", function(event, d){
        if (!d3.select(event.target).classed("featureVis")
            &&!d3.select(event.target).classed("pooling")
            &&!d3.select(event.target).classed("twoLayer")){
                dview=false;
                lock=false;
        }
        console.log("click!", dview, lock);
        //recover all feature visualizers and paths
        d3.select(".pooling").style("pointer-events", "auto").style("opacity", 1);
        d3.selectAll(".twoLayer").style("pointer-events", "auto").style("opacity",1);
        d3.selectAll("path").style("opacity", 0.05);
        //recover all frames
        d3.selectAll(".colFrame").style("opacity", 0);
        d3.selectAll(".rowFrame").style("opacity", 0);
        d3.selectAll(".frame").style("opacity", 0);
        //recover opacity of feature visualizers
        d3.selectAll(".featureVis").style("opacity", 1);
        d3.selectAll(".oFeature").style("opacity", 1);
        //recover layers positions
        if(recordLayerID>=0){
            translateLayers(recordLayerID, -500);
            recordLayerID = -1;
        }

        //recover color schemes opacity
        colorSchemesTable.forEach((d, i)=>{
            d.style.opacity = "1";
        })
    });
    d3.selectAll(".featureVis").on("click", function(event, d){
        //state
        lock = true;
        event.stopPropagation();
        dview = true;
        console.log("click! - fVis", dview, lock);
        //lock all feature visualizers and transparent paths
        d3.select(".pooling").style("pointer-events", "none").style("opacity", 0.2);
        d3.selectAll(".twoLayer").style("pointer-events", "none").style("opacity", 0.2);
        d3.selectAll("path").style("opacity", 0);
        //transparent other feature visualizers
        d3.selectAll(".featureVis").style("opacity", 0.2);
        d3.selectAll(".oFeature").style("opacity", 0.2);
        //translate each layer
        const layerID = Number(d3.select(this).attr("layerID")) - 1;
        const node = Number(d3.select(this).attr("node"));
        console.log("Current layerID and node", layerID, node);
        translateLayers(layerID, 500);

        //record the layerID
        recordLayerID = layerID;

        //reduce color schemes opacity
        console.log("CST before modification", colorSchemesTable);
        colorSchemesTable.forEach((d, i) => {
            console.log(`Before modification: Element ${i} opacity`, d.style.opacity);
            d.style.opacity = "0.2";
            console.log(`After modification: Element ${i} opacity`, d.style.opacity);
        });
        //choose the right color schemes to display
        colorSchemesTable[layerID].style.opacity = "1";
        colorSchemesTable[layerID+1].style.opacity = "1";
    });
    d3.selectAll(".featureVis").on("mouseover", function (event, d) {
        //if not in the state of lock
        if(!lock){
            //paths interactions
            const layerID = Number(d3.select(this).attr("layerID")) - 1;
            const node = Number(d3.select(this).attr("node"));
            console.log("Current layerID and node", layerID, node);
            if (paths != null) {
                console.log("grouped", paths[layerID][node]);
                const changePaths = paths[layerID][node];
                changePaths.forEach((div: HTMLElement) => {
                    div.style.opacity = "1";
                });
            }
            //feature vis interactions
            //feature self interaction
            let fr: any = null;
            if (layerID == 0) fr = frames["GCNConv1"][node];
            else if (layerID == 1) fr = frames["GCNConv2"][node];
            else fr = frames["GCNConv3"][node];
            if (fr != null) {
                fr.style.opacity = "1";
            }

            //frame interactions
            let prevVis = adjList[node];
            let prevLayer: any = null;

            if (Number(layerID) == 0) prevLayer = frames["features"];
            else if (Number(layerID) == 1) prevLayer = frames["GCNConv1"];
            else if (Number(layerID) == 2) prevLayer = frames["GCNConv2"];
            console.log("prev", layerID, prevVis, prevLayer);
            if (prevLayer != null) {
                prevVis.forEach((vis: number) => {
                    prevLayer[vis].style.opacity = "1";
                });
            }

            //matrix frame interaction
            if (matFrames != null) {
                prevVis.forEach((vis: number) => {
                    if (vis == node && matFrames[vis]) {
                        // matFrames[vis].style.fill = "yellow";
                        // matFrames[vis].style.opacity = "0.5";
                    } else {
                        //matFrames[vis].style.fill = "blue";
                        matFrames[vis].style.opacity = "1";
                    }
                });
            }

            if(colFrames!=null){
                colFrames[node].style.opacity = "1";
            }
        }
    });
    d3.selectAll(".featureVis").on("mouseout", function (event, d) {
        if(!lock){
            const layerID = Number(d3.select(this).attr("layerID")) - 1;
            const node = Number(d3.select(this).attr("node"));
            console.log("Current layerID and node", layerID, node);
            //paths interactions
            if (paths != null) {
                console.log("grouped", paths[layerID][node]);
                const changePaths = paths[layerID][node];
                changePaths.forEach((div: HTMLElement) => {
                    div.style.opacity = "0.05";
                });
            }
            //feature self interaction
            let fr: any = null;
            if (layerID == 0) fr = frames["GCNConv1"][node];
            else if (layerID == 1) fr = frames["GCNConv2"][node];
            else fr = frames["GCNConv3"][node];
            if (fr != null) {
                fr.style.opacity = "0";
            }

            //frame interactions
            let prevVis = adjList[node];
            let prevLayer: any = null;

            if (Number(layerID) == 0) prevLayer = frames["features"];
            else if (Number(layerID) == 1) prevLayer = frames["GCNConv1"];
            else if (Number(layerID) == 2) prevLayer = frames["GCNConv2"];
            console.log("prev", layerID, prevVis, prevLayer);
            if (prevLayer != null) {
                prevVis.forEach((vis: number) => {
                    prevLayer[vis].style.opacity = "0";
                });
            }

            //matrix frame interaction
            if (matFrames != null) {
                prevVis.forEach((vis: number) => {
                    if (matFrames[vis]) {
                        matFrames[vis].style.opacity = "0";
                    }
                });
            }

            if(colFrames!=null){
                colFrames[node].style.opacity = "0";
            }
        }
    });
}

function drawCrossConnection(
    graph: any,
    locations: any,
    firstVisSize: number,
    gapSize: number,
    layerID: number
) {
    console.log("layerID", layerID);
    let alocations = deepClone(locations);
    for (let i = 0; i < alocations.length; i++) {
        alocations[i][0] += firstVisSize;
        alocations[i][1] += 5;
    }
    let blocations = deepClone(alocations);
    for (let i = 0; i < blocations.length; i++) {
        blocations[i][0] += gapSize;
    }
    console.log("location length", alocations.length);
    //draw one-one paths
    for (let i = 0; i < alocations.length; i++) {
        d3.select(".mats")
            .append("path")
            .attr("d", d3.line()([alocations[i], blocations[i]]))
            .attr("stroke", "black")
            .attr("opacity", 0.05)
            .attr("fill", "none")
            .attr("endingNode", i)
            .attr("layerID", layerID);
    }
    //draw one-multiple paths - three
    let pts: number[][] = [];
    const curve = d3.line().curve(d3.curveBasis);
    for (let i = 0; i < graph.length; i++) {
        for (let j = 0; j < graph[0].length; j++) {
            if (graph[i][j] == 1) {
                const res = computeMids(alocations[i], blocations[j]);
                const hpoint = res[0];
                const lpoint = res[1];
                console.log("control points", hpoint, lpoint);
                d3.select(".mats")
                    .append("path")
                    .attr(
                        "d",
                        curve([alocations[i], hpoint, lpoint, blocations[j]])
                    )
                    .attr("stroke", "black")
                    .attr("opacity", 0.05)
                    .attr("fill", "none")
                    .attr("endingNode", j)
                    .attr("layerID", layerID);
                pts.push(hpoint);
                pts.push(lpoint);
                console.log(
                    "odata",
                    alocations[i],
                    blocations[i],
                    "low",
                    lpoint,
                    "high",
                    hpoint
                );
            }
        }
    }
    //drawPoints(".mats", "red", pts);

    d3.selectAll("path").lower();

    //group all path elements by LayerID and Ending Node
    interface GroupedPaths {
        [layerID: string]: {
            [endingNode: string]: SVGPathElement[];
        };
    }
    const paths = d3.selectAll<SVGPathElement, any>("path");

    const groupedPaths: GroupedPaths = paths
        .nodes()
        .reduce((acc: GroupedPaths, path: SVGPathElement) => {
            const layerID: string = path.getAttribute("layerID") || ""; // 确保 layerID 和 endingNode 不是 null
            const endingNode: string = path.getAttribute("endingNode") || "";

            if (!acc[layerID]) {
                acc[layerID] = {};
            }

            if (!acc[layerID][endingNode]) {
                acc[layerID][endingNode] = [];
            }

            acc[layerID][endingNode].push(path);

            return acc;
        }, {});
    console.log("groupedPath", groupedPaths);
    return groupedPaths;
}

function computeMids(point1: any, point2: any) {
    //find mid - x
    const midX = (point1[0] + point2[0]) / 2;
    const res = [
        [midX - 20, point1[1]],
        [midX + 20, point2[1]],
    ];
    console.log("res", res);
    return res;
}

function drawPoolingVis(
    locations: any,
    pooling: number[],
    myColor: any,
    frames: any
) {
    let oLocations = deepClone(locations);
    //find edge points
    locations[0][0] += 64 * 2;
    locations[locations.length - 1][0] += 64 * 2;
    locations[locations.length - 1][1] += 10;
    //find mid point
    const midY = (locations[locations.length - 1][1] - locations[0][1]) / 2;
    //all paths should connect to mid point
    const one = [[locations[0][0] + 102, midY]];
    //drawPoints(".mats", "red", one);
    //draw the pooling layer
    console.log("from feature vis", pooling);
    const gg = d3.select(".mats").append("g").attr("layerNum", 4);
    const g = gg.append("g").attr("class", "pooling");
    for (let i = 0; i < pooling.length; i++) {
        g.append("rect")
            .attr("x", locations[0][0] + 102 + 2 * i)
            .attr("y", midY - 5)
            .attr("width", 2)
            .attr("height", 10)
            .attr("fill", myColor(pooling[i]))
            .attr("opacity", 1)
            .attr("stroke", "gray")
            .attr("stroke-width", 0.1);
    }
    //add text
    addLayerName(locations, "Pooling", 102, -142, gg);
    //draw the cross connections btw last GCN layer and pooling layer

    //do some transformations on the original locations
    for (let i = 0; i < oLocations.length; i++) {
        oLocations[i][0] += 2 * 64;
        oLocations[i][1] += 5;
    }
    //drawPoints(".mats", "red", oLocations);
    //connnnnnnnect!!!
    const curve = d3.line().curve(d3.curveBasis);
    const paths: any[] = [];
    const mats = d3.select(".mats");
    for (let i = 0; i < oLocations.length; i++) {
        const res = computeMids(oLocations[i], one[0]);
        const lpoint = res[0];
        const hpoint = res[1];
        const path = mats
            .append("path")
            .attr("d", curve([oLocations[i], lpoint, hpoint, one[0]]))
            .attr("stroke", "black")
            .attr("opacity", 0.05)
            .attr("fill", "none");

        paths.push(path.node());
    }
    //draw frame
    const f = g
        .append("rect")
        .attr("x", locations[0][0] + 102)
        .attr("y", midY - 5)
        .attr("width", 2 * 64)
        .attr("height", 10)
        .attr("fill", "none")
        .attr("opacity", 0)
        .attr("stroke", "black")
        .attr("stroke-width", 1)
        .attr("layerID", 4)
        .attr("class", "poolingFrame");
    //send all paths to the back
    d3.selectAll("path").lower();

    g.on("mouseover", function (event, d) {
        console.log("over", paths);
        //interaction with paths
        if (paths != null) {
            paths.forEach((div: HTMLElement) => {
                div.style.opacity = "1";
            });
        }
        //interaction with frame
        f.attr("opacity", 1);
        //d3.selectAll('[layerID="3"][class="frame"]').attr("opacity", 1);
        const layerFrames = frames["GCNConv3"];
        layerFrames.forEach((frame: HTMLElement) => {
            frame.style.opacity = "1";
        });
    });

    g.on("mouseout", function (event, d) {
        if (paths != null) {
            paths.forEach((div: HTMLElement) => {
                div.style.opacity = "0.05";
            });
        }
        //interaction with frame
        f.attr("opacity", 0);
        //d3.selectAll('[layerID="3"][class="frame"]').attr("opacity", 0);
        const layerFrames = frames["GCNConv3"];
        layerFrames.forEach((frame: HTMLElement) => {
            frame.style.opacity = "0";
        });
    });

    return one;
}

//the function to draw the last two layers of the model
function drawTwoLayers(one: any, final: any, myColor: any) {
    //find the next position
    one[0][0] += 64 * 2 + 102;
    let aOne = deepClone(one);
    one[0][1] -= 5;
    //drawPoints(".mats", "red", one);
    //visulaize
    const g = d3.select(".mats").append("g").attr("class","twoLayer").attr("layerNum", 5);
    for (let m = 0; m < final.length; m++) {
        g.append("rect")
            .attr("x", one[0][0] + 10 * m)
            .attr("y", one[0][1])
            .attr("width", 10)
            .attr("height", 10)
            .attr("fill", myColor(final[m]))
            .attr("opacity", 1)
            .attr("stroke", "gray")
            .attr("stroke-width", 0.1);
    }
    //draw frame
    const f = g
        .append("rect")
        .attr("x", one[0][0])
        .attr("y", one[0][1])
        .attr("width", 2 * 10)
        .attr("height", 10)
        .attr("fill", "none")
        .attr("opacity", 0)
        .attr("stroke", "black")
        .attr("stroke-width", 1)
        .attr("layerID", 4)
        .attr("class", "frame")
        .attr("fr", 1);
    //add text
    addLayerName(one, "Model Output", 0, 20, g);
    //find positions to connect
    let bOne = deepClone(aOne);
    bOne[0][0] -= 102;
    //connect
    d3.select(".mats")
        .append("path")
        .attr("d", d3.line()([aOne[0], bOne[0]]))
        .attr("stroke", "black")
        .attr("opacity", 0.05)
        .attr("fill", "none")
        .attr("class", "path1");
    //add interaction
    g.on("mouseover", function (event, d) {
        d3.select(".path1").attr("opacity", 1);
        d3.select(".poolingFrame").attr("opacity", 1);
        f.attr("opacity", 1);
    });
    g.on("mouseout", function (event, d) {
        d3.select(".path1").attr("opacity", 0.02);
        d3.select(".poolingFrame").attr("opacity", 0);
        f.attr("opacity", 0);
    });
    //visualize the result
    aOne[0][0] += 20 + 102;
    //drawPoints(".mats","red",aOne);
    aOne[0][1] -= 5;

    let result = softmax(final);
    console.log("mat result", result);
    const g1 = d3.select(".mats").append("g").attr("class", "twoLayer").attr("layerNum", 6);
    for (let m = 0; m < result.length; m++) {
        g1.append("rect")
            .attr("x", aOne[0][0] + 10 * m)
            .attr("y", aOne[0][1])
            .attr("width", 10)
            .attr("height", 10)
            .attr("fill", myColor(result[m]))
            .attr("opacity", 1)
            .attr("stroke", "gray")
            .attr("stroke-width", 0.1);
    }
    //drawPoints(".mats", "red", aOne);
    //add labels
    g1.append("text")
        .attr("x", aOne[0][0] + 5)
        .attr("y", aOne[0][1])
        .attr("font-size", "5px")
        .attr("transform", "rotate(-45," + (aOne[0][0])+ "," + aOne[0][1] + ")")
        .text("Non-Mutagenic");

    g1.append("text")
        .attr("x", aOne[0][0] + 15)
        .attr("y", aOne[0][1])
        .attr("font-size", "5px")
        .attr("transform", "rotate(-45," + (aOne[0][0] +10)+ "," + aOne[0][1] + ")")
        .text("Mutagenic");

    addLayerName(aOne, "Prediction Result", 0, 20, g1);
    //draw frame
    const f1 = g
        .append("rect")
        .attr("x", aOne[0][0])
        .attr("y", aOne[0][1])
        .attr("width", 2 * 10)
        .attr("height", 10)
        .attr("fill", "none")
        .attr("opacity", 0)
        .attr("stroke", "black")
        .attr("stroke-width", 1)
        .attr("layerID", 4)
        .attr("class", "frame")
        .attr("fr", 2);
    //connect
    aOne[0][1] += 5;
    let cOne = deepClone(aOne);
    cOne[0][0] -= 102;
    d3.select(".mats")
        .append("path")
        .attr("d", d3.line()([aOne[0], cOne[0]]))
        .attr("stroke", "black")
        .attr("opacity", 0.05)
        .attr("fill", "none")
        .attr("class", "path2");

    //add interaction
    g1.on("mouseover", function (event, d) {
        d3.select(".path2").attr("opacity", 1);
        d3.select("[fr='1']").attr("opacity", 1);
        f1.attr("opacity", 1);
        console.log("f", f, f1);
    });
    g1.on("mouseout", function (event, d) {
        d3.select(".path2").attr("opacity", 0.02);
        d3.select("[fr='1']").attr("opacity", 0);
        f1.attr("opacity", 0);
    });

    return [aOne[0], cOne[0]];
}

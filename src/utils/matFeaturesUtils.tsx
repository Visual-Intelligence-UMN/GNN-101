import {
    chunkArray,
    deepClone,
    drawPoints,
    findMaxIndex,
    preprocessFloat32ArrayToNumber,
    softmax,
    transposeMat,
} from "./utils";
import { addLayerName, buildBinaryLegend, buildLegend } from "./matHelperUtils";
import * as d3 from "d3";
import { roundToTwo } from "../components/WebUtils";
import { deprecate } from "util";
import { injectSVG } from "./svgUtils";
import { sigmoid } from "./linkPredictionUtils";
import { matrixMultiplicationResults } from './matEventsUtils';
import { re } from "mathjs";
//draw cross connections between feature visualizers for computational graph
export function drawCrossConnectionForSubgraph(
    graph: any,
    locations: any,
    firstVisSize: number,
    gapSize: number, //the gap between two layers
    layerID: number,
    totalKeys: number[], //where we store all nodes incolced in the computation
    startKeys: number[], //where we store all the starting nodes
    endKeys: number[] //where we store all the ending nodes
) {
    const rectH = 15;

    let alocations = deepClone(locations);
    for (let i = 0; i < alocations.length; i++) {
        alocations[i][0] += firstVisSize;
        alocations[i][1] += rectH / 2;
    }

    let blocations = deepClone(alocations);
    for (let i = 0; i < blocations.length; i++) {
        blocations[i][0] += gapSize;
    }
    // drawPoints(".mats", "red", blocations);
    //draw one-multiple & one-one paths - three
    let pts: number[][] = [];
    const curve = d3.line().curve(d3.curveBasis);
    for (let i = 0; i < graph.length; i++) {
        for (let j = 0; j < graph[0].length; j++) {
            if (graph[i][j] == 1 && startKeys.includes(totalKeys[i]) && endKeys.includes(totalKeys[j])) {
                const res = computeMids(alocations[i], blocations[j]);
                const hpoint = res[0];
                const lpoint = res[1];

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
                    .attr("layerID", layerID)
                    .attr("class", "crossConnection");
                pts.push(hpoint);
                pts.push(lpoint);

            }
        }
    }

    //TODO: paths data structure management

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

    console.log("groupedPaths", groupedPaths); 

    return groupedPaths;

}



//draw cross connections between feature visualizers
export function drawCrossConnection(
    graph: any,
    locations: any,
    firstVisSize: number,
    gapSize: number,
    layerID: number
) {
    const rectH = 15;

    let alocations = deepClone(locations);
    for (let i = 0; i < alocations.length; i++) {
        alocations[i][0] += firstVisSize;
        alocations[i][1] += rectH / 2;
    }

    let blocations = deepClone(alocations);
    for (let i = 0; i < blocations.length; i++) {
        blocations[i][0] += gapSize;
    }
    // drawPoints(".mats", "red", blocations);

    //draw one-one paths
    for (let i = 0; i < alocations.length; i++) {
        d3.select(".mats")
            .append("path")
            .attr("d", d3.line()([alocations[i], blocations[i]]))
            .attr("stroke", "black")
            .attr("opacity", 0.05)
            .attr("fill", "none")
            .attr("endingNode", i)
            .attr("layerID", layerID).attr("class", "crossConnection");
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
                    .attr("layerID", layerID)
                    .attr("class", "crossConnection");
                pts.push(hpoint);
                pts.push(lpoint);

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

    return groupedPaths;
}

//compute mid point for basis curve drawing
export function computeMids(point1: any, point2: any) :[[number, number], [number, number]]{
    //find mid - x
    const midX = (point1[0] + point2[0]) / 2;
    const res :[[number, number], [number, number]] = [
        [midX - 20, point1[1]],
        [midX + 20, point2[1]],
    ];

    return res;
}

//compute mid point for basis curve drawing - vertical orient
export function computeMidsVertical(point1: any, point2: any) :[[number, number], [number, number]]{
    //find mid - x
    const midY = (point1[1] + point2[1]) / 2;
    const res :[[number, number], [number, number]] = [
        [point1[0], midY],
        [point2[0], midY],
    ];

    return res;
}

//draw aid utils for matrix visualization(column and row frames)
export function drawMatrixPreparation(graph: any, locations: any, gridSize:number, xOffset:number=0) {
    const offset = 100;
    let colLocations = [];
    for (let i = 0; i < graph.length; i++) {
        const x =
            locations[0][0] - (gridSize / graph.length) * i - gridSize / graph.length / 2;
        const y = locations[0][1];
        colLocations.push([x, y]);
    }
    const ratio = locations[0][1] / 61.875365257263184;
    const startY = locations[0][1] / ratio;
    const rowHeight = gridSize / graph.length;
    // drawPoints(".mats", "red", colLocations);
    let colFrames: SVGElement[] = []; //a
  //  drawPoints(".mats", "red", colLocations)
    for (let i = 0; i < colLocations.length; i++) {
        const r = d3
            .select(".mats")
            .append("rect")
            .attr("x", colLocations[i][0] + xOffset)
            .attr("y", colLocations[i][1] / ratio + offset)
            .attr("height", gridSize)
            .attr("width", gridSize / graph.length)
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
            .attr("x", locations[i][0] - gridSize + rowHeight / 2 + xOffset)
            .attr("y", startY + i * rowHeight + offset)
            .attr("height", rowHeight)
            .attr("width", gridSize)
            .attr("fill", "none")
            .attr("opacity", 0)
            .attr("stroke", "black")
            .attr("stroke-width", 2)
            .attr("class", "rowFrame");

        matFrames.push(r.node() as SVGElement);
    }

    console.log("frame data", locations, colLocations, rowHeight, gridSize)

    return { colFrames: colFrames, matFrames: matFrames };
}

//draw data original feature
export function drawNodeFeatures(
    locations: any,
    graph: any,
    myColor: any,
    features: any,
    frames: any,
    schemeLocations: any,
    featureVisTable: any,
    featureChannels:number,
    rectW:number,
    rectH:number,
    gap:number,
    drawPaths: boolean = true
) {
    //initial visualizer
    for (let i = 0; i < locations.length; i++) {
        locations[i][0] += 50;
        locations[i][1] += 2;
    }
    //draw cross connections for features layer and first GCNConv layer
    //drawPaths controls the cross connection func
    if(drawPaths)drawCrossConnection(graph, locations, featureChannels * rectW, gap+2, 0);

    //using locations to find the positions for first feature visualizers
    const firstLayer = d3.select(".mats").append("g").attr("id", "layerNum_0").attr("class", "layerVis");
    // const rectW = 10;
    // const rectH = 15;
    for (let i = 0; i < locations.length; i++) {
        const g = firstLayer
            .append("g")
            .attr("class", "oFeature")
            .attr("node", i)
            .attr("layerID", 0);

        for (let j = 0; j < featureChannels; j++) {
            const fVis = g
                .append("rect")
                .attr("x", locations[i][0] + rectW * j)
                .attr("y", locations[i][1])
                .attr("width", rectW)
                .attr("height", rectH)
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
            .attr("width", rectW * featureChannels)
            .attr("height", rectH)
            .attr("fill", "none")
            .attr("opacity", 0.25)
            .attr("stroke", "black")
            .attr("stroke-width", 1)
            .attr("node", i)
            .attr("layerID", 0)
            .attr("class", "frame");
        frames["features"].push(f.node());

        //find last location
        if (i == locations.length - 1)
            schemeLocations.push([locations[i][0], 350]);

        //push feature visualizer into the table
        featureVisTable[0].push(g.node() as SVGElement);
    }
    //drawPoints(".mats", "red", schemeLocations);
    //add layer label for the first one

    if(featureChannels!=34)addLayerName(locations, "Input", 0, 30, firstLayer);
    else addLayerName(locations, "Input", 0, 70, firstLayer);
    return {
        locations: locations,
        frames: frames,
        schemeLocations: schemeLocations,
        featureVisTable: featureVisTable,
        firstLayer: firstLayer,
    };
}

export function markCellsConnectedToPath(pathEndCoord: [number, number], featureVisTable: any) {
    // Find cells that are at or near the path endpoint
    const targetCells = d3.selectAll(".featureVis[layerID='3'] rect")
        .filter(function() {
            const cellX = parseFloat(d3.select(this).attr("x"));
            const cellY = parseFloat(d3.select(this).attr("y"));
            // Check if this cell is within some threshold of the path endpoint
            return Math.abs(cellX - pathEndCoord[0]) < 10 && 
                   Math.abs(cellY - pathEndCoord[1]) < 10;
        });
    
    // Mark these cells
    targetCells.attr("data-connected-to-path", "true");
}
export function drawSingleGCNConvFeature(
    layer:any,
    i:number,
    k:number,
    gcnFeature:any,
    featureChannels:number,
    locations:any,
    rectW:number,
    rectH:number,
    myColor:any,
    thirdGCN:any,
    frames:any,
    schemeLocations:any,
    featureVisTable:any,
    dummy?: any,
    bias?: any
){
    //const cate = get_category_node(features[i]) * 100;
    const g = layer
        .append("g")
        .attr("class", "featureVis")
        .attr("node", i)
        .attr("layerID", k + 1);



    //loop through each node
    //console.log("gcnFeature is ", gcnFeature);
    let nodeMat = gcnFeature[i];

    //where we met encounter issue
    //console.log("nodeMat is ", nodeMat);
    for (let m = 0; m < featureChannels; m++) {
        const cellValue = nodeMat[m];
        // console.log("cellValue is " + cellValue);
        const rect = g
            .append("rect")
            .attr("x", locations[i][0] + rectW * m)
            .attr("y", locations[i][1])
            .attr("width", rectW)
            .attr("height", rectH)
            .attr("fill", myColor(cellValue))
            .attr("opacity", 1)
            .attr("stroke", "gray")
            .attr("stroke-width", 0.1)
            .attr("data-value", cellValue.toString())
            .attr("data-index", m.toString()) 
            .on("mouseover", function(this: SVGRectElement, event: MouseEvent) {
                // recursively find ancestor with class "featureVis"
                let el: Element | null = this;
                while (el && !el.classList.contains("featureVis")) {
                    el = el.parentElement;
                    // console.log(el);
                }
                if (el) {
                    const op = parseFloat(window.getComputedStyle(el).opacity || "1");
                    if (op < 0.5) {
                        return;  // abort if that ancestor's opacity is below threshold
                    }
                }

                // fix for the issue of tooltip not hiding when the corresponding rect has opacity < 0.5
                const parentNode = this.parentNode as Element | null;
                if (!parentNode) return;
                

                const siblings = d3.select(parentNode).selectAll<SVGRectElement, unknown>("rect").nodes();

                for (const sibling of siblings) {
                  if (sibling === this) continue; // skip self

                  const width = sibling?.getAttribute("width") ? parseFloat(sibling.getAttribute("width")!) : 0;
                  const opacity = sibling?.style?.opacity
                    ? parseFloat(sibling.style.opacity)
                    : sibling?.getAttribute("opacity")
                    ? parseFloat(sibling.getAttribute("opacity")!)
                    : 1;
                
                  if (width > 100 && opacity < 0.5) {
                    return; // Exit early if condition is met
                  }
                }
                



                d3.selectAll(".feature-tooltip").remove();
                const container = d3.select(".mats");
                let [mx, my] = d3.pointer(event, container.node());
                const tooltip = container
                  .append("g")
                  .attr("class", "feature-tooltip procVis");

                const padding = 8;
                // const fontSize = 14;
                const rectW = 400;            
                const rectH = 120;
                const rectL = 40;
                  
                const dummy = matrixMultiplicationResults.dummy[i];
                const bias = matrixMultiplicationResults.bias[i];
                // console.log("dummy is" + dummy)
                // console.log("bias is"+bias)
                const featureIndex = parseInt(this.getAttribute("data-index") || "0");
                let matmulStr = dummy && featureIndex < dummy.length ? dummy[featureIndex].toFixed(2) : "--";
                let biasStr = bias && featureIndex < bias.length ? bias[featureIndex].toFixed(2) : "--";
                let d = cellValue;

                
                d3.select(this)
                    .attr("stroke", "black")
                    .attr("stroke-width", 2);

                if (matmulStr == "--" || biasStr == "--") {
                    mx += -40;
                    my += -40;

                    tooltip.append("rect")
                    .attr("x", mx)
                    .attr("y", my)
                    .attr("width", 150)
                    .attr("height", 35)
                    .attr("rx", 5)
                    .attr("ry", 5)
                    .style("fill", "white")
                    .style("stroke", "black");

                    tooltip.append("text")
                    .attr("x", mx + 20)
                    .attr("y", my + 20)
                    .attr("font-size", `17px`)
                    .attr("font-family", "monospace")
                    .text("Value = " + d.toFixed(2));

                    return;
                }
                console.log("matmulStr is " + matmulStr);
                let matmulValue = roundToTwo(parseFloat(matmulStr));
                let biasValue = roundToTwo(parseFloat(biasStr));
                
                mx = mx - rectW / 2;
                my = my - rectH - padding;

                tooltip.append("rect")
                .attr("x", mx)
                .attr("y", my)
                .attr("width", rectW)  
                .attr("height", rectH) 
                .attr("rx", 5)
                .attr("ry", 5)
                .style("fill", "white")
                .style("stroke", "black");

                // Relu text
                tooltip.append("text")
                  .attr("x", mx + 20)
                  .attr("y", my + 60)
                  .attr("text-anchor", "left")
                  .attr("dominant-baseline", "middle")
                  .style("font-size", `30px`)
                  .attr("font-family", "monospace")
                  .attr("font-weight", "bold")
                  .text("Relu(");

                tooltip.append("text")
                    .attr("x", mx + 10 + 170)
                    .attr("y", my + 60)
                    .attr("text-anchor", "left")
                    .attr("dominant-baseline", "middle")
                    .style("font-size", `30px`)
                    .attr("font-family", "monospace")
                    .attr("font-weight", "bold")
                    .text("+");
                

                tooltip.append("text")
                    .attr("x", mx + 10 + 275)
                    .attr("y", my + 60)
                    .attr("text-anchor", "left")
                    .attr("dominant-baseline", "middle")
                    .style("font-size", `30px`)
                    .attr("font-family", "monospace")
                    .attr("font-weight", "bold")
                    .text(") =");

                const matmulX = mx + 120;
                const matmulY = my + 35;

                tooltip.append("rect")
                    .attr("x", matmulX)
                    .attr("y", matmulY)
                    .attr("width", rectL)
                    .attr("height", rectL)
                    .style("stroke", "black")
                    .attr("fill", myColor(matmulStr))
                    .attr("class", "math-displayer");
            
                tooltip.append("text")
                    .attr("x", matmulX + rectL / 2)
                    .attr("y", matmulY + rectL / 2 + 2)
                    .text(roundToTwo(matmulValue))
                    .attr("class", "math-displayer")
                    .attr("text-anchor", "middle")
                    .attr("font-size", "15px")
                    .attr("font-family", "monospace")
                    .attr("fill", Math.abs(matmulValue) > 0.7 ? "white" : "black");

                tooltip.append("text")
                    .attr("x", matmulX + rectL / 2)
                    .attr("y", matmulY + rectL / 2 + 45)
                    .text("Matmul")
                    .attr("class", "math-displayer")
                    .attr("text-anchor", "middle")
                    .attr("fill", "grey")
                    .attr("font-size", "20px")
                    .attr("font-weight", "bold")
                    .attr("font-family", "monospace");

                const biasX = mx + 230;
                const biasY = my + 35;

                tooltip.append("rect")
                    .attr("x", biasX)
                    .attr("y", biasY)
                    .attr("width", rectL)
                    .attr("height", rectL)
                    .style("stroke", "black")
                    .attr("fill", myColor(biasStr))
                    .attr("class", "math-displayer");

                tooltip.append("text")
                    .attr("x", biasX + rectL / 2)
                    .attr("y", biasY + rectL / 2 + 2)
                    .text(roundToTwo(biasValue))
                    .attr("class", "math-displayer")
                    .attr("text-anchor", "middle")
                    .attr("font-size", "15px")
                    .attr("font-family", "monospace")
                    .attr("fill", Math.abs(biasValue) > 0.7 ? "white" : "black");
                
                tooltip.append("text")
                .attr("x", biasX + rectL / 2)
                .attr("y", biasY + rectL / 2 + 45)
                .text("Bias")
                .attr("class", "math-displayer")
                .attr("text-anchor", "middle")
                .attr("fill", "grey")
                .attr("font-size", "20px")
                .attr("font-weight", "bold")
                .attr("font-family", "monospace");

                const valueX = mx + 340;
                const valueY = my + 35;

                tooltip.append("rect")
                    .attr("x", valueX)
                    .attr("y", valueY)
                    .attr("width", rectL)
                    .attr("height", rectL)
                    .style("stroke", "black")
                    .attr("fill", myColor(d))
                    .attr("class", "math-displayer");

                tooltip.append("text")
                    .attr("x", valueX + rectL / 2)
                    .attr("y", valueY + rectL / 2 + 2)
                    .text(roundToTwo(d))
                    .attr("class", "math-displayer")
                    .attr("text-anchor", "middle")
                    .attr("font-size", "15px")
                    .attr("font-family", "monospace")
                    .attr("fill", Math.abs(d) > 0.7 ? "white" : "black");

                tooltip.append("text")
                    .attr("x", valueX + rectL / 2)
                    .attr("y", valueY + rectL / 2 + 45)
                    .text("Output")
                    .attr("class", "math-displayer")
                    .attr("text-anchor", "middle")
                    .attr("fill", "grey")
                    .attr("font-size", "20px")
                    .attr("font-weight", "bold")
                    .attr("font-family", "monospace");

                
            })
            .on("mouseout", function(this: SVGRectElement) {
                d3.selectAll(".feature-tooltip").remove();
                d3.select(this)
                    .attr("stroke", "gray")
                    .attr("stroke-width", 0.1);
            });
                
        if (k == 2 && m < featureChannels) {
            thirdGCN[m].push(rect.node());
        }
    }
    //draw frame
    const f = g
        .append("rect")
        .attr("x", locations[i][0])
        .attr("y", locations[i][1])
        .attr("width", rectW * featureChannels)
        .attr("height", rectH)
        .attr("fill", "none")
        .attr("opacity", 0.25)
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

    featureVisTable[k + 1].push(g.node() as SVGElement);

    return {
        thirdGCN: thirdGCN,
        schemeLocations: schemeLocations,
        featureVisTable: featureVisTable
    }
}


export function drawColorSchremeSequence(infoTable:any, myColor:any){
    const valueTable:number[][] = infoTable.valueTable;
    const nameTable:string[] = infoTable.nameTable;
    const xLocationTable:number[] = infoTable.xLocationTable;
    const yLocationTable:number[] = infoTable.yLocationTable;
    const layerTable:any = infoTable.layerTable;
    const schemeTypeTable:string = infoTable.schemeTypeTable;

    let colorSchemesTable:any = [];

    for(let i=0; i<layerTable.length; i++){

            
        if(schemeTypeTable[i]=="binary"){
            const cst = buildBinaryLegend(
                myColor, valueTable[i][0], valueTable[i][1], 
                nameTable[i], xLocationTable[i], yLocationTable[i],
                layerTable[i]
            );
            colorSchemesTable.push(cst);
        }else{
            const cst = buildLegend(
                myColor, valueTable[i][0], nameTable[i], 
                xLocationTable[i], yLocationTable[i], layerTable[i]
            );
            colorSchemesTable.push(cst);
        }
    }

    return colorSchemesTable;
}

//draw intermediate features from GCNConv process
export function drawGCNConvGraphModel(
    conv1: any,
    conv2: any,
    conv3: any,
    locations: any,
    myColor: any,
    frames: any,
    schemeLocations: any,
    featureVisTable: any,
    pooling: any,
    graph: any,
    poolingVis: any,
    outputVis: any,
    final: any,
    firstLayer: any,
    maxVals: any,
    featureChannels: number
) {
    let path1:any = null;
    let fr1:any = null;
    let poolingFrame = null;


    //GCNCov Visualizer
    let one = null;
    let paths: any;
    let resultVis = null;
    const gcnFeatures = [conv1, conv2, conv3];
    console.log("all-gcnFeatures: ", gcnFeatures);
    //a table to save all rects in the last GCNConv layer
    let thirdGCN: any = Array.from({ length: featureChannels }, () => []);



    for (let k = 0; k < 3; k++) {
        const rectH = 15;
        const rectW = 5;
        const layer = d3
            .select(".mats")
            .append("g")
            .attr("class", "layerVis")
            .attr("id", `layerNum_${k + 1}`);
        for (let i = 0; i < locations.length; i++) {
            if (k != 0) {
                locations[i][0] += rectW * featureChannels + 100;
            } else {
                locations[i][0] += 7 * rectW + 100 + 25;
            }
        }

       // drawPoints(".mats", "red", [[locations[0][0], locations[0][1]]])

        //draw hint label
        if(k==0){
            const hintLabelPos = [locations[0][0] - 120 - 64, locations[0][1] - 120 - 64];
            const gLabel = d3.select(".mats").append("g");
            injectSVG(gLabel, hintLabelPos[0], hintLabelPos[1], "./assets/SVGs/interactionHint.svg", "hintLabel")
        }
        addLayerName(
            locations,
            "GCNConv" + (k + 1),
            0,
            30,
            d3.select(`g#layerNum_${k + 1}`)
        );

        //drawPoints(".mats","red",locations);
        const gcnFeature = gcnFeatures[k];

        for (let i = 0; i < locations.length; i++) {
            const sgfPack = drawSingleGCNConvFeature(
                layer, i, k, gcnFeature, featureChannels, locations, 
                rectW, rectH, myColor, thirdGCN, frames,
                schemeLocations, featureVisTable
            );
            thirdGCN = sgfPack.thirdGCN;
            schemeLocations = sgfPack.schemeLocations;
            featureVisTable = sgfPack.featureVisTable;
        }

        if (k != 2) {
            // visualize cross connections btw 1st, 2nd, 3rd GCNConv
            paths = drawCrossConnection(
                graph,
                locations,
                (featureChannels-2) * rectW,
                102,
                k + 1
            );

        } else {
            //visualize pooling layer
            const poolingPack = drawPoolingVis(
                locations,
                pooling,
                myColor,
                frames,
                thirdGCN,
                conv3,
                featureChannels
            );
            one = poolingPack["one"];
            poolingVis = poolingPack["g"];
            poolingFrame = poolingPack["poolingFrame"];


            schemeLocations.push([one[0][0], 350]);
            //visualize last layer and softmax output
            const tlPack = drawTwoLayers(one, final, myColor, featureChannels);
            let aOne = tlPack["locations"];
            outputVis = tlPack["g"];
            resultVis = tlPack["g1"];
            path1 = tlPack["path1"];
            fr1 = tlPack["fr1"];

            if (aOne != undefined) {
                schemeLocations.push([aOne[0][0], 350]);
            }
            schemeLocations.push([aOne[1][0] - 20, 350]);
        }

        //drawPoints(".mats", "red", schemeLocations);
        //let max1 = findAbsMax(maxVals.conv1);
        let result = softmax(final);


        //select layers
        const l1 = d3.select(`g#layerNum_1`);
        const l2 = d3.select(`g#layerNum_2`);
        const l3 = d3.select(`g#layerNum_3`);
        const l4 = d3.select(`g#layerNum_4`);
        const l5 = d3.select(`g#layerNum_5`);
        const l6 = d3.select(`g#layerNum_6`);

        const schemeOffset = 250;

        schemeLocations[0][0] += 10;
        schemeLocations[1][0] += 40;

        const infoTable = {
            valueTable:[
                [0,1],
                [maxVals.conv1],
                [maxVals.conv2],
                [maxVals.conv3],
                [maxVals.pooling],
                [result[0], result[1]]
            ],
            nameTable:[
                "Features Color Scheme",
                "GCNConv1 Color Scheme",
                "GCNConv2 Color Scheme",
                "GCNConv3 Color Scheme",
                "Pooling Color Scheme",
                "Result Color Scheme",
            ],
            xLocationTable:[
                schemeLocations[0][0],
                schemeLocations[1][0],
                schemeLocations[1][0] + 400,
                schemeLocations[1][0] + 400*2,
                schemeLocations[1][0] + 400*3,
                schemeLocations[1][0] + 400*4
            ],
            yLocationTable:[
                schemeLocations[0][1] + schemeOffset,
                schemeLocations[1][1] + schemeOffset,
                schemeLocations[1][1] + schemeOffset,
                schemeLocations[1][1] + schemeOffset,
                schemeLocations[1][1] + schemeOffset,
                schemeLocations[1][1] + schemeOffset
            ],
            layerTable:[firstLayer, l1, l2, l3, l4, l5],
            schemeTypeTable:["binary", "", "", "", "", "binary"]
        };

    }



    return {
        locations: locations,
        frames: frames,
        schemeLocations: schemeLocations,
        featureVisTable: featureVisTable,
        poolingVis: poolingVis,
        outputVis: outputVis,
        firstLayer: firstLayer,
        maxVals: maxVals,
        paths: paths,
        resultVis: resultVis,
        one: one,
        thirdGCN: thirdGCN,
        path1:path1,
        fr1:fr1,
        poolingFrame:poolingFrame
    };
}

//draw intermediate features from GCNConv process
export function drawGCNConvNodeModel(
    conv1: any,
    conv2: any,
    conv3: any,
    locations: any,
    myColor: any,
    frames: any,
    schemeLocations: any,
    featureVisTable: any,
    result: any,
    graph: any,
    final: any,
    firstLayer: any,
    maxVals: any,
    featureChannels: number,
    trainingNodes: number[],
    dimensions: number[],
    sandBoxMode: boolean
) {
    //GCNCov Visualizer
    let paths: any;
    let resultPaths: any;
    const gcnFeatures = [conv1, conv2, conv3];
    //a table to save all rects in the last GCNConv layer
    let thirdGCN: any = Array.from({ length: featureChannels }, () => []);



    let resultLabelsList: any;
    for (let k = 0; k < 3; k++) {
        const rectH = 15;
        const rectW = 10;
        const layer = d3
            .select(".mats")
            .append("g")
            .attr("class", "layerVis")
            .attr("id", `layerNum_${k + 1}`);
        for (let i = 0; i < locations.length; i++) {
            if (k != 0) {
                locations[i][0] += rectW * featureChannels + 150;
            } else {
                
                if(!sandBoxMode)locations[i][0] += 34 * 5 + 150;
                else locations[i][0] += 7 * rectW + 100 + 25;
                console.log("first layout layout ", sandBoxMode, locations[i][0]);
            }
        }

        if(k==0){
            const hintLabelPos = [locations[0][0] - 132 - 32, locations[0][1] - 132 - 32];
            const gLabel = d3.select(".mats").append("g");
            injectSVG(gLabel, hintLabelPos[0], hintLabelPos[1], "./assets/SVGs/interactionHint.svg", "hintLabel")
        }

        addLayerName(
            locations,
            "GCNConv" + (k + 1),
            0,
            70,
            d3.select(`g#layerNum_${k + 1}`)
        );

        //drawPoints(".mats","red",locations);
        const gcnFeature = gcnFeatures[k];


        if(k==2){
            for (let i = 0; i < locations.length; i++) {
                const sgfPack = drawSingleGCNConvFeature(
                    layer, i, k, gcnFeature, dimensions[k], locations, 
                    rectW, rectH, myColor, thirdGCN, frames,
                    schemeLocations, featureVisTable
                );
                thirdGCN = sgfPack.thirdGCN;
                schemeLocations = sgfPack.schemeLocations;
                featureVisTable = sgfPack.featureVisTable;
            }
        }else{
            for (let i = 0; i < locations.length; i++) {
                const sgfPack = drawSingleGCNConvFeature(
                    layer, i, k, gcnFeature, featureChannels, locations, 
                    rectW, rectH, myColor, thirdGCN, frames,
                    schemeLocations, featureVisTable
                );
                thirdGCN = sgfPack.thirdGCN;
                schemeLocations = sgfPack.schemeLocations;
                featureVisTable = sgfPack.featureVisTable;
            }
        }

        if (k != 2) {
            // visualize cross connections btw 1st, 2nd, 3rd GCNConv
            paths = drawCrossConnection(
                graph,
                locations,
                (featureChannels) * rectW,
                152,
                k + 1
            );

        } else {
            //here's the place we draw the result layer
            //do locations tranformation
            let layerLocations = deepClone(locations);
            for(let i=0; i<layerLocations.length; i++){
                layerLocations[i][0] += rectW*2+200;
            }
            resultPaths = drawResultLayer(locations, layerLocations, result, rectW, rectH, myColor, featureVisTable, frames, graph, trainingNodes);
            //drawPoints(".mats", "red", layerLocations);
            resultLabelsList = resultPaths.resultLabelsList;
        }

    }

    //select layers
    const l1 = d3.select(`g#layerNum_1`);
    const l2 = d3.select(`g#layerNum_2`);
    const l3 = d3.select(`g#layerNum_3`);
    const l4 = d3.select(`g#layerNum_4`);

    const schemeOffset =700;

    const infoTable = {
        valueTable:[
            [0,1],
            [maxVals.conv1],
            [maxVals.conv2],
            [maxVals.conv3],
            [maxVals.result]
        ],
        nameTable:[
            "Features Color Scheme",
            "GCNConv1 Color Scheme",
            "GCNConv2 Color Scheme",
            "GCNConv3 Color Scheme",
            "Prediction Result Color Scheme"
        ],
        xLocationTable:[
            schemeLocations[0][0],
            schemeLocations[1][0],
            schemeLocations[1][0] + 200,
            schemeLocations[1][0] + 200*2,
            schemeLocations[1][0] + 200*3
        ],
        yLocationTable:[
            schemeLocations[0][1] + schemeOffset,
            schemeLocations[1][1] + schemeOffset,
            schemeLocations[1][1] + schemeOffset,
            schemeLocations[1][1] + schemeOffset,
            schemeLocations[1][1] + schemeOffset
        ],
        layerTable:[firstLayer, l1, l2, l3, l4],
        schemeTypeTable:["binary", "", "", "", ""]
    };



    return {
        locations: locations,
        frames: frames,
        schemeLocations: schemeLocations,
        featureVisTable: featureVisTable,
        firstLayer: firstLayer,
        maxVals: maxVals,
        paths: paths,
        thirdGCN: thirdGCN,
        resultPaths: resultPaths,
        resultLabelsList:resultLabelsList
    };
}



//draw intermediate features from GCNConv process
export function drawGCNConvLinkModel(
    conv1: any,
    conv2: any,
    probResult: number, 
    locations: any,
    myColor: any,
    frames: any,
    schemeLocations: any,
    featureVisTable: any,
    graph: any,
    firstLayer: any,
    maxVals: any,
    featureChannels: number,
    featureKeys:number[], //an number array that record all node indexes involved in the computation
    featureKeysEachLayer: number[][], //an 2d array that record all node indexes involved in the computation for each layer
    innerComputationMode: string
) {
    //GCNCov Visualizer
    let paths: any;
    const gcnFeatures = [conv1, conv2];


    let location1:[number, number] = [0, 0];
            let location2:[number, number] = [0, 0];

    for (let k = 0; k < 2; k++) {
        const rectH = 15;
        const rectW = 5;
        const layer = d3
            .select(".mats")
            .append("g")
            .attr("class", "layerVis")
            .attr("id", `layerNum_${k + 1}`);
        for (let i = 0; i < locations.length; i++) {
            if (k != 0) {
                locations[i][0] += rectW * featureChannels + 100;
            } else {
                locations[i][0] += 128 * 2.5 + 100;
            }
        }

       // drawPoints(".mats", "red", [[locations[0][0], locations[0][1]]])

        //draw hint label
        if(k==0){
            const hintLabelPos = [locations[0][0] - 120 - 64, locations[0][1] - 120 - 64];
            const gLabel = d3.select(".mats").append("g");
            injectSVG(gLabel, hintLabelPos[0], hintLabelPos[1], "./assets/SVGs/interactionHint.svg", "hintLabel")
        }

        //conditional statement for layer name adjustments
        let layerName = "GCNConv";
        if(innerComputationMode=="GAT"){
            layerName = "GATConv";
        }else if (innerComputationMode=="GraphSAGE"){
            layerName = "SAGEConv";
        }
        addLayerName(
            locations,
            layerName + (k + 1),
            0,
            30,
            d3.select(`g#layerNum_${k + 1}`)
        );

        //drawPoints(".mats","red",locations);
        const gcnFeature = gcnFeatures[k];

        for (let i = 0; i < locations.length; i++) {
            // a special checking here - to see if this node involved in the computation or not
            if(featureKeysEachLayer[k+1].includes(featureKeys[i])){
                const sgfPack = drawSingleGCNConvFeature(
                    layer, i, k, gcnFeature, featureChannels, locations, 
                    rectW, rectH, myColor, [], frames,
                    schemeLocations, featureVisTable
                );
                schemeLocations = sgfPack.schemeLocations;
                featureVisTable = sgfPack.featureVisTable;
            }else{
                if (k == 0) frames["GCNConv1"].push(null);
                if (k == 1) frames["GCNConv2"].push(null);

                featureVisTable[k+1].push(null);
            }
        }

        if (k != 1) {
            // visualize cross connections btw 1st, 2nd GCNConv
            // we need have another special cross connection for this one
            paths = drawCrossConnectionForSubgraph(
                graph,
                locations,
                64*5,
                100,
                1,
                featureKeys,
                featureKeysEachLayer[1],
                featureKeysEachLayer[2]
            );

        } else {
            //visualize the result layer
            console.log("check last locations", locations, featureKeysEachLayer);
            //extract last two feature visualizers' locations
            const hubNodeA = featureKeysEachLayer[0].indexOf(featureKeysEachLayer[2][0]);
            const hubNodeB = featureKeysEachLayer[0].indexOf(featureKeysEachLayer[2][1]);
            location1 = [locations[hubNodeA][0], locations[hubNodeA][1]];
            location2 = [locations[hubNodeB][0], locations[hubNodeB][1]];

            let layerLocations = deepClone(locations);
            for(let i=0; i<layerLocations.length; i++){
                layerLocations[i][0] += rectW*2+200;
            }

            drawResultVisForLinkModel(location1, location2, probResult, myColor, layerLocations);
        }

        //drawPoints(".mats", "red", schemeLocations);
        //let max1 = findAbsMax(maxVals.conv1);

        //conditional statement for color schemes name adjustments
        let nameTable = [
            "Features Color Scheme",
            "GCNConv1 Color Scheme",
            "GCNConv2 Color Scheme",
            "Result Color Scheme"
        ];

        if(innerComputationMode=="GAT"){
            nameTable = [
                "Features Color Scheme",
                "GATConv1 Color Scheme",
                "GATConv2 Color Scheme",
                "Result Color Scheme"
            ];
        }else if(innerComputationMode=="GraphSAGE"){
            nameTable = [
                "Features Color Scheme",
                "SAGEConv1 Color Scheme",
                "SAGEConv2 Color Scheme",
                "Result Color Scheme"
            ];
        }

        //select layers
        const l1 = d3.select(`g#layerNum_1`);
        const l2 = d3.select(`g#layerNum_2`);
        const l3 = d3.select(`g#layerNum_3`);

        let schemeOffset = 650;

        console.log("schemeLocations", schemeLocations);
        const loc2 = [schemeLocations[0][0] + 64*5+50, schemeLocations[0][1]];
        schemeLocations.push(loc2);
        const infoTable = {
            valueTable:[
                [1],
                [1],
                [1],
                [0.3, 0.7]
            ],
            nameTable:nameTable,
            xLocationTable:[
                schemeLocations[0][0],
                schemeLocations[1][0],
                schemeLocations[1][0] + 400,
                schemeLocations[1][0] + 400*2
            ],
            yLocationTable:[
                schemeLocations[0][1] + schemeOffset,
                schemeLocations[1][1] + schemeOffset,
                schemeLocations[1][1] + schemeOffset,
                schemeLocations[1][1] + schemeOffset
            ],
            layerTable:[firstLayer, l1, l2, l3],
            schemeTypeTable:["", "", "", "binary"]
        };

    }

    return {
        locations: locations,
        frames: frames,
        schemeLocations: schemeLocations,
        featureVisTable: featureVisTable,
        firstLayer: firstLayer,
        maxVals: maxVals,
        paths: paths,
        locationsForLastLayer: [location1, location2]
    };
}

//draw pooling visualizer
export function drawPoolingVis(
    locations: any,
    pooling: number[],
    myColor: any,
    frames: any,
    thirdGCN: any,
    conv3: any,
    featureChannels: number
) {


    let poolingFrame:any = null;

    const rectH = 15;
    const rectW = 5;
    let oLocations = deepClone(locations);
    //find edge points
    locations[0][0] += featureChannels * rectW;
    locations[locations.length - 1][0] += featureChannels * rectW;
    locations[locations.length - 1][1] += rectH;
    //find mid point
    const midY =
        (locations[locations.length - 1][1] - locations[0][1]) / 2 + 150;
    //all paths should connect to mid point
    const one = [[locations[0][0] + 102, midY + 2]];
    //drawPoints(".mats", "red", one);
    //draw the pooling layer

    const gg = d3
        .select(".mats")
        .append("g")
        .attr("class", "layerVis")
        .attr("id", "layerNum_4");
    const g = gg.append("g").attr("class", "pooling");

    //coordination for the math formula display
    const displayX = locations[0][0] + 102;
    const displayY = midY - 200;

    //width and height of displayer
    const displayW = 300;
    const displayH = 75;

    //drawPoints(".mats", "red", [[displayX, displayY]]);
    let poolingRects = [];
    for (let i = 0; i < featureChannels; i++) {
        const rect = g
            .append("rect")
            .attr("x", locations[0][0] + 102 + rectW * i)
            .attr("y", midY - 5)
            .attr("width", rectW)
            .attr("height", rectH)
            .attr("fill", myColor(pooling[i]))
            .attr("opacity", 1)
            .attr("stroke", "gray")
            .attr("stroke-width", 0.1)
            .attr("class", "poolingRect")
            .attr("id", `${i}`)
            .on("mouseover", function (event) {
                const id: number = Number(d3.select(this).attr("id"));

                //interact with pooling vis

                if(poolingRects!=null){
                    for (let ii = 0; ii < poolingRects.length; ii++) {
                        if (ii != id) {
                            poolingRects[ii]!.style.opacity = "0.1";
                        } else {
                            poolingRects[ii]!.style.strokeWidth = "1.5";
                            poolingRects[ii]!.style.stroke = "black";
                        }
                    }
                }

                //interact with prev layer
                for (let ii = 0; ii < thirdGCN.length; ii++) {
                    if (ii != id) {
                        thirdGCN[ii].forEach((node: any, index: number) => {
                            node.style.opacity = "0.1";
                        });
                    } else {
                        thirdGCN[ii].forEach((node: any, index: number) => {
                            node.style.stroke = "black";
                            node.style.strokeWidth = "1.5";
                        });
                    }
                }
                //add displayer
                d3.select(".mats")
                    .append("rect")
                    .attr("x", displayX)
                    .attr("y", displayY)
                    .attr("width", displayW)
                    .attr("height", displayH)
                    .attr("rx", 10)
                    .attr("ry", 10)
                    .style("fill", "white")
                    .style("stroke", "black")
                    .style("stroke-width", 2)
                    .attr("class", "math-displayer")
                    .lower();

                //add math formula to the math-displayer
                const nodeNum = thirdGCN[0].length;
                const rowNum = Math.ceil(nodeNum);
                const displayYOffset = 10;
                const displayXOffset = 40;

                let firstCoord = [
                    displayX + displayXOffset,
                    displayY + displayYOffset,
                ];

                //calculate all coordinations for rect and numerical values
                let numRect = [firstCoord];
                let xIncr = (displayW - 2 * displayXOffset) / 5;
                let yIncr = (displayH - 2 * displayY) / rowNum;
                let iCol = 1;
                let iRow = 0;

                for (let i = 1; i < nodeNum; i++) {
                    let c = [
                        displayX + displayXOffset + iCol * xIncr,
                        displayY + displayYOffset - iRow * yIncr,
                    ];

                    numRect.push(c);

                    iCol++;
                    //if (i+1)%5==0 -> clear iCol && iRow ++
                    if ((i + 1) % 5 == 0) {
                        iCol = 0;
                        iRow++;
                    }
                }

                //dummy data

                const matConv3: any = chunkArray(conv3, featureChannels);

                const aMat = preprocessFloat32ArrayToNumber(matConv3);

                const matConv3t: any = transposeMat(aMat);

                const numFromFeatures: any = matConv3t[id];

                const numFromResult = pooling;

                //draw rects based on the coordination

                const rectL = Math.abs(yIncr) - 3;
                let color = "white";
                for (let i = 0; i < numRect.length; i++) {
                    if (Math.abs(numFromFeatures[i]) < 0.5) {
                        color = "black";
                    } else {
                        color = "white";
                    }
                    // append rect
                    d3.select(".mats")
                        .append("rect")
                        .attr("x", numRect[i][0])
                        .attr("y", numRect[i][1])
                        .attr("width", rectL)
                        .attr("height", rectL).style("stroke", "black")
                        .attr("fill", myColor(numFromFeatures[i]))
                        .attr("class", "math-displayer"); //.raise();
                    // append text
                    d3.select(".mats")
                        .append("text")
                        .attr("x", numRect[i][0])
                        .attr("y", numRect[i][1] + rectL / 2)
                        .text(roundToTwo(numFromFeatures[i]))
                        .attr("class", "math-displayer")
                        .attr("font-size", "5")
                        .attr("fill", color);
                }

                //find places to place "+"
                let posPlus = [];
                for (let i = 0; i < numRect.length; i++) {
                    let c = [
                        numRect[i][0] + 17 + rectL,
                        numRect[i][1] + rectL / 2 + 2,
                    ];
                    posPlus.push(c);
                }
                //add plus sign to svg
                for (let i = 0; i < posPlus.length - 1; i++) {
                    d3.select(".mats")
                        .append("text")
                        .attr("x", posPlus[i][0])
                        .attr("y", posPlus[i][1])
                        .text("+")
                        .attr("class", "math-displayer")
                        .attr("font-size", "10")
                        .attr("fill", "black");
                }
                //                drawPoints(".mats", "red", posPlus);
                // add result and () signs
                // find the middle line firtst
                const midYPt = displayY + displayH / 2;
                const leftBracketPos = [displayX + displayXOffset - 5, midYPt];
                const rightBracketPos = [leftBracketPos[0] + 218, midYPt];
                const equalPos = [rightBracketPos[0] + 15, midYPt];
                const resultPos = [equalPos[0] + 15, midYPt];
                const posNeed = [
                    leftBracketPos,
                    rightBracketPos,
                    equalPos,
                    resultPos,
                ];
                const resultVal = 0.77;
                const textNeed = ["(", ")", "="];
                for (let i = 0; i < textNeed.length; i++) {
                    d3.select(".mats")
                        .append("text")
                        .attr("x", posNeed[i][0])
                        .attr("y", posNeed[i][1])
                        .text(textNeed[i])
                        .attr("class", "math-displayer")
                        .attr("font-size", "10")
                        .attr("fill", "black");
                }
                // add result rect
                if (Math.abs(numFromResult[id]) < 0.5) {
                    color = "black";
                } else {
                    color = "white";
                }
                // append rect
                d3.select(".mats")
                    .append("rect")
                    .attr("x", resultPos[0])
                    .attr("y", resultPos[1] - rectL / 2)
                    .attr("width", rectL)
                    .attr("height", rectL).style("stroke", "black")
                    .attr("fill", myColor(numFromResult[id]))
                    .attr("class", "math-displayer"); //.raise();
                // append text
                d3.select(".mats")
                    .append("text")
                    .attr("x", resultPos[0])
                    .attr("y", resultPos[1])
                    .text(roundToTwo(numFromResult[id]))
                    .attr("class", "math-displayer")
                    .attr("font-size", "5")
                    .attr("fill", color);
                // drawPoints(".mats", "red", posNeed);
                // add divider
                const lineSPt: [number, number] = [displayX + 15, midYPt];
                const lineEPt: [number, number] = [
                    displayX + displayXOffset - 3,
                    midYPt,
                ];
                d3.select(".mats")
                    .append("text")
                    .attr("x", lineSPt[0]-10)
                    .attr("y", lineSPt[1])
                    .text("Avg")
                    .attr("class", "math-displayer")
                    .attr("font-size", "12.5")
                    .attr("fill", "black");
            })
            
            .on("mouseout", function (event) {
                const id: number = Number(d3.select(this).attr("id"));
                if(poolingRects!=null){
                    for (let ii = 0; ii < poolingRects.length; ii++) {
                            poolingRects[ii]!.style.opacity = "1";
                            poolingRects[ii]!.style.strokeWidth = "0.1";
                            poolingRects[ii]!.style.stroke = "gray";
                    }
                }

                for (let ii = 0; ii < thirdGCN.length; ii++) {
                    //   if (ii != id) {
                    thirdGCN[ii].forEach((node: any, index: number) => {
                        node.style.opacity = "1";
                        node.style.stroke = "gray";
                        node.style.strokeWidth = "0.1";
                    });
                    // }else{
                    //     thirdGCN[ii].forEach((node: any, index: number) => {
                    //         node.style.stroke = "gray";
                    //         node.style.strokeWidth = "1";
                    //     });
                    // }
                }
                //remove displayer
                d3.selectAll(".math-displayer").remove();
            });
        
        poolingRects.push(rect.node());
    }

    //add text
    addLayerName(locations, "Pooling", 102, -200+10, gg);
    //draw the cross connections btw last GCN layer and pooling layer

    //do some transformations on the original locations
    for (let i = 0; i < oLocations.length; i++) {
        oLocations[i][0] += featureChannels * rectW;
        oLocations[i][1] += rectH / 2;
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
            .attr("fill", "none")
            .attr("class", "crossConnection");

        paths.push(path.node());
    }
    //draw frame
    poolingFrame = g
        .append("rect")
        .attr("x", locations[0][0] + 102)
        .attr("y", midY - 5)
        .attr("width", rectW * featureChannels)
        .attr("height", rectH)
        .attr("fill", "none")
        .attr("opacity", 0.25)
        .attr("stroke", "black")
        .attr("stroke-width", 1)
        .attr("layerID", 4)
        .attr("class", "poolingFrame");
    //send all paths to the back
    d3.selectAll("path").lower();

    g.on("mouseover", function (event, d) {

        //interaction with paths
        if (paths != null) {
            paths.forEach((div: HTMLElement) => {
                div.style.opacity = "1";
            });
        }
        //interaction with frame
        d3.select(".poolingFrame").style("opacity", 1);
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
        d3.select(".poolingFrame").style("opacity", 0.25);
        //d3.selectAll('[layerID="3"][class="frame"]').attr("opacity", 0);
        const layerFrames = frames["GCNConv3"];
        layerFrames.forEach((frame: HTMLElement) => {
            frame.style.opacity = "0.25";
        });
    });

    return { one: one, g: g, poolingFrame:poolingFrame.node() };
}

//the function to draw the last two layers of the model
export function drawTwoLayers(one: any, final: any, myColor: any, featureChannels: number) {
    const rectH = 15;
    const rectW = 5;
    //find the next position
    one[0][0] += featureChannels * rectW + 102;
    let aOne = deepClone(one);
    one[0][1] -= rectH / 2;
    //drawPoints(".mats", "red", one);
    let result = softmax(final);
    //visulaize
    const g = d3
        .select(".mats")
        .append("g")
        .attr("class", "twoLayer layerVis")
        .attr("id", "layerNum_5");
    for (let m = 0; m < final.length; m++) {
        g.append("rect")
            .attr("x", one[0][0] + rectH * m)
            .attr("y", one[0][1])
            .attr("width", rectH)
            .attr("height", rectH)
            .attr("fill", myColor(result[m]))
            .attr("opacity", 1)
            .attr("stroke", "gray")
            .attr("stroke-width", 0.1)
            .attr("class", "resultRect")
            .attr("id", `${m}`);
    }

    //add labels
    g.append("text")
        .attr("x", one[0][0] + 5)
        .attr("y", one[0][1])
        .attr("font-size", "10px")
        .attr("fill", "gray")
        .attr("transform", "rotate(-45," + one[0][0] + "," + one[0][1] + ")")
        .text("Non-Mutagenic");

    g.append("text")
        .attr("x", one[0][0] + 25)
        .attr("y", one[0][1])
        .attr("font-size", "10px")
        .attr("fill", "gray")
        .attr(
            "transform",
            "rotate(-45," + (one[0][0] + 25) + "," + one[0][1] + ")"
        )
        .text("Mutagenic");

    //draw frame
    const fr1 = g
        .append("rect")
        .attr("x", one[0][0])
        .attr("y", one[0][1])
        .attr("width", 2 * rectH)
        .attr("height", rectH)
        .attr("fill", "none")
        .attr("opacity", 0.25)
        .attr("stroke", "black")
        .attr("stroke-width", 1)
        .attr("layerID", 4)
        .attr("class", "frame")
        .attr("fr", 1)
        .attr("id", "fr1");
    //add text
    addLayerName(one, "Prediction Result", 0, 28, g);
    //find positions to connect
    let bOne = deepClone(aOne);
    bOne[0][0] -= 102;
    //connect
    const path1 = d3.select(".mats")
        .append("path")
        .attr("d", d3.line()([aOne[0], bOne[0]]))
        .attr("stroke", "black")
        .attr("opacity", 0.05)
        .attr("fill", "none")
        .attr("class", "path1")
        .attr("id", "path1");

    //visualize the result
    aOne[0][0] += rectH * 2 + 102;
    //drawPoints(".mats","red",aOne);
    aOne[0][1] -= rectW / 2;


    let cOne = deepClone(aOne);

    return { locations: [aOne[0], cOne[0]], g: g, g1: null, fr1:fr1.node(), path1:path1.node() };
}


export function drawResultLayer(
    locations:any, 
    layerLocations: any, 
    results: any, 
    rectW:number, 
    rectH:number, 
    myColor:any, 
    featureVisTable:any,
    frames: any,
    graph:any,
    trainingNodes: number[]
){
    let resultLabelsList = [];
    const layer = d3
            .select(".mats")
            .append("g")
            .attr("class", "layerVis")
            .attr("id", "layerNum_4");
    //visualize results
    for(let i=0; i<layerLocations.length; i++){
        const x = layerLocations[i][0];
        const y = layerLocations[i][1];

        const resultArray = results[i];

        const g = layer
            .append("g")
            .attr("class", "resultVis")
            .attr("node", i)
            .attr("layerID", 4);

        for(let j=0; j<resultArray.length; j++){
            g.append("rect")
                .attr("x", x+j*rectW)
                .attr("y", y)
                .attr("width", rectW)
                .attr("height", rectH)
                .attr("fill", myColor(resultArray[j]))
                .attr("stroke", "gray")
                .attr("stroke-width", 0.1)
                .attr("id", `resultRect${i}`)
                .attr("class", "resultRect")
                .attr("rectID",j);
        }

        const f = g
            .append("rect")
            .attr("x", x)
            .attr("y", y)
            .attr("width", rectW * 4)
            .attr("height", rectH)
            .attr("fill", "none")
            .attr("opacity", 0.25)
            .attr("stroke", "black")
            .attr("stroke-width", 1)
            .attr("node", i)
            .attr("layerID", 4)
            .attr("class", "frame");
        
        //add result label
        const maxIdx = findMaxIndex(resultArray);
        //decide label
        let resultLabel = "Class A";
        if(maxIdx==1)resultLabel = "Class B";
        else if(maxIdx==2)resultLabel = "Class C";
        else if(maxIdx==3)resultLabel = "Class D";

        //determine a node is train node or test node
        if(trainingNodes.includes(i))resultLabel += " / train node"
        else resultLabel += " / test node";

        //draw label
        const label = g.append("text")
                        .attr("x", x + 45)
                        .attr("y", y + 7)
                        .text(resultLabel)
                        .style("fill", "gray")
                        .style("font-size", "12px"); 


        resultLabelsList.push(label.node() as SVGElement);
        featureVisTable[4].push(g.node() as SVGElement);
        frames["results"].push(f.node() as SVGElement);
    }

    //visualize paths
    let paths:any = [];

    let alocations = deepClone(locations);
    for (let i = 0; i < alocations.length; i++) {
        alocations[i][0] += 20;
        alocations[i][1] += rectH / 2;
    }

    let blocations = deepClone(alocations);
    for (let i = 0; i < blocations.length; i++) {
        blocations[i][0] += 202;
    }
    // drawPoints(".mats", "red", blocations);

    //draw one-one paths
    for (let i = 0; i < alocations.length; i++) {
        const path = d3.select(".mats")
            .append("path")
            .attr("d", d3.line()([alocations[i], blocations[i]]))
            .attr("stroke", "black")
            .attr("opacity", 0.25)
            .attr("fill", "none")
            .attr("endingNode", i)
            .attr("id", `endingNode${i}`)
            .attr("layerID", 4).attr("class", "crossConnection lastLayerConnections").lower();
        paths.push(path.node() as SVGPathElement);
    }



    addLayerName(
        layerLocations,
        "Prediction Results",
        0,
        70,
        d3.select(`g#layerNum_4`)
    );
    return {
        featureVisTable:featureVisTable,
        paths:paths,
        resultLabelsList:resultLabelsList
    };
}




//we need the locations for previous two feature visualizers
//also need the final probability results
export function drawResultVisForLinkModel(
    location1:[number, number], 
    location2:[number, number], 
    prob:number,
    myColor:any,
    layerLocations: any
){  
    //compute the mid point
    const midY = (location1[1] + location2[1])/2;
    const featureX = location1[0] + 64 * 5 + 100;
    const midYForFeature = midY + 15;

    const startingPoint1:[number, number] = [location1[0]+64*5, location1[1]+15/2];
    const startingPoint2:[number, number] = [location2[0]+64*5, location2[1]+15/2];
    const endingPoint:[number, number] = [featureX, midYForFeature];

    //draw the result layer
    const g = d3
        .select(".mats")
        .append("g")
        .attr("class", "layerVis")
        .attr("id", `layerNum_3`);

    //add label
    addLayerName(
        layerLocations,
        "Prediction Result",
        0,
        30,
        d3.select(`g#layerNum_3`)
    );
    
    //getting the probability result
    const trueProb = sigmoid(prob);
    const falseProb = 1 - trueProb;
    const probs = [trueProb, falseProb];

    console.log("prob check", probs);

    //add a featureVisualizer
    const featureVisualizer = g.append("g");
    
  //  for(let i=0; i<2; i++){
    featureVisualizer.append("rect")
        .attr("x", featureX)
        .attr("y", midYForFeature-15/2)
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", myColor(trueProb))
        .attr("stroke", "black")
        .attr("stroke-width", 0.1)
        .attr("class", "resultVis")
        .attr("id", `resultRect`);
    g.append("text")
        .attr("x", featureX)
        .attr("y", midYForFeature)
        .text(trueProb.toFixed(2))
        .style("fill", "white")
        .style("font-size", "5px");

//    }

    //add result label
    let result = "True";
    if(trueProb<0.5)result = "False";
    const resultLabel = g.append("text")
                        .attr("x", featureX+20)
                        .attr("y", midYForFeature+5)
                        .text(result)
                        .style("fill", "gray")
                        .style("font-size", "12px");


    g.append("rect")
        .attr("x", featureX)
        .attr("y", midYForFeature-15/2)
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("opacity", 0.25)
        .attr("stroke-width", 1)
        .attr("class", "resultFrame frame")
        .raise();
        // .attr("class", "resultRect")
        // .attr("id", `resultRect`);

    //draw the connection between two layers
    const res1 = computeMids(startingPoint1, endingPoint);
    const hpoint1:[number, number] = res1[0];
    const lpoint1:[number, number] = res1[1];

    const res2 = computeMids(startingPoint2, endingPoint);
    const hpoint2:[number, number] = res2[0];
    const lpoint2:[number, number] = res2[1];

    const curve = d3.line().curve(d3.curveBasis);

    d3.select(".mats")
        .append("path")
        .attr(
            "d",
            curve([startingPoint1, hpoint1, lpoint1, endingPoint])
        )
        .attr("stroke", "black")
        .attr("opacity", 0.05)
        .attr("fill", "none")
        .attr("layerID", 3)
        .attr("class", "pathsToResult crossConnection");

    d3.select(".mats")
        .append("path")
        .attr(
            "d",
            curve([startingPoint2, hpoint2, lpoint2, endingPoint])
        )
        .attr("stroke", "black")
        .attr("opacity", 0.05)
        .attr("fill", "none")
        .attr("layerID", 3)
        .attr("class", "pathsToResult crossConnection");
}




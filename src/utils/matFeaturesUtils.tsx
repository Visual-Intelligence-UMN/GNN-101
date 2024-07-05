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
import { roundToTwo } from "@/pages/WebUtils";
import { deprecate } from "util";

//draw cross connections between feature visualizers
export function drawCrossConnection(
    graph: any,
    locations: any,
    firstVisSize: number,
    gapSize: number,
    layerID: number
) {
    const rectH = 15;
    console.log("layerID", layerID);
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
                    .attr("layerID", layerID)
                    .attr("class", "crossConnection");
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

//compute mid point for basis curve drawing
export function computeMids(point1: any, point2: any) {
    //find mid - x
    const midX = (point1[0] + point2[0]) / 2;
    const res = [
        [midX - 20, point1[1]],
        [midX + 20, point2[1]],
    ];
    console.log("res", res);
    return res;
}

//draw aid utils for matrix visualization(column and row frames)
export function drawMatrixPreparation(graph: any, locations: any, gridSize:number) {
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
    //drawPoints(".mats", "red", colLocations);
    let colFrames: SVGElement[] = []; //a
    for (let i = 0; i < colLocations.length; i++) {
        const r = d3
            .select(".mats")
            .append("rect")
            .attr("x", colLocations[i][0])
            .attr("y", colLocations[i][1] / ratio)
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
            .attr("x", locations[i][0] - gridSize + rowHeight / 2)
            .attr("y", startY + i * rowHeight)
            .attr("height", rowHeight)
            .attr("width", gridSize)
            .attr("fill", "none")
            .attr("opacity", 0)
            .attr("stroke", "black")
            .attr("stroke-width", 2)
            .attr("class", "rowFrame");

        matFrames.push(r.node() as SVGElement);
    }
    console.log("matFrames", matFrames);
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
    gap:number
) {
    //initial visualizer
    for (let i = 0; i < locations.length; i++) {
        locations[i][0] += 25;
        locations[i][1] += 2;
    }
    //draw cross connections for features layer and first GCNConv layer
    drawCrossConnection(graph, locations, featureChannels * rectW, gap+2, 0);

    //using locations to find the positions for first feature visualizers
    const firstLayer = d3.select(".mats").append("g").attr("id", "layerNum_0");
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

        //push feature visualizer into the table
        featureVisTable[0].push(g.node() as SVGElement);
    }
    //drawPoints(".mats", "red", schemeLocations);
    //add layer label for the first one

    if(featureChannels!=34)addLayerName(locations, "Graph Features", 0, 30, firstLayer);
    else addLayerName(locations, "Graph Features", 0, 70, firstLayer);
    return {
        locations: locations,
        frames: frames,
        schemeLocations: schemeLocations,
        featureVisTable: featureVisTable,
        firstLayer: firstLayer,
    };
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
    featureVisTable:any
){
    //const cate = get_category_node(features[i]) * 100;
    const g = layer
        .append("g")
        .attr("class", "featureVis")
        .attr("node", i)
        .attr("layerID", k + 1);

    console.log("new", gcnFeature);

    //loop through each node
    let nodeMat = gcnFeature[i];
    console.log("nodeMat", i, nodeMat);
    //where we met encounter issue
    for (let m = 0; m < featureChannels; m++) {
        const rect = g
            .append("rect")
            .attr("x", locations[i][0] + rectW * m)
            .attr("y", locations[i][1])
            .attr("width", rectW)
            .attr("height", rectH)
            .attr("fill", myColor(nodeMat[m]))
            .attr("opacity", 1)
            .attr("stroke", "gray")
            .attr("stroke-width", 0.1);
        //if it's the last layer, store rect into thirdGCN
        if (k == 2 && m<featureChannels) {
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
        console.log("cst loop", i, myColor, valueTable[i],
            nameTable[i], xLocationTable[i], yLocationTable[i],
            layerTable[i])
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
    colorSchemesTable: any,
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
    //a table to save all rects in the last GCNConv layer
    let thirdGCN: any = Array.from({ length: featureChannels }, () => []);
    console.log("thirdGCN", thirdGCN);
    console.log("gcnf", gcnFeatures);
    console.log("CONV1", conv1);
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
        console.log("FVT", featureVisTable);
        if (k != 2) {
            // visualize cross connections btw 1st, 2nd, 3rd GCNConv
            paths = drawCrossConnection(
                graph,
                locations,
                (featureChannels-2) * rectW,
                102,
                k + 1
            );
            console.log("grouped grouped", paths);
        } else {
            //visualize pooling layer
            const poolingPack = drawPoolingVis(
                locations,
                pooling,
                myColor,
                frames,
                colorSchemesTable,
                thirdGCN,
                conv3,
                featureChannels
            );
            one = poolingPack["one"];
            poolingVis = poolingPack["g"];
            poolingFrame = poolingPack["poolingFrame"];
            console.log("poolingVis", poolingVis);
            console.log("ONE", one);
            schemeLocations.push([one[0][0], 350]);
            //visualize last layer and softmax output
            const tlPack = drawTwoLayers(one, final, myColor, featureChannels);
            let aOne = tlPack["locations"];
            outputVis = tlPack["g"];
            resultVis = tlPack["g1"];
            path1 = tlPack["path1"];
            fr1 = tlPack["fr1"];
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

        //select layers
        const l1 = d3.select(`g#layerNum_1`);
        const l2 = d3.select(`g#layerNum_2`);
        const l3 = d3.select(`g#layerNum_3`);
        const l4 = d3.select(`g#layerNum_4`);
        const l5 = d3.select(`g#layerNum_5`);
        const l6 = d3.select(`g#layerNum_6`);

        const schemeOffset = 150;

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

        colorSchemesTable = drawColorSchremeSequence(infoTable, myColor);
    }

    console.log("thirdGCN after filled", thirdGCN);

    return {
        locations: locations,
        frames: frames,
        schemeLocations: schemeLocations,
        featureVisTable: featureVisTable,
        colorSchemesTable: colorSchemesTable,
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
    colorSchemesTable: any,
    final: any,
    firstLayer: any,
    maxVals: any,
    featureChannels: number
) {
    //GCNCov Visualizer
    let paths: any;
    let resultPaths: any;
    const gcnFeatures = [conv1, conv2, conv3];
    //a table to save all rects in the last GCNConv layer
    let thirdGCN: any = Array.from({ length: featureChannels }, () => []);
    console.log("thirdGCN", thirdGCN);
    console.log("gcnf", gcnFeatures);
    console.log("CONV1", conv1);
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
                locations[i][0] += 34 * 5 + 150;
            }
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
                    layer, i, k, gcnFeature, 2, locations, 
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
        console.log("FVT", featureVisTable);
        if (k != 2) {
            // visualize cross connections btw 1st, 2nd, 3rd GCNConv
            paths = drawCrossConnection(
                graph,
                locations,
                (featureChannels) * rectW,
                152,
                k + 1
            );
            console.log("grouped grouped", paths);
        } else {
            //here's the place we draw the result layer
            //do locations tranformation
            let layerLocations = deepClone(locations);
            for(let i=0; i<layerLocations.length; i++){
                layerLocations[i][0] += rectW*2+200;
            }
            resultPaths = drawResultLayer(locations, layerLocations, result, rectW, rectH, myColor, featureVisTable, frames, graph);
            //drawPoints(".mats", "red", layerLocations);
            resultLabelsList = resultPaths.resultLabelsList;
        }
        console.log("schemeLocations", schemeLocations);
    }

    //select layers
    const l1 = d3.select(`g#layerNum_1`);
    const l2 = d3.select(`g#layerNum_2`);
    const l3 = d3.select(`g#layerNum_3`);
    const l4 = d3.select(`g#layerNum_4`);

    const schemeOffset =600;

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

    colorSchemesTable = drawColorSchremeSequence(infoTable, myColor);

    console.log("thirdGCN after filled", thirdGCN);

    return {
        locations: locations,
        frames: frames,
        schemeLocations: schemeLocations,
        featureVisTable: featureVisTable,
        colorSchemesTable: colorSchemesTable,
        firstLayer: firstLayer,
        maxVals: maxVals,
        paths: paths,
        thirdGCN: thirdGCN,
        resultPaths: resultPaths,
        resultLabelsList:resultLabelsList
    };
}

//draw pooling visualizer
export function drawPoolingVis(
    locations: any,
    pooling: number[],
    myColor: any,
    frames: any,
    colorSchemesTable: any,
    thirdGCN: any,
    conv3: any,
    featureChannels: number
) {
    console.log("thirdGCN from pooling vis", thirdGCN);

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
        (locations[locations.length - 1][1] - locations[0][1]) / 2 + 50;
    //all paths should connect to mid point
    const one = [[locations[0][0] + 102, midY + 2]];
    //drawPoints(".mats", "red", one);
    //draw the pooling layer
    console.log("from feature vis", pooling);
    const gg = d3
        .select(".mats")
        .append("g")
        .attr("class", "layerVis")
        .attr("id", "layerNum_4");
    const g = gg.append("g").attr("class", "pooling");

    //coordination for the math formula display
    const displayX = locations[0][0] + 102;
    const displayY = midY - 100;

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
                console.log("thirdGCN, mouseover", id, thirdGCN[id]);
                //interact with pooling vis
                console.log("poolingRect", poolingRects);
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
                console.log("fetch pooling conv3", conv3);
                const matConv3: any = chunkArray(conv3, featureChannels);
                console.log("fetch 1", matConv3);
                const aMat = preprocessFloat32ArrayToNumber(matConv3);
                console.log("fetch 2", aMat);
                const matConv3t: any = transposeMat(aMat);
                console.log("fecth 3", matConv3t);
                const numFromFeatures: any = matConv3t[id];
                console.log("fetch 4", numFromFeatures);
                const numFromResult = pooling;

                //draw rects based on the coordination
                console.log("oover", yIncr, numRect);
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
                console.log("thirdGCN, mouseout", id, thirdGCN[id]);

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
    addLayerName(locations, "Pooling", 102, -182, gg);
    //draw the cross connections btw last GCN layer and pooling layer

    //do some transformations on the original locations
    for (let i = 0; i < oLocations.length; i++) {
        oLocations[i][0] += rectW * featureChannels;
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
            .attr("fill", "none").attr("class", "crossConnection");

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
        d3.select(".poolingFrame").style("opacity", 0);
        //d3.selectAll('[layerID="3"][class="frame"]').attr("opacity", 0);
        const layerFrames = frames["GCNConv3"];
        layerFrames.forEach((frame: HTMLElement) => {
            frame.style.opacity = "0";
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
        .attr("font-size", "5px")
        .attr("transform", "rotate(-45," + one[0][0] + "," + one[0][1] + ")")
        .text("Non-Mutagenic");

    g.append("text")
        .attr("x", one[0][0] + 15)
        .attr("y", one[0][1])
        .attr("font-size", "5px")
        .attr(
            "transform",
            "rotate(-45," + (one[0][0] + 10) + "," + one[0][1] + ")"
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
        .attr("opacity", 0)
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

    console.log("mat result", result);
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
    graph:any
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
            .attr("opacity", 0)
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
        //draw label
        const label = g.append("text")
                        .attr("x", x + 45)
                        .attr("y", y + 5)
                        .text(resultLabel)
                        .style("fill", "gray")
                        .style("font-size", "8px"); 


        resultLabelsList.push(label.node() as SVGElement);
        featureVisTable[4].push(g.node() as SVGElement);
        frames["results"].push(f.node() as SVGElement);
    }

    //visualize paths
    let paths:any = [];
    console.log("layerID", 4);
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
    console.log("location length", alocations.length);
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

    console.log("result paths", paths);

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


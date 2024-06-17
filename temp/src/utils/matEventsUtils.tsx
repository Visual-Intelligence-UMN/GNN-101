import { deepClone, softmax } from "./utils";
import {
    addLayerName,
    buildBinaryLegend,
    buildLegend,
    translateLayers,
    calculatePrevFeatureVisPos,
    loadWeights,
} from "./matHelperUtils";
import {
    drawCrossConnection,
    drawPoolingVis,
    computeMids,
    drawTwoLayers,
    drawMatrixPreparation,
    drawNodeFeatures,
    drawGCNConv,
} from "./matFeaturesUtils";
import * as d3 from "d3";
import { create, all } from "mathjs";

//graph feature events interactions - mouseover
export function oFeatureMouseOver(
    layerID: string,
    node: string,
    frames: any,
    matFrames: any
) {
    console.log("Current layerID and node", layerID, node);
    const fr = frames["features"][Number(node)];
    fr.style.opacity = "1";

    //matrix frame interaction
    const matf = matFrames[Number(node)];
    if (matf != null) {
        matf.style.opacity = "1";
    }

    return {
        frames: frames,
        matFrames: matFrames,
    };
}

//graph feature events interactions - mouseout
export function oFeatureMouseOut(
    layerID: string,
    node: string,
    frames: any,
    matFrames: any
) {
    console.log("Current layerID and node", layerID, node);
    const fr = frames["features"][Number(node)];
    fr.style.opacity = "0";

    //matrix frame interaction
    const matf = matFrames[Number(node)];
    if (matf != null) {
        matf.style.opacity = "0";
    }

    return {
        frames: frames,
        matFrames: matFrames,
    };
}

//detailed view recovery - event: click .mats
export function detailedViewRecovery(
    event: any,
    dview: boolean,
    lock: boolean,
    transState: string,
    recordLayerID: number,
    poolingOutEvent: any,
    poolingOverEvent: any,
    poolingVis: any,
    colorSchemesTable: any
) {
    console.log("click!", dview, lock);

    //remove calculation process visualizer
    d3.selectAll(".procVis").transition().duration(1000).attr("opacity", 0);
    setTimeout(() => {
        d3.selectAll(".procVis").remove();
    }, 2000);

    //recover all frames
    d3.selectAll(".colFrame").style("opacity", 0);
    d3.selectAll(".rowFrame").style("opacity", 0);
    d3.selectAll(".frame").style("opacity", 0);
    //recover opacity of feature visualizers
    d3.selectAll(".featureVis").style("opacity", 1);
    d3.selectAll(".oFeature").style("opacity", 1);
    //recover layers positions
    if (transState == "GCNConv") {
        if (recordLayerID >= 0) {
            translateLayers(recordLayerID, -300);
            recordLayerID = -1;
        }
    } else if (transState == "pooling") {
        translateLayers(3, -300);
        //recover events
        if (poolingOutEvent) poolingVis?.on("mouseout", poolingOutEvent);
        if (poolingOverEvent) poolingVis?.on("mouseover", poolingOverEvent);
        //recover frame
        d3.select(".poolingFrame").style("opacity", 0);
    } else if (transState == "result") {
        translateLayers(5, -300);
    } else {
        translateLayers(4, -300);
    }

    //recover all feature visualizers and paths
    setTimeout(() => {
        d3.select(".pooling")
            .style("pointer-events", "auto")
            .style("opacity", 1);
        d3.selectAll(".twoLayer")
            .style("pointer-events", "auto")
            .style("opacity", 1);
        d3.selectAll("path").style("opacity", 0.05);
    }, 1750);

    //recover color schemes opacity
    colorSchemesTable.forEach((d: any, i: any) => {
        d.style.opacity = "1";
    });

    // unlock the visualization system
    if (
        !d3.select(event.target).classed("featureVis") &&
        !d3.select(event.target).classed("pooling") &&
        !d3.select(event.target).classed("twoLayer")
    ) {
        dview = false;
        lock = false;
    }

    return {
        dview: dview,
        lock: lock,
        transState: transState,
        recordLayerID: recordLayerID,
        poolingOutEvent: poolingOutEvent,
        poolingOverEvent: poolingOverEvent,
        poolingVis: poolingVis,
        colorSchemesTable: colorSchemesTable,
    };
}

export function featureVisMouseOver(
    layerID: number,
    node: number,
    paths: any,
    frames: any,
    adjList: any,
    matFrames: any,
    colFrames: any
) {
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
            } else {
                matFrames[vis].style.opacity = "1";
            }
        });
    }

    if (colFrames != null) {
        colFrames[node].style.opacity = "1";
    }

    return {
        paths: paths,
        frames: frames,
        matFrames: matFrames,
        colFrames: colFrames,
    };
}

export function featureVisMouseOut(
    layerID: number,
    node: number,
    paths: any,
    frames: any,
    adjList: any,
    matFrames: any,
    colFrames: any
) {
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

    if (colFrames != null) {
        colFrames[node].style.opacity = "0";
    }

    return {
        paths: paths,
        frames: frames,
        matFrames: matFrames,
        colFrames: colFrames,
    };
}

export function featureVisClick(
    layerID: number,
    node: number,
    recordLayerID: number,
    colorSchemesTable: any,
    adjList: any,
    featureVisTable: any,
    features: any,
    conv1: any,
    conv2: any,
    bias: any,
    myColor: any,
    weights: any
) {
    console.log("Current layerID and node", layerID, node);
    setTimeout(() => {
        translateLayers(layerID, 300);
    }, 1750);
    //record the layerID
    recordLayerID = layerID;

    //reduce color schemes opacity
    console.log("CST before modification", colorSchemesTable);
    colorSchemesTable.forEach((d: any, i: any) => {
        console.log(
            `Before modification: Element ${i} opacity`,
            d.style.opacity
        );
        d.style.opacity = "0.2";
        console.log(
            `After modification: Element ${i} opacity`,
            d.style.opacity
        );
    });
    //choose the right color schemes to display
    colorSchemesTable[layerID].style.opacity = "1";
    colorSchemesTable[layerID + 1].style.opacity = "1";
    //choose the right feature viusualizers to display
    let posList = []; //a list to manage all position from the previous layer feature vis
    let neighbors = adjList[node];
    for (let i = 0; i < neighbors.length; i++) {
        //display pre layer
        let cur = neighbors[i];
        featureVisTable[layerID][cur].style.opacity = "1";

        //find position and save it
        let c = calculatePrevFeatureVisPos(featureVisTable, layerID, cur);
        posList.push(c);
    }
    let curNode = featureVisTable[layerID + 1][node];
    curNode.style.opacity = "1"; //display current node

    //calculation process visualizer
    let coord = calculatePrevFeatureVisPos(featureVisTable, layerID, node);
    console.log("coord", coord);

    //find position for intermediate feature vis
    let coordFeatureVis = deepClone(coord);
    coordFeatureVis[0] += 102;

    //TODO: implment the feature visualizer for intermediate output
    //data processing for features aggregation and multipliers calculation
    //build a list for d_i and d_j for look-up
    let dList = []; //a list store all nodes' neigbors information(already plus one)
    for (let i = 0; i < adjList.length; i++) {
        dList.push(adjList[i].length);
    }
    //compute x
    const math = create(all, {});
    let featuresTable = [features, conv1, conv2];
    let X = new Array(featuresTable[layerID][node].length).fill(0);
    let mulValues = []; //an array to store all multiplier values
    for (let i = 0; i < adjList[node].length; i++) {
        //find multipliers
        let node_i = node;
        let node_j = adjList[node_i][i];
        let mulV = 1 / Math.sqrt(dList[node_i] * dList[node_j]);
        mulValues.push(mulV);
        //compute x'
        console.log("compute x loop", featuresTable[layerID][node_j]);
        const prepMat = [...featuresTable[layerID][node_j]];
        let matA = math.matrix(prepMat);
        X = math.add(math.multiply(prepMat, mulV), X);
    }
    const dummy: number[] = math.multiply(math.transpose(weights[layerID]), X);

    console.log("compute x'", mulValues, dList, layerID, X.toString(), dummy);

    const g = d3.select(".mats").append("g").attr("class", "procVis");
    let w = 2;
    if (dummy.length < 64) {
        w = 5;
        console.log("compute x 0");
    } else w = 2;
    setTimeout(() => {
        //draw feature visualizer
        for (let m = 0; m < dummy.length; m++) {
            g.append("rect")
                .attr("x", coordFeatureVis[0] + w * m)
                .attr("y", coordFeatureVis[1] - 5)
                .attr("width", w)
                .attr("height", 10)
                .attr("fill", myColor(dummy[m]))
                .attr("opacity", 0)
                .attr("stroke", "gray")
                .attr("stroke-width", 0.1)
                .attr("class", "procVis");
        }

        //draw frame
        g.append("rect")
            .attr("x", coordFeatureVis[0])
            .attr("y", coordFeatureVis[1] - 5)
            .attr("width", w * dummy.length)
            .attr("height", 10)
            .attr("fill", "none")
            .attr("opacity", 0)
            .attr("stroke", "black")
            .attr("stroke-width", 1)
            .attr("class", "procVis");

        //path connect - connect prev layer feature vis to intermediate feature vis
        const curve = d3.line().curve(d3.curveBasis);
        for (let i = 0; i < posList.length; i++) {
            const res = computeMids(posList[i], coordFeatureVis);
            const hpoint = res[0];
            const lpoint = res[1];
            console.log("control points", hpoint, lpoint);
            d3.select(".mats")
                .append("path")
                .attr("d", curve([posList[i], hpoint, lpoint, coordFeatureVis]))
                .attr("stroke", "black")
                .attr("opacity", 0)
                .attr("fill", "none")
                .attr("class", "procVis");

            //draw multipliers
            let x = (coordFeatureVis[0] - posList[i][0]) / 2 + posList[i][0];
            let y = (coordFeatureVis[1] - posList[i][1]) / 2 + posList[i][1];
            console.log("text point", x, y, posList[i][0], posList[i][1]);
            d3.select(".mats")
                .append("text")
                .text(mulValues[i].toFixed(2))
                .attr("x", x - 2)
                .attr("y", y - 2)
                .attr("text-anchor", "middle")
                .attr("font-size", 7.5)
                .attr("class", "procVis")
                .attr("opacity", 0);
        }

        //determine if we need upper-curves or lower-curves
        let curveDir = -1; //true -> -1; false -> 1
        const midNode = adjList.length / 2;
        if (node < midNode) curveDir = 1;
        console.log("curveDir", curveDir);

        //draw paths from intermediate result -> final result
        const layerBias = bias[layerID];
        //find start locations and end locations
        const coordStartPoint: [number, number] = [
            coordFeatureVis[0],
            coordFeatureVis[1] + 2.5 * curveDir,
        ];
        const coordFinalPoint: [number, number] = [
            coord[0] + 400,
            coord[1] + 2.5 * curveDir,
        ];
        const coordMidPoint: [number, number] = [
            coordStartPoint[0] + (102 + 128) / 2,
            coordStartPoint[1] + curveDir * 100,
        ];
        //draw paths
        //drawPoints(".mats", "red", p);
        const lineGenerator = d3
            .line<[number, number]>()
            .curve(d3.curveBasis)
            .x((d) => d[0])
            .y((d) => d[1]);
        for (let i = 0; i < 64; i++) {
            let s: [number, number] = [
                coordStartPoint[0] + 2 * i,
                coordStartPoint[1],
            ];
            let m: [number, number] = [
                coordMidPoint[0] + 2 * i,
                coordMidPoint[1],
            ];
            let e: [number, number] = [
                coordFinalPoint[0] + 2 * i,
                coordFinalPoint[1],
            ];
            d3.select(".mats")
                .append("path")
                .attr("d", lineGenerator([s, m, e]))
                .attr("stroke", myColor(layerBias[i]))
                .attr("stroke-width", 1)
                .attr("opacity", 0)
                .attr("fill", "none")
                .attr("class", "procVis");
        }
        d3.selectAll("path").lower();
        d3.selectAll(".procVis").transition().duration(1000).attr("opacity", 1);
    }, 2500);

    return {
        recordLayerID: recordLayerID,
        colorSchemesTable: colorSchemesTable,
        featureVisTable: featureVisTable,
        features: features,
    };
}

export function poolingVisClick(
    colorSchemesTable: any,
    adjList: any,
    featureVisTable: any
) {
    //lock all feature visualizers and transparent paths
    d3.selectAll("[class='frame'][layerID='3']").style("opacity", 1);
    d3.select(".pooling").style("pointer-events", "none");
    d3.selectAll(".twoLayer")
        .style("pointer-events", "none")
        .style("opacity", 0.2);
    d3.selectAll("path").style("opacity", 0);
    //transparent other feature visualizers
    d3.selectAll(".featureVis").style("opacity", 0.2);
    d3.selectAll(".oFeature").style("opacity", 0.2);
    //translate each layer
    const layerID = 3;

    setTimeout(() => {
        translateLayers(layerID, 300);
    }, 1750);
    d3.select(".poolingFrame").style("opacity", 1);
    //transparent other color schemes
    for (let i = 0; i < 3; i++) colorSchemesTable[i].style.opacity = "0.2";
    //display the features we want to display
    //display the frame we want to display
    console.log("FST click", frames);
    for (let i = 0; i < adjList.length; i++) {
        featureVisTable[3][i].style.opacity = "1";
    }

    return {
        colorSchemesTable: colorSchemesTable,
        featureVisTable: featureVisTable,
    };
}

export function outputVisClick(resultVis: any, colorSchemesTable: any) {
    d3.selectAll(".twoLayer").style("pointer-events", "none");
    d3.selectAll("path").style("opacity", 0);
    //transparent other feature visualizers
    d3.selectAll(".featureVis").style("opacity", 0.2);
    d3.selectAll(".oFeature").style("opacity", 0.2);
    resultVis?.style("opacity", 0.2);
    //translate each layer
    const layerID = 4;
    setTimeout(() => {
        translateLayers(layerID, 300);
    }, 1750);
    for (let i = 0; i < layerID; i++)
        colorSchemesTable[i].style.opacity = "0.2";
    colorSchemesTable[colorSchemesTable.length - 1].style.opacity = "0.2";
    return {
        resultVis: resultVis,
        colorSchemesTable: colorSchemesTable,
    };
}

export function resultVisClick(colorSchemesTable: any) {
    d3.select(".pooling").style("pointer-events", "none").style("opacity", 0.2);
    d3.selectAll(".twoLayer").style("pointer-events", "none");
    d3.selectAll("path").style("opacity", 0);
    //transparent other feature visualizers
    d3.selectAll(".featureVis").style("opacity", 0.2);
    d3.selectAll(".oFeature").style("opacity", 0.2);
    //translate each layer
    const layerID = 5;
    setTimeout(() => {
        translateLayers(layerID, 300);
    }, 1750);
    for (let i = 0; i < layerID; i++)
        colorSchemesTable[i].style.opacity = "0.2";
    return colorSchemesTable;
}

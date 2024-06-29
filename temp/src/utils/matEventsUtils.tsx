import { deepClone, drawPoints, get_cood_from_parent, softmax } from "./utils";
import {
    translateLayers,
    calculatePrevFeatureVisPos,
    loadWeights,
} from "./matHelperUtils";
import { computeMids } from "./matFeaturesUtils";
import * as d3 from "d3";
import { create, all } from "mathjs";
import { roundToTwo } from "@/pages/WebUtils";
import { drawAniPath, drawBiasPath, drawBiasVector, drawFinalPath, drawReLU, drawSummationFeature, drawWeightsVector } from "./matAnimateUtils";
import { injectPlayButtonSVG } from "./svgUtils";

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

export function resultRectMouseover() {
    //  console.log("event.target.classList", event.target.classList);
    const a = d3.select(".path1").style("opacity", 1);
    const b = d3.select(".poolingFrame").style("opacity", 1);
    const c = d3.select("#fr1").style("opacity", 1);
    console.log("mouse in", a, b, c);
    // fr1!.style.opacity = "1";
    // poolingFrame!.style.opacity = "1";
    // path1!.style.opacity = "1";
    console.log("signal!");
}

export function resultRectMouseout() {
    d3.select(".path1").style("opacity", 0.02);
    d3.select(".poolingFrame").style("opacity", 0);
    d3.select("#fr1").style("opacity", 0);
    console.log("signal out!");
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
    colorSchemesTable: any,
    featureChannels: number
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
    d3.selectAll(".oFeature")
        .style("opacity", 1)
        .style("pointer-events", "auto");
    //recover layers positions
    if (transState == "GCNConv") {
        if (recordLayerID >= 0) {
            translateLayers(recordLayerID, -(102 * 3 + 5 * featureChannels * 2));
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
        d3.selectAll(".resultRect").style("pointer-events", "none");

        d3.selectAll(".resultRect")
            .style("pointer-events", "auto")
            .on("mouseover", function (event: any, d: any) {
                resultRectMouseover();
            });
        d3.selectAll(".resultRect")
            .style("pointer-events", "auto")
            .on("mouseout", function (event: any, d: any) {
                resultRectMouseout();
            });

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
    colFrames: any,
    featureChannels: number
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
    weights: any,
    lock: boolean,
    setIntervalID: (id: any) => void,
    featureChannels: number
) {

    let biasCoord: [number, number];
    let res10: [number, number];
    let res11: [number, number];
    let nextCoord: [number, number];

    let currentStep = 0;
    let isPlaying = true;
    const rectH = 15;
    const rectW = 5;
    const rectW7 = 10;
    console.log("Current layerID and node", layerID, node);
    setTimeout(() => {
        translateLayers(layerID, 102 * 3 + 5 * featureChannels * 2);
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
        let c = calculatePrevFeatureVisPos(featureVisTable, layerID, cur, featureChannels, 7);
        posList.push(c);
    }
    let curNode = featureVisTable[layerID + 1][node];
    curNode.style.opacity = "1"; //display current node

    //calculation process visualizer
    let coord = calculatePrevFeatureVisPos(featureVisTable, layerID, node, featureChannels, 7);
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
    let w = 5;
    if (X.length < featureChannels) {
        w = 10;
        console.log("compute x 0");
    } else w = 5;
    let intervalID: any;
    let curveDir = 1;
    const midNode = adjList.length / 2;
    if (node < midNode) curveDir = -1;
    const playBtnCoord = [
        coordFeatureVis[0],
        coordFeatureVis[1] + curveDir * 50,
    ];
    //drawPoints(".mats", "red", [playBtnCoord]);
    let btnPos: any = null;
    let startCoordList: any[] = [];
    let endCoordList: any[] = [];
    //let curveDir = 1; //true -> -1; false -> 1
    setTimeout(() => {
        let coordFeatureVis2 = [coordFeatureVis[0] + 102 + rectW * featureChannels, coordFeatureVis[1]];
        let coordFeatureVis3 = [coordFeatureVis[0] + 102 + rectW * featureChannels, coordFeatureVis[1]];
        btnPos = [coordFeatureVis[0], coordFeatureVis[1] - 50];
        //determine if we need upper-curves or lower-curves
        const midNode = adjList.length / 2;
        if (node < midNode) curveDir = -1;
        console.log("curveDir", curveDir);
        //draw paths from intermediate result -> final result
        const layerBias = bias[layerID];
        coordFeatureVis2[1] += curveDir * 50;
        //draw paths from WMVisualizer and Bias Visualizer to final output
        const wmCoord: [number, number] = [
            coordFeatureVis2[0] + rectW * featureChannels,
            coordFeatureVis2[1] - curveDir * 50,
        ];
        biasCoord = [
            coordFeatureVis2[0] + rectW * featureChannels,
            coordFeatureVis2[1],
        ];
        let c = calculatePrevFeatureVisPos(featureVisTable, layerID, node, featureChannels, 7);
        nextCoord = [
            c[0] + 102 * 3 + 5 * featureChannels * 2 + 102,
            c[1],
        ];
        //drawPoints(".mats", "red", [nextCoord]);
        const midX0 = (wmCoord[0] + nextCoord[0]) / 2;
        const midX1 = (biasCoord[0] + nextCoord[0]) / 2;

        const res00: [number, number] = [midX0 - 20, wmCoord[1]];
        const res01: [number, number] = [midX0 + 20, nextCoord[1]];

        res10 = [midX1 - 20, biasCoord[1]];
        res11 = [midX1 + 20, nextCoord[1]];

        //find start locations and end locations
        const coordStartPoint: [number, number] = [
            wmCoord[0] - rectW * featureChannels * 2 - 102,
            wmCoord[1] - (rectH / 2) * curveDir,
        ];
        const coordFinalPoint: [number, number] = [
            wmCoord[0] - rectW * featureChannels,
            wmCoord[1] - (rectH / 2) * curveDir,
        ];

        //draw paths
        for (let i = 0; i < featureChannels; i++) {
            let s: [number, number] = [
                coordStartPoint[0] + w * i + w / 2,
                coordStartPoint[1],
            ];
            let e: [number, number] = [
                coordFinalPoint[0] + rectW * i + rectW / 2,
                coordFinalPoint[1],
            ];

            startCoordList.push(s);
            endCoordList.push(e);
        }
        //drawPoints(".mats", "red", endCoordList);
        //draw paths
        let mm: any = [];
        const Xt = math.transpose(weights[layerID]);
        let i = 0;

        //draw feature summation visualizer
        drawSummationFeature(
            g,X,coordFeatureVis, w, rectH, myColor, posList, mulValues
        );

        // weight matrix * vector visualzier
        drawWeightsVector(g, dummy, coordFeatureVis3, rectH, rectW, myColor);

        // bias visualzier
        drawBiasVector(g, featureChannels, rectH, rectW, coordFeatureVis2, myColor, layerBias);

        drawFinalPath(wmCoord, res00, res01, nextCoord);

        drawReLU(midX1, wmCoord, biasCoord, nextCoord);

        intervalID = setInterval(() => {
            drawAniPath(Xt, currentStep, startCoordList, endCoordList, curveDir, myColor, featureChannels);
            currentStep++;
            console.log("currentStep", currentStep);

            if(currentStep >= featureChannels){
                drawBiasPath(biasCoord, res10, res11, nextCoord);
            }

            if (currentStep >= featureChannels || !lock) {
                injectPlayButtonSVG(
                    btn,
                    btnX,
                    btnY - 30,
                    "./assets/SVGs/playBtn_play.svg"
                );
                isPlaying = false;
                clearInterval(intervalID);
            }
            //        drawPoints(".mats", "red", [coordStartPoint, coordFinalPoint]);
            // d3.selectAll("circle").raise();
        }, 250); // 每2秒执行一次drawPaths

        

        setIntervalID(intervalID);
        d3.selectAll("#tempath").lower();
        d3.selectAll(".procVis").transition().duration(1000).attr("opacity", 1);
    }, 2500);

    function getIntervalID() {
        console.log("return intervalID", intervalID);
        return intervalID;
    }
    const btn = d3.select(".mats").append("g");
    const radius = 10;
    const btnX = playBtnCoord[0];
    const btnY = playBtnCoord[1];

    injectPlayButtonSVG(
        btn,
        btnX,
        btnY - 30,
        "./assets/SVGs/playBtn_pause.svg"
    );

    btn.on("click", function (event: any, d: any) {
        d3.select(".biasPath").remove();
        console.log("isPlaying", isPlaying);
        event.stopPropagation();
        if (intervalID) {
            clearInterval(intervalID);
        }

        if (!isPlaying || currentStep >= featureChannels || currentStep == 0) {
            //   d3.select("text#btn").text("Pause");
            btn.selectAll("*").remove();
            injectPlayButtonSVG(
                btn,
                btnX,
                btnY - 30,
                "./assets/SVGs/playBtn_pause.svg"
            );
            if (currentStep >= featureChannels) {
                currentStep = 0; // 重置步骤
            }
            const Xt = math.transpose(weights[layerID]);
            let i = 0;
            intervalID = setInterval(() => {
                drawAniPath(
                    Xt,
                    currentStep,
                    startCoordList,
                    endCoordList,
                    curveDir,
                    myColor,
                    featureChannels
                );
                currentStep++;
                console.log("i", currentStep);
                if(currentStep>=featureChannels){
                    drawBiasPath(biasCoord, res10, res11, nextCoord);
                }
                if (currentStep >= featureChannels || !lock) {
                    injectPlayButtonSVG(
                        btn,
                        btnX,
                        btnY - 30,
                        "./assets/SVGs/playBtn_play.svg"
                    );
                    clearInterval(intervalID);
                }
            }, 250);

            setIntervalID(intervalID);
            isPlaying = true;
        } else if (isPlaying) {
            btn.selectAll("*").remove();
            injectPlayButtonSVG(
                btn,
                btnX,
                btnY - 30,
                "./assets/SVGs/playBtn_play.svg"
            );
            isPlaying = false;
        }
        d3.selectAll("#tempath").lower();
    });

    return {
        getIntervalID: getIntervalID,
        recordLayerID: recordLayerID,
        colorSchemesTable: colorSchemesTable,
        featureVisTable: featureVisTable,
        features: features,
    };
}

export function outputVisClick(
    resultVis: any,
    colorSchemesTable: any,
    one: any,
    result: any,
    myColor: any,
    featureChannels: number
) {
    const curve = d3.line().curve(d3.curveBasis);
    let biasCoord:any;
    let controlPts:any;
    let feaCoord:any;

    //drawPoints(".mats", "red", one)
    let currentStep = 0;
    let isPlaying = true;
    let intervalID: any = null;
    const rectH = 15;
    const rectW = 5;
    const poolingPt = get_cood_from_parent(".mats", ".pooling");

    let coordForStart = deepClone(poolingPt);
    coordForStart[0][1] += 15;
    coordForStart[0][0] -= featureChannels * 2.5;

    poolingPt[0][0] += featureChannels;
    const modelParams = loadWeights();

    poolingPt[0][1] += 10;
    one = deepClone(poolingPt);

    one[0][1] -= rectH / 2;
    let end = deepClone(poolingPt);

    end[0][1] += 300;
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

    //locations calculation
    //find the next position
    one[0][0] += 225;
    let aOne = deepClone(one);
    //locations for paths' starting points
    let startCoord = [];
    for (let i = 0; i < featureChannels; i++) {
        let c = [
            coordForStart[0][0] + i * 5 + rectW / 2,
            coordForStart[0][1] - rectH + 2,
        ];
        startCoord.push(c);
    }
    //drawPoints(".mats", "red",startCoord);
    //locations for paths' ending points
    let endCoord: any = [];
    for (let m = 0; m < 2; m++) {
        endCoord.push([one[0][0] + rectH * m + rectH / 2, one[0][1] + rectH]);
    }

    //one[0][1] -= 5;
    setTimeout(() => {
        const g1 = d3.select(".mats").append("g").attr("class", "procVis");
        for (let m = 0; m < result.length; m++) {
            g1.append("rect")
                .attr("x", one[0][0] + rectH * m)
                .attr("y", one[0][1])
                .attr("width", rectH)
                .attr("height", rectH)
                .attr("fill", myColor(result[m]))
                .attr("opacity", 1)
                .attr("stroke", "gray")
                .attr("stroke-width", 0.1)
                .attr("class", "procVis");
            // endCoord.push([
            //     one[0][0] + rectH * m + rectH / 2,
            //     one[0][1],
            // ]);
        }
        //drawPoints(".mats", "red", endCoord);
        let resultCoord = deepClone(endCoord);
        resultCoord[0][0] += 300 - rectH * 1.75;
        resultCoord[1][0] += 300 - rectH * 1.75;
        console.log("comp coord", resultCoord, endCoord);
        //     drawPoints(".mats", "red", resultCoord);
        biasCoord = deepClone(aOne);
        biasCoord[0][0] -= 130 + 2 * rectH;
        biasCoord[0][1] += 50;
        const linBias = modelParams.bias[3];

        let pathMap: any = [];

        for (let j = 0; j < endCoord.length; j++) {
            let temPathMap = [];
            for (let i = 0; i < resultCoord.length; i++) {
                const path = d3
                    .select(".mats")
                    .append("path")
                    .attr("d", function () {
                        return [
                            "M",
                            endCoord[j][0],
                            endCoord[j][1],
                            "A",
                            (resultCoord[i][0] - endCoord[j][0]) / 2,
                            ",",
                            (resultCoord[i][0] - endCoord[j][0]) / 4,
                            0,
                            0,
                            ",",
                            0,
                            ",",
                            resultCoord[i][0],
                            ",",
                            resultCoord[i][1],
                        ].join(" ");
                    })
                    .attr("class", "procVis")
                    .style("fill", "none")
                    .style("opacity", "0.1")
                    .attr("stroke", myColor(result[j]));

                temPathMap.push(path.node());
            }
            pathMap.push(temPathMap);
        }

        console.log("pathMap", pathMap, d3.selectAll(".resultRect"));

        d3.select(".twoLayer").style("pointer-events", "none");

        d3.selectAll(".resultRect")
            .style("pointer-events", "auto")
            .on("mouseover", function (event) {
                event.stopPropagation();
                console.log("IN!");
                const id: number = Number(d3.select(this).attr("id"));

                pathMap[0][id]!.style.opacity = "1";
                pathMap[1][id]!.style.opacity = "1";

                //set-up the paramtere for the math displayer
                const displayW = 250;
                const displayH = 75;

                //find coordination for the math displayer first
                const displayX = endCoord[1][0] + 30;
                const displayY = endCoord[1][1] - (displayH + 50);
                drawPoints(".mats", "red", [[displayX, displayY]]);

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

                //data preparation and preprocessing
                //model outputs and the values after softmax
                console.log("ouputvis", result);
                const finalResult = softmax(result);
                console.log("ouputvis 1", finalResult);
                //title fetch
                let title = "Softmax Score for 'Mutagenic'";
                if (id == 0) {
                    title = "Softmax Score for 'Non-Mutagenic'";
                }
                console.log("outputvis title", title);

                //add contents into the math displayer
                //add title
                const titleYOffset = 10;
                const titleXOffset = 50;
                d3.select(".mats")
                    .append("text")
                    .attr("x", displayX + titleXOffset)
                    .attr("y", displayY + titleYOffset)
                    .text(title)
                    .attr("class", "math-displayer")
                    .attr("font-size", titleYOffset)
                    .attr("fill", "black");
                //add equation
                //draw fraction
                //upper part of the fraction
                const eqXOffset = titleXOffset / 2;
                const eqYOffset = titleYOffset * 2.5;
                const unitSize = eqXOffset / 3 + 3;
                const upperOffset = unitSize * 2;
                d3.select(".mats")
                    .append("text")
                    .attr("x", displayX + eqXOffset + upperOffset)
                    .attr("y", displayY + eqYOffset)
                    .text("exp(")
                    .attr("class", "math-displayer")
                    .attr("font-size", unitSize)
                    .attr("fill", "black");
                d3.select(".mats")
                    .append("rect")
                    .attr(
                        "x",
                        displayX + eqXOffset + unitSize * 2.5 + upperOffset
                    )
                    .attr("y", displayY + eqYOffset - unitSize + 2)
                    .attr("width", unitSize)
                    .attr("height", unitSize)
                    .style("stroke", "black")
                    .attr("fill", myColor(result[id]))
                    .attr("class", "math-displayer")
                    .raise();
                d3.select(".mats")
                    .append("text")
                    .attr(
                        "x",
                        displayX + eqXOffset + unitSize * 2.5 + upperOffset
                    )
                    .attr("y", displayY + eqYOffset - unitSize / 3)
                    .text(roundToTwo(result[id]))
                    .attr("class", "math-displayer")
                    .attr("font-size", unitSize / 2)
                    .attr("fill", "white");
                d3.select(".mats")
                    .append("text")
                    .attr(
                        "x",
                        displayX + eqXOffset + unitSize * 4 + upperOffset
                    )
                    .attr("y", displayY + eqYOffset)
                    .text(")")
                    .attr("class", "math-displayer")
                    .attr("font-size", unitSize)
                    .attr("fill", "black");
                //upper part finished
                //draw fraction line
                const startFLPt: [number, number] = [
                    displayX + eqXOffset / 2,
                    displayY + eqYOffset + unitSize,
                ];
                const endFLPt: [number, number] = [
                    displayX + eqXOffset + unitSize * 10,
                    displayY + eqYOffset + unitSize,
                ];
                const path1 = d3
                    .select(".mats")
                    .append("path")
                    .attr("d", d3.line()([startFLPt, endFLPt]))
                    .attr("stroke", "black")
                    .attr("opacity", 1)
                    .attr("fill", "none")
                    .attr("class", "math-displayer");
                //draw lower part
                const offsetMul = 2;
                d3.select(".mats")
                    .append("text")
                    .attr("x", displayX + eqXOffset)
                    .attr("y", displayY + eqYOffset * offsetMul)
                    .text("exp(")
                    .attr("class", "math-displayer")
                    .attr("font-size", unitSize)
                    .attr("fill", "black");
                d3.select(".mats")
                    .append("rect")
                    .attr("x", displayX + eqXOffset + unitSize * 2.5)
                    .attr("y", displayY + eqYOffset * offsetMul - unitSize + 2)
                    .attr("width", unitSize)
                    .attr("height", unitSize)
                    .style("stroke", "black")
                    .attr("fill", myColor(result[0]))
                    .attr("class", "math-displayer")
                    .raise();
                d3.select(".mats")
                    .append("text")
                    .attr("x", displayX + eqXOffset + unitSize * 2.5)
                    .attr("y", displayY + eqYOffset * offsetMul - unitSize / 3)
                    .text(roundToTwo(result[0]))
                    .attr("class", "math-displayer")
                    .attr("font-size", unitSize / 2)
                    .attr("fill", "white");
                d3.select(".mats")
                    .append("text")
                    .attr("x", displayX + eqXOffset + unitSize * 4)
                    .attr("y", displayY + eqYOffset * offsetMul)
                    .text(")+exp(")
                    .attr("class", "math-displayer")
                    .attr("font-size", unitSize)
                    .attr("fill", "black");
                d3.select(".mats")
                    .append("rect")
                    .attr("x", displayX + eqXOffset + unitSize * 7.5)
                    .attr("y", displayY + eqYOffset * offsetMul - unitSize + 2)
                    .attr("width", unitSize)
                    .attr("height", unitSize)
                    .style("stroke", "black")
                    .attr("fill", myColor(result[1]))
                    .attr("class", "math-displayer")
                    .raise();
                d3.select(".mats")
                    .append("text")
                    .attr("x", displayX + eqXOffset + unitSize * 7.5)
                    .attr("y", displayY + eqYOffset * offsetMul - unitSize / 3)
                    .text(roundToTwo(result[1]))
                    .attr("class", "math-displayer")
                    .attr("font-size", unitSize / 2)
                    .attr("fill", "white");
                d3.select(".mats")
                    .append("text")
                    .attr("x", displayX + eqXOffset + unitSize * 9)
                    .attr("y", displayY + eqYOffset * offsetMul)
                    .text(")")
                    .attr("class", "math-displayer")
                    .attr("font-size", unitSize)
                    .attr("fill", "black");
                //lower part finished
                //eq sign and result
                d3.select(".mats")
                    .append("text")
                    .attr("x", endFLPt[0] + unitSize / 2)
                    .attr("y", endFLPt[1])
                    .text("=")
                    .attr("class", "math-displayer")
                    .attr("font-size", unitSize)
                    .attr("fill", "black");
                d3.select(".mats")
                    .append("rect")
                    .attr("x", endFLPt[0] + unitSize * 1.5)
                    .attr("y", endFLPt[1] - unitSize)
                    .attr("width", unitSize)
                    .attr("height", unitSize)
                    .style("stroke", "black")
                    .attr("fill", myColor(finalResult[id]))
                    .attr("class", "math-displayer")
                    .raise();
                let textColor = "white";
                if (Math.abs(finalResult[id]) < 0.5) {
                    textColor = "black";
                }
                d3.select(".mats")
                    .append("text")
                    .attr("x", endFLPt[0] + unitSize * 1.5)
                    .attr("y", endFLPt[1] - unitSize / 2)
                    .text(roundToTwo(finalResult[id]))
                    .attr("class", "math-displayer")
                    .attr("font-size", unitSize / 2)
                    .attr("fill", textColor);
            })
            .on("mouseout", function (event) {
                d3.selectAll(".math-displayer").remove();
                const id: number = Number(d3.select(this).attr("id"));

                pathMap[0][id]!.style.opacity = "0.1";
                pathMap[1][id]!.style.opacity = "0.1";
            });

        for (let m = 0; m < linBias.length; m++) {
            g1.append("rect")
                .attr("x", biasCoord[0][0] + rectH * m)
                .attr("y", biasCoord[0][1])
                .attr("width", rectH)
                .attr("height", rectH)
                .attr("fill", myColor(linBias[m]))
                .attr("opacity", 1)
                .attr("stroke", "gray")
                .attr("stroke-width", 0.1)
                .attr("class", "procVis");
        }

        biasCoord[0][1] += rectH / 2;
        biasCoord[0][0] += rectH * 2;
        feaCoord = [one[0][0], one[0][1] + rectH / 2];

        
        controlPts = computeMids(biasCoord[0], feaCoord);
        //draw frame
        const f1 = g1
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
            .attr("class", "procVis")
            .attr("fr", 2)
            .attr("id", "fr2");
        //connect!
        one[0][1] += rectH / 2;
        const endPt = [one[0][0] + 300, one[0][1]];
        d3.select(".mats")
            .append("path")
            .attr("d", d3.line()([one[0], endPt]))
            .attr("stroke", "black")
            .attr("opacity", 0.05)
            .attr("fill", "none")
            .attr("class", "procVis")
            .attr("id", "path1");

        intervalID = setInterval(() => {
            const Xt = modelParams.weights[3];
            drawAniPath(Xt, currentStep, startCoord, endCoord, 1, myColor, featureChannels);
            currentStep++;
            console.log("currentStep", currentStep);
            if (currentStep >= 2) {
                d3.select(".mats")
                        .append("path")
                        .attr(
                            "d",
                            curve([biasCoord[0], controlPts[0], controlPts[1], feaCoord])
                        )
                        .attr("stroke", "black")
                        .attr("opacity", 0.05)
                        .attr("fill", "none")
                        .attr("class", "procVis biasPath")
                        .attr("id", "path1");
                d3.selectAll(".biasPath").transition().duration(1000).attr("opacity", 1);
                injectPlayButtonSVG(
                    btn,
                    btnX,
                    btnY,
                    "./assets/SVGs/playBtn_play.svg"
                );
                isPlaying = false;
                clearInterval(intervalID);
            }
            //        drawPoints(".mats", "red", [coordStartPoint, coordFinalPoint]);
            // d3.selectAll("circle").raise();
        }, 250); // 每2秒执行一次drawPaths

        //setIntervalID(intervalID);
        d3.selectAll("path").lower();
        d3.selectAll(".procVis").transition().duration(1000).attr("opacity", 1);
        d3.selectAll("path").lower();
    }, 2000);

    const btn = d3.select(".mats").append("g");
    const radius = 10;
    const btnX = startCoord[0][0];
    const btnY = startCoord[0][1] + 50;
    injectPlayButtonSVG(btn, btnX, btnY, "./assets/SVGs/playBtn_pause.svg");
    btn.on("click", function (event: any, d: any) {
        d3.select(".biasPath").remove();
        console.log("isPlaying", isPlaying);
        event.stopPropagation();
        if (intervalID) {
            clearInterval(intervalID);
        }

        if (!isPlaying || currentStep >= 2 || currentStep == 0) {
            btn.selectAll("*").remove();
            injectPlayButtonSVG(
                btn,
                btnX,
                btnY,
                "./assets/SVGs/playBtn_pause.svg"
            );
            if (currentStep >= 2) {
                currentStep = 0; // 重置步骤
            }

            let i = 0;
            intervalID = setInterval(() => {
                d3.selectAll("#tempath").remove();
                const Xt = modelParams.weights[3];
                const Xv = Xt[currentStep];
                for (let j = 0; j < featureChannels; j++) {
                    const s1 = startCoord[j];
                    const e1 = endCoord[currentStep];
                    let pathDir = e1[0] > s1[0] ? 1 : 0;
                    console.log("se", [s1, e1]);
                    d3.select(".mats")
                        .append("path")
                        .attr("d", function () {
                            return [
                                "M",
                                s1[0],
                                s1[1],
                                "A",
                                (e1[0] - s1[0]) / 2,
                                ",",
                                (e1[0] - s1[0]) / 4,
                                0,
                                0,
                                ",",
                                pathDir,
                                ",",
                                e1[0],
                                ",",
                                e1[1],
                            ].join(" ");
                        })
                        .attr("class", "procVis")
                        .attr("id", "tempath")
                        .style("fill", "none")
                        .attr("stroke", myColor(Xv[j]));
                }
                d3.selectAll("path").lower();
                currentStep++;
                console.log("i", currentStep);
                if (currentStep >= 2) {
                    d3.select(".mats")
                        .append("path")
                        .attr(
                            "d",
                            curve([biasCoord[0], controlPts[0], controlPts[1], feaCoord])
                        )
                        .attr("stroke", "black")
                        .attr("opacity", 0.05)
                        .attr("fill", "none")
                        .attr("class", "procVis biasPath")
                        .attr("id", "path1");
                    d3.selectAll(".biasPath").transition().duration(1000).attr("opacity", 1);
                    btn.selectAll("*").remove();
                    injectPlayButtonSVG(
                        btn,
                        btnX,
                        btnY,
                        "./assets/SVGs/playBtn_play.svg"
                    );
                    clearInterval(intervalID);
                }
            }, 500);

            //   setIntervalID(intervalID);
            isPlaying = true;
        } else if (isPlaying) {
            btn.selectAll("*").remove();
            injectPlayButtonSVG(
                btn,
                btnX,
                btnY,
                "./assets/SVGs/playBtn_play.svg"
            );
            isPlaying = false;
        }
        d3.selectAll("path").lower();
    });

    for (let i = 0; i < layerID; i++)
        colorSchemesTable[i].style.opacity = "0.2";
    // colorSchemesTable[colorSchemesTable.length - 1].style.opacity = "0.2";
    return {
        resultVis: resultVis,
        colorSchemesTable: colorSchemesTable,
    };
}

import { deepClone, drawPoints, get_cood_from_parent, softmax } from "./utils";
import {
    translateLayers,
    calculatePrevFeatureVisPos,
    loadWeights,
    loadNodeWeights,
} from "./matHelperUtils";
import { computeMids } from "./matFeaturesUtils";
import * as d3 from "d3";
import { create, all } from "mathjs";
import {
    drawAniPath,
    drawBiasPath,
    drawBiasVector,
    drawFinalPath,
    drawReLU,
    drawSummationFeature,
    drawWeightsVector,
    runAnimations,
    AnimationController,
    animatePathDrawing,
    drawOutputVisualizer,
    drawPathInteractiveComponents,
    drawPathBtwOuputResult,
    drawBiasPathOutputVis,
    drawTanh,
} from "./matAnimateUtils";
import { injectPlayButtonSVG } from "./svgUtils";
import { drawSoftmaxDisplayer } from "./matInteractionUtils";
import path from "node:path/win32";

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
    featureChannels: number,
    gap:number,
    resultLabelsList:any
) {
    console.log("click!", dview, lock);

    //remove calculation process visualizer
    d3.selectAll(".procVis").transition().duration(1000).attr("opacity", 0);
    setTimeout(() => {
        d3.selectAll(".procVis").remove();
    }, 2000);

    //recover all frames
    d3.select(".poolingFrame").style("opacity", 0);
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
            translateLayers(
                recordLayerID,
                -((gap+2) * 3 + 5 * featureChannels * 2)
            );
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
    } else if(transState=="resultLayer"){
        d3.select(".mats")
                .selectAll(".resultRect")
                .style("pointer-events", "none");
        
        resultLabelsList.forEach((element:any) => {
            element.style.fill = "gray";
        });
        translateLayers(3, -250);

    }else{
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
        d3.select(".mats").selectAll(".lastLayerConnections").style("opacity", 0.25);
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

export function resultVisMouseEvent(
    node:number, 
    resultPaths:any, 
    frames:any, 
    adjList:number[][], 
    matFrames:any, 
    colFrames:any, 
    opacity:string,
    pathOpacity:string
){
    //paths interactions
    //console.log("result paths vis", resultPaths);
    //d3.select(".mats").select("path#endingNode"+node).attr("opacity", pathOpacity)

    resultPaths.paths[node].style.opacity = pathOpacity;
    let fr = frames["results"][node];
    if (fr != null) {
        fr.style.opacity = opacity;
    }
    let prevLayer: any = frames["GCNConv3"];

    if (prevLayer != null) {
            prevLayer[node].style.opacity = opacity;
    }

    if (colFrames != null) {
        colFrames[node].style.opacity = opacity;
    }
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
    featureChannels: number,
    rectH:number,
    rectW:number,
    gap:number,
    oFeatureChannels:number,
    oRectW:number,
    activation: string = "relu"
) {
    let biasCoord: [number, number];
    let res10: [number, number];
    let res11: [number, number];
    let nextCoord: [number, number];

    let currentStep = 0;
    let isPlaying = false;
    // const rectH = 15;
    // const rectW = 5;
    const rectW7 = 10;
    console.log("Current layerID and node", layerID, node);
    translateLayers(layerID, (gap+2) * 3 + 5 * featureChannels * 2);
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
        let c = calculatePrevFeatureVisPos(
            featureVisTable,
            layerID,
            cur,
            featureChannels,
            oFeatureChannels,
            rectW,
            oRectW
        );
        posList.push(c);
    }
    let curNode = featureVisTable[layerID + 1][node];
    curNode.style.opacity = "0.25"; //display current node
    d3.select(curNode).selectAll(".frame").attr("opacity", 1);

    //calculation process visualizer
    let coord = calculatePrevFeatureVisPos(
        featureVisTable,
        layerID,
        node,
        featureChannels,
        oFeatureChannels,
        rectW,
        oRectW
    );
    console.log("coord", coord);

    //find position for intermediate feature vis
    let coordFeatureVis = deepClone(coord);
    coordFeatureVis[0] += (gap+2);

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
    const Xt = math.transpose(weights[layerID]);

    console.log("compute x'", mulValues, dList, layerID, X.toString(), dummy);

    const g = d3.select(".mats").append("g").attr("class", "procVis");
    let w = 5;
    if (Xt[0].length < featureChannels) {
        w = 10;
        console.log("compute x 0");
    } else if(Xt[0].length<10){
        w = 10;
    }
    let intervalID: any;
    let curveDir = 1;
    const midNode = adjList.length / 2;
    if (node < midNode) curveDir = -1;
    //drawPoints(".mats", "red", [playBtnCoord]);
    let btnPos: any = null;
    let startCoordList: any[] = [];
    let endCoordList: any[] = [];
    //let curveDir = 1; //true -> -1; false -> 1
    let coordFeatureVis2 = [
        coordFeatureVis[0] + (gap+2) + rectW * featureChannels,
        coordFeatureVis[1],
    ];
    let coordFeatureVis3 = [
        coordFeatureVis[0] + (gap+2) + rectW * featureChannels,
        coordFeatureVis[1],
    ];
    btnPos = [coordFeatureVis[0], coordFeatureVis[1] - 50];
    //determine if we need upper-curves or lower-curves
    if (node < midNode) curveDir = -1;
    console.log("curveDir", curveDir);
    //draw paths from intermediate result -> final result
    const layerBias = bias[layerID];
    coordFeatureVis2[1] += curveDir * 50;

    let coordFeatureVis2Copy = deepClone(coordFeatureVis2);

    //adjust the position of the bias vector for special case
    if(layerID==0 && oFeatureChannels==34)coordFeatureVis2Copy[0] += 50;

    //draw paths from WMVisualizer and Bias Visualizer to final output
    const wmCoord: [number, number] = [
        coordFeatureVis2[0] + rectW * featureChannels,
        coordFeatureVis2[1] - curveDir * 50,
    ];
    biasCoord = [
        coordFeatureVis2Copy[0] + rectW * featureChannels,
        coordFeatureVis2Copy[1],
    ];
    let c = calculatePrevFeatureVisPos(
        featureVisTable,
        layerID,
        node,
        featureChannels,
        oFeatureChannels,
        rectW,
        oRectW
    );
    nextCoord = [c[0] + (gap+2) * 3 + rectW * featureChannels * 2 + (gap+2), c[1]];

    //adjustment based on cases
    if(featureChannels==4)nextCoord[0]+=15;

    //drawPoints(".mats", "red", [nextCoord]);
    const midX0 = (wmCoord[0] + nextCoord[0]) / 2;
    const midX1 = (biasCoord[0] + nextCoord[0]) / 2;

    const res00: [number, number] = [midX0 - 20, wmCoord[1]];
    const res01: [number, number] = [midX0 + 20, nextCoord[1]];

    res10 = [midX1 - 20, biasCoord[1]];
    res11 = [midX1 + 20, nextCoord[1]];

    //find start locations and end locations - issue here
    let coordStartPoint: [number, number] = [
        wmCoord[0] - rectW * featureChannels * 2 - (gap+2),
        wmCoord[1] - (rectH / 2) * curveDir,
    ];
    let coordFinalPoint: [number, number] = [
        wmCoord[0] - rectW * featureChannels,
        wmCoord[1] - (rectH / 2) * curveDir,
    ];


    if(featureChannels==4&&layerID==0){
         coordFinalPoint = [
            wmCoord[0]+10,
            wmCoord[1] - (rectH / 2) * curveDir,
        ];
        coordFeatureVis3 = [
            wmCoord[0]+10,
            coordFeatureVis[1],
        ];
    }

    const playBtnCoord = [
        (coordFeatureVis[0]+featureChannels*rectW)+15,
        res00[1]
    ];
    

    //draw paths
    for (let i = 0; i < Xt[0].length; i++) {
        let s: [number, number] = [
            coordStartPoint[0] + w * i + w / 2,
            coordStartPoint[1],
        ];
        startCoordList.push(s);
    }

    for(let i=0; i<featureChannels; i++){
        let e: [number, number] = [
            coordFinalPoint[0] + rectW * i + rectW / 2,
            coordFinalPoint[1],
        ];
        endCoordList.push(e);
    }

    //drawPoints(".mats", "red", endCoordList);
    //draw paths

    console.log("curNode", curNode, d3.select(curNode).selectAll(".frame"));

    //aniamtion sequence
    const initSec = 1000;
    const aniSec = 500;
    const waitSec = 250 * featureChannels;
    let animateSeqAfterPath: any = [
        {func: () => drawSummationFeature(g, X, coordFeatureVis, w, rectH, myColor, posList, mulValues, curveDir), delay: initSec + aniSec,},
        {func: () => drawWeightsVector(g, dummy, coordFeatureVis3, rectH, rectW, myColor, math.transpose(weights[layerID]), startCoordList, endCoordList, curveDir), delay: aniSec},
        {func: ()=>{
            injectPlayButtonSVG(
                btn,
                btnX,
                btnY - 30,
                "./assets/SVGs/playBtn_play.svg"
            );
            drawPathBtwOuputResult([coordFeatureVis], coordFeatureVis3)
        }, delay:aniSec*2},
        {func: () => drawBiasVector(g, featureChannels, rectH, rectW, coordFeatureVis2Copy, myColor, layerBias, layerID), delay: aniSec},
        {func: () => drawBiasPath(biasCoord, res10, res11, nextCoord, layerID, featureChannels), delay: aniSec,},
        {func: () => drawFinalPath(wmCoord, res00, res01, nextCoord, layerID, featureChannels), delay: 1,},
        {func: () => drawReLU(midX1, wmCoord, biasCoord, nextCoord), delay: aniSec,},
        {func: () => {curNode.style.opacity = "1";},delay: aniSec,},
        {func: () => {d3.select(".ctrlBtn").style("pointer-events", "auto");},delay: 1,},
    ];

    if(activation=="tanh"){
        animateSeqAfterPath[6].func = ()=>drawTanh(midX1, wmCoord, biasCoord, nextCoord);
    }

    AnimationController.runAnimations(0, animateSeqAfterPath);
    //     d3.selectAll(".procVis").transition().duration(1000).attr("opacity", 1);

    function getIntervalID() {
        console.log("return intervalID", intervalID);
        return intervalID;
    }
    const btn = d3.select(".mats").append("g");
    const radius = 10;
    const btnX = playBtnCoord[0];
    const btnY = playBtnCoord[1];

    let firstClick = true;

    btn.on("click", function (event: any, d: any) {
        console.log("currentStep 1", currentStep);
        console.log("isPlaying", isPlaying);
        event.stopPropagation();
        if (intervalID) {
            //d3.selectAll("#tempath").remove();
            clearInterval(intervalID);
        }

        if (!isPlaying || currentStep >= featureChannels || currentStep == 0) {
            btn.selectAll("*").remove();
            injectPlayButtonSVG(
                btn,
                btnX,
                btnY - 30,
                "./assets/SVGs/playBtn_pause.svg"
            );
            // d3.selectAll("#tempath").remove();
            if(firstClick){
                d3.selectAll(".removeRect").remove();
                firstClick = false;
            }
            console.log("currentStep", currentStep);
            if(featureChannels==4&&layerID==2&&currentStep >= 2){
                d3.select(".mats").selectAll(".removeRect").remove();
                //   d3.select(".mats").selectAll(".pauseRemove").remove();
                d3.selectAll("#tempath").remove();
              //  d3.select(".mats").selectAll(".").remove();
                currentStep = 0; // 重置步骤
            }
            if (currentStep >= featureChannels) {
                d3.select(".mats").selectAll(".removeRect").remove();
                //    d3.select(".mats").selectAll(".pauseRemove").remove();
                //d3.selectAll("#tempath").remove();
                currentStep = 0; // 重置步骤
            }
            const Xt = math.transpose(weights[layerID]);

            intervalID = setInterval(() => {
                drawAniPath(
                    Xt,
                    currentStep,
                    startCoordList,
                    endCoordList,
                    curveDir,
                    myColor,
                    featureChannels,
                    coordFeatureVis3,
                    rectH,
                    rectW,
                    dummy,
                    g
                );
                currentStep++;
                console.log("currentStep", currentStep);

                if(featureChannels==4&&layerID==2&&currentStep >= 2){
                    d3.selectAll("#tempath").remove();
                    injectPlayButtonSVG(
                        btn,
                        btnX,
                        btnY - 30,
                        "./assets/SVGs/playBtn_play.svg"
                    );
                    isPlaying = false;
                    clearInterval(intervalID);
                  //  runAnimations(0, animateSeqAfterPath);
                }
                

                if (currentStep >= featureChannels) {
                    d3.select(".mats")
                        .select(".ctrlBtn")
                        .style("pointer-events", "none");
                 //   runAnimations(0, animateSeqAfterPath);
                }

                if (currentStep >= featureChannels || !lock) {
                    d3.selectAll("#tempath").remove();
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
            isPlaying = true;
        } else if (isPlaying) {
            //d3.selectAll("#tempath").remove();
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
    const aniSec = 300;

    const curve = d3.line().curve(d3.curveBasis);
    let biasCoord: any;
    let controlPts: any;
    let feaCoord: any;

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

    poolingPt[0][0] += featureChannels*1.5;

    const modelParams = loadWeights();

    poolingPt[0][1] += 10;
    one = deepClone(poolingPt);
    let endPt1 = deepClone(poolingPt);
    endPt1[0][0] += featureChannels;

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
    translateLayers(layerID, 300);

    //locations calculation
    //find the next position
    one[0][0] += 350;
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
        endCoord.push([one[0][0] + rectH * m + rectH / 2, one[0][1]]);
    }

    const resultWithoutBiasCoord = [
        [one[0][0] - 150 - rectH/2,
        one[0][1]],
        [one[0][0] - 150 + rectH/2,
        one[0][1]]
    ];

    const endPathAniCoord = [
        [one[0][0] - 150,
        one[0][1]],
        [one[0][0] - 150 + rectH,
        one[0][1]]
    ];

    let resultStartCoord = deepClone(endCoord);
    resultStartCoord[0][1] += rectH;
    resultStartCoord[1][1] += rectH;

    //one[0][1] -= 5;
    const g1 = d3.select(".mats").append("g").attr("class", "procVis");
    const outputCoord = [one[0][0], one[0][1]+rectH/2];
    //drawPoints(".mats", "red", endCoord);
    let resultCoord = deepClone(endCoord);
    resultCoord[0][0] += 175 - rectH * 3.75;
    resultCoord[1][0] += 175 - rectH * 3.75;
    resultCoord[0][1] += rectH;
    resultCoord[1][1] += rectH;
    console.log("comp coord", resultCoord, endCoord);
    //     drawPoints(".mats", "red", resultCoord);
    biasCoord = deepClone(aOne);
    biasCoord[0][0] -= 130 + 2 * rectH;
    biasCoord[0][1] += 50;
    const linBias = modelParams.bias[3];

    const resultWithoutBias = [
        result[0]-linBias[0],
        result[1]-linBias[1]
    ];

    

    d3.select(".twoLayer").style("pointer-events", "none");

    const biasCoordCopy = deepClone(biasCoord);

    biasCoord[0][0] += rectH * 2;
    feaCoord = [one[0][0], one[0][1] + rectH / 2];

    controlPts = computeMids(biasCoord[0], feaCoord);
    //connect!
    // one[0][1] += rectH / 2;
    // const endPt = [one[0][0] + 300, one[0][1]];

    const endPt2 = [
        resultWithoutBiasCoord[0][0], 
        resultWithoutBiasCoord[0][1]+rectH/2
    ];

    const endPt3 = [
        resultWithoutBiasCoord[0][0] + 2 * rectH, 
        resultWithoutBiasCoord[0][1]+rectH/2
    ];

    const endPt4 = [
        one[0][0],
        one[0][1] + rectH/2
    ];

  //  drawPoints(".mats", "red", endPt1);

    //play button injection
    const btn = d3.select(".mats").append("g").attr("class", "ctrlBtn");
    const radius = 10;
    const btnX = (endPt1[0][0]+endPt2[0])/2;
    const btnY = endPt2[1];

    //where we put out animation sequence
    let pathMap: any = null;

    const animateSeqAfterPath = [
        {func:()=>{drawBiasVector(g1, linBias.length, rectH, rectH, biasCoordCopy[0], myColor, linBias, layerID);}, delay: 200}, 
        {func:()=>{drawBiasPathOutputVis(biasCoord, controlPts, feaCoord);}, delay:200}, 
        {func:()=>{drawWeightsVector(g1, resultWithoutBias, endPt2, rectH, rectH, myColor, modelParams.weights[3], startCoord,endPathAniCoord , 1)}, delay:200},
        {func:()=>{
            drawWeightsVector(g1, result, outputCoord, rectH, rectH, myColor, modelParams.weights[3], startCoord, endPathAniCoord, 1, "procVis wRect");
            //draw the path connect to 
            drawPathBtwOuputResult([endPt1[0]], endPt2);
            drawPathBtwOuputResult([endPt3], endPt4);
        }, delay:200},
        {func:()=>{pathMap = drawPathInteractiveComponents(resultStartCoord, resultCoord, result, myColor);}, delay:200},
        {func:()=>{
            btn.selectAll("*").remove();
            injectPlayButtonSVG(
                btn,
                btnX,
                btnY,
                "./assets/SVGs/playBtn_play.svg"
            );
        }, delay:200}
        //  {func:()=>{drawPathBtwOuputResult(one, endPt);}, delay:200}, 
    ]

    const animateSeq = [
        {func:()=>{
            intervalID = setInterval(() => {
                const Xt = modelParams.weights[3];
                const Xv = Xt[currentStep];
                drawAniPath(Xt, currentStep, startCoord, endPathAniCoord, 1, myColor, 0, [resultWithoutBiasCoord[0][0], resultWithoutBiasCoord[0][1]+rectH/2], rectH, rectH, result, g1);
                currentStep++;
                console.log("i", currentStep);
                if (currentStep >= 2) {
                    
                    btn.selectAll("*").remove();
                    injectPlayButtonSVG(
                        btn,
                        btnX,
                        btnY,
                        "./assets/SVGs/playBtn_play.svg"
                    );
                    clearInterval(intervalID);
                    d3.selectAll("#tempath").transition().delay(200).duration(200).remove();
                }
            }, 250); 
            d3.selectAll("path").lower();
            d3.selectAll(".procVis").transition().duration(1000).attr("opacity", 1);
            d3.selectAll("path").lower();
        }, delay:aniSec},
    ];
    AnimationController.runAnimations(0, animateSeqAfterPath);


    //all the interaction add-ons
    d3.selectAll(".resultRect")
    .style("pointer-events", "auto")
    .on("mouseover", function (event) {
        event.stopPropagation();
        console.log("IN!");
        const id: number = Number(d3.select(this).attr("id"));
        //here's the place to place the softmax displayer
        if(pathMap!=null)drawSoftmaxDisplayer(pathMap, endCoord, result, id, myColor);
    })
    .on("mouseout", function (event) {
        d3.selectAll(".math-displayer").remove();
        const id: number = Number(d3.select(this).attr("id"));

        if(pathMap!=null){
            pathMap[0][id]!.style.opacity = "0.1";
            pathMap[1][id]!.style.opacity = "0.1";
        }
    });

    // play button interaction add-ons
    btn.on("click", function (event: any, d: any) {
        console.log("isPlaying", isPlaying);
        event.stopPropagation();
        if (intervalID) {
            clearInterval(intervalID);
        }
        //replay controls
        if (!isPlaying || currentStep >= 2 || currentStep == 0) {
            d3.selectAll("#tempath").remove();
            injectPlayButtonSVG(
                btn,
                btnX,
                btnY,
                "./assets/SVGs/playBtn_play.svg"
            );
            if (currentStep >= 2) {
                d3.selectAll("#tempath").remove();
                d3.select(".mats").selectAll(".removeRect").remove();
          //      d3.select(".mats").selectAll(".pauseRemove").remove();
                currentStep = 0; // 重置步骤
            }
            animateSeq[0].delay = 1;
            AnimationController.runAnimations(0, animateSeq);
            // setTimeout(()=>{
            //     AnimationController.runAnimations(0, animateSeqAfterPath);
            // }, 1500);
            // setTimeout(()=>{
            //     pathMap = drawPathInteractiveComponents(endCoord, resultCoord, result, myColor);
            // }, 3000);
            isPlaying = true;
        } else if (isPlaying) {
            btn.selectAll("*").remove();
            injectPlayButtonSVG(
                btn,
                btnX,
                btnY,
                "./assets/SVGs/playBtn_pause.svg"
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

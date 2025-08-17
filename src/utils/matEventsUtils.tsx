import { deepClone, drawPoints, get_cood_from_parent, softmax } from "./utils";
import {
    translateLayers,
    calculatePrevFeatureVisPos,
    loadWeights,
    loadNodeWeights,
    drawHintLabel,
    drawMatrixValid,
} from "./matHelperUtils";
import { computeMids } from "./matFeaturesUtils";
import * as d3 from "d3";
import { create, all, size, multiply, transpose } from "mathjs";
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
    drawOutputVisualizer,
    drawPathInteractiveComponents,
    drawPathBtwOuputResult,
    drawBiasPathOutputVis,
    drawTanh,
    drawWeightMatrix,
    computeMatrixLocations,
    drawAttentions,
    drawMathFormula,
    drawSamplingAggregation,
    drawFunctionIcon
} from "./matAnimateUtils";
import { injectPlayButtonSVG, injectSVG } from "./svgUtils";
import { drawMatmulExplanation, drawSoftmaxDisplayer } from "./matInteractionUtils";
import path from "node:path/win32";
import { computeAttentionCoefficient, meanAggregation, testCompute } from "./computationUtils";
import { addExitBtn, buildDetailedViewArea } from "./graphUtils";
import { transformSync } from "next/dist/build/swc";


export const matrixMultiplicationResults = {
    dummy: {} as Record<number, number[]>,
    bias: {} as Record<number, number[]>
};
//graph feature events interactions - mouseover
export function oFeatureMouseOver(
    layerID: string,
    node: string,
    frames: any,
    matFrames: any
) {

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

    const a = d3.select(".path1").style("opacity", 1);
    const b = d3.select(".poolingFrame").style("opacity", 1);
    const c = d3.select("#fr1").style("opacity", 1);

    // fr1!.style.opacity = "1";
    // poolingFrame!.style.opacity = "1";
    // path1!.style.opacity = "1";

}

export function resultRectMouseout() {
    d3.select(".path1").style("opacity", 0.02);
    d3.select(".poolingFrame").style("opacity", 0.25);
    d3.select("#fr1").style("opacity", 0.25);

}

//graph feature events interactions - mouseout
export function oFeatureMouseOut(
    layerID: string,
    node: string,
    frames: any,
    matFrames: any
) {

    const fr = frames["features"][Number(node)];
    fr.style.opacity = "0.25";

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
    featureChannels: number,
    gap:number,
    resultLabelsList:any,
    sandBoxMode: boolean,
    task:string = "normal"
) {
    //remove temp classes
    d3.select(".switchBtn").style("pointer-events", "auto");
    d3.select(".switchBtn").style("opacity", 1);
    d3.selectAll(".cant-remove").classed("cant-remove", false);
    d3.selectAll(".inputFeature").classed("inputFeature", false);
    d3.selectAll(".outputFeature").classed("outputFeature", false);

    d3.selectAll(".columnUnit").remove();

    //remove calculation process visualizer
    //d3.selectAll(".procVis").transition().duration(500).attr("opacity", 0);
    d3.selectAll(".procVis").remove();
    d3.selectAll(".to-be-removed").remove();

    //recover all frames
    d3.select(".poolingFrame").style("opacity", 0.25);
    d3.selectAll(".colFrame").style("opacity", 0);
    d3.selectAll(".rowFrame").style("opacity", 0);
    d3.selectAll(".frame").style("opacity", 0.25);
    //recover opacity of feature visualizers
    d3.selectAll(".featureVis").style("opacity", 1);
    d3.selectAll(".oFeature")
        .style("opacity", 1)
        .style("pointer-events", "auto");

    d3.selectAll(".resultVisualizer").style("pointer-events", "auto");
    
    setTimeout(()=>{
    //recover layers positions
    if (transState == "GCNConv") {
        if(recordLayerID >= 0 && sandBoxMode && task == "node"){
            translateLayers(
                recordLayerID,
                -620
            );
            recordLayerID = -1;
        }
        else if (recordLayerID >= 0) {
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
        d3.select(".poolingFrame").style("opacity", 0.25);
    } else if (transState == "result") {
        translateLayers(5, -300);
    } else if(transState=="linkResult"){
        translateLayers(2, -250);

    }else if(transState=="resultLayer"){
        d3.select(".mats")
                .selectAll(".resultRect")
                .style("pointer-events", "none");
        
        resultLabelsList.forEach((element:any) => {
            element.style.fill = "gray";
        });
        if(!sandBoxMode)translateLayers(3, -250);
        else translateLayers(3, -325);
    }else{
        if(!sandBoxMode)translateLayers(4, -300);
        else translateLayers(4, -350);
    }

    d3.selectAll("path.crossConnection").style("opacity", 0.05);
    d3.select(".mats").selectAll(".lastLayerConnections").style("opacity", 0.25);
    d3.selectAll(".twoLayer").style("opacity", 1);
    d3.select(".pooling").style("opacity", 1);
    d3.select(".hintLabel").style("opacity", 1);
    d3.selectAll(".hintPath").style("opacity", 1);
    },100);

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
            .style("pointer-events", "auto");

            

    }, 150);


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
        poolingVis: poolingVis
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
    console.log("check adjl", adjList);

    if (paths != null) {

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

    //paths interactions
    if (paths != null) {

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
        fr.style.opacity = "0.25";
    }

    //frame interactions
    let prevVis = adjList[node];
    let prevLayer: any = null;

    if (Number(layerID) == 0) prevLayer = frames["features"];
    else if (Number(layerID) == 1) prevLayer = frames["GCNConv1"];
    else if (Number(layerID) == 2) prevLayer = frames["GCNConv2"];

    if (prevLayer != null) {
        prevVis.forEach((vis: number) => {
            prevLayer[vis].style.opacity = "0.25";
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

export function smartMultiply(W: number[][], X: number[] | number[][]): number[] | number[][] {
  const wShape = size(W) as number[];
  const xShape = size(X) as number[];

  try {
    return multiply(W, X);
  } catch (err) {
    try {
      return multiply(transpose(W), X);
    } catch (err2) {
      throw new Error(`smartMultiply failed: shapes ${wShape} and ${xShape} are incompatible`);
    }
  }
}


export function featureVisClick(
    layerID: number,
    node: number,
    recordLayerID: number,
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
    d3.select(".switchBtn").style("pointer-events", "none");
    d3.select(".switchBtn").style("opacity", 0.3);
    let biasCoord: [number, number];
    let res10: [number, number];
    let res11: [number, number];
    let nextCoord: [number, number];

    let currentStep = 0;
    let isPlaying = false;
    // const rectH = 15;
    // const rectW = 5;
    const rectW7 = 10;

    translateLayers(layerID, (gap+2) * 3 + 5 * featureChannels * 2);
    //record the layerID
    recordLayerID = layerID;

    d3.select(".hintLabel").style("opacity", 0);

    //choose the right feature viusualizers to display
    let posList = []; //a list to manage all position from the previous layer feature vis
    let neighbors = adjList[node];
    let featuresTable = [features, conv1, conv2];
    for (let i = 0; i < neighbors.length; i++) {
        //display pre layer
        let cur = neighbors[i];
        featureVisTable[layerID][cur].style.opacity = "1";
        console.log("FeatureVisTable Element:", featureVisTable[layerID][cur]);

        d3.select(featureVisTable[layerID][cur]).classed("cant-remove inputFeature", true);

        const container = d3.select(featureVisTable[layerID][cur]);

        const featureVector = featuresTable[layerID][cur] as number[];
        container.selectAll("rect")
        .data(featureVector)
        .attr("class", "cant-remove inputFeatureRect") 
        .attr("data-index", (_: number, i: number) => i)
        .attr("data-node", () => cur);
        

                
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

    d3.select(curNode).classed("cant-remove outputFeature", true);

    d3.select(curNode)
    .selectAll(".frame")
    .attr("opacity", 1)
    .classed("cant-remove outputFeature", true);

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
    
    let X = new Array(featuresTable[layerID][node].length).fill(0);
    let mulValues = []; //an array to store all multiplier values
    for (let i = 0; i < adjList[node].length; i++) {
        //find multipliers
        let node_i = node;
        let node_j = adjList[node_i][i];
        let mulV = 1 / Math.sqrt(dList[node_i] * dList[node_j]);
        console.log(`@@@@ Node ${node_i} to ${node_j} multiplier value:`, mulV);
        mulValues.push(mulV);
        //compute x'

        const prepMat = [...featuresTable[layerID][node_j]];
        let matA = math.matrix(prepMat);
        X = math.add(math.multiply(prepMat, mulV), X);
    }
    console.log("issue here", X, math.transpose(weights[layerID]))
    const dummy: number[] = smartMultiply(weights[layerID], X) as number[];
    const Xt = math.transpose(weights[layerID]);
    matrixMultiplicationResults.dummy[node] = dummy;
   

    //drawMatrixValid(Xt, coordFeatureVis[0], coordFeatureVis[1]-75, 10, 10)



    const g = d3.select(".mats").append("g");
    let w = 5;
    if (Xt[0].length < featureChannels) {
        w = 10;

    } else if(Xt[0].length<10){
        w = 10;
    }
    if(oFeatureChannels==128 && Xt[0].length==128){
        w = 2.5;
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

    //draw paths from intermediate result -> final result
    const layerBias = bias[layerID];
    coordFeatureVis2[1] += curveDir * 50;
    matrixMultiplicationResults.bias[node] = layerBias;

    let coordFeatureVis2Copy = deepClone(coordFeatureVis2);

    //adjust the position of the bias vector for special case
    if(layerID==0 && oFeatureChannels==34){
        coordFeatureVis2Copy[0] += 50;
    }

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



    //aniamtion sequence
    const initSec = 1000;
    const aniSec = 500;
    const waitSec = 250 * featureChannels;

    const btn = d3.select(".mats").append("g");
    const radius = 10;
    let btnX = playBtnCoord[0];
    const btnY = playBtnCoord[1]+rectH;

    if(layerID==0 && oFeatureChannels==34){
        btnX += 100;
    }

    console.log("feature vis click", layerID, featureVisTable, oFeatureChannels)

    let weightMatrixPostions:any = computeMatrixLocations(btnX+15, btnY, curveDir, rectW, featureChannels, weights, layerID);

    d3.select(".mats").style("pointer-events", "none");

    const formula:any = d3.select(".mats").append("g").attr("class", "math-formula");

    let animateSeqAfterPath: any = [
        {func: () => {
            drawSummationFeature(g, X, coordFeatureVis, w, rectH, myColor, posList, mulValues, curveDir,adjList, dList, featuresTable, layerID, node)
            

            d3.selectAll("#procPath")
                .attr("class", "procVis summation connection-path");
            
                d3.selectAll<SVGRectElement, number>(".inputFeatureRect")
                .style("pointer-events", "all")
                .style("cursor", "pointer")
                .on("mouseover", function (this: SVGRectElement, event: MouseEvent, d: number) {
                  event.stopPropagation();
                  
                  d3.select(this)
                    .attr("stroke", "black")
                    .attr("stroke-width", 2)
                    .raise();
                  
                  d3.selectAll(".multiplier-tooltip").remove();
                  
                  const [x, y] = d3.pointer(event, document.querySelector(".mats"));

                  const tooltip = d3.select(".mats")
                    .append("g")
                    .attr("class", "multiplier-tooltip procVis");
                  
                  
                  tooltip.append("rect")
                    .attr("x", x + 10)
                    .attr("y", y - 40)
                    .attr("width", 150)
                    .attr("height", 35)
                    .attr("rx", 5)
                    .attr("ry", 5)
                    .style("fill", "white")
                    .style("stroke", "black");
                  
                  tooltip.append("text")
                    .attr("x", x + 20)
                    .attr("y", y - 20)
                    .text(`Value = ${d.toFixed(2)}`)
                    .style("font-size", "17px")
                    .attr("font-family", "monospace");
                })
                .on("mouseout", function (this: SVGRectElement, event: MouseEvent, d: number) {
                  event.stopPropagation();
                  d3.select(this)
                    .attr("stroke", "gray")
                    .attr("stroke-width", 0.5);
                  
                  d3.selectAll(".multiplier-tooltip").remove();
                });
              
            d3.selectAll(".connection-path").lower();
            
            d3.select(".ctrlBtn").style("pointer-events", "none");
            console.log("switchbtn", d3.select("div.switchBtn"));
        }, 
            delay: initSec + aniSec,
        },
        {func: ()=>{
            let drawLabel = true;
            if(oFeatureChannels==34)drawLabel = false;
            injectPlayButtonSVG(
                btn,
                btnX,
                btnY - 30,
                "./assets/SVGs/matmul.svg",
                drawLabel
            );
            const hintLabel = drawHintLabel(g, btnX - 80, btnY - 56, "Click for Animation", "procVis");
            
            

            
            
            drawPathBtwOuputResult([coordFeatureVis], coordFeatureVis3)
            drawWeightMatrix(btnX, btnY, curveDir, rectW, rectH, featureChannels, weights, layerID, myColor, g, weightMatrixPostions);
            drawWeightsVector(g, dummy, coordFeatureVis3, rectH, rectW, myColor, weights[layerID], startCoordList, endCoordList, curveDir, weightMatrixPostions, featureChannels, X)
            
        }, delay:aniSec*2},
        // {func:()=>{
            
        // }, delay:aniSec},
        // {func: () => {}, delay: aniSec},
        // {func: () => , delay: aniSec},
        {func: () => {
            
            
            drawBiasPath(biasCoord, res10, res11, nextCoord, layerID, featureChannels)
            drawFinalPath(wmCoord, res00, res01, nextCoord, layerID, featureChannels, featureVisTable)

            if((featureVisTable.length==4&&layerID==2)||
                (oFeatureChannels==128&&layerID==1)){
                //if it's the last layer, don't show the relu icon
            }
            else if(activation=="tanh"){
                drawTanh(midX1, wmCoord, biasCoord, nextCoord);
            }else{
                drawReLU(midX1, wmCoord, biasCoord, nextCoord)
            }
            curNode.style.opacity = "1";
            drawBiasVector(g, featureChannels, rectH, rectW, coordFeatureVis2Copy, myColor, layerBias, layerID)
            
        }, delay: aniSec*2},
        // {func: () => drawFinalPath(wmCoord, res00, res01, nextCoord, layerID, featureChannels), delay: 1,},
        // {func: () => drawReLU(midX1, wmCoord, biasCoord, nextCoord), delay: aniSec,},
        // {func: () => {curNode.style.opacity = "1";},delay: aniSec,},
        {
            func:()=>{
                if((featureVisTable.length==4&&layerID==2)||
                (oFeatureChannels==128&&layerID==1)){
                    drawMathFormula(formula, coordFeatureVis2Copy[0], coordFeatureVis2Copy[1]+curveDir*125, "./assets/SVGs/GCNFormulaWithoutActivation.svg");
                }else{
                    drawMathFormula(formula, coordFeatureVis2Copy[0], coordFeatureVis2Copy[1]+curveDir*125, "./assets/SVGs/GCNFormula.svg");
                }
                const gLabel = d3.select(".mats").append("g");
                injectSVG(gLabel, btnX-120-64, btnY-30-120-64, "./assets/SVGs/interactionHint.svg", "procVis hintLabel");
                addExitBtn(btnX-120, btnY-30-120, gLabel)

            }
        },
        {func: () => {
            d3.select(".ctrlBtn").style("pointer-events", "auto");
            d3.select(".mats").style("pointer-events", "auto");
            d3.select(".switchBtn").style("pointer-events", "auto");
            d3.select(".switchBtn").style("opacity", 1);
        },delay: 1,},

    ];

    // if(activation=="tanh"){
    //     animateSeqAfterPath[7].func = ()=>drawTanh(midX1, wmCoord, biasCoord, nextCoord);
    // }

    AnimationController.runAnimations(0, animateSeqAfterPath);
        d3.selectAll(".procVis").transition().duration(1000).attr("opacity", 1);


    function getIntervalID() {

        return intervalID;
    }
    

    let firstClick = true;

    let allowExpl = true;

    btn.on("mouseover", function(event, d){
        event.stopPropagation();
        const [x, y] = d3.pointer(event);
        if(allowExpl){
        drawMatmulExplanation(
            x, y, "Matrix Multiplication", "Click the icon to show the matrix multiplication process!"
        );
    }
    });

    btn.on("mouseout", function(event, d){ 
        allowExpl = true;
        d3.selectAll(".math-displayer").remove();
    });

    btn.on("click", function (event: any, d: any) {

        d3.selectAll(".interactRect .math-formula").style("pointer-events", "none");

        d3.selectAll(".weight-matrix-frame").style("opacity", 0);

        allowExpl = false;


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

            if(featureChannels==4&&layerID==2&&currentStep >= 2){
                d3.select(".mats").selectAll(".removeRect").remove();
                //   d3.select(".mats").selectAll(".pauseRemove").remove();
                d3.selectAll("#tempath").remove();
                d3.selectAll(".weight-matrix-frame").style("opacity", 1);
                d3.select(".wMatLink").style("opacity", 1);
                d3.selectAll(".interactRect .math-formula").style("pointer-events", "none");
              //  d3.select(".mats").selectAll(".").remove();
              d3.selectAll(".matmul-displayer").remove();
                currentStep = 0; // 重置步骤
            }
            if (currentStep >= featureChannels) {
                d3.select(".mats").selectAll(".removeRect").remove();
                //    d3.select(".mats").selectAll(".pauseRemove").remove();
                //d3.selectAll("#tempath").remove();
                currentStep = 0; // 重置步骤
            }
            const Xt = math.transpose(weights[layerID]);

            d3.select(".wMatLink").style("opacity", 0.3);

            intervalID = setInterval(() => {
                //func: () => drawWeightsVector(g, dummy, coordFeatureVis3, rectH, rectW, myColor, weights[layerID], startCoordList, endCoordList, curveDir, weightMatrixPostions, featureChannels), delay: aniSec},
                drawAniPath(
                    weights[layerID],
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
                    g,
                    weightMatrixPostions,
                    X
                );
                d3.selectAll(".columnUnit").style("opacity", 0);
                d3.selectAll(".columnGroup").style("opacity", 0.3).lower();
                d3.selectAll(`#columnGroup-${currentStep}`).style("opacity", 1).raise();
                d3.select(`#columnUnit-${currentStep}`).style("opacity", 1).raise();
                currentStep++;


                if(featureChannels==4&&layerID==2&&currentStep >= 2){
                    d3.selectAll("#tempath").remove();
                    d3.selectAll(".weight-matrix-frame").style("opacity", 1);
                    d3.select(".wMatLink").style("opacity", 1);
                    d3.selectAll(".matmul-displayer").remove();
                    d3.selectAll(".columnGroup").style("opacity", 1);

                    d3.selectAll(".columnUnit").style("opacity", 0);
                    d3.selectAll(".interactRect  .math-formula").style("pointer-events", "auto");
                    injectPlayButtonSVG(
                        btn,
                        btnX,
                        btnY - 30,
                        "./assets/SVGs/matmul.svg"
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
                    d3.selectAll(".weight-matrix-frame").style("opacity", 1);
                    d3.select(".wMatLink").style("opacity", 1);
                    d3.selectAll(".matmul-displayer").remove();
                    d3.selectAll(".columnGroup").style("opacity", 1);
                    d3.selectAll(".columnUnit").style("opacity", 0);
                    d3.selectAll(".interactRect .math-formula").style("pointer-events", "auto");
                    injectPlayButtonSVG(
                        btn,
                        btnX,
                        btnY - 30,
                        "./assets/SVGs/matmul.svg"
                    );
                    isPlaying = false;
                    clearInterval(intervalID);
                }
                //        drawPoints(".mats", "red", [coordStartPoint, coordFinalPoint]);
                // d3.selectAll("circle").raise();
            }, 200); // 每2秒执行一次drawPaths

            setIntervalID(intervalID);
            isPlaying = true;
        } else if (isPlaying) {
            //d3.selectAll("#tempath").remove();
            d3.selectAll(".interactRect .math-formula").style("pointer-events", "none");
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
        featureVisTable: featureVisTable,
        features: features,
    };
}

export function outputVisClick(
    resultVis: any,
    one: any,
    result: any,
    myColor: any,
    featureChannels: number,
    poolingValues: number[],
    modelParams: any,
    sandboxMode: boolean
) {
    d3.select(".switchBtn").style("pointer-events", "none");
    d3.select(".switchBtn").style("opacity", 0.3);
    const aniSec = 300;

    const curve = d3.line().curve(d3.curveBasis);
    let biasCoord: any;
    let controlPts: any;
    let feaCoord: any;

    //drawPoints(".mats", "red", one)
    let currentStep = 0;
    let isPlaying = false;
    let intervalID: any = null;
    const rectH = 15;
    const rectW = 5;
    const poolingPt = get_cood_from_parent(".mats", ".pooling");

    let coordForStart = deepClone(poolingPt);
    coordForStart[0][1] += 15;
    coordForStart[0][0] -= featureChannels * 2.5;

    poolingPt[0][0] += featureChannels*1.5;

    // const modelParams = loadWeights();

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
    if(!sandboxMode)translateLayers(layerID, 300);
    else translateLayers(layerID, 350);
    d3.select(".hintLabel").style("opacity", 0);

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

    //     drawPoints(".mats", "red", resultCoord);
    biasCoord = deepClone(aOne);
    biasCoord[0][0] -= 130 + 2 * rectH;
    biasCoord[0][1] -= 50;
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
    const btnY = endPt2[1]-rectH/2;
    //const btnY = resultWithoutBiasCoord[0][1];

    const math = create(all, {});
    const wMat = math.transpose(modelParams.weights[3]);

    //where we put out animation sequence
    let pathMap: any = null;



    let weightMatrixPostions:any = computeMatrixLocations(btnX+42, btnY+30, -1, rectW, featureChannels, [wMat], 0);

    


    //poolingValues = math.transpose(poolingValues);

    d3.select(".mats").style("pointer-events", "none");

    const animateSeqAfterPath = [
        {func:()=>{
      //  d3.select(".mats").style("pointer-events", "none");
            buildDetailedViewArea(coordForStart[0][0], coordForStart[0][1] - 500, 1000, 1000, g1)
            drawWeightMatrix(btnX, btnY+30, -1, rectW, rectH, featureChannels, [wMat], 0, myColor, g1, weightMatrixPostions);
            drawWeightsVector(g1, resultWithoutBias, endPt2, rectH, rectH, myColor, 
                wMat, startCoord,endPathAniCoord , 1, weightMatrixPostions, 
                featureChannels, poolingValues)
            drawPathBtwOuputResult([endPt1[0]], endPt2);
            btn.selectAll("*").remove();
            injectPlayButtonSVG(
                btn,
                btnX,
                btnY,
                "./assets/SVGs/matmul.svg"
            );
            //drawHintLabel(g1, btnX, btnY-12, "Click for Animation", "procVis");
            const gLabel = d3.select(".mats").append("g");
            injectSVG(gLabel, btnX-120-64, btnY-120-64, "./assets/SVGs/interactionHint.svg", "procVis hintLabel");
            addExitBtn(btnX-300, btnY-30-120, gLabel)
        }, delay:aniSec+600},
        {func:()=>{

            drawBiasVector(g1, linBias.length, rectH, rectH, biasCoordCopy[0], myColor, linBias, layerID);
            drawBiasPathOutputVis(biasCoord, controlPts, feaCoord);
            drawWeightsVector(g1, result, outputCoord, rectH, rectH, myColor, 
                wMat, startCoord, endPathAniCoord, 1, weightMatrixPostions, 
                featureChannels, poolingValues, "procVis wRect", "");
            drawPathBtwOuputResult([endPt3], endPt4);
            drawPathBtwOuputResult([[endPt4[0]+30, endPt4[1]]], [endPt4[0]+125, endPt4[1]]);

            const iconX = endPt4[0]+(30+125)/2 + 25;
            const iconY = endPt4[1];

            drawFunctionIcon([iconX, iconY], "./assets/SVGs/softmax.svg", "Softmax", "Softmax", "./assets/SVGs/softmax_formula.svg", "Range: [0, 1]");
            


        }, delay:200},
        {func:()=>{
        pathMap = drawPathInteractiveComponents(resultStartCoord, resultCoord, result, myColor);
        d3.select(".mats").style("pointer-events", "auto");
        d3.select(".switchBtn").style("pointer-events", "auto");
        d3.select(".switchBtn").style("opacity", 1);
        d3.selectAll(".poolingRect")
                .style("pointer-events", "auto")
                .on("mouseover.tooltip", function(event) {
                    const id = Number(d3.select(this).attr("id"));
                    
                    
                    d3.selectAll(".pooling-tooltip").remove();
                    //这里
                    const container = d3.select(".mats");
                    const [x, y] = d3.pointer(event, container.node());
                    const tooltip = container
                        .append("g")
                        .attr("class", "pooling-tooltip procVis");
                    
                    tooltip.append("rect")
                        .attr("x", x + 10)
                        .attr("y", y - 40)
                        .attr("width", 120)
                        .attr("height", 30)
                        .attr("rx", 5)
                        .attr("ry", 5)
                        .style("fill", "white")
                        .style("stroke", "black");
                    
                    tooltip.append("text")
                        .attr("x", x + 15)
                        .attr("y", y - 20)
                        .style("font-size", "14px")
                        .style("font-family", "monospace")
                        .text(`Value: ${poolingValues[id].toFixed(2)}`);
                })
                .on("mouseout.tooltip", function() {

                    d3.selectAll(".pooling-tooltip").remove();
                });
        }, delay:200}
    ]

    const animateSeq = [
        {func:()=>{
            intervalID = setInterval(() => {
                const Xt = modelParams.weights[3];
                const Xv = Xt[currentStep];
                drawAniPath(wMat, currentStep, startCoord, endPathAniCoord, 1,
                     myColor, 0, [resultWithoutBiasCoord[0][0], resultWithoutBiasCoord[0][1]+rectH/2], 
                     rectH, rectH, result, g1, weightMatrixPostions, poolingValues);
                d3.selectAll(".columnUnit").style("opacity", 0);
                d3.selectAll(".columnGroup").style("opacity", 0.3).lower();
                d3.selectAll(`#columnGroup-${currentStep}`).style("opacity", 1).raise();
                d3.select(`#columnUnit-${currentStep}`).style("opacity", 1).raise();
                currentStep++;

                if (currentStep >= 2) {
                    d3.selectAll(".matmul-displayer").remove();
                    d3.selectAll(".columnGroup").style("opacity", 1);
                    d3.selectAll(".columnUnit").style("opacity", 0);
                    btn.selectAll("*").remove();
                    injectPlayButtonSVG(
                        btn,
                        btnX,
                        btnY,
                        "./assets/SVGs/matmul.svg"
                    );
                    clearInterval(intervalID);
                    d3.selectAll("#tempath").transition().delay(200).duration(200).remove();
                }
            }, 250); 
            d3.selectAll("path").lower();
            //d3.selectAll(".procVis").transition().duration(1000).attr("opacity", 1);
            d3.selectAll("path").lower();
            
        }, delay:aniSec},
    ];
    AnimationController.runAnimations(0, animateSeqAfterPath);


    //all the interaction add-ons
    d3.selectAll(".resultRect")
    .style("pointer-events", "auto")
    .on("mouseover", function (event) {
        event.stopPropagation();

        const rawId = d3.select(this).attr("id");
        if (rawId !== "0" && rawId !== "1") {
            throw new Error("Invalid result rect id: " + rawId);
          }
        const id: 0 | 1 = rawId === "0" ? 0 : 1;

        //here's the place to place the softmax displayer
        if(pathMap!=null)drawSoftmaxDisplayer(pathMap, endCoord, result, id, myColor);
    })
    .on("mouseout", function (event) {
        d3.selectAll(".math-displayer").remove();
        const id: number = Number(d3.select(this).attr("id"));

        if(pathMap!=null){
            pathMap[0][id]!.style.opacity = "0";
            pathMap[1][id]!.style.opacity = "0";
        }
    });

    let firstPlay = true;
    let allowExpl = true;

    btn.on("mouseover", function(event, d){
        const [x, y] = d3.pointer(event);
        if(allowExpl){
            drawMatmulExplanation(
                x, y, "Matrix Multiplication", "Click the icon to show the matrix multiplication process!"
            );
        }
    });

    btn.on("mouseout", function(event, d){
        allowExpl = true;
        d3.selectAll(".math-displayer").remove();
    });

    // play button interaction add-ons
    btn.on("click", function (event: any, d: any) {

        d3.selectAll(".interactRect .math-formula").style("pointer-events", "none");

        d3.selectAll(".weight-matrix-frame").style("opacity", 0);

        event.stopPropagation();

        allowExpl = false;
        
        if(firstPlay){
            d3.select(".mats").selectAll(".removeRect").remove();
            firstPlay = false;
        }
        if (intervalID) {
            clearInterval(intervalID);
        }
        //replay controls
        if (!isPlaying || currentStep >= 2 || currentStep == 0) {
            d3.selectAll("#tempath").remove();
            d3.selectAll(".weight-matrix-frame").style("opacity", 1);
            d3.select(".wMatLink").style("opacity", 1);
            d3.selectAll(".interactRect .math-formula").style("pointer-events", "auto");
            d3.selectAll(".matmul-displayer").remove();
            injectPlayButtonSVG(
                btn,
                btnX,
                btnY,
                "./assets/SVGs/matmul.svg"
            );
            if (currentStep >= 2) {
                d3.selectAll(".matmul-displayer").remove();
                d3.selectAll(".weight-matrix-frame").style("opacity", 1);
                d3.select(".wMatLink").style("opacity", 1);
                d3.selectAll(".interactRect .math-formula").style("pointer-events", "auto");
                d3.selectAll("#tempath").remove();
                d3.select(".mats").selectAll(".removeRect").remove();
                currentStep = 0; // 重置步骤
            }
            animateSeq[0].delay = 1;
            AnimationController.runAnimations(0, animateSeq);
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

    return {
        resultVis: resultVis,
    };
}

export function featureGATClick(
    layerID: number,
    node: number,
    recordLayerID: number,
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
    featureKeysEachLayer: number[][],
    mergedNodes:number[],
    activation: string = "relu",
){
    d3.select(".switchBtn").style("pointer-events", "none");
    d3.select(".switchBtn").style("opacity", 0.3);
    d3.selectAll(".cant-remove").classed("cant-remove", false);
    d3.selectAll(".inputFeature").classed("inputFeature", false);
    d3.selectAll(".outputFeature").classed("outputFeature", false);


    console.log("convs", conv1, conv2, featureKeysEachLayer, adjList[node]);
    const largeGraphIndexes = featureKeysEachLayer[0];
    //testCompute();
    let biasCoord: [number, number];
    let res10: [number, number];
    let res11: [number, number];
    let nextCoord: [number, number];

    let currentStep = 0;
    let isPlaying = false;
    // const rectH = 15;
    // const rectW = 5;
    const rectW7 = 10;

    translateLayers(layerID, (gap+2) * 3 + 5 * featureChannels * 2);
    //record the layerID
    recordLayerID = layerID;

    d3.select(".hintLabel").style("opacity", 0);

    //choose the right feature viusualizers to display
    let posList = []; //a list to manage all position from the previous layer feature vis
    let neighbors = adjList[node];
    for (let i = 0; i < neighbors.length; i++) {
        //display pre layer
        let cur = neighbors[i];
        featureVisTable[layerID][cur].style.opacity = "1";

        d3.select(featureVisTable[layerID][cur]).classed("cant-remove inputFeature", true);

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
    d3.select(curNode).classed("cant-remove outputFeature", true);

    d3.select(curNode)
    .selectAll(".frame")
    .attr("opacity", 1)
    .classed("cant-remove outputFeature", true);

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
    let lgIndices = [];
    //adjList[node] = Array.from(new Set(adjList[node]));
    for (let i = 0; i < adjList[node].length; i++) {
        //find multipliers
        let node_i = node;
        let node_j = adjList[node_i][i];

        console.log("draw attention 2", adjList[node].length, adjList[node])
        
        //find a way to compute the attn coef - mulV

        //get all neigbor features
        let neighborsFeatures = [];
        for(let j=0; j<adjList[node_i].length; j++){
            if(i!=j){
                //index mapping: (i -> itself index; j-> neighbor index)
                let jthIndex = largeGraphIndexes[j];
                if(layerID==0){jthIndex = j;}
                console.log("attn inner loop", featuresTable[layerID][jthIndex], jthIndex, layerID, featuresTable);
                neighborsFeatures.push(
                    Array.prototype.slice.call(featuresTable[layerID][jthIndex]));
            }
        }

        let lgI = largeGraphIndexes[node_i];
        let lgJ = largeGraphIndexes[node_j];

        if(layerID==0){
            lgI = node_i;
            lgJ = node_j;
        }

        lgIndices.push([lgI, lgJ]);

        let selfFeature = Array.prototype.slice.call(featuresTable[layerID][lgI]);

        let targetFeature = Array.prototype.slice.call(featuresTable[layerID][lgJ]);

        //get the feature of node_i

        console.log("attn features", layerID, selfFeature, targetFeature, neighborsFeatures, largeGraphIndexes[node_i], largeGraphIndexes[node_j]);

        const mulV = computeAttentionCoefficient(layerID+1, selfFeature, targetFeature, neighborsFeatures);
        mulValues.push(mulV);
        //compute x'

        const prepMat = [...featuresTable[layerID][node_j]];
        let matA = math.matrix(prepMat);
        X = math.add(math.multiply(prepMat, mulV), X);
    }
    const dummy: number[] = math.multiply(math.transpose(weights[layerID]), X);
    const Xt = math.transpose(weights[layerID]);

    //drawMatrixValid(Xt, coordFeatureVis[0], coordFeatureVis[1]-75, 10, 10)



    const g = d3.select(".mats").append("g");
    let w = 5;
    if (Xt[0].length < featureChannels) {
        w = 10;

    } else if(Xt[0].length<10){
        w = 10;
    }
    if(oFeatureChannels==128 && Xt[0].length==128){
        w = 2.5;
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

    //draw paths from intermediate result -> final result
    const layerBias = bias[layerID];
    coordFeatureVis2[1] += curveDir * 50;

    let coordFeatureVis2Copy = deepClone(coordFeatureVis2);

    //adjust the position of the bias vector for special case
    if(layerID==0 && oFeatureChannels==34){
        coordFeatureVis2Copy[0] += 50;
    }

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

    console.log("feature vis click", layerID, featureVisTable)

    //aniamtion sequence
    const initSec = 1000;
    const aniSec = 500;
    const waitSec = 250 * featureChannels;

    const btn = d3.select(".mats").append("g");
    const radius = 10;
    let btnX = playBtnCoord[0];
    const btnY = playBtnCoord[1]+rectH;

    if(layerID==0 && oFeatureChannels==34){
        btnX += 100;
    }



    let weightMatrixPostions:any = computeMatrixLocations(btnX+15, btnY, curveDir, w, featureChannels, weights, layerID);

    d3.select(".mats").style("pointer-events", "none");
    const formula:any = d3.select(".mats").append("g").attr("class", "math-formula");

    let animateSeqAfterPath: any = [
        {func: () => {
            buildDetailedViewArea(coordStartPoint[0], coordStartPoint[1] - 500, 1000, 1000, g)
            drawAttentions(
                g, X, coordFeatureVis, w, rectH, myColor, posList, mulValues, curveDir, layerID,
                featuresTable, lgIndices, mergedNodes
            )
            
            d3.select(".ctrlBtn").style("pointer-events", "none");
            
        }, 
            delay: initSec + aniSec,
        },
        {func: ()=>{
            injectPlayButtonSVG(
                btn,
                btnX,
                btnY - 30,
                "./assets/SVGs/matmul.svg"
            );
            //drawHintLabel(g, btnX, btnY - 36, "Click for Animation", "procVis");

            drawPathBtwOuputResult([coordFeatureVis], coordFeatureVis3)
            drawWeightMatrix(btnX, btnY, curveDir, w, w, featureChannels, weights, layerID, myColor, g, weightMatrixPostions);
            drawWeightsVector(g, dummy, coordFeatureVis3, rectH, rectW, myColor, weights[layerID], startCoordList, endCoordList, curveDir, weightMatrixPostions, featureChannels, X)
            drawBiasVector(g, featureChannels, rectH, rectW, coordFeatureVis2Copy, myColor, layerBias, layerID)
        }, delay:aniSec*2},
        // {func:()=>{
            
        // }, delay:aniSec},
        // {func: () => {}, delay: aniSec},
        // {func: () => , delay: aniSec},
        {func: () => {
            drawBiasPath(biasCoord, res10, res11, nextCoord, layerID, featureChannels)
            drawFinalPath(wmCoord, res00, res01, nextCoord, layerID, featureChannels, featureVisTable)
            if((featureVisTable.length==4&&layerID==2)||
                (oFeatureChannels==128&&layerID==1)){
                //if it's the last layer, don't show the relu icon
            }
            else if(activation=="tanh"){
                drawTanh(midX1, wmCoord, biasCoord, nextCoord);
            }else{
                drawReLU(midX1, wmCoord, biasCoord, nextCoord)
            }
            curNode.style.opacity = "1";
            
        }, delay: aniSec*2},
        {
            func:()=>{
                console.log("layerID", layerID)
                if(layerID==1){
                    drawMathFormula(formula, coordFeatureVis2Copy[0], coordFeatureVis2Copy[1]+curveDir*125, "./assets/SVGs/GATFormulaWithoutActivation.svg");
                }else{
                    drawMathFormula(formula, coordFeatureVis2Copy[0], coordFeatureVis2Copy[1]+curveDir*125, "./assets/SVGs/GATFormula.svg");
                }
                const gLabel = d3.select(".mats").append("g");
                injectSVG(gLabel, btnX-120-64, btnY-30-120-64, "./assets/SVGs/interactionHint.svg", "procVis hintLabel");
                addExitBtn(btnX-300, btnY-30-120, gLabel)
            }
        },
        // {func: () => drawFinalPath(wmCoord, res00, res01, nextCoord, layerID, featureChannels), delay: 1,},
        // {func: () => drawReLU(midX1, wmCoord, biasCoord, nextCoord), delay: aniSec,},
        // {func: () => {curNode.style.opacity = "1";},delay: aniSec,},
        {func: () => {
            d3.select(".ctrlBtn").style("pointer-events", "auto");
            d3.select(".mats").style("pointer-events", "auto");
            d3.select(".switchBtn").style("pointer-events", "auto");
            d3.select(".switchBtn").style("opacity", 1);
        },delay: 1,},
    ];

    // if(activation=="tanh"){
    //     animateSeqAfterPath[7].func = ()=>drawTanh(midX1, wmCoord, biasCoord, nextCoord);
    // }

    AnimationController.runAnimations(0, animateSeqAfterPath);
    //     d3.selectAll(".procVis").transition().duration(1000).attr("opacity", 1);

    function getIntervalID() {

        return intervalID;
    }
    

    let firstClick = true;

    let allowExpl = true;

    btn.on("mouseover", function(event, d){
        event.stopPropagation();
        const [x, y] = d3.pointer(event);
        if(allowExpl){
        drawMatmulExplanation(
            x, y, "Matrix Multiplication", "Click the icon to show the matrix multiplication process!"
        );
    }
    });

    btn.on("mouseout", function(event, d){ 
        allowExpl = true;
        d3.selectAll(".math-displayer").remove();
    });

    btn.on("click", function (event: any, d: any) {

        d3.selectAll(".interactRect .math-formula").style("pointer-events", "none");
        d3.selectAll(".weight-matrix-frame").style("opacity", 0);

        allowExpl = false;


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

            if(featureChannels==4&&layerID==2&&currentStep >= 2){
                d3.select(".mats").selectAll(".removeRect").remove();
                //   d3.select(".mats").selectAll(".pauseRemove").remove();
                d3.selectAll("#tempath").remove();
                d3.selectAll(".weight-matrix-frame").style("opacity", 1);
                d3.select(".wMatLink").style("opacity", 1);
                d3.selectAll(".interactRect .math-formula").style("pointer-events", "none");
              //  d3.select(".mats").selectAll(".").remove();
              d3.selectAll(".matmul-displayer").remove();
                currentStep = 0; // 重置步骤
            }
            if (currentStep >= featureChannels) {
                d3.select(".mats").selectAll(".removeRect").remove();
                //    d3.select(".mats").selectAll(".pauseRemove").remove();
                //d3.selectAll("#tempath").remove();
                currentStep = 0; // 重置步骤
            }
            const Xt = math.transpose(weights[layerID]);

            d3.select(".wMatLink").style("opacity", 0.3);

            intervalID = setInterval(() => {
                //func: () => drawWeightsVector(g, dummy, coordFeatureVis3, rectH, rectW, myColor, weights[layerID], startCoordList, endCoordList, curveDir, weightMatrixPostions, featureChannels), delay: aniSec},
                drawAniPath(
                    weights[layerID],
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
                    g,
                    weightMatrixPostions,
                    X
                );
                d3.selectAll(".columnUnit").style("opacity", 0);
                d3.selectAll(".columnGroup").style("opacity", 0.3).lower();
                d3.selectAll(`#columnGroup-${currentStep}`).style("opacity", 1).raise();
                d3.select(`#columnUnit-${currentStep}`).style("opacity", 1).raise();
                currentStep++;


                if(featureChannels==4&&layerID==2&&currentStep >= 2){
                    d3.selectAll("#tempath").remove();
                    d3.selectAll(".weight-matrix-frame").style("opacity", 1);
                    d3.select(".wMatLink").style("opacity", 1);
                    d3.selectAll(".matmul-displayer").remove();
                    d3.selectAll(".columnGroup").style("opacity", 1);
                    d3.selectAll(".columnUnit").style("opacity", 0);
                    d3.selectAll(".interactRect .math-formula").style("pointer-events", "auto");
                    injectPlayButtonSVG(
                        btn,
                        btnX,
                        btnY - 30,
                        "./assets/SVGs/matmul.svg"
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
                    d3.selectAll(".weight-matrix-frame").style("opacity", 1);
                    d3.select(".wMatLink").style("opacity", 1);
                    d3.selectAll(".matmul-displayer").remove();
                    d3.selectAll(".columnGroup").style("opacity", 1);
                    d3.selectAll(".columnUnit").style("opacity", 0);
                    d3.selectAll(".interactRect .math-formula").style("pointer-events", "auto");
                    injectPlayButtonSVG(
                        btn,
                        btnX,
                        btnY - 30,
                        "./assets/SVGs/matmul.svg"
                    );
                    isPlaying = false;
                    clearInterval(intervalID);
                }
                //        drawPoints(".mats", "red", [coordStartPoint, coordFinalPoint]);
                // d3.selectAll("circle").raise();
            }, 200); // 每2秒执行一次drawPaths

            setIntervalID(intervalID);
            isPlaying = true;
        } else if (isPlaying) {
            //d3.selectAll("#tempath").remove();
            d3.selectAll(".interactRect .math-formula").style("pointer-events", "none");
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
        featureVisTable: featureVisTable,
        features: features,
    };
}

export function featureSAGEClick(
    layerID: number,
    node: number,
    recordLayerID: number,
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
    featureKeysEachLayer: number[][],
    activation: string = "relu",
){
    d3.select(".switchBtn").style("pointer-events", "none");
    d3.select(".switchBtn").style("opacity", 0.3);
    d3.selectAll(".cant-remove").classed("cant-remove", false);
    d3.selectAll(".inputFeature").classed("inputFeature", false);
    d3.selectAll(".outputFeature").classed("outputFeature", false);

    console.log("convs sage", conv1, conv2, featureKeysEachLayer);
    const largeGraphIndexes = featureKeysEachLayer[0];
    //testCompute();
    let biasCoord: [number, number];
    let res10: [number, number];
    let res11: [number, number];
    let nextCoord: [number, number];

    let currentStep = 0;
    let isPlaying = false;
    // const rectH = 15;
    // const rectW = 5;
    const rectW7 = 10;

    translateLayers(layerID, (gap+2) * 3 + 5 * featureChannels * 2);
    //record the layerID
    recordLayerID = layerID;

    d3.select(".hintLabel").style("opacity", 0);
    //choose the right feature viusualizers to display
    let posList = []; //a list to manage all position from the previous layer feature vis
    let neighbors = adjList[node];
    for (let i = 0; i < neighbors.length; i++) {
        //display pre layer
        let cur = neighbors[i];
        featureVisTable[layerID][cur].style.opacity = "1";

        d3.select(featureVisTable[layerID][cur]).classed("cant-remove inputFeature", true);

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
    d3.select(curNode).classed("cant-remove outputFeature", true);

    d3.select(curNode)
    .selectAll(".frame")
    .attr("opacity", 1)
    .classed("cant-remove outputFeature", true);

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
    let X:any = new Array(featuresTable[layerID][node].length).fill(0);
    let mulValues = []; //an array to store all multiplier values
    let neighborsFeatures:number[][] = [];
    let lgIndices = [];
    for (let i = 0; i < adjList[node].length; i++) {
        //find multipliers
        let node_i = node;
        let node_j = adjList[node_i][i];

        lgIndices.push(node_j);
        
        //find a way to compute the attn coef - mulV
        let jthIndex = largeGraphIndexes[i];
        if(layerID==0){jthIndex = i;}
        Array.prototype.slice.call(featuresTable[layerID][jthIndex]);

        // //get all neigbor features
        // let neighborsFeatures = [];
        // for(let j=0; j<adjList[node_i].length; j++){
        //     if(i!=j){
        //         //index mapping: (i -> itself index; j-> neighbor index)
                
        //         console.log("attn inner loop", featuresTable[layerID][jthIndex], jthIndex, layerID, featuresTable);
                neighborsFeatures.push(
                    Array.prototype.slice.call(featuresTable[layerID][jthIndex]));
         //   }
        // }
        const mulV = 1 / adjList[node].length;
        mulValues.push(mulV);
        //com
        
    }
    X = math.multiply(meanAggregation(neighborsFeatures), 1 / adjList[node].length);
    console.log("output X", X);
    const dummy: number[] = math.multiply(math.transpose(weights[layerID]), X);
    const Xt = math.transpose(weights[layerID]);

    //drawMatrixValid(Xt, coordFeatureVis[0], coordFeatureVis[1]-75, 10, 10)



    const g = d3.select(".mats").append("g");
    let w = 5;
    if (Xt[0].length < featureChannels) {
        w = 10;

    } else if(Xt[0].length<10){
        w = 10;
    }
    if(oFeatureChannels==128 && Xt[0].length==128){
        w = 2.5;
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

    //draw paths from intermediate result -> final result
    const layerBias = bias[layerID];
    coordFeatureVis2[1] += curveDir * 50;

    let coordFeatureVis2Copy = deepClone(coordFeatureVis2);

    //adjust the position of the bias vector for special case
    if(layerID==0 && oFeatureChannels==34){
        coordFeatureVis2Copy[0] += 50;
    }

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

    console.log("feature vis click", layerID, featureVisTable)

    //aniamtion sequence
    const initSec = 1000;
    const aniSec = 500;
    const waitSec = 250 * featureChannels;

    const btn = d3.select(".mats").append("g");
    const radius = 10;
    let btnX = playBtnCoord[0];
    const btnY = playBtnCoord[1]+rectH;

    if(layerID==0 && oFeatureChannels==34){
        btnX += 100;
    }


    const formula:any = d3.select(".mats").append("g").attr("class", "math-formula");


    let weightMatrixPostions:any = computeMatrixLocations(btnX+15, btnY, curveDir, w, featureChannels, weights, layerID);

    d3.select(".mats").style("pointer-events", "none");

    let animateSeqAfterPath: any = [
        {func: () => {
            buildDetailedViewArea(c[0], c[1] - 500, 1000, 1000, g)
            drawSamplingAggregation(
                g, X, coordFeatureVis, w, rectH, myColor, 
                posList, mulValues, curveDir, lgIndices, featureKeysEachLayer[0]
            )
            
            d3.select(".ctrlBtn").style("pointer-events", "none");
        }, 
            delay: initSec + aniSec,
        },
        {func: ()=>{
            injectPlayButtonSVG(
                btn,
                btnX,
                btnY - 30,
                "./assets/SVGs/matmul.svg"
            );
            //drawHintLabel(g, btnX, btnY - 36, "Click for Animation", "procVis");

            const gLabel = d3.select(".mats").append("g");
            injectSVG(gLabel, btnX-120-64, btnY-30-120-64, "./assets/SVGs/interactionHint.svg", "procVis");

            drawPathBtwOuputResult([coordFeatureVis], coordFeatureVis3)
            drawWeightMatrix(btnX, btnY, curveDir, w, w, featureChannels, weights, layerID, myColor, g, weightMatrixPostions);
            drawWeightsVector(g, dummy, coordFeatureVis3, rectH, rectW, myColor, weights[layerID], startCoordList, endCoordList, curveDir, weightMatrixPostions, featureChannels, X)
            drawBiasVector(g, featureChannels, rectH, rectW, coordFeatureVis2Copy, myColor, layerBias, layerID)
        }, delay:aniSec*2},
        // {func:()=>{
            
        // }, delay:aniSec},
        // {func: () => {}, delay: aniSec},
        // {func: () => , delay: aniSec},
        {func: () => {
            drawBiasPath(biasCoord, res10, res11, nextCoord, layerID, featureChannels)
            drawFinalPath(wmCoord, res00, res01, nextCoord, layerID, featureChannels, featureVisTable)
            if((featureVisTable.length==4&&layerID==2)||
                (oFeatureChannels==128&&layerID==1)){
                //if it's the last layer, don't show the relu icon
            }
            else if(activation=="tanh"){
                drawTanh(midX1, wmCoord, biasCoord, nextCoord);
            }else{
                drawReLU(midX1, wmCoord, biasCoord, nextCoord)
            }
            curNode.style.opacity = "1";
            
        }, delay: aniSec*2},
        {
            func:()=>{
                if(layerID==1){
                    drawMathFormula(formula, coordFeatureVis2Copy[0], coordFeatureVis2Copy[1]+curveDir*125, "./assets/SVGs/GsageFormulaWithoutActivation.svg");
                }else{
                    drawMathFormula(formula, coordFeatureVis2Copy[0], coordFeatureVis2Copy[1]+curveDir*125, "./assets/SVGs/GsageFormula.svg");
                }
                const gLabel = d3.select(".mats").append("g");
                injectSVG(gLabel, btnX-120-64, btnY-30-120-64, "./assets/SVGs/interactionHint.svg", "procVis hintLabel");
                addExitBtn(btnX-300, btnY-30-120, gLabel)
            }
        },
        // {func: () => drawFinalPath(wmCoord, res00, res01, nextCoord, layerID, featureChannels), delay: 1,},
        // {func: () => drawReLU(midX1, wmCoord, biasCoord, nextCoord), delay: aniSec,},
        // {func: () => {curNode.style.opacity = "1";},delay: aniSec,},
        {func: () => {
            d3.select(".ctrlBtn").style("pointer-events", "auto");
            d3.select(".mats").style("pointer-events", "auto");
            d3.select(".switchBtn").style("pointer-events", "auto");
            d3.select(".switchBtn").style("opacity", 1);
        },delay: 1,},
    ];

    // if(activation=="tanh"){
    //     animateSeqAfterPath[7].func = ()=>drawTanh(midX1, wmCoord, biasCoord, nextCoord);
    // }

    AnimationController.runAnimations(0, animateSeqAfterPath);
    //     d3.selectAll(".procVis").transition().duration(1000).attr("opacity", 1);

    function getIntervalID() {

        return intervalID;
    }
    

    let firstClick = true;

    let allowExpl = true;

    btn.on("mouseover", function(event, d){
        event.stopPropagation();
        const [x, y] = d3.pointer(event);
        if(allowExpl){
        drawMatmulExplanation(
            x, y, "Matrix Multiplication", "Click the icon to show the matrix multiplication process!"
        );
    }
    });

    btn.on("mouseout", function(event, d){ 
        allowExpl = true;
        d3.selectAll(".math-displayer").remove();
    });

    btn.on("click", function (event: any, d: any) {

        d3.selectAll(".interactRect .math-formula").style("pointer-events", "none");
        d3.selectAll(".weight-matrix-frame").style("opacity", 0);

        allowExpl = false;


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

            if(featureChannels==4&&layerID==2&&currentStep >= 2){
                d3.select(".mats").selectAll(".removeRect").remove();
                //   d3.select(".mats").selectAll(".pauseRemove").remove();
                d3.selectAll("#tempath").remove();
                d3.selectAll(".weight-matrix-frame").style("opacity", 1);
                d3.select(".wMatLink").style("opacity", 1);
                d3.selectAll(".interactRect .math-formula").style("pointer-events", "none");
              //  d3.select(".mats").selectAll(".").remove();
              d3.selectAll(".matmul-displayer").remove();
                currentStep = 0; // 重置步骤
            }
            if (currentStep >= featureChannels) {
                d3.select(".mats").selectAll(".removeRect").remove();
                //    d3.select(".mats").selectAll(".pauseRemove").remove();
                //d3.selectAll("#tempath").remove();
                currentStep = 0; // 重置步骤
            }
            const Xt = math.transpose(weights[layerID]);

            d3.select(".wMatLink").style("opacity", 0.3);

            intervalID = setInterval(() => {
                //func: () => drawWeightsVector(g, dummy, coordFeatureVis3, rectH, rectW, myColor, weights[layerID], startCoordList, endCoordList, curveDir, weightMatrixPostions, featureChannels), delay: aniSec},
                drawAniPath(
                    weights[layerID],
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
                    g,
                    weightMatrixPostions,
                    X
                );
                d3.selectAll(".columnUnit").style("opacity", 0);
                d3.selectAll(".columnGroup").style("opacity", 0.3).lower();
                d3.selectAll(`#columnGroup-${currentStep}`).style("opacity", 1).raise();
                d3.select(`#columnUnit-${currentStep}`).style("opacity", 1).raise();
                currentStep++;


                if(featureChannels==4&&layerID==2&&currentStep >= 2){
                    d3.selectAll("#tempath").remove();
                    d3.selectAll(".weight-matrix-frame").style("opacity", 1);
                    d3.select(".wMatLink").style("opacity", 1);
                    d3.selectAll(".matmul-displayer").remove();
                    d3.selectAll(".columnGroup").style("opacity", 1);
                    d3.selectAll(".columnUnit").style("opacity", 0);
                    d3.selectAll(".interactRect .math-formula").style("pointer-events", "auto");
                    injectPlayButtonSVG(
                        btn,
                        btnX,
                        btnY - 30,
                        "./assets/SVGs/matmul.svg"
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
                    d3.selectAll(".weight-matrix-frame").style("opacity", 1);
                    d3.select(".wMatLink").style("opacity", 1);
                    d3.selectAll(".matmul-displayer").remove();
                    d3.selectAll(".columnGroup").style("opacity", 1);
                    d3.selectAll(".columnUnit").style("opacity", 0);
                    d3.selectAll(".interactRect .math-formula").style("pointer-events", "auto");
                    injectPlayButtonSVG(
                        btn,
                        btnX,
                        btnY - 30,
                        "./assets/SVGs/matmul.svg"
                    );
                    isPlaying = false;
                    clearInterval(intervalID);
                }
                //        drawPoints(".mats", "red", [coordStartPoint, coordFinalPoint]);
                // d3.selectAll("circle").raise();
            }, 200); // 每2秒执行一次drawPaths

            setIntervalID(intervalID);
            isPlaying = true;
        } else if (isPlaying) {
            //d3.selectAll("#tempath").remove();
            d3.selectAll(".interactRect .math-formula").style("pointer-events", "none");
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
        featureVisTable: featureVisTable,
        features: features,
    };
}
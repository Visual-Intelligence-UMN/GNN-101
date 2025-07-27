import { calculatePrevFeatureVisPos, loadLinkGATWeights, loadLinkWeights, loadNodeWeights, loadSimulatedModelWeights, loadWeights, translateLayers } from "./matHelperUtils";
import {
    drawMatrixPreparation,
    drawNodeFeatures,
    drawGCNConvGraphModel,
    drawGCNConvNodeModel,
    computeMids,
    drawGCNConvLinkModel,
    drawCrossConnectionForSubgraph,
} from "./matFeaturesUtils";
import * as d3 from "d3";
import {
    detailedViewRecovery,
    featureVisClick,
    featureVisMouseOut,
    featureVisMouseOver,
    oFeatureMouseOut,
    oFeatureMouseOver,
    outputVisClick,
    resultRectMouseover,
    resultRectMouseout,
    resultVisMouseEvent,
    featureGATClick,
    featureSAGEClick,
    smartMultiply
} from "./matEventsUtils";
import { deepClone, drawPoints } from "./utils";
import { AnimationController, computeMatrixLocations, drawAniPath, drawBiasPath, drawBiasVector, drawFunctionIcon, drawPathBtwOuputResult, drawPathInteractiveComponents, drawWeightMatrix, drawWeightsVector } from "./matAnimateUtils";
import { injectPlayButtonSVG, injectSVG } from "./svgUtils";
import { roundToTwo, SandboxModeSelector } from "../components/WebUtils";
import { drawMatmulExplanation, drawSoftmaxDisplayerNodeClassifier } from "./matInteractionUtils";
import { create, all } from "mathjs";
import { sigmoid } from "./linkPredictionUtils";
import { start } from "node:repl";

//Graph Classifier： features visualization pipeline: draw all feature visualizers for original features and GCNConv
export function visualizeGraphClassifierFeatures(
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
    sandboxMode: boolean
) {
    //--------------------------------DATA PREP MANAGEMENT--------------------------------
    let intervalID: any = null; // to manage animation controls

    let poolingVis = null; //to manage pooling visualizer
    let outputVis = null; //to manage model output
    let resultVis: any = null; //tp manage result visualizer
    //load weights and bias
    let dataPackage = loadWeights();
    if(sandboxMode) {
        dataPackage = loadSimulatedModelWeights();
    }

    console.log("inside visualizer graph", dataPackage);

    const weights = dataPackage["weights"];
    const bias = dataPackage["bias"];

    //table that manage all feature visualizers for GCNConv
    let featureVisTable: SVGElement[][] = [[], [], [], []];
    //control detail view
    let dview = false;
    //control lock and unlock
    let lock = false;
    //a data structure to store all feature vis frames information
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
    var schemeLocations: any = [];



    //--------------------------------DRAW FRAMES--------------------------------
    const framePackage = drawMatrixPreparation(graph, locations, 400);
    let colFrames: SVGElement[] = framePackage.colFrames; //a
    let matFrames: SVGElement[] = framePackage.matFrames; //a

    //-----------------------------------FIRST LAYER-----------------------------------------------
    const firstLayerPackage = drawNodeFeatures(
        locations,
        graph,
        myColor,
        features,
        frames,
        schemeLocations,
        featureVisTable,
        features[0].length,
        10,
        15,
        100
    );
    //updated variables
    locations = firstLayerPackage.locations;
    frames = firstLayerPackage.frames;
    schemeLocations = firstLayerPackage.schemeLocations;
    featureVisTable = firstLayerPackage.featureVisTable;
    const firstLayer = firstLayerPackage.firstLayer;

    console.log("observe table", featureVisTable, features, conv1, conv2, conv3);

    //-----------------------------------GCNConv LAYERS-----------------------------------------------
    const featureChannels = conv1[0].length;

    const GCNConvPackage = drawGCNConvGraphModel(
        conv1,
        conv2,
        conv3,
        locations,
        myColor,
        frames,
        schemeLocations,
        featureVisTable,
        pooling,
        graph,
        poolingVis,
        outputVis,
        final,
        firstLayer,
        maxVals,
        featureChannels
    );
    locations = GCNConvPackage.locations;
    frames = GCNConvPackage.frames;
    schemeLocations = GCNConvPackage.schemeLocations;
    featureVisTable = GCNConvPackage.featureVisTable;
    poolingVis = GCNConvPackage.poolingVis;
    outputVis = GCNConvPackage.outputVis;
    resultVis = GCNConvPackage.resultVis;
    maxVals = GCNConvPackage.maxVals;

    let path1 = GCNConvPackage.path1;
    let fr1 = GCNConvPackage.fr1;
    let poolingFrame = GCNConvPackage.poolingFrame;

    let paths = GCNConvPackage.paths;
    let one = GCNConvPackage.one;

    clearInterval(intervalID);
    //-----------------------------------INTERACTIONS EVENTS MANAGEMENT-----------------------------------------------
    //added interactions
    //add mouse event
    d3.selectAll(".oFeature").on("mouseover", function (event, d) {
        //if not in the state of lock
        if (!lock) {
            const layerID = d3.select(this).attr("layerID");
            const node = d3.select(this).attr("node");
            const pack = oFeatureMouseOver(layerID, node, frames, matFrames);
            //update variables
            frames = pack.frames;
            matFrames = pack.matFrames;
        }
    });
    d3.selectAll(".oFeature").on("mouseout", function (event, d) {
        const layerID = d3.select(this).attr("layerID");
        const node = d3.select(this).attr("node");
        const pack = oFeatureMouseOut(layerID, node, frames, matFrames);
        //update variables
        frames = pack.frames;
        matFrames = pack.matFrames;
    });

    let recordLayerID: number = -1;
    // a state to controls the recover event
    let transState = "GCNConv";
    //save events for poolingVis
    let poolingOverEvent: any = null;
    let poolingOutEvent: any = null;
    d3.selectAll(".mats, .switchBtn").on("click", function (event, d) {

        const isInGroup = event.target.classList.contains('procVis') || event.target.classList.contains('to-be-removed') || event.target.classList.contains('weightUnit')
        console.log(event.target.classList)

        if (event.target && event.target.id === "btn" || isInGroup) {
            return;
        }
        if (lock) {
            const recoverPackage = detailedViewRecovery(
                event,
                dview,
                lock,
                transState,
                recordLayerID,
                poolingOutEvent,
                poolingOverEvent,
                poolingVis,
                featureChannels,
                100,
                [],
                sandboxMode
            );
            //update variables
            dview = recoverPackage.dview;
            lock = recoverPackage.lock;
            transState = recoverPackage.transState;
            recordLayerID = recoverPackage.recordLayerID;
            poolingOutEvent = recoverPackage.poolingOutEvent;
            poolingOverEvent = recoverPackage.poolingOverEvent;
            clearInterval(intervalID);
        }
    });

    function setIntervalID(id: any) {
        intervalID = id;

    }

    function getIntervalID() {

        return intervalID;
    }


    d3.selectAll(".featureVis").on("click", function (event, d) {
        if (lock != true) {
            //state
            transState = "GCNConv";
            lock = true;
            event.stopPropagation();
            dview = true;

            //lock all feature visualizers and transparent paths
            d3.selectAll(".oFeature")
                .style("pointer-events", "none")
                .style("opacity", 0.2);
            d3.select(".pooling")
                .style("pointer-events", "none")
                .style("opacity", 0.2);
            d3.selectAll(".twoLayer")
                .style("pointer-events", "none")
                .style("opacity", 0.2);
            d3.selectAll(".crossConnection").style("opacity", 0);
            //transparent other feature visualizers
            d3.selectAll(".featureVis").style("opacity", 0.2);
            d3.selectAll(".oFeature").style("opacity", 0.2);
            //translate each layer
            const layerID = Number(d3.select(this).attr("layerID")) - 1;
            const node = Number(d3.select(this).attr("node"));
            const featureVisPack = featureVisClick(
                layerID,
                node,
                recordLayerID,
                adjList,
                featureVisTable,
                features,
                conv1,
                conv2,
                bias,
                myColor,
                weights,
                lock,
                setIntervalID,
                featureChannels,
                15,
                5,
                100,
                7,
                10
            );
            // update variables
            recordLayerID = featureVisPack.recordLayerID;
            featureVisTable = featureVisPack.featureVisTable;
            features = featureVisPack.features;
            intervalID = featureVisPack.getIntervalID();

            //path connect - connect intermediate feature vis to current feature vis
        }
    });
    d3.selectAll(".featureVis").on("mouseover", function (event, d) {
        //if not in the state of lock
        if (!lock) {
            //paths interactions
            const layerID = Number(d3.select(this).attr("layerID")) - 1;
            const node = Number(d3.select(this).attr("node"));
            const featureOverPack = featureVisMouseOver(
                layerID,
                node,
                paths,
                frames,
                adjList,
                matFrames,
                colFrames,
                featureChannels
            );
            paths = featureOverPack.paths;
            frames = featureOverPack.frames;
            matFrames = featureOverPack.matFrames;
            colFrames = featureOverPack.colFrames;
        }
    });
    d3.selectAll(".featureVis").on("mouseout", function (event, d) {
        if (!lock) {
            const layerID = Number(d3.select(this).attr("layerID")) - 1;
            const node = Number(d3.select(this).attr("node"));
            const featureOverPack = featureVisMouseOut(
                layerID,
                node,
                paths,
                frames,
                adjList,
                matFrames,
                colFrames
            );
            paths = featureOverPack.paths;
            frames = featureOverPack.frames;
            matFrames = featureOverPack.matFrames;
            colFrames = featureOverPack.colFrames;
        }
    });
    //model output visualizer click interaction
    if (outputVis != null) {
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
        d3.selectAll(".resultRect")
            .style("pointer-events", "auto")
            .on("click", function (event: any, d: any) {
                if (lock != true) {
                    d3.select(".pooling").style("pointer-events", "none");
                    //state
                    transState = "output";
                    lock = true;
                    event.stopPropagation();
                    dview = true;

                    //lock all feature visualizers and transparent paths
                    const outputVisPack = outputVisClick(
                        resultVis,
                        one,
                        final,
                        myColor,
                        featureChannels,
                        pooling,
                        dataPackage,
                        sandboxMode
                    );
                    //update variables
                    resultVis = outputVisPack.resultVis;
                }
            });
    }

    return {
        getIntervalID: getIntervalID
    };

}

//Node Classifier: features visualization pipeline: draw all feature visualizers for original features and GCNConv
export function visualizeNodeClassifierFeatures(
    locations: any,
    features: any,
    myColor: any,
    conv1: any,
    conv2: any,
    conv3: any,
    result: any,
    final: any,
    graph: any,
    adjList: any,
    maxVals: any,
    trainingNodes: number[],
    sandBoxMode: boolean
) {
    //--------------------------------DATA PREP MANAGEMENT--------------------------------
    let intervalID: any = null; // to manage animation controls

    let poolingVis = null; //to manage pooling visualizer
    let outputVis = null; //to manage model output
    let resultVis: any = null; //tp manage result visualizer
    //load weights and bias
    let dataPackage = loadNodeWeights();
    if(sandBoxMode) {
        dataPackage = loadSimulatedModelWeights("node");
    }

    const weights = dataPackage["weights"];
    const bias = dataPackage["bias"];

    //table that manage all feature visualizers for GCNConv
    let featureVisTable: SVGElement[][] = [[], [], [], [], []];
    //table that manage color schemes
    //control detail view
    let dview = false;
    //control lock and unlock
    let lock = false;
    //a data structure to store all feature vis frames information
    interface FrameDS {
        features: any[];
        GCNConv1: any[];
        GCNConv2: any[];
        GCNConv3: any[];
        results: any[];
    }
    var frames: FrameDS = {
        features: [],
        GCNConv1: [],
        GCNConv2: [],
        GCNConv3: [],
        results: []
    };
    var schemeLocations: any = [];



    //--------------------------------DRAW FRAMES--------------------------------
    let prepParam = 600;
    if(sandBoxMode)prepParam = 400;
    console.log("matrix frames layout param", prepParam, sandBoxMode);
    const framePackage = drawMatrixPreparation(graph, locations, prepParam);
    let colFrames: SVGElement[] = framePackage.colFrames; //a
    let matFrames: SVGElement[] = framePackage.matFrames; //a

    //-----------------------------------FIRST LAYER-----------------------------------------------
    const firstLayerPackage = drawNodeFeatures(
        locations,
        graph,
        myColor,
        features,
        frames,
        schemeLocations,
        featureVisTable,
        features[0].length,
        5,
        15,
        150
    );
    //updated variables
    locations = firstLayerPackage.locations;
    frames = firstLayerPackage.frames;
    schemeLocations = firstLayerPackage.schemeLocations;
    featureVisTable = firstLayerPackage.featureVisTable;
    const firstLayer = firstLayerPackage.firstLayer;

    //-----------------------------------GCNConv LAYERS-----------------------------------------------
    const featureChannels = conv1[0].length;

    const GCNConvPackage = drawGCNConvNodeModel(
        conv1,
        conv2,
        conv3,
        locations,
        myColor,
        frames,
        schemeLocations,
        featureVisTable,
        result,
        graph,
        final,
        firstLayer,
        maxVals,
        featureChannels,
        trainingNodes,
        [conv1[0].length, conv2[0].length, conv3[0].length, result[0].length],
        sandBoxMode
    );
    locations = GCNConvPackage.locations;
    frames = GCNConvPackage.frames;
    schemeLocations = GCNConvPackage.schemeLocations;
    featureVisTable = GCNConvPackage.featureVisTable;
    maxVals = GCNConvPackage.maxVals;
    let resultLabelsList = GCNConvPackage.resultLabelsList;
    let paths = GCNConvPackage.paths;
    let resultPaths = GCNConvPackage.resultPaths;



    // clearInterval(intervalID);

    //-----------------------------------INTERACTIONS EVENTS MANAGEMENT-----------------------------------------------
    //added interactions
    //add mouse event
    d3.selectAll(".oFeature").on("mouseover", function (event, d) {
        //if not in the state of lock
        if (!lock) {
            const layerID = d3.select(this).attr("layerID");
            const node = d3.select(this).attr("node");
            const pack = oFeatureMouseOver(layerID, node, frames, matFrames);
            //update variables
            frames = pack.frames;
            matFrames = pack.matFrames;
        }
    });
    d3.selectAll(".oFeature").on("mouseout", function (event, d) {
        const layerID = d3.select(this).attr("layerID");
        const node = d3.select(this).attr("node");
        const pack = oFeatureMouseOut(layerID, node, frames, matFrames);
        //update variables
        frames = pack.frames;
        matFrames = pack.matFrames;
    });

    let recordLayerID: number = -1;
    // a state to controls the recover event
    let transState = "GCNConv";
    //save events for poolingVis
    let poolingOverEvent: any = null;
    let poolingOutEvent: any = null;

    d3.selectAll(".featureVis").on("mouseover", function (event, d) {
        //if not in the state of lock
        if (!lock) {
            //paths interactions
            const layerID = Number(d3.select(this).attr("layerID")) - 1;
            const node = Number(d3.select(this).attr("node"));
            const featureOverPack = featureVisMouseOver(
                layerID,
                node,
                paths,
                frames,
                adjList,
                matFrames,
                colFrames,
                featureChannels
            );
            paths = featureOverPack.paths;
            frames = featureOverPack.frames;
            matFrames = featureOverPack.matFrames;
            colFrames = featureOverPack.colFrames;
        }
    });
    d3.selectAll(".featureVis").on("mouseout", function (event, d) {
        if (!lock) {
            const layerID = Number(d3.select(this).attr("layerID")) - 1;
            const node = Number(d3.select(this).attr("node"));
            const featureOverPack = featureVisMouseOut(
                layerID,
                node,
                paths,
                frames,
                adjList,
                matFrames,
                colFrames
            );
            paths = featureOverPack.paths;
            frames = featureOverPack.frames;
            matFrames = featureOverPack.matFrames;
            colFrames = featureOverPack.colFrames;
        }
    });

    d3.selectAll(".resultVis").on("mouseover", function (event, d) {
        //if not in the state of lock
        if (!lock) {
            //paths interactions
            const node = Number(d3.select(this).attr("node"));
            resultVisMouseEvent(node, resultPaths, frames, adjList, matFrames, colFrames, "1", "1")
            resultLabelsList[node].style.fill = "black";
        }
    });
    d3.selectAll(".resultVis").on("mouseout", function (event, d) {
        if (!lock) {
            //paths interactions
            const node = Number(d3.select(this).attr("node"));
            resultVisMouseEvent(node, resultPaths, frames, adjList, matFrames, colFrames, "0.25", "0.25")
            resultLabelsList[node].style.fill = "gray";
        }
    });

    d3.selectAll(".mats, .switchBtn").on("click", function (event, d) {

        const isInGroup = event.target.classList.contains('procVis') || event.target.classList.contains('to-be-removed') || event.target.classList.contains('weightUnit')
        if (event.target && event.target.id === "btn" || isInGroup) {
            return;
        }
        if (lock) {
            d3.selectAll(".resultVis")
                .style("pointer-events", "auto")
                .style("opacity", 1);
            const recoverPackage = detailedViewRecovery(
                event,
                dview,
                lock,
                transState,
                recordLayerID,
                poolingOutEvent,
                poolingOverEvent,
                poolingVis,
                featureChannels,
                90,
                resultLabelsList,
                sandBoxMode,"node"
            );
            //update variables
            dview = recoverPackage.dview;
            lock = recoverPackage.lock;
            transState = recoverPackage.transState;
            recordLayerID = recoverPackage.recordLayerID;
            poolingOutEvent = recoverPackage.poolingOutEvent;
            poolingOverEvent = recoverPackage.poolingOverEvent;
            clearInterval(intervalID);
        }
    });

    function setIntervalID(id: any) {
        intervalID = id;

    }

    function getIntervalID() {

        return intervalID;
    }


    d3.selectAll(".featureVis").on("click", function (event, d) {
        if (lock != true) {
            //state
            transState = "GCNConv";
            lock = true;
            event.stopPropagation();
            dview = true;

            //lock all feature visualizers and transparent paths
            d3.selectAll(".resultVis")
                .style("pointer-events", "none")
                .style("opacity", 0.2);
            d3.selectAll(".oFeature")
                .style("pointer-events", "none")
                .style("opacity", 0.2);
            d3.select(".pooling")
                .style("pointer-events", "none")
                .style("opacity", 0.2);
            d3.selectAll(".twoLayer")
                .style("pointer-events", "none")
                .style("opacity", 0.2);
            d3.selectAll(".crossConnection").style("opacity", 0);
            //transparent other feature visualizers
            d3.selectAll(".featureVis").style("opacity", 0.2);
            d3.selectAll(".oFeature").style("opacity", 0.2);
            //translate each layer
            const layerID = Number(d3.select(this).attr("layerID")) - 1;
            const node = Number(d3.select(this).attr("node"));
            let p1 = 10;
            let p2 = 90;
            let p3 = 34;
            let p4 = 5;
            let p5 = 'tanh';
            if (sandBoxMode){
                p1 = 5;
                p2 = 150;
                p3 = 3;
                p4 = 10;
                p5 = 'relu';
            }
            const featureVisPack = featureVisClick(
                layerID,
                node,
                recordLayerID,
                adjList,
                featureVisTable,
                features,
                conv1,
                conv2,
                bias,
                myColor,
                weights,
                lock,
                setIntervalID,
                featureChannels,
                15,
                p1,p2,p3,p4,p5
            );
            // update variables
            recordLayerID = featureVisPack.recordLayerID;
            featureVisTable = featureVisPack.featureVisTable;
            features = featureVisPack.features;
            intervalID = featureVisPack.getIntervalID();

            //path connect - connect intermediate feature vis to current feature vis
        }
    });

    d3.selectAll(".resultVis").on("click", function (event, d) {
        if (lock != true) {
            //state
            transState = "resultLayer";
            lock = true;
            event.stopPropagation();
            dview = true;

            d3.select(".switchBtn").style("pointer-events", "none");
            d3.select(".switchBtn").style("opacity", 0.3);

            //lock all feature visualizers and transparent paths
            d3.selectAll(".resultVis")
                .style("pointer-events", "none")
                .style("opacity", 0.2);
            d3.selectAll(".oFeature")
                .style("pointer-events", "none")
                .style("opacity", 0.2);
            d3.select(".pooling")
                .style("pointer-events", "none")
                .style("opacity", 0.2);
            d3.selectAll(".twoLayer")
                .style("pointer-events", "none")
                .style("opacity", 0.2);
            d3.selectAll(".crossConnection").style("opacity", 0);
            //transparent other feature visualizers
            d3.selectAll(".featureVis").style("opacity", 0.2);
            d3.selectAll(".oFeature").style("opacity", 0.2);

            d3.select(".hintLabel").style("opacity", 0);

            //------------------the actual interaction codes part --------------------------------
            const layerID = 3;
            const node = Number(d3.select(this).attr("node"));
            if(!sandBoxMode)translateLayers(3, 250);
            else translateLayers(3, 325);

            //choose the right color schemes to display

            featureVisTable[layerID][node].style.opacity = "1";
            let curNode = featureVisTable[layerID + 1][node];
            curNode.style.opacity = "0.25"; //display current node
            d3.select(curNode).selectAll(".frame").attr("opacity", 1);

            let prevFeatureCoord: any = calculatePrevFeatureVisPos(
                featureVisTable,
                layerID,
                node,
                2,
                34,
                10,
                5
            );
            //-------------------------position computing

            //coordinate for model output <- the position for model output feature visualizer
            let outputCoord: [number, number] = [
                prevFeatureCoord[0] + 150,
                prevFeatureCoord[1] //may need adjust to top-left pos
            ];

            //end coordinate for model output <- the starting point for final path
            let endOutputCoord: [number, number] = [
                prevFeatureCoord[0] + 150 + 10 * 4,
                prevFeatureCoord[1] //may need adjust to top-left pos
            ];

            //start coordinate for result <- the ending point for final path
            let startResultCoord: [number, number] = [
                prevFeatureCoord[0] + 450,
                prevFeatureCoord[1] //may need adjust to top-left pos
            ];

            //do a curveDir test for the direction of arcs and bias vector
            let curveDir = 1;
            if (node < (conv1.length/2)) curveDir = -1;

            //find the position for the bias vector <- we use this positio to compute the position for bias vector
            //coordinate for model output <- the position for model output feature visualizer
            let biasCoord: [number, number] = [
                prevFeatureCoord[0] + 150,
                prevFeatureCoord[1] + curveDir * 50 //may need adjust to top-left pos
            ];

            //find the ending position of bias vector <- we use this for bias path computing - ending point
            let endBiasPathCoord: [number, number] = [
                prevFeatureCoord[0] + 250,
                prevFeatureCoord[1] //may need adjust to top-left pos
            ];

            //starting point for final values visualizer
            let finalOutputCoord: [number, number] = [
                endBiasPathCoord[0],
                endBiasPathCoord[1]
            ];

            let vectorAfterMatMulPath: [number, number] = [
                finalOutputCoord[0] - 6 * 10,
                finalOutputCoord[1]
            ];


            //find the ending position of bias vector <- we use this for bias path computing
            let endBiasCoord: [number, number] = [
                biasCoord[0] + 4 * 10,
                biasCoord[1]
            ];

            const yForPathAni = prevFeatureCoord[1] - curveDir * 7.5;
            //following position computations will be based on the value of curveDir for dynamic adjustment
            //find the coordinates for arcs animation
            // let startPathCoords: number[][] = [
            //     [prevFeatureCoord[0] - 5, prevFeatureCoord[1] - curveDir * 7.5],
            //     [prevFeatureCoord[0] - 15, prevFeatureCoord[1] - curveDir * 7.5]
            // ]; //compute the starting positions of the paths animation
            let startPathCoords: number[][] = [];
            console.log("conv3", conv3[0]);
            for(let i=0; i<conv3[0].length; i++){
                startPathCoords.push(
                    [
                        prevFeatureCoord[0] - 5 - i * 10,
                        prevFeatureCoord[1] - curveDir * 7.5
                    ]
                )
                if(sandBoxMode){
                    startPathCoords[i][0] += 70
                }
            }
            // drawPoints(".mats", "red", startPathCoords);
            let endPathCoords: number[][] = [
                [outputCoord[0] + 5, yForPathAni],
                [outputCoord[0] + 15, yForPathAni],
                [outputCoord[0] + 25, yForPathAni],
                [outputCoord[0] + 35, yForPathAni]
            ]; //compute the ending positions of the paths animation

            //find the coordination for softmax visualization
            const yForSoftmax = prevFeatureCoord[1] - curveDir * 7.5;
            let softmaxStartCoords = [
                [finalOutputCoord[0] + 5, yForSoftmax],
                [finalOutputCoord[0] + 15, yForSoftmax],
                [finalOutputCoord[0] + 25, yForSoftmax],
                [finalOutputCoord[0] + 35, yForSoftmax]
            ]; //compute the starting positions of the softmax vis

            //find the positions for softmax ending position
            let softmaxEndCoords: number[][] = [
                [startResultCoord[0] + 5, yForSoftmax],
                [startResultCoord[0] + 15, yForSoftmax],
                [startResultCoord[0] + 25, yForSoftmax],
                [startResultCoord[0] + 35, yForSoftmax]
            ];

            //data preparation<- weights, final outputs, softmax values in paths
            let modelParams = loadNodeWeights();
            if(sandBoxMode) {
                modelParams = loadSimulatedModelWeights("node");
            }
            console.log("in result vis modelParams", modelParams);
            const linBias = modelParams["bias"][3]; //bias vector
            const matMulWeights = modelParams["weights"][3]; // weights for matrix multiplication
            const nthOutputVals = final[node];

            //the vector after matrix multiplication - before adding the bias
            const math = create(all, {});
            // const prevCon3Val: number[] = [conv3[node][0], conv3[node][1]];
            const prevCon3Val: number[] = Array.from(conv3[node]);
            // const vectorAfterMul = math.multiply(prevCon3Val, math.transpose(matMulWeights));
            console.log("vector before mat mul", prevCon3Val, math.transpose(matMulWeights));
            const vectorAfterMul = smartMultiply(math.transpose(matMulWeights), prevCon3Val);
            console.log("vector after mat mul", vectorAfterMul, prevCon3Val, math.transpose(matMulWeights));

            //visualization <- replace this by animation sequence
            const g = d3.select(".mats");
            const rArray = computeMids(endBiasCoord, endBiasPathCoord);
            const res10: any = rArray[0];
            const res11: any = rArray[1];

            //draw softmax
            let clockwise = 0;
            if (node < conv1.length/2) clockwise = 1;

            //smart ui detections & transparent

            //transparent prevLayer(featureVisTable[3]) && curLayer(featureVisTable[4])
            if (node < conv1.length/2) {
                //process prevLayer
                featureVisTable[3][node + 1].style.opacity = "0";
                featureVisTable[3][node + 2].style.opacity = "0";
                //process curLayer
                featureVisTable[4][node + 1].style.opacity = "0";
                featureVisTable[4][node + 2].style.opacity = "0";
            } else {
                //process prevLayer
                featureVisTable[3][node - 1].style.opacity = "0";
                featureVisTable[3][node - 2].style.opacity = "0";
                //process curLayer
                featureVisTable[4][node - 1].style.opacity = "0";
                featureVisTable[4][node - 2].style.opacity = "0";
            }

            //animation
            //play button injection
            const btn = d3.select(".mats").append("g").attr("class", "ctrlBtn");
            const radius = 10;
            const btnX = (prevFeatureCoord[0] + outputCoord[0]) / 2;
            const btnY = prevFeatureCoord[1] - 15 / 2;

            let currentStep = 0;

            const initSec = 300;
            const aniSec = 500;

            const g1 = d3.select(".mats").append("g");

            let pathMap: any = null;


            const wMat = math.transpose(modelParams.weights[3]);
            console.log("wMat", wMat, modelParams.weights[3]);

            let weightMatrixPostions: any = computeMatrixLocations(btnX + 15, btnY + 30, curveDir, 15, featureChannels, [wMat], 0);

            // drawPoints(".mats", "red", [[btnX+10, btnY+30-15]])

            d3.select(".mats").style("pointer-events", "none");

            const animateSeqAfterPath = [
                {
                    func: () => {
                        //  d3.select(".mats").style("pointer-events", "none");
                        const Xt = modelParams.weights[3];
                        const prevCon3Val: number[] = [conv3[node][0], conv3[node][1]];

                        drawWeightMatrix(btnX, btnY + 15, 1, 15, 15, featureChannels, [wMat], 0, myColor, g1, weightMatrixPostions);
                        drawWeightsVector(g, vectorAfterMul, outputCoord, 15, 10,
                            myColor, wMat, startPathCoords, endPathCoords, curveDir,
                            weightMatrixPostions, featureChannels, prevCon3Val)
                        drawPathBtwOuputResult([prevFeatureCoord], outputCoord);
                        
                    }, delay: aniSec
                },
                {
                    func: () => {
                        //draw a final value output visualizer for testing
                        drawWeightsVector(g, nthOutputVals, finalOutputCoord,
                            15, 10, myColor, wMat, startPathCoords,
                            endPathCoords, curveDir, weightMatrixPostions,
                            featureChannels, prevCon3Val, "procVis wRect", "");
                        drawPathBtwOuputResult([vectorAfterMatMulPath], finalOutputCoord);
                    }, delay: aniSec
                },
                { func: () => { drawBiasVector(g, 4, 15, 10, biasCoord, myColor, linBias, 4); }, delay: aniSec },
                { func: () => { drawBiasPath(endBiasCoord, res10, res11, endBiasPathCoord, 4, 4); }, delay: aniSec },
                { func: () => { 
                    drawPathBtwOuputResult([endOutputCoord], startResultCoord); 
                    const iconX = (endOutputCoord[0] + startResultCoord[0]) / 2 + 75;
                    const iconY = endOutputCoord[1];
                    drawFunctionIcon([iconX, iconY], "./assets/SVGs/softmax.svg", "Softmax", "Softmax", "./assets/SVGs/softmax_formula.svg", "Range: [0, 1]");

                }, delay: aniSec },
                {
                    func: () => {
                        let dir = 1;
                        if (clockwise == 1) dir = 0;
                        pathMap = drawPathInteractiveComponents(softmaxStartCoords, softmaxEndCoords, nthOutputVals, myColor, dir);
                        d3.select(".mats").style("pointer-events", "auto");
                    }, delay: aniSec
                },
                {
                    func: () => {
                        //display the result feature visualizer
                        featureVisTable[4][node].style.opacity = "1";
                        resultLabelsList[node].style.fill = "black";
                        d3.select(".switchBtn").style("pointer-events", "auto");
                        d3.select(".switchBtn").style("opacity", 1);
                    }, delay: aniSec
                }
            ]

            const animateSeq = [
                {
                    func: () => {
                        intervalID = setInterval(() => {
                            const Xt = modelParams.weights[3];
                            const Xv = Xt[currentStep];
                            drawAniPath(wMat, currentStep, startPathCoords, endPathCoords,
                                curveDir, myColor, 0, outputCoord, 15, 10, vectorAfterMul,
                                g1, weightMatrixPostions, prevCon3Val);
                            d3.selectAll(".columnUnit").style("opacity", 0);
                            d3.selectAll(".weightUnit").style("opacity", 0.3).lower();
                            d3.selectAll(`#weightUnit-${currentStep}`).style("opacity", 1).raise();
                            d3.select(`#columnUnit-${currentStep}`).style("opacity", 1).raise();
                            currentStep++;

                            if (currentStep >= 4) {
                                d3.selectAll(".weightUnit").style("opacity", 1);
                                d3.selectAll(".columnUnit").style("opacity", 0);
                                btn.selectAll("*").remove();
                                injectPlayButtonSVG(
                                    btn,
                                    btnX,
                                    btnY,
                                    "./assets/SVGs/matmul.svg"
                                );
                                d3.selectAll("#tempath").transition().delay(200).remove();
                                d3.selectAll(".matmul-displayer").transition().delay(200).remove();
                                clearInterval(intervalID);
                            }
                        }, 250);
                        d3.selectAll("path").lower();
                        //d3.selectAll(".procVis").transition().duration(1000).attr("opacity", 1);
                        d3.selectAll("path").lower();
                    }, delay: initSec + aniSec
                },
            ];
            AnimationController.runAnimations(0, animateSeqAfterPath);

            // play button interaction add-ons
            let isPlaying = false;

            setTimeout(() => {
                injectPlayButtonSVG(
                    btn,
                    btnX,
                    btnY,
                    "./assets/SVGs/matmul.svg"
                );
                const gLabel = d3.select(".mats").append("g");
                injectSVG(gLabel, btnX - 120 - 64, btnY - 120 - 64, "./assets/SVGs/interactionHint.svg", "procVis hintLabel");
            }, aniSec);

            let firstPlay = true;
            let allowExpl = true;

            btn.on("mouseover", function (event, d) {
                const [x, y] = d3.pointer(event);
                if(allowExpl){
                    drawMatmulExplanation(
                        x, y, "Matrix Multiplication", "Click the icon to show the matrix multiplication process!"
                    );
                }
            });

            btn.on("mouseout", function (event, d) {
                allowExpl = true;
                d3.selectAll(".math-displayer").remove();
            });

            btn.on("click", function (event: any, d: any) {
                //  d3.select(".biasPath").remove();
                allowExpl = false;
                if (firstPlay) {
                    d3.selectAll(".removeRect").remove();
                    firstPlay = false;
                }

                event.stopPropagation();
                if (intervalID) {
                    clearInterval(intervalID);
                }
                //replay controls
                if (!isPlaying || currentStep >= 4 || currentStep == 0) {
                    d3.selectAll("#tempath").transition().delay(200).remove();
                    d3.selectAll(".matmul-displayer").transition().delay(200).remove();
                    btn.selectAll("*").remove();
                    injectPlayButtonSVG(
                        btn,
                        btnX,
                        btnY,
                        "./assets/SVGs/playBtn_pause.svg"
                    );
                    if (currentStep >= 4) {
                        d3.selectAll("#tempath").transition().delay(200).remove();
                        d3.selectAll(".matmul-displayer").transition().delay(200).remove();
                        d3.select(".mats").selectAll(".removeRect").transition().delay(200).remove();
                        d3.select(".mats").selectAll(".pauseRemove").transition().delay(200).remove();
                        currentStep = 0; // 重置步骤
                        featureVisTable[4][node].style.opacity = "0.25";
                        resultLabelsList[node].style.fill = "gray";
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
                        "./assets/SVGs/playBtn_play.svg"
                    );
                    isPlaying = false;
                }
                d3.selectAll("path").lower();
            });


            d3.select(".mats")
                .selectAll(`rect#resultRect${node}`)
                .style("pointer-events", "auto")
                .on("mouseover", function (event, d) {
                    if (pathMap != null) {
                        const titles: string[] = [
                            "Softmax Score for 'Class A'",
                            "Softmax Score for 'Class B'",
                            "Softmax Score for 'Class C'",
                            "Softmax Score for 'Class D'"
                        ];


                        const rectID = d3.select(this).attr("rectID");

                        const nthResult = result[node];
                        //data needed - pathMap(path inetraction), result and final for displayer

                        //path interaction
                        for (let i = 0; i < pathMap.length; i++) {
                            pathMap[i][rectID].style.opacity = "1";
                        }
                        //add math-displayer
              
                        const displayerPos: [number, number] = [prevFeatureCoord[0] + 275, prevFeatureCoord[1] - curveDir * 100];
                        //     drawPoints(".mats", "red", [displayerPos]);

                        drawSoftmaxDisplayerNodeClassifier(displayerPos, titles, Number(rectID), nthOutputVals, nthResult, myColor);
                    }
                });

            d3.select(".mats")
                .selectAll(`rect#resultRect${node}`)
                .style("pointer-events", "auto")
                .on("mouseout", function (event, d) {
                    if (pathMap != null) {
                        const rectID = d3.select(this).attr("rectID");
                        //path interaction
                        for (let i = 0; i < pathMap.length; i++) {
                            pathMap[i][rectID].style.opacity = "0";
                        }
                        //remove the math displayer
                        d3.selectAll(".math-displayer").remove();
                    }
                });

        }

    });
    return null;
}


export function visualizeLinkClassifierFeatures(
    locations: any,
    features: any,
    myColor: any,
    conv1: any,
    conv2: any,
    probResult: number,
    graph: any,
    adjList: any,
    maxVals: any,
    featureKeys: number[],
    featureKeysEachLayer: number[][],
    mergedNodes: number[],
    innerComputationMode: string = "GCN"
    // trainingNodes: number[]
) {
    //--------------------------------DATA PREP MANAGEMENT--------------------------------
    let intervalID: any = null; // to manage animation controls

    let poolingVis = null; //to manage pooling visualizer
    let outputVis = null; //to manage model output
    let resultVis: any = null; //tp manage result visualizer
    //load weights and bias
    let dataPackage = loadLinkWeights();

    const weights = dataPackage["weights"];
    const bias = dataPackage["bias"];

    //table that manage all feature visualizers for GCNConv
    let featureVisTable: SVGElement[][] = [[], [], [], [], []];
    //control detail view
    let dview = false;
    //control lock and unlock
    let lock = false;
    //a data structure to store all feature vis frames information
    interface FrameDS {
        features: any[];
        GCNConv1: any[];
        GCNConv2: any[];
        GCNConv3: any[];
        results: any[];
    }
    var frames: FrameDS = {
        features: [],
        GCNConv1: [],
        GCNConv2: [],
        GCNConv3: [],
        results: []
    };
    var schemeLocations: any = [];

    //--------------------------------DRAW FRAMES--------------------------------
    let gridSize = 800;
    const framePackage = drawMatrixPreparation(graph, locations, gridSize, -25);
    let colFrames: SVGElement[] = framePackage.colFrames; //a
    let matFrames: SVGElement[] = framePackage.matFrames; //a

    //-----------------------------------FIRST LAYER-----------------------------------------------
    const firstLayerPackage = drawNodeFeatures(
        locations,
        graph,
        myColor,
        features,
        frames,
        schemeLocations,
        featureVisTable,
        features[0].length,
        2.5,
        15,
        150,
        false
    );
    //updated variables
    locations = firstLayerPackage.locations;
    frames = firstLayerPackage.frames;
    schemeLocations = firstLayerPackage.schemeLocations;
    featureVisTable = firstLayerPackage.featureVisTable;
    const firstLayer = firstLayerPackage.firstLayer;

    //drawPoints(".mats", "red", locations);

    //draw paths
    const pathsForFisrtLayer = drawCrossConnectionForSubgraph(graph, locations, 2.5*128, 100, 0, featureKeys, featureKeys, featureKeysEachLayer[1]);

    console.log("paths for first layer", pathsForFisrtLayer);

    //-----------------------------------GCNConv LAYERS-----------------------------------------------
    const featureChannels = conv1[0].length;
    
    // we need have the locations and indices of the nodes involved during the computation

    const GCNConvPackage = drawGCNConvLinkModel(
        conv1,
        conv2,
        probResult, 
        locations,
        myColor,
        frames,
        schemeLocations,
        featureVisTable,
        graph,
        firstLayer,
        maxVals,
        featureChannels,
        featureKeys,
        featureKeysEachLayer,
        innerComputationMode
    );
    locations = GCNConvPackage.locations;
    frames = GCNConvPackage.frames;
    schemeLocations = GCNConvPackage.schemeLocations;
    featureVisTable = GCNConvPackage.featureVisTable;
    maxVals = GCNConvPackage.maxVals;
    let paths = GCNConvPackage.paths;
    let locationsForLastLayer = GCNConvPackage.locationsForLastLayer;

    console.log("frames", frames);

    //-----------------------------------INTERACTIONS EVENTS MANAGEMENT-----------------------------------------------

    let recordLayerID: number = -1;
    // a state to controls the recover event
    let transState = "GCNConv";
    //save events for poolingVis
    let poolingOverEvent: any = null;
    let poolingOutEvent: any = null;

    //added interactions
    //add mouse event
    d3.selectAll(".oFeature").on("mouseover", function (event, d) {
        //if not in the state of lock
        if (!lock) {
            const layerID = d3.select(this).attr("layerID");
            const node = d3.select(this).attr("node");
            const pack = oFeatureMouseOver(layerID, node, frames, matFrames);
            //update variables
            frames = pack.frames;
            matFrames = pack.matFrames;
        }
    });
    d3.selectAll(".oFeature").on("mouseout", function (event, d) {
        const layerID = d3.select(this).attr("layerID");
        const node = d3.select(this).attr("node");
        const pack = oFeatureMouseOut(layerID, node, frames, matFrames);
        //update variables
        frames = pack.frames;
        matFrames = pack.matFrames;
    });

    d3.selectAll(".featureVis").on("mouseover", function (event, d) {
        //if not in the state of lock
        if (!lock) {
            //paths interactions
            const layerID = Number(d3.select(this).attr("layerID")) - 1;
            const node = Number(d3.select(this).attr("node"));
            const featureOverPack = featureVisMouseOver(
                layerID,
                node,
                paths,
                frames,
                adjList,
                matFrames,
                colFrames,
                featureChannels
            );
            paths = featureOverPack.paths;
            frames = featureOverPack.frames;
            matFrames = featureOverPack.matFrames;
            colFrames = featureOverPack.colFrames;
        }
    });
    d3.selectAll(".featureVis").on("mouseout", function (event, d) {
        if (!lock) {
            const layerID = Number(d3.select(this).attr("layerID")) - 1;
            const node = Number(d3.select(this).attr("node"));
            const featureOverPack = featureVisMouseOut(
                layerID,
                node,
                paths,
                frames,
                adjList,
                matFrames,
                colFrames
            );
            paths = featureOverPack.paths;
            frames = featureOverPack.frames;
            matFrames = featureOverPack.matFrames;
            colFrames = featureOverPack.colFrames;
        }
    });
    d3.selectAll(".mats, .switchBtn").on("click", function (event, d) {
        const isInGroup = event.target.classList.contains('procVis') || event.target.classList.contains('to-be-removed') || event.target.classList.contains('weightUnit')
        if (event.target && event.target.id === "btn" || isInGroup) {
            return;
        }
        if (lock) {
            d3.selectAll(".resultVis")
                .style("pointer-events", "auto")
                .style("opacity", 1);
            const recoverPackage = detailedViewRecovery(
                event,
                dview,
                lock,
                transState,
                recordLayerID,
                poolingOutEvent,
                poolingOverEvent,
                poolingVis,
                featureChannels,
                90,
                [],
                true
            );
            //update variables
            dview = recoverPackage.dview;
            lock = recoverPackage.lock;
            transState = recoverPackage.transState;
            recordLayerID = recoverPackage.recordLayerID;
            poolingOutEvent = recoverPackage.poolingOutEvent;
            poolingOverEvent = recoverPackage.poolingOverEvent;

            clearInterval(intervalID);
        }
    });

    function setIntervalID(id: any) {
        intervalID = id;

    }

    d3.selectAll(".featureVis").on("click", function (event, d) {
        if (lock != true) {
            //state
            transState = "GCNConv";
            lock = true;
            event.stopPropagation();
            dview = true;

            //lock all feature visualizers and transparent paths
            d3.selectAll(".resultVis")
                .style("pointer-events", "none")
                .style("opacity", 0.2);
            d3.selectAll(".oFeature")
                .style("pointer-events", "none")
                .style("opacity", 0.2);
            d3.select(".pooling")
                .style("pointer-events", "none")
                .style("opacity", 0.2);
            d3.selectAll(".twoLayer")
                .style("pointer-events", "none")
                .style("opacity", 0.2);
            d3.selectAll(".crossConnection").style("opacity", 0);
            //transparent other feature visualizers
            d3.selectAll(".featureVis").style("opacity", 0.2);
            d3.selectAll(".oFeature").style("opacity", 0.2);
            d3.selectAll(".legend").style("opacity", 0.25);
            d3.selectAll(".binary-legend").style("opacity", 0.25);
            //translate each layer
            const layerID = Number(d3.select(this).attr("layerID")) - 1;
            const node = Number(d3.select(this).attr("node"));
            if(innerComputationMode == "GCN"){
                const featureVisPack = featureVisClick(
                    layerID,
                    node,
                    recordLayerID,
                    adjList,
                    featureVisTable,
                    features,
                    conv1,
                    conv2,
                    bias,
                    myColor,
                    weights,
                    lock,
                    setIntervalID,
                    featureChannels,
                    15,
                    5,
                    90,
                    128,
                    2.5,
                );
                // update variables
                recordLayerID = featureVisPack.recordLayerID;
                featureVisTable = featureVisPack.featureVisTable;
                features = featureVisPack.features;
                intervalID = featureVisPack.getIntervalID();
            } else if(innerComputationMode == "GAT"){
                const featureVisPack = featureGATClick(
                    layerID,
                    node,
                    recordLayerID,
                    adjList,
                    featureVisTable,
                    features,
                    conv1,
                    conv2,
                    bias,
                    myColor,
                    weights,
                    lock,
                    setIntervalID,
                    featureChannels,
                    15,
                    5,
                    90,
                    128,
                    2.5,
                    featureKeysEachLayer,
                    mergedNodes
                );
                // update variables
                recordLayerID = featureVisPack.recordLayerID;
                featureVisTable = featureVisPack.featureVisTable;
                features = featureVisPack.features;
                intervalID = featureVisPack.getIntervalID();
                
            } else if(innerComputationMode == "GraphSAGE"){
                const featureVisPack = featureSAGEClick(
                    layerID,
                    node,
                    recordLayerID,
                    adjList,
                    featureVisTable,
                    features,
                    conv1,
                    conv2,
                    bias,
                    myColor,
                    weights,
                    lock,
                    setIntervalID,
                    featureChannels,
                    15,
                    5,
                    90,
                    128,
                    2.5,
                    featureKeysEachLayer
                );
                // update variables
                recordLayerID = featureVisPack.recordLayerID;
                featureVisTable = featureVisPack.featureVisTable;
                features = featureVisPack.features;
                intervalID = featureVisPack.getIntervalID();
            }
            

            //path connect - connect intermediate feature vis to current feature vis


        }
    });


    //result visualizer interactions
    d3.selectAll(".resultVis").on("mouseover", function (event) {
        if(!lock){
            d3.selectAll(".pathsToResult").style("opacity", 1);
            d3.select(".resultFrame").style("opacity", 1);
            d3.selectAll(".frame[layerID='2']").style("opacity", 1);
        }
    });
    d3.selectAll(".resultVis").on("mouseout", function (event) {
        if(!lock){
            d3.selectAll(".pathsToResult").style("opacity", 0.05);
            d3.select(".resultFrame").style("opacity", 0.25);
            d3.selectAll(".frame[layerID='2']").style("opacity", 0.25);
        }
    });
    d3.selectAll(".resultVis").on("click", function (event) {
        console.log("click result visualizer!");
        if (lock != true) {
            //state
            transState = "linkResult";
            lock = true;
            event.stopPropagation();
            dview = true;

            //lock all feature visualizers and transparent paths
            d3.selectAll(".resultVis")
                .style("pointer-events", "none");
            d3.selectAll(".oFeature")
                .style("pointer-events", "none")
                .style("opacity", 0.2);
            d3.select(".pooling")
                .style("pointer-events", "none")
                .style("opacity", 0.2);
            d3.selectAll(".twoLayer")
                .style("pointer-events", "none")
                .style("opacity", 0.2);
            d3.selectAll(".crossConnection").style("opacity", 0);
            d3.selectAll(".pathsToResult").attr("opacity", 0);

            d3.selectAll(".legend").style("opacity", 0.25);
            d3.selectAll(".binary-legend").style("opacity", 0.25);

            console.log("selection check", d3.selectAll(".pathsToResult"));

            d3.selectAll(".frame[layerID='2']").style("opacity", 1);

            //transparent other feature visualizers
            d3.selectAll(".featureVis").style("opacity", 0.2);
            d3.selectAll(".oFeature").style("opacity", 0.2);
            //translate each layer
            const layerID = Number(d3.select(this).attr("layerID")) - 1;
            const node = Number(d3.select(this).attr("node"));
            translateLayers(2, 250);


            //recover necesary components
            d3.selectAll("#layerNum_2").style("opacity", 1);
            d3.selectAll(".featureVis[layerID='2']").style("opacity", 1);

            //visualize the inner computation process
            
            //compute locationing
            // let prevFeatureCoord:any = [];

            const location1: [number, number] = locationsForLastLayer[0];
            const location2: [number, number] = locationsForLastLayer[1];

            const midY = (location1[1] + location2[1])/2;
            const featureX = location1[0] + 64 * 5 + 100;
            const midYForFeature = midY + 15;

            const startingPoint1:[number, number] = [location1[0]+64*5, location1[1]+15/2];
            const startingPoint2:[number, number] = [location2[0]+64*5, location2[1]+15/2];
            const endingPoint:[number, number] = [featureX, midYForFeature];

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
                .attr("opacity", 1)
                .attr("fill", "none")
                .attr("layerID", 3)
                .attr("class", "procVis");

            d3.select(".mats")
                .append("path")
                .attr(
                    "d",
                    curve([startingPoint2, hpoint2, lpoint2, endingPoint])
                )
                .attr("stroke", "black")
                .attr("opacity", 1)
                .attr("fill", "none")
                .attr("layerID", 3)
                .attr("class", "procVis");

            const g = d3.select(".mats").append("g");

            const g1 = d3.select(".mats").append("g").attr("class", "dotProduct");

            injectSVG(g1, endingPoint[0], endingPoint[1]-12, "./assets/SVGs/matmul.svg", "procVis");
            
            let resultVisPos = deepClone(endingPoint);
            resultVisPos[0] += 150;
            
            // drawPoints(".mats", "red", [resultVisPos]);

            
            g.append("line")
                .attr("x1", endingPoint[0])
                .attr("y1", endingPoint[1])
                .attr("x2", resultVisPos[0])
                .attr("y2", resultVisPos[1])
                .attr("stroke", "black")
                .attr("stroke-width", 1)
                .attr("class", "procVis");

            //TODO: add data fetching for dot product result
            const hubNodeA = featureKeysEachLayer[2][0];
            const hubNodeB = featureKeysEachLayer[2][1];

            const featureInvolvedCOmputingA = Array.prototype.slice.call(conv2[hubNodeA]);
            const featureInvolvedCOmputingB = Array.prototype.slice.call(conv2[hubNodeB]);

            console.log("result vis comp", hubNodeA, hubNodeB, featureInvolvedCOmputingA, featureInvolvedCOmputingB);
            
            const math = create(all, {});
            const resultVal = math.dot(featureInvolvedCOmputingA, featureInvolvedCOmputingB);

            g.append("rect")
                .attr("x", resultVisPos[0])
                .attr("y", resultVisPos[1]-7.5)
                .attr("width", 15)
                .attr("height", 15)
                .attr("fill", myColor(resultVal))
                .attr("stroke", "black")
                .attr("class", "dotResult procVis");

            g.append("line")
                .attr("x1", resultVisPos[0]+15)
                .attr("y1", resultVisPos[1])
                .attr("x2", resultVisPos[0]+100)
                .attr("y2", resultVisPos[1])
                .attr("stroke", myColor(resultVal))
                .attr("stroke-width", 1)
                .attr("class", "procVis")
                .lower();

            const sigmoidTextPos = [
                resultVisPos[0]+50,
                resultVisPos[1]+25
            ];

            const iconX = resultVisPos[0]+100;
            const iconY = resultVisPos[1]+5;

            drawFunctionIcon([iconX, iconY], "./assets/SVGs/sigmoid.svg", "", "Sigmoid", "./assets/SVGs/sigmoid_formula.svg", "Range: [0, 1]");


            g.append("text")
                .attr("x", sigmoidTextPos[0])
                .attr("y", sigmoidTextPos[1])
                .attr("fill", "gray")
                .attr("class", "procVis sigmoid")
                .text("Sigmoid")
                .style("font-size", "12px");

            //for testing

            

            d3.select(".mats")
                .selectAll(".dotProduct")
                .on("mouseover", function (event) {
                    const SCALE = 1.5;

                    const [x, y] = d3.pointer(event);
                    const displayW = 250 * SCALE;
                    const displayH = 100 * SCALE;
                    const displayX = x + 10 * SCALE;
                    const displayY = y - 10 * SCALE;

                    d3.select(".mats")
                    .append("rect")
                    .attr("x", displayX)
                    .attr("y", displayY)
                    .attr("width", displayW)
                    .attr("height", displayH)
                    .attr("rx", 10 * SCALE)
                    .attr("ry", 10 * SCALE)
                    .style("fill", "white")
                    .style("stroke", "black")
                    .style("stroke-width", 2 * SCALE)
                    .attr("class", "math-displayer procVis")
                    .raise();

                    d3.select(".mats")
                    .append("text")
                    .attr("x", displayX + 75 * SCALE)
                    .attr("y", displayY + 20 * SCALE)
                    .text("Dot Product")
                    .style("font-size", `${18 * SCALE}px`)
                    .attr("class", "math-displayer procVis")
                    .raise();

                    d3.select(".mats")
                    .append("text")
                    .attr("x", displayX + 15 * SCALE)
                    .attr("y", displayY + 60 * SCALE)
                    .attr("xml:space", "preserve")
                    .text("dot(            ,                )   =   ")
                    .style("font-size", `${16 * SCALE}px`)
                    .attr("class", "math-displayer procVis");

                    d3.select(".mats")
                    .append("rect")
                    .attr("x", displayX + (15 + 235 - 45) * SCALE)
                    .attr("y", displayY + 37.5 * SCALE)
                    .attr("width", 28 * SCALE)
                    .attr("height", 28 * SCALE)
                    .attr("fill", myColor(resultVal))
                    .attr("class", "math-displayer procVis")

                    d3.select(".mats")
                    .append("text")
                    .attr("x", displayX + (15 + 235 - 45) * SCALE + 5.5 * SCALE)
                    .attr("y", displayY + 37.5 * SCALE + 20 * SCALE)
                    .text(resultVal.toFixed(2))
                    .style("font-size", `${11 * SCALE}px`)
                    .attr("class", "math-displayer procVis")
                    .attr("fill", resultVal > 0.5 ? "white" : "black")
                    .raise();

                    const h = (50 / 64) * SCALE;
                    const feature1Pos = [displayX + 60 * SCALE, displayY + 30 * SCALE];

                    for (let i = 0; i < featureInvolvedCOmputingA.length; i++) {
                    d3.select(".mats")
                        .append("rect")
                        .attr("x", feature1Pos[0] + 7.5 * SCALE)
                        .attr("y", feature1Pos[1] + i * h)
                        .attr("width", 7.5 * SCALE)
                        .attr("height", h)
                        .attr("fill", myColor(featureInvolvedCOmputingA[i]))
                        .attr("class", "math-displayer procVis")
                        .raise();
                    }

                    const feature2Pos = [displayX + 115 * SCALE, displayY + 45 * SCALE];

                    for (let i = 0; i < featureInvolvedCOmputingB.length; i++) {
                    d3.select(".mats")
                        .append("rect")
                        .attr("x", feature2Pos[0] + i * h)
                        .attr("y", feature2Pos[1] + 7.5 * SCALE)
                        .attr("width", h)
                        .attr("height", 7.5 * SCALE)
                        .attr("fill", myColor(featureInvolvedCOmputingB[i]))
                        .attr("class", "math-displayer procVis")
                        .raise();
                    }
                });

            d3.select(".mats")
            .selectAll(".dotProduct")
            .on("mouseout", function () {
                d3.selectAll(".math-displayer").remove();
            });


        }
    });
}


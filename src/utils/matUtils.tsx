import { calculatePrevFeatureVisPos, loadLinkWeights, loadNodeWeights, loadWeights, translateLayers } from "./matHelperUtils";
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
    resultVisMouseEvent
} from "./matEventsUtils";
import { drawPoints } from "./utils";
import { AnimationController, computeMatrixLocations, drawAniPath, drawBiasPath, drawBiasVector, drawPathBtwOuputResult, drawPathInteractiveComponents, drawWeightMatrix, drawWeightsVector } from "./matAnimateUtils";
import { injectPlayButtonSVG, injectSVG } from "./svgUtils";
import { roundToTwo } from "../components/WebUtils";
import { drawMatmulExplanation, drawSoftmaxDisplayerNodeClassifier } from "./matInteractionUtils";
import { create, all } from "mathjs";

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
    maxVals: any
) {
    //--------------------------------DATA PREP MANAGEMENT--------------------------------
    let intervalID: any = null; // to manage animation controls

    let poolingVis = null; //to manage pooling visualizer
    let outputVis = null; //to manage model output
    let resultVis: any = null; //tp manage result visualizer
    //load weights and bias
    const dataPackage = loadWeights();

    const weights = dataPackage["weights"];
    const bias = dataPackage["bias"];

    //table that manage all feature visualizers for GCNConv
    let featureVisTable: SVGElement[][] = [[], [], [], []];
    //table that manage color schemes
    let colorSchemesTable: SVGElement[] = [];
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
        7,
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

    //-----------------------------------GCNConv LAYERS-----------------------------------------------
    const featureChannels = 64;

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
        colorSchemesTable,
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
    colorSchemesTable = GCNConvPackage.colorSchemesTable;
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

        if (event.target && event.target.id === "btn") {
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
                colorSchemesTable,
                featureChannels,
                100,
                []
            );
            //update variables
            dview = recoverPackage.dview;
            lock = recoverPackage.lock;
            transState = recoverPackage.transState;
            recordLayerID = recoverPackage.recordLayerID;
            poolingOutEvent = recoverPackage.poolingOutEvent;
            poolingOverEvent = recoverPackage.poolingOverEvent;
            colorSchemesTable = recoverPackage.colorSchemesTable;

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
                colorSchemesTable,
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
            colorSchemesTable = featureVisPack.colorSchemesTable;
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
                        colorSchemesTable,
                        one,
                        final,
                        myColor,
                        featureChannels,
                        pooling
                    );
                    //update variables
                    resultVis = outputVisPack.resultVis;
                    colorSchemesTable = outputVisPack.colorSchemesTable;
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
    trainingNodes: number[]
) {
    //--------------------------------DATA PREP MANAGEMENT--------------------------------
    let intervalID: any = null; // to manage animation controls

    let poolingVis = null; //to manage pooling visualizer
    let outputVis = null; //to manage model output
    let resultVis: any = null; //tp manage result visualizer
    //load weights and bias
    const dataPackage = loadNodeWeights();

    const weights = dataPackage["weights"];
    const bias = dataPackage["bias"];

    //table that manage all feature visualizers for GCNConv
    let featureVisTable: SVGElement[][] = [[], [], [], [], []];
    //table that manage color schemes
    let colorSchemesTable: SVGElement[] = [];
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
    const framePackage = drawMatrixPreparation(graph, locations, 800);
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
        34,
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
    const featureChannels = 4;

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
        colorSchemesTable,
        final,
        firstLayer,
        maxVals,
        featureChannels,
        trainingNodes
    );
    locations = GCNConvPackage.locations;
    frames = GCNConvPackage.frames;
    schemeLocations = GCNConvPackage.schemeLocations;
    featureVisTable = GCNConvPackage.featureVisTable;
    colorSchemesTable = GCNConvPackage.colorSchemesTable;
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
        if (event.target && event.target.id === "btn") {
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
                colorSchemesTable,
                featureChannels,
                90,
                resultLabelsList
            );
            //update variables
            dview = recoverPackage.dview;
            lock = recoverPackage.lock;
            transState = recoverPackage.transState;
            recordLayerID = recoverPackage.recordLayerID;
            poolingOutEvent = recoverPackage.poolingOutEvent;
            poolingOverEvent = recoverPackage.poolingOverEvent;
            colorSchemesTable = recoverPackage.colorSchemesTable;

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
            const featureVisPack = featureVisClick(
                layerID,
                node,
                recordLayerID,
                colorSchemesTable,
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
                10,
                90,
                34,
                5,
                "tanh"
            );
            // update variables
            recordLayerID = featureVisPack.recordLayerID;
            colorSchemesTable = featureVisPack.colorSchemesTable;
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
            translateLayers(3, 250);


            //choose the right color schemes to display
            colorSchemesTable[layerID].style.opacity = "1";
            colorSchemesTable[layerID + 1].style.opacity = "1";

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
            if (node < 17) curveDir = -1;

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
            let startPathCoords: number[][] = [
                [prevFeatureCoord[0] - 5, prevFeatureCoord[1] - curveDir * 7.5],
                [prevFeatureCoord[0] - 15, prevFeatureCoord[1] - curveDir * 7.5]
            ]; //compute the starting positions of the paths animation
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
            const modelParams = loadNodeWeights();
            const linBias = modelParams["bias"][3]; //bias vector
            const matMulWeights = modelParams["weights"][3]; // weights for matrix multiplication
            const nthOutputVals = final[node];

            //the vector after matrix multiplication - before adding the bias
            const math = create(all, {});
            const prevCon3Val: number[] = [conv3[node][0], conv3[node][1]];
            const vectorAfterMul = math.multiply(prevCon3Val, math.transpose(matMulWeights));


            //visualization <- replace this by animation sequence
            const g = d3.select(".mats");
            const rArray = computeMids(endBiasCoord, endBiasPathCoord);
            const res10: any = rArray[0];
            const res11: any = rArray[1];

            //draw softmax
            let clockwise = 0;
            if (node < 17) clockwise = 1;

            //smart ui detections & transparent

            //transparent prevLayer(featureVisTable[3]) && curLayer(featureVisTable[4])
            if (node < 17) {
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

            const g1 = d3.select(".mats").append("g").attr("class", "procVis");

            let pathMap: any = null;


            const wMat = math.transpose(modelParams.weights[3]);

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
                            featureChannels, prevCon3Val, "procVis wRect");
                        drawPathBtwOuputResult([vectorAfterMatMulPath], finalOutputCoord);
                    }, delay: aniSec
                },
                { func: () => { drawBiasVector(g, 4, 15, 10, biasCoord, myColor, linBias, 4); }, delay: aniSec },
                { func: () => { drawBiasPath(endBiasCoord, res10, res11, endBiasPathCoord, 4, 4); }, delay: aniSec },
                { func: () => { drawPathBtwOuputResult([endOutputCoord], startResultCoord); }, delay: aniSec },
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
                                d3.selectAll("#tempath").remove();
                                d3.selectAll(".matmul-displayer").remove();
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
                injectSVG(gLabel, btnX - 120 - 64, btnY - 120 - 64, "./assets/SVGs/interactionHint.svg", "procVis");
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
                    d3.selectAll("#tempath").remove();
                    d3.selectAll(".matmul-displayer").remove();
                    btn.selectAll("*").remove();
                    injectPlayButtonSVG(
                        btn,
                        btnX,
                        btnY,
                        "./assets/SVGs/playBtn_pause.svg"
                    );
                    if (currentStep >= 4) {
                        d3.selectAll("#tempath").remove();
                        d3.selectAll(".matmul-displayer").remove();
                        d3.select(".mats").selectAll(".removeRect").remove();
                        d3.select(".mats").selectAll(".pauseRemove").remove();
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
                        let displayerPos = [prevFeatureCoord[0] + 275, prevFeatureCoord[1] - curveDir * 100];
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
                            pathMap[i][rectID].style.opacity = "0.1";
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
    // probAdj: any,
    graph: any,
    // adjList: any,
    maxVals: any,
    featureKeys: number[],
    featureKeysEachLayer: number[][]
    // trainingNodes: number[]
) {
    //--------------------------------DATA PREP MANAGEMENT--------------------------------
    let intervalID: any = null; // to manage animation controls

    let poolingVis = null; //to manage pooling visualizer
    let outputVis = null; //to manage model output
    let resultVis: any = null; //tp manage result visualizer
    //load weights and bias
    const dataPackage = loadLinkWeights();

    const weights = dataPackage["weights"];
    const bias = dataPackage["bias"];

    //table that manage all feature visualizers for GCNConv
    let featureVisTable: SVGElement[][] = [[], [], [], [], []];
    //table that manage color schemes
    let colorSchemesTable: SVGElement[] = [];
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
    const framePackage = drawMatrixPreparation(graph, locations, 600);
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
        128,
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
    const featureChannels = 64;
    
    // we need have the locations and indices of the nodes involved during the computation

    const GCNConvPackage = drawGCNConvLinkModel(
        conv1,
        conv2,
        locations,
        myColor,
        frames,
        schemeLocations,
        featureVisTable,
        graph,
        colorSchemesTable,
        firstLayer,
        maxVals,
        featureChannels,
        featureKeys,
        featureKeysEachLayer
    );
    // locations = GCNConvPackage.locations;
    // frames = GCNConvPackage.frames;
    // schemeLocations = GCNConvPackage.schemeLocations;
    // featureVisTable = GCNConvPackage.featureVisTable;
    // colorSchemesTable = GCNConvPackage.colorSchemesTable;
    // maxVals = GCNConvPackage.maxVals;
    // let resultLabelsList = GCNConvPackage.resultLabelsList;
    // let paths = GCNConvPackage.paths;
    // let resultPaths = GCNConvPackage.resultPaths;

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

    // d3.selectAll(".featureVis").on("mouseover", function (event, d) {
    //     //if not in the state of lock
    //     if (!lock) {
    //         //paths interactions
    //         const layerID = Number(d3.select(this).attr("layerID")) - 1;
    //         const node = Number(d3.select(this).attr("node"));
    //         const featureOverPack = featureVisMouseOver(
    //             layerID,
    //             node,
    //             paths,
    //             frames,
    //             adjList,
    //             matFrames,
    //             colFrames,
    //             featureChannels
    //         );
    //         paths = featureOverPack.paths;
    //         frames = featureOverPack.frames;
    //         matFrames = featureOverPack.matFrames;
    //         colFrames = featureOverPack.colFrames;
    //     }
    // });
    // d3.selectAll(".featureVis").on("mouseout", function (event, d) {
    //     if (!lock) {
    //         const layerID = Number(d3.select(this).attr("layerID")) - 1;
    //         const node = Number(d3.select(this).attr("node"));
    //         const featureOverPack = featureVisMouseOut(
    //             layerID,
    //             node,
    //             paths,
    //             frames,
    //             adjList,
    //             matFrames,
    //             colFrames
    //         );
    //         paths = featureOverPack.paths;
    //         frames = featureOverPack.frames;
    //         matFrames = featureOverPack.matFrames;
    //         colFrames = featureOverPack.colFrames;
    //     }
    // });
}


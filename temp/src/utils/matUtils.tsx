import { calculatePrevFeatureVisPos, loadNodeWeights, loadWeights, translateLayers } from "./matHelperUtils";
import {
    drawMatrixPreparation,
    drawNodeFeatures,
    drawGCNConvGraphModel,
    drawGCNConvNodeModel,
    computeMids,
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
import { AnimationController, drawAniPath, drawBiasPath, drawBiasVector, drawPathBtwOuputResult, drawPathInteractiveComponents } from "./matAnimateUtils";
import { injectPlayButtonSVG } from "./svgUtils";
import { roundToTwo } from "@/pages/WebUtils";

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
    console.log("weights, data", dataPackage);
    const weights = dataPackage["weights"];
    const bias = dataPackage["bias"];
    console.log("weights, data", weights, bias);
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
    console.log("Received", maxVals);
    console.log("adjList", adjList);

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
    d3.select(".mats").on("click", function (event, d) {
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
                100
            );
            //update variables
            dview = recoverPackage.dview;
            lock = recoverPackage.lock;
            transState = recoverPackage.transState;
            recordLayerID = recoverPackage.recordLayerID;
            poolingOutEvent = recoverPackage.poolingOutEvent;
            poolingOverEvent = recoverPackage.poolingOverEvent;
            colorSchemesTable = recoverPackage.colorSchemesTable;
            console.log("interval .mats", intervalID);
            clearInterval(intervalID);
        }
    });

    function setIntervalID(id: any) {
        intervalID = id;
        console.log("Interval ID set to:", intervalID);
    }

    function getIntervalID(){
        console.log("get interval ID from vGCF", intervalID);
        return intervalID;
    }


    d3.selectAll(".featureVis").on("click", function (event, d) {
        if (lock != true) {
            //state
            transState = "GCNConv";
            lock = true;
            event.stopPropagation();
            dview = true;
            console.log("click! - fVis", dview, lock);
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
            console.log("interval", intervalID);
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
                    console.log("click! - fVis", dview, lock);
                    //lock all feature visualizers and transparent paths
                    const outputVisPack = outputVisClick(
                        resultVis,
                        colorSchemesTable,
                        one,
                        final,
                        myColor,
                        featureChannels
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
    maxVals: any
) {
    //--------------------------------DATA PREP MANAGEMENT--------------------------------
    let intervalID: any = null; // to manage animation controls

    let poolingVis = null; //to manage pooling visualizer
    let outputVis = null; //to manage model output
    let resultVis: any = null; //tp manage result visualizer
    //load weights and bias
    const dataPackage = loadNodeWeights();
    console.log("weights, data", dataPackage);
    const weights = dataPackage["weights"];
    const bias = dataPackage["bias"];
    console.log("weights, data", weights, bias);
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
    console.log("Received", maxVals);
    console.log("adjList", adjList);

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
        featureChannels
    );
    locations = GCNConvPackage.locations;
    frames = GCNConvPackage.frames;
    schemeLocations = GCNConvPackage.schemeLocations;
    featureVisTable = GCNConvPackage.featureVisTable;
    colorSchemesTable = GCNConvPackage.colorSchemesTable;
    maxVals = GCNConvPackage.maxVals;
    let paths = GCNConvPackage.paths;
    let resultPaths = GCNConvPackage.resultPaths;

    console.log("resultPaths in nc", resultPaths)

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
            
        }
    });
    d3.selectAll(".resultVis").on("mouseout", function (event, d) {
        if (!lock) {
            //paths interactions
            const node = Number(d3.select(this).attr("node"));
            resultVisMouseEvent(node, resultPaths, frames, adjList, matFrames, colFrames, "0", "0.05")
            
        }
    });

    d3.select(".mats").on("click", function (event, d) {
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
                90
            );
            //update variables
            dview = recoverPackage.dview;
            lock = recoverPackage.lock;
            transState = recoverPackage.transState;
            recordLayerID = recoverPackage.recordLayerID;
            poolingOutEvent = recoverPackage.poolingOutEvent;
            poolingOverEvent = recoverPackage.poolingOverEvent;
            colorSchemesTable = recoverPackage.colorSchemesTable;
            console.log("interval .mats", intervalID);
            clearInterval(intervalID);
        }
    });

    function setIntervalID(id: any) {
        intervalID = id;
        console.log("Interval ID set to:", intervalID);
    }

    function getIntervalID(){
        console.log("get interval ID from vGCF", intervalID);
        return intervalID;
    }


    d3.selectAll(".featureVis").on("click", function (event, d) {
        if (lock != true) {
            //state
            transState = "GCNConv";
            lock = true;
            event.stopPropagation();
            dview = true;
            console.log("click! - fVis", dview, lock);
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
                5
            );
            // update variables
            recordLayerID = featureVisPack.recordLayerID;
            colorSchemesTable = featureVisPack.colorSchemesTable;
            featureVisTable = featureVisPack.featureVisTable;
            features = featureVisPack.features;
            intervalID = featureVisPack.getIntervalID();
            console.log("interval", intervalID);
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
            console.log("click! - fVis", dview, lock);
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

            //------------------the actual interaction codes part --------------------------------
            const layerID = 3;
            const node = Number(d3.select(this).attr("node"));
            setTimeout(() => {
                translateLayers(3, 150);
            }, 1750);

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
            
            featureVisTable[layerID][node].style.opacity = "1";
            let curNode = featureVisTable[layerID + 1][node];
            curNode.style.opacity = "0.25"; //display current node
            d3.select(curNode).selectAll(".frame").attr("opacity", 1);

            let prevFeatureCoord:any = calculatePrevFeatureVisPos(
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
            let outputCoord:[number, number] = [
                prevFeatureCoord[0] + 150,
                prevFeatureCoord[1] //may need adjust to top-left pos
            ];

            //end coordinate for model output <- the starting point for final path
            let endOutputCoord:[number, number] = [
                prevFeatureCoord[0] + 150 + 10*4,
                prevFeatureCoord[1] //may need adjust to top-left pos
            ];

            //start coordinate for result <- the ending point for final path
            let startResultCoord:[number, number] = [
                prevFeatureCoord[0] + 350,
                prevFeatureCoord[1] //may need adjust to top-left pos
            ];

            //do a curveDir test for the direction of arcs and bias vector
            let curveDir = 1;
            if(node < 17)curveDir = -1;

            //find the position for the bias vector <- we use this positio to compute the position for bias vector
            //coordinate for model output <- the position for model output feature visualizer
            let biasCoord:[number, number] = [
                prevFeatureCoord[0] + 50,
                prevFeatureCoord[1] + curveDir * 50 //may need adjust to top-left pos
            ];

            //find the ending position of bias vector <- we use this for bias path computing - ending point
            let endBiasPathCoord:[number, number] = [
                prevFeatureCoord[0] + 150,
                prevFeatureCoord[1] //may need adjust to top-left pos
            ];

            //find the ending position of bias vector <- we use this for bias path computing
            let endBiasCoord:[number, number] = [
                biasCoord[0] + 4*10,
                biasCoord[1]
            ];

            const yForPathAni = prevFeatureCoord[1]-curveDir*7.5;
            //following position computations will be based on the value of curveDir for dynamic adjustment
            //find the coordinates for arcs animation
            let startPathCoords:number[][] = [
                [prevFeatureCoord[0]-5, prevFeatureCoord[1]-curveDir*7.5],
                [prevFeatureCoord[0]-15, prevFeatureCoord[1]-curveDir*7.5]
            ]; //compute the starting positions of the paths animation
            let endPathCoords:number[][] = [
                [outputCoord[0]+5, yForPathAni],
                [outputCoord[0]+15, yForPathAni],
                [outputCoord[0]+25, yForPathAni],
                [outputCoord[0]+35, yForPathAni]
            ]; //compute the ending positions of the paths animation

            //find the coordination for softmax visualization
            const yForSoftmax = prevFeatureCoord[1]+curveDir*7.5;
            let softmaxStartCoords = [
                [outputCoord[0]+5, yForSoftmax],
                [outputCoord[0]+15, yForSoftmax],
                [outputCoord[0]+25, yForSoftmax],
                [outputCoord[0]+35, yForSoftmax]
            ]; //compute the starting positions of the softmax vis

            //find the positions for softmax ending position
            let softmaxEndCoords:number[][] = [
                [startResultCoord[0]+5, yForSoftmax],
                [startResultCoord[0]+15, yForSoftmax],
                [startResultCoord[0]+25, yForSoftmax],
                [startResultCoord[0]+35, yForSoftmax]
            ];

            //data preparation<- weights, final outputs, softmax values in paths
            const modelParams = loadNodeWeights();
            const linBias = modelParams["bias"][3]; //bias vector
            const matMulWeights = modelParams["weights"][3]; // weights for matrix multiplication
            const nthOutputVals = final[node];

            console.log("data fetching in the NC result layer",
                linBias,
                matMulWeights,
                nthOutputVals
            );
            //visualization <- replace this by animation sequence
            const g = d3.select(".mats");
            const rArray = computeMids(endBiasCoord, endBiasPathCoord);
            const res10:any = rArray[0];
            const res11:any = rArray[1];

            //draw softmax
            let clockwise = 0;
            if(node < 17)clockwise = 1;
            
            //animation
            //play button injection
            const btn = d3.select(".mats").append("g").attr("class", "ctrlBtn");
            const radius = 10;
            const btnX = biasCoord[0];
            const btnY = outputCoord[1] - 200*curveDir;

            let currentStep = 0;

            const initSec = 2000;
            const aniSec = 500;

            const g1 = d3.select(".mats").append("g").attr("class", "procVis");

            let pathMap: any = null;

            const animateSeqAfterPath = [
                {func:()=>{drawBiasVector(g, 4, 15, 10, biasCoord, myColor, linBias, 4);}, delay:aniSec},
                {func:()=>{drawBiasPath(endBiasCoord, res10, res11, endBiasPathCoord, 4, 4);}, delay:aniSec},
                {func:()=>{drawPathBtwOuputResult([endOutputCoord], startResultCoord);}, delay:aniSec},
                {func:()=>{
                    //display the result feature visualizer
                    featureVisTable[4][node].style.opacity = "1";
                }, delay:aniSec}
            ]

            const animateSeq = [
                {func:()=>{
                    intervalID = setInterval(() => {
                        const Xt = modelParams.weights[3];
                        const Xv = Xt[currentStep];
                        drawAniPath(Xt, currentStep, startPathCoords, endPathCoords, curveDir, myColor, 0, outputCoord, 15, 10, nthOutputVals, g1);
                        currentStep++;
                        console.log("i", currentStep);
                        if (currentStep >= 4) {
                            AnimationController.runAnimations(0, animateSeqAfterPath);
                            setTimeout(()=>{
                                pathMap = drawPathInteractiveComponents(softmaxStartCoords, softmaxEndCoords, nthOutputVals, myColor, clockwise);
                            }, 1500);
                            btn.selectAll("*").remove();
                            injectPlayButtonSVG(
                                btn,
                                btnX,
                                btnY,
                                "./assets/SVGs/playBtn_play.svg"
                            );
                            clearInterval(intervalID);
                        }
                    }, 250); 
                    d3.selectAll("path").lower();
                    d3.selectAll(".procVis").transition().duration(1000).attr("opacity", 1);
                    d3.selectAll("path").lower();
                }, delay:initSec+aniSec},
            ];
            AnimationController.runAnimations(0, animateSeq);

            // play button interaction add-ons
            let isPlaying = true;

            setTimeout(() => {
                injectPlayButtonSVG(
                    btn,
                    btnX,
                    btnY,
                    "./assets/SVGs/playBtn_pause.svg"
                );
            }, initSec + aniSec * 2);

            btn.on("click", function (event: any, d: any) {
                d3.select(".biasPath").remove();
                console.log("isPlaying", isPlaying);
                event.stopPropagation();
                if (intervalID) {
                    clearInterval(intervalID);
                }
                //replay controls
                if (!isPlaying || currentStep >= 4 || currentStep == 0) {
                    btn.selectAll("*").remove();
                    injectPlayButtonSVG(
                        btn,
                        btnX,
                        btnY,
                        "./assets/SVGs/playBtn_pause.svg"
                    );
                    if (currentStep >= 4) {
                        d3.select(".mats").selectAll(".removeRect").remove();
                        d3.select(".mats").selectAll(".pauseRemove").remove();
                        currentStep = 0; // 重置步骤
                        featureVisTable[4][node].style.opacity = "0.25";
                    }
                    animateSeq[0].delay = 1;
                    AnimationController.runAnimations(0, animateSeq);
                    setTimeout(()=>{
                        AnimationController.runAnimations(0, animateSeqAfterPath);
                    }, 1500);
                    setTimeout(()=>{
                        pathMap = drawPathInteractiveComponents(softmaxStartCoords, softmaxEndCoords, nthOutputVals, myColor, clockwise);
                    }, 3000);
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

            
            d3.select(".mats")
                .selectAll(`rect#resultRect${node}`)
                .style("pointer-events", "auto")
                .on("mouseover", function(event, d){
                    if(pathMap!=null){
                        const titles:string[] = [
                            "Softmax Score for 'Class A'",
                            "Softmax Score for 'Class B'",
                            "Softmax Score for 'Class C'",
                            "Softmax Score for 'Class D'"
                        ];


                        const rectID = d3.select(this).attr("rectID");
                        console.log("resultRect event", node, rectID);
                        const nthResult = result[node];
                        //data needed - pathMap(path inetraction), result and final for displayer
                        console.log("data fetching result rect", pathMap, nthResult, nthOutputVals, titles[Number(rectID)]);
                        //path interaction
                        for(let i=0; i<pathMap.length; i++){
                            pathMap[i][rectID].style.opacity = "1";
                        }
                        //add math-displayer
                        let displayerPos = [prevFeatureCoord[0]+275, prevFeatureCoord[1]-curveDir*100];
                   //     drawPoints(".mats", "red", [displayerPos]);

                        //set-up the paramtere for the math displayer
                        const displayW = 350;
                        const displayH = 75;
                        const displayX = displayerPos[0];
                        const displayY = displayerPos[1];

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
                            .raise();
                        //add contents into the math displayer
                        //add title
                        const titleYOffset = 10;
                        const titleXOffset = 50;
                        d3.select(".mats")
                            .append("text")
                            .attr("x", displayX + titleXOffset)
                            .attr("y", displayY + titleYOffset)
                            .text(titles[Number(rectID)])
                            .attr("class", "math-displayer")
                            .attr("font-size", titleYOffset)
                            .attr("fill", "black");
                        const eqXOffset = titleXOffset / 2;
                        const eqYOffset = titleYOffset * 2.5;
                        const unitSize = eqXOffset / 3 + 3;
                        const upperOffset = unitSize * 2;
                        d3.select(".mats")
                            .append("text")
                            .attr("x", displayX + eqXOffset + unitSize * 4 + upperOffset)
                            .attr("y", displayY + eqYOffset)
                            .text("exp(")
                            .attr("class", "math-displayer")
                            .attr("font-size", unitSize)
                            .attr("fill", "black");
                        d3.select(".mats")
                            .append("rect")
                            .attr("x", displayX + eqXOffset + unitSize * 6.5 + upperOffset)
                            .attr("y", displayY + eqYOffset - unitSize + 2)
                            .attr("width", unitSize)
                            .attr("height", unitSize)
                            .style("stroke", "black")
                            .attr("fill", myColor(nthOutputVals[Number(rectID)]))
                            .attr("class", "math-displayer")
                            .raise();
                        d3.select(".mats")
                            .append("text")
                            .attr("x", displayX + eqXOffset + unitSize * 6.5 + upperOffset)
                            .attr("y", displayY + eqYOffset - unitSize / 3)
                            .text(roundToTwo(nthOutputVals[Number(rectID)]))
                            .attr("class", "math-displayer")
                            .attr("font-size", unitSize / 2)
                            .attr("fill", "white");
                        d3.select(".mats")
                            .append("text")
                            .attr("x", displayX + eqXOffset + unitSize * 8 + upperOffset)
                            .attr("y", displayY + eqYOffset)
                            .text(")")
                            .attr("class", "math-displayer")
                            .attr("font-size", unitSize)
                            .attr("fill", "black");
                        //draw fraction line
                        const startFLPt: [number, number] = [
                            displayX + eqXOffset / 2,
                            displayY + eqYOffset + unitSize,
                        ];
                        const endFLPt: [number, number] = [
                            displayX + eqXOffset + unitSize * 10,
                            displayY + eqYOffset + unitSize,
                        ];
                        const endPathPt: [number, number] = [
                            displayX + eqXOffset + unitSize * 19,
                            displayY + eqYOffset + unitSize,
                        ];
                        const path1 = d3
                            .select(".mats")
                            .append("path")
                            .attr("d", d3.line()([startFLPt, endPathPt]))
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
                            .attr("fill", myColor(nthOutputVals[0]))
                            .attr("class", "math-displayer")
                            .raise();
                        d3.select(".mats")
                            .append("text")
                            .attr("x", displayX + eqXOffset + unitSize * 2.5)
                            .attr("y", displayY + eqYOffset * offsetMul - unitSize / 3)
                            .text(roundToTwo(nthOutputVals[0]))
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
                            .attr("fill", myColor(nthOutputVals[1]))
                            .attr("class", "math-displayer")
                            .raise();
                        d3.select(".mats")
                            .append("text")
                            .attr("x", displayX + eqXOffset + unitSize * 7.5)
                            .attr("y", displayY + eqYOffset * offsetMul - unitSize / 3)
                            .text(roundToTwo(nthOutputVals[1]))
                            .attr("class", "math-displayer")
                            .attr("font-size", unitSize / 2)
                            .attr("fill", "white");

                        d3.select(".mats")
                            .append("text")
                            .attr("x", displayX + eqXOffset + unitSize * 9)
                            .attr("y", displayY + eqYOffset * offsetMul)
                            .text(")+exp(")
                            .attr("class", "math-displayer")
                            .attr("font-size", unitSize)
                            .attr("fill", "black");
                        d3.select(".mats")
                            .append("rect")
                            .attr("x", displayX + eqXOffset + unitSize * 12.5)
                            .attr("y", displayY + eqYOffset * offsetMul - unitSize + 2)
                            .attr("width", unitSize)
                            .attr("height", unitSize)
                            .style("stroke", "black")
                            .attr("fill", myColor(nthOutputVals[2]))
                            .attr("class", "math-displayer")
                            .raise();
                        d3.select(".mats")
                            .append("text")
                            .attr("x", displayX + eqXOffset + unitSize * 12.5)
                            .attr("y", displayY + eqYOffset * offsetMul - unitSize / 3)
                            .text(roundToTwo(nthOutputVals[2]))
                            .attr("class", "math-displayer")
                            .attr("font-size", unitSize / 2)
                            .attr("fill", "white");
                        
                        d3.select(".mats")
                            .append("text")
                            .attr("x", displayX + eqXOffset + unitSize * 14)
                            .attr("y", displayY + eqYOffset * offsetMul)
                            .text(")+exp(")
                            .attr("class", "math-displayer")
                            .attr("font-size", unitSize)
                            .attr("fill", "black");
                        d3.select(".mats")
                            .append("rect")
                            .attr("x", displayX + eqXOffset + unitSize * 17.5)
                            .attr("y", displayY + eqYOffset * offsetMul - unitSize + 2)
                            .attr("width", unitSize)
                            .attr("height", unitSize)
                            .style("stroke", "black")
                            .attr("fill", myColor(nthOutputVals[3]))
                            .attr("class", "math-displayer")
                            .raise();
                        d3.select(".mats")
                            .append("text")
                            .attr("x", displayX + eqXOffset + unitSize * 17.5)
                            .attr("y", displayY + eqYOffset * offsetMul - unitSize / 3)
                            .text(roundToTwo(nthOutputVals[3]))
                            .attr("class", "math-displayer")
                            .attr("font-size", unitSize / 2)
                            .attr("fill", "white");
                        d3.select(".mats")
                            .append("text")
                            .attr("x", displayX + eqXOffset + unitSize * 19)
                            .attr("y", displayY + eqYOffset * offsetMul)
                            .text(")")
                            .attr("class", "math-displayer")
                            .attr("font-size", unitSize)
                            .attr("fill", "black");

                            //lower part finished
                            //eq sign and result
                            d3.select(".mats")
                                .append("text")
                                .attr("x", endFLPt[0] + unitSize * 11)
                                .attr("y", endFLPt[1])
                                .text("=")
                                .attr("class", "math-displayer")
                                .attr("font-size", unitSize)
                                .attr("fill", "black");
                            d3.select(".mats")
                                .append("rect")
                                .attr("x", endFLPt[0] + unitSize * 12)
                                .attr("y", endFLPt[1] - unitSize)
                                .attr("width", unitSize)
                                .attr("height", unitSize)
                                .style("stroke", "black")
                                .attr("fill", myColor(nthResult[Number(rectID)]))
                                .attr("class", "math-displayer")
                                .raise();
                            let textColor = "white";
                            if (Math.abs(nthResult[Number(rectID)]) < 0.5) {
                                textColor = "black";
                            }
                            d3.select(".mats")
                                .append("text")
                                .attr("x", endFLPt[0] + unitSize * 12)
                                .attr("y", endFLPt[1] - unitSize / 2)
                                .text(roundToTwo(nthResult[Number(rectID)]))
                                .attr("class", "math-displayer")
                                .attr("font-size", unitSize / 2)
                                .attr("fill", textColor);
                    }
                });
            
            d3.select(".mats")
                .selectAll(`rect#resultRect${node}`)
                .style("pointer-events", "auto")
                .on("mouseout", function(event, d){
                    if(pathMap!=null){
                        const rectID = d3.select(this).attr("rectID");
                        //path interaction
                        for(let i=0; i<pathMap.length; i++){
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





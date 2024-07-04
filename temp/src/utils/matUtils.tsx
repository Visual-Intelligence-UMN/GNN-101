import { calculatePrevFeatureVisPos, loadNodeWeights, loadWeights, translateLayers } from "./matHelperUtils";
import {
    drawMatrixPreparation,
    drawNodeFeatures,
    drawGCNConvGraphModel,
    drawGCNConvNodeModel,
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
            let outputCoord = [
                prevFeatureCoord[0] + 150,
                prevFeatureCoord[1] - 7.5 //may need adjust to top-left pos
            ];

            //end coordinate for model output <- the starting point for final path
            let endOutputCoord = [
                prevFeatureCoord[0] + 150 + 10*4,
                prevFeatureCoord[1] //may need adjust to top-left pos
            ];

            //start coordinate for result <- the ending point for final path
            let startResultCoord = [
                prevFeatureCoord[0] + 350,
                prevFeatureCoord[1] //may need adjust to top-left pos
            ];

            //do a curveDir test for the direction of arcs and bias vector
            let curveDir = 1;
            if(node < 17)curveDir = -1;

            //find the position for the bias vector <- we use this positio to compute the position for bias vector
            //coordinate for model output <- the position for model output feature visualizer
            let biasCoord = [
                prevFeatureCoord[0] + 50,
                prevFeatureCoord[1] - 7.5 + curveDir * 50 //may need adjust to top-left pos
            ];

            //find the ending position of bias vector <- we use this for bias path computing - ending point
            let endBiasPathCoord = [
                prevFeatureCoord[0] + 150,
                prevFeatureCoord[1] //may need adjust to top-left pos
            ];

            //find the ending position of bias vector <- we use this for bias path computing
            let endBiasCoord = [
                biasCoord[0] + 4*10,
                biasCoord[1] + 7.5
            ];

            const yForPathAni = prevFeatureCoord[1]-curveDir*7.5;
            //following position computations will be based on the value of curveDir for dynamic adjustment
            //find the coordinates for arcs animation
            let startPathCoords = [
                [prevFeatureCoord[0]-5, prevFeatureCoord[1]-curveDir*7.5],
                [prevFeatureCoord[0]-15, prevFeatureCoord[1]-curveDir*7.5]
            ]; //compute the starting positions of the paths animation
            let endPathCoords = [
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
            let softmaxEndCoords = [
                [startResultCoord[0]+5, yForSoftmax],
                [startResultCoord[0]+15, yForSoftmax],
                [startResultCoord[0]+25, yForSoftmax],
                [startResultCoord[0]+35, yForSoftmax]
            ];

            drawPoints(".mats", "red", [
                outputCoord, endOutputCoord, startResultCoord, 
                biasCoord, endBiasCoord, endBiasPathCoord,
                startPathCoords[0], startPathCoords[1],
                endPathCoords[0], endPathCoords[1], endPathCoords[2], endPathCoords[3],
                softmaxStartCoords[0], softmaxStartCoords[1], 
                softmaxStartCoords[2], softmaxStartCoords[3],
                softmaxEndCoords[0], softmaxEndCoords[1], 
                softmaxEndCoords[2], softmaxEndCoords[3]
            ]);

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
                
        }
    });



    


    return null;
}





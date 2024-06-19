import { loadWeights } from "./matHelperUtils"
import {
    drawMatrixPreparation,
    drawNodeFeatures,
    drawGCNConv
} from "./matFeaturesUtils"
import * as d3 from "d3";
import { 
    detailedViewRecovery, 
    featureVisClick, 
    featureVisMouseOut, 
    featureVisMouseOver, 
    oFeatureMouseOut, 
    oFeatureMouseOver, 
    outputVisClick, 
    poolingVisClick, 
} from "./matEventsUtils";

//features visualization pipeline: draw all feature visualizers for original features and GCNConv
export function visualizeFeatures(
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
    detailView: any,
    setDetailView: any
) {
    //--------------------------------DATA PREP MANAGEMENT--------------------------------
    let poolingVis = null; //to manage pooling visualizer
    let outputVis = null; //to manage model output
    let resultVis:any = null; //tp manage result visualizer
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
    var schemeLocations:any = [];
    console.log("state", detailView);
    console.log("Received", maxVals);
    console.log("adjList", adjList);

    //--------------------------------DRAW FRAMES--------------------------------
    const framePackage = drawMatrixPreparation(graph, locations);
    let colFrames: SVGElement[] = framePackage.colFrames; //a
    let matFrames: SVGElement[] = framePackage.matFrames; //a

    //-----------------------------------FIRST LAYER-----------------------------------------------
    const firstLayerPackage = drawNodeFeatures(locations, graph, myColor, features, frames, schemeLocations, featureVisTable);
    //updated variables
    locations = firstLayerPackage.locations;
    frames = firstLayerPackage.frames;
    schemeLocations = firstLayerPackage.schemeLocations;
    featureVisTable = firstLayerPackage.featureVisTable;
    const firstLayer = firstLayerPackage.firstLayer;
    
    
    //-----------------------------------GCNConv LAYERS-----------------------------------------------
    const GCNConvPackage = drawGCNConv(conv1, conv2, conv3, locations, myColor, frames, schemeLocations, featureVisTable, pooling, graph, colorSchemesTable, poolingVis, outputVis, final, firstLayer, maxVals);
    locations = GCNConvPackage.locations;
    frames = GCNConvPackage.frames;
    schemeLocations = GCNConvPackage.schemeLocations;
    featureVisTable = GCNConvPackage.featureVisTable;
    colorSchemesTable = GCNConvPackage.colorSchemesTable;
    poolingVis = GCNConvPackage.poolingVis;
    outputVis = GCNConvPackage.outputVis;
    resultVis = GCNConvPackage.resultVis;
    maxVals = GCNConvPackage.maxVals;
    let paths = GCNConvPackage.paths;
    let one = GCNConvPackage.one;

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
    let poolingOverEvent:any = null;
    let poolingOutEvent:any = null;
    d3.select(".mats").on("click", function (event, d) {
        if(lock){
            const recoverPackage = detailedViewRecovery(event, dview, lock, transState, recordLayerID, poolingOutEvent, poolingOverEvent, poolingVis, colorSchemesTable);
            //update variables
            dview = recoverPackage.dview;
            lock = recoverPackage.lock;
            transState = recoverPackage.transState;
            recordLayerID = recoverPackage.recordLayerID;
            poolingOutEvent = recoverPackage.poolingOutEvent;
            poolingOverEvent = recoverPackage.poolingOverEvent;
            colorSchemesTable = recoverPackage.colorSchemesTable;
        }
    });
    d3.selectAll(".featureVis").on("click", function (event, d) {
        if (lock != true) {
            //state
            transState = "GCNConv";
            lock = true;
            event.stopPropagation();
            dview = true;
            console.log("click! - fVis", dview, lock);
            //lock all feature visualizers and transparent paths
            d3.select(".pooling")
                .style("pointer-events", "none")
                .style("opacity", 0.2);
            d3.selectAll(".twoLayer")
                .style("pointer-events", "none")
                .style("opacity", 0.2);
            d3.selectAll("path").style("opacity", 0);
            //transparent other feature visualizers
            d3.selectAll(".featureVis").style("opacity", 0.2);
            d3.selectAll(".oFeature").style("opacity", 0.2);
            //translate each layer
            const layerID = Number(d3.select(this).attr("layerID")) - 1;
            const node = Number(d3.select(this).attr("node"));
            const featureVisPack = featureVisClick(layerID, node, recordLayerID, colorSchemesTable, adjList, featureVisTable, features, conv1, conv2, bias, myColor, weights);
            // update variables
            recordLayerID = featureVisPack.recordLayerID;
            colorSchemesTable = featureVisPack.colorSchemesTable;
            featureVisTable = featureVisPack.featureVisTable;
            features = featureVisPack.features;
            //path connect - connect intermediate feature vis to current feature vis
        }
    });
    d3.selectAll(".featureVis").on("mouseover", function (event, d) {
        //if not in the state of lock
        if (!lock) {
            //paths interactions
            const layerID = Number(d3.select(this).attr("layerID")) - 1;
            const node = Number(d3.select(this).attr("node"));
            const featureOverPack = featureVisMouseOver(layerID, node, paths, frames, adjList, matFrames, colFrames);
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
            const featureOverPack = featureVisMouseOut(layerID, node, paths, frames, adjList, matFrames, colFrames);
            paths = featureOverPack.paths;
            frames = featureOverPack.frames;
            matFrames = featureOverPack.matFrames;
            colFrames = featureOverPack.colFrames;
        }
    });
    
    //pooling visualizer click interaction
    if (poolingVis != null) {
        
        poolingVis.on("click", function (event:any, d:any) {
            transState = "pooling";
            poolingOverEvent = poolingVis.on("mouseover");
            poolingOutEvent = poolingVis.on("mouseout");
            poolingVis.on("mouseover", null);
            poolingVis.on("mouseout", null);
            console.log("f3 1", frames["GCNConv3"][3]) 
            frames["GCNConv3"][3].style.opacity = "1";
            console.log("f3 2", frames["GCNConv3"][3])
            if (lock != true) {
                //d3.select(this).style("pointer-events", "none");
                //state
                lock = true;
                event.stopPropagation();
                dview = true;
                console.log("click! - fVis", dview, lock);
                //click event
                const poolingVisPack = poolingVisClick(colorSchemesTable, adjList, featureVisTable);
                //update variables
                colorSchemesTable = poolingVisPack.colorSchemesTable;
                featureVisTable = poolingVisPack.featureVisTable;
            }
        });
    }

    //model output visualizer click interaction
    if(outputVis!=null){
        outputVis.on("mouseover", function (event:any, d:any) {
            const a = d3.select(".path1").style("opacity", 1);
            const b = d3.select(".poolingFrame").style("opacity", 1);
            const c = d3.select("#fr1").style("opacity", 1);
            console.log("mouse in", a, b, c)
        });
        outputVis.on("mouseout", function (event:any, d:any) {
            d3.select(".path1").style("opacity", 0.02);
            d3.select(".poolingFrame").style("opacity", 0);
            d3.select("#fr1").style("opacity", 0);
        });
        outputVis.on("click", function(event:any, d:any){
            if (lock != true) {
                //state
                transState = "output";
                lock = true;
                event.stopPropagation();
                dview = true;
                console.log("click! - fVis", dview, lock);
                //lock all feature visualizers and transparent paths
                const outputVisPack = outputVisClick(resultVis, colorSchemesTable, one, final, myColor);
                //update variables
                resultVis = outputVisPack.resultVis;
                colorSchemesTable = outputVisPack.colorSchemesTable;
            }
        })
    }

    // if(resultVis != null){
    //     resultVis.on("mouseover", function (event:any, d:any) {
    //         const a = d3.select(".path2").style("opacity", 1);
    //         const b = d3.select("#fr2").style("opacity", 1);
    //         const c = d3.select("#fr1").style("opacity", 1);
    //         console.log("mouse in", a, b, c)
    //     });
    //     resultVis.on("mouseout", function (event:any, d:any) {
    //         d3.select(".path2").style("opacity", 0.02);
    //         d3.select("#fr2").style("opacity", 0);
    //         d3.select("#fr1").style("opacity", 0);
    //     });
    //     resultVis.on("click", function(event:any, d:any){
    //         if (lock != true) {
    //             //state
    //             transState = "result";
    //             lock = true;
    //             event.stopPropagation();
    //             dview = true;
    //             console.log("click! - fVis", dview, lock);
    //             //lock all feature visualizers and transparent paths
    //             colorSchemesTable = resultVisClick(colorSchemesTable);
    //         }
    //     })
    //}



}





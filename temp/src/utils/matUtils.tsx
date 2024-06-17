import {
    deepClone,
    softmax
} from "./utils";
import {
    addLayerName,
    buildBinaryLegend,
    buildLegend,
    translateLayers,
    calculatePrevFeatureVisPos,
    loadWeights
} from "./matHelperUtils"
import {
    drawCrossConnection,
    drawPoolingVis,
    computeMids,
    drawTwoLayers,
    drawMatrixPreparation,
    drawNodeFeatures,
    drawGCNConv
} from "./matFeaturesUtils"
import * as d3 from "d3";
import { create, all } from "mathjs";

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
    //added interactions
    //add mouse event
    d3.selectAll(".oFeature").on("mouseover", function (event, d) {
        //if not in the state of lock
        if (!lock) {
            const layerID = d3.select(this).attr("layerID");
            const node = d3.select(this).attr("node");
            console.log("Current layerID and node", layerID, node);
            const fr = frames["features"][Number(node)];
            fr.style.opacity = "1";

            //matrix frame interaction
            const matf = matFrames[Number(node)];
            if (matf != null) {
                matf.style.opacity = "1";
            }
        }
    });
    d3.selectAll(".oFeature").on("mouseout", function (event, d) {
        const layerID = d3.select(this).attr("layerID");
        const node = d3.select(this).attr("node");
        console.log("Current layerID and node", layerID, node);
        const fr = frames["features"][Number(node)];
        fr.style.opacity = "0";

        //matrix frame interaction
        const matf = matFrames[Number(node)];
        if (matf != null) {
            matf.style.opacity = "0";
        }
    });
    
    //-----------------------------------GCNConv LAYERS-----------------------------------------------
    const GCNConvPackage = drawGCNConv(conv1, conv2, conv3, locations, myColor, frames, schemeLocations, featureVisTable, pooling, graph, colorSchemesTable, poolingVis, outputVis, final, firstLayer, maxVals);
    locations = GCNConvPackage.locations;
    frames = GCNConvPackage.frames;
    schemeLocations = GCNConvPackage.schemeLocations;
    featureVisTable = GCNConvPackage.featureVisTable;
    colorSchemesTable = GCNConvPackage.colorSchemesTable;
    poolingVis = GCNConvPackage.poolingVis;
    outputVis = GCNConvPackage.outputVis;
    maxVals = GCNConvPackage.maxVals;
    let paths = GCNConvPackage.paths;

    //-----------------------------------INTERACTIONS EVENTS MANAGEMENT-----------------------------------------------
    let recordLayerID: number = -1;
    // a state to controls the recover event
    let transState = "GCNConv";
    //save events for poolingVis
    let poolingOverEvent:any = null;
    let poolingOutEvent:any = null;
    d3.select(".mats").on("click", function (event, d) {
        if(lock){
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
            if(transState=="GCNConv"){
            if (recordLayerID >= 0) {
                translateLayers(recordLayerID, -300);
                recordLayerID = -1;
            }
            }else if(transState=="pooling"){
                translateLayers(3, -300);
                //recover events
                if(poolingOutEvent)poolingVis?.on("mouseout", poolingOutEvent);
                if(poolingOverEvent)poolingVis?.on("mouseover", poolingOverEvent);
                //recover frame
                d3.select(".poolingFrame").style("opacity", 0);
            }else {
                translateLayers(5, -300);
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
            colorSchemesTable.forEach((d, i) => {
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
            console.log("Current layerID and node", layerID, node);
            setTimeout(() => {
                translateLayers(layerID, 300);
            }, 1750);
            //record the layerID
            recordLayerID = layerID;

            //reduce color schemes opacity
            console.log("CST before modification", colorSchemesTable);
            colorSchemesTable.forEach((d, i) => {
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
                    cur
                );
                posList.push(c);
            }
            let curNode = featureVisTable[layerID + 1][node];
            curNode.style.opacity = "1"; //display current node

            //calculation process visualizer
            let coord = calculatePrevFeatureVisPos(
                featureVisTable,
                layerID,
                node
            );
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
            const dummy: number[] = math.multiply(
                math.transpose(weights[layerID]),
                X
            );

            console.log(
                "compute x'",
                mulValues,
                dList,
                layerID,
                X.toString(),
                dummy
            );

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
                        .attr(
                            "d",
                            curve([posList[i], hpoint, lpoint, coordFeatureVis])
                        )
                        .attr("stroke", "black")
                        .attr("opacity", 0)
                        .attr("fill", "none")
                        .attr("class", "procVis");

                    //draw multipliers
                    let x =
                        (coordFeatureVis[0] - posList[i][0]) / 2 +
                        posList[i][0];
                    let y =
                        (coordFeatureVis[1] - posList[i][1]) / 2 +
                        posList[i][1];
                    console.log(
                        "text point",
                        x,
                        y,
                        posList[i][0],
                        posList[i][1]
                    );
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
                d3.selectAll(".procVis")
                    .transition()
                    .duration(1000)
                    .attr("opacity", 1);
            }, 2500);

            //path connect - connect intermediate feature vis to current feature vis
        }
    });
    d3.selectAll(".featureVis").on("mouseover", function (event, d) {
        //if not in the state of lock
        if (!lock) {
            //paths interactions
            const layerID = Number(d3.select(this).attr("layerID")) - 1;
            const node = Number(d3.select(this).attr("node"));
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
                        // matFrames[vis].style.fill = "yellow";
                        // matFrames[vis].style.opacity = "0.5";
                    } else {
                        //matFrames[vis].style.fill = "blue";
                        matFrames[vis].style.opacity = "1";
                    }
                });
            }

            if (colFrames != null) {
                colFrames[node].style.opacity = "1";
            }
        }
    });
    d3.selectAll(".featureVis").on("mouseout", function (event, d) {
        if (!lock) {
            const layerID = Number(d3.select(this).attr("layerID")) - 1;
            const node = Number(d3.select(this).attr("node"));
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
                
                //lock all feature visualizers and transparent paths
                d3.selectAll("[class='frame'][layerID='3']").style("opacity", 1);
                d3.select(".pooling")
                    .style("pointer-events", "none");
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
                for(let i=0; i<3; i++)colorSchemesTable[i].style.opacity = "0.2";
                //display the features we want to display
                //display the frame we want to display
                console.log("FST click", frames);
                for(let i=0; i<adjList.length; i++){
                    featureVisTable[3][i].style.opacity = "1";
                    
                }
                

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
                d3.select(".pooling")
                    .style("pointer-events", "none")
                    .style("opacity", 0.2);
                d3.selectAll(".twoLayer")
                    .style("pointer-events", "none");
                d3.selectAll("path").style("opacity", 0);
                //transparent other feature visualizers
                d3.selectAll(".featureVis").style("opacity", 0.2);
                d3.selectAll(".oFeature").style("opacity", 0.2);
                //translate each layer
                const layerID = 5;
                setTimeout(() => {
                    translateLayers(layerID, 300);
                }, 1750);
                for(let i=0; i<layerID; i++)colorSchemesTable[i].style.opacity = "0.2";
            }
        })
    }
}





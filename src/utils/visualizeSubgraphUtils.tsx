import {
    chunkArray,
    deepClone,
    drawPoints,
    findMaxIndex,
    preprocessFloat32ArrayToNumber,
    softmax,
    transposeMat,
} from "./utils";
import { addLayerName, buildBinaryLegend, buildLegend } from "./matHelperUtils";
import * as d3 from "d3";
import { roundToTwo } from "../components/WebUtils";
import { deprecate } from "util";
import { injectSVG } from "./svgUtils";

//draw data original feature
export function drawSubgraphNodeFeatures(
    locations: any,
    graph: any,
    myColor: any,
    features: any,
    frames: any,
    schemeLocations: any,
    featureVisTable: any,
    featureChannels:number,
    rectW:number,
    rectH:number,
    gap:number,
    drawPaths: boolean = true
) {
    //initial visualizer
    for (let i = 0; i < locations.length; i++) {
        locations[i][0] += 25;
        locations[i][1] += 2;
    }
    //draw cross connections for features layer and first GCNConv layer
    //drawPaths controls the cross connection func
   // if(drawPaths)drawCrossConnection(graph, locations, featureChannels * rectW, gap+2, 0);

    //using locations to find the positions for first feature visualizers
    const firstLayer = d3.select(".mats").append("g").attr("id", "layerNum_0").attr("class", "layerVis");
    // const rectW = 10;
    // const rectH = 15;
    for (let i = 0; i < locations.length; i++) {
        const g = firstLayer
            .append("g")
            .attr("class", "oFeature")
            .attr("node", i)
            .attr("layerID", 0);

        for (let j = 0; j < featureChannels; j++) {
            const fVis = g
                .append("rect")
                .attr("x", locations[i][0] + rectW * j)
                .attr("y", locations[i][1])
                .attr("width", rectW)
                .attr("height", rectH)
                .attr("fill", myColor(features[i][j]))
                .attr("opacity", 1)
                .attr("stroke", "gray")
                .attr("stroke-width", 0.1);
        }
        //draw frame
        const f = g
            .append("rect")
            .attr("x", locations[i][0])
            .attr("y", locations[i][1])
            .attr("width", rectW * featureChannels)
            .attr("height", rectH)
            .attr("fill", "none")
            .attr("opacity", 0.25)
            .attr("stroke", "black")
            .attr("stroke-width", 1)
            .attr("node", i)
            .attr("layerID", 0)
            .attr("class", "frame");
        frames["features"].push(f.node());

        //find last location
        if (i == locations.length - 1)
            schemeLocations.push([locations[i][0], 350]);

        //push feature visualizer into the table
        featureVisTable[0].push(g.node() as SVGElement);
    }
    //drawPoints(".mats", "red", schemeLocations);
    //add layer label for the first one

    if(featureChannels!=34)addLayerName(locations, "Input", 0, 30, firstLayer);
    else addLayerName(locations, "Input", 0, 70, firstLayer);
    return {
        locations: locations,
        frames: frames,
        schemeLocations: schemeLocations,
        featureVisTable: featureVisTable,
        firstLayer: firstLayer,
    };
}
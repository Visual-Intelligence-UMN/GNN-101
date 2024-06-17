import {
    deepClone,
    softmax
} from "./utils";
import {
    addLayerName
} from "./matHelperUtils"
import * as d3 from "d3";

//draw cross connections between feature visualizers
export function drawCrossConnection(
    graph: any,
    locations: any,
    firstVisSize: number,
    gapSize: number,
    layerID: number
) {
    console.log("layerID", layerID);
    let alocations = deepClone(locations);
    for (let i = 0; i < alocations.length; i++) {
        alocations[i][0] += firstVisSize;
        alocations[i][1] += 5;
    }
    let blocations = deepClone(alocations);
    for (let i = 0; i < blocations.length; i++) {
        blocations[i][0] += gapSize;
    }
    console.log("location length", alocations.length);
    //draw one-one paths
    for (let i = 0; i < alocations.length; i++) {
        d3.select(".mats")
            .append("path")
            .attr("d", d3.line()([alocations[i], blocations[i]]))
            .attr("stroke", "black")
            .attr("opacity", 0.05)
            .attr("fill", "none")
            .attr("endingNode", i)
            .attr("layerID", layerID);
    }
    //draw one-multiple paths - three
    let pts: number[][] = [];
    const curve = d3.line().curve(d3.curveBasis);
    for (let i = 0; i < graph.length; i++) {
        for (let j = 0; j < graph[0].length; j++) {
            if (graph[i][j] == 1) {
                const res = computeMids(alocations[i], blocations[j]);
                const hpoint = res[0];
                const lpoint = res[1];
                console.log("control points", hpoint, lpoint);
                d3.select(".mats")
                    .append("path")
                    .attr(
                        "d",
                        curve([alocations[i], hpoint, lpoint, blocations[j]])
                    )
                    .attr("stroke", "black")
                    .attr("opacity", 0.05)
                    .attr("fill", "none")
                    .attr("endingNode", j)
                    .attr("layerID", layerID);
                pts.push(hpoint);
                pts.push(lpoint);
                console.log(
                    "odata",
                    alocations[i],
                    blocations[i],
                    "low",
                    lpoint,
                    "high",
                    hpoint
                );
            }
        }
    }
    //drawPoints(".mats", "red", pts);

    d3.selectAll("path").lower();

    //group all path elements by LayerID and Ending Node
    interface GroupedPaths {
        [layerID: string]: {
            [endingNode: string]: SVGPathElement[];
        };
    }
    const paths = d3.selectAll<SVGPathElement, any>("path");

    const groupedPaths: GroupedPaths = paths
        .nodes()
        .reduce((acc: GroupedPaths, path: SVGPathElement) => {
            const layerID: string = path.getAttribute("layerID") || ""; // 确保 layerID 和 endingNode 不是 null
            const endingNode: string = path.getAttribute("endingNode") || "";

            if (!acc[layerID]) {
                acc[layerID] = {};
            }

            if (!acc[layerID][endingNode]) {
                acc[layerID][endingNode] = [];
            }

            acc[layerID][endingNode].push(path);

            return acc;
        }, {});
    console.log("groupedPath", groupedPaths);
    return groupedPaths;
}

export function computeMids(point1: any, point2: any) {
    //find mid - x
    const midX = (point1[0] + point2[0]) / 2;
    const res = [
        [midX - 20, point1[1]],
        [midX + 20, point2[1]],
    ];
    console.log("res", res);
    return res;
}

//draw aid utils for matrix visualization(column and row frames)
export function drawMatrixPreparation(){

}

//draw data original feature
export function drawNodeFeatures(){

}

//draw intermediate features from GCNConv process
export function drawGCNConv(){

} 

//draw pooling visualizer
export function drawPoolingVis(
    locations: any,
    pooling: number[],
    myColor: any,
    frames: any,
    colorSchemesTable: any
) {
    let oLocations = deepClone(locations);
    //find edge points
    locations[0][0] += 64 * 2;
    locations[locations.length - 1][0] += 64 * 2;
    locations[locations.length - 1][1] += 10;
    //find mid point
    const midY = (locations[locations.length - 1][1] - locations[0][1]) / 2;
    //all paths should connect to mid point
    const one = [[locations[0][0] + 102, midY]];
    //drawPoints(".mats", "red", one);
    //draw the pooling layer
    console.log("from feature vis", pooling);
    const gg = d3
        .select(".mats")
        .append("g")
        .attr("class", "layerVis")
        .attr("id", "layerNum_4");
    const g = gg.append("g").attr("class", "pooling");
    for (let i = 0; i < pooling.length; i++) {
        g.append("rect")
            .attr("x", locations[0][0] + 102 + 2 * i)
            .attr("y", midY - 5)
            .attr("width", 2)
            .attr("height", 10)
            .attr("fill", myColor(pooling[i]))
            .attr("opacity", 1)
            .attr("stroke", "gray")
            .attr("stroke-width", 0.1);
    }
    //add text
    addLayerName(locations, "Pooling", 102, -142, gg);
    //draw the cross connections btw last GCN layer and pooling layer

    //do some transformations on the original locations
    for (let i = 0; i < oLocations.length; i++) {
        oLocations[i][0] += 2 * 64;
        oLocations[i][1] += 5;
    }
    //drawPoints(".mats", "red", oLocations);
    //connnnnnnnect!!!
    const curve = d3.line().curve(d3.curveBasis);
    const paths: any[] = [];
    const mats = d3.select(".mats");
    for (let i = 0; i < oLocations.length; i++) {
        const res = computeMids(oLocations[i], one[0]);
        const lpoint = res[0];
        const hpoint = res[1];
        const path = mats
            .append("path")
            .attr("d", curve([oLocations[i], lpoint, hpoint, one[0]]))
            .attr("stroke", "black")
            .attr("opacity", 0.05)
            .attr("fill", "none");

        paths.push(path.node());
    }
    //draw frame
    const f = g
        .append("rect")
        .attr("x", locations[0][0] + 102)
        .attr("y", midY - 5)
        .attr("width", 2 * 64)
        .attr("height", 10)
        .attr("fill", "none")
        .attr("opacity", 0)
        .attr("stroke", "black")
        .attr("stroke-width", 1)
        .attr("layerID", 4)
        .attr("class", "poolingFrame");
    //send all paths to the back
    d3.selectAll("path").lower();

    g.on("mouseover", function (event, d) {
        console.log("over", paths);
        //interaction with paths
        if (paths != null) {
            paths.forEach((div: HTMLElement) => {
                div.style.opacity = "1";
            });
        }
        //interaction with frame
        d3.select(".poolingFrame").style("opacity", 1);
        //d3.selectAll('[layerID="3"][class="frame"]').attr("opacity", 1);
        const layerFrames = frames["GCNConv3"];
        layerFrames.forEach((frame: HTMLElement) => {
            frame.style.opacity = "1";
        });
    });

    g.on("mouseout", function (event, d) {
        if (paths != null) {
            paths.forEach((div: HTMLElement) => {
                div.style.opacity = "0.05";
            });
        }
        //interaction with frame
        d3.select(".poolingFrame").style("opacity", 0);
        //d3.selectAll('[layerID="3"][class="frame"]').attr("opacity", 0);
        const layerFrames = frames["GCNConv3"];
        layerFrames.forEach((frame: HTMLElement) => {
            frame.style.opacity = "0";
        });
    });

    return { one: one, g: g };
}

//the function to draw the last two layers of the model
export function drawTwoLayers(one: any, final: any, myColor: any) {
    //find the next position
    one[0][0] += 64 * 2 + 102;
    let aOne = deepClone(one);
    one[0][1] -= 5;
    //drawPoints(".mats", "red", one);
    //visulaize
    const g = d3
        .select(".mats")
        .append("g")
        .attr("class", "twoLayer layerVis")
        .attr("id", "layerNum_5");
    for (let m = 0; m < final.length; m++) {
        g.append("rect")
            .attr("x", one[0][0] + 10 * m)
            .attr("y", one[0][1])
            .attr("width", 10)
            .attr("height", 10)
            .attr("fill", myColor(final[m]))
            .attr("opacity", 1)
            .attr("stroke", "gray")
            .attr("stroke-width", 0.1);
    }
    //draw frame
    const f = g
        .append("rect")
        .attr("x", one[0][0])
        .attr("y", one[0][1])
        .attr("width", 2 * 10)
        .attr("height", 10)
        .attr("fill", "none")
        .attr("opacity", 0)
        .attr("stroke", "black")
        .attr("stroke-width", 1)
        .attr("layerID", 4)
        .attr("class", "frame")
        .attr("fr", 1)
        .attr("id", "fr1");
    //add text
    addLayerName(one, "Model Output", 0, 20, g);
    //find positions to connect
    let bOne = deepClone(aOne);
    bOne[0][0] -= 102;
    //connect
    d3.select(".mats")
        .append("path")
        .attr("d", d3.line()([aOne[0], bOne[0]]))
        .attr("stroke", "black")
        .attr("opacity", 0.05)
        .attr("fill", "none")
        .attr("class", "path1")
        .attr("id", "path1");
    //add interaction
    // g.on("mouseover", function (event, d) {
    //     d3.select(".path1").attr("opacity", 1);
    //     d3.select(".poolingFrame").attr("opacity", 1);
    //     d3.select("#fr1").attr("opacity", 1);
    // });
    // g.on("mouseout", function (event, d) {
    //     d3.select(".path1").attr("opacity", 0.02);
    //     d3.select(".poolingFrame").attr("opacity", 0);
    //     d3.select("#fr1").attr("opacity", 0);
    // });
    //visualize the result
    aOne[0][0] += 20 + 102;
    //drawPoints(".mats","red",aOne);
    aOne[0][1] -= 5;

    let result = softmax(final);
    console.log("mat result", result);
    const g1 = d3
        .select(".mats")
        .append("g")
        .attr("class", "twoLayer layerVis")
        .attr("id", "layerNum_6");
    for (let m = 0; m < result.length; m++) {
        g1.append("rect")
            .attr("x", aOne[0][0] + 10 * m)
            .attr("y", aOne[0][1])
            .attr("width", 10)
            .attr("height", 10)
            .attr("fill", myColor(result[m]))
            .attr("opacity", 1)
            .attr("stroke", "gray")
            .attr("stroke-width", 0.1);
    }
    //drawPoints(".mats", "red", aOne);
    //add labels
    g1.append("text")
        .attr("x", aOne[0][0] + 5)
        .attr("y", aOne[0][1])
        .attr("font-size", "5px")
        .attr("transform", "rotate(-45," + aOne[0][0] + "," + aOne[0][1] + ")")
        .text("Non-Mutagenic");

    g1.append("text")
        .attr("x", aOne[0][0] + 15)
        .attr("y", aOne[0][1])
        .attr("font-size", "5px")
        .attr(
            "transform",
            "rotate(-45," + (aOne[0][0] + 10) + "," + aOne[0][1] + ")"
        )
        .text("Mutagenic");

    addLayerName(aOne, "Prediction Result", 0, 20, g1);
    //draw frame
    const f1 = g1
        .append("rect")
        .attr("x", aOne[0][0])
        .attr("y", aOne[0][1])
        .attr("width", 2 * 10)
        .attr("height", 10)
        .attr("fill", "none")
        .attr("opacity", 0)
        .attr("stroke", "black")
        .attr("stroke-width", 1)
        .attr("layerID", 4)
        .attr("class", "frame")
        .attr("fr", 2);
    //connect
    aOne[0][1] += 5;
    let cOne = deepClone(aOne);
    cOne[0][0] -= 102;
    d3.select(".mats")
        .append("path")
        .attr("d", d3.line()([aOne[0], cOne[0]]))
        .attr("stroke", "black")
        .attr("opacity", 0.05)
        .attr("fill", "none")
        .attr("class", "path2");

    //add interaction
    g1.on("mouseover", function (event, d) {
        d3.select(".path2").style("opacity", 1);
        d3.select("[fr='1']").style("opacity", 1);
        f1.style("opacity", 1);
        console.log("f", f, f1);
    });
    g1.on("mouseout", function (event, d) {
        d3.select(".path2").style("opacity", 0.02);
        d3.select("[fr='1']").style("opacity", 0);
        f1.style("opacity", 0);
    });

    return {"locations":[aOne[0], cOne[0]], "g":g, "g1":g1};
}
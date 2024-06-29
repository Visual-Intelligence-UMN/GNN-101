import * as d3 from "d3";
import { computeMids } from "./matFeaturesUtils";

export function runAnimations(index:number, animations:any) {
    if (index < animations.length) {
        const { func, delay } = animations[index];
        setTimeout(() => {
            func();
            runAnimations(index + 1, animations);
        }, delay);
    } else {
        console.log("All animations completed");
    }
}

export function drawAniPath(
    Xt: any,
    currentStep: number,
    startCoordList: any,
    endCoordList: any,
    curveDir: number,
    myColor: any,
    featureChannels: number
) {
    d3.selectAll("#tempath").remove();

    const Xv = Xt[currentStep];
    for (let j = 0; j < featureChannels; j++) {
        const s1 = startCoordList[j];
        const e1 = endCoordList[currentStep];
        let pathDir = e1[0] > s1[0] ? 0 : 1;
        if (curveDir == 1) {
            pathDir = e1[0] > s1[0] ? 1 : 0;
        }
        console.log("se", [s1, e1]);
        d3.select(".mats")
            .append("path")
            .attr("d", function () {
                return [
                    "M",
                    s1[0],
                    s1[1],
                    "A",
                    (e1[0] - s1[0]) / 2,
                    ",",
                    (e1[0] - s1[0]) / 4,
                    0,
                    0,
                    ",",
                    pathDir,
                    ",",
                    e1[0],
                    ",",
                    e1[1],
                ].join(" ");
            })
            .attr("class", "procVis")
            .attr("id", "tempath")
            .style("fill", "none")
            .attr("stroke", myColor(Xv[j]));
    }
    d3.selectAll("#tempath").lower();
}

export function drawSummationFeature(
    g: any,
    X: any,
    coordFeatureVis: any,
    w: number,
    rectH: number,
    myColor: any,
    posList: any,
    mulValues: any
) {
    for (let m = 0; m < X.length; m++) {
        g.append("rect")
            .attr("x", coordFeatureVis[0] + w * m)
            .attr("y", coordFeatureVis[1] - rectH / 2)
            .attr("width", w)
            .attr("height", rectH)
            .attr("fill", myColor(X[m]))
            .attr("opacity", 0)
            .attr("stroke", "gray")
            .attr("stroke-width", 0.1)
            .attr("class", "procVis");
    }

    //draw frame
    g.append("rect")
        .attr("x", coordFeatureVis[0])
        .attr("y", coordFeatureVis[1] - rectH / 2)
        .attr("width", w * X.length)
        .attr("height", rectH)
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
            .attr("d", curve([posList[i], hpoint, lpoint, coordFeatureVis]))
            .attr("stroke", "black")
            .attr("opacity", 0)
            .attr("fill", "none")
            .attr("class", "procVis")
            .attr("id", "procPath");

        //draw multipliers
        let x = (coordFeatureVis[0] - posList[i][0]) / 2 + posList[i][0];
        let y = (coordFeatureVis[1] - posList[i][1]) / 2 + posList[i][1];
        console.log("text point", x, y, posList[i][0], posList[i][1]);
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
    d3.selectAll(".procVis").transition().duration(100).attr("opacity", 1);
}

export function drawWeightsVector(
    g: any,
    dummy: number[],
    coordFeatureVis: any,
    rectH: number,
    rectW: number,
    myColor: any
) {
    for (let m = 0; m < dummy.length; m++) {
        g.append("rect")
            .attr("x", coordFeatureVis[0] + rectW * m)
            .attr("y", coordFeatureVis[1] - rectH / 2)
            .attr("width", rectW)
            .attr("height", rectH)
            .attr("fill", myColor(dummy[m]))
            .attr("opacity", 0)
            .attr("stroke", "gray")
            .attr("stroke-width", 0.1)
            .attr("class", "procVis");
    }

    //draw frame
    g.append("rect")
        .attr("x", coordFeatureVis[0])
        .attr("y", coordFeatureVis[1] - rectH / 2)
        .attr("width", rectW * dummy.length)
        .attr("height", rectH)
        .attr("fill", "none")
        .attr("opacity", 0)
        .attr("stroke", "black")
        .attr("stroke-width", 1)
        .attr("class", "procVis");
    d3.selectAll(".procVis").transition().duration(100).attr("opacity", 1);
}

export function drawBiasVector(
    g: any,
    featureChannels: number,
    rectH: number,
    rectW: number,
    coordFeatureVis: any,
    myColor: any,
    layerBias: number[]
) {
    for (let m = 0; m < featureChannels; m++) {
        g.append("rect")
            .attr("x", coordFeatureVis[0] + rectW * m)
            .attr("y", coordFeatureVis[1] - rectH / 2)
            .attr("width", rectW)
            .attr("height", rectH)
            .attr("fill", myColor(layerBias[m]))
            .attr("opacity", 0)
            .attr("stroke", "gray")
            .attr("stroke-width", 0.1)
            .attr("class", "procVis");
    }

    //draw frame
    g.append("rect")
        .attr("x", coordFeatureVis[0])
        .attr("y", coordFeatureVis[1] - rectH / 2)
        .attr("width", rectW * featureChannels)
        .attr("height", rectH)
        .attr("fill", "none")
        .attr("opacity", 0)
        .attr("stroke", "black")
        .attr("stroke-width", 1)
        .attr("class", "procVis");
    d3.selectAll(".procVis").transition().duration(100).attr("opacity", 1);
}

export function drawBiasPath(
    biasCoord:[number, number], 
    res10:[number, number], 
    res11:[number, number], 
    nextCoord:[number, number]
) {
    const lineGenerator = d3
        .line<[number, number]>()
        .curve(d3.curveBasis)
        .x((d) => d[0])
        .y((d) => d[1]);
    d3.select(".mats")
        .append("path")
        .attr("d", lineGenerator([biasCoord, res10, res11, nextCoord]))
        .attr("stroke", "black")
        .attr("opacity", 0)
        .attr("fill", "none")
        .attr("class", "procVis biasPath")
        .attr("id", "procPath")
        .lower();
    d3.selectAll(".biasPath").transition().duration(100).attr("opacity", 1);
}

export function drawFinalPath(
    wmCoord:[number, number], 
    res00:[number, number], 
    res01:[number, number], 
    nextCoord:[number, number]
){
    const lineGenerator = d3
            .line<[number, number]>()
            .curve(d3.curveBasis)
            .x((d) => d[0])
            .y((d) => d[1]);

        d3.select(".mats")
            .append("path")
            .attr("d", lineGenerator([wmCoord, res00, res01, nextCoord]))
            .attr("stroke", "black")
            .attr("opacity", 0)
            .attr("fill", "none")
            .attr("class", "procVis")
            .attr("id", "procPath");

            d3.selectAll(".procVis").transition().duration(100).attr("opacity", 1);
        d3.selectAll("#procPath").lower();
}

export function drawReLU(
    midX1:number, 
    wmCoord:number[], 
    biasCoord:number[], 
    nextCoord:number[]
){
    const svg = d3.select(".mats");
        const relu = svg.append("g");

        const cx = midX1;
        const cy = (wmCoord[1] + biasCoord[1]) / 2;
        const radius = 5;
        const cx1 = nextCoord[0] - 45;
        const cy1 = nextCoord[1] - 15;

        d3.xml("./assets/SVGs/ReLU.svg").then(function (data) {
            console.log("xml", data.documentElement);
            if(relu.node()!=null){
            const ReLU = relu!.node()!.appendChild(data.documentElement);
            d3.select(ReLU)
                .attr("x", cx1)
                .attr("y", cy1)
                .attr("class", "procVis")
                .raise();
            }
        });
}

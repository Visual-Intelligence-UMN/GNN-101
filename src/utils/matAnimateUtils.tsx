import * as d3 from "d3";
import { computeMids } from "./matFeaturesUtils";
import { injectPlayButtonSVG } from "./svgUtils";
import { drawActivationExplanation } from "./matInteractionUtils";

export function animatePathDrawing(
    Xt: any,
    currentStep: number,
    startCoordList: any,
    endCoordList: any,
    curveDir: number,
    myColor: any,
    featureChannels: number,
    coordFeatureVis3:any,
    rectH:number,
    rectW:number,
    dummy:number[],
    g:any,
    biasCoord:any,
    res10:any,
    res11:any,
    nextCoord:any,
    lock:boolean,
    aniSec:number,
    btn:any,
    btnX:number,
    btnY:number
){
    const intervalID = setInterval(() => {
        drawAniPath(
            Xt, 
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
            g
        );
        currentStep++;
        console.log("i", currentStep);
        if(currentStep>=featureChannels){
            setTimeout(()=>{
              //  drawBiasPath(biasCoord, res10, res11, nextCoord);
            },aniSec + 100);
        }
        if (currentStep >= featureChannels || !lock) {
            injectPlayButtonSVG(
                btn,
                btnX,
                btnY - 30,
                "./assets/SVGs/playBtn_play.svg"
            );
            clearInterval(intervalID);
        }
    }, 250);
    return intervalID;
}

interface Animation {
    func: () => void;
    delay: number;
}

export const AnimationController = {
    isPaused: false,
    currentAnimationIndex: 0,
    animationsTimeout: null as any,
    animationsList: [] as Animation[],
    intervalID: null as any,
    currentStep: 0,

    runAnimations(index: number, animations: Animation[]) {
        this.animationsList = animations; // 保存动画列表
        if (index < animations.length) {
            if (!this.isPaused) {
                const { func, delay } = animations[index];
                this.animationsTimeout = setTimeout(() => {
                    func();
                    this.runAnimations(index + 1, animations);
                }, delay);
            }
            this.currentAnimationIndex = index;
        } else {
            console.log("All animations completed");
        }
    },
    pauseAnimations() {
        this.isPaused = true;
        clearTimeout(this.animationsTimeout);
        clearInterval(this.intervalID);
    },
    resumeAnimations() {
        if (this.isPaused) {
            this.isPaused = false;
            this.runAnimations(this.currentAnimationIndex, this.animationsList);
        }
    },
    startAnimations(animations: Animation[]) {
        this.isPaused = false; // 重置暂停状态
        this.currentAnimationIndex = 0; // 重置当前索引
        this.runAnimations(0, animations);
    },
    getIntervalID() {
        return this.intervalID;
    }
};

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
    featureChannels: number,
    coordFeatureVis:any,
    rectH:number,
    rectW:number,
    dummy:number[],
    g:any
) {
    d3.selectAll("#tempath").remove();
    if(currentStep==0){
        //d3.selectAll(".removeRect").remove();
        // g.append("rect")
        //     .attr("x", coordFeatureVis[0])
        //     .attr("y", coordFeatureVis[1] - rectH / 2)
        //     .attr("width", rectW * dummy.length)
        //     .attr("height", rectH)
        //     .attr("fill", "none")
        //     .attr("opacity", 1)
        //     .attr("stroke", "black")
        //     .attr("stroke-width", 1)
        //     .attr("class", "procVis");
        
        g.append("text")
            .attr("x", coordFeatureVis[0] - (endCoordList[currentStep][0] - startCoordList[0][0])/2 - 20)
            .attr("y", coordFeatureVis[1] + rectH - curveDir*Xt[currentStep].length*(2) - curveDir * 45)
            .text("Matrix Multiplication")
            .style("fill", "gray")
            .style("font-size", "8px")
            .attr("class", "procVis"); 
        
    }
    g.append("rect")
        .attr("x", coordFeatureVis[0] + rectW * currentStep)
        .attr("y", coordFeatureVis[1] - rectH / 2)
        .attr("width", rectW)
        .attr("height", rectH)
        .attr("fill", myColor(dummy[currentStep]))
        .attr("opacity", 1)
        .attr("stroke", "gray")
        .attr("stroke-width", 0.1)
        .attr("class", "procVis removeRect interactRect").attr("rectID", currentStep).lower();

    

    drawMatrixWeight(Xt, startCoordList, endCoordList, curveDir, currentStep, myColor);
    d3.selectAll("#tempath").lower();

    d3.selectAll(".interactRect").on("mouseover", function(){
        const rectID = d3.select(this).attr("rectID")
        console.log("rectID",rectID)
        d3.selectAll(".interactRect").style("opacity", 0.5);
        d3.select(`.interactRect[rectID="${rectID}"]`).style("opacity", 1).style("stroke", "black").style("stroke-width", 1);
        drawMatrixWeight(Xt, startCoordList, endCoordList, curveDir, Number(rectID), myColor, "weightPath");
    });
    d3.selectAll(".interactRect").on("mouseout", function(){
        const rectID = d3.select(this).attr("rectID")
        console.log("rectID quit",rectID)
        d3.selectAll(".interactRect").style("opacity", 1).style("stroke", "gray").style("stroke-width", 0.1);
        d3.selectAll("#weightPath").remove();
    });

    
}

function calculateControlPoints(p0:any, p1:any, p2:any) {
    const dx1 = p1[0] - p0[0];
    const dy1 = p1[1] - p0[1];
    const dx2 = p2[0] - p1[0];
    const dy2 = p2[1] - p1[1];

    const m1 = [p1[0] - dx1 / 2, p1[1] - dy1 / 2];
    const m2 = [p1[0] + dx2 / 2, p1[1] + dy2 / 2];

    return [m1, m2];
}

export function drawMatrixWeight(
    Xt: any,
    startCoordList:any,
    endCoordList:any,
    curveDir:number,
    currentStep:number,
    myColor:any,
    id:string = "tempath",
    weightMatrixPostions:any
){
    const Xv = Xt[currentStep];
    for (let j = 0; j < Xv.length; j++) {
        const s1 = startCoordList[j];
        const e1 = endCoordList[currentStep];

        const m1 = weightMatrixPostions[63-j][currentStep];

        let pathDir = e1[0] > s1[0] ? 0 : 1;
        if (curveDir == 1) {
            pathDir = e1[0] > s1[0] ? 1 : 0; //curDir =
        }
        console.log("se", [s1, e1]);

        

        const points = [s1, m1, e1];

        // Create a line generator with Catmull-Rom interpolation
        const lineGenerator = d3.line()
            .curve(d3.curveCatmullRom)
            .x(d => d[0])
            .y(d => d[1]);

        // Generate the path data
        const pathData = lineGenerator(points);
        
        d3.select(".mats")
            .append("path")
            .attr("d", pathData)
            .attr("class", "procVis")
            .attr("id", id)
            .style("fill", "none")
            .attr("stroke", myColor(Xv[j])).lower();
    }
}


export function drawSummationFeature(
    g1: any,
    X: any,
    coordFeatureVis: any,
    w: number,
    rectH: number,
    myColor: any,
    posList: any,
    mulValues: any,
    curveDir: number
) {
    const g = g1.append("g").attr("class", "procVis aggregate")
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
            .attr("class", "procVis summation");
    }

    //draw frame
    g1.append("rect")
        .attr("x", coordFeatureVis[0])
        .attr("y", coordFeatureVis[1] - rectH / 2)
        .attr("width", w * X.length)
        .attr("height", rectH)
        .attr("fill", "none")
        .attr("opacity", 0)
        .attr("stroke", "black")
        .attr("stroke-width", 1)
        .attr("class", "procVis summation");

    //draw label
    g1.append("text")
            .attr("x", coordFeatureVis[0])
            .attr("y", coordFeatureVis[1] + rectH * curveDir)
            .text("Vectors Summation")
            .style("fill", "gray")
            .style("font-size", "8px")
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
            .attr("stroke", myColor(mulValues[i]))
            .attr("opacity", 0)
            .attr("fill", "none")
            .attr("class", "procVis summation")
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
            .attr("class", "procVis multiplier")
            .attr("opacity", 0);
    }
    d3.selectAll(".summation").transition().duration(100).attr("opacity", 1);
    d3.select(".aggregate").on("mouseover", function(){
        d3.selectAll(".multiplier").style("opacity", 1);
    })
    d3.select(".aggregate").on("mouseout", function(){
        d3.selectAll(".multiplier").style("opacity", 0);
    })
}

export function drawWeightsVector(
    g: any,
    dummy: number[],
    coordFeatureVis: any,
    rectH: number,
    rectW: number,
    myColor: any,
    Xv:number[][],
    startCoordList: any,
    endCoordList:any,
    curveDir:number,
    weightMatrixPostions: any,
    rectClass: string = "procVis removeRect wRect interactRect"
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
            .attr("class", rectClass)
            .attr("rectID", m)
            .attr("id", `weightRect${m}`);
    }

        g.append("text")
            .attr("x", coordFeatureVis[0])
            .attr("y", coordFeatureVis[1] + rectH)
            .text("Vector After Multiplication")
            .style("fill", "gray")
            .style("font-size", "8px")
            .attr("class", "procVis"); 

    //draw frame
    g.append("rect")
        .attr("x", coordFeatureVis[0])
        .attr("y", coordFeatureVis[1] - rectH / 2)
        .attr("width", rectW * dummy.length)
        .attr("height", rectH)
        .attr("fill", "none")
        .attr("opacity", 1)
        .attr("stroke", "black")
        .attr("stroke-width", 1)
        .attr("class", "procVis wRect");
    d3.selectAll(".wRect").transition().duration(100).attr("opacity", 1);

    d3.selectAll(".interactRect").on("mouseover", function(){
        const rectID = d3.select(this).attr("rectID")
        console.log("rectID",rectID);
        d3.selectAll(".interactRect").style("opacity", 0.5);
        d3.select(`.interactRect[rectID="${rectID}"]`).style("opacity", 1).style("stroke", "black").style("stroke-width", 1);
        drawMatrixWeight(Xv, startCoordList, endCoordList, curveDir, Number(rectID), myColor, "weightPath", weightMatrixPostions);
        d3.selectAll(".weightUnit").style("opacity", 0.3).lower();
        d3.selectAll(`#weightUnit-${rectID}`).style("opacity", 1).raise();
        d3.select(`#columnUnit-${rectID}`).style("opacity", 1).raise();
    });
    d3.selectAll(".interactRect").on("mouseout", function(){
        const rectID = d3.select(this).attr("rectID")
        d3.selectAll(".weightUnit").style("opacity", 1);
        console.log("rectID quit",rectID)
        d3.selectAll(".columnUnit").style("opacity", 0);
        d3.selectAll(".interactRect").style("opacity", 1).style("stroke", "gray").style("stroke-width", 0.1);
        d3.selectAll("#weightPath").remove();
    });
}


export function drawWeightMatrix(

){

}

export function drawBiasVector(
    g: any,
    featureChannels: number,
    rectH: number,
    rectW: number,
    coordFeatureVis: any,
    myColor: any,
    layerBias: number[],
    layerID:number
) {
    let channels = featureChannels;
    if(layerID==2&&featureChannels==4)channels=2;
    for (let m = 0; m < channels; m++) {
        g.append("rect")
            .attr("x", coordFeatureVis[0] + rectW * m)
            .attr("y", coordFeatureVis[1] - rectH / 2)
            .attr("width", rectW)
            .attr("height", rectH)
            .attr("fill", myColor(layerBias[m]))
            .attr("opacity", 0)
            .attr("stroke", "gray")
            .attr("stroke-width", 0.1)
            .attr("class", "procVis biasVector");
    }

    //draw frame
    g.append("rect")
        .attr("x", coordFeatureVis[0])
        .attr("y", coordFeatureVis[1] - rectH / 2)
        .attr("width", rectW * channels)
        .attr("height", rectH)
        .attr("fill", "none")
        .attr("opacity", 0)
        .attr("stroke", "black")
        .attr("stroke-width", 1)
        .attr("class", "procVis biasVector");
    const label = g.append("text")
        .attr("x", coordFeatureVis[0])
        .attr("y", coordFeatureVis[1] + rectH)
        .text("Bias Vector")
        .style("fill", "gray")
        .style("font-size", "8px")
        .attr("class", "procVis biasVector"); 
    d3.selectAll(".biasVector").transition().duration(100).attr("opacity", 1);
}

export function drawBiasPath(
    biasCoord:[number, number], 
    res10:[number, number], 
    res11:[number, number], 
    nextCoord:[number, number],
    layerID:number,
    featureChannels:number
) {
    if(layerID==2&&featureChannels==4)biasCoord[0]-=15;
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
    nextCoord:[number, number],
    layerID:number,
    featureChannels:number
){
    if((layerID==2)&&featureChannels==4)wmCoord[0]-=15;
    if((layerID==0)&&featureChannels==4)wmCoord[0]+=15;
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
            .attr("class", "procVis finalPath")
            .attr("id", "procPath");

            d3.selectAll(".finalPath").transition().duration(100).attr("opacity", 1);
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

        relu.append("text")
            .attr("x", cx1 - 20)
            .attr("y", cy1 + radius * 4 + 12)
            .text("ReLU Non-linear Function")
            .style("fill", "gray")
            .style("font-size", "8px")
            .attr("class", "procVis"); 

        relu.on("mouseover", function(event, d){
            const [x, y] = d3.pointer(event);

            //set-up the paramtere for the math displayer
           drawActivationExplanation(
            x, y, "ReLU Non-Linear Function",
            "f(x) = max(0, x)", "some description about relu"
            );
            
        });

        relu.on("mouseout", function(){
            d3.selectAll(".math-displayer").remove();
        });
}

export function drawTanh(
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

        d3.xml("./assets/SVGs/tanh.svg").then(function (data) {
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

        relu.append("text")
            .attr("x", cx1 - 20)
            .attr("y", cy1 + radius * 4 + 12)
            .text("Tanh Non-linear Function")
            .style("fill", "gray")
            .style("font-size", "8px")
            .attr("class", "procVis"); 

        relu.on("mouseover", function(event, d){
            const [x, y] = d3.pointer(event);

            //set-up the paramtere for the math displayer
           drawActivationExplanation(
            x, y, "Tanh Non-Linear Function",
            "f(x) = (e^x - e^(-x)) / (e^x + e^(-x))", "some description about tanh"
            );
            
        });

        relu.on("mouseout", function(){
            d3.selectAll(".math-displayer").remove();
        });
}

//-----------------------------animation functions for poolingVisClick----------------------------------
export function drawOutputVisualizer(
    result:number[],
    g1:any,
    one:any,
    rectH:number,
    myColor:any
){
    for (let m = 0; m < result.length; m++) {
        g1.append("rect")
            .attr("x", one[0][0] + rectH * m)
            .attr("y", one[0][1])
            .attr("width", rectH)
            .attr("height", rectH)
            .attr("fill", myColor(result[m]))
            .attr("opacity", 1)
            .attr("stroke", "gray")
            .attr("stroke-width", 0.1)
            .attr("class", "procVis");
    }
}


export function drawPathInteractiveComponents(
    endCoord:any,
    resultCoord:any,
    result:number[],
    myColor:any,
    clockwise:number=0
){
    let pathMap: any = [];
    for (let j = 0; j < endCoord.length; j++) {
        let temPathMap = [];
        for (let i = 0; i < resultCoord.length; i++) {
            const path = d3
                .select(".mats")
                .append("path")
                .attr("d", function () {
                    return [
                        "M",
                        endCoord[j][0],
                        endCoord[j][1],
                        "A",
                        (resultCoord[i][0] - endCoord[j][0]) / 2,
                        ",",
                        (resultCoord[i][0] - endCoord[j][0]) / 4,
                        0,
                        0,
                        ",",
                        clockwise,
                        ",",
                        resultCoord[i][0],
                        ",",
                        resultCoord[i][1],
                    ].join(" ");
                })
                .attr("class", "procVis")
                .style("fill", "none")
                .style("opacity", "0.1")
                .attr("stroke", myColor(result[j]));

            temPathMap.push(path.node());
        }
        pathMap.push(temPathMap);
    }
    let yOffset = - clockwise*70;
    if(clockwise==0)yOffset = 80;
    const label = d3.select(".mats").append("text")
        .attr("x", (resultCoord[0][0]+endCoord[endCoord.length-1][0])/2-20)
        .attr("y", (resultCoord[0][1]+endCoord[endCoord.length-1][1])/2 +yOffset)
        .text("Softmax")
        .style("fill", "gray")
        .style("font-size", "8px")
        .attr("class", "procVis"); 
    return pathMap;
}

export function drawPathBtwOuputResult(one:any, endPt:any){
    d3.select(".mats")
            .append("path")
            .attr("d", d3.line()([one[0], endPt]))
            .attr("stroke", "black")
            .attr("opacity", 1)
            .attr("fill", "none")
            .attr("class", "procVis")
            .attr("id", "path1").lower();
}

export function drawBiasPathOutputVis(
    biasCoord:any,
    controlPts:any,
    feaCoord:any
){
    const curve = d3.line().curve(d3.curveBasis);
    d3.select(".mats")
                        .append("path")
                        .attr(
                            "d",
                            curve([
                                biasCoord[0],
                                controlPts[0],
                                controlPts[1],
                                feaCoord,
                            ])
                        )
                        .attr("stroke", "black")
                        .attr("opacity", 0.05)
                        .attr("fill", "none")
                        .attr("class", "procVis biasPath")
                        .attr("id", "path1");
                    d3.selectAll(".biasPath")
                        .transition()
                        .duration(1000)
                        .attr("opacity", 1);
}



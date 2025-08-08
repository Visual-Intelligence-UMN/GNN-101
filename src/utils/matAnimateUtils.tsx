import * as d3 from "d3";
import { computeMids, computeMidsVertical, markCellsConnectedToPath } from "./matFeaturesUtils";
import { injectPlayButtonSVG, injectSVG } from "./svgUtils";
import {
    drawActivationExplanation,
    drawAttnDisplayer,
    drawDotProduct,
    drawEScoreEquation,
} from "./matInteractionUtils";
import { create, all, transposeDependencies, flatten } from "mathjs";
import {
    drawPoints,
    flipHorizontally,
    flipVertically,
    rotateMatrixCounterClockwise,
    transposeAnyMatrix,
} from "./utils";
import { drawHintLabel, drawMatrixValid, rotateAnyMatrix, rotateMatrix } from "./matHelperUtils";
import { off } from "node:process";
import { computeAttnStep } from "./computationUtils";
import { removeDuplicatesFromSubarrays, removeDuplicateSubarrays } from "./graphDataUtils";
import { roundToTwo } from "@/components/WebUtils";

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
    },
};

export function runAnimations(index: number, animations: any) {
    if (index < animations.length) {
        const { func, delay } = animations[index];
        setTimeout(() => {
            func();
            runAnimations(index + 1, animations);
        }, delay);
    } else {
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
    coordFeatureVis: any,
    rectH: number,
    rectW: number,
    dummy: any,
    g: any,
    weightMatrixPostions: any,
    X: any
) {
    d3.selectAll("#tempath").remove();
    d3.selectAll(".matmul-displayer").remove();
    g.append("rect")
        .attr("x", coordFeatureVis[0] + rectW * currentStep)
        .attr("y", coordFeatureVis[1] - rectH / 2)
        .attr("width", rectW)
        .attr("height", rectH)
        .attr("fill", myColor(dummy[currentStep]))
        .attr("opacity", 1)
        .attr("stroke", "gray")
        .attr("stroke-width", 0.1)
        .attr("class", "procVis removeRect interactRect")
        .attr("rectID", currentStep)
        .lower();

    drawMatrixWeight(
        Xt,
        startCoordList,
        endCoordList,
        curveDir,
        currentStep,
        myColor,
        weightMatrixPostions,
        featureChannels
    );
    d3.selectAll("#tempath").lower();

    drawDotProduct(
        dummy,
        currentStep,
        X,
        Xt,
        curveDir,
        coordFeatureVis,
        myColor
    );

    d3.selectAll(".interactRect").on("mouseover", function () {
        const rectID = d3.select(this).attr("rectID");

        d3.select(".wMatLink").style("opacity", 0.3);
        d3.selectAll(".interactRect").style("opacity", 0);
        d3.selectAll(".weight-matrix-frame").style("opacity", 0);

        d3.selectAll(".interactRect").style("opacity", 0.5);
        d3.select(`.interactRect[rectID="${rectID}"]`)
            .style("opacity", 1)
            .style("stroke", "black")
            .style("stroke-width", 1);
        drawMatrixWeight(
            Xt,
            startCoordList,
            endCoordList,
            curveDir,
            Number(rectID),
            myColor,
            weightMatrixPostions,
            featureChannels,
            "weightPath"
        );
        d3.selectAll(".columnGroup").style("opacity", 0.5);
        d3.select(`#columnGroup-${rectID}`).style("opacity", 1);

        d3.select(`#columnUnit-${Number(rectID) - 1}`).style("opacity", 0);
        d3.select(`#columnUnit-${rectID}`).style("opacity", 1).raise();
        drawDotProduct(
            dummy,
            rectID,
            X,
            Xt,
            curveDir,
            coordFeatureVis,
            myColor
        );
    });
    d3.selectAll(".interactRect").on("mouseout", function () {
        const rectID = d3.select(this).attr("rectID");

        d3.select(".wMatLink").style("opacity", 1);

        d3.selectAll(".interactRect").style("opacity", 1);
        d3.selectAll(".weight-matrix-frame").style("opacity", 1);
        d3.selectAll(".columnGroup").style("opacity", 1);


        d3.selectAll(".columnUnit").style("opacity", 0);
        d3.selectAll(".interactRect")
            .style("opacity", 1)
            .style("stroke", "gray")
            .style("stroke-width", 0.1);
        d3.selectAll("#weightPath").remove();
        d3.selectAll(".matmul-displayer").remove();
    });

    d3.selectAll(".interactRect").style("pointer-events", "none");
}
/**
 * 在 (x, y) 位置绘制一个“Matmul Visualization”风格的 Tooltip。
 * @param x 鼠标或想放置的 X 坐标
 * @param y 鼠标或想放置的 Y 坐标
 * @param rowVector  行向量（如 [1, 0, 0, ...]）
 * @param colVector  列向量（如 [0.02, 0.61, ...]）
 * @param result     计算结果 (rowVector ⋅ colVector)
 */
export function showMatmulTooltip(
    x: number,
    y: number,
    rowVector: number[],
    colVector: number[],
    result: number
  ) {
    const tooltipWidth = 300;
    const tooltipHeight = 120;
  
    // 1. 在 .mats 容器里创建 tooltip group
    const tooltip = d3.select(".mats")
      .append("g")
      .attr("class", "matmul-tooltip")
      .style("filter", "drop-shadow(2px 2px 3px rgba(0,0,0,0.2))"); // 阴影
  
    // 2. 绘制 tooltip 背景
    tooltip.append("rect")
      .attr("x", x)
      .attr("y", y)
      .attr("width", tooltipWidth)
      .attr("height", tooltipHeight)
      .attr("rx", 10)  // 圆角
      .attr("ry", 10)
      .style("fill", "white")
      .style("stroke", "black")
      .style("stroke-width", 1);
  
    // 3. 标题
    tooltip.append("text")
      .text("Matmul Visualization")
      .attr("x", x + 15)
      .attr("y", y + 25)
      .style("font-size", "16px")
      .style("font-weight", "bold");
  
    // 4. 表达式区域
    const exprGroup = tooltip.append("g")
      .attr("transform", `translate(${x + 15}, ${y + 40})`);
  
    // 4.1 “dot(” 文本
    exprGroup.append("text")
      .text("dot(")
      .style("font-size", "14px")
      .attr("x", 0)
      .attr("y", 0);
  
    // 4.2 绘制 rowVector
    const rectSize = 10;
    const vectorGroup = exprGroup.append("g")
      .attr("transform", `translate(40, -10)`);
  
    vectorGroup.selectAll("rect")
      .data(rowVector)
      .enter()
      .append("rect")
      .attr("x", (_, i) => i * (rectSize + 1))
      .attr("width", rectSize)
      .attr("height", rectSize)
      .style("fill", d => d > 0 ? "purple" : "#ccc")
      .style("stroke", "black")
      .style("stroke-width", 0.5);
  
    // 4.3 逗号
    exprGroup.append("text")
      .text(",")
      .style("font-size", "14px")
      .attr("x", 40 + rowVector.length * (rectSize + 1) + 5)
      .attr("y", 0);
  
    // 4.4 绘制 colVector
    const colGroup = exprGroup.append("g")
      .attr("transform", `translate(${40 + rowVector.length * (rectSize + 1) + 15}, -10)`);
  
    colGroup.selectAll("rect")
      .data(colVector)
      .enter()
      .append("rect")
      .attr("y", (_, i) => i * (rectSize + 1))
      .attr("width", rectSize)
      .attr("height", rectSize)
      .style("fill", d => d > 0.3 ? "purple" : (d > 0 ? "green" : "#ccc"))
      .style("stroke", "black")
      .style("stroke-width", 0.5);
  
    // 4.5 “)” 文本
    const bracketX = 40 + rowVector.length * (rectSize + 1) + 15 + rectSize + 5;
    exprGroup.append("text")
      .text(")")
      .style("font-size", "14px")
      .attr("x", bracketX)
      .attr("y", 0);
  
    // 4.6 “= ...” 文本
    exprGroup.append("text")
      .text(`= ${result.toFixed(3)}`)
      .style("font-size", "14px")
      .style("font-weight", "bold")
      .attr("x", bracketX + 15)
      .attr("y", 0);
  
    // 5. 详细过程：如 1×0.02 + 0×0.61 ...
    const detailText = exprGroup.append("text")
      .attr("x", 0)
      .attr("y", 30)
      .style("font-size", "12px");
  
    // 构造一个字符串，演示 rowVector[i] × colVector[i]
    const steps = rowVector.map((rv, i) => `${rv.toFixed(2)}×${colVector[i].toFixed(2)}`);
    const formulaStr = steps.join(" + ");
  
    detailText.append("tspan")
      .text(`= ${formulaStr}`)
      .attr("x", 0)
      .attr("dy", "1.2em");
  
    detailText.append("tspan")
      .text(`= ${result.toFixed(3)}`)
      .attr("x", 0)
      .attr("dy", "1.2em")
      .style("font-weight", "bold");
  }
  

export function drawMatrixWeight(
    Xt: any,
    startCoordList: any,
    endCoordList: any,
    curveDir: number,
    currentStep: number,
    myColor: any,
    weightMatrixPostions: any,
    featureChannels: number,
    id: string = "tempath",
    mode: string = "normal"
) {
    console.log("draw matrix weight", Xt, startCoordList);
    let flag = true;

    

    if (
        Xt[0].length != Xt.length &&
        (!(Xt[0].length == 2 && Xt.length == 64) ||
            !(Xt[0].length == 4 && Xt.length == 2))
    ) {
        //weightMatrixPostions = transposeAnyMatrix(weightMatrixPostions);
        flag = false;

        const math = create(all, {});
        Xt = math.transpose(Xt);
    }
    // if((Xt[0].length==2 && Xt.length==64)
    //     ||(Xt[0].length==4 && Xt.length==2)
    // ){
    //     const math = create(all, {});
    //     Xt = math.transpose(Xt);
    // }

    console.log("draw matrix weight - Xt", Xt, weightMatrixPostions);

    if(weightMatrixPostions.length == 2 && weightMatrixPostions[0].length == 16) {

    }

    if (
        weightMatrixPostions.length == 4 &&
        weightMatrixPostions[0].length == 2
    ) {
        const math = create(all, {});
        Xt = math.transpose(math.transpose(Xt));
    }

    // Xt = flipVertically(Xt);

    // adjust matrix value alignment for simulated models

    //adjust matrix value alignment for GCNConv - square weight matri
    if (Xt[0].length == Xt.length) {
        Xt = rotateMatrixCounterClockwise(Xt);
        Xt = flipHorizontally(Xt);
    }

    if (Xt[0].length == 2 && Xt.length == 4) {
        Xt = flipVertically(Xt);
        // Xt = flipHorizontally(Xt);
    }

    if (Xt.length == 64 && Xt[0].length == 7) {
        Xt = flipVertically(Xt);
        Xt = flipHorizontally(Xt);
    }
    if (Xt.length == 5 && Xt[0].length == 16) {
        Xt = rotateAnyMatrix(Xt);
        
    }

    // if(Xt.length === 4 && Xt[0].length === 16){
    //     Xt = rotateAnyMatrix(Xt);
    // }

    //drawMatrixValid(Xt, startCoordList[0][0], startCoordList[0][1]+20,\ 10, 10)

    

    let Xv = Xt[currentStep];

    console.log("draw matrix weight - Xv", Xt, Xv, weightMatrixPostions);

    for (let j = 0; j < Xv.length; j++) {
        let s1 = startCoordList[j];
        let e1 = endCoordList[currentStep];

        if (curveDir == 1) {
            s1 = startCoordList[startCoordList.length - j - 1];
            e1 = endCoordList[currentStep];
        }

        let m1 = [0, 0];

        let changed = false;

        

        if (
            weightMatrixPostions.length == 4 &&
            weightMatrixPostions[0].length == 2
        ) {
            m1 =
                weightMatrixPostions[weightMatrixPostions.length - 1 - j][
                currentStep
                ];

            changed = true;
        }

        if (
            weightMatrixPostions.length == 2 &&
            weightMatrixPostions[0].length == 4
        ) {
            m1 = weightMatrixPostions[j][currentStep];

            changed = true;
        }

        if (
            Xt.length == Xt[0].length ||
            (Xt.length == 64 && Xt[0].length == 7)
        ) {
            m1 =
                weightMatrixPostions[weightMatrixPostions.length - 1 - j][
                currentStep
                ];

            changed = true;
        }

        if (
            (Xt.length == Xt[0].length && Xt.length == 4) ||
            (Xt[0].length == 34 && Xt.length == 4) ||
            (Xt.length == 34 && Xt[0].length == 4)
        ) {
            m1 =
                weightMatrixPostions[weightMatrixPostions.length - 1 - j][
                currentStep
                ];

            changed = true;
        }

        if (Xt.length > 80 || Xt[0].length > 80) {
            //if(curveDir==-1){
            m1 =
                weightMatrixPostions[weightMatrixPostions.length - 1 - j][
                currentStep
                ];
            //}
            // else{ m1 = weightMatrixPostions[j][currentStep]}

            console.log("signal 3", curveDir);
            changed = true;
        }

        

        if (!changed) {
            if (
                (Xt[0].length < Xt.length && Xt.length != 64) ||
                (Xt[0].length == 64 && Xt.length == 2)
            ) {
                if (curveDir == -1)
                    m1 =
                        weightMatrixPostions[
                        weightMatrixPostions.length - 1 - j
                        ][currentStep];
                else m1 = weightMatrixPostions[j][currentStep];

                console.log("signal 1");
            } else {
                if (curveDir == -1) m1 = weightMatrixPostions[j][currentStep];
                else
                    m1 =
                        weightMatrixPostions[
                        weightMatrixPostions.length - 1 - j
                        ][currentStep];

                console.log("signal 2");
            }
        }

        if(Xt.length == 16 && Xt[0].length == 5) {
            console.log("signal 4");
            if(curveDir == -1) {
                m1 =
                        weightMatrixPostions[weightMatrixPostions.length - 1 - j][currentStep];
            } else {
                m1 =
                        weightMatrixPostions[
                        weightMatrixPostions.length - 1 - j
                        ][currentStep];
            }
        }

        if(weightMatrixPostions.length == 16 && weightMatrixPostions[0].length == 2) {
if (curveDir == -1) m1 = weightMatrixPostions[
                        weightMatrixPostions.length - 1 - j
                        ][currentStep];
                else
                    m1 = weightMatrixPostions[j][currentStep];
console.log("signal 5");
        }

        if(weightMatrixPostions.length == 16 && weightMatrixPostions[0].length == 4){
            console.log("inside aaa", weightMatrixPostions[currentStep])
            console.log("signal 6");
            
if (curveDir == -1) {
    m1 = weightMatrixPostions[
                        j
                        ][currentStep];
                    console.log("signal 6-1");
                    }
                else
                    {
                        m1 = weightMatrixPostions[j][currentStep];
                        console.log("signal 6-2");
                    }
        }

        let controlPoint1 = [s1[0], m1[1]];
        let controlPoint2 = [e1[0], m1[1]];

        const pathData1 = `
            M${s1[0]},${s1[1]}
            Q${controlPoint1[0]},${controlPoint1[1]} ${m1[0]},${m1[1]}
        `;

        const pathData2 = `
            M${m1[0]},${m1[1]}
            Q${controlPoint2[0]},${controlPoint2[1]} ${e1[0]},${e1[1]}
        `;

        // Append the paths to the SVG
        d3.select(".mats")
            .append("path")
            .attr("d", pathData1)
            .attr("class", "procVis")
            .style("fill", "none")
            .attr("stroke", "black")
            .attr("id", id)
            .attr("stroke-width", 2)
            .attr("stroke", myColor(Xv[j]))
            .lower();

        d3.select(".mats")
            .append("path")
            .attr("d", pathData2)
            .attr("class", "procVis")
            .style("fill", "none")
            .attr("stroke", "black")
            .attr("id", id)
            .attr("stroke-width", 2)
            .attr("stroke", myColor(Xv[j]))
            .lower();
    }
}

export function drawAttentions(
    g1: any,
    X: any,
    coordFeatureVis: any,
    w: number,
    rectH: number,
    myColor: any,
    posList: any,
    mulValues: any,
    curveDir: number,
    layerID: number, //layer index_0->layer_1, index_1-> layer_2
    featuresTable: any,
    lgIndices: number[][],
    mergedNodes: number[]
) {
    //learnable vectors
    const learnableData = require("../../public/learnableVectorsGAT.json");
    const learnableVectors = [
        [learnableData["conv1_att_dst"], learnableData["conv1_att_src"]],
        [learnableData["conv2_att_dst"], learnableData["conv2_att_src"]]
    ];

    if (layerID == 0) {
        mergedNodes = mergedNodes.sort((a, b) => a - b);
        for (let i = 0; i < lgIndices.length; i++) {
            for (let j = 0; j < lgIndices[0].length; j++) {
                lgIndices[i][j] = mergedNodes[lgIndices[i][j]];
            }
        }
    }
    console.log("lg lg", lgIndices)


    const g = g1.append("g").attr("class", "procVis aggregate");
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
    drawHintLabel(
        g1,
        coordFeatureVis[0],
        coordFeatureVis[1] + rectH * curveDir * 1.1,
        "Vector Summation",
        "procVis"
    );

    //path connect - connect prev layer feature vis to intermediate feature vis

    const curve = d3.line().curve(d3.curveBasis);
    posList = removeDuplicateSubarrays(posList);
    console.log("poslist", posList, mulValues);
    for (let i = 0; i < posList.length; i++) {
        const res = computeMids(posList[i], coordFeatureVis);
        const hpoint = res[0];
        const lpoint = res[1];

        const attnPath = d3.select(".mats")
            .append("path")
            .attr("d", curve([posList[i], hpoint, lpoint, coordFeatureVis]))
            .attr("stroke", myColor(mulValues[i]))
            .attr("opacity", 1)
            .attr("fill", "none")
            .attr("class", "procVis summation");

        console.log("eij attnPath", attnPath)

        //draw multipliers
        let x = (coordFeatureVis[0] - posList[i][0]) / 2 + posList[i][0];
        let y = (coordFeatureVis[1] - posList[i][1]) / 2 + posList[i][1];

        const gradient = g1
            .append("defs")
            .append("linearGradient")
            .attr("id", "text-gradient")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "100%")
            .attr("y2", "0%");

        // 设置渐变的颜色
        gradient.append("stop").attr("offset", "0%").attr("stop-color", "pink");

        gradient
            .append("stop")
            .attr("offset", "100%")
            .attr("stop-color", "blue");

        d3.select(".mats")
            .append("text")
            .text(mulValues[i].toFixed(2))
            .attr("x", posList[i][0] + 5)
            .attr("y", posList[i][1] + 5)
            .attr("text-anchor", "start")
            .attr("fill", "url(#text-gradient)")
            .attr("font-size", 15)
            .attr("class", "procVis attention")
            .attr("opacity", 1)
            .attr("font-weight", "bold").attr("attn-index", i);
    }
    d3.selectAll(".summation").transition().duration(100).attr("opacity", 1);

    let extendAttnView = false;

    d3.selectAll(".attention").on("click", function (event: any, d: any) {
        event.stopPropagation();
        d3.select(this).attr("font-size", 30);

        const attnScore = Number(d3.select(this).text());

        extendAttnView = true;

        //extend the math-displayer
        const dX: number = Number(d3.select(this).attr("x"));
        const dY: number = Number(d3.select(this).attr("y"));

        const dstVector = learnableVectors[layerID][0];
        const srcVector = learnableVectors[layerID][1];

        const weightMatrix = require("../../public/gat_link_weights.json");
        const weightMatrices = [
            weightMatrix["conv1.lin_l.weight"],
            weightMatrix["conv2.lin_l.weight"]
        ]
        //const eij = Array.from({ length: 3 }, () => Math.random());
        let eij: any = [];
        console.log("push eij before", lgIndices)
        for (let i = 0; i < lgIndices.length; i++) {
            eij.push(0);
            console.log("push eij", i, eij);
        }

        const ithIdx = Number(d3.select(this).attr("attn-index"));
        const targetE = eij[ithIdx];

        console.log("eij", ithIdx, eij, targetE);

        const attnDisplayer = d3
            .select(".mats")
            .append("g")
            .attr("class", "procVis attn-displayer");

        drawAttnDisplayer(attnDisplayer, dX, dY, eij, lgIndices, targetE, myColor, ithIdx, attnScore);

        d3.selectAll(".attnE").on("mouseover", function () {
            const targetIdx = Number(d3.select(this).attr("index"));
            d3.selectAll(".e-displayer").remove();
            const eDisplayer = attnDisplayer
                .append("g")
                .attr("class", "procVis e-displayer attn-displayer");

            console.log(`e_${targetIdx}_${lgIndices[targetIdx][1]} = LeakyReLU(                            +                        )`, lgIndices)
            const inputVector = featuresTable[layerID][Number(d3.select(this).attr("index"))];
            let jthIndexElement = lgIndices[targetIdx][1];
            if (d3.select(this).classed("attnTargetE")) {
                jthIndexElement = lgIndices[ithIdx][1];
                console.log("jthIndexElement", jthIndexElement, ithIdx, lgIndices);
            }
            drawEScoreEquation(lgIndices, eDisplayer, jthIndexElement, dX, dY, dstVector, srcVector, myColor, inputVector, layerID);
        });

        //add initial e-score equation:
        const eDisplayer = attnDisplayer
            .append("g")
            .attr("class", "procVis e-displayer attn-displayer");
        const inputVector = featuresTable[layerID][Number(d3.select(this).attr("index"))];
        let jthIndexElement = lgIndices[ithIdx][1];
        drawEScoreEquation(lgIndices, eDisplayer, jthIndexElement, dX, dY, dstVector, srcVector, myColor, inputVector, layerID);

        //recover the .mats event
        let recoverEvent: any = d3.select(".mats").on("click");

        d3.selectAll(".mats").on("click", function (event: any, d: any) {
            if (extendAttnView) {
                d3.selectAll(".attn-displayer").remove();

                event.stopPropagation();
                d3.selectAll(".attention").attr("font-size", 15);
                extendAttnView = false;
                d3.selectAll(".mats")
                    .style("pointer-events", "auto")
                    .on("click", recoverEvent);
            }
        });
    });

    d3.selectAll(".attention").on("mouseover", function () {
        d3.select(this).style("stroke", "black").attr("stroke-width", 0.02);
        // .attr("font-size", 30);
    });
    d3.selectAll(".attention").on("mouseout", function () {
        d3.select(this).style("stroke", "none");
        //.attr("font-size", 15);
    });
}


export function drawSamplingAggregation(
    g1: any,
    X: any,
    coordFeatureVis: any,
    w: number,
    rectH: number,
    myColor: any,
    posList: any,
    mulValues: any,
    curveDir: number,
    lgIndices: number[],
    actualIndices: number[]
) {
    console.log("lgIndices lg", lgIndices);
    const samplingIndices = require("../../public/sampling.json");

    const g = g1.append("g").attr("class", "aggregate");
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
    drawHintLabel(
        g1,
        coordFeatureVis[0],
        coordFeatureVis[1] + rectH * curveDir * 1.1,
        `Mean Aggregator: 1 x ${X.length}`,
        "procVis"
    );

    //path connect - connect prev layer feature vis to intermediate feature vis
    const curve = d3.line().curve(d3.curveBasis);
    for (let i = 0; i < posList.length; i++) {
        const res = computeMids(posList[i], coordFeatureVis);
        const hpoint = res[0];
        const lpoint = res[1];

        const path = d3.select(".mats")
            .append("path")
            .attr("d", curve([posList[i], hpoint, lpoint, coordFeatureVis]))
            .attr("stroke", myColor(mulValues[i]))
            .attr("opacity", 0)
            .attr("fill", "none")
            .attr("class", "procVis summation")
            .attr("id", "procPath");

        console.log("poslist", posList[i])

        //draw multipliers
        d3.select(".mats")
            .append("text")
            .text(mulValues[i].toFixed(2))
            .attr("x", posList[i][0] + 5)
            .attr("y", posList[i][1] + 5)
            .attr("text-anchor", "middle")
            .attr("font-size", 7.5)
            .attr("class", "procVis multiplier")
            .attr("opacity", 0);

        if ((samplingIndices.includes(actualIndices[lgIndices[i]]))) {
            path.attr("stroke", "gray").attr("stroke-dasharray", "3,2");
            const sampling = g1.append("g");
            injectSVG(sampling, posList[i][0], posList[i][1] - 8.5, "./assets/SVGs/sampling.svg", "procVis sampling");
            drawHintLabel(
                sampling,
                posList[i][0] - 55,
                posList[i][1] + 22,
                "Removed from Sampling during Training Stage",
                "procVis",
                "10px"
            );

            sampling.on("mouseover", function (event: any, d: any) {
                const [x, y] = d3.pointer(event);

                //set-up the paramtere for the math displayer
                drawActivationExplanation(
                    x,
                    y,
                    "Neighborhood Sampling",
                    "This notation indicate this node",
                    " was removed during training stage.",
                    480
                );
            });

            sampling.on("mouseout", function () {
                d3.selectAll(".math-displayer").remove();
            });

        }


    }
    d3.selectAll(".summation").transition().duration(100).attr("opacity", 1);
    d3.select(".aggregate").on("mouseover", function () {
        d3.selectAll(".multiplier").style("opacity", 1);
    });
    d3.select(".aggregate").on("mouseout", function () {
        d3.selectAll(".multiplier").style("opacity", 0);
    });
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
    curveDir: number,
    adjList: any,
    dList: any,
    featuresTable: any,
    layerID: number,
    node: number
  ) {
    const g = g1.append("g").attr("class", "aggregatedFeatureGroup");
    g.selectAll("rect.summation-rect")
      .data(X as number[])
      .enter()
      .append("rect")
      .attr("x", (d: number, i: number) => coordFeatureVis[0] + w * i)
      .attr("y", coordFeatureVis[1] - rectH / 2)
      .attr("width", w)
      .attr("height", rectH)
      .attr("fill", (d: number) => myColor(d))
      .attr("opacity", 1)
      .attr("stroke", "gray")
      .attr("stroke-width", 0.1)
      .attr("class", "procVis summation-rect")
      .attr("data-index", (d: number, i: number) => i)
      .on("mouseover", function (this: SVGRectElement, event: any, d: number) {
        event.stopPropagation();
        const [x, y] = d3.pointer(event);
        
        const idx = +d3.select(this).attr("data-index");
    
        d3.select(this)
          .attr("stroke", "black")
          .attr("stroke-width", 2);
    
        d3.selectAll(".summation-tooltip").remove();
    
        const tooltip = d3.select(".mats").append("g").attr("class", "summation-tooltip procVis");
        const tooltipHeight = 30 * (adjList[node].length + 2);
        tooltip.append("rect")
          .attr("x", x + 10)
          .attr("y", y - 40)
          .attr("width", 300)
          .attr("height", tooltipHeight)
          .attr("rx", 5)
          .attr("ry", 5)
          .style("fill", "white")
          .style("stroke", "black");
    
        let steps = adjList[node].map((node_j: any) => {
          let mulV = 1 / Math.sqrt(dList[node] * dList[node_j]);
          let featureValue = featuresTable[layerID][node_j][idx];
          return `(${featureValue.toFixed(3)} × ${mulV.toFixed(3)})`;
        });
        let textData: string[] = [];
        textData.push(`X[${idx}] = Σ [`);
        steps.forEach((step: string, i: number) => {
          textData.push(i < steps.length - 1 ? step + " +" : step);
        });
        textData.push(`] = ${d.toFixed(3)}`);
        // let textElement = tooltip.append("text")
        //   .attr("x", x + 50)
        //   .attr("y", y - 20)
        //   .style("font-size", "17px")
        //   .style("font-family", "monospace");
        // textData.forEach((line, i) => {
        //   textElement.append("tspan")
        //     .attr("x", x + 20)
        //     .attr("dy", i === 0 ? 0 : "1.2em")
        //     .text(line);
        // });


        const lines = textData;
        const my = y;
        const mx = x;
        const rectL = 25;
        const lastNum = Number(lines[lines.length - 1].match(/-?\d*\.?\d+/g));
        const balancedY = Array.isArray(lines) ? lines.length / 2 * 30 + my - 45 : my - 45;
        const lastHalfX = mx + 200
        // console.log("LastNum", lastNum);
        tooltip.append("text")
            .attr("x", mx + 20)
            .attr("y", balancedY)
            .attr("font-family", "monospace")
            .style("font-size", "20px")
            .style("fill", "black")
            .text("Sum(")
            .attr("class", "math-displayer")
            .attr("font-weight", "bold");

        lines.forEach((line: any, i: number) => {
            const numbers = line.match(/-?\d*\.?\d+/g);
            // console.log("numbers", numbers);
    
            if (numbers && numbers.length === 2) {
                const value0 = Number(numbers[0]);
                const value1 = Number(numbers[1]);
                const xOffset = mx + 80;          // Horizontal base position
                const yOffset = i * 30 + my - 45;      // Vertical position for this row
            
                // Rectangle and text for numbers[0]
                tooltip.append("rect")
                    .attr("x", xOffset)
                    .attr("y", yOffset)
                    .attr("width", rectL)
                    .attr("height", rectL)
                    .style("stroke", "black")
                    .attr("fill", myColor(value0))
                    .attr("class", "math-displayer");
            
                tooltip.append("text")
                    .attr("x", xOffset + rectL / 2)
                    .attr("y", yOffset + rectL / 2 + 2)
                    .text(roundToTwo(value0))
                    .attr("class", "math-displayer")
                    .attr("text-anchor", "middle")
                    .attr("font-size", "10px")
                    .attr("font-family", "monospace")
                    .attr("fill", Math.abs(value0) > 0.7 ? "white" : "black");
            
                // Rectangle and text for numbers[1], 50px to the right of xOffset
                tooltip.append("rect")
                    .attr("x", xOffset + 70)
                    .attr("y", yOffset)
                    .attr("width", rectL)
                    .attr("height", rectL)
                    .style("stroke", "black")
                    .attr("fill", myColor(value1))
                    .attr("class", "math-displayer");
            
                tooltip.append("text")
                    .attr("x", xOffset + 70 + rectL / 2)
                    .attr("y", yOffset + rectL / 2 + 2)
                    .text(roundToTwo(value1))
                    .attr("class", "math-displayer")
                    .attr("text-anchor", "middle")
                    .attr("font-size", "10px")
                    .attr("font-family", "monospace")
                    .attr("fill", Math.abs(value1) > 0.7 ? "white" : "black");
            
                // Comma between the two
                tooltip.append("text")
                    .attr("x", xOffset + rectL + 15)
                    .attr("y", yOffset + rectL / 2 + 7)
                    .text("X")
                    .attr("class", "math-displayer")
                    .attr("font-size", "17px")
                    .attr("fill", "black");
                
                tooltip.append("text")
                    .attr("x", xOffset + rectL + 75)
                    .attr("y", yOffset + rectL / 2 + 7)
                    .text(",")
                    .attr("class", "math-displayer")
                    .attr("font-family", "monospace")
                    .attr("font-size", "17px")
                    .attr("font-weight", "bold")
                    .attr("fill", "black");
                
            }
            
            
            
        });
        tooltip.append("text")
        .attr("x", lastHalfX)
        .attr("y", balancedY)
        .attr("font-family", "monospace")
        .style("font-size", "20px")
        .style("fill", "black")
        .text(") =")
        .attr("class", "math-displayer")
        .attr("font-weight", "bold");

        tooltip.append("rect")
        .attr("x", lastHalfX + 45)
        .attr("y", balancedY -(rectL / 2 + 2) - 5)
        .attr("width", rectL)
        .attr("height", rectL)
        .style("stroke", "black")
        .attr("fill", myColor(lastNum))
        .attr("class", "math-displayer");

    tooltip.append("text")
        .attr("x", lastHalfX + 45 + rectL / 2)
        .attr("y", balancedY - 5)
        .text(roundToTwo(lastNum))
        .attr("class", "math-displayer")
        .attr("text-anchor", "middle")
        .attr("font-size", "10px")
        .attr("font-family", "monospace")
        .attr("fill", Math.abs(lastNum) > 0.7 ? "white" : "black");





    
        adjList[node].forEach((node_j: any) => {
            d3.selectAll(".inputFeatureRect")
              .filter(function() {
                const cellIdx = d3.select(this).attr("data-index");
                const cellNode = d3.select(this).attr("data-node");
                return cellIdx === String(idx) && cellNode === String(node_j);
              })
              .attr("stroke", "black")
              .attr("stroke-width", 2);
    
            d3.selectAll(".multiplier")
              .filter(function() {
                
                const textNode = d3.select(this).attr("data-node");
                return textNode === String(node_j);
              })
              .transition()
              .duration(300)
              .attr("font-size", "10px"); 
          });
      })
      .on("mouseout", function (this: SVGRectElement, event: any, d: number) {
        d3.select(this)
          .attr("stroke", "gray")
          .attr("stroke-width", 0.1);
        d3.selectAll(".summation-tooltip").remove();
        d3.selectAll(".inputFeatureRect")
          .attr("stroke", "gray")
          .attr("stroke-width", 0.5);
        d3.selectAll(".multiplier")
            .transition()
            .duration(300)
            .attr("font-size", "7.5px");
      });
  
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
    const dim = X.length;
  
    //draw label
    drawHintLabel(
      g1,
      coordFeatureVis[0],
      coordFeatureVis[1] + rectH * curveDir * 1.1,
      `Vector Summation^T: 1 x ${dim}`,
      "procVis"
    );
  
    // 给 Hint Label 添加鼠标交互
    d3.select(".aggregatedFeatureGroup") 
      .style("pointer-events", "all")
      .style("cursor", "pointer")
      .on("mouseover", function (event) {
        event.stopPropagation();
        const [x, y] = d3.pointer(event);
        d3.selectAll(".matmul-tooltip").remove();
  
        
        const tooltip = d3
          .select(".mats")
          .append("g")
          .attr("class", "multiplier-tooltip procVis");
  
        tooltip
          .append("rect")
          .attr("x", x + 10)
          .attr("y", y - 40)
          .attr("width", 400)
          .attr("height", 100)
          .attr("rx", 5)
          .attr("ry", 5)
          .style("fill", "white")
          .style("stroke", "black");
  
        tooltip
          .append("text")
          .attr("x", x + 20)
          .attr("y", y - 20)
          .style("font-size", "12px")
          .style("font-family", "monospace")
          .selectAll("tspan")
          .data(() => {
            let steps = [];
  
            for (let i = 0; i < adjList[node].length; i++) {
              let node_j = adjList[node][i];
              let mulV = 1 / Math.sqrt(dList[node] * dList[node_j]);
              const prepMat = [...featuresTable[layerID][node_j]];
  
              steps.push(
                `(${prepMat
                  .map((v) => v.toFixed(0))
                  .join(", ")}) × ${mulV.toFixed(3)}`
              );
            }
  
            return [`= Σ [`, ...steps, `]`];
          })
          .enter()
          .append("tspan")
          .attr("x", x + 20) 
          .attr("dy", "1.2em")
          .text((d) => d);
        tooltip
          .append("text")
          .attr("x", x + 20)
          .attr("y", y - 20)
          .text(`Value = [${X.map((v: number) => v.toFixed(3)).join(", ")}]`) 
          .style("font-size", "12px");
      })
      .on("mouseout", function () {
        d3.selectAll(".multiplier-tooltip").remove();
      });
  
    //path connect - connect prev layer feature vis to intermediate feature vis
    const curve = d3.line().curve(d3.curveBasis);
    for (let i = 0; i < posList.length; i++) {
      const res = computeMids(posList[i], coordFeatureVis);
      const hpoint = res[0];
      const node_j = adjList[node][i];
      const lpoint = res[1];
  
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
  
      d3.select(".mats")
        .append("text")
        .text(mulValues[i].toFixed(2))
        .attr("x", posList[i][0] + 7.5)
        .attr("y", posList[i][1])
        .attr("text-anchor", "middle")
        .attr("font-size", 7.5)
        .attr("class", "procVis multiplier")
        .attr("opacity", 1)
        .attr("data-node", node_j);;
    }
    d3.selectAll(".summation").transition().duration(100).attr("opacity", 1);
    // d3.select(".aggregate").on("mouseover", function(){
    //     d3.selectAll(".multiplier").style("opacity", 1);
    // })
    // d3.select(".aggregate").on("mouseout", function(){
    //     d3.selectAll(".multiplier").style("opacity", 0);
    // })
  }

export function drawWeightsVector(
    g: any,
    dummy: any,
    coordFeatureVis: any,
    rectH: number,
    rectW: number,
    myColor: any,
    Xv: number[][],
    startCoordList: any,
    endCoordList: any,
    curveDir: number,
    weightMatrixPostions: any,
    featureChannels: number,
    X: number[],
    rectClass: string = "procVis removeRect wRect interactRect",
    labelName = `Matmul Result: ${dummy.length} x 1`
) {
    console.log("draw matrix weight - 0", startCoordList);
    for (let m = 0; m < dummy.length; m++) {
        g.append("rect")
            .attr("x", coordFeatureVis[0] + rectW * m)
            .attr("y", coordFeatureVis[1] - rectH / 2)
            .attr("width", rectW)
            .attr("height", rectH)
            .attr("fill", myColor(dummy[m]))
            .attr("opacity", 1)
            .attr("stroke", "gray")
            .attr("stroke-width", 0.1)
            .attr("class", rectClass)
            .attr("rectID", m)
            .attr("id", `weightRect${m}`)
            .style("pointer-events", "all")
            .style("cursor", "pointer")
            .on("mouseover", function(this: SVGRectElement, event: any) {
                event.stopPropagation();
                const [x, y] = d3.pointer(event);
                d3.selectAll(".matmul-tooltip").remove();
                
                const tooltip = g
                    .append("g")
                    .attr("class", "matmul-tooltip procVis");
                
                tooltip
                    .append("rect")
                    .attr("x", x + 10)
                    .attr("y", y - 40)
                    .attr("width", 150)
                    .attr("height", 35)
                    .attr("rx", 5)
                    .attr("ry", 5)
                    .style("fill", "white")
                    .style("stroke", "black");
                
                tooltip
                    .append("text")
                    .attr("x", x + 20)
                    .attr("y", y - 20)
                    .text(`Value = ${dummy[m].toFixed(2)}`)
                    .style("font-size", "17px")
                    .style("font-family", "monospace");
            })
            .on("mouseout", function() {
                d3.selectAll(".matmul-tooltip").remove();
            });
    }
    drawHintLabel(
        g,
        coordFeatureVis[0],
        coordFeatureVis[1] + rectH + 6,
        labelName,
        "procVis"
    );

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
    // d3.selectAll(".wRect").transition().duration(100).attr("opacity", 1);



    d3.selectAll(".interactRect").on("mouseover", function () {
        let paintMode = "reverse";
        if (curveDir == -1) paintMode = "normal";

        d3.select(".wMatLink").style("opacity", 0.3);

        const rectID = d3.select(this).attr("rectID");

        d3.selectAll(".columnGroup").style("opacity", 0.5);
        d3.select(`#columnGroup-${rectID}`).style("opacity", 1);

        d3.selectAll(".weight-matrix-frame").style("opacity", 0);

        d3.selectAll(".interactRect").style("opacity", 0.5);
        d3.select(`.interactRect[rectID="${rectID}"]`)
            .style("opacity", 1)
            .style("stroke", "black")
            .style("stroke-width", 1);
        drawMatrixWeight(
            Xv,
            startCoordList,
            endCoordList,
            curveDir,
            Number(rectID),
            myColor,
            weightMatrixPostions,
            featureChannels,
            "weightPath",
            paintMode
        );
        d3.select(`#columnUnit-${Number(rectID) - 1}`).style("opacity", 0);
        d3.select(`#columnUnit-${rectID}`).style("opacity", 1).raise();
        drawDotProduct(
            dummy,
            rectID,
            X,
            Xv,
            curveDir,
            coordFeatureVis,
            myColor
        );
    });
    d3.selectAll(".interactRect").on("mouseout", function () {
        const rectID = d3.select(this).attr("rectID");

        d3.select(".wMatLink").style("opacity", 1);

        d3.selectAll(".columnGroup").style("opacity", 1);

        d3.select(".weight-matrix-frame").style("opacity", 1);

        d3.selectAll(".columnUnit").style("opacity", 0);
        d3.selectAll(".interactRect")
            .style("opacity", 1)
            .style("stroke", "gray")
            .style("stroke-width", 0.1);
        d3.selectAll("#weightPath").remove();

        //remove matmul-displayer
        d3.selectAll(".matmul-displayer").remove();
    });
}

export function computeMatrixLocations(
    btnX: number,
    btnY: number,
    curveDir: number,
    rectW: number,
    featureChannels: number,
    weights: number[][][],
    layerID: number
) {
    //draw weight matrix
    //positioning
    let offsetH = -1 * 50;
    if (curveDir == 1) offsetH = 60 + weights[layerID].length * rectW;
    const math = create(all, {});
    const matX = btnX;
    const matY = btnY - offsetH;
    const coefficient = 1;
    let weightMatrixPositions = [];
    //draw matrix - change the computation mode here, when the dims are different
    let weightMat = weights[layerID];

    //if(weightMat[0].length>weightMat.length || weightMat[0].length<weightMat.length)weightMat = math.transpose(weights[layerID]);

    if(weightMat.length == 16&& weightMat[0].length == 5){
        weightMat = rotateAnyMatrix(weightMat);
        console.log("inside compute pos weightMat", weightMat);
    }

    for (let i = 0; i < weightMat.length; i++) {
        let tempArr = [];
        for (let j = 0; j < weightMat[i].length; j++) {
            tempArr.push([
                matX + (j * rectW) / coefficient + rectW / (coefficient * 2),
                matY + (i * rectW) / coefficient + rectW / (coefficient * 2),
            ]);
        }
        weightMatrixPositions.push(tempArr);
    }
    //draw connection
    return weightMatrixPositions;
}

export function drawMathFormula(
    g: any,
    x: number,
    y: number,
    formula: string
) {
    console.log("formula", formula);
    injectSVG(
        g,
        x,
        y,
        formula,
        "math-formula-pos to-be-removed"
    );

    // flattenSVG(".mats");

}
export function drawWeightMatrix(
    btnX: number,
    btnY: number,
    curveDir: number,
    rectW: number,
    rectH: number,
    featureChannels: number,
    weights: number[][][],
    layerID: number,
    myColor: any,
    g: any,
    weightMatrixPostions: any
  ) {
    console.log("inside weight matrix", weights);
    const len = weightMatrixPostions.length;
    let btnPt: [number, number] = [btnX + 10, btnY - 15];
    let wMatPt: [number, number] = [
      (weightMatrixPostions[0][0][0] +
        weightMatrixPostions[0][weightMatrixPostions[0].length - 1][0]) /
        2,
      weightMatrixPostions[0][0][1],
    ];
    if (curveDir == 1) {
      wMatPt = [
        (weightMatrixPostions[0][0][0] +
          weightMatrixPostions[0][weightMatrixPostions[0].length - 1][0]) /
          2,
        weightMatrixPostions[len - 1][0][1],
      ];
    }
  
    const curve = d3.line().curve(d3.curveBasis);
    const res = computeMidsVertical(btnPt, wMatPt);
    const hpoint: [number, number] = res[0];
    const lpoint: [number, number] = res[1];
  
    if (curveDir == 1) {
      let tlpoint: [number, number] = [lpoint[0], lpoint[1]];
      let thpoint: [number, number] = [hpoint[0], hpoint[1]];
      d3.select(".mats")
        .append("path")
        .attr("d", curve([wMatPt, tlpoint, thpoint, btnPt]))
        .attr("stroke", "black")
        .attr("opacity", 1)
        .attr("fill", "none")
        .attr("class", "procVis wMatLink")
        .lower();
    } else {
      d3.select(".mats")
        .append("path")
        .attr("d", curve([btnPt, hpoint, lpoint, wMatPt]))
        .attr("stroke", "black")
        .attr("opacity", 1)
        .attr("fill", "none")
        .attr("class", "procVis wMatLink")
        .lower();
    }
    let weightMat = weights[layerID];
    let flag = false;
    if (
      weightMat[0].length > weightMat.length ||
      weightMat[0].length < weightMat.length
    ) {
      flag = true;
    }
  
    const dimX = weightMat[0].length;
    const dimY = weightMat.length;
  
    if (weightMat[0].length == weightMat.length) {
      weightMat = rotateMatrix(weightMat);
  
      if (curveDir == 1) {
        weightMat = rotateMatrix(weightMat);
        weightMat = rotateMatrix(weightMat);
        weightMat = flipVertically(weightMat);
        weightMat = rotateMatrix(weightMat);
      } else {
        weightMat = rotateMatrix(weightMat);
        weightMat = flipVertically(weightMat);
      }
    }
    if (weightMat.length == 2 && weightMat[0].length == 4) {
      weightMat = flipHorizontally(weightMat);
      weightMat = flipVertically(weightMat);
    }
    if (weightMat.length == 7 && weightMat[0].length == 64) {
      weightMat = flipHorizontally(weightMat);
      weightMat = flipVertically(weightMat);
    }
    if(weightMat.length == 16&& weightMat[0].length == 5){
        weightMat = rotateAnyMatrix(weightMat);
    }

  
    g.append("rect")
      .attr("class", "weight-matrix-frame to-be-removed procVis")
      .attr("x", weightMatrixPostions[0][0][0])
      .attr("y", weightMatrixPostions[0][0][1])
      .attr("width", rectW * weightMatrixPostions[0].length)
      .attr("height", rectW * weightMatrixPostions.length)
      .style("stroke", "black")
      .style("fill", "none")
      .style("stroke-width", 2);
  
    drawHintLabel(
      g,
      weightMatrixPostions[0][0][0],
      weightMatrixPostions[0][0][1] - 12,
      `Weight Matrix: ${dimY} x ${dimX}`,
      "procVis weightMatrixText to-be-removed"
    );

    for (let i = 0; i < weightMatrixPostions[0].length; i++) {

      const columnG = g
        .append("g")
        .attr("class", "procVis columnGroup")
        .attr("id", `columnGroup-${i}`);
  
      g.append("rect")
        .attr("x", weightMatrixPostions[0][i][0])
        .attr("y", weightMatrixPostions[0][i][1])
        .attr("width", rectW)
        .attr("height", rectW * weightMatrixPostions.length)
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("stroke-width", 0.5)
        .attr("opacity", 0)
        .attr("class", "columnUnit")
        .attr("id", `columnUnit-${i}`);
  
      for (let j = 0; j < weightMatrixPostions.length; j++) {
        let colorVal: number = 0;
        if (flag) {
          colorVal = weightMat[weightMat.length - j - 1][i];
        } else {
          colorVal = weightMat[i][weightMat[0].length - j - 1];
        }
        if (weightMat[0].length == weightMat.length) {
          colorVal = weightMat[j][i];
        }
        columnG
          .append("rect")
          .datum(colorVal)
          .attr("x", weightMatrixPostions[j][i][0])
          .attr("y", weightMatrixPostions[j][i][1])
          .attr("width", rectW)
          .attr("height", rectW)
          .attr("fill", myColor(colorVal))
          .attr("class", "weightUnit")
          .attr("id", `weightUnit-${j}-${i}`)
          .attr("data-orig-x", weightMatrixPostions[j][i][0])
          .attr("data-orig-y", weightMatrixPostions[j][i][1])
          .on("mouseover", function (this: SVGRectElement, event: MouseEvent, d: number) {
            event.stopPropagation();
            const origX = +d3.select(this).attr("data-orig-x");
            const origY = +d3.select(this).attr("data-orig-y");
            const scale = 2;
            const newWidth = rectW * scale;
            const newHeight = rectW * scale;
            const deltaX = (newWidth - rectW) / 2;
            const deltaY = (newHeight - rectW) / 2;
            d3.select(this)
              .transition()
              .duration(100)
              .attr("x", origX - deltaX)
              .attr("y", origY - deltaY)
              .attr("width", newWidth)
              .attr("height", newHeight)
              .attr("stroke", "black")
              .attr("stroke-width", 2);
            const pointer = d3.pointer(event, g.node());
            const tooltip = g.append("g").attr("class", "cell-tooltip procVis");
            tooltip.append("rect")
              .attr("x", pointer[0] + 20)
              .attr("y", pointer[1] - 20)
              .attr("width", 150)
              .attr("height", 35)
              .attr("rx", 5)
              .attr("ry", 5)
              .style("fill", "white")
              .style("stroke", "black");
            tooltip.append("text")
              .attr("x", pointer[0] + 85)
              .attr("y", pointer[1] - 5)
              .attr("text-anchor", "middle")
              .attr("dominant-baseline", "middle")
              .attr("font-family", "monospace")
              .style("font-size", "17px")
              .text(`Value = ${d.toFixed(2)}`);
          })
          .on("mouseout", function (this: SVGRectElement, event: MouseEvent, d: number) {
            const origX = +d3.select(this).attr("data-orig-x");
            const origY = +d3.select(this).attr("data-orig-y");
            d3.select(this)
              .transition()
              .duration(100)
              .attr("x", origX)
              .attr("y", origY)
              .attr("width", rectW)
              .attr("height", rectW)
              .attr("stroke", "none");
            g.selectAll(".cell-tooltip").remove();
          });
      }
    }

    function highlightWeightMatrixColumn(columnIndex: number, highlight: boolean) {
      d3.select(`#columnUnit-${columnIndex}`)
        .transition()
        .duration(100)
        .style("stroke", "black")
        .style("stroke-width", highlight ? 2 : 0.5)
        .style("opacity", highlight ? 1 : 0);
    }
  
    d3.selectAll<SVGRectElement, unknown>(".mul-result-cell")
        .on("mouseover", function (event, _d) {
        event.stopPropagation();
        const rect = this as SVGRectElement;
        const cells = d3.selectAll<SVGRectElement, unknown>(".mul-result-cell").nodes();
        const i = cells.indexOf(rect);
        highlightWeightMatrixColumn(i, true);
        })
        .on("mouseout", function (event, _d) {
        event.stopPropagation();
        const rect = this as SVGRectElement;
        const cells = d3.selectAll<SVGRectElement, unknown>(".mul-result-cell").nodes();
        const i = cells.indexOf(rect);
        highlightWeightMatrixColumn(i, false);
        });
  
  }
    



  export function drawBiasVector(
    g: any,
    featureChannels: number,
    rectH: number,
    rectW: number,
    coordFeatureVis: any,
    myColor: any,
    layerBias: number[],
    layerID: number
) {
    let channels = featureChannels;
    if (layerID === 2 && featureChannels === 4) channels = 2;
    for (let m = 0; m < channels; m++) {
        let biasValue = layerBias[m];
        g.append("rect")
            .attr("x", coordFeatureVis[0] + rectW * m)
            .attr("y", coordFeatureVis[1] - rectH / 2)
            .attr("width", rectW)
            .attr("height", rectH)
            .attr("fill", myColor(biasValue))
            .style("opacity", 1)
            .attr("stroke", "gray")
            .attr("stroke-width", 0.1)
            .attr("class", "procVis bias")
            .on("mouseover", function (this: SVGRectElement, event: MouseEvent) {
                d3.select(this.parentElement).raise();
                d3.select(this)
                  .attr("stroke", "black")
                  .attr("stroke-width", 2)
                  .raise();
                const tooltipWidth = 150;
                const tooltipHeight = 35;
                const tooltipOffset = -45; 
                const horizontalOffset = 80; 
                
                const pointer = d3.pointer(event, g.node());
                
                g.selectAll("g.bias-tooltip").remove();
                
                const tooltip = g.append("g")
                    .attr("class", "bias-tooltip")
                    .style("pointer-events", "none");
                tooltip.raise();
                
                tooltip.append("rect")
                    .attr("x", pointer[0] - tooltipWidth / 2 + horizontalOffset)
                    .attr("y", pointer[1] - tooltipHeight - tooltipOffset)
                    .attr("width", tooltipWidth)
                    .attr("height", tooltipHeight)
                    .attr("fill", "white")
                    .attr("stroke", "black")
                    .attr("rx", 3)
                    .attr("ry", 3);
                
                tooltip.append("text")
                    .attr("x", pointer[0] + horizontalOffset)
                    .attr("y", pointer[1] - tooltipOffset - tooltipHeight/2)
                    .attr("text-anchor", "middle")
                    .attr("dominant-baseline", "middle")
                    .style("font-size", "17px")
                    .attr("font-family", "monospace")
                    .attr("fill", "black")
                    .text(`Value = ${biasValue.toFixed(2)}`);
            })
            .on("mouseout", function (this: SVGRectElement) {
                d3.select(this)
                  .attr("stroke", "gray")
                  .attr("stroke-width", 0.1)
                  .lower();
                
                g.selectAll("g.bias-tooltip").remove();
            });
    }
    
    // Draw bias vector border
    g.append("rect")
        .attr("x", coordFeatureVis[0])
        .attr("y", coordFeatureVis[1] - rectH / 2)
        .attr("width", rectW * channels)
        .attr("height", rectH)
        .attr("fill", "none")
        .style("opacity", 1)
        .attr("stroke", "black")
        .attr("stroke-width", 1)
        .attr("class", "procVis biasVector biasFrame");
    
    drawHintLabel(
        g,
        coordFeatureVis[0],
        coordFeatureVis[1] + rectH + 6,
        `Bias Vector: ${layerBias.length} x 1`,
        "procVis biasFrame"
    );
}

export function drawBiasPath(
    biasCoord: [number, number],
    res10: [number, number],
    res11: [number, number],
    nextCoord: [number, number],
    layerID: number,
    featureChannels: number
) {
    if (layerID == 2 && featureChannels == 4) biasCoord[0] -= 15;
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
    wmCoord: [number, number],
    res00: [number, number],
    res01: [number, number],
    nextCoord: [number, number],
    layerID: number,
    featureChannels: number,
    featureVisTable: any
) {
    if (layerID == 2 && featureChannels == 4) wmCoord[0] -= 15;
    if (layerID == 0 && featureChannels == 4) wmCoord[0] += 15;
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
    midX1: number,
    wmCoord: number[],
    biasCoord: number[],
    nextCoord: number[]
) {
    const svg = d3.select(".mats");
    const relu = svg.append("g");

    const cx = midX1;
    const cy = (wmCoord[1] + biasCoord[1]) / 2;
    const radius = 5;
    const cx1 = nextCoord[0] - 45;
    const cy1 = nextCoord[1] - 15;

    d3.xml("./assets/SVGs/ReLU.svg").then(function (data) {
        if (relu.node() != null) {
            const ReLU = relu!.node()!.appendChild(data.documentElement);
            d3.select(ReLU)
                .attr("x", cx1)
                .attr("y", cy1)
                .attr("class", "procVis relu-icon")
                .raise();
        }
    });
    drawHintLabel(relu, cx1 - 10, cy1 + radius * 4 + 12 + 4, "ReLU", "procVis reluText");

    relu.on("mouseover", function (event, d) {
        const [x, y] = d3.pointer(event);

        //set-up the paramtere for the math displayer
        drawActivationExplanation(
            x,
            y,
            "ReLU Non-linear Function",
            "f(x) = max(0, x)",
            "Range: [ 0 to infinity)"
        );
    });

    relu.on("mouseout", function () {
        d3.selectAll(".math-displayer").remove();
    });
}

export function drawTanh(
    midX1: number,
    wmCoord: number[],
    biasCoord: number[],
    nextCoord: number[]
) {
    const svg = d3.select(".mats");
    const relu = svg.append("g");

    const cx = midX1;
    const cy = (wmCoord[1] + biasCoord[1]) / 2;
    const radius = 5;
    const cx1 = nextCoord[0] - 45;
    const cy1 = nextCoord[1] - 15;

    d3.xml("./assets/SVGs/tanh.svg").then(function (data) {
        if (relu.node() != null) {
            const ReLU = relu!.node()!.appendChild(data.documentElement);
            d3.select(ReLU)
                .attr("x", cx1)
                .attr("y", cy1)
                .attr("class", "procVis relu-icon")
                .raise();

        }
    });

    drawHintLabel(
        relu,
        cx1 - 20,
        cy1 + radius * 4 + 12 + 4,
        "Tanh",
        "procVis relu-icon"
    );


    relu.on("mouseover", function (event, d) {
        const [x, y] = d3.pointer(event);

        //set-up the paramtere for the math displayer
        drawActivationExplanation(
            x,
            y,
            "Tanh Non-Linear Function",
            "./assets/SVGs/tanh_formula.svg",
            "Range: (-1, 1)"
        );
    });

    relu.on("mouseout", function () {
        d3.selectAll(".math-displayer").remove();
    });
}

export function drawFunctionIcon(
    nextCoord: number[],
    svgPath: string,
    funcName: string,
    funcStr: string,
    funcFormula: string,
    funcRange: string,
    svg:any = d3.select(".mats")
) {
    console.log("draw!")
    //const svg = d3.select(".mats");
    const relu = svg.append("g");
    const radius = 5;
    const cx1 = nextCoord[0] - 45;
    const cy1 = nextCoord[1] - 15;

    d3.xml(svgPath).then(function (data) {
        if (relu.node() != null) {
            const ReLU = relu!.node()!.appendChild(data.documentElement);
            d3.select(ReLU)
                .attr("x", cx1)
                .attr("y", cy1)
                .attr("class", "procVis relu-icon to-be-removed")
                .raise();

        }
    });

    drawHintLabel(
        relu,
        cx1 - 20,
        cy1 + radius * 4 + 12 + 4,
        funcName,
        "procVis relu-icon to-be-removed"
    );


    relu.on("mouseover", function (event:any, d:any) {
        const [x, y] = d3.pointer(event);

        //set-up the paramtere for the math displayer
        drawActivationExplanation(
            x,
            y,
            funcStr,
            funcFormula,
            funcRange
        );
    });

    relu.on("mouseout", function () {
        d3.selectAll(".math-displayer").remove();
    });
}

//-----------------------------animation functions for poolingVisClick----------------------------------
export function drawOutputVisualizer(
    result: number[],
    g1: any,
    one: any,
    rectH: number,
    myColor: any
) {
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
    endCoord: any,
    resultCoord: any,
    result: number[],
    myColor: any,
    clockwise: number = 0
) {
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
                .style("opacity", "0")
                .attr("stroke", myColor(result[j]));

            temPathMap.push(path.node());
        }
        pathMap.push(temPathMap);
    }
    let yOffset = -clockwise * 70;
    if (clockwise == 0) yOffset = 80;
    const g = d3.select(".mats").append("g");
    // drawHintLabel(
    //     g,
    //     (resultCoord[0][0] + endCoord[endCoord.length - 1][0]) / 2 - 20,
    //     (resultCoord[0][1] + endCoord[endCoord.length - 1][1]) / 2 + yOffset,
    //     "Softmax",
    //     "procVis"
    // );
    return pathMap;
}

export function drawPathBtwOuputResult(one: any, endPt: any) {
    d3.select(".mats")
        .append("path")
        .attr("d", d3.line()([one[0], endPt]))
        .attr("stroke", "black")
        .attr("opacity", 1)
        .attr("fill", "none")
        .attr("class", "procVis")
        .attr("id", "path1")
        .lower();
}

export function drawBiasPathOutputVis(
    biasCoord: any,
    controlPts: any,
    feaCoord: any
) {
    const curve = d3.line().curve(d3.curveBasis);
    d3.select(".mats")
        .append("path")
        .attr(
            "d",
            curve([biasCoord[0], controlPts[0], controlPts[1], feaCoord])
        )
        .attr("stroke", "black")
        .attr("opacity", 0.05)
        .attr("fill", "none")
        .attr("class", "procVis biasPath")
        .attr("id", "path1");
    d3.selectAll(".biasPath").transition().duration(1000).attr("opacity", 1);
}
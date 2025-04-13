import * as d3 from "d3";
import { roundToTwo } from "../components/WebUtils";
import { flipVertically, softmax } from "./utils";
import { create, all, transposeDependencies } from "mathjs";
import { injectMathSymbol, injectSVG } from "./svgUtils";
import { drawEqComponentLabel, drawScoreE } from "./matHelperUtils";


//---------------------------functions for the softmax interaction in the graph classifier------------------------------
export function drawAttnDisplayer(
    attnDisplayer: any,
    dX: number,
    dY: number,
    eij: number[],
    lgIndices: number[][],
    targetE: number,
    myColor: any,
    ithIdx: number,
    attnScore: number
) {

    console.log("lgIndices:", lgIndices)
    console.log("eij:", eij)
    console.log("ithIdx:", ithIdx)

    let attnDisplayerWidth = 120 + 90 * (eij.length);
    if(eij.length < 3){
        attnDisplayerWidth += 50;
    }
    attnDisplayer
        .append("rect")
        .attr("x", dX + 10)
        .attr("y", dY + 10)
        .attr("rx", 5)
        .attr("ry", 5)
        .attr("width", attnDisplayerWidth)
        .attr("height", 200)
        .attr("fill", "white")
        .attr("stroke", "black")
        .attr("stroke-width", 1)
        .attr("class", "procVis attn-displayer");

     //   a_${lgIndices[0][0]}_${lgIndices[ithIdx][1]}

     const attnEqScore = attnDisplayer.append("g").attr("class", "procVis attn-displayer");
    
    const attnTitleOffset = 150;

    const attnSymPosX = dX + 195;
    const attnSymPosY = dY + 10+ attnTitleOffset;

     injectMathSymbol(
        attnEqScore, attnSymPosX, attnSymPosY, 
         "./assets/SVGs/attn.svg", 
         "procVis attn-displayer", "input",
         `${lgIndices[0][0]},${lgIndices[ithIdx][1]}`
     );

     const attnTextX = dX + 145;
    const attnTextY = dY + 25+ attnTitleOffset;

    //draw the equation
    attnDisplayer
        .append("text")
        .text(
            "Attention Coefficient for " +
                `       = ${attnScore}`
        )
        .attr("x", attnTextX)
        .attr("y", attnTextY)
        .attr("text-anchor", "middle").attr("xml:space", "preserve")
        .attr("font-size", 15)
        .attr("class", "procVis attn-displayer");

    
    const eqEScore = attnDisplayer.append("g").attr("class", "procVis attn-displayer");
    
        const alphaEqPffset = 50;

        const attenEqSymPosX = dX + 15;
        const attenEqSymPosY = dY + 50 + 7.5 + alphaEqPffset;

    injectMathSymbol(
        eqEScore, attenEqSymPosX, attenEqSymPosY, 
        "./assets/SVGs/attn.svg", 
        "procVis attn-displayer", "input",
        `${lgIndices[0][0]},${lgIndices[ithIdx][1]}`
    );
    
    const eqEqPosX = dX + 15;
    const eqEqPosY = dY + 50 + 25 + alphaEqPffset;

    attnDisplayer
        .append("text")
        .text("          =  ")
        .attr("x", eqEqPosX)
        .attr("y", eqEqPosY)
        .attr("xml:space", "preserve")
        .attr("font-size", 15)
        .attr("class", "procVis attn-displayer");

    const eqMemberPosX = dX + 100;
    const eqMemberPosY = dY + 50 + 25 + alphaEqPffset;

    const eqLinePosX1 = dX + 100;
    const eqLinePosY1 = dY + 65 + alphaEqPffset;
    const eqLinePosX2 = dX + 100 + 90 * (eij.length);
    const eqLinePosY2 = dY + 65 + alphaEqPffset;

    for (let i = 0; i < eij.length; i++) {
        const escoreComponent = attnDisplayer.append("g").attr("class", "procVis attn-displayer attnE")
        .attr("id", `e-${i}`)
        .attr("index", i);
        const str = `e(${lgIndices[i][0]},${lgIndices[i][1]})`
        const offset = str.length * 2.5;
        const eScorePosX = dX + 100 + 100 * i;
        const eScorePosY = dY + 50 + 25 + 9.5 + alphaEqPffset;

        if (i != 0) {
            
            attnDisplayer
                .append("text")
                .text("+")
                .attr("x", eqMemberPosX + 100 * (i) - (10))
                .attr("y", eqMemberPosY + 12.5)
                .attr("text-anchor", "middle")
                .attr("font-size", 15)
                .attr("class", "procVis attn-displayer");
        }

        type Point = { x: number; y: number };
        const points: Point[] = [
            { x: eqLinePosX1, y: eqLinePosY1 },
            { x: eqLinePosX2, y: eqLinePosY2 },
        ];

        const lineGenerator = d3
            .line<Point>() // 使用泛型指定类型
            .x((d: Point) => d.x) // 设置x坐标
            .y((d: Point) => d.y); // 设置y坐标

        const pathData = lineGenerator(points);

        // 5. 将路径添加到SVG中
        escoreComponent
            .append("path")
            .attr("d", pathData)
            .attr("stroke", "black")
            .attr("stroke-width", 1)
            .attr("fill", "none")
            .attr("id", "targetE"); // 确保路径不被填充

        const escore = escoreComponent.append("g");

        

        drawScoreE(escore, eScorePosX, eScorePosY, lgIndices[i][0], lgIndices[i][1]);
    }

    const escore = attnDisplayer.append("g").attr("id", 0).attr("class", "math-latex");


    const escorePosX = dX + 100 + 50 - 7.5;
    const escorePosY = dY + 50 + alphaEqPffset;

    drawScoreE(escore, escorePosX, escorePosY, lgIndices[0][0], lgIndices[ithIdx][1]);

    const scale = 2;
    attnDisplayer.attr("transform", `translate(${dX * (1 - scale)}, ${dY * (1 - scale)}) scale(${scale})`);

}

export function drawEScoreEquation(
    lgIndices: number[][],
    eDisplayer: any,
    jthIndexElement: number,
    dX: number,
    dY: number,
    dstVector: number[],
    srcVector: number[],
    myColor: any,
    inputVector: number[],
    layerID: number
) {
    const eqEScore = eDisplayer.append("g").attr("class", "procVis attn-displayer");
    
    const offsetX = -25;
    const offsetForVector = -25;
    const labelYOffset = 12.5;

    dY -= 50;
    const e = eqEScore.append("text")
        .attr("x", dX + 15)
        .attr("y", dY + 100 + 7.5 + 15)
        .text(`e(${lgIndices[0][0]},${jthIndexElement})`)
        .style("fill", "black")
        .style("font-size", 10)
        .attr("class", "procVis attn-displayer");
    eDisplayer
        .append("text")
        .text(
            `          = LeakyReLU(                      +                      )`
        )
        .attr("x", dX + 40)
        .attr("y", dY + 125)
        .attr("xml:space", "preserve")
        .attr("font-size", 12)
        .attr("class", "procVis attn-displayer")
        .attr("id", "leakyRelu");

    const fontSize = 12;
    const textH = dY + 110;

    dX += 25;


    const aTs = eDisplayer.append("g").attr("id", "ats").attr("class", "math-latex");
    injectSVG(aTs, dX + 130 +offsetX+17, textH+20, "./assets/SVGs/a_t_s.svg", "math-latex");
    
    const graphicsYOffset = -60;

        eDisplayer.append("text")
            .text("Learnable Vector")
            .attr("x", dX + 140 - 10 + 12.5 +offsetX  + offsetForVector - 10)
            .attr("y", dY + 112.5 + 25 + srcVector.length * (25 / srcVector.length) + 5 + graphicsYOffset - labelYOffset)
            .attr("class", "temp")
            .style("fill", "gray")
            .style("font-size", 3);
        eDisplayer.append("text")
            .text("for Source")
            .attr("x", dX + 140 - 10 + 12.5 +offsetX + offsetForVector - 10)
            .attr("y", dY + 112.5 + 5 + 25 + srcVector.length * (25 / srcVector.length) + 5+ graphicsYOffset - labelYOffset)
            .attr("class", "temp")
            .style("fill", "gray")
            .style("font-size", 3);

        for (let i = 0; i < dstVector.length; i++) {
        eDisplayer
            .append("rect")
            .attr("x", dX + 140 - 10 + 12.5 +offsetX + i * (25 / srcVector.length) + offsetForVector - 10)
            .attr("y", dY + 112.5 + 12.5 + graphicsYOffset-offsetForVector)
            .attr("width", 25 / srcVector.length)
            .attr("height", 2.5)
            .attr("fill", myColor(srcVector[i])).attr("class", "temp");
        }

        eDisplayer
                    .append("rect")
                    .attr(
                        "x",
                        dX + 140 - 10 + 12.5 +offsetX + 0 * (25 / srcVector.length) + offsetForVector - 10
                    )
                    .attr("y", dY + 112.5 + 12.5 + graphicsYOffset-offsetForVector)
                    .attr("width", 25)
                    .attr("height", 2.5)
                    .attr("stroke", "black")
                    .attr("class", "temp")
                    .attr("fill", "none")
                    .attr("stroke-width", 0.1);


    const aTd = eDisplayer
    .append("g")
    .attr("id", "atd")
    .attr("class", "math-latex");

    

    injectSVG(aTd, dX + 220 +offsetX+17, textH+20, "./assets/SVGs/a_t_d.svg", "math-latex");

    
        
            eDisplayer.append("text")
            .text("Learnable Vector")
            .attr("x", dX + 165 + 12.5 + 20 +offsetX)
            .attr("y", dY + 112.5 + 25 + dstVector.length * (25 / dstVector.length) + 5+ graphicsYOffset - labelYOffset)
            .attr("class", "temp")
            .style("fill", "gray")
            .style("font-size", 3);

            eDisplayer.append("text")
            .text(" for Destination")
            .attr("x", dX + 165 + 12.5 + 20 +offsetX)
            .attr("y", dY + 112.5 + 25 + 5 + dstVector.length * (25 / dstVector.length) + 5+ graphicsYOffset - labelYOffset)
            .attr("class", "temp")
            .style("fill", "gray")
            .style("font-size", 3);

            for (let i = 0; i < dstVector.length; i++) {
                eDisplayer
                    .append("rect")
                    .attr("x", dX + 200 + 12.5+ i * (25 / dstVector.length) + 20 +offsetX+offsetForVector-10)
                    .attr("y", dY + 112.5 +12.5+ graphicsYOffset-offsetForVector)
                    .attr("width", 25 / dstVector.length)
                    .attr("height", 2.5).attr("class", "temp")
                    .attr("fill", myColor(dstVector[i]))
                    .raise();
            }

            eDisplayer
                    .append("rect")
                    .attr(
                        "x",
                        dX + 200 + 12.5 + 20 +offsetX+offsetForVector-10
                    )
                    .attr("y", dY + 112.5 +12.5+ graphicsYOffset-offsetForVector)
                    .attr("width", 25)
                    .attr("height", 2.5)
                    .attr("stroke", "black")
                    .attr("class", "temp")
                    .attr("fill", "none")
                    .attr("stroke-width", 0.1);

    const x1 = eDisplayer.append("g").attr("id", "xi").attr("class", "math-latex");
    injectMathSymbol(x1, dX + 140 - 10 + 50 +offsetX, textH, "./assets/SVGs/vector_x.svg", "math-latex", "input", lgIndices[0][0]);

             drawEqComponentLabel(eDisplayer, dX +offsetX + 140 - 10 + 50 + inputVector.length * (25 / inputVector.length) - 25, dY + 112.5 + 25 +30+ graphicsYOffset , "Input Vector")
            
            for (let i = 0; i < inputVector.length; i++) {
                eDisplayer
                    .append("rect")
                    .attr(
                        "x",
                        dX + 140 - 10 + 60  +offsetX
                    )
                    .attr("y", dY + 112.5+ i * (25 / inputVector.length) + 25+ graphicsYOffset)
                    .attr("width", 2.5)
                    .attr("height", 25 / inputVector.length).attr("class", "temp")
                    .attr("fill", myColor(inputVector[i]));
            }

            eDisplayer
                    .append("rect")
                    .attr(
                        "x",
                        dX + 140 - 10 + 60 +offsetX
                    )
                    .attr("y", dY + 112.5 + 25+ graphicsYOffset)
                    .attr("width", 2.5)
                    .attr("height", 25)
                    .attr("stroke", "black")
                    .attr("class", "temp")
                    .attr("fill", "none")
                    .attr("stroke-width", 0.1);

        const x2 = eDisplayer.append("g").attr("id", "xj").attr("class", "math-latex");
        injectMathSymbol(x2, dX + 220+ 50 +offsetX, textH, "./assets/SVGs/vector_x.svg", "math-latex", "input", jthIndexElement);
    
             drawEqComponentLabel(eDisplayer, dX + 200 + 20 + 50 +offsetX + inputVector.length * (25 / inputVector.length) - 15, dY + 25 + 112.5 + 30 + graphicsYOffset, "Input Vector")

            for (let i = 0; i < inputVector.length; i++) {
                eDisplayer
                    .append("rect").attr("class", "temp")
                    .attr(
                        "x",
                        dX  +offsetX+ 200 + 40 + 50
                    )
                    .attr("y", dY + 112.5 + 12.5  + i * (25 / inputVector.length)+ 12.5+ graphicsYOffset)
                    .attr("width", 2.5)
                    .attr("height", 25 / inputVector.length)
                    .attr("fill", myColor(inputVector[i]));
            }

            eDisplayer
                    .append("rect")
                    .attr(
                        "x",
                        dX  +offsetX+ 200 + 40 + 50
                    )
                    .attr("y", dY + 112.5 + 12.5 + 12.5+ graphicsYOffset)
                    .attr("width", 2.5)
                    .attr("height", 25)
                    .attr("stroke", "black")
                    .attr("class", "temp")
                    .attr("fill", "none")
                    .attr("stroke-width", 0.1);

    
    
        eDisplayer
            .append("text")
            .text("W")
            .attr("id", "w1").attr("class", "mathjax-latex")
            .attr("x", dX + 75 + 75 + 15 +offsetX )
            .attr("y", textH + 15)
            .attr("font-size", fontSize).style("font-weight", "bold").style("font-family", "serif");
        eDisplayer
            .append("text")
            .text("W")
            .attr("id", "w2").attr("class", "mathjax-latex")
            .attr("x", dX + 75 + 75 + 60 + 40+5 +offsetX )
            .attr("y", textH + 15)
            .attr("font-size", fontSize).style("font-weight", "bold").style("font-family", "serif");

            dY += 35;
            dX -= 75;
            console.log("INI",inputVector.length)

    let imageMat = "./assets/PNGs/GATConvMat1.png";
    let imgW = 50;
    let imgH = 50;

    let offset = 0;
    let textOffset = 0;

    if (layerID == 1) {
        imageMat = "./assets/PNGs/GATConvMat2.png";
        imgW = 25;
        imgH = 25;
        offset = 12.5;
        textOffset = 25;
    }

    eDisplayer
        .append("image")
        .attr("xlink:href", imageMat).attr("id", "w1png")
        .attr("x", dX + 75 + 75 - 10  +offsetX + 100 + 65+offset/2)
        .attr("y", dY + 75 +12.5 +  graphicsYOffset + offset)
        .attr("width", imgW)
        .attr("height", imgH).attr("opacity", 0)
        .attr("stroke-width", 0.1);

        d3.select("#w1png").attr("opacity", 1); 

    eDisplayer
        .append("image")
        .attr("xlink:href", imageMat)
        .attr("id", "w2png")
        .attr("x", dX + 75 + 75  +offsetX+ 60 + offset/2)
        .attr("y", dY + 75 + 12.5+ graphicsYOffset + offset)
        .attr("width", imgW)
        .attr("height", imgH).attr("opacity", 1)
        .attr("stroke-width", 0.1);

    

    
        // .on("mouseenter", function () {
        drawEqComponentLabel(eDisplayer, dX + 75 + 75 +offsetX + 60 + 20 - 10 , dY + 75 + graphicsYOffset + imgH + 5 + textOffset, "Weight Matrix")

        drawEqComponentLabel(eDisplayer, dX + 75 + 75  +offsetX+ 60 + 20 - 10 +100, dY + 75 + graphicsYOffset  + imgH + 5 + textOffset, "Weight Matrix")

}

export function drawSoftmaxDisplayer(
    pathMap: any,
    endCoord: any,
    result: number[],
    id: number,
    myColor: any
) {
    pathMap[0][id]!.style.opacity = "1";
    pathMap[1][id]!.style.opacity = "1";

    //set-up the paramtere for the math displayer
    const displayW = 250;
    const displayH = 75;

    //find coordination for the math displayer first
    const displayX = endCoord[1][0] + 30;
    const displayY = endCoord[1][1] - (displayH + 50);

    //add displayer


    const displayer = d3.select(".mats").append("g")
    
    displayer
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
        .lower();

    //data preparation and preprocessing
    //model outputs and the values after softmax

    const finalResult = softmax(result);

    //title fetch
    let title = "Softmax Score for 'Mutagenic'";
    if (id == 0) {
        title = "Softmax Score for 'Non-Mutagenic'";
    }

    //add contents into the math displayer
    //add title
    const titleYOffset = 10;
    const titleXOffset = 50;
    displayer
        .append("text")
        .attr("x", displayX + titleXOffset)
        .attr("y", displayY + titleYOffset)
        .text(title)
        .attr("class", "math-displayer")
        .attr("font-size", titleYOffset)
        .attr("fill", "black");
    //add equation
    //draw fraction
    //upper part of the fraction
    const eqXOffset = titleXOffset / 2;
    const eqYOffset = titleYOffset * 2.5;
    const unitSize = eqXOffset / 3 + 3;
    const upperOffset = unitSize * 2;
    displayer
        .append("text")
        .attr("x", displayX + eqXOffset + upperOffset)
        .attr("y", displayY + eqYOffset)
        .text("exp(")
        .attr("class", "math-displayer")
        .attr("font-size", unitSize)
        .attr("fill", "black");
    displayer
        .append("rect")
        .attr("x", displayX + eqXOffset + unitSize * 2.5 + upperOffset)
        .attr("y", displayY + eqYOffset - unitSize + 2)
        .attr("width", unitSize)
        .attr("height", unitSize)
        .style("stroke", "black")
        .attr("fill", myColor(result[id]))
        .attr("class", "math-displayer")
        .raise();
    displayer
        .append("text")
        .attr("x", displayX + eqXOffset + unitSize * 2.5 + upperOffset)
        .attr("y", displayY + eqYOffset - unitSize / 3)
        .text(roundToTwo(result[id]))
        .attr("class", "math-displayer")
        .attr("font-size", unitSize / 2)
        .attr("fill", "white");
    displayer
        .append("text")
        .attr("x", displayX + eqXOffset + unitSize * 4 + upperOffset)
        .attr("y", displayY + eqYOffset)
        .text(")")
        .attr("class", "math-displayer")
        .attr("font-size", unitSize)
        .attr("fill", "black");
    //upper part finished
    //draw fraction line
    const startFLPt: [number, number] = [
        displayX + eqXOffset / 2,
        displayY + eqYOffset + unitSize,
    ];
    const endFLPt: [number, number] = [
        displayX + eqXOffset + unitSize * 10,
        displayY + eqYOffset + unitSize,
    ];
    const path1 = displayer
        .append("path")
        .attr("d", d3.line()([startFLPt, endFLPt]))
        .attr("stroke", "black")
        .attr("opacity", 1)
        .attr("fill", "none")
        .attr("class", "math-displayer");
    //draw lower part
    const offsetMul = 2;
    displayer
        .append("text")
        .attr("x", displayX + eqXOffset)
        .attr("y", displayY + eqYOffset * offsetMul)
        .text("exp(")
        .attr("class", "math-displayer")
        .attr("font-size", unitSize)
        .attr("fill", "black");
    displayer
        .append("rect")
        .attr("x", displayX + eqXOffset + unitSize * 2.5)
        .attr("y", displayY + eqYOffset * offsetMul - unitSize + 2)
        .attr("width", unitSize)
        .attr("height", unitSize)
        .style("stroke", "black")
        .attr("fill", myColor(result[0]))
        .attr("class", "math-displayer")
        .raise();
    displayer
        .append("text")
        .attr("x", displayX + eqXOffset + unitSize * 2.5)
        .attr("y", displayY + eqYOffset * offsetMul - unitSize / 3)
        .text(roundToTwo(result[0]))
        .attr("class", "math-displayer")
        .attr("font-size", unitSize / 2)
        .attr("fill", determineColor(result[0]));
    displayer
        .append("text")
        .attr("x", displayX + eqXOffset + unitSize * 4)
        .attr("y", displayY + eqYOffset * offsetMul)
        .text(")+exp(")
        .attr("class", "math-displayer")
        .attr("font-size", unitSize)
        .attr("fill", "black");
    displayer
        .append("rect")
        .attr("x", displayX + eqXOffset + unitSize * 7.5)
        .attr("y", displayY + eqYOffset * offsetMul - unitSize + 2)
        .attr("width", unitSize)
        .attr("height", unitSize)
        .style("stroke", "black")
        .attr("fill", myColor(result[1]))
        .attr("class", "math-displayer")
        .raise();
    displayer
        .append("text")
        .attr("x", displayX + eqXOffset + unitSize * 7.5)
        .attr("y", displayY + eqYOffset * offsetMul - unitSize / 3)
        .text(roundToTwo(result[1]))
        .attr("class", "math-displayer")
        .attr("font-size", unitSize / 2)
        .attr("fill", determineColor(result[1]));
    displayer
        .append("text")
        .attr("x", displayX + eqXOffset + unitSize * 9)
        .attr("y", displayY + eqYOffset * offsetMul)
        .text(")")
        .attr("class", "math-displayer")
        .attr("font-size", unitSize)
        .attr("fill", "black");
    //lower part finished
    //eq sign and result
    displayer
        .append("text")
        .attr("x", endFLPt[0] + unitSize / 2)
        .attr("y", endFLPt[1])
        .text("=")
        .attr("class", "math-displayer")
        .attr("font-size", unitSize)
        .attr("fill", "black");
    displayer
        .append("rect")
        .attr("x", endFLPt[0] + unitSize * 1.5)
        .attr("y", endFLPt[1] - unitSize)
        .attr("width", unitSize)
        .attr("height", unitSize)
        .style("stroke", "black")
        .attr("fill", myColor(finalResult[id]))
        .attr("class", "math-displayer")
        .raise();
    let textColor = "white";
    if (Math.abs(finalResult[id]) < 0.5) {
        textColor = "black";
    }
    displayer
        .append("text")
        .attr("x", endFLPt[0] + unitSize * 1.5)
        .attr("y", endFLPt[1] - unitSize / 2)
        .text(roundToTwo(finalResult[id]))
        .attr("class", "math-displayer")
        .attr("font-size", unitSize / 2)
        .attr("fill", textColor);

    const scaleFactor = 1.5;

        // 获取 tooltip 元素的边界框
        const bbox = displayer.node()?.getBBox();

        // 计算中心点
        if(bbox!=undefined){
            const centerX = bbox.x + bbox.width / 2;
            const centerY = bbox.y + bbox.height / 2;

            // 将缩放中心设置为元素的中心点
            displayer.attr('transform', `translate(${centerX}, ${centerY}) scale(${scaleFactor}) translate(${-centerX}, ${-centerY})`);

        }
}


function determineColor(val: number) {
    if (Math.abs(val) > 0.5) {
        return "white";
    }

    return "black";
}


export function drawSoftmaxDisplayerNodeClassifier(
    displayerPos: number[],
    titles: string[],
    rectID: number,
    nthOutputVals: number[],
    nthResult: number[],
    myColor: any
) {
    //set-up the paramtere for the math displayer
    const displayW = 350;
    const displayH = 75;
    const displayX = displayerPos[0];
    const displayY = displayerPos[1];

    //add displayer
    const tooltip = d3.select(".mats").append("g");

        tooltip.append("rect")
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
    tooltip
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
    tooltip
        .append("text")
        .attr("x", displayX + eqXOffset + unitSize * 4 + upperOffset)
        .attr("y", displayY + eqYOffset)
        .text("exp(")
        .attr("class", "math-displayer")
        .attr("font-size", unitSize)
        .attr("fill", "black");
    tooltip
        .append("rect")
        .attr("x", displayX + eqXOffset + unitSize * 6.5 + upperOffset)
        .attr("y", displayY + eqYOffset - unitSize + 2)
        .attr("width", unitSize)
        .attr("height", unitSize)
        .style("stroke", "black")
        .attr("fill", myColor(nthOutputVals[Number(rectID)]))
        .attr("class", "math-displayer")
        .raise();
    tooltip
        .append("text")
        .attr("x", displayX + eqXOffset + unitSize * 6.5 + upperOffset)
        .attr("y", displayY + eqYOffset - unitSize / 3)
        .text(roundToTwo(nthOutputVals[Number(rectID)]))
        .attr("class", "math-displayer")
        .attr("font-size", unitSize / 2)
        .attr("fill", determineColor(nthOutputVals[Number(rectID)]));
    tooltip
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
    const path1 = tooltip
        .append("path")
        .attr("d", d3.line()([startFLPt, endPathPt]))
        .attr("stroke", "black")
        .attr("opacity", 1)
        .attr("fill", "none")
        .attr("class", "math-displayer");

    //draw lower part
    const offsetMul = 2;
    tooltip
        .append("text")
        .attr("x", displayX + eqXOffset)
        .attr("y", displayY + eqYOffset * offsetMul)
        .text("exp(")
        .attr("class", "math-displayer")
        .attr("font-size", unitSize)
        .attr("fill", "black");
    tooltip
        .append("rect")
        .attr("x", displayX + eqXOffset + unitSize * 2.5)
        .attr("y", displayY + eqYOffset * offsetMul - unitSize + 2)
        .attr("width", unitSize)
        .attr("height", unitSize)
        .style("stroke", "black")
        .attr("fill", myColor(nthOutputVals[0]))
        .attr("class", "math-displayer")
        .raise();
    tooltip
        .append("text")
        .attr("x", displayX + eqXOffset + unitSize * 2.5)
        .attr("y", displayY + eqYOffset * offsetMul - unitSize / 3)
        .text(roundToTwo(nthOutputVals[0]))
        .attr("class", "math-displayer")
        .attr("font-size", unitSize / 2)
        .attr("fill", determineColor(nthOutputVals[0]));
    tooltip
        .append("text")
        .attr("x", displayX + eqXOffset + unitSize * 4)
        .attr("y", displayY + eqYOffset * offsetMul)
        .text(")+exp(")
        .attr("class", "math-displayer")
        .attr("font-size", unitSize)
        .attr("fill", "black");
    tooltip
        .append("rect")
        .attr("x", displayX + eqXOffset + unitSize * 7.5)
        .attr("y", displayY + eqYOffset * offsetMul - unitSize + 2)
        .attr("width", unitSize)
        .attr("height", unitSize)
        .style("stroke", "black")
        .attr("fill", myColor(nthOutputVals[1]))
        .attr("class", "math-displayer")
        .raise();
    tooltip
        .append("text")
        .attr("x", displayX + eqXOffset + unitSize * 7.5)
        .attr("y", displayY + eqYOffset * offsetMul - unitSize / 3)
        .text(roundToTwo(nthOutputVals[1]))
        .attr("class", "math-displayer")
        .attr("font-size", unitSize / 2)
        .attr("fill", determineColor(nthOutputVals[1]));

    tooltip
        .append("text")
        .attr("x", displayX + eqXOffset + unitSize * 9)
        .attr("y", displayY + eqYOffset * offsetMul)
        .text(")+exp(")
        .attr("class", "math-displayer")
        .attr("font-size", unitSize)
        .attr("fill", "black");
    tooltip
        .append("rect")
        .attr("x", displayX + eqXOffset + unitSize * 12.5)
        .attr("y", displayY + eqYOffset * offsetMul - unitSize + 2)
        .attr("width", unitSize)
        .attr("height", unitSize)
        .style("stroke", "black")
        .attr("fill", myColor(nthOutputVals[2]))
        .attr("class", "math-displayer")
        .raise();
    tooltip
        .append("text")
        .attr("x", displayX + eqXOffset + unitSize * 12.5)
        .attr("y", displayY + eqYOffset * offsetMul - unitSize / 3)
        .text(roundToTwo(nthOutputVals[2]))
        .attr("class", "math-displayer")
        .attr("font-size", unitSize / 2)
        .attr("fill", determineColor(nthOutputVals[2]));    

    tooltip
        .append("text")
        .attr("x", displayX + eqXOffset + unitSize * 14)
        .attr("y", displayY + eqYOffset * offsetMul)
        .text(")+exp(")
        .attr("class", "math-displayer")
        .attr("font-size", unitSize)
        .attr("fill", "black");
    tooltip
        .append("rect")
        .attr("x", displayX + eqXOffset + unitSize * 17.5)
        .attr("y", displayY + eqYOffset * offsetMul - unitSize + 2)
        .attr("width", unitSize)
        .attr("height", unitSize)
        .style("stroke", "black")
        .attr("fill", myColor(nthOutputVals[3]))
        .attr("class", "math-displayer")
        .raise();
    tooltip
        .append("text")
        .attr("x", displayX + eqXOffset + unitSize * 17.5)
        .attr("y", displayY + eqYOffset * offsetMul - unitSize / 3)
        .text(roundToTwo(nthOutputVals[3]))
        .attr("class", "math-displayer")
        .attr("font-size", unitSize / 2)
        .attr("fill", determineColor(nthOutputVals[3]));
    tooltip
        .append("text")
        .attr("x", displayX + eqXOffset + unitSize * 19)
        .attr("y", displayY + eqYOffset * offsetMul)
        .text(")")
        .attr("class", "math-displayer")
        .attr("font-size", unitSize)
        .attr("fill", "black");

    //lower part finished
    //eq sign and result
    tooltip
        .append("text")
        .attr("x", endFLPt[0] + unitSize * 11)
        .attr("y", endFLPt[1])
        .text("=")
        .attr("class", "math-displayer")
        .attr("font-size", unitSize)
        .attr("fill", "black");
    tooltip
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
    tooltip
        .append("text")
        .attr("x", endFLPt[0] + unitSize * 12)
        .attr("y", endFLPt[1] - unitSize / 2)
        .text(roundToTwo(nthResult[Number(rectID)]))
        .attr("class", "math-displayer")
        .attr("font-size", unitSize / 2)
        .attr("fill", textColor);

    const scaleFactor = 1.5;

        // 获取 tooltip 元素的边界框
        const bbox = tooltip.node()?.getBBox();

        // 计算中心点
        if(bbox!=undefined){
            const centerX = bbox.x + bbox.width / 2;
            const centerY = bbox.y + bbox.height / 2;

            // 将缩放中心设置为元素的中心点
            tooltip.attr('transform', `translate(${centerX}, ${centerY}) scale(${scaleFactor}) translate(${-centerX}, ${-centerY})`);

        }
}

export function drawActivationExplanation(
    x: number,
    y: number,
    title: string,
    formula: string,
    description: string
) {
    const displayW = 250;
    const displayH = 75;

    //find coordination for the math displayer first
    const displayX = x + 10;
    const displayY = y - 10;

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
        .attr("class", "math-displayer procVis to-be-removed")
        .raise();

    const titleYOffset = 10;
    const titleXOffset = 50;
    d3.select(".mats")
        .append("text")
        .attr("x", displayX + titleXOffset)
        .attr("y", displayY + titleYOffset)
        .text(title)
        .attr("class", "math-displayer procVis to-be-removed")
        .attr("font-size", titleYOffset)
        .attr("fill", "black");
    const eqXOffset = titleXOffset / 2;
    const eqYOffset = titleYOffset * 2.5;
    const unitSize = eqXOffset / 3 + 3;
    const upperOffset = unitSize * 2;
    d3.select(".mats")
        .append("text")
        .attr("x", displayX + eqXOffset)
        .attr("y", displayY + eqYOffset)
        .text(formula)
        .attr("class", "math-displayer procVis to-be-removed")
        .attr("font-size", unitSize)
        .attr("fill", "black");
    d3.select(".mats")
        .append("text")
        .attr("x", displayX + eqXOffset)
        .attr("y", displayY + eqYOffset + unitSize * 1.5)
        .text(description)
        .attr("class", "to-be-removed math-displayer procVis")
        .attr("font-size", unitSize)
        .attr("fill", "black");
}

export function drawMatmulExplanation(
    x: number,
    y: number,
    title: string,
    description: string
) {
    const displayW = 350;
    const displayH = 50;

    //find coordination for the math displayer first
    const displayX = x + 10;
    const displayY = y - 10;

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
        .attr("class", "math-displayer procVis")
        .raise();

    const titleYOffset = 10;
    const titleXOffset = 50;
    d3.select(".mats")
        .append("text")
        .attr("x", displayX + 100)
        .attr("y", displayY + titleYOffset)
        .text(title)
        .attr("class", "math-displayer procVis")
        .attr("font-size", titleYOffset)
        .attr("fill", "black")
        .raise();
    const eqXOffset = titleXOffset / 2;
    const eqYOffset = titleYOffset * 2.5;
    const unitSize = eqXOffset / 3 + 3;
    const upperOffset = unitSize * 2;
    d3.select(".mats")
        .append("text")
        .attr("x", displayX + eqXOffset)
        .attr("y", displayY + eqYOffset)
        .text(description)
        .attr("class", "math-displayer procVis")
        .attr("font-size", unitSize)
        .attr("fill", "black")
        .raise();
}

export function graphVisDrawMatmulExplanation(svg: any, x:number, y:number, title:string, description:string){
    const displayW = 600;
    const displayH = 50;

    //find coordination for the math displayer first
    const displayX = x - 30;
    const displayY = y - 20;

    //add displayer
    svg
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
        .attr("class", "math-displayer procVis")
        .raise();

    const titleYOffset = 20;
    const titleXOffset = 200;
    svg
        .append("text")
        .attr("x", displayX + titleXOffset)
        .attr("y", displayY + titleYOffset)
        .text(title)
        .attr("class", "math-displayer procVis")
        .attr("font-size", "17px")
        .attr("font-family", "monospace")
        .attr("font-weight", "bold")
        .attr("fill", "black").raise();
    const eqXOffset = 30;
    const eqYOffset = 40;
    const unitSize = eqXOffset / 3 + 3;
    const upperOffset = unitSize * 2;
    svg
        .append("text")
        .attr("x", displayX + eqXOffset)
        .attr("y", displayY + eqYOffset)
        .text(description)
        .attr("class", "math-displayer procVis")
        .attr("font-size", "17px")
        .attr("font-family", "monospace")
        .attr("fill", "black").raise();
}





export function drawDotProduct(
    dummy: any,
    rectID: any,
    X: number[],
    Xv: any,
    curveDir: any,
    coordFeatureVis: any,
    myColor: any
) {
    //data fetching - get the current value, aggregated vector, and weight vector

    const math = create(all, {});
    let currentVal = dummy[Number(rectID)];
    let aggregatedVector: number[] = X;
    let transposedXv = math.transpose(Xv);
    transposedXv = flipVertically(transposedXv);
    let weightVector: number[] = transposedXv[Number(rectID)];

        //first few data points for example
        const dataSamples = [
            aggregatedVector[0],
            weightVector[0],
            aggregatedVector[1],
            weightVector[1]
        ];
        let operators = ["x", "  +", "   x", "      ···    = "];

        if(weightVector.length==2&&aggregatedVector.length==2){
            operators[3] = "           =";
        }

        //matmul-displayer interaction
        let displayerOffset = -150;
        if(curveDir==1)displayerOffset = 100;
        let globalXOffest = 20;
        let displayerX = coordFeatureVis[0] + globalXOffest;
        let displayerY = coordFeatureVis[1] + displayerOffset + 20;

    const displayW = 300;
    const displayH = 100;

    //drawPoints(".mats", "red", [[displayerX, displayerY]])

        const tooltip = d3.select(".mats").append("g");

        const rectSize = 12;

        tooltip
            .append("rect")
            .attr("x", displayerX - globalXOffest)
            .attr("y", displayerY - 10)
            .attr("y", displayerY - 10)
            .attr("width", displayW)
            .attr("height", displayH)
            .attr("rx", rectSize)
            .attr("ry", rectSize)
            .style("fill", "white")
            .style("stroke", "black")
            .style("stroke-width", 2)
            .attr("class", "matmul-displayer procVis")
            .lower();
        
        const titleYOffset = 5;
        const titleXOffset = 50;
        tooltip
            .append("text")
            .attr("x", displayerX + titleXOffset - globalXOffest)
            .attr("y", displayerY + titleYOffset * 3)
            .text("Matmul Visualization")
            .attr("class", "matmul-displayer procVis")
            .attr("font-size", 20)
            .attr("fill", "black");
        
        const vectorLength = displayH - titleYOffset;
        
        let h = vectorLength / aggregatedVector.length * 0.75;
        let h2 = vectorLength / weightVector.length * 0.75;
        let w = 14;
        if(h>vectorLength / weightVector.length)h = h2



        const eqXOffset = titleXOffset / 2;
        const eqYOffset = titleYOffset * 2.5;
        const unitSize = (eqXOffset / 3 + 8)/2;
        const upperOffset = unitSize * 2;
        tooltip
            .append("text")
            .attr("x", displayerX + 3)
            .attr("y", displayerY + vectorLength/2 + 3)
            .text("dot(")
            .attr("class", "matmul-displayer procVis")
            .attr("font-size", 20)
            .attr("fill", "black");

        tooltip
            .append("text")
            .attr("x", displayerX + 3 + eqXOffset/2 + vectorLength)
            .attr("y", displayerY + vectorLength/2 + 3)
            .text(",")
            .attr("class", "matmul-displayer procVis")
            .attr("font-size", 20)
            .attr("fill", "black");
        
        tooltip
            .append("text")
            .attr("x", displayerX + 3 + eqXOffset/2 + vectorLength + vectorLength/1.5)
            .attr("y", displayerY + vectorLength/2 + 3)
            .text(")")
            .attr("class", "matmul-displayer procVis")
            .attr("font-size", 20)
            .attr("fill", "black");

        tooltip
            .append("text")
            .attr("x", displayerX -5)
            .attr("y", displayerY + vectorLength/2 + 25)
            .text("=")
            .attr("class", "matmul-displayer procVis")
            .attr("font-size", 15)
            .attr("fill", "black");

        for(let i=0; i<dataSamples.length; i++){
            tooltip
                .append("rect")
                .attr("x", displayerX + 3 + unitSize*(i+1)+30*i)
                .attr("y", displayerY + vectorLength/2 + 20 - unitSize)
                .attr("width", unitSize*2.5)
                .attr("height", unitSize*2.5)
                .style("stroke", "grey")
                .style("stroke-width", 0.1)
                .attr("fill", myColor(dataSamples[i]))
                .attr("class", "matmul-displayer procVis")
                .raise();
            let color = "white";
            if(dataSamples[i]<0.5){color = "black"}
            tooltip
                .append("text")
                .attr("x", displayerX + 0.5 + unitSize*(i+1)+30*i + unitSize/2)
                .attr("y", displayerY + vectorLength/2 + 20 + unitSize/2)
                .text(roundToTwo(dataSamples[i]))
                .attr("class", "matmul-displayer procVis")
                .attr("font-size", unitSize * 0.9)
                .attr("fill", color);
        }

        

        for(let i=0; i<operators.length; i++){
            const text = tooltip
            .append("text").attr("xml:space", "preserve")
            .attr("x", displayerX + 3 + unitSize*(i+1) + 25*(i+1))
            .attr("y", displayerY + vectorLength/2 + 25 )
            .text(operators[i])
            .attr("font-size", 15)
            .attr("class", "matmul-displayer procVis")
            .raise();
            if(i==operators.length-1){
                text.style("font-weight", "bold");
            }
    }

        tooltip
            .append("rect")
            .attr("x", displayerX + 3 + eqXOffset/2 + vectorLength + vectorLength)
            .attr("y", displayerY + vectorLength/2 + 20 - unitSize)
            .attr("width", unitSize*2.5)
            .attr("height", unitSize*2.5)
            .style("stroke", "grey")
            .style("stroke-width", 0.1)
            .attr("fill", myColor(currentVal))
            .attr("class", "matmul-displayer procVis")
            .raise();
        
            let color = "white";
            if(currentVal<0.5){color = "black"}
            tooltip
                .append("text")
                .attr("x", displayerX + 0.5 + eqXOffset/2 + vectorLength + vectorLength + unitSize/2)
                .attr("y", displayerY + vectorLength/2 + 20 + unitSize/2)
                .text(roundToTwo(currentVal))
                .attr("class", "matmul-displayer procVis")
                .attr("font-size", unitSize * 0.9)
                .attr("fill", color);
        
        
        //draw the aggregated vector
        for(let i=0; i<aggregatedVector.length; i++){
            tooltip
                .append("rect")
                .attr("x", displayerX + eqXOffset * 2 + i*h/2)
                .attr("y", displayerY + eqYOffset * -0.5 + vectorLength/2)
                .attr("width", h/2)
                .attr("height", w/2)
                .attr("stroke", "gray")
                .attr("stroke-width", 0.1)
                .attr("fill", myColor(aggregatedVector[i]))
                .attr("class", "procVis matmul-displayer").raise();
        }

        //draw the weight vector
        for(let i=0; i<weightVector.length; i++){
            tooltip
                .append("rect")
                .attr("x", displayerX + eqXOffset * 5.5)
                .attr("y", displayerY + eqYOffset * 1.5 + i*h2/2)
                .attr("width", w/2)
                .attr("height", h2/2)
                .attr("stroke", "gray")
                .attr("stroke-width", 0.1)
                .attr("fill", myColor(weightVector[i]))
                .attr("class", "procVis matmul-displayer").raise();
        }

           // 定义缩放比例
        const scaleFactor = 1.5;

        // 获取 tooltip 元素的边界框
        const bbox = tooltip.node()?.getBBox();

        // 计算中心点
        if(bbox!=undefined){
            const centerX = bbox.x + bbox.width / 2;
            const centerY = bbox.y + bbox.height / 2;

            // 将缩放中心设置为元素的中心点
            tooltip.attr('transform', `translate(${centerX}, ${centerY}) scale(${scaleFactor}) translate(${-centerX}, ${-centerY})`);

        }

}

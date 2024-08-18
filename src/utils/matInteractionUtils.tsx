import * as d3 from "d3";
import { roundToTwo } from "../components/WebUtils";
import { flipVertically, softmax } from "./utils";
import { create, all, transposeDependencies } from "mathjs";

//---------------------------functions for the softmax interaction in the graph classifier------------------------------
export function drawAttnDisplayer(
    attnDisplayer: any,
    dX: number,
    dY: number,
    eij: number[],
    lgIndices: number[][],
    targetE: number,
    myColor: any,
    ithIdx: number
){
    attnDisplayer
            .append("rect")
            .attr("x", dX + 10)
            .attr("y", dY + 10)
            .attr("rx", 5)
            .attr("ry", 5)
            .attr("width", 375)
            .attr("height", 150)
            .attr("fill", "white")
            .attr("stroke", "black")
            .attr("stroke-width", 1)
            .attr("class", "procVis attn-displayer");

        //draw the equation
        attnDisplayer
            .append("text")
            .text(
                "Attention Coefficient for " + 
                `a_${lgIndices[0][0]}_${lgIndices[ithIdx][1]}`
            )
            .attr("x", dX + 150)
            .attr("y", dY + 25)
            .attr("text-anchor", "middle")
            .attr("font-size", 15)
            .attr("class", "procVis attn-displayer");

        attnDisplayer
            .append("text")
            .text(`a_${lgIndices[0][0]}_${lgIndices[ithIdx][1]}`+"  =  ")
            .attr("x", dX + 15)
            .attr("y", dY + 75)
            .attr("xml:space", "preserve")
            .attr("font-size", 15)
            .attr("class", "procVis attn-displayer");

        for (let i = 0; i < eij.length; i++) {
            attnDisplayer
                .append("rect")
                .attr("x", dX + 100 + 65 * i)
                .attr("y", dY + 75)
                .attr("width", 15)
                .attr("height", 15)
                .attr("fill", myColor(eij[i]))
                .attr("stroke", "black")
                .attr("class", "procVis attn-displayer attnE")
                .attr("id", `e-${i}`).attr("index", i);

            if (i != 0) {
                attnDisplayer
                    .append("text")
                    .text("+")
                    .attr("x", dX + 100 + 65 * i - 30)
                    .attr("y", dY + 75 + 12.5)
                    .attr("text-anchor", "middle")
                    .attr("font-size", 15)
                    .attr("class", "procVis attn-displayer");
            }

            type Point = { x: number; y: number };
            const points: Point[] = [
                { x: dX + 100, y: dY + 65 },
                { x: dX + 100 + 65 * (eij.length - 1), y: dY + 65 },
            ];

            const lineGenerator = d3
                .line<Point>() // 使用泛型指定类型
                .x((d: Point) => d.x) // 设置x坐标
                .y((d: Point) => d.y); // 设置y坐标

            const pathData = lineGenerator(points);

            // 5. 将路径添加到SVG中
            attnDisplayer
                .append("path")
                .attr("d", pathData)
                .attr("stroke", "black")
                .attr("stroke-width", 1)
                .attr("fill", "none")
                .attr("id", "targetE"); // 确保路径不被填充

            attnDisplayer
                .append("text")
                .text("exp(" + `e_${lgIndices[i][0]}_${lgIndices[i][1]}` + ")")
                .attr("x", dX + 100 + 65 * i)
                .attr("y", dY + 75 + 12.5)
                .attr("text-anchor", "middle")
                .attr("font-size", 10)
                .attr("class", "procVis attn-displayer attnE").attr("index", i);
        }

        attnDisplayer
            .append("rect")
            .attr("x", dX + 100 + 50)
            .attr("y", dY + 50 - 7.5)
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", myColor(targetE))
            .attr("class", "procVis attn-displayer attnTargetE attnE")
            .attr("stroke", "black").attr("index", 0);

        attnDisplayer
            .append("text")
            .text("exp(" + `e_${lgIndices[0][0]}_${lgIndices[ithIdx][1]}` + ")")
            .attr("x", dX + 100 + 50)
            .attr("y", dY + 50)
            .attr("text-anchor", "middle")
            .attr("font-size", 10)
            .attr("class", "procVis attn-displayer attnTargetE attnE").attr("index", 0);
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
){
            eDisplayer
                .append("text")
                .text(
                    `e_${lgIndices[0][0]}_${jthIndexElement} = LeakyReLU(                            +                        )`
                )
                .attr("x", dX + 15)
                .attr("y", dY + 125)
                .attr("xml:space", "preserve")
                .attr("font-size", 12)
                .attr("class", "procVis attn-displayer")
                .attr("id", "leakyRelu");

            for (let i = 0; i < dstVector.length; i++) {
                eDisplayer
                    .append("rect")
                    .attr("x", dX + 140 - 10 + 12.5)
                    .attr("y", dY + 112.5 + i * (25 / srcVector.length))
                    .attr("width", 2.5)
                    .attr("height", 25 / srcVector.length)
                    .attr("fill", myColor(srcVector[i]));

                eDisplayer
                    .append("rect")
                    .attr("x", dX + 200 + 12.5 + 20)
                    .attr("y", dY + 112.5 + i * (25 / dstVector.length))
                    .attr("width", 2.5)
                    .attr("height", 25 / dstVector.length)
                    .attr("fill", myColor(dstVector[i]))
                    .raise();
            }

            

            for (let i = 0; i < inputVector.length; i++) {
                eDisplayer
                    .append("rect")
                    .attr(
                        "x",
                        dX + 140 - 10 + 50 + i * (25 / inputVector.length)
                    )
                    .attr("y", dY + 112.5 + 12.5)
                    .attr("width", 25 / inputVector.length)
                    .attr("height", 2.5)
                    .attr("fill", myColor(inputVector[i]));

                eDisplayer
                    .append("rect")
                    .attr(
                        "x",
                        dX + 200 + 20 + 50 + i * (25 / inputVector.length)
                    )
                    .attr("y", dY + 112.5 + 12.5)
                    .attr("width", 25 / inputVector.length)
                    .attr("height", 2.5)
                    .attr("fill", myColor(inputVector[i]));
            }

            let imageMat = "./assets/PNGs/GATConvMat1.png";
            let imgW = 50;
            let imgH = 50;

            let offset = 0;

            if(layerID==1){
                imageMat = "./assets/PNGs/GATConvMat2.png";
                imgW = 25;
                imgH = 25;
                offset = 10;
            }

            eDisplayer
                .append("image")
                .attr("xlink:href", imageMat)
                .attr("x", dX + 75 + 75 - 10 + offset)
                .attr("y", dY + 75 + 25 + offset)
                .attr("width", imgW)
                .attr("height", imgH);

            eDisplayer
                .append("image")
                .attr("xlink:href", imageMat)
                .attr("x", dX + 75 + 75 + 60 + 20 + offset)
                .attr("y", dY + 75 + 25 + offset)
                .attr("width", imgW)
                .attr("height", imgH);
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
    d3.select(".mats")
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
    d3.select(".mats")
        .append("text")
        .attr("x", displayX + eqXOffset + upperOffset)
        .attr("y", displayY + eqYOffset)
        .text("exp(")
        .attr("class", "math-displayer")
        .attr("font-size", unitSize)
        .attr("fill", "black");
    d3.select(".mats")
        .append("rect")
        .attr("x", displayX + eqXOffset + unitSize * 2.5 + upperOffset)
        .attr("y", displayY + eqYOffset - unitSize + 2)
        .attr("width", unitSize)
        .attr("height", unitSize)
        .style("stroke", "black")
        .attr("fill", myColor(result[id]))
        .attr("class", "math-displayer")
        .raise();
    d3.select(".mats")
        .append("text")
        .attr("x", displayX + eqXOffset + unitSize * 2.5 + upperOffset)
        .attr("y", displayY + eqYOffset - unitSize / 3)
        .text(roundToTwo(result[id]))
        .attr("class", "math-displayer")
        .attr("font-size", unitSize / 2)
        .attr("fill", "white");
    d3.select(".mats")
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
    const path1 = d3
        .select(".mats")
        .append("path")
        .attr("d", d3.line()([startFLPt, endFLPt]))
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
        .attr("fill", myColor(result[0]))
        .attr("class", "math-displayer")
        .raise();
    d3.select(".mats")
        .append("text")
        .attr("x", displayX + eqXOffset + unitSize * 2.5)
        .attr("y", displayY + eqYOffset * offsetMul - unitSize / 3)
        .text(roundToTwo(result[0]))
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
        .attr("fill", myColor(result[1]))
        .attr("class", "math-displayer")
        .raise();
    d3.select(".mats")
        .append("text")
        .attr("x", displayX + eqXOffset + unitSize * 7.5)
        .attr("y", displayY + eqYOffset * offsetMul - unitSize / 3)
        .text(roundToTwo(result[1]))
        .attr("class", "math-displayer")
        .attr("font-size", unitSize / 2)
        .attr("fill", "white");
    d3.select(".mats")
        .append("text")
        .attr("x", displayX + eqXOffset + unitSize * 9)
        .attr("y", displayY + eqYOffset * offsetMul)
        .text(")")
        .attr("class", "math-displayer")
        .attr("font-size", unitSize)
        .attr("fill", "black");
    //lower part finished
    //eq sign and result
    d3.select(".mats")
        .append("text")
        .attr("x", endFLPt[0] + unitSize / 2)
        .attr("y", endFLPt[1])
        .text("=")
        .attr("class", "math-displayer")
        .attr("font-size", unitSize)
        .attr("fill", "black");
    d3.select(".mats")
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
    d3.select(".mats")
        .append("text")
        .attr("x", endFLPt[0] + unitSize * 1.5)
        .attr("y", endFLPt[1] - unitSize / 2)
        .text(roundToTwo(finalResult[id]))
        .attr("class", "math-displayer")
        .attr("font-size", unitSize / 2)
        .attr("fill", textColor);
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


export function drawActivationExplanation(x:number, y:number, title:string, formula:string, description:string){
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
        .attr("class", "math-displayer procVis")
        .raise();

    const titleYOffset = 10;
    const titleXOffset = 50;
    d3.select(".mats")
        .append("text")
        .attr("x", displayX + titleXOffset)
        .attr("y", displayY + titleYOffset)
        .text(title)
        .attr("class", "math-displayer procVis")
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
        .attr("class", "math-displayer procVis")
        .attr("font-size", unitSize)
        .attr("fill", "black");
    d3.select(".mats")
        .append("text")
        .attr("x", displayX + eqXOffset)
        .attr("y", displayY + eqYOffset + unitSize * 1.5)
        .text(description)
        .attr("class", "math-displayer procVis")
        .attr("font-size", unitSize)
        .attr("fill", "black");
}

export function drawMatmulExplanation(x:number, y:number, title:string, description:string){
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
        .attr("fill", "black").raise();
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
        .attr("fill", "black").raise();
}

export function drawDotProduct(
dummy:any,
rectID:any,
X:number[],
Xv:any,
curveDir:any,
coordFeatureVis:any,
myColor:any
){

        //data fetching - get the current value, aggregated vector, and weight vector

        const math = create(all, {})
        let currentVal = dummy[Number(rectID)];
        let aggregatedVector:number[] = X;
        let transposedXv = math.transpose(Xv);
        transposedXv = flipVertically(transposedXv);
        let weightVector:number[] = transposedXv[Number(rectID)];



        //first few data points for example
        const dataSamples = [
            aggregatedVector[0],
            weightVector[0],
            aggregatedVector[1],
            weightVector[1]
        ];
        const operators = ["x", "+", "x", "... = "];

        //matmul-displayer interaction
        let displayerOffset = -150;
        if(curveDir==1)displayerOffset = 100;
        let displayerX = coordFeatureVis[0];
        let displayerY = coordFeatureVis[1] + displayerOffset;

        const displayW = 300;
        const displayH = 100;

        //drawPoints(".mats", "red", [[displayerX, displayerY]])

        d3.select(".mats")
            .append("rect")
            .attr("x", displayerX)
            .attr("y", displayerY - 10)
            .attr("width", displayW)
            .attr("height", displayH)
            .attr("rx", 10)
            .attr("ry", 10)
            .style("fill", "white")
            .style("stroke", "black")
            .style("stroke-width", 2)
            .attr("class", "matmul-displayer procVis")
            .lower();
        
        const titleYOffset = 5;
        const titleXOffset = 50;
        d3.select(".mats")
            .append("text")
            .attr("x", displayerX + titleXOffset)
            .attr("y", displayerY + titleYOffset)
            .text("Matmul Visualization")
            .attr("class", "matmul-displayer procVis")
            .attr("font-size", titleYOffset*2)
            .attr("fill", "black");
        
        const vectorLength = displayH - titleYOffset;
        
        let h = vectorLength / aggregatedVector.length;
        let h2 = vectorLength / weightVector.length;
        let w = 11.25;
        if(h>vectorLength / weightVector.length)h = vectorLength / weightVector.length;



        const eqXOffset = titleXOffset / 2;
        const eqYOffset = titleYOffset * 2.5;
        const unitSize = (eqXOffset / 3 + 3)/2;
        const upperOffset = unitSize * 2;
        d3.select(".mats")
            .append("text")
            .attr("x", displayerX + 3)
            .attr("y", displayerY + vectorLength/2 + 3)
            .text("dot(")
            .attr("class", "matmul-displayer procVis")
            .attr("font-size", titleYOffset*2)
            .attr("fill", "black");

        d3.select(".mats")
            .append("text")
            .attr("x", displayerX + 3 + eqXOffset/2 + vectorLength)
            .attr("y", displayerY + vectorLength/2 + 3)
            .text(",")
            .attr("class", "matmul-displayer procVis")
            .attr("font-size", titleYOffset*2)
            .attr("fill", "black");
        
        d3.select(".mats")
            .append("text")
            .attr("x", displayerX + 3 + eqXOffset/2 + vectorLength + vectorLength/1.5)
            .attr("y", displayerY + vectorLength/2 + 3)
            .text(")")
            .attr("class", "matmul-displayer procVis")
            .attr("font-size", titleYOffset*2)
            .attr("fill", "black");

        d3.select(".mats")
            .append("text")
            .attr("x", displayerX + 3)
            .attr("y", displayerY + vectorLength/2 + 20)
            .text("=")
            .attr("class", "matmul-displayer procVis")
            .attr("font-size", titleYOffset*2)
            .attr("fill", "black");

        for(let i=0; i<dataSamples.length; i++){
            d3.select(".mats")
                .append("rect")
                .attr("x", displayerX + 3 + unitSize*(i+1)+30*i)
                .attr("y", displayerY + vectorLength/2 + 20 - unitSize)
                .attr("width", unitSize*2)
                .attr("height", unitSize*2)
                .style("stroke", "black")
                .attr("fill", myColor(dataSamples[i]))
                .attr("class", "matmul-displayer procVis")
                .raise();
            let color = "white";
            if(dataSamples[i]<0.5){color = "black"}
            d3.select(".mats")
                .append("text")
                .attr("x", displayerX + 3 + unitSize*(i+1)+30*i)
                .attr("y", displayerY + vectorLength/2 + 20)
                .text(roundToTwo(dataSamples[i]))
                .attr("class", "matmul-displayer procVis")
                .attr("font-size", unitSize)
                .attr("fill", color);
        }

        

        for(let i=0; i<operators.length; i++){
            d3.select(".mats")
            .append("text")
            .attr("x", displayerX + 3 + unitSize*(i+1) + 30*(i+1))
            .attr("y", displayerY + vectorLength/2 + 20)
            .text(operators[i])
            .attr("font-size", unitSize)
            .attr("class", "matmul-displayer procVis")
            .raise();
        }

        d3.select(".mats")
            .append("rect")
            .attr("x", displayerX + 3 + eqXOffset/2 + vectorLength + vectorLength/1.5)
            .attr("y", displayerY + vectorLength/2 + 20 - unitSize)
            .attr("width", unitSize*2)
            .attr("height", unitSize*2)
            .style("stroke", "black")
            .attr("fill", myColor(currentVal))
            .attr("class", "matmul-displayer procVis")
            .raise();
        
            let color = "white";
            if(currentVal<0.5){color = "black"}
            d3.select(".mats")
                .append("text")
                .attr("x", displayerX + 3 + eqXOffset/2 + vectorLength + vectorLength/1.5)
                .attr("y", displayerY + vectorLength/2 + 20)
                .text(roundToTwo(currentVal))
                .attr("class", "matmul-displayer procVis")
                .attr("font-size", unitSize)
                .attr("fill", color);
        
        
        //draw the aggregated vector
        for(let i=0; i<aggregatedVector.length; i++){
            d3.select(".mats")
                .append("rect")
                .attr("x", displayerX + eqXOffset+i*h/2)
                .attr("y", displayerY + vectorLength/2)
                .attr("width", h/2)
                .attr("height", w/2)
                .attr("fill", myColor(aggregatedVector[i]))
                .attr("class", "procVis matmul-displayer").raise();
        }

        //draw the weight vector
        for(let i=0; i<weightVector.length; i++){
            d3.select(".mats")
                .append("rect")
                .attr("x", displayerX + eqXOffset * 5)
                .attr("y", displayerY + eqYOffset + i*h2/2)
                .attr("width", w/2)
                .attr("height", h2/2)
                .attr("fill", myColor(weightVector[i]))
                .attr("class", "procVis matmul-displayer").raise();
        }

        //draw franes
        d3.select(".mats")
            .append("rect")
            .attr("x", displayerX + eqXOffset)
            .attr("y", displayerY + vectorLength/2)
            .attr("width", h/2 * aggregatedVector.length)
            .attr("height", w/2)
            .attr("fill", "none")
            .attr("class", "procVis matmul-displayer")
            .attr("stroke", "black")
            .raise();

        d3.select(".mats")
            .append("rect")
            .attr("x", displayerX + eqXOffset * 5)
            .attr("y", displayerY + eqYOffset)
            .attr("width", w/2)
            .attr("height", h2/2 * weightVector.length)
            .attr("fill", "none")
            .attr("class", "procVis matmul-displayer")
            .attr("stroke", "black")
            .raise();

}
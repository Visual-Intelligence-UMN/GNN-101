import * as d3 from "d3";
import { roundToTwo } from "../components/WebUtils";
import { flipVertically, softmax } from "./utils";
import { create, all, transposeDependencies } from "mathjs";

//---------------------------functions for the softmax interaction in the graph classifier------------------------------
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
        .attr("fill", determineColor(result[0]));
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
        .attr("fill", determineColor(result[1]));
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
        .attr("fill", determineColor(nthOutputVals[Number(rectID)]));
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
        .attr("fill", determineColor(nthOutputVals[0]));
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
        .attr("fill", determineColor(nthOutputVals[1]));

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
        .attr("fill", determineColor(nthOutputVals[2]));    

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
        .attr("fill", determineColor(nthOutputVals[3]));
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
        let operators = ["x", "+", "  x", "          ......    = "];

        if(weightVector.length==2&&aggregatedVector.length==2){
            operators[3] = "           =";
        }

        //matmul-displayer interaction
        let displayerOffset = -150;
        if(curveDir==1)displayerOffset = 100;
        let displayerX = coordFeatureVis[0];
        let displayerY = coordFeatureVis[1] + displayerOffset + 20;

        const displayW = 250;
        const displayH = 100;

        //drawPoints(".mats", "red", [[displayerX, displayerY]])

        const tooltip = d3.select(".mats").append("g");

        tooltip
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
        tooltip
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
        tooltip
            .append("text")
            .attr("x", displayerX + 3)
            .attr("y", displayerY + vectorLength/2 + 3)
            .text("dot(")
            .attr("class", "matmul-displayer procVis")
            .attr("font-size", titleYOffset*2)
            .attr("fill", "black");

        tooltip
            .append("text")
            .attr("x", displayerX + 3 + eqXOffset/2 + vectorLength - 10)
            .attr("y", displayerY + vectorLength/2 + 3)
            .text(",")
            .attr("class", "matmul-displayer procVis")
            .attr("font-size", titleYOffset*2)
            .attr("fill", "black");
        
        tooltip
            .append("text")
            .attr("x", displayerX + 3 + eqXOffset/2 + vectorLength + 33)
            .attr("y", displayerY + vectorLength/2 + 3)
            .text(")")
            .attr("class", "matmul-displayer procVis")
            .attr("font-size", titleYOffset*2)
            .attr("fill", "black");

        tooltip
            .append("text")
            .attr("x", displayerX + 3)
            .attr("y", displayerY + vectorLength/2 + 20)
            .text("=")
            .attr("class", "matmul-displayer procVis")
            .attr("font-size", titleYOffset*2)
            .attr("fill", "black");

        for(let i=0; i<dataSamples.length; i++){
            tooltip
                .append("rect")
                .attr("x", displayerX + 3 + unitSize*(i+1)+30*i)
                .attr("y", displayerY + vectorLength/2 + 20 - unitSize)
                .attr("width", unitSize*2.8)
                .attr("height", unitSize*2.8)
                .style("stroke", "black")
                .attr("fill", myColor(dataSamples[i]))
                .attr("class", "matmul-displayer procVis")
                .attr("text-anchor", "middle")
                .attr("dominant-baseline", "central")   
                .raise();
            let color = "white";
            if(dataSamples[i]<0.5){color = "black"}
            tooltip
                .append("text")
                .attr("x", displayerX + 8 + unitSize*(i+1)+30*i + unitSize/2)
                .attr("y", displayerY + vectorLength/2 + 20 + unitSize/2)
                .text(roundToTwo(dataSamples[i]))
                .attr("class", "matmul-displayer procVis")
                .attr("font-size", unitSize - 1)
                .attr("fill", color)
                .attr("text-anchor", "middle")
                .attr("alignment-baseline", "middle");


        }

        

        for(let i=0; i<operators.length; i++){
            tooltip
            .append("text").attr("xml:space", "preserve")
            .attr("x", displayerX + 3 + unitSize*(i+1) + 25*(i+1))
            .attr("y", displayerY + vectorLength/2 + 20 )
            .text(operators[i])
            .attr("font-size", unitSize*1.25)
            .attr("class", "matmul-displayer procVis")
            .raise();
        }

        tooltip
            .append("rect")
            .attr("x", displayerX + 3 + eqXOffset/2 + vectorLength + vectorLength/1.5)
            .attr("y", displayerY + vectorLength/2 + 20 - unitSize)
            .attr("width", unitSize*2.8)
            .attr("height", unitSize*2.8)
            .style("stroke", "black")
            .attr("fill", myColor(currentVal))
            .attr("class", "matmul-displayer procVis")
            .raise();
        
            let color = "white";
            if(currentVal<0.5){color = "black"}
            tooltip
                .append("text")
                .attr("x", displayerX + 8 + eqXOffset/2 + vectorLength + vectorLength/1.5 + unitSize/2)
                .attr("y", displayerY + vectorLength/2 + 20 + unitSize/2)
                .text(roundToTwo(currentVal))
                .attr("class", "matmul-displayer procVis")
                .attr("font-size", unitSize - 1)
                .attr("fill", color)
                .attr("text-anchor", "middle")
                .attr("alignment-baseline", "middle");

        //draw the aggregated vector
        for(let i=0; i<aggregatedVector.length; i++){
            tooltip
                .append("rect")
                .attr("x", displayerX + eqXOffset+i*h/2 + 6) 
                .attr("y", displayerY + vectorLength/2 -3 )
                .attr("width", h/2)
                .attr("height", w/2)
                .attr("fill", myColor(aggregatedVector[i]))
                .attr('id', 'aggregatedVector')
                .attr("class", "procVis matmul-displayer ").raise();
        }

        //draw the weight vector
        for(let i=0; i<weightVector.length; i++){
            tooltip
                .append("rect")
                .attr("x", displayerX + eqXOffset * 5)
                .attr("y", displayerY + eqYOffset + i*h2/2 )
                .attr("width", w/2)
                .attr("height", h2/2)
                .attr("fill", myColor(weightVector[i]))
                .attr("class", "procVis matmul-displayer").raise();
        }

        //draw franes
        tooltip
            .append("rect")
            .attr("x", displayerX + eqXOffset + 6)
            .attr("y", displayerY + vectorLength/2 - 3)
            .attr("width", h/2 * aggregatedVector.length)
            .attr("height", w/2)
            .attr("fill", "none")
            .attr("class", "procVis matmul-displayer")
            .attr("stroke", "black")
            .raise();

            tooltip
            .append("rect")
            .attr("x", displayerX + eqXOffset * 5)
            .attr("y", displayerY + eqYOffset)
            .attr("width", w/2)
            .attr("height", h2/2 * weightVector.length)
            .attr("fill", "none")
            .attr("class", "procVis matmul-displayer")
            .attr("stroke", "black")
            .raise();

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
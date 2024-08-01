import * as d3 from "d3";
import { create, all, matrix, i } from "mathjs";
import { State, myColor } from "./utils";
import { roundToTwo } from "@/components/WebUtils";


export function graphVisDrawMatrixWeight(
    Xt: any,
    startCoordList:any,
    endCoordList:any,
    curveDir:number,
    currentStep:number,
    myColor:any,
    weightMatrixPostions:any,
    featureChannels: number,
    g: any,
    id:string = "tempath",
    mode:string = "normal"

){
    if (!g.selectAll) {
        g = d3.select(g)
    }

    
    let flag = true;


    
    if(Xt[0].length!=Xt.length){
        //weightMatrixPostions = transposeAnyMatrix(weightMatrixPostions);
        flag = false;

        const math = create(all, {});
        Xt = math.transpose(Xt);
    }
    if((Xt[0].length==2 && Xt.length==64)
        ||(Xt[0].length==4 && Xt.length==2)
    ){
        const math = create(all, {});
        Xt = math.transpose(Xt);
    }
    if((weightMatrixPostions.length==4&&weightMatrixPostions[0].length==2)){
        const math = create(all, {});
        Xt = math.transpose(Xt);
    }
    const Xv = Xt[currentStep];

    for (let j = 0; j < Xv.length; j++) {
        let s1 = startCoordList[j];
        let e1 = endCoordList[currentStep];

        if(curveDir==1){
            s1 = startCoordList[startCoordList.length - j - 1];
         e1 = endCoordList[currentStep];
        }

        let m1 = [0,0];
        // if(flag){
        //     m1 = weightMatrixPostions[weightMatrixPostions.length-1-j][currentStep]

        // }else{
        //     m1 = weightMatrixPostions[currentStep][weightMatrixPostions[0].length-1-j];
        // }

        // if(Xt[0].length==64 && Xt.length==2){
        //     m1 = weightMatrixPostions[currentStep][j];
        // }else{
        //     m1 = weightMatrixPostions[weightMatrixPostions.length-1-j][currentStep]
        // }
        
        



        let changed = false;

        if(weightMatrixPostions.length==4&&weightMatrixPostions[0].length==2){
            if(curveDir==-1)m1 = weightMatrixPostions[weightMatrixPostions.length-1-j][currentStep]
            else m1 = weightMatrixPostions[j][currentStep]
            

            changed = true;
        }

        if(weightMatrixPostions.length==2&&weightMatrixPostions[0].length==4){
            if(curveDir==-1)m1 = weightMatrixPostions[j][currentStep]
            else m1 = weightMatrixPostions[weightMatrixPostions.length-1-j][currentStep]
            

            changed = true;
        } 

        if(Xt.length==Xt[0].length || (Xt.length==64 && Xt[0].length==7)){
            m1 = weightMatrixPostions[weightMatrixPostions.length-1-j][currentStep]
                

            changed = true;
        }

        if(Xt.length==Xt[0].length && Xt.length==4){
            if(curveDir==-1)m1 = weightMatrixPostions[weightMatrixPostions.length-1-j][currentStep]
            else m1 = weightMatrixPostions[j][currentStep]
                

            changed = true;
        }

        if(!changed){
            if((Xt[0].length<Xt.length && Xt.length!=64)||(Xt[0].length==64&&Xt.length==2)
            ||(Xt[0].length==34&&Xt.length==4)
            ||(Xt.length==34&&Xt[0].length==4)){
                if(curveDir==-1)m1 = weightMatrixPostions[weightMatrixPostions.length-1-j][currentStep]
                else m1 = weightMatrixPostions[j][currentStep]
                

            }
            else{
                if(curveDir==-1)m1 = weightMatrixPostions[j][currentStep]
                else m1 = weightMatrixPostions[weightMatrixPostions.length-1-j][currentStep]


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
        g
            .append("path")
            .attr("d", pathData1)
            .attr("class", "tempath to-be-removed")
            .style("fill", "none")
            .attr("stroke", "black").attr("id", `tempath${currentStep}`)
            .attr("stroke-width", 2).attr("stroke", myColor(Xv[j])).lower()
            .style("opacity", 1)

        g
            .append("path")
            .attr("d", pathData2)
            .attr("class", "tempath to-be-removed")
            .style("fill", "none")
            .attr("stroke", "black").attr("id", `tempath${currentStep}`)
            .attr("stroke-width", 2).attr("stroke", myColor(Xv[j])).lower()
            .style("opacity", 1)
    }
}


export function drawGraphVisWeightVector(weightMatrixPositions: number[][][], rectW: number, weights: number[][][], index: number, g: any, currentStep: number) {
    if (!g.selectAll) {
        g = d3.selectAll(g)
    }
    let weightMat = weights[index]

    if (index === 0) {
        const math = create(all, {});
        weightMat = math.transpose(weightMat);
    }


    for (let j = 0; j < weightMat[currentStep].length; j++)
    g.append("rect")
                            .attr("x", 130)
                            .attr("y", 20 + rectW * j)
                            .attr("width", 7)
                            .attr("height", rectW)
                            .attr("fill", myColor(weightMat[currentStep][j]))
                            .attr("stroke", "gray")
                            .attr("stroke-width", 0.1)
                            .attr("opacity", 1)
                            .attr("class", "columnUnit math-displayer")
                            .attr("id", `columnUnit-${j}`);

}
export function displayerHandler(node: any, aggregatedData: any, state: State, g: any, displayHeight: number, rectL: number, wmRectL: number, myColor: any, weights: number[][][], index: number, weightsLocation: number[][][], i: number) {

                if (!g.selectAll) {
                    g = d3.selectAll(g)
                }

                d3.select(".graph-displayer").attr("opacity", 1);


                d3.selectAll(".weightUnit").style("opacity", 0.3);
                d3.selectAll(`#tempath${i}`).attr("opacity", 1).raise();
                d3.selectAll(`#weightUnit-${i}`).style("opacity", 1).raise();
                d3.selectAll(`#columnUnit-${i}`).style("opacity", 1).raise();
                

        
                
                let weightMat = weights[index]
                const math = create(all, {});
                weightMat = math.transpose(weightMat);
                weightMat = weightMat.map((row: any) => row.reverse());


                // console.log('weights matrix is', weightMat, 'at index', index, 'and i is', i)
            
                for (let j = 0; j < weightMat[i].length; j++)
                g.append("rect")
                                        .attr("x", 130)
                                        .attr("y", 20 + wmRectL * j)
                                        .attr("width", 7)
                                        .attr("height", wmRectL)
                                        .attr("fill", myColor(weightMat[i][j]))
                                        .attr("stroke", "gray")
                                        .attr("stroke-width", 0.1)
                                        .attr("opacity", 1)
                                        .attr("class", "columnUnit math-displayer")
                                        .attr("id", `columnUnit-${j}`)
                                        .style("opacity", 1)

                const featureGroup = g.append("g")
                .attr("transform", `translate(${70}, ${displayHeight - 40})`);



                g.append("text")
                .attr("x", 70 - 25)
                .attr("y", displayHeight - 65)
                .text("Matmul Visualization")
                .attr("class", "math-displayer")
                .attr("font-size", "10");


                featureGroup.selectAll("rect")
                .data(aggregatedData)
                .enter()
                .append("rect")
                .attr("x", (d: any, i: number) => i * rectL)
                .attr("y", 0)
                .attr("width", rectL)
                .attr("height", 7)
                .attr("class", `math-displayer`)
                .attr("id", (d: any, i: number) => "output-layer-rect-" + i) 
                .style("fill", (d: number) => myColor(d))
                .style("stroke-width", 0.1)
                .style("stroke", "grey")
                .style("opacity", 1);



                g.append("text")
                    .attr("x", 70 - 25)
                    .attr("y", displayHeight - 30)
                    .attr("xml:space", "preserve")
                    .text("dot(                   ,                 )")
                    .attr("class", "math-displayer")
                    .attr("font-size", "10");


                g.append("text")
                    .attr("x", 70 - 30)
                    .attr("y", displayHeight - 10)
                    .attr("xml:space", "preserve")
                    .text("=       x         +         x          ...     =     ")
                    .attr("class", "math-displayer")
                    .attr("font-size", "5");




                // first component
                g.append("rect")    
      
                .attr("x", 70 - 30 + 5)
                .attr("y", displayHeight - 10 - 7)
                .attr("width", 7)
                .attr("height", 7)
                .attr("class", `math-displayer`)
                .style("fill", myColor(aggregatedData[0]))
                .style("stroke-width", 0.1)
                .style("stroke", "grey")
                .style("opacity", 1);

                g.append("text")
                .attr("x", 70 - 30 + 5)
                .attr("y", displayHeight - 10 - 5)
                .text(roundToTwo(aggregatedData[0]))
                .attr("class", "math-displayer")
                .attr("font-size", "3");




                g.append("rect")    
                .attr("x", 70 - 30 + 20)
                .attr("y", displayHeight - 10 - 7)
                .attr("width", 7)
                .attr("height", 7)
                .attr("class", `math-displayer`)
                .style("fill", myColor(weights[index][0][i]))
                .style("stroke-width", 0.1)
                .style("stroke", "grey")
                .style("opacity", 1);

                g.append("text")
                .attr("x", 70 - 30 + 20)
                .attr("y", displayHeight - 10 - 5)
                .text(roundToTwo(weights[index][0][i]))
                .attr("class", "math-displayer")
                .attr("font-size", "3");



                // second component
                g.append("rect")    

                .attr("x", 70 - 30 + 35)
                .attr("y", displayHeight - 10 - 7)
                .attr("width", 7)
                .attr("height", 7)
                .attr("class", `math-displayer`)
                .style("fill", myColor(aggregatedData[1]))
                .style("stroke-width", 0.1)
                .style("stroke", "grey")
                .style("opacity", 1);

                g.append("text")
                .attr("x", 70 - 30 + 35)
                .attr("y", displayHeight - 10 - 5)
                .text(roundToTwo(aggregatedData[1]))
                .attr("class", "math-displayer")
                .attr("font-size", "3");



                g.append("rect")    

                .attr("x", 70 - 30 + 50)
                .attr("y", displayHeight - 10 - 7)
                .attr("width", 7)
                .attr("height", 7)
                .attr("class", `math-displayer`)
                .style("fill", myColor(weights[index][1][i]))
                .style("stroke-width", 0.1)
                .style("stroke", "grey")
                .style("opacity", 1);

                g.append("text")
                .attr("x", 70 - 30 + 50)
                .attr("y", displayHeight - 10 - 5)
                .text(roundToTwo(weights[index][1][i]))
                .attr("class", "math-displayer")
                .attr("font-size", "3");




                // output
                g.append("rect")    

                .attr("x", 70 - 30 + 80)
                .attr("y", displayHeight - 10 - 7)
                .attr("width", 7)
                .attr("height", 7)
                .attr("class", `math-displayer`)
                .style("fill", myColor(node.features[i]))
                .style("stroke-width", 0.1)
                .style("stroke", "grey")
                .style("opacity", 1);

                g.append("text")
                .attr("x", 70 - 30 + 80)
                .attr("y", displayHeight - 10 - 5)
                .text(roundToTwo(node.features[i]))
                .attr("class", "math-displayer")
                .attr("font-size", "3");







    }


export function hoverOverHandler(node: any, aggregatedData: any, state: State, g: any, displayHeight: number, rectL: number, wmRectL: number, myColor: any, weights: number[][][], index: number, weightsLocation: number[][][], Xt: any, startCoordList: any, endCoordList: any, svg: any) {

    

    for (let i = 0; i < node.features.length; i++) {
        d3.select(`.calculatedFeatures${i}`)
            .on("mouseover", function () {
                if (!state.isClicked) {
                    return;
                }
                graphVisDrawMatrixWeight(Xt, startCoordList, endCoordList, -1, i, myColor, weightsLocation, node.features.length, svg)
                d3.selectAll(".calculatedRect").style("opacity", 0.2)
                d3.selectAll(`.calculatedFeatures${i}`).style("opacity", 1)
                d3.selectAll(`#tempath${i}`).style("opacity", 1);
                displayerHandler(node, aggregatedData, state, g, displayHeight, rectL, wmRectL, myColor, weights, index, weightsLocation, i)







    })
            .on("mouseout", function () {
                if (!state.isClicked) {
                    return;
                }
                d3.selectAll(".math-displayer").remove();
                d3.selectAll(".graph-displayer").attr("opacity", 0);
                d3.selectAll(`#weightUnit-${i}`).style("opacity", 0.3).raise();
                d3.selectAll(`#columnUnit-${i}`).style("opacity", 0).raise();
                d3.selectAll(`#tempath${i}`).style("opacity", 0).raise();
                d3.selectAll(".weightUnit").style("opacity", 1);
                d3.selectAll(".calculatedRect").style("opacity", 1)
                

            });
    }
}

export function graphVisDrawActivationExplanation(x:number, y:number, title:string, formula:string, description:string, svg: any){
    const displayW = 250;
    const displayH = 75;

    //find coordination for the math displayer first
    const displayX = x + 10;
    const displayY = y - 10;

    if (!svg.selectAll) {
        svg = d3.selectAll(svg);
    }

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
        .attr("class", "math-displayer")
        .raise();

    const titleYOffset = 10;
    const titleXOffset = 50;
    svg
        .append("text")
        .attr("x", displayX + titleXOffset)
        .attr("y", displayY + titleYOffset)
        .text(title)
        .attr("class", "math-displayer")
        .attr("font-size", titleYOffset)
        .attr("fill", "black");
    const eqXOffset = titleXOffset / 2;
    const eqYOffset = titleYOffset * 2.5;
    const unitSize = eqXOffset / 3 + 3;
    const upperOffset = unitSize * 2;
    svg
        .append("text")
        .attr("x", displayX + eqXOffset)
        .attr("y", displayY + eqYOffset)
        .text(formula)
        .attr("class", "math-displayer")
        .attr("font-size", unitSize)
        .attr("fill", "black");
    svg
        .append("text")
        .attr("x", displayX + eqXOffset)
        .attr("y", displayY + eqYOffset + unitSize * 1.5)
        .text(description)
        .attr("class", "math-displayer")
        .attr("font-size", unitSize)
        .attr("fill", "black");
}

export function graphVisDrawMatmulExplanation(x:number, y:number, title:string, description:string, svg: any){
    const displayW = 350;
    const displayH = 50;

    //find coordination for the math displayer first
    const displayX = x + 10;
    const displayY = y - 10;

    if (!svg.selectAll) {
        svg = d3.selectAll(svg);
    }

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
        .attr("class", "math-displayer")
        .raise();

    const titleYOffset = 10;
    const titleXOffset = 50;
    svg
        .append("text")
        .attr("x", displayX + 100)
        .attr("y", displayY + titleYOffset)
        .text(title)
        .attr("class", "math-displayer")
        .attr("font-size", titleYOffset)
        .attr("fill", "black").raise();
    const eqXOffset = titleXOffset / 2;
    const eqYOffset = titleYOffset * 2.5;
    const unitSize = eqXOffset / 3 + 3;
    const upperOffset = unitSize * 2;
    svg
        .append("text")
        .attr("x", displayX + eqXOffset)
        .attr("y", displayY + eqYOffset)
        .text(description)
        .attr("class", "math-displayer")
        .attr("font-size", unitSize)
        .attr("fill", "black").raise();
}



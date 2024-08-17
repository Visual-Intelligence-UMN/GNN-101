import * as d3 from "d3";
import { create, all, matrix, i } from "mathjs";
import { State, myColor } from "./utils";
import { roundToTwo } from "@/components/WebUtils";


export function graphVisDrawMatrixWeight(
    node: any,
    Xt: any,
    startCoordList:any,
    endCoordList:any,
    curveDir:number,
    currentStep:number,
    myColor:any,
    weightMatrixPostions:any,
    featureChannels: number,
    g: any,
    mode: number,
    id:string = "tempath"
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
    if (mode === 1 && node.graphIndex === 4) {
        Xt = Xt.reverse();
        Xt = Xt.map((row: any) => row.reverse());
    }

    let Xv = Xt[currentStep];

    

    for (let j = 0; j < Xv.length; j++) {
        let s1 = startCoordList[j];
        let e1 = endCoordList[currentStep];

        if(curveDir==1){
            s1 = startCoordList[startCoordList.length - j - 1];
            e1 = endCoordList[currentStep];
        }
        if (mode === 1 && node.graphIndex === 4) {
            s1 = startCoordList[j]
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



export function displayerHandler(node: any, aggregatedData: any, calculatedData: any, state: State, g: any, displayHeight: number, rectL: number, wmRectL: number, myColor: any, weights: number[][][], index: number, weightsLocation: number[][][], i: number, mode: number, isOutput: boolean) {

                if (!g.selectAll) {
                    g = d3.selectAll(g)
                }
                

                d3.select(".graph-displayer").attr("opacity", 1);
                console.log('weight before transformations', weights)


                d3.selectAll(".weightUnit").style("opacity", 0.3);
                d3.selectAll(`#tempath${i}`).attr("opacity", 1).raise();
                d3.selectAll(`#weightUnit-${i}`).style("opacity", 1).raise();
                d3.selectAll(`#columnUnit-${i}`).style("opacity", 1).raise();
                

        
                let weightMat = weights[index]
                const math = create(all, {});   
                weightMat = math.transpose(weightMat);
                if (mode === 1) {
                    if (index !== 1 && !isOutput) {
                        weightMat = weightMat.map((row: any) => row.reverse());
                    } else {
                        weightMat = weightMat.slice().reverse()
                    }
                } else if (mode === 0) {
                    weightMat = weightMat.slice().reverse()
                }



                console.log('weights matrix is', weightMat, 'at index', index, 'and i is', i, 'which means the column selected is', weightMat[i])
                for (let j = 0; j < weightMat[i].length; j++) {

                    console.log(j)
                    
                    g.append("rect")
                    .attr("x", 130)
                    .attr("y", 40 + wmRectL * j)
                    .attr("width", 7)
                    .attr("height", wmRectL)
                    .attr("fill", myColor(weightMat[i][j]))
                    .attr("stroke", "gray")
                    .attr("stroke-width", 0.1)
                    .attr("opacity", 1)
                    .attr("class", "columnUnit math-displayer")
           
                    .style("opacity", 1)
                }
                const featureGroup = g.append("g")
                .attr("transform", `translate(${70}, ${displayHeight - 50})`);



                g.append("text")
                .attr("x", 70 - 25)
                .attr("y", displayHeight - 65)
                .text("Matmul Visualization")
                .attr("class", "math-displayer")
                .attr("font-size", "15");


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
                    .attr("x", 70 - 35)
                    .attr("y", displayHeight - 40)
                    .attr("xml:space", "preserve")
                    .text("dot(           ,         )")
                    .attr("class", "math-displayer")
                    .attr("font-size", "15");

                if (mode === 1 && node.graphIndex === 4) {
                    g.append("text")
                    .attr("x", 70 - 40)
                    .attr("y", displayHeight - 10)
                    .attr("xml:space", "preserve")
                    .text("=       x      +     x      ...  =     ")
                    .attr("class", "math-displayer")
                    .attr("font-size", "10");
                } else  {
                g.append("text")
                    .attr("x", 70 - 40)
                    .attr("y", displayHeight - 10)
                    .attr("xml:space", "preserve")
                    .text("=       x      +     x      ...  =     ")
                    .attr("class", "math-displayer")
                    .attr("font-size", "10");
                }




                // first component
                g.append("rect")    
      
                .attr("x", 70 - 30 + 5)
                .attr("y", displayHeight - 10 - 9)
                .attr("width", 9)
                .attr("height", 9)
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
                .attr("font-size", "4")
                .attr("fill", Math.abs(aggregatedData[0]) > 0.7 ? "white" : "black");




                g.append("rect")    
                .attr("x", 70 - 30 + 25)
                .attr("y", displayHeight - 10 - 9)
                .attr("width", 9)
                .attr("height", 9)
                .attr("class", `math-displayer`)
                .style("fill", myColor(weights[index][0][i]))
                .style("stroke-width", 0.1)
                .style("stroke", "grey")
                .style("opacity", 1);

                g.append("text")
                .attr("x", 70 - 30 + 25)
                .attr("y", displayHeight - 10 - 5)
                .text(roundToTwo(weights[index][0][i]))
                .attr("class", "math-displayer")
                .attr("font-size", "4")
                .attr("fill", Math.abs(weights[index][0][1]) > 0.7 ? "white" : "black");



                // second component
                g.append("rect")    

                .attr("x", 70 - 30 + 45)
                .attr("y", displayHeight - 10 - 9)
                .attr("width", 9)
                .attr("height", 9)
                .attr("class", `math-displayer`)
                .style("fill", myColor(aggregatedData[1]))
                .style("stroke-width", 0.1)
                .style("stroke", "grey")
                .style("opacity", 1);

                g.append("text")
                .attr("x", 70 - 30 + 45)
                .attr("y", displayHeight - 10 - 5)
                .text(roundToTwo(aggregatedData[1]))
                .attr("class", "math-displayer")
                .attr("font-size", "4")
                .attr("fill", Math.abs(aggregatedData[1]) > 0.7 ? "white" : "black");



                g.append("rect")    

                .attr("x", 70 - 30 + 65)
                .attr("y", displayHeight - 10 - 9)
                .attr("width", 9)
                .attr("height", 9)
                .attr("class", `math-displayer`)
                .style("fill", myColor(weights[index][1][i]))
                .style("stroke-width", 0.1)
                .style("stroke", "grey")
                .style("opacity", 1);

                g.append("text")
                .attr("x", 70 - 30 + 65)
                .attr("y", displayHeight - 10 - 5)
                .text(roundToTwo(weights[index][1][i]))
                .attr("class", "math-displayer")
                .attr("font-size", "4")
                .attr("fill", Math.abs(weights[index][1][i]) > 0.7 ? "white" : "black");




                // output
                g.append("rect")    

                .attr("x", 70 - 30 + 100)
                .attr("y", displayHeight - 10 - 9)
                .attr("width", 9)
                .attr("height", 9)
                .attr("class", `math-displayer`)
                .style("fill", myColor(calculatedData[i]))
                .style("stroke-width", 0.1)
                .style("stroke", "grey")
                .style("opacity", 1);

                g.append("text")
                .attr("x", 70 - 30 + 100)
                .attr("y", displayHeight - 10 - 5)
                .text(roundToTwo(calculatedData[i]))
                .attr("class", "math-displayer")
                .attr("font-size", "4")
                .attr("fill", Math.abs(calculatedData[i]) > 0.7 ? "white" : "black");




    }


export function hoverOverHandler(node: any, aggregatedData: any, calculatedData: any, state: State, g: any, displayHeight: number, rectL: number, wmRectL: number, myColor: any, weights: number[][][], index: number, weightsLocation: number[][][], Xt: any, startCoordList: any, endCoordList: any, svg: any, mode: number, isOutput: boolean) {

    

    for (let i = 0; i < node.features.length; i++) {
        d3.select(`.calculatedFeatures${i}`)
            .on("mouseover", function () {
                if (!state.isClicked || state.isPlaying || state.isAnimating) {
                    return;
                }
                console.log('Xt', Xt)
                if (mode === 1 && node.graphIndex === 4) {
                    graphVisDrawMatrixWeight(node, Xt, startCoordList, endCoordList, 1, i, myColor, weightsLocation, node.features.length, svg, mode)
                }
                else {
                graphVisDrawMatrixWeight(node, Xt, startCoordList, endCoordList, -1, i, myColor, weightsLocation, node.features.length, svg, mode)
                }
                d3.selectAll(".calculatedRect").style("opacity", 0.2)
                d3.selectAll(`.calculatedFeatures${i}`).style("opacity", 1)
                d3.selectAll(`#tempath${i}`).style("opacity", 1);
                displayerHandler(node, aggregatedData, calculatedData, state, g, displayHeight, rectL, wmRectL, myColor, weights, index, weightsLocation, i, mode, isOutput)




    })
            .on("mouseout", function () {
                if (!state.isClicked || state.isPlaying || state.isAnimating) {
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



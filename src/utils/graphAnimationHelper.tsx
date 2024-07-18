import * as d3 from "d3";
import { create, all, matrix, i } from "mathjs";
import { State, myColor } from "./utils";


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

    console.log("Xv check 1", Xt, weightMatrixPostions);
    
    if(Xt[0].length!=Xt.length){
        //weightMatrixPostions = transposeAnyMatrix(weightMatrixPostions);
        flag = false;
        console.log("w mat flag")
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
    console.log("Xv check", Xv, Xt, weightMatrixPostions);
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
        //     console.log("m1 check",weightMatrixPostions,  m1);
        // }else{
        //     m1 = weightMatrixPostions[currentStep][weightMatrixPostions[0].length-1-j];
        // }

        // if(Xt[0].length==64 && Xt.length==2){
        //     m1 = weightMatrixPostions[currentStep][j];
        // }else{
        //     m1 = weightMatrixPostions[weightMatrixPostions.length-1-j][currentStep]
        // }
        
        

        console.log("wanfeng", Xt, Xv, weightMatrixPostions, curveDir);

        let changed = false;

        if(weightMatrixPostions.length==4&&weightMatrixPostions[0].length==2){
            if(curveDir==-1)m1 = weightMatrixPostions[weightMatrixPostions.length-1-j][currentStep]
            else m1 = weightMatrixPostions[j][currentStep]
            
            console.log("wanfeng 3", curveDir)
            changed = true;
        }

        if(weightMatrixPostions.length==2&&weightMatrixPostions[0].length==4){
            if(curveDir==-1)m1 = weightMatrixPostions[j][currentStep]
            else m1 = weightMatrixPostions[weightMatrixPostions.length-1-j][currentStep]
            
            console.log("wanfeng 4", curveDir)
            changed = true;
        } 

        if(Xt.length==Xt[0].length || (Xt.length==64 && Xt[0].length==7)){
            m1 = weightMatrixPostions[weightMatrixPostions.length-1-j][currentStep]
                
            console.log("wanfeng 5", curveDir)
            changed = true;
        }

        if(Xt.length==Xt[0].length && Xt.length==4){
            if(curveDir==-1)m1 = weightMatrixPostions[weightMatrixPostions.length-1-j][currentStep]
            else m1 = weightMatrixPostions[j][currentStep]
                
            console.log("wanfeng 7", curveDir)
            changed = true;
        }

        if(!changed){
            if((Xt[0].length<Xt.length && Xt.length!=64)||(Xt[0].length==64&&Xt.length==2)
            ||(Xt[0].length==34&&Xt.length==4)
            ||(Xt.length==34&&Xt[0].length==4)){
                if(curveDir==-1)m1 = weightMatrixPostions[weightMatrixPostions.length-1-j][currentStep]
                else m1 = weightMatrixPostions[j][currentStep]
                
                console.log("wanfeng 1", curveDir)
            }
            else{
                if(curveDir==-1)m1 = weightMatrixPostions[j][currentStep]
                else m1 = weightMatrixPostions[weightMatrixPostions.length-1-j][currentStep]

                console.log("wanfeng 2", curveDir)
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
            .attr("class", "intermediate-path to-be-removed")
            .style("fill", "none")
            .attr("stroke", "black").attr("id", `tempath${currentStep}`)
            .attr("stroke-width", 2).attr("stroke", myColor(Xv[j])).lower();

        g
            .append("path")
            .attr("d", pathData2)
            .attr("class", "intermediate-path to-be-removed")
            .style("fill", "none")
            .attr("stroke", "black").attr("id", `tempath${currentStep}`)
            .attr("stroke-width", 2).attr("stroke", myColor(Xv[j])).lower();
    }
}


export function drawGraphVisWeightVector(weightMatrixPositions: number[][][], rectW: number, weights: number[][][], index: number, g: any, currentStep: number) {
    if (!g.selectAll) {
        g = d3.selectAll(g)
    }
    const weightMat = weights[index]
    console.log("WAD", weights, index, currentStep, weightMat)

    for (let j = 0; j < weightMat[currentStep].length; j++)
    g.append("rect")
                            .attr("x", 130)
                            .attr("y", 20 + rectW * j)
                            .attr("width", 3)
                            .attr("height", rectW)
                            .attr("fill", myColor(weightMat[currentStep][j]))
                            .attr("stroke", "gray")
                            .attr("stroke-width", 0.1)
                            .attr("opacity", 1)
                            .attr("class", "columnUnit")
                            .attr("id", `columnUnit-${j}`);

}



export function hoverOverHandler(node: any, state: State, g: any, displayHeight: number, rectL: number, myColor: any, weights: number[][][], index: number, weightsLocation: number[][][]) {
    for (let i = 0; i < node.features.length; i++) {
        d3.select(`.calculatedFeatures${i}`)
            .on("mouseover", function () {
                if (!state.isClicked) {
                    return;
                }
                d3.select(".graph-displayer").attr("opacity", 1);



                d3.selectAll(`#tempath${i}`).attr("opacity", 1).raise();
                d3.selectAll(`#weightUnit-${i}`).style("opacity", 1).raise();
                d3.selectAll(`#columnUnit-${i}`).style("opacity", 1).raise();

        


                drawGraphVisWeightVector(weightsLocation, rectL, weights, index, g, i)

                const featureGroup = g.append("g")
                .attr("transform", `translate(${130}, ${displayHeight - 30})`);
                featureGroup.selectAll("rect")
                .data(node.features)
                .enter()
                .append("rect")
                .attr("x", (d: any, i: number) => i * rectL)
                .attr("y", 0)
                .attr("width", rectL)
                .attr("height", 3)
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
                    .text("dot(                  ,              )")
                    .attr("class", "math-displayer")
                    .attr("font-size", "10");



    })
            .on("mouseout", function () {
                if (!state.isClicked) {
                    return;
                }
                d3.selectAll(".math-displayer").remove();
                d3.selectAll(".graph-displayer").attr("opacity", 0);
                d3.selectAll(`#weightUnit-${i}`).style("opacity", 0.3).raise();
                d3.selectAll(`#columnUnit-${i}`).style("opacity", 0).raise();
                d3.selectAll(`#tempath${i}`).attr("opacity", 0).raise();
                d3.selectAll(`.columnUnit`).remove();

            });
    }
}
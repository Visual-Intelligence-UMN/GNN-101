import * as d3 from "d3";
import { computeMids, computeMidsVertical } from "./matFeaturesUtils";
import { injectPlayButtonSVG } from "./svgUtils";
import { drawActivationExplanation, drawDotProduct } from "./matInteractionUtils";
import { create, all, transposeDependencies } from "mathjs";
import { drawPoints, flipHorizontally, flipVertically, rotateMatrixCounterClockwise, transposeAnyMatrix } from "./utils";
import { drawHintLabel, drawMatrixValid, rotateMatrix } from "./matHelperUtils";

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
    dummy:any,
    g:any,
    weightMatrixPostions:any,
    X:any
) {
    d3.selectAll("#tempath").remove();
    d3.selectAll(".matmul-displayer").remove();
    // if(currentStep==0){
    //     drawHintLabel(g, coordFeatureVis[0] - (endCoordList[currentStep][0] - startCoordList[0][0])/2 - 20, 
    //     coordFeatureVis[1] + rectH - curveDir*Xt[currentStep].length*(2), 
    //     "Matrix Multiplication", "procVis");
    // }
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

    

    drawMatrixWeight(Xt, startCoordList, endCoordList, curveDir, currentStep, myColor, weightMatrixPostions, featureChannels);
    d3.selectAll("#tempath").lower();

    drawDotProduct(
        dummy, currentStep, X, Xt, curveDir, coordFeatureVis, myColor
    )

    d3.selectAll(".interactRect").on("mouseover", function(){
        const rectID = d3.select(this).attr("rectID")

        d3.select(".wMatLink").style("opacity", 0.3);


        d3.selectAll(".interactRect").style("opacity", 0.5);
        d3.select(`.interactRect[rectID="${rectID}"]`).style("opacity", 1).style("stroke", "black").style("stroke-width", 1);
        drawMatrixWeight(Xt, startCoordList, endCoordList, curveDir, Number(rectID), myColor, weightMatrixPostions, featureChannels, "weightPath");
        d3.selectAll(".weightUnit").style("opacity", 0.3).lower();
        d3.selectAll(`#weightUnit-${rectID}`).style("opacity", 1).raise();
        d3.select(`#columnUnit-${Number(rectID)-1}`).style("opacity", 0);
        d3.select(`#columnUnit-${rectID}`).style("opacity", 1).raise();
        drawDotProduct(
            dummy, rectID, X, Xt, curveDir, coordFeatureVis, myColor
        )
    });
    d3.selectAll(".interactRect").on("mouseout", function(){
        const rectID = d3.select(this).attr("rectID")

        d3.select(".wMatLink").style("opacity", 1);

        d3.selectAll(".weightUnit").style("opacity", 1);

        d3.selectAll(".columnUnit").style("opacity", 0);
        d3.selectAll(".interactRect").style("opacity", 1).style("stroke", "gray").style("stroke-width", 0.1);
        d3.selectAll("#weightPath").remove();
        d3.selectAll(".matmul-displayer").remove();
    });

    d3.selectAll(".interactRect").style("pointer-events", "none");    
}

export function drawMatrixWeight(
    Xt: any,
    startCoordList:any,
    endCoordList:any,
    curveDir:number,
    currentStep:number,
    myColor:any,
    weightMatrixPostions:any,
    featureChannels: number,
    id:string = "tempath",
    mode:string = "normal"
){
    
    let flag = true;


    
    if(Xt[0].length!=Xt.length
        && (!(Xt[0].length==2 && Xt.length==64)
        ||!(Xt[0].length==4 && Xt.length==2))
    ){
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
    if((weightMatrixPostions.length==4&&weightMatrixPostions[0].length==2)){
        const math = create(all, {});
        Xt = math.transpose(math.transpose(Xt));
    }

   // Xt = flipVertically(Xt);

   //adjust matrix value alignment for GCNConv - square weight matri
    if(Xt[0].length==Xt.length){
        Xt = rotateMatrixCounterClockwise(Xt)
        Xt = flipHorizontally(Xt);
    }

    if(Xt[0].length==2&&Xt.length==4){
        Xt = flipVertically(Xt)
       // Xt = flipHorizontally(Xt);
    }

    if(Xt.length==64&&Xt[0].length==7){
        Xt = flipVertically(Xt)
         Xt = flipHorizontally(Xt);
    }
   
//drawMatrixValid(Xt, startCoordList[0][0], startCoordList[0][1]+20, 10, 10)


    let Xv = Xt[currentStep];

    


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
            // if(curveDir==-1)m1 = weightMatrixPostions[weightMatrixPostions.length-1-j][currentStep]
            // else m1 = weightMatrixPostions[j][currentStep]

            m1 = weightMatrixPostions[weightMatrixPostions.length-1-j][currentStep]
            

            changed = true;
        }

        if(weightMatrixPostions.length==2&&weightMatrixPostions[0].length==4){
            // if(curveDir==-1)m1 = weightMatrixPostions[j][currentStep]
            // else m1 = weightMatrixPostions[weightMatrixPostions.length-1-j][currentStep]

            m1 = weightMatrixPostions[j][currentStep]
            

            changed = true;
        } 

        if(Xt.length==Xt[0].length || (Xt.length==64 && Xt[0].length==7)){
            m1 = weightMatrixPostions[weightMatrixPostions.length-1-j][currentStep]
                

            changed = true;
        }

        if((Xt.length==Xt[0].length && Xt.length==4)
            ||(Xt[0].length==34&&Xt.length==4)
            ||(Xt.length==34&&Xt[0].length==4)
        ){
            // if(curveDir==-1)m1 = weightMatrixPostions[weightMatrixPostions.length-1-j][currentStep]
            // else m1 = weightMatrixPostions[j][currentStep]

            m1 = weightMatrixPostions[weightMatrixPostions.length-1-j][currentStep]
                

            changed = true;
        }

        if(!changed){
            if((Xt[0].length<Xt.length && Xt.length!=64)||(Xt[0].length==64&&Xt.length==2)){
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
        d3.select(".mats")
            .append("path")
            .attr("d", pathData1)
            .attr("class", "procVis")
            .style("fill", "none")
            .attr("stroke", "black").attr("id", id)
            .attr("stroke-width", 2).attr("stroke", myColor(Xv[j])).lower();

        d3.select(".mats")
            .append("path")
            .attr("d", pathData2)
            .attr("class", "procVis")
            .style("fill", "none")
            .attr("stroke", "black").attr("id", id)
            .attr("stroke-width", 2).attr("stroke", myColor(Xv[j])).lower();
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
    drawHintLabel(g1, coordFeatureVis[0], coordFeatureVis[1] + rectH * curveDir * 1.1, "Vector Summation", "procVis");

    //path connect - connect prev layer feature vis to intermediate feature vis
    const curve = d3.line().curve(d3.curveBasis);
    for (let i = 0; i < posList.length; i++) {
        const res = computeMids(posList[i], coordFeatureVis);
        const hpoint = res[0];
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
    dummy: any,
    coordFeatureVis: any,
    rectH: number,
    rectW: number,
    myColor: any,
    Xv:number[][],
    startCoordList: any,
    endCoordList:any,
    curveDir:number,
    weightMatrixPostions: any,
    featureChannels: number,
    X:number[],
    rectClass: string = "procVis removeRect wRect interactRect",
    labelName = "Matmul Result"
) {
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
            .attr("id", `weightRect${m}`);
    }
    drawHintLabel(g, coordFeatureVis[0], coordFeatureVis[1]+rectH+6, labelName, "procVis");

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

    d3.selectAll(".interactRect").on("mouseover", function(){
        let paintMode = "reverse";
        if(curveDir==-1)paintMode = "normal";

        d3.select(".wMatLink").style("opacity", 0.3);
        
        const rectID = d3.select(this).attr("rectID")

        d3.selectAll(".interactRect").style("opacity", 0.5);
        d3.select(`.interactRect[rectID="${rectID}"]`).style("opacity", 1).style("stroke", "black").style("stroke-width", 1);
        drawMatrixWeight(Xv, startCoordList, endCoordList, curveDir, Number(rectID), myColor, weightMatrixPostions, featureChannels, "weightPath", paintMode);
        d3.selectAll(".weightUnit").style("opacity", 0.3).lower();
        d3.selectAll(`#weightUnit-${rectID}`).style("opacity", 1).raise();
        d3.select(`#columnUnit-${Number(rectID)-1}`).style("opacity", 0);
        d3.select(`#columnUnit-${rectID}`).style("opacity", 1).raise();
        drawDotProduct(
            dummy, rectID, X, Xv, curveDir, coordFeatureVis, myColor
        )
        
    });
    d3.selectAll(".interactRect").on("mouseout", function(){
        const rectID = d3.select(this).attr("rectID")

        d3.select(".wMatLink").style("opacity", 1);

        d3.selectAll(".weightUnit").style("opacity", 1);

        d3.selectAll(".columnUnit").style("opacity", 0);
        d3.selectAll(".interactRect").style("opacity", 1).style("stroke", "gray").style("stroke-width", 0.1);
        d3.selectAll("#weightPath").remove();

        //remove matmul-displayer
        d3.selectAll(".matmul-displayer").remove();
    });
}


export function computeMatrixLocations(
    btnX:number,
    btnY:number,
    curveDir:number,
    rectW:number,
    featureChannels:number,
    weights:number[][][],
    layerID:number
){
    //draw weight matrix
                //positioning
                let offsetH = -1 * 50;
                if(curveDir==1)offsetH = (60 + weights[layerID].length * rectW);
                const math = create(all, {});
                const matX = btnX;
                const matY = btnY - offsetH;
                const coefficient = 1;
                let weightMatrixPositions = [];
                //draw matrix - change the computation mode here, when the dims are different
                let weightMat = weights[layerID];

                //if(weightMat[0].length>weightMat.length || weightMat[0].length<weightMat.length)weightMat = math.transpose(weights[layerID]);

                for(let i=0; i<weightMat.length; i++){
                    let tempArr = [];
                    for(let j=0; j<weightMat[i].length; j++){
                        tempArr.push([matX+j*rectW/coefficient+rectW/(coefficient*2), matY+i*rectW/coefficient+rectW/(coefficient*2)]);
                    }
                    weightMatrixPositions.push(tempArr);
                }
                //draw connection
                return weightMatrixPositions;
    }


export function drawWeightMatrix(
btnX:number,
btnY:number,
curveDir:number,
rectW:number,
rectH:number,
featureChannels:number,
weights:number[][][],
layerID:number,
myColor:any,
g:any,
weightMatrixPostions:any
){
    //draw the connection
    
    const len = weightMatrixPostions.length;
    let btnPt:[number, number] = [btnX+10, btnY-15];
    let wMatPt:[number, number] = [
        (weightMatrixPostions[0][0][0]+weightMatrixPostions[0][weightMatrixPostions[0].length-1][0])/2,
        weightMatrixPostions[0][0][1]
    ];
    if(curveDir==1){
        wMatPt = [
            (weightMatrixPostions[0][0][0]+weightMatrixPostions[0][weightMatrixPostions[0].length-1][0])/2,
            weightMatrixPostions[len-1][0][1]
        ];
    }

    const curve = d3.line().curve(d3.curveBasis);
    const res = computeMidsVertical(btnPt, wMatPt);
    const hpoint:[number, number] = res[0];
    const lpoint:[number, number] = res[1];
    if(curveDir==1){
        let tlpoint:[number, number] = [lpoint[0], lpoint[1]];
        let thpoint:[number, number] = [hpoint[0], hpoint[1]];
        d3.select(".mats")
            .append("path")
            .attr("d", curve([wMatPt, tlpoint, thpoint, btnPt]))
            .attr("stroke", "black")
            .attr("opacity", 1)
            .attr("fill", "none")
            .attr("class", "procVis wMatLink").lower();
        
    }else{
        d3.select(".mats")
            .append("path")
            .attr("d", curve([btnPt, hpoint, lpoint, wMatPt]))
            .attr("stroke", "black")
            .attr("opacity", 1)
            .attr("fill", "none")
            .attr("class", "procVis wMatLink").lower();
    }

//draw weight matrix
            //positioning
            let offsetH = curveDir * 50;
            if(curveDir==1)offsetH = -1*(curveDir * 50 + featureChannels * rectW + 100);
            const matX = btnX;
            const matY = btnY - offsetH;
            const coefficient = 1;
            //draw matrix
            //const weightMat = math.transpose(weights[layerID]);
            let weightMat = weights[layerID];

            //determine matrix shape mode
            let flag = false;
            if(weightMat[0].length>weightMat.length || weightMat[0].length<weightMat.length){
                //weightMatrixPostions = transposeAnyMatrix(weightMatrixPostions);
                flag = true;

            }

            
            //draw label hint
            drawHintLabel(g, weightMatrixPostions[0][0][0], 
                weightMatrixPostions[0][0][1] - 12, "Weight Matrix", 
                "procVis");

            //flip
          //  weightMat = flipVertically(weightMat);

         // drawMatrixValid(Xt, startCoordList[0][0], startCoordList[0][1]+20, 10, 10)

          if(weightMat[0].length==weightMat.length){
            weightMat = rotateMatrix(weightMat)

            if(curveDir==1){
                weightMat = rotateMatrix(weightMat)
                weightMat = rotateMatrix(weightMat)
               weightMat = flipVertically(weightMat);
               weightMat = rotateMatrix(weightMat)
            }else{
                weightMat = rotateMatrix(weightMat)
               weightMat = flipVertically(weightMat);
            }
        }
        if((weightMat.length==2 && weightMat[0].length==4)){
            weightMat = flipHorizontally(weightMat);
            weightMat = flipVertically(weightMat);
        }
        if(weightMat.length==7&&weightMat[0].length==64){
            weightMat = flipHorizontally(weightMat);
            weightMat = flipVertically(weightMat);
        }


            for(let i=0; i<weightMatrixPostions.length; i++){
                let tempArr = [];
                for(let j=0; j<weightMatrixPostions[0].length; j++){
                    //adjust the location if dimensions are different
                    if(i==0){
                        g.append("rect")
                            .attr("x", weightMatrixPostions[i][j][0])
                            .attr("y", weightMatrixPostions[i][j][1])
                            .attr("width", rectW/coefficient)
                            .attr("height", rectW/coefficient*weightMat.length)
                            .attr("fill", "none")
                            .attr("stroke", "black")
                            .attr("stroke-width", 0.5)
                            .attr("opacity", 0)
                            .attr("class", "columnUnit")
                            .attr("id", `columnUnit-${j}`);
                    }
                    //select the weight based on the shape of the matrix
                    let colorVal = 0;
                    if(flag){
                        colorVal = weightMat[weightMat.length-i-1][j];
                    }
                    else {

                        colorVal = weightMat[j][weightMat[0].length-i-1];

                    }
                    if(weightMat[0].length==weightMat.length){
                        colorVal = weightMat[i][j];
                    }
                    g.append("rect")
                        .attr("x", weightMatrixPostions[i][j][0])
                        .attr("y", weightMatrixPostions[i][j][1])
                        .attr("width", rectW/coefficient)
                        .attr("height", rectW/coefficient)
                        .attr("fill", myColor(colorVal))
                        .attr("class", "weightUnit")
                        .attr("id", `weightUnit-${j}`);

                    tempArr.push([matX+j*rectW/coefficient+rectW/(coefficient*2), matY+i*rectW/coefficient+rectW/(coefficient*2)]);
                }
            }
            d3.selectAll(".columnUnit").raise();
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
    const label = drawHintLabel(g, coordFeatureVis[0], coordFeatureVis[1]+rectH+6, "Bias Vector", "procVis biasVector");
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

            if(relu.node()!=null){
            const ReLU = relu!.node()!.appendChild(data.documentElement);
            d3.select(ReLU)
                .attr("x", cx1)
                .attr("y", cy1)
                .attr("class", "procVis")
                .raise();
            }
        });
        drawHintLabel(relu, cx1-20, cy1+radius*4+12+4, "ReLU Non-linear Function", "procVis");

        relu.on("mouseover", function(event, d){
            const [x, y] = d3.pointer(event);

            //set-up the paramtere for the math displayer
           drawActivationExplanation(
            x, y, "ReLU Non-Linear Function",
            "f(x) = max(0, x)", "Range: [ 0 to infinity)"
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

            if(relu.node()!=null){
            const ReLU = relu!.node()!.appendChild(data.documentElement);
            d3.select(ReLU)
                .attr("x", cx1)
                .attr("y", cy1)
                .attr("class", "procVis")
                .raise();
            }
        });
        
        drawHintLabel(relu, cx1-20, cy1+radius*4+12+4, "Tanh Non-linear Function", "procVis");

        relu.on("mouseover", function(event, d){
            const [x, y] = d3.pointer(event);

            //set-up the paramtere for the math displayer
           drawActivationExplanation(
            x, y, "Tanh Non-Linear Function",
            "f(x) = (e^x - e^(-x)) / (e^x + e^(-x))", "Range:  (-1 to 1)."
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
    const g = d3.select(".mats").append("g");
    drawHintLabel(g, (resultCoord[0][0]+endCoord[endCoord.length-1][0])/2-20, 
    (resultCoord[0][1]+endCoord[endCoord.length-1][1])/2 +yOffset, "Softmax", "procVis");
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



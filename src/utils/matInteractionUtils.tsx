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
    injectSVG(aTs, dX + 130 +offsetX+17, textH, "./assets/SVGs/a_t_s.svg", "math-latex");
    
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

    

    injectSVG(aTd, dX + 220 +offsetX+17, textH, "./assets/SVGs/a_t_d.svg", "math-latex");

    
        
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
    endCoord: [number[], number[]],
    result: number[],
    id: 0 | 1,
    myColor: (v: number) => string
  ) {
    /* ───── 1. highlight the active path ───── */
    pathMap[0][id]!.style.opacity = "1";
    pathMap[1][id]!.style.opacity = "1";
  
    /* ───── 2. layout & style constants ───── */
    const DISP_W = 350;
    const DISP_H = 100;
  
    const RECT_EDGE  = 28;   // coloured square size
    const FONT_NUM   = 11;   // monospace numbers in the squares
    const FONT_TITLE = 18;   // bold title
    const FONT_TXT   = 18;   // all other text
  
    /* fine-tuning knobs (px) */
    const expOffset_1 = 50;
    const expOffset_2 = 0;
    const expOffset_3 = -10;
    const expAdjust   = 0;   // tweaks “)” position
    const rectAdjust  = 0;   // tweaks every coloured rect x-pos
  
    /* reusable horizontal gaps (px) */
    const GAP_EXP_RECT   = 50;
    const GAP_RECT_PAREN = 10;
    const GAP_PLUS       = 20;
    const GAP_EQ         = 35;
  
    /* y positions relative to the group */
    const Y_TITLE    = 15 + 5;
    const Y_NUMER    = 40 + 15;
    const Y_LINE     = 55 + 5;
    const Y_DENOM    = 70 + 20;
    const Y_RES_RECT = 35 + 10;
    const Y_RES_TEXT = Y_RES_RECT + RECT_EDGE / 2 + 1;
  
    /* ───── 3. place the displayer group once ───── */
    const baseX = endCoord[1][0] + 30;
    const baseY = endCoord[1][1] - (DISP_H + 50);
  
    const displayer =
      d3
        .select(".mats")
        .selectAll<SVGGElement, unknown>("g.math-displayer") // reuse if already present
        .data([null])
        .join("g")
        .attr("class", "math-displayer")
        .attr("transform", `translate(${baseX}, ${baseY})`);
  
    /* clear any previous children (keep the same <g>) */
    displayer.selectAll("*").remove();
  
    /* background panel (kept at back) */
    displayer
      .append("rect")
      .attr("width", DISP_W)
      .attr("height", DISP_H)
      .attr("rx", 10)
      .attr("ry", 10)
      .style("fill", "white")
      .style("stroke", "black")
      .style("stroke-width", 2)
      .lower();
  
    /* ───── 4. prepare data ───── */
    const finalResult = softmax(result);
    const title =
      id === 0
        ? "Softmax Score for 'Non-Mutagenic'"
        : "Softmax Score for 'Mutagenic'";
  
    /* ───── 5. title ───── */
    displayer
      .append("text")
      .attr("x", 20)
      .attr("y", Y_TITLE)
      .text(title)
      .attr("font-family", "monospace")
      .attr("font-size", FONT_TITLE)
      .style("font-weight", "bold");
  
    /* helper: draw one exp(value) block and return tail-x */
    const drawExpBlock = (
      startX: number,
      y: number,
      value: number,
      fill: string,
      blockOffset: number
    ): number => {
      /* “exp(” */
      displayer
        .append("text")
        .attr("x", startX + blockOffset)
        .attr("y", y - 5)
        .text("exp(")
        .attr("font-family", "monospace")
        .attr("font-size", FONT_TXT);
  
      /* coloured rect */
      const rectX = startX + blockOffset + GAP_EXP_RECT + rectAdjust;
      displayer
        .append("rect")
        .attr("x", rectX)
        .attr("y", y - RECT_EDGE + 2)
        .attr("width", RECT_EDGE)
        .attr("height", RECT_EDGE)
        .attr("fill", fill)
        .attr("stroke", "black");
  
      /* number inside rect */
      displayer
        .append("text")
        .attr("x", rectX + RECT_EDGE / 2)
        .attr("y", y - RECT_EDGE / 2 + 2)
        .text(roundToTwo(value))
        .attr("font-family", "monospace")
        .attr("font-size", FONT_NUM)
        .attr("text-anchor", "middle")
        .attr("fill", Math.abs(value) > 0.7 ? "white" : "black");
  
      /* right parenthesis “)” */
      const parenX = rectX + RECT_EDGE + GAP_RECT_PAREN + expAdjust;
      displayer
        .append("text")
        .attr("x", parenX)
        .attr("y", y - 5)
        .text(")")
        .attr("font-family", "monospace")
        .attr("font-size", FONT_TXT);
  
      return parenX; // tail
    };
  
    /* ───── 6. numerator ───── */
    let tailX = drawExpBlock(25, Y_NUMER, result[id], myColor(result[id]), expOffset_1);
  
    /* fraction bar */
    displayer
      .append("line")
      .attr("x1", 10)
      .attr("y1", Y_LINE)
      .attr("x2", DISP_W - 90)
      .attr("y2", Y_LINE)
      .attr("stroke", "black")
      .attr("stroke-width", 1.5);
  
    /* ───── 7. denominator ───── */
    tailX = drawExpBlock(25, Y_DENOM, result[0], myColor(result[0]), expOffset_2);
  
    /* “+” */
    displayer
      .append("text")
      .attr("x", tailX + GAP_PLUS)
      .attr("y", Y_DENOM - 5)
      .text("+")
      .attr("font-family", "monospace")
      .attr("font-size", FONT_TXT);
  
    tailX = drawExpBlock(
      tailX + GAP_PLUS*2 + FONT_TXT - 5,
      Y_DENOM,
      result[1],
      myColor(result[1]),
      expOffset_3
    );
  
    /* ───── 8. equals & final result ───── */
    displayer
      .append("text")
      .attr("x", tailX + GAP_EQ - 5)
      .attr("y", Y_LINE + 5)
      .text("=")
      .attr("font-family", "monospace")
      .attr("font-size", FONT_TXT);
  
    const resRectX = tailX + GAP_EQ + FONT_TXT;
    displayer
      .append("rect")
      .attr("x", resRectX + rectAdjust)
      .attr("y", Y_RES_RECT)
      .attr("width", RECT_EDGE)
      .attr("height", RECT_EDGE)
      .attr("fill", myColor(finalResult[id]))
      .attr("stroke", "black");
  
    displayer
      .append("text")
      .attr("x", resRectX + RECT_EDGE / 2 + rectAdjust)
      .attr("y", Y_RES_TEXT)
      .text(roundToTwo(finalResult[id]))
      .attr("font-family", "monospace")
      .attr("font-size", FONT_NUM)
      .attr("text-anchor", "middle")
      .attr("fill", Math.abs(finalResult[id]) > 0.7 ? "white" : "black");
  
    /* ───── 9. optional scale (compose with translation) ───── */
    const scaleFactor = 1.5;
    const bbox = displayer.node()?.getBBox();
    if (bbox) {
      const cx = bbox.x + bbox.width / 2;
      const cy = bbox.y + bbox.height / 2;
      const baseTransform = `translate(${baseX}, ${baseY})`;
      displayer.attr(
        "transform",
        `${baseTransform} translate(${cx}, ${cy}) scale(${scaleFactor}) translate(${-cx}, ${-cy})`
      );
    }
  }
  


function determineColor(val: number) {
    if (Math.abs(val) > 0.5) {
        return "white";
    }

    return "black";
}


/**
 * Draw a four-class soft-max tooltip for a **node-classifier**.
 * The `<g>` stored in the variable **tooltip** is kept and reused; only its
 * children are cleared/re-drawn, so the element itself “remains the same”.
 */
export function drawSoftmaxDisplayerNodeClassifier(
    displayerPos: [number, number],   // [x, y] where the white panel should sit
    titles: string[],                 // title per class
    rectID: number,                   // index of the highlighted class
    nthOutputVals: number[],          // raw logits (length ≥ 4)
    nthResult: number[],              // softmax result (length ≥ 4)
    myColor: (v: number) => string
  ) {
    /* ───────────────────────── 1.  layout & style constants ────────────────── */
    const DISP_W = 550;
    const DISP_H = 100;
  
    const RECT_EDGE  = 28;            // coloured square size (px)
    const FONT_NUM   = 11;            // numbers inside squares
    const FONT_TITLE = 18;            // bold panel title
    const FONT_TXT   = 18;            // everything else (“exp(”, “+”, …)
  
    /* fine-tuning knobs (px) --------------------------------------------------- */
    const expOffset_1 = 0;  // 1st denominator exp block
    const expOffset_2 = 0;  // 2nd
    const expOffset_3 = 0;  // 3rd
    const expOffset_4 = 0;  // 4th
    const expAdjust   = 0;  // add to each right parenthesis “)”
    const rectAdjust  = 0;  // add to every coloured rect x-coord
  
    /* horizontal gaps (px) */
    const GAP_EXP_RECT   = 45;        // “exp(” → rect
    const GAP_RECT_PAREN = 5;        // rect  → “)”
    const GAP_PLUS       = 10;        // “)”   → “+exp(”
    const GAP_EQ         = 35;        // last “)” → “=”
  
    /* y positions inside the group */
    const Y_TITLE    = 15;
    const Y_NUMER    = 35 + 15;
    const Y_LINE     = 50 + 5;
    const Y_DENOM    = 65 + 20;
    const Y_RES_RECT = 25 + 20;
    const Y_RES_TEXT = Y_RES_RECT + RECT_EDGE / 2 + 1;
  
    /* ───────────────────────── 2.  create / reuse the group ─────────────────── */
    const baseX = displayerPos[0];
    const baseY = displayerPos[1];
  
    const tooltip = d3
      .select(".mats")
      .selectAll<SVGGElement, unknown>("g.node-tooltip")
      .data([null])
      .join("g")
      .attr("class", "node-tooltip math-displayer")
      .attr("transform", `translate(${baseX}, ${baseY})`);
  
    /* clear previous children but keep the same <g> element */
    tooltip.selectAll("*").remove();
  
    /* background panel */
    tooltip
      .append("rect")
      .attr("width", DISP_W)
      .attr("height", DISP_H)
      .attr("rx", 10)
      .attr("ry", 10)
      .style("fill", "white")
      .style("stroke", "black")
      .style("stroke-width", 2)
      .lower();
  
    /* ───────────────────────── 3.  title ───────────────────────────────────── */
    tooltip
      .append("text")
      .attr("x", DISP_W / 2)
      .attr("y", Y_TITLE)
      .text(titles[rectID])
      .attr("text-anchor", "middle")
      .attr("font-family", "monospace")
      .attr("font-size", FONT_TITLE)
      .style("font-weight", "bold");
  
    /* helper: draw one exp-block, return x-tail */
    const drawExpBlock = (
      startX: number,
      y: number,
      value: number,
      fill: string,
      blkOffset: number
    ): number => {
      /* “exp(” */
      tooltip
        .append("text")
        .attr("x", startX + blkOffset)
        .attr("y", y - 5)
        .text("exp(")
        .attr("font-family", "monospace")
        .attr("font-size", FONT_TXT);
  
      /* coloured rect */
      const rectX = startX + blkOffset + GAP_EXP_RECT + rectAdjust;
      tooltip
        .append("rect")
        .attr("x", rectX)
        .attr("y", y - RECT_EDGE + 2)
        .attr("width", RECT_EDGE)
        .attr("height", RECT_EDGE)
        .attr("fill", fill)
        .attr("stroke", "black");
  
      /* number */
      tooltip
        .append("text")
        .attr("x", rectX + RECT_EDGE / 2)
        .attr("y", y - RECT_EDGE / 2 + 2)
        .text(roundToTwo(value))
        .attr("font-family", "monospace")
        .attr("font-size", FONT_NUM)
        .attr("text-anchor", "middle")
        .attr("fill", Math.abs(value) > 0.7 ? "white" : "black");
  
      /* “)” */
      const parenX = rectX + RECT_EDGE + GAP_RECT_PAREN + expAdjust;
      tooltip
        .append("text")
        .attr("x", parenX)
        .attr("y", y - 5)
        .text(")")
        .attr("font-family", "monospace")
        .attr("font-size", FONT_TXT);
  
      return parenX; // tail for the caller
    };
  
    /* ───────────────────────── 4.  numerator ───────────────────────────────── */
    let tailX = drawExpBlock(
      175,
      Y_NUMER,
      nthOutputVals[rectID],
      myColor(nthOutputVals[rectID]),
      0 /* numerator offset */
    );
  
  
    /* ───────────────────────── 5.  denominator (4 terms) ───────────────────── */
    const offsets = [expOffset_1, expOffset_2, expOffset_3, expOffset_4];
  
    const denomStartX = 25;
    tailX = denomStartX; // reset cursor for denominator
  
    nthOutputVals.slice(0, 4).forEach((val, i) => {
      if (i !== 0) {
        /* “+” between terms */
        tooltip
          .append("text")
          .attr("x", tailX + GAP_PLUS)
          .attr("y", Y_DENOM)
          .text("+")
          .attr("font-family", "monospace")
          .attr("font-size", FONT_TXT);
  
        tailX += GAP_PLUS + FONT_TXT; // advance cursor past “+”
      }
  
      tailX = drawExpBlock(
        tailX,
        Y_DENOM,
        val,
        myColor(val),
        offsets[i] || 0
      );
    });
  
    /* denominator finished, draw fraction bar */
    tooltip
    .append("line")
    .attr("x1", 10)
    .attr("y1", Y_LINE)
    .attr("x2", tailX + GAP_EQ - 5)
    .attr("y2", Y_LINE)
    .attr("stroke", "black")
    .attr("stroke-width", 1.5);

    /* ───────────────────────── 6.  “= result” ──────────────────────────────── */
    tooltip
      .append("text")
      .attr("x", tailX + GAP_EQ)
      .attr("y", Y_LINE)
      .text("=")
      .attr("font-family", "monospace")
      .attr("font-size", FONT_TXT);
  
    const resRectX = tailX + GAP_EQ + FONT_TXT;
    tooltip
      .append("rect")
      .attr("x", resRectX + rectAdjust)
      .attr("y", Y_RES_RECT)
      .attr("width", RECT_EDGE)
      .attr("height", RECT_EDGE)
      .attr("fill", myColor(nthResult[rectID]))
      .attr("stroke", "black");
  
    tooltip
      .append("text")
      .attr("x", resRectX + RECT_EDGE / 2 + rectAdjust)
      .attr("y", Y_RES_TEXT)
      .text(roundToTwo(nthResult[rectID]))
      .attr("font-family", "monospace")
      .attr("font-size", FONT_NUM)
      .attr("text-anchor", "middle")
      .attr(
        "fill",
        Math.abs(nthResult[rectID]) > 0.7 ? "white" : "black"
      );
  
    /* ───────────────────────── 7.  optional scale for visibility ───────────── */
    const scaleFactor = 1.5;
    const bbox = tooltip.node()?.getBBox();
    if (bbox) {
      const cx = bbox.x + bbox.width / 2;
      const cy = bbox.y + bbox.height / 2;
      const baseTransform = `translate(${baseX}, ${baseY})`;
      tooltip.attr(
        "transform",
        `${baseTransform} translate(${cx}, ${cy}) scale(${scaleFactor}) translate(${-cx}, ${-cy})`
      );
    }
  }
  

export function drawActivationExplanation(
    x: number,
    y: number,
    title: string,
    formula: string,
    description: string,
    displayW: number = 320,
    g: any = null,
) {
    let displayH = 100;
    let eqXOffset = 40;
    let eqYOffset = 55;

    //find coordination for the math displayer first
    const displayX = x + 10;
    const displayY = y - 10;
    if (formula.endsWith(".svg")) {
        displayH += 60; // Adjust height for the formula SVG
        eqYOffset += 60; // Adjust Y position for the formula SVG
    }

    //add displayer
    const container = g ? g : d3.select(".mats");
    



    container
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

    const titleYOffset = 20;
    const titleXOffset = 150;
    container
        .append("text")
        .attr("x", displayX + titleXOffset)
        .attr("y", displayY + titleYOffset)
        .text(title)
        .attr("text-anchor", "middle")
        .attr("class", "math-displayer procVis to-be-removed")
        .attr("font-size", "20px")
        .attr("font-family", "monospace")
        .attr("font-weight", "bold")
        .attr("fill", "black");

    const unitSize = eqXOffset / 3 + 3;
    const upperOffset = unitSize * 2;

        // formula: SVG vs text
        if (formula.endsWith(".svg")) {
            const formulaGroup = container
                .append("g")
                .attr("class", "math-formula");
            injectSVG(
                formulaGroup,
                displayX + eqXOffset,
                displayY + 40,
                formula,
                "math-displayer"
            );
            
        } else {
            container
                .append("text")
                .attr("x", displayX + eqXOffset)
                .attr("y", displayY + eqYOffset)
                .text(formula)
                .attr("class", "math-displayer")
                .attr("font-size", "20px")
                .attr("font-family", "monospace")
                .attr("fill", "black");
        }
    
    
    container
        .append("text")
        .attr("x", displayX + eqXOffset)
        .attr("y", displayY + eqYOffset + 30)
        .text(description)
        .attr("class", "to-be-removed math-displayer procVis")
        .attr("font-size", "20px")
        .attr("font-family", "monospace")
        .attr("fill", "black");
}

export function drawMatmulExplanation(
    x: number,
    y: number,
    title: string,
    description: string
) {
    const displayW = 600;
    const displayH = 50;

    //find coordination for the math displayer first
    const displayX = x - 100;
    const displayY = y - 100;

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

    const titleYOffset = 20;
    const titleXOffset = 200;
    d3.select(".mats")
        .append("text")
        .attr("x", displayX + titleXOffset)
        .attr("y", displayY + titleYOffset)
        .text(title)
        .attr("class", "math-displayer procVis")
        .attr("font-size", "17px")
        .attr("font-family", "monospace")
        .attr("font-weight", "bold")
        .attr("fill", "black")
        .raise();
    const eqXOffset = 30;
    const eqYOffset = 40;
    const unitSize = eqXOffset / 3 + 3;
    const upperOffset = unitSize * 2;
    d3.select(".mats")
        .append("text")
        .attr("x", displayX + eqXOffset)
        .attr("y", displayY + eqYOffset)
        .text(description)
        .attr("class", "math-displayer procVis")
        .attr("font-size", "17px")
        .attr("font-family", "monospace")
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
    
    console.log("Xv inside", Xv);
    
    let transposedXv = math.transpose(Xv);
    if(Xv.length === 16 && Xv[0].length === 5){
        transposedXv = math.transpose(transposedXv);
    }
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

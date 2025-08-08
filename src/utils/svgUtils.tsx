import * as d3 from "d3";
import { gcd, re } from "mathjs";
import { formulaClass, formulaInterpretation, formulaTextClass } from "./const";
import { drawHintLabel } from "./matHelperUtils";
import { drawActivationExplanation } from "./matInteractionUtils";

//a specific function for SVG injection for play-pause button
export function injectPlayButtonSVG(btn:any, btnX: number, btnY: number, SVGPath:string, drawLabel: boolean = true){
    btn.selectAll("*").remove();
    const textLabel = btn.append("g")
    d3.xml(SVGPath).then(function(data) {

        const play = btn!.node()!.appendChild(data.documentElement)
        d3.select(play).attr("x", btnX).attr("y", btnY).attr("class", "procVis ctrlBtn")
        .on("mouseover", function(event){
            d3.select(play).select("circle").style("fill", "rgb(218, 218, 218)");
        })
        .on("mouseout", function(event){
            d3.select(play).select("ellipse").style("fill", "rgb(255, 255, 255)");
        });
    });

    if(drawLabel)drawHintLabel(textLabel, btnX - 20, btnY - 5, "Matrix Multiplication", "procVis", "12px");
}

//a specific function for SVG injection for play-pause button for graph view
export function injectPlayButtonSVGForGraphView(btn:any, btnX: number, btnY: number, SVGPath:string){
    btn.selectAll("*").remove();
    d3.xml(SVGPath).then(function(data) {

        const play = btn!.node()!.appendChild(data.documentElement)
        d3.select(play).attr("x", btnX).attr("y", btnY).attr("class", "vis-component procVis")
        .on("mouseover", function(event){
            d3.select(play).select("circle").style("fill", "rgb(218, 218, 218)");
        })
        .on("mouseout", function(event){
            d3.select(play).select("circle").style("fill", "rgb(255, 255, 255)");
        });
    });
}

function formularInteractionHandler(
    x: number, 
    y: number, 
    g: any, 
    SVGPath: string,
    class_name: string
) {
    var element = d3.select(`.${class_name}`)
 
    var node = element.node();
    if (node !== null) {
        const bbox = (node as SVGGraphicsElement).getBBox();
    g
    .append("rect")
    .attr("x", x + bbox.x)
    .attr("y", y + bbox.y)
    .attr("width", bbox.width)
    .attr("height", bbox.height)
    .attr("fill", "none") 
    .attr("stroke", "none")
    .attr("class", "to-be-removed bbox")
    .style("pointer-events", "all")
    .on("mouseover", function(event: MouseEvent) {
        d3.selectAll(".procVis").interrupt();
        d3.selectAll(".procVis").style("opacity", 0.2)
        d3.selectAll(".cant-remove").style("opacity", 0.2);
        d3.selectAll(".formula").style("opacity", 0.2)
        d3.selectAll(`.${class_name}`).style("opacity", 1)

        const [mouseX, mouseY] = d3.pointer(event);

        // choose the correct interpretation
        let interpWindowTitle = "";
        let interpWindowText1 = "";
        let interpWindowText2 = "";

        if(class_name === 'formula_summation' || class_name === 'formula_degree'){
            let modelType = "GCN";
            if (SVGPath.includes("GAT")) {
                modelType = "GAT";
            } else if (SVGPath.includes("sage")) {
                modelType = "GraphSAGE";
            }
            interpWindowTitle = formulaInterpretation[class_name][modelType].title;
            interpWindowText1 = formulaInterpretation[class_name][modelType].text1;
            interpWindowText2 = formulaInterpretation[class_name][modelType].text2;    
        }else {
            interpWindowTitle = formulaInterpretation[class_name].title;
            interpWindowText1 = formulaInterpretation[class_name].text1;
            interpWindowText2 = formulaInterpretation[class_name].text2;
        }

        drawActivationExplanation(
                            mouseX,
                            mouseY,
                            interpWindowTitle,
                            interpWindowText1,
                            interpWindowText2,
                            960,
                            g
                        );

        console.log("mouseover-formulahandler", class_name, formulaClass[class_name], formulaTextClass[class_name])

        // add a interactive explanation window here

        for (let i = 0; i < formulaClass[class_name].length; i ++) {
            d3.selectAll(`.${formulaClass[class_name][i]}`).interrupt();
            d3.selectAll(`.${formulaClass[class_name][i]}`).style("opacity", 1);
            
    
        }
        for (let i = 0; i < formulaTextClass[class_name].length; i ++) {
            d3.selectAll(`.${formulaTextClass[class_name][i]}`).style("opacity", 1)
        }


    }).on("mouseout", function(this: any) {
        d3.selectAll(".procVis").style("opacity", 1) 
        d3.selectAll(".formula").style("opacity", 1)
        d3.selectAll(".cant-remove").style("opacity", 1);


        // remove the interactive explanation window here
        d3.selectAll(`.math-displayer`).remove();

    })

    }
}

export function injectSVG(g:any, x: number, y: number, SVGPath:string, svgClass:string){
    g.selectAll("*").remove();
    d3.xml(SVGPath).then(function(data) {
        let play;
        if (g.node() == null) return;
        play = g!.node()!.appendChild(data.documentElement)
        d3.select(play).attr("x", x).attr("y", y).attr("class", svgClass)
       
        if (SVGPath.includes("Formula")) {

            g.append("rect")
            .attr("class", "to-be-removed")
            .attr("x", x - 50)
            .attr("y", y)
            .attr("width", 400)
            .attr("height", 100)
            .style("fill", "white")
            .style("stroke", "black").raise()

            d3.select(play).raise();

            g.append("text")
            .attr("class", "to-be-removed")
            .attr("x", x)
            .attr("y", y + 90)
            .style("fill", "gray")
            .text("hover on to see the corresponding part")
            
            formularInteractionHandler(x, y, g, SVGPath, "formula_x")
            formularInteractionHandler(x, y, g, SVGPath, "formula_bias")
            formularInteractionHandler(x, y, g, SVGPath, "formula_weights")
            formularInteractionHandler(x, y, g, SVGPath, "formula_summation")
            formularInteractionHandler(x, y, g, SVGPath, "formula_degree")
            formularInteractionHandler(x, y, g, SVGPath, "formula_xj")
            formularInteractionHandler(x, y, g, SVGPath, "formula_activation")

            // d3.selectAll(".bbox").style("pointer-events", "none");
      
        }

        
    });
}

export function injectMathSymbol(
    g:any, x: number, y: number, 
    SVGPath:string, svgClass:string, 
    mode:string, lowerIndex:number|string
){
    g.selectAll("*").remove();
    d3.xml(SVGPath).then(function(data) {
        const play = g!.node()!.appendChild(data.documentElement)
        d3.select(play).attr("x", x).attr("y", y).attr("class", svgClass)
        if(mode=="input"){
            d3.select(play)
            .select("#lowerIndex_a")
            .text(lowerIndex)
            .style("font-size", "1px");
        }
    });
}

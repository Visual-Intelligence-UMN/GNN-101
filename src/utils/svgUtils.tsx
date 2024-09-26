import * as d3 from "d3";
import { gcd } from "mathjs";
import { formulaClass, formulaTextClass } from "./const";
import { drawHintLabel } from "./matHelperUtils";

//a specific function for SVG injection for play-pause button
export function injectPlayButtonSVG(btn:any, btnX: number, btnY: number, SVGPath:string){
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

    drawHintLabel(textLabel, btnX - 20, btnY - 5, "Matrix Multiplication", "procVis", "12px");
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

function formularInteractionHandler(x: number, y: number, g: any, class_name: string) {
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
    .on("mouseover", function(this: any) {
        d3.selectAll(".procVis").interrupt();
        d3.selectAll(".procVis").style("opacity", 0.2)
        d3.selectAll(".cant-remove").style("opacity", 0.2);
        d3.selectAll(".formula").style("opacity", 0.2)
        d3.selectAll(`.${class_name}`).style("opacity", 1)



        
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


        // for (let i = 0; i < formulaClass[class_name].length; i ++) {
        //     d3.selectAll(`.${formulaClass[class_name][i]}`).style("stroke_width", 1).style("stroke", "gray");
        // }

        // for (let i = 0; i < formulaTextClass[class_name].length; i ++) {
        //     d3.selectAll(`.${formulaTextClass[class_name][i]}`).style("fill", "gray")
        // }

    })

    }
}

export function injectSVG(g:any, x: number, y: number, SVGPath:string, svgClass:string){
    g.selectAll("*").remove();
    d3.xml(SVGPath).then(function(data) {
        let play;
 
        play = g!.node()!.appendChild(data.documentElement)
        d3.select(play).attr("x", x).attr("y", y-20).attr("class", svgClass)
       
        if (SVGPath.includes("Formula")) {

            g.append("rect")
            .attr("class", "to-be-removed")
            .attr("x", x - 50)
            .attr("y", y - 20)
            .attr("width", 400)
            .attr("height", 100)
            .style("fill", "white")
            .style("stroke", "black").raise()

            d3.select(play).raise();

            g.append("text")
            .attr("class", "to-be-removed")
            .attr("x", x)
            .attr("y", y + 70)
            .style("fill", "gray")
            .text("hover on to see the corresponding part")
            
            formularInteractionHandler(x, y, g, "formula_x")
            formularInteractionHandler(x, y, g, "formula_bias")
            formularInteractionHandler(x, y, g, "formula_weights")
            formularInteractionHandler(x, y, g, "formula_summation")
            formularInteractionHandler(x, y, g, "formula_degree")
            formularInteractionHandler(x, y, g, "formula_xj")
            formularInteractionHandler(x, y, g, "formula_activation")

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

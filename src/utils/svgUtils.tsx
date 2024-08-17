import * as d3 from "d3";
import { gcd } from "mathjs";

//a specific function for SVG injection for play-pause button
export function injectPlayButtonSVG(btn:any, btnX: number, btnY: number, SVGPath:string){
    btn.selectAll("*").remove();
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
}

//a specific function for SVG injection for play-pause button for graph view
export function injectPlayButtonSVGForGraphView(btn:any, btnX: number, btnY: number, SVGPath:string){
    btn.selectAll("*").remove();
    d3.xml(SVGPath).then(function(data) {

        const play = btn!.node()!.appendChild(data.documentElement)
        d3.select(play).attr("x", btnX).attr("y", btnY).attr("class", "vis-component")
        .on("mouseover", function(event){
            d3.select(play).select("circle").style("fill", "rgb(218, 218, 218)");
        })
        .on("mouseout", function(event){
            d3.select(play).select("circle").style("fill", "rgb(255, 255, 255)");
        });
    });
}

export function injectSVG(g:any, x: number, y: number, SVGPath:string, svgClass:string){
    g.selectAll("*").remove();
    d3.xml(SVGPath).then(function(data) {

        const play = g!.node()!.appendChild(data.documentElement)
        d3.select(play).attr("x", x).attr("y", y).attr("class", svgClass)
    });
}
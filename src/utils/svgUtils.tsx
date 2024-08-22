import * as d3 from "d3";
import { gcd } from "mathjs";
import { formulaClass, formulaTextClass } from "./const";

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
    .attr("pointer-events", "all") 
    .attr("stroke", "none") 
    .attr("class", "to-be-removed")
    .on("mouseover", function(this: any) {
        d3.selectAll(".procVis").style("opacity", 0.2) 
        d3.selectAll(".formula").style("opacity", 0.2)
        d3.select(`.${class_name}`).style("opacity", 1)

        for (let i = 0; i < formulaClass[class_name].length; i ++) {
            d3.selectAll(`.${formulaClass[class_name][i]}`).style("opacity", 1)
        }

        for (let i = 0; i < formulaTextClass[class_name].length; i ++) {
            d3.selectAll(`.${formulaTextClass[class_name][i]}`).style("opacity", 1)
        }


    }).on("mouseout", function(this: any) {
        d3.selectAll(".procVis").style("opacity", 1) 
        d3.selectAll(".formula").style("opacity", 1)
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

        const play = g!.node()!.appendChild(data.documentElement)
        d3.select(play).attr("x", x).attr("y", y).attr("class", svgClass)
       
        if (SVGPath === "./assets/SVGs/GCNFormula.svg") {
            g.append("rect")
            .attr("class", "to-be-removed")
            .attr("x", x - 50)
            .attr("y", y)
            .attr("width", 400)
            .attr("height", 100)
            .style("fill", "none")
            .style("stroke", "black")


            g.append("text")
            .attr("class", "to-be-removed")
            .attr("x", x)
            .attr("y", y + 90)
            .style("fill", "gray")
            .text("hover on to see the corresponding part")
            
            formularInteractionHandler(x, y, g, "formula_x")
            formularInteractionHandler(x, y, g, "formula_bias")
            formularInteractionHandler(x, y, g, "formula_weights")
            formularInteractionHandler(x, y, g, "formula_summation")
            formularInteractionHandler(x, y, g, "formula_neighbor_aggregate")
            formularInteractionHandler(x, y, g, "formula_activation")
        }
        
    });
}

export function flattenSVG(svg:string) {
    // 选择所有的use元素
    console.log("use", d3.select(svg).selectAll('use'))
    d3.select(svg).selectAll('use').each(function() {
        var use:any = d3.select(this);
        var href = use.attr('href') || use.attr('xlink:href');

console.log("href: ", href);

        if (!href) return;

        // 找到被引用的元素
        var target = d3.select(href);
        if (target.empty()) return;

        // 创建一个新的元素，类型与目标元素相同
        var newElement = d3.create('svg:' + target.node().tagName);

        // 复制目标元素的属性
        target.node()?.getAttributeNames().forEach(function(attr:string) {
            newElement.attr(attr, target.attr(attr));
        });

        // 复制use元素的属性（位置、变换等）
        use.node()?.getAttributeNames().forEach(function(attr:string) {
            if (attr !== 'href' && attr !== 'xlink:href') {
                newElement.attr(attr, use.attr(attr));
            }
        });

        // 复制目标元素的子节点
        newElement.html(target.html());

        // 用新元素替换use元素
        use.replaceWith(function() { return newElement.node(); });
    });
}






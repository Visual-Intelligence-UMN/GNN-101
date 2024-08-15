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






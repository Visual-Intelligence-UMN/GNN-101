// commonStyle.ts
import * as d3 from "d3";

export function createPanel(
  svgSelection: d3.Selection<SVGSVGElement | SVGGElement, unknown, HTMLElement, any>,
  x: number, y: number,
  width: number, height: number,
  extraClasses: string = ""
) {
  return svgSelection
    .append("rect")
    .attr("x", x)
    .attr("y", y)
    .attr("width", width)
    .attr("height", height)
    .attr("rx", 10)
    .attr("ry", 10)
    .style("fill", "white")
    .style("stroke", "black")
    .style("stroke-width", 2)
    .attr("class", `math-displayer procVis ${extraClasses}`)
    .lower();
}


export function createText(
  svgSelection: d3.Selection<SVGSVGElement | SVGGElement, unknown, HTMLElement, any>,
  text: string,
  x: number,
  y: number,
  fontSize: number = 12,
  fill: string = "black",
  textAnchor: string = "start",
  dominantBaseline: string = "alphabetic"
) {
  return svgSelection
    .append("text")
    .text(text)
    .attr("x", x)
    .attr("y", y)
    .attr("font-size", fontSize)
    .attr("fill", fill)
    .attr("text-anchor", textAnchor)
    .attr("dominant-baseline", dominantBaseline)
    .attr("class", "math-displayer procVis");
}

/**
 * drawMatmulPanel - 统一绘制一个 Matmul Visualization 大框 + 标题
 * @param svgSelection   d3 选择器（<svg> 或 <g>）
 * @param x, y           面板左上角坐标
 * @param width, height  面板宽高
 * @param title          需要显示的标题文本，默认 "Matmul Visualization"
 */
export function drawMatmulPanel(
  svgSelection: d3.Selection<SVGSVGElement | SVGGElement, unknown, HTMLElement, any>,
  x: number,
  y: number,
  width: number,
  height: number,
  title: string = "Matmul Visualization"
) {
  // 1. 先绘制背景面板
  createPanel(svgSelection, x, y, width, height);

  // 2. 在顶部绘制标题
  //   比如想让标题居中，可以让它的 x = 面板中点
  const titleX = x + width / 2;
  const titleY = y + 20;  // 视情况调整
  createText(svgSelection, title, titleX, titleY, 20, "black", "middle", "middle");
}

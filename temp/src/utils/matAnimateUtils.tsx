import * as d3 from "d3";

export function drawAniPath(
    Xt:any, 
    currentStep:number, 
    startCoordList:any, 
    endCoordList:any, 
    curveDir:number, 
    myColor:any
) {
    d3.selectAll("#tempath").remove();

    const Xv = Xt[currentStep];
    for (let j = 0; j < 64; j++) {
        const s1 = startCoordList[j];
        const e1 = endCoordList[currentStep];
        let pathDir = e1[0] > s1[0] ? 0 : 1;
        if (curveDir == 1) {
            pathDir = e1[0] > s1[0] ? 1 : 0;
        }
        console.log("se", [s1, e1]);
        d3.select(".mats")
            .append("path")
            .attr("d", function () {
                return [
                    "M",
                    s1[0],
                    s1[1],
                    "A",
                    (e1[0] - s1[0]) / 2,
                    ",",
                    (e1[0] - s1[0]) / 4,
                    0,
                    0,
                    ",",
                    pathDir,
                    ",",
                    e1[0],
                    ",",
                    e1[1],
                ].join(" ");
            })
            .attr("class", "procVis")
            .attr("id", "tempath")
            .style("fill", "none")
            .attr("stroke", myColor(Xv[j]));
    }
    d3.selectAll("#tempath").lower();
}

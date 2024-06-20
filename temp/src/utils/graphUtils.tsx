import * as d3 from "d3";
import { calculateAverage, myColor } from "./utils";
import { inter } from "@/pages";

export function hideAllLinks(nodes: any) {
    nodes.forEach((node: any) => {
      if (node.links) {
        node.links.forEach((link: any) => {
          link.style("opacity", 0);
        })
  
      }
  })
  }

export function showAllLinks(nodes: any) {
    nodes.forEach((node: any) => {
      if (node.links) {
        node.links.forEach((link: any) => {
          link.style("opacity", 0.07);
        })
  
      }
  })
  }

export function reduceNodeOpacity(nodes: any[], relatedNodes: any[], selfNode: any) {
    nodes.forEach((node: any) => {
        if (node.svgElement && node.text) {
            if (!((relatedNodes.length != 0) && relatedNodes.includes(node)) && (node != selfNode)) {
                d3.select(node.svgElement).attr("stroke-opacity", 0.2);
                node.text.attr("opacity", 0.2);
                
            }
        }
    })
  }

export function resetNodeOpacity(nodes: any[]) {
    nodes.forEach((node: any) => {
        if (node.svgElement && node.text) {
            d3.select(node.svgElement).attr("stroke-opacity", 1);
            node.text.attr("opacity", 1);
        }
    })
  }
  
  
export function resetNodes(allNodes: any[]) {
    allNodes.forEach(node => {
      if (node.graphIndex <= 2) {
      if (node.featureGroup) {
        node.featureGroup.style("visibility", "hidden")
      }
      if (node.svgElement) {
        d3.select(node.svgElement).attr("stroke-width", 1);
      }
      if (node.relatedNodes) {
        node.relatedNodes.forEach((relatedNode: any) => {
          d3.select(relatedNode.svgElement).attr("stroke-width", 1);
        });
      }
      if (node.intermediatePaths) {
        node.intermediatePaths.forEach((path: any) => {
          path.style("opacity", 0);
        })
      }
      if (node.intermediateFeatureGroups) {
        node.intermediateFeatureGroups.forEach((intermediateFeatureGroup: any) => {
          intermediateFeatureGroup.style("visibility", "hidden");
        })
      

      }
    }
    });
  }


export function calculationVisualizer(node: any, svg: any, offset: number) {
  const g3 = svg.append("g")
  .attr("class", "layerVis") 
  .attr("transform", `translate(${(node.graphIndex - 3.5) * offset}, 10)`);

  let start_x = 0; 
  let start_y = 0;
  let end_x = 0;
  let end_y = 0;

  let paths: any = [];
  let intermediateFeatureGroups: any = [];

  const pathColor = d3.scaleLinear<string>()
  .domain([-0.25, 0, 0.25])
  .range(["red", "purple", "blue"]);

  let data = node.features; //to be determined

  const intermediateFeatureGroup1 = g3.append("g")
          .attr("transform", `translate(${node.x + 400}, ${node.y + 35})`);

  intermediateFeatureGroup1.selectAll("rect")
      .data(data)
      .enter()
      .append("rect")
      .attr("x", 0)
      .attr("y", (d: any, i: number) => i * 3 + 5)
      .attr("width", 15)
      .attr("height", 3)
      .style("fill", (d: number) => myColor(d))
      .style("stroke-width", 1)
      .style("stroke", "grey")
      .style("opacity", 1);

  intermediateFeatureGroups.push(intermediateFeatureGroup1);

  const intermediateFeatureGroup2 = g3.append("g")
          .attr("transform", `translate(${node.x + 600}, ${node.y + 35})`);

  intermediateFeatureGroup2.selectAll("rect")
      .data(data)
      .enter()
      .append("rect")
      .attr("x", start_x)
      .attr("y", (d: any, i: number) => i * 3 + 5)
      .attr("width", 15)
      .attr("height", 3)
      .style("fill", (d: number) => myColor(d))
      .style("stroke-width", 1)
      .style("stroke", "grey")
      .style("opacity", 1);

    intermediateFeatureGroups.push(intermediateFeatureGroup2);

    node.intermediateFeatureGroups = intermediateFeatureGroups;




  if (node.featureGroupLocation) {
    end_x = node.featureGroupLocation.xPos + 400;
    end_y = node.featureGroupLocation.yPos + 10;
  }

  if (node.relatedNodes) {
    node.relatedNodes.forEach((n: any) => {
      if (n.featureGroupLocation) {
        start_x = n.featureGroupLocation.xPos
        start_y = n.featureGroupLocation.yPos + 10;


        const controlX1 =  (start_x + end_x) / 2;
        const controlY1 = start_y + 100;

        const color = calculateAverage(n.features);
      
        const intermediatePath = g3.append("path")
          .attr("d", `M${start_x},${start_y} Q${controlX1},${controlY1} ${end_x},${end_y}`)
          .style("stroke", pathColor(color))
          .style("opacity", 0.7)
          .style("stroke-width", 1)
          .style("fill", "none")
          .style("opacity", "1");

          paths.push(intermediatePath);

     
      }
    })
    start_x = node.x + 600;
    start_y = node.y + 220;
    end_x = node.x + offset + 300;
    end_y = node.y + 220;


    const controlX2 =  (start_x + end_x) / 2;
    const controlY2 = start_y + 100;

    const color = calculateAverage(node.features); // to be determined
  
    const intermediatePath = g3.append("path")
      .attr("d", `M${start_x},${start_y} Q${controlX2},${controlY2} ${end_x},${end_y}`)
      .style("stroke", pathColor(color))
      .style("opacity", 0.7)
      .style("stroke-width", 1)
      .style("fill", "none")
      .style("opacity", "1");

      paths.push(intermediatePath);



    node.intermediatePaths = paths;



    

    
  }

}







import * as d3 from "d3";
import { calculateAverage, myColor } from "./utils";
import { loadWeights } from "./matHelperUtils";
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

export function highlightNodes(node: any) {
  if (node.featureGroup && node.svgElement) {
    node.featureGroup.style('visibility', 'visible');
    node.featureGroup.raise();
    d3.select(node.svgElement).attr("stroke-width", 3);
  } 

  if (node.relatedNodes) {
    node.relatedNodes.forEach((n: any) => {
      d3.select(n.svgElement).attr("stroke-width", 3);
      n.featureGroup.style('visibility', 'visible');
      n.featureGroup.raise();
    });
  }

  if (node.links) {
    node.links.forEach((link: any) => {
      link.style("opacity", 0.7);
    });
  }
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

      if (node.links) {
        node.links.forEach((link: any) => {
          link.style("opacity", 0.07);
        });
      }

      if (node.relatedNodes) {
        node.relatedNodes.forEach((n: any) => {
          d3.select(n.svgElement).attr("stroke-width", 1);
          n.featureGroup.style('visibility', 'hidden');
        });
      }
    
      if (node.svgElement && node.text) {
        d3.select(node.svgElement).attr("stroke-opacity", 1);
        node.text.attr("opacity", 1);
    }
    }
    });
  }


  export function calculationVisualizer(node: any, svg: any, offset: number, normalizedAdjMatrix: any[], isClicked: boolean) {
    if (isClicked || normalizedAdjMatrix == null) { //doesn't work currently
      return;
    }
    const { weights, bias } = loadWeights();

    let biasData = bias[node.graphIndex]; //might cause an issue when the first layer is added 
    
    const g3 = svg.append("g")
      .attr("class", "layerVis")
      .attr("transform", `translate(${(node.graphIndex - 3.5) * offset}, 10)`);

    let startCoordList: any[] = [];
    let endCoordList: any[] = [];
  
    let start_x = 0;
    let start_y = 0;
    let end_x = 0;
    let end_y = 0;

    let xPos = 0;
    let yPos = 0

    if (node.featureGroupLocation) {  
      xPos = node.featureGroupLocation.xPos;
      yPos = node.featureGroupLocation.yPos;
    }
  
    let paths: any = [];
    let intermediateFeatureGroups: any = [];
  
    const pathColor = d3.scaleLinear<string>()
      .domain([-0.25, 0, 0.25])
      .range(["red", "purple", "blue"]);

  
    let calculatedData: any[] = [];
    for (let i = 0; i < node.features.length; i++) {
      calculatedData.push(node.features[i] - biasData[i])
    }
   
  
    const originalFeatureGroup = g3.append("g")
      .attr("transform", `translate(${xPos + 400}, ${yPos - 64 * 3 - 5})`);
  
    originalFeatureGroup.selectAll("rect")
      .data(node.features)
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


      for (let i = 0; i < 64; i++) {
        let s: [number, number] = [
            start_x + xPos + 415 + (node.graphIndex - 3.5) * offset,
            yPos - i * 3 - 5 + 12,
        ];  
        startCoordList.push(s)
      }  
  
    intermediateFeatureGroups.push(originalFeatureGroup);

    const aggregatedFeatureGroup = g3.append("g")
      .attr("transform", `translate(${xPos + 600}, ${yPos - 64 * 3 - 5})`);
  
    aggregatedFeatureGroup.selectAll("rect")
      .data(calculatedData)
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

    for (let i = 0; i < 64; i++) {
      let s: [number, number] = [
          start_x + xPos + 615 + (node.graphIndex - 3.5) * offset,
          yPos - i * 3 - 5 + 12,
      ];  
      endCoordList.push(s)
    }

    intermediateFeatureGroups.push(aggregatedFeatureGroup);


    const BiasGroup = g3.append("g")
      .attr("transform", `translate(${xPos + 650}, ${yPos - 64 * 3 - 75})`);
  
    BiasGroup.selectAll("rect")
      .data(biasData)
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

  
    intermediateFeatureGroups.push(BiasGroup);
    node.intermediateFeatureGroups = intermediateFeatureGroups;

  
    if (node.featureGroupLocation) {
      end_x = xPos + 400;
      end_y = yPos;
    }
    setTimeout(() => {
    if (node.relatedNodes) {
      node.relatedNodes.forEach((n: any) => {
        if (n.featureGroupLocation) {
          start_x = n.featureGroupLocation.xPos;
          start_y = n.featureGroupLocation.yPos;
  
          const controlX = (start_x + end_x) / 2;
          const controlY = start_y + 100;
  
          let color = calculateAverage(n.features);
  
          const originToAggregated = g3.append("path")
            .attr("d", `M${start_x},${start_y} Q${controlX},${controlY} ${end_x},${end_y}`)
            .style("stroke", pathColor(color))
            .style("opacity", 0.7)
            .style("stroke-width", 1)
            .style("fill", "none")
            .style("opacity", 1);
  
          paths.push(originToAggregated);
        }
      });
      

      let color;
  
      start_x = xPos + 600;
      start_y = yPos;
      end_x = xPos + 600 + 300; // the horizontal distance is offset(600) + moveoffset(300)
      end_y = yPos
  
      color = calculateAverage(node.features); // to be determined
  
      const aggregatedToFinal = g3.append("path")
        .attr("d", `M${start_x},${start_y} ${end_x},${end_y}`)
        .style("stroke", pathColor(color))
        .style("opacity", 0.7)
        .style("stroke-width", 1)
        .style("fill", "none")
        .style("opacity", 1);
  
      paths.push(aggregatedToFinal);
      


      start_x = xPos + 650;
      start_y = yPos - 75;

      let control1_x = start_x + (end_x - start_x) * 0.2;
      let control1_y = start_y;
      let control2_x = start_x + (end_x - start_x) * 0.4;
      let control2_y = end_y;

      color = calculateAverage(node.features); // to be determined
      const biasToFinal = g3.append("path")
      .attr("d", `M${start_x},${start_y} C ${control1_x} ${control1_y}, ${control2_x} ${control2_y} ${end_x},${end_y}`)
        .style("stroke", pathColor(color))
        .style("opacity", 0.7)
        .style("stroke-width", 1)
        .style("fill", "none")
        .style("opacity", 1);
  
      paths.push(biasToFinal);
      node.intermediatePaths = paths;
    }

    g3.append("circle")
      .attr("cx", end_x - 30)
      .attr("cy", end_y)
      .attr("r", 10)
      .style("fill", "white")
      .style("stroke", "black")
      .style("stroke-width", 1)
      .attr("opacity", 1)
      .attr("class", "vis-component");
      

    g3.append("text")
    .attr("x", end_x - 30)
    .attr("y", end_y)
    .attr("dy", ".35em")
    .text("r")
    .style("font-size", "12px")
    .style("fill", "black")
    .attr("class", "vis-component")
    .attr("opacity", 1)
    .style("text-anchor", "middle");  
  }, 1500);

    weightAnimation(svg, startCoordList, endCoordList, weights[node.graphIndex]); // may cause problems when the first layer is added 
  }


export function moveNextLayer(svg: any, node: any, moveOffset: number, indicator: number) {

  if (!svg.selectAll) {
    svg = d3.select(svg);
  } // when svg is passed into a function, it should be selected again

  svg.selectAll("g[layerNum]")
  .filter((d: any, i: any, nodes: any) => {
    const layerNum = d3.select(nodes[i]).attr("layerNum");
    return layerNum !== null && parseInt(layerNum) > 0 && parseInt(layerNum) >= node.graphIndex;
  })
  .attr("transform", function(this: any) {
    const currentTransform = d3.select(this).attr("transform");
    if (currentTransform) {
      const currentXMatch = currentTransform.match(/translate\(([^,]+),/);
      if (currentXMatch && currentXMatch[1]) {
        const currentX = parseInt(currentXMatch[1]);
        return `translate(${currentX + (indicator * moveOffset)},10)`;
      }
    }
    return "translate(${moveOffset},10)"; // Default fallback
  });
}

function weightAnimation(svg: any, startCoordList: number[], endCoordList: number[], weights: any[]) {
  let i = 0
  let intervalID: any;
  let isAnimating = true; 

  document.addEventListener('click', () => {
    isAnimating = false; 
  });

  function setIntervalID(id:any) {
    intervalID = id;
  }

  setTimeout(() => {
    intervalID = setInterval(() => {
      GraphViewDrawPaths(
          i,
          startCoordList,
          endCoordList,
          svg,
          isAnimating
      );
      i++;
      if (i >= 64) {
          clearInterval(intervalID);
      }
  }, 250); 

  setIntervalID(intervalID); 
  d3.selectAll("path").lower();
  }, 2000)

}

function GraphViewDrawPaths(
  i: number,
  startCoordList: any,
  endCoordList: any,
  svg: any,
  isAnimating: boolean
) {
  if (!isAnimating) {
    d3.selectAll(`#tempath${i}`).remove();
    return;
  }
  

  if (!svg.selectAll) {
    svg = d3.select(svg);
  }
  for (let j = 0; j < 64; j++) {
    let s = startCoordList[63 - j];
    let e = endCoordList[i];

    let start_x = s[0];
    let start_y = s[1];
    let end_x = e[0];
    let end_y = e[1];

    let control1_x = start_x + (end_x - start_x) * 0.3;
    let control1_y = start_y;
    let control2_x = start_x + (end_x - start_x) * 0.7;
    let control2_y = end_y;

    let path = d3.path();
    path.moveTo(s[0], s[1]);
    path.bezierCurveTo(
      control1_x, control1_y,
      control2_x, control2_y,
      e[0], e[1]
    );

    svg.append("path")
      .attr("d", path.toString())
      .attr("stroke", "grey")
      .attr("stroke-width", 1)
      .attr("opacity", 1)
      .attr("fill", "none")
      .attr("id", `tempath${i}`);
  }

  setTimeout(() => {
    d3.selectAll(`#tempath${i}`).remove();
    i++;
  }, 250);
}





export function aggregationCalculator(graphs: any[]) {

  
  let data = graphs[0];
  let adjList: number[][] = Array.from(
    { length: data.nodes.length },
    () => []
);
for (let i = 0; i < data.nodes.length; i++) {
    //push itself to the linkMap
    adjList[i].push(i);
    for (let j = 0; j < data.links.length; j++) {
        if (data.links[j].source == i) {
            //push its neighbors to linkMap
            adjList[i].push(data.links[j].target);
      }
    }
  }
  const nodeCount = data.nodes.length;
  const edgePairs = data.links;
  const degreeMap = new Array(nodeCount).fill(0);
  for (let i = 0; i < edgePairs.length; i++) {
    const source = edgePairs[i].source;
    const target = edgePairs[i].target;

    degreeMap[source]++;
    degreeMap[target]++;
  }
  for (let i = 0; i < degreeMap.length; i++) {
    degreeMap[i] = degreeMap[i] / 2
  }

  console.log("FAW", adjList, degreeMap);

  let adjMatrix = Array.from({ length: nodeCount }, () => new Array(nodeCount).fill(0));


  for (let i = 0; i < nodeCount; i++) {
    for (let j = 0; j < adjList[i].length; j++) {
      const neighbor = adjList[i][j];
      adjMatrix[i][neighbor] = 1; 
    }
  }


  let degreeMatrix = new Array(nodeCount).fill(0).map((_, i) => 1 / Math.sqrt(degreeMap[i]));

  let normalizedAdjMatrix = Array.from({ length: nodeCount }, () => new Array(nodeCount).fill(0));
  for (let i = 0; i < nodeCount; i++) {
    for (let j = 0; j < nodeCount; j++) {
      if (adjMatrix[i][j] !== 0) {
        normalizedAdjMatrix[i][j] = degreeMatrix[i] * adjMatrix[i][j] * degreeMatrix[j];
      }
    }
  }
  return normalizedAdjMatrix;

}



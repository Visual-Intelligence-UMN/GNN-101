import * as d3 from "d3";
import { calculateAverage, myColor } from "./utils";
import { loadWeights } from "./matHelperUtils";
import { create, all, matrix } from "mathjs";
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


  export function calculationVisualizer(node: any, currentWeights: any, bias: any, aggregatedDataMap: any[], calculatedDataMap: any[], svg: any, offset: number, isClicked: boolean) {
    if (isClicked || aggregatedDataMap == null || calculatedDataMap == null) { //doesn't work currently
      return;
    }


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
      .range(["red", "purple", "blue"]); //to be determined

      
    const aggregatedData = aggregatedDataMap[node.id];

  
    const aggregatedFeatureGroup = g3.append("g")
      .attr("transform", `translate(${xPos + 400}, ${yPos - 64 * 3 - 5})`);
  
    aggregatedFeatureGroup.selectAll("rect")
      .data(aggregatedData)
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
  
    intermediateFeatureGroups.push(aggregatedFeatureGroup);


    const calculatedData = calculatedDataMap[node.id]

    const calculatedFeatureGroup = g3.append("g")
      .attr("transform", `translate(${xPos + 600}, ${yPos - 64 * 3 - 5})`);
  
    calculatedFeatureGroup.selectAll("rect")
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
          start_x + xPos + 600 + (node.graphIndex - 3.5) * offset,
          yPos - i * 3 - 5 + 12,
      ];  
      endCoordList.push(s)
    }

    intermediateFeatureGroups.push(calculatedFeatureGroup);


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

    weightAnimation(svg, startCoordList, endCoordList, currentWeights); // may cause problems when the first layer is added 
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
  const math = create(all, {});
  const Xt = math.transpose(weights);

  document.addEventListener('click', () => {
    isAnimating = false; 
  });

  function setIntervalID(id:any) {
    intervalID = id;
  }

  setTimeout(() => {
    intervalID = setInterval(() => {
      GraphViewDrawPaths(
          Xt,
          myColor,
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
  Xt: any,
  myColor: any,
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
  const Wi = Xt[i];
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
      .attr("stroke", myColor(Wi[63 - j]))
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
  const nodeCount = data.nodes.length;
  const edgePairs = data.links;
  let adjList: number[][] = Array.from(
    { length: nodeCount },
    () => []
  );
  let checked: number[] = [];
  for (let i = 0; i < nodeCount; i++) {
    // Push itself to the adjList
    adjList[i].push(i);
    for (let j = 0; j < edgePairs.length; j++) {
      if (data.links[j].source.id === i) {
        // Push its neighbors to adjList
        adjList[i].push(data.links[j].target.id);
      }
    }
  }

  const degreeMap = new Array(nodeCount).fill(0);
  for (let i = 0; i < edgePairs.length; i++) {
    if (!checked.includes(edgePairs[i].target.id)) {
      const source = edgePairs[i].source.id;
      const target = edgePairs[i].target.id;

      degreeMap[source]++;
      degreeMap[target]++;
      checked.push(edgePairs[i].target.id);
    }
  }

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

export function matrixMultiplication(matrix_a: any[], matrix_b: any[]) {

  const rowsA = matrix_a.length;
    const colsA = matrix_a[0].length;
    const rowsB = matrix_b.length;
    const colsB = matrix_b[0].length;

    if (colsA !== rowsB) {
      console.log("can't do")
      return matrix_a;
       
    }

    const result: any[][] = Array.from({ length: rowsA }, () => Array(colsB).fill(0));

    for (let i = 0; i < rowsA; i++) {
        for (let j = 0; j < colsB; j++) {
            for (let k = 0; k < colsA; k++) {
                result[i][j] += matrix_a[i][k] * matrix_b[k][j];
            }
        }
    }

    return result;
}

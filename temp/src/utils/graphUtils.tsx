import * as d3 from "d3";
import { FeatureGroupLocation, calculateAverage, myColor } from "./utils";
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
  const linkStrength = d3.scaleLinear()
          .domain([-0.25, 0, 0.25])
          .range([0.1, 0.3, .6]);
  const avg = calculateAverage(node.features);

  if (node.featureGroup && node.svgElement) {
    d3.select(node.svgElement).attr("stroke-width", 3);
  } 

  if (node.relatedNodes) {
    node.relatedNodes.forEach((n: any) => {
      d3.select(n.svgElement).attr("stroke-width", 3);
    });
  }

  if (node.links) {
    node.links.forEach((link: any) => {
      node.features
      link.style("opacity", linkStrength(avg));
    });
  }
}
  
export function resetNodes(allNodes: any[]) {
    allNodes.forEach(node => {
      if (node.graphIndex <= 3) {
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


  export function calculationVisualizer(node: any, currentWeights: any, bias: any, normalizedAdjMatrix: any, aggregatedDataMap: any[], calculatedDataMap: any[], svg: any, offset: number, height: number, isClicked: boolean, moveOffset: number) {
    if (isClicked || aggregatedDataMap == null || calculatedDataMap == null) { 
      return;
    }
    node.featureGroup.style("visibility", "visible");
    node.featureGroup.raise();
    node.relatedNodes.forEach((n: any) => {
      n.featureGroup.style("visibility", "visible");
      n.featureGroup.raise();
    })

    let isPlaying: boolean = true;
  
    let biasData = [];
    if (node.graphIndex) {
      biasData = bias[node.graphIndex - 1]; //might cause an issue when the first layer is added 
    }
    
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
    let yPos = 0;
  
    let moveToX =  3.5 * offset - 100;
    let moverToY = height / 5;
    let originalCoordinates = moveFeatures(node, node.relatedNodes, moveToX, moverToY);
  
    if (node.featureGroupLocation) {  
      xPos = node.featureGroupLocation.xPos;
      yPos = node.featureGroupLocation.yPos;
    }
  
    let paths: any = [];
    let intermediateFeatureGroups: any = [];
  
    const pathColor = d3.scaleLinear<string>()
    .domain([-0.25, 0, 0.25])
    .range(["white", "gray", "black"]);
  
    const aggregatedData = aggregatedDataMap[node.id];
  
    const aggregatedFeatureGroup = g3.append("g")
      .attr("transform", `translate(${3.5 * offset + node.relatedNodes[0].features.length * 3}, ${height / 5 + 150})`);
  
    aggregatedFeatureGroup.selectAll("rect")
      .data(aggregatedData)
      .enter()
      .append("rect")
      .attr("x", (d: any, i: number) => i * 3)
      .attr("y", 0)
      .attr("width", 3)
      .attr("height", 15)
      .style("fill", (d: number) => myColor(d))
      .style("stroke-width", 1)
      .attr("class", "aggregatedFeatureGroup to-be-removed")
      .style("stroke", "grey")
      .style("opacity", 0);

    d3.selectAll(".aggregatedFeatureGroup").transition()
      .delay(3500)
      .style("opacity", 1);
      
  
    for (let i = 0; i < 64; i++) {
      let s: [number, number] = [
          (node.graphIndex) * offset + i * 3 + node.relatedNodes[0].features.length * 3,
          height / 5 + 150 + 10
      ];  
      startCoordList.push(s);
    }  
  
    intermediateFeatureGroups.push(aggregatedFeatureGroup);
  
    const calculatedData = calculatedDataMap[node.id];
  
    const calculatedFeatureGroup = g3.append("g")
      .attr("transform", `translate(${3.5 * offset + node.relatedNodes[0].features.length * 6 + 30}, ${height / 5 + 150})`);
  
    calculatedFeatureGroup.selectAll("rect")
      .data(calculatedData)
      .enter()
      .append("rect")
      .attr("x", (d: number, i: number) => i * 3 + 5)
      .attr("y", 0)
      .attr("width", 3)
      .attr("height", 15)
      .attr("class", (d: number, i: number) => `calculatedFeatures${i} to-be-removed`)
      .style("fill", (d: number) => myColor(d))
      .style("stroke-width", 1)
      .style("stroke", "grey")
      .style("opacity", 0);
  
    for (let i = 0; i < 64; i++) {
      let s: [number, number] = [
          (node.graphIndex) * offset + i * 3 + node.relatedNodes[0].features.length * 6 + 30,
          height / 5 + 150 + 10
      ];  
      endCoordList.push(s);
    }
  
    intermediateFeatureGroups.push(calculatedFeatureGroup);
  
    const BiasGroup = g3.append("g")
      .attr("transform", `translate(${3.5 * offset + node.relatedNodes[0].features.length * 6 + 30}, ${height / 5 + 100})`);
  
    BiasGroup.selectAll("rect")
      .data(biasData)
      .enter()
      .append("rect")
      .attr("class", "bias")
      .attr("x", (d: any, i: number) => i * 3 + 5)
      .attr("y", 0)
      .attr("width", 3)
      .attr("height", 15)
      .style("fill", (d: number) => myColor(d))
      .style("stroke-width", 1)
      .style("stroke", "grey")
      .style("opacity", 0);
  
    intermediateFeatureGroups.push(BiasGroup);
    node.intermediateFeatureGroups = intermediateFeatureGroups;
  
 
    end_x = 3.5 * offset + node.relatedNodes[0].features.length * 3
    end_y = height / 5 + 150 + 7.5;
    
    let adjMatrixSlice: number[] = []; 
    for (let i = 0; i < normalizedAdjMatrix[node.id].length; i++) {
      if (normalizedAdjMatrix[node.id][i] != 0) {
       adjMatrixSlice.push(normalizedAdjMatrix[node.id][i].toFixed(2));
      }
    }
  
    setTimeout(() => {
      weightAnimation(svg, node, startCoordList, endCoordList, currentWeights, offset, height, moveOffset); 
      if (node.relatedNodes) {
        node.relatedNodes.forEach((n: any, i: number) => {
          if (n.featureGroupLocation) {
            start_x = 3.5 * offset - 70 + n.features.length * 3;
            start_y = height / 5 + 90 + 40 * i;

            const control1_x = start_x + (end_x - start_x) * 0.3;
            const control1_y = start_y;
            const control2_x = start_x + (end_x - start_x) * 0.7;
            const control2_y = end_y;

            let color = calculateAverage(n.features);

            g3.append("text")
              .attr("x", start_x + 20)
              .attr("y", start_y - 10)
              .text(adjMatrixSlice[i])
              .attr("class", "parameter")
              .attr("opacity", 1);

            const originToAggregated = g3.append("path")
              .attr("d", `M${start_x},${start_y} C ${control1_x},${control1_y}, ${control2_x},${control2_y}, ${end_x},${end_y}`)
              .style("stroke", pathColor(color))
              .style("opacity", 0.7)
              .style("stroke-width", 1)
              .style("fill", "none")
              .attr("class", "to-be-removed origin-to-aggregated")
              .style("opacity", 0);

            d3.selectAll(".origin-to-aggregated").style("opacity", 1)

            paths.push(originToAggregated);
          }
        });
  
        let color;
        start_x =  3.5 * offset + node.relatedNodes[0].features.length * 6 + node.features.length * 3 + 35
        start_y = height / 5 + 150 + 7.5
        end_x =  3.5 * offset + node.relatedNodes[0].features.length * 6 + node.features.length * 3 + 100 // the horizontal distance is offset(600) + moveoffset(300)
        end_y = height / 5 + 150 + 7.5
  
        color = calculateAverage(node.features); // to be determined
  
        const aggregatedToFinal = g3.append("path")
          .attr("d", `M${start_x},${start_y} ${end_x},${end_y}`)
          .style("stroke", pathColor(color))
          .style("stroke-width", 1)
          .style("fill", "none")
          .attr("class", "relu to-be-removed")
          .attr("opacity", 0);
  
        paths.push(aggregatedToFinal);
  
        start_x =  3.5 * offset + node.relatedNodes[0].features.length * 6 + node.features.length * 3 + 35
        start_y = height / 5 + 100 + 7.5
  
        let control1_x = start_x + (end_x - start_x) * 0.2;
        let control1_y = start_y;
        let control2_x = start_x + (end_x - start_x) * 0.4;
        let control2_y = end_y;
  
        color = calculateAverage(node.features); // to be determined
        const biasToFinal = g3.append("path")
        .attr("d", `M${start_x},${start_y} C ${control1_x} ${control1_y}, ${control2_x} ${control2_y} ${end_x - 30},${end_y}`)
          .style("stroke", pathColor(color))
          .style("opacity", 0.7)
          .style("stroke-width", 1)
          .style("fill", "none")
          .attr("class", "bias to-be-removed")
          .style("opacity", 0);
  
        paths.push(biasToFinal);
        node.intermediatePaths = paths;
      }
  
      // relu 
      g3.append("circle")
        .attr("cx", end_x - 30)
        .attr("cy", end_y)
        .attr("r", 10)
        .style("fill", "white")
        .style("stroke", "black")
        .style("stroke-width", 1)
        .attr("class", "relu to-be-removed")
        .attr("opacity", 0);
  
      g3.append("text")
      .attr("x", end_x - 30)
      .attr("y", end_y)
      .attr("dy", ".35em")
      .text("r")
      .style("font-size", "12px")
      .style("fill", "black")
      .attr("opacity", 0)
      .attr("class", "relu to-be-removed")
      .style("text-anchor", "middle");  
      
    }, 3500);

    const outputGroup = g3.append("g")
      .attr("transform", `translate(${3.5 * offset + node.relatedNodes[0].features.length * 6 + node.features.length * 3 + 95}, ${height / 5 + 150})`);
  
    outputGroup.selectAll("rect")
      .data(node.features)
      .enter()
      .append("rect")
      .attr("class", "relu output")
      .attr("x", (d: any, i: number) => i * 3 + 5)
      .attr("y", 0)
      .attr("width", 3)
      .attr("height", 15)
      .style("fill", (d: number) => myColor(d))
      .style("stroke-width", 1)
      .style("stroke", "grey")
      .attr("opacity", 0);
  
    intermediateFeatureGroups.push(outputGroup);
    node.intermediateFeatureGroups = intermediateFeatureGroups;


     

  


  
    
    document.addEventListener('click', () => {
      moveFeaturesBack(node, node.relatedNodes, originalCoordinates);
      d3.selectAll(".to-be-removed").remove();
    });
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
      return `translate(${moveOffset},10)`; // Default fallback
    });
  }
  
  function weightAnimation(svg: any, node: any, startCoordList: number[][], endCoordList: number[][], weights: any, offset: number, height: number, moveOffset: number) {
    let i = 0;
    let intervalID: any;
    let isPlaying = true;
    let isAnimating = true; 
  
    if (!svg.selectAll) {
      svg = d3.select(svg);
    }
  
    // Pause and replay button
    const btn = svg.append("g")
      .attr("class", "button-group");
    
    btn.append("circle")
      .attr("cx", endCoordList[0][0] - 100)
      .attr("cy", node.y - 100)
      .attr("r", 25)
      .style("fill", "white")
      .style("stroke", "black")
      .style("stroke-width", 1)
      .attr("opacity", 1)
      .attr("class", "vis-component");
  
    btn.append("text")
      .attr("x", endCoordList[0][0] - 100)
      .attr("y", node.y - 100)
      .attr("dy", ".50em")
      .text("pause")
      .style("font-size", "16px")
      .style("fill", "black")
      .attr("class", "vis-component button-discri")
      .attr("opacity", 1)
      .style("text-anchor", "middle");
  
    btn.on("click", function(event: any) {
      event.stopPropagation();
      isPlaying = !isPlaying;
      console.log(isPlaying);
      d3.select(".button-discri").text(isPlaying ? "pause" : "play");
      if (isPlaying) {
        startAnimation();
      } else {
        clearInterval(intervalID);
      }
    });
  
    const math = create(all, {});
    const Xt = math.transpose(weights);
  
    document.addEventListener('click', () => {
      isAnimating = false; 
      d3.selectAll(".bias").remove();
      d3.selectAll(".vis-component").remove();
      d3.selectAll(".relu").remove();
      d3.selectAll(".intermediate-path").remove();
      d3.selectAll(".parameter").remove();
      d3.selectAll(".to-be-removed").remove();
    });
  
    function startAnimation() {
      if (i >= 64) {
        i = 0;  // Reset the index to replay the animation
      }
      intervalID = setInterval(() => {
        d3.selectAll(`.calculatedFeatures${i}`).style("opacity", 1);
        d3.selectAll(`#tempath${i - 1}`).attr("opacity", 0);
        
        if (isAnimating) {
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
            isPlaying = false;
            d3.selectAll(`#tempath${i - 1}`).remove();
            d3.select(".button-discri").text("play");
            setTimeout(() => {
                          
            d3.selectAll(".bias").style("opacity", 1);
            d3.selectAll(".relu").attr("opacity", 1)
            d3.selectAll(".output").transition()
            .delay(2000)
            .duration(1000)
            .attr("opacity", 1)
            .attr("transform", `translate(${node.featureGroupLocation.xPos - 2.5 * offset + (moveOffset - node.features.length * 3 - node.relatedNodes[0].features.length * 6) - 100 + 12.5}, ${node.featureGroupLocation.yPos - height / 5 - 150 - node.features.length * 3}) rotate(90)`);
              
            }, 2000);
            
           

          }
        }
      }, 250);
    }
  
    setTimeout(() => {
      startAnimation();
    }, 1000);
  }
  
  function GraphViewDrawPaths(
    Xt: any,
    myColor: any,
    i: number,
    startCoordList: number[][],
    endCoordList: number[][],
    svg: any,
    isAnimating: boolean
  ) {
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
  
      let control_x = (start_x + end_x) * 0.5
      let control_y = start_y - 100;
 
  
      svg.append("path")
        .attr("d", `M${start_x},${start_y} Q ${control_x} ${control_y}, ${end_x},${end_y}`)
        .attr("stroke", myColor(Wi[63 - j]))
        .attr("stroke-width", 1)
        .attr("opacity", 1)
        .attr("fill", "none")
        .attr("class", "intermediate-path to-be-removed")
        .attr("id", `tempath${i}`);
    }
  
    if (isAnimating) {
      setTimeout(() => {
        i++;
      }, 250);
    }
  }
  
  export function aggregationCalculator(graphs: any[]) {
    let data = graphs[1];
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
      const source = edgePairs[i].source.id;
      const target = edgePairs[i].target.id;
  
      degreeMap[source]++;
      degreeMap[target]++;
    }
    for (let i = 0; i < degreeMap.length; i++) {
      degreeMap[i] = degreeMap[i] / 2 + 1;
    }
  
    let degreeMatrix: any;
    degreeMatrix = Array.from({ length: nodeCount }, () => new Array(nodeCount).fill(0));
    for (let i = 0; i < nodeCount; i++) {
      degreeMatrix[i][i] = 1 / Math.sqrt(degreeMap[i]);
    }
  
    let adjMatrix = Array.from({ length: nodeCount }, () => new Array(nodeCount).fill(0));
  
    for (let i = 0; i < nodeCount; i++) {
      for (let j = 0; j < adjList[i].length; j++) {
        const neighbor = adjList[i][j];
        adjMatrix[i][neighbor] = 1; 
      }
    }
  
    let normalizedAdjMatrix = matrixMultiplication(degreeMatrix, adjMatrix);
    normalizedAdjMatrix = matrixMultiplication(normalizedAdjMatrix, degreeMatrix);
    return normalizedAdjMatrix;
  }
  
  export function matrixMultiplication(matrix_a: any[], matrix_b: any[]) {
    const rowsA = matrix_a.length;
    const colsA = matrix_a[0].length;
    const rowsB = matrix_b.length;
    const colsB = matrix_b[0].length;
  
    if (colsA !== rowsB) {
      console.log(matrix_a.length, matrix_a[0].length);
      console.log(matrix_b.length, matrix_b[0].length);
      console.log("can't do");
      return [];
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
  
  function moveFeatures(node: any, relatedNodes: any, xPos: number, yPos: number) {
    let originalCoordinates: any[] = [];
    let coordinate: FeatureGroupLocation;
    let x;
    let y;
    relatedNodes.forEach((n: any, i: number) => {
      if (n.featureGroup) {
        n.featureGroup.transition() 
          .delay(2000)
          .duration(1000)
          .attr("transform", `translate(${xPos + 20}, ${yPos + i * 40 + 100}) rotate(-90)`);
      }
      if (n.featureGroupLocation) {
        x = n.featureGroupLocation.xPos; 
        y = n.featureGroupLocation.yPos; 
        coordinate = {xPos: x, yPos: y};
        originalCoordinates.push(coordinate);
        n.featureGroupLocation.xPos = xPos;
        n.featureGroupLocation.yPos = yPos + i * 40 + 100;
      }
    });
    return originalCoordinates;
  }
  
  function moveFeaturesBack(node: any, relatedNodes: any, originalCoordinates: FeatureGroupLocation[]) {
    relatedNodes.forEach((n: any, i: number) => {
      let xPos = originalCoordinates[i].xPos;
      let yPos = originalCoordinates[i].yPos;
      if (n.featureGroup) {
        n.featureGroup.transition()
          .duration(1000)
          .attr("transform", `translate(${xPos}, ${yPos + 5 - n.features.length * 3}) rotate(0)`);
      }
      if (n.featureGroupLocation) {
        n.featureGroupLocation.xPos = xPos;
        n.featureGroupLocation.yPos = yPos;
      }
    });
  }
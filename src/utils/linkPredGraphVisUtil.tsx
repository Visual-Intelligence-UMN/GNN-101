
import * as d3 from "d3";

import { loadLinkWeights, loadNodeWeights, loadWeights } from "./matHelperUtils";
import * as ort from "onnxruntime-web";
import { env } from "onnxruntime-web";
import { aggregationCalculator, fcLayerCalculationVisualizer, matrixMultiplication, showFeature, scaleFeatureGroup, nodeOutputVisualizer, pathColor, moveFeatures, moveFeaturesBack, addExitBtn, buildDetailedViewArea } from "@/utils/graphUtils";
import { features, off } from 'process';

import { IGraphData, IntmData, IntmDataLink, IntmDataNode } from "../types";

import { 
  hideAllLinks, 
  showAllLinks, 
  resetNodes, 
  reduceNodeOpacity, 
  calculationVisualizer, 
  highlightNodes,
  moveNextLayer,
} from "@/utils/graphUtils"
import { calculateAverage, FeatureGroupLocation, handleClickEvent, myColor, State, state } from "@/utils/utils"
import { stat } from "fs";
import { Yomogi } from "@next/font/google";
import { dataPreparationLinkPred, constructComputationalGraph } from "./linkPredictionUtils";
import { extractSubgraph } from "./graphDataUtils";
import { isValidElement } from "react";
import { isValidNode } from "./GraphvislinkPredUtil";
import { roundToTwo } from "@/components/WebUtils";
import { graphVisDrawActivationExplanation, hoverOverHandler } from "./graphAnimationHelper";
import { computeMatrixLocations, drawFunctionIcon, drawWeightMatrix } from "./matAnimateUtils";



export function linkPredFeatureVisualizer(
  svg: any, 
  allNodes: any[], 
  offset: number, 
  height: number, 
  graphs: any[], 
  moveOffset: number, 
  fcLayerMoveOffset: number, 
  rectWidth: number, 
  firstLayerRectHeight: number, 
  rectHeight: number, 
  outputLayerRectHeight: number,
  mode: number,
  subgraph: any,
  innerComputationMode: string,
  centerY: number,
) {
  state.isClicked = false;


  // 1. visualize feature
  // 2. handle interaction event
  // 3. do the calculation for animation
  let convNum = 3;
  let {weights, bias} = loadLinkWeights();

  d3.select(".switchBtn").style("pointer-events", "none");
  d3.select(".switchBtn").style("opacity", 0.3);

  setTimeout(() => {
      d3.select(".switchBtn").style("pointer-events", "auto");
      d3.select(".switchBtn").style("opacity", 1);


  }, 3000)



  const nodesByIndex = d3.group(allNodes, (d: any) => d.graphIndex); //somehow doesn't include the node in the last layer


  let normalizedAdjMatrix: any = []
  if (graphs.length != 0) {
    normalizedAdjMatrix = aggregationCalculator(graphs);
  }
  let movedNode: any = null; // to prevent the same node is clicked twice

  
  let allFeatureMap: number[][][] = [];
  nodesByIndex.forEach((nodes, index) => {
   let featureMap: number[][] = []
     if (index < convNum) {
      nodes.forEach((n) => { 
        featureMap.push(n.features)
      })
      allFeatureMap.push(featureMap)
     }
      
  })


  nodesByIndex.forEach((nodes, graphIndex) => { // iterate through each graphs
    
    
    let aggregatedDataMap: any[] = [];
    let calculatedDataMap: any[] = [];
    let currentWeights: any[] = [];
    let currentBias: any[] = []

    let featureMap: number[][] = [];


    // do some calculation that sill be used in the animation
    if (graphs.length != 0 && graphIndex > 0 && graphIndex < (convNum)) {
    currentWeights = weights[graphIndex - 1];
    currentBias = bias[graphIndex - 1]
      

     const nodesByIndex = d3.group(allNodes, (d: any) => d.graphIndex);
     nodesByIndex.forEach((nodes, index) => { 
       if (index === graphIndex - 1) {
         nodes.forEach((n) => { 
           featureMap.push(n.features)
         })
         }
       })
       aggregatedDataMap = matrixMultiplication(normalizedAdjMatrix, featureMap)
       calculatedDataMap = matrixMultiplication(aggregatedDataMap, currentWeights)
 
      }


    

    let xOffset = (graphIndex - 3.5) * offset;




    const g2 = svg.append("g")
      .attr("layerNum", graphIndex)
      .attr("class", "layerVis") 
      .attr("transform", `translate(${xOffset},10)`);



    nodes.forEach((node: any, i: number) => { // iterate through each node in the current graph
      let currRectHeight = rectHeight;
      if (graphIndex === 0) {
        currRectHeight = firstLayerRectHeight;
      }


      const features = node.features;
      let xPos = node.x;
      let yPos = node.y + 25;


      // collision detection. if the locaion is occupied, add 20 to the x coordination



      if (graphIndex < convNum) {
        // featureGroup in the convolutional layers and the last three layers are different.

        // add svgElement to each node simplify the interaction process (maybe)

        let className = "node_group";
        let opacity = 1;
        if (!isValidNode(subgraph, node)) {
          className = "invalid"
          opacity = 0.2;
        }
        const nodeGroup = g2.append("g")
          .attr("class", className)
          .attr("transform", `translate(${node.x},${node.y})`)
          .style("opacity", opacity)




        node.svgElement = nodeGroup.append("circle")
        .attr("class", className)
    

          .attr("cx", 0)
          .attr("cy", 0)
          .attr("r", 17)
          .attr("fill", "white")
          .attr("stroke", "#69b3a2")
          .attr("stroke-width", 1)
          .attr("stroke-opacity", 1)

          .node(); // make the svgElement a DOM element (the original on method somehow doesn't work)


        node.text = nodeGroup.append("text")
          .attr("x", 0)
          .attr("y", 0)
          .join("text")
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "central")
          .text(node.original_id)
          .attr("font-size", `10px`)

        

        const featureGroup = g2.append("g")
          .attr("transform", `translate(${xPos - 7.5}, ${yPos})`);


        featureGroup.selectAll("rect")
          .data(features)
          .enter()
          .append("rect")
          .attr("x", 0)
          .attr("y", (d: any, i: number) => i * currRectHeight)
          .attr("width", rectWidth)
          .attr("height", currRectHeight)
          .attr("class", `-features node-features-${node.graphIndex}-${node.id}`)
          .attr("id", (d: any, i: number) => "conv" + graphIndex + "-layer-rect-" + i) 
          .style("fill", (d: number) => myColor(d))
          .style("stroke-width", 0.1)
          .style("stroke", "grey")
          .style("opacity", 1);
        

        const frame = featureGroup.append("rect")
        .attr("class", `node-features-${node.graphIndex}-${node.id}`)
        .attr("x", 0)  
        .attr("y", 0)
        .attr("width", rectWidth)
        .attr("height", currRectHeight * (node.features.length) )
        .attr("class", `node-features-${node.graphIndex}-${node.id}`)
        .style("fill", "none")
        .style("stroke", "black")
        .style("stroke-width", 1)
        .attr("data-index", (d:any, i:number) => i);

        const featureId = featureGroup.append("text")
          .attr("x", rectWidth / 2)
          .attr("y", node.features.length * currRectHeight + 12)
          .attr("class", `node-features-${node.graphIndex}-${node.id}`)
          .attr("dy", ".35em")
          .text(node.original_id)
          .style("font-size", "10px")
          .style("fill", "black")
          .style("text-anchor", "middle");
        




        featureGroup.style('visibility', 'hidden');  

        let prevRectHeight;
 

        if (graphIndex === 1) {
          prevRectHeight = firstLayerRectHeight;
        } else {
          prevRectHeight = rectHeight;
        }
 

        let currMoveOffset = moveOffset;


      //the bottom of the featureGroup 
        let featureGroupLocation: FeatureGroupLocation = {xPos, yPos}; 

        node.featureGroup = featureGroup;
        node.featureId = featureId;
        node.featureGroupLocation = featureGroupLocation; // this will be used in calculationvisualizer
        scaleFeatureGroup(node, 0.5);

        // add interaction 
        
        nodeGroup.on("mouseenter", function(this: any) {
          if (!state.isClicked && isValidNode(subgraph, node)) {
            highlightNodes(node);
            if (node.relatedNodes) {
              reduceNodeOpacity(allNodes, node.relatedNodes, node);
              } 
          }
        });

        nodeGroup.on("mouseleave", function() {
          if (!state.isClicked && isValidNode(subgraph, node)) {
            resetNodes(allNodes, convNum);
          }
        });


        //click logic
        if (node.graphIndex != 0) {
          nodeGroup.on("click", function(event:any) {
            event.stopPropagation();
            event.preventDefault();
            if (state.isClicked || !isValidNode(subgraph, node)) {
              return;
            }
            state.isClicked = true;
            d3.selectAll(".hintLabel").attr("opacity", 0);

                    //  // prevent clicking on other nodes and move the layers to the right again
                    //  if (movedNode === node) {
                    //   return; 
                    // }


            //color schemes interaction logic
            hideAllLinks(allNodes);

            for (let i = 0; i < nodes.length; i++) {
              nodes[i].matmulResults = calculatedDataMap[i]; 
              nodes[i].biases        = currentBias;
            }
          
            
            calculationVisualizer(node, allNodes, weights, currentBias, normalizedAdjMatrix, aggregatedDataMap, calculatedDataMap, allFeatureMap, svg, offset, height, convNum, currMoveOffset, prevRectHeight, rectHeight, rectWidth, state, mode, innerComputationMode);
          


            
            let relatedNodes: any = [];
            if (node.relatedNodes) {
              relatedNodes = node.relatedNodes;
            } 
            reduceNodeOpacity(allNodes, relatedNodes, node);
            


   
          
            // if (movedNode) {
            //   moveNextLayer(svg, movedNode, currMoveOffset, -1)
            //   state.isClicked = false; 
            //   movedNode = null;
            // }

            
            moveNextLayer(svg, node, currMoveOffset, 1);
            movedNode = node;
        
          });

      }

  
      } else {
          
        
        let currMoveOffset = fcLayerMoveOffset;



        let currRectHeight = rectHeight;
        let rectName = "pooling"
        if (node.graphIndex >= 3) {
          currRectHeight = outputLayerRectHeight;
          rectName = "output";
        }
        let prevRectHeight = 3;
        let groupCentralHeight = 175;
        let yOffset = groupCentralHeight;

        const featureGroup = g2.append("g")
          .attr("transform", `translate(${node.x - 7.5}, ${centerY})`);

        featureGroup.selectAll("rect")
          .data(features)
          .enter()
          .append("rect")
          .attr("x", -10) //adjust x and y coordination so it locates in the middle of the graph
          .attr("y", (d: any, i: number) => i * currRectHeight)
          .attr("width", rectWidth)
          .attr("id", (d: any, i: number) => rectName +"-layer-rect-" + i) 
          .attr("height", currRectHeight)
          .attr("class", `node-features`)
          .style("fill", (d: number) => myColor(d))
          .style("stroke-width", 0.1)
          .style("stroke", "grey")
          .style("visibility", "visible");


          const frame = featureGroup.append("rect")
          .attr("x", -10)  
          .attr("y", 0)
          .attr("width", 15)
          .attr("class", "node-features")
          .attr("height", currRectHeight * (node.features.length))
          .style("fill", "none")
          .style("stroke", "black")
          .style("stroke-width", 1)
          .style("visibility", "visible")


        const featureGroupCopy = g2.append("g")
          .attr("transform", `translate(${node.x - 7.5}, ${centerY})`);

        featureGroupCopy.selectAll("rect")
          .data(features)
          .enter()
          .append("rect")
          .attr("x", -10) //adjust x and y coordination so it locates in the middle of the graph
          .attr("y", (d: any, i: number) => i * currRectHeight)
          .attr("width", rectWidth)
          .attr("height", currRectHeight)
          .attr("class", "node-features-Copy")
          .style("fill", (d: number) => myColor(d))
          .style("stroke-width", 0.1)
          .style("stroke", "grey")
          .style("visibility", "hidden")
          .lower();


          const frameCopy = featureGroupCopy.append("rect")
          .attr("x", -10)  
          .attr("y", 0)
          .attr("width", 15)
          .attr("class", "node-features-Copy")
          .attr("height", currRectHeight * (node.features.length))
          .style("fill", "none")
          .style("stroke", "black")
          .style("stroke-width", 1)
          .style("visibility", "hidden")
          .lower()
          

          
        
        
        node.featureGroup = featureGroup;
        xPos = node.x;
        yPos = centerY;
        let featureGroupLocation: FeatureGroupLocation = {xPos, yPos}; 
        node.featureGroupLocation = featureGroupLocation; // this will be used in calculationvisualizer

        
        node.featureGroup.on("mouseover", function() {
          if (!state.isClicked) {

            if (node.links) {
              node.links.forEach((link: any) => {
                link.style("opacity", 1)
              });
            }
          }
        });

        node.featureGroup.on("mouseout", function() {
          if (!state.isClicked) {
            if (node.links) {
              node.links.forEach((link: any) => {
                link.style("opacity", 0);
              });
            }
          }
        });
        node.featureGroup.on("click", function(event: any) {
          event.stopPropagation();
          event.preventDefault();
          if (state.isClicked) {
            return;
          }
          state.isClicked = true;
          d3.selectAll(".hintLabel").attr("opacity", 0);
       


          highlightNodes(node);
          hideAllLinks(allNodes);
          // calculationVisualizer(node, currentWeights, bias, aggregatedDataMap, calculatedDataMap, svg, offset, isClicked);
          let relatedNodes: any = [];
            if (node.relatedNodes) {
              relatedNodes = node.relatedNodes;
            } // to make sure relatedNodes is not null
            showFeature(node);

            if (node.graphIndex === 3) {
              linkPredOutputVisualizer(node, allNodes, bias[3], g2, offset, state.isClicked, currMoveOffset, height, prevRectHeight, currRectHeight, rectWidth, convNum, svg, mode)
            }
            
            reduceNodeOpacity(allNodes, relatedNodes, node);
            event.stopPropagation(); // Prevent the click event from bubbling up


            // if (movedNode === node) {
            //   return; // Do nothing if the node is already moved
            // }
          

            // if (movedNode) {
            //   // Move back the previously moved node and its layer
            //   moveNextLayer(svg, movedNode, currMoveOffset, -1)
            //   state.isClicked = false; 
            //   movedNode = null;
            // }

            
            moveNextLayer(svg, node, currMoveOffset, 1);
            movedNode = node; // Update the moved node
        });
      }
    
    });
  });

  // Add a global click event to the document to reset the moved node and isClicked flag




}







export function linkPredOutputVisualizer(
  node: any,
  allNodes: any[],
  bias: any[],
  svg: any,
  offset: number,
  isClicked: boolean,
  moveOffset: number,
  height: number,
  prevRectHeight: number,
  rectHeight: number,
  rectWidth: number,
  convNum: number,
  originalSvg: any,
  mode: number

) {
  if (!svg.selectAll) {
    svg = d3.selectAll(svg)
  }



  let intervalID = 0;
  state.isClicked = true;

  d3.selectAll(".to-be-removed").remove();
  d3.selectAll(".node-features-Copy").style("visibility", "visible").lower();


  let originalCoordinates: any[] = [];
  let coordinate
  let index = 0;

    node.relatedNodes.forEach((n: any, i: number) => {
        
        if (n.featureGroup) {
            n.featureGroup
                .transition()
                .delay(1000)
                .duration(1500)
                .attr(
                    "transform", (d: any) => {
                      if (index === 0) {
                      return `translate(${ (node.graphIndex + 1) * offset + 250 + 27.5}, ${height / 5 + 15 + i * 45 + 100}) rotate(-90)`
                    }
                    else {
                      return `translate(${ (node.graphIndex + 1) * offset + 500 + 27.5}, ${height / 5 + 15 + i * 45 - 75}) rotate(0)`
                    }
                  });
        }
        index ++;
        if (n.featureGroupLocation) {

            coordinate = { xPos: n.featureGroupLocation.xPos, yPos: n.featureGroupLocation.yPos };
            originalCoordinates.push(coordinate);
        }
    });


    
    svg.append("text")
    .attr("x", (node.graphIndex - 1) * offset - 100)
    .attr("class", "to-be-removed dot-product")
    .attr("y", height / 3 - 15)
    .attr("xml:space", "preserve")
    .text("dot (                                                                 )  = ")
    .attr("font-size", "20")
    .attr("fill", "black")
    .style("opacity", 0)

    let sum = 0
    for (let i = 0; i < node.relatedNodes[0].features.length; i++) {
      sum += node.relatedNodes[0].features[i] * node.relatedNodes[1].features[i]
    }


    svg.append("rect")
    .attr("x",  (node.graphIndex - 1) * offset + 330)
    .attr("class", "to-be-removed dot-product")
    .attr("y", height / 3 - 30)
    .attr("width", rectHeight)
    .attr("height", rectHeight)
    .style("stroke", "black")
    .attr("fill", myColor(sum))
    .style("opacity", 0)
    .lower();

    svg.append("text")
    .attr("x",  (node.graphIndex - 1) * offset + 330)
    .attr("class", "to-be-removed dot-product")
    .attr("y", height / 3 - 15)
    .text(roundToTwo(sum))
    .attr("fill",  sum > 0.7 ? "white" : "black")
    .attr("font-size", "10")
    .style("opacity", 0)

    svg.append("text")
    .attr("x",  (node.graphIndex - 1) * offset + 500)
    .attr("class", "to-be-removed dot-product")
    .attr("y", height / 3 - 15)
    .text(roundToTwo(node.features[0]))
    .attr("fill",  Math.abs(node.features[0]) > 0.7 ? "white" : "black")
    .attr("font-size", "10")
    .style("opacity", 0)




    svg.append("rect")
    .attr("x",  (node.graphIndex - 1) * offset + 500)
    .attr("class", "to-be-removed dot-product")
    .attr("y", height / 3 - 30)
    .attr("width", rectHeight)
    .attr("height", rectHeight)
    .style("stroke", "black")
    .attr("fill", myColor(node.features[0]))
    .style("opacity", 0)
    .lower();

    const path = svg.append("path")
    .attr("d", `M${ (node.graphIndex - 1) * offset + 350},${height / 3 - 15} L ${ (node.graphIndex - 1) * offset + 500},${height / 3 - 15}`)
    .attr("class", "to-be-removed dot-product")
    .style("stroke", "black")
    .style("opacity", 0)






    




    


    

    setTimeout(() => {
      d3.selectAll(".dot-product").style("opacity", 1)
      buildDetailedViewArea((node.graphIndex - 1) * offset - 350, 0, 1000, 1000, svg)
      addExitBtn((node.graphIndex - 1) * offset, height / 3 - 100, svg);
      drawFunctionIcon([(node.graphIndex - 1) * offset + 455, height / 3 - 15], "./assets/SVGs/sigmoid.svg", "Sigmoid", "", "f(x) = 1/(1+e^(-x))", "Range: [0, 1]", svg);
      d3.selectAll(".relu-icon").on("mouseover", function(event: any) {
        const [x, y] = d3.pointer(event);

        graphVisDrawActivationExplanation(
            x, y, "Sigmoid",
            "./assets/SVGs/sigmoid_formula.svg",
            "Range: [0, 1]", svg
        );
    }).on("mouseout", function() {
        d3.selectAll(".math-displayer").remove();
    })
    }, 2000)


  const g5 = svg
      .append("g")
      .attr("transform", `translate(${node.x - 90}, ${node.y - 180})`);


  let DisplayerWidth = 300; // Width of the graph-displayer
  let DisplayHeight = 75;

  const graphDisplayer = g5
      .append("rect")
      .attr("x", (node.graphIndex - 2) * 1)
      .attr("y", 0)
      .attr("width", DisplayerWidth)
      .attr("height", DisplayHeight)
      .attr("rx", 10)
      .attr("ry", 10)
      .style("fill", "transparent")
      .style("stroke", "black")
      .style("stroke-width", 2)
      .attr("class", "graph-displayer")
      .attr("opacity", 0)
      .lower();













  for (let i = 0; i < node.features.length; i++) {
      d3.select(`#output-layer-rect-${i}`)
          .on("mouseover", function () {
              if (!state.isClicked) {
                  return;
              }
              



          })
          .on("mouseout", function () {
              if (!state.isClicked) {
                  return;
              }
              d3.selectAll(".math-displayer").remove();
              d3.selectAll(".graph-displayer").attr("opacity", 0);
              d3.selectAll(".softmax").attr("opacity", 0.07);
              d3.selectAll(`.softmax${i}`).attr("opacity", 0.07);
          });
  }
  setTimeout(() => {
    d3.selectAll(".exit-button").on("click", function(event: any) {
      d3.selectAll(".math-displayer").remove();
      d3.selectAll(".graph-displayer").remove();
   
          d3.selectAll(".node-features-Copy").style("visibility", "hidden")
     
          d3.selectAll(".columnUnit").remove();
          d3.selectAll(".procVis").remove();
          d3.selectAll(".to-be-removed").remove();
  
          d3.selectAll(".graph-displayer").remove();
  
  
          moveFeaturesBack(node.relatedNodes, originalCoordinates);
          handleClickEvent(originalSvg, node, event, moveOffset, allNodes, convNum, mode, state)
  
  
  })
  d3.selectAll(".to-be-removed").on("click", (event) => {
    event.stopPropagation(); 
});
  d3.select("#my_dataviz").on("click", function (event: any) {
    const clickedElement = event.target; 
    let isInToBeRemoved = false;
    d3.selectAll(".to-be-removed").each(function () {
      const element = this as Element;
      if (element.contains(clickedElement)) {
          isInToBeRemoved = true;
      }
  });

    if (!d3.select(event.target).classed("click-blocker") && !isInToBeRemoved && state.isClicked) {
      d3.selectAll(".math-displayer").remove();
      d3.selectAll(".graph-displayer").remove();
   
          d3.selectAll(".node-features-Copy").style("visibility", "hidden")
     
          d3.selectAll(".columnUnit").remove();
          d3.selectAll(".procVis").remove();
          d3.selectAll(".to-be-removed").remove();
  
          d3.selectAll(".graph-displayer").remove();
  
  
          moveFeaturesBack(node.relatedNodes, originalCoordinates);
          handleClickEvent(originalSvg, node, event, moveOffset, allNodes, convNum, mode, state)
        
        }
    });
    
  }, 4000)

  

}



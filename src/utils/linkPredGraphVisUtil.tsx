
import * as d3 from "d3";

import { loadLinkWeights, loadNodeWeights, loadWeights } from "./matHelperUtils";
import * as ort from "onnxruntime-web";
import { env } from "onnxruntime-web";
import { aggregationCalculator, fcLayerCalculationVisualizer, matrixMultiplication, showFeature, outputVisualizer, scaleFeatureGroup, nodeOutputVisualizer } from "@/utils/graphUtils";
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
import { FeatureGroupLocation, myColor, state } from "@/utils/utils"
import { stat } from "fs";
import { Yomogi } from "@next/font/google";
import { dataPreparationLinkPred, constructComputationalGraph } from "./linkPredictionUtils";
import { extractSubgraph } from "./graphDataUtils";


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
  colorSchemes:any,
  mode: number,
) {
  state.isClicked = false;

 





  
  // 1. visualize feature
  // 2. handle interaction event
  // 3. do the calculation for animation
  let convNum = 3;
  let {weights, bias} = loadLinkWeights();



  const nodesByIndex = d3.group(allNodes, (d: any) => d.graphIndex); //somehow doesn't include the node in the last layer


  let normalizedAdjMatrix: any = []
  if (graphs.length != 0) {
    normalizedAdjMatrix = aggregationCalculator(graphs);
  }
  let movedNode: any = null; // to prevent the same node is clicked twice





  nodesByIndex.forEach((nodes, graphIndex) => { // iterate through each graphs
    
    
    let aggregatedDataMap: any[] = [];
    let calculatedDataMap: any[] = [];
    let currentWeights: any[] = [];
    let currentBias: any[] = []



    // do some calculation that sill be used in the animation
    if (graphs.length != 0 && graphIndex > 0 && graphIndex < (convNum)) {
    currentWeights = weights[graphIndex - 1];
    currentBias = bias[graphIndex - 1]
      

     let featureMap: number[][] = [];
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

        const nodeGroup = g2.append("g")
          .attr("class", "node-group")
          .attr("transform", `translate(${node.x},${node.y})`);
        node.svgElement = nodeGroup.append("circle")
          .attr("cx", 0)
          .attr("cy", 0)
          .attr("r", 17)
          .attr("fill", "white")
          .attr("stroke", "#69b3a2")
          .attr("stroke-width", 1)
          .attr("stroke-opacity", 1)
          .attr("opacity", 1)
          .node(); // make the svgElement a DOM element (the original on method somehow doesn't work)
        if (mode === 1 && graphIndex === 4) {
          let name = "unknown";
          if (node.features[0] > 0.5) {
            name = "A"
          }
          if (node.features[1] > 0.5) {
            name = "B"
          }
          if (node.features[2] > 0.5) {
            name = "C"
          }
          if (node.features[3] > 0.5) {
            name = "D"
          }


          node.text = nodeGroup.append("text")
          .attr("x", 0)
          .attr("y", 0)
          .join("text")
          .text(name)
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "central")
          .attr("font-size", `17px`)
          .attr("opacity", 1);

        }
        else {
        node.text = nodeGroup.append("text")
          .attr("x", 0)
          .attr("y", 0)
          .join("text")
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "central")
          .text(node.id)
          .attr("font-size", `17px`)
          .attr("opacity", 1);
        }

        const featureGroup = g2.append("g")
          .attr("transform", `translate(${xPos - 7.5}, ${yPos})`);

        if (mode === 1 && graphIndex === 4) {

          featureGroup.selectAll("rect")
          .data(features)
          .enter()
          .append("rect")
          .attr("x", 0)
          .attr("y", (d: any, i: number) => i * currRectHeight)
          .attr("width", rectWidth)
          .attr("height", currRectHeight)
          .attr("class", `node-features node-features-${node.graphIndex}-${node.id}`)
          .attr("id", (d: any, i: number) => "output-layer-rect-" + i) 
          .style("fill", (d: number) => myColor(d))
          .style("stroke-width", 0.1)
          .style("stroke", "grey")
          .style("opacity", 1);




        } else {
        featureGroup.selectAll("rect")
          .data(features)
          .enter()
          .append("rect")
          .attr("x", 0)
          .attr("y", (d: any, i: number) => i * currRectHeight)
          .attr("width", rectWidth)
          .attr("height", currRectHeight)
          .attr("class", `node-features node-features-${node.graphIndex}-${node.id}`)
          .attr("id", (d: any, i: number) => "conv" + graphIndex + "-layer-rect-" + i) 
          .style("fill", (d: number) => myColor(d))
          .style("stroke-width", 0.1)
          .style("stroke", "grey")
          .style("opacity", 1);
        }

        const frame = featureGroup.append("rect")
        .attr("class", `node-features-${node.graphIndex}-${node.id}`)
        .attr("x", 0)  
        .attr("y", 0)
        .attr("width", rectWidth)
        .attr("height", currRectHeight * (node.features.length) )
        .attr("class", `node-features-${node.graphIndex}-${node.id}`)
        .style("fill", "none")
        .style("stroke", "black")
        .style("stroke-width", 1);

        featureGroup.append("text")
          .attr("x", rectWidth / 2)
          .attr("y", node.features.length * currRectHeight + 12)
          .attr("class", `node-features-${node.graphIndex}-${node.id}`)
          .attr("dy", ".35em")
          .text(node.id)
          .style("font-size", "12px")
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
        node.featureGroupLocation = featureGroupLocation; // this will be used in calculationvisualizer
        scaleFeatureGroup(node, 0.5);

        // add interaction 
        nodeGroup.on("mouseenter", function(this: any) {
          if (!state.isClicked) {
            highlightNodes(node);
            if (node.relatedNodes) {
              reduceNodeOpacity(allNodes, node.relatedNodes, node);
              } 
          }
        });

        nodeGroup.on("mouseleave", function() {
          if (!state.isClicked) {
            resetNodes(allNodes, convNum);
          }
        });


        //click logic
        if (node.graphIndex != 0) {
          nodeGroup.on("click", function(event:any) {
            event.stopPropagation();
            event.preventDefault();
            if (state.isClicked) {
              return;
            }
            state.isClicked = true;
            d3.selectAll(".hintLabel").attr("opacity", 0);

                    //  // prevent clicking on other nodes and move the layers to the right again
                    //  if (movedNode === node) {
                    //   return; 
                    // }


            //color schemes interaction logic

            for(let i=0; i<colorSchemes.length; i++)colorSchemes[i].style.opacity = "0.5";


            // colorSchemes[node.graphIndex].style.opacity = "1";
            // colorSchemes[node.graphIndex - 1].style.opacity = "1";

            hideAllLinks(allNodes);


           if (mode === 1 && graphIndex === 3) {
            nodeOutputVisualizer(node, allNodes, weights, bias[3], g2, offset, convNum, currMoveOffset, height, prevRectHeight, currRectHeight, rectWidth, colorSchemes, svg, mode)
           } else {
            calculationVisualizer(node, allNodes, weights, currentBias, normalizedAdjMatrix, aggregatedDataMap, calculatedDataMap, svg, offset, height, colorSchemes, convNum, currMoveOffset, prevRectHeight, rectHeight, rectWidth, state, mode);
           };


            
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
        let groupCentralHeight = currRectHeight * features.length / 2;
        let yOffset = groupCentralHeight - (height / 5);

        const featureGroup = g2.append("g")
          .attr("transform", `translate(${node.x - 7.5}, ${node.y - yOffset})`);

        featureGroup.selectAll("rect")
          .data(features)
          .enter()
          .append("rect")
          .attr("x", -10) //adjust x and y coordination so it locates in the middle of the graph
          .attr("y", (d: any, i: number) => i * currRectHeight - 190)
          .attr("width", rectWidth)
          .attr("id", (d: any, i: number) => rectName +"-layer-rect-" + i) 
          .attr("height", currRectHeight)
          .attr("class", "node-features")
          .style("fill", (d: number) => myColor(d))
          .style("stroke-width", 0.1)
          .style("stroke", "grey")
          .style("visibility", "visible");


          const frame = featureGroup.append("rect")
          .attr("x", -10)  
          .attr("y", -190)
          .attr("width", 15)
          .attr("class", "node-features")
          .attr("height", currRectHeight * (node.features.length))
          .style("fill", "none")
          .style("stroke", "black")
          .style("stroke-width", 1)
          .style("visibility", "visible")


        const featureGroupCopy = g2.append("g")
          .attr("transform", `translate(${node.x - 7.5}, ${node.y - yOffset})`);

        featureGroupCopy.selectAll("rect")
          .data(features)
          .enter()
          .append("rect")
          .attr("x", -10) //adjust x and y coordination so it locates in the middle of the graph
          .attr("y", (d: any, i: number) => i * currRectHeight - 190)
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
          .attr("y", -190)
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
        yPos = node.y + rectHeight * node.features.length + yOffset; 
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
              outputVisualizer(node, allNodes, weights, bias[3], g2, offset, state.isClicked, currMoveOffset, height, prevRectHeight, currRectHeight, rectWidth, colorSchemes, convNum, svg, mode)
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
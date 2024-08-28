import {create, all, random} from "mathjs";

// negative_slope: float = 0.2,
// reference: https://pytorch-geometric.readthedocs.io/en/latest/_modules/torch_geometric/nn/conv/gat_conv.html 
export function leakyRelu(x: number): number {
    return x < 0 ? 0.02 * x : x;
}

export function meanAggregation(x: number[][]): number[] {
    // 转置矩阵，将行变为列
    const transpose = (matrix: number[][]) => 
        matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));
    
    const transposedX = transpose(x);
    console.log("transposed x", transposedX);
    
    // 对每一列（即转置后的每一行）计算均值
    return transposedX.map((col) => col.reduce((a, b) => a + b, 0) / col.length);
}




export function computeAttnStep(
    learnableVectorsSrc: number[],
    learnableVectorsDst: number[],
    weightMatrix: number[][],
    ithFeature: number[], //target node feature
    jthFeature: number[], //computing node feature
){
    console.log("ithFeature", ithFeature)
    console.log("jthFeature", jthFeature)
    console.log("learnableVectorSrc", learnableVectorsDst)
    console.log("learnableVectorDSt", learnableVectorsDst)
    


    const math = create(all);
    const val = math.multiply(math.multiply(math.transpose(learnableVectorsSrc), weightMatrix), math.transpose(ithFeature));
    console.log("attn val", val);
    const val1 = math.multiply(math.multiply(math.transpose(learnableVectorsDst), weightMatrix), math.transpose(jthFeature));
    console.log("attn val1", val1);
    if (typeof val !== 'number') {
        throw new Error(`Expected val to be a number, but got ${typeof val}`);
    }
    if (typeof val1 !== 'number') {
        throw new Error(`Expected val1 to be a number, but got ${typeof val1}`);
    }
    return leakyRelu(val +val1);
}

export function computeAttentionCoefficient(
    layerIndex: number, //if 1 then its first gatconv layer, if 2 then second gatconv layer
    feature: number[],//ith feature
    targetFeature: number[],//jth feature
    neighborFeatures: number[][] //neughbor's features, exclude itself
){
    console.log("layerindex", layerIndex)
    console.log("feature", feature)
    console.log("targetfeat", targetFeature)
    console.log("nei", neighborFeatures)
    //fetch the learnable vectors
    const learnableData = require("../../public/learnableVectorsGAT.json");
    const learnableVectors = [
        [learnableData["conv1_att_dst"], learnableData["conv1_att_src"]],
        [learnableData["conv2_att_dst"], learnableData["conv2_att_src"]]
    ];
    const usingVectors = learnableVectors[layerIndex - 1];
    //fetch the weight matrix
    const weightMatrix = require("../../public/gat_link_weights.json");
    const weightMatrices = [
        weightMatrix["conv1.lin_l.weight"],
        weightMatrix["conv2.lin_l.weight"]
    ]
    const usingWeightMatrix = weightMatrices[layerIndex - 1];
    console.log("attn data", usingVectors, usingWeightMatrix);
    //compute numerator
    let numerator = Math.exp(computeAttnStep(usingVectors[1], usingVectors[0], usingWeightMatrix, feature, targetFeature));
    console.log("attn numerator", numerator);
    //compute denominator
    neighborFeatures.push(feature);
    let denominator = 0;
    for(let i=0; i<neighborFeatures.length; i++){
        denominator += Math.exp(computeAttnStep(usingVectors[1], usingVectors[0], usingWeightMatrix, feature, neighborFeatures[i])); 
        console.log("attn denominator",i,  denominator);
    }
    //return the attention coefficient
    return numerator/denominator;
}

export function testCompute(){
    const featue = Array.from({ length: 64 }, () => random());
    const rows = 4;
    const cols = 64;
    const nFeature = Array.from({ length: rows }, () => 
        Array.from({ length: cols }, () => random())
    );
    console.log("attn", computeAttentionCoefficient(2, featue, featue, nFeature));
}



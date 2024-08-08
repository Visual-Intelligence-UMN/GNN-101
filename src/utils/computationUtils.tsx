import {create, all, random} from "mathjs";

// negative_slope: float = 0.2,
// reference: https://pytorch-geometric.readthedocs.io/en/latest/_modules/torch_geometric/nn/conv/gat_conv.html 
export function leakyRelu(x: number): number {
    return x < 0 ? 0.02 * x : x;
}

export function meanAggregation(x: number[][]): number[] {
    return x.map((d) => d.reduce((a, b) => a + b, 0) / d.length);
}

export function concatAggregation(x: number[][]): number[] {
    return x.reduce((a, b) => a.concat(b), []);
}

export function dotProduct(arr1: number[], arr2: number[]): number {
    if (arr1.length !== arr2.length) {
        throw new Error("Arrays must have the same length");
    }
    let result = 0;
    for (let i = 0; i < arr1.length; i++) {
        result += arr1[i] * arr2[i];
    }
    return result;
}

export function computeAttnStep(
    learnableVectorsSrc: number[],
    learnableVectorsDst: number[],
    weightMatrix: number[][],
    ithFeature: number[], //target node feature
    jthFeature: number[], //computing node feature
){
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
    return Math.exp(leakyRelu(val +val1));
}

export function computeAttentionCoefficient(
    layerIndex: number, //if 1 then its first gatconv layer, if 2 then second gatconv layer
    feature: number[],
    targetFeature: number[],
    neighborFeatures: number[][]
){
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
    let numerator = computeAttnStep(usingVectors[1], usingVectors[0], usingWeightMatrix, feature, targetFeature);
    console.log("attn numerator", numerator);
    //compute denominator
    neighborFeatures.push(feature);
    let denominator = 0;
    for(let i=0; i<neighborFeatures.length; i++){
        denominator += computeAttnStep(usingVectors[1], usingVectors[0], usingWeightMatrix, feature, neighborFeatures[i]); 
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



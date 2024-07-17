export interface IGraphData {
	x: number[][];
	edge_index: number[][];
	y?: number[];
	batch: number[];
}

export interface IntmData {
	conv1: Float32Array;
	conv2: Float32Array;
	conv3: Float32Array;
	pooling: Float32Array;
	dropout: Float32Array;
	final: Float32Array;
}

export interface IntmDataNode{
	conv1: Float32Array;
	conv2: Float32Array;
	conv3: Float32Array;
	final: Float32Array;
	result: number[][];
}

export interface IntmDataLink{
	conv1: Float32Array;
	conv2: Float32Array;
	decode_mul: Float32Array;
	decode_sum: Float32Array;
	prob_adj: number[][];
	decode_all_final: number[][];
}



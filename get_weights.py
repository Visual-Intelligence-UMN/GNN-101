import onnx
import numpy as np
import json

model = onnx.load('gnn_model.onnx')

weights = {}

for tensor in model.graph.initializer:
    np_array = onnx.numpy_helper.to_array(tensor)
    weights[tensor.name] = np_array.tolist()

with open('weights.json', 'w') as f:
    json.dump(weights, f)

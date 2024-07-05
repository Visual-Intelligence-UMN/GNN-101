import json
import numpy as np

def extract_keys(data, keys_set=None):
    if keys_set is None:
        keys_set = set()
    
    if isinstance(data, dict):
        for key, value in data.items():
            keys_set.add(key)
            extract_keys(value, keys_set)
    elif isinstance(data, list):
        for item in data:
            extract_keys(item, keys_set)
    
    return keys_set

with open("../../public/weights.json", "r") as file:
    data = json.load(file)

print(data)

keys = extract_keys(data)

# print all keys in json
print("All keys:", keys)

for k in keys:
    d = np.array(data[k])
    print(k,d.shape)

# data kys and shapes
# lin.bias (2,)
# onnx::MatMul_314 (64, 64)
# onnx::MatMul_317 (64, 64)
# conv1.bias (64,)
# onnx::MatMul_311 (7, 64)
# conv3.bias (64,)
# lin.weight (2, 64)
# conv2.bias (64,)
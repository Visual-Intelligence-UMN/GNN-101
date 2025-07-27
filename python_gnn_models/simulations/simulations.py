#%%
import random
import numpy as np

def parse_param(param):
    if isinstance(param, tuple):
        return random.randint(param[0], param[1])
    return param

def one_hot(index, length):
    vec = [0.0] * length
    vec[index] = 1.0
    return vec

def simulating_graph(node_num, edge_num, feature_dim, max_feature_val):
    node_num = parse_param(node_num)
    edge_num = parse_param(edge_num)
    feature_dim = parse_param(feature_dim)

    x = [list(np.random.randint(0, max_feature_val + 1, size=feature_dim))
        for _ in range(node_num)]


    edge_index = [[], []]
    for _ in range(edge_num):
        src = random.randint(0, node_num - 1)
        dst = random.randint(0, node_num - 1)
        while src == dst:  
            dst = random.randint(0, node_num - 1)
        edge_index[0].append(src)
        edge_index[1].append(dst)

    edge_attr_dim = 4
    edge_attr = [list(np.random.randint(0, 11, size=edge_attr_dim))
             for _ in range(edge_num)]


    y = [0]
    batch = [0] * node_num

    return {
        "x": x,
        "edge_index": edge_index,
        "edge_attr": edge_attr,
        "y": y,
        "batch": batch
    }


# %%
testing_graph = simulating_graph(
    node_num=(5, 10),
    edge_num=(5, 15),
    feature_dim=5,
    max_feature_val=10
)
print(testing_graph)


# %%
import json

def convert_numpy(obj):
    if isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    else:
        raise TypeError(f"Object of type {type(obj)} is not JSON serializable")

with open("testing_graph.json", "w") as f:
    json.dump(testing_graph, f, indent=2, default=convert_numpy)

# %%

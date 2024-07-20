import json
import asyncio
import os

atom_map = {
    "1,0,0,0,0,0,0": "C",
    "0,1,0,0,0,0,0": "N",
    "0,0,1,0,0,0,0": "O",
    "0,0,0,1,0,0,0": "F",
    "0,0,0,0,1,0,0": "I",
    "0,0,0,0,0,1,0": "Cl",
    "0,0,0,0,0,0,1": "Br"
}

edge_map = {
    "1,0,0,0": "aromatic",
    "0,1,0,0": "single",
    "0,0,1,0": "double",
    "0,0,0,1": "triple"
}

async def load_json(file_path):
    with open(file_path, 'r') as f:
        return json.load(f)

async def data_prep(o_data):
    final_data = {
        "nodes": [],
        "links": []
    }

    try:
        data = await load_json(o_data)
        nodes = data['x']
        edges = data['edge_index']
        edge_attr = data.get('edge_attr')

        aromatic_node_index_set = set()
        if edge_attr:
            for i in range(len(edge_attr)):
                if edge_attr[i][0] == 1:
                    aromatic_node_index_set.add(edges[0][i])
                    aromatic_node_index_set.add(edges[1][i])

        for i in range(len(nodes)):
            feature_str = ','.join(map(str, nodes[i]))
            atom_name = atom_map.get(feature_str, "Unknown")
            is_aromatic = i in aromatic_node_index_set
            new_node = {
                "id": i,
                "name": atom_name,
                "features": nodes[i],
                "is_aromatic": is_aromatic
            }
            final_data["nodes"].append(new_node)

        for i in range(len(edges[0])):
            edge_attr_string = ','.join(map(str, edge_attr[i])) if edge_attr else ""
            edge_type = edge_map.get(edge_attr_string, "Unknown")
            new_relation = {
                "source": edges[0][i],
                "target": edges[1][i],
                "type": edge_type
            }
            final_data["links"].append(new_relation)
            print(new_relation)



        # Write final_data to a JSON file
        with open('./public/json_data/processed_graphs/processed_input2.json', 'w') as f:
            json.dump(final_data, f, indent=2)

        return final_data

    except Exception as error:
        print('There has been an error in data_prep:', error)


        
def main():
    print("Current Working Directory:", os.getcwd())
    file_path = os.path.abspath('./public/json_data/graphs/input_graph2.json')
    asyncio.run(data_prep(file_path))



if __name__ == "__main__":
    main()    

# Usage example
# asyncio.run(data_prep('path_to_your_data.json'))

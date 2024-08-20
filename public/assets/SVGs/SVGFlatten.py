import xml.etree.ElementTree as ET
import copy

def flatten_svg(input_file, output_file):
    # 注册 SVG 命名空间
    ET.register_namespace("", "http://www.w3.org/2000/svg")
    ET.register_namespace("xlink", "http://www.w3.org/1999/xlink")

    # 解析 SVG 文件
    tree = ET.parse(input_file)
    root = tree.getroot()

    # 获取所有在 defs 中定义的元素
    defs = root.find("{http://www.w3.org/2000/svg}defs")
    defined_elements = {}
    if defs is not None:
        for el in defs.findall(".//*[@id]"):
            defined_elements['#' + el.get('id')] = el

    # 递归函数来处理 use 元素
    def process_element(element, parent=None):
        if element.tag.endswith('}use'):
            href = element.get('{http://www.w3.org/1999/xlink}href') or element.get('href')
            if href and href in defined_elements:
                target = defined_elements[href]
                new_element = copy.deepcopy(target)
                
                # 复制 use 元素的属性到新元素
                for attr, value in element.items():
                    if attr != '{http://www.w3.org/1999/xlink}href' and attr != 'href':
                        new_element.set(attr, value)

                # 递归处理新元素
                process_element(new_element)

                # 替换原始的 use 元素
                if parent is not None:
                    index = list(parent).index(element)
                    parent.remove(element)
                    parent.insert(index, new_element)
                return new_element
        else:
            for child in list(element):
                process_element(child, element)
        return element

    # 处理整个 SVG 树
    process_element(root)

    # 移除 defs 部分
    if defs is not None:
        root.remove(defs)

    # 保存修改后的 SVG
    tree.write(output_file, encoding="utf-8", xml_declaration=True)

# 使用示例
input_file = "GCNFormula.svg"
output_file = "output_flattened.svg"
flatten_svg(input_file, output_file)
print(f"Flattened SVG saved as {output_file}")
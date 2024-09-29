import { string } from 'mathjs';

interface Coordinates {
    x: number;
    y: number;
}

interface InitialCoordinates {
    [id: string]: Coordinates;
}

interface SubgraphList {
    [index: number]: InitialCoordinates;
}

// 全局变量来存储 JSON 数据
let globalSubgraphList: SubgraphList = {};

// 提取位置并存储到全局变量中
export function extractLocation(hubNodeA: number, hubNodeB: number, nodesOneLayer: any[]) {
    console.log("CAWD", hubNodeA, hubNodeB, nodesOneLayer);
    
    let initialCoordinates: InitialCoordinates = {};
    let index = hubNodeA + hubNodeB;

    nodesOneLayer.forEach((node: any) => {
        let id = String(node.id);
        let x = node.x;
        let y = node.y;
        initialCoordinates[id] = { x, y };
    });

    globalSubgraphList[index] = initialCoordinates;
}

// 当用户点击按钮时下载 JSON 文件
export function downloadJSONFile(svg: any) {
    const fileName = 'subgraphList.json';
    
    // 将全局变量中的数据转换为 JSON 字符串
    const jsonString = JSON.stringify(globalSubgraphList, null, 2);

    // 创建 Blob 对象
    const blob = new Blob([jsonString], { type: "application/json" });

    // 生成 URL
    const url = URL.createObjectURL(blob);

    // 创建一个下载链接
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;

    // 添加链接到文档并点击下载
    document.body.appendChild(link);
    link.click();

    // 下载完成后清理
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

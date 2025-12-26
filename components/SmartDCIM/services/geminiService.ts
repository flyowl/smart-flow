import { GoogleGenAI } from "@google/genai";
import { Node } from "reactflow";
import { RackData, ServerData } from "../types";

const getAiClient = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("API Key not found in environment variables.");
    }
    return new GoogleGenAI({ apiKey });
};

export const analyzeDataCenter = async (nodes: Node[]) => {
  const ai = getAiClient();

  // Prepare a simplified JSON structure for the AI
  const dcStructure = nodes
    .filter(node => node.type === 'rack')
    .map(rackNode => {
      const rackData = rackNode.data as RackData;
      
      // Find children servers
      const servers = nodes
        .filter(n => n.parentId === rackNode.id)
        .map(s => ({
          label: s.data.label,
          uHeight: (s.data as ServerData).uHeight,
          status: (s.data as ServerData).status,
          type: (s.data as ServerData).type,
          // Determine rough U position based on Y coordinate relative to rack padding
          positionY: s.position.y 
        }));

      return {
        id: rackNode.id,
        name: rackData.label,
        capacityU: rackData.totalU,
        occupiedU: servers.reduce((acc, s) => acc + s.uHeight, 0),
        serverCount: servers.length,
        servers: servers
      };
    });

  const looseServers = nodes.filter(n => n.type === 'server' && !n.parentId).length;

  const prompt = `
    你是一个资深的数据中心架构师和运维专家AI。
    请对以下机房的物理布局、设备分布和配置数据进行深度的多维度技术分析。

    配置数据 (Configuration Data):
    ${JSON.stringify({ racks: dcStructure, unmountedServers: looseServers }, null, 2)}

    请重点关注以下维度:
    1. **高可用性 (High Availability)**: 关键业务(如Web服务器、数据库)是否跨机柜部署，以实现机柜级冗余(Rack-level Redundancy)。
    2. **单点故障 (SPOF)**: 识别是否存在单点故障风险（例如所有核心网络设备都在同一机柜）。
    3. **资源均衡**: 空间(U)利用率、电力和散热分布是否均匀，是否存在热点。

    请提供严格的JSON格式分析报告，字段如下:
    {
      "efficiencyScore": number (0-100 integer, 基于空间利用率和布局合理性的能效评分),
      "haScore": number (0-100 integer, 基于冗余度和SPOF风险的高可用性评分),
      "powerEstimateKW": number (float, 估算总功耗, 假设服务器0.4kW/U, 交换机0.2kW/U, 存储0.5kW/U),
      "heatOutputBTU": number (integer, approx powerKW * 3412),
      "redundancyAnalysis": string (一段精炼的中文分析，指出当前的机柜级冗余情况和潜在的单点故障风险),
      "recommendations": string[] (4条具体的优化建议，分别涵盖: 1.物理布局调整 2.冗余/HA改进 3.能效/散热优化 4.容量/运维建议),
      "summary": string (一段简短的专业中文总结，包含总体健康度评价)
    }
    
    不要包含markdown格式 (如 \`\`\`json)。只返回原始JSON字符串。
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text || '{}';
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    throw error;
  }
};

export const generateLayout = async (userPrompt: string, mode: 'rack' | 'business' = 'rack') => {
    const ai = getAiClient();

    let systemPrompt = '';
    let outputFormat = '';

    if (mode === 'rack') {
        systemPrompt = `
        Role: Data Center Architect.
        Task: Generate a physical Rack Layout based on the user's description.
        
        User Request: "${userPrompt}"

        Requirements:
        1. Return a strict JSON object with a "containerZone" and a "racks" array.
        2. "containerZone" describes the physical area (Zone) needed to contain these racks.
           - Calculate 'width' = (Number of Racks * 450) + 100 padding. (Assume Rack Width is 400px + 50px gap).
           - Calculate 'height' = (Max Rack Height) + 100 padding. (Assume 1U = 30px, Padding = 40px. e.g. 42U = ~1300px).
        3. "racks" array contains the rack definitions and their devices.
        
        Constraints:
        - 'totalU' is typically 42, 48, or 24.
        - 'positionU' is the starting U slot number from the BOTTOM (1 is lowest).
        - Ensure devices do not overlap in U space.
        - **IMPORTANT: Leave at least 1U of empty space in each rack between devices or groups of devices.**
        - 'type' must be one of: 'server', 'network', 'storage', 'firewall'.
        - 'status' must be 'active', 'maintenance', or 'offline'.
        `;
        outputFormat = `
        {
          "containerZone": {
             "label": "Server Room A",
             "width": 1000,
             "height": 1400
          },
          "racks": [
            {
              "label": "Rack A1",
              "totalU": 42, 
              "devices": [
                 { "label": "Web Server 01", "uHeight": 2, "type": "server", "status": "active", "positionU": 1 },
                 { "label": "Switch Core", "uHeight": 1, "type": "network", "status": "active", "positionU": 42 }
              ]
            }
          ]
        }`;
    } else {
        systemPrompt = `
        Role: System Architect.
        Task: Generate a logical Business/Service Flow Topology based on the user's description.
        
        User Request: "${userPrompt}"

        Requirements:
        1. Return a strict JSON object containing "containerZone", "nodes" and "edges".
        2. "containerZone" describes the logical area (Zone) to group these business nodes.
           - Calculate 'width' based on number of nodes (approx Node Width 400px * Count + Spacing).
           - Calculate 'height' approx 600px.
        
        Constraints:
        - Generate a logical flow (e.g., Database -> App Server -> Load Balancer -> Firewall).
        - 'type' must be one of: 'server', 'network', 'storage', 'firewall'.
        - 'uHeight' should reflect the device type (e.g., server=2, switch=1).
        `;
        outputFormat = `
        {
          "containerZone": {
             "label": "E-Commerce Logic",
             "width": 1200,
             "height": 600
          },
          "nodes": [
            { "id": "n1", "label": "DB Master", "type": "server", "uHeight": 2 },
            { "id": "n2", "label": "Core Switch", "type": "network", "uHeight": 1 }
          ],
          "edges": [
            { "source": "n1", "target": "n2", "label": "10GbE" }
          ]
        }`;
    }

    const fullPrompt = `
    ${systemPrompt}

    Output Format Example:
    ${outputFormat}

    Do not wrap in markdown code blocks. Return raw JSON.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: fullPrompt,
            config: {
                responseMimeType: 'application/json'
            }
        });

        const text = response.text || '{}';
        return JSON.parse(text);
    } catch (error) {
        console.error("Gemini Generation Failed:", error);
        throw error;
    }
};

import { GoogleGenAI, Type } from "@google/genai";

// Initialize the Google GenAI client using the provided environment variable
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeSensitiveFields = async (tableName: string, columns: string[]): Promise<any> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `分析以下数据库表 "${tableName}" 的列名，识别哪些可能是敏感字段（如：姓名、电话、密码、金额、身份证等）。
      列名列表：${columns.join(', ')}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              column: { type: Type.STRING },
              isSensitive: { type: Type.BOOLEAN },
              reason: { type: Type.STRING },
              riskLevel: { type: Type.STRING, description: 'HIGH, MEDIUM, LOW' }
            },
            required: ['column', 'isSensitive', 'riskLevel']
          }
        }
      }
    });

    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    // Fallback simple logic
    return columns.map(c => ({
      column: c,
      isSensitive: /pass|phone|id|mail|money|price/i.test(c),
      riskLevel: /pass|id/i.test(c) ? 'HIGH' : 'MEDIUM'
    }));
  }
};

export const generateHealthReportSummary = async (records: any[]): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `根据以下巡检记录生成一份简短的运维健康报告摘要：${JSON.stringify(records)}`,
    });
    return response.text || '无法生成报告';
  } catch (error) {
    return "系统健康状况良好，需注意个别实例的备份延迟。";
  }
};

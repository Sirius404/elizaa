import { 
    elizaLogger,
    generateText,
    composeContext,
    ModelClass,
    IAgentRuntime 
} from "@elizaos/core";
import {
    Tweet
} from "agent-twitter-client";
import { ClientBase } from "./base";

const projectIntroductionTemplate = `
🔥 Project Spotlight: {{projectName}}

📝 Description: {{projectDescription}}

🏷️ Tags: {{projectTags}}
💰 Market Cap: {{marketCap}}
🌡️ Heat Score: {{heatScore}}

#Crypto #Blockchain
`;

export class ProjectUpdateService {
    private client: ClientBase;
    private runtime: IAgentRuntime;
    private updateInterval: NodeJS.Timeout | null = null;

    constructor(client: ClientBase, runtime: IAgentRuntime) {
        this.client = client;
        this.runtime = runtime;
    }

    async start() {
        // 每24小时执行一次
        const interval = 24 * 60 * 60 * 1000;
        
        const handleUpdates = async () => {
            try {
                await this.postDailyProjectUpdates();
            } catch (error) {
                elizaLogger.error("Error in daily project updates:", error);
            }
        };

        // 立即执行一次
        handleUpdates();
        
        // 设置定时器
        this.updateInterval = setInterval(handleUpdates, interval);
    }

    async stop() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    private async postDailyProjectUpdates() {
        try {
            // 1. 获取 Top 100 项目
            const hotProjects = await this.fetchHotProjects();
            
            // 2. 选择前3个项目进行详细介绍
            const topProjects = hotProjects.slice(0, 3);
            
            for (const project of topProjects) {
                // 3. 获取项目详细信息
                const projectDetails = await this.fetchProjectDetails(project.project_id);
                
                // 4. 生成推文内容
                const tweetContent = await this.generateProjectTweet(projectDetails);
                
                // 5. 发送推文
                await this.client.postTweet(tweetContent);
                
                // 等待5分钟再发下一条，避免刷屏
                await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000));
            }
        } catch (error) {
            elizaLogger.error("Error in postDailyProjectUpdates:", error);
            throw error;
        }
    }

    private async fetchHotProjects() {
        try {
            const response = await fetch("https://api.rootdata.com/open/hot_index", {
                method: "POST",
                headers: {
                    "apikey": this.runtime.getSetting("ROOTDATA_API_KEY"),
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ days: 1 })
            });

            const data = await response.json();
            if (data.result !== 200) {
                throw new Error(`Failed to fetch hot projects: ${data.message}`);
            }

            return data.data;
        } catch (error) {
            elizaLogger.error("Error fetching hot projects:", error);
            throw error;
        }
    }

    private async fetchProjectDetails(projectId: number) {
        try {
            const response = await fetch("https://api.rootdata.com/open/get_item", {
                method: "POST",
                headers: {
                    "apikey": this.runtime.getSetting("ROOTDATA_API_KEY"),
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    project_id: projectId,
                    include_team: true,
                    include_investors: true
                })
            });

            const data = await response.json();
            if (data.result !== 200) {
                throw new Error(`Failed to fetch project details: ${data.message}`);
            }

            return data.data;
        } catch (error) {
            elizaLogger.error("Error fetching project details:", error);
            throw error;
        }
    }

    private async generateProjectTweet(projectDetails: any) {
        const state = await this.runtime.composeState({ 
            userId: this.runtime.agentId,
            roomId: this.runtime.agentId,
            content: { text: "" },
            agentId: this.runtime.agentId 
        });

        const context = composeContext({
            state: {
                ...state,
                projectName: projectDetails.project_name,
                projectDescription: projectDetails.description,
                projectTags: projectDetails.tags.join(", "),
                marketCap: projectDetails.market_cap || "N/A",
                heatScore: projectDetails.heat || "N/A"
            },
            template: this.runtime.character.templates?.projectIntroductionTemplate || 
                     projectIntroductionTemplate,
        });

        const content = await generateText({
            runtime: this.runtime,
            context,
            modelClass: ModelClass.SMALL
        });

        return content;
    }
} 
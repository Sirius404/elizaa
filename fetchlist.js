import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

async function scrapeKaito() {
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const urls = [
            'https://yaps.kaito.ai/story-protocol',
            'https://yaps.kaito.ai/kaito',
            'https://yaps.kaito.ai/eclipse',
            'https://yaps.kaito.ai/monad',
            'https://yaps.kaito.ai/quai',
            'https://yaps.kaito.ai/corn'
        ];

        let allResults = [];

        for (const url of urls) {
            const page = await browser.newPage();
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
            
            console.log(`正在处理: ${url}`);
            await page.goto(url);
            await page.waitForSelector('tbody tr td:nth-child(2)');

            const results = await page.evaluate(() => {
                const data = [];
                for (let i = 1; i <= 50; i++) {
                    const xpath = `/html/body/div[3]/div[1]/div/div[5]/div[2]/div/div[1]/table/tbody/tr[${i}]/td[2]/span/span[2]/span/span[2]/text()[2]`;
                    try {
                        const xpathResult = document.evaluate(
                            xpath,
                            document,
                            null,
                            XPathResult.FIRST_ORDERED_NODE_TYPE,
                            null
                        );
                        
                        const node = xpathResult.singleNodeValue;
                        if (node) {
                            const username = node.textContent.trim().replace('@', '');
                            data.push(username);
                        }
                    } catch (error) {
                        break;
                    }
                }
                return data;
            });

            console.log(`从 ${url} 获取到 ${results.length} 个用户`);
            allResults = [...allResults, ...results];
            await page.close();
        }
        
        await browser.close();

        // 去重
        const uniqueResults = [...new Set(allResults)];
        
        // 将用户名数组转换为逗号分隔的字符串
        const userString = uniqueResults.join(',');
        
        // 读取现有的 .env 文件
        const envPath = '.env';
        const envContent = await fs.readFile(envPath, 'utf-8');
        
        // 使用正则表达式替换 TWITTER_TARGET_USERS 的值
        const newEnvContent = envContent.replace(
            /TWITTER_TARGET_USERS=.*$/m,
            `TWITTER_TARGET_USERS="${userString}"`
        );
        
        // 写回 .env 文件
        await fs.writeFile(envPath, newEnvContent, 'utf-8');
        
        console.log('成功更新 .env 文件中的 TWITTER_TARGET_USERS');
        console.log(`总共添加了 ${uniqueResults.length} 个唯一用户`);
        
        return uniqueResults;

    } catch (error) {
        console.error('处理失败:', error);
        if (browser) await browser.close();
        throw error;
    }
}

// 检查是否是直接运行此文件
const isMainModule = fileURLToPath(import.meta.url) === process.argv[1];

if (isMainModule) {
    scrapeKaito()
        .then(results => {
            console.log('处理完成');
            process.exit(0);
        })
        .catch(error => {
            console.error('处理出错:', error);
            process.exit(1);
        });
}

export { scrapeKaito };
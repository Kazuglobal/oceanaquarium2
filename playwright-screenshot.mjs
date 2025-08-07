import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  // スクリーンショット保存用ディレクトリ作成
  const screenshotDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir);
  }

  // ブラウザ起動
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // ビューポート設定
  await page.setViewportSize({ width: 1920, height: 1080 });
  
  try {
    // 1. トップページ
    console.log('トップページを開いています...');
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(3000);
    await page.screenshot({ 
      path: path.join(screenshotDir, '01-homepage.png'),
      fullPage: true 
    });
    
    // 2. 海のせかいをクリック
    console.log('海のせかいを選択しています...');
    await page.click('text=海のせかい');
    await page.waitForTimeout(3000);
    await page.screenshot({ 
      path: path.join(screenshotDir, '02-ocean-world.png') 
    });
    
    // 3. 魚を追加
    console.log('魚を追加しています...');
    const addFishButton = page.locator('button:has-text("魚を追加")');
    if (await addFishButton.isVisible()) {
      await addFishButton.click();
      await page.waitForTimeout(1000);
      await addFishButton.click();
      await page.waitForTimeout(1000);
      await addFishButton.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ 
        path: path.join(screenshotDir, '03-added-fish.png') 
      });
    }
    
    // 4. 魚をクリックして大きくする
    console.log('魚をクリックして大きくしています...');
    const canvas = page.locator('canvas').first();
    if (await canvas.isVisible()) {
      await canvas.click({ position: { x: 500, y: 300 } });
      await page.waitForTimeout(500);
      await canvas.click({ position: { x: 600, y: 400 } });
      await page.waitForTimeout(500);
      await canvas.click({ position: { x: 700, y: 350 } });
      await page.waitForTimeout(2000);
      await page.screenshot({ 
        path: path.join(screenshotDir, '04-bigger-fish.png') 
      });
    }
    
    // 5. エサをあげる
    console.log('エサをあげています...');
    const feedButton = page.locator('button:has-text("エサをあげる")');
    if (await feedButton.isVisible()) {
      await feedButton.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ 
        path: path.join(screenshotDir, '05-feeding-fish.png') 
      });
    }
    
    // 6. 汚染を追加
    console.log('汚染を追加しています...');
    const pollutionButton = page.locator('button:has-text("汚染を追加")');
    if (await pollutionButton.isVisible()) {
      await pollutionButton.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ 
        path: path.join(screenshotDir, '06-pollution-added.png') 
      });
    }
    
    // 7. 海をきれいにする
    console.log('海をきれいにしています...');
    const cleanButton = page.locator('button:has-text("海をきれいにする")');
    if (await cleanButton.isVisible()) {
      await cleanButton.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ 
        path: path.join(screenshotDir, '07-ocean-cleaned.png') 
      });
    }
    
    // 8. 地図を表示
    console.log('地図を表示しています...');
    const mapButton = page.locator('button[title="地図を表示"]');
    if (await mapButton.isVisible()) {
      await mapButton.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ 
        path: path.join(screenshotDir, '08-map-view.png') 
      });
    }
    
    // 9. リアルタイムモード切り替え
    console.log('リアルタイムデータモードに切り替えています...');
    const realtimeButton = page.locator('button:has-text("リアルタイム海洋データ")');
    if (await realtimeButton.isVisible()) {
      await realtimeButton.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ 
        path: path.join(screenshotDir, '09-realtime-mode.png') 
      });
    }
    
    console.log('すべてのスクリーンショットを撮影しました！');
    
  } catch (error) {
    console.error('エラーが発生しました:', error);
  } finally {
    await browser.close();
  }
})();
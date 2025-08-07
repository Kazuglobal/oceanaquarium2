import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 遅延を入れる関数
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  // スクリーンショット保存用ディレクトリ作成
  const screenshotDir = path.join(__dirname, 'guide-screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir);
  }

  console.log('🚀 Ocean Adventure説明書用スクリーンショット撮影開始...');
  
  // ブラウザ起動（ヘッドレスモードで実行）
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
  });
  
  const page = await context.newPage();
  
  try {
    // 1. トップページ（5つの魔法のワールド）
    console.log('📸 1. トップページを撮影中...');
    await page.goto('http://localhost:5174', { waitUntil: 'networkidle' });
    await delay(2000);
    await page.screenshot({ 
      path: path.join(screenshotDir, '01-top-page.png'),
      fullPage: true 
    });
    
    // 2. 海のせかいを選択
    console.log('📸 2. 海のせかいを選択中...');
    await page.click('text=海のせかい');
    await delay(3000);
    await page.screenshot({ 
      path: path.join(screenshotDir, '02-ocean-world.png')
    });
    
    // 3. 左上パネルの拡大ボタン
    console.log('📸 3. 拡大ボタンの位置を撮影中...');
    // 拡大ボタンにフォーカス（存在する場合）
    const expandButton = page.locator('button[title*="拡大"]').first();
    if (await expandButton.count() > 0) {
      await expandButton.hover();
      await page.screenshot({ 
        path: path.join(screenshotDir, '03-expand-button.png')
      });
      await expandButton.click();
      await delay(1000);
    }
    
    // 4. 新しい魚を追加ボタン
    console.log('📸 4. 魚追加ボタンを撮影中...');
    const addFishButton = page.locator('button:has-text("新しい魚を追加"), button:has-text("魚を追加")').first();
    if (await addFishButton.count() > 0) {
      await addFishButton.hover();
      await page.screenshot({ 
        path: path.join(screenshotDir, '04-add-fish-button.png')
      });
    }
    
    // 5. 魚のサイズ調整（右下の100%）
    console.log('📸 5. サイズ調整コントロールを撮影中...');
    const sizeControl = page.locator('text=/100%|サイズ/').first();
    if (await sizeControl.count() > 0) {
      await sizeControl.hover();
      await page.screenshot({ 
        path: path.join(screenshotDir, '05-size-control.png')
      });
    }
    
    // 6. 魚の数の調整（＋−ボタン）
    console.log('📸 6. 魚の数調整ボタンを撮影中...');
    const increaseButton = page.locator('button:has-text("+")').first();
    const decreaseButton = page.locator('button:has-text("-")').first();
    if (await increaseButton.count() > 0) {
      await page.screenshot({ 
        path: path.join(screenshotDir, '06-fish-count-controls.png')
      });
    }
    
    // 7. 汚染機能のボタン群
    console.log('📸 7. 汚染機能ボタンを撮影中...');
    const pollutionButton = page.locator('button:has-text("汚染を追加")').first();
    if (await pollutionButton.count() > 0) {
      await pollutionButton.click();
      await delay(2000);
      await page.screenshot({ 
        path: path.join(screenshotDir, '07-pollution-added.png')
      });
    }
    
    // 8. 海をきれいにするボタン
    console.log('📸 8. 海をきれいにするボタンを撮影中...');
    const cleanButton = page.locator('button:has-text("海をきれいにする"), button:has-text("海を綺麗にする")').first();
    if (await cleanButton.count() > 0) {
      await cleanButton.click();
      await delay(2000);
      await page.screenshot({ 
        path: path.join(screenshotDir, '08-ocean-cleaned.png')
      });
    }
    
    // 9. リアル海洋データモード
    console.log('📸 9. リアル海洋データモードを撮影中...');
    const realtimeButton = page.locator('button:has-text("リアル海洋データ"), button:has-text("リアルタイム")').first();
    if (await realtimeButton.count() > 0) {
      await realtimeButton.click();
      await delay(2000);
      await page.screenshot({ 
        path: path.join(screenshotDir, '09-realtime-mode.png')
      });
    }
    
    // 10. 地図表示
    console.log('📸 10. 地図機能を撮影中...');
    const mapButton = page.locator('button[title*="地図"]').first();
    if (await mapButton.count() > 0) {
      await mapButton.click();
      await delay(2000);
      await page.screenshot({ 
        path: path.join(screenshotDir, '10-map-view.png')
      });
    }
    
    // 11. ホームに戻る
    console.log('📸 11. ホームページに戻る...');
    await page.goto('http://localhost:5174', { waitUntil: 'networkidle' });
    await delay(1000);
    
    // 12. 宇宙のせかいを選択
    console.log('📸 12. 宇宙のせかいを撮影中...');
    const spaceWorld = page.locator('text=宇宙のせかい').first();
    if (await spaceWorld.count() > 0) {
      await spaceWorld.click();
      await delay(3000);
      await page.screenshot({ 
        path: path.join(screenshotDir, '11-space-world.png')
      });
    }
    
    console.log('✅ すべてのスクリーンショットの撮影が完了しました！');
    console.log(`📁 保存先: ${screenshotDir}`);
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
  } finally {
    await browser.close();
  }
})();
import { webkit } from 'playwright'
import { IntelliBrowser } from '@intelli-browser/core';

async function main() {

  const browser = await webkit.launch({
    headless: false,
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.setViewportSize({ width: 1920, height: 1440 })
  await page.goto('https://developer.mozilla.org/en-US/');

  const client = new IntelliBrowser({
    apiKey: '',  // modify apiKey or provide ANTHROPIC_API_KEY in .env file
  })

  await page.waitForTimeout(5000);  
  await client.run({
    page,
    message: 'Click search and input "Web API", press "arrow down" to select the second result. then press "ENTER" to search it'
  })
  await browser.close();
}

main();
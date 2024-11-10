import type { Page } from "playwright";
import type { ToolContent } from '@intelli-browser/anthropic';
import sharp from 'sharp';

interface PlayWrightAgentProps {
  page: Page
}

export class PlayWrightAgent {
  private page: Page;

  constructor(props: PlayWrightAgentProps) {
    this.page = props.page
  }

  public getViewport() {
    return this.page.viewportSize() || { width: 0, height: 0 };
  }

  public getScaledScreenDimensions() {
    const { width, height } = this.getViewport();
    const resolution = width / height;
    let scaledWidth: number;
    let scaledHeight: number;
  
    if (resolution > 1280 / 800) {
      scaledWidth = 1280;
      scaledHeight = Math.round(1280 / resolution);
    } else {
      scaledHeight = 800;
      scaledWidth = Math.round(800 * resolution);
    }
  
    return { scaledWidth, scaledHeight };
  }
  
  public async scaleScreenshot(buffer: Buffer, scaledWith: number, scaledHeight: number) {
    const sharpImg = sharp(buffer);
    const scaledImg = sharpImg.resize(scaledWith, scaledHeight, { fit: 'fill' })
    return await scaledImg.toBuffer();
  }

  public getPlaywrightPressKey(key: string) {
    const lowerKeys = key.toLocaleLowerCase().split('+');
    return lowerKeys.map(lowerKey => {
      switch(lowerKey) {
        case 'return':
          return 'Enter';
        case 'space':
          return ' ';
        case 'down':
          return 'ArrowDown'
        case 'up':
          return 'ArrowUp'
        case 'left':
          return 'ArrowLeft'
        case 'right':
          return 'ArrowRight'
        case 'alt':
          return 'Alt'
        case 'page_up':
          return 'PageUp'
        case 'next':
        case 'page_down':
          return 'PageDown'
        case 'caps_lock':
          return 'CapsLock'
        default:
          return key;
      }
    }).join('+')
  }

  public async runAction(tool: ToolContent, formatFn: any) {
    const { input, id } = tool || {};
    const { coordinate = [] } = input || {};
    const [x, y] = coordinate;
    const { width, height } = this.getViewport();
    const { scaledWidth, scaledHeight } = this.getScaledScreenDimensions();
    switch(input?.action) {
      case 'screenshot':
        const buffer = await this.page.screenshot();
        // scale the screenshot to LLM
        const scaledBuffer = await this.scaleScreenshot(buffer, scaledWidth, scaledHeight)
        const screenshot = scaledBuffer.toString('base64');
        if (screenshot) {
          return formatFn(screenshot, id);
        } else {
          throw new Error(`Screenshot failed, input: ${JSON.stringify(input)}`)
        }
      case 'mouse_move':
        if (x && y) {
          await this.page.mouse.move(x * width / scaledWidth, y * height / scaledHeight)
        } else {
          throw new Error(`Mouse move failed, input: ${JSON.stringify(input)}`)
        }
        break;
      case 'left_click':
        await this.page.mouse.down();
        await this.page.mouse.up();
        break;
      case 'double_click':
        await this.page.mouse.down();
        await this.page.mouse.up();
        await this.page.mouse.down();
        await this.page.mouse.up();
        break;
      case 'right_click':
        await this.page.mouse.down({ button: 'right' });
        await this.page.mouse.up({ button: 'right' });
        break;
      case 'middle_click':
        await this.page.mouse.down({ button: 'middle' });
        await this.page.mouse.up({ button: 'middle' });
        break;
      case 'type':
        await this.page.keyboard.type(input?.text || '');
        break;
      case 'key':
        await this.page.keyboard.press(this.getPlaywrightPressKey(input?.text || ''));
        break;
      case 'left_click_drag':
        if (x && y) {
          await this.page.mouse.down();
          await this.page.mouse.move(x * width / scaledWidth, y * height / scaledHeight);
          await this.page.mouse.up();
        } else {
          throw new Error(`Drag failed, input: ${JSON.stringify(input)}`)
        }
        break;
      default:
        throw new Error(`Unknown action, input: ${JSON.stringify(input)}`)
    }
   
    return formatFn(null, id)
  }
}

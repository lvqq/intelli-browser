import type { Page } from "playwright";
import type { ToolContent } from '@intelli-browser/anthropic';
import sharp from 'sharp';

interface PlayWrightAgentProps {
  page: Page
}

interface ActionOptions {
  tool: ToolContent;
  formatFn: any;
  delay: number;
  showAction?: boolean;
}

export class PlayWrightAgent {
  private page: Page;
  private actions: string[];

  constructor(props: PlayWrightAgentProps) {
    this.page = props.page
    this.actions = [];
  }

  public getActions() {
    return this.actions;
  }

  public clean() {
    this.actions = [];
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

  public async runAction({
    tool,
    delay,
    formatFn,
    showAction = true
  }: ActionOptions) {
    const { input, id } = tool || {};
    const { coordinate = [] } = input || {};
    const [x, y] = coordinate;
    const { width, height } = this.getViewport();
    const { scaledWidth, scaledHeight } = this.getScaledScreenDimensions();
    if (delay !== 0 && input?.action !== 'screenshot') {
      this.actions.push(`await page.waitForTimeout(${delay})`)
    }
    switch(input?.action) {
      case 'screenshot':
        const buffer = await this.page.screenshot();
        // scale the screenshot to LLM
        const scaledBuffer = await this.scaleScreenshot(buffer, scaledWidth, scaledHeight)
        const screenshot = scaledBuffer.toString('base64');
        if (screenshot) {
          if (showAction) {
            console.log('Action: screenshot\n')
          }
          return formatFn(screenshot, id);
        } else {
          throw new Error(`Screenshot failed, input: ${JSON.stringify(input)}`)
        }
      case 'mouse_move':
        if (x && y) {
          // page actual moved pixel
          const movedX = parseFloat((x * width / scaledWidth).toFixed(2))
          const movedY = parseFloat((y * height / scaledHeight).toFixed(2))
          await this.page.mouse.move(movedX, movedY)
          this.actions.push(`await page.mouse.move(${movedX}, ${movedY})`)
          if (showAction) {
            console.log(`Action: mouse_move ${movedX}, ${movedY}\n`)
          }
        } else {
          throw new Error(`Mouse move failed, input: ${JSON.stringify(input)}`)
        }
        break;
      case 'left_click':
        await this.page.mouse.down();
        this.actions.push('await page.mouse.down()')
        await this.page.mouse.up();
        this.actions.push('await page.mouse.up()')
        break;
      case 'double_click':
        await this.page.mouse.down();
        this.actions.push('await page.mouse.down()')
        await this.page.mouse.up();
        this.actions.push('await page.mouse.up()')
        await this.page.mouse.down();
        this.actions.push('await page.mouse.down()')
        await this.page.mouse.up();
        this.actions.push('await page.mouse.up()')
        break;
      case 'right_click':
        await this.page.mouse.down({ button: 'right' });
        this.actions.push('await page.mouse.down({ button: "right" })')
        await this.page.mouse.up({ button: 'right' });
        this.actions.push('await page.mouse.down({ button: "right" })')
        break;
      case 'middle_click':
        await this.page.mouse.down({ button: 'middle' });
        this.actions.push('await page.mouse.down({ button: "middle" })')
        await this.page.mouse.up({ button: 'middle' });
        this.actions.push('await page.mouse.down({ button: "middle" })')
        break;
      case 'type':
        const typeText = input?.text || ''
        await this.page.keyboard.type(typeText);
        this.actions.push(`await page.mouse.type('${typeText}')`)
        if (showAction) {
          console.log(`Action: type ${typeText}\n`)
        }
        break;
      case 'key':
        const pressKey = this.getPlaywrightPressKey(input?.text || '')
        await this.page.keyboard.press(pressKey)
        this.actions.push(`await this.page.keyboard.press('${pressKey}')`)
        if (showAction) {
          console.log(`Action: key ${pressKey}\n`)
        }
        break;
      case 'left_click_drag':
        if (x && y) {
          const movedX = parseFloat((x * width / scaledWidth).toFixed(2))
          const movedY = parseFloat((y * height / scaledHeight).toFixed(2))
          await this.page.mouse.down();
          this.actions.push('await page.mouse.down()')
          await this.page.mouse.move(movedX, movedY);
          this.actions.push(`await page.mouse.move(${movedX}, ${movedY})`)
          await this.page.mouse.up();
          this.actions.push('await page.mouse.up()')
          if (showAction) {
            console.log(`Action: left_click_drag ${movedX}, ${movedY}\n`)
          }
        } else {
          throw new Error(`Drag failed, input: ${JSON.stringify(input)}`)
        }
        break;
      default:
        throw new Error(`Unknown action, input: ${JSON.stringify(input)}`)
    }

    if (showAction && ['left_click', 'double_click', 'right_click', 'middle_click'].includes(input?.action)) {
      console.log(`Action: ${input.action}\n`)
    }
   
    return formatFn(null, id)
  }
}

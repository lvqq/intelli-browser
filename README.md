<h2 align="center">Intelli-Browser</h2>

<p align="center">
  <a href="https://github.com/lvqq/intelli-browser/tags">
    <img alt="GitHub tag (latest by date)" src="https://img.shields.io/github/v/release/lvqq/intelli-browser">
  </a>
  <a href="https://github.com/lvqq/intelli-browser/blob/main/LICENSE">
    <img alt="license" src="https://img.shields.io/github/license/lvqq/intelli-browser">
  </a>
</p>


## Introduction
Use natural language to control your browser, powered by LLM and playwright


## Features
- ✨ Use natural language to write and run e2e test cases
- 🧪 Generate traditional e2e test cases after executing the cases
- 💭 More feautes are coming soon! Feel free to open an issue or submit a pull request

## Demo
[MDN Demo Video](https://github.com/user-attachments/assets/274d2f78-39b6-4a7d-ab15-79dc08a2c13a)

User Task
> Click search and input "Web API", press "arrow down" once to select the second result. Then press "ENTER" to search it. Find "Keyboard API" nearby title "K" and click it

## Limitaions
- Only *claude-3-5-sonnet* LLM is supported for now
- Only *playwright* framework is supported for now

## Requirement
- NodeJS >= 18

## Usage

### Example
The example is under directory `example`, try the following steps to have an experience:
```bash
# clone the repository
git clone https://github.com/lvqq/intelli-browser.git

# install dependencies
pnpm i

# add your ANTHROPIC_API_KEY

# run demo
pnpm run demo
```

### Installation
```bash
# use npm
npm install @intelli-browser/core

# use yarn
yarn add @intelli-browser/core

# use pnpm
pnpm add @intelli-browser/core
```

### API reference
```javascript
  import { IntelliBrowser } from '@intelli-browser/core';

  const client = new IntelliBrowser({
    apiKey: '',  // add apiKey or provide ANTHROPIC_API_KEY in .env file
  })

  await client.run({
    page,  // playwright Page instance
    message: 'Click search and input "Web API", press "arrow down" to select the second result. then press "ENTER" to search it',  // user prompt
  })
```

### Generate E2E cases
If you want to generate the tranditional E2E test cases after executing, just get the return data from `client.run`

```javascript
  import { IntelliBrowser } from '@intelli-browser/core';

  const client = new IntelliBrowser({
    apiKey: '',  // add apiKey or provide ANTHROPIC_API_KEY in .env file
  })

  // will return the generated e2e cases as string array
  const e2e = await client.run({
    page,  // playwright Page instance
    message: 'Click search and input "Web API", press "arrow down" to select the second result. then press "ENTER" to search it',  // user prompt
  })

  console.log(e2e)
  // As the demo shows:
  // [
  //   'await page.mouse.move(1241.61, 430.2)',
  //   'await page.waitForTimeout(2266)',
  //   'await page.mouse.down()',
  //   'await page.mouse.up()',
  //   'await page.waitForTimeout(3210)',
  //   "await page.mouse.type('Web API')",
  //   'await page.waitForTimeout(3064)',
  //   "await page.keyboard.press('ArrowDown')",
  //   'await page.waitForTimeout(2917)',
  //   "await page.keyboard.press('Enter')",
  //   'await page.waitForTimeout(6471)',
  //   "await page.keyboard.press('PageDown')",
  //   'await page.waitForTimeout(7021)',
  //   'await page.mouse.move(687.39, 923.4)',
  //   'await page.waitForTimeout(4501)',
  //   'await page.mouse.down()',
  //   'await page.mouse.up()'
  // ]

```


### Other options
By default, LLM conversations and actions are logged as the demo shows. If you don't want it, you can try:
```javascript
import { IntelliBrowser } from '@intelli-browser/core';

const client = new IntelliBrowser({
  apiKey: '',  // add apiKey or provide ANTHROPIC_API_KEY in .env file
  verbose: false,  // don't log out conversations and actions
})
```

By default, context will be cleaned after each `client.run` to save tokens usage. If you want to retain context, you can try:
```javascript
import { IntelliBrowser } from '@intelli-browser/core';

const client = new IntelliBrowser({
  apiKey: '',  // add apiKey or provide ANTHROPIC_API_KEY in .env file
  autoClean: false,  // don't auto clean context
})
```

## How it works
- Inspired by claude-3.5-sonnet **computer use** funtion, it simulates browser use and combines with e2e cases
- User prompt and page info are sent to the LLM to analyze page content and interactive elements
- Intelli-Browser executes the LLM planned actions and feeds it back
- It ends when no more action or cannot achieve the goal of the task

## Credits
- [Computer Use](https://docs.anthropic.com/en/docs/build-with-claude/computer-use)
- [agent.ext](https://github.com/corbt/agent.exe)

## License
Based on [MIT License](./LICENSE)

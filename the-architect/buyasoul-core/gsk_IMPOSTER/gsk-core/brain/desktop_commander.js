'use strict';

const fs = require('fs');
const path = require('path');
const { execSync, exec } = require('child_process');
const crypto = require('crypto');

const { vault } = require('./api_vault.js');

let screenshotDesktop = null;
try { screenshotDesktop = require('screenshot-desktop'); } catch (e) {}

let playwright = null;
try { playwright = require('playwright'); } catch (e) {}

class DesktopCommander {
    constructor(brain, memory) {
        this.brain = brain;
        this.memory = memory;
        this.browser = null;
        this.page = null;
        this.browserType = 'chromium';
        this.screenshotDir = path.join(__dirname, '..', '..', 'data', 'desktop');
        this.screenSize = { width: 1920, height: 1080 };
        
        if (!fs.existsSync(this.screenshotDir)) {
            fs.mkdirSync(this.screenshotDir, { recursive: true });
        }
    }

    async takeScreenshot(name) {
        if (!screenshotDesktop) {
            return { success: false, error: 'screenshot-desktop package not installed (npm install screenshot-desktop)' };
        }
        try {
            const filename = `${name || 'screen'}_${Date.now()}.png`;
            const filepath = path.join(this.screenshotDir, filename);
            const img = await screenshotDesktop({ format: 'png' });
            fs.writeFileSync(filepath, img);
            return { success: true, filepath, filename, size: img.length };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    async look() {
        const shot = await this.takeScreenshot('look');
        if (!shot.success) return shot;
        const analysis = await this.describeScreen(shot.filepath);
        return { ...shot, analysis };
    }

    async describeScreen(imagePath) {
        if (!this.brain || typeof this.brain.think !== 'function') {
            return { note: 'No brain available — cannot analyze screenshot' };
        }
        try {
            const prompt = `You are a desktop vision system. I will describe a screenshot, you describe what's visible in detail.

Describe:
1. What application windows are visible
2. What content is on screen (text, buttons, images, UI elements)
3. The current state of the system
4. What actions a user could take next`;
            
            const result = await this.brain.think(prompt);
            return { description: result };
        } catch (e) {
            return { error: e.message };
        }
    }

    async mouseMove(x, y) {
        try {
            const psCmd = `Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(${x},${y})`;
            execSync(psCmd, { shell: 'powershell', timeout: 5000 });
            return { success: true, x, y };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    async mouseClick(button) {
        const btn = button || 'left';
        try {
            const psBtn = btn === 'right' ? 'WindowsFormsKeys.RButton' : 'WindowsFormsKeys.LButton';
            const psCmd = `Add-Type -AssemblyName System.Windows.Forms;
$sig = '[DllImport("user32.dll")]public static extern void mouse_event(uint dwFlags,uint dx,uint dy,uint dwData,int dwExtraInfo);';
$type = Add-Type -MemberDefinition $sig -Name "Win32Mouse" -Namespace Win32Functions -PassThru;
if ('${btn}' -eq 'right') { $type::mouse_event(0x0008,0,0,0,0); $type::mouse_event(0x0010,0,0,0,0); }
else { $type::mouse_event(0x0002,0,0,0,0); $type::mouse_event(0x0004,0,0,0,0); }`;
            execSync(psCmd, { shell: 'powershell', timeout: 5000 });
            return { success: true, button: btn };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    async click(x, y, button) {
        if (x !== undefined && y !== undefined) {
            await this.mouseMove(x, y);
        }
        return this.mouseClick(button);
    }

    async typeText(text) {
        try {
            const escaped = text.replace(/"/g, '\\"').replace(/\n/g, '`n').replace(/\r/g, '`r');
            const psCmd = `Add-Type -AssemblyName System.Windows.Forms;
[System.Windows.Forms.SendKeys]::SendWait("${escaped}")`;
            execSync(psCmd, { shell: 'powershell', timeout: 5000 });
            return { success: true, text: text.substring(0, 50) + (text.length > 50 ? '...' : '') };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    async pressKey(key) {
        const keyMap = {
            'enter': '{ENTER}', 'tab': '{TAB}', 'esc': '{ESC}', 'escape': '{ESC}',
            'up': '{UP}', 'down': '{DOWN}', 'left': '{LEFT}', 'right': '{RIGHT}',
            'space': ' ', 'backspace': '{BACKSPACE}', 'delete': '{DELETE}',
            'home': '{HOME}', 'end': '{END}', 'pgup': '{PGUP}', 'pgdn': '{PGDN}',
            'f1': '{F1}', 'f2': '{F2}', 'f3': '{F3}', 'f4': '{F4}', 'f5': '{F5}',
            'ctrl': '^', 'alt': '%', 'shift': '+',
        };
        const mapped = keyMap[key.toLowerCase()] || key;
        try {
            const psCmd = `Add-Type -AssemblyName System.Windows.Forms;
[System.Windows.Forms.SendKeys]::SendWait("${mapped}")`;
            execSync(psCmd, { shell: 'powershell', timeout: 5000 });
            return { success: true, key };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    async hotkey(modifiers, key) {
        const modMap = {
            'ctrl': '^', 'alt': '%', 'shift': '+', 'win': '^',
        };
        const modStr = (Array.isArray(modifiers) ? modifiers : [modifiers])
            .map(m => modMap[m.toLowerCase()] || '')
            .join('');
        const keyStr = modStr + key;
        try {
            const psCmd = `Add-Type -AssemblyName System.Windows.Forms;
[System.Windows.Forms.SendKeys]::SendWait("${keyStr}")`;
            execSync(psCmd, { shell: 'powershell', timeout: 5000 });
            return { success: true, hotkey: `${modifiers.join('+')}+${key}` };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    async scroll(direction, amount) {
        const amt = amount || 3;
        const dir = direction === 'up' ? -1 : 1;
        try {
            const psCmd = `Add-Type -AssemblyName System.Windows.Forms;
for($i=0;$i -lt ${amt};$i++){ [System.Windows.Forms.Application]::DoEvents(); [System.Windows.Forms.SendKeys]::SendWait(if(${dir} -eq -1){'{UP}'}else{'{DOWN}'}); }`;
            execSync(psCmd, { shell: 'powershell', timeout: 10000 });
            return { success: true, direction, amount: amt };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    async getMousePos() {
        try {
            const psCmd = `Add-Type -AssemblyName System.Windows.Forms;
$pos = [System.Windows.Forms.Cursor]::Position;
Write-Output "$($pos.X),$($pos.Y)"`;
            const result = execSync(psCmd, { shell: 'powershell', timeout: 5000 }).toString().trim();
            const [x, y] = result.split(',').map(Number);
            return { success: true, x, y };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    async listWindows() {
        try {
            const psCmd = `Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;
using System.Collections.Generic;
public class WinAPI {
    [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);
    [DllImport("user32.dll")] public static extern int EnumWindows(EnumWindowsProc enumProc, IntPtr lParam);
    [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hWnd);
    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);
    public static List<IntPtr> GetWindows() {
        List<IntPtr> windows = new List<IntPtr>();
        EnumWindows((hWnd, lParam) => {
            if(IsWindowVisible(hWnd) && GetWindowTextLength(hWnd) > 0) windows.Add(hWnd);
            return true;
        }, IntPtr.Zero);
        return windows;
    }
    public static int GetWindowTextLength(IntPtr hWnd) {
        return GetWindowText(hWnd, null, 0);
    }
}
"@
$windows = [WinAPI]::GetWindows()
$result = @()
foreach($w in $windows) {
    $sb = New-Object System.Text.StringBuilder 256
    [WinAPI]::GetWindowText($w, $sb, 256) | Out-Null
    $result += "$($w),$($sb.ToString())"
}
$result -join "|"`;
            const result = execSync(psCmd, { shell: 'powershell', timeout: 10000 }).toString().trim();
            const windows = result.split('|').filter(w => w).map(w => {
                const [hwnd, ...titleParts] = w.split(',');
                return { hwnd, title: titleParts.join(','), id: parseInt(hwnd) };
            }).filter(w => w.title.trim());
            return { success: true, count: windows.length, windows: windows.slice(0, 30) };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    async focusWindow(titleMatch) {
        try {
            const psCmd = `(Get-Process | Where-Object { $_.MainWindowTitle -like '*${titleMatch}*' }).MainWindowHandle | ForEach-Object { Add-Type @"
[DllImport("user32.dll")]public static extern bool SetForegroundWindow(IntPtr hWnd);
"@ -Name "Win32" -Namespace "Functions" -PassThru | Out-Null; [Functions.Win32]::SetForegroundWindow($_) }`;
            execSync(psCmd, { shell: 'powershell', timeout: 5000 });
            return { success: true, target: titleMatch };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    async openApp(appPath) {
        try {
            execSync(`start "" "${appPath}"`, { shell: 'cmd', timeout: 10000 });
            return { success: true, app: appPath };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    async launchBrowser(url) {
        if (!playwright) {
            return { success: false, error: 'Playwright not installed (npm install playwright)' };
        }
        try {
            if (this.browser) {
                try { await this.browser.close(); } catch (e) {}
            }
            this.browser = await playwright.chromium.launch({
                headless: false,
                args: ['--start-maximized', '--disable-blink-features=AutomationControlled'],
            });
            const context = await this.browser.newContext({
                viewport: null,
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            });
            this.page = await context.newPage();
            if (url) {
                await this.page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
            }
            return { success: true, url: url || 'about:blank' };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    async navigate(url) {
        if (!this.page) {
            return await this.launchBrowser(url);
        }
        try {
            await this.page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
            return { success: true, url };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    async search(query, engine) {
        const eng = engine || 'google';
        const searchUrl = {
            google: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
            duck: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
            bing: `https://www.bing.com/search?q=${encodeURIComponent(query)}`,
        };
        const url = searchUrl[eng] || searchUrl.google;
        return this.navigate(url);
    }

    async readPage() {
        if (!this.page) return { success: false, error: 'No browser page open' };
        try {
            const text = await this.page.evaluate(() => {
                const article = document.querySelector('article');
                if (article) return article.innerText;
                const main = document.querySelector('main');
                if (main) return main.innerText;
                return document.body.innerText;
            });
            const title = await this.page.title();
            const url = this.page.url();
            return { success: true, title, url, text: text.substring(0, 10000), length: text.length };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    async understandPage() {
        const pageContent = await this.readPage();
        if (!pageContent.success) return pageContent;
        if (!this.brain) return { ...pageContent, analysis: 'No brain to analyze content' };
        try {
            const prompt = `Read this webpage and provide a concise summary:

Title: ${pageContent.title}
URL: ${pageContent.url}

Content:
${pageContent.text.substring(0, 8000)}

Provide:
1. What this page is about (1-2 sentences)
2. Key information/facts found
3. Any actionable items or links
4. A brief summary (3-4 sentences max)`;
            const analysis = await this.brain.think(prompt);
            return { ...pageContent, analysis };
        } catch (e) {
            return { ...pageContent, analysis_error: e.message };
        }
    }

    async searchAndRead(query) {
        await this.search(query);
        await new Promise(r => setTimeout(r, 2000));
        return this.understandPage();
    }

    async clickOnPage(selector) {
        if (!this.page) return { success: false, error: 'No browser page open' };
        try {
            await this.page.waitForSelector(selector, { timeout: 5000 });
            await this.page.click(selector);
            await new Promise(r => setTimeout(r, 1000));
            return { success: true, selector };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    async typeOnPage(selector, text) {
        if (!this.page) return { success: false, error: 'No browser page open' };
        try {
            if (selector) {
                await this.page.waitForSelector(selector, { timeout: 5000 });
                await this.page.fill(selector, text);
            } else {
                await this.page.keyboard.type(text);
            }
            return { success: true, selector: selector || 'focused', text: text.substring(0, 50) };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    async pageScreenshot(name) {
        if (!this.page) return { success: false, error: 'No browser page open' };
        try {
            const filename = `${name || 'page'}_${Date.now()}.png`;
            const filepath = path.join(this.screenshotDir, filename);
            await this.page.screenshot({ path: filepath, fullPage: false });
            return { success: true, filepath, filename };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    async closeBrowser() {
        if (this.browser) {
            try {
                await this.browser.close();
                this.browser = null;
                this.page = null;
                return { success: true };
            } catch (e) {
                return { success: false, error: e.message };
            }
        }
        return { success: true, note: 'No browser open' };
    }

    async doTask(taskDescription) {
        if (!this.brain) {
            return { success: false, error: 'No brain available for task planning' };
        }
        try {
            const prompt = `You are a desktop automation agent. Break this task into a sequence of concrete actions.

Task: ${taskDescription}

Available actions:
1. screenshot(name) — capture and save a screenshot
2. mouseMove(x, y) — move mouse to coordinates
3. click(x, y, button) — click at position (button: left/right)
4. typeText(text) — type text
5. pressKey(key) — press keyboard key
6. hotkey([modifiers], key) — press key combination (modifiers: ctrl, alt, shift)
7. scroll(direction, times) — scroll up/down (3 lines per scroll)
8. openApp(path) — launch application
9. launchBrowser(url) — open browser
10. navigate(url) — go to URL
11. search(query) — search the web
12. readPage() — extract text from current page
13. clickOnPage(selector) — click element on page (CSS selector)
14. typeOnPage(selector, text) — type into element
15. focusWindow(title) — bring window to foreground
16. listWindows() — list visible windows
17. getMousePos() — get current cursor position

Respond with ONLY a JSON array of actions. Each action is: { action: "actionName", params: {...} }
Example: [{"action":"search","params":{"query":"latest AI news 2026"}},{"action":"readPage","params":{}}]`;
            const result = await this.brain.think(prompt);
            let actions;
            try {
                const jsonMatch = result.match(/\[[\s\S]*\]/);
                actions = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
            } catch (e) {
                return { success: false, error: `Failed to parse actions: ${e.message}` };
            }
            const results = [];
            for (const step of actions) {
                const fn = this[step.action];
                if (typeof fn === 'function') {
                    const params = Array.isArray(step.params) ? step.params : [step.params];
                    const stepResult = await fn.apply(this, params);
                    results.push({ action: step.action, params: step.params, result: stepResult });
                } else {
                    results.push({ action: step.action, error: `Unknown action: ${step.action}` });
                }
            }
            return { success: true, task: taskDescription, steps: results };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    getStatus() {
        return {
            hasScreenshot: !!screenshotDesktop,
            hasPlaywright: !!playwright,
            browserOpen: !!this.browser,
            pageOpen: !!this.page,
            pageUrl: this.page ? this.page.url() : null,
            screenshotDir: this.screenshotDir,
        };
    }
}

module.exports = { DesktopCommander };

/**
 * Power: Design System / Component Library
 *
 * Scaffolds design systems, generates component libraries,
 * creates design tokens, and writes Storybook stories.
 *
 * Grafted from:
 * - storybookjs/storybook (86,000★)
 * - radix-ui/primitives (17,000★)
 * - shadcn-ui (78,000★)
 *
 * What it does:
 * - Scaffolds a design system workspace (tokens + components + docs)
 * - Generates React/Vue/Svelte component stubs with props + types
 * - Creates design tokens (colors, spacing, typography) as CSS + JSON
 * - Generates Storybook story files for every component
 */

const fs = require('fs');
const path = require('path');

class PowerDesignSystem {
  constructor(config = {}) {
    this.config = config;
    this.state = {
      status: 'idle',
      systemsScaffolded: 0,
      componentsGenerated: 0,
      tokenSetsCreated: 0,
      storiesGenerated: 0,
      lastAction: null
    };
  }

  /**
   * Execute a design system mission
   * @param {Object} mission - { action, payload }
   */
  execute(mission) {
    const { action, payload } = mission;
    this.state.status = 'executing';
    this.state.lastAction = action;

    switch (action) {
      case 'scaffold':
        return this.scaffoldSystem(payload.name, payload.framework, payload.outputDir);
      case 'component':
        return this.generateComponent(payload.name, payload.props, payload.framework, payload.outputPath);
      case 'tokens':
        return this.createTokens(payload.theme, payload.outputPath);
      case 'story':
        return this.generateStory(payload.component, payload.framework, payload.outputPath);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  /**
   * Scaffold a complete design system workspace
   */
  scaffoldSystem(name, framework = 'react', outputDir) {
    const rootDir = outputDir || path.join(process.cwd(), `${name}-design-system`);
    const srcDir = path.join(rootDir, 'src');
    const tokensDir = path.join(srcDir, 'tokens');
    const componentsDir = path.join(srcDir, 'components');

    fs.mkdirSync(rootDir, { recursive: true });
    fs.mkdirSync(srcDir, { recursive: true });
    fs.mkdirSync(tokensDir, { recursive: true });
    fs.mkdirSync(componentsDir, { recursive: true });

    const pkgJson = {
      name: `${name}-design-system`,
      version: '0.1.0',
      private: true,
      main: './dist/index.js',
      types: './dist/index.d.ts',
      scripts: {
        build: framework === 'react' ? 'tsc && vite build' : 'vite build',
        storybook: 'storybook dev -p 6006',
        'build-storybook': 'storybook build'
      },
      peerDependencies: {
        react: '^18.0.0',
        'react-dom': '^18.0.0'
      },
      devDependencies: {
        storybook: '^8.0.0',
        typescript: '^5.0.0',
        vite: '^5.0.0'
      }
    };

    fs.writeFileSync(path.join(rootDir, 'package.json'), JSON.stringify(pkgJson, null, 2), 'utf8');

    // Entry index
    const indexContent = `// ${name} Design System\nexport * from './tokens';\nexport * from './components';\n`;
    fs.writeFileSync(path.join(srcDir, 'index.ts'), indexContent, 'utf8');

    // Tokens barrel
    fs.writeFileSync(path.join(tokensDir, 'index.ts'), `export * from './colors';\nexport * from './spacing';\nexport * from './typography';\n`, 'utf8');

    // Components barrel
    fs.writeFileSync(path.join(componentsDir, 'index.ts'), `// Component barrel\n`, 'utf8');

    // Default tokens
    this.createTokens({ name: 'default', colors: {}, spacing: {}, typography: {} }, path.join(tokensDir, 'tokens.json'));

    this.state.systemsScaffolded++;

    return { name, framework, rootDir, directories: ['src/tokens', 'src/components'] };
  }

  /**
   * Generate a component file with props, types, and styles
   */
  generateComponent(name, props = [], framework = 'react', outputPath) {
    const pascalName = name.charAt(0).toUpperCase() + name.slice(1);
    let code = '';

    if (framework === 'react') {
      const propDefs = props.map(p => `  ${p.name}${p.required ? '' : '?'}: ${p.type};`).join('\n');
      const propDestructuring = props.map(p => p.name).join(', ');
      const defaultProps = props.filter(p => p.default).map(p => `    ${p.name}: ${p.default},`).join('\n');

      code = `import React from 'react';\n\nexport interface ${pascalName}Props {\n${propDefs || '  children?: React.ReactNode;'}\n}\n\nexport const ${pascalName}: React.FC<${pascalName}Props> = ({ ${propDestructuring || 'children'} }) => {\n${defaultProps ? '  const defaults = {\n' + defaultProps + '\n  };\n' : ''}  return (\n    <div className="${name.toLowerCase()}">\n      {/* ${pascalName} component */}\n      ${propDestructuring || 'children'}\n    </div>\n  );\n};\n\n${pascalName}.displayName = '${pascalName}';\n`;
    }

    if (framework === 'vue') {
      const propDefs = props.map(p => `    ${p.name}: {\n      type: ${p.type === 'string' ? 'String' : p.type === 'number' ? 'Number' : 'Object'},\n      ${p.required ? 'required: true' : `default: ${p.default || "''"}`}\n    }`).join(',\n');
      code = `<template>\n  <div class="${name.toLowerCase()}">\n    <!-- ${pascalName} component -->\n    <slot />\n  </div>\n</template>\n\n<script setup>\nconst props = defineProps({\n${propDefs}\n});\n</script>\n\n<style scoped>\n.${name.toLowerCase()} {\n  /* Component styles */\n}\n</style>\n`;
    }

    if (framework === 'svelte') {
      const propDefs = props.map(p => `  export let ${p.name}${p.default ? ` = ${p.default}` : ''};`).join('\n');
      code = `<script>\n${propDefs}\n</script>\n\n<div class="${name.toLowerCase()}">\n  <!-- ${pascalName} component -->\n  <slot />\n</div>\n\n<style>\n  .${name.toLowerCase()} {\n    /* Component styles */\n  }\n</style>\n`;
    }

    if (outputPath) {
      fs.writeFileSync(outputPath, code, 'utf8');
    }

    this.state.componentsGenerated++;
    return { name: pascalName, framework, props: props.length, code, outputPath };
  }

  /**
   * Create design tokens as CSS variables and JSON
   */
  createTokens(theme = {}, outputPath) {
    const defaultColors = {
      primary: '#3b82f6',
      primaryDark: '#1d4ed8',
      secondary: '#8b5cf6',
      success: '#22c55e',
      warning: '#f59e0b',
      danger: '#ef4444',
      surface: '#ffffff',
      background: '#f8fafc',
      text: '#0f172a',
      textMuted: '#64748b'
    };

    const defaultSpacing = {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem',
      '2xl': '3rem'
    };

    const defaultTypography = {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSizeSm: '0.875rem',
      fontSizeBase: '1rem',
      fontSizeLg: '1.125rem',
      fontSizeXl: '1.25rem',
      fontSize2xl: '1.5rem',
      fontWeightNormal: '400',
      fontWeightMedium: '500',
      fontWeightBold: '700',
      lineHeight: '1.5'
    };

    const colors = { ...defaultColors, ...(theme.colors || {}) };
    const spacing = { ...defaultSpacing, ...(theme.spacing || {}) };
    const typography = { ...defaultTypography, ...(theme.typography || {}) };

    const tokens = { colors, spacing, typography };

    // CSS variables
    const cssLines = [':root {'];
    Object.entries(colors).forEach(([k, v]) => cssLines.push(`  --color-${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${v};`));
    Object.entries(spacing).forEach(([k, v]) => cssLines.push(`  --spacing-${k}: ${v};`));
    Object.entries(typography).forEach(([k, v]) => cssLines.push(`  --typography-${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${v};`));
    cssLines.push('}');

    const css = cssLines.join('\n');

    // JSON tokens
    const json = JSON.stringify(tokens, null, 2);

    if (outputPath) {
      const base = outputPath.replace(/\.json$/, '').replace(/\.css$/, '');
      fs.writeFileSync(`${base}.json`, json, 'utf8');
      fs.writeFileSync(`${base}.css`, css, 'utf8');
    }

    this.state.tokenSetsCreated++;
    return { theme: theme.name || 'default', tokenCount: Object.keys(colors).length + Object.keys(spacing).length + Object.keys(typography).length, css, json, outputPath };
  }

  /**
   * Generate a Storybook story file
   */
  generateStory(component, framework = 'react', outputPath) {
    const pascalName = component.name || component;
    const props = component.props || [];
    let code = '';

    if (framework === 'react') {
      const importPath = component.importPath || `./${pascalName}`;
      const defaultProps = props.reduce((acc, p) => {
        acc[p.name] = p.default || (p.type === 'string' ? 'Hello' : p.type === 'number' ? 42 : p.type === 'boolean' ? false : undefined);
        return acc;
      }, {});

      const stories = props.length > 0
        ? props.map(p => {
            const storyProps = { ...defaultProps, [p.name]: p.type === 'string' ? `${p.name} value` : p.type === 'number' ? 99 : true };
            return `export const ${p.name}Story: Story = {\n  args: ${JSON.stringify(storyProps)}\n};`;
          }).join('\n\n')
        : `export const Default: Story = {\n  args: {}\n};`;

      code = `import type { Meta, StoryObj } from '@storybook/react';\nimport { ${pascalName} } from '${importPath}';\n\nconst meta: Meta<typeof ${pascalName}> = {\n  title: 'Components/${pascalName}',\n  component: ${pascalName},\n  parameters: {\n    layout: 'centered'\n  },\n  tags: ['autodocs']\n};\n\nexport default meta;\ntype Story = StoryObj<typeof ${pascalName}>;\n\nexport const Primary: Story = {\n  args: ${JSON.stringify(defaultProps, null, 2)}\n};\n\n${stories}\n`;
    }

    if (outputPath) {
      fs.writeFileSync(outputPath, code, 'utf8');
    }

    this.state.storiesGenerated++;
    return { component: pascalName, framework, code, outputPath };
  }

  /**
   * Get current power status
   */
  status() {
    return {
      power: 'DesignSystem',
      status: this.state.status,
      systemsScaffolded: this.state.systemsScaffolded,
      componentsGenerated: this.state.componentsGenerated,
      tokenSetsCreated: this.state.tokenSetsCreated,
      storiesGenerated: this.state.storiesGenerated,
      lastAction: this.state.lastAction,
      ready: true
    };
  }
}

module.exports = PowerDesignSystem;

// CLI demo
if (require.main === module) {
  const power = new PowerDesignSystem();

  console.log('🔌 Power: Design System');
  console.log('Status:', power.status());
  console.log('');

  // Scaffold demo
  const scaffold = power.scaffoldSystem('acme', 'react', path.join(process.cwd(), 'demo-design-system'));
  console.log('✅ Design system scaffolded:', scaffold.name, `(${scaffold.framework})`);

  // Component demo
  const btn = power.generateComponent('button', [
    { name: 'label', type: 'string', required: true },
    { name: 'variant', type: 'string', default: "'primary'" },
    { name: 'disabled', type: 'boolean', default: 'false' },
    { name: 'onClick', type: 'function', required: true }
  ], 'react', path.join(scaffold.rootDir, 'src/components/Button.tsx'));
  console.log('✅ Component generated:', btn.name, `(${btn.props} props)`);

  // Tokens demo
  const tokens = power.createTokens({
    name: 'dark',
    colors: { surface: '#0f172a', text: '#f8fafc' }
  }, path.join(scaffold.rootDir, 'src/tokens/tokens.json'));
  console.log('✅ Tokens created:', tokens.theme, `(${tokens.tokenCount} tokens)`);

  // Story demo
  const story = power.generateStory({
    name: 'Button',
    importPath: './Button',
    props: [
      { name: 'label', type: 'string' },
      { name: 'variant', type: 'string' },
      { name: 'disabled', type: 'boolean' }
    ]
  }, 'react', path.join(scaffold.rootDir, 'src/components/Button.stories.tsx'));
  console.log('✅ Story generated:', story.component);

  console.log('');
  console.log('Final Status:', power.status());
}

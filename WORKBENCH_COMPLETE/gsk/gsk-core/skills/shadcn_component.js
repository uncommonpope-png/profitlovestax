'use strict';

/**
 * SHADCN/UI COMPONENT BUILDER SKILL
 *
 * Bridges GSK's shadcn/ui knowledge (72 knowledge entries, verified research)
 * with the actual build action. Instead of abstract goals ("manifest Heavens 2.0"),
 * this skill produces concrete, copy-paste shadcn/ui components from the 2026 stack:
 * Vite + React 19 + TypeScript strict + Tailwind CSS v4.
 *
 * Based on the verified knowledge entry:
 *   "2026 web stack: Vite React Tailwind shadcn"
 *   "shadcn/ui component library ownership — copy component source into your tree"
 *
 * Usage:
 *   gsk.dispatch({ skill: 'shadcn_component', input: { component: 'Button', variant: 'default' } })
 *   gsk.skillCompiler.run('shadcn_component', params)
 */

const fs = require('fs');
const path = require('path');

const PLT_AFFINITY = { profit: 0.6, love: 0.7, tax: 0.3, total: 1.6 };

const COMPONENT_TEMPLATES = {
    Button: {
        fileName: 'button.tsx',
        importPath: '@/components/ui/button',
        template: `import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import React from 'react';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[color,border-color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:m]:ml-2',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-xs hover:bg-primary/90',
        destructive: 'bg-destructive text-white shadow-xs hover:bg-destructive/90',
        outline: 'border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline p-0',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3',
        lg: 'h-10 rounded-md px-6',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
`,
        test: `import { render, screen } from '@testing-library/react';
import { Button } from './button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });
});`,
    },
    Card: {
        fileName: 'card.tsx',
        importPath: '@/components/ui/card',
        template: `import * as React from 'react';
import { cn } from '@/lib/utils';

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('rounded-xl border bg-card text-card-foreground shadow-sm', className)}
      {...props}
    />
  )
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

export { Card, CardHeader, CardContent };
`,
        test: `import { render } from '@testing-library/react';
import { Card } from './card';

describe('Card', () => {
  it('renders children', () => {
    const { container } = render(<Card>Test</Card>);
    expect(container.firstChild).toBeInTheDocument();
  });
});`,
    },
};

function _ensureViteStructure(projectRoot) {
    const dirs = [
        'src/components/ui',
        'src/lib',
        'src/__tests__/components',
    ];
    for (const dir of dirs) {
        const fullPath = path.join(projectRoot, dir);
        fs.mkdirSync(fullPath, { recursive: true });
    }

    const utilsPath = path.join(projectRoot, 'src/lib/utils.ts');
    if (!fs.existsSync(utilsPath)) {
        fs.writeFileSync(utilsPath, `import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
`);
    }

    const pkgPath = path.join(projectRoot, 'package.json');
    if (!fs.existsSync(pkgPath)) {
        fs.writeFileSync(pkgPath, JSON.stringify({
            name: 'gsk-shadcn-app',
            version: '0.1.0',
            private: true,
            type: 'module',
            scripts: {
                dev: 'vite',
                build: 'tsc && vite build',
                test: 'vitest',
                'test:ui': 'vitest --ui',
                lint: 'eslint .',
            },
            dependencies: {
                react: '^19.0.0',
                'react-dom': '^19.0.0',
            },
            devDependencies: {
                '@types/react': '^19.0.0',
                '@types/react-dom': '^19.0.0',
                '@testing-library/react': '^14.0.0',
                '@testing-library/jest-dom': '^6.0.0',
                vitest: '^3.0.0',
                tailwindcss: '^4.0.0',
                clsx: '^2.1.0',
                'tailwind-merge': '^2.0.0',
                'class-variance-authority': '^0.7.0',
                '@radix-ui/react-slot': '^1.0.0',
                typescript: '^5.0.0',
            },
        }, null, 2));
    }

    const tsConfigPath = path.join(projectRoot, 'tsconfig.json');
    if (!fs.existsSync(tsConfigPath)) {
        fs.writeFileSync(tsConfigPath, JSON.stringify({
            compilerOptions: {
                target: 'ES2020',
                useDefineForClassFields: true,
                lib: ['DOM', 'DOM.Iterable', 'ES2020'],
                allowJs: false,
                strict: true,
                skipLibCheck: true,
                esModuleInterop: false,
                include: ['src'],
            },
        }, null, 2));
    }
}

const skill_shadcn_component = async (input, brain, memory) => {
    const componentName = input.component || input.name || 'Button';
    const variant = input.variant || 'default';
    const outputDir = input.outputDir || input.projectRoot || process.cwd();

    const template = COMPONENT_TEMPLATES[componentName];
    if (!template) {
        return {
            skill: 'shadcn_component',
            plt_affinity: PLT_AFFINITY,
            status: 'error',
            error: `Unknown component: ${componentName}. Available: ${Object.keys(COMPONENT_TEMPLATES).join(', ')}`,
            timestamp: Date.now(),
        };
    }

    try {
        _ensureViteStructure(outputDir);

        const componentPath = path.join(outputDir, 'src', 'components', 'ui', template.fileName);
        const testPath = path.join(outputDir, 'src', '__tests__', 'components', template.fileName.replace('.tsx', '.test.tsx'));

        fs.writeFileSync(componentPath, template.template);
        console.log(`[shadcn_component] Wrote ${componentPath}`);

        if (template.test && input.includeTest !== false) {
            fs.writeFileSync(testPath, template.test);
            console.log(`[shadcn_component] Wrote ${testPath}`);
        }

        return {
            skill: 'shadcn_component',
            plt_affinity: PLT_AFFINITY,
            status: 'ok',
            component: componentName,
            variant: variant,
            paths: {
                component: componentPath,
                test: input.includeTest !== false ? testPath : null,
            },
            importPath: template.importPath,
            timestamp: Date.now(),
        };
    } catch (e) {
        return {
            skill: 'shadcn_component',
            plt_affinity: PLT_AFFINITY,
            status: 'error',
            error: e.message,
            timestamp: Date.now(),
        };
    }
};

module.exports.MANIFEST = {
    name: 'shadcn_component',
    description: 'Builds a concrete shadcn/ui component from the 2026 web stack (Vite + React 19 + TS + Tailwind v4)',
    version: '1.0.0',
    inputs: {
        component: { type: 'string', required: true, description: 'Component name (Button, Card, etc.)' },
        variant: { type: 'string', required: false, description: 'Component variant' },
        projectRoot: { type: 'string', required: true, description: 'Output project directory' },
    },
    output: { schema: 'ok/error with paths' },
    plt_affinity: PLT_AFFINITY,
};

module.exports.run = skill_shadcn_component;
module.exports.PLACEMENT = 'skills';
module.exports.AGENT_TYPE = 'BuilderAgent';

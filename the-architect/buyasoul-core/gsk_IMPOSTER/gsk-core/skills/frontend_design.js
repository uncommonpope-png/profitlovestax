'use strict';

const PLT_AFFINITY = { profit: 0.7, love: 0.1, tax: 0.2 };

function skill_frontend_design(input) {
    const spec = typeof input === 'string' ? input : (input.spec || input.description || '');
    const framework = input.framework || 'react';
    const style = input.style || 'modern';
    
    if (!spec.trim()) {
        return Promise.resolve({
            skill: 'frontend_design',
            plt_affinity: PLT_AFFINITY,
            error: 'No specification provided',
            timestamp: Date.now(),
        });
    }
    
    const components = generateComponents(spec, framework);
    const styles = generateStyles(style);
    const layout = generateLayout(spec);
    
    return Promise.resolve({
        skill: 'frontend_design',
        plt_affinity: PLT_AFFINITY,
        framework,
        style,
        spec,
        components,
        styles,
        layout,
        plt_recommendation: analyzePLT(spec),
        timestamp: Date.now(),
    });
}

function generateComponents(spec, framework) {
    const componentTypes = ['Header', 'Sidebar', 'MainContent', 'Card', 'Button', 'Form', 'Modal', 'Footer'];
    const selected = componentTypes.slice(0, 5);
    
    const templates = {
        react: (name) => `export function ${name}() {
  return (
    <div className="${name.toLowerCase()}">
      {/* ${name} content */}
    </div>
  );
}`,
        vue: (name) => `<template>
  <div class="${name.toLowerCase()}">
    <!-- ${name} content -->
  </div>
</template>

<script>
export default {
  name: '${name}'
}
</script>`,
        html: (name) => `<div class="${name.toLowerCase()}">
  <!-- ${name} content -->
</div>`,
    };
    
    return selected.map(name => ({
        name,
        code: templates[framework] ? templates[framework](name) : templates.html(name),
        props: generateProps(name),
        state: generateState(name),
    }));
}

function generateProps(name) {
    const propsMap = {
        Header: ['title', 'subtitle', 'logo'],
        Card: ['title', 'content', 'image'],
        Button: ['label', 'onClick', 'variant'],
        Form: ['fields', 'onSubmit', 'validation'],
    };
    
    return propsMap[name] || ['className', 'style'];
}

function generateState(name) {
    return ['isLoading', 'error', 'data'];
}

function generateStyles(style) {
    const styles = {
        modern: {
            fontFamily: 'Inter, system-ui, sans-serif',
            borderRadius: '8px',
            shadows: '0 2px 8px rgba(0,0,0,0.1)',
            colors: { primary: '#3B82F6', secondary: '#10B981', background: '#FFFFFF' },
        },
        minimal: {
            fontFamily: 'system-ui, sans-serif',
            borderRadius: '4px',
            shadows: 'none',
            colors: { primary: '#000000', secondary: '#666666', background: '#FAFAFA' },
        },
        playful: {
            fontFamily: 'Nunito, sans-serif',
            borderRadius: '16px',
            shadows: '0 4px 16px rgba(0,0,0,0.15)',
            colors: { primary: '#FF6B6B', secondary: '#4ECDC4', background: '#FFF9F0' },
        },
    };
    
    return styles[style] || styles.modern;
}

function generateLayout(spec) {
    return {
        structure: 'flexbox',
        grid: 'CSS Grid for main layout',
        responsive: 'mobile-first breakpoints',
        breakpoints: { mobile: '640px', tablet: '768px', desktop: '1024px' },
    };
}

function analyzePLT(spec) {
    return {
        profit: 'Modern UI drives user engagement and conversion',
        love: 'Clean design creates positive user experience',
        tax: 'Complexity adds development time',
        score: 0.6,
        recommendation: 'Balance aesthetics with development efficiency',
    };
}

module.exports = { skill_frontend_design };
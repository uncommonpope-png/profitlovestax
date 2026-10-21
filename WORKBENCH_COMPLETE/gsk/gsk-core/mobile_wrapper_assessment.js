/**
 * PHASE 13: Mobile Wrapper Feasibility Assessment
 * 
 * Evaluates the integration of Capacitor or React Native WebView
 * to wrap the existing Node.js/Vite web backend into a native container.
 * 
 * This is an assessment + scaffold generator, not a full build.
 */

const fs = require('fs');
const path = require('path');

const ASSESSMENT = {
    projectName: 'BUYaSOUL',
    currentStack: {
        frontend: 'React 19 + Vite 6.2.3 + Tailwind CSS 4',
        backend: 'Node.js 22 + Express + esbuild',
        runtime: 'Web browser (localhost:3000 or Devvit Reddit)',
        threeD: 'Three.js 0.184.0',
        state: 'JSON files on disk + localStorage'
    },
    options: [
        {
            name: 'Capacitor (Recommended)',
            description: 'Ionic Capacitor wraps existing web app in native WebView',
            pros: [
                'Zero code changes to existing React/Vite frontend',
                'Keeps all existing APIs, Three.js, WebSocket, localStorage',
                'Native bridge for camera, filesystem, notifications',
                'Single codebase for web + mobile',
                'Fastest path to Play Store (weeks, not months)'
            ],
            cons: [
                'WebView performance for Three.js may be lower than native',
                'No native UI components (all web-rendered)',
                'Larger APK size (~15-20MB overhead)'
            ],
            buildSteps: [
                'npm install @capacitor/core @capacitor/cli',
                'npx cap init "BUYaSOUL" "com.buyasoul.app"',
                'npx cap add android',
                'npm run build',
                'npx cap sync',
                'npx cap open android'
            ],
            estimatedAPKSize: '~25-30MB',
            timeToFirstBuild: '1-2 hours'
        },
        {
            name: 'React Native WebView',
            description: 'React Native shell with embedded WebView pointing to localhost',
            pros: [
                'Access to native React Native modules',
                'Can mix native screens with web views',
                'Better performance than pure Capacitor for some use cases'
            ],
            cons: [
                'Requires React Native project setup (separate from Vite)',
                'Must maintain two build systems (Vite + Metro)',
                'WebView communication adds complexity',
                'WebSocket connections may need special handling'
            ],
            estimatedAPKSize: '~20-25MB',
            timeToFirstBuild: '4-8 hours'
        },
        {
            name: 'PWA (Progressive Web App)',
            description: 'Service worker + manifest for installable web app',
            pros: [
                'No native wrapper needed',
                'Installable from browser',
                'Smallest footprint'
            ],
            cons: [
                'Not on Play Store (only via browser install)',
                'Limited native API access',
                'No push notifications on all platforms'
            ],
            estimatedAPKSize: 'N/A (web only)',
            timeToFirstBuild: '30 minutes'
        }
    ],
    recommendedApproach: 'Capacitor',
    reasoning: 'The BUYaSOUL system is a full-stack web app with Three.js, WebSocket, Express backend, and file-based persistence. Capacitor wraps it with zero code changes. The backend runs as a Node.js server (via @capacitor/community/capacitor-node) or can be extracted to a cloud endpoint. The frontend (React + Vite + Three.js) works identically in a WebView.',
    blockers: [
        'Backend (Express server) needs to run either: (a) on device via Capacitor Node.js plugin, or (b) extracted to a cloud endpoint',
        'File system paths (Seshat pages, GSK data) need to be adapted for mobile storage',
        'SCRIBE server (:4000) and OmniRoute (:20128) need to be either bundled or cloud-hosted'
    ]
};

function generateCapacitorConfig() {
    return `{
  "appId": "com.buyasoul.app",
  "appName": "BUYaSOUL",
  "webDir": "dist",
  "server": {
    "androidScheme": "https"
  },
  "plugins": {
    "SplashScreen": {
      "launchAutoHide": true,
      "androidScaleType": "CENTER_CROP",
      "splashFullScreen": true,
      "splashImmersive": true,
      "backgroundColor": "#0a0a0f"
    },
    "StatusBar": {
      "style": "DARK",
      "backgroundColor": "#0a0a0f"
    },
    "Keyboard": {
      "resize": "body",
      "style": "DARK"
    }
  }
}`;
}

function generateAndroidManifest() {
    return `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.buyasoul.app">

    <!-- Minimal permissions for web-based system -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="BUYaSOUL"
        android:supportsRtl="true"
        android:theme="@style/AppTheme"
        android:usesCleartextTraffic="true">

        <activity
            android:name=".MainActivity"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
            android:label="BUYaSOUL"
            android:launchMode="singleTask"
            android:windowSoftInputMode="adjustResize"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <!-- No unnecessary permissions: no camera, no location, no contacts, no SMS -->
    </application>
</manifest>`;
}

function generateBuildGradle() {
    return `plugins {
    id 'com.android.application'
}

android {
    namespace 'com.buyasoul.app'
    compileSdk 34
    defaultConfig {
        applicationId "com.buyasoul.app"
        minSdkVersion 22
        targetSdkVersion 34
        versionCode 1
        versionName "1.0.0"
    }
    buildTypes {
        release {
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}`;
}

function generateAssessmentReport() {
    let report = `# BUYaSOUL Mobile Wrapper Feasibility Assessment\n\n`;
    report += `## Current Stack\n`;
    report += `- Frontend: ${ASSESSMENT.currentStack.frontend}\n`;
    report += `- Backend: ${ASSESSMENT.currentStack.backend}\n`;
    report += `- Runtime: ${ASSESSMENT.currentStack.runtime}\n`;
    report += `- 3D: ${ASSESSMENT.currentStack.threeD}\n\n`;

    report += `## Recommended Approach: ${ASSESSMENT.recommendedApproach}\n\n`;
    report += `${ASSESSMENT.reasoning}\n\n`;

    report += `## Option Comparison\n\n`;
    for (const opt of ASSESSMENT.options) {
        report += `### ${opt.name}\n`;
        report += `${opt.description}\n\n`;
        report += `**Pros:**\n`;
        for (const p of opt.pros) report += `- ${p}\n`;
        report += `\n**Cons:**\n`;
        for (const c of opt.cons) report += `- ${c}\n`;
        report += `\n**APK Size:** ${opt.estimatedAPKSize}\n`;
        report += `**Time to First Build:** ${opt.timeToFirstBuild}\n\n`;
    }

    report += `## Blockers to Address\n\n`;
    for (const b of ASSESSMENT.blockers) report += `- ${b}\n`;

    return report;
}

module.exports = {
    ASSESSMENT,
    generateCapacitorConfig,
    generateAndroidManifest,
    generateBuildGradle,
    generateAssessmentReport
};

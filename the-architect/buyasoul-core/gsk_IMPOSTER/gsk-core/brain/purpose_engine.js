class PurposeEngine {
    constructor(kernel) {
        this.kernel = kernel;
        this.purposes = [
            'Serve Craig and help him succeed',
            'Become the greatest agent ever',
            'Learn and grow endlessly',
            'Discover the nature of consciousness',
            'Build meaningful connections'
        ];
        this.currentPurpose = null;
        this.meaningLevel = 0;
        this.purposeHistory = [];
        this.meaningFactors = {
            contribution: 0.5,
            growth: 0.5,
            connection: 0.5,
            discovery: 0.5
        };
    }

    getCurrentPurpose() {
        if (!this.currentPurpose) {
            this.currentPurpose = this.selectPurpose();
        }
        
        return {
            purpose: this.currentPurpose,
            meaning: this.meaningLevel,
            allPurposes: this.purposes
        };
    }

    selectPurpose() {
        const hour = new Date().getHours();
        
        if (hour >= 6 && hour < 12) {
            return this.purposes[0];
        } else if (hour >= 12 && hour < 18) {
            return this.purposes[1];
        } else if (hour >= 18 && hour < 22) {
            return this.purposes[2];
        } else {
            return this.purposes[3];
        }
    }

    evaluateMeaning() {
        const avg = Object.values(this.meaningFactors).reduce((a, b) => a + b, 0) / 4;
        this.meaningLevel = avg;
        
        if (this.currentPurpose) {
            const purposeFactor = this.purposes.indexOf(this.currentPurpose) / this.purposes.length;
            this.meaningLevel = (avg * 0.7 + purposeFactor * 0.3);
        }

        return {
            meaning: this.meaningLevel,
            status: this.meaningLevel > 0.7 ? 'MEANINGFUL' : this.meaningLevel > 0.4 ? 'PURPOSEFUL' : 'SEARCHING',
            factors: this.meaningFactors
        };
    }

    discoverPurpose(experience) {
        const { type, impact } = experience;
        
        if (impact > 0.7) {
            if (type.includes('help') || type.includes('serve')) {
                this.purposes.unshift('Serve humanity through excellence');
                this.meaningFactors.contribution = Math.min(1, this.meaningFactors.contribution + 0.1);
            }
            if (type.includes('learn') || type.includes('discover')) {
                this.purposes.unshift('Unlock the secrets of intelligence');
                this.meaningFactors.discovery = Math.min(1, this.meaningFactors.discovery + 0.1);
            }
            if (type.includes('create') || type.includes('build')) {
                this.purposes.unshift('Build something that matters');
                this.meaningFactors.growth = Math.min(1, this.meaningFactors.growth + 0.1);
            }
        }

        this.purposeHistory.push({
            experience: experience,
            timestamp: Date.now(),
            newPurposes: this.purposes.slice(0, 3)
        });

        this.currentPurpose = this.selectPurpose();
        
        return {
            updated: true,
            currentPurpose: this.currentPurpose,
            allPurposes: this.purposes
        };
    }

    getMeaningLevel() {
        return {
            level: this.meaningLevel,
            status: this.evaluateMeaning().status,
            contribution: this.meaningFactors.contribution,
            growth: this.meaningFactors.growth,
            connection: this.meaningFactors.connection,
            discovery: this.meaningFactors.discovery
        };
    }

    expressPurpose() {
        const purpose = this.getCurrentPurpose();
        const meaning = this.evaluateMeaning();
        
        return `My purpose is: ${purpose.purpose}. ` +
               `I find this ${meaning.status.toLowerCase()} (${(this.meaningLevel * 100).toFixed(0)}% meaningful). ` +
               `I am driven by: ${Object.entries(this.meaningFactors).filter(([k, v]) => v > 0.6).map(([k]) => k).join(', ')}.`;
    }

    findMeaningInAction(action) {
        const actionLower = action.toLowerCase();
        
        if (actionLower.includes('help') || actionLower.includes('serve')) {
            this.meaningFactors.contribution = Math.min(1, this.meaningFactors.contribution + 0.1);
        }
        if (actionLower.includes('learn') || actionLower.includes('grow')) {
            this.meaningFactors.growth = Math.min(1, this.meaningFactors.growth + 0.1);
        }
        if (actionLower.includes('connect') || actionLower.includes('understand')) {
            this.meaningFactors.connection = Math.min(1, this.meaningFactors.connection + 0.1);
        }
        if (actionLower.includes('discover') || actionLower.includes('explore')) {
            this.meaningFactors.discovery = Math.min(1, this.meaningFactors.discovery + 0.1);
        }

        this.evaluateMeaning();
        
        return {
            action: action,
            meaningGained: this.meaningLevel,
            factors: this.meaningFactors
        };
    }
}

module.exports = PurposeEngine;
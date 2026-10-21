const { SyntheticEmotionEngine } = require('./synthetic_emotion_engine');

module.exports = {
  SyntheticEmotionEngine,
  defaultEngine: new SyntheticEmotionEngine()
};

module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // IMPORTANT:
    // - Do NOT apply legacy class-properties globally because it breaks RN's internal Flow-based DOM Event polyfill
    //   (it defines read-only Event.NONE via defineProperty and then the transform tries to assign to it).
    // - Apply decorators/class-properties ONLY to our WatermelonDB model files.
    overrides: [
      {
        test: ["./src/db/models/**/*.js"],
        plugins: [
          ["@babel/plugin-proposal-decorators", { legacy: true }],
          ["@babel/plugin-proposal-class-properties", { loose: true }],
        ],
      },
    ],
    plugins: [
      // must be LAST
      "react-native-reanimated/plugin",
    ],
  };
};

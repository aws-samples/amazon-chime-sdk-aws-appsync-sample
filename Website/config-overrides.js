// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

// ... so the webpack5 config used by react-scripts 5.0.0 
// doesn't like .mjs files, so we use react-scripts-rewire
// to add support for this (the aws appsync modules, for
// example, need this)
// See: https://github.com/graphql/graphql-js/issues/2721

module.exports = function override(config) {
    config.module.rules.push({
      test: /\.m?js/,
      resolve: {
          fullySpecified: false,
          fallback: {
              crypto: false
          }
      }
    });

    config.ignoreWarnings = [/Failed to parse source map/];
    return config;
}


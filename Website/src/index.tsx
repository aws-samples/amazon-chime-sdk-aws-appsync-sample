// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./containers/App";
import * as serviceWorker from "./serviceWorker";


import Amplify from 'aws-amplify';

const { region, userPoolId, userPoolWebClientId, identityPoolId } =
  // @ts-ignore
  window['runConfig'];

Amplify.configure({
  Auth: {
    region: region,
    userPoolId: userPoolId,
    userPoolWebClientId: userPoolWebClientId,
    identityPoolId: identityPoolId,
  }
});

ReactDOM.render(
  <React.StrictMode>
      <App />
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();

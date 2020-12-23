# Cross Talk Example Static Website

## Overview

The UI is written in Typescript and makes use of React as the core UI framework, and [NorthStar](https://northstar.aws-prototyping.cloud/) as the primary component library.

## Getting Started

### Define a local `runtime-config.js`

The UI requires `runtime-config.js` which specifies configuration values such as the Cognito user pool id.
When the UI is deployed via CDK, the `runtime-config.js` file is automatically generated and added to the
S3 bucket, but when running the UI locally we need a local copy.

Deploy the sandbox stack using CDK (see the README in the `Infra` directory in the root of this package), find the
S3 bucket the UI was deployed to, and download the `runtime-config.js`, copying it into the `public` directory in this
package. This will point your locally running UI resources in the sandbox stack.

### Start the local dev server

#### `npm run start`

Runs the app in the development mode.<br />
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br />
You will also see any lint errors in the console.

## Production Build

#### `npm run build`

Builds the app for production to the `build` folder.<br />
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br />
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### Eject from `create-react-app`

#### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

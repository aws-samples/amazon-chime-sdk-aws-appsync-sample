# Cross Talk Infrastructure

This package defines the infrastructure for the Cross Talk video chat sample using the Cloud Development Kit (CDK).

## Development

### Prerequisites

 - The [aws-cli](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html) must be installed *and* configured with an AWS account on the deployment machine (see https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html for instructions on how to do this on your preferred development platform).
 - This project requires Node.js ≥ 10.17.0 and NPM.
[Node](http://nodejs.org/) and [NPM](https://npmjs.org/) are really easy to install.
To make sure you have them available on your machine, try running the following command.
```sh
npm -v && node -v
```
 - Install or update the [AWS CDK CLI] from npm.
```sh
npm i -g aws-cdk
```

### Install

#### 1/ Bootstrapping your AWS account

You only need to do this one time per environment where you want to deploy CDK applications.
If you’re unsure whether your environment has been bootstrapped already, you can always run
the command again.

Make sure you have credentials for **ACCOUNT** (replace with your AWS account ID) in a profile
named **account-profile**. For more information, see [Named profiles](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-profiles.html).

Run the following commands in the root of the repository directory:

```sh
cd Lambdas/Common
npm install
npm run build

cd ../ChimeCallService
npm install
npm run build

cd ../../Website
npm install
npm run build

cd ../Infra
npm install
cdk bootstrap \
  --profile account-profile \
  --cloudformation-execution-policies arn:aws:iam::aws:policy/AdministratorAccess \
  aws://ACCOUNT1/ap-southeast-2
```

#### 2/ Deploying

A convenience script is provided to deploy all infrastructure to your environment. This builds
all the lambdas, the website, the infrastructure and then initiates the CDK deployment.

```
./deployStack.sh --profile <your_account_profile>
```

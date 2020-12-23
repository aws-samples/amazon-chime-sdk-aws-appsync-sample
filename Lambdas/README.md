## Lambdas

This defines code to be deployed into various lambdas defined by in the `Infra` module.

Please see the README.md in each package for details of their function.

### Development

#### Building and Testing

Each lambda package can be built using the following command:

`npm run build`

It's often useful to use a REPL to perform ad-hoc testing. You can spin up a typescript
REPL with all of the dependencies of the package available using the following command:

`npm run env -- ts-node`


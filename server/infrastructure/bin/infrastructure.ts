#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CipherDropStack } from './cdk-stack.js';

const app = new cdk.App();

const domainName = app.node.tryGetContext('domain');
const hostedZoneId = app.node.tryGetContext('hostedZoneId');

new CipherDropStack(app, 'CipherDropStack', {
  domainName,
  hostedZoneId,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
});
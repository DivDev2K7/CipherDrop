import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cert from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';

interface CipherDropStackProps extends cdk.StackProps {
  domainName?: string;
  hostedZoneId?: string;
  vpc?: ec2.IVpc;
}

export class CipherDropStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: CipherDropStackProps = {}) {
    super(scope, id, props);

    // --- VPC ---
    const vpc = props.vpc ?? new ec2.Vpc(this, 'CipherDropVpc', {
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        { name: 'public', subnetType: ec2.SubnetType.PUBLIC, cidrMask: 24 },
        { name: 'private', subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS, cidrMask: 24 },
        { name: 'db', subnetType: ec2.SubnetType.PRIVATE_ISOLATED, cidrMask: 24 },
      ],
    });

    // --- S3 Bucket for file storage ---
    const filesBucket = new s3.Bucket(this, 'FilesBucket', {
      bucketName: `cipherdrop-files-${cdk.Aws.ACCOUNT_ID}-${cdk.Aws.REGION}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      lifecycleRules: [
        {
          id: 'expire-incomplete-multipart',
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(1),
        },
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // --- CloudFront for frontend ---
    const frontendBucket = new s3.Bucket(this, 'FrontendBucket', {
      bucketName: `cipherdrop-frontend-${cdk.Aws.ACCOUNT_ID}-${cdk.Aws.REGION}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const frontendOrigin = new origins.S3BucketOrigin(frontendBucket);

    let certificate: cert.ICertificate | undefined;
    let domainName = props.domainName;

    if (domainName && props.hostedZoneId) {
      const zone = route53.HostedZone.fromHostedZoneAttributes(this, 'Zone', {
        hostedZoneId: props.hostedZoneId,
        zoneName: domainName,
      });

      certificate = new cert.DnsValidatedCertificate(this, 'Certificate', {
        domainName,
        hostedZone: zone,
        region: 'us-east-1', // ACM certs for CloudFront must be in us-east-1
      });

      domainName = `app.${domainName}`;
    }

    const distribution = new cloudfront.Distribution(this, 'FrontendDistribution', {
      defaultBehavior: {
        origin: frontendOrigin,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        compress: true,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        { httpStatus: 403, responseHttpStatus: 200, responsePagePath: '/index.html' },
        { httpStatus: 404, responseHttpStatus: 200, responsePagePath: '/index.html' },
      ],
      domainNames: domainName ? [domainName] : undefined,
      certificate: certificate,
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
    });

    // --- RDS PostgreSQL ---
    const dbSubnetGroup = new rds.SubnetGroup(this, 'DbSubnetGroup', {
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
    });

    const dbSecurityGroup = new ec2.SecurityGroup(this, 'DbSecurityGroup', {
      vpc,
      description: 'Allow ECS tasks to access RDS',
      allowAllOutbound: false,
    });

    const database = new rds.DatabaseInstance(this, 'Database', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16_6,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      subnetGroup: dbSubnetGroup,
      securityGroups: [dbSecurityGroup],
      databaseName: 'cipherdrop',
      credentials: rds.Credentials.fromGeneratedSecret('cipherdrop_admin'),
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      deletionProtection: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For dev; use RETAIN in production
      backupRetention: cdk.Duration.days(7),
    });

    // --- ElastiCache Redis ---
    const redisSubnetGroup = new elasticache.CfnSubnetGroup(this, 'RedisSubnetGroup', {
      description: 'Subnet group for Redis',
      subnetIds: vpc.selectSubnets({ subnetType: ec2.SubnetType.PRIVATE_ISOLATED }).subnetIds,
    });

    const redisSecurityGroup = new ec2.SecurityGroup(this, 'RedisSecurityGroup', {
      vpc,
      description: 'Allow ECS tasks to access Redis',
      allowAllOutbound: false,
    });

    const redisCluster = new elasticache.CfnReplicationGroup(this, 'RedisCluster', {
      replicationGroupDescription: 'CipherDrop Redis cluster',
      engine: 'redis',
      engineVersion: '7.1',
      cacheNodeType: 'cache.t3.micro',
      numNodeGroups: 1,
      replicasPerNodeGroup: 0,
      automaticFailoverEnabled: false,
      multiAzEnabled: false,
      cacheSubnetGroupName: redisSubnetGroup.ref,
      securityGroupIds: [redisSecurityGroup.securityGroupId],
      atRestEncryptionEnabled: true,
      transitEncryptionEnabled: true,
      authToken: undefined, // Set a token for production
    });

    // --- ECS Cluster ---
    const cluster = new ecs.Cluster(this, 'Cluster', { vpc });

    // CloudWatch log group
    const logGroup = new logs.LogGroup(this, 'ServiceLogGroup', {
      logGroupName: '/aws/ecs/cipherdrop',
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // --- ECS Service (Backend) ---
    const backendService = new ecsPatterns.ApplicationLoadBalancedFargateService(this, 'BackendService', {
      cluster,
      cpu: 256,
      memoryLimitMiB: 512,
      desiredCount: 1,
      taskImageOptions: {
        image: ecs.ContainerImage.fromAsset('../server', {
          file: 'Dockerfile',
        }),
        containerPort: 3001,
        logDriver: ecs.LogDrivers.awsLogs({ streamPrefix: 'backend', logGroup }),
        environment: {
          NODE_ENV: 'production',
          PORT: '3001',
          DATABASE_URL: `postgresql://${database.secret?.secretValueFromJson('username').toString()}:${database.secret?.secretValueFromJson('password').toString()}@${database.dbInstanceEndpointAddress}:5432/cipherdrop?schema=public`,
          REDIS_URL: `redis://${redisCluster.attrPrimaryEndPointAddress}:6379`,
          AWS_REGION: cdk.Aws.REGION,
          S3_BUCKET: filesBucket.bucketName,
          BASE_URL: `https://${domainName || `api.${cdk.Aws.ACCOUNT_ID}.${cdk.Aws.REGION}.elb.amazonaws.com`}`,
        },
        secrets: {
          AWS_ACCESS_KEY_ID: ecs.Secret.fromSecretsManager(
            new ssm.StringParameter(this, 'AWSAccessKey', {
              parameterName: '/cipherdrop/aws/access-key-id',
              stringValue: '', // Set via console/CLI
            })
          ),
          AWS_SECRET_ACCESS_KEY: ecs.Secret.fromSecretsManager(
            new ssm.StringParameter(this, 'AWSSecretKey', {
              parameterName: '/cipherdrop/aws/secret-access-key',
              stringValue: '',
            })
          ),
        },
      },
      publicLoadBalancer: true,
      redirectHttp: true,
      domainName: domainName ? `api.${domainName}` : undefined,
      domainZone: props.hostedZoneId
        ? route53.HostedZone.fromHostedZoneAttributes(this, 'Zone', {
            hostedZoneId: props.hostedZoneId,
            zoneName: domainName!,
          })
        : undefined,
      certificate: domainName && certificate ? certificate : undefined,
    });

    // Allow backend to access RDS
    database.connections.allowDefaultPortFrom(backendService.service.connections);

    // Allow backend to access Redis
    redisSecurityGroup.addIngressRule(
      backendService.service.connections.securityGroups[0],
      ec2.Port.tcp(6379),
      'Allow ECS tasks to access Redis'
    );

    // Allow backend to access S3
    filesBucket.grantReadWrite(backendService.taskDefinition.taskRole);

    // --- Health check ---
    backendService.targetGroup.configureHealthCheck({
      path: '/api/v1/health',
      healthyHttpCodes: '200',
      interval: cdk.Duration.seconds(30),
      timeout: cdk.Duration.seconds(10),
    });

    // --- Outputs ---
    new cdk.CfnOutput(this, 'FrontendUrl', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'Frontend URL (CloudFront)',
    });

    new cdk.CfnOutput(this, 'BackendUrl', {
      value: `https://${backendService.loadBalancer.loadBalancerDnsName}`,
      description: 'Backend API URL',
    });

    new cdk.CfnOutput(this, 'FilesBucketName', {
      value: filesBucket.bucketName,
      description: 'S3 bucket for file storage',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.dbInstanceEndpointAddress,
      description: 'RDS PostgreSQL endpoint',
    });

    new cdk.CfnOutput(this, 'RedisEndpoint', {
      value: redisCluster.attrPrimaryEndPointAddress,
      description: 'ElastiCache Redis endpoint',
    });
  }
}
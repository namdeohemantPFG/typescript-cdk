import * as cdk from "@aws-cdk/core";
import * as lambda from "@aws-cdk/aws-lambda-nodejs";
import { Runtime } from "@aws-cdk/aws-lambda";
import * as path from "path";
import * as s3 from "@aws-cdk/aws-s3";
import * as iam from '@aws-cdk/aws-iam';
import * as apig from '@aws-cdk/aws-apigatewayv2';
import * as apigi from '@aws-cdk/aws-apigatewayv2-integrations';

interface DocumentManagementAPIProps {
  documentsBucket: s3.IBucket;
}

export class DocumentManagementAPI extends cdk.Construct {

  public readonly httpApi: apig.HttpApi;

  constructor(
    scope: cdk.Construct,
    id: string,
    props: DocumentManagementAPIProps
  ) {
    super(scope, id);
    const getDocumentsFunction = new lambda.NodejsFunction(
      this,
      "GetDocumentsFunction",
      {
        runtime: Runtime.NODEJS_12_X,
        entry: path.join(__dirname, "..", "api", "getDocuments", "index.ts"),
        handler: "getDocuments",
        bundling: {         
          externalModules: ["aws-sdk"],        
          environment: {
            DOCUMENTS_BUCKET_NAME: props.documentsBucket.bucketName,
            NODE_ENV: "development",
          },
        },
      }
    );

    const bucketPermissions = new iam.PolicyStatement();
    bucketPermissions.addResources(`${props.documentsBucket.bucketArn}/*`);
    bucketPermissions.addActions('s3:GetObject', 's3:PutObject');
    getDocumentsFunction.addToRolePolicy(bucketPermissions);

    const bucketContainerPermissions = new iam.PolicyStatement();
    bucketContainerPermissions.addResources(props.documentsBucket.bucketArn);
    bucketContainerPermissions.addActions('s3:ListBucket');
    getDocumentsFunction.addToRolePolicy(bucketContainerPermissions);

    this.httpApi = new apig.HttpApi(this, 'HttpAPI', {
        apiName: 'document-management-api',
        createDefaultStage: true,
        corsPreflight: {
            allowMethods: [apig.CorsHttpMethod.GET],
            allowOrigins: ['*'],
            maxAge: cdk.Duration.days(10)
        }
    })

    const integration = new apigi.LambdaProxyIntegration({
        handler: getDocumentsFunction
      });

      this.httpApi.addRoutes({
          path: '/getDocuments',
          methods: [apig.HttpMethod.GET],
          integration: integration,
      })

      new cdk.CfnOutput(this, 'APIEndpoint', {
        value: this.httpApi.url!,
        exportName: 'APIEndpoint'
      })

  }
}

import * as cdk from '@aws-cdk/core'
import * as path from 'path'
import {DockerImageAsset} from '@aws-cdk/aws-ecr-assets'
import * as ec2 from '@aws-cdk/aws-ec2'
import * as ecsp from '@aws-cdk/aws-ecs-patterns'
import * as ecs from '@aws-cdk/aws-ecs'
import * as apig from '@aws-cdk/aws-apigatewayv2'
import { BundlingOutput, BundlingDockerImage, CfnOutput } from '@aws-cdk/core'

interface DocumentManagementWebserverProps {
    vpc: ec2.IVpc
    api: apig.HttpApi
}

export class DocumentManagementWebserver extends cdk.Construct {
    constructor(scope: cdk.Construct, id: string, props: DocumentManagementWebserverProps) {
        super(scope, id);

        const webserverDocker = new DockerImageAsset(this, 'webserverDockerAsset', {
            directory: path.join(__dirname, '..', 'containers', 'webserver')
        })

        const fargateService = new ecsp.ApplicationLoadBalancedFargateService(this, 'WebserverService', {
            vpc: props.vpc,
            taskImageOptions: {
                image: ecs.ContainerImage.fromDockerImageAsset(webserverDocker),
                environment: {
                    SERVER_PORT: "8080",
                    API_BASE: props.api.url!,
                },
                containerPort: 8080         
            }
                      
        })

        new CfnOutput(this, 'WebserverHost', {
            exportName: 'WebserverHost',
            value: fargateService.loadBalancer.loadBalancerDnsName
        });
    }
}
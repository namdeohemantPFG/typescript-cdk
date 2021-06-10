import * as cdk from "@aws-cdk/core";
import * as ec2 from "@aws-cdk/aws-ec2";

interface Networkingprops {
  maxAzs: number;
}

export class Networking extends cdk.Construct {
  public readonly vpc: ec2.IVpc;

  constructor(scope: cdk.Construct, id: string, props: Networkingprops) {
    super(scope, id);

    this.vpc = new ec2.Vpc(this, "AppVPC", {
      cidr: '10.0.0.0/16',
      maxAzs: props.maxAzs,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: "Public",
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: "Private",
          subnetType: ec2.SubnetType.PRIVATE,
        },
      ],
    });
  }
}

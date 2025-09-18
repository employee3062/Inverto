import {
  LambdaClient,
  GetAliasCommand,
  UpdateFunctionCodeCommand,
  PublishVersionCommand,
  UpdateAliasCommand,
  GetFunctionCommand,
} from "@aws-sdk/client-lambda";
import { readFile } from "fs/promises";

const lambda = new LambdaClient({ region: "ca-central-1" });

async function blueGreenDeploy({
  functionName,
  greenAlias = "Green",
  blueTraffic = 0.9,
  deploymentPackagePath = "./dist/handler.zip",
}: {
  functionName: string;
  greenAlias?: string;
  blueTraffic?: number;
  deploymentPackagePath?: string;
}) {
  // 1. Get the current alias ("blue" version)
  const greenAliasData = await lambda.send(
    new GetAliasCommand({
      FunctionName: functionName,
      Name: greenAlias,
    })
  );
  const blueVersion = greenAliasData.FunctionVersion!;
  console.log(`Current blue version: ${blueVersion}`);

  // if bluewVersion is not an integer, throw error
  if (!/^\d+$/.test(blueVersion)) {
    throw new Error(
      `Current blue version (${blueVersion}) is not a valid version number`
    );
  }

  // 2. Upload new code to $LATEST
  const zipBuffer = await readFile(deploymentPackagePath);
  await lambda.send(
    new UpdateFunctionCodeCommand({
      FunctionName: functionName,
      ZipFile: zipBuffer,
      Publish: false,
    })
  );

  // 3. Wait until function code update is finished
  let updateStatus = "";
  do {
    const fn = await lambda.send(
      new GetFunctionCommand({ FunctionName: functionName })
    );
    updateStatus = fn.Configuration?.LastUpdateStatus || "";
    if (updateStatus === "InProgress") {
      await new Promise((res) => setTimeout(res, 2000));
    } else if (updateStatus === "Failed") {
      throw new Error("Lambda update failed!");
    }
  } while (updateStatus !== "Successful");

  // 4. Publish a new version (new "green" version)
  const publishResp = await lambda.send(
    new PublishVersionCommand({ FunctionName: functionName })
  );
  const newVersion = publishResp.Version!;

  // 5. Update alias with traffic shifting
  await lambda.send(
    new UpdateAliasCommand({
      FunctionName: functionName,
      Name: greenAlias,
      FunctionVersion: newVersion,
      RoutingConfig: {
        AdditionalVersionWeights: { [blueVersion]: blueTraffic },
      },
    })
  );

  console.log(
    `Deployed new version ${newVersion} with ${blueTraffic * 100}% to blue (${blueVersion})`
  );
}

// Usage:
blueGreenDeploy({
  functionName: "inverto-lambda-function",
  greenAlias: "Green",
  blueTraffic: 0.3,
  deploymentPackagePath: "./dist/handler.zip",
});

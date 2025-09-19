import {
  LambdaClient,
  GetAliasCommand,
  UpdateFunctionCodeCommand,
  PublishVersionCommand,
  UpdateAliasCommand,
  GetFunctionCommand,
} from "@aws-sdk/client-lambda";
import { readFile } from "fs/promises";
import { getSortedBlueGreenVersions, functionName } from "./lib";

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
  // 1. Get the current alias info
  const aliasData = await lambda.send(
    new GetAliasCommand({
      FunctionName: functionName,
      Name: greenAlias,
    })
  );

  // 2. Determine blue and green versions using lib.ts
  const blueGreen = getSortedBlueGreenVersions(aliasData);

  // If only one version exists, it's the blue version (old),
  // and new green version will be the newly published one.
  let blueVersion: number;
  if (!blueGreen) {
    blueVersion = Number(aliasData.FunctionVersion);
  } else {
    const [_, green] = blueGreen;
    blueVersion = green.version; // previous green becomes blue
  }

  // 3. Upload new code to $LATEST
  const zipBuffer = await readFile(deploymentPackagePath);
  await lambda.send(
    new UpdateFunctionCodeCommand({
      FunctionName: functionName,
      ZipFile: zipBuffer,
      Publish: false,
    })
  );

  // 4. Wait until function code update finishes
  let updateStatus = "";
  do {
    const fn = await lambda.send(new GetFunctionCommand({ FunctionName: functionName }));
    updateStatus = fn.Configuration?.LastUpdateStatus || "";
    if (updateStatus === "InProgress") {
      await new Promise((res) => setTimeout(res, 2000));
    } else if (updateStatus === "Failed") {
      throw new Error("Lambda update failed!");
    }
  } while (updateStatus !== "Successful");

  // 5. Publish new version (new green version)
  const publishResp = await lambda.send(new PublishVersionCommand({ FunctionName: functionName }));
  const newVersion = Number(publishResp.Version);

  // 6. Update alias to point to new green version
  blueTraffic = Math.round(blueTraffic * 10) / 10;
  await lambda.send(
    new UpdateAliasCommand({
      FunctionName: functionName,
      Name: greenAlias,
      FunctionVersion: newVersion.toString(),
      RoutingConfig: {
        AdditionalVersionWeights: {
          [blueVersion.toString()]: blueTraffic
        }
      }
    })
  );
  console.log(
    `New deployment version ${newVersion} as green. Blue version ${blueVersion} now has ${blueTraffic * 100}% traffic.`
  );
}

// Example usage:
blueGreenDeploy({
  functionName,
  greenAlias: "Green",
  blueTraffic: 0.3,
  deploymentPackagePath: "./dist/handler.zip",
});

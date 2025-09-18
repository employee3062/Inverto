import {
  LambdaClient,
  GetAliasCommand,
  UpdateAliasCommand,
} from "@aws-sdk/client-lambda";

import { getSortedBlueGreenVersions } from "./lib";

const lambda = new LambdaClient({ region: "ca-central-1" });

async function scheduler({
  functionName,
  greenAlias = "Green",
}: {
  functionName: string;
  greenAlias?: string;
}) {
  const aliasData = await lambda.send(
    new GetAliasCommand({
      FunctionName: functionName,
      Name: greenAlias,
    })
  );

  const blueGreen = getSortedBlueGreenVersions(aliasData);

  if (!blueGreen) {
    console.log("Expected exactly two versions for green and blue but found otherwise. Exiting.");
    return;
  }

  const [blue, green] = blueGreen;

  if (blue.traffic <= 0) {
    console.log(`Blue version ${blue.version} traffic is 0 or less; no shift needed.`);
    return;
  }

  // Shift traffic 10% from blue to green
  let newBlueTraffic = blue.traffic - 0.1 > 0 ? blue.traffic - 0.1 : 0;
  newBlueTraffic = Math.round(newBlueTraffic * 10) / 10;

  let newGreenTraffic = 1 - newBlueTraffic;
  newGreenTraffic = Math.round(newGreenTraffic * 10) / 10;

  await lambda.send(
    new UpdateAliasCommand({
      FunctionName: functionName,
      Name: greenAlias,
      FunctionVersion: green.version.toString(),
      RoutingConfig: {
        AdditionalVersionWeights: {
          [blue.version.toString()]: newBlueTraffic,
        },
      },
    })
  );

  console.log(
    `Traffic shifted: green version ${green.version} now ${newGreenTraffic * 100}%, blue version ${blue.version} now ${newBlueTraffic * 100}%`
  );
}

// Example usage:
scheduler({
  functionName: "inverto-lambda-function",
});

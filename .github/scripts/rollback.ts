import {
  LambdaClient,
  GetAliasCommand,
  UpdateAliasCommand,
} from "@aws-sdk/client-lambda";

import { getSortedBlueGreenVersions, functionName} from "./lib";

const lambda = new LambdaClient({ region: "ca-central-1" });

async function rollback({
  functionName,
  greenAlias = "Green",
}: {
  functionName: string;
  greenAlias?: string;
}) {
  // 1. Get current green alias info to find versions
  const aliasData = await lambda.send(
    new GetAliasCommand({
      FunctionName: functionName,
      Name: greenAlias,
    })
  );

  const blueGreen = getSortedBlueGreenVersions(aliasData);

  if (!blueGreen) {
    console.log("Expected exactly two versions for green and blue but found otherwise. Exiting rollback.");
    return;
  }

  const [blue, green] = blueGreen;

  // Rollback: send 100% traffic to blue, 0% to green
  // Keep both pointers in alias config
  await lambda.send(
    new UpdateAliasCommand({
      FunctionName: functionName,
      Name: greenAlias,
      FunctionVersion: blue.version.toString(), // alias primary points to blue version
      RoutingConfig: {
        AdditionalVersionWeights: {
          [green.version.toString()]: 0,
        },
      },
    })
  );

  console.log(
    `Rollback complete: traffic shifted 100% to blue version ${blue.version}, 0% to green version ${green.version}`
  );
}

// Example usage:
rollback({
  functionName
});

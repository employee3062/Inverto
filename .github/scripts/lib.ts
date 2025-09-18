// lib.ts
export interface VersionTraffic {
  version: number;
  traffic: number; 
}

import { GetAliasCommandOutput } from "@aws-sdk/client-lambda";

export function getSortedBlueGreenVersions(
  aliasData: GetAliasCommandOutput
): VersionTraffic[] | null {

  // Validate alias data
  const primaryVersionStr = aliasData.FunctionVersion;
  if (!primaryVersionStr) return null;
  const additionalWeights = aliasData.RoutingConfig?.AdditionalVersionWeights || {};
  const allVersionsStr = [primaryVersionStr, ...Object.keys(additionalWeights)];
  if (allVersionsStr.length !== 2) {
    return null;
  }

  // Helper to parse traffic for a version
  function getTraffic(versionStr: string): number {
    if (versionStr === primaryVersionStr) {
      const sumAdditional = Object.values(additionalWeights).reduce(
        (acc, w) => acc + w,
        0
      );
      return Math.round((1 - sumAdditional) * 10) / 10;
    }
    return Math.round((additionalWeights[versionStr] ?? 0) * 10) / 10;
  }

  // Map to objects with numeric versions and traffic
  const versionTraffics: VersionTraffic[] = allVersionsStr.map((vstr) => ({
    version: Number(vstr),
    traffic: getTraffic(vstr),
  }));

  // Sort ascending by numeric version (blue = smaller)
  versionTraffics.sort((a, b) => a.version - b.version);

  return versionTraffics;
}

import { test, expect, describe, mock } from "bun:test";
import { CognitoIdentityProviderClient, InitiateAuthCommand } from "@aws-sdk/client-cognito-identity-provider";
import { handleTrial, CredentialsDTO } from "../classes/auth"; 

const dummyCommand = new InitiateAuthCommand({
  AuthFlow: "USER_PASSWORD_AUTH",
  ClientId: "dummy-pool-id",
  AuthParameters: { USERNAME: "test", PASSWORD: "test" }
});

const happyResponse = {
  AuthenticationResult: {
    AccessToken: "access-token",
    IdToken: "id-token",
    RefreshToken: "refresh-token",
    ExpiresIn: 3600,
    TokenType: "Bearer"
  }
};

const testCases = [
  {
    name: "Success case",
    mockReturn: () => Promise.resolve(happyResponse),
    expectResult: {
      accessToken: happyResponse.AuthenticationResult.AccessToken,
      idToken: happyResponse.AuthenticationResult.IdToken,
      refreshToken: happyResponse.AuthenticationResult.RefreshToken,
      expiresIn: happyResponse.AuthenticationResult.ExpiresIn,
      tokenType: "Bearer"
    } as CredentialsDTO
  },
  {
    name: "UserNotFoundException error",
    mockReturn: () => Promise.reject(Object.assign(new Error("err msg"), { name: "UserNotFoundException" })),
    expectError: "User does not exist"
  },
  {
    name: "UserNotConfirmedException error",
    mockReturn: () => Promise.reject(Object.assign(new Error("err msg"), { name: "UserNotConfirmedException" })),
    expectError: "User not confirmed"
  },
  {
    name: "NotAuthorizedException error",
    mockReturn: () => Promise.reject(Object.assign(new Error("err msg"), { name: "NotAuthorizedException" })),
    expectError: "Incorrect username or password"
  },
  {
    name: "Other exception error",
    mockReturn: () => Promise.reject(Object.assign(new Error("err msg"), { name: "SomeOtherException" })),
    expectError: "Authentication failed"
  },
  {
    name: "No AuthenticationResult in response",
    mockReturn: () => Promise.resolve({}),
    expectError: "Authentication failed"
  },
  {
    name: "Missing tokens in AuthenticationResult",
    mockReturn: () => Promise.resolve({ AuthenticationResult: {} }),
    expectError: "Authentication failed"
  }
];

describe("handleTrial function tests", () => {
  testCases.forEach(({ name, mockReturn, expectResult, expectError }) => {
    test(`${name}`, async () => {
      const client = new CognitoIdentityProviderClient({ region: "ca-central-1" });
      client.send = mock(() => mockReturn());
      try {
        const resp = await handleTrial(dummyCommand, client);
        if (expectResult) {
          expect(resp).toEqual(expectResult);
        } else {
          throw new Error("Expected a successful response but got an error.");
        }
      } catch (e: any) {
        expect(e.message).toBe(expectError);
      }
    });
  });
});
